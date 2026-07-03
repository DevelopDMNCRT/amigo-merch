<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6" v-if="pedido">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <router-link
          to="/pedidos"
          class="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </router-link>
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">
          Pedido <span class="text-brand-500 font-mono">#{{ pedido.orden }}</span>
        </h1>
      </div>

      <!-- Two-column layout -->
      <div class="grid grid-cols-12 gap-5 items-start">

        <!-- ═══ LEFT CARD: Datos del pedido ═══ -->
        <div class="col-span-12 lg:col-span-8 space-y-5">
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">Información del Pedido</h2>
          </div>

          <div class="px-6 py-6 space-y-6">

            <!-- Fila 1: # Orden, Rastreo, Cliente, Fecha, Total -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-5">
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Orden</p>
                <p class="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">#{{ pedido.orden }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Cód. Rastreo</p>
                <p class="font-mono text-gray-600 dark:text-gray-400 text-sm">{{ pedido.codigo_rastreo }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Cliente</p>
                <p class="font-medium text-gray-800 dark:text-white/90 text-sm">{{ pedido.cliente }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Fecha</p>
                <p class="text-gray-600 dark:text-gray-400 text-sm">{{ pedido.fecha }}</p>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Total</p>
                <p class="font-bold text-gray-800 dark:text-white/90 text-sm">${{ pedido.total.toLocaleString('es-MX') }} MXN</p>
              </div>
            </div>

            <div class="border-t border-gray-100 dark:border-gray-800" />

            <!-- Fila 2: Estado, Correo, Teléfono, Ver Mapa -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-5">
              <!-- Estado dropdown + botón guardar -->
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1.5">Estado</p>
                <div class="flex flex-col gap-2">
                  <!-- Select -->
                  <div class="relative">
                    <select
                      v-model="estadoPendiente"
                      class="w-full appearance-none rounded-lg border border-gray-300 dark:border-gray-700 bg-transparent py-2 pl-3 pr-8 text-sm font-medium focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                      :class="estadoTextClase(estadoPendiente)"
                    >
                      <option value="Pendiente de pago">Pendiente de pago</option>
                      <option value="Nuevo">Nuevo</option>
                      <option value="En proceso">En proceso</option>
                      <option value="Guía Generada">Guía Generada</option>
                      <option value="Fallido">Fallido</option>
                      <option value="Cancelado">Cancelado</option>
                    </select>
                    <span class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                  </div>

                  <!-- Campos extra para Guía Generada: paquetería y rastreo -->
                  <div v-if="estadoPendiente === 'Guía Generada'" class="flex flex-col gap-1.5 rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-2.5">
                    <p class="text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Datos de envío (opcional)</p>
                    <input
                      v-model="envPaqueteria"
                      type="text"
                      placeholder="Paquetería (ej. DHL, FedEx, Estafeta)"
                      class="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs text-gray-800 dark:text-white/90 focus:border-brand-300 focus:outline-none"
                    />
                    <input
                      v-model="envNumRastreo"
                      type="text"
                      placeholder="Número de rastreo"
                      class="w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-xs text-gray-800 dark:text-white/90 focus:border-brand-300 focus:outline-none"
                    />
                  </div>

                  <!-- Email indicator -->
                  <div v-if="estadoTriggerEmail" class="flex items-center gap-1.5 rounded-md bg-blue-light-50 dark:bg-blue-light-500/10 px-2.5 py-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-light-500 flex-shrink-0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    <span class="text-xs font-medium text-blue-light-600 dark:text-blue-light-400">Se enviará correo al cliente</span>
                  </div>

                  <!-- Botón guardar -->
                  <button
                    @click="guardarEstado"
                    :disabled="savingEstado || estadoPendiente === pedido.estado"
                    class="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
                    :class="estadoPendiente !== pedido.estado
                      ? 'bg-brand-500 text-white hover:bg-brand-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'"
                  >
                    <svg v-if="savingEstado" class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 0 0-9-9"/><circle cx="12" cy="12" r="9" stroke-opacity="0.3"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {{ savingEstado ? 'Guardando...' : 'Guardar estado' }}
                  </button>
                </div>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Correo</p>
                <a :href="`mailto:${pedido.correo}`" class="text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 break-all">
                  {{ pedido.correo }}
                </a>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Teléfono</p>
                <a :href="`tel:${pedido.telefono}`" class="text-sm text-gray-700 dark:text-gray-300 hover:text-brand-500">
                  {{ pedido.telefono }}
                </a>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1">Ubicación</p>
                <a
                  :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pedido.domicilio)}`"
                  target="_blank"
                  class="inline-flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Ver Mapa
                </a>
              </div>
            </div>

            <div class="border-t border-gray-100 dark:border-gray-800" />

            <!-- Fila 3: Domicilio completo -->
            <div>
              <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1.5">Domicilio de entrega</p>
              <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{{ pedido.domicilio }}</p>
            </div>

            <div class="border-t border-gray-100 dark:border-gray-800" />

            <!-- Notas del cliente -->
            <div>
              <p class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase mb-1.5 block">Notas del cliente</p>
              <div
                v-if="pedido.nota"
                class="w-full rounded-lg border border-warning-200 dark:border-warning-500/30 bg-warning-50 dark:bg-warning-500/10 px-4 py-3 text-sm text-warning-800 dark:text-warning-300 leading-relaxed"
              >
                {{ pedido.nota }}
              </div>
              <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">Sin notas.</p>
            </div>

          </div>
        </div>

        <!-- ═══ LOGÍSTICA CARD ═══ -->
        <div class="col-span-12 lg:col-span-8 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
          <!-- Header -->
          <div class="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-[#00B4AA]/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00B4AA" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/><rect x="9" y="11" width="14" height="10" rx="1"/><circle cx="12" cy="19" r="2"/><circle cx="20" cy="19" r="2"/></svg>
              </div>
              <h2 class="text-[15px] font-bold text-gray-800 dark:text-white/90">Crear Envío · Envia.com</h2>
            </div>
            <span v-if="pedido.tracking_number" class="inline-flex items-center gap-1.5 text-xs font-semibold text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-500/10 px-2.5 py-1 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Guía generada
            </span>
          </div>

          <!-- Guía ya generada -->
          <div v-if="pedido.tracking_number" class="p-6 space-y-4 border-b border-gray-100 dark:border-gray-800">
            <div class="flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/30">
              <div class="flex-1">
                <p class="text-xs font-medium text-success-600 dark:text-success-400 uppercase tracking-wider mb-1">Número de guía</p>
                <p class="text-xl font-bold font-mono text-gray-900 dark:text-white">{{ pedido.tracking_number }}</p>
              </div>
              <div class="flex items-center gap-3">
                <button 
                  @click="cancelarGuia"
                  :disabled="cancelandoGuia"
                  class="flex items-center gap-2 rounded-lg bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-semibold text-error-600 dark:text-error-400 border border-error-200 dark:border-error-500/30 hover:bg-error-50 dark:hover:bg-error-500/10 transition-colors disabled:opacity-50"
                >
                  <svg v-if="cancelandoGuia" class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  {{ cancelandoGuia ? 'Cancelando...' : 'Cancelar Guía' }}
                </button>
                <a :href="pedido.guia_url" target="_blank"
                  class="flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 text-sm font-semibold text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  Imprimir PDF
                </a>
              </div>
            </div>
          </div>

          <!-- Sin guía: portal completo -->
          <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">

            <!-- ── Sección 1: Origen / Destino / Caja ── -->
            <div class="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">

              <!-- Origen -->            
              <div class="p-5 space-y-1">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🇲🇽</span>
                    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Origen</p>
                  </div>
                </div>
                <!-- Selector de bodega -->
                <div class="space-y-2">
                  <label v-for="b in BODEGAS" :key="b.id"
                    class="flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all"
                    :class="selectedBodega.id === b.id
                      ? 'border-[#00B4AA] bg-[#00B4AA]/5 dark:bg-[#00B4AA]/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'">
                    <div class="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                      :class="selectedBodega.id === b.id ? 'border-[#00B4AA]' : 'border-gray-300 dark:border-gray-600'"
                      @click="selectedBodega = b">
                      <div v-if="selectedBodega.id === b.id" class="w-2 h-2 rounded-full bg-[#00B4AA]"></div>
                    </div>
                    <div @click="selectedBodega = b" class="flex-1 min-w-0">
                      <p class="text-xs font-semibold text-gray-800 dark:text-white/90">{{ b.alias }}</p>
                      <p class="text-[11px] text-gray-400 leading-relaxed mt-0.5">{{ b.street }} {{ b.number }}, {{ b.district }}<br>{{ b.city }}, {{ b.state }} {{ b.postalCode }}</p>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Destino -->
              <div class="p-5">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🇲🇽</span>
                    <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Destino</p>
                  </div>
                  <button @click="editandoDestino = !editandoDestino"
                    class="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                    :class="editandoDestino ? 'bg-[#00B4AA]/10 text-[#00B4AA]' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {{ editandoDestino ? 'Listo' : 'Editar' }}
                  </button>
                </div>

                <!-- Vista compacta -->
                <template v-if="!editandoDestino">
                  <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ destEdit.nombre }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
                    {{ destEdit.calle }} {{ destEdit.num_ext }}, {{ destEdit.colonia }}<br>
                    {{ destEdit.ciudad }}, C.P. {{ destEdit.cp }}
                  </p>
                  <p v-if="destEdit.telefono" class="text-xs text-gray-400 mt-1">📞 {{ destEdit.telefono }}</p>
                  <p v-if="destEdit.referencia" class="text-xs text-[#00B4AA] mt-1 italic">Ref: {{ destEdit.referencia }}</p>
                </template>

                <!-- Modo edición -->
                <template v-else>
                  <div class="space-y-2">
                    <div class="grid grid-cols-2 gap-2">
                      <div class="col-span-2">
                        <label class="text-[11px] text-gray-400 mb-0.5 block">Nombre completo</label>
                        <input v-model="destEdit.nombre" type="text" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                      </div>
                      <div>
                        <label class="text-[11px] text-gray-400 mb-0.5 block">Teléfono</label>
                        <input v-model="destEdit.telefono" type="text" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                      </div>
                      <div>
                        <label class="text-[11px] text-gray-400 mb-0.5 block">C.P.</label>
                        <input v-model="destEdit.cp" type="text" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                      </div>
                      <div class="col-span-2">
                        <label class="text-[11px] text-gray-400 mb-0.5 block">Calle</label>
                        <input v-model="destEdit.calle" type="text" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                      </div>
                      <div>
                        <label class="text-[11px] text-gray-400 mb-0.5 block">No. Ext</label>
                        <input v-model="destEdit.num_ext" type="text" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                      </div>
                      <div>
                        <label class="text-[11px] text-gray-400 mb-0.5 block">No. Int (Opcional)</label>
                        <input v-model="destEdit.num_int" type="text" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                      </div>
                      <div class="col-span-2">
                        <label class="text-[11px] text-gray-400 mb-0.5 block">Colonia</label>
                        <input v-model="destEdit.colonia" type="text" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                      </div>
                      <div>
                        <label class="text-[11px] text-gray-400 mb-0.5 block">País</label>
                        <select v-model="destEdit.pais" @change="onPaisChange" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none">
                          <option value="México">México</option>
                          <option value="Estados Unidos">Estados Unidos</option>
                          <option value="Argentina">Argentina</option>
                          <option value="Colombia">Colombia</option>
                          <option value="Panamá">Panamá</option>
                          <option value="España">España</option>
                        </select>
                      </div>
                      <div>
                        <label class="text-[11px] text-gray-400 mb-0.5 block">Estado</label>
                        <select v-model="destEdit.estado" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none">
                          <option value="" disabled>Selecciona estado</option>
                          <option v-for="estado in currentStates" :key="estado" :value="estado">{{ estado }}</option>
                        </select>
                      </div>
                      <div>
                        <label class="text-[11px] text-gray-400 mb-0.5 block">Ciudad</label>
                        <input v-model="destEdit.ciudad" type="text" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                      </div>
                      <div>
                        <label class="text-[11px] text-gray-400 mb-0.5 block">Delegación / Municipio</label>
                        <input v-model="destEdit.delegacion" type="text" class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                      </div>
                      <div class="col-span-2">
                        <label class="text-[11px] text-gray-400 mb-0.5 block">Referencia <span class="text-gray-300">(aparece en la guía)</span></label>
                        <textarea v-model="destEdit.referencia" rows="2"
                          placeholder="Ej: Tel 5529556508 — Tocar el portón azul"
                          class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 py-1.5 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none resize-none leading-relaxed"></textarea>
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <!-- Caja / Paquete (editable) -->
              <div class="p-5">
                <div class="flex items-center gap-2 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Caja / Paquete</p>
                </div>

                <!-- Selector de plantilla -->
                <div v-if="packagePresets.length > 0" class="mb-4 relative">
                  <label class="text-gray-400 mb-1.5 block text-xs">Plantilla guardada</label>
                  <div class="relative">
                    <input
                      v-model="presetSearch"
                      @focus="showPresetDropdown = true"
                      @blur="setTimeout(() => showPresetDropdown = false, 150)"
                      :placeholder="selectedPresetName || 'Buscar plantilla...'" 
                      class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent pl-2 pr-7 text-xs text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none"
                    />
                    <svg class="absolute right-2 top-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
                  </div>
                  <div v-if="showPresetDropdown" class="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg max-h-48 overflow-y-auto">
                    <div
                      v-for="p in filteredPresets" :key="p.id"
                      @mousedown.prevent="applyPreset(p)"
                      class="flex flex-col gap-0.5 px-3 py-2 text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5">
                      <span class="font-medium text-gray-800 dark:text-white/90 truncate">{{ p.nombre }}</span>
                      <span class="text-gray-400 font-mono text-[11px]">{{ p.largo }}×{{ p.ancho }}×{{ p.alto }} cm, {{ p.peso }}kg</span>
                    </div>
                    <div v-if="filteredPresets.length === 0" class="px-3 py-2 text-xs text-gray-400">Sin resultados</div>
                  </div>
                </div>

                <div class="mb-4">
                  <label class="text-gray-400 mb-1.5 block text-xs">Tipo de Envío</label>
                  <div class="flex items-center gap-2">
                    <button
                      @click="pkgType = 'envelope'"
                      class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                      :class="pkgType === 'envelope' ? 'border-[#00B4AA] bg-[#00B4AA]/10 text-[#00B4AA]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      Sobre
                    </button>
                    <button
                      @click="pkgType = 'box'"
                      class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                      :class="pkgType === 'box' ? 'border-[#00B4AA] bg-[#00B4AA]/10 text-[#00B4AA]' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                      Caja
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label class="text-gray-400 mb-0.5 block">Peso (kg)</label>
                    <input v-model.number="pkgPeso" type="number" step="0.1" min="0.1"
                      class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-sm text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                  </div>
                  <div>
                    <label class="text-gray-400 mb-0.5 block">Largo (cm)</label>
                    <input v-model.number="pkgDims.length" type="number" min="1"
                      class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-sm text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                  </div>
                  <div>
                    <label class="text-gray-400 mb-0.5 block">Ancho (cm)</label>
                    <input v-model.number="pkgDims.width" type="number" min="1"
                      class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-sm text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                  </div>
                  <div>
                    <label class="text-gray-400 mb-0.5 block">Alto (cm)</label>
                    <input v-model.number="pkgDims.height" type="number" min="1"
                      class="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 text-sm text-gray-800 dark:text-white/90 focus:border-[#00B4AA] focus:outline-none" />
                  </div>
                </div>
                <p class="text-[11px] text-gray-400 mt-2">{{ pkgDims.length }}×{{ pkgDims.width }}×{{ pkgDims.height }} cm · {{ pkgPeso }} kg</p>
              </div>
            </div>

            <!-- ── Sección 2: Botón cotizar ── -->
            <div class="px-6 py-4 bg-gray-50/60 dark:bg-white/[0.01]">
              <button @click="cotizarEnvio" :disabled="cotizandoEnvio"
                class="flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
                :class="cotizandoEnvio ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-[#00B4AA] hover:bg-[#009990] text-white'">
                <svg v-if="cotizandoEnvio" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                {{ cotizandoEnvio ? 'Cotizando...' : (rates.length > 0 ? 'Recotizar' : 'Cotizar opciones de envío') }}
              </button>
            </div>

            <!-- ── Sección 3: Resultados de tarifas ── -->
            <div v-if="rates.length > 0" class="p-6 space-y-3">
              <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{{ rates.length }} opciones disponibles</p>

              <div class="space-y-2 max-h-[480px] overflow-y-auto custom-scrollbar pr-1">
                <div v-for="(rate, idx) in rates" :key="idx"
                  class="flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all"
                  :class="selectedRate === rate
                    ? 'border-[#00B4AA] bg-[#00B4AA]/5 dark:bg-[#00B4AA]/10 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]'"
                  @click="selectedRate = rate">

                  <!-- Radio visual -->
                  <div class="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                    :class="selectedRate === rate ? 'border-[#00B4AA]' : 'border-gray-300 dark:border-gray-600'">
                    <div v-if="selectedRate === rate" class="w-2.5 h-2.5 rounded-full bg-[#00B4AA]"></div>
                  </div>

                  <!-- Carrier icon/badge -->
                  <div class="flex-shrink-0 w-12 h-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden shadow-xs">
                    <img v-if="carrierLogo(rate)" :src="carrierLogo(rate)" :alt="rate.carrier"
                      class="w-10 h-8 object-contain"
                      @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='block'" />
                    <span :style="carrierLogo(rate) ? 'display:none' : ''" class="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase text-center px-1 leading-tight">{{ (rate.carrier || '').substring(0, 6) }}</span>
                  </div>

                  <!-- Info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-semibold text-gray-900 dark:text-white capitalize">{{ rate.carrierDescription || rate.carrier }}</span>
                      <!-- Badges -->
                      <span v-if="rate.additionalCharges?.fuel" class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400">
                        Combustible ${{ rate.additionalCharges.fuel }}
                      </span>
                      <span v-if="rate.additionalCharges?.extended" class="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400">
                        Zona extendida ${{ rate.additionalCharges.extended }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{{ rate.serviceDescription || rate.service }}</p>
                    <p class="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {{ rate.deliveryEstimate || 'Estimado no disponible' }}
                    </p>
                  </div>

                  <!-- Precio + Generar -->
                  <div class="flex-shrink-0 flex flex-col items-end gap-2">
                    <span class="text-base font-bold text-gray-900 dark:text-white">${{ Number(rate.totalPrice).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</span>
                    <span class="text-[10px] text-gray-400">Con IVA</span>
                    <button @click.stop="selectedRate = rate; generarGuia()"
                      :disabled="generandoGuia"
                      class="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      :class="generandoGuia && selectedRate === rate
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-[#00B4AA] hover:bg-[#009990] text-white'">
                      <svg v-if="generandoGuia && selectedRate === rate" class="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                      <span v-else>Generar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

        <!-- ═══ RIGHT CARD: Resumen de productos ═══ -->
        <div class="col-span-12 lg:col-span-4 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">Productos</h2>
            <span class="rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-xs font-semibold px-2.5 py-0.5">
              {{ totalItems }} artículos
            </span>
          </div>

          <!-- Lista de productos -->
          <div class="divide-y divide-gray-100 dark:divide-gray-800 max-h-80 overflow-y-auto custom-scrollbar">
            <div
              v-for="item in pedido.items"
              :key="item.id"
              class="flex gap-3 px-5 py-4"
            >
              <div class="w-14 h-14 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <img :src="item.imagen" :alt="item.nombre" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{{ item.nombre }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{{ item.variante }}</p>
                <div class="flex items-center justify-between mt-1.5">
                  <span class="text-xs text-gray-500 dark:text-gray-400">Cant: {{ item.cantidad }}</span>
                  <span class="text-sm font-semibold text-gray-800 dark:text-white/90">
                    ${{ (item.precio * item.cantidad).toLocaleString('es-MX') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Totales -->
          <div class="px-5 py-4 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
            <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span>${{ subtotal.toLocaleString('es-MX') }} MXN</span>
            </div>
            <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Envío</span>
              <span v-if="pedido.envio === 0" class="text-success-600 dark:text-success-500 font-medium">Gratis</span>
              <span v-else>${{ pedido.envio.toLocaleString('es-MX') }} MXN</span>
            </div>
            <div class="border-t border-gray-100 dark:border-gray-800 pt-2.5 flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-800 dark:text-white/90">Total</span>
              <span class="text-base font-bold text-brand-600 dark:text-brand-400">
                ${{ pedido.total.toLocaleString('es-MX') }} MXN
              </span>
            </div>
          </div>

          <!-- Historial de guías canceladas -->
          <div v-if="pedido.guias_canceladas && pedido.guias_canceladas.length > 0" class="border-t border-gray-100 dark:border-gray-800 p-6 bg-gray-50/50 dark:bg-gray-800/30">
            <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-500"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
              Historial de Cancelaciones
            </h3>
            <div class="space-y-3">
              <div v-for="(guia, index) in pedido.guias_canceladas" :key="index" class="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                  <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">{{ guia.carrier || 'N/A' }}</span>
                  <div>
                    <p class="text-sm font-bold text-gray-900 dark:text-white font-mono">{{ guia.tracking_number }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Cancelada el: {{ new Date(guia.fecha_cancelacion).toLocaleString() }}</p>
                  </div>
                </div>
                <a :href="guia.guia_url" target="_blank" class="text-xs font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline">Ver etiqueta original</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p class="text-lg font-medium text-gray-600 dark:text-gray-400">Pedido no encontrado.</p>
      <router-link to="/pedidos" class="mt-4 text-sm text-brand-500 hover:text-brand-600">← Volver a Pedidos</router-link>
    </div>
  </AdminLayout>


  <!-- Toast de confirmación -->
  <Teleport to="body">
    <!-- Prompt Carrier Modal para guías viejas -->
    <div v-if="showCarrierPrompt" class="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" @click="showCarrierPrompt = false"></div>
      <div class="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Falta Paquetería</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Esta guía es antigua y no tiene registrada la paquetería en el sistema. Escribe el nombre de la paquetería (ej. fedex, estafeta, redpack) para poder cancelarla en Envia.
        </p>
        <input 
          v-model="manualCarrier" 
          type="text" 
          placeholder="fedex" 
          class="w-full mb-5 rounded-lg border border-gray-200 p-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        />
        <div class="flex gap-3 justify-end">
          <button @click="showCarrierPrompt = false" class="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700">Atrás</button>
          <button @click="confirmCancelarGuia" class="px-4 py-2 rounded-lg text-sm font-medium bg-error-600 text-white hover:bg-error-700">Intentar Cancelar</button>
        </div>
      </div>
    </div>

    <transition name="toast-slide">
      <div v-if="toast.show" class="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl px-5 py-3.5 shadow-xl text-sm font-medium"
        :class="toast.type === 'success' ? 'bg-success-500 text-white' : 'bg-error-500 text-white'"
      >
        <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        {{ toast.msg }}
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AdminLayout from '@/components/layout/AdminLayout.vue';

const statesData = {
  'México': ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'CDMX', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'],
  'Estados Unidos': ['California', 'Texas', 'Florida', 'New York', 'Illinois', 'Otro'],
  'Argentina': ['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza', 'Otro'],
  'Colombia': ['Antioquia', 'Bogotá', 'Valle del Cauca', 'Cundinamarca', 'Atlántico', 'Otro'],
  'Panamá': ['Panamá', 'Colón', 'Chiriquí', 'Bocas del Toro', 'Coclé', 'Otro'],
  'España': ['Madrid', 'Cataluña', 'Andalucía', 'Valencia', 'Galicia', 'Otro']
};

const route = useRoute();
const pedido = ref(null);
const loading = ref(true);
// Envia.com states
const cotizandoEnvio = ref(false);
const generandoGuia = ref(false);
const cancelandoGuia = ref(false);
const showCarrierPrompt = ref(false);
const manualCarrier = ref('');
const rates = ref([]);
const selectedRate = ref(null);

// Datos de destino editables
const editandoDestino = ref(false);
const destEdit = ref({
  nombre: '', telefono: '', calle: '', num_ext: '', num_int: '',
  colonia: '', ciudad: '', delegacion: '', estado: '', pais: 'México', cp: '',
  correo: '', referencia: ''
});

const currentStates = computed(() => statesData[destEdit.value.pais] || []);
const onPaisChange = () => {
  destEdit.value.estado = '';
};

// Plantillas de paquete
const packagePresets = ref([]);
const presetSearch = ref('');
const showPresetDropdown = ref(false);
const selectedPresetName = ref('');
const filteredPresets = computed(() => {
  const q = presetSearch.value.toLowerCase();
  return packagePresets.value.filter(p => p.nombre.toLowerCase().includes(q));
});
const applyPreset = (p) => {
  pkgType.value   = p.tipo;
  pkgPeso.value   = parseFloat(p.peso);
  pkgDims.value   = { length: p.largo, width: p.ancho, height: p.alto };
  selectedPresetName.value = p.nombre;
  presetSearch.value = '';
  showPresetDropdown.value = false;
};
const fetchPackagePresets = async () => {
  try {
    const res = await fetch('/api/package-presets');
    if (res.ok) packagePresets.value = await res.json();
  } catch (e) { console.error('Error fetching presets:', e); }
};

// Bodegas de origen
const BODEGAS = [
  {
    id: 1,
    alias: 'CDMX — San Lucas',
    nombre: 'Juan Pablo Castillo Cortes',
    company: 'Amigo Merch',
    email: 'amigomerchmx@gmail.com',
    phone: '5529556508',
    street: 'Callejón San Miguel',
    number: '50',
    district: 'San Lucas',
    city: 'Ciudad de México',
    state: 'CX',
    country: 'MX',
    postalCode: '04030',
    reference: ''
  },
  {
    id: 2,
    alias: 'Guadalajara — Americana',
    nombre: 'Paula Franco',
    company: 'Amigo Merch',
    email: 'amigomerchmx@gmail.com',
    phone: '3310762528',
    street: 'Calle Guadalupe Zuno',
    number: '1840-2',
    district: 'Americana',
    city: 'Guadalajara',
    state: 'JA',
    country: 'MX',
    postalCode: '44160',
    reference: 'Dept 2'
  }
];

const selectedBodega = ref(BODEGAS[0]);

// Package dimensions (editable before quoting)
const pkgPeso = ref(1);
const pkgDims = ref({ length: 30, width: 20, height: 10 });
const pkgType = ref('box');

// Carrier domain map for Google Favicon fallback
const CARRIER_DOMAINS = {
  fedex: 'fedex.com',
  dhl: 'dhl.com',
  estafeta: 'estafeta.com',
  redpack: 'redpack.com.mx',
  ups: 'ups.com',
  ampm: 'ampm.mx',
  ivoy: 'ivoy.mx',
  scm: 'scmlogistica.mx',
  paquetexpress: 'paquetexpress.com.mx',
  '99minutos': '99minutos.com',
  tresguerras: 'tresguerras.com.mx',
  sendex: 'sendex.mx',
};

const carrierLogo = (rate) => {
  // 1. Use logo URL directly from Envia API response
  if (rate.carrierImage || rate.imageUrl || rate.logo || rate.image_url) {
    return rate.carrierImage || rate.imageUrl || rate.logo || rate.image_url;
  }
  // 2. Fallback: Google Favicons (reliable, free)
  const key = (rate.carrier || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const domain = CARRIER_DOMAINS[key];
  if (domain) return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  return null;
};

// Define qué estados disparan envío de correo al cliente (para el badge visual)
const EMAIL_STATES = new Set(['En proceso', 'Guía Generada', 'Cancelado', 'Fallido']);

// Estado local pendiente de guardar
const estadoPendiente = ref('');
const savingEstado    = ref(false);
const toast = ref({ show: false, type: 'success', msg: '' });
// Campos extras para estado Guía Generada
const envPaqueteria = ref('');
const envNumRastreo = ref('');

function showToast(type, msg) {
  toast.value = { show: true, type, msg };
  setTimeout(() => { toast.value.show = false; }, 3500);
}

const estadoTriggerEmail = computed(() => EMAIL_STATES.has(estadoPendiente.value));

const fetchPedido = async () => {
  try {
    const res = await fetch(`/api/pedidos/${route.params.id}`);
    if (!res.ok) throw new Error('Pedido no encontrado');
    const data = await res.json();
    
    const d = new Date(data.created_at);
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const fechaFormateada = `${d.getDate().toString().padStart(2,'0')} ${meses[d.getMonth()]} ${d.getFullYear()}`;

    pedido.value = {
      id: data.id,
      orden: String(data.id).padStart(5, '0'),
      codigo_rastreo: data.orden,
      cliente: data.nombre,
      fecha: fechaFormateada,
      ciudad: data.ciudad,
      estado: data.estado,
      correo: data.correo,
      telefono: data.telefono,
      domicilio: data.domicilio,
      nota: data.notas,
      items: data.items || [],
      envio: parseFloat(data.envio),
      total: parseFloat(data.total),
      tracking_number: data.tracking_number,
      guia_url: data.guia_url,
      // Campos de dirección individuales
      calle: data.calle, num_ext: data.num_ext, colonia: data.colonia,
      cp: data.cp, estado_env: data.estado_env, pais: data.pais
    };
    // Inicializar campos editables de destino
    destEdit.value = {
      nombre:     data.nombre     || '',
      telefono:   data.telefono   || '',
      calle:      data.calle      || '',
      num_ext:    data.num_ext    || '',
      num_int:    data.num_int    || '',
      colonia:    data.colonia    || '',
      ciudad:     data.ciudad     || '',
      delegacion: data.delegacion || '',
      estado:     data.estado_env || '',
      pais:       data.pais       || '',
      cp:         data.cp         || '',
      correo:     data.correo     || '',
      referencia: data.notas      || ''
    };
    // Inicializar el estado pendiente con el valor guardado en BD
    estadoPendiente.value = data.estado;
  } catch (error) {
    console.error('Error fetching pedido:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchPedido();
  fetchPackagePresets();
});

const guardarEstado = async () => {
  if (!pedido.value || savingEstado.value) return;
  if (estadoPendiente.value === pedido.value.estado) return;
  savingEstado.value = true;
  try {
    const body = { estado: estadoPendiente.value };
    if (estadoPendiente.value === 'Guía Generada') {
      if (envPaqueteria.value) body.paqueteria = envPaqueteria.value;
      if (envNumRastreo.value) body.num_rastreo = envNumRastreo.value;
    }
    const res = await fetch(`/api/pedidos/${pedido.value.id}/estado`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Error al actualizar el estado');
    const data = await res.json();
    // Actualizar el estado guardado localmente
    pedido.value.estado = estadoPendiente.value;
    const emailMsg = data.emailEnviado ? ' · Correo enviado al cliente ✓' : '';
    showToast('success', `Estado actualizado a "${estadoPendiente.value}"${emailMsg}`);
  } catch (error) {
    console.error('Error updating status:', error);
    // Rollback visual
    estadoPendiente.value = pedido.value.estado;
    showToast('error', 'Error al guardar el estado. Intenta nuevamente.');
  } finally {
    savingEstado.value = false;
  }
};

const cotizarEnvio = async () => {
  if (!pedido.value) return;
  cotizandoEnvio.value = true;
  rates.value = [];
  selectedRate.value = null;
  try {
    const res = await fetch(`/api/pedidos/${pedido.value.id}/cotizar-envio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        peso: pkgPeso.value,
        dims: pkgDims.value,
        origen: selectedBodega.value,
        type: pkgType.value,
        destino: destEdit.value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cotizar');
    
    if (data.rates && data.rates.length > 0) {
      // Filtrar servicios "Ocurre" como origen (ej: "X Ocurre - Domicilio")
      // Estos requieren originBranchCode ya que implica llevar el paquete a una sucursal.
      // Solo dejamos servicios donde la recolección es a domicilio (desde tu bodega).
      const filtered = data.rates.filter(r => {
        const name = (r.serviceDescription || r.service || '').toLowerCase();
        // Excluir si el nombre empieza con "ocurre" o contiene "ocurre -" (origen ocurre)
        // Permitir los que dicen "domicilio - ocurre" (domicilio=origen, ocurre=destino: válido)
        if (/^ocurre\b/.test(name)) return false;            // "Ocurre - X": origen ocurre ❌
        if (/\bocurre\s*-\s*domicilio\b/.test(name)) return false; // "X Ocurre - Domicilio" ❌
        return true;
      });
      rates.value = filtered.sort((a, b) => a.totalPrice - b.totalPrice);
      showToast('success', `${filtered.length} opciones encontradas.`);
    } else {
      showToast('error', 'No se encontraron tarifas para este código postal.');
    }
  } catch (err) {
    console.error(err);
    showToast('error', err.message);
  } finally {
    cotizandoEnvio.value = false;
  }
};

