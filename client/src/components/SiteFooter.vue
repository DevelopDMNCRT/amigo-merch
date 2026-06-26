<template>
  <footer class="site-footer">
    <div class="footer-container">
      <div class="footer-grid">
        <!-- Logo y Redes Sociales -->
        <div class="footer-brand">
          <img src="/logo.png" alt="Amigo Merch Logo" class="footer-logo" />
          <p class="footer-desc">{{ t('footer.desc') }}</p>
          <div class="social-links">
            <a href="https://www.instagram.com/amigomerchmx" target="_blank" rel="noopener noreferrer" aria-label="Instagram" class="social-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>
        </div>

        <!-- Mapa del Sitio -->
        <div class="footer-links-group">
          <h4 class="footer-heading">{{ t('footer.siteMap') }}</h4>
          <ul class="footer-links">
            <li><router-link to="/">{{ t('nav.home') }}</router-link></li>
            <li><router-link to="/tiendas">{{ t('nav.stores') }}</router-link></li>
            <li><router-link to="/nosotros">{{ t('nav.about') }}</router-link></li>
            <li><router-link to="/facturacion">{{ t('nav.billing') }}</router-link></li>
            <li><router-link to="/contacto">{{ t('nav.contact') }}</router-link></li>
          </ul>
        </div>

        <!-- Legal -->
        <div class="footer-links-group">
          <h4 class="footer-heading">{{ t('footer.legal') }}</h4>
          <ul class="footer-links">
            <li><router-link to="/aviso-privacidad">{{ t('footer.privacy') }}</router-link></li>
            <li><router-link to="/terminos">{{ t('footer.terms') }}</router-link></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="copyright">{{ t('footer.copyright') }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { useLocale } from '../composables/useLocale.js'
const { t } = useLocale()
</script>

<style scoped>
.site-footer {
  background-color: var(--primary-color);
  color: white;
  padding: 80px 0 24px;
  position: relative;
  overflow: hidden;
}

.site-footer::before {
  content: '';
  position: absolute;
  top: -40px;
  right: -40px;
  width: 200px;
  height: 200px;
  background: rgba(246, 178, 0, 0.05);
  border-radius: 50%;
  pointer-events: none;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
  position: relative;
  z-index: 1;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 64px;
  margin-bottom: 64px;
}

.footer-logo {
  height: 48px;
  width: auto;
  margin-bottom: 24px;
  filter: brightness(0) invert(1);
}

.footer-desc {
  font-family: 'Nunito Sans', sans-serif;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.05rem;
  line-height: 1.6;
  max-width: 350px;
  margin-bottom: 32px;
}

.social-links {
  display: flex;
  gap: 16px;
}

.social-icon {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.social-icon:hover {
  background-color: var(--secondary-color);
  color: #111;
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 8px 16px rgba(246, 178, 0, 0.3);
}

.footer-heading {
  font-family: 'Nunito', sans-serif;
  font-size: 1.2rem;
  font-weight: 800;
  margin-bottom: 24px;
  color: var(--secondary-color);
}

.footer-text {
  font-family: 'Nunito Sans', sans-serif;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 16px;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-links a {
  font-family: 'Nunito Sans', sans-serif;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 1.05rem;
  transition: color 0.2s, padding-left 0.2s;
  display: inline-block;
}

.footer-links a:hover {
  color: var(--secondary-color);
  padding-left: 6px;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 24px;
  text-align: center;
}

.copyright {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.6);
}

@media (max-width: 900px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
  .footer-brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 600px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
}
</style>
