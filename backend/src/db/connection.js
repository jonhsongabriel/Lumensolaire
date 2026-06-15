const { Pool } = require('pg');
const path = require('path');

// Try multiple .env locations (project root, backend root, current dir)
const envPaths = [
  path.resolve(__dirname, '../../../.env'),      // project root
  path.resolve(__dirname, '../../.env'),         // backend root
  path.resolve(process.cwd(), '.env'),           // current working dir
];

for (const envPath of envPaths) {
  require('dotenv').config({ path: envPath });
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgres://lumen:Lum3n.pasS!@db:5432/lumendb',
});

pool.on('connect', () => {
  console.log('[DB] Connecté à PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Erreur de connexion PostgreSQL:', err.message);
});

module.exports = { pool };
