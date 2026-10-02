<template>
  <AdminLayout>
    <div class="space-y-4">

      <!-- Header -->
      <div class="flex items-center gap-3">
        <router-link to="/news" class="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </router-link>
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">{{ isEditing ? 'Editar boletín' : 'Nuevo boletín' }}</h1>
      </div>

      <!-- Asunto -->
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-6 py-4">
        <label class="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1.5">Asunto</label>
        <input v-model="asunto" type="text" placeholder="Escribe el asunto del correo..." class="w-full text-base font-medium text-gray-800 dark:text-white/90 bg-transparent border-0 focus:outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600" />
      </div>

      <!-- Editor + Panel -->
      <div class="flex gap-5 items-start">

        <!-- ── LEFT: Toolbar + Canvas ─────────────────────── -->
        <div class="flex-1 min-w-0 space-y-3">

          <!-- Toolbar -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] px-4 py-2.5 flex flex-wrap items-center gap-1">

            <!-- Format -->
            <select @change="setFormat($event.target.value)" class="h-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm text-gray-700 dark:text-gray-300 px-2 focus:outline-none focus:border-brand-300 cursor-pointer">
              <option value="p">Párrafo</option>
              <option value="h1">Título 1</option>
              <option value="h2">Título 2</option>
              <option value="h3">Título 3</option>
            </select>

            <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <!-- Bold / Italic / Underline -->
            <button v-for="btn in styleButtons" :key="btn.cmd" @mousedown.prevent="exec(btn.cmd)" :title="btn.label"
              class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-bold"
              v-html="btn.icon" />

            <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <!-- Text Color -->
            <div class="relative">
              <button @mousedown.prevent="toggleColors" title="Color de texto"
                class="flex flex-col items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors gap-0.5">
                <span class="text-sm font-bold text-gray-700 dark:text-gray-300 leading-none">A</span>
                <span class="w-4 h-1 rounded-full" :style="{ background: currentColor }"></span>
              </button>
              <div v-if="showColors" class="absolute top-10 left-0 z-50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-2 flex flex-wrap gap-1.5 w-36">
                <button v-for="c in colorPalette" :key="c.v" @mousedown.prevent="applyColor(c.v)" :title="c.n"
                  class="w-6 h-6 rounded-full border-2 border-transparent hover:scale-110 transition-transform"
                  :style="{ background: c.v, borderColor: currentColor === c.v ? '#237650' : 'transparent' }" />
              </div>
            </div>

            <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <!-- Alignment -->
            <button v-for="a in alignButtons" :key="a.cmd" @mousedown.prevent="exec(a.cmd)" :title="a.label"
              class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              v-html="a.icon" />

            <div class="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <!-- Insert Image -->
            <button @mousedown.prevent="$refs.imgInput.click()" title="Insertar imagen"
              class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>
            <input ref="imgInput" type="file" accept="image/*" class="hidden" @change="insertImage" />

            <!-- 1 / 2 Columns -->
            <button @mousedown.prevent="insertCols(1)" title="1 columna (por defecto)"
              class="flex items-center gap-1 h-8 px-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700">
              <span class="flex gap-0.5"><span class="w-5 h-4 bg-gray-400 rounded-sm"></span></span>1 col
            </button>
            <button @mousedown.prevent="insertCols(2)" title="2 columnas"
              class="flex items-center gap-1 h-8 px-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700">
              <span class="flex gap-0.5"><span class="w-2.5 h-4 bg-gray-400 rounded-sm"></span><span class="w-2.5 h-4 bg-gray-400 rounded-sm"></span></span>2 col
            </button>
          </div>

          <!-- Editor Canvas -->
          <div class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-900 p-4">
            <div
              ref="editorEl"
              contenteditable="true"
              class="editor-canvas min-h-[520px] bg-white rounded-xl shadow-sm p-10 focus:outline-none"
              style="font-family: 'Nunito', sans-serif;"
              @click="showColors = false"
              @input="dirty = true"
            ></div>
          </div>
        </div>

        <!-- ── RIGHT: Panel ───────────────────────────────── -->
        <div class="w-64 flex-shrink-0 space-y-4">

          <!-- Templates -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Plantillas</h3>
            </div>
            <div class="p-3 grid grid-cols-2 gap-2">
              <button v-for="tpl in templates" :key="tpl.key" @click="applyTemplate(tpl)"
                class="flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-center cursor-pointer transition-all hover:border-brand-400 hover:shadow-sm"
                :class="activeTemplate === tpl.key ? 'border-brand-500' : 'border-gray-200 dark:border-gray-700'">
                <div class="w-full h-16 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center" v-html="tpl.thumb"></div>
                <span class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ tpl.name }}</span>
              </button>
            </div>
          </div>

          <!-- Destinatarios -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Destinatarios</h3>
              <span class="text-xs font-semibold rounded-full px-2 py-0.5"
                :class="seleccionados.length > 0
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'">
                {{ seleccionados.length }} / {{ suscriptores.length }}
              </span>
            </div>
            <div class="p-3 space-y-2">
              <!-- Buscar -->
              <div class="relative">
                <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input v-model="busqSusc" type="text" placeholder="Filtrar..."
                  class="w-full pl-7 pr-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-xs text-gray-700 dark:text-gray-300 focus:outline-none focus:border-brand-300" />
              </div>
              <!-- Toggle todos -->
              <div class="flex items-center justify-between">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox"
                    :checked="todosSeleccionados"
                    :indeterminate.prop="algunosSeleccionados"
                    @change="toggleTodos"
                    class="rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500 cursor-pointer" />
                  <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Todos</span>
                </label>
                <button v-if="seleccionados.length > 0" @click="seleccionados = []"
                  class="text-xs text-gray-400 hover:text-error-500 transition-colors">Limpiar</button>
              </div>
              <!-- Lista -->
              <div v-if="cargandoSusc" class="py-4 text-center">
                <p class="text-xs text-gray-400">Cargando...</p>
              </div>
              <div v-else-if="suscriptoresFiltrados.length === 0" class="py-4 text-center">
                <p class="text-xs text-gray-400">{{ suscriptores.length === 0 ? 'Sin suscriptores registrados.' : 'Sin resultados.' }}</p>
              </div>
              <div v-else class="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                <label
                  v-for="s in suscriptoresFiltrados" :key="s.correo"
                  class="flex items-start gap-2 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <input type="checkbox"
                    :value="s.correo"
                    v-model="seleccionados"
                    class="mt-0.5 flex-shrink-0 rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500 cursor-pointer" />
                  <div class="min-w-0">
                    <p class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{{ s.nombre }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ s.correo }}</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Publicar</h3>
            </div>
            <div class="p-4 space-y-3">
              <!-- Enviar Ahora -->
              <button
                @click="enviarAhora"
                :disabled="enviando || yaEnviado || !boletinId || seleccionados.length === 0"
                class="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
                :class="yaEnviado
                  ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400 cursor-default'
                  : (!boletinId || seleccionados.length === 0)
                  ? 'bg-brand-500 text-white opacity-40 cursor-not-allowed'
                  : 'bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-60'"
                :title="!boletinId ? 'Guarda el borrador primero' : seleccionados.length === 0 ? 'Selecciona al menos un destinatario' : yaEnviado ? 'Ya enviado' : `Enviar a ${seleccionados.length} contacto(s)`"
              >
                <svg v-if="enviando" class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 0 0-9-9"/><circle cx="12" cy="12" r="9" stroke-opacity="0.25"/></svg>
                <svg v-else-if="yaEnviado" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                <span v-if="!yaEnviado && !enviando && seleccionados.length > 0">
                  Enviar a {{ seleccionados.length }}
                </span>
                <span v-else>{{ enviando ? 'Enviando...' : yaEnviado ? 'Ya enviado' : 'Enviar ahora' }}</span>
              </button>
              <p v-if="!boletinId" class="text-xs text-gray-400 text-center">Guarda el borrador antes de enviar.</p>
              <p v-else-if="seleccionados.length === 0" class="text-xs text-gray-400 text-center">Selecciona destinatarios arriba.</p>
            </div>
          </div>

          <!-- Guardar borrador -->
          <button @click="guardarBorrador" :disabled="saving"
            class="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50">
            <svg v-if="saving" class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 0 0-9-9"/><circle cx="12" cy="12" r="9" stroke-opacity="0.25"/></svg>
            {{ saving ? 'Guardando...' : 'Guardar borrador' }}
          </button>

          <!-- Toast -->
          <transition name="fade">
            <div v-if="toast.show" class="rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
              :class="toast.ok ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400' : 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400'">
              <svg v-if="toast.ok" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {{ toast.msg }}
            </div>
          </transition>
        </div>
      </div>
    </div>
  </AdminLayout>

  <!-- Modal resultado de envío -->
  <Teleport to="body">
    <transition name="fade">
      <div v-if="resultModal.show" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="resultModal.show = false">
        <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
          <div class="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              :class="resultModal.ok ? 'bg-success-100 dark:bg-success-500/20' : 'bg-error-100 dark:bg-error-500/20'">
              <svg v-if="resultModal.ok" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-success-600 dark:text-success-400"><polyline points="20 6 9 17 4 12"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-error-500"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h2 class="text-base font-bold text-gray-800 dark:text-white/90">{{ resultModal.titulo }}</h2>
          </div>
          <div class="px-6 py-5 space-y-3">
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ resultModal.msg }}</p>
            <div v-if="resultModal.ok" class="grid grid-cols-2 gap-3">
              <div class="rounded-xl bg-success-50 dark:bg-success-500/10 px-4 py-3 text-center">
                <p class="text-2xl font-bold text-success-600 dark:text-success-400">{{ resultModal.enviados }}</p>
                <p class="text-xs text-success-600 dark:text-success-500 font-medium mt-0.5">Enviados</p>
              </div>
              <div class="rounded-xl bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center">
                <p class="text-2xl font-bold text-gray-700 dark:text-gray-300">{{ resultModal.fallidos }}</p>
                <p class="text-xs text-gray-500 font-medium mt-0.5">Fallidos</p>
              </div>
            </div>
            <p v-if="resultModal.ok && !resultModal.emailReal" class="text-xs text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-500/10 rounded-lg px-3 py-2">
              ⚠️ Modo dev: no hay SMTP configurado. Configura las variables de entorno para envíos reales.
            </p>
          </div>
          <div class="px-6 pb-5">
            <button @click="resultModal.show = false; $router.push('/news')" class="w-full rounded-xl bg-brand-500 text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-600 transition-colors">
              Volver a Newsletter
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import AdminLayout from '@/components/layout/AdminLayout.vue';

