<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 bg-black/10 backdrop-blur-xs flex items-center justify-center"
        @click="emit('update:modelValue', false)"
        @keydown.esc="emit('update:modelValue', false)"
      >

        <div
          class="bg-bg-body w-full max-w-[860px] max-h-[80vh] border border-border/70 overflow-auto mx-4 rounded-xl shadow-lg pb-6 relative"
          :class="[{'!max-w-[500px]': size=='md'},modalClass, inSpace ? 'shadow-primary-color/30' : 'shadow-accent/30']"
          role="dialog"
          aria-modal="true"
          @click.stop
        >
         
        <div
          class="sticky top-0 z-1 backdrop-blur border-b border-orchit-white/5 px-6 flex justify-between"
          :class="title? ' py-4': 'py-2'">
          <h5 id="modal-title" class="text-lg font-semibold tracking-tight">{{ title }}</h5>
          <button  class="  cursor-pointer  text-text-secondary hover:text-text-primary text-lg z-200"
            @click.stop="emit('update:modelValue', false)"
          >  
          <i class="fa-solid fa-xmark"></i>
          </button>
       </div>
          <!-- Slot content -->
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
  </template>
  
<script setup lang="ts">
   defineProps<{
    modelValue: boolean
    size?:string
    modalClass?:any
    title?:string
    inSpace?:boolean
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
  