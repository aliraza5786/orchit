<script setup lang="ts">
import { ref } from 'vue'
import HeroBannerInput from '../../landingPageViews/components/HeroBannerInput.vue'

defineProps<{
  isDark: boolean
  toggleTheme: () => void
}>()

const emit = defineEmits(['submit'])

const inputRef = ref<any>(null)
const isLoading = ref(false)
const responseMessage = ref<string | null>(null)

const setValue = (value: string) => {
  inputRef.value?.setValue(value)
}

const handleSubmit = async (value: string) => {
  if (!value.trim()) return
  isLoading.value = true
  responseMessage.value = null

  try {
    const res = await fetch('https://api.example.com/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: value })
    })

    if (!res.ok) throw new Error('Failed to fetch plan')
    const data = await res.json()
    responseMessage.value = data.message || 'Plan generated successfully!'
  } catch (err) {
    console.error(err)
    responseMessage.value = 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }

  emit('submit', value)
}

defineExpose({ setValue })
</script>

<template>
  <section class="relative min-h-screen flex flex-col">
    <!-- Sticky Header -->
    <header class="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center">
            <span class="text-2xl font-bold text-[var(--text)]">Orchit.ai</span>
          </div>

          <!-- Navigation -->
          <nav class="hidden md:flex items-center space-x-8">
            <a href="#product" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Product</a>
            <a href="#templates" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Templates</a>
            <a href="#marketplace" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Marketplace</a>
            <a href="#pricing" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Pricing</a>
            <a href="#faq" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">FAQ</a>
          </nav>

          <!-- Right Actions -->
          <div class="flex items-center space-x-4">
            <!-- Theme Toggle -->
            <button
              @click="toggleTheme"
              class="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              aria-label="Toggle theme"
            >
              <svg v-if="!isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </button>

            <a href="/login" class="text-[var(--text)] hover:text-[var(--muted)] transition-colors">Log in</a>
            <button class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Get started free
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Hero Content -->
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-5xl md:text-5xl font-bold mb-6 leading-tight">
          What idea do you want to 
          <span class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">orchestrate?</span>
        </h1>

        <p class="text-xl md:text-1xl text-[var(--muted)] mb-12 max-w-2xl mx-auto">
          Orchit helps you plan, structure, and execute your idea from start to finish. Your next idea — organized and powered by AI.
        </p>

        <!-- Interactive Prompt Box -->
        <div class="relative mb-8">
          <HeroBannerInput
            ref="inputRef"
            :theme="isDark ? 'dark' : 'light'"
            @submit="handleSubmit"
            :loading="isLoading"
            placeholder="Ask Orchit to create a plan for…"
          />

          <p v-if="responseMessage" class="text-center mt-4 text-sm font-medium text-red-600">
            {{ responseMessage }}
          </p>
        </div>

        <!-- Trust Line -->
        <p class="text-sm text-[var(--muted)]">
          No credit card • Cancel anytime • Early access
        </p>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce">
      <svg class="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
  </section>
</template>

<style scoped>
@keyframes bounce {
  0%, 100% {
    transform: translateY(0) translateX(-50%);
  }
  50% {
    transform: translateY(-10px) translateX(-50%);
  }
}

.animate-bounce {
  animation: bounce 2s infinite;
}
</style>