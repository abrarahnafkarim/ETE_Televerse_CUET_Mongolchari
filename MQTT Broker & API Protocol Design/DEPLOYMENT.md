# AERAS MQTT Broker Deployment Guide

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- OpenSSL for certificate generation
- Ports available: 1883, 8883, 18083, 9001, 9090, 3000

### Step 1: Generate TLS Certificates

```bash
# Create certificate directory structure
mkdir -p certs/{ca,server,client}

# Generate CA
openssl genrsa -out certs/ca/ca.key 2048
openssl req -new -x509 -days 3650 -key certs/ca/ca.key -out certs/ca/ca.crt \
  -subj "/C=US/ST=State/L=City/O=AERAS/CN=AERAS-CA"

# Generate server certificate
openssl genrsa -out certs/server/server.key 2048
openssl req -new -key certs/server/server.key -out certs/server/server.csr \
  -subj "/C=US/ST=State/L=City/O=AERAS/CN=mqtt.aeras.local"

openssl x509 -req -in certs/server/server.csr -CA certs/ca/ca.crt \
  -CAkey certs/ca/ca.key -CAcreateserial -out certs/server/server.crt -days 365

# Set permissions
chmod 600 certs/**/*.key
```

### Step 2: Choose Broker

**Option A: EMQX (Recommended for Production)**
```bash
docker-compose -f docker-compose.emqx.yml up -d
```

**Option B: Mosquitto (Lightweight)**
```bash
# Create required directories
mkdir -p mosquitto/{config,data,log}

# Copy configuration files (already created)
# Start services
docker-compose -f docker-compose.mosquitto.yml up -d
```

### Step 3: Create Users

**EMQX:**
```bash
# Access EMQX container
docker exec -it aeras-emqx sh

# Create user via CLI
./bin/emqx_ctl users add driver_DRV-0423 "secure_password" \
  --tags driver --description "Driver DRV-0423"

# Or use HTTP API
curl -X POST 'http://localhost:18083/api/v5/users' \
  -H 'Content-Type: application/json' \
  -u admin:change_me_in_production \
  -d '{
    "user_id": "driver_DRV-0423",
    "password": "secure_password",
    "tags": ["driver"]
  }'
```

**Mosquitto:**
```bash
# Create password file
docker exec -it aeras-mosquitto mosquitto_passwd -c /mosquitto/config/passwd driver_DRV-0423
# Enter password when prompted
```

### Step 4: Configure ACL

ACL files are already configured in:
- `emqx/acl.conf` (for EMQX)
- `mosquitto/config/acl` (for Mosquitto)

Update these files with your specific device IDs and permissions.

### Step 5: Verify Deployment

**Test Connection:**
```bash
# Using mosquitto client
mosquitto_sub -h localhost -p 8883 \
  --cafile certs/ca/ca.crt \
  --cert certs/client/client.crt \
  --key certs/client/client.key \
  -u driver_DRV-0423 -P secure_password \
  -t 'aeras/block/+/request' -v
```

**Check EMQX Dashboard:**
- URL: http://localhost:18083
- Username: admin
- Password: change_me_in_production

**Check Grafana:**
- URL: http://localhost:3000
- Username: admin
- Password: change_me_in_production

### Step 6: Update Default Passwords

**CRITICAL**: Change all default passwords before production!

1. EMQX Dashboard: Change via web UI
2. Grafana: Change via web UI
3. User passwords: Update via CLI/API

## Production Deployment

### Environment Variables

Create `.env` file:
```env
EMQX_ADMIN_PASSWORD=your_secure_admin_password
GRAFANA_ADMIN_PASSWORD=your_secure_grafana_password
JWT_SECRET=your_very_long_random_jwt_secret_key
```

### Network Configuration

1. **Firewall Rules:**
   - Allow 8883 (MQTTS) from client networks
   - Restrict 18083 (EMQX Dashboard) to internal network
   - Restrict 3000 (Grafana) to internal network

2. **Load Balancer:**
   - Configure load balancer for high availability
   - Use health checks on port 18083

### Monitoring Setup

1. **Prometheus:**
   - Already configured in docker-compose
   - Access at http://localhost:9090

2. **Grafana:**
   - Already configured in docker-compose
   - Import dashboard from `monitoring/grafana/dashboards/`

### Backup Configuration

```bash
# Backup EMQX data
docker exec aeras-emqx tar czf /backup/emqx-backup-$(date +%Y%m%d).tar.gz /opt/emqx/data

# Backup Mosquitto data
docker exec aeras-mosquitto tar czf /backup/mosquitto-backup-$(date +%Y%m%d).tar.gz /mosquitto/data
```

## Troubleshooting

### Connection Issues

1. **Check certificates:**
   ```bash
   openssl x509 -in certs/server/server.crt -text -noout
   ```

2. **Check broker logs:**
   ```bash
   docker logs aeras-emqx
   # or
   docker logs aeras-mosquitto
   ```

3. **Test TLS connection:**
   ```bash
   openssl s_client -connect localhost:8883 -CAfile certs/ca/ca.crt
   ```

### Performance Issues

1. **Check resource usage:**
   ```bash
   docker stats
   ```

2. **Review rate limiting:**
   - Check if rate limits are too restrictive
   - Monitor message queue depth

3. **Scale horizontally:**
   - EMQX supports clustering
   - Use load balancer for multiple instances

## Maintenance

### Certificate Renewal

```bash
# Generate new certificate
# (same process as initial generation)

# Restart broker
docker-compose restart emqx
# or
docker-compose restart mosquitto
```

### User Management

Regular audit of users:
```bash
# List all users (EMQX)
./bin/emqx_ctl users list

# Remove inactive users
./bin/emqx_ctl users delete <user_id>
```

### Log Rotation

Configure log rotation in docker-compose or use external logging solution.

## Support

For issues or questions:
- Documentation: See `MQTT_SPECIFICATION.md`
- Security: See `SECURITY_CHECKLIST.md`
- Examples: See `examples/` directory