const router = useRouter();
const route  = useRoute();
const editorEl    = ref(null);
const asunto      = ref('');
const showColors  = ref(false);
const currentColor = ref('#237650');
const activeTemplate = ref('blank');
const saving     = ref(false);
const boletinId  = ref(null);
const toast      = ref({ show: false, ok: true, msg: '' });
const enviando   = ref(false);
const yaEnviado  = ref(false);
const resultModal = ref({ show: false, ok: true, titulo: '', msg: '', enviados: 0, fallidos: 0, emailReal: false });


// Suscriptores para selección de destinatarios
const suscriptores        = ref([]);
const seleccionados       = ref([]);  // array de correos seleccionados
const cargandoSusc        = ref(false);
const busqSusc            = ref('');

const suscriptoresFiltrados = computed(() => {
  const q = busqSusc.value.toLowerCase();
  if (!q) return suscriptores.value;
  return suscriptores.value.filter(s =>
    s.nombre.toLowerCase().includes(q) || s.correo.toLowerCase().includes(q)
  );
});

const todosSeleccionados = computed(() =>
  suscriptores.value.length > 0 && seleccionados.value.length === suscriptores.value.length
);
const algunosSeleccionados = computed(() =>
  seleccionados.value.length > 0 && seleccionados.value.length < suscriptores.value.length
);

