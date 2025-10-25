<template>
  <div class="p-4 animate-pulse space-y-6">
    <div v-for="n in 4" :key="n" class="space-y-3">
      <!-- Section Title -->
      <div class="h-6 bg-gray-300/60 rounded w-1/2"></div>

      <!-- Items -->
      <div v-for="i in 3" :key="i" class="h-4 bg-gray-300/30 rounded w-2/3"></div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.animate-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
