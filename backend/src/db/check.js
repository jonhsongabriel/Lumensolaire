/**
 * Database connection health check
 * Tests PostgreSQL connectivity on backend startup
 */
const { pool } = require('./connection');

async function checkDatabase() {
  console.log('[DB] Vérification de la connexion PostgreSQL...');
  try {
    const result = await pool.query('SELECT NOW() as time, version() as version');
    console.log(`[DB] Connecté ✓ - ${result.rows[0].time}`);
    console.log(`[DB] PostgreSQL: ${result.rows[0].version.split(' ')[0]}...`);
    return true;
  } catch (error) {
    console.error('[DB] Erreur de connexion ✗');
    console.error(`[DB] Message: ${error.message}`);
    console.error('');
    console.error('Vérifiez que :');
    console.error('  1. PostgreSQL est démarré (docker-compose up -d db)');
    console.error('  2. La variable POSTGRES_URL est correcte dans .env');
    console.error('  3. Les identifiants sont valides');
    console.error('');
    return false;
  }
}

module.exports = { checkDatabase };
