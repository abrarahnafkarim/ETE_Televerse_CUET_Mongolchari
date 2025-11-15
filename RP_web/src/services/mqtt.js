import mqtt from 'mqtt'
import { config } from '../config'
import storage from './storage'

/**
 * MQTT Service for real-time communication
 */
class MqttService {
  constructor() {
    this.client = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 10
    this.subscriptions = new Map()
    this.messageHandlers = new Map()
  }

  connect(driverId) {
    if (this.client && this.isConnected) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      try {
        const clientId = `driver_${driverId}_${Date.now()}`
        
        this.client = mqtt.connect(config.mqtt.broker, {
          ...config.mqtt.options,
          clientId,
          username: config.mqtt.username || driverId,
          password: config.mqtt.password,
          will: {
            topic: config.mqtt.topics.status(driverId),
            payload: JSON.stringify({
              driver_id: driverId,
              status: 'offline',
              timestamp: new Date().toISOString(),
            }),
            qos: 1,
            retain: false,
          },
        })

        this.client.on('connect', () => {
          console.log('MQTT Connected')
          this.isConnected = true
          this.reconnectAttempts = 0
          this.subscribeAll(driverId)
          resolve()
        })

        this.client.on('message', (topic, message) => {
          try {
            const data = JSON.parse(message.toString())
            this.handleMessage(topic, data)
          } catch (error) {
            console.error('MQTT message parse error:', error)
          }
        })

        this.client.on('error', (error) => {
          console.error('MQTT error:', error)
          this.isConnected = false
          reject(error)
        })

        this.client.on('close', () => {
          console.log('MQTT connection closed')
          this.isConnected = false
        })

        this.client.on('offline', () => {
          console.log('MQTT offline')
          this.isConnected = false
        })

        this.client.on('reconnect', () => {
          this.reconnectAttempts++
          if (this.reconnectAttempts > this.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached')
            this.client.end()
          }
        })
      } catch (error) {
        console.error('MQTT connect error:', error)
        reject(error)
      }
    })
  }

  subscribeAll(driverId) {
    const topics = [
      config.mqtt.topics.offer(driverId),
      config.mqtt.topics.status(driverId),
      config.mqtt.topics.rideUpdate(driverId),
      config.mqtt.topics.systemStatus(driverId),
    ]

    topics.forEach((topic) => {
      if (!this.subscriptions.has(topic)) {
        this.subscribe(topic)
      }
    })
  }

  subscribe(topic) {
    if (!this.client || !this.isConnected) {
      console.warn('MQTT not connected, cannot subscribe to:', topic)
      return
    }

    this.client.subscribe(topic, { qos: 1 }, (error) => {
      if (error) {
        console.error('MQTT subscribe error:', error)
      } else {
        console.log('Subscribed to:', topic)
        this.subscriptions.set(topic, true)
      }
    })
  }

  unsubscribe(topic) {
    if (!this.client || !this.isConnected) return

    this.client.unsubscribe(topic, (error) => {
      if (error) {
        console.error('MQTT unsubscribe error:', error)
      } else {
        this.subscriptions.delete(topic)
      }
    })
  }

  publish(topic, payload, options = {}) {
    if (!this.client || !this.isConnected) {
      console.warn('MQTT not connected, queueing message:', topic)
      storage.addToOfflineQueue({ type: 'mqtt_publish', topic, payload, options })
      return false
    }

    const message = JSON.stringify(payload)
    this.client.publish(topic, message, { qos: 1, ...options }, (error) => {
      if (error) {
        console.error('MQTT publish error:', error)
        storage.addToOfflineQueue({ type: 'mqtt_publish', topic, payload, options })
      }
    })

    return true
  }

  onMessage(topic, handler) {
    if (!this.messageHandlers.has(topic)) {
      this.messageHandlers.set(topic, [])
    }
    this.messageHandlers.get(topic).push(handler)
  }

  offMessage(topic, handler) {
    const handlers = this.messageHandlers.get(topic)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  handleMessage(topic, data) {
    const handlers = this.messageHandlers.get(topic) || []
    handlers.forEach((handler) => {
      try {
        handler(data)
      } catch (error) {
        console.error('Message handler error:', error)
      }
    })
  }

  disconnect() {
    if (this.client) {
      this.client.end()
      this.client = null
      this.isConnected = false
      this.subscriptions.clear()
      this.messageHandlers.clear()
    }
  }

  // Process offline queue when reconnected
  async processOfflineQueue() {
    const queue = storage.getOfflineQueue()
    if (queue.length === 0) return

    const mqttMessages = queue.filter((item) => item.type === 'mqtt_publish')
    
    for (const item of mqttMessages) {
      if (this.isConnected) {
        this.publish(item.topic, item.payload, item.options)
      }
    }

    // Remove processed MQTT messages
    const remainingQueue = queue.filter((item) => item.type !== 'mqtt_publish')
    storage.set('rp_offline_queue', remainingQueue)
  }
}

export default new MqttService()

