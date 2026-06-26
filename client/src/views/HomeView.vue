<script setup>
import { ref, onMounted } from 'vue'
import { useLocale } from '../composables/useLocale.js'
import { formatPrice } from '../store/locale.js'

const { t, tTag } = useLocale()

const encode = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
}

const stores = ref([])
const products = ref([])

// Newsletter
const nlNombre = ref('')
const nlCorreo = ref('')
const nlLoading = ref(false)
const nlMessage = ref(null)  // { type: 'success'|'error', text: '' }

async function submitNewsletter() {
  if (!nlNombre.value.trim() || !nlCorreo.value.trim()) return
  nlLoading.value = true
  nlMessage.value = null
  try {
    const res = await fetch('/api/suscriptores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre: nlNombre.value.trim(), correo: nlCorreo.value.trim() })
    })
    const data = await res.json()
    if (res.ok) {
      nlMessage.value = { type: 'success', text: t('home.newsletterSuccess') }
      nlNombre.value = ''
      nlCorreo.value = ''
    } else if (res.status === 400 && data.error && data.error.includes('registrado')) {
      nlMessage.value = { type: 'error', text: t('home.newsletterDuplicate') }
    } else {
      nlMessage.value = { type: 'error', text: t('home.newsletterError') }
    }
  } catch {
    nlMessage.value = { type: 'error', text: t('home.newsletterError') }
  } finally {
    nlLoading.value = false
  }
}

onMounted(async () => {
  try {
    const resStores = await fetch('/api/tiendas')
    const dataStores = await resStores.json()
    console.log('Stores loaded:', dataStores)
    // Nos aseguramos de capturar tanto booleanos como strings "true" o 1
    stores.value = dataStores.filter(t => t.publico === true || t.publico === 'true' || t.publico === 1)
    console.log('Filtered stores:', stores.value)

    const resProducts = await fetch('/api/products')
    const dataProducts = await resProducts.json()
    // Mostrar solo algunos para "Lo más buscado"
    products.value = dataProducts.filter(p => p.es_publico).slice(0, 4)
  } catch (err) {
    console.error('Error fetching data:', err)
  }
})

// Contact Form
const contactForm = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})
const contactSubmitting = ref(false)

const submitContactForm = async () => {
  if (contactSubmitting.value) return;
  contactSubmitting.value = true;
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactForm.value)
    });
    if (res.ok) {
      alert('Mensaje enviado correctamente');
      contactForm.value = { name: '', email: '', subject: '', message: '' };
    } else {
      alert('Hubo un error al enviar el mensaje. Inténtalo de nuevo.');
    }
  } catch (error) {
    console.error(error);
    alert('Hubo un error al enviar el mensaje. Inténtalo de nuevo.');
  } finally {
    contactSubmitting.value = false;
  }
}
</script>

