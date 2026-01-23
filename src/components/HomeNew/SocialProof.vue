<script setup lang="ts">
const logos = [
  'Company A',
  'Company B',
  'Company C',
  'Company D',
  'Company E',
  'Company F',
  'Company G',
  'Company H'
]
</script>

<template>
  <section class="py-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)]">
    <div class="max-w-7xl mx-auto">
      <p class="text-center text-[var(--muted)] mb-12">
        Trusted by builders, operators, and teams shipping faster.
      </p>

      <!-- Logo Strip -->
      <div class="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
        <div
          v-for="(logo, index) in logos"
          :key="index"
          class="flex items-center justify-center h-12 w-32"
        >
          <div class="text-[var(--muted)] font-semibold text-lg">{{ logo }}</div>
        </div>
      </div>
    </div>
  </section>
</template>