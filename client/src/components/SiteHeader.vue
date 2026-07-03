<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import CartDrawer from './CartDrawer.vue'
import { cartActions, cartGetters } from '../store/cart.js'
import { currentLang, formatPrice } from '../store/locale.js'
import { useLocale } from '../composables/useLocale.js'

const isMenuOpen = ref(false)
const isSearchOpen = ref(false)
const isTiendasOpen = ref(false)
const isLangMenuOpen = ref(false)
const isChatOpen = ref(false)
const isDesktopMegamenuOpen = ref(false)
const stores = ref([])

const encode = (str) => {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
}

onMounted(async () => {
  try {
    const res = await fetch('/api/tiendas')
    const data = await res.json()
    // Filtrar solo las públicas
    stores.value = data.filter(t => t.publico === true || t.publico === 'true' || t.publico === 1)
  } catch (err) {
    console.error('Error fetching stores for megamenu:', err)
  }
})

const route = useRoute()
const isCheckout = computed(() => route.path === '/checkout')
const { t } = useLocale()

watch(route, () => {
  isDesktopMegamenuOpen.value = false
})

const handleClickOutside = (e) => {
  if (isDesktopMegamenuOpen.value && !e.target.closest('.has-megamenu')) {
    isDesktopMegamenuOpen.value = false
  }
  if (isLangMenuOpen.value && !e.target.closest('.lang-selector-container')) {
    isLangMenuOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const toggleSearch = () => {
  isSearchOpen.value = !isSearchOpen.value
}

const searchInput = ref(null)

const searchQuery = ref('')
const allProducts = ref([])

const fetchProducts = async () => {
  if (allProducts.value.length > 0) return
  try {
    const res = await fetch('/api/products')
    const data = await res.json()
    allProducts.value = data
  } catch (err) {
    console.error('Error fetching products for search:', err)
  }
}

watch(isSearchOpen, (val) => {
  if (val) {
    fetchProducts()
    nextTick(() => {
      searchInput.value?.focus()
    })
  } else {
    searchQuery.value = ''
  }
})

const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []
  return allProducts.value.filter(p => 
    p.nombre.toLowerCase().includes(query) || 
    (p.tienda && p.tienda.toLowerCase().includes(query))
  ).slice(0, 8)
})

const toggleLangMenu = () => {
  isLangMenuOpen.value = !isLangMenuOpen.value
}

const selectLanguage = (code) => {
  currentLang.value = code
  isLangMenuOpen.value = false
}

const languages = [
  { code: 'ESP', flag: '🇲🇽', label: 'Español' },
  { code: 'ENG', flag: '🇺🇸', label: 'English' },
  { code: 'FRA', flag: '🇫🇷', label: 'Français' }
]

const currentLanguage = computed(() => languages.find(l => l.code === currentLang.value) || languages[0])
</script>

