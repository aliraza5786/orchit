<script setup lang="ts">
import { ref } from 'vue'
import HeroBannerInput from '../../landingPageViews/components/HeroBannerInput.vue'
defineProps<{
  isDark: boolean
}>()

const emit = defineEmits(['submit'])

const inputRef = ref<any>(null)
const isLoading = ref(false)
const responseMessage = ref<string | null>(null)

const setValue = (value: string) => {
  inputRef.value?.setValue(value)
}

const handleSubmit = async (value: string) => {
  if (!value?.trim()) return
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
        <div class="relative mb-4">
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
         <div class="flex justify-center lg:gap-10 gap-2">
             <p class="text-sm text-[var(--muted)]">
          <i class="fa-solid fa-dot"></i>No credit card 
        </p>
         <p class="text-sm text-[var(--muted)]">
          <i class="fa-solid fa-dot"></i>Cancel anytime 
        </p>
         <p class="text-sm text-[var(--muted)]">
          <i class="fa-solid fa-dot"></i>Early access
        </p>
         </div>
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
/* fade */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* slide */
.slide-enter-active, .slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from {
  transform: translateX(100%);
}
.slide-leave-to {
  transform: translateX(100%);
}

</style>