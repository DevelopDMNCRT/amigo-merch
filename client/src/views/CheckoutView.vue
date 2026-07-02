<template>
  <main class="checkout-view">
    <div class="checkout-container">
      <div class="checkout-header">
        <h1>{{ t('checkout.title') }}</h1>
        <p>{{ t('checkout.subtitle') }}</p>
      </div>

      <div class="checkout-content">
        <!-- Formulario -->
        <div class="checkout-form-section">
          <h2>{{ t('checkout.contactData') }}</h2>
          <form class="checkout-form" ref="checkoutFormRef">
            
            <div class="form-row">
              <div class="form-group">
                <label>{{ t('checkout.fullName') }} *</label>
                <input type="text" required placeholder="Juan Pérez" v-model="form.nombre" class="form-input">
              </div>
              <div class="form-group">
                <label>{{ t('checkout.phone') }} *</label>
                <input type="tel" required placeholder="(55) 1234 5678" v-model="form.telefono" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('checkout.email') }} *</label>
              <input type="email" required placeholder="tu@correo.com" v-model="form.correo" class="form-input">
            </div>

            <h2 class="mt-4">{{ t('checkout.shippingAddress') }}</h2>
            
            <div class="form-group">
              <label>{{ t('checkout.country') }} *</label>
              <select required class="form-input" v-model="form.pais" @change="onPaisChange">
                <option value="México">México</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="Argentina">Argentina</option>
                <option value="Colombia">Colombia</option>
                <option value="Panamá">Panamá</option>
                <option value="España">España</option>
              </select>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>{{ t('checkout.stateProvince') }} *</label>
                <select required class="form-input" v-model="form.estado">
                  <option value="" disabled selected>{{ t('checkout.selectState') }}</option>
                  <option v-for="estado in currentStates" :key="estado" :value="estado">{{ estado }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('checkout.city') }} *</label>
                <input type="text" required placeholder="Ej. Monterrey" v-model="form.ciudad" class="form-input">
              </div>
            </div>

            <div class="form-row mt-3">
              <div class="form-group" style="flex: 2;">
                <label>{{ t('checkout.street') }} *</label>
                <input type="text" required placeholder="Av. Insurgentes Sur" v-model="form.calle" class="form-input">
              </div>
              <div class="form-group" style="flex: 1;">
                <label>{{ t('checkout.numExt') }} *</label>
                <input type="text" required placeholder="123" v-model="form.numExt" class="form-input">
              </div>
              <div class="form-group" style="flex: 1;">
                <label>{{ t('checkout.numInt') }}</label>
                <input type="text" placeholder="Apto 4" v-model="form.numInt" class="form-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Delegación / Municipio (Opcional)</label>
                <input type="text" placeholder="Ej. Benito Juárez" v-model="form.delegacion" class="form-input">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>{{ t('checkout.colonia') }} *</label>
                <input type="text" required placeholder="Roma Norte" v-model="form.colonia" class="form-input">
              </div>
              <div class="form-group">
                <label>{{ t('checkout.postalCode') }} *</label>
                <input type="text" required placeholder="06700" v-model="form.cp" class="form-input">
              </div>
            </div>

            <div class="form-group">
              <label>{{ t('checkout.notes') }}</label>
              <textarea placeholder="Ej. Dejar con el guardia, casa color azul con reja blanca..." rows="2" v-model="form.notas" class="form-input"></textarea>
            </div>

            <button type="button" class="btn-location" @click="openMapModal">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {{ t('checkout.addLocation') }}
            </button>

          </form>

          <div class="payment-brick-section mt-4" v-show="cartState.shippingAvailable">
            <h3 style="margin-bottom: 20px;">Pago con Tarjeta</h3>
            <div id="paymentBrick_container"></div>
          </div>
          <div class="payment-brick-section mt-4" v-if="!cartState.shippingAvailable">
            <div style="background: #fef2f2; border: 1px solid #f87171; border-radius: 12px; padding: 20px; text-align: center; color: #991b1b; font-family: 'Nunito Sans', sans-serif;">
              <strong>Envío no disponible.</strong> Selecciona una dirección válida para continuar con el pago.
            </div>
          </div>
        </div>

        <!-- Resumen -->
        <div class="checkout-summary-section">
          <h2>{{ t('checkout.orderSummary') }}</h2>
          
          <div class="cart-items-summary" v-if="cartState.items.length > 0">
            <div class="summary-item" v-for="item in cartState.items" :key="item.cartItemId">
              <img :src="item.image" :alt="item.name">
              <div class="summary-item-info">
                <h4>{{ item.name }}</h4>
                <p>{{ t('checkout.sizeLabel') }}: {{ item.size }} | {{ t('checkout.quantityLabel') }}: {{ item.quantity }}</p>
                <span class="summary-item-price">{{ formatPrice(item.price * item.quantity) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-summary">
            <p>{{ t('checkout.emptyCart') }}</p>
          </div>

          <div class="summary-totals">
            <div class="total-row">
              <span>{{ t('checkout.subtotal') }}</span>
              <span>{{ formatPrice(cartGetters.totalPrice.value) }}</span>
            </div>
            <div class="total-row">
              <span>{{ t('checkout.shipping') }}</span>
              <span v-if="cartGetters.shippingCost.value === 0" style="color: #237650; font-weight: 800;">¡Gratis!</span>
              <span v-else>{{ formatPrice(cartGetters.shippingCost.value) }}</span>
            </div>
            <div class="total-row grand-total">
              <span>{{ t('checkout.total') }}</span>
              <span>{{ formatPrice(cartGetters.totalPrice.value + cartGetters.shippingCost.value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Map Modal -->
    <Teleport to="body">
      <transition name="fade-modal">
        <div v-if="isMapModalOpen" class="map-modal-overlay" @click.self="closeMapModal">
          <div class="map-modal-content">
            <div class="map-modal-header">
              <h3>{{ t('checkout.confirmLocationTitle') }}</h3>
              <button @click="closeMapModal" class="close-modal-btn" aria-label="Cerrar">&times;</button>
            </div>
            <div class="map-modal-body">
              <p class="map-hint">{{ t('checkout.mapHint') }}</p>
              <div id="modal-map" class="map-container"></div>
            </div>
            <div class="map-modal-footer">
              <button @click="confirmLocation" class="confirm-location-btn">{{ t('checkout.saveLocation') }}</button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- Shipping Alert Modal -->
    <Teleport to="body">
      <transition name="fade-modal">
        <div v-if="showShippingAlert" class="map-modal-overlay" @click.self="showShippingAlert = false">
          <div class="map-modal-content" style="max-width: 400px; text-align: center; padding: 30px;">
            <div style="color: #e53e3e; margin-bottom: 20px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="margin: 0 auto;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 style="font-family: 'Nunito', sans-serif; font-weight: 800; margin-bottom: 10px; color: #111;">Envío no disponible</h3>
            <p style="font-family: 'Nunito Sans', sans-serif; color: var(--text-muted); margin-bottom: 24px;">
              Lo sentimos, actualmente no contamos con envíos disponibles para {{ form.estado ? form.estado + ', ' : '' }}{{ form.pais }}.
            </p>
            <button @click="showShippingAlert = false" class="confirm-location-btn" style="background: #e53e3e; border: none; color: white;">Cerrar</button>
          </div>
        </div>
      </transition>
    </Teleport>
  </main>
</template>

<script setup>
import { onMounted, ref, reactive, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { cartState, cartGetters, cartActions } from '../store/cart.js'
import { useLocale } from '../composables/useLocale.js'
import { formatPrice } from '../store/locale.js'
import { loadMercadoPago } from '@mercadopago/sdk-js'

const { t } = useLocale()

const router = useRouter()

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

const loadLeaflet = async () => {
  // Ya está cargado estáticamente
}

const statesData = {
  'México': ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'CDMX', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'],
  'Estados Unidos': ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Otro'],
  'Argentina': ['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza', 'Otro'],
  'Colombia': ['Antioquia', 'Bogotá', 'Valle del Cauca', 'Cundinamarca', 'Atlántico', 'Otro'],
  'Panamá': ['Panamá', 'Colón', 'Chiriquí', 'Bocas del Toro', 'Coclé', 'Otro'],
  'España': ['Madrid', 'Cataluña', 'Andalucía', 'Valencia', 'Galicia', 'Otro']
}

const form = reactive({
  nombre: '',
  telefono: '',
  correo: '',
  pais: 'México',
  estado: '',
  ciudad: '',
  calle: '',
  numExt: '',
  numInt: '',
  colonia: '',
  delegacion: '',
  cp: '',
  notas: ''
})

const currentStates = computed(() => statesData[form.pais] || [])

const onPaisChange = () => {
  form.estado = ''
}

const reglasEnvio = ref([])
const showShippingAlert = ref(false)

const parseEstados = (estadosStr) => {
  if (!estadosStr) return [];
  try {
    const arr = typeof estadosStr === 'string' && estadosStr.startsWith('[') ? JSON.parse(estadosStr) : estadosStr;
    if (Array.isArray(arr)) return arr;
    return [];
  } catch(e) { return []; }
};

const evaluarEnvio = () => {
  if (!form.pais) return;
  
  let reglaEncontrada = null;
  
  for (const regla of reglasEnvio.value) {
    const paises = regla.pais.split(',').map(p => p.trim());
    if (paises.includes(form.pais)) {
      const estadosRegla = parseEstados(regla.estados);
      if (estadosRegla.length === 0) {
        reglaEncontrada = regla;
      } else if (form.estado && estadosRegla.includes(form.estado)) {
        reglaEncontrada = regla;
        break;
      }
    }
  }

  if (reglaEncontrada) {
    cartState.baseShippingCost = Number(reglaEncontrada.precio);
    cartState.shippingAvailable = true;
    showShippingAlert.value = false;
  } else {
    if (form.pais && form.estado) {
       cartState.shippingAvailable = false;
       showShippingAlert.value = true;
    } else if (form.pais && !form.estado) {
       const rulesForCountry = reglasEnvio.value.filter(r => r.pais.split(',').map(p=>p.trim()).includes(form.pais));
       if (rulesForCountry.length === 0) {
           cartState.shippingAvailable = false;
           showShippingAlert.value = true;
       } else {
           cartState.shippingAvailable = false; // Waiting for state selection
       }
    }
  }
}

watch(() => [form.pais, form.estado], () => {
  evaluarEnvio();
});

// Map Modal Logic
const isMapModalOpen = ref(false)
let map = null
let marker = null
let confirmedLatLng = null

const openMapModal = async () => {
  isMapModalOpen.value = true
  await loadLeaflet()

  nextTick(() => {
    if (!map) {
      const initialCoords = [19.4326, -99.1332]

      map = L.map('modal-map').setView(initialCoords, 14)

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
      }).addTo(map)

      const brandIcon = L.divIcon({
        className: 'custom-brand-marker',
        html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F6B200" stroke="#237650" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:48px; height:48px; margin-top:-48px; margin-left:-24px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#237650"></circle></svg>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      })

      marker = L.marker(initialCoords, { draggable: true, icon: brandIcon }).addTo(map)
      setTimeout(() => { map.invalidateSize() }, 100)
    }

    updateMapFromAddress()
  })
}

const closeMapModal = () => {
  isMapModalOpen.value = false
}

const confirmLocation = () => {
  if (marker) {
    confirmedLatLng = marker.getLatLng()
    console.log('Location confirmed:', confirmedLatLng.lat, confirmedLatLng.lng)
  }
  closeMapModal()
}

const updateMapFromAddress = async () => {
  const queriesToTry = [];
  
  // Nivel 1: Dirección completa
  const fullParts = [];
  if (form.calle) fullParts.push(`${form.calle} ${form.numExt}`);
  if (form.colonia) fullParts.push(form.colonia);
  if (form.ciudad) fullParts.push(form.ciudad);
  if (form.estado) fullParts.push(form.estado);
  if (form.pais) fullParts.push(form.pais);
  if (fullParts.length >= 3) queriesToTry.push(fullParts.filter(Boolean).join(', '));

  // Nivel 2: Sin calle (solo colonia, ciudad, estado, país)
  const medParts = [];
  if (form.colonia) medParts.push(form.colonia);
  if (form.ciudad) medParts.push(form.ciudad);
  if (form.estado) medParts.push(form.estado);
  if (form.pais) medParts.push(form.pais);
  if (medParts.length >= 2) queriesToTry.push(medParts.filter(Boolean).join(', '));

  // Nivel 3: Solo ciudad, estado, país
  const basicParts = [];
  if (form.ciudad) basicParts.push(form.ciudad);
  if (form.estado) basicParts.push(form.estado);
  if (form.pais) basicParts.push(form.pais);
  if (basicParts.length >= 1) queriesToTry.push(basicParts.filter(Boolean).join(', '));

  if (queriesToTry.length === 0) return;

  for (const query of queriesToTry) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        map.flyTo([lat, lon], 16, { animate: true, duration: 1.5 });
        marker.setLatLng([lat, lon]);
        return; // Éxito, salir del loop
      }
    } catch (err) {
      console.warn("Geocoding step failed for query: " + query, err);
    }
  }
}

onMounted(async () => {
  if (cartState.items.length === 0) {
    router.push('/')
    return
  }
  
  try {
    const resReglas = await fetch('/api/reglas-envio');
    if (resReglas.ok) {
      reglasEnvio.value = await resReglas.json();
      evaluarEnvio();
    }
  } catch (err) {
    console.error("Error loading reglas", err);
  }
  
  try {
    const res = await fetch('/api/pagos/config');
    const data = await res.json();
    if (data.public_key) {
      initPaymentBrick(data.public_key);
    }
  } catch (err) {
    console.error("Error loading MP config", err);
  }
})

const loading = ref(false)
const checkoutFormRef = ref(null)

const createOrderAndPay = async (formData) => {
  try {
    const subtotal = cartGetters.totalPrice.value;
    const envio = cartGetters.shippingCost.value;
    const total = subtotal + envio;

    const parts = [];
    if (form.calle) parts.push(`${form.calle} ${form.numExt} ${form.numInt ? 'Int. ' + form.numInt : ''}`.trim());
    if (form.colonia) parts.push(`Col. ${form.colonia}`);
    if (form.ciudad) parts.push(form.ciudad);
    if (form.estado) parts.push(form.estado);
    if (form.cp) parts.push(`C.P. ${form.cp}`);
    if (form.pais) parts.push(form.pais);
    const domicilio = parts.join(', ');

    const items = cartState.items.map(item => ({
      id: item.cartItemId,
      producto_id: item.id,
      nombre: item.name,
      variante: item.size,
      imagen: item.image,
      precio: item.price,
      cantidad: item.quantity
    }));

    const payload = {
      ...form,
      num_ext: form.numExt,
      num_int: form.numInt,
      delegacion: form.delegacion,
      estado_env: form.estado,
      domicilio,
      items,
      subtotal,
      envio,
      total
    };

    // 1. Crear pedido en BD
    const pedidoRes = await fetch('/api/pedidos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!pedidoRes.ok) throw new Error('Error al crear el pedido');
    const pedido = await pedidoRes.json();

    // 2. Procesar el pago con el backend
    const payRes = await fetch("/api/pagos/procesar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formData, pedidoId: pedido.id })
    });
    const result = await payRes.json();

    if (result.status === 'approved' || result.status === 'in_process' || result.status === 'pending') {
       cartActions.clearCart();
       window.location.href = `/pago/exito?pedido_id=${pedido.id}`;
    } else {
       throw new Error(result.status_detail || 'Pago rechazado');
    }
  } catch (error) {
    console.error(error);
    alert('Ocurrió un error al procesar tu compra. Revisa tus datos e intenta nuevamente.');
    throw error;
  }
}

const initPaymentBrick = async (publicKey) => {
  await loadMercadoPago();
  const mp = new window.MercadoPago(publicKey, { locale: 'es-MX' });
  const bricksBuilder = mp.bricks();
  
  bricksBuilder.create("cardPayment", "paymentBrick_container", {
    initialization: {
      amount: cartGetters.totalPrice.value + cartGetters.shippingCost.value,
      payer: {
        email: 'cliente@amigomerch.mx' // Pre-llenado dummy para ocultar el input de correo del Brick
      }
    },
    customization: {
      // El Card Payment Brick asume tarjetas directamente
    },
    callbacks: {
      onReady: () => {
        // Brick listo
      },
      onSubmit: (arg) => {
        const formData = arg.formData || arg;
        return new Promise((resolve, reject) => {
          if (!cartState.shippingAvailable) {
            alert("No hay envíos disponibles para esta ubicación.");
            return reject(new Error("Envío no disponible"));
          }
          // Validar formulario manualmente
          if (!checkoutFormRef.value.checkValidity()) {
            checkoutFormRef.value.reportValidity();
            return reject(new Error("Faltan campos en el formulario de envío"));
          }
          
          // Reemplazar el correo dummy con el correo real del usuario
          if (formData.payer) {
            formData.payer.email = form.correo;
          }
          
          createOrderAndPay(formData)
            .then(() => resolve())
            .catch((err) => reject(err));
        });
      },
      onError: (error) => {
        console.error("Brick Error:", error);
      }
    }
  });
}

</script>

<style scoped>
.checkout-view {
  background-color: #fafafa;
  min-height: 100vh;
  padding: 40px 20px;
}

.checkout-container {
  max-width: 1200px;
  margin: 0 auto;
}

.checkout-header {
  text-align: center;
  margin-bottom: 48px;
}

.checkout-header h1 {
  font-family: 'Nunito', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 8px;
}

.checkout-header p {
  font-family: 'Nunito Sans', sans-serif;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.checkout-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 40px;
}

.checkout-form-section,
.checkout-summary-section {
  background: white;
  padding: 40px;
  border-radius: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.03);
}

h2 {
  font-family: 'Nunito', sans-serif;
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 24px;
  color: var(--text-main);
}

.mt-4 { margin-top: 32px; }
.mt-3 { margin-top: 16px; }

.checkout-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.form-group label {
  font-family: 'Nunito Sans', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-main);
}

.form-input {
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1rem;
  transition: border-color 0.2s;
  outline: none;
  background: white;
  color: var(--text-main);
  width: 100%;
}

textarea.form-input {
  resize: vertical;
}

.form-input:focus {
  border-color: var(--primary-color);
}

/* Botón de mapa */
.btn-location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(246, 178, 0, 0.15); /* Brand secondary transparent */
  color: var(--primary-color);
  border: 2px solid var(--secondary-color);
  border-radius: 12px;
  padding: 14px;
  font-family: 'Nunito Sans', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.btn-location:hover {
  background: var(--secondary-color);
  color: #111;
  transform: translateY(-2px);
}

.btn-location svg {
  stroke: currentColor;
}

/* Map Modal */
.map-modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.map-modal-content {
  background: white;
  width: 100%;
  max-width: 600px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
}

.map-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.map-modal-header h3 {
  margin: 0;
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  color: var(--text-main);
}

.close-modal-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  color: var(--text-muted);
  cursor: pointer;
  line-height: 1;
}