<template>
  <header class="site-header">
    <div class="header-container">
      <div class="logo-container">
        <router-link to="/">
          <img src="/logo.png" alt="Amigo Merch Logo" class="logo" />
        </router-link>
      </div>

      <!-- Desktop Navigation -->
      <nav class="desktop-nav">
        <ul class="desktop-nav-links">
          <li><router-link to="/">{{ t('nav.home') }}</router-link></li>
          <li class="has-megamenu" :class="{ 'is-active': isDesktopMegamenuOpen }">
            <a href="#" @click.prevent="isDesktopMegamenuOpen = !isDesktopMegamenuOpen" class="megamenu-trigger">{{ t('nav.stores') }} <span class="chevron"></span></a>
            <div class="megamenu">
              <div class="megamenu-inner">
                <div class="megamenu-info">
                  <h3 class="megamenu-title">{{ t('nav.artistsAndStores') }}</h3>
                  <p class="megamenu-desc">{{ t('nav.megamenuDesc') }}</p>
                  <router-link to="/tiendas" class="megamenu-btn">{{ t('nav.allStores') }}</router-link>
                </div>
                <div class="megamenu-lists">
                  <ul class="sub-menu">
                    <li class="menu-item" v-for="store in stores" :key="store.id">
                      <router-link :to="`/tienda/${encode(store.nombre)}`">{{ store.nombre }}</router-link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </li>
          <li><router-link to="/nosotros">{{ t('nav.about') }}</router-link></li>
          <li><router-link to="/rastreo">{{ t('nav.tracking') }}</router-link></li>
          <li><router-link to="/facturacion">{{ t('nav.billing') }}</router-link></li>
          <li><router-link to="/contacto">{{ t('nav.contact') }}</router-link></li>
        </ul>
      </nav>

      <div class="header-actions">
        <!-- Buscador -->
        <div class="search-container">
          <button @click="toggleSearch" class="icon-btn" aria-label="Buscar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>

        <!-- Switch de Idiomas -->
        <div class="lang-selector-container">
          <button @click="toggleLangMenu" class="lang-switch" :class="{ 'active': isLangMenuOpen }">
            <span class="flag">{{ currentLanguage.flag }}</span>
            <span class="code">{{ currentLanguage.code }}</span>
            <span class="chevron-down"></span>
          </button>
          
          <ul class="lang-dropdown" v-show="isLangMenuOpen">
            <li v-for="lang in languages" :key="lang.code">
              <button @click="selectLanguage(lang.code)" class="lang-option" :class="{ 'selected': lang.code === currentLang }">
                <span class="flag">{{ lang.flag }}</span>
                <span class="code">{{ lang.code }}</span>
              </button>
            </li>
          </ul>
        </div>

        <!-- Menu Hamburguesa (Mobile) -->
        <button @click="toggleMenu" class="hamburger-btn icon-btn" aria-label="Menu">
          <svg v-if="!isMenuOpen" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>

    <!-- Navigation Drawer -->
    <nav class="mobile-nav" :class="{ 'nav-open': isMenuOpen }">
      <ul class="nav-links">
        <li><router-link to="/" @click="toggleMenu">{{ t('nav.home') }}</router-link></li>
        <li>
          <div class="mobile-submenu-toggle" @click="isTiendasOpen = !isTiendasOpen">
            {{ t('nav.stores') }}
            <span class="chevron" :style="{ transform: isTiendasOpen ? 'rotate(180deg)' : 'rotate(0)' }"></span>
          </div>
          <ul class="mobile-sub-menu" v-show="isTiendasOpen">
            <li class="menu-item" v-for="store in stores" :key="store.id">
              <router-link :to="`/tienda/${encode(store.nombre)}`" @click="toggleMenu">{{ store.nombre }}</router-link>
            </li>
          </ul>
        </li>
        <li><router-link to="/nosotros" @click="toggleMenu">{{ t('nav.about') }}</router-link></li>
        <li><router-link to="/rastreo" @click="toggleMenu">{{ t('nav.tracking') }}</router-link></li>
        <li><router-link to="/facturacion" @click="toggleMenu">{{ t('nav.billing') }}</router-link></li>
        <li><router-link to="/contacto" @click="toggleMenu">{{ t('nav.contact') }}</router-link></li>
      </ul>
    </nav>
  </header>

  <!-- Botón Flotante Chat -->
  <button class="floating-chat" aria-label="Asistencia" @click="isChatOpen = !isChatOpen">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  </button>

  <!-- Ventana de Chat -->
  <transition name="fade-chat">
    <div v-if="isChatOpen" class="chat-window">
      <div class="chat-header">
        <h4>{{ t('nav.chatTitle') }}</h4>
        <button @click="isChatOpen = false" class="close-chat" aria-label="Cerrar Chat">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="chat-body">
        <p class="chat-msg bot-msg">{{ t('nav.chatGreeting') }}</p>
      </div>
      <div class="chat-footer">
        <input type="text" :placeholder="t('nav.chatPlaceholder')" class="chat-input" />
        <button class="chat-send" aria-label="Enviar">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <line x1="22" y1="2" x2="11" y2="13"></line>
             <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
           </svg>
        </button>
      </div>
    </div>
  </transition>

  <!-- Carrito Flotante -->
  <button v-if="!isCheckout" class="floating-cart" aria-label="Carrito" @click="cartActions.openCart()">
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="21" r="1"></circle>
      <circle cx="20" cy="21" r="1"></circle>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
    </svg>
    <span class="cart-badge">{{ cartGetters.totalItems.value }}</span>
  </button>

  <CartDrawer />

  <!-- Fullscreen Search Overlay -->
  <transition name="fade-search">
    <div v-if="isSearchOpen" class="search-overlay">
      <button @click="toggleSearch" class="close-search" aria-label="Cerrar Búsqueda">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="search-overlay-inner">
        <input 
          type="text" 
          class="search-fullscreen-input" 
          :placeholder="t('nav.searchPlaceholder')"
          ref="searchInput" 
          v-model="searchQuery"
          @keyup.esc="toggleSearch"
        />
        <p class="search-hint" v-if="!searchQuery">{{ t('nav.searchHint') }}</p>
        
        <div class="search-results-grid" v-if="searchQuery">
          <router-link 
            :to="`/producto/${product.slug || product.id}`" 
            class="search-result-card" 
            v-for="product in searchResults" 
            :key="product.id"
            @click="toggleSearch"
          >
            <div class="search-result-img-wrapper">
              <img v-if="product.imagen_url" :src="product.imagen_url" :alt="product.nombre" class="search-result-img">
              <div v-else class="search-result-placeholder"></div>
            </div>
            <div class="search-result-info">
              <span class="search-result-store">{{ product.tienda }}</span>
              <h4 class="search-result-name">{{ product.nombre }}</h4>
              <span class="search-result-price">{{ formatPrice(product.precio) }}</span>
            </div>
          </router-link>
          
          <div v-if="searchResults.length === 0" class="search-no-results">
            No se encontraron productos que coincidan con "{{ searchQuery }}"
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.site-header {
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  position: sticky;
  top: 0;
  z-index: 50;
}

