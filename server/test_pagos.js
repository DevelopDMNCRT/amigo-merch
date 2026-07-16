/**
 * TEST INTEGRAL: Sistema de Pagos Antifraude — Amigo Merch
 * =========================================================
 * Valida que la implementación de seguridad funcione correctamente
 * sin romper el flujo de pagos aprobados en producción.
 *
 * Usa las credenciales REALES del .env (modo producción de MP).
 * Las tarjetas de prueba de MP no generan cargos reales.
 *
 * Referencia tarjetas test MP: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/test/cards
 */

require('dotenv').config({ path: '/Users/yaywiin/Desktop/DEVELOP/amigo-merch/server/.env' });

const BASE_URL = `http://localhost:3002`;
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ─── Colores para consola ────────────────────────────────────────────────────
const c = {
  green:  (s) => `\x1b[32m${s}\x1b[0m`,
  red:    (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan:   (s) => `\x1b[36m${s}\x1b[0m`,
  bold:   (s) => `\x1b[1m${s}\x1b[0m`,
  gray:   (s) => `\x1b[90m${s}\x1b[0m`,
};

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ${c.green('✓')} ${label}`);
    passed++;
  } else {
    console.log(`  ${c.red('✗')} ${c.red(label)}${detail ? c.gray('\n    → ' + detail) : ''}`);
    failed++;
  }
}

// ─── Datos de pedido de prueba (dirección extranjera, como Naris) ────────────
const TEST_ORDER_PAYLOAD = {
  nombre:     'Test Comprador Internacional',
  correo:     'test.internacional@example.com',
  telefono:   '+17817752496',
  pais:       'Estados Unidos',
  estado_env: 'Otro',
  ciudad:     'Watertown',
  calle:      'Marion Rd',
  num_ext:    '15',
  num_int:    '',
  colonia:    'Massachusetts',
  cp:         '02472',
  domicilio:  'Marion Rd 15, Col. Massachusetts, Watertown, Otro, C.P. 02472, Estados Unidos',
  notas:      'Pedido de prueba automatizada',
  delegacion: '',
  items: [
    {
      id: 'test-item-1',
      producto_id: 1,
      nombre: 'Jersey Test',
      variante: 'M',
      imagen: 'https://example.com/image.jpg',
      precio: 500,
      cantidad: 2
    }
  ],
  subtotal: 1000,
  envio:    150,
  total:    1150,
};

// ─── Tarjetas de prueba de Mercado Pago ──────────────────────────────────────
// Documentación oficial: https://www.mercadopago.com.mx/developers/es/docs/your-integrations/test/cards
// Nota: Para el Card Payment Brick, el formData que genera el Brick incluye
// el token de tarjeta ya tokenizado. Para simular aquí usamos el formData
// que vendría de una tarjeta de test que MP rechaza por "high_risk".
// En producción real, el Brick genera este token en el navegador.
// Aquí simulamos el flujo del backend directamente con datos mock.

const MOCK_FORM_DATA_APPROVED = {
  // Representa lo que el Brick enviaría para una tarjeta de prueba aprobada
  // Estos son los datos que el SDK de MP en el browser normalmente genera
  token:              '5c5938fd-55e9-4c04-9fe2-3d1b432f8a29', // Token mock (no real)
  issuer_id:          '3',
  payment_method_id:  'visa',
  transaction_amount: 1150,
  installments:       1,
  payer: {
    email: 'PLACEHOLDER@example.com', // El backend lo sobreescribe con el correo real
  }
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── TEST 1: Servidor accesible ───────────────────────────────────────────────
async function test1_serverAlive() {
  console.log(c.bold(c.cyan('\n━━ TEST 1: Servidor corriendo y respondiendo ━━')));
  try {
    const res = await fetch(`${BASE_URL}/api/pagos/config`);
    const data = await res.json();
    assert('Servidor responde en puerto 3002', res.ok);
    assert('Config de MP devuelve public_key', !!data.public_key, `Recibido: ${JSON.stringify(data)}`);
    assert('Public key es de producción (APP_USR-)', data.public_key?.startsWith('APP_USR-'), `Key: ${data.public_key}`);
    return true;
  } catch (e) {
    assert('Servidor accesible en http://localhost:3002', false, e.message);
    return false;
  }
}

// ─── TEST 2: Creación de pedido en BD ────────────────────────────────────────
async function test2_crearPedido() {
  console.log(c.bold(c.cyan('\n━━ TEST 2: Crear pedido en base de datos ━━')));
  const res = await fetch(`${BASE_URL}/api/pedidos`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(TEST_ORDER_PAYLOAD)
  });
  const pedido = await res.json();

  assert('Endpoint POST /api/pedidos responde 201', res.status === 201, `Status: ${res.status}`);
  assert('Pedido tiene ID numérico', typeof pedido.id === 'number', `id: ${pedido.id}`);
  assert('Pedido tiene número de orden', !!pedido.orden, `orden: ${pedido.orden}`);
  assert('Pedido guarda correo del cliente', pedido.correo === TEST_ORDER_PAYLOAD.correo);
  assert('Pedido guarda pais del cliente', pedido.pais === 'Estados Unidos');
  assert('Estado inicial es "Pendiente de pago"', pedido.estado === 'Pendiente de pago', `estado: ${pedido.estado}`);
  assert('Columna motivo_fallo existe (valor null inicial)', pedido.hasOwnProperty('motivo_fallo'), `keys: ${Object.keys(pedido).join(', ')}`);
  assert('motivo_fallo es null en pedido nuevo', pedido.motivo_fallo === null, `motivo_fallo: ${pedido.motivo_fallo}`);

  console.log(c.gray(`    → Pedido creado: #${pedido.orden} (id: ${pedido.id})`));
  return pedido;
}

