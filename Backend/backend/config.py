import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@db:5432/erider")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
MQTT_BROKER = os.getenv("MQTT_BROKER", "mqtt")
MQTT_PORT = int(os.getenv("MQTT_PORT", 1883))