.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo {
  height: 40px;
  width: auto;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-main);
  padding: 4px;
}

.search-container {
  display: flex;
  align-items: center;
  position: relative;
}

/* Buscador Overlay Styles */
.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.98);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  backdrop-filter: blur(10px);
  overflow-y: auto;
  padding: 100px 0 60px 0;
}

.close-search {
  position: fixed;
  top: 40px;
  right: 40px;
  color: var(--text-main);
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.2s, color 0.2s;
}

.close-search:hover {
  transform: scale(1.1);
  color: var(--primary-color);
}

.search-overlay-inner {
  width: 100%;
  max-width: 800px;
  padding: 0 24px;
  text-align: center;
}

.search-fullscreen-input {
  width: 100%;
  font-family: var(--font-family);
  font-size: 3rem;
  font-weight: 800;
  color: var(--text-main);
  background: transparent;
  border: none;
  border-bottom: 2px solid var(--border-color);
  padding: 20px 0;
  outline: none;
  text-align: center;
  transition: border-color 0.3s;
}

.search-fullscreen-input:focus {
  border-bottom-color: var(--primary-color);
}

.search-fullscreen-input::placeholder {
  color: #cccccc;
  font-weight: 600;
}

.search-hint {
  margin-top: 24px;
  color: var(--text-muted);
  font-size: 1.1rem;
}

.search-results-grid {
  margin-top: 40px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 24px;
  text-align: left;
}

.search-result-card {
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s;
  background: white;
  padding: 12px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}

.search-result-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.search-result-img-wrapper {
  background: #f8f9fa;
  border-radius: 12px;
  aspect-ratio: 1;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.search-result-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.search-result-placeholder {
  width: 100%;
  height: 100%;
  background: #eee;
  border-radius: 8px;
}

.search-result-info {
  display: flex;
  flex-direction: column;
}

.search-result-store {
  font-size: 0.7rem;
  color: var(--primary-color);
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.search-result-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main);
  margin: 0 0 4px 0;
  line-height: 1.2;
}

.search-result-price {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-muted);
}

.search-no-results {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-muted);
  font-size: 1.1rem;
  padding: 40px 0;
}

.fade-search-enter-active,
.fade-search-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-search-enter-from,
.fade-search-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.lang-selector-container {
  position: relative;
}

.lang-switch {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
  background: transparent;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.lang-switch:hover, .lang-switch.active {
  background: #f9f9f9;
  border-color: #ddd;
}

.lang-switch .flag {
  font-size: 1.1rem;
}

.chevron-down {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 4px solid currentColor;
  margin-left: 2px;
}

.lang-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: -10px;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 16px 32px rgba(0,0,0,0.08);
  padding: 8px;
  list-style: none;
  min-width: 100px;
  z-index: 110;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-main);
  text-align: left;
  transition: background 0.2s;
}

.lang-option:hover {
  background: #f5f5f5;
}

.lang-option.selected {
  background: rgba(35, 118, 80, 0.1);
  color: var(--primary-color);
}

.lang-option .flag {
  font-size: 1.1rem;
}

/* Desktop Navigation */
.desktop-nav {
  display: none;
}

.desktop-nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: 40px;
}

.desktop-nav-links a {
  font-weight: 500;
  color: var(--text-main);
  transition: color 0.2s;
}

.desktop-nav-links a:hover,
.desktop-nav-links a.router-link-active {
  color: var(--primary-color);
}

/* Megamenu Styles */
.megamenu-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 100%;
}

.chevron {
  display: inline-block;
  width: 0;
  height: 0;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
  transition: transform 0.2s;
}

.desktop-nav-links .has-megamenu.is-active .chevron {
  transform: rotate(180deg);
}

.megamenu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: var(--bg-color);
  box-shadow: 0 16px 32px rgba(0,0,0,0.08);
  border-top: 1px solid var(--border-color);
  padding: 40px 0;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: opacity 0.3s ease, visibility 0.3s ease, transform 0.3s ease;
  z-index: 99;
  pointer-events: none;
}

.desktop-nav-links .has-megamenu.is-active .megamenu {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
  pointer-events: auto;
}

.megamenu::before {
  content: '';
  position: absolute;
  top: -24px;
  left: 0;
  width: 100%;
  height: 24px;
}

.megamenu-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 32px;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 48px;
}

