<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">

      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">Productos</h1>
        <div class="flex items-center gap-3">
          <input type="file" ref="fileInput" @change="subirCSV" accept=".csv" class="hidden" />
          <button @click="abrirUpload" :disabled="uploading"
            class="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 transition-colors dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.05] disabled:opacity-50">
            <svg v-if="uploading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            {{ uploading ? 'Importando...' : 'Importar CSV' }}
          </button>
          <router-link to="/productos/nuevo"
            class="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo Producto
          </router-link>
        </div>
      </div>

      <!-- Card -->
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">

        <!-- Filter tabs + search -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-3">
          <div class="flex items-center gap-1">
            <button v-for="tab in tabs" :key="tab.key" @click="filtroActivo = tab.key"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                filtroActivo === tab.key
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              ]">
              {{ tab.label }}
              <span class="ml-1 text-xs opacity-60">({{ conteo(tab.key) }})</span>
            </button>
          </div>
          <div class="flex items-center gap-3">
            <select v-model="filtroTienda" class="h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10">
              <option value="todas">Todas las Tiendas</option>
              <option value="General">General</option>
              <option v-for="t in tiendasList" :key="t.id" :value="t.nombre">{{ t.nombre }}</option>
            </select>
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="busqueda" type="text" placeholder="Buscar productos..."
                class="pl-9 pr-4 py-2 h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-500/10 w-56" />
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <svg class="animate-spin h-8 w-8 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
        </div>

        <!-- Table -->
        <div v-else class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6 w-14"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Img</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Nombre</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Precio</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Stock</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Tienda</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Tipo</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Etiqueta</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Estado</p></th>
                <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acciones</p></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="p in productosFiltrados" :key="p.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <!-- Img -->
                <td class="px-5 py-3 sm:px-6">
                  <div class="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <img v-if="p.imagen_url" :src="p.imagen_url" :alt="p.nombre" class="w-full h-full object-cover" />
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                </td>
                <!-- Nombre -->
                <td class="px-5 py-4 sm:px-6 min-w-[180px]">
                  <p class="font-semibold text-gray-800 text-theme-sm dark:text-white/90">{{ p.nombre }}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{{ p.slug }}</p>
                </td>
                <!-- Precio -->
                <td class="px-5 py-4 sm:px-6">
                  <div v-if="p.precio" class="flex flex-col">
                    <span v-if="p.descuento > 0" class="text-xs text-gray-400 line-through">${{ Number(p.precio).toFixed(2) }} MXN</span>
                    <span class="font-semibold text-gray-800 dark:text-white/90 text-theme-sm" :class="{'!text-red-600': p.descuento > 0}">
                      ${{ (Number(p.precio) * (1 - (p.descuento || 0)/100)).toFixed(2) }} MXN 
                      <span v-if="p.descuento > 0" class="ml-1 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 px-1 py-0.5 rounded border border-red-200 dark:border-red-800">-{{p.descuento}}%</span>
                    </span>
                  </div>
                  <span v-else class="text-xs text-gray-400 italic">Por variación</span>
                </td>
                <!-- Stock -->
                <td class="px-5 py-4 sm:px-6">
                  <span :class="p.stock > 10 ? 'text-success-600 dark:text-success-500' : p.stock > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-error-500'"
                    class="text-theme-sm font-medium">
                    {{ p.es_variable ? `${p.variaciones_count} var.` : (p.stock > 0 ? p.stock : 'Sin stock') }}
                  </span>
                </td>
                <!-- Tienda -->
                <td class="px-5 py-4 sm:px-6">
                  <span class="text-theme-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
                    {{ p.tienda || 'General' }}
                  </span>
                </td>
                <!-- Tipo -->
                <td class="px-5 py-4 sm:px-6">
                  <span :class="p.es_variable ? 'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
                    class="rounded-full px-2.5 py-0.5 text-theme-xs font-medium">
                    {{ p.es_variable ? 'Variable' : 'Simple' }}
                  </span>
                </td>
                <!-- Flag -->
                <td class="px-5 py-4 sm:px-6">
                  <span v-if="p.flag" class="rounded-full px-2.5 py-0.5 text-theme-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                    {{ p.flag }}
                  </span>
                  <span v-else class="text-gray-400 text-theme-sm">-</span>
                </td>
                <!-- Estado -->
                <td class="px-5 py-4 sm:px-6">
                  <span :class="p.es_publico ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
                    class="rounded-full px-2.5 py-0.5 text-theme-xs font-medium">
                    {{ p.es_publico ? 'Publicado' : 'Borrador' }}
                  </span>
                </td>
                <!-- Acciones -->
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center gap-1">
                    <router-link :to="`/productos/${p.id}`" title="Editar"
                      class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-blue-light-50 hover:text-blue-light-500 dark:text-gray-400 dark:hover:bg-blue-light-500/10 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </router-link>
                    <button @click="eliminar(p)" title="Eliminar"
                      class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="productosFiltrados.length === 0 && !loading">
                <td colspan="7" class="px-5 py-16 text-center">
                  <svg class="mx-auto mb-3 text-gray-300 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  <p class="text-sm text-gray-400 dark:text-gray-500">No hay productos aún.</p>
                  <router-link to="/productos/nuevo" class="mt-2 inline-block text-sm text-brand-500 hover:underline">Crear el primero</router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import AdminLayout from '@/components/layout/AdminLayout.vue';

