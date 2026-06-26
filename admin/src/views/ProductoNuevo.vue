<template>
  <AdminLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <router-link to="/productos" class="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </router-link>
          <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">
            {{ isEditing ? 'Editar Producto' : 'Nuevo Producto' }}
          </h1>
        </div>
        <div class="flex items-center gap-3">
          <button type="button" @click.prevent="guardar" :disabled="guardando" class="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
            <svg v-if="!guardando" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            <svg v-else class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
            {{ guardando ? 'Guardando...' : 'Guardar Producto' }}
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid grid-cols-12 gap-6 items-start">

        <!-- ══ LEFT COLUMN ══════════════════════════════════ -->
        <div class="col-span-12 lg:col-span-8 space-y-6">

          <!-- Basic Info -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6 space-y-5">
            <!-- Nombre -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del producto</label>
              <input v-model="form.nombre" type="text" placeholder="Ej. Playera Tour 2026"
                class="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 text-sm text-gray-900 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              <!-- Slug Preview -->
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Enlace: <span class="text-brand-600 dark:text-brand-400 font-mono">https://amigo-merch.vercel.app/producto/{{ slug }}</span>
              </p>
            </div>

            <!-- Descripción -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <textarea v-model="form.descripcion" rows="5" placeholder="Describe tu producto..."
                class="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent p-4 text-sm text-gray-900 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"></textarea>
            </div>
          </div>

          <!-- Pricing, Inventory & Shipping -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-6">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90 mb-5">Datos Generales</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-5">
              <!-- Tienda -->
              <div class="lg:col-span-2">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tienda</label>
                <select v-model="form.tienda"
                  class="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 text-sm text-gray-900 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                  <option value="General">General</option>
                  <option v-for="t in tiendasList" :key="t.id" :value="t.nombre">{{ t.nombre }}</option>
                </select>
              </div>

              <!-- Precio General -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Precio
                </label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input v-model="form.precio" type="number" step="0.01" placeholder="0.00" :disabled="form.esVariable"
                    class="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent pl-8 pr-4 text-sm text-gray-900 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800/50" />
                </div>
              </div>

              <!-- Stock -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Stock general</label>
                <input v-model="form.stock" type="number" placeholder="0" :disabled="form.esVariable"
                  class="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 text-sm text-gray-900 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800/50" />
              </div>

              <!-- Envío Especial -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Envío Esp.</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input v-model="form.envioEspecial" type="number" step="0.01" placeholder="0.00"
                    class="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent pl-8 pr-4 text-sm text-gray-900 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                </div>
              </div>

              <!-- Peso -->
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Peso (kg)</label>
                <input v-model="form.peso" type="number" step="0.001" placeholder="0.000" :disabled="form.esVariable"
                  class="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 text-sm text-gray-900 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:bg-gray-50 dark:disabled:bg-gray-800/50" />
              </div>
            </div>
          </div>

          <!-- Variations Section -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
            <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.01]">
              <div>
                <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Producto Variable</h2>
                <p class="text-sm text-gray-500 mt-0.5">Activa si el producto tiene tallas, colores, etc.</p>
              </div>
              <!-- Switch Simple/Variable -->
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="form.esVariable" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
              </label>
            </div>

            <div v-if="form.esVariable" class="p-6 space-y-6 animate-fade-in">
              
              <!-- Atributos -->
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Atributos (Grupos)</h3>
                  <button @click="addAtributo" type="button" class="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline">+ Agregar atributo</button>
                </div>
                
                <div class="space-y-3">
                  <div v-for="(attr, i) in form.atributos" :key="i" class="flex items-start gap-3">
                    <div class="w-1/3">
                      <label class="block text-xs text-gray-500 mb-1">Nombre (Ej. Talla, Color)</label>
                      <input v-model="attr.nombre" type="text" placeholder="Nombre" class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:border-brand-500 focus:outline-none" />
                    </div>
                    <div class="flex-1">
                      <label class="block text-xs text-gray-500 mb-1">Opciones (separadas por coma)</label>
                      <input v-model="attr.opciones" type="text" placeholder="S, M, L" class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:border-brand-500 focus:outline-none" />
                      
                      <!-- Selector de colores dinámico si el atributo es Color -->
                      <div v-if="attr.nombre.toLowerCase().includes('color') && attr.opciones.trim()" class="mt-3 flex flex-wrap gap-4">
                        <div v-for="opt in getParsedOptions(attr.opciones)" :key="opt" class="flex items-center gap-2">
                          <input type="color" :value="attr.colores[opt] || guessColor(opt)" @input="attr.colores[opt] = $event.target.value" class="h-6 w-6 p-0 border-0 rounded cursor-pointer" />
                          <span class="text-xs text-gray-600 dark:text-gray-400">{{ opt }}</span>
                        </div>
                      </div>
                    </div>
                    <button @click="form.atributos.splice(i, 1)" type="button" class="mt-5 h-10 w-10 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition" title="Eliminar atributo">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                    </button>
                  </div>
                </div>

                <div class="pt-2">
                  <button @click="generarVariaciones" type="button" class="rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    Generar Combinaciones
                  </button>
                  <p class="text-xs text-gray-500 mt-2">Nota: Al generar se sobrescribirán las variaciones actuales de abajo.</p>
                </div>
              </div>

              <!-- Lista de variaciones -->
              <div class="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-6">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Variaciones Generadas</h3>
                  <button @click="addVariacion" type="button" class="text-sm text-brand-600 dark:text-brand-400 font-medium hover:underline">+ Agregar manual</button>
                </div>

                <div class="space-y-3">
                  <div v-for="(v, index) in form.variaciones" :key="index" class="flex flex-wrap md:flex-nowrap items-end gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
                    
                    <div class="w-full md:flex-1">
                      <label class="block text-xs text-gray-500 mb-1">Combinación / Valor</label>
                      <input v-model="v.valor" type="text" placeholder="Ej. Rojo - S" class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:border-brand-500 focus:outline-none" />
                    </div>

                    <div class="w-full md:flex-1">
                      <label class="block text-xs text-gray-500 mb-1">Precio ($)</label>
                      <input v-model="v.precio" type="number" step="0.01" placeholder="0.00" class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:border-brand-500 focus:outline-none" />
                    </div>

                    <div class="w-full md:flex-1">
                      <label class="block text-xs text-gray-500 mb-1">Stock</label>
                      <input v-model="v.stock" type="number" placeholder="0" class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:border-brand-500 focus:outline-none" />
                    </div>

                    <div class="w-full md:flex-1">
                      <label class="block text-xs text-gray-500 mb-1">Peso (kg)</label>
                      <input v-model="v.peso" type="number" step="0.001" placeholder="0.000" class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm focus:border-brand-500 focus:outline-none" />
                    </div>

                    <div class="w-full md:w-auto">
                      <label class="block text-xs text-gray-500 mb-1">Color</label>
                      <div class="flex items-center gap-2">
                        <input v-model="v.color" type="color" class="h-10 w-10 p-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 cursor-pointer" />
                        <span class="text-xs text-gray-400 uppercase w-16">{{ v.color }}</span>
                      </div>
                    </div>

                    <div class="w-full md:w-auto flex-1">
                      <label class="block text-xs text-gray-500 mb-1">Imagen</label>
                      <div class="flex items-center gap-2">
                        <button type="button" @click="$refs['imgVar_' + index][0].click()" class="h-10 px-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800 transition">
                          {{ (v.imagen || v.imagenPreview) ? 'Cambiar' : 'Subir' }}
                        </button>
                        <input :ref="'imgVar_' + index" type="file" accept="image/*" class="hidden" @change="e => onVarImgChange(e, index)" />
                        <img v-if="v.imagenPreview" :src="v.imagenPreview" class="h-10 w-10 rounded object-cover border border-gray-200 dark:border-gray-700" />
                        <span v-if="v.imagenPreview" @click="clearVarImg(index)" class="text-xs text-red-400 hover:text-red-600 cursor-pointer" title="Quitar imagen">×</span>
                      </div>
                    </div>

                    <div class="w-full md:w-auto mt-2 md:mt-0 flex justify-end">
                      <button @click="form.variaciones.splice(index, 1)" type="button" class="h-10 w-10 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition" title="Eliminar variación">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ══ RIGHT COLUMN ═════════════════════════════════ -->
        <div class="col-span-12 lg:col-span-4 space-y-6">

          <!-- Visibilidad + Flag -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5 space-y-4">
            <!-- Switch Estado Público -->
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Estado Público</h3>
                <p class="text-xs text-gray-500 mt-0.5">{{ form.esPublico ? 'Visible para todos' : 'Oculto (Borrador)' }}</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="form.esPublico" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
              </label>
            </div>

            <div class="border-t border-gray-100 dark:border-gray-800"></div>

            <!-- Flag -->
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Etiqueta (Flag)</label>
              <select v-model="form.flag"
                class="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 text-sm text-gray-900 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                <option value="">Ninguna</option>
                <option value="Nuevo">Nuevo</option>
                <option value="Popular">Popular</option>
                <option value="Preventa">Preventa</option>
                <option value="Agotado">Agotado</option>
              </select>
            </div>

            <!-- Fechas de Preventa -->
            <div v-if="form.flag === 'Preventa'" class="space-y-3 animate-fade-in">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Inicio de preventa <span class="text-error-500">*</span>
                </label>
                <input v-model="form.preventaInicio" type="date"
                  class="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 text-sm text-gray-900 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fin de preventa <span class="text-error-500">*</span>
                </label>
                <input v-model="form.preventaFin" type="date"
                  class="w-full h-11 rounded-xl border border-gray-300 dark:border-gray-700 bg-transparent px-4 text-sm text-gray-900 dark:text-white/90 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
              </div>
            </div>
          </div>

          <!-- Imagen Principal -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Imagen Principal</h3>
            <div @click="$refs.imgPrincipal.click()" @dragover.prevent @drop.prevent="onDropImg"
              class="relative rounded-xl border-2 border-dashed cursor-pointer transition-colors overflow-hidden group"
              :class="imagenError
                ? 'border-error-400 bg-error-50 dark:border-error-600 dark:bg-error-500/5'
                : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 hover:border-brand-400 hover:bg-brand-50 dark:hover:border-brand-600 dark:hover:bg-brand-500/5'">
              <img v-if="form.imagenPreview" :src="form.imagenPreview" class="w-full aspect-square object-cover" />
              <div v-else class="flex flex-col items-center justify-center py-12 gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <p class="text-sm text-gray-500 font-medium">Sube una imagen</p>
                <p class="text-xs text-gray-400">JPG, JPEG, PNG — máx. 1000×1000 px — máx. 5 MB</p>
              </div>
              <input ref="imgPrincipal" type="file" accept="image/jpeg,image/jpg,image/png" class="hidden" @change="onImgChange" />
              <div v-if="form.imagenPreview" class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span class="text-white text-sm font-medium">Cambiar imagen</span>
              </div>
            </div>
            <p v-if="imagenError" class="mt-1.5 text-xs text-error-500">{{ imagenError }}</p>
            <button v-if="form.imagenPreview" @click="form.imagenPreview = null; form.imagen = null"
              class="mt-3 w-full text-sm text-red-500 hover:text-red-600 transition">Eliminar imagen</button>
          </div>

          <!-- Galería -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Galería</h3>
              <span class="text-xs text-gray-400">{{ form.galeria.length }} imágenes</span>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <!-- Images in gallery -->
              <div v-for="(img, i) in form.galeriaPreview" :key="i" class="relative group aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <img :src="img" class="w-full h-full object-cover" />
                <button @click="removeGaleriaImg(i)" type="button"
                  class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <!-- Add button -->
              <button @click="$refs.imgGaleria.click()" type="button"
                class="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-center text-gray-400 hover:border-brand-400 hover:text-brand-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
            <input ref="imgGaleria" type="file" accept="image/jpeg,image/jpg,image/png" multiple class="hidden" @change="onGaleriaChange" />
            <p v-if="galeriaError" class="mt-2 text-xs text-error-500">{{ galeriaError }}</p>
            <p class="mt-2 text-xs text-gray-400">JPG, JPEG, PNG — máx. 1000×1000 px — máx. 5 MB por imagen</p>
          </div>

        </div>
      </div>
    </div>

    <!-- Image Editor Modal -->
    <ImageEditorModal
      :show="showEditorModal"
      :image-src="editorImageSrc"
      :file="editorFile"
      :current-width="editorCurrentW"
      :current-height="editorCurrentH"
      :constraints="editorConstraints"
      @done="onEditorDone"
      @cancel="onEditorCancel"
    />
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import ImageEditorModal from '@/components/ui/ImageEditorModal.vue';
import axios from 'axios';
import { validateImageFile } from '@/utils/imageValidation';

