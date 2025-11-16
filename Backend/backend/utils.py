import json
import paho.mqtt.publish as mqtt_publish
from config import MQTT_BROKER, MQTT_PORT

def mqtt_publish_single(topic, message):
    mqtt_publish.single(topic, json.dumps(message), hostname=MQTT_BROKER, port=MQTT_PORT)
