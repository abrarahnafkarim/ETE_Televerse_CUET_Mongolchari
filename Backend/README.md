# 🚖 Accessible E-Rickshaw Automation Backend

A real-time ride-sharing backend system with driver-rider matching, location tracking, ride assignments, notifications, and points/leaderboard management. Built with FastAPI, Redis, PostgreSQL, MQTT, and WebSockets.

This backend simulates a mini Uber/Lyft/Pathao system and is fully containerized with Docker for easy setup and deployment.

## 📌 Table of Contents

Project Overview

Tech Stack

System Architecture

Database Schema

Redis Schema

File Structure

Setup Instructions

API Documentation

WebSocket & MQTT Channels

Testing Instructions

Future Features

Extras

## 🚀 Project Overview

### Purpose:
Handle real-time ride requests from riders, assign nearest available drivers, and notify them instantly via multiple channels.

### Core Features:

Create rides and assign drivers based on proximity.

Re-offer rides if a driver cancels.

Automatically expire unaccepted rides.

Track driver locations in real-time.

Points and leaderboard system for gamified incentives.

Admin endpoints for ride monitoring and leaderboard.

Real-time updates via WebSockets, Redis Pub/Sub, and MQTT.

## 🧰 Tech Stack
| Component             | Purpose                                      |
|----------------------|---------------------------------------------|
| FastAPI               | REST API and WebSocket backend              |
| PostgreSQL            | Persistent ride & user data                 |
| Redis                 | Real-time state management, Geo queries, Pub/Sub |
| MQTT (paho-mqtt)      | IoT-style driver notifications              |
| Lua                   | Atomic Redis operations (ride claiming)    |
| Docker & Docker Compose | Environment containerization              |
| Python Packages       | databases, redis, paho-mqtt, uvicorn       |

## 🏗️ System Architecture
```
                 Rider/Driver Apps
                        |
        +---------------+---------------+
        |             FastAPI            |
        | (API, WebSocket, BackgroundTasks) |
        +---------------+---------------+
                        |
          +-------------+-------------+
          |             |             |
      PostgreSQL       Redis         MQTT Broker
      (rides, users,   (drivers_geo, (driver/<id>/ride_offer)
       points_history)   requests)
```

### Flow Example:

Rider sends /request → backend stores ride in Redis.

Backend finds nearest drivers using GEOSEARCH on drivers_geo.

Backend notifies drivers via Redis Pub/Sub, MQTT, and WebSockets.

First driver to accept via /accept gets assigned.

Ride status updated in Redis & PostgreSQL.

## 🧱 Database Schema
### 🧾 PostgreSQL Schema

#### users
| Column      | Type      | Description        |
|------------|-----------|------------------|
| id         | uuid      | PK                 |
| name       | text      | Rider name         |
| phone      | text      | Contact number     |
| created_at | timestamp | Record creation    |

#### drivers
| Column      | Type      | Description        |
|------------|-----------|------------------|
| id         | uuid      | PK                 |
| name       | text      | Driver name        |
| phone      | text      | Contact number     |
| created_at | timestamp | Record creation    |

#### rides
| Column              | Type             | Description                      |
|--------------------|-----------------|---------------------------------|
| id                 | uuid             | PK                               |
| rider_id           | uuid             | FK to users                      |
| assigned_driver_id | uuid             | FK to drivers                    |
| status             | text             | OPEN / ASSIGNED / COMPLETED      |
| pickup_lat         | double precision | Pickup latitude                  |
| pickup_lon         | double precision | Pickup longitude                 |
| drop_lat           | double precision | Drop latitude (optional)         |
| drop_lon           | double precision | Drop longitude (optional)        |
| created_at         | timestamp        | Record creation                  |
| updated_at         | timestamp        | Last update                       |

#### ride_drivers
| Column    | Type    | Description            |
|-----------|--------|-----------------------|
| ride_id   | uuid    | FK to rides           |
| driver_id | uuid    | FK to drivers         |
| accepted  | boolean | Did driver accept ride? |

#### points_history
| Column      | Type    | Description        |
|------------|---------|------------------|
| id         | serial  | PK                 |
| puller_id  | uuid    | Driver ID          |
| ride_id    | uuid    | Ride ID            |
| points     | integer | Points earned      |
| created_at | timestamp | Record creation   |

