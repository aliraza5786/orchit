<template>
    <div class="w-full h-2 bg-bg-surface rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-300 ease-in-out"
        :class="isTailwindColor ? fillColor : ''"
        :style="{ width: progress + '%', backgroundColor: isTailwindColor ? '' : fillColor }"
      ></div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  
  const props = defineProps<{
    progress: number
    fillColor?: string // tailwind class OR hex color
  }>()
  
  // If it starts with "bg-", treat it as a Tailwind class
  const isTailwindColor = computed(() => props.fillColor?.startsWith('bg-'))
  </script>
  