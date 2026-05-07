require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { upload } = require('./cloudinary');
const multer = require('multer');
const nodemailer = require('nodemailer');

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
    subject: `Tu pedido #${p.orden} está en proceso — Amigo Merch`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#237650">¡Tu pedido está en preparación! 📦</h2>
        <p>Hola <strong>${p.nombre}</strong>,</p>
        <p>Tu pedido <strong>#${p.orden}</strong> ya está siendo preparado por nuestro equipo. Pronto lo enviaremos a tu domicilio.</p>
        <p style="color:#666">Puedes rastrear tu pedido en <a href="https://amigomerch.mx/rastreo" style="color:#237650">amigomerch.mx/rastreo</a> usando el número <strong>#${p.orden}</strong>.</p>
        <p>¡Gracias por tu compra!</p>
        <p style="color:#aaa;font-size:12px">Amigo Merch — hola@amigomerch.mx</p>
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
        <p>Si tienes algún problema con tu pedido, contáctanos en <a href="mailto:hola@amigomerch.mx" style="color:#237650">hola@amigomerch.mx</a>.</p>
        <p>¡Gracias por confiar en Amigo Merch! 🎉</p>
        <p style="color:#aaa;font-size:12px">Amigo Merch — hola@amigomerch.mx</p>
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
        <p>Si tienes preguntas o crees que esto es un error, contáctanos en <a href="mailto:hola@amigomerch.mx" style="color:#237650">hola@amigomerch.mx</a>.</p>
        <p style="color:#aaa;font-size:12px">Amigo Merch — hola@amigomerch.mx</p>
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
        <p>Te invitamos a intentar nuevamente o contáctanos para ayudarte: <a href="mailto:hola@amigomerch.mx" style="color:#237650">hola@amigomerch.mx</a>.</p>
        <p style="color:#aaa;font-size:12px">Amigo Merch — hola@amigomerch.mx</p>
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
app.use(express.json());

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
app.get('/api/products', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*,
        (SELECT MIN(pv.precio) FROM product_variations pv WHERE pv.product_id = p.id) AS min_v_price,
        (SELECT COUNT(*) FROM product_variations pv WHERE pv.product_id = p.id) AS variaciones_count
      FROM products p
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    `);
    
    // Fallback: If main price is null (common in variable products), use the min variation price
    const products = result.rows.map(p => ({
      ...p,
      precio: p.precio !== null && p.precio !== undefined ? p.precio : p.min_v_price
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
  const { nombre, descripcion, precio, stock, envio_especial, es_variable, es_publico, slug, atributos, variaciones, tienda, flag, preventa_inicio, preventa_fin } = req.body;

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
      `INSERT INTO products (nombre, descripcion, precio, stock, envio_especial, es_variable, es_publico, slug, imagen_url, galeria_urls, atributos, tienda, flag, preventa_inicio, preventa_fin)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        nombre, descripcion || null,
        precio ? parseFloat(precio) : null,
        stock ? parseInt(stock) : 0,
        envio_especial ? parseFloat(envio_especial) : null,
        es_variable === 'true', es_publico !== 'false',
        productSlug, imagen_url, JSON.stringify(galeria_urls),
        atributos || null, tienda || 'General', flag || null,
        (flag === 'Preventa' && preventa_inicio) ? preventa_inicio : null,
        (flag === 'Preventa' && preventa_fin)    ? preventa_fin    : null
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
          `INSERT INTO product_variations (product_id, valor, precio, stock, color, imagen_url)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [product.id, v.valor, v.precio ? parseFloat(v.precio) : null, v.stock ? parseInt(v.stock) : 0, v.color || null, varImg]
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
  const { nombre, descripcion, precio, stock, envio_especial, es_variable, es_publico, slug, atributos, variaciones, tienda, flag, preventa_inicio, preventa_fin } = req.body;

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
    const newMainImg = files.find(f => f.fieldname === 'imagen');
    if (newMainImg) imagen_url = newMainImg.path;

    let galeria_urls = existing.rows[0].galeria_urls || [];
    const newGaleria = files.filter(f => f.fieldname === 'galeria');
    if (newGaleria.length) galeria_urls = [...galeria_urls, ...newGaleria.map(f => f.path)];

    const result = await client.query(
      `UPDATE products SET nombre=$1, descripcion=$2, precio=$3, stock=$4, envio_especial=$5, es_variable=$6, es_publico=$7, slug=$8, imagen_url=$9, galeria_urls=$10, atributos=$11, tienda=$13, flag=$14, preventa_inicio=$15, preventa_fin=$16
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
        (flag === 'Preventa' && preventa_fin)    ? preventa_fin    : null
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
          `INSERT INTO product_variations (product_id, valor, precio, stock, color, imagen_url)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [product.id, v.valor, v.precio ? parseFloat(v.precio) : null, v.stock ? parseInt(v.stock) : 0, v.color || null, varImg]
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

// Upload image only
app.post('/api/upload', upload.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: req.file.path, public_id: req.file.filename });
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
    const result = await pool.query('SELECT * FROM tiendas WHERE deleted_at IS NULL ORDER BY created_at DESC');
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
      `INSERT INTO pedidos (orden, nombre, correo, telefono, pais, estado_env, ciudad, calle, num_ext, num_int, colonia, cp, domicilio, notas, items, subtotal, envio, total) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) RETURNING *`,
      [orden, nombre, correo, telefono, pais, estado_env, ciudad, calle, num_ext, num_int, colonia, cp, domicilio, notas, JSON.stringify(items), subtotal, envio, total]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create pedido', details: err.message });
  }
});

// PUT update pedido estado (+ dispara correo según el estado)
app.put('/api/pedidos/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const VALID = ['Nuevo', 'En proceso', 'Completado', 'Fallido', 'Cancelado'];
    if (!VALID.includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    const result = await pool.query(
      'UPDATE pedidos SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Pedido no encontrado' });

    const pedido = result.rows[0];
    // Enviar correo en background (no bloqueamos la respuesta)
    sendStatusEmail(pedido, estado).catch(console.error);

    res.json({ ...pedido, emailEnviado: !!EMAIL_TRIGGERS[estado] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update pedido estado' });
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


// --- Clientes (derivados de pedidos) ---


// GET all clientes – agrupados por correo desde la tabla pedidos
app.get('/api/clientes', async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        correo,
        MAX(nombre)                            AS nombre,
        MAX(telefono)                          AS telefono,
        COUNT(*)::int                          AS total_pedidos,
        SUM(total)::numeric                    AS total_gastado,
        MIN(created_at)                        AS primera_compra,
        MAX(created_at)                        AS ultima_compra
      FROM pedidos
      GROUP BY correo
      ORDER BY ultima_compra DESC
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
    const result = await pool.query(
      `SELECT id, orden, nombre, correo, telefono, ciudad, estado, total, created_at
       FROM pedidos
       WHERE LOWER(correo) = LOWER($1)
       ORDER BY created_at DESC`,
      [correo]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(result.rows);
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

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('Global error:', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Error al subir archivo', details: err.message });
  }
  res.status(500).json({ error: 'Error interno del servidor', details: err.message || err.toString() });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;


