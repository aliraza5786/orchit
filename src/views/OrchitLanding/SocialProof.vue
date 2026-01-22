<template>
  <section class="py-16 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <p class="text-center text-text-secondary text-sm mb-12">
        Trusted by builders, operators, and teams shipping faster.
      </p>
      
      <!-- Logo Placeholders -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
        <div v-for="i in 6" :key="i" class="w-24 h-24 bg-bg-surface rounded-lg border border-border flex items-center justify-center grayscale opacity-60 hover:opacity-100 transition">
          <div class="text-text-secondary text-sm font-medium">Logo {{ i }}</div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
