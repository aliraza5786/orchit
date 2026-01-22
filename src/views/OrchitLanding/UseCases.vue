<script setup lang="ts">
const useCases = [
  {
    icon: '🚀',
    title: 'Entrepreneurs & startups',
    description: 'Turn a spark into an operating system.',
    details: 'Roadmap, GTM, tasks, assets — reveal blind spots early.',
    prompt: 'Validate my idea and build a 30-day launch plan.'
  },
  {
    icon: '🏢',
    title: 'Agencies & freelancers',
    description: 'Create client proposals in minutes.',
    details: 'Scope, deliverables, timeline, risks — client-ready in one go.',
    prompt: 'Write a proposal for a website redesign + retainer.'
  },
  {
    icon: '🎓',
    title: 'Personal / professional / academic',
    description: 'Get a step-by-step plan in seconds.',
    details: 'Milestones, habits, weekly actions — stay on track.',
    prompt: 'Build a 12-week plan to pass my exam.'
  },
  {
    icon: '🎬',
    title: 'Creators & solopreneurs',
    description: 'Turn ideas into consistent output.',
    details: 'Content pipeline, scripts, schedule, sponsorship flow.',
    prompt: 'Create a 30-day content calendar for my niche.'
  },
  {
    icon: '💼',
    title: 'Consultants & coaches',
    description: 'Make delivery repeatable.',
    details: 'Frameworks, onboarding, client plans, follow-ups — structured.',
    prompt: 'Create a client onboarding + delivery plan for coaching.'
  },
  {
    icon: '⚙️',
    title: 'Operators & small teams',
    description: 'Run projects without the overhead.',
    details: 'Weekly planning, SOPs, launches, handoffs — organized.',
    prompt: 'Set up a weekly ops cadence + project board.'
  }
]

const emit = defineEmits<{
  populate: [prompt: string]
}>()
</script>

<template>
  <section class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-4 text-center font-manrope">Orchit for every way you build.</h2>
      <p class="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
        Think, plan, and play — a structured playground for ideas, projects, and execution.
      </p>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="useCase in useCases" 
          :key="useCase.title"
          class="bg-bg-surface border border-border rounded-2xl p-8 flex flex-col"
        >
          <div class="text-5xl mb-4">{{ useCase.icon }}</div>
          <h3 class="text-text-primary font-bold text-lg mb-2 font-manrope">{{ useCase.title }}</h3>
          <p class="text-text-primary font-semibold mb-3">{{ useCase.description }}</p>
          <p class="text-text-secondary text-sm mb-6 flex-grow">{{ useCase.details }}</p>
          <button 
            @click="emit('populate', useCase.prompt)"
            class="text-accent hover:text-accent-hover font-semibold text-sm transition"
          >
            Try prompt →
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
