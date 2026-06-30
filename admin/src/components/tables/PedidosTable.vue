<template>
  <div class="max-w-full overflow-x-auto custom-scrollbar">
      <table class="min-w-full">
        <thead>
          <tr class="border-b border-gray-200 dark:border-gray-700">
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400"># Orden</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Cliente</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Rastreo</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Fecha</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Ciudad</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Total</p>
            </th>
            <th class="px-5 py-3 text-left sm:px-6">
              <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Estado</p>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr
            v-for="pedido in pedidos"
            :key="pedido.id"
            @click="$emit('select', pedido)"
            class="hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <!-- # Orden -->
            <td class="px-5 py-4 sm:px-6">
              <span class="font-mono text-theme-sm font-semibold text-brand-600 dark:text-brand-400">
                #{{ pedido.orden }}
              </span>
            </td>

            <!-- Cliente -->
            <td class="px-5 py-4 sm:px-6">
              <span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ pedido.cliente }}</span>
            </td>

            <!-- Rastreo -->
            <td class="px-5 py-4 sm:px-6">
              <span class="font-mono text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 px-2 py-1 rounded-md">{{ pedido.codigo_rastreo }}</span>
            </td>

            <!-- Fecha -->
            <td class="px-5 py-4 sm:px-6">
              <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ pedido.fecha }}</span>
            </td>

            <!-- Ciudad -->
            <td class="px-5 py-4 sm:px-6">
              <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ pedido.ciudad }}</span>
            </td>

            <!-- Total -->
            <td class="px-5 py-4 sm:px-6">
              <span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                ${{ pedido.total.toLocaleString('es-MX') }}
              </span>
            </td>

            <!-- Estado -->
            <td class="px-5 py-4 sm:px-6">
              <span :class="estadoClase(pedido.estado)" class="rounded-full px-2.5 py-0.5 text-theme-xs font-medium">
                {{ pedido.estado }}
              </span>
            </td>
          </tr>

          <tr v-if="pedidos.length === 0">
            <td colspan="7" class="px-5 py-12 text-center">
              <p class="text-sm text-gray-400 dark:text-gray-500">No hay pedidos registrados.</p>
            </td>
          </tr>
        </tbody>
  </table>
</div>
</template>

<script setup>
defineProps({
  pedidos: { type: Array, default: () => [] },
});

defineEmits(['select']);

const estadoClase = (estado) => {
  const mapa = {
    'Pendiente de pago': 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    'Nuevo':       'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-400',
    'En proceso':  'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
    'Completado':  'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    'Fallido':     'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500',
    'Cancelado':   'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return mapa[estado] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
};
</script>
