require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await pool.query(`ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS motivo_fallo TEXT;`);
    console.log('✅ Columna "motivo_fallo" agregada a pedidos.');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
    console.log('Migración finalizada.');
  }
}

main();
