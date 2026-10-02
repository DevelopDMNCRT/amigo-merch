<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import Preloader from './components/Preloader.vue'
import MantenimientoView from './components/MantenimientoView.vue'

const mantenimiento = ref(false)
const loadingMantenimiento = ref(true)
let pollInterval = null

const checkMantenimiento = async () => {
  try {
    const res = await fetch('/api/settings/mantenimiento')
    const data = await res.json()
    mantenimiento.value = data.mantenimiento
  } catch (err) {
    console.error('Error fetching mantenimiento status:', err)
  } finally {
    loadingMantenimiento.value = false
  }
}

onMounted(() => {
  checkMantenimiento()
  // Poll every 15 seconds to check if maintenance is turned off/on
  pollInterval = setInterval(checkMantenimiento, 15000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<template>
  <Preloader v-if="loadingMantenimiento" />
  <template v-else>
    <MantenimientoView v-if="mantenimiento" />
    <template v-else>
      <Preloader />
      <SiteHeader />
      <router-view :key="$route.fullPath" />
      <SiteFooter />
    </template>
  </template>
</template>

<style>
</style>
