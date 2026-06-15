#!/usr/bin/env node
/**
 * LUMEN Production Build Script (cross-platform)
 * Builds frontend and copies to nginx www folder
 * Usage: node scripts/build-prod.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

function run(command, cwd = ROOT) {
  console.log(`> ${command}`);
  execSync(command, { cwd, stdio: 'inherit', shell: true });
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
console.log('Building LUMEN for Production');
console.log('=========================================');

// 1. Build frontend
console.log('[1/3] Building frontend...');
run('pnpm install');
run('pnpm run build');

// 2. Copy built files to nginx www
console.log('[2/3] Copying frontend build to nginx...');
const distDir = path.join(ROOT, 'dist');
const wwwDir = path.join(ROOT, 'nginx', 'www');
cleanDir(wwwDir);
copyDir(distDir, wwwDir);

// 3. Build Docker images
console.log('[3/3] Building Docker images...');
run('docker-compose -f docker-compose.prod.yml build');

console.log('=========================================');
console.log('Build complete!');
console.log('');
console.log('To start production:');
console.log('  docker-compose -f docker-compose.prod.yml up -d');
console.log('');
console.log('To stop:');
console.log('  docker-compose -f docker-compose.prod.yml down');
console.log('=========================================');
