<template>
    <div class="flex gap-2">
      <span class="text-text-primary w-[120px] shrink-0">{{ label }}:</span>
      <span class="font-medium text-text-secondary  ">{{ value }}</span>
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    label: string
    value: string
  }>()
  </script>
  