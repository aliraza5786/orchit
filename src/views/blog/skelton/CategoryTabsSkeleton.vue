<script setup lang="ts">
import { useTheme } from "../../../composables/useTheme";

const { theme } = useTheme();
</script>

<template>
  <div class="flex flex-wrap gap-3 mb-8">
    <!-- Generate 4 placeholder tabs -->
    <div
      v-for="n in 4"
      :key="n"
      class="h-8 rounded-full animate-pulse"
      :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"
      style="width: 80px;"
    ></div>
  </div>
</template>
