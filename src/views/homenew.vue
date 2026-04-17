<template>
  <div class="home-page min-h-screen bg-[var(--background)] text-[var(--text)] transition-colors duration-300">
<motion.div
  :initial="{ opacity: 0, y: 30 }"
  :animate="{ opacity: 1, y: 0 }"
  :transition="{ duration: 0.6 }"
>
  <HeroSection ref="heroInputRef" :isDark="isDark" />
</motion.div>
<motion.div
  :initial="{ opacity: 0, y: 60 }"
  :while-in-view="{ opacity: 1, y: 0 }"
  :viewport="{ once: true, amount: 0.25, margin: '-80px' }"
  :transition="{ duration: 0.6 }"
>
  <StatsSection />
</motion.div>
<motion.div
  :initial="{ opacity: 0, y: 50 }"
  :while-in-view="{ opacity: 1, y: 0 }"
  :viewport="{ once: true, amount: 0.2, margin: '-80px' }"
  :transition="{ duration: 0.7, delay: 0.1 }"
>
  <IdeaCards @select-idea="setHeroPrompt" />
</motion.div>
<motion.div
  :initial="{ opacity: 0, scale: 0.92 }"
  :while-in-view="{ opacity: 1, scale: 1 }"
  :viewport="{ once: true, amount: 0.25, margin: '-80px' }"
  :transition="{ duration: 0.6 }"
>
  <AudienceSection @try-prompt="setHeroPrompt" />
</motion.div>
<motion.div
  :initial="{ opacity: 0, x: -60 }"
  :while-in-view="{ opacity: 1, x: 0 }"
  :viewport="{ once: true, amount: 0.25, margin: '-80px' }"
  :transition="{ duration: 0.6 }"
>
  <TemplatesMarketplace />
</motion.div>
<motion.div
  id="product"
  :initial="{ opacity: 0, y: 40 }"
  :while-in-view="{ opacity: 1, y: 0 }"
  :viewport="{ once: true, amount: 0.3 }"
  :transition="{ duration: 0.6 }"
>
  <HowItWorks />
</motion.div>
<motion.div
  :initial="{ opacity: 0, scale: 0.95 }"
  :while-in-view="{ opacity: 1, scale: 1 }"
  :viewport="{ once: true, amount: 0.25 }"
  :transition="{ duration: 0.6 }"
>
  <Testimonials />
</motion.div>
<motion.div
  :initial="{ opacity: 0 }"
  :while-in-view="{ opacity: 1 }"
  :viewport="{ once: true, amount: 0.2 }"
  :transition="{ duration: 0.5 }"
>
  <FaqSection />
</motion.div>
<transition name="scroll-button">
  <button
    v-if="showScrollTop"
    @click="scrollToTop"
    class="
      fixed bottom-6 right-6 z-50
      w-8 h-8 cursor-pointer
      flex items-center justify-center
      rounded-full
      bg-accent text-white
      shadow-lg
      transition-all duration-300
      hover:scale-110
      active:scale-95
    "
  >
    <i class="fa-regular fa-arrow-up text-sm"></i>
  </button>
</transition>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, onBeforeMount, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import { useAuthStore } from '../stores/auth'
import { motion } from 'motion-v'

/* ================= Components ================= */
const HeroSection = defineAsyncComponent(() => import('../components/HomeNew/HeroSection.vue'))
const StatsSection = defineAsyncComponent(() => import('../components/HomeNew/StatsSections.vue'))
const IdeaCards = defineAsyncComponent(() => import('../components/HomeNew/IdeaCards.vue'))
const AudienceSection = defineAsyncComponent(() => import('../components/HomeNew/AudienceSection.vue'))
const TemplatesMarketplace = defineAsyncComponent(() => import('../components/HomeNew/TemplateMarketplace.vue'))
const HowItWorks = defineAsyncComponent(() => import('../components/HomeNew/HowItWorks.vue'))
const Testimonials = defineAsyncComponent(() => import('../components/HomeNew/Testimonials.vue'))
const FaqSection = defineAsyncComponent(() => import('../components/HomeNew/FaqSection.vue'))

/* ================= State ================= */
const authStore = useAuthStore()
const { isDark } = useTheme()
const heroInputRef = ref<any>(null)
const showScrollTop = ref(false)
const router = useRouter()
onBeforeMount(() => {
  if (authStore.isAuthenticated) {
    router.replace('/dashboard')
  }
})

const setHeroPrompt = (text: string) => {
  heroInputRef.value?.setValue(text)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  scrollToTop()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.home-page *::-webkit-scrollbar {
  display: block;
  width: 8px;
}
.home-page *::-webkit-scrollbar-thumb {
  background-color: #7D68C8;
  border-radius: 4px;
}

/* Scroll button animation */
.scroll-button-enter-active,
.scroll-button-leave-active {
  transition: all 0.3s ease;
}
.scroll-button-enter-from,
.scroll-button-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}
</style>