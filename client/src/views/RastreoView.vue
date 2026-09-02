<script setup>
import { ref, computed, nextTick } from 'vue'
import { useLocale } from '../composables/useLocale.js'

const { t, dateLocale } = useLocale()

const orderInput = ref('')
const isLoading = ref(false)
const result = ref(null)
const searched = ref(false)
const hasInputError = ref(false)
const notFound = ref(false)

const stages = computed(() => [
  { id: 1, name: t('rastreo.stage1Name'), desc: t('rastreo.stage1Desc') },
  { id: 2, name: t('rastreo.stage2Name'), desc: t('rastreo.stage2Desc') },
  { id: 3, name: t('rastreo.stage3Name'), desc: t('rastreo.stage3Desc') },
  { id: 4, name: t('rastreo.stage4Name'), desc: t('rastreo.stage4Desc') },
])

/**
 * Mapea el estado del admin al estado interno del tracker.
 *
 * Nuevo       → stage 1 activo  (Pedido Recibido)
 * En proceso  → stage 3 activo  (En Proceso)
 * Completado  → stage 4 activo  (Pedido Enviado – final visible)
 * Cancelado   → tipo 'cancelado' → toda la línea roja
 * Fallido     → tipo 'fallido'   → toda la línea roja (mismo visual)
 *
 * Stage 2 (Pago Recibido) será automático con MercadoPago en el futuro.
 * Stage 5 (Entregado) queda reservado para confirmar entrega física.
 */
function mapEstadoToResult(pedido) {
  const estado = (pedido.estado || 'Nuevo').trim()
  if (estado === 'Cancelado') {
    return { type: 'cancelado', reason: t('rastreo.cancelledReason'), pedido }
  }
  if (estado === 'Fallido') {
    return { type: 'fallido', reason: t('rastreo.failedReason'), pedido }
  }
  const stageMap = {
    'Nuevo':      1,
    'En proceso': 3,
    'Completado': 4,   // Pedido Enviado – estado final visible en el tracker
  }
  const currentStage = stageMap[estado] ?? 1
  return { type: 'activo', currentStage, pedido }
}

async function searchOrder() {
  const val = orderInput.value.trim()
  if (val.length < 4) { hasInputError.value = true; return }
  hasInputError.value = false
  notFound.value = false
  isLoading.value = true
  searched.value = false
  result.value = null

  try {
    const res = await fetch(`/api/pedidos/orden/${encodeURIComponent(val)}`)
    if (res.status === 404) {
      notFound.value = true
    } else if (!res.ok) {
      notFound.value = true
    } else {
      const pedido = await res.json()
      result.value = mapEstadoToResult(pedido)
    }
  } catch {
    notFound.value = true
  } finally {
    isLoading.value = false
    searched.value = true
  }
}

function stageStatus(id) {
  if (!result.value) return 'pending'
  // Cancelado o Fallido: TODA la línea roja desde el primer paso
  if (result.value.type === 'cancelado' || result.value.type === 'fallido') return 'cancelled'
  const c = result.value.currentStage
  if (id < c) return 'completed'
  if (id === c) return c === 4 ? 'completed' : 'active'  // stage 4 es el final visible
  return 'pending'
}

function lineStatus(id) {
  const a = stageStatus(id), b = stageStatus(id + 1)
  if (a === 'cancelled') return 'error'
  if (a === 'completed' && b === 'completed') return 'completed'
  if (a === 'completed' && b === 'active') return 'half'
  if (a === 'dimmed') return 'dimmed'
  return 'pending'
}

function stageDate(id) {
  if (!result.value) return null
  const s = stageStatus(id)
  if (!['completed', 'active', 'failed', 'cancelled'].includes(s)) return null

  // Únicamente mostramos la fecha real del pedido para el Stage 1 (Pedido Recibido)
  if (id === 1) {
    const createdAt = result.value.pedido?.created_at
    return createdAt ? new Date(createdAt) : null
  }
  return null
}