### 🧠 Redis Schema

| Key Pattern            | Type    | Purpose                                         |
|------------------------|--------|-----------------------------------------------|
| drivers_geo            | GEO    | Stores driver locations for nearest search    |
| request:{ride_id}      | HASH   | Stores ride info: rider_id, status, drivers, assigned_driver, created_at |
| driver_channel:{id}    | PUB/SUB| Channels to send ride offers / updates       |
| connections            | DICT   | WebSocket active connections                  |

### Notes:

Geo commands (GEOADD, GEOSEARCH) used for driver proximity.

Redis hash + Lua script ensures atomic claim of rides.

## 📂 File Structure
```
accessible-e-rickshaw-automation-backend/
│
├─backend/
  ├─ main.py                  # Core FastAPI app with all endpoints
  ├─ config.py                # DB/Redis/MQTT config constants
  ├─ claim_request.lua        # Lua script to atomically claim a ride
  ├─ requirements.txt         # Python dependencies
  ├─ Dockerfile               # Backend container
├─ docker-compose.yml   # Orchestrates backend, PostgreSQL, Redis, MQTT
├─mqtt
  ├─mosquitto.config
├─ README.md
```
## ⚙️ Setup Instructions

### Required Software:

Docker >= 23.x

Docker Compose >= 2.x

Python >= 3.11

### Steps:

#### Clone Repo

```git clone <repo-url>
cd accessible-e-rickshaw-automation-backend
```

#### Modify config.py
```
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/erider")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
MQTT_BROKER = os.getenv("MQTT_BROKER", "mqtt")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
```

### Run Docker Compose

```docker compose up --build```


This starts backend, PostgreSQL, Redis, MQTT broker.

### Apply Database Schema
Connect to PostgreSQL container:

```docker exec -it <db-container> psql -U postgres```


Create tables as per schema above.

## 📝 API Documentation
### Driver Location Update

``` POST /driver/update_location
Parameters: driver_id, lat, lon
Response: { "status": "ok" }
```

### Ride Request

```POST /request
Parameters: rider_id, lat, lon
Response:

{
  "ride_id": "...",
  "drivers": ["driver1", "driver2"],
  "available_drivers": ["driver1"]
}
```

### Accept Ride

```POST /accept
Parameters: driver_id, ride_id
Response:

{ "status": "ok", "ride_id": "..." }

```
Notes: Uses Lua script for atomic claim.

### Driver Cancel

```POST /driver_cancel
Parameters: driver_id, ride_id
Response: { "status": "ok" }
```
Reoffers ride to remaining drivers.

### Complete Ride

```POST /ride_complete
Parameters: ride_id
Response: { "status": "ok" }
```
### Admin — List Rides

```GET /admin/rides```
Returns all rides.

### Admin — Leaderboard

```GET /admin/leaderboard```
Returns driver points.

### Admin — Adjust Points

```POST /admin/adjust_points
Parameters: puller_id, ride_id, points
```
### 📡 WebSocket & MQTT Channels

```WebSocket: /ws/{driver_id}```

Receive real-time ride offers, updates.

### MQTT Topics:

#### Topic	Description
``` driver/<id>/ride_offer	New ride offers
driver/<id>/ride_filled	Ride accepted by another driver
driver/<id>/ride_reoffer	Re-offered ride after cancel
driver/<id>/ride_expired	Ride expired notification
```
## 🧪 Testing Instructions

### Start containers: docker compose up --build

### Subscribe to Redis & MQTT channels

### Connect WebSocket for drivers

### Create sample users/drivers in PostgreSQL

### Test /request, /accept, /driver_cancel, /ride_complete using Postman or curl

### Check admin endpoints for rides and leaderboard

### Observe real-time messages in WebSocket / MQTT / Redis subscriber terminals

## 💡 Future Features

Support dynamic pickup/drop locations.

Push notifications (Firebase) for mobile apps.

Enhanced driver matching (time to pickup, driver rating).

Multi-city and load balancing support.

Authentication and role-based access control.

## 🧩 Extras

Lua script: claim_request.lua ensures atomic first-come-first-serve ride acceptance.

Redis drivers_geo key stores all driver coordinates for nearest-driver queries.

Docker Compose handles full environment setup
