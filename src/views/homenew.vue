<template>
  <div
  class="min-h-screen overflow-y-auto bg-[var(--background)] text-[var(--text)] transition-colors duration-300"
>
    <HeroSection ref="heroInputRef" :isDark="isDark" :toggleTheme="toggleTheme" />
     <StatsSection />
   <SocialProof />
    <IdeaCards @select-idea="setHeroPrompt" />
    <AudienceSection @try-prompt="setHeroPrompt" />
     <TemplatesMarketplace />
    <UnlimitedModules />
    <HowItWorks />
   <Testimonials />
    <PricingSection />
   <FaqSection /> 
     <FinalCTA />
     <button
  v-if="showScrollTop"
  @click="scrollToTop"
  aria-label="Scroll to top"
  class="
    fixed bottom-6 right-6 z-50
    rounded-full
    bg-accent
    text-white
    shadow-lg
    p-2
    transition-all duration-300
    hover:scale-110
    focus:outline-none
    focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]
  "
>
  <i class="fa-solid fa-arrow-up"></i>
</button>

  </div>
</template>
<script setup lang="ts">
import { ref,onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme'
import HeroSection from '../components/HomeNew/HeroSection.vue'
import StatsSection from '../components/HomeNew/StatsSections.vue'
import SocialProof from '../components/HomeNew/SocialProof.vue'
import IdeaCards from '../components/HomeNew/IdeaCards.vue'
import AudienceSection from '../components/HomeNew/AudienceSection.vue'
import TemplatesMarketplace from '../components/HomeNew/TemplateMarketplace.vue'
import UnlimitedModules from '../components/HomeNew/UnlimitedModules.vue'
import HowItWorks from '../components/HomeNew/HowItWorks.vue'
import Testimonials from '../components/HomeNew/Testimonials.vue'
import PricingSection from '../components/HomeNew/PricingSection.vue'
import FaqSection from '../components/HomeNew/FaqSection.vue'
import FinalCTA from '../components/HomeNew/FinalCTA.vue'

const { isDark, toggleTheme } = useTheme()
const heroInputRef = ref<any>(null)
const showScrollTop = ref(false)
const setHeroPrompt = (text: string) => {
  heroInputRef.value?.setValue(text)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>