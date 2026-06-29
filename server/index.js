require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { upload } = require('./cloudinary');
const multer = require('multer');
const nodemailer = require('nodemailer');
const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const fs = require('fs');
const csv = require('csv-parser');

const localUpload = multer({ dest: '/tmp/' });
// ── Mercado Pago ───────────────────────────────────────────────────────────
const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// ── Email transporter ──────────────────────────────────────────────────────
const mailer = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Estados que disparan correo al cliente y la plantilla correspondiente
const EMAIL_TRIGGERS = {
  'En proceso': (p) => ({
    subject: `¡Gracias por tu compra! Tu pedido #${p.orden} está en proceso — Amigo Merch`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#237650">¡Tu pedido está en preparación! 📦</h2>
        <p>Hola <strong>${p.nombre}</strong>,</p>
        <p>Tu pedido <strong>#${p.orden}</strong> ya está siendo preparado por nuestro equipo. Pronto lo enviaremos a tu domicilio.</p>
        <p style="color:#666">Puedes rastrear tu pedido en <a href="https://amigo-merch.vercel.app/rastreo" style="color:#237650">amigo-merch.vercel.app/rastreo</a> usando el número <strong>#${p.orden}</strong>.</p>
        <p>¡Gracias por tu compra!</p>
        <p style="color:#aaa;font-size:12px">Amigo Merch — amigomerchmx@gmail.com</p>
      </div>
    `
  }),
  'Completado': (p) => ({
    subject: `Tu pedido #${p.orden} fue entregado — Amigo Merch`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#237650">¡Tu pedido fue entregado! ✅</h2>
        <p>Hola <strong>${p.nombre}</strong>,</p>
        <p>Tu pedido <strong>#${p.orden}</strong> ha sido marcado como entregado. Esperamos que estés disfrutando tu merch.</p>
        <p>Si tienes algún problema con tu pedido, contáctanos en <a href="mailto:amigomerchmx@gmail.com" style="color:#237650">amigomerchmx@gmail.com</a>.</p>
        <p>¡Gracias por confiar en Amigo Merch! 🎉</p>
        <p style="color:#aaa;font-size:12px">Amigo Merch — amigomerchmx@gmail.com</p>
      </div>
    `
  }),
  'Cancelado': (p) => ({
    subject: `Tu pedido #${p.orden} fue cancelado — Amigo Merch`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#c62828">Pedido cancelado</h2>
        <p>Hola <strong>${p.nombre}</strong>,</p>
        <p>Lamentamos informarte que tu pedido <strong>#${p.orden}</strong> ha sido cancelado.</p>
        <p>Si tienes preguntas o crees que esto es un error, contáctanos en <a href="mailto:amigomerchmx@gmail.com" style="color:#237650">amigomerchmx@gmail.com</a>.</p>
        <p style="color:#aaa;font-size:12px">Amigo Merch — amigomerchmx@gmail.com</p>
      </div>
    `
  }),
  'Fallido': (p) => ({
    subject: `Problema con tu pedido #${p.orden} — Amigo Merch`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#c62828">Problema con tu pedido</h2>
        <p>Hola <strong>${p.nombre}</strong>,</p>
        <p>Tuvimos un problema al procesar tu pedido <strong>#${p.orden}</strong>. El pago no pudo ser completado.</p>
        <p>Te invitamos a intentar nuevamente o contáctanos para ayudarte: <a href="mailto:amigomerchmx@gmail.com" style="color:#237650">amigomerchmx@gmail.com</a>.</p>
        <p style="color:#aaa;font-size:12px">Amigo Merch — amigomerchmx@gmail.com</p>
      </div>
    `
  }),
};

async function sendStatusEmail(pedido, estado) {
  const trigger = EMAIL_TRIGGERS[estado];
  if (!trigger) return;                          // Estado sin correo
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL SKIPPED] No SMTP_USER configured. Would send "${estado}" email to ${pedido.correo}`);
    return;
  }
  const { subject, html } = trigger(pedido);
  try {
    await mailer.sendMail({
      from: `"Amigo Merch" <${process.env.SMTP_USER}>`,
      to:   pedido.correo,
      subject,
      html,
    });
    console.log(`[EMAIL SENT] Estado "${estado}" → ${pedido.correo}`);
  } catch (err) {
    console.error(`[EMAIL ERROR] Could not send status email:`, err.message);
  }
}

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- Auth Routes ---

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE correo = $1 OR nombre = $1',
      [username]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Credenciales incorrectas' });
    const token = jwt.sign(
      { id: user.id, username: user.nombre, email: user.correo, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, admin: { id: user.id, username: user.nombre, email: user.correo, rol: user.rol } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query('SELECT id, nombre, correo, rol FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const u = result.rows[0];
    res.json({ admin: { id: u.id, username: u.nombre, email: u.correo, rol: u.rol } });
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
});

// --- Users CRUD ---

app.get('/api/users', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, correo, rol, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch users' }); }
});

app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT id, nombre, correo, rol, created_at FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch user' }); }
});

