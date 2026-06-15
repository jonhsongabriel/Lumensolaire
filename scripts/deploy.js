#!/usr/bin/env node
/**
 * LUMEN Cross-Platform Deployment Script
 * Works on Windows, macOS, Linux
 * Usage: node scripts/deploy.js [dev|prod]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ENV = process.argv[2] || 'dev';
const ROOT = path.resolve(__dirname, '..');

function run(command, cwd = ROOT) {
  console.log(`> ${command}`);
  try {
    execSync(command, { cwd, stdio: 'inherit', shell: true });
  } catch (error) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function cleanDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}

console.log('=========================================');
console.log(`LUMEN Deployment - Mode: ${ENV}`);
console.log('=========================================');

if (ENV === 'prod') {
  console.log('[1/4] Production build...');

  // 1. Build frontend
  console.log('Building frontend...');
  run('pnpm install');
  run('pnpm run build');

  // 2. Copy built files to nginx www (cross-platform)
  console.log('Copying frontend build to nginx...');
  const distDir = path.join(ROOT, 'dist');
  const wwwDir = path.join(ROOT, 'nginx', 'www');
  cleanDir(wwwDir);
  copyDir(distDir, wwwDir);

  // 3. Build Docker images
  console.log('Building Docker images...');
  run('docker-compose -f docker-compose.prod.yml down', ROOT);
  run('docker-compose -f docker-compose.prod.yml up -d --build', ROOT);

  console.log('');
  console.log('=========================================');
  console.log('Production deployed!');
  console.log('  Web:    http://localhost');
  console.log('  API:    http://localhost/api/lumen');
  console.log('  MQTT:   mqtt://localhost:1883');
  console.log('=========================================');

} else if (ENV === 'dev') {
  console.log('[1/2] Development mode...');

  // Install dependencies
  console.log('Installing dependencies...');
  run('pnpm install');
  run('npm install', path.join(ROOT, 'backend'));

  // Start infrastructure containers
  console.log('Starting infrastructure containers (DB + MQTT)...');
  run('docker-compose up -d db mosquitto', ROOT);

  console.log('');
  console.log('=========================================');
  console.log('Development stack started!');
  console.log('  PostgreSQL:  localhost:5432');
  console.log('  MQTT Broker: localhost:1883');
  console.log('');
  console.log('Run in separate terminals:');
  console.log('  Terminal 1: cd backend && npm run dev');
  console.log('  Terminal 2: pnpm run dev');
  console.log('=========================================');

} else {
  console.log('Usage: node scripts/deploy.js [dev|prod]');
  console.log('');
  console.log('  dev  - Start DB + MQTT containers for local development');
  console.log('  prod - Full production deployment with Nginx');
  process.exit(1);
}
