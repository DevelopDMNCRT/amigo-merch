<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="$emit('cancel')" />

        <div class="relative w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 class="text-base font-semibold text-gray-800 dark:text-white">Ajustar imagen</h2>
            <button @click="$emit('cancel')" class="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- ── Step: choose ── -->
          <template v-if="step === 'choose'">
            <div class="px-6 py-5 space-y-4">
              <!-- Warning banner -->
              <div class="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500 flex-shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <div class="text-sm">
                  <p class="font-medium text-amber-800 dark:text-amber-300">La imagen no cumple con las dimensiones requeridas</p>
                  <p class="mt-1 text-amber-700 dark:text-amber-400">
                    Tu imagen: <strong>{{ currentWidth }}×{{ currentHeight }} px</strong>
                    &nbsp;·&nbsp;
                    Requerido: <strong>{{ requirementLabel }}</strong>
                  </p>
                </div>
              </div>

              <p class="text-sm text-gray-600 dark:text-gray-400">¿Cómo deseas ajustar la imagen?</p>

              <div class="grid grid-cols-2 gap-4">
                <button @click="startCrop"
                  class="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:border-brand-600 dark:hover:bg-brand-500/5 transition-colors text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-brand-500"><polyline points="6 2 6 6 2 6"/><path d="M2 22l4-4H18a2 2 0 0 0 2-2V6"/><polyline points="22 6 18 6 18 2"/><path d="M22 2l-4 4v12a2 2 0 0 1-2 2H6"/></svg>
                  <div>
                    <p class="text-sm font-semibold text-gray-800 dark:text-white">Recortar</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Selecciona el área a conservar</p>
                  </div>
                </button>

                <button @click="startResize"
                  class="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-brand-400 hover:bg-brand-50 dark:hover:border-brand-600 dark:hover:bg-brand-500/5 transition-colors text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-brand-500"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
                  <div>
                    <p class="text-sm font-semibold text-gray-800 dark:text-white">Redimensionar</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ajuste automático al tamaño requerido</p>
                  </div>
                </button>
              </div>
            </div>
            <div class="flex justify-end px-6 pb-5">
              <button @click="$emit('cancel')" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">Cancelar</button>
            </div>
          </template>

          <!-- ── Step: crop ── -->
          <template v-else-if="step === 'crop'">
            <div class="px-6 pt-4 pb-2">
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Ajusta el recuadro para seleccionar el área a conservar.
                <template v-if="constraints.exactWidth"> La proporción está fija en {{ constraints.exactWidth }}:{{ constraints.exactHeight }}.</template>
              </p>
            </div>
            <div class="mx-6 mb-4 rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center" style="max-height:58vh">
              <img ref="cropperImg" :src="imageSrc" class="block max-w-full" style="max-height:58vh;opacity:0" />
            </div>
            <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button @click="backToChoose" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">← Volver</button>
              <button @click="applyCrop" class="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition">
                Aplicar recorte
              </button>
            </div>
          </template>

          <!-- ── Step: resize preview ── -->
          <template v-else-if="step === 'resize'">
            <div class="px-6 py-5 space-y-3">
              <p class="text-xs text-gray-500 dark:text-gray-400">Vista previa del resultado:</p>
              <div class="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 flex items-center justify-center p-4 min-h-40">
                <img v-if="resizedPreview" :src="resizedPreview" class="max-w-full max-h-64 rounded object-contain" />
                <div v-else class="flex items-center gap-2 text-gray-400 py-10">
                  <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  <span class="text-sm">Procesando...</span>
                </div>
              </div>
              <p v-if="resizedWidth" class="text-xs text-gray-400 text-center">Resultado: {{ resizedWidth }}×{{ resizedHeight }} px</p>
            </div>
            <div class="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800">
              <button @click="backToChoose" class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition">← Volver</button>
              <button @click="confirmResize" :disabled="!resizedBlob"
                class="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
                Confirmar
              </button>
            </div>
          </template>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.min.css';

const props = defineProps({
  show: Boolean,
  imageSrc: String,
  file: Object, // File
  currentWidth: Number,
  currentHeight: Number,
  constraints: {
    type: Object,
    default: () => ({})
    // { maxWidth, maxHeight, maxSize } OR { exactWidth, exactHeight, maxSize }
  }
});

const emit = defineEmits(['done', 'cancel']);

const step = ref('choose');
const cropperImg = ref(null);
const cropper = ref(null);
const resizedPreview = ref('');
const resizedBlob = ref(null);
const resizedWidth = ref(0);
const resizedHeight = ref(0);

