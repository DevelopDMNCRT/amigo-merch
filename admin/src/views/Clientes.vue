<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">Clientes</h1>
        
        <div class="flex items-center gap-3">
          <!-- Search input moved here -->
          <div class="relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="busqueda" type="text" placeholder="Buscar cliente..."
              class="pl-9 pr-4 py-2 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 w-64 shadow-sm" />
          </div>

          <span class="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-4 h-10 text-sm font-medium text-gray-500 dark:text-gray-400 shadow-sm">
            {{ total }} clientes
          </span>
        </div>
      </div>

      <!-- Card -->
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

        <!-- Header con búsqueda -->
        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Haz clic en <strong class="font-medium text-gray-700 dark:text-gray-300">Ver</strong> para consultar el historial de órdenes de un cliente.
          </p>
        </div>

        <!-- Loading / Error -->
        <div v-if="loading" class="px-6 py-12 text-center">
          <p class="text-sm text-gray-400 dark:text-gray-500">Cargando clientes...</p>
        </div>
        <div v-else-if="errorMsg" class="px-6 py-12 text-center">
          <p class="text-sm text-red-400">{{ errorMsg }}</p>
        </div>

        <!-- Table -->
        <div v-else class="border-t border-gray-100 dark:border-gray-800">
          <ClientesTable :clientes="paginados" />
        </div>

        <!-- Paginación -->
        <div v-if="!loading && !errorMsg" class="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {{ filtrados.length === 0 ? 0 : desde + 1 }}–{{ Math.min(desde + porPagina, filtrados.length) }} de {{ filtrados.length }}
          </p>
          <div class="flex items-center gap-2">
            <!-- Inicio -->
            <button
              @click="pagina = 1"
              :disabled="pagina === 1"
              class="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Ir al inicio"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
            </button>
            <!-- Anterior -->
            <button
              @click="pagina--"
              :disabled="pagina === 1"
              class="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Anterior"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            
            <!-- Input Página -->
            <div class="flex items-center gap-2 mx-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">Pág.</span>
              <input
                type="number"
                v-model.number="paginaInput"
                @keyup.enter="irAPagina"
                @blur="irAPagina"
                class="w-16 h-8 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10"
                min="1"
                :max="totalPaginas"
              />
              <span class="text-sm text-gray-500 dark:text-gray-400">de {{ totalPaginas }}</span>
            </div>

            <!-- Siguiente -->
            <button
              @click="pagina++"
              :disabled="pagina === totalPaginas"
              class="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Siguiente"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <!-- Final -->
            <button
              @click="pagina = totalPaginas"
              :disabled="pagina === totalPaginas"
              class="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Ir al final"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
            </button>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import ClientesTable from '@/components/tables/ClientesTable.vue'

const pagina    = ref(1)
const paginaInput = ref(1)
const porPagina = 5
const busqueda  = ref('')
const clientes  = ref([])
const loading   = ref(true)
const errorMsg  = ref('')

const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtFecha(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${d.getDate().toString().padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`
}

const cargar = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await fetch('/api/clientes')
    if (!res.ok) throw new Error('Error al cargar clientes')
    const data = await res.json()
    clientes.value = data.map((c, i) => ({
      // La tabla ClientesTable espera: id, cid, nombre, email, alta, ultimaCompra, pedidos
      id:           encodeURIComponent(c.correo),   // ID para la URL del detalle
      cid:          c.correo.split('@')[0].toUpperCase().slice(0, 8),
      nombre:       c.nombre,
      email:        c.correo,
      telefono:     c.telefono || '—',
      alta:         fmtFecha(c.primera_compra),
      ultimaCompra: fmtFecha(c.ultima_compra),
      pedidos:      c.total_pedidos,
      totalGastado: parseFloat(c.total_gastado),
    }))
  } catch (err) {
    errorMsg.value = err.message || 'Error desconocido'
  } finally {
    loading.value = false
  }
}

onMounted(cargar)

// Reset página cuando cambia la búsqueda
watch(busqueda, () => { 
  pagina.value = 1 
  paginaInput.value = 1
})

watch(pagina, (newVal) => {
  paginaInput.value = newVal
})

function irAPagina() {
  let p = parseInt(paginaInput.value)
  if (isNaN(p) || p < 1) p = 1
  if (p > totalPaginas.value) p = totalPaginas.value
  pagina.value = p
  paginaInput.value = p
}

const filtrados = computed(() => {
  if (!busqueda.value) return clientes.value
  const q = busqueda.value.toLowerCase()
  return clientes.value.filter(c =>
    c.nombre.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q)
  )
})

const total        = computed(() => clientes.value.length)
const totalPaginas = computed(() => Math.max(1, Math.ceil(filtrados.value.length / porPagina)))
const desde        = computed(() => (pagina.value - 1) * porPagina)
const paginados    = computed(() => filtrados.value.slice(desde.value, desde.value + porPagina))
const paginas      = computed(() => Array.from({ length: totalPaginas.value }, (_, i) => i + 1))
</script>
