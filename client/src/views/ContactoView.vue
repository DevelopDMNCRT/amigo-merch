<template>
  <main class="contacto-view">
    <div class="header-banner">
      <div class="banner-overlay"></div>
      <div class="banner-content">
        <h1>{{ t('contacto.bannerTitle') }}</h1>
        <p>{{ t('contacto.bannerSub') }}</p>
      </div>
    </div>

    <div class="contact-container">
      <div class="contact-content-stacked">
          <!-- Formulario -->
          <div class="contact-form-card">
            <form class="contact-form" @submit.prevent="submitForm">
              <div class="form-group">
                <label for="name">{{ t('home.contactName') }}</label>
                <input type="text" id="name" v-model="contactForm.name" :placeholder="t('home.contactNamePh')" required :disabled="isSubmitting">
              </div>
              
              <div class="form-group">
                <label for="email">{{ t('home.contactEmail') }}</label>
                <input type="email" id="email" v-model="contactForm.email" :placeholder="t('home.contactEmailPh')" required :disabled="isSubmitting">
              </div>
              
              <div class="form-group">
                <label for="subject">{{ t('home.contactSubject') }}</label>
                <select id="subject" v-model="contactForm.subject" required :disabled="isSubmitting">
                  <option value="" disabled>{{ t('home.contactSubjectPh') }}</option>
                  <option value="pedido">{{ t('home.contactOrder') }}</option>
                  <option value="maquila">{{ t('home.contactMaquila') }}</option>
                  <option value="otro">{{ t('home.contactOther') }}</option>
                </select>
              </div>
              
              <div class="form-group">
                <label for="message">{{ t('home.contactMessage') }}</label>
                <textarea id="message" v-model="contactForm.message" rows="4" :placeholder="t('home.contactMessagePh')" required :disabled="isSubmitting"></textarea>
              </div>
              
              <button type="submit" class="submit-btn" :disabled="isSubmitting">
                <span v-if="isSubmitting">...</span>
                <span v-else>{{ t('home.contactSend') }}</span>
              </button>
            </form>
          </div>

          <!-- Info de Contacto -->
          <div class="contact-info-card">
            <div class="info-item">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div class="info-text">
                <h3>{{ t('home.contactPhone') }}</h3>
                <p><a href="tel:+525512345678">+52 55 1234 5678</a></p>
              </div>
            </div>
            
            <div class="info-item">
              <div class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div class="info-text">
                <h3>{{ t('home.contactEmailLabel') }}</h3>
                <p><a href="mailto:hola@amigomerch.mx">hola@amigomerch.mx</a></p>
              </div>
            </div>
          </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useLocale } from '../composables/useLocale.js'

const { t } = useLocale()

const contactForm = ref({
  name: '',
  email: '',
  subject: '',
  message: ''
})
const isSubmitting = ref(false)

const submitForm = async () => {
  if (isSubmitting.value) return;
  isSubmitting.value = true;
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
    isSubmitting.value = false;
  }
}

onMounted(() => {
  window.scrollTo(0, 0)
})
</script>

<style scoped>
.contacto-view {
  background-color: #fafafa;
  min-height: 100vh;
  padding-bottom: 80px;
}

/* Header Banner */
.header-banner {
  position: relative;
  height: 250px;
  background-image: url('/images/contact_header.png');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.banner-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(to right, rgba(35, 118, 80, 0.9), rgba(0,0,0,0.6));
}

.banner-content {
  position: relative;
  z-index: 1;
  color: white;
  padding: 0 20px;
}

.banner-content h1 {
  font-family: 'Nunito', sans-serif;
  font-size: 2.5rem;
  font-weight: 900;
  margin: 0 0 8px 0;
}

.banner-content p {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0;
}



.contact-container {
  max-width: 900px;
  margin: -40px auto 0;
  padding: 0 20px;
  position: relative;
  z-index: 2;
}


.contact-content-stacked {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.contact-info-card {
  background: white;
  border-radius: 20px;
  padding: 32px 40px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  gap: 32px;
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
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.06);
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
