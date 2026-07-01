<template>
  <AdminLayout>
    <div class="space-y-8">
      
      <!-- Sección de Reglas de Envío -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">Envío</h1>
          <button @click="abrirModalRegla" class="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-600 transition-colors">
            <span>+</span> Nueva Regla
          </button>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead class="bg-gray-50/50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-300">
                <tr>
                  <th class="px-6 py-4 font-semibold">PAÍSES</th>
                  <th class="px-6 py-4 font-semibold">ESTADOS (SI APLICA)</th>
                  <th class="px-6 py-4 font-semibold">PRECIO</th>
                  <th class="px-6 py-4 font-semibold">ACCIONES</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="regla in reglas" :key="regla.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex gap-2 flex-wrap">
                      <span v-for="p in regla.pais.split(',').map(s=>s.trim())" :key="p" class="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">{{ p }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex gap-2 flex-wrap">
                      <span v-for="estado in parseEstados(regla.estados)" :key="estado" class="inline-flex rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">{{ estado }}</span>
                      <span v-if="!parseEstados(regla.estados).length" class="text-gray-400 text-xs">-</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 font-semibold text-gray-800 dark:text-white/90">${{ Number(regla.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <button @click="editarRegla(regla)" class="text-brand-500 hover:text-brand-700 transition" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                      <button @click="eliminarRegla(regla.id)" class="text-red-500 hover:text-red-700 transition" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="reglas.length === 0">
                  <td colspan="4" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay reglas de envío configuradas.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>


      <!-- Modal Nueva Regla -->
      <div v-if="mostrarModalRegla" class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-[480px] rounded-2xl bg-white p-7 shadow-xl dark:bg-gray-900">
          <h3 class="mb-5 text-[18px] font-bold text-[#111827] dark:text-white">{{ nuevaRegla.id ? 'Editar' : 'Agregar' }} Regla de Envío</h3>
          
          <div class="space-y-5">
            <div>
              <label class="mb-1.5 block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Países</label>
              <div class="relative w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 min-h-[42px] flex items-center">
                <div class="flex flex-wrap items-center gap-1.5 w-full">
                  <span v-for="pais in nuevaRegla.paises" :key="pais" class="inline-flex items-center gap-1 rounded bg-gray-50 px-2 py-1 text-[13px] font-medium text-gray-800 border border-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    {{ pais }}
                    <button @click="removerPais(pais)" type="button" class="text-gray-400 hover:text-gray-800 dark:hover:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </span>
                  <input 
                    v-model="paisBusqueda" 
                    @focus="showPaisesDropdown = true"
                    @blur="hidePaisesDropdown"
                    :placeholder="nuevaRegla.paises.length === 0 ? 'Buscar país...' : ''" 
                    class="flex-1 bg-transparent border-none outline-none focus:ring-0 px-1 py-0.5 text-sm dark:text-white min-w-[100px]" 
                  />
                </div>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                <!-- Dropdown -->
                <div v-if="showPaisesDropdown && filteredPaises.length > 0" class="absolute left-0 top-[calc(100%+4px)] z-50 max-h-48 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                  <div v-for="opcion in filteredPaises" :key="opcion" @mousedown.prevent="addPaisOpcion(opcion)" class="cursor-pointer select-none px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    {{ opcion }}
                  </div>
                </div>
              </div>
            </div>

            <div v-if="nuevaRegla.paises.includes('México') || nuevaRegla.paises.includes('Mexico')">
              <label class="mb-1.5 block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Estados (Opcional)</label>
              <div class="relative w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 min-h-[42px] flex items-center">
                <div class="flex flex-wrap items-center gap-1.5 w-full">
                  <span v-for="est in nuevaRegla.estados" :key="est" class="inline-flex items-center gap-1 rounded bg-gray-50 px-2 py-1 text-[13px] font-medium text-gray-800 border border-gray-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                    {{ est }}
                    <button @click="removerEstado(est)" type="button" class="text-gray-400 hover:text-gray-800 dark:hover:text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </span>
                  <input 
                    v-model="estadoBusqueda" 
                    @focus="showEstadosDropdown = true"
                    @blur="hideEstadosDropdown"
                    placeholder="Buscar estado..."
                    class="flex-1 bg-transparent border-none outline-none focus:ring-0 px-1 py-0.5 text-sm dark:text-white min-w-[100px]" 
                  />
                </div>
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg class="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <!-- Dropdown -->
                <div v-if="showEstadosDropdown && filteredEstados.length > 0" class="absolute left-0 top-[calc(100%+4px)] z-50 max-h-48 w-full overflow-auto rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-800 dark:ring-gray-700">
                  <div v-for="opcion in filteredEstados" :key="opcion" @mousedown.prevent="addEstadoOpcion(opcion)" class="cursor-pointer select-none px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                    {{ opcion }}
                  </div>
                </div>
              </div>
              <p class="mt-2 text-[12px] font-medium text-gray-500">Si no seleccionas ninguno, aplicará a todo México.</p>
            </div>

            <div>
              <label class="mb-1.5 block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Precio de Envío</label>
              <div class="relative w-full rounded-xl border border-gray-200 bg-white overflow-hidden focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 dark:border-gray-700 dark:bg-gray-800 flex items-center">
                <span class="pl-4 text-gray-500 font-medium">$</span>
                <input v-model="nuevaRegla.precio" type="number" step="0.01" placeholder="0.00" class="w-full bg-transparent px-2 py-2.5 text-sm font-medium text-gray-800 border-none outline-none focus:ring-0 dark:text-white" />
              </div>
            </div>
          </div>

          <div class="mt-8 flex justify-end gap-3">
            <button @click="mostrarModalRegla = false" class="rounded-xl px-5 py-2.5 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancelar
            </button>
            <button @click="guardarRegla" :disabled="savingRegla" class="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-600 disabled:opacity-70 transition-colors">
              <svg v-if="savingRegla" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Guardar Regla
            </button>
          </div>
        </div>
      </div>

      <!-- Sección Plantillas de Paquete -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Plantillas de Paquete</h2>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Guarda tus cajas frecuentes para seleccionarlas rápidamente al generar guías.</p>
          </div>
          <button @click="abrirModalPreset" class="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-brand-600 transition-colors">
            <span>+</span> Nueva Plantilla
          </button>
        </div>

        <div v-if="presets.length === 0" class="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 p-10 text-center">
          <svg class="mx-auto mb-3 text-gray-300 dark:text-gray-600" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          <p class="text-sm text-gray-500 dark:text-gray-400">No hay plantillas. Crea tu primera plantilla para agilizar la generación de guías.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div v-for="preset in presets" :key="preset.id"
            class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-4 flex flex-col gap-3">
            <!-- Icono + Nombre -->
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-2.5">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center" :class="preset.tipo === 'envelope' ? 'bg-blue-50 dark:bg-blue-500/10' : 'bg-amber-50 dark:bg-amber-500/10'">
                  <!-- Caja -->
                  <svg v-if="preset.tipo === 'box'" class="text-amber-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                  <!-- Sobre -->
                  <svg v-else class="text-blue-500" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90 leading-tight">{{ preset.nombre }}</p>
              </div>
              <div class="flex items-center gap-1">
                <button @click="editarPreset(preset)" class="p-1.5 text-gray-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5" title="Editar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button @click="eliminarPreset(preset.id)" class="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5" title="Eliminar">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>
            <!-- Dimensiones -->
            <div class="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/[0.03] rounded-lg px-3 py-2 font-mono">
              {{ preset.largo }}×{{ preset.ancho }}×{{ preset.alto }} cm · {{ preset.peso }} kg
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Nueva / Editar Plantilla -->
      <div v-if="mostrarModalPreset" class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 p-4">
        <div class="w-full max-w-[420px] rounded-2xl bg-white p-7 shadow-xl dark:bg-gray-900">
          <h3 class="mb-5 text-[18px] font-bold text-[#111827] dark:text-white">{{ nuevoPreset.id ? 'Editar' : 'Nueva' }} Plantilla de Paquete</h3>

          <div class="space-y-4">
            <!-- Nombre -->
            <div>
              <label class="mb-1.5 block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Nombre</label>
              <input v-model="nuevoPreset.nombre" type="text" placeholder="Ej: Ropa, Poster, Vasos..."
                class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>

            <!-- Tipo -->
            <div>
              <label class="mb-1.5 block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Tipo</label>
              <div class="flex gap-2">
                <button @click="nuevoPreset.tipo = 'box'"
                  class="flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors"
                  :class="nuevoPreset.tipo === 'box' ? 'border-brand-400 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> Caja
                </button>
                <button @click="nuevoPreset.tipo = 'envelope'"
                  class="flex-1 flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-colors"
                  :class="nuevoPreset.tipo === 'envelope' ? 'border-brand-400 bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-400'">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Sobre
                </button>
              </div>
            </div>

            <!-- Dimensiones + Peso -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="mb-1.5 block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Peso (kg)</label>
                <input v-model.number="nuevoPreset.peso" type="number" step="0.1" min="0.1" placeholder="1.0"
                  class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label class="mb-1.5 block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Largo (cm)</label>
                <input v-model.number="nuevoPreset.largo" type="number" min="1" placeholder="30"
                  class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label class="mb-1.5 block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Ancho (cm)</label>
                <input v-model.number="nuevoPreset.ancho" type="number" min="1" placeholder="20"
                  class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label class="mb-1.5 block text-[13px] font-semibold text-gray-700 dark:text-gray-300">Alto (cm)</label>
                <input v-model.number="nuevoPreset.alto" type="number" min="1" placeholder="10"
                  class="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-400 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
            </div>
          </div>

          <div class="mt-7 flex justify-end gap-3">
            <button @click="mostrarModalPreset = false" class="rounded-xl px-5 py-2.5 text-[14px] font-semibold text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">Cancelar</button>
            <button @click="guardarPreset" :disabled="savingPreset" class="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-brand-600 disabled:opacity-70 transition-colors">
              <svg v-if="savingPreset" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Guardar
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


// --- Reglas de Envío ---
const reglas = ref([]);
const mostrarModalRegla = ref(false);
const savingRegla = ref(false);

// Listas de Opciones predefinidas
const paisesOptions = ['México', 'Estados Unidos', 'Canadá', 'España', 'Colombia', 'Argentina', 'Chile', 'Perú', 'Ecuador', 'Reino Unido'];
const estadosMexico = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 
  'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 
  'Jalisco', 'Estado de México', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 
  'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

const showPaisesDropdown = ref(false);
const showEstadosDropdown = ref(false);
const paisBusqueda = ref('');
const estadoBusqueda = ref('');
const nuevaRegla = ref({ paises: [], estados: [], precio: 0.00 });

// Dropdown filtering logic
const filteredPaises = computed(() => {
  const q = paisBusqueda.value.toLowerCase();
  return paisesOptions.filter(p => !nuevaRegla.value.paises.includes(p) && p.toLowerCase().includes(q));
});

const filteredEstados = computed(() => {
  const q = estadoBusqueda.value.toLowerCase();
  return estadosMexico.filter(e => !nuevaRegla.value.estados.includes(e) && e.toLowerCase().includes(q));
});

const hidePaisesDropdown = () => { setTimeout(() => showPaisesDropdown.value = false, 150); };
const hideEstadosDropdown = () => { setTimeout(() => showEstadosDropdown.value = false, 150); };


// FETCH Reglas
const fetchReglas = async () => {
  try {
    const res = await fetch('/api/reglas-envio');
    if (res.ok) reglas.value = await res.json();
  } catch (e) { console.error('Error fetching reglas:', e); }
};

// PARSE Estados helper
const parseEstados = (estadosStr) => {
  if (!estadosStr) return [];
  try {
    const arr = typeof estadosStr === 'string' && estadosStr.startsWith('[') ? JSON.parse(estadosStr) : estadosStr;
    if (Array.isArray(arr)) return arr;
    return [];
  } catch(e) { return []; }
};

// ABRIR Modal
const abrirModalRegla = () => {
  nuevaRegla.value = { paises: [], estados: [], precio: null };
  paisBusqueda.value = '';
  estadoBusqueda.value = '';
  mostrarModalRegla.value = true;
};

// EDITAR Regla
const editarRegla = (regla) => {
  nuevaRegla.value = {
    id: regla.id,
    paises: regla.pais.split(',').map(p => p.trim()),
    estados: parseEstados(regla.estados),
    precio: Number(regla.precio)
  };
  paisBusqueda.value = '';
  estadoBusqueda.value = '';
  mostrarModalRegla.value = true;
};

// CHIPS Logic
const addPaisOpcion = (pais) => {
  nuevaRegla.value.paises.push(pais);
  paisBusqueda.value = '';
  // Mantenemos el dropdown abierto para que pueda seguir seleccionando
};
const removerPais = (pais) => {
  nuevaRegla.value.paises = nuevaRegla.value.paises.filter(p => p !== pais);
};

const addEstadoOpcion = (estado) => {
  nuevaRegla.value.estados.push(estado);
  estadoBusqueda.value = '';
  // Mantenemos el dropdown abierto para que pueda seguir seleccionando
};
const removerEstado = (est) => {
  nuevaRegla.value.estados = nuevaRegla.value.estados.filter(e => e !== est);
};

// GUARDAR Regla
const guardarRegla = async () => {
  if (nuevaRegla.value.paises.length === 0) return;
  savingRegla.value = true;
  
  const payload = {
    pais: nuevaRegla.value.paises.join(', '),
    estados: nuevaRegla.value.estados.length ? nuevaRegla.value.estados : null,
    precio: nuevaRegla.value.precio || 0
  };

  try {
    let res;
    if (nuevaRegla.value.id) {
      res = await fetch(`/api/reglas-envio/${nuevaRegla.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } else {
      res = await fetch('/api/reglas-envio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      const guardada = await res.json();
      if (nuevaRegla.value.id) {
        const idx = reglas.value.findIndex(r => r.id === guardada.id);
        if (idx !== -1) reglas.value[idx] = guardada;
      } else {
        reglas.value.unshift(guardada);
      }
      mostrarModalRegla.value = false;
    }
  } catch (e) { console.error('Error saving regla:', e); }
  finally { savingRegla.value = false; }
};

// ELIMINAR Regla
const eliminarRegla = async (id) => {
  if (!confirm('¿Seguro que deseas eliminar esta regla?')) return;
  try {
    const res = await fetch(`/api/reglas-envio/${id}`, { method: 'DELETE' });
    if (res.ok) {
      reglas.value = reglas.value.filter(r => r.id !== id);
    }
  } catch (e) { console.error('Error deleting regla:', e); }
};

// --- Package Presets ---
const presets = ref([]);
const mostrarModalPreset = ref(false);
const savingPreset = ref(false);
const nuevoPreset = ref({ nombre: '', tipo: 'box', peso: 1, largo: 30, ancho: 20, alto: 10 });

const fetchPresets = async () => {
  try {
    const res = await fetch('/api/package-presets');
    if (res.ok) presets.value = await res.json();
  } catch (e) { console.error('Error fetching presets:', e); }
};

const abrirModalPreset = () => {
  nuevoPreset.value = { nombre: '', tipo: 'box', peso: 1, largo: 30, ancho: 20, alto: 10 };
  mostrarModalPreset.value = true;
};

const editarPreset = (preset) => {
  nuevoPreset.value = { ...preset };
  mostrarModalPreset.value = true;
};

const guardarPreset = async () => {
  const { nombre, tipo, peso, largo, ancho, alto } = nuevoPreset.value;
  if (!nombre || !peso || !largo || !ancho || !alto) return;
  savingPreset.value = true;
  try {
    const isEdit = !!nuevoPreset.value.id;
    const url = isEdit ? `/api/package-presets/${nuevoPreset.value.id}` : '/api/package-presets';
    const res = await fetch(url, {
      method: isEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, tipo, peso, largo, ancho, alto })
    });
    if (res.ok) {
      const saved = await res.json();
      if (isEdit) {
        const idx = presets.value.findIndex(p => p.id === saved.id);
        if (idx !== -1) presets.value[idx] = saved;
      } else {
        presets.value.push(saved);
        presets.value.sort((a, b) => a.nombre.localeCompare(b.nombre));
      }
      mostrarModalPreset.value = false;
    }
  } catch (e) { console.error('Error saving preset:', e); }
  finally { savingPreset.value = false; }
};

const eliminarPreset = async (id) => {
  if (!confirm('¿Eliminar esta plantilla?')) return;
  try {
    const res = await fetch(`/api/package-presets/${id}`, { method: 'DELETE' });
    if (res.ok) presets.value = presets.value.filter(p => p.id !== id);
  } catch (e) { console.error('Error deleting preset:', e); }
};

onMounted(() => {
  fetchReglas();
  fetchPresets();
});
</script>
