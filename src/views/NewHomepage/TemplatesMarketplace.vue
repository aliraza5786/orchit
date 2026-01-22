<script setup lang="ts">
const templates = [
  { icon: '🚀', name: 'Product Launch', description: 'Complete go-to-market strategy and execution plan' },
  { icon: '💼', name: 'Sales CRM', description: 'Lead tracking, pipeline management, and forecasting' },
  { icon: '📊', name: 'Marketing Plan', description: 'Campaign planning, content calendar, and analytics' },
  { icon: '🎯', name: 'Agency Delivery', description: 'Client onboarding, project delivery, and reporting' },
  { icon: '📝', name: 'Content System', description: 'Content creation, scheduling, and distribution workflow' },
  { icon: '🏢', name: 'Business Operations', description: 'Team management, workflows, and SOPs' },
  { icon: '🎓', name: 'Course Creation', description: 'Curriculum design, content production, and launch' },
  { icon: '💰', name: 'Fundraising', description: 'Investor outreach, pitch deck prep, and follow-up' },
  { icon: '🛒', name: 'E-commerce Setup', description: 'Store launch, inventory, fulfillment, and marketing' },
  { icon: '📱', name: 'App Development', description: 'Feature planning, sprint management, and release' },
  { icon: '🤝', name: 'Partnership Program', description: 'Partner recruitment, enablement, and management' },
  { icon: '📈', name: 'Growth Strategy', description: 'Acquisition channels, experiments, and scaling' }
]

const modules = [
  { icon: '📊', name: 'Marketing Hub', description: 'Pre-built campaigns, templates, and automation' },
  { icon: '💼', name: 'Sales Toolkit', description: 'Outreach sequences, proposal templates, and tracking' },
  { icon: '🎯', name: 'CRM Module', description: 'Contact management, pipeline views, and reporting' },
  { icon: '⚙️', name: 'Operations Suite', description: 'SOPs, workflows, and team collaboration tools' },
  { icon: '💰', name: 'Finance Tracker', description: 'Budgeting, expenses, and revenue forecasting' },
  { icon: '👥', name: 'HR & People', description: 'Hiring, onboarding, and performance management' }
]
</script>

<template>
  <section id="templates" class="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">
          Start from proven playbooks and discover ready-made modules
        </h2>
        <p class="text-xl text-[var(--muted)] max-w-3xl mx-auto">
          Browse a variety of templates and modules built for all types of businesses and needs. Ready to clone, customize, and start executing.
        </p>
      </div>

      <!-- Templates Grid -->
      <div class="mb-16">
        <h3 class="text-2xl font-semibold mb-8">Templates</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div
            v-for="template in templates"
            :key="template.name"
            class="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-purple-500 transition-all duration-300 hover:shadow-lg group cursor-pointer"
          >
            <div class="text-3xl mb-4">{{ template.icon }}</div>
            <h4 class="font-semibold mb-2 group-hover:text-purple-600 transition-colors">{{ template.name }}</h4>
            <p class="text-sm text-[var(--muted)] mb-4">{{ template.description }}</p>
            <button class="text-sm text-purple-600 font-medium hover:text-purple-700 flex items-center gap-1">
              Use Template
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Marketplace Modules -->
      <div id="marketplace">
        <h3 class="text-2xl font-semibold mb-8">Marketplace Modules</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="module in modules"
            :key="module.name"
            class="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 hover:border-purple-500 transition-all duration-300 hover:shadow-lg group cursor-pointer"
          >
            <div class="w-12 h-12 bg-purple-600/10 rounded-lg flex items-center justify-center text-2xl mb-4">
              {{ module.icon }}
            </div>
            <h4 class="font-semibold mb-2 text-lg group-hover:text-purple-600 transition-colors">{{ module.name }}</h4>
            <p class="text-sm text-[var(--muted)] mb-6">{{ module.description }}</p>
            <button class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm w-full">
              Add to workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