function fmtDate(d) {
  if (!d) return ''
  return d.toLocaleDateString(dateLocale.value, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const isError = computed(() => result.value?.type === 'cancelado' || result.value?.type === 'fallido')

const statusLabel = computed(() => {
  if (!result.value) return ''
  if (result.value.type === 'cancelado') return t('rastreo.statusCancelled')
  if (result.value.type === 'fallido') return t('rastreo.statusFailed')
  if (result.value.currentStage === 4) return t('rastreo.statusDone')  // Stage 4 = final visible
  return t('rastreo.statusActive')
})

const clienteName = computed(() => result.value?.pedido?.nombre || '')
</script>

<template>
  <div class="rastreo-page">

    <!-- ── Header Banner ──────────────────────────── -->
    <div class="header-banner rastreo-banner">
      <div class="banner-overlay"></div>
      <div class="banner-content">
        <h1>{{ t('rastreo.bannerTitle') }}</h1>
        <p>{{ t('rastreo.bannerSub') }}</p>
      </div>
    </div>

    <!-- ── Content ───────────────────────────────── -->
    <div class="content-wrap">

      <!-- Search Card -->
      <div class="search-card">
        <h2 class="search-heading">{{ t('rastreo.searchHeading') }}</h2>
        <p class="search-sub">{{ t('rastreo.searchSub') }}</p>

        <form @submit.prevent="searchOrder" class="search-form">
          <div class="input-row" :class="{ disabled: isLoading }">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </span>
            <input
              v-model="orderInput"
              type="text"
              class="order-input"
              :placeholder="t('rastreo.searchPlaceholder')"
              autocomplete="off"
              :disabled="isLoading"
              @keydown.enter.prevent="searchOrder"
            />
            <button type="submit" class="search-btn" :disabled="isLoading || orderInput.trim().length < 1">
              <span v-if="isLoading" class="btn-spinner">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" stroke-width="2.5"/>
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                </svg>
              </span>
              <span v-else class="btn-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                {{ t('rastreo.searchBtn') }}
              </span>
            </button>
          </div>
          <p v-if="hasInputError" class="input-error">{{ t('rastreo.inputError') }}</p>
        </form>

        <p class="search-hint">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          Ingresa el número de orden tal como aparece en tu correo de confirmación.
        </p>
      </div>

      <!-- Loading skeleton -->
      <transition name="fade">
        <div v-if="isLoading" class="skeleton-card">
          <div class="sk-header">
            <div class="sk-block sk-title"></div>
            <div class="sk-block sk-badge"></div>
          </div>
          <div v-for="i in 5" :key="i" class="sk-row">
            <div class="sk-dot"></div>
            <div class="sk-lines">
              <div class="sk-block sk-line-a"></div>
              <div class="sk-block sk-line-b"></div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Not found card -->
      <transition name="result">
        <div v-if="searched && notFound" class="not-found-card">
          <div class="not-found-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div>
            <p class="not-found-title">Pedido no encontrado</p>
            <p class="not-found-sub">Verifica que el número de orden sea correcto. Lo encuentras en el correo de confirmación de tu compra.</p>
          </div>
        </div>
      </transition>

      <!-- Result Card -->
      <transition name="result">
        <div
          v-if="searched && result"
          class="result-card"
          :class="isError ? 'result-error' : 'result-ok'"
        >
          <!-- Error Banner -->
          <div v-if="isError" class="error-banner">
            <div class="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div>
              <p class="error-title">{{ result.type === 'cancelado' ? t('rastreo.cancelledTitle') : t('rastreo.failedTitle') }}</p>
              <p class="error-reason">{{ result.reason }}</p>
            </div>
          </div>

          <!-- Order header -->
          <div class="order-header">
            <div>
              <p class="order-label-text">{{ t('rastreo.orderLabel') }}</p>
              <p class="order-num">#{{ result.pedido?.orden?.toUpperCase() || orderInput.trim().toUpperCase() }}</p>
              <p v-if="clienteName" class="order-cliente">{{ clienteName }}</p>
            </div>
            <div
              class="status-badge"
              :class="{
                'badge-active': !isError && result.currentStage !== 4,
                'badge-done': !isError && result.currentStage === 4,
                'badge-error': isError
              }"
            >
              <span class="badge-pulse" v-if="!isError && result.currentStage !== 4"></span>
              {{ statusLabel }}
            </div>
          </div>

          <!-- Progress bar -->
          <div class="progress-bar-wrap" :class="{ 'progress-error-track': isError }">
            <div
              class="progress-bar-fill"
              :style="isError ? { width: '100%' } : { width: ((result.currentStage - 1) / 3 * 100) + '%' }"
              :class="{
                'progress-done':  !isError && result.currentStage === 4,
                'progress-error': isError
              }"
            ></div>
          </div>

          <!-- Timeline -->
          <div class="timeline">
            <div
              v-for="(stage, idx) in stages"
              :key="stage.id"
              class="tl-item"
              :class="'tl-' + stageStatus(stage.id)"
              :style="{ '--i': idx }"
            >
              <!-- Dot column -->
              <div class="tl-dot-col">
                <div class="tl-dot">
                  <!-- Checkmark -->
                  <svg v-if="stageStatus(stage.id) === 'completed'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <!-- Active pulse -->
                  <div v-else-if="stageStatus(stage.id) === 'active'" class="dot-active-inner">
                    <div class="dot-active-ring"></div>
                  </div>
                  <!-- X for failed/cancelled -->
                  <svg v-else-if="stageStatus(stage.id) === 'failed' || stageStatus(stage.id) === 'cancelled'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
                <!-- Connector -->
                <div v-if="idx < stages.length - 1" class="tl-line" :class="'line-' + lineStatus(stage.id)">
                  <div class="tl-line-fill" v-if="lineStatus(stage.id) === 'half'"></div>
                </div>
              </div>

              <!-- Content -->
              <div class="tl-content">
                <div class="tl-header-row">
                  <span class="tl-name">{{ stage.name }}</span>
                  <span v-if="stageDate(stage.id)" class="tl-date">{{ fmtDate(stageDate(stage.id)) }}</span>
                </div>
                <p class="tl-desc">{{ stage.desc }}</p>
              </div>
            </div>
          </div>



          <!-- Error CTA -->
          <div v-if="isError" class="error-cta">
            <router-link to="/contacto" class="btn-support">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              {{ t('rastreo.contactSupport') }}
            </router-link>
          </div>
        </div>
      </transition>

    </div>
  </div>