app.post('/api/users', async (req, res) => {
  const { nombre, correo, rol, password } = req.body;
  if (!nombre || !correo || !rol || !password) return res.status(400).json({ error: 'All fields are required' });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (nombre, correo, rol, password) VALUES ($1, $2, $3, $4) RETURNING id, nombre, correo, rol',
      [nombre, correo, rol, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, rol, password } = req.body;
  try {
    let query, params;
    if (password && password.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE users SET nombre=$1, correo=$2, rol=$3, password=$4 WHERE id=$5 RETURNING id, nombre, correo, rol';
      params = [nombre, correo, rol, hashedPassword, id];
    } else {
      query = 'UPDATE users SET nombre=$1, correo=$2, rol=$3 WHERE id=$4 RETURNING id, nombre, correo, rol';
      params = [nombre, correo, rol, id];
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete user' }); }
});

// --- Products CRUD ---

// GET all products
app.get('/api/products', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  try {
    const { all } = req.query;
    let query = `
      SELECT p.*,
        (SELECT MIN(pv.precio) FROM product_variations pv WHERE pv.product_id = p.id) AS min_v_price,
        (SELECT COUNT(*) FROM product_variations pv WHERE pv.product_id = p.id) AS variaciones_count
      FROM products p
      WHERE p.deleted_at IS NULL
    `;
    
    if (all !== 'true') {
      query += ` AND p.es_publico = true`;
    }
    
    query += ` ORDER BY p.created_at DESC`;

    const result = await pool.query(query);
    
    // Fallback: If main price is null or 0 (common in variable products), use the min variation price
    const products = result.rows.map(p => ({
      ...p,
      precio: (p.precio && parseFloat(p.precio) > 0) ? p.precio : p.min_v_price
    }));
    
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product with variations
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const product = await pool.query('SELECT * FROM products WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (product.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    const variations = await pool.query('SELECT * FROM product_variations WHERE product_id = $1 ORDER BY id', [id]);
    res.json({ ...product.rows[0], variaciones: variations.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST create product
app.post('/api/products', upload.any(), async (req, res) => {
  const { nombre, descripcion, precio, stock, envio_especial, es_variable, es_publico, slug, atributos, variaciones, tienda, flag, preventa_inicio, preventa_fin, peso, descuento } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

  const files = req.files || [];
  const imagen_url   = files.find(f => f.fieldname === 'imagen')?.path || null;
  const galeria_urls = files.filter(f => f.fieldname === 'galeria').map(f => f.path);
  const varImgMap    = {};
  files.filter(f => f.fieldname.startsWith('varImg_')).forEach(f => {
    const idx = parseInt(f.fieldname.replace('varImg_', ''));
    varImgMap[idx] = f.path;
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const productSlug = slug || nombre
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    const result = await client.query(
      `INSERT INTO products (nombre, descripcion, precio, stock, envio_especial, es_variable, es_publico, slug, imagen_url, galeria_urls, atributos, tienda, flag, preventa_inicio, preventa_fin, peso, descuento)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [
        nombre, descripcion || null,
        precio ? parseFloat(precio) : null,
        stock ? parseInt(stock) : 0,
        envio_especial ? parseFloat(envio_especial) : null,
        es_variable === 'true', es_publico !== 'false',
        productSlug, imagen_url, JSON.stringify(galeria_urls),
        atributos || null, tienda || 'General', flag || null,
        (flag === 'Preventa' && preventa_inicio) ? preventa_inicio : null,
        (flag === 'Preventa' && preventa_fin)    ? preventa_fin    : null,
        peso ? parseFloat(peso) : 0,
        descuento ? parseInt(descuento) : 0
      ]
    );

    const product = result.rows[0];

    if (es_variable === 'true' && variaciones) {
      const vars = JSON.parse(variaciones);
      for (let i = 0; i < vars.length; i++) {
        const v = vars[i];
        // Use newly uploaded Cloudinary URL, or existing URL (not blobs)
        const varImg = varImgMap[i] || (v.imagen_url && !v.imagen_url.startsWith('blob:') ? v.imagen_url : null);
        await client.query(
          `INSERT INTO product_variations (product_id, valor, precio, stock, color, imagen_url, peso)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [product.id, v.valor, v.precio ? parseFloat(v.precio) : null, v.stock ? parseInt(v.stock) : 0, v.color || null, varImg, v.peso ? parseFloat(v.peso) : 0]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create product', details: err.message });
  } finally {
    client.release();
  }
});

// PUT update product
app.put('/api/products/:id', upload.any(), async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, envio_especial, es_variable, es_publico, slug, atributos, variaciones, tienda, flag, preventa_inicio, preventa_fin, peso, descuento } = req.body;

  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

  const files = req.files || [];
  const varImgMap = {};
  files.filter(f => f.fieldname.startsWith('varImg_')).forEach(f => {
    const idx = parseInt(f.fieldname.replace('varImg_', ''));
    varImgMap[idx] = f.path;
  });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const productSlug = slug || nombre
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');

    const existing = await client.query('SELECT imagen_url, galeria_urls FROM products WHERE id = $1', [id]);
    if (existing.rows.length === 0) throw new Error('Product not found');

    let imagen_url = existing.rows[0].imagen_url;
    if (req.body.imagen_eliminada === 'true') {
      imagen_url = null;
    }
    const newMainImg = files.find(f => f.fieldname === 'imagen');
    if (newMainImg) imagen_url = newMainImg.path;

    let galeria_urls = req.body.galeria_existente ? JSON.parse(req.body.galeria_existente) : existing.rows[0].galeria_urls || [];
    const newGaleria = files.filter(f => f.fieldname === 'galeria');
    if (newGaleria.length) galeria_urls = [...galeria_urls, ...newGaleria.map(f => f.path)];

    const result = await client.query(
      `UPDATE products SET nombre=$1, descripcion=$2, precio=$3, stock=$4, envio_especial=$5, es_variable=$6, es_publico=$7, slug=$8, imagen_url=$9, galeria_urls=$10, atributos=$11, tienda=$13, flag=$14, preventa_inicio=$15, preventa_fin=$16, peso=$17, descuento=$18
       WHERE id=$12 RETURNING *`,
      [
        nombre, descripcion || null,
        precio ? parseFloat(precio) : null,
        stock ? parseInt(stock) : 0,
        envio_especial ? parseFloat(envio_especial) : null,
        es_variable === 'true', es_publico !== 'false',
        productSlug, imagen_url, JSON.stringify(galeria_urls),
        atributos || null, id, tienda || 'General', flag || null,
        (flag === 'Preventa' && preventa_inicio) ? preventa_inicio : null,
        (flag === 'Preventa' && preventa_fin)    ? preventa_fin    : null,
        peso ? parseFloat(peso) : 0,
        descuento ? parseInt(descuento) : 0
      ]
    );

    const product = result.rows[0];

    await client.query('DELETE FROM product_variations WHERE product_id = $1', [id]);
    if (es_variable === 'true' && variaciones) {
      const vars = JSON.parse(variaciones);
      for (let i = 0; i < vars.length; i++) {
        const v = vars[i];
        const varImg = varImgMap[i] || (v.imagen_url && !v.imagen_url.startsWith('blob:') ? v.imagen_url : null);
        await client.query(
          `INSERT INTO product_variations (product_id, valor, precio, stock, color, imagen_url, peso)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [product.id, v.valor, v.precio ? parseFloat(v.precio) : null, v.stock ? parseInt(v.stock) : 0, v.color || null, varImg, v.peso ? parseFloat(v.peso) : 0]
        );
      }
    }

    await client.query('COMMIT');
    res.json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  } finally {
    client.release();
  }
});

// DELETE product (Soft Delete)
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE products SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});
// Import CSV products
app.post('/api/products/migrar-csv', localUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const baseProducts = results.filter(r => r.Type === 'simple' || r.Type === 'variable');
        const variations = results.filter(r => r.Type === 'variation');

        const insertedProductsMap = {};

        for (const row of baseProducts) {
          const nombre = row.Name || 'Sin Nombre';
          const descripcion = row['Short description'] || row.Description || null;
          const precio = row['Regular price'] || row['Sale price'] || 0;
          const stock = parseInt(row.Stock) || 0;
          const peso = parseFloat(row['Weight (kg)']) || 0;
          const es_publico = row.Published === '1';
          const es_variable = row.Type === 'variable';
          const tienda = row.Categories || 'General';
          
          let imagen_url = null;
          let galeria_urls = [];
          if (row.Images) {
            const urls = row.Images.split(',').map(s => s.trim()).filter(s => s);
            if (urls.length > 0) {
              imagen_url = urls[0];
              galeria_urls = urls.slice(1);
            }
          }

          let atributos = null;
          if (es_variable && row['Attribute 1 name'] && row['Attribute 1 value(s)']) {
            atributos = JSON.stringify([{
              nombre: row['Attribute 1 name'],
              opciones: row['Attribute 1 value(s)'].split(',').map(s => s.trim())
            }]);
          }

          const productSlug = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

          const query = `
            INSERT INTO products (nombre, descripcion, precio, stock, es_variable, es_publico, slug, imagen_url, galeria_urls, atributos, tienda, peso)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (slug) DO UPDATE SET
              nombre = EXCLUDED.nombre,
              descripcion = EXCLUDED.descripcion,
              precio = EXCLUDED.precio,
              stock = EXCLUDED.stock,
              es_variable = EXCLUDED.es_variable,
              es_publico = EXCLUDED.es_publico,
              imagen_url = EXCLUDED.imagen_url,
              galeria_urls = EXCLUDED.galeria_urls,
              atributos = EXCLUDED.atributos,
              tienda = EXCLUDED.tienda,
              peso = EXCLUDED.peso,
              deleted_at = NULL
            RETURNING id`;
          const values = [nombre, descripcion, parseFloat(precio) || 0, stock, es_variable, es_publico, productSlug, imagen_url, JSON.stringify(galeria_urls), atributos, tienda, peso];
          
          const result = await client.query(query, values);
          insertedProductsMap[nombre.trim()] = result.rows[0].id;
        }

        for (const row of variations) {
          const varName = row.Name || '';
          let baseName = null;
          let baseId = null;
          
          for (const name of Object.keys(insertedProductsMap)) {
            if (varName.startsWith(name)) {
              baseName = name;
              baseId = insertedProductsMap[name];
              break;
            }
          }

          if (baseId) {
            const valor = row['Attribute 1 value(s)'] || varName.replace(`${baseName} - `, '').trim();
            const precio = row['Regular price'] || row['Sale price'] || null;
            const stock = parseInt(row.Stock) || 0;
            const peso = parseFloat(row['Weight (kg)']) || 0;
            
            await client.query(
              `INSERT INTO product_variations (product_id, valor, precio, stock, peso) VALUES ($1, $2, $3, $4, $5)`,
              [baseId, valor, precio ? parseFloat(precio) : null, stock, peso]
            );
          }
        }

        await client.query('COMMIT');
        try { fs.unlinkSync(req.file.path); } catch(e){} 
        res.json({ message: 'Migración completada', count: baseProducts.length + variations.length });
      } catch (error) {
        await client.query('ROLLBACK');
        try { fs.unlinkSync(req.file.path); } catch(e){}
        console.error('Error migrando CSV:', error);
        res.status(500).json({ error: 'Error procesando CSV', details: error.message });
      } finally {
        client.release();
      }
    });
});

// Upload image only
app.post('/api/upload', upload.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: req.file.path, public_id: req.file.filename });
});

// Contact route
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Nombre, correo y mensaje son requeridos' });
  }
  const subjectMap = {
    pedido: 'Duda sobre mi pedido',
    maquila: 'Cotización de Maquila',
    otro: 'Otro'
  };
  const displaySubject = subjectMap[subject] || subject || 'Sin asunto';

  try {
    await mailer.sendMail({
      from: `"Contacto Amigo Merch" <${process.env.SMTP_USER}>`,
      to: 'amigomerchmx@gmail.com',
      replyTo: email,
      subject: displaySubject,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <div style="display: flex; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #237650; padding-bottom: 15px;">
            <img src="https://www.amigomerch.mx/logo.png" alt="Amigo Merch" style="height: 40px; margin-right: 15px;">
            <h2 style="color:#237650; margin: 0;">Amigo Merch | Soporte</h2>
          </div>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Correo:</strong> ${email}</p>
          <p><strong>Asunto:</strong> ${displaySubject}</p>
          <p><strong>Mensaje:</strong></p>
          <p style="white-space: pre-wrap; background:#f9f9f9; padding: 15px; border-radius: 8px;">${message}</p>
        </div>
      `,
    });
    res.json({ success: true, message: 'Mensaje enviado correctamente' });
  } catch (err) {
    console.error('[CONTACT EMAIL ERROR]', err);
    res.status(500).json({ error: 'Error enviando el mensaje' });
  }
});

// Basic routes
app.get('/', (_req, res) => res.json({ message: 'Amigo Merch API is running' }));

app.get('/db-test', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'Connected', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// --- Tiendas CRUD ---

// GET all tiendas
app.get('/api/tiendas', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tiendas WHERE deleted_at IS NULL ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tiendas' });
  }
});

// GET single tienda
app.get('/api/tiendas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM tiendas WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tienda no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch tienda' });
  }
});

// POST create tienda
app.post('/api/tiendas', upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'header', maxCount: 1 }]), async (req, res) => {
  try {
    const { nombre, publico } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });
    const imagen_url = req.files?.imagen?.[0]?.path || null;
    const header_url = req.files?.header?.[0]?.path || null;
    const result = await pool.query(
      'INSERT INTO tiendas (nombre, publico, imagen_url, header_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, publico === 'true', imagen_url, header_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create tienda', details: err.message });
  }
});

