/**
 * Auto-initialize database schema on backend startup
 * Checks if tables exist, and creates them statement-by-statement if not
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function initSchemaIfNeeded() {
  try {
    // Check if profiles table exists
    const checkResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
      );
    `);

    const tableExists = checkResult.rows[0].exists;

    if (tableExists) {
      console.log('[DB] Schéma déjà initialisé ✓');
      return true;
    }

    console.log('[DB] Schéma non trouvé, initialisation automatique...');

    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error(`[DB] Fichier schéma introuvable: ${schemaPath}`);
      return false;
    }

    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split schema into individual statements and execute one by one
    // This avoids "current transaction is aborted" issues
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await pool.query(stmt);
      } catch (err) {
        // Log but don't fail on duplicate/IF NOT EXISTS errors
        if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
          console.log(`[DB] Ignoré (existe déjà): ${stmt.substring(0, 60)}...`);
        } else {
          console.error(`[DB] Erreur statement ${i + 1}: ${err.message}`);
          console.error(`   SQL: ${stmt.substring(0, 120)}...`);
        }
      }
    }

    // Also run migration if it exists
    const migrationPath = path.join(__dirname, 'migration_002_projects.sql');
    if (fs.existsSync(migrationPath)) {
      console.log('[DB] Application de la migration 002...');
      const migration = fs.readFileSync(migrationPath, 'utf8');
      const migrationStatements = migration
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const stmt of migrationStatements) {
        try {
          await pool.query(stmt);
        } catch (err) {
          if (err.message && (err.message.includes('already exists') || err.message.includes('duplicate'))) {
            console.log(`[DB] Migration ignorée (existe déjà)`);
          } else {
            console.error(`[DB] Erreur migration: ${err.message}`);
          }
        }
      }
    }

    // Verify tables were created
    const verifyResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
      );
    `);

    if (verifyResult.rows[0].exists) {
      console.log('[DB] Schéma initialisé avec succès ✓');
      return true;
    } else {
      console.error('[DB] Échec de la vérification: table profiles absente');
      return false;
    }
  } catch (error) {
    console.error('[DB] Erreur lors de l\'initialisation du schéma:', error.message);
    return false;
  }
}

module.exports = { initSchemaIfNeeded };
