<template>
  <div
    class="grid md:grid-cols-3 gap-[25px] md:gap-[15px] xl:gap-[44px]"
    aria-busy="true"
    aria-live="polite"
  >
    <div
      v-for="i in 3"
      :key="i"
      class="relative rounded-2xl border border-border-input p-[28px] bg-bg-body space-y-6"
    >
      <div class="space-y-2 flex flex-col items-center">
        <!-- Title -->
        <div class="h-6 w-24 rounded shimmer" />
        <!-- Description -->
        <div class="h-4 w-48 rounded shimmer" />
      </div>

      <!-- Price -->
      <div class="flex flex-col items-center space-y-2">
        <div class="h-10 w-32 rounded shimmer" />
        <div class="h-4 w-20 rounded shimmer" />
      </div>

      <!-- Button -->
      <div class="h-12 w-full rounded-xl shimmer" />

      <!-- Features -->
      <div class="space-y-4 pt-4 border-t border-border">
        <div class="h-4 w-32 rounded shimmer mb-4" />
        <div v-for="f in 8" :key="f" class="flex gap-2">
          <div class="h-4 w-4 rounded shimmer shrink-0" />
          <div class="h-4 w-full rounded shimmer" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shimmer {
  position: relative;
  overflow: hidden;
  background-color: var(--bg-body);
  pointer-events: none;
  opacity: 0.5;
}

.shimmer::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background-image: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05) 50%,
    transparent 100%
  );
  animation: shimmer 1.5s infinite;
}

:deep(.dark) .shimmer::after {
  background-image: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}
</style>
