<template>
  <main class="nosotros-view">
    <div class="us-hero">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <h1>{{ t('nosotros.heroTitle') }}</h1>
        <p>{{ t('nosotros.heroSub') }}</p>
      </div>
    </div>

    <section class="us-story-section">
      <div class="container us-container">
        <div class="us-text-content">
          <h2>{{ t('nosotros.storyTitlePre') }}<span class="highlight">{{ t('nosotros.storyHighlight') }}</span>{{ t('nosotros.storyTitlePost') }}</h2>
          <p class="lead">{{ t('nosotros.storyLead') }}</p>
          <p>{{ t('nosotros.storyP1') }}</p>
          <p>{{ t('nosotros.storyP2') }}</p>
        </div>
        <!-- Forma decorativa flotante -->
        <img src="/images/shape-2.png" class="floating-shape shape-right" alt="" aria-hidden="true">
      </div>
    </section>

    <!-- Services Section -->
    <section class="services-section">
      <div class="container">
        <div class="services-grid">
          
          <div class="service-card">
            <div class="service-icon">
              <!-- Diseño / Producción -->
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </div>
            <h3>{{ t('nosotros.service1Title') }}</h3>
            <p>{{ t('nosotros.service1Desc') }}</p>
          </div>

          <div class="service-card">
            <div class="service-icon">
              <!-- Ventas online / Almacenamiento -->
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h3>{{ t('nosotros.service2Title') }}</h3>
            <p>{{ t('nosotros.service2Desc') }}</p>
          </div>

          <div class="service-card">
            <div class="service-icon">
              <!-- Tour / Camión -->
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                <circle cx="5.5" cy="18.5" r="2.5"></circle>
                <circle cx="18.5" cy="18.5" r="2.5"></circle>
              </svg>
            </div>
            <h3>{{ t('nosotros.service3Title') }}</h3>
            <p>{{ t('nosotros.service3Desc') }}</p>
          </div>

          <div class="service-card">
            <div class="service-icon">
              <!-- Tienda Pop Up / Eventos -->
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <h3>{{ t('nosotros.service4Title') }}</h3>
            <p>{{ t('nosotros.service4Desc') }}</p>
          </div>

        </div>
      </div>
    </section>

    <!-- Lo Más Vendido -->
    <section class="best-sellers-section">
      <div class="container">
        <h2 class="section-title">{{ t('nosotros.bestSellersTitle') }}</h2>
        <div class="products-grid">
          <div class="product-card" v-for="product in bestSellers" :key="product.id" @click="goToProduct(product.id)">
            <div class="product-image-wrapper">
              <img :src="product.image" :alt="product.name" class="product-image" loading="lazy">
              <span class="product-tag" v-if="product.tag">{{ tTag(product.tag) }}</span>
              <div class="product-overlay">
                <button class="overlay-btn">{{ t('nosotros.viewProduct') }}</button>
              </div>
            </div>
            <div class="product-info">
              <span class="product-artist">{{ product.artist }}</span>
              <h3 class="product-name">{{ product.name }}</h3>
              <div class="product-footer">
                <span class="product-price">{{ formatPrice(product.price) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocale } from '../composables/useLocale.js'
import { formatPrice } from '../store/locale.js'

const router = useRouter()
const { t, tTag } = useLocale()

const bestSellers = ref([])

const goToProduct = (id) => {
  router.push(`/producto/${id}`)
}

onMounted(async () => {
  window.scrollTo(0, 0)
  try {
    const res = await fetch('/api/products')
    const data = await res.json()
    bestSellers.value = data
      .filter(p => p.es_publico)
      .slice(0, 4)
      .map(p => ({
        id: p.id,
        name: p.nombre,
        artist: p.tienda,
        price: p.precio,
        image: p.imagen_url || '/images/product1.png',
        tag: p.flag || ''
      }))
  } catch (err) {
    console.error('Error fetching products:', err)
  }
})
</script>

<style scoped>
.nosotros-view {
  background-color: #fafafa;
  min-height: 100vh;
  padding-bottom: 80px;
}

/* Hero Header */
.us-hero {
  position: relative;
  height: 250px;
  background-image: url('/images/us-header.png');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.hero-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to bottom, rgba(35,118,80,0.6), rgba(0,0,0,0.8));
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  color: white;
  padding: 0 20px;
  max-width: 800px;
}

