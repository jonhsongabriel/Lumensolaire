#!/usr/bin/env node
/**
 * LUMEN PostgreSQL Restore Script (cross-platform)
 * Usage: node scripts/restore.js <backup-file.sql>
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

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
  const backupFile = process.argv[2];

  if (!backupFile) {
    console.log('Usage: node scripts/restore.js <backup-file.sql>');
    console.log('');
    console.log('Available backups:');

    const backupDir = path.join(ROOT, 'backup', 'archives');
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.sql'))
        .sort()
        .reverse();
      for (const f of files.slice(0, 10)) {
        const stats = fs.statSync(path.join(backupDir, f));
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`  ${f} (${sizeMB} MB)`);
      }
      if (files.length === 0) console.log('  (none)');
    }
    process.exit(1);
  }

  const filepath = path.resolve(backupFile);
  if (!fs.existsSync(filepath)) {
    console.error(`File not found: ${filepath}`);
    process.exit(1);
  }

  console.log('=========================================');
  console.log('LUMEN PostgreSQL Restore');
  console.log('=========================================');

  const pg = parsePostgresUrl(POSTGRES_URL);

  console.log(`WARNING: This will overwrite database "${pg.db}" @ ${pg.host}:${pg.port}`);
  console.log(`Backup file: ${filepath}`);
  console.log('');

  // For non-TTY (Docker), skip prompt
  if (process.stdin.isTTY) {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Type "RESTORE" to confirm: ', (answer) => {
      rl.close();
      if (answer.trim() !== 'RESTORE') {
        console.log('Restore cancelled.');
        process.exit(0);
      }
      doRestore(pg, filepath);
    });
  } else {
    console.log('Non-interactive mode: proceeding with restore...');
    doRestore(pg, filepath);
  }
}

function doRestore(pg, filepath) {
  const env = { PGPASSWORD: pg.password };

  const isDockerHost = pg.host === 'db' || pg.host === 'localhost';

  if (isDockerHost) {
    const containerName = process.argv.includes('--docker')
      ? 'lumen-db-prod'
      : 'lumen-db';

    // Copy file into container
    const filename = path.basename(filepath);
    const copyOk = run(`docker cp "${filepath}" ${containerName}:/tmp/${filename}`);
    if (!copyOk) {
      console.error('Failed to copy backup file to container.');
      process.exit(1);
    }

    // Restore inside container
    const ok = run(
      `docker exec ${containerName} psql -U ${pg.user} -d ${pg.db} -f /tmp/${filename}`,
      env
    );
    if (!ok) {
      console.error('Restore failed inside Docker container.');
      process.exit(1);
    }

    run(`docker exec ${containerName} rm /tmp/${filename}`);
  } else {
    const ok = run(
      `psql -h ${pg.host} -p ${pg.port} -U ${pg.user} -d ${pg.db} -f "${filepath}"`,
      env
    );
    if (!ok) {
      console.error('Restore failed. Is psql installed?');
      process.exit(1);
    }
  }

  console.log('');
  console.log('=========================================');
  console.log('Restore completed successfully!');
  console.log('=========================================');
}

main();
