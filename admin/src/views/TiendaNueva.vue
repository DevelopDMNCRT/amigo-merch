<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">

      <!-- Page Header -->
      <div class="flex items-center gap-3">
        <router-link
          to="/tiendas"
          class="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </router-link>
        <h1 class="text-xl font-semibold text-gray-800 dark:text-white/90">
          {{ isEditing ? 'Editar Tienda' : 'Nueva Tienda' }}
        </h1>
      </div>

      <!-- Form Card -->
      <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <form @submit.prevent="guardarTienda" class="divide-y divide-gray-100 dark:divide-gray-800">

          <!-- Body -->
          <div class="px-6 py-8">
            <div class="grid grid-cols-12 gap-6">

              <!-- Foto de la tienda -->
              <div class="col-span-12">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Foto de la tienda
                </label>
                <div
                  class="relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed px-5 py-12 text-center cursor-pointer transition-colors"
                  :class="imagenError
                    ? 'border-error-400 bg-error-50 dark:border-error-600 dark:bg-error-500/5'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 hover:border-brand-400 hover:bg-brand-50 dark:hover:border-brand-600 dark:hover:bg-brand-500/5'"
                  @click="$refs.fileInput.click()"
                  @dragover.prevent
                  @drop.prevent="onDrop"
                >
                  <input
                    ref="fileInput"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    class="hidden"
                    @change="onFileChange"
                  />
                  <div v-if="form.imagenPreview" class="mb-4">
                    <img :src="form.imagenPreview" class="mx-auto h-32 w-32 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-theme-sm" />
                  </div>
                  <div v-else class="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {{ form.imagenPreview ? 'Haz clic para cambiar la foto' : 'Haz clic o arrastra una imagen aquí' }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">JPG, JPEG, PNG — máx. 800×800 px — máx. 1 MB</p>
                </div>
                <p v-if="imagenError" class="mt-1.5 text-xs text-error-500">{{ imagenError }}</p>
              </div>

              <!-- Header de la tienda -->
              <div class="col-span-12">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Header de la tienda
                </label>
                <div
                  class="relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed px-5 py-10 text-center cursor-pointer transition-colors"
                  :class="headerError
                    ? 'border-error-400 bg-error-50 dark:border-error-600 dark:bg-error-500/5'
                    : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 hover:border-brand-400 hover:bg-brand-50 dark:hover:border-brand-600 dark:hover:bg-brand-500/5'"
                  @click="$refs.headerInput.click()"
                  @dragover.prevent
                  @drop.prevent="onHeaderDrop"
                >
                  <input
                    ref="headerInput"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    class="hidden"
                    @change="onHeaderChange"
                  />
                  <div v-if="form.headerPreview" class="mb-4 w-full">
                    <img :src="form.headerPreview" class="w-full h-24 rounded-lg object-cover border border-gray-200 dark:border-gray-700 shadow-theme-sm" />
                  </div>
                  <div v-else class="mb-4 flex items-center justify-center w-16 h-10 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {{ form.headerPreview ? 'Haz clic para cambiar el header' : 'Haz clic o arrastra el header aquí' }}
                  </p>
                  <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">JPG, JPEG, PNG — exactamente 1920×420 px — máx. 1.5 MB</p>
                </div>
                <p v-if="headerError" class="mt-1.5 text-xs text-error-500">{{ headerError }}</p>
              </div>

              <!-- Nombre -->
              <div class="col-span-12 sm:col-span-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Nombre <span class="text-error-500">*</span>
                </label>
                <input
                  v-model="form.nombre"
                  type="text"
                  placeholder="Nombre de la tienda"
                  required
                  class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>

              <!-- Estado -->
              <div class="col-span-12 sm:col-span-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Estado</label>
                <div class="flex items-center justify-between h-11 rounded-xl border border-gray-200 dark:border-gray-700 px-4">
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ form.publico ? 'Público — visible para todos' : 'Privado — solo administradores' }}
                  </p>
                  <button
                    type="button"
                    @click="form.publico = !form.publico"
                    :class="[
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      form.publico ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'
                    ]"
                  >
                    <span
                      :class="[
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        form.publico ? 'translate-x-5' : 'translate-x-0'
                      ]"
                    />
                  </button>
                </div>
              </div>

            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 px-6 py-4">
            <router-link
              to="/tiendas"
              class="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </router-link>
            <button
              type="submit"
              :disabled="guardando"
              class="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 transition-colors disabled:opacity-60"
            >
              {{ guardando ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Tienda') }}
            </button>
          </div>

        </form>
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
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import ImageEditorModal from "@/components/ui/ImageEditorModal.vue";
import axios from "axios";
import { validateImageFile } from "@/utils/imageValidation";

const router = useRouter();
const route = useRoute();
const isEditing = computed(() => !!route.params.id);
const guardando = ref(false);
const imagenError = ref('');
const headerError = ref('');

const form = reactive({
  nombre: '',
  imagen: null,
  imagenPreview: null,
  header: null,
  headerPreview: null,
  publico: false,
});

// ── Editor modal state ──────────────────────────────────────────────────────

const showEditorModal = ref(false);
const editorImageSrc   = ref('');
const editorFile       = ref(null);
const editorCurrentW   = ref(0);
const editorCurrentH   = ref(0);
const editorConstraints = ref({});
const editorTarget     = ref(''); // 'imagen' | 'header'
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
  } else if (editorTarget.value === 'header') {
    form.header = processedFile;
    form.headerPreview = URL.createObjectURL(processedFile);
    headerError.value = '';
  }
  editorResolve.value?.('done');
  editorResolve.value = null;
};