.close-modal-btn:hover { color: var(--primary-color); }

.map-modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.map-hint {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0;
}

.map-container {
  height: 400px;
  width: 100%;
  border-radius: 12px;
  border: 2px solid var(--border-color);
  background: #f0f0f0;
}

.map-modal-footer {
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
  background: #fafafa;
}

.confirm-location-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-family: 'Nunito Sans', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
}

.confirm-location-btn:hover {
  background: #1a5c3c;
}

/* Payment Methods */
.payment-methods {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s, border-color 0.2s;
}

.payment-option:hover { background-color: #f9f9f9; }
.payment-option:has(input:checked) {
  border-color: var(--primary-color);
  background-color: rgba(35, 118, 80, 0.05);
}

.payment-option span {
  font-family: 'Nunito Sans', sans-serif;
  font-weight: 600;
  color: var(--text-main);
}

.pay-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 16px;
  padding: 20px;
  font-family: 'Nunito', sans-serif;
  font-weight: 900;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.pay-btn:hover {
  background: #1a5c3c;
  transform: translateY(-2px);
}

.pay-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* Animations */
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.3s ease;
}
.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

/* Summary */
.cart-items-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.summary-item {
  display: flex;
  gap: 16px;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.summary-item img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 8px;
  background: #f5f5f5;
}

.summary-item-info { flex: 1; }
.summary-item-info h4 {
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  margin: 0 0 4px 0;
  font-size: 1rem;
}
.summary-item-info p {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 0 0 4px 0;
}
.summary-item-price {
  font-family: 'Nunito Sans', sans-serif;
  font-weight: 800;
  color: var(--primary-color);
}

.empty-summary {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 0;
}

.summary-totals {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-family: 'Nunito Sans', sans-serif;
  color: var(--text-muted);
}

.grand-total {
  margin-top: 12px;
  padding-top: 16px;
  border-top: 2px solid var(--border-color);
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--text-main);
  font-family: 'Nunito', sans-serif;
}

@media (max-width: 900px) {
  .checkout-content { grid-template-columns: 1fr; }
  .checkout-summary-section { order: -1; }
}

@media (max-width: 600px) {
  .checkout-form-section,
  .checkout-summary-section { padding: 24px; }
  .form-row { flex-direction: column; gap: 20px; }
}
</style>