<template>
  <main class="home-view">
    <section class="hero bg-primary">
      <img src="/images/shape-1.png" class="hero-shape hero-shape-right" alt="" aria-hidden="true">
      <img src="/images/shape-3.png" class="hero-shape hero-shape-left" alt="" aria-hidden="true">
      <div class="hero-content">
        <h1 class="hero-title">{{ t('home.heroTitle') }}</h1>
      </div>
      <div class="custom-shape-divider-bottom">
        <svg class="editorial" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 24 150 28" preserveAspectRatio="none">
          <defs>
            <path id="gentle-wave" d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z" />
          </defs>
          <g class="parallax">
            <use xlink:href="#gentle-wave" x="50" y="0" fill="rgba(255,255,255,0.3)"/>
            <use xlink:href="#gentle-wave" x="50" y="3" fill="rgba(255,255,255,0.5)"/>
            <use xlink:href="#gentle-wave" x="50" y="6" fill="var(--bg-color)"/>
          </g>
        </svg>
      </div>
    </section>

    <!-- Catálogo de Tiendas -->
    <section class="catalog-section">
      <img src="/images/shape-1.png" class="floating-shape shape-left" alt="" aria-hidden="true">
      <div class="container catalog-container">
        <h2 class="section-title">{{ t('home.ourStores') }}</h2>
        <div class="artist-grid">
          <router-link :to="`/tienda/${encode(store.nombre)}`" class="artist-card" v-for="store in stores" :key="store.id">
            <div class="artist-image-wrapper">
              <img :src="store.imagen_url || '/images/artist1.png'" :alt="store.nombre" class="artist-image" loading="lazy">
            </div>
            <h3 class="artist-name">{{ store.nombre }}</h3>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Newsletter -->
    <section class="newsletter-section">
      <div class="newsletter-container">
        <h2 class="newsletter-title">{{ t('home.newsletterTitle') }}</h2>
        <p class="newsletter-sub">{{ t('home.newsletterDesc') }}</p>
        <form class="newsletter-form" @submit.prevent="submitNewsletter">
          <!-- Name input -->
          <div class="nl-fields">
            <div class="input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input
                id="nl-nombre"
                v-model="nlNombre"
                type="text"
                class="newsletter-input"
                :placeholder="t('home.newsletterNamePlaceholder')"
                :aria-label="t('home.newsletterNameLabel')"
                required
              />
            </div>
            <!-- Email input -->
            <div class="input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                id="nl-correo"
                v-model="nlCorreo"
                type="email"
                class="newsletter-input"
                :placeholder="t('home.newsletterPlaceholder')"
                :aria-label="t('home.newsletterPlaceholder')"
                required
              />
            </div>
          </div>
          <button type="submit" class="newsletter-btn" :disabled="nlLoading">
            <span v-if="nlLoading">...</span>
            <span v-else>{{ t('home.newsletterBtn') }}</span>
          </button>
        </form>
        <!-- Feedback message -->
        <transition name="nl-fade">
          <p v-if="nlMessage" :class="['newsletter-msg', nlMessage.type === 'success' ? 'nl-success' : 'nl-error']">
            {{ nlMessage.text }}
          </p>
        </transition>
        <p class="newsletter-disclaimer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          {{ t('home.newsletterDisclaimer') }}
        </p>
      </div>
    </section>

    <!-- Lo más buscado -->
    <section class="bestsellers-section">
      <img src="/images/shape-2.png" class="floating-shape shape-right" alt="" aria-hidden="true">
      <div class="bestsellers-container">
        <div class="section-header">
          <span class="section-eyebrow">{{ t('home.trendEyebrow') }}</span>
          <h2 class="bestsellers-title">{{ t('home.bestsellers') }}</h2>
          <p class="bestsellers-sub">{{ t('home.bestsellersDesc') }}</p>
        </div>
        <div class="products-grid">
          <router-link :to="`/producto/${product.id}`" class="product-card" v-for="product in products" :key="product.id">
            <div class="product-image-wrapper">
              <div v-if="!product.imagen_url" class="product-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="placeholder-icon">
                  <path d="M7 2L2 5V10H5V21H19V10H22V5L17 2H14C14 3.1 13.1 4 12 4C10.9 4 10 3.1 10 2H7Z" />
                </svg>
              </div>
              <img v-else :src="product.imagen_url" :alt="product.nombre" class="product-image" loading="lazy">
              <span class="product-tag" v-if="product.flag">{{ product.flag }}</span>
              <div class="product-overlay">
                <button class="overlay-btn">{{ t('home.viewProduct') }}</button>
              </div>
            </div>
            <div class="product-info">
              <span class="product-artist">{{ product.tienda }}</span>
              <h3 class="product-name">{{ product.nombre }}</h3>
              <div class="product-footer">
                <span class="product-price">{{ formatPrice(product.precio) }}</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </section>

    <!-- Banner Maquila -->
    <section class="maquila-banner">
      <div class="maquila-background" style="background-image: url('/images/maquila.png');">
        <div class="maquila-overlay"></div>
      </div>
      <div class="maquila-content">
        <span class="maquila-eyebrow">{{ t('home.servicesEyebrow') }}</span>
        <h2 class="maquila-title">{{ t('home.maquilaTitle') }}</h2>
        <p class="maquila-desc">{{ t('home.maquilaDesc') }}</p>
        <button class="maquila-btn">{{ t('home.maquilaBtn') }}</button>
      </div>
    </section>

    <!-- Contacto -->
    <section class="contact-section">
      <div class="contact-container">
        <div class="contact-header">
          <span class="section-eyebrow">{{ t('home.contactEyebrow') }}</span>
          <h2 class="section-title" style="margin-bottom: 16px;">{{ t('home.contactTitle') }}</h2>
          <p class="contact-sub">{{ t('home.contactDesc') }}</p>
        </div>
        
        <div class="contact-content-stacked">
          <!-- Formulario -->
          <div class="contact-form-card">
            <form class="contact-form" @submit.prevent="submitContactForm">
              <div class="form-group">
                <label for="name">{{ t('home.contactName') }}</label>
                <input type="text" id="name" v-model="contactForm.name" :placeholder="t('home.contactNamePh')" required :disabled="contactSubmitting">
              </div>

              <div class="form-group">
                <label for="email">{{ t('home.contactEmail') }}</label>
                <input type="email" id="email" v-model="contactForm.email" :placeholder="t('home.contactEmailPh')" required :disabled="contactSubmitting">
              </div>

              <div class="form-group">
                <label for="subject">{{ t('home.contactSubject') }}</label>
                <select id="subject" v-model="contactForm.subject" required :disabled="contactSubmitting">
                  <option value="" disabled>{{ t('home.contactSubjectPh') }}</option>
                  <option value="pedido">{{ t('home.contactOrder') }}</option>
                  <option value="maquila">{{ t('home.contactMaquila') }}</option>
                  <option value="otro">{{ t('home.contactOther') }}</option>
                </select>
              </div>

              <div class="form-group">
                <label for="message">{{ t('home.contactMessage') }}</label>
                <textarea id="message" v-model="contactForm.message" rows="4" :placeholder="t('home.contactMessagePh')" required :disabled="contactSubmitting"></textarea>
              </div>

              <button type="submit" class="submit-btn" :disabled="contactSubmitting">
                <span v-if="contactSubmitting">...</span>
                <span v-else>{{ t('home.contactSend') }}</span>
              </button>
            </form>
          </div>

          <!-- Info de Contacto -->
          <div class="contact-info-card">

            <div class="info-item">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div class="info-text">
                <h3>{{ t('home.contactEmailLabel') }}</h3>
                <p><a href="mailto:amigomerchmx@gmail.com">amigomerchmx@gmail.com</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
}
.hero {
  position: relative;
  padding: 80px 20px 120px 20px;
  text-align: center;
  color: white;
  min-height: 55vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  overflow: hidden;
}
.hero-title {
  font-family: 'Nunito', sans-serif;
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 32px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  text-wrap: balance;
  position: relative;
  z-index: 2;
}