</template>

<style scoped>
/* ── Page wrapper ──────────────────────────────────── */
.rastreo-page {
  min-height: calc(100vh - 64px);
  background: #f8f9fa;
  font-family: var(--font-family);
}

/* ── Header Banner ──────────────────────────── */
.header-banner {
  position: relative;
  height: 250px;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.rastreo-banner {
  background-image: url('/images/delivery_header.png');
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
  font-size: 3rem;
  font-weight: 900;
  margin: 0 0 16px 0;
}

.banner-content p {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 0;
}

/* ── Content wrap ──────────────────────────────────── */
.content-wrap {
  max-width: 680px;
  margin: 0 auto;
  padding: 48px 20px 80px;
}

/* ── Search Card ───────────────────────────────────── */
.search-card {
  background: white;
  border-radius: 16px;
  padding: 36px 32px 28px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  margin-bottom: 28px;
}

.search-heading {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0 0 6px;
}

.search-sub {
  font-size: 0.9rem;
  color: var(--text-muted);
  margin: 0 0 24px;
}

.input-row {
  display: flex;
  align-items: stretch;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
}

.input-row:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(35,118,80,0.12);
}

.input-row.disabled { opacity: 0.65; pointer-events: none; }

.input-icon {
  display: flex;
  align-items: center;
  padding: 0 14px;
  color: var(--text-muted);
  background: #f9f9f9;
  border-right: 1px solid var(--border-color);
  flex-shrink: 0;
}

.order-input {
  flex: 1;
  padding: 14px 16px;
  font-size: 1rem;
  font-family: var(--font-family);
  font-weight: 600;
  color: var(--text-main);
  background: transparent;
  border: none;
  outline: none;
  min-width: 0;
}

.order-input::placeholder { font-weight: 400; color: #bbb; }

.search-btn {
  flex-shrink: 0;
  padding: 0 24px;
  background: var(--primary-color);
  color: white;
  font-family: var(--font-family);
  font-size: 0.95rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s, transform 0.15s;
  min-width: 110px;
  justify-content: center;
}

.search-btn:hover:not(:disabled) { background: #1a5c3c; }
.search-btn:disabled { background: #c5c5c5; cursor: not-allowed; }

.btn-inner { display: flex; align-items: center; gap: 7px; }

.btn-spinner svg {
  width: 22px; height: 22px;
  animation: spin 0.75s linear infinite;
}

.input-error {
  color: #e53935;
  font-size: 0.82rem;
  margin: 8px 0 0;
  font-weight: 500;
}

.demo-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
}

.demo-label {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.demo-chip {
  font-family: var(--font-family);
  font-size: 0.82rem;
  font-weight: 700;
  padding: 5px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--border-color);
  background: white;
  color: var(--text-main);
  cursor: pointer;
  transition: all 0.2s;
}

.demo-chip:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(35,118,80,0.05);
}

.demo-chip-err:hover {
  border-color: #e53935;
  color: #e53935;
  background: rgba(229,57,53,0.05);
}

/* ── Loading Skeleton ──────────────────────────────── */
.skeleton-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  margin-bottom: 28px;
}

