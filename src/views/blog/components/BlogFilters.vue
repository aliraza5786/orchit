<script setup lang="ts">
import { useTheme } from "../../../../composables/useTheme";
const { theme, setTheme } = useTheme(); // light / dark / system
const props = defineProps<{
  categories: string[]
  modelValue: string
}>()
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="flex flex-wrap gap-3">
    <button v-for="cat in categories" :key="cat" @click="emit('update:modelValue', cat)"
      class="px-[16px] py-[8px] bg-charcoal border-border-input hover:border-accent rounded-full font-manrope text-[14px] font-medium transition border cursor-pointer"
      :class="[ 
        theme === 'dark'
          ? modelValue === cat
            ? 'bg-white text-black border-white' // active dark
            : 'bg-bg-charcoal text-white' // inactive dark
          : modelValue === cat
            ? 'bg-black text-white border-black' // active light
            : 'bg-[#EFEFEF] text-black border-0' // inactive light
      ]">
      {{ cat }}
    </button>
  </div>
</template>