// PUT update tienda
app.put('/api/tiendas/:id', upload.fields([{ name: 'imagen', maxCount: 1 }, { name: 'header', maxCount: 1 }]), async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, publico } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

    const existing = await pool.query('SELECT imagen_url, header_url FROM tiendas WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Tienda no encontrada' });

    const imagen_url = req.files?.imagen?.[0]?.path ?? existing.rows[0].imagen_url;
    const header_url = req.files?.header?.[0]?.path ?? existing.rows[0].header_url;

    const result = await pool.query(
      'UPDATE tiendas SET nombre = $1, publico = $2, imagen_url = $3, header_url = $4 WHERE id = $5 RETURNING *',
      [nombre, publico === 'true', imagen_url, header_url, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update tienda', details: err.message });
  }
});

// DELETE tienda
app.delete('/api/tiendas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE tiendas SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    res.json({ message: 'Tienda eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete tienda' });
  }
});

// --- Pedidos CRUD ---

// GET all pedidos
app.get('/api/pedidos', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM pedidos ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pedidos' });
  }
});

// GET pedido by orden number (public tracker – only safe fields returned)
app.get('/api/pedidos/orden/:orden', async (req, res) => {
  try {
    const { orden } = req.params;
    const result = await pool.query(
      'SELECT id, orden, nombre, estado, created_at FROM pedidos WHERE UPPER(orden) = UPPER($1)',
      [orden.trim()]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pedido' });
  }
});

// GET single pedido
app.get('/api/pedidos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch pedido' });
  }
});

// POST create pedido
app.post('/api/pedidos', async (req, res) => {
  try {
    const { nombre, correo, telefono, pais, estado_env, ciudad, calle, num_ext, num_int, colonia, cp, domicilio, notas, items, subtotal, envio, total } = req.body;
    
    // Generar un número de orden único corto
    const orden = Math.floor(100000 + Math.random() * 900000).toString();

    const result = await pool.query(
      `INSERT INTO pedidos (orden, nombre, correo, telefono, pais, estado_env, ciudad, calle, num_ext, num_int, colonia, cp, domicilio, notas, items, subtotal, envio, total, estado) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) RETURNING *`,
      [orden, nombre, correo, telefono, pais, estado_env, ciudad, calle, num_ext, num_int, colonia, cp, domicilio, notas, JSON.stringify(items), subtotal, envio, total, 'Pendiente de pago']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create pedido', details: err.message });
  }
});

async function manejarDescuentoStock(pedidoId, nuevoEstado) {
  const ESTADOS_DESCUENTO = ['Nuevo', 'En proceso', 'Completado'];
  if (!ESTADOS_DESCUENTO.includes(nuevoEstado)) return;

  try {
    const pRes = await pool.query('SELECT items, stock_descontado FROM pedidos WHERE id = $1', [pedidoId]);
    if (pRes.rows.length === 0) return;
    const pedido = pRes.rows[0];

    if (pedido.stock_descontado) return; // Ya se descontó

    const items = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items || []);
    
    for (const item of items) {
      const pId = item.producto_id;
      const varName = item.variante;
      const qty = item.cantidad || 1;

      if (!pId) continue;

      const prodRes = await pool.query('SELECT es_variable FROM products WHERE id = $1', [pId]);
      if (prodRes.rows.length === 0) continue;
      const es_variable = prodRes.rows[0].es_variable;

      if (es_variable && varName) {
        await pool.query(
          'UPDATE product_variations SET stock = stock - $1 WHERE product_id = $2 AND valor = $3',
          [qty, pId, varName]
        );
      } else {
        await pool.query(
          'UPDATE products SET stock = stock - $1 WHERE id = $2',
          [qty, pId]
        );
      }
    }

    await pool.query('UPDATE pedidos SET stock_descontado = true WHERE id = $1', [pedidoId]);
    console.log(`[STOCK] Stock descontado para pedido ${pedidoId}`);
  } catch (err) {
    console.error(`[STOCK] Error al descontar stock del pedido ${pedidoId}:`, err);
  }
}

