<script setup lang="ts">
import { ref, computed } from 'vue'
import HeroBannerInput from '../../landingPageViews/components/HeroBannerInput.vue'
import { usePromptSuggestions } from "../../queries/usePropmpSuggestions";
import heroGlow from "@/assets/LandingPageImages/hero_glow.svg";
import { useTheme } from "../../composables/useTheme";
defineProps<{
  isDark: boolean
}>()

const emit = defineEmits(['submit'])
const { theme } = useTheme();
const inputRef = ref<any>(null)
const isLoading = ref(false)
const responseMessage = ref<string | null>(null)

// Slider Logic
const examples = [
    "🍽️ I want to open a food truck business.",
    "💇 I want to start a luxury salon.",
    "🍹 I want to open a cocktail bar.",
    "📚 I want to write and publish a book.",
    "✈️ I want to start a travel agency.",
    "🚴 I want to open a fitness cycling studio.",
    "👗 I want to launch a fashion boutique.",
    "🚗 I want to open a car rental service.",
    "📸 I want to become a professional photographer."
];

const { data: promptSuggestions } = usePromptSuggestions({
  refetchOnMount: true,
});

const suggestionList = computed(() => {
  if (promptSuggestions?.value?.length) {
    return promptSuggestions.value.map((item: any) => item.prompt);
  }
  return examples;
});

const handleExampleClick = (example: string) => {
    inputRef.value?.setValue(example);
}

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
  <section class="relative min-h-screen flex flex-col overflow-hidden">
    <!-- Background Glow SVG -->
    <div class="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-full lg:w-[1440px] z-0 pointer-events-none">
      <img 
        :src="heroGlow" 
        alt="" 
        class="w-full h-auto animate-pulse-glow opacity-80"
      />
    </div>

    <!-- Hero Content -->
    <div class="flex-1 flex flex-col items-center justify-center py-20 w-full overflow-hidden relative z-10">
      <!-- Top Content -->
      <div class="max-w-4xl mx-auto text-center w-full px-4 sm:px-6 lg:px-8">
        <h1 class="text-5xl md:text-5xl font-bold mb-6 leading-tight">
          What idea do you want to 
          <span class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">orchestrate?</span>
        </h1>
        
        <p class="text-xl md:text-1xl text-[var(--muted)] mb-12 max-w-2xl mx-auto">
          Orchit helps you plan, structure, and execute your idea from start to finish. Your next idea organized and powered by AI.
        </p>

        <!-- Interactive Prompt Box -->
        <div class="relative">
          <HeroBannerInput
            ref="inputRef"
            :theme="isDark ? 'dark' : 'light'"
            @submit="handleSubmit"
            :loading="isLoading"
            placeholder="Ask Orchit to create a plan for…"
          />

          <p v-if="responseMessage" class="text-center mt-2 text-sm font-medium text-red-600">
            {{ responseMessage }}
          </p>
        </div>
      </div>
      <div class="relative overflow-hidden  mb-[40px] lg:mb-[72px]">
            <p
                class="text-center text-[14px] font-medium text-primary leading-[20px] font-manrope mb-[25px] lg:mb-[31px]">
                Or try
                these
                examples:</p>
            <div class="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                <div class="examples-container flex gap-[15px] lg:gap-[24px] px-4 mb-[15px] lg:mb-[24px]
                    snap-x snap-mandatory animate-marquee
                   hover:[animation-play-state:paused] active:[animation-play-state:paused] touch-pan-x">
                    <div v-for="n in 2" :key="n" class="flex gap-[15px] lg:gap-[24px] flex-shrink-0">
                        <button v-for="example in suggestionList" :key="example + n" @click="handleExampleClick(example)"
                            class="flex-shrink-0 px-[10px] sm:px-[15px] lg:px-[19px] py-[10px] sm:py-[14px] lg:py-[17px] cursor-pointer  text-primary 
                    text-[12px] md:text-[14px] font-manrope rounded-full border-1  hover:border-purple-500
                    transition-all duration-300 whitespace-nowrap "
                            :class="theme === 'dark' ? 'bg-transparent border-gray-800' : 'border-gray-300 bg-gray-100'">
                            {{ example }}
                        </button>
                    </div>
                </div>
            </div>
            <div class="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                <div
                    class="examples-container pb-1 flex gap-[15px] lg:gap-[24px] px-4 animate-marquee2 snap-x snap-mandatory hover:[animation-play-state:paused] active:[animation-play-state:paused] touch-pan-x">
                    <div v-for="n in 2" :key="n" class="flex gap-[15px] lg:gap-[24px] flex-shrink-0">
                        <button v-for="example in suggestionList" :key="example + n" @click="handleExampleClick(example)"
                            class="flex-shrink-0 px-[10px] sm:px-[15px] lg:px-[19px] py-[10px] sm:py-[14px] lg:py-[17px] cursor-pointer  text-primary 
                    text-[12px] md:text-[14px] font-manrope rounded-full border-1  hover:border-purple-500
                    transition-all duration-300 whitespace-nowrap "
                            :class="theme === 'dark' ? 'bg-transparent border-gray-800' : 'border-gray-300 bg-gray-100'">
                            {{ example }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    <div class="absolute bottom-8 -mt-6 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-bounce z-10">
      <svg class="w-6 h-6 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>
    </div>

  </section>
</template>


<style scoped>
@keyframes pulse-glow {
  0% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 0.5; }
}

.animate-pulse-glow {
  animation: pulse-glow 15s ease-in-out infinite;
  will-change: transform, opacity;
}





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

/* Marquee Animations */
@keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
}

.animate-marquee {
    display: flex;
    width: max-content;
    animation: marquee 100s linear infinite;
    will-change: transform;
}

@keyframes marquee2 {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
}

.animate-marquee2 {
    display: flex;
    width: max-content;
    animation: marquee2 100s linear infinite;
    will-change: transform;
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Pause on hover */
.examples-container:hover,
.examples-container:active {
    animation-play-state: paused;
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