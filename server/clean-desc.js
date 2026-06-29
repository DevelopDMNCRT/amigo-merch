require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function clean() {
  try {
    const res = await pool.query('SELECT id, descripcion FROM products WHERE descripcion IS NOT NULL');
    const products = res.rows;
    let updated = 0;

    for (const p of products) {
      let original = p.descripcion;
      let cleaned = original
        .replace(/<[^>]+>/g, '')         // Remove HTML tags
        .replace(/&amp;/g, '&')          // Unescape &amp;
        .replace(/\\r\\n/g, '\n')        // Replace literal \r\n with newline
        .replace(/\\n/g, '\n')           // Replace literal \n with newline
        .replace(/\r\n/g, '\n')          // Replace actual CRLF with newline
        .replace(/\n+/g, '\n')           // Collapse multiple newlines into one
        .trim();

      if (original !== cleaned) {
        await pool.query('UPDATE products SET descripcion = $1 WHERE id = $2', [cleaned, p.id]);
        updated++;
      }
    }
    console.log(`Cleaned ${updated} product descriptions.`);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

clean();
