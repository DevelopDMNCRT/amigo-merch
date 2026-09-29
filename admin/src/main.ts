import './assets/main.css'
import 'flatpickr/dist/flatpickr.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import VueApexCharts from 'vue3-apexcharts'

// Interceptor global para inyectar token de autenticación en llamadas /api/
const originalFetch = window.fetch
window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : input.toString()
  if (url.startsWith('/api/') || url.includes('/api/')) {
    const token = localStorage.getItem('amigo_admin_token')
    if (token) {
      const headers = new Headers(init.headers || {})
      if (!headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      init.headers = headers
    }
  }

  const response = await originalFetch(input, init)

  if (response.status === 401 && !url.includes('/api/auth/login')) {
    localStorage.removeItem('amigo_admin_token')
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }

  return response
}

const app = createApp(App)

app.use(router)
app.use(VueApexCharts)

app.mount('#app')
