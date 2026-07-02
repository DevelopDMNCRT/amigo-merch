require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    await pool.query('ALTER TABLE pedidos ADD COLUMN delegacion VARCHAR(255);');
    console.log('Column delegacion added to pedidos successfully.');
  } catch (err) {
    if (err.code === '42701') {
      console.log('Column delegacion already exists.');
    } else {
      console.error('Error adding column:', err);
    }
  } finally {
    await pool.end();
  }
}

main();