.megamenu-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.megamenu-title {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--primary-color);
  margin-bottom: 12px;
  line-height: 1.2;
}

.megamenu-desc {
  font-size: 0.95rem;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 24px;
}

.megamenu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  background-color: var(--secondary-color);
  color: white;
  font-weight: 700;
  border-radius: 6px;
  transition: background-color 0.2s, transform 0.2s;
  font-size: 0.9rem;
}

.megamenu-btn:hover {
  background-color: #dca000;
  transform: translateY(-2px);
  color: white;
}

.megamenu-lists {
  border-left: 1px solid var(--border-color);
  padding-left: 48px;
}

.sub-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 24px;
}

.sub-menu li a {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-main);
  transition: color 0.2s, transform 0.2s;
  display: inline-flex;
  align-items: center;
}

.sub-menu li a:hover {
  color: var(--primary-color);
  transform: translateX(4px);
}


@media (min-width: 768px) {
  .header-container {
    padding: 16px 32px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .lang-dropdown {
    top: calc(100% + 16px);
  }
  
  .desktop-nav {
    display: block;
  }
  
  .hamburger-btn {
    display: none;
  }
  
  .mobile-nav {
    display: none !important;
  }
}

/* Mobile Nav Drawer */
.mobile-nav {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: white;
  border-top: 1px solid var(--border-color);
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}

.mobile-nav.nav-open {
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}

.nav-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-links li {
  border-bottom: 1px solid var(--border-color);
}

.nav-links a {
  display: block;
  padding: 16px 20px;
  font-weight: 500;
  color: var(--text-main);
  transition: color 0.2s, background-color 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: var(--primary-color);
  background-color: rgba(35, 118, 80, 0.05);
}

.mobile-submenu-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  font-weight: 500;
  color: var(--text-main);
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}

.mobile-submenu-toggle:hover {
  color: var(--primary-color);
  background-color: rgba(35, 118, 80, 0.05);
}

.mobile-sub-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: #f9f9f9;
  border-top: 1px solid var(--border-color);
}

.mobile-sub-menu a {
  padding: 12px 20px 12px 40px;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.mobile-sub-menu a:hover {
  color: var(--primary-color);
}


/* Carrito Flotante */
.floating-cart {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background-color: var(--secondary-color);
  color: white;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(246, 178, 0, 0.4);
  z-index: 100;
  transition: transform 0.2s;
}

.floating-cart:active {
  transform: scale(0.95);
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: var(--primary-color);
  color: white;
  font-size: 0.75rem;
  font-weight: bold;
  height: 20px;
  min-width: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  border: 2px solid white;
}

/* Chat Flotante */
.floating-chat {
  position: fixed;
  bottom: 96px; /* 24px + 56px (cart) + 16px */
  right: 24px;
  background-color: var(--primary-color);
  color: white;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(35, 118, 80, 0.4);
  z-index: 100;
  transition: transform 0.2s, background-color 0.2s;
  cursor: pointer;
  border: none;
}

.floating-chat:hover {
  background-color: #1a5c3c;
  transform: translateY(-2px);
}

.floating-chat:active {
  transform: scale(0.95);
}

.chat-window {
  position: fixed;
  bottom: 156px; /* 96px + 50px + 10px */
  right: 24px;
  width: calc(100vw - 48px);
  max-width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  z-index: 101;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
  font-family: var(--font-family);
}

.chat-header {
  background: var(--primary-color);
  color: white;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chat-header h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'Nunito', sans-serif;
}

.close-chat {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  opacity: 0.8;
  transition: opacity 0.2s, transform 0.2s;
}

.close-chat:hover {
  opacity: 1;
  transform: scale(1.1);
}

.chat-body {
  padding: 20px 16px;
  height: 240px;
  overflow-y: auto;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-msg {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.95rem;
  max-width: 85%;
  line-height: 1.4;
  margin: 0;
}

.bot-msg {
  background: white;
  color: var(--text-main);
  align-self: flex-start;
  border: 1px solid var(--border-color);
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}

.chat-footer {
  padding: 16px;
  background: white;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
}

.chat-input {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid var(--border-color);
  border-radius: 24px;
  font-size: 0.95rem;
  font-family: var(--font-family);
  outline: none;
  background: #f8f9fa;
  transition: border-color 0.3s, background-color 0.3s;
}

.chat-input:focus {
  border-color: var(--primary-color);
  background: white;
}

.chat-send {
  background: var(--secondary-color);
  color: white;
  border: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.chat-send:hover {
  background: #e5a600;
  transform: translateY(-2px);
}

.chat-send:active {
  transform: scale(0.9);
}

.fade-chat-enter-active,
.fade-chat-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.fade-chat-enter-from,
.fade-chat-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

@media (max-width: 600px) {
  .search-fullscreen-input {
    font-size: 2rem;
  }
}
</style>
