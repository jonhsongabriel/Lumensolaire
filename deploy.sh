#!/bin/bash
# LUMEN Production Deployment Script
# Usage: ./deploy.sh [dev|prod]

set -e

ENV=${1:-dev}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================="
echo "LUMEN Deployment - Mode: $ENV"
echo "========================================="

if [ "$ENV" = "prod" ]; then
  echo "[1/4] Production build..."
  
  # Build frontend
  echo "Building frontend..."
  pnpm install
  pnpm run build
  
  # Copy to nginx www
  echo "Copying build to nginx..."
  rm -rf nginx/www/*
  cp -r dist/* nginx/www/
  
  # Start production stack
  echo "Starting production stack..."
  docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
  docker-compose -f docker-compose.prod.yml up -d --build
  
  echo ""
  echo "========================================="
  echo "Production deployed!"
  echo "  Web:    http://localhost"
  echo "  API:    http://localhost/api/lumen"
  echo "  MQTT:   mqtt://localhost:1883"
  echo "========================================="

elif [ "$ENV" = "dev" ]; then
  echo "[1/2] Development mode..."
  
  # Install dependencies
  echo "Installing dependencies..."
  pnpm install
  cd backend && npm install && cd ..
  
  # Start dev stack with Nginx
  echo "Starting development stack..."
  docker-compose up -d db mosquitto
  
  echo ""
  echo "========================================="
  echo "Development stack started!"
  echo "  Frontend dev server:  pnpm run dev"
  echo "  Backend dev server:   cd backend && npm run dev"
  echo "  PostgreSQL:           localhost:5432"
  echo "  MQTT Broker:          localhost:1883"
  echo "========================================="
  echo ""
  echo "Run in separate terminals:"
  echo "  Terminal 1: cd backend && npm run dev"
  echo "  Terminal 2: pnpm run dev"

else
  echo "Usage: ./deploy.sh [dev|prod]"
  echo ""
  echo "  dev  - Start DB + MQTT containers for local development"
  echo "  prod - Full production deployment with Nginx"
  exit 1
fi
