<script setup lang="ts">
const stats = [
  { value: '32 months', label: "Median venture 'gestation' before a venture is fully formed." },
  { value: '$40,000', label: 'Average amount new businesses spend in their first year to launch.' },
  { value: '42%', label: "Failed startups cited 'no market need' as a top reason." },
  { value: '29%', label: "Failed startups cited 'ran out of cash' as a top reason." }
]
</script>

<template>
  <section class="relative py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <!-- Headline -->
      <div class="max-w-3xl mb-16">
        <h2 class="text-4xl lg:text-5xl font-bold text-text-primary mb-6 font-manrope">
          Most founders burn months (and real money) before the risks show up.
        </h2>
        <p class="text-lg text-text-secondary">
          The biggest failures aren't dramatic — they're invisible gaps discovered too late.
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid md:grid-cols-2 gap-6 mb-12">
        <div v-for="(stat, idx) in stats" :key="idx" class="bg-bg-surface border border-border rounded-2xl p-8">
          <div class="text-4xl font-bold text-accent mb-4 font-manrope">
            {{ stat.value }}
          </div>
          <p class="text-text-secondary leading-relaxed">
            {{ stat.label }}
          </p>
        </div>
      </div>

      <!-- Twist CTA -->
      <div class="bg-bg-surface border border-border rounded-2xl p-8 mb-8">
        <p class="text-xl text-text-primary mb-8 max-w-3xl">
          <strong>Orchit surfaces the plan, gaps, and next steps upfront</strong> — so you can shorten that cycle without spending a dollar.
        </p>
        
        <div class="flex flex-col sm:flex-row gap-4">
          <button class="px-8 py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-semibold hover:opacity-90 transition">
            Orchestrate my idea (free)
          </button>
          <button class="px-8 py-3 rounded-xl border border-border text-text-primary font-semibold hover:bg-bg-input transition">
            See an example workspace
          </button>
        </div>
      </div>

      <!-- Footnote -->
      <p class="text-text-secondary/60 text-sm">
        Sources available on request.
      </p>
    </div>
  </section>
</template>

<style scoped>
</style>