// PUT update pedido estado (+ dispara correo según el estado)
app.put('/api/pedidos/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const VALID = ['Pendiente de pago', 'Nuevo', 'En proceso', 'Completado', 'Fallido', 'Cancelado'];
    if (!VALID.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    const result = await pool.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    const pedido = result.rows[0];
    
    // Descontar stock si aplica
    await manejarDescuentoStock(id, estado);

    // Enviar correo en background (no bloqueamos la respuesta)
    sendStatusEmail(pedido, estado).catch(console.error);

    res.json({ ...pedido, emailEnviado: !!EMAIL_TRIGGERS[estado] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update pedido estado' });
  }
});

// --- Envia.com API Integration ---

const getEnviaPayload = async (pedido) => {
  let totalWeight = 0;
  for (const item of (pedido.items || [])) {
    const prodId = item.producto_id || item.id;
    if (isNaN(parseInt(prodId, 10))) continue; // Evitar error de postgres si el ID es un string alfa
    const pRes = await pool.query('SELECT peso FROM products WHERE id = $1', [parseInt(prodId, 10)]);
    const pPeso = pRes.rows[0]?.peso ? parseFloat(pRes.rows[0].peso) : 1;
    totalWeight += pPeso * item.cantidad;
  }
  if (totalWeight < 1) totalWeight = 1;

  const map = {
    'aguascalientes': 'AG', 'baja california': 'BC', 'baja california sur': 'BS',
    'campeche': 'CM', 'chiapas': 'CS', 'chihuahua': 'CH', 'ciudad de mexico': 'CX', 'ciudad de méxico': 'CX', 'cdmx': 'CX',
    'coahuila': 'CO', 'colima': 'CL', 'durango': 'DG', 'estado de mexico': 'EM', 'estado de méxico': 'EM',
    'guanajuato': 'GT', 'guerrero': 'GR', 'hidalgo': 'HG', 'jalisco': 'JA', 'michoacan': 'MI', 'michoacán': 'MI',
    'morelos': 'MO', 'nayarit': 'NA', 'nuevo leon': 'NL', 'nuevo león': 'NL', 'oaxaca': 'OA', 'puebla': 'PU',
    'queretaro': 'QT', 'querétaro': 'QT', 'quintana roo': 'QR', 'san luis potosi': 'SL', 'san luis potosí': 'SL',
    'sinaloa': 'SI', 'sonora': 'SO', 'tabasco': 'TB', 'tamaulipas': 'TM', 'tlaxcala': 'TL', 'veracruz': 'VE',
    'yucatan': 'YU', 'yucatán': 'YU', 'zacatecas': 'ZA'
  };
  const stateCode = map[(pedido.estado_env || '').toLowerCase().trim()] || 'JA';

  return {
    origin: {
      name: 'Amigo Merch', company: 'Amigo Merch', email: 'amigomerchmx@gmail.com', phone: '3312345678',
      street: 'Bodega Principal', number: '1', district: 'Centro', city: 'Zapopan', state: 'JA', country: 'MX', postalCode: '45200', reference: ''
    },
    destination: {
      name: pedido.nombre, company: '', email: pedido.correo || 'amigomerchmx@gmail.com', phone: pedido.telefono || '3300000000',
      street: pedido.calle || 'Conocida', number: pedido.num_ext || 'SN', district: pedido.colonia || 'Centro', city: pedido.ciudad || 'Ciudad', state: stateCode, country: pedido.pais === 'Mexico' ? 'MX' : 'MX', postalCode: pedido.cp || '00000', reference: pedido.notas || ''
    },
    packages: [{
      content: 'Ropa y Accesorios', amount: 1, type: 'box', weight: totalWeight, insurance: 0, declaredValue: parseFloat(pedido.total), weightUnit: 'KG', lengthUnit: 'CM', dimensions: { length: 30, width: 20, height: 10 }
    }],
    settings: { printFormat: 'PDF', printSize: 'STOCK_4X6' }
  };
};

app.post('/api/pedidos/:id/cotizar-envio', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });

    const payload = await getEnviaPayload(rows[0]);
    const enviaApiUrl = process.env.ENVIA_API_URL || 'https://api-test.envia.com';
    const enviaApiKey = process.env.ENVIA_API_KEY;
    console.log(`[Envia] Usando entorno: ${enviaApiUrl}`);
    const enviaQueriesUrl = enviaApiUrl.includes('api-test') ? 'https://queries-test.envia.com' : 'https://queries.envia.com';

    // Override package weight/dims if custom values sent from frontend
    if (req.body.peso || req.body.dims) {
      const { peso, dims } = req.body;
      if (payload.packages && payload.packages.length > 0) {
        if (peso)         payload.packages[0].weight = parseFloat(peso) || payload.packages[0].weight;
        if (dims?.length) payload.packages[0].dimensions.length = parseInt(dims.length) || payload.packages[0].dimensions.length;
        if (dims?.width)  payload.packages[0].dimensions.width  = parseInt(dims.width)  || payload.packages[0].dimensions.width;
        if (dims?.height) payload.packages[0].dimensions.height = parseInt(dims.height) || payload.packages[0].dimensions.height;
      }
    }

    // Override origin if a specific bodega was selected from the frontend
    if (req.body.origen) {
      const o = req.body.origen;
      payload.origin = {
        name:       o.nombre   || payload.origin.name,
        company:    o.company  || payload.origin.company,
        email:      o.email    || payload.origin.email,
        phone:      o.phone    || payload.origin.phone,
        street:     o.street   || payload.origin.street,
        number:     o.number   || payload.origin.number,
        district:   o.district || payload.origin.district,
        city:       o.city     || payload.origin.city,
        state:      o.state    || payload.origin.state,
        country:    o.country  || 'MX',
        postalCode: o.postalCode || payload.origin.postalCode,
        reference:  o.reference || ''
      };
    }

    // Step 1: Dynamically fetch all active carriers for this account
    let carrierList = [];
    try {
      const carriersRes = await fetch(`${enviaQueriesUrl}/carrier?country_code=MX`, {
        headers: { 'Authorization': `Bearer ${enviaApiKey}` }
      });
      const carriersData = await carriersRes.json();
      if (Array.isArray(carriersData.data)) {
        carrierList = carriersData.data.map(c => c.carrier_code || c.code || c.name).filter(Boolean);
      }
    } catch (e) {
      console.warn('Could not fetch carrier list from Envia, will try without carrier filter:', e.message);
    }

    let rates = [];

    // Step 2a: Try a single multicarrier call (no carrier specified) — returns all available rates
    try {
      const multiPayload = { ...payload };
      // Remove shipment field to let Envia return all carriers
      delete multiPayload.shipment;
      const response = await fetch(`${enviaApiUrl}/ship/rate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${enviaApiKey}` },
        body: JSON.stringify(multiPayload)
      });
      const data = await response.json();
      if (data.meta === 'rate' && Array.isArray(data.data) && data.data.length > 0) {
        rates = data.data;
      }
    } catch (e) {
      console.warn('Multicarrier rate call failed, falling back to per-carrier calls:', e.message);
    }

    // Step 2b: Fallback — if multicarrier call returned nothing, iterate over each carrier individually
    if (rates.length === 0 && carrierList.length > 0) {
      for (const carrier of carrierList) {
        try {
          const ratePayload = { ...payload, shipment: { carrier, type: 1 } };
          const response = await fetch(`${enviaApiUrl}/ship/rate/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${enviaApiKey}` },
            body: JSON.stringify(ratePayload)
          });
          const data = await response.json();
          if (data.meta === 'rate' && Array.isArray(data.data) && data.data.length > 0) {
            rates.push(...data.data);
          }
        } catch (e) { console.error(`Error rating carrier ${carrier}:`, e.message); }
      }
    }

    res.json({ rates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to quote shipping' });
  }
});

app.post('/api/pedidos/:id/generar-guia', async (req, res) => {
  try {
    const { id } = req.params;
    const { carrier, service } = req.body;
    
    const { rows } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    
    if (rows[0].tracking_number) {
      return res.status(400).json({ error: 'Este pedido ya tiene una guía generada' });
    }

    const payload = await getEnviaPayload(rows[0]);
    payload.shipment = { carrier, service, type: 1 };

    const response = await fetch(`${process.env.ENVIA_API_URL}/ship/generate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.ENVIA_API_KEY}` },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (data.meta !== 'generate') {
      return res.status(400).json({ error: 'Error al generar la guía con Envia.com', details: data.error || data });
    }

    const trackingNumber = data.data[0].trackingNumber;
    const guiaUrl = data.data[0].label;

    const result = await pool.query(
      'UPDATE pedidos SET tracking_number = $1, guia_url = $2, carrier = $3 WHERE id = $4 RETURNING *',
      [trackingNumber, guiaUrl, carrier, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate label' });
  }
});

app.post('/api/pedidos/:id/cancelar-guia', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Pedido no encontrado' });
    
    const pedido = rows[0];
    if (!pedido.tracking_number) return res.status(400).json({ error: 'Este pedido no tiene guía activa para cancelar' });

    // Determinar carrier (si es guía vieja, viene en el body manual)
    const activeCarrier = pedido.carrier || req.body.carrier;
    if (!activeCarrier) {
      return res.status(400).json({ error: 'Falta la paquetería (carrier) para poder cancelar esta guía antigua.' });
    }

    // Cancelar en Envia.com
    const response = await fetch(`${process.env.ENVIA_API_URL}/ship/cancel/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.ENVIA_API_KEY}` },
      body: JSON.stringify({ carrier: activeCarrier, tracking_number: pedido.tracking_number })
    });
    const cancelData = await response.json();
    
    // Si la respuesta no indica éxito, retornar error (Envia puede rechazar si ya va en camino)
    if (!response.ok) {
      return res.status(400).json({ error: 'Error al cancelar en Envia.com', details: cancelData });
    }

    // Agregar al historial de canceladas
    const canceledGuide = {
      tracking_number: pedido.tracking_number,
      guia_url: pedido.guia_url,
      carrier: activeCarrier,
      fecha_cancelacion: new Date().toISOString()
    };
    
    const guiasCanceladas = pedido.guias_canceladas || [];
    guiasCanceladas.push(canceledGuide);

    // Actualizar pedido en BD
    const result = await pool.query(
      'UPDATE pedidos SET tracking_number = NULL, guia_url = NULL, carrier = NULL, guias_canceladas = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(guiasCanceladas), id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel label' });
  }
});

