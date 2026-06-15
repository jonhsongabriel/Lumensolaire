#!/usr/bin/env node
/**
 * LUMEN PostgreSQL Backup Script (cross-platform)
 * Usage: node scripts/backup.js [--output=./backup/archives]
 * Creates a timestamped SQL dump of the database.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Parse CLI args
const args = process.argv.slice(2);
let outputDir = path.join(ROOT, 'backup', 'archives');
for (const arg of args) {
  if (arg.startsWith('--output=')) {
    outputDir = path.resolve(arg.split('=')[1]);
  }
}

// Load environment variables from .env or .env.prod
function loadEnv() {
  const envFiles = ['.env.prod', '.env'];
  for (const file of envFiles) {
    const envPath = path.join(ROOT, file);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.substring(0, idx).trim();
          const val = trimmed.substring(idx + 1).trim();
          if (!process.env[key]) process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const POSTGRES_URL = process.env.POSTGRES_URL || 'postgres://lumen:Lum3n.pasS!@localhost:5432/lumendb';

// Parse postgres URL
function parsePostgresUrl(url) {
  const match = url.match(/postgres:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)/);
  if (!match) throw new Error('POSTGRES_URL invalide');
  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    db: match[5],
  };
}

function run(command, env = {}) {
  console.log(`> ${command}`);
  try {
    execSync(command, {
      cwd: ROOT,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...env },
    });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    return false;
  }
}

function main() {
  console.log('=========================================');
  console.log('LUMEN PostgreSQL Backup');
  console.log('=========================================');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const pg = parsePostgresUrl(POSTGRES_URL);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `lumen_backup_${timestamp}.sql`;
  const filepath = path.join(outputDir, filename);

  console.log(`Database: ${pg.db} @ ${pg.host}:${pg.port}`);
  console.log(`User: ${pg.user}`);
  console.log(`Output: ${filepath}`);
  console.log('');

  const env = {
    PGPASSWORD: pg.password,
  };

  // Determine if using Docker or local postgres
  const isDockerHost = pg.host === 'db' || pg.host === 'localhost';
  let command;

  if (isDockerHost) {
    // Use docker exec to run pg_dump inside the container
    const containerName = process.argv.includes('--docker')
      ? 'lumen-db-prod'
      : 'lumen-db';
    command = `docker exec ${containerName} pg_dump -U ${pg.user} -d ${pg.db} -f /tmp/${filename}`;

    console.log(`[Docker] Running pg_dump in container: ${containerName}`);
    const ok = run(command, env);
    if (!ok) {
      console.error('Backup failed inside Docker container.');
      process.exit(1);
    }

    // Copy file from container to host
    const copyCmd = `docker cp ${containerName}:/tmp/${filename} "${filepath}"`;
    const copyOk = run(copyCmd);
    if (!copyOk) {
      console.error('Failed to copy backup from container.');
      process.exit(1);
    }

    // Clean up container file
    run(`docker exec ${containerName} rm /tmp/${filename}`);
  } else {
    // Local pg_dump
    command = `pg_dump -h ${pg.host} -p ${pg.port} -U ${pg.user} -d ${pg.db} -f "${filepath}"`;
    const ok = run(command, env);
    if (!ok) {
      console.error('Backup failed. Is pg_dump installed?');
      console.error('  Windows: https://www.postgresql.org/download/windows/');
      process.exit(1);
    }
  }

  // Verify file exists
  if (!fs.existsSync(filepath)) {
    console.error('Backup file was not created.');
    process.exit(1);
  }

  const stats = fs.statSync(filepath);
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

  console.log('');
  console.log('=========================================');
  console.log(`Backup created: ${filename}`);
  console.log(`Size: ${sizeMB} MB`);
  console.log(`Location: ${filepath}`);
  console.log('=========================================');

  // Cleanup old backups (keep last 30 days)
  cleanupOldBackups(outputDir, 30);
}

function cleanupOldBackups(dir, keepDays) {
  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith('lumen_backup_') && f.endsWith('.sql'))
    .map(f => ({
      name: f,
      path: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtime,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);

  let deleted = 0;
  for (const file of files) {
    if (file.mtime < cutoff) {
      fs.unlinkSync(file.path);
      deleted++;
    }
  }

  if (deleted > 0) {
    console.log(`Cleaned up ${deleted} old backup(s) (older than ${keepDays} days).`);
  }
}

main();