const router = useRouter();
const filtroActivo = ref('todos');
const filtroTienda = ref('todas');
const busqueda     = ref('');
const loading      = ref(true);
const uploading    = ref(false);
const fileInput    = ref(null);
const productos    = ref([]);
const tiendasList  = ref([]);

const tabs = [
  { key: 'todos',     label: 'Todos'      },
  { key: 'publico',   label: 'Publicados' },
  { key: 'borrador',  label: 'Borradores' },
];

const fetchProductos = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/products?all=true');
    productos.value = res.data;
    
    const tiendasRes = await axios.get('/api/tiendas');
    tiendasList.value = tiendasRes.data;
  } catch (err) {
    console.error('Error fetching data:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProductos);

const conteo = (key) => {
  let lista = productos.value;
  if (filtroTienda.value !== 'todas') lista = lista.filter(p => (p.tienda || 'General') === filtroTienda.value);

  if (key === 'todos') return lista.length;
  if (key === 'publico') return lista.filter(p => p.es_publico).length;
  return lista.filter(p => !p.es_publico).length;
};

const productosFiltrados = computed(() => {
  let lista = productos.value;
  if (filtroTienda.value !== 'todas') lista = lista.filter(p => (p.tienda || 'General') === filtroTienda.value);
  if (filtroActivo.value === 'publico')   lista = lista.filter(p => p.es_publico);
  if (filtroActivo.value === 'borrador')  lista = lista.filter(p => !p.es_publico);
  if (busqueda.value) lista = lista.filter(p => p.nombre.toLowerCase().includes(busqueda.value.toLowerCase()));
  return lista;
});

const eliminar = async (p) => {
  if (!confirm(`¿Eliminar "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
  try {
    await axios.delete(`/api/products/${p.id}`);
    productos.value = productos.value.filter(x => x.id !== p.id);
  } catch (err) {
    console.error('Error deleting product:', err);
    alert('Error al eliminar el producto');
  }
};

const abrirUpload = () => {
  fileInput.value?.click();
};

const subirCSV = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const fd = new FormData();
  fd.append('file', file);

  uploading.value = true;
  try {
    const res = await axios.post('/api/products/migrar-csv', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    alert(`Migración exitosa. Se insertaron ${res.data.count} filas.`);
    fetchProductos(); // Recargar productos
  } catch (err) {
    console.error('Error al subir CSV:', err);
    alert('Ocurrió un error al importar los productos.');
  } finally {
    uploading.value = false;
    event.target.value = null; // reset
  }
};
</script>