const requirementLabel = computed(() => {
  const c = props.constraints;
  if (c.exactWidth) return `exactamente ${c.exactWidth}×${c.exactHeight} px`;
  if (c.maxWidth)   return `máx. ${c.maxWidth}×${c.maxHeight} px`;
  return '';
});

watch(() => props.show, (val) => {
  if (!val) reset();
});

const reset = () => {
  destroyCropper();
  step.value = 'choose';
  resizedPreview.value = '';
  resizedBlob.value = null;
  resizedWidth.value = 0;
  resizedHeight.value = 0;
};

const backToChoose = () => {
  destroyCropper();
  resizedPreview.value = '';
  resizedBlob.value = null;
  step.value = 'choose';
};

const destroyCropper = () => {
  if (cropper.value) {
    cropper.value.destroy();
    cropper.value = null;
  }
};

onBeforeUnmount(destroyCropper);

// Recorte

const startCrop = async () => {
  step.value = 'crop';
  await nextTick();
  const c = props.constraints;
  cropper.value = new Cropper(cropperImg.value, {
    aspectRatio: c.exactWidth ? c.exactWidth / c.exactHeight : NaN,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 0.95,
    guides: true,
    center: true,
    highlight: false,
    cropBoxMovable: true,
    cropBoxResizable: !c.exactWidth,
    toggleDragModeOnDblclick: false,
    ready() {
      if (cropperImg.value) cropperImg.value.style.opacity = '1';
    }
  });
};

const applyCrop = async () => {
  if (!cropper.value) return;
  const c = props.constraints;
  const outW = c.exactWidth  || c.maxWidth  || props.currentWidth;
  const outH = c.exactHeight || c.maxHeight || props.currentHeight;

  const canvas = cropper.value.getCroppedCanvas({
    width: outW,
    height: outH,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    fillColor: '#fff',
  });
  destroyCropper();

  const mimeType = props.file?.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await blobOptimized(canvas, mimeType, c.maxSize);
  emit('done', new File([blob], props.file?.name || 'imagen.jpg', { type: mimeType }));
};

// Redimensionamiento

const startResize = async () => {
  step.value = 'resize';
  resizedPreview.value = '';
  resizedBlob.value = null;
  await nextTick();

  const img = await loadImage(props.imageSrc);
  const c = props.constraints;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';

  if (c.exactWidth) {
    // Scale to cover → center-crop to exact dimensions
    const scale = Math.max(c.exactWidth / img.width, c.exactHeight / img.height);
    const sw = Math.round(img.width * scale);
    const sh = Math.round(img.height * scale);
    const ox = Math.round((sw - c.exactWidth)  / 2);
    const oy = Math.round((sh - c.exactHeight) / 2);
    canvas.width  = c.exactWidth;
    canvas.height = c.exactHeight;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, -ox, -oy, sw, sh);
    resizedWidth.value  = c.exactWidth;
    resizedHeight.value = c.exactHeight;
  } else {
    // Scale down to fit within maxWidth × maxHeight
    const scale = Math.min(c.maxWidth / img.width, c.maxHeight / img.height, 1);
    const tw = Math.round(img.width  * scale);
    const th = Math.round(img.height * scale);
    canvas.width  = tw;
    canvas.height = th;
    ctx.fillRect(0, 0, tw, th);
    ctx.drawImage(img, 0, 0, tw, th);
    resizedWidth.value  = tw;
    resizedHeight.value = th;
  }

  const mimeType = props.file?.type === 'image/png' ? 'image/png' : 'image/jpeg';
  resizedBlob.value    = await blobOptimized(canvas, mimeType, c.maxSize);
  resizedPreview.value = URL.createObjectURL(resizedBlob.value);
};

const confirmResize = () => {
  if (!resizedBlob.value) return;
  const mimeType = props.file?.type === 'image/png' ? 'image/png' : 'image/jpeg';
  emit('done', new File([resizedBlob.value], props.file?.name || 'imagen.jpg', { type: mimeType }));
};

// Utilidades

const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });

const canvasToBlob = (canvas, type, quality) =>
  new Promise(resolve => canvas.toBlob(blob => resolve(blob), type, quality));

// Reduces JPEG quality until the blob fits within maxSize (if provided)
const blobOptimized = async (canvas, mimeType, maxSize) => {
  if (mimeType === 'image/png') return canvasToBlob(canvas, mimeType);
  let quality = 0.92;
  let blob;
  do {
    blob = await canvasToBlob(canvas, mimeType, quality);
    quality -= 0.08;
  } while (maxSize && blob.size > maxSize && quality > 0.3);
  return blob;
};
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
