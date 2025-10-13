<template>
  <div class="flex bg-bg-input p-1.5 border border-border rounded-md gap-2 transition-all duration-200 font-sm font-medium items-center mt-6">
    <button v-for="option in options" :key="option.value" @click="$emit('update:modelValue', option.value)" :class="[
      'w-full cursor-pointer py-1.5 rounded-md text-center',
      modelValue === option.value ?  'bg-accent text-white ' : ' hover:bg-accent-hover/10  text-text-secondary '
    ]">
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  options: { label: string, value: string }[]
  theme?: string
}>()

defineEmits(['update:modelValue'])
</script>