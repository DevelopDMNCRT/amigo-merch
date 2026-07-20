const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    console.log("Connecting to database...");
    const res = await pool.query('SELECT id, orden, nombre, total, created_at FROM pedidos ORDER BY created_at ASC LIMIT 40');
    console.log("Retrieved orders:");
    console.table(res.rows.map(row => ({
      id: row.id,
      orden: row.orden,
      nombre: row.nombre,
      total: row.total,
      created_at: row.created_at
    })));
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await pool.end();
  }
}

main();