// GET Envia.com Wallet Balance
app.get('/api/envia/saldo', async (req, res) => {
  try {
    const response = await fetch('https://queries.envia.com/user-information?encoded=false', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${process.env.ENVIA_API_KEY}` }
    });
    if (!response.ok) throw new Error('Error de conexión con Envia');
    const data = await response.json();
    res.json({ balance: data.company_balance || 0, currency: data.company_currency || 'MXN' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch Envia balance' });
  }
});

app.get('/api/webhooks/envia', (req, res) => {
  res.status(200).send('Webhook Envia GET OK');
});

app.post('/api/webhooks/envia', async (req, res) => {
  try {
    const payload = req.body;
    console.log('Webhook Envia recibido:', JSON.stringify(payload, null, 2));
    res.status(200).send('OK');

    const data = payload.data || payload;
    let trackingNumber = data.trackingNumber || data.tracking_number;
    let status = data.status || data.state || data.status_description || '';
    
    if (trackingNumber && typeof trackingNumber === 'string') {
      const { rows } = await pool.query('SELECT * FROM pedidos WHERE tracking_number = $1', [trackingNumber]);
      if (rows.length > 0) {
        const pedido = rows[0];
        status = status.toString().toLowerCase();
        
        let nuevoEstado = null;
        if (status.includes('deliver') || status.includes('entregad')) {
          nuevoEstado = 'Completado';
        } else if (status.includes('exception') || status.includes('return') || status.includes('cancel') || status.includes('devolución')) {
          nuevoEstado = 'Fallido';
        }

        if (nuevoEstado && pedido.estado !== nuevoEstado) {
          await pool.query('UPDATE pedidos SET estado = $1 WHERE id = $2', [nuevoEstado, pedido.id]);
          console.log(`[Webhook] Pedido ${pedido.id} actualizado a ${nuevoEstado} por tracking ${trackingNumber}`);
        }
      }
    }
  } catch (err) {
    console.error('Error en webhook de envia:', err);
  }
});

// --- Boletines CRUD ---

// GET all boletines
app.get('/api/boletines', async (_req, res) => {
  try {
    const r = await pool.query('SELECT id, asunto, estado, created_at, sent_at FROM boletines ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch boletines' }); }
});

// GET single boletin
app.get('/api/boletines/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM boletines WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch boletin' }); }
});

// POST create boletin (borrador)
app.post('/api/boletines', async (req, res) => {
  const { asunto = '', html = '' } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO boletines (asunto, html, estado) VALUES ($1, $2, $3) RETURNING *',
      [asunto.trim(), html, 'Borrador']
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create boletin' }); }
});

// PATCH update boletin (asunto, html, estado)
app.patch('/api/boletines/:id', async (req, res) => {
  const { asunto, html, estado } = req.body;
  const VALID_ESTADOS = ['Borrador', 'Programado', 'Enviado'];
  if (estado && !VALID_ESTADOS.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });
  try {
    const r = await pool.query(
      `UPDATE boletines SET
        asunto     = COALESCE($1, asunto),
        html       = COALESCE($2, html),
        estado     = COALESCE($3, estado)
       WHERE id = $4 RETURNING *`,
      [asunto ?? null, html ?? null, estado ?? null, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(r.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update boletin' }); }
});

// DELETE boletin
app.delete('/api/boletines/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM boletines WHERE id = $1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete boletin' }); }
});

// POST enviar boletin a todos los suscriptores
app.post('/api/boletines/:id/enviar', async (req, res) => {
  try {
    // 1. Obtener el boletín
    const bRes = await pool.query('SELECT * FROM boletines WHERE id = $1', [req.params.id]);
    if (!bRes.rows.length) return res.status(404).json({ error: 'Boletín no encontrado' });
    const boletin = bRes.rows[0];

    if (boletin.estado === 'Enviado') {
      return res.status(400).json({ error: 'Este boletín ya fue enviado anteriormente.' });
    }

    // 2. Obtener suscriptores filtrados por destinatarios seleccionados
    const sRes = await pool.query('SELECT nombre, correo FROM suscriptores ORDER BY created_at ASC');
    let suscriptores = sRes.rows;

    // Si el cliente envió una lista de destinatarios, filtramos
    const { destinatarios } = req.body;
    if (Array.isArray(destinatarios) && destinatarios.length > 0) {
      const setDest = new Set(destinatarios.map(d => d.toLowerCase()));
      suscriptores = suscriptores.filter(s => setDest.has(s.correo.toLowerCase()));
    }

    if (suscriptores.length === 0) {
      return res.status(400).json({ error: 'No hay destinatarios seleccionados o ninguno coincide con suscriptores registrados.' });
    }

    // 3. Enviar correos (en paralelo con Promise.allSettled para no fallar si uno falla)
    let enviados = 0;
    let fallidos = 0;

    if (process.env.SMTP_USER) {
      const results = await Promise.allSettled(
        suscriptores.map(s =>
          mailer.sendMail({
            from:    `"Amigo Merch" <${process.env.SMTP_USER}>`,
            to:      s.correo,
            subject: boletin.asunto,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
                ${boletin.html}
                <hr style="border:none;border-top:1px solid #eee;margin:32px 0;">
                <p style="color:#aaa;font-size:11px;text-align:center;">
                  Hola ${s.nombre}, recibiste este correo porque estás suscrito al newsletter de Amigo Merch.<br>
                  <a href="#" style="color:#aaa;">Cancelar suscripción</a>
                </p>
              </div>
            `,
          })
        )
      );
      enviados = results.filter(r => r.status === 'fulfilled').length;
      fallidos = results.filter(r => r.status === 'rejected').length;
    } else {
      console.log(`[EMAIL SKIPPED] No SMTP_USER. Would send "${boletin.asunto}" to ${suscriptores.length} suscriptores.`);
      enviados = suscriptores.length; // simular éxito en dev
    }

    // 4. Actualizar estado del boletín a Enviado
    await pool.query(
      "UPDATE boletines SET estado = 'Enviado', sent_at = NOW() WHERE id = $1",
      [req.params.id]
    );

    res.json({
      ok:        true,
      enviados,
      fallidos,
      total:     suscriptores.length,
      emailReal: !!process.env.SMTP_USER,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar el boletín.' });
  }
});


// --- Clientes (derivados de pedidos + historicos) ---

// Import CSV customers
app.post('/api/clientes/migrar-csv', localUpload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        for (const row of results) {
          const email = row.Email ? row.Email.trim() : null;
          if (!email) continue;
          
          const nombre = row.Name || row['\uFEFFName'] || row.Username || 'Sin Nombre';
          const pedidos_hist = parseInt(row.Orders) || 0;
          const gastado_hist = parseFloat(row['Total Spend']) || 0;
          const ciudad = row.City || null;
          const estado = row.Region || null;
          const pais = row['Country / Region'] || null;
          const cp = row['Postal Code'] || null;

          const query = `
            INSERT INTO clientes (correo, nombre, ciudad, estado, pais, codigo_postal, total_pedidos_historico, total_gastado_historico)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (correo) DO UPDATE SET
              nombre = COALESCE(EXCLUDED.nombre, clientes.nombre),
              ciudad = EXCLUDED.ciudad,
              estado = EXCLUDED.estado,
              pais = EXCLUDED.pais,
              codigo_postal = EXCLUDED.codigo_postal,
              total_pedidos_historico = EXCLUDED.total_pedidos_historico,
              total_gastado_historico = EXCLUDED.total_gastado_historico
          `;
          await client.query(query, [email, nombre, ciudad, estado, pais, cp, pedidos_hist, gastado_hist]);
        }

        await client.query('COMMIT');
        try { fs.unlinkSync(req.file.path); } catch(e){} 
        res.json({ message: 'Migración de clientes completada', count: results.length });
      } catch (error) {
        await client.query('ROLLBACK');
        try { fs.unlinkSync(req.file.path); } catch(e){}
        console.error('Error migrando CSV de clientes:', error);
        res.status(500).json({ error: 'Error procesando CSV', details: error.message });
      } finally {
        client.release();
      }
    });
});


