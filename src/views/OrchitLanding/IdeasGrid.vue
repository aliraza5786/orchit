<script setup lang="ts">
const ideas = [
  { icon: '📦', title: 'Product launch plan', prompt: 'Create a product launch plan for my new product' },
  { icon: '📢', title: 'Marketing campaign OS', prompt: 'Design a marketing campaign for Q1 2025' },
  { icon: '💰', title: 'Sales pipeline + CRM', prompt: 'Set up a sales pipeline and CRM system' },
  { icon: '📝', title: 'Content calendar', prompt: 'Create a 30-day content calendar for my niche' },
  { icon: '👥', title: 'Client onboarding portal', prompt: 'Build a client onboarding workflow' },
  { icon: '🚀', title: 'Startup roadmap', prompt: 'Create a 12-month startup roadmap' }
]

const emit = defineEmits<{
  populate: [prompt: string]
}>()

const handleIdeaClick = (prompt: string) => {
  emit('populate', prompt)
}
</script>

<template>
  <section class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-4 text-center font-manrope">Get started with these ideas…</h2>
      <p class="text-text-secondary text-center mb-12">Click any idea to populate the prompt bar</p>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="idea in ideas" 
          :key="idea.title"
          @click="handleIdeaClick(idea.prompt)"
          class="bg-bg-surface border border-border rounded-2xl p-6 cursor-pointer hover:border-accent hover:bg-bg-card transition group"
        >
          <div class="text-4xl mb-4 group-hover:scale-110 transition">{{ idea.icon }}</div>
          <h3 class="text-text-primary font-semibold mb-2 font-manrope">{{ idea.title }}</h3>
          <p class="text-text-secondary text-sm">{{ idea.prompt }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
