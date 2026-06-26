<template>
  <div class="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4">
    <div class="text-center max-w-lg w-full">
      <div class="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-500">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      </div>
      <h1 class="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
        Página en Mantenimiento
      </h1>
      <p class="mt-4 text-base text-gray-500 dark:text-gray-400">
        Estamos realizando algunas mejoras y actualizaciones en nuestra tienda. Volveremos a estar en línea muy pronto. ¡Gracias por tu paciencia!
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.body.style.setProperty('overflow', 'hidden', 'important')
})

onUnmounted(() => {
  document.body.style.removeProperty('overflow')
})
</script>
