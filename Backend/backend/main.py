import asyncio
import uuid
import json
import time
from fastapi import FastAPI, WebSocket, BackgroundTasks
import redis.asyncio as redis
from databases import Database
from config import DATABASE_URL, REDIS_URL, MQTT_BROKER, MQTT_PORT
import paho.mqtt.client as mqtt

app = FastAPI()
db = Database(DATABASE_URL)
r = redis.Redis.from_url(REDIS_URL, decode_responses=True)

# MQTT setup
mqtt_client = mqtt.Client()
mqtt_client.connect(MQTT_BROKER, int(MQTT_PORT), 60)
mqtt_client.loop_start()

# Load Lua script for claim
with open("claim_request.lua") as f:
    claim_script = f.read()
claim_sha = None

connections = {}  # WebSocket connections

# -----------------------
# Startup & Shutdown
# -----------------------
@app.on_event("startup")
async def startup():
    await db.connect()
    global claim_sha
    claim_sha = await r.script_load(claim_script)

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()
    mqtt_client.loop_stop()

# -----------------------
# WebSocket
# -----------------------
@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    connections[user_id] = websocket
    try:
        while True:
            msg = await websocket.receive_text()
            await websocket.send_text(f"Echo: {msg}")
    except Exception as e:
        print(f"Disconnected {user_id}: {e}")
    finally:
        connections.pop(user_id, None)

async def notify_ws(user_id, message: dict):
    ws = connections.get(user_id)
    if ws:
        await ws.send_text(json.dumps(message))

def mqtt_publish(topic, payload):
    mqtt_client.publish(topic, json.dumps(payload))

# -----------------------
# Driver location update
# -----------------------
@app.post("/driver/update_location")
async def update_location(driver_id: str, lat: float, lon: float):
    # await r.geoadd("drivers_geo", lon, lat, driver_id)
    await r.execute_command("GEOADD", "drivers_geo", lon, lat, driver_id)
    await r.hset(f"driver:{driver_id}", "online", 1)
    return {"status": "ok"}

# -----------------------
# Ride request
# -----------------------
@app.post("/request")
async def create_request(rider_id: str, lat: float, lon: float, background_tasks: BackgroundTasks):
    ride_id = str(uuid.uuid4())

    # Find nearest drivers
    nearest = await r.execute_command(
        "GEOSEARCH", "drivers_geo",
        "FROMLONLAT", lon, lat,
        "BYRADIUS", 10000, "m",
        "ASC",
        "COUNT", 5,
        "WITHDIST"
    )
    drivers = [d[0] for d in nearest]

    # Filter busy drivers
    available_drivers = []
    open_rides = await r.keys("request:*")
    for driver in drivers:
        busy = False
        for req in open_rides:
            s = await r.hget(req, "status")
            drivers_list = json.loads(await r.hget(req, "drivers"))
            if s in ("OPEN","ASSIGNED") and driver in drivers_list:
                busy = True
                break
        if not busy:
            available_drivers.append(driver)

    # Store request in Redis
    await r.hset(f"request:{ride_id}", mapping={
        "rider_id": rider_id,
        "status": "OPEN",
        "drivers": json.dumps(available_drivers),
        "created_at": str(time.time())
    })

    # Notify drivers via Redis, MQTT, WebSocket
    for driver in available_drivers:
        payload = {"type":"RIDE_OFFER","ride_id":ride_id,"lat":lat,"lon":lon}
        await r.publish(f"driver_channel:{driver}", json.dumps(payload))
        mqtt_publish(f"driver/{driver}/ride_offer", payload)
        await notify_ws(driver, payload)

    # Handle ride expiration
    background_tasks.add_task(handle_timeout, ride_id, 60)

    return {"ride_id": ride_id, "drivers": drivers, "available_drivers": available_drivers}

