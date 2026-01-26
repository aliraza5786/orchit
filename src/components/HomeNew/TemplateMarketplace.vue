<script setup lang="ts">
import { ref } from 'vue'

const activeView = ref<'templates' | 'marketplace'>('templates')

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
      <div class="text-center mb-12">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">
          Start from proven playbooks and <br> discover ready-made modules
        </h2>
        <p class="text-xl text-[var(--muted)] max-w-3xl mx-auto mb-8">
          Browse a variety of templates and modules built for all types of businesses and needs. Ready to clone, customize, and start executing.
        </p>

        <!-- Segmented Button Group -->
        <div class="flex justify-center">
          <div class="inline-flex bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 shadow-sm">
            <button
              @click="activeView = 'templates'"
              :class="[
                'px-8 py-3 rounded-lg font-medium text-sm transition-all duration-300',
                activeView === 'templates'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
              ]"
            >
              Templates
            </button>
            <button
              @click="activeView = 'marketplace'"
              :class="[
                'px-8 py-3 rounded-lg font-medium text-sm transition-all duration-300',
                activeView === 'marketplace'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]'
              ]"
            >
              Marketplace
            </button>
          </div>
        </div>
      </div>

      <!-- Templates Grid -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-4"
        mode="out-in"
      >
        <div v-if="activeView === 'templates'" key="templates">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div
              v-for="template in templates"
              :key="template.name"
              class="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-purple-500 transition-all duration-300 hover:shadow-lg group cursor-pointer"
            >
              <div class="text-3xl mb-4">{{ template.icon }}</div>
              <h4 class="font-semibold mb-2 group-hover:text-accent transition-colors">{{ template.name }}</h4>
              <p class="text-sm text-[var(--muted)] mb-4">{{ template.description }}</p>
              <button class="text-sm text-accent font-medium hover:text-accent-hover flex items-center gap-1">
                Use Template
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Marketplace Modules -->
        <div v-else-if="activeView === 'marketplace'" key="marketplace" id="templates">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div
              v-for="module in modules"
              :key="module.name"
              class="bg-[var(--card)] border border-[var(--border)] rounded-xl p-8 hover:border-purple-500 transition-all duration-300 hover:shadow-lg group cursor-pointer"
            >
              <div class="w-12 h-12 bg-purple-600/10 rounded-lg flex items-center justify-center text-2xl mb-4">
                {{ module.icon }}
              </div>
              <h4 class="font-semibold mb-2 text-lg group-hover:text-accent-hover transition-colors">{{ module.name }}</h4>
              <p class="text-sm text-[var(--muted)] mb-6">{{ module.description }}</p>
              <button class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors font-medium text-sm w-full">
                Add to workspace
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>