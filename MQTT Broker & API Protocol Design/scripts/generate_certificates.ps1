# AERAS Certificate Generation Script (PowerShell)
# Generates CA, server, and client certificates for MQTT broker

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$CertsDir = Join-Path $ProjectRoot "certs"

Write-Host "AERAS Certificate Generation Script" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Create directory structure
Write-Host "`nCreating directory structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path (Join-Path $CertsDir "ca") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $CertsDir "server") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $CertsDir "client") | Out-Null

# Generate CA private key
Write-Host "`nGenerating CA private key..." -ForegroundColor Yellow
$caKeyPath = Join-Path $CertsDir "ca\ca.key"
openssl genrsa -out $caKeyPath 2048

# Generate CA certificate
Write-Host "`nGenerating CA certificate..." -ForegroundColor Yellow
$caCertPath = Join-Path $CertsDir "ca\ca.crt"
openssl req -new -x509 -days 3650 `
  -key $caKeyPath `
  -out $caCertPath `
  -subj "/C=US/ST=State/L=City/O=AERAS/CN=AERAS-CA"

# Generate server private key
Write-Host "`nGenerating server private key..." -ForegroundColor Yellow
$serverKeyPath = Join-Path $CertsDir "server\server.key"
openssl genrsa -out $serverKeyPath 2048

# Generate server CSR
Write-Host "`nGenerating server certificate signing request..." -ForegroundColor Yellow
$serverCsrPath = Join-Path $CertsDir "server\server.csr"
openssl req -new `
  -key $serverKeyPath `
  -out $serverCsrPath `
  -subj "/C=US/ST=State/L=City/O=AERAS/CN=mqtt.aeras.local"

# Sign server certificate
Write-Host "`nSigning server certificate..." -ForegroundColor Yellow
$serverCertPath = Join-Path $CertsDir "server\server.crt"
openssl x509 -req -days 365 `
  -in $serverCsrPath `
  -CA $caCertPath `
  -CAkey $caKeyPath `
  -CAcreateserial `
  -out $serverCertPath

# Generate client private key
Write-Host "`nGenerating example client private key..." -ForegroundColor Yellow
$clientKeyPath = Join-Path $CertsDir "client\client.key"
openssl genrsa -out $clientKeyPath 2048

# Generate client CSR
Write-Host "`nGenerating client certificate signing request..." -ForegroundColor Yellow
$clientCsrPath = Join-Path $CertsDir "client\client.csr"
openssl req -new `
  -key $clientKeyPath `
  -out $clientCsrPath `
  -subj "/C=US/ST=State/L=City/O=AERAS/CN=client"

# Sign client certificate
Write-Host "`nSigning client certificate..." -ForegroundColor Yellow
$clientCertPath = Join-Path $CertsDir "client\client.crt"
openssl x509 -req -days 365 `
  -in $clientCsrPath `
  -CA $caCertPath `
  -CAkey $caKeyPath `
  -CAcreateserial `
  -out $clientCertPath

# Clean up CSR files
Write-Host "`nCleaning up CSR files..." -ForegroundColor Yellow
Remove-Item $serverCsrPath -ErrorAction SilentlyContinue
Remove-Item $clientCsrPath -ErrorAction SilentlyContinue

Write-Host "`n✓ Certificate generation complete!" -ForegroundColor Green
Write-Host "`nGenerated files:"
Write-Host "  CA Certificate: $caCertPath"
Write-Host "  Server Certificate: $serverCertPath"
Write-Host "  Server Key: $serverKeyPath"
Write-Host "  Client Certificate: $clientCertPath"
Write-Host "  Client Key: $clientKeyPath"
Write-Host "`nIMPORTANT:" -ForegroundColor Yellow
Write-Host "  - Keep private keys secure"
Write-Host "  - Distribute CA certificate to all clients"
Write-Host "  - Rotate certificates before expiration"

