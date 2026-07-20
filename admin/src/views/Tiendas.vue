<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">Tiendas</h1>
        <router-link
          to="/tiendas/nueva"
          class="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar
        </router-link>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <!-- Card Header -->
        <div class="px-6 py-5">
          <p class="text-sm text-gray-500 dark:text-gray-400">Gestiona las tiendas registradas en la plataforma.</p>
        </div>

        <!-- Table -->
        <div class="border-t border-gray-100 dark:border-gray-800">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">ID</p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Imagen</p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Nombre</p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Fecha</p>
                  </th>
                  <th class="px-5 py-3 text-left sm:px-6">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acciones</p>
                  </th>
                </tr>
              </thead>
              <draggable
                v-model="tiendas"
                tag="tbody"
                item-key="id"
                class="divide-y divide-gray-100 dark:divide-gray-800"
                @end="onDragEnd"
                handle=".drag-handle"
                animation="200"
              >
                <template #item="{ element: tienda }">
                  <tr class="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-white dark:bg-transparent">
                    <!-- ID -->
                    <td class="px-5 py-4 sm:px-6 flex items-center gap-3">
                      <div class="drag-handle cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                      </div>
                      <span class="font-mono text-theme-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-2 py-0.5 rounded">
                        {{ tienda.id }}
                      </span>
                    </td>
                    <!-- Imagen -->
                    <td class="px-5 py-4 sm:px-6">
                      <div class="w-10 h-10 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 flex items-center justify-center">
                        <img v-if="tienda.imagen_url" :src="tienda.imagen_url" :alt="tienda.nombre" class="w-full h-full object-cover" />
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      </div>
                    </td>
                    <!-- Nombre -->
                    <td class="px-5 py-4 sm:px-6">
                      <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {{ tienda.nombre }}
                      </span>
                    </td>
                    <!-- Fecha -->
                    <td class="px-5 py-4 sm:px-6">
                      <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ formatDate(tienda.created_at) }}</span>
                    </td>
                    <!-- Acciones -->
                    <td class="px-5 py-4 sm:px-6">
                      <div class="flex items-center gap-2">
                        <!-- Editar -->
                        <router-link :to="`/tiendas/${tienda.id}`" title="Editar" class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-blue-light-50 hover:text-blue-light-500 dark:text-gray-400 dark:hover:bg-blue-light-500/10 dark:hover:text-blue-light-400 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </router-link>
                        <!-- Eliminar -->
                        <button @click="eliminar(tienda)" title="Eliminar" class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-500 hover:bg-error-50 hover:text-error-500 dark:text-gray-400 dark:hover:bg-error-500/10 dark:hover:text-error-400 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                </template>
              </draggable>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from "vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import axios from "axios";
import draggable from "vuedraggable";

const tiendas = ref([]);
const loading = ref(true);

const fetchTiendas = async () => {
  loading.value = true;
  try {
    const res = await axios.get('/api/tiendas');
    tiendas.value = res.data;
  } catch (err) {
    console.error('Error fetching tiendas:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchTiendas);

const onDragEnd = async () => {
  try {
    const ids = tiendas.value.map(t => t.id);
    await axios.put('/api/tiendas/orden', { ids });
  } catch (err) {
    console.error('Error saving order', err);
    alert('Error al guardar el nuevo orden de tiendas');
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
};

const eliminar = async (t) => {
  if (!confirm(`¿Estás seguro de eliminar la tienda "${t.nombre}"?`)) return;
  try {
    await axios.delete(`/api/tiendas/${t.id}`);
    fetchTiendas();
  } catch (err) {
    console.error('Error al eliminar tienda:', err);
    alert('No se pudo eliminar la tienda');
  }
};
</script>