.hero-shape {
  position: absolute;
  pointer-events: none;
  z-index: 1;
  opacity: 0.85;
}

.hero-shape-right {
  top: 15%;
  right: 8%;
  width: 260px;
  animation: spin-perpetual 20s linear infinite;
  will-change: transform;
}

.hero-shape-left {
  top: 25%;
  left: 8%;
  width: 220px;
  opacity: 1;
}

@keyframes spin-perpetual {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
.custom-shape-divider-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  line-height: 0;
}

.editorial {
  display: block;
  width: 100%;
  height: 60px;
  max-height: 60px;
  margin: 0;
  padding: 0;
}

.parallax > use {
  animation: move-forever 25s cubic-bezier(.55,.5,.45,.5) infinite;
}
.parallax > use:nth-child(1) {
  animation-delay: -2s;
  animation-duration: 7s;
}
.parallax > use:nth-child(2) {
  animation-delay: -3s;
  animation-duration: 10s;
}
.parallax > use:nth-child(3) {
  animation-delay: -4s;
  animation-duration: 13s;
}

@keyframes move-forever {
  0% { transform: translate3d(-90px,0,0); }
  100% { transform: translate3d(85px,0,0); }
}

@media (max-width: 1200px) {
  .hero-shape-right {
    width: 200px;
    right: 2%;
    top: 20%;
  }
  .hero-shape-left {
    width: 160px;
    left: 2%;
    top: 30%;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.2rem;
  }
  .editorial {
    height: 40px;
  }
  .hero-shape-right {
    width: 140px;
    right: -20px;
    top: 10%;
    opacity: 0.3;
  }
  .hero-shape-left {
    width: 110px;
    left: 50%;
    transform: translateX(-50%);
    top: auto;
    bottom: 20px;
    opacity: 1;
  }
}

