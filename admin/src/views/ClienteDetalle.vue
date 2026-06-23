<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6" v-if="!loading && cliente">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <router-link
          to="/clientes"
          class="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </router-link>
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">{{ cliente.nombre }}</h1>
      </div>

      <div class="grid grid-cols-12 gap-5 items-start">

        <!-- ═══ LEFT: Perfil ═══ -->
        <div class="col-span-12 lg:col-span-8 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">Información del Cliente</h2>
          </div>
          <div class="px-6 py-6 space-y-6">

            <!-- Avatar + nombre + correo -->
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                <span class="text-xl font-bold text-brand-600 dark:text-brand-400">{{ initials(cliente.nombre) }}</span>
              </div>
              <div>
                <p class="text-lg font-bold text-gray-800 dark:text-white/90">{{ cliente.nombre }}</p>
                <a :href="`mailto:${cliente.correo}`" class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400">{{ cliente.correo }}</a>
              </div>
            </div>

            <div class="border-t border-gray-100 dark:border-gray-800" />

            <!-- Grid de datos -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Teléfono</p>
                <a :href="`tel:${cliente.telefono}`" class="text-sm text-gray-700 dark:text-gray-300 hover:text-brand-500">{{ cliente.telefono || '—' }}</a>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Primera Compra</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ fmtFecha(cliente.primeraCompra) }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Última Compra</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ fmtFecha(cliente.ultimaCompra) }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Total Pedidos</p>
                <p class="text-sm font-bold text-gray-800 dark:text-white/90">{{ totalPedidos }}</p>
              </div>
            </div>

          </div>
        </div>

        <!-- ═══ RIGHT: Stats ═══ -->
        <div class="col-span-12 lg:col-span-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">Resumen de Compras</h2>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-gray-800">
            <div class="px-5 py-4 flex items-center justify-between">
              <p class="text-sm text-gray-500 dark:text-gray-400">Total gastado</p>
              <p class="text-sm font-bold text-gray-800 dark:text-white/90">
                ${{ totalGastado.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }} MXN
              </p>
            </div>
            <div class="px-5 py-4 flex items-center justify-between">
              <p class="text-sm text-gray-500 dark:text-gray-400">Promedio por orden</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
                ${{ promedioOrden.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }} MXN
              </p>
            </div>
            <div class="px-5 py-4 flex items-center justify-between">
              <p class="text-sm text-gray-500 dark:text-gray-400">Pedidos completados</p>
              <p class="text-sm font-semibold text-success-600 dark:text-success-500">{{ completados }}</p>
            </div>
            <div class="px-5 py-4 flex items-center justify-between">
              <p class="text-sm text-gray-500 dark:text-gray-400">Cancelados / Fallidos</p>
              <p class="text-sm font-semibold text-error-600 dark:text-error-500">{{ cancelados }}</p>
            </div>
          </div>
        </div>

      </div>

      <!-- ═══ Historial de Órdenes ═══ -->
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">Historial de Órdenes</h2>
          <span class="rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-xs font-semibold px-2.5 py-0.5">
            {{ pedidos.length }} {{ pedidos.length === 1 ? 'orden' : 'órdenes' }}
          </span>
        </div>
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400"># Orden</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Fecha</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Ciudad</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Total</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Estado</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acciones</p></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="p in pedidos"
                :key="p.id"
                class="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td class="px-5 py-4 sm:px-6">
                  <span class="font-mono text-theme-sm font-semibold text-brand-600 dark:text-brand-400">#{{ p.orden }}</span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ fmtFecha(p.created_at) }}</span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ p.ciudad || '—' }}</span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    ${{ parseFloat(p.total).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }} MXN
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <span :class="estadoClase(p.estado)" class="rounded-full px-2.5 py-0.5 text-theme-xs font-medium">
                    {{ p.estado }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <router-link
                    :to="`/pedidos/${p.id}`"
                    class="inline-flex items-center gap-1.5 text-theme-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    Ver pedido
                  </router-link>
                </td>
              </tr>
              <tr v-if="pedidos.length === 0">
                <td colspan="6" class="px-5 py-10 text-center">
                  <p class="text-sm text-gray-400 dark:text-gray-500">No se encontraron órdenes.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="flex items-center justify-center min-h-[60vh]">
      <p class="text-sm text-gray-400 dark:text-gray-500">Cargando cliente...</p>
    </div>

    <!-- Not found -->
    <div v-else class="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p class="text-lg font-medium text-gray-600 dark:text-gray-400">Cliente no encontrado.</p>
      <router-link to="/clientes" class="mt-4 text-sm text-brand-500 hover:text-brand-600">← Volver a Clientes</router-link>
    </div>
  </AdminLayout>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const route   = useRoute()
const loading = ref(true)
const pedidos = ref([])   // lista de pedidos del cliente (raw de la API)
const rawCliente = ref(null)

const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

onMounted(async () => {
  try {
    const correo = decodeURIComponent(route.params.id)
    const res = await fetch(`/api/clientes/${encodeURIComponent(correo)}`)
    if (!res.ok) throw new Error()
    const data = await res.json()
    pedidos.value = data.pedidos   // array ordenado desc por created_at
    rawCliente.value = data.historico
  } catch {
    // cliente quedará null → muestra "not found"
  } finally {
    loading.value = false
  }
})

// Datos del cliente derivados de los pedidos (todos comparten correo/nombre/teléfono)
const cliente = computed(() => {
  if (pedidos.value.length === 0 && !rawCliente.value) return null
  
  let nombre = '', correo = '', telefono = '', primeraCompra = null, ultimaCompra = null

  if (rawCliente.value) {
    nombre = rawCliente.value.nombre
    correo = rawCliente.value.correo
    telefono = rawCliente.value.telefono || '—'
    primeraCompra = rawCliente.value.created_at
    ultimaCompra = rawCliente.value.ultima_actividad
  }

  if (pedidos.value.length > 0) {
    const newest = pedidos.value[0]
    const oldest = pedidos.value[pedidos.value.length - 1]
    nombre = newest.nombre || nombre
    correo = newest.correo || correo
    telefono = newest.telefono || telefono
    
    if (!primeraCompra || new Date(oldest.created_at) < new Date(primeraCompra)) {
        primeraCompra = oldest.created_at
    }
    if (!ultimaCompra || new Date(newest.created_at) > new Date(ultimaCompra)) {
        ultimaCompra = newest.created_at
    }
  }

  return { nombre, correo, telefono, primeraCompra, ultimaCompra }
})

const totalGastado  = computed(() => {
  const pSum = pedidos.value.reduce((s, p) => s + parseFloat(p.total), 0)
  const hSum = rawCliente.value ? parseFloat(rawCliente.value.total_gastado_historico || 0) : 0
  return pSum + hSum
})

const totalPedidos = computed(() => {
  const pCount = pedidos.value.length
  const hCount = rawCliente.value ? parseInt(rawCliente.value.total_pedidos_historico || 0) : 0
  return pCount + hCount
})

const promedioOrden = computed(() => totalPedidos.value ? totalGastado.value / totalPedidos.value : 0)

const completados   = computed(() => pedidos.value.filter(p => p.estado === 'Completado').length)
const cancelados    = computed(() => pedidos.value.filter(p => p.estado === 'Cancelado' || p.estado === 'Fallido').length)

// Helpers de UI
const initials = (nombre) => (nombre || '?').split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()

const estadoClase = (estado) => {
  const mapa = {
    'Nuevo':      'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400',
    'En proceso': 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
    'Completado': 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    'Fallido':    'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500',
    'Cancelado':  'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  }
  return mapa[estado] ?? mapa['Nuevo']
}
</script>
