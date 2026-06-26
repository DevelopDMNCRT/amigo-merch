<template>
  <main class="pago-resultado-view">
    <div class="resultado-card" :class="status">
      <div class="icono-wrapper">
        <!-- Éxito -->
        <svg v-if="status === 'exito'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <!-- Fallido -->
        <svg v-else-if="status === 'fallido'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <!-- Pendiente -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>

      <h1>{{ info.titulo }}</h1>
      <p class="subtitulo">{{ info.subtitulo }}</p>

      <div class="pedido-info" v-if="pedido">
        <span class="label">Número de orden</span>
        <span class="valor">#{{ pedido.orden }}</span>
        <span class="label">Total</span>
        <span class="valor">{{ formatPrice(pedido.total) }}</span>
        <span class="label">Estado</span>
        <span class="valor estado-badge" :class="pedido.estado?.toLowerCase().replace(' ', '-')">{{ pedido.estado }}</span>
      </div>

      <div class="acciones">
        <router-link to="/rastreo" class="btn-primario" v-if="status === 'exito' || status === 'pendiente'">
          Rastrear mi pedido
        </router-link>
        <router-link to="/checkout" class="btn-secundario" v-if="status === 'fallido'">
          Intentar de nuevo
        </router-link>
        <router-link to="/" class="btn-secundario">
          Volver al inicio
        </router-link>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { formatPrice } from '../store/locale.js'

const route = useRoute()
const pedido = ref(null)

// Determinar el status por la ruta actual
const status = computed(() => {
  if (route.path.includes('exito'))    return 'exito'
  if (route.path.includes('fallido'))  return 'fallido'
  return 'pendiente'
})

const info = computed(() => {
  if (status.value === 'exito') return {
    titulo: '¡Pago recibido! 🎉',
    subtitulo: 'Tu pedido ha sido registrado y está siendo procesado. Recibirás actualizaciones por correo (Por favor, revisa tu carpeta de Spam o Correo no deseado).'
  }
  if (status.value === 'fallido') return {
    titulo: 'Pago no completado',
    subtitulo: 'Hubo un problema con tu pago. Puedes intentarlo nuevamente o contactarnos.'
  }
  return {
    titulo: 'Pago pendiente ⏳',
    subtitulo: 'Tu pago está siendo procesado. En cuanto se confirme, actualizaremos tu pedido.'
  }
})

onMounted(async () => {
  const pedidoId = route.query.pedido_id
  if (!pedidoId) return
  try {
    const res = await fetch(`/api/pagos/verificar/${pedidoId}`)
    if (res.ok) pedido.value = await res.json()
  } catch (err) {
    console.error('Error verificando pedido:', err)
  }
})
</script>

<style scoped>
.pago-resultado-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: #f8f9fa;
}

.resultado-card {
  background: white;
  border-radius: 28px;
  padding: 56px 48px;
  max-width: 520px;
  width: 100%;
  text-align: center;
  box-shadow: 0 8px 40px rgba(0,0,0,0.08);
  border-top: 6px solid #ccc;
}

.resultado-card.exito    { border-top-color: #237650; }
.resultado-card.fallido  { border-top-color: #e53935; }
.resultado-card.pendiente { border-top-color: #F6B200; }

.icono-wrapper {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.exito    .icono-wrapper { background: rgba(35,118,80,0.1);  color: #237650; }
.fallido  .icono-wrapper { background: rgba(229,57,53,0.1);  color: #e53935; }
.pendiente .icono-wrapper { background: rgba(246,178,0,0.15); color: #cc9600; }

.icono-wrapper svg {
  width: 44px;
  height: 44px;
}

h1 {
  font-family: 'Nunito', sans-serif;
  font-size: 2rem;
  font-weight: 900;
  color: var(--text-main, #111);
  margin-bottom: 12px;
}

.subtitulo {
  font-family: 'Nunito Sans', sans-serif;
  color: #666;
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 32px;
}

.pedido-info {
  background: #f8f9fa;
  border-radius: 16px;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 16px;
  margin-bottom: 36px;
  text-align: left;
}

.label {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 0.85rem;
  color: #888;
  font-weight: 600;
}

.valor {
  font-family: 'Nunito', sans-serif;
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-main, #111);
  text-align: right;
}

.estado-badge {
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 0.82rem;
  text-align: right;
}

.estado-badge.en-proceso  { background: rgba(35,118,80,0.12);  color: #237650; }
.estado-badge.nuevo       { background: rgba(246,178,0,0.15);  color: #cc9600; }
.estado-badge.fallido     { background: rgba(229,57,53,0.1);   color: #e53935; }

.acciones {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-primario,
.btn-secundario {
  display: block;
  padding: 16px;
  border-radius: 14px;
  font-family: 'Nunito', sans-serif;
  font-weight: 800;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.2s;
}

.btn-primario {
  background: var(--primary-color, #237650);
  color: white;
}

.btn-primario:hover {
  background: #1a5c3c;
  transform: translateY(-2px);
}

.btn-secundario {
  background: #f0f0f0;
  color: var(--text-main, #111);
}

.btn-secundario:hover {
  background: #e4e4e4;
}
</style>
