<template>
  <div
    class="p-4 overflow-x-auto flex-auto flex gap-6"
    aria-busy="true"
    aria-live="polite"
  >
    <!-- Columns -->
    <div
      v-for="c in columnIdx"
      :key="c"
      class="kanban-col max-w-[328px] min-w-[328px] min-h-[555px] h-full bg-bg-body rounded-lg p-2 flex flex-col"
      v-memo="[props.cardsPerColumn]"
      role="presentation"
    >
      <!-- Header skeleton -->
      <div class="flex justify-between items-center py-3 px-4 sticky top-0 bg-bg-body rounded-xl mb-2 z-10" role="presentation">
        <div class="flex items-center gap-2">
          <div class="h-4 w-24 rounded shimmer" aria-hidden="true" />
          <div class="h-4 w-4 rounded-full shimmer" aria-hidden="true" />
        </div>
        <div class="flex items-center gap-2">
          <div class="h-4 w-4 rounded shimmer" aria-hidden="true" />
          <div class="h-4 w-4 rounded shimmer" aria-hidden="true" />
        </div>
      </div>

      <!-- Cards skeleton list -->
      <div class="flex-1 w-full overflow-y-auto space-y-3 px-2 pb-2" role="presentation">
        <div
          v-for="i in cardIdx"
          :key="i"
          class="bg-bg-card rounded-xl border border-border p-3 space-y-3 shadow-sm"
          role="presentation"
        >
          <div class="flex gap-2">
            <div class="h-5 w-14 rounded-full shimmer" aria-hidden="true" />
            <div class="h-5 w-10 rounded-full shimmer" aria-hidden="true" />
          </div>
          <div>
            <div class="h-4 w-3/4 rounded shimmer mb-2" aria-hidden="true" />
            <div class="h-3 w-full rounded shimmer" aria-hidden="true" />
            <div class="h-3 w-5/6 rounded shimmer mt-1" aria-hidden="true" />
          </div>
          <div class="flex justify-between items-center">
            <div class="h-4 w-20 rounded shimmer" aria-hidden="true" />
            <div class="flex -space-x-2">
              <div class="w-6 h-6 rounded-full border-2 border-border shimmer" aria-hidden="true" />
              <div class="w-6 h-6 rounded-full border-2 border-border shimmer" aria-hidden="true" />
            </div>
          </div>
        </div>

        <!-- Add Member button skeleton -->
        <div class="h-9 rounded shimmer mt-3" aria-hidden="true" />
      </div>
    </div>

    <!-- Add list column skeleton -->
    <div v-if="props.showAddList" class="min-w-[328px]" role="presentation">
      <div class="bg-bg-body rounded-lg p-4">
        <div class="h-9 rounded shimmer" aria-hidden="true" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    columns?: number
    cardsPerColumn?: number
    showAddList?: boolean
  }>(),
  { columns: 3, cardsPerColumn: 3, showAddList: true }
)

/**
 * Stable index arrays reduce VDOM churn compared to `v-for="n in number"`
 * (which creates a new range array each render).
 */
const columnIdx = computed(() =>
  Array.from({ length: props.columns }, (_, i) => i)
)
const cardIdx = computed(() =>
  Array.from({ length: props.cardsPerColumn }, (_, i) => i)
)
</script>

<style scoped>
.kanban-col {
  contain: content;
}

/* Shimmer skeleton */
.shimmer {
  position: relative;
  overflow: hidden;
  background-color: var(--bg-body);
  pointer-events: none;
}
.shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    var(--bg-body),
    var(--bg-surface) 50%,
    var(--bg-body) 100%
  );
  animation: shimmer var(--shimmer-duration, 1.2s) linear infinite;
  will-change: transform;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  .shimmer::after {
    animation: none;
  }
}
</style>
