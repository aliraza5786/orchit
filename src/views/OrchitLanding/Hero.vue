<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '../../composables/useTheme'
import lightLogo from '@assets/global/light-logo.png'
import darkLogo from '@assets/global/dark-logo.png'

const { isDark } = useTheme()
const promptInput = ref('')
const showMockOutput = ref(false)

const handleOrchestrate = () => {
  if (promptInput.value.trim()) {
    showMockOutput.value = true
  }
}

const suggestedModules = ['Marketing', 'Sales', 'CRM', 'Product', 'Ops']
const activeTab = ref('strategy')
</script>

<template>
  <section class="relative pt-32 pb-20 px-6 overflow-hidden bg-bg-body">
    <!-- Aurora background blobs -->
    <div class="absolute top-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl -z-10"></div>
    <div class="absolute top-1/2 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10"></div>

    <div class="max-w-4xl mx-auto text-center">
      <!-- Logo -->
      <div class="mb-8">
        <img :src="isDark ? darkLogo : lightLogo" alt="Orchit.ai" class="h-12 mx-auto object-contain">
      </div>

      <!-- Main Heading -->
      <h1 class="text-5xl lg:text-6xl font-bold text-text-primary mb-6 leading-tight font-manrope">
        What idea do you want to <span class="text-accent">orchestrate?</span>
      </h1>

      <!-- Subheading -->
      <p class="text-lg lg:text-xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
        Think, plan, and play. Prompt the idea — Orchit structures the rest… from marketing and sales to planning and CRM.
      </p>

      <!-- Prompt Bar -->
      <div class="mb-12">
        <div class="bg-bg-surface border border-border rounded-2xl p-6 backdrop-blur-sm">
          <div class="flex flex-col sm:flex-row gap-3">
            <input 
              v-model="promptInput"
              type="text" 
              placeholder="e.g., Launch a new skincare brand in 30 days"
              class="flex-1 bg-bg-input border border-border-input rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent transition"
              @keyup.enter="handleOrchestrate"
            />
            <button 
              @click="handleOrchestrate"
              class="px-8 py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-semibold transition whitespace-nowrap"
            >
              Orchestrate
            </button>
          </div>
        </div>

        <!-- Mock Output Panel -->
        <div v-if="showMockOutput" class="mt-8 animate-in fade-in duration-500">
          <div class="bg-bg-surface border border-border rounded-2xl p-8 backdrop-blur-sm">
            <h3 class="text-text-primary font-semibold mb-6">Suggested Modules</h3>
            
            <!-- Module Pills -->
            <div class="flex flex-wrap gap-3 mb-8">
              <div v-for="module in suggestedModules" :key="module" class="px-4 py-2 bg-bg-input border border-border rounded-lg text-text-primary/80 text-sm">
                {{ module }}
              </div>
            </div>

            <!-- Tabs -->
            <div class="border-b border-border mb-6">
              <div class="flex gap-6">
                <button 
                  v-for="tab in ['Strategy', 'Execution', 'Assets']" 
                  :key="tab"
                  @click="activeTab = tab.toLowerCase()"
                  :class="[
                    'pb-3 font-medium transition border-b-2',
                    activeTab === tab.toLowerCase() 
                      ? 'text-text-primary border-accent' 
                      : 'text-text-secondary border-transparent hover:text-text-primary/80'
                  ]"
                >
                  {{ tab }}
                </button>
              </div>
            </div>

            <!-- Tab Content -->
            <div class="space-y-3">
              <div v-for="i in 3" :key="i" class="flex items-start gap-3 p-3 bg-bg-input rounded-lg">
                <div class="w-5 h-5 rounded-full bg-accent/30 flex-shrink-0 mt-0.5"></div>
                <div>
                  <p class="text-text-primary/80 text-sm">Task {{ i }}: {{ ['Define target audience', 'Create marketing strategy', 'Plan product roadmap'][i-1] }}</p>
                  <p class="text-text-secondary/60 text-xs mt-1">Due in {{ 7 * i }} days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- CTA Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
        <button class="px-8 py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-semibold transition">
          Get started free
        </button>
        <button class="px-8 py-3 rounded-xl border border-border text-text-primary font-semibold hover:border-accent transition">
          Request a demo
        </button>
      </div>

      <!-- Trust Line -->
      <p class="text-text-secondary text-sm">
        No credit card • Cancel anytime • Early access
      </p>
    </div>
  </section>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeIn 0.5s ease-out;
}
</style>