/* Catálogo Styles */
.catalog-section {
  padding: 80px 0;
  background-color: var(--bg-color);
  position: relative;
  overflow: hidden;
}

.catalog-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

.section-title {
  font-family: 'Nunito', sans-serif;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 48px;
  color: var(--primary-color);
}

.artist-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 Columnas */
  gap: 40px 32px;
}

.artist-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: transform 0.3s ease;
  text-decoration: none;
  color: inherit;
}

.artist-card:hover {
  transform: translateY(-8px);
}

.artist-card:hover .artist-image {
  transform: scale(1.05);
}

.artist-image-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  border-radius: 50%;
  margin-bottom: 20px;
  background-color: #f0f0f0;
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  border: 4px solid white;
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.4s ease;
}

.artist-card:hover .artist-image-wrapper {
  box-shadow: 0 16px 32px rgba(0,0,0,0.12);
}

.artist-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.artist-name {
  font-size: 1.2rem;
  font-weight: 700;
  text-align: center;
  color: var(--text-main);
  transition: color 0.2s;
}

.artist-card:hover .artist-name {
  color: var(--primary-color);
}

@media (max-width: 900px) {
  .artist-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .artist-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

/* Lo más buscado */
.bestsellers-section {
  padding: 100px 0;
  background-color: var(--bg-color);
  position: relative;
  overflow: hidden;
}

.bestsellers-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

.section-header {
  text-align: center;
  margin-bottom: 64px;
}

.section-eyebrow {
  font-family: 'Nunito', sans-serif;
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--secondary-color);
  margin-bottom: 16px;
}

.bestsellers-title {
  font-family: 'Nunito', sans-serif;
  font-size: 3.2rem;
  font-weight: 900;
  color: var(--primary-color);
  line-height: 1.1;
  margin-bottom: 16px;
}

.bestsellers-sub {
  font-family: 'Nunito', sans-serif;
  font-size: 1.15rem;
  color: var(--text-muted);
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 30px;
}

/* Product Card */
.product-card {
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  overflow: hidden;
  background: #ffffff;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
  transition: box-shadow 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  border: 1px solid rgba(0,0,0,0.03);
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}

.product-card:hover {
  transform: translateY(-12px);
  box-shadow: 0 20px 48px rgba(0,0,0,0.1);
}

.product-image-wrapper {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f8f9fa;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.8s cubic-bezier(0.25, 1, 0.5, 1);
}

.product-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbbbbb;
}

.placeholder-icon {
  width: 60px;
  height: 60px;
  opacity: 0.5;
}

.product-card:hover .product-image {
  transform: scale(1.08);
}

.product-tag {
  position: absolute;
  top: 20px;
  left: 20px;
  font-family: 'Nunito', sans-serif;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: var(--secondary-color);
  color: #111;
  padding: 6px 14px;
  border-radius: 100px;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(246, 178, 0, 0.3);
}

.product-overlay {
  position: absolute;
  inset: 0;
  background: rgba(35, 118, 80, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.4s ease;
  backdrop-filter: blur(2px);
  z-index: 1;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.overlay-btn {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  color: white;
  border: 2px solid white;
  padding: 14px 32px;
  border-radius: 100px;
  transition: background 0.3s, color 0.3s, transform 0.3s;
  letter-spacing: 0.5px;
  transform: translateY(20px);
}

.product-card:hover .overlay-btn {
  transform: translateY(0);
}

.overlay-btn:hover {
  background: white;
  color: var(--primary-color);
}

.product-info {
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-artist {
  font-family: 'Nunito', sans-serif;
  font-size: 0.85rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--primary-color);
  margin-bottom: 8px;
}

.product-name {
  font-family: 'Nunito', sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.3;
  margin-bottom: 16px;
  transition: color 0.2s;
}

.product-card:hover .product-name {
  color: var(--primary-color);
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  border-top: 1px solid rgba(0,0,0,0.06);
  padding-top: 20px;
}

.product-price {
  font-family: 'Nunito', sans-serif;
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--text-main);
}

.add-to-cart-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(35, 118, 80, 0.3);
}

