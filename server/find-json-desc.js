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
      if (JSON.stringify(p).includes('string')) {
        found.push(p);
      }
    }
    console.log(`Found ${found.length} products with 'string' in their JSON representation.`);
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
