<script setup lang="ts">
const emit = defineEmits<{
  (e: 'select-idea', text: string): void
}>()

const ideas = [
  { icon: '🚀', title: 'Product Launch', prompt: 'Create a complete product launch plan for a SaaS application' },
  { icon: '📊', title: 'Marketing OS', prompt: 'Build a comprehensive marketing operations system' },
  { icon: '💼', title: 'Sales CRM', prompt: 'Design a sales CRM workflow for a B2B company' },
  { icon: '📅', title: 'Content Calendar', prompt: 'Create a content calendar and publishing workflow' },
  { icon: '🎯', title: 'Agency Delivery', prompt: 'Build a complete agency project delivery system' },
  { icon: '🔧', title: 'Operations Hub', prompt: 'Create an operations management hub for my business' }
]

const selectIdea = (prompt: string) => {
  emit('select-idea', prompt)
}
</script>

<template>
  <section class="py-10 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
    <div class="max-w-7xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">Get started with these ideas...</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          v-for="idea in ideas"
          :key="idea.title"
          @click="selectIdea(idea.prompt)"
          class="group bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 text-left hover:border-purple-500 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl cursor-pointer"
        >
          <div class="text-4xl mb-4">{{ idea.icon }}</div>
          <h3 class="text-xl font-semibold mb-2 group-hover:text-purple-600 transition-colors">
            {{ idea.title }}
          </h3>
          <p class="text-[var(--muted)] text-sm">Click to try this template</p>
        </button>
      </div>
    </div>
  </section>
</template>