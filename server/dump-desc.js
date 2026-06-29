require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function dump() {
  try {
    const res = await pool.query('SELECT id, nombre, descripcion FROM products');
    fs.writeFileSync('descriptions.json', JSON.stringify(res.rows, null, 2));
    console.log('Descriptions dumped to descriptions.json');
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

dump();
