<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">

      <!-- Page Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">Pedidos</h1>
        <div class="flex items-center gap-3">
          <div class="relative w-full sm:w-64">
            <span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar cliente o rastreo..."
              class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-10 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:text-white/90"
            />
          </div>
          <span class="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ total }} pedidos
          </span>
        </div>
      </div>

      <!-- Card -->
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="px-6 py-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">Haz clic en una fila para ver el detalle del pedido.</p>
        </div>
        <div class="border-t border-gray-100 dark:border-gray-800">
          <PedidosTable :pedidos="paginados" @select="irAlDetalle" />
        </div>

        <!-- Paginación -->
        <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Mostrando {{ desde + 1 }}–{{ Math.min(desde + porPagina, total) }} de {{ total }}
          </p>
          <div class="flex items-center gap-1">
            <button
              @click="pagina--"
              :disabled="pagina === 1"
              class="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              v-for="p in paginas"
              :key="p"
              @click="pagina = p"
              :class="[
                'flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                p === pagina
                  ? 'bg-brand-500 text-white'
                  : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              ]"
            >{{ p }}</button>
            <button
              @click="pagina++"
              :disabled="pagina === totalPaginas"
              class="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import PedidosTable from '@/components/tables/PedidosTable.vue';

const router = useRouter();
const searchQuery = ref('');
const pagina    = ref(1);
const porPagina = 10;
const pedidos = ref([]);
const loading = ref(true);

const fetchPedidos = async () => {
  try {
    const res = await fetch('/api/pedidos');
    const data = await res.json();

    pedidos.value = data.map(p => {
      const d = new Date(p.created_at);
      const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
      const fechaFormateada = `${d.getDate().toString().padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;
      return {
        id: p.id,
        orden: String(p.id).padStart(5, '0'),
        codigo_rastreo: p.orden,
        cliente: p.nombre,
        fecha: fechaFormateada,
        ciudad: p.ciudad || 'No especificada',
        total: parseFloat(p.total),
        estado: p.estado
      };
    });
  } catch (error) {
    console.error('Error fetching pedidos:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchPedidos();
});

const pedidosFiltrados = computed(() => {
  if (!searchQuery.value) return pedidos.value;
  const q = searchQuery.value.toLowerCase();
  return pedidos.value.filter(p => 
    p.cliente.toLowerCase().includes(q) ||
    p.codigo_rastreo.toLowerCase().includes(q) ||
    p.orden.includes(q)
  );
});

const total        = computed(() => pedidosFiltrados.value.length);
const totalPaginas = computed(() => Math.ceil(total.value / porPagina));
const desde        = computed(() => (pagina.value - 1) * porPagina);
const paginados    = computed(() => pedidosFiltrados.value.slice(desde.value, desde.value + porPagina));
const paginas      = computed(() => Array.from({ length: totalPaginas.value }, (_, i) => i + 1));

const irAlDetalle = (pedido) => router.push(`/pedidos/${pedido.id}`);
</script>
