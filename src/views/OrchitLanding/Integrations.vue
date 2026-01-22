<template>
  <section class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-4 text-center font-manrope">Connect your stack.</h2>
      <p class="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
        Bring your favorite tools together. More integrations rolling out monthly.
      </p>

      <div class="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div v-for="integration in ['Docs', 'Calendar', 'Forms', 'Tasks', 'CRM']" :key="integration" class="bg-bg-surface border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-accent transition group">
          <div class="w-12 h-12 rounded-lg bg-bg-input group-hover:bg-accent/20 transition flex items-center justify-center mb-4 text-xl">
            📦
          </div>
          <h3 class="text-text-primary font-semibold mb-2">{{ integration }}</h3>
          <span class="text-xs text-text-secondary/60 inline-block px-2 py-1 rounded bg-bg-input">Coming soon</span>
        </div>
      </div>

      <p class="text-center text-text-secondary text-sm mt-8">Have a specific tool in mind? <span class="text-accent cursor-pointer hover:text-accent-hover">Request an integration</span></p>
    </div>
  </section>
</template>

<style scoped>
</style>