// GET all clientes – agrupados por correo desde la tabla pedidos + historico de clientes
app.get('/api/clientes', async (_req, res) => {
  try {
    const result = await pool.query(`
      WITH clientes_agrupados AS (
          SELECT
              correo,
              MAX(nombre) AS nombre,
              MAX(telefono) AS telefono,
              COUNT(*)::int AS pedidos_app,
              SUM(total)::numeric AS gastado_app,
              MIN(created_at) AS primera_compra,
              MAX(created_at) AS ultima_compra
          FROM pedidos
          GROUP BY correo
      )
      SELECT
          COALESCE(c.correo, p.correo) AS correo,
          COALESCE(p.nombre, c.nombre) AS nombre,
          COALESCE(p.telefono, c.telefono) AS telefono,
          (COALESCE(c.total_pedidos_historico, 0) + COALESCE(p.pedidos_app, 0)) AS total_pedidos,
          (COALESCE(c.total_gastado_historico, 0) + COALESCE(p.gastado_app, 0)) AS total_gastado,
          COALESCE(p.primera_compra, c.created_at) AS primera_compra,
          COALESCE(p.ultima_compra, c.ultima_actividad) AS ultima_compra
      FROM clientes c
      FULL OUTER JOIN clientes_agrupados p ON LOWER(c.correo) = LOWER(p.correo)
      ORDER BY ultima_compra DESC NULLS LAST
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch clientes' });
  }
});

// GET detalle de un cliente: todos sus pedidos ordenados desc
app.get('/api/clientes/:correo', async (req, res) => {
  try {
    const { correo } = req.params;
    
    const clienteRes = await pool.query('SELECT * FROM clientes WHERE LOWER(correo) = LOWER($1)', [correo]);
    const historico = clienteRes.rows[0] || null;

    const pedidosRes = await pool.query(
      `SELECT id, orden, nombre, correo, telefono, ciudad, estado, total, created_at
       FROM pedidos
       WHERE LOWER(correo) = LOWER($1)
       ORDER BY created_at DESC`,
      [correo]
    );

    if (pedidosRes.rows.length === 0 && !historico) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({
      historico,
      pedidos: pedidosRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch cliente pedidos' });
  }
});

// --- Suscriptores ---


// GET all suscriptores
app.get('/api/suscriptores', async (_req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, correo, created_at FROM suscriptores ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch suscriptores' });
  }
});

// POST create suscriptor
app.post('/api/suscriptores', async (req, res) => {
  const { nombre, correo } = req.body;
  if (!nombre || !correo) return res.status(400).json({ error: 'Nombre y correo son requeridos' });
  try {
    // Generate a random 8-char alphanumeric ID
    const id = Math.random().toString(36).substring(2, 10).toUpperCase();
    const result = await pool.query(
      'INSERT INTO suscriptores (id, nombre, correo) VALUES ($1, $2, $3) RETURNING *',
      [id, nombre.trim(), correo.trim().toLowerCase()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Este correo ya está registrado' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create suscriptor' });
  }
});

// DELETE suscriptor
app.delete('/api/suscriptores/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM suscriptores WHERE id = $1', [id]);
    res.json({ message: 'Suscriptor eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete suscriptor' });
  }
});

// --- Estadísticas ---
app.get('/api/estadisticas/live', async (_req, res) => {
  try {
    // 1. Pedidos Nuevos
    const pnRes = await pool.query("SELECT COUNT(*) FROM pedidos WHERE estado = 'Nuevo'");
    const pedidosNuevos = parseInt(pnRes.rows[0].count, 10);

    // 2. Ingresos del día
    // 'CURRENT_DATE' usa la zona horaria del servidor
    const indRes = await pool.query("SELECT SUM(total) FROM pedidos WHERE DATE(created_at) = CURRENT_DATE AND estado NOT IN ('Cancelado', 'Fallido')");
    const ingresosHoy = parseFloat(indRes.rows[0].sum || 0);

    // 3. Best Seller (Producto más vendido activo)
    const bsRes = await pool.query(`
      SELECT p.id, p.nombre, p.imagen_principal, p.precio, SUM((i->>'cantidad')::int) as vendidos
      FROM pedidos ped
      CROSS JOIN json_array_elements(ped.items::json) as i
      JOIN productos p ON (i->>'id')::int = p.id
      WHERE p.activo = true AND ped.estado NOT IN ('Cancelado', 'Fallido')
      GROUP BY p.id, p.nombre, p.imagen_principal, p.precio
      ORDER BY vendidos DESC
      LIMIT 1
    `);
    const bestSeller = bsRes.rows.length ? bsRes.rows[0] : null;

    res.json({
      pedidosNuevos,
      ingresosHoy,
      bestSeller
    });
  } catch (err) {
    console.error('Error fetching estadisticas:', err);
    res.status(500).json({ error: 'Failed to fetch estadisticas' });
  }
});

// Ventas por mes (Cardiograma)
app.get('/api/estadisticas/ventas-mes', async (req, res) => {
  try {
    const today = new Date();
    const year = parseInt(req.query.anio) || today.getFullYear();
    const month = parseInt(req.query.mes) || (today.getMonth() + 1);

    const result = await pool.query(`
      SELECT 
        EXTRACT(DAY FROM created_at) AS dia,
        SUM(total) AS total_dia
      FROM pedidos
      WHERE 
        EXTRACT(YEAR FROM created_at) = $1
        AND EXTRACT(MONTH FROM created_at) = $2
        AND estado NOT IN ('Cancelado', 'Fallido')
      GROUP BY dia
      ORDER BY dia ASC
    `, [year, month]);

    // Format output as array of { dia, total }
    const datosDia = result.rows.map(r => ({
      dia: parseInt(r.dia, 10),
      total: parseFloat(r.total_dia)
    }));

    res.json({ anio: year, mes: month, datos: datosDia });
  } catch (err) {
    console.error('Error fetching ventas-mes:', err);
    res.status(500).json({ error: 'Failed to fetch ventas-mes' });
  }
});

// --- Reporte de Ventas Mensuales ---
// GET /api/reportes/ventas?anio=2025&tienda_id=1&mes=Enero
app.get('/api/reportes/ventas', async (req, res) => {
  try {
    const today = new Date();
    const anio = parseInt(req.query.anio) || today.getFullYear();
    const { tienda_id, mes } = req.query;

    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    // Use EXTRACT(MONTH) to avoid locale-dependent TO_CHAR month names (English vs Spanish)
    let query = `
      SELECT
        EXTRACT(MONTH FROM p.created_at)::int AS mes_num,
        item->>'nombre' AS producto,
        SUM((item->>'cantidad')::numeric * (item->>'precio')::numeric) AS total
      FROM pedidos p
      CROSS JOIN json_array_elements(p.items::json) AS item
      WHERE
        EXTRACT(YEAR FROM p.created_at) = $1
        AND p.estado NOT IN ('Cancelado', 'Fallido')
    `;

    const params = [anio];
    let paramIdx = 2;

    // Filter by tienda using EXISTS subquery
    // NOTE: items JSON uses 'producto_id' (not 'id') for the real product ID
    if (tienda_id && tienda_id !== 'todas') {
      const tiendaRes = await pool.query('SELECT nombre FROM tiendas WHERE id = $1', [tienda_id]);
      if (tiendaRes.rows.length) {
        query += ` AND EXISTS (
          SELECT 1 FROM products WHERE id = (item->>'producto_id')::int AND tienda = $${paramIdx}
        )`;
        params.push(tiendaRes.rows[0].nombre);
        paramIdx++;
      }
    }

    // Filter by specific month number
    if (mes && mes !== 'todos') {
      const mesNum = MESES.indexOf(mes) + 1;
      if (mesNum > 0) {
        query += ` AND EXTRACT(MONTH FROM p.created_at) = $${paramIdx}`;
        params.push(mesNum);
        paramIdx++;
      }
    }

    query += `
      GROUP BY mes_num, item->>'nombre'
      ORDER BY mes_num ASC, producto ASC
    `;

    const result = await pool.query(query, params);

    // Build monthly totals for charts using Spanish month names
    const porMes = {};
    MESES.forEach(m => { porMes[m] = 0; });

    const rows = result.rows.map(r => {
      const mesNombre = MESES[r.mes_num - 1]; // Map month number → Spanish name
      const total = parseFloat(r.total);
      if (porMes[mesNombre] !== undefined) porMes[mesNombre] += total;
      return { mes: mesNombre, producto: r.producto, total };
    });

    res.json({ rows, porMes });
  } catch (err) {
    console.error('Error fetching reporte ventas:', err);
    res.status(500).json({ error: 'Failed to fetch reporte de ventas', details: err.message });
  }
});

// ── Mercado Pago ──────────────────────────────────────────────────────────

// POST /api/pagos/crear-preferencia
// Recibe los datos del pedido ya creado y devuelve el init_point de MP
app.post('/api/pagos/crear-preferencia', async (req, res) => {
  try {
    const { pedidoId, items, total, nombre, correo, envio } = req.body;

    if (!pedidoId || !items || !items.length) {
      return res.status(400).json({ error: 'Datos de pedido incompletos' });
    }

    const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5173';

    const mpItems = items.map(item => ({
      id: String(item.producto_id || item.id),
      title: item.nombre,
      quantity: Number(item.cantidad),
      unit_price: Number(item.precio),
      currency_id: 'MXN',
      picture_url: item.imagen || undefined,
    }));

    // Añadir costo de envío como item separado
    if (envio && Number(envio) > 0) {
      mpItems.push({
        id: 'envio',
        title: 'Envío',
        quantity: 1,
        unit_price: Number(envio),
        currency_id: 'MXN',
      });
    }

    const preference = new Preference(mpClient);
    const response = await preference.create({
      body: {
        items: mpItems,
        payer: {
          name: nombre,
          email: correo,
        },
        back_urls: {
          success: `${BASE_URL}/pago/exito?pedido_id=${pedidoId}`,
          failure: `${BASE_URL}/pago/fallido?pedido_id=${pedidoId}`,
          pending: `${BASE_URL}/pago/pendiente?pedido_id=${pedidoId}`,
        },
        external_reference: String(pedidoId),
        notification_url: `${process.env.SERVER_URL || 'http://localhost:3000'}/api/pagos/webhook`,
      },
    });

    res.json({
      preference_id: response.id,
      init_point: response.init_point,        // producción
      sandbox_init_point: response.sandbox_init_point, // pruebas
      public_key: process.env.MERCADOPAGO_PUBLIC_KEY,
    });
  } catch (err) {
    console.error('[MP] Error creando preferencia:', err);
    res.status(500).json({ error: 'Error al crear preferencia de pago', details: err.message });
  }
});

// GET /api/pagos/config — Obtiene la llave pública de MP
app.get('/api/pagos/config', (req, res) => {
  res.json({ public_key: process.env.MERCADOPAGO_PUBLIC_KEY });
});

// POST /api/pagos/procesar — Recibe datos del Brick y procesa el pago directo
app.post('/api/pagos/procesar', async (req, res) => {
  try {
    const { formData, pedidoId } = req.body;

    if (!formData || !pedidoId) {
      return res.status(400).json({ error: 'Faltan datos del pago o pedidoId' });
    }

    const body = {
      ...formData,
      external_reference: String(pedidoId),
      notification_url: `${process.env.SERVER_URL || 'http://localhost:3000'}/api/pagos/webhook`,
    };

    const payment = new Payment(mpClient);
    const result = await payment.create({ body });

    // result contendrá status: 'approved', 'in_process', 'rejected', etc.
    res.json(result);
  } catch (err) {
    console.error('[MP] Error procesando pago con Brick:', err);
    res.status(500).json({ error: 'Error al procesar el pago', details: err.message });
  }
});

// POST /api/pagos/webhook — Notificaciones de Mercado Pago
app.post('/api/pagos/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      const payment = new Payment(mpClient);
      const paymentData = await payment.get({ id: data.id });

      const pedidoId = paymentData.external_reference;
      const mpStatus = paymentData.status; // approved | pending | rejected | cancelled

      const ESTADO_MAP = {
        approved: 'En proceso',
        pending:  'Nuevo',
        in_process: 'Nuevo',
        rejected: 'Fallido',
        cancelled: 'Cancelado',
      };

      const nuevoEstado = ESTADO_MAP[mpStatus];
      if (pedidoId && nuevoEstado) {
        const result = await pool.query(
          'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
          [nuevoEstado, pedidoId]
        );
        if (result.rows.length > 0) {
          await manejarDescuentoStock(pedidoId, nuevoEstado);
          sendStatusEmail(result.rows[0], nuevoEstado).catch(console.error);
          console.log(`[MP WEBHOOK] Pedido ${pedidoId} → ${nuevoEstado} (MP: ${mpStatus})`);
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error('[MP WEBHOOK] Error:', err);
    res.sendStatus(200); // Siempre 200 para que MP no reintente
  }
});

// GET /api/pagos/verificar/:pedidoId — El frontend verifica el estado tras volver de MP
app.get('/api/pagos/verificar/:pedidoId', async (req, res) => {
  try {
    const { pedidoId } = req.params;
    const result = await pool.query(
      'SELECT id, orden, estado, total FROM pedidos WHERE id = $1',
      [pedidoId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar pedido' });
  }
});

// --- Configuracion ---

app.get('/api/configuracion', async (req, res) => {
  try {
    const result = await pool.query('SELECT precio_envio, envia_token, envia_modo FROM configuracion LIMIT 1');
    if (result.rows.length === 0) return res.json({ precio_envio: 150, envia_token: '', envia_modo: 'sandbox' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener configuracion' });
  }
});

app.put('/api/configuracion', async (req, res) => {
  try {
    const { precio_envio, envia_token, envia_modo } = req.body;
    let result = await pool.query('UPDATE configuracion SET precio_envio = $1, envia_token = $2, envia_modo = $3 RETURNING *', [precio_envio, envia_token, envia_modo]);
    if (result.rows.length === 0) {
      result = await pool.query('INSERT INTO configuracion (precio_envio, envia_token, envia_modo) VALUES ($1, $2, $3) RETURNING *', [precio_envio, envia_token, envia_modo]);
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar configuracion' });
  }
});

// --- Reglas de Envío ---

app.get('/api/reglas-envio', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reglas_envio ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener reglas de envio' });
  }
});

app.post('/api/reglas-envio', async (req, res) => {
  try {
    const { pais, estados, precio } = req.body;
    const result = await pool.query(
      'INSERT INTO reglas_envio (pais, estados, precio) VALUES ($1, $2, $3) RETURNING *',
      [pais, estados ? JSON.stringify(estados) : null, precio]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear regla de envio' });
  }
});

app.put('/api/reglas-envio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { pais, estados, precio } = req.body;
    const result = await pool.query(
      'UPDATE reglas_envio SET pais = $1, estados = $2, precio = $3 WHERE id = $4 RETURNING *',
      [pais, estados ? JSON.stringify(estados) : null, precio, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Regla no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar regla de envio' });
  }
});

app.delete('/api/reglas-envio/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM reglas_envio WHERE id = $1', [id]);
    res.json({ message: 'Regla eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar regla de envio' });
  }
});

// --- Envia.com Guías ---

app.post('/api/pedidos/:id/generar-guia', async (req, res) => {
  const { id } = req.params;
  try {
    const pedidoRes = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    const pedido = pedidoRes.rows[0];
    if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });

    // --- CALCULO DE PESO DINÁMICO ---
    let totalWeight = 0;
    try {
      const items = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items || []);
      
      for (const item of items) {
        let itemWeight = 0;
        
        // Check variation weight first
        if (item.variante && item.producto_id) {
           const varRes = await pool.query('SELECT peso FROM product_variations WHERE product_id = $1 AND talla = $2', [item.producto_id, item.variante]);
           if (varRes.rows.length > 0 && Number(varRes.rows[0].peso) > 0) {
             itemWeight = Number(varRes.rows[0].peso);
           }
        }
        
        // If variation weight is 0 or not found, check product weight
        if (itemWeight === 0 && item.producto_id) {
           const prodRes = await pool.query('SELECT peso FROM products WHERE id = $1', [item.producto_id]);
           if (prodRes.rows.length > 0 && Number(prodRes.rows[0].peso) > 0) {
             itemWeight = Number(prodRes.rows[0].peso);
           }
        }
        
        totalWeight += itemWeight * Number(item.cantidad || 1);
      }
    } catch (e) {
      console.error('Error calculando el peso de los items:', e);
    }
    
    // Default to 1kg if weight calculation yields 0
    if (totalWeight <= 0) totalWeight = 1;

    const enviaKey = process.env.ENVIA_API_KEY;
    const enviaUrl = process.env.ENVIA_API_URL || 'https://api-test.envia.com';
    
    if (!enviaKey) {
      return res.status(400).json({ error: 'ENVIA_API_KEY no configurada en .env' });
    }

    const payload = {
      origin: {
        name: "Amigo Merch",
        company: "Amigo Merch",
        email: "contacto@amigomerch.com",
        phone: "8100000000",
        street: "Av. Principal",
        number: "100",
        district: "Centro",
        city: "Monterrey",
        state: "NL",
        country: "MX",
        postalCode: "64000"
      },
      destination: {
        name: pedido.nombre || 'Cliente',
        company: "",
        email: pedido.correo || 'contacto@cliente.com',
        phone: pedido.telefono || '0000000000',
        street: pedido.calle || pedido.domicilio || 'Calle Conocida',
        number: pedido.num_ext || "1",
        district: pedido.colonia || 'Centro',
        city: pedido.ciudad || 'Ciudad',
        state: (pedido.estado_env && pedido.estado_env.substring(0,2).toUpperCase()) || 'XX',
        country: "MX",
        postalCode: pedido.cp || '00000'
      },
      packages: [
        {
          content: "Ropa y Accesorios",
          amount: 1,
          type: "box",
          dimensions: { length: 20, width: 20, height: 10 },
          weight: totalWeight,
          insurance: 0,
          declaredValue: Number(pedido.subtotal) || 0,
          weightUnit: "KG",
          lengthUnit: "CM"
        }
      ],
      shipment: {
        carrier: "fedex",
        service: "express",
        type: 1
      },
      settings: {
        printFormat: "PDF",
        printSize: "STOCK_4X6",
        comments: "Pedido " + pedido.orden
      }
    };

    const response = await fetch(`${enviaUrl}/ship/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${enviaKey}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    if (!response.ok || data.meta !== 'generate') {
      console.error('Envia Error:', data);
      return res.status(400).json({ error: data.error?.message || 'Error al generar la guía en Envia', details: data });
    }
    
    const tracking_number = data.data[0].trackingNumber;
    const guia_url = data.data[0].trackUrl;
    
    await pool.query('UPDATE pedidos SET tracking_number = $1, guia_url = $2 WHERE id = $3', [tracking_number, guia_url, id]);
    
    res.json({ tracking_number, guia_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al generar la guía', details: err.message });
  }
});

// --- Reporte PDF Stock ---

app.get('/api/reportes/stock-pdf', async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=reporte-stock.pdf');
    doc.pipe(res);
    
    const productsRes = await pool.query('SELECT id, nombre, es_variable, stock FROM products WHERE deleted_at IS NULL ORDER BY nombre');
    const varsRes = await pool.query('SELECT product_id, valor, color, stock FROM product_variations');
    
    let inventario = [];
    let totalPiezas = 0;
    
    for (const prod of productsRes.rows) {
      if (prod.es_variable) {
        const prodVars = varsRes.rows.filter(v => v.product_id === prod.id);
        if (prodVars.length > 0) {
          prodVars.forEach(v => {
            const varName = v.color ? `${v.valor} / ${v.color}` : v.valor;
            inventario.push({ producto: prod.nombre, variacion: varName, unidades: v.stock || 0 });
            totalPiezas += (v.stock || 0);
          });
        } else {
          inventario.push({ producto: prod.nombre, variacion: 'N/A', unidades: 0 });
        }
      } else {
        inventario.push({ producto: prod.nombre, variacion: 'N/A', unidades: prod.stock || 0 });
        totalPiezas += (prod.stock || 0);
      }
    }
    
    doc.fontSize(20).font('Helvetica').fillColor('#111827').text('Reporte de Inventario');
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Total de piezas disponibles: ${totalPiezas}`);
    doc.moveDown(1.5);
    
    const tableTop = doc.y;
    const col1X = 50;
    const col2X = 260;
    const col3X = 400;
    const rowHeight = 25;
    let y = tableTop;

    const drawHeader = (startY) => {
      doc.rect(50, startY, 512, rowHeight).fill('#237650');
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF');
      doc.text('Producto', col1X + 10, startY + 8);
      doc.text('Variación (Talla/Color)', col2X + 10, startY + 8);
      doc.text('Unidades', col3X, startY + 8, { width: 150, align: 'right' });
      return startY + rowHeight;
    };

    y = drawHeader(y);

    for (let i = 0; i < inventario.length; i++) {
      const item = inventario[i];
      
      if (y > 700) {
        doc.addPage();
        y = 50;
        y = drawHeader(y);
      }
      
      if (i % 2 !== 0) {
        doc.rect(50, y, 512, rowHeight).fill('#F9FAFB');
      } else {
        doc.rect(50, y, 512, rowHeight).fill('#FFFFFF');
      }
      
      doc.font('Helvetica').fontSize(10).fillColor('#6B7280');
      
      let pName = item.producto;
      if (pName.length > 40) pName = pName.substring(0, 37) + '...';
      let vName = item.variacion;
      if (vName.length > 25) vName = vName.substring(0, 22) + '...';
      
      doc.text(pName, col1X + 10, y + 8, { lineBreak: false });
      doc.text(vName, col2X + 10, y + 8, { lineBreak: false });
      doc.text(item.unidades.toString(), col3X, y + 8, { width: 150, align: 'right', lineBreak: false });
      
      y += rowHeight;
    }
    
    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar PDF' });
    }
  }
});

app.get('/api/reportes/inventario', async (req, res) => {
  try {
    const productsRes = await pool.query('SELECT id, nombre, es_variable, stock, tienda FROM products WHERE deleted_at IS NULL ORDER BY nombre');
    const varsRes = await pool.query('SELECT product_id, valor, color, stock FROM product_variations');
    
    let inventario = [];
    let totalPiezas = 0;
    
    for (const prod of productsRes.rows) {
      const p = {
        id: prod.id,
        producto: prod.nombre,
        tienda: prod.tienda || 'General',
        total_unidades: 0,
        variaciones: []
      };

      if (prod.es_variable) {
        const prodVars = varsRes.rows.filter(v => v.product_id === prod.id);
        if (prodVars.length > 0) {
          prodVars.forEach(v => {
            const varName = v.color ? `${v.valor} / ${v.color}` : v.valor;
            const u = v.stock || 0;
            p.variaciones.push({ nombre: varName, unidades: u });
            p.total_unidades += u;
            totalPiezas += u;
          });
        }
      } else {
        const u = prod.stock || 0;
        p.variaciones.push({ nombre: 'N/A', unidades: u });
        p.total_unidades += u;
        totalPiezas += u;
      }
      
      inventario.push(p);
    }
    
    res.json({ totalPiezas, inventario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('Global error:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Error al subir archivo', details: err.message });
  }
  res.status(500).json({ error: 'Error interno del servidor', details: err.message || err.toString() });
});

// --- Settings / Configuración ---
const initSettingsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT
      )
    `);
    // Asegurar que exista la key mantenimiento
    await pool.query(`
      INSERT INTO settings (key, value) 
      VALUES ('mantenimiento', 'false')
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('Settings table initialized');
  } catch (err) {
    console.error('Error initializing settings table:', err);
  }
};
initSettingsTable();

// GET mantenimiento status (public endpoint)
app.get('/api/settings/mantenimiento', async (_req, res) => {
  try {
    const result = await pool.query("SELECT value FROM settings WHERE key = 'mantenimiento'");
    const isMaintenance = result.rows.length > 0 && result.rows[0].value === 'true';
    res.json({ mantenimiento: isMaintenance });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT mantenimiento status
app.put('/api/settings/mantenimiento', async (req, res) => {
  try {
    const { mantenimiento } = req.body;
    await pool.query(
      "UPDATE settings SET value = $1 WHERE key = 'mantenimiento'",
      [mantenimiento === true ? 'true' : 'false']
    );
    res.json({ mantenimiento: mantenimiento === true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;