# -----------------------
# Ride accept
# -----------------------
@app.post("/accept")
async def accept_ride(driver_id: str, ride_id: str):
    result = await r.evalsha(claim_sha, 1, f"request:{ride_id}", driver_id)
    if result == 0:
        return {"status": "failed", "reason": "already assigned or expired"}

    drivers_json = await r.hget(f"request:{ride_id}", "drivers")
    drivers = json.loads(drivers_json)

    # Notify other drivers
    for d in drivers:
        if d != driver_id:
            payload = {"type":"REQUEST_FILLED","ride_id":ride_id}
            await r.publish(f"driver_channel:{d}", json.dumps(payload))
            mqtt_publish(f"driver/{d}/ride_filled", payload)
            await notify_ws(d, payload)

    # Save assignment in DB & update request status
    rider_id = await r.hget(f"request:{ride_id}", "rider_id")
    await db.execute(
        "INSERT INTO rides(id,rider_id,assigned_driver_id,status,pickup_lat,pickup_lon) VALUES(:id,:rider,:driver,'ASSIGNED',0,0)",
        values={"id":ride_id,"rider":rider_id,"driver":driver_id}
    )
    await r.hset(f"request:{ride_id}", "status", "ASSIGNED")
    await r.hset(f"request:{ride_id}", "assigned_driver", driver_id)

    return {"status":"ok","ride_id":ride_id}

# -----------------------
# Driver cancel
# -----------------------
@app.post("/driver_cancel")
async def driver_cancel(driver_id: str, ride_id: str):
    status = await r.hget(f"request:{ride_id}", "status")
    assigned = await r.hget(f"request:{ride_id}", "assigned_driver")
    if status != "ASSIGNED" or assigned != driver_id:
        return {"status":"failed","reason":"not assigned"}

    # Re-offer to remaining drivers
    await r.hset(f"request:{ride_id}", "status", "OPEN")
    await r.hdel(f"request:{ride_id}", "assigned_driver")

    drivers_json = await r.hget(f"request:{ride_id}", "drivers")
    drivers = json.loads(drivers_json)
    drivers.remove(driver_id)
    await r.hset(f"request:{ride_id}", "drivers", json.dumps(drivers))

    for d in drivers:
        if d != driver_id:
            payload = {"type":"RIDE_REOFFER","ride_id":ride_id}
            await r.publish(f"driver_channel:{d}", json.dumps(payload))
            mqtt_publish(f"driver/{d}/ride_reoffer", payload)
            await notify_ws(d, payload)

    return {"status":"ok"}

# -----------------------
# Ride timeout
# -----------------------
async def handle_timeout(ride_id, timeout_sec):
    await asyncio.sleep(timeout_sec)
    status = await r.hget(f"request:{ride_id}", "status")
    if status == "OPEN":
        await r.hset(f"request:{ride_id}", "status", "EXPIRED")
        drivers_json = await r.hget(f"request:{ride_id}", "drivers")
        drivers = json.loads(drivers_json)
        for d in drivers:
            payload = {"type":"EXPIRED","ride_id":ride_id}
            await r.publish(f"driver_channel:{d}", json.dumps(payload))
            mqtt_publish(f"driver/{d}/ride_expired", payload)
            await notify_ws(d, payload)

# -----------------------
# Ride complete
# -----------------------
@app.post("/ride_complete")
async def ride_complete(ride_id: str):
    ride = await db.fetch_one("SELECT * FROM rides WHERE id=:id", values={"id": ride_id})
    if not ride:
        return {"status":"failed","reason":"ride not found"}

    await r.hset(f"request:{ride_id}", "status", "COMPLETED")

    await db.execute(
        "UPDATE rides SET status='COMPLETED', updated_at=NOW() WHERE id=:id",
        values={"id":ride_id}
    )
    await db.execute(
        "INSERT INTO points_history(puller_id, ride_id, points) VALUES(:puller,:ride_id,10)",
        values={"puller":ride["assigned_driver_id"],"ride_id":ride_id}
    )

    return {"status":"ok"}

# -----------------------
# Admin endpoints
# -----------------------
@app.get("/admin/rides")
async def list_rides():
    return await db.fetch_all("SELECT * FROM rides ORDER BY created_at DESC")

@app.get("/admin/leaderboard")
async def leaderboard():
    return await db.fetch_all("""
        SELECT puller_id, SUM(points) as total_points
        FROM points_history
        GROUP BY puller_id
        ORDER BY total_points DESC
    """)

@app.post("/admin/adjust_points")
async def adjust_points(puller_id: str, ride_id: str, points: int):
    await db.execute(
        "INSERT INTO points_history(puller_id,ride_id,points) VALUES(:puller_id,:ride_id,:points)",
        values={"puller_id": puller_id, "ride_id": ride_id, "points": points}
    )
    return {"status":"ok"}
