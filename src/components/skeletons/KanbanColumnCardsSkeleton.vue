<template>
  <div
    class="space-y-3 px-2 pb-2 pointer-events-none"
    aria-busy="true"
    aria-live="polite"
  >
    <div
      v-for="i in cardIdx"
      :key="i"
      class="bg-bg-card rounded-xl border border-border p-3 space-y-3 shadow-sm"
      role="presentation"
    >
      <div class="flex gap-2">
        <div class="h-5 w-14 rounded-full shimmer" />
        <div class="h-5 w-10 rounded-full shimmer" />
      </div>

      <div>
        <div class="h-4 w-3/4 rounded shimmer mb-2" />
        <div class="h-3 w-full rounded shimmer" />
        <div class="h-3 w-5/6 rounded shimmer mt-1" />
      </div>

      <div class="flex justify-between items-center">
        <div class="h-4 w-20 rounded shimmer" />
        <div class="flex -space-x-2">
          <div class="w-6 h-6 rounded-full border-2 border-border shimmer" />
          <div class="w-6 h-6 rounded-full border-2 border-border shimmer" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    cards?: number;
  }>(),
  { cards: 3 }
);

const cardIdx = computed(() =>
  Array.from({ length: props.cards }, (_, i) => i)
);
</script>

<style scoped>
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
  animation: shimmer 1.2s linear infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer::after {
    animation: none;
  }
}
</style>
