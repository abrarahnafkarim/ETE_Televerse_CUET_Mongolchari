#!/bin/bash

# AERAS Certificate Generation Script
# Generates CA, server, and client certificates for MQTT broker

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CERTS_DIR="$PROJECT_ROOT/certs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}AERAS Certificate Generation Script${NC}"
echo "=========================================="

# Create directory structure
echo -e "\n${YELLOW}Creating directory structure...${NC}"
mkdir -p "$CERTS_DIR"/{ca,server,client}

# Generate CA private key
echo -e "\n${YELLOW}Generating CA private key...${NC}"
openssl genrsa -out "$CERTS_DIR/ca/ca.key" 2048

# Generate CA certificate
echo -e "\n${YELLOW}Generating CA certificate...${NC}"
openssl req -new -x509 -days 3650 \
  -key "$CERTS_DIR/ca/ca.key" \
  -out "$CERTS_DIR/ca/ca.crt" \
  -subj "/C=US/ST=State/L=City/O=AERAS/CN=AERAS-CA"

# Generate server private key
echo -e "\n${YELLOW}Generating server private key...${NC}"
openssl genrsa -out "$CERTS_DIR/server/server.key" 2048

# Generate server CSR
echo -e "\n${YELLOW}Generating server certificate signing request...${NC}"
openssl req -new \
  -key "$CERTS_DIR/server/server.key" \
  -out "$CERTS_DIR/server/server.csr" \
  -subj "/C=US/ST=State/L=City/O=AERAS/CN=mqtt.aeras.local"

# Sign server certificate
echo -e "\n${YELLOW}Signing server certificate...${NC}"
openssl x509 -req -days 365 \
  -in "$CERTS_DIR/server/server.csr" \
  -CA "$CERTS_DIR/ca/ca.crt" \
  -CAkey "$CERTS_DIR/ca/ca.key" \
  -CAcreateserial \
  -out "$CERTS_DIR/server/server.crt"

# Generate client private key (example)
echo -e "\n${YELLOW}Generating example client private key...${NC}"
openssl genrsa -out "$CERTS_DIR/client/client.key" 2048

# Generate client CSR
echo -e "\n${YELLOW}Generating client certificate signing request...${NC}"
openssl req -new \
  -key "$CERTS_DIR/client/client.key" \
  -out "$CERTS_DIR/client/client.csr" \
  -subj "/C=US/ST=State/L=City/O=AERAS/CN=client"

# Sign client certificate
echo -e "\n${YELLOW}Signing client certificate...${NC}"
openssl x509 -req -days 365 \
  -in "$CERTS_DIR/client/client.csr" \
  -CA "$CERTS_DIR/ca/ca.crt" \
  -CAkey "$CERTS_DIR/ca/ca.key" \
  -CAcreateserial \
  -out "$CERTS_DIR/client/client.crt"

# Set proper permissions
echo -e "\n${YELLOW}Setting file permissions...${NC}"
chmod 600 "$CERTS_DIR"/**/*.key
chmod 644 "$CERTS_DIR"/**/*.crt
chmod 644 "$CERTS_DIR"/**/*.csr

# Clean up CSR files (optional)
echo -e "\n${YELLOW}Cleaning up CSR files...${NC}"
rm -f "$CERTS_DIR"/**/*.csr

echo -e "\n${GREEN}✓ Certificate generation complete!${NC}"
echo -e "\nGenerated files:"
echo "  CA Certificate: $CERTS_DIR/ca/ca.crt"
echo "  Server Certificate: $CERTS_DIR/server/server.crt"
echo "  Server Key: $CERTS_DIR/server/server.key"
echo "  Client Certificate: $CERTS_DIR/client/client.crt"
echo "  Client Key: $CERTS_DIR/client/client.key"
echo -e "\n${YELLOW}IMPORTANT:${NC}"
echo "  - Keep private keys secure (chmod 600)"
echo "  - Distribute CA certificate to all clients"
echo "  - Rotate certificates before expiration"

