#!/usr/bin/env node
/**
 * LUMEN Docker Starter
 * Usage: node scripts/docker-start.js [dev|prod|down|clean]
 *
 * Commands:
 *   dev   - Start development stack (docker-compose.yml)
 *   prod  - Start production stack (docker-compose.prod.yml)
 *   down  - Stop all containers
 *   clean - Stop and remove all containers + volumes
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function run(command, cwd = ROOT) {
  console.log(`\n> ${command}\n`);
  try {
    execSync(command, { cwd, stdio: 'inherit' });
  } catch {
    process.exit(1);
  }
}

const cmd = process.argv[2] || 'dev';

switch (cmd) {
  case 'dev':
    console.log('🚀 Starting LUMEN in DEVELOPMENT mode...');
    console.log('Access: http://localhost:5173');
    run('docker-compose up --build');
    break;

  case 'prod':
    console.log('🚀 Starting LUMEN in PRODUCTION mode...');
    console.log('Access: http://localhost');
    run('docker-compose -f docker-compose.prod.yml up --build');
    break;

  case 'down':
    console.log('🛑 Stopping LUMEN containers...');
    run('docker-compose down');
    run('docker-compose -f docker-compose.prod.yml down');
    break;

  case 'clean':
    console.log('🧹 Cleaning LUMEN containers and volumes...');
    run('docker-compose down -v --remove-orphans');
    run('docker-compose -f docker-compose.prod.yml down -v --remove-orphans');
    break;

  default:
    console.log(`Unknown command: ${cmd}`);
    console.log('Usage: node scripts/docker-start.js [dev|prod|down|clean]');
    process.exit(1);
}