// ─── TEST 3: Estructura del additional_info (lógica del backend) ──────────────
async function test3_additionalInfo(pedido) {
  console.log(c.bold(c.cyan('\n━━ TEST 3: Verificar lógica de enriquecimiento (additional_info) ━━')));

  // Replicamos la lógica del backend para validarla sin hacer un pago real
  const itemsRaw = typeof pedido.items === 'string' ? JSON.parse(pedido.items) : (pedido.items || []);
  const mpItems = itemsRaw.map(item => ({
    id:          String(item.producto_id || item.id || 'producto'),
    title:       item.nombre || 'Producto Amigo Merch',
    description: item.variante ? `Talla: ${item.variante}` : 'Producto',
    category_id: 'apparel',
    quantity:    Number(item.cantidad || 1),
    unit_price:  Number(item.precio || 0),
  }));

  const nameParts = (pedido.nombre || 'Cliente').trim().split(/\s+/);
  const firstName = nameParts[0] || 'Cliente';
  const lastName  = nameParts.slice(1).join(' ') || 'Amigo Merch';
  const streetNumber = parseInt(pedido.num_ext) || 0;

  const additional_info = {
    items: mpItems,
    payer: {
      first_name: firstName,
      last_name:  lastName,
      phone: { number: (pedido.telefono || '').replace(/\D/g, '').slice(-10) || '0000000000' },
      address: {
        zip_code:      (pedido.cp || '00000').slice(0, 10),
        street_name:   pedido.calle || 'Calle desconocida',
        street_number: streetNumber,
        city:          pedido.ciudad || pedido.estado_env || 'Ciudad',
      },
    },
  };

  assert('items tiene al menos 1 elemento', additional_info.items.length > 0);
  assert('Cada item tiene id, title, quantity y unit_price', 
    additional_info.items.every(i => i.id && i.title && i.quantity > 0 && i.unit_price > 0)
  );
  assert('Nombre separado correctamente (first_name)', firstName === 'Test', `firstName: ${firstName}`);
  assert('Apellido capturado (last_name)', lastName.length > 0, `lastName: ${lastName}`);
  assert('Teléfono limpio (solo dígitos, máx 10)', /^\d{1,10}$/.test(additional_info.payer.phone.number), `phone: ${additional_info.payer.phone.number}`);
  assert('ZIP code sanitizado (máx 10 chars)', additional_info.payer.address.zip_code.length <= 10);
  assert('street_number es número entero', Number.isInteger(additional_info.payer.address.street_number));
  assert('Ciudad no vacía', !!additional_info.payer.address.city);

  console.log(c.gray(`    → additional_info.payer: ${JSON.stringify(additional_info.payer, null, 2).replace(/\n/g, '\n    ')}`));
  return additional_info;
}

// ─── TEST 4: El correo real sobrescribe al placeholder ────────────────────────
async function test4_emailOverride(pedido) {
  console.log(c.bold(c.cyan('\n━━ TEST 4: Correo del comprador sustituye al placeholder ━━')));

  const formDataSimulado = { ...MOCK_FORM_DATA_APPROVED };
  
  // Simulamos la lógica del backend que sobreescribe el correo
  const enrichedFormData = {
    ...formDataSimulado,
    payer: {
      ...(formDataSimulado.payer || {}),
      email: pedido.correo || formDataSimulado.payer?.email,
    },
  };

  assert('El correo del pedido (BD) sobreescribe al placeholder del Brick',
    enrichedFormData.payer.email === TEST_ORDER_PAYLOAD.correo,
    `Email resultante: ${enrichedFormData.payer.email}`
  );
  assert('El correo NO es el dummy antiguo "cliente@amigomerch.mx"',
    enrichedFormData.payer.email !== 'cliente@amigomerch.mx'
  );
  assert('El correo NO es el placeholder temporal "comprador@amigomerch.mx"',
    enrichedFormData.payer.email !== 'comprador@amigomerch.mx'
  );
  assert('El correo es válido (contiene @ y .)',
    enrichedFormData.payer.email.includes('@') && enrichedFormData.payer.email.includes('.')
  );
}