.sk-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.sk-block {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 6px;
}

.sk-title { height: 20px; width: 160px; }
.sk-badge { height: 28px; width: 90px; border-radius: 20px; }

.sk-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 28px;
}

.sk-dot {
  width: 44px; height: 44px;
  border-radius: 50%;
  flex-shrink: 0;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.sk-lines { flex: 1; padding-top: 4px; }
.sk-line-a { height: 14px; width: 55%; margin-bottom: 8px; }
.sk-line-b { height: 11px; width: 80%; }

/* ── Result Card ───────────────────────────────────── */
.result-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  overflow: hidden;
}

.result-ok  { border-top: 4px solid var(--primary-color); }
.result-error { border-top: 4px solid #e53935; }

/* Error Banner */
.error-banner {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: #fff5f5;
  border-bottom: 1px solid #ffd7d7;
  padding: 20px 28px;
}

.error-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px; height: 48px;
  border-radius: 50%;
  background: #ffebee;
  color: #e53935;
}

.error-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: #c62828;
  margin: 2px 0 4px;
}

.error-reason {
  font-size: 0.88rem;
  color: #e57373;
  margin: 0;
  line-height: 1.5;
}

/* Order Header */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px 16px;
  gap: 12px;
  flex-wrap: wrap;
}

.order-label-text {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin: 0 0 4px;
}

.order-num {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0;
  letter-spacing: -0.3px;
}

.order-cliente {
  font-size: 0.85rem;
  color: var(--text-muted);
  margin: 4px 0 0;
  font-weight: 500;
}

/* Not found card */
.not-found-card {
  background: white;
  border-radius: 16px;
  padding: 28px 28px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.07);
  margin-bottom: 28px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  border-top: 4px solid #e0e0e0;
}

.not-found-icon {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #f5f5f5;
  color: #aaa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-found-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-main);
  margin: 0 0 6px;
}

.not-found-sub {
  font-size: 0.87rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
}

/* Search hint */
.search-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-muted);
  margin-top: 16px;
  line-height: 1.4;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
}

