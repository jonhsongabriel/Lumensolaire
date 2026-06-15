const fs = require('fs');
const path = require('path');
const { pool } = require('./connection');

async function initDatabase() {
  try {
    console.log('Initializing database...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('Database initialized successfully!');
    
    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();