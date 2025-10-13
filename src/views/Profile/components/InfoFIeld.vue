<template>
    <div class="grid grid-cols-2 py-1 ">
      <p class="text-sm text-text-primary  mb-1 flex items-center">
      {{ label }}
      </p>
      <p class="text-sm text-text-secondary ">{{ value || 'Not specified' }}</p>
    </div>
  </template>
  
  <script setup lang="ts">
  defineProps<{
    icon?: any
    label: string
    value: string
  }>()
  </script>
  