.hero-content h1 {
  font-family: 'Nunito', sans-serif;
  font-size: 4rem;
  font-weight: 900;
  margin: 0 0 16px 0;
  text-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.hero-content p {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  opacity: 0.9;
}

/* Story Section */
.us-story-section {
  position: relative;
  padding: 100px 20px;
  background: white;
  overflow: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.us-container {
  position: relative;
  z-index: 2;
}

.us-text-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.us-text-content h2 {
  font-family: 'Nunito', sans-serif;
  font-size: 2.8rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 32px;
  line-height: 1.2;
}

.highlight {
  color: var(--primary-color);
  position: relative;
  display: inline-block;
}

.highlight::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 0;
  width: 100%;
  height: 8px;
  background-color: var(--secondary-color);
  z-index: -1;
  border-radius: 4px;
}

.us-text-content p {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1.15rem;
  line-height: 1.8;
  color: var(--text-muted);
  margin-bottom: 24px;
}

.us-text-content p.lead {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-main);
}

.floating-shape {
  position: absolute;
  z-index: 0;
  opacity: 0.15;
  animation: float 6s ease-in-out infinite;
}

.shape-right {
  top: 10%;
  right: -5%;
  width: 300px;
  transform: rotate(15deg);
}

@keyframes float {
  0% { transform: translateY(0px) rotate(15deg); }
  50% { transform: translateY(-20px) rotate(20deg); }
  100% { transform: translateY(0px) rotate(15deg); }
}

/* Services Section */
.services-section {
  padding: 60px 20px 80px;
  background: white;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 60px 40px;
  max-width: 1000px;
  margin: 0 auto;
}

.service-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.service-icon {
  width: 64px;
  height: 64px;
  background-color: var(--secondary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  color: #111;
}

.service-card h3 {
  font-family: 'Nunito', sans-serif;
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 12px;
}

.service-card p {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-muted);
  margin: 0;
}

/* Best Sellers Section */
.best-sellers-section {
  padding: 80px 20px 40px;
  background: #f8f8f8;
}

.section-title {
  text-align: center;
  font-family: 'Nunito', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 48px;
}

/* Grid de Productos */
.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
}

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
}

.product-card:hover {
  transform: translateY(-12px);
  box-shadow: 0 20px 48px rgba(0,0,0,0.1);
}

.product-image-wrapper {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #f5f5f5;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-tag {
  position: absolute;
  top: 16px;
  left: 16px;
  background: var(--secondary-color);
  color: #111;
  font-family: 'Nunito Sans', sans-serif;
  font-weight: 800;
  font-size: 0.8rem;
  padding: 6px 12px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 1px;
  z-index: 2;
}

.product-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(35, 118, 80, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 3;
}

.product-card:hover .product-overlay {
  opacity: 1;
}

.overlay-btn {
  background: white;
  color: var(--primary-color);
  border: none;
  padding: 14px 28px;
  border-radius: 24px;
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  transform: translateY(20px);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), background 0.2s, color 0.2s;
  cursor: pointer;
}

.product-card:hover .overlay-btn {
  transform: translateY(0);
}

.overlay-btn:hover {
  background: var(--secondary-color);
  color: #111;
}

.product-info {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.product-artist {
  font-family: 'Nunito Sans', sans-serif;
  color: var(--text-muted);
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.product-name {
  font-family: 'Nunito', sans-serif;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0 0 16px 0;
  line-height: 1.4;
  transition: color 0.2s;
}

.product-card:hover .product-name {
  color: var(--primary-color);
}

.product-footer {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-main);
}

/* Responsividad */
@media (max-width: 1024px) {
  .products-grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .us-text-content h2 { font-size: 2.2rem; }
  .hero-content h1 { font-size: 3rem; }
}

@media (max-width: 768px) {
  .us-hero { height: 40vh; min-height: 300px; }
  .products-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .us-story-section { padding: 60px 20px; }
  .services-grid { grid-template-columns: 1fr; gap: 40px; text-align: center; }
  .service-card { align-items: center; }
}

@media (max-width: 480px) {
  .products-grid { grid-template-columns: 1fr; }
  .us-text-content h2 { font-size: 1.8rem; }
  .hero-content h1 { font-size: 2.2rem; }
}
</style>
