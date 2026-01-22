<script setup lang="ts">
const emit = defineEmits<{
  (e: 'try-prompt', text: string): void
}>()

const audiences = [
  {
    icon: '🚀',
    title: 'Entrepreneurs & Startups',
    description: 'Turn a spark into an operating system. Get modules, workflows, and a roadmap for your business idea in minutes.',
    prompt: 'Create a complete startup operating system for my business idea'
  },
  {
    icon: '🎨',
    title: 'Agencies & Freelancers',
    description: 'Create client proposals in minutes. Turn vague briefs into structured scopes, deliverables, and timelines.',
    prompt: 'Build a client delivery system for my agency'
  },
  {
    icon: '📚',
    title: 'Personal/Professional/Academic',
    description: 'Get a step-by-step plan in seconds. From thesis projects to career transitions, structure any complex goal.',
    prompt: 'Help me plan and structure my personal project'
  },
  {
    icon: '✨',
    title: 'Creators & Solopreneurs',
    description: 'Turn ideas into consistent output. Build content systems, product launches, and revenue streams.',
    prompt: 'Create a content creation and monetization system'
  },
  {
    icon: '💡',
    title: 'Consultants & Coaches',
    description: 'Make delivery repeatable. Package your expertise into frameworks clients can follow and implement.',
    prompt: 'Build a repeatable delivery framework for my consulting practice'
  },
  {
    icon: '⚙️',
    title: 'Operators & Small Teams',
    description: 'Run projects without the overhead. Get structure, visibility, and momentum without complex tools.',
    prompt: 'Create a lightweight operations system for my small team'
  }
]

const tryPrompt = (prompt: string) => {
  emit('try-prompt', prompt)
}
</script>

<template>
  <section class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Orchit for every way you build</h2>
        <p class="text-xl text-[var(--muted)] max-w-2xl mx-auto">
          Think, plan, and play — a structured playground for ideas, projects, and execution.
        </p>
      </div>

      <!-- Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="audience in audiences"
          :key="audience.title"
          class="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 hover:border-purple-500 transition-all duration-300 hover:shadow-lg"
        >
          <!-- Icon -->
          <div class="w-14 h-14 bg-purple-600/10 rounded-xl flex items-center justify-center text-3xl mb-6">
            {{ audience.icon }}
          </div>

          <!-- Content -->
          <h3 class="text-xl font-semibold mb-3">{{ audience.title }}</h3>
          <p class="text-[var(--muted)] mb-6 leading-relaxed">{{ audience.description }}</p>

          <!-- CTA -->
          <button
            @click="tryPrompt(audience.prompt)"
            class="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2 group"
          >
            Try prompt
            <svg
              class="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