const toggleTodos = () => {
  if (todosSeleccionados.value) {
    seleccionados.value = [];
  } else {
    seleccionados.value = suscriptores.value.map(s => s.correo);
  }
};

const cargarSuscriptores = async () => {
  cargandoSusc.value = true;
  try {
    const res = await fetch('/api/suscriptores');
    if (res.ok) {
      suscriptores.value = await res.json();
      // Por defecto, seleccionar todos
      seleccionados.value = suscriptores.value.map(s => s.correo);
    }
  } catch { /* silencioso */ } finally {
    cargandoSusc.value = false;
  }
};

function showToast(ok, msg) {
  toast.value = { show: true, ok, msg };
  setTimeout(() => { toast.value.show = false; }, 3000);
}

// Formato
const exec = (cmd) => { editorEl.value.focus(); document.execCommand(cmd, false, null); };

const setFormat = (tag) => {
  editorEl.value.focus();
  document.execCommand('formatBlock', false, tag);
};

const toggleColors = () => { showColors.value = !showColors.value; };

const applyColor = (color) => {
  currentColor.value = color;
  editorEl.value.focus();
  document.execCommand('foreColor', false, color);
  showColors.value = false;
};

const colorPalette = [
  { v: '#237650', n: 'Verde Marca' },
  { v: '#111827', n: 'Negro' },
  { v: '#6B7280', n: 'Gris' },
  { v: '#EF4444', n: 'Rojo' },
  { v: '#F59E0B', n: 'Naranja' },
  { v: '#3B82F6', n: 'Azul' },
  { v: '#8B5CF6', n: 'Morado' },
  { v: '#EC4899', n: 'Rosa' },
  { v: '#FFFFFF', n: 'Blanco' },
];