const generarGuia = async () => {
  if (!pedido.value || !selectedRate.value) return;
  generandoGuia.value = true;
  try {
    const payload = {
      carrier: selectedRate.value.carrier,
      service: selectedRate.value.service,
      peso: pkgPeso.value,
      dims: pkgDims.value,
      origen: selectedBodega.value,
      type: pkgType.value,
      destino: destEdit.value
    };
    const res = await fetch(`/api/pedidos/${pedido.value.id}/generar-guia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      let errorMsg = data.error || 'Error al generar la guía';
      if (data.details) {
        if (data.details.error && data.details.error.message) {
          errorMsg = data.details.error.message;
        } else if (typeof data.details === 'string') {
          errorMsg += `: ${data.details}`;
        } else {
          errorMsg += `: ${JSON.stringify(data.details)}`;
        }
      }
      throw new Error(errorMsg);
    }
    
    pedido.value.tracking_number = data.tracking_number;
    pedido.value.guia_url = data.guia_url;
    // carrier is also saved now, but we don't strictly need to update the ref here unless we show it.
    if(data.carrier) pedido.value.carrier = data.carrier;
    
    showToast('success', '¡Guía generada exitosamente!');
  } catch (err) {
    console.error(err);
    showToast('error', err.message);
  } finally {
    generandoGuia.value = false;
  }
};

const cancelarGuia = async () => {
  if (!pedido.value.carrier) {
    // Es una guía antigua sin carrier guardado, pedimos al usuario
    showCarrierPrompt.value = true;
    return;
  }
  
  if (!confirm('¿Estás seguro de que deseas cancelar esta guía? Esta acción anulará la etiqueta en Envia.com y reembolsará el saldo.')) return;
  
  await ejecutarCancelacion(pedido.value.carrier);
};

const confirmCancelarGuia = async () => {
  if (!manualCarrier.value.trim()) {
    showToast('error', 'Debes escribir el nombre de la paquetería.');
    return;
  }
  showCarrierPrompt.value = false;
  await ejecutarCancelacion(manualCarrier.value.trim().toLowerCase());
};

const ejecutarCancelacion = async (carrierStr) => {
  cancelandoGuia.value = true;
  try {
    const res = await fetch(`/api/pedidos/${pedido.value.id}/cancelar-guia`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrier: carrierStr })
    });
    
    const data = await res.json();
    if (!res.ok) {
      let errorMsg = data.error || 'Error al cancelar la guía';
      if (data.details && data.details.error && data.details.error.message) {
        errorMsg = data.details.error.message;
      }
      throw new Error(errorMsg);
    }
    
    // Update local state
    pedido.value.tracking_number = null;
    pedido.value.guia_url = null;
    pedido.value.carrier = null;
    pedido.value.guias_canceladas = data.guias_canceladas || [];
    rates.value = []; // Limpiar tarifas para volver a cotizar
    selectedRate.value = null;
    manualCarrier.value = '';
    
    showToast('success', 'Guía cancelada exitosamente.');
  } catch (err) {
    console.error(err);
    showToast('error', err.message);
  } finally {
    cancelandoGuia.value = false;
  }
};

const totalItems = computed(() => pedido.value?.items.reduce((s, x) => s + x.cantidad, 0) ?? 0);
const subtotal   = computed(() => pedido.value?.items.reduce((s, x) => s + (x.precio * x.cantidad), 0) ?? 0);

const estadoTextClase = (estado) => {
  const m = {
    'Pendiente de pago': 'text-purple-600 dark:text-purple-400',
    'Nuevo':      'text-blue-light-600 dark:text-blue-light-400',
    'En proceso': 'text-warning-600 dark:text-warning-400',
    'Guía Generada': 'text-success-600 dark:text-success-500',
    'Fallido':    'text-error-600 dark:text-error-500',
    'Cancelado':  'text-gray-500 dark:text-gray-400',
  };
  return m[estado] ?? '';
};
</script>

<style scoped>
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.toast-slide-enter-from,
.toast-slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.animate-spin {
  animation: spin 0.75s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
