<template>
  <section class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-4 text-center font-manrope">Discover ideas the community is building</h2>
      <p class="text-text-secondary text-center mb-12">Get inspired by real workspaces from builders like you.</p>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div v-for="i in 6" :key="i" class="bg-bg-surface border border-border rounded-2xl overflow-hidden hover:border-accent transition cursor-pointer group">
          <div class="h-32 bg-bg-input group-hover:bg-bg-card transition flex items-center justify-center">
            <span class="text-text-secondary">Preview</span>
          </div>
          <div class="p-6">
            <div class="flex gap-2 mb-3">
              <span v-for="badge in ['Popular', 'New', 'Featured'].slice(0, Math.ceil(Math.random() * 2))" :key="badge" class="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                {{ badge }}
              </span>
            </div>
            <h3 class="text-text-primary font-semibold mb-2">Workspace {{ i }}</h3>
            <p class="text-text-secondary text-sm mb-3">Description of this community workspace</p>
            <div class="text-text-secondary text-xs">{{ Math.floor(Math.random() * 5000) + 100 }} views</div>
          </div>
        </div>
      </div>

      <div class="text-center">
        <button class="px-8 py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-semibold hover:opacity-90 transition">
          Explore the gallery
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
