#!/bin/bash
# Build script for LUMEN production deployment
# Usage: ./nginx/build.sh

set -e

echo "========================================="
echo "Building LUMEN for Production"
echo "========================================="

# 1. Build frontend
echo "[1/3] Building frontend..."
cd "$(dirname "$0")/.."
pnpm install
pnpm run build

# 2. Copy built files to nginx www
echo "[2/3] Copying frontend build to nginx..."
rm -rf nginx/www/*
cp -r dist/* nginx/www/

# 3. Build Docker images
echo "[3/3] Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "========================================="
echo "Build complete!"
echo ""
echo "To start production:"
echo "  docker-compose -f docker-compose.prod.yml up -d"
echo ""
echo "To stop:"
echo "  docker-compose -f docker-compose.prod.yml down"
echo "========================================="
