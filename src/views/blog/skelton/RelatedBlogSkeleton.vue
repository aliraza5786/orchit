<script setup lang="ts">
import { useTheme } from "../../../composables/useTheme";

const { theme } = useTheme();
</script>

<template>
  <div class="grid sm:grid-cols-2 gap-8">
    <div v-for="n in 4" :key="n"
         class="rounded-2xl overflow-hidden border p-5 animate-pulse"
         :class="theme === 'dark' ? 'border-border-input bg-bg-charcoal' : 'border-gray-200 bg-white'">
      
      <!-- Image Skeleton -->
      <div class="h-44 w-full rounded-lg mb-4"
           :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
      
      <!-- Title Skeleton -->
      <div class="h-6 w-3/4 rounded-md mb-2"
           :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
      
      <!-- Excerpt Skeleton -->
      <div class="h-4 w-full rounded-md mb-2"
           :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
      <div class="h-4 w-5/6 rounded-md"
           :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
    </div>
  </div>
</template>
