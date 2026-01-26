<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter()
const steps = [
  {
    number: 1,
    icon: '💡',
    title: 'Prompt your idea',
    color: '#7D68C8',
    description: 'Describe what you want to build, launch, or organize. Just tell Orchit your vision in plain English.'
  },
  {
    number: 2,
    icon: '🤖',
    color: '#82cfff',
    title: 'Orchit generates modules, tasks, and a plan',
    description: 'AI structures your idea into actionable modules, workflows, and tasks. Everything you need to get started.'
  },
  {
    number: 3,
    icon: '🚀',
    color: '#6e3b96',
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

      <!-- Steps Container -->
      <div class="relative mb-16">
        <!-- Mobile: Vertical Stack -->
        <div class="md:hidden space-y-12">
          <div 
            v-for="step in steps" 
            :key="step.number"
            class="text-center"
          >
            <!-- Circle with Dotted Border -->
            <div class="relative inline-block mb-6">
              <div 
                class="w-40 h-40 rounded-full flex flex-col items-center justify-center text-white relative z-10 transition-all hover:scale-105"
                :style="{ backgroundColor: step.color }"
              >
                <div class="text-5xl mb-2">{{ step.icon }}</div>
                <div class="text-3xl font-bold mb-1">{{ step.number }}</div>
                <div class="text-sm font-semibold px-4 text-center leading-tight">{{ step.title }}</div>
              </div>
              <!-- Dotted Border -->
              <div 
                class="absolute inset-0 rounded-full border-4 border-dashed -m-4"
                :style="{ borderColor: step.color }"
              ></div>
            </div>
            <!-- Description -->
            <p class="text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
              {{ step.description }}
            </p>
          </div>
        </div>

        <!-- Desktop: Horizontal Flow with Arrows -->
        <div class="hidden md:block">
          <div class="flex items-center justify-center mb-12">
            <template v-for="(step, index) in steps" :key="step.number">
              <!-- Step Circle -->
              <div class="relative flex-shrink-0">
                <!-- Main Circle -->
                <div 
                  class="w-52 h-52 rounded-full flex flex-col items-center justify-center text-white relative z-10 transition-all hover:scale-105 cursor-pointer p-2"
                  :style="{ backgroundColor: step.color }"
                >
                  <div class="text-5xl mb-3">{{ step.icon }}</div>
                  <div class="text-5xl font-bold mb-2">{{ step.number }}</div>
                  <div class="text-base font-semibold px-6 text-center leading-tight">{{ step.title }}</div>
                </div>
                
                <!-- Dotted Border Circle -->
                <div 
                  class="absolute inset-0 rounded-full border-4 border-dashed -m-5"
                  :style="{ borderColor: step.color }"
                ></div>
              </div>

              <!-- Arrow Connector (not after last step) -->
              <div 
                v-if="index < steps.length - 1" 
                class="flex-shrink-0 mx-6 relative"
                style="width: 140px; height: 120px;"
              >
                <!-- Curved Arrow SVG -->
                <svg
  class="w-full h-full"
  viewBox="0 0 140 120"
  preserveAspectRatio="none"
>
  <!-- Curved path -->
  <path
    :d="index % 2 === 0
      ? 'M 5 60 C 45 20, 95 20, 135 60'
      : 'M 5 60 C 45 100, 95 100, 135 60'"
    fill="none"
    :stroke="steps[index + 1].color"
    stroke-width="4"
    stroke-linecap="round"
  />

  <!-- Arrow head -->
  <!-- <path
    :d="index % 2 === 0
      ? 'M 135 60 L 125 52 L 125 68 Z'
      : 'M 135 60 L 125 52 L 125 68 Z'"
    :fill="steps[index + 1].color"
  /> -->
</svg>

              </div>
            </template>
          </div>

          <!-- Descriptions Row -->
          <div class="grid grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div 
              v-for="step in steps" 
              :key="`desc-${step.number}`"
              class="text-center px-4"
            >
              <p class="text-[var(--muted)] leading-relaxed">
                {{ step.description }}
              </p>
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

.hover\:scale-105:hover {
  transform: scale(1.05);
}
</style>