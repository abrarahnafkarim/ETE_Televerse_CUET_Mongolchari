# AERAS MQTT Security Checklist

## Pre-Production Security Audit

Use this checklist before deploying to production. Check each item as completed.

### TLS/SSL Configuration

- [ ] TLS 1.2+ enabled on all MQTT listeners
- [ ] Valid SSL certificates installed (not self-signed in production)
- [ ] Certificate chain properly configured
- [ ] Certificate expiration monitoring enabled
- [ ] Certificate rotation process documented
- [ ] Weak ciphers disabled (only TLS 1.2+ ciphers allowed)
- [ ] Certificate validation enabled on client side
- [ ] CA certificate properly distributed to clients

### Authentication

- [ ] Anonymous access disabled
- [ ] Strong password policy enforced (min 12 characters, complexity)
- [ ] Password hashing using bcrypt/argon2 (not plaintext)
- [ ] JWT tokens with short expiration (1 hour recommended)
- [ ] JWT secret key is strong and stored securely
- [ ] JWT token refresh mechanism implemented
- [ ] Certificate-based authentication configured (if applicable)
- [ ] Multi-factor authentication for admin accounts (if applicable)
- [ ] Failed login attempt monitoring and alerting
- [ ] Account lockout after N failed attempts

### Authorization (ACL)

- [ ] ACL rules configured and tested
- [ ] Principle of least privilege applied
- [ ] Wildcard subscriptions restricted appropriately
- [ ] Admin users cannot publish to device topics
- [ ] Devices can only publish to their own topics
- [ ] Read/write permissions properly separated
- [ ] ACL rules reviewed and documented
- [ ] Dynamic ACL updates tested

### Network Security

- [ ] MQTT broker behind firewall
- [ ] Only necessary ports exposed (1883, 8883, 9001)
- [ ] Management ports (18083) restricted to internal network
- [ ] VPN required for remote access
- [ ] DDoS protection configured
- [ ] Network segmentation implemented
- [ ] Intrusion detection system (IDS) monitoring
- [ ] IP whitelisting for admin access (if applicable)

### Rate Limiting & DoS Protection

- [ ] Per-client rate limiting enabled
- [ ] Message rate limits configured per client type
- [ ] Connection rate limiting enabled
- [ ] Maximum connections per IP configured
- [ ] Message size limits enforced (64KB max)
- [ ] Subscription limits per client configured
- [ ] Inflight message limits set
- [ ] Queue size limits configured
- [ ] Protection against message storms tested

### Data Protection

- [ ] Personal data (PII) not retained in messages
- [ ] Location data retention policy implemented
- [ ] Message encryption at rest (if applicable)
- [ ] Sensitive data logging disabled
- [ ] Data retention policies documented
- [ ] GDPR/compliance requirements met
- [ ] Data deletion procedures tested

### Monitoring & Logging

- [ ] Authentication failures logged
- [ ] Authorization failures logged
- [ ] Connection/disconnection events logged
- [ ] Error events logged with appropriate detail
- [ ] Log retention policy configured
- [ ] Log rotation enabled
- [ ] Security event alerting configured
- [ ] Anomaly detection enabled
- [ ] Prometheus metrics exposed
- [ ] Grafana dashboards configured
- [ ] Alert rules configured for security events

### Secrets Management

- [ ] Passwords stored in secure vault (not in code/config files)
- [ ] JWT secrets stored securely
- [ ] Certificate private keys protected (600 permissions)
- [ ] Environment variables used for sensitive data
- [ ] Secrets rotation process documented
- [ ] No secrets committed to version control
- [ ] .gitignore configured for sensitive files

### Broker Configuration

- [ ] Default admin credentials changed
- [ ] Unnecessary features disabled
- [ ] Maximum packet size limited
- [ ] Message expiry configured
- [ ] Persistent sessions configured appropriately
- [ ] LWT (Last Will) configured for all clients
- [ ] Keep-alive intervals configured
- [ ] Clean session flags set appropriately

### Client Security

- [ ] Client certificates validated (if using cert auth)
- [ ] Client ID validation enabled
- [ ] Client reconnection limits configured
- [ ] Client message validation implemented
- [ ] Client libraries updated to latest secure versions
- [ ] Client-side TLS verification enabled

### Backup & Recovery

- [ ] Configuration backups automated
- [ ] Certificate backups secured
- [ ] Disaster recovery plan documented
- [ ] Recovery procedures tested
- [ ] Backup encryption enabled
- [ ] Backup retention policy configured

### Compliance & Documentation

- [ ] Security policy documented
- [ ] Incident response plan documented
- [ ] Security contact information available
- [ ] Regular security audits scheduled
- [ ] Penetration testing completed
- [ ] Vulnerability scanning automated
- [ ] Security updates process documented
- [ ] Change management process for security changes

### Operational Security

- [ ] Access logs reviewed regularly
- [ ] Security alerts monitored 24/7
- [ ] Security team notified of critical issues
- [ ] Regular security training for operations team
- [ ] Security patches applied promptly
- [ ] Zero-day vulnerability response plan
- [ ] Security incident reporting process

### Testing

- [ ] Load testing completed
- [ ] Stress testing completed
- [ ] Security testing completed
- [ ] Penetration testing completed
- [ ] Failover testing completed
- [ ] TLS handshake tested
- [ ] Authentication flow tested
- [ ] ACL rules tested with various scenarios
- [ ] Rate limiting tested
- [ ] Message delivery guarantees tested

## Post-Deployment Security Tasks

- [ ] Monitor for authentication failures
- [ ] Monitor for unusual connection patterns
- [ ] Review access logs weekly
- [ ] Update security patches monthly
- [ ] Rotate certificates before expiration
- [ ] Review and update ACL rules quarterly
- [ ] Conduct security audit annually

## Emergency Contacts

- **Security Team**: security@aeras.local
- **On-Call Engineer**: +1-XXX-XXX-XXXX
- **Incident Response**: incident@aeras.local

## Security Incident Response

1. **Detect**: Monitor alerts and logs
2. **Contain**: Isolate affected systems
3. **Eradicate**: Remove threat
4. **Recover**: Restore normal operations
5. **Document**: Record incident details
6. **Review**: Post-incident analysis

---

**Last Updated**: 2024-01-15  
**Next Review**: 2024-04-15  
**Reviewed By**: [Security Team]

