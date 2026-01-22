<script setup lang="ts">
const stats = [
  { value: '32 months', label: 'Median time to fully launch a startup' },
  { value: '$40,000', label: 'Average startup expenditure in the first year' },
  { value: '42%', label: 'Failed startups cited "no market need"' },
  { value: '29%', label: 'Failed startups ran out of cash' }
]
</script>

<template>
  <section class="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-6">
          Most founders burn months (and real money) before the risks show up.
        </h2>
        <p class="text-xl text-[var(--muted)] max-w-3xl mx-auto">
          The biggest failures aren't dramatic — they're invisible gaps discovered too late.
        </p>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div
          v-for="stat in stats"
          :key="stat.value"
          class="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-center hover:border-purple-500 transition-all duration-300 hover:transform hover:scale-105"
        >
          <div class="text-4xl md:text-5xl font-bold text-purple-600 mb-4">{{ stat.value }}</div>
          <p class="text-[var(--muted)]">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Twist -->
      <div class="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-500/20 rounded-2xl p-8 md:p-12 text-center mb-8">
        <p class="text-xl md:text-2xl font-medium mb-8">
          Orchit surfaces the plan, gaps, and next steps upfront — so you can shorten that cycle without spending a dollar.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button class="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg">
            Orchestrate my idea (free)
          </button>
          <button class="px-8 py-4 border-2 border-[var(--border)] rounded-lg hover:border-purple-500 transition-colors font-medium text-lg">
            See an example workspace
          </button>
        </div>
      </div>

      <!-- Footnote -->
      <p class="text-center text-xs text-[var(--muted)]">Sources available on request.</p>
    </div>
  </section>
</template>
