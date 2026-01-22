<template>
  <section id="marketplace" class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-4 text-center font-manrope">Marketplace</h2>
      <p class="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
        A module for every business need — ready to clone and customize.
      </p>

      <!-- Categories -->
      <div class="flex flex-wrap justify-center gap-3 mb-12">
        <div v-for="cat in ['Marketing', 'Sales', 'CRM', 'Product', 'Ops', 'Agency', 'Creator', 'Team']" :key="cat" class="px-5 py-2 rounded-full bg-bg-surface border border-border text-text-secondary text-sm hover:border-accent cursor-pointer transition">
          {{ cat }}
        </div>
      </div>

      <!-- Module Grid Placeholder -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="bg-bg-surface border border-border rounded-2xl p-6 hover:border-accent transition">
          <div class="h-40 bg-bg-input rounded-lg mb-4 flex items-center justify-center">
            <span class="text-text-secondary">Module preview</span>
          </div>
          <p class="text-text-primary font-semibold mb-2">Module {{ i }}</p>
          <p class="text-text-secondary text-sm mb-4">Professional module for workflow automation</p>
          <button class="text-accent hover:text-accent-hover font-semibold text-sm transition">
            Clone module →
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
