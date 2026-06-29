<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">

      <!-- Page Header & Store Selector -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">Reporte de Ventas</h1>
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Tienda:</label>
          <select v-model="selectedTienda" @change="fetchData" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-3 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10">
            <option value="todas">Todas las tiendas</option>
            <option v-for="t in tiendas" :key="t.id" :value="t.id">{{ t.nombre }}</option>
          </select>
        </div>
      </div>

      <!-- Total Piezas Card -->
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 w-full max-w-sm">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-800 dark:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Piezas Disponibles</p>
            <h3 class="text-2xl font-bold text-gray-800 dark:text-white/90">
              <span v-if="loadingInventario">...</span>
              <span v-else>{{ totalPiezas }}</span>
            </h3>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <template v-else>
        <!-- Charts Section -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
          <!-- Pie Chart -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">Distribución por Mes</h2>
            <div class="min-h-[300px] flex items-center justify-center">
              <p v-if="!hayDatosGraficas" class="text-sm text-gray-400 dark:text-gray-500">Sin datos para mostrar</p>
              <VueApexCharts v-else type="pie" height="300" :options="pieOptions" :series="pieSeries" />
            </div>
          </div>

          <!-- Column Chart -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90 mb-4">Ingresos Mensuales</h2>
            <div class="min-h-[300px]">
              <VueApexCharts type="bar" height="300" :options="barOptions" :series="barSeries" />
            </div>
          </div>
        </div>

        <!-- Table Section Ventas -->
        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div class="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">Listado de Ventas</h2>
            <div class="flex items-center gap-2">
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">Mes:</label>
              <select v-model="selectedMes" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent py-1.5 pl-3 pr-8 text-sm font-medium text-gray-700 dark:text-gray-300 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10">
                <option value="todos">Todos los meses</option>
                <option v-for="m in mesesNombres" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
                <tr>
                  <th class="px-6 py-4 font-semibold">Mes</th>
                  <th class="px-6 py-4 font-semibold">Producto</th>
                  <th class="px-6 py-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="(item, index) in tableDataFiltrada" :key="index" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td class="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">{{ item.mes }}</td>
                  <td class="px-6 py-4 text-gray-800 dark:text-white/90">{{ item.producto }}</td>
                  <td class="px-6 py-4 text-right text-gray-800 dark:text-white/90">${{ item.total.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</td>
                </tr>
                <tr v-if="tableDataFiltrada.length === 0">
                  <td colspan="3" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay ventas para los filtros seleccionados.
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 dark:bg-gray-800/80 border-t-2 border-gray-200 dark:border-gray-700">
                <tr>
                  <td colspan="2" class="px-6 py-4 font-bold text-gray-800 dark:text-white/90 text-left uppercase text-xs tracking-wider">
                    Grand Total
                  </td>
                  <td class="px-6 py-4 font-bold text-gray-800 dark:text-white/90 text-right text-base">
                    ${{ grandTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </template>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import VueApexCharts from 'vue3-apexcharts';

// --- Estado ---
const loading = ref(true);
const tiendas = ref([]);
const selectedTienda = ref('todas');
const selectedMes = ref('todos');
const rawRows = ref([]);
const porMesData = ref({});


const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// --- Fetch tiendas reales ---
const fetchTiendas = async () => {
  try {
    const res = await fetch('/api/tiendas');
    if (res.ok) tiendas.value = await res.json();
  } catch (e) { console.error('Error fetching tiendas:', e); }
};

// --- Fetch datos del reporte ---
const fetchData = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({ anio: new Date().getFullYear() });
    if (selectedTienda.value !== 'todas') params.append('tienda_id', selectedTienda.value);
    
    const res = await fetch(`/api/reportes/ventas?${params}`);
    if (res.ok) {
      const data = await res.json();
      rawRows.value = data.rows;
      porMesData.value = data.porMes;
    }
  } catch (e) { console.error('Error fetching reporte:', e); }
  finally { loading.value = false; }
};


// --- Filtrado de tabla por mes seleccionado ---
const tableDataFiltrada = computed(() => {
  if (selectedMes.value === 'todos') return rawRows.value;
  return rawRows.value.filter(r => r.mes === selectedMes.value);
});

const grandTotal = computed(() =>
  tableDataFiltrada.value.reduce((acc, curr) => acc + curr.total, 0)
);


// --- Datos para gráficas (solo meses con ventas) ---
const mesesConDatos = computed(() =>
  mesesNombres.filter(m => (porMesData.value[m] || 0) > 0)
);

const hayDatosGraficas = computed(() => mesesConDatos.value.length > 0);

const pieSeries = computed(() =>
  mesesConDatos.value.map(m => porMesData.value[m] || 0)
);

const barSeries = computed(() => [{
  name: 'Ventas Mensuales',
  data: mesesNombres.map(m => porMesData.value[m] || 0)
}]);

// --- Opciones Gráfica Pie ---
const pieOptions = computed(() => ({
  chart: { type: 'pie', fontFamily: 'inherit', background: 'transparent' },
  labels: mesesConDatos.value,
  colors: ['#237650', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#a855f7', '#64748b'],
  stroke: { width: 1, colors: ['#ffffff'] },
  dataLabels: {
    enabled: true,
    style: { fontSize: '14px', fontWeight: 'bold', colors: ['#ffffff'] },
    dropShadow: { enabled: false },
    formatter: (val) => val.toFixed(1) + "%"
  },
  legend: { position: 'bottom', labels: { colors: '#9CA3AF' } },
  tooltip: {
    theme: 'light',
    y: { formatter: (val) => `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` }
  }
}));

// --- Opciones Gráfica Columnas ---
const barOptions = computed(() => ({
  chart: { type: 'bar', fontFamily: 'inherit', toolbar: { show: false }, background: 'transparent' },
  colors: ['#237650', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#ec4899', '#84cc16', '#a855f7', '#64748b'],
  plotOptions: { bar: { borderRadius: 6, columnWidth: '45%', distributed: true } },
  dataLabels: { enabled: false },
  legend: { show: false },
  xaxis: {
    categories: mesesNombres,
    labels: { style: { colors: '#9CA3AF' } },
    axisBorder: { show: false },
    axisTicks: { show: false },
  },
  yaxis: {
    labels: {
      style: { colors: '#9CA3AF' },
      formatter: (v) => `$${v.toLocaleString('es-MX')}`
    }
  },
  grid: { borderColor: '#F3F4F6', strokeDashArray: 4, xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
  tooltip: {
    theme: 'light',
    y: { formatter: (val) => `$${val.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN` }
  }
}));

onMounted(async () => {
  await fetchTiendas();
  await fetchData();
});
</script>
