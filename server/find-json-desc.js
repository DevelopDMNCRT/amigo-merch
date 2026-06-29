require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findJSONDescriptions() {
  try {
    const res = await pool.query('SELECT * FROM products');
    const products = res.rows;
    let found = [];
    for (const p of products) {
      if (p.descripcion && (p.descripcion.includes('{') || p.descripcion.includes('[') || p.descripcion.includes('}'))) {
        found.push({ id: p.id, nombre: p.nombre, desc: p.descripcion });
      }
    }
    console.log(`Found ${found.length} products with JSON-like syntax in description.`);
    if (found.length > 0) {
      console.log(JSON.stringify(found[0], null, 2));
    }
    console.log(`Found ${found.length} products with suspicious descriptions:`);
    console.log(JSON.stringify(found, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

findJSONDescriptions();
