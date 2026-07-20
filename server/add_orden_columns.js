require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function run() {
  try {
    console.log('Agregando columna orden a tabla tiendas...');
    await pool.query(`ALTER TABLE tiendas ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;`);
    console.log('Agregando columna orden a tabla products...');
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS orden INTEGER DEFAULT 0;`);
    console.log('Migración completada exitosamente.');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    await pool.end();
  }
}

run();
