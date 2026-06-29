<template>
  <AdminLayout>
    <div class="space-y-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">Inventario</h1>
        
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <input 
            type="text" 
            v-model="buscarInventario"
            placeholder="Buscar producto..." 
            class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 min-w-[200px]" 
          />
          <a 
            href="/api/reportes/stock-pdf" 
            target="_blank"
            class="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12v6"/><path d="M10 12l2 2"/><path d="M10 12l-2 2"/></svg>
            PDF
          </a>
        </div>
      </div>

      <div v-if="loadingInventario" class="flex justify-center items-center py-20">
        <svg class="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
      </div>

      <div v-else class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th class="px-6 py-4 font-semibold w-1/3">PRODUCTO</th>
                <th class="px-6 py-4 font-semibold w-1/4">TIENDA</th>
                <th class="px-6 py-4 font-semibold">EXISTENCIAS (POR VARIACIÓN)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="(item, index) in paginatedInventario" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="px-6 py-4 font-medium text-gray-800 dark:text-gray-200 align-top">
                  {{ item.producto }}
                </td>
                <td class="px-6 py-4 text-gray-500 dark:text-gray-400 align-top">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                    {{ item.tienda }}
                  </span>
                </td>
                <td class="px-6 py-4 align-top">
                  <div class="mb-2">
                    <span class="text-sm font-bold text-gray-900 dark:text-white">Total: {{ item.total_unidades }}</span>
                  </div>
                  <div class="flex flex-wrap gap-1.5" v-if="item.variaciones && item.variaciones.length > 0 && item.variaciones[0].nombre !== 'N/A'">
                    <span 
                      v-for="v in item.variaciones" 
                      :key="v.nombre" 
                      class="inline-flex items-center gap-1.5 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md"
                    >
                      <span class="truncate max-w-[150px]" :title="v.nombre">{{ v.nombre }}</span>
                      <span class="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
                      <span class="font-bold text-gray-900 dark:text-white">{{ v.unidades }}</span>
                    </span>
                  </div>
                  <div v-else>
                    <span class="text-xs text-gray-500 dark:text-gray-400">Sin variaciones</span>
                  </div>
                </td>
              </tr>
              <tr v-if="paginatedInventario.length === 0">
                <td colspan="3" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No se encontraron productos en el inventario.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Mostrando página <span class="font-medium text-gray-800 dark:text-white/90">{{ currentPage }}</span> de <span class="font-medium text-gray-800 dark:text-white/90">{{ totalPages }}</span>
          </p>
          <div class="flex items-center gap-2">
            <button 
              @click="currentPage > 1 ? currentPage-- : null"
              :disabled="currentPage === 1"
              class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium transition-colors"
              :class="currentPage === 1 ? 'text-gray-400 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
            >
              Anterior
            </button>
            <button 
              @click="currentPage < totalPages ? currentPage++ : null"
              :disabled="currentPage === totalPages"
              class="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium transition-colors"
              :class="currentPage === totalPages ? 'text-gray-400 bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import AdminLayout from '@/components/layout/AdminLayout.vue';

const loadingInventario = ref(true);
const totalPiezas = ref(0);
const inventario = ref([]);
const buscarInventario = ref('');

// Paginación
const currentPage = ref(1);
const itemsPerPage = 10;

const fetchInventario = async () => {
  loadingInventario.value = true;
  try {
    const res = await fetch('/api/reportes/inventario');
    if (res.ok) {
      const data = await res.json();
      totalPiezas.value = data.totalPiezas;
      inventario.value = data.inventario;
    }
  } catch (e) { console.error('Error fetching inventario:', e); }
  finally { loadingInventario.value = false; }
};

const inventarioFiltrado = computed(() => {
  let result = inventario.value;
  if (buscarInventario.value) {
    const lowerSearch = buscarInventario.value.toLowerCase();
    result = result.filter(i => {
      const matchProd = i.producto.toLowerCase().includes(lowerSearch);
      const matchTienda = i.tienda.toLowerCase().includes(lowerSearch);
      const matchVar = i.variaciones.some(v => v.nombre.toLowerCase().includes(lowerSearch));
      return matchProd || matchTienda || matchVar;
    });
  }
  // Resetear a la primera página si la búsqueda cambia
  return result;
});

const totalPages = computed(() => Math.ceil(inventarioFiltrado.value.length / itemsPerPage) || 1);

const paginatedInventario = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return inventarioFiltrado.value.slice(start, end);
});

// Volver a página 1 si se busca algo
import { watch } from 'vue';
watch(buscarInventario, () => {
  currentPage.value = 1;
});

onMounted(async () => {
  await fetchInventario();
});
</script>