const styleButtons = [
  { cmd: 'bold',      label: 'Negrita',   icon: '<b>B</b>' },
  { cmd: 'italic',    label: 'Cursiva',   icon: '<i style="font-style:italic">I</i>' },
  { cmd: 'underline', label: 'Subrayado', icon: '<u>U</u>' },
];

const alignButtons = [
  { cmd: 'justifyLeft',   label: 'Izquierda', icon: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>' },
  { cmd: 'justifyCenter', label: 'Centro',    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>' },
  { cmd: 'justifyRight',  label: 'Derecha',   icon: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="7" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>' },
];

// Inserción de imagen
const insertImage = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    editorEl.value.focus();
    document.execCommand('insertHTML', false, `<img src="${ev.target.result}" style="max-width:100%;border-radius:10px;margin:12px 0;display:block;" /><p><br></p>`);
  };
  reader.readAsDataURL(file);
  e.target.value = '';
};

// Columnas
const insertCols = (n) => {
  if (n === 1) {
    // Reset to single full-width column
    const html = `<div style="display:block;width:100%;font-family:'Nunito',sans-serif;"><p>Escribe aquí...</p></div><p><br></p>`;
    editorEl.value.focus();
    document.execCommand('insertHTML', false, html);
  } else {
    const col = `<div style="flex:1;padding:8px 12px;min-width:0;font-family:'Nunito',sans-serif;"><p style="margin:0;">Texto de columna</p></div>`;
    const html = `<div style="display:flex;gap:16px;margin:16px 0;">${col.repeat(n)}</div><p><br></p>`;
    editorEl.value.focus();
    document.execCommand('insertHTML', false, html);
  }
};

// Plantillas
const tplStyles = 'font-family:Nunito,sans-serif;';

const templates = [
  {
    key: 'blank',
    name: 'En blanco',
    thumb: '<div style="padding:6px;"><div style="height:6px;background:#e5e7eb;border-radius:3px;margin-bottom:4px;width:70%"></div><div style="height:4px;background:#e5e7eb;border-radius:3px;margin-bottom:3px;width:90%"></div><div style="height:4px;background:#e5e7eb;border-radius:3px;width:80%"></div></div>',
    html: '<p><br></p>',
  },
  {
    key: 'anuncio',
    name: 'Anuncio',
    thumb: '<div style="padding:4px;text-align:center;"><div style="height:8px;background:#237650;border-radius:3px;margin-bottom:4px;width:80%;margin-left:auto;margin-right:auto"></div><div style="height:4px;background:#d1fae5;border-radius:3px;margin-bottom:6px;width:90%;margin-left:auto;margin-right:auto"></div><div style="background:#237650;border-radius:4px;height:12px;width:40%;margin:0 auto;"></div></div>',
    html: `<div style="${tplStyles}text-align:center;padding:32px 0;">
  <h1 style="color:#237650;font-size:2rem;font-weight:900;margin-bottom:8px;">¡Gran Anuncio!</h1>
  <p style="color:#555;font-size:1.1rem;margin-bottom:24px;">Aquí va el subtítulo o descripción breve.</p>
  <p style="color:#333;line-height:1.7;">Contenido principal del correo. Escribe aquí toda la información que quieres compartir con tus suscriptores.</p>
  <br>
  <a href="#" style="background:#237650;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;margin-top:16px;">Ver más</a>
</div><p><br></p>`,
  },
  {
    key: 'catalogo',
    name: 'Catálogo',
    thumb: '<div style="padding:4px;"><div style="height:6px;background:#237650;border-radius:3px;margin-bottom:5px;width:60%;margin-left:auto;margin-right:auto"></div><div style="display:flex;gap:3px;"><div style="flex:1;background:#f3f4f6;border-radius:4px;height:28px;"></div><div style="flex:1;background:#f3f4f6;border-radius:4px;height:28px;"></div></div></div>',
    html: `<div style="${tplStyles}">
  <h2 style="color:#237650;font-size:1.5rem;font-weight:800;text-align:center;margin-bottom:24px;">Nuestros Productos</h2>
  <div style="display:flex;gap:24px;">
    <div style="flex:1;text-align:center;">
      <div style="background:#f3f4f6;border-radius:12px;height:140px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;"><span style="color:#9ca3af;font-size:0.9rem;">Imagen</span></div>
      <h3 style="font-weight:800;color:#111;margin-bottom:4px;">Producto 1</h3>
      <p style="color:#555;font-size:0.9rem;">Descripción breve del producto.</p>
      <p style="color:#237650;font-weight:700;">$299 MXN</p>
    </div>
    <div style="flex:1;text-align:center;">
      <div style="background:#f3f4f6;border-radius:12px;height:140px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;"><span style="color:#9ca3af;font-size:0.9rem;">Imagen</span></div>
      <h3 style="font-weight:800;color:#111;margin-bottom:4px;">Producto 2</h3>
      <p style="color:#555;font-size:0.9rem;">Descripción breve del producto.</p>
      <p style="color:#237650;font-weight:700;">$499 MXN</p>
    </div>
  </div>
</div><p><br></p>`,
  },
  {
    key: 'evento',
    name: 'Evento',
    thumb: '<div style="padding:4px;"><div style="background:linear-gradient(135deg,#237650,#1a5a3c);border-radius:6px;height:22px;margin-bottom:4px;display:flex;align-items:center;justify-content:center;"><div style="height:4px;background:rgba(255,255,255,0.6);border-radius:2px;width:50%;"></div></div><div style="height:4px;background:#e5e7eb;border-radius:3px;margin-bottom:3px;width:90%"></div><div style="background:#237650;border-radius:4px;height:10px;width:35%;margin:0 auto;"></div></div>',
    html: `<div style="${tplStyles}">
  <div style="background:linear-gradient(135deg,#237650,#1a5a3c);border-radius:12px;padding:40px 32px;text-align:center;margin-bottom:24px;">
    <h1 style="color:white;font-size:2.2rem;font-weight:900;margin-bottom:8px;">Nombre del Evento</h1>
    <p style="color:rgba(255,255,255,0.85);font-size:1.1rem;">Sábado 10 de Mayo · CDMX</p>
  </div>
  <p style="color:#333;line-height:1.8;font-size:1rem;">Descripción del evento. Incluye toda la información relevante: lugar, hora, cómo llegar y por qué no te lo puedes perder.</p>
  <br>
  <div style="text-align:center;">
    <a href="#" style="background:#237650;color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:1.1rem;display:inline-block;">¡Quiero ir!</a>
  </div>
</div><p><br></p>`,
  },
];

const applyTemplate = (tpl) => {
  activeTemplate.value = tpl.key;
  editorEl.value.innerHTML = tpl.html;
};

// Enviar boletín
const enviarAhora = async () => {
  if (!boletinId.value || enviando.value || seleccionados.value.length === 0) return;
  if (!confirm(`¿Enviar este boletín a ${seleccionados.value.length} contacto(s) seleccionado(s)?\n\nEsta acción no se puede deshacer.`)) return;
  enviando.value = true;
  // Pre-guardar el contenido actual
  try {
    await fetch(`/api/boletines/${boletinId.value}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asunto: asunto.value.trim(), html: editorEl.value.innerHTML }),
    });
  } catch { /* continuar */ }
  // Enviar con lista de destinatarios seleccionados
  try {
    const res = await fetch(`/api/boletines/${boletinId.value}/enviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinatarios: seleccionados.value }),
    });
    const data = await res.json();
    if (!res.ok) {
      resultModal.value = { show: true, ok: false, titulo: 'Error al enviar', msg: data.error || 'Ocurrió un error inesperado.', enviados: 0, fallidos: 0, emailReal: false };
    } else {
      yaEnviado.value = true;
      resultModal.value = {
        show: true, ok: true,
        titulo: '¡Boletín enviado!',
        msg: `Se envió "${asunto.value}" a ${seleccionados.value.length} destinatario(s).`,
        enviados:  data.enviados,
        fallidos:  data.fallidos,
        emailReal: data.emailReal,
      };
    }
  } catch {
    resultModal.value = { show: true, ok: false, titulo: 'Error de conexión', msg: 'No se pudo conectar con el servidor.', enviados: 0, fallidos: 0, emailReal: false };
  } finally {
    enviando.value = false;
  }
};
const guardarBorrador = async () => {
  if (saving.value) return;
  saving.value = true;
  const payload = { asunto: asunto.value.trim(), html: editorEl.value.innerHTML };
  try {
    let res;
    if (isEditing.value) {
      res = await fetch(`/api/boletines/${boletinId.value}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch('/api/boletines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (!isEditing.value) {
      boletinId.value = data.id;
      // Actualiza la URL sin recargar para reflejar modo edición
      router.replace(`/news/${data.id}`);
    }
    showToast(true, 'Borrador guardado correctamente');
  } catch {
    showToast(false, 'Error al guardar. Intenta nuevamente.');
  } finally {
    saving.value = false;
  }
};

// Init: carga boletín existente o inicia en blanco
onMounted(async () => {
  cargarSuscriptores();   // en paralelo, no bloqueante
  const idParam = route.params.id;
  if (idParam && idParam !== 'nueva') {
    try {
      const res = await fetch(`/api/boletines/${idParam}`);
      if (res.ok) {
        const data = await res.json();
        boletinId.value   = data.id;
        asunto.value      = data.asunto;
        yaEnviado.value   = data.estado === 'Enviado';
        editorEl.value.innerHTML = data.html || '<p><br></p>';
        return;
      }
    } catch { /* si falla, inicia en blanco */ }
  }
  editorEl.value.innerHTML = '<p><br></p>';
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

.editor-canvas { font-family: 'Nunito', sans-serif !important; color: #1f2937; line-height: 1.7; }
.editor-canvas:focus { outline: none; }
.editor-canvas * { font-family: 'Nunito', sans-serif !important; }
.editor-canvas h1 { font-size: 2rem; font-weight: 900; margin: 0.5em 0; }
.editor-canvas h2 { font-size: 1.5rem; font-weight: 800; margin: 0.5em 0; }
.editor-canvas h3 { font-size: 1.25rem; font-weight: 700; margin: 0.5em 0; }
.editor-canvas p  { margin: 0.4em 0; }
.editor-canvas img { max-width: 100%; border-radius: 10px; }
.editor-canvas a  { color: #237650; }
</style>