.add-to-cart-btn:hover {
  background-color: #1a5c3c;
  transform: scale(1.15) rotate(5deg);
  box-shadow: 0 6px 16px rgba(35, 118, 80, 0.4);
}

@media (max-width: 900px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .products-grid {
    grid-template-columns: 1fr;
  }
  .bestsellers-title {
    font-size: 2.4rem;
  }
}

/* Newsletter */
.newsletter-section {
  background: linear-gradient(135deg, var(--primary-color) 0%, #1a5c3c 100%);
  padding: 80px 20px;
  position: relative;
  overflow: hidden;
}

.newsletter-section::before {
  content: '';
  position: absolute;
  top: -80px;
  right: -80px;
  width: 320px;
  height: 320px;
  background: rgba(246, 178, 0, 0.08);
  border-radius: 50%;
  pointer-events: none;
}

.newsletter-section::after {
  content: '';
  position: absolute;
  bottom: -100px;
  left: -60px;
  width: 280px;
  height: 280px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 50%;
  pointer-events: none;
}

.newsletter-container {
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  position: relative;
  z-index: 1;
}

.newsletter-badge {
  display: inline-block;
  background: rgba(246, 178, 0, 0.2);
  color: var(--secondary-color);
  border: 1px solid rgba(246, 178, 0, 0.4);
  font-family: 'Nunito', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 6px 16px;
  border-radius: 100px;
  margin-bottom: 24px;
  text-transform: uppercase;
}

.newsletter-title {
  font-family: 'Nunito', sans-serif;
  font-size: 2.8rem;
  font-weight: 500;
  color: white;
  line-height: 1.2;
  margin-bottom: 16px;
}

.newsletter-sub {
  font-family: 'Nunito', sans-serif;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-bottom: 40px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.newsletter-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 520px;
  margin: 0 auto 20px;
}

.nl-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.input-wrapper {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 16px;
  color: rgba(255,255,255,0.5);
  pointer-events: none;
  flex-shrink: 0;
}

.newsletter-input {
  width: 100%;
  font-family: 'Nunito', sans-serif;
  font-size: 1rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  border-radius: 12px;
  padding: 14px 16px 14px 48px;
  outline: none;
  transition: border-color 0.3s, background 0.3s;
}

.newsletter-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.newsletter-input:focus {
  border-color: var(--secondary-color);
  background: rgba(255, 255, 255, 0.18);
}

.newsletter-btn {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  padding: 14px 28px;
  background-color: var(--secondary-color);
  color: #111;
  border-radius: 12px;
  white-space: nowrap;
  transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  box-shadow: 0 4px 16px rgba(246, 178, 0, 0.35);
  width: 100%;
}

.newsletter-btn:not(:disabled):hover {
  background-color: #e5a600;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(246, 178, 0, 0.5);
}

.newsletter-btn:not(:disabled):active {
  transform: translateY(0);
}

.newsletter-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.newsletter-disclaimer {
  font-family: 'Nunito', sans-serif;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  text-align: left;
}

.newsletter-disclaimer svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.newsletter-msg {
  font-family: 'Nunito', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
  margin: 0 auto 16px;
  padding: 10px 20px;
  border-radius: 10px;
  max-width: 520px;
}

.nl-success {
  background: rgba(52, 211, 153, 0.2);
  color: #6ee7b7;
  border: 1px solid rgba(52, 211, 153, 0.35);
}

.nl-error {
  background: rgba(248, 113, 113, 0.18);
  color: #fca5a5;
  border: 1px solid rgba(248, 113, 113, 0.3);
}

.nl-fade-enter-active, .nl-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.nl-fade-enter-from, .nl-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (max-width: 600px) {
  .newsletter-title {
    font-size: 2rem;
  }
  .newsletter-btn {
    width: 100%;
  }
}

/* Floating Shapes Animation */
.floating-shape {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  opacity: 0.12;
  will-change: transform;
}

.shape-left {
  top: 10%;
  left: -5%;
  width: 350px;
  animation: float-left 18s ease-in-out infinite alternate;
}

.shape-right {
  bottom: 10%;
  right: -10%;
  width: 450px;
  animation: float-right 24s ease-in-out infinite alternate;
}

@keyframes float-left {
  0% { transform: translate(0, 0) rotate(0deg) scale(1); }
  100% { transform: translate(50px, 40px) rotate(15deg) scale(1.1); }
}

@keyframes float-right {
  0% { transform: translate(0, 0) rotate(0deg) scale(1); }
  100% { transform: translate(-60px, -50px) rotate(-12deg) scale(1.05); }
}

/* Banner Maquila */
.maquila-banner {
  position: relative;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.maquila-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

.maquila-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(20, 70, 45, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%);
  z-index: 1;
}

.maquila-content {
  position: relative;
  z-index: 2;
  text-align: center;
  color: white;
  padding: 80px 20px;
  max-width: 800px;
}

.maquila-eyebrow {
  font-family: 'Nunito', sans-serif;
  display: block;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 4px;
  text-transform: uppercase;
  color: var(--secondary-color);
  margin-bottom: 20px;
}

.maquila-title {
  font-family: 'Nunito', sans-serif;
  font-size: 3.8rem;
  font-weight: 900;
  line-height: 1.1;
  margin-bottom: 24px;
  text-wrap: balance;
}

.maquila-desc {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1.25rem;
  line-height: 1.6;
  margin-bottom: 40px;
  color: rgba(255, 255, 255, 0.9);
  max-width: 650px;
  margin-left: auto;
  margin-right: auto;
}

.maquila-btn {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 1.1rem;
  padding: 16px 48px;
  background-color: var(--secondary-color);
  color: #111;
  border-radius: 100px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 6px 24px rgba(246, 178, 0, 0.3);
}

.maquila-btn:hover {
  background-color: #e5a600;
  transform: translateY(-4px);
  box-shadow: 0 10px 32px rgba(246, 178, 0, 0.4);
}

.maquila-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .maquila-banner {
    min-height: 400px;
  }
  .maquila-title {
    font-size: 2.6rem;
  }
  .maquila-desc {
    font-size: 1.1rem;
  }
}

