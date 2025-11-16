# AERAS MQTT Broker & API Protocol Specification

Complete operational playbook for the AERAS MQTT messaging infrastructure.

## 📋 Contents

- **[MQTT_SPECIFICATION.md](MQTT_SPECIFICATION.md)** - Complete specification document
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Step-by-step deployment guide
- **[SECURITY_CHECKLIST.md](SECURITY_CHECKLIST.md)** - Pre-production security audit checklist

## 🚀 Quick Start

1. **Generate TLS certificates:**
   ```bash
   # See DEPLOYMENT.md for detailed instructions
   ```

2. **Deploy broker:**
   ```bash
   # EMQX (recommended)
   docker-compose -f docker-compose.emqx.yml up -d
   
   # OR Mosquitto (lightweight)
   docker-compose -f docker-compose.mosquitto.yml up -d
   ```

3. **Create users and configure ACL:**
   ```bash
   # See DEPLOYMENT.md
   ```

## 📁 Directory Structure

```
.
├── MQTT_SPECIFICATION.md      # Main specification document
├── DEPLOYMENT.md              # Deployment instructions
├── SECURITY_CHECKLIST.md      # Security audit checklist
├── docker-compose.emqx.yml    # EMQX Docker Compose
├── docker-compose.mosquitto.yml # Mosquitto Docker Compose
├── certs/                     # TLS certificates (generate these)
│   ├── ca/
│   ├── server/
│   └── client/
├── emqx/                      # EMQX configuration
│   ├── acl.conf              # Access Control List
│   ├── data/                 # EMQX data directory
│   └── log/                  # EMQX logs
├── mosquitto/                # Mosquitto configuration
│   └── config/
│       ├── mosquitto.conf    # Main config
│       ├── passwd           # Password file
│       └── acl              # Access Control List
├── schemas/                  # JSON schemas
│   ├── message-base.json
│   ├── request-message.json
│   ├── offer-message.json
│   ├── location-message.json
│   └── points-message.json
├── examples/                 # Client examples
│   ├── esp32_client.ino      # ESP32 Arduino example
│   └── nodejs_client.js      # Node.js example
└── monitoring/               # Monitoring configs
    ├── prometheus.yml
    └── grafana/
        ├── datasources/
        └── dashboards/
```

## 🔐 Security

**IMPORTANT**: Before production deployment:

1. Generate proper TLS certificates (not self-signed)
2. Change all default passwords
3. Review and update ACL rules
4. Complete security checklist (see `SECURITY_CHECKLIST.md`)
5. Configure firewall rules
6. Set up monitoring and alerting

## 📊 Monitoring

- **EMQX Dashboard**: http://localhost:18083
- **Grafana**: http://localhost:3000
- **Prometheus**: http://localhost:9090

## 📚 Key Features

- ✅ MQTT 5.0 support with 3.1.1 fallback
- ✅ TLS/SSL encryption
- ✅ JWT and username/password authentication
- ✅ Comprehensive ACL rules
- ✅ Rate limiting and DoS protection
- ✅ Message retention policies
- ✅ Last Will and Testament (LWT)
- ✅ Prometheus metrics
- ✅ Grafana dashboards
- ✅ HTTP REST fallback
- ✅ SMS fallback for critical messages

## 🎯 Topic Hierarchy

```
aeras/block/{blockId}/request          # Ride requests
aeras/driver/{driverId}/offer          # Driver offers
aeras/driver/{driverId}/location       # GPS locations
aeras/admin/{adminId}/commands         # Admin commands
aeras/system/heartbeat                 # Device heartbeats
```

## 📝 Message Types

- `request` - Ride request from block
- `offer` - Driver offer
- `accept` - Accept offer
- `reject` - Reject offer
- `pickup` - Passenger picked up
- `drop` - Passenger dropped off
- `location` - GPS location update
- `heartbeat` - Device heartbeat
- `points_update` - Points transaction
- `admin_command` - Admin command

## 🔧 Client Examples

- **ESP32**: See `examples/esp32_client.ino`
- **Node.js**: See `examples/nodejs_client.js`

## 📖 Documentation

- Full specification: `MQTT_SPECIFICATION.md`
- Deployment guide: `DEPLOYMENT.md`
- Security checklist: `SECURITY_CHECKLIST.md`

## 🆘 Support

For issues or questions, refer to:
1. Main specification document
2. Deployment guide
3. Example client code
4. Security checklist

## 📄 License

Internal use only - AERAS IoT Systems

---

**Version**: 1.0  
**Last Updated**: 2024-01-15  
**Maintained By**: AERAS IoT Architecture Team

