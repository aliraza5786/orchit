<template>
    <button
      :type="type"
      :disabled="disabled || loading"
      :class="[
        'relative cursor-pointer disabled:cursor-not-allowed  inline-flex items-center justify-center font-medium py-1.5  text-sm  focus:outline-none transition',
        sizeClass,
        radiusClass,
        variantClass,
        block ? 'w-full' : '',
        disabled || loading ? 'cursor-not-allowed !opacity-90' : ''
      ]"
    >
      <!-- Icon -->
      <slot name="icon" />
  
      <!-- Text -->
    <div class="flex items-center ">

      <span v-if="$slots.default " class="mx-1 text-nowrap">
        <slot />
      </span>
  
      <!-- Animated AI-style Loader -->
      <span v-if="loading" class="ml-2 flex items-center gap-0.5">
        <span class="w-1.5 h-1.5 bg-bg-body rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span class="w-1.5 h-1.5 bg-bg-body rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span class="w-1.5 h-1.5 bg-bg-body rounded-full animate-bounce"></span>
      </span>
    </div>
    </button>
  </template>
  

<script setup lang="ts">
import { computed } from 'vue' // ✅ this is required
import { useRoute } from 'vue-router'
const props = defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'gray'
  size?: 'sm' | 'md' | 'lg' | 'base'
  type?: 'button' | 'submit' | 'reset'
  block?: boolean
  disabled?: boolean
  loading?: boolean
  appearance?: 'filled' | 'outlined'  // ✅ NEW
}>()

const route = useRoute()

const radiusClass = computed(() => {
  return route.path === '/' ? 'rounded-xl' : 'rounded-md'
})
const variantClass = computed(() => {
  const appearance = props.appearance || 'filled'
  const variant = props.variant || 'primary'

  const base = {
    filled: {
      primary: 'bg-accent text-white hover:bg-accent-hover',
      secondary: '!bg-transparent text-card  border-card border',
      danger: 'bg-red-500 text-white hover:bg-red-600',
      ghost: 'bg-transparent text-text-primary hover:bg-gray-100 hover:text-black',
      gray: '!bg-transparent text-card  border-input border',
    },
    outlined: {
      primary: 'bg-transparent text-text-primary border border-black hover:bg-black hover:text-white',
      secondary: 'bg-transparent text-[#FFFFFFCC] border border-border FFFFFF4D] ',
      danger: 'bg-transparent text-red-500 border border-red-500 hover:bg-red-500 hover:text-white',
      ghost: 'bg-transparent text-text-secondary  border border-gray-300 hover:bg-gray-100',
      gray: 'bg-transparent text-text-secondary border border-border d9d9d9] ',
    }
  }

  return base[appearance][variant]
})


const sizeClass = computed(() => {
    switch (props.size) {
        case 'sm':
            return 'text-xs px-3 py-1.5 h-[34px]'
        case 'lg':
            return 'text-base px-3 sm:px-4 h-12'
        case 'base': return 'text-sm  px-3 sm:px-4 h-sp10'
        case 'md': return 'text-sm px-2 sm:px-4 h-[38px]'
        default:
            return 'text-sm px-4 h-[38px]'
    }
})

</script>

<style scoped>
@keyframes ai-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.ai-loader span {
  animation: ai-bounce 1.4s infinite ease-in-out both;
}
.ai-loader span:nth-child(1) { animation-delay: -0.32s; }
.ai-loader span:nth-child(2) { animation-delay: -0.16s; }
.ai-loader span:nth-child(3) { animation-delay: 0s; }

</style>