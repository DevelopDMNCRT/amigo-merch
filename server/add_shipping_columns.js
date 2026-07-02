require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const columns = [
    { name: 'paqueteria',  type: 'VARCHAR(100)' },
    { name: 'num_rastreo', type: 'VARCHAR(100)' },
  ];

  for (const col of columns) {
    try {
      await pool.query(`ALTER TABLE pedidos ADD COLUMN ${col.name} ${col.type};`);
      console.log(`✅ Columna "${col.name}" agregada a pedidos.`);
    } catch (err) {
      if (err.code === '42701') {
        console.log(`ℹ️  Columna "${col.name}" ya existe.`);
      } else {
        console.error(`❌ Error agregando columna "${col.name}":`, err.message);
      }
    }
  }

  await pool.end();
  console.log('Migración finalizada.');
}

main();