/* Contact Section */
.contact-section {
  padding: 100px 0;
  background-color: var(--bg-color);
  position: relative;
}

.contact-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 40px;
}

.contact-header {
  text-align: center;
  margin-bottom: 56px;
}

.contact-sub {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1.15rem;
  color: var(--text-muted);
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

.contact-content-stacked {
  display: flex;
  flex-direction: column;
  gap: 40px;
  max-width: 760px;
  margin: 0 auto;
}

.contact-info-card {
  background: white;
  border-radius: 24px;
  padding: 32px 40px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: 32px;
  border: 1px solid rgba(0,0,0,0.03);
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.info-icon {
  background-color: rgba(35, 118, 80, 0.1);
  color: var(--primary-color);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-text h3 {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 4px;
}

.info-text p, .info-text a {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1rem;
  color: var(--text-muted);
  text-decoration: none;
  transition: color 0.2s;
  margin: 0;
}

.info-text a:hover {
  color: var(--primary-color);
}

.contact-form-card {
  background: white;
  border-radius: 24px;
  padding: 40px 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.03);
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-main);
}

.form-group input, 
.form-group select, 
.form-group textarea {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1rem;
  padding: 14px 16px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  background: #f8f9fa;
  color: var(--text-main);
  outline: none;
  transition: border-color 0.3s, background 0.3s;
}

.form-group input:focus, 
.form-group select:focus, 
.form-group textarea:focus {
  border-color: var(--primary-color);
  background: white;
}

.submit-btn {
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 1.05rem;
  padding: 16px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  margin-top: 8px;
  transition: background-color 0.2s, transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 16px rgba(35, 118, 80, 0.3);
}

.submit-btn:hover {
  background-color: #1a5c3c;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(35, 118, 80, 0.4);
}

.submit-btn:active {
  transform: translateY(0);
}

@media (max-width: 600px) {
  .contact-info-card,
  .contact-form-card {
    padding: 32px 24px;
  }
  .contact-info-card {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
