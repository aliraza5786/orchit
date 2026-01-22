<script setup lang="ts">
import { ref } from 'vue'

const modules = ['Sales', 'Marketing', 'CRM', 'Product', 'Support', 'Finance', 'Ops']
const moduleInput = ref('')
const generatedModule = ref<{name: string, description: string} | null>(null)

const handleGenerateModule = () => {
  if (moduleInput.value.trim()) {
    const suggestions = [
      { name: 'Analytics', description: 'Track metrics and KPIs across your business' },
      { name: 'HR', description: 'Manage team, hiring, and culture' },
      { name: 'Partnerships', description: 'Manage strategic partnerships and deals' },
      { name: 'Content', description: 'Organize and schedule content creation' }
    ]
    generatedModule.value = suggestions[Math.floor(Math.random() * suggestions.length)]
  }
}
</script>

<template>
  <section class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-6 text-center font-manrope">
        Unlimited possibilities, shaped to your business.
      </h2>
      <p class="text-text-secondary text-center mb-12 max-w-2xl mx-auto">
        Customize the module (department) structure with AI. Add, remove, or generate modules that fit your exact workflow.
      </p>

      <!-- Module Chips -->
      <div class="flex flex-wrap justify-center gap-3 mb-12">
        <div v-for="module in modules" :key="module" class="px-5 py-2 rounded-full bg-bg-surface border border-border text-text-secondary text-sm hover:border-accent cursor-pointer transition">
          {{ module }}
        </div>
      </div>

      <!-- Module Generator -->
      <div class="max-w-2xl mx-auto">
        <div class="bg-bg-surface border border-border rounded-2xl p-6 mb-8">
          <label class="block text-text-primary font-semibold mb-3">Create a custom module</label>
          <div class="flex gap-3">
            <input 
              v-model="moduleInput"
              type="text"
              placeholder="e.g., Analytics, HR, Partnerships..."
              class="flex-1 bg-bg-input border border-border-input rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent transition"
              @keyup.enter="handleGenerateModule"
            />
            <button 
              @click="handleGenerateModule"
              class="px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-text font-semibold hover:opacity-90 transition whitespace-nowrap"
            >
              Generate
            </button>
          </div>
        </div>

        <!-- Generated Module -->
        <div v-if="generatedModule" class="bg-bg-surface border border-border rounded-2xl p-6 animate-in fade-in">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <span class="text-accent text-lg">⚙️</span>
            </div>
            <div>
              <h3 class="text-text-primary font-bold text-lg mb-2">{{ generatedModule.name }}</h3>
              <p class="text-text-secondary">{{ generatedModule.description }}</p>
              <button class="mt-4 text-accent hover:text-accent-hover font-semibold text-sm transition">
                Add this module →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-in {
  animation: fadeIn 0.5s ease-out;
}
</style>