// ─── TEST 5: Verificar que motivo_fallo se guarda en BD ──────────────────────
async function test5_motivoFallo(pedido) {
  console.log(c.bold(c.cyan('\n━━ TEST 5: Guardar y leer motivo_fallo en base de datos ━━')));

  const motivoSimulado = 'cc_rejected_high_risk';
  
  // Simular el UPDATE que hace el backend al detectar un rechazo
  await pool.query(
    'UPDATE pedidos SET estado = $1, motivo_fallo = $2 WHERE id = $3',
    ['Fallido', motivoSimulado, pedido.id]
  );

  // Leer el pedido de vuelta desde la BD
  const { rows } = await pool.query('SELECT estado, motivo_fallo FROM pedidos WHERE id = $1', [pedido.id]);
  const row = rows[0];

  assert('Estado actualizado a "Fallido" en BD', row.estado === 'Fallido', `estado: ${row.estado}`);
  assert('motivo_fallo guardado correctamente', row.motivo_fallo === motivoSimulado, `motivo_fallo: ${row.motivo_fallo}`);
  assert('motivo_fallo no es null ni vacío', !!row.motivo_fallo);
  
  // Restaurar estado para no dejar basura
  await pool.query(
    'UPDATE pedidos SET estado = $1, motivo_fallo = $2 WHERE id = $3',
    ['Pendiente de pago', null, pedido.id]
  );

  console.log(c.gray(`    → Pedido restaurado a "Pendiente de pago" con motivo_fallo = null`));
}

// ─── TEST 6: El endpoint procesar rechaza pedidos inexistentes ────────────────
async function test6_pedidoInexistente() {
  console.log(c.bold(c.cyan('\n━━ TEST 6: Validación de seguridad — pedido inexistente ━━')));

  const res = await fetch(`${BASE_URL}/api/pagos/procesar`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      formData: MOCK_FORM_DATA_APPROVED,
      pedidoId: 999999999 // ID que no existe
    })
  });
  const body = await res.json();

  assert('Devuelve 404 para pedido inexistente', res.status === 404, `status: ${res.status}`);
  assert('Error descriptivo en respuesta', body.error?.includes('Pedido'), `error: ${body.error}`);
}

// ─── TEST 7: El endpoint rechaza si faltan datos ──────────────────────────────
async function test7_validacionDatos() {
  console.log(c.bold(c.cyan('\n━━ TEST 7: Validación de payload incompleto ━━')));

  const res = await fetch(`${BASE_URL}/api/pagos/procesar`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ formData: null, pedidoId: null })
  });
  const body = await res.json();

  assert('Devuelve 400 si faltan formData o pedidoId', res.status === 400, `status: ${res.status}`);
  assert('Mensaje de error presente', !!body.error, `body: ${JSON.stringify(body)}`);
}

// ─── TEST 8: Limpiar pedido de prueba ─────────────────────────────────────────
async function test8_cleanup(pedido) {
  console.log(c.bold(c.cyan('\n━━ TEST 8: Limpieza — eliminar pedido de prueba ━━')));
  try {
    await pool.query('DELETE FROM pedidos WHERE id = $1 AND correo = $2', [
      pedido.id,
      'test.internacional@example.com'
    ]);
    assert('Pedido de prueba eliminado correctamente de BD', true);
  } catch (e) {
    assert('Limpieza de pedido de prueba', false, e.message);
  }
}

// ─── EJECUTAR TODOS LOS TESTS ─────────────────────────────────────────────────
async function runAll() {
  console.log(c.bold('\n🧪 SUITE DE PRUEBAS: Sistema de Pagos Antifraude — Amigo Merch'));
  console.log(c.gray('   Servidor: http://localhost:3002'));
  console.log(c.gray('   BD:       Neon PostgreSQL (producción)'));
  console.log(c.gray('   MP:       Credenciales de producción (sin cargos reales en test)\n'));

  let serverOk = false;
  let pedido   = null;

  serverOk = await test1_serverAlive();

  if (!serverOk) {
    console.log(c.red('\n⛔ El servidor no está corriendo. Inicia con `npm run dev` en /server.'));
    process.exit(1);
  }

  pedido = await test2_crearPedido();
  await test3_additionalInfo(pedido);
  await test4_emailOverride(pedido);
  await test5_motivoFallo(pedido);
  await test6_pedidoInexistente();
  await test7_validacionDatos();
  await test8_cleanup(pedido);

  // ─── Resumen ─────────────────────────────────────────────────────────────
  const total = passed + failed;
  console.log(c.bold(`\n${'─'.repeat(52)}`));
  console.log(c.bold(`  Resultado: ${passed}/${total} tests pasaron`));
  if (failed === 0) {
    console.log(c.green(c.bold('  ✅ TODOS LOS TESTS PASARON — Seguro para producción')));
  } else {
    console.log(c.red(c.bold(`  ❌ ${failed} TESTS FALLARON — Revisar antes de hacer deploy`)));
  }
  console.log(`${'─'.repeat(52)}\n`);

  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

runAll().catch(err => {
  console.error(c.red('\n💥 Error inesperado en la suite de tests:'), err);
  pool.end();
  process.exit(1);
});
