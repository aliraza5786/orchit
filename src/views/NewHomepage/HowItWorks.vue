<script setup lang="ts">
const steps = [
  {
    number: 1,
    icon: '💡',
    title: 'Prompt your idea',
    description: 'Describe what you want to build, launch, or organize. Just tell Orchit your vision in plain English.'
  },
  {
    number: 2,
    icon: '🤖',
    title: 'Orchit generates modules, tasks, and a plan',
    description: 'AI structures your idea into actionable modules, workflows, and tasks. Everything you need to get started.'
  },
  {
    number: 3,
    icon: '🚀',
    title: 'Run it in your preferred views and iterate',
    description: 'Use kanban boards, tables, timelines, or workflows. Customize, collaborate, and execute as you go.'
  }
]
</script>

<template>
  <section id="product" class="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
        <p class="text-xl text-[var(--muted)]">Three simple steps to orchestrate your next idea</p>
      </div>

      <!-- Steps -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div
          v-for="step in steps"
          :key="step.number"
          class="relative"
        >
          <!-- Connector Line (hidden on mobile, shown on desktop) -->
          <div
            v-if="step.number < 3"
            class="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-purple-600 to-transparent"
          ></div>

          <!-- Step Content -->
          <div class="relative z-10 text-center">
            <!-- Number Badge -->
            <div
              class="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
            >
              {{ step.number }}
            </div>

            <!-- Icon -->
            <div class="text-5xl mb-4">{{ step.icon }}</div>

            <!-- Title -->
            <h3 class="text-xl font-semibold mb-3">{{ step.title }}</h3>

            <!-- Description -->
            <p class="text-[var(--muted)] leading-relaxed">{{ step.description }}</p>
          </div>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center mt-16">
        <button
          class="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
        >
          Start orchestrating now
        </button>
      </div>
    </div>
  </section>
</template>
