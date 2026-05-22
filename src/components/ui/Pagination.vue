<template>
  <div class="flex flex-col sm:flex-row shadow-none flex-nowrap items-center justify-between gap-3 mt-auto py-2.5 bg-transparent w-full">
    <p class="text-xs text-text-secondary order-2 sm:order-1 text-nowrap">
      Page {{ currentPage }} of {{ lastPage }}
    </p>

    <div class="flex flex-none items-center gap-1 sm:gap-2 flex-wrap justify-center order-1 sm:order-2">
      <button
        class="px-2 sm:px-3 py-1.5 cursor-pointer sm:py-1 text-xs sm:text-sm rounded border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation shadow-none"
        :disabled="currentPage === 1"
        @click="$emit('update:page', currentPage - 1)"
      >
        <span class="hidden sm:inline">Prev</span>
        <span class="sm:hidden"><i class="fa-regular fa-chevron-left"></i></span>
      </button>

      <button
        v-if="lastPage > 0"
        class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border transition-colors touch-manipulation min-w-[32px] sm:min-w-[36px] shadow-none"
        :class="1 === currentPage ? activePageClass : inactivePageClass"
        @click="$emit('update:page', 1)"
      >
        1
      </button>

      <span
        v-if="currentPage > 3"
        class="px-1 sm:px-2 text-text-secondary text-xs sm:text-sm"
      >
        ...
      </span>

      <template v-for="page in getPaginationRange()" :key="page">
        <button
          v-if="page !== 1 && page !== lastPage"
          class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border transition-colors touch-manipulation min-w-[32px] sm:min-w-[36px] shadow-none"
          :class="page === currentPage ? activePageClass : inactivePageClass"
          @click="$emit('update:page', page)"
        >
          {{ page }}
        </button>
      </template>

      <span
        v-if="currentPage < lastPage - 2"
        class="px-1 sm:px-2 text-text-secondary text-xs sm:text-sm"
      >
        ...
      </span>

      <button
        v-if="lastPage > 1"
        class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border transition-colors touch-manipulation min-w-[32px] sm:min-w-[36px] shadow-none"
        :class="lastPage === currentPage ? activePageClass : inactivePageClass"
        @click="$emit('update:page', lastPage)"
      >
        {{ lastPage }}
      </button>

      <button
        class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation shadow-none"
        :disabled="currentPage === lastPage"
        @click="$emit('update:page', currentPage + 1)"
      >
        <span class="hidden sm:inline">Next</span>
        <span class="sm:hidden"><i class="fa-regular fa-chevron-right"></i></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  lastPage: number
  inSpace?: boolean
}>()

defineEmits(['update:page'])

const activePageClass = computed(() =>
  props.inSpace
    ? 'bg-primary-color text-white border-primary-color'
    : 'bg-accent text-white border-accent'
)

const inactivePageClass =
  'border-border text-text-secondary hover:bg-bg-hover'

const getPaginationRange = (): number[] => {
  const total = props.lastPage
  const current = props.currentPage

  if (total <= 3) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  if (current <= 2) {
    return [1, 2, total]
  }

  if (current >= total - 1) {
    return [1, total - 1, total]
  }

  return [1, current, total]
}
</script>