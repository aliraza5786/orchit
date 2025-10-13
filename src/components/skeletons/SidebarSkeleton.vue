<template>
  <aside
    class="w-fit px-2 max-h-full h-full flex flex-col items-center pt-2 pointer-events-none"
    aria-busy="true"
    aria-live="polite"
  >
    <div class="flex-1 w-full space-y-1 flex-grow text-center" role="list">
      <div
        v-for="i in itemIdx"
        :key="i"
        class="w-full rounded-md px-2 py-2"
        role="listitem"
        v-memo="[showLabels]" 
      >
        <div
          class="flex flex-col items-center justify-center gap-2 mx-auto
                 h-10 w-[38px] px-2 py-2 rounded-lg border border-border
                 bg-bg-surface skeleton-item"
          role="presentation"
        >
          <div class="w-full h-6 rounded-full shimmer" aria-hidden="true" />
          <div v-if="showLabels" class="h-2 w-full rounded shimmer" aria-hidden="true" />
        </div>
      </div>
    </div>
    <div class="mt-auto pt-4 mb-2 text-center w-[38px]" role="presentation">
      <div
        class="mx-auto flex-col h-10 min-w-[38px] py-2 px-2 rounded-lg border border-border
               flex items-center justify-center gap-2 bg-bg-surface skeleton-item"
      >
        <div class="w-full h-6 rounded shimmer" aria-hidden="true" />
        <div v-if="showLabels" class="h-2 w-full rounded shimmer" aria-hidden="true" />
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
defineOptions({ name: 'SidebarSkeleton' })
const props = withDefaults(defineProps<{
  items?: number
  showLabels?: boolean
}>(), {
  items: 8,
  showLabels: true
})
const itemIdx = computed(() => Array.from({ length: props.items }, (_, i) => i))
</script>

<style scoped>
.skeleton-item {
  contain: content;
  content-visibility: auto;
  contain-intrinsic-size: 40px 40px;
}

/* Shimmer skeleton */
.shimmer {
  position: relative;
  overflow: hidden;
  background-color: var(--bg-body);
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
  100% { transform: translateX(100%); }
}

/* Respect user motion preferences */
@media (prefers-reduced-motion: reduce) {
  .shimmer::after { animation: none; }
}
</style>
