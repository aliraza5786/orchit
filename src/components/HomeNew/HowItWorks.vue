<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter()
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
function goToRegister(){
    router.push('/register')
}
</script>

<template>
  <section id="product" class="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
        <p class="text-xl text-[var(--muted)]">Three simple steps to orchestrate your next idea</p>
      </div>

      <!-- Steps Container with Lines -->
      <div class="relative">
        <!-- Connecting Lines -->
        <div class="hidden md:block absolute top-8 left-0 right-0 h-0.5">
          <div class="max-w-5xl mx-auto px-12 h-full flex items-center">
            <div class="w-full h-0.5 bg-accent"></div>
          </div>
        </div>

        <!-- Steps Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          <div
            v-for="step in steps"
            :key="step.number"
            class="relative"
          >
            <!-- Step Content -->
            <div class="text-center">
              <!-- Number Badge -->
              <div
                class="w-16 h-16 mx-auto mb-6 bg-accent hover:bg-accent-hover rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg relative z-20"
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
      </div>

      <!-- CTA -->
      <div class="text-center mt-16">
        <button
          @click="goToRegister"
          class="px-8 py-4 cursor-pointer bg-accent text-white rounded-lg hover:bg-accent-hover font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Start orchestrating now
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Ensure proper positioning */
.relative {
  position: relative;
}

/* Smooth transitions */
button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>