.badge-active  { background: rgba(246,178,0,0.15); color: #a07800; }
.badge-done    { background: rgba(35,118,80,0.12); color: var(--primary-color); }
.badge-error   { background: rgba(229,57,53,0.1); color: #c62828; }

.badge-pulse {
  display: inline-block;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #F6B200;
  animation: badgePulse 1.5s ease infinite;
}

/* Progress bar */
.progress-bar-wrap {
  height: 4px;
  background: #f0f0f0;
  margin: 0 28px 8px;
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), #F6B200);
  border-radius: 2px;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.progress-done  { background: var(--primary-color); }
.progress-error { background: #e53935; }
.progress-error-track { background: #ffebee; }

/* ── Timeline ──────────────────────────────────────── */
.timeline {
  padding: 20px 28px 24px;
}

.tl-item {
  display: flex;
  gap: 18px;
  animation: itemIn 0.45s ease both;
  animation-delay: calc(var(--i) * 0.08s);
}

/* Dot column */
.tl-dot-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.tl-dot {
  width: 46px; height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: background 0.3s;
  flex-shrink: 0;
}

.tl-completed .tl-dot { background: var(--primary-color); }
.tl-active    .tl-dot { background: #F6B200; }
.tl-pending   .tl-dot { background: #f0f0f0; }
.tl-dimmed    .tl-dot { background: #f5f5f5; }
.tl-failed    .tl-dot { background: #e53935; }
.tl-cancelled .tl-dot { background: #e53935; }

/* Active pulse ring */
.dot-active-inner {
  width: 14px; height: 14px;
  border-radius: 50%;
  background: white;
  position: relative;
}

.dot-active-ring {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid #F6B200;
  animation: pulseRing 1.6s ease-out infinite;
}

/* Connector line */
.tl-line {
  flex: 1;
  width: 2px;
  min-height: 32px;
  margin: 4px 0;
  border-radius: 1px;
  overflow: hidden;
  position: relative;
}

.line-completed { background: var(--primary-color); }
.line-half {
  background: #e0e0e0;
  position: relative;
}
.line-half .tl-line-fill {
  position: absolute;
  top: 0; left: 0;
  width: 100%;
  height: 50%;
  background: var(--primary-color);
  border-radius: 1px;
}
.line-error  { background: #ffcdd2; }
.line-dimmed { background: #eeeeee; }
.line-pending { background: #e0e0e0; }

/* Timeline content */
.tl-content {
  flex: 1;
  padding: 8px 0 28px;
  min-width: 0;
}

.tl-item:last-child .tl-content { padding-bottom: 4px; }

.tl-header-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.tl-name {
  font-size: 0.98rem;
  font-weight: 700;
  transition: color 0.2s;
}

.tl-completed .tl-name { color: var(--primary-color); }
.tl-active    .tl-name { color: #a07800; }
.tl-failed    .tl-name,
.tl-cancelled .tl-name { color: #c62828; }
.tl-pending   .tl-name { color: var(--text-muted); }
.tl-dimmed    .tl-name { color: #c5c5c5; }

.tl-date {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
}

.tl-desc {
  font-size: 0.86rem;
  line-height: 1.5;
  margin: 0;
  transition: color 0.2s;
}

.tl-completed .tl-desc { color: #555; }
.tl-active    .tl-desc { color: #666; }
.tl-pending   .tl-desc { color: #b0b0b0; }
.tl-dimmed    .tl-desc { color: #d0d0d0; }
.tl-failed    .tl-desc,
.tl-cancelled .tl-desc { color: #e57373; }

/* ── ETA row ───────────────────────────────────────── */
.eta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 28px 24px;
  padding: 14px 18px;
  background: rgba(35,118,80,0.06);
  border-radius: 10px;
  font-size: 0.88rem;
  color: var(--primary-color);
  font-weight: 500;
}

.eta-row strong { font-weight: 700; }

/* ── Error CTA ─────────────────────────────────────── */
.error-cta {
  padding: 0 28px 28px;
}

.btn-support {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 11px 22px;
  background: #e53935;
  color: white;
  font-family: var(--font-family);
  font-size: 0.9rem;
  font-weight: 700;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.2s, transform 0.15s;
}

.btn-support:hover {
  background: #c62828;
  transform: translateY(-2px);
  color: white;
}

/* ── Transitions ───────────────────────────────────── */
.result-enter-active {
  animation: resultIn 0.5s cubic-bezier(0.34, 1.4, 0.64, 1) both;
}
.result-leave-active { transition: opacity 0.2s; }
.result-leave-to { opacity: 0; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Keyframes ─────────────────────────────────────── */
@keyframes resultIn {
  from { opacity: 0; transform: translateY(36px) scale(0.97); }
  to   { opacity: 1; transform: none; }
}

@keyframes itemIn {
  from { opacity: 0; transform: translateX(-14px); }
  to   { opacity: 1; transform: none; }
}

@keyframes pulseRing {
  0%   { transform: scale(0.85); opacity: 1; }
  80%, 100% { transform: scale(1.9); opacity: 0; }
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.7; }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Responsive ────────────────────────────────────── */
@media (max-width: 600px) {
  .hero { padding: 56px 20px 88px; }
  .hero-title { font-size: 1.9rem; }
  .search-card { padding: 24px 20px 20px; }
  .input-row { flex-direction: column; border-radius: 12px; }
  .input-icon { border-right: none; border-bottom: 1px solid var(--border-color); padding: 12px 16px; background: #f9f9f9; }
  .order-input { padding: 12px 16px; }
  .search-btn { padding: 14px; border-radius: 0 0 10px 10px; min-width: unset; }
  .order-header { padding: 20px 20px 12px; }
  .timeline { padding: 16px 20px 20px; }
  .eta-row { margin: 0 20px 20px; }
  .error-cta { padding: 0 20px 24px; }
  .error-banner { padding: 16px 20px; }
  .progress-bar-wrap { margin: 0 20px 8px; }
  .tl-dot { width: 40px; height: 40px; }
}
</style>
