# Amigo Merch — Plataforma E-Commerce 🛒

Amigo Merch es una plataforma integral de comercio electrónico diseñada para la venta de mercancía y ropa, conformada por tres piezas principales: una tienda pública para los clientes, un panel de administración para gestionar inventarios/pedidos, y un backend que orquesta pagos, notificaciones y envíos.

---

## 🏗️ Estructura del Proyecto y Stack Tecnológico

El proyecto está estructurado como un monorepo no oficial con tres directorios principales:

### 1. `/client` (Tienda Pública)
Aplicación SPA orientada al cliente final para explorar productos, gestionar el carrito y realizar compras.
- **Framework:** Vue 3 (Composition API)
- **Bundler:** Vite
- **Lenguaje:** JavaScript
- **Manejo de estado:** Manejo reactivo simple manual (`src/store/cart.js`)
- **Pagos:** Integración directa con el SDK de **MercadoPago** (`@mercadopago/sdk-js`) (Único método de pago admitido).

### 2. `/admin` (Panel de Administración)
Panel privado para la gestión de productos, pedidos, tiendas, usuarios y envío de boletines.
- **Framework:** Vue 3 (Composition API)
- **Bundler:** Vite
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS
- **Gráficos y UI:** ApexCharts, Flatpickr, etc.
- **Nota Histórica:** Este panel derivó de la plantilla "TailAdmin". En julio de 2026 se realizó una limpieza profunda de vistas y dependencias huérfanas de demostración de la plantilla original.

### 3. `/server` (API y Backend)
API RESTful que sirve a ambas aplicaciones de frontend y maneja webhooks de proveedores externos.
- **Entorno:** Node.js
- **Framework REST:** Express.js
- **Base de Datos:** PostgreSQL (usando `pg` nativo para queries raw).
- **Correos:** `nodemailer` (SMTP).
- **Envíos (Logística):** Integración con la API de **Envia.com** para generación y cancelación de guías de envío dinámicamente según el peso y dimensiones de los productos.
- **Pagos:** Webhooks de MercadoPago para la acreditación automática de pedidos.

---

## ⚙️ Integraciones Externas Críticas

1. **MercadoPago:**
   - La pasarela oficial (y única) para cobros (Tarjetas de crédito/débito).
   - No se admiten pagos en efectivo ni Oxxo.
   - El endpoint `POST /api/pagos/webhook` en el servidor es vital; este recibe la confirmación de acreditación del pago y actualiza el estado del pedido a `En proceso`.

2. **Envia.com:**
   - Se utiliza para la cotización y generación de guías de envío.
   - El servidor calcula dinámicamente el peso leyendo la tabla `product_variations` y/o `products`.
   - Webhook de Envia: Actualiza los pedidos a estado `Guía Generada` cuando detecta actividad de la paquetería o entregas.

3. **Nodemailer (SMTP):**
   - El sistema notifica al cliente automáticamente en los cambios de estado:
     - Al crear pedido: "¡Gracias por tu pedido! 🎉"
     - Al pagarse (`En proceso`): "¡Estamos procesando tu pedido! ⚙️"
     - Al enviarse (`Guía Generada`): "¡Tu pedido va en camino! 🚚" (incluye tracking y carrier).
     - Si falla (`Fallido`): "Tuvimos un problema con tu pago ⚠️".
     - Si se cancela (`Cancelado`): "Tu pedido ha sido cancelado ❌".

---

## 🛠️ Entorno de Desarrollo (Onboarding)

### Requisitos Previos
- Node.js (v18+)
- PostgreSQL (BD productiva o local)
- Variables de entorno (`.env` global o en `/server`):
  - `DATABASE_URL` (Debe tener `ssl: { rejectUnauthorized: false }` si se conecta a servicios como Neon/Supabase).
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - `ENVIA_API_KEY`, `ENVIA_API_URL`
  - Credenciales de MercadoPago.

### Levantando el proyecto
No existe un script global para levantar todo al mismo tiempo en el root; se recomienda usar 3 terminales:

**1. Servidor:**
\`\`\`bash
cd server
npm install
npm run dev
\`\`\`
*(Levantará en el puerto 3002)*

**2. Cliente (Tienda):**
\`\`\`bash
cd client
npm install
npm run dev
\`\`\`
*(Levantará en el puerto 5173)*

**3. Admin:**
\`\`\`bash
cd admin
npm install
npm run dev
\`\`\`
*(Levantará en el puerto 5174)*

---

## 📝 Últimos Cambios (Julio 2026)

- **Correos Transaccionales:** Se implementó una suite completa de correos automáticos al cliente durante el ciclo de vida de un pedido (creación, confirmación de pago, generación de guía, fallos y cancelaciones). Las menciones a pagos en efectivo / Oxxo fueron purgadas dado que MercadoPago (Tarjetas) es el método exclusivo de la plataforma.
- **Renombre de Estado:** En el panel de administrador, el estado "Completado" fue renombrado a **"Guía Generada"** para tener más sentido logístico. Este estado permite capturar la *Paquetería* y el *Número de Rastreo* para enviárselos al cliente en su notificación.
- **Limpieza de Código:** Se realizó una auditoría y limpieza profunda del panel `admin`, eliminando 14 vistas, múltiples componentes y 8 librerías pesadas (`@fullcalendar`, `swiper`, `vue-kanban`, etc.) que pertenecían a una plantilla base de Tailwind y no se usaban. También se purgó la librería `pinia` del `client` al no ser utilizada. Se removieron endpoints duplicados en el servidor.
- **Configuración SMTP (3 de Julio de 2026):** Se actualizó el servicio de correos para que las notificaciones transaccionales salgan de la cuenta oficial de Gmail (`amigomerchmx@gmail.com`) mediante autenticación segura con contraseña de aplicación.
- **Soporte para Slugs (URL personalizadas):** Se modificó la API de productos en el servidor para permitir la búsqueda tanto por `ID` como por `slug` de texto. Esto evita errores de consulta y permite utilizar enlaces amigables (ej. `/producto/vinilo-latinaje`) compartidos externamente.
- **Corrección en Estados de Pedido:** Se ejecutó el script de migración (`add_shipping_columns.js`) en la base de datos para agregar las columnas `paqueteria` y `num_rastreo`, solucionando el error interno del servidor que impedía guardar los pedidos al pasar a estado "Guía Generada".
- **Fix crítico — Generación de Guías Envia (6 de Julio de 2026):** Se corrigió un bug donde las guías se generaban correctamente en Envia.com (el saldo se descontaba y aparecían en la plataforma de Envia) pero nunca quedaban registradas en la BD del sistema, mostrando "Failed to generate label" en el admin. La causa fue un parseo frágil del response de Envia: si `data.data[0]` llegaba vacío o con campos renombrados, JavaScript lanzaba un `TypeError` silencioso que caía al `catch` antes de ejecutar el `UPDATE` en BD. El fix agrega validación defensiva completa: verifica que `data.data` exista y sea un array con al menos un elemento, prueba múltiples nombres de campo posibles (`trackingNumber`/`tracking_number`, `label`/`labelUrl`/`pdf`), loguea el response completo de Envia en consola para diagnóstico futuro, y retorna mensajes de error descriptivos en lugar del mensaje genérico anterior.