const onEditorCancel = () => {
  showEditorModal.value = false;
  editorResolve.value?.('cancel');
  editorResolve.value = null;
};

// ── Foto handlers ───────────────────────────────────────────────────────────

const IMAGEN_CONSTRAINTS = { maxSize: 1024 * 1024, maxWidth: 800, maxHeight: 800 };

const handleImagen = async (file) => {
  imagenError.value = '';
  try {
    await validateImageFile(file, IMAGEN_CONSTRAINTS);
    form.imagen = file;
    form.imagenPreview = URL.createObjectURL(file);
  } catch (err) {
    if (err.type === 'dimensions') {
      await openEditor(file, 'imagen', IMAGEN_CONSTRAINTS, err.currentW, err.currentH);
    } else {
      imagenError.value = err.message;
    }
  }
};

const onFileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await handleImagen(file);
  e.target.value = '';
};

const onDrop = async (e) => {
  const file = e.dataTransfer.files[0];
  if (file) await handleImagen(file);
};

// ── Header handlers ─────────────────────────────────────────────────────────

const HEADER_CONSTRAINTS = { maxSize: 1.5 * 1024 * 1024, exactWidth: 1920, exactHeight: 420 };

const handleHeader = async (file) => {
  headerError.value = '';
  try {
    await validateImageFile(file, HEADER_CONSTRAINTS);
    form.header = file;
    form.headerPreview = URL.createObjectURL(file);
  } catch (err) {
    if (err.type === 'dimensions') {
      await openEditor(file, 'header', HEADER_CONSTRAINTS, err.currentW, err.currentH);
    } else {
      headerError.value = err.message;
    }
  }
};

const onHeaderChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await handleHeader(file);
  e.target.value = '';
};

const onHeaderDrop = async (e) => {
  const file = e.dataTransfer.files[0];
  if (file) await handleHeader(file);
};

// ── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(async () => {
  if (isEditing.value) {
    try {
      const { data } = await axios.get(`/api/tiendas/${route.params.id}`);
      form.nombre = data.nombre;
      form.publico = data.publico;
      if (data.imagen_url) form.imagenPreview = data.imagen_url;
      if (data.header_url) form.headerPreview = data.header_url;
    } catch (err) {
      console.error('Error fetching tienda:', err);
      alert('Error al cargar la tienda');
    }
  }
});

// ── Submit ───────────────────────────────────────────────────────────────────

const guardarTienda = async () => {
  if (!form.nombre.trim()) {
    alert('El nombre es requerido');
    return;
  }
  if (imagenError.value || headerError.value) return;
  guardando.value = true;
  try {
    const fd = new FormData();
    fd.append('nombre', form.nombre);
    fd.append('publico', form.publico);
    if (form.imagen instanceof File) fd.append('imagen', form.imagen);
    if (form.header instanceof File) fd.append('header', form.header);

    if (isEditing.value) {
      await axios.put(`/api/tiendas/${route.params.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else {
      await axios.post('/api/tiendas', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    router.push('/tiendas');
  } catch (err) {
    console.error('Error saving tienda:', err);
    alert(err.response?.data?.details || err.response?.data?.error || 'Error al guardar');
  } finally {
    guardando.value = false;
  }
};
</script>
