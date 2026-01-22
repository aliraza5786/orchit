<script setup lang="ts">
const templates = [
  { icon: '🚀', name: 'Launch Plan', description: 'Go-to-market strategy and timeline' },
  { icon: '📈', name: 'GTM Strategy', description: 'Complete go-to-market playbook' },
  { icon: '💼', name: 'Sales CRM', description: 'Pipeline, leads, and deals' },
  { icon: '🤝', name: 'Agency Delivery', description: 'Project scope and client delivery' },
  { icon: '📹', name: 'Creator Content', description: 'Content calendar and production' },
  { icon: '🎓', name: 'Learning Plan', description: 'Course, exam, or skill roadmap' },
  { icon: '👥', name: 'Team Onboarding', description: 'New hire orientation and ramp-up' },
  { icon: '💰', name: 'Fundraising', description: 'Pitch deck, investor outreach, timeline' }
]
</script>

<template>
  <section id="templates" class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-4 text-center font-manrope">Start from proven playbooks.</h2>
      <p class="text-text-secondary text-center mb-12">Templates built by experts. Customize in seconds.</p>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="template in templates" :key="template.name" class="bg-bg-surface border border-border rounded-2xl p-6 hover:border-accent hover:bg-bg-card transition cursor-pointer group">
          <div class="text-4xl mb-4 group-hover:scale-110 transition">{{ template.icon }}</div>
          <h3 class="text-text-primary font-semibold mb-2 font-manrope">{{ template.name }}</h3>
          <p class="text-text-secondary text-sm mb-4">{{ template.description }}</p>
          <button class="text-accent hover:text-accent-hover font-semibold text-sm transition">
            Use template →
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
