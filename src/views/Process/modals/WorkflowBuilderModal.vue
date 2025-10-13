<template>
  <transition name="fade">
    <div v-if="modelValue" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
      @keydown.esc="close">
      <div class="bg-bg-body w-full h-full flex flex-col relative" role="dialog" aria-modal="true">
        <div class="border-b border-border px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <h2 class="text-xl font-semibold text-text-primary flex items-center gap-2">
              <i class="fa-solid fa-brain text-accent"></i>
              Mind Map: {{ process?.title || 'Process' }}
            </h2>
            <span class="text-sm text-text-secondary">Double-click to add nodes, drag to connect</span>
          </div>
          <div class="flex items-center gap-3">
            <button class="text-text-secondary hover:text-text-primary text-xl" @click="close">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-hidden relative workflow-canvas-container">
          <MindMapCanvas v-if="process" :process-id="process._id || process.id" />
        </div>

        <div class="border-t border-border px-6 py-3 flex items-center justify-between bg-bg-surface">
          <div class="flex items-center gap-4 text-sm text-text-secondary">
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-hand-pointer"></i>
              Drag nodes to move
            </span>
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-link"></i>
              Drag handles to connect
            </span>
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-expand"></i>
              Scroll to zoom
            </span>
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-keyboard"></i>
              Del to delete, Ctrl+Z to undo
            </span>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import MindMapCanvas from '../../../components/feature/mindmap/MindMapCanvas.vue'

defineProps<{
  modelValue: boolean
  process: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'close'): void
}>()

function close() {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.workflow-canvas-container {
  contain: layout style paint;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
