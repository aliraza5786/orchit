<template>
    <transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center"
        @keydown.esc="emit('update:modelValue', false)"
      >
        <div
          class="bg-bg-body w-full max-w-[860px] max-h-[80vh] overflow-auto mx-4 rounded-xl shadow-lg   shadow-accent/30 py-6 relative"
          :class="[{'!max-w-[500px]': size=='md'},modalClass]"
          role="dialog"
          aria-modal="true"
        >
          <!-- Close Button -->
          <button
            class="absolute top-6 cursor-pointer right-4 text-text-secondary -500 hover:text-text-primary text-xl"
            @click="emit('update:modelValue', false)"
          >
          <img src="../../assets/icons/cross.svg"
          alt="">
          </button>
  
          <!-- Slot content -->
          <slot />
        </div>
      </div>
    </transition>
  </template>
  
  <script setup lang="ts">
   defineProps<{
    modelValue: boolean
    size?:string
    modalClass?:any
  }>()
  
  const emit = defineEmits(['update:modelValue'])
  </script>
  
  <style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  </style>
  