const router = useRouter();
const route = useRoute();
const isEditing = computed(() => !!route.params.id);

const form = reactive({
  nombre: '',
  descripcion: '',
  tienda: 'General',
  flag: '',
  preventaInicio: '',
  preventaFin: '',
  precio: '',
  stock: '',
  envioEspecial: '',
  peso: '',
  esVariable: false,
  esPublico: true,
  
  // Variaciones
  atributos: [
    { nombre: 'Talla', opciones: 'S, M, L', colores: {} },
    { nombre: 'Color', opciones: 'Rojo, Negro', colores: { 'Rojo': '#ff0000', 'Negro': '#000000' } }
  ],
  variaciones: [],

  // Archivos
  imagen: null,
  imagenPreview: null,
  galeria: [],
  galeriaPreview: []
});

const todayISO = () => new Date().toISOString().slice(0, 10);
const tomorrowISO = () => {
  const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10);
};

watch(() => form.flag, (val) => {
  if (val === 'Preventa') {
    if (!form.preventaInicio) form.preventaInicio = todayISO();
    if (!form.preventaFin)    form.preventaFin    = tomorrowISO();
  }
});

// Computed property for URL preview
const slug = computed(() => {
  if (form.nombre) {
    return form.nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  }
  return '';
});

onMounted(async () => {
  try {
    const tiendasRes = await axios.get('/api/tiendas');
    tiendasList.value = tiendasRes.data;
  } catch (err) {
    console.error('Error fetching tiendas for selector:', err);
  }

  if (isEditing.value) {
    try {
      const { data } = await axios.get(`/api/products/${route.params.id}`);
      form.nombre = data.nombre;
      form.descripcion = data.descripcion || '';
      form.tienda = data.tienda || 'General';
      form.flag = data.flag || '';
      form.preventaInicio = data.preventa_inicio ? data.preventa_inicio.slice(0, 10) : '';
      form.preventaFin    = data.preventa_fin    ? data.preventa_fin.slice(0, 10)    : '';
      form.precio = data.precio || '';
      form.stock = data.stock || '';
      form.envioEspecial = data.envio_especial || '';
      form.peso = data.peso || '';
      form.esVariable = data.es_variable;
      form.esPublico = data.es_publico;
      if (data.atributos) {
        try {
          let parsed = data.atributos;
          while (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          if (Array.isArray(parsed)) {
            form.atributos = parsed;
          }
        } catch (e) {
          console.warn('Error parsing atributos:', e);
        }
      }
      form.variaciones = data.variaciones.map(v => ({
        ...v,
        peso: v.peso || '',
        color: v.color || '#000000',
        imagenPreview: v.imagen_url || null,  // Mostrar imagen existente
        imagen: null                           // null = sin nuevo archivo
      }));
      if (data.imagen_url) form.imagenPreview = data.imagen_url;
      if (data.galeria_urls) {
        try {
          let parsed = data.galeria_urls;
          while (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          if (Array.isArray(parsed) && parsed.length > 0) {
            form.galeriaPreview = parsed;
          }
        } catch (e) {
          console.warn('Error parsing galeria_urls:', e);
        }
      }
    } catch (err) {
      console.error('Error fetching product:', err);
      alert('Error al cargar el producto para editar');
    }
  }
});

// Funciones de Variaciones
const colorMap = {
  'rojo': '#ff0000', 'red': '#ff0000',
  'azul': '#0000ff', 'blue': '#0000ff',
  'verde': '#00ff00', 'green': '#00ff00',
  'amarillo': '#ffff00', 'yellow': '#ffff00',
  'naranja': '#ffa500', 'orange': '#ffa500',
  'morado': '#800080', 'purple': '#800080',
  'rosa': '#ffc0cb', 'pink': '#ffc0cb',
  'blanco': '#ffffff', 'white': '#ffffff',
  'negro': '#000000', 'black': '#000000',
  'gris': '#808080', 'gray': '#808080',
  'cafe': '#8b4513', 'brown': '#8b4513', 'marrón': '#8b4513',
  'cyan': '#00ffff', 'magenta': '#ff00ff',
  'dorado': '#ffd700', 'plateado': '#c0c0c0',
  'marino': '#000080', 'navy': '#000080',
  'vino': '#800000', 'beige': '#f5f5dc'
};

const guessColor = (name) => {
  const key = name.toLowerCase().trim();
  return colorMap[key] || '#000000';
};

const getParsedOptions = (opcionesStr) => {
  return opcionesStr.split(',').map(opt => opt.trim()).filter(opt => opt);
};

const addAtributo = () => {
  form.atributos.push({ nombre: '', opciones: '', colores: {} });
};

const generarVariaciones = () => {
  // Extract and clean valid attributes
  const validAttrs = form.atributos.filter(a => a.nombre.trim() && a.opciones.trim());
  if (validAttrs.length === 0) {
    alert('Agrega al menos un atributo con opciones para generar combinaciones.');
    return;
  }

  // Parse options into arrays of objects
  const parsedAttrs = validAttrs.map(a => {
    return getParsedOptions(a.opciones).map(opt => {
      // Ensure color is defaulted if not set
      if (a.nombre.toLowerCase().includes('color') && !a.colores[opt]) {
        a.colores[opt] = guessColor(opt);
      }
      return {
        valor: opt,
        colorHex: a.colores ? a.colores[opt] : null
      };
    });
  });

  // Calculate cartesian product
  const combine = (arrays) => {
    return arrays.reduce((a, b) => 
      a.flatMap(d => b.map(e => [d, e].flat()))
    );
  };

  const combinations = parsedAttrs.length === 1 
    ? parsedAttrs[0].map(val => [val]) 
    : combine(parsedAttrs);

  // Generate new variations array
  form.variaciones = combinations.map(combo => {
    // combo is an array of option objects
    const comboArray = Array.isArray(combo) ? combo : [combo];
    const valor = comboArray.map(c => c.valor).join(' - ');
    const colorObj = comboArray.find(c => c.colorHex);
    
    return {
      valor,
      precio: '',
      stock: '',
      peso: '',
      color: colorObj ? colorObj.colorHex : '#000000',
      imagen: null,
      imagenPreview: null
    };
  });
};

const addVariacion = () => {
  form.variaciones.push({
    valor: '',
    precio: '',
    stock: '',
    peso: '',
    color: '#000000',
    imagen: null,
    imagenPreview: null
  });
};

const onVarImgChange = (e, index) => {
  const file = e.target.files[0];
  if (!file) return;
  form.variaciones[index].imagen = file;
  form.variaciones[index].imagenPreview = URL.createObjectURL(file);
};

const clearVarImg = (index) => {
  form.variaciones[index].imagen = null;
  form.variaciones[index].imagenPreview = null;
  form.variaciones[index].imagen_url = null;
};

// ── Imagen principal ─────────────────────────────────────────────────────────

const IMG_CONSTRAINTS = { maxSize: 5 * 1024 * 1024, maxWidth: 1000, maxHeight: 1000 };

const handleImagen = async (file) => {
  imagenError.value = '';
  try {
    await validateImageFile(file, IMG_CONSTRAINTS);
    form.imagen = file;
    form.imagenPreview = URL.createObjectURL(file);
  } catch (err) {
    if (err.type === 'dimensions') {
      await openEditor(file, 'imagen', IMG_CONSTRAINTS, err.currentW, err.currentH);
    } else {
      imagenError.value = err.message;
    }
  }
};

const onImgChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await handleImagen(file);
  e.target.value = '';
};

const onDropImg = async (e) => {
  const file = e.dataTransfer.files[0];
  if (file) await handleImagen(file);
};

// ── Galería ──────────────────────────────────────────────────────────────────

const onGaleriaChange = async (e) => {
  const files = Array.from(e.target.files);
  galeriaError.value = '';
  const formatErrors = [];

  for (const file of files) {
    try {
      await validateImageFile(file, IMG_CONSTRAINTS);
      form.galeria.push(file);
      form.galeriaPreview.push(URL.createObjectURL(file));
    } catch (err) {
      if (err.type === 'dimensions') {
        // Show modal and wait for user's decision before processing the next file
        await openEditor(file, 'galeria', IMG_CONSTRAINTS, err.currentW, err.currentH);
      } else {
        formatErrors.push(`"${file.name}": ${err.message}`);
      }
    }
  }

  if (formatErrors.length) {
    galeriaError.value = `${formatErrors.length} imagen(s) omitida(s) — ${formatErrors[0]}`;
  }
  e.target.value = '';
};

const removeGaleriaImg = (index) => {
  form.galeria.splice(index, 1);
  form.galeriaPreview.splice(index, 1);
};

const guardando = ref(false);
const tiendasList = ref([]);
const imagenError = ref('');
const galeriaError = ref('');

// ── Editor modal state ──────────────────────────────────────────────────────

const showEditorModal  = ref(false);
const editorImageSrc   = ref('');
const editorFile       = ref(null);
const editorCurrentW   = ref(0);
const editorCurrentH   = ref(0);
const editorConstraints = ref({});
const editorTarget     = ref(''); // 'imagen' | 'galeria'
const editorResolve    = ref(null);

const openEditor = (file, target, constraints, currentW, currentH) => {
  return new Promise(resolve => {
    editorFile.value        = file;
    editorImageSrc.value    = URL.createObjectURL(file);
    editorTarget.value      = target;
    editorConstraints.value = constraints;
    editorCurrentW.value    = currentW;
    editorCurrentH.value    = currentH;
    editorResolve.value     = resolve;
    showEditorModal.value   = true;
  });
};

const onEditorDone = (processedFile) => {
  showEditorModal.value = false;
  if (editorTarget.value === 'imagen') {
    form.imagen = processedFile;
    form.imagenPreview = URL.createObjectURL(processedFile);
    imagenError.value = '';
  } else if (editorTarget.value === 'galeria') {
    form.galeria.push(processedFile);
    form.galeriaPreview.push(URL.createObjectURL(processedFile));
  }
  editorResolve.value?.('done');
  editorResolve.value = null;
};

const onEditorCancel = () => {
  showEditorModal.value = false;
  editorResolve.value?.('cancel');
  editorResolve.value = null;
};

const guardar = async () => {
  if (!form.nombre.trim()) {
    alert('El nombre del producto es requerido');
    return;
  }
  if (form.flag === 'Preventa' && (!form.preventaInicio || !form.preventaFin)) {
    alert('La preventa requiere fecha de inicio y fecha de fin');
    return;
  }
  if (imagenError.value || galeriaError.value) return;

  guardando.value = true;
  try {
    const fd = new FormData();
    fd.append('nombre',         form.nombre);
    fd.append('descripcion',    form.descripcion || '');
    fd.append('tienda',         form.tienda);
    fd.append('flag',             form.flag);
    fd.append('preventa_inicio', form.flag === 'Preventa' ? form.preventaInicio : '');
    fd.append('preventa_fin',    form.flag === 'Preventa' ? form.preventaFin    : '');
    fd.append('precio',          form.esVariable ? '' : (form.precio || ''));
    fd.append('stock',          form.esVariable ? '0' : form.stock);
    fd.append('peso',           form.esVariable ? '0' : (form.peso || '0'));
    if (form.envioEspecial !== '' && form.envioEspecial !== null && form.envioEspecial !== undefined) {
      fd.append('envio_especial', form.envioEspecial);
    } else {
      fd.append('envio_especial', '');
    }
    fd.append('es_variable',    form.esVariable ? 'true' : 'false');
    fd.append('es_publico',     form.esPublico ? 'true' : 'false');
    fd.append('slug',           slug.value);
    fd.append('atributos',      JSON.stringify(form.atributos));

    if (form.esVariable && form.variaciones.length > 0) {
      // Serialize variations: use imagen_url for existing images (not blob previews)
      const varsForJson = form.variaciones.map(v => ({
        valor:      v.valor,
        precio:     v.precio,
        stock:      v.stock,
        peso:       v.peso,
        color:      v.color,
        imagen_url: v.imagen instanceof File ? null : (v.imagenPreview && !v.imagenPreview.startsWith('blob:') ? v.imagenPreview : null)
      }));
      fd.append('variaciones', JSON.stringify(varsForJson));
      // Send each new variation image as a separate field
      form.variaciones.forEach((v, i) => {
        if (v.imagen instanceof File) fd.append(`varImg_${i}`, v.imagen);
      });
    }

    if (form.imagen instanceof File) {
      fd.append('imagen', form.imagen);
    } else if (!form.imagenPreview) {
      fd.append('imagen_eliminada', 'true');
    }

    const galeriaAntigua = form.galeriaPreview.filter(url => typeof url === 'string' && !url.startsWith('blob:'));
    fd.append('galeria_existente', JSON.stringify(galeriaAntigua));

    form.galeria.forEach(file => {
      if (file instanceof File) fd.append('galeria', file);
    });

    if (isEditing.value) {
      await axios.put(`/api/products/${route.params.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else {
      await axios.post('/api/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    }

    router.push('/productos');
  } catch (err) {
    console.error('Error saving product:', err);
    const details = err.response?.data?.details || '';
    const errorMsg = err.response?.data?.error || 'Error al guardar el producto';
    alert(`${errorMsg}\n${details}`);
  } finally {
    guardando.value = false;
  }
};
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
