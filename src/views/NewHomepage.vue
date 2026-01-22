<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '../composables/useTheme'
import HeroSection from './NewHomepage/HeroSection.vue'
import StatsSection from './NewHomepage/StatsSection.vue'
import SocialProof from './NewHomepage/SocialProof.vue'
import IdeaCards from './NewHomepage/IdeaCards.vue'
import AudienceSection from './NewHomepage/AudienceSection.vue'
import TemplatesMarketplace from './NewHomepage/TemplatesMarketplace.vue'
import UnlimitedModules from './NewHomepage/UnlimitedModules.vue'
import HowItWorks from './NewHomepage/HowItWorks.vue'
import Testimonials from './NewHomepage/Testimonials.vue'
import PricingSection from './NewHomepage/PricingSection.vue'
import FaqSection from './NewHomepage/FaqSection.vue'
import FinalCTA from './NewHomepage/FinalCTA.vue'

const { isDark, toggleTheme } = useTheme()

const heroInputRef = ref<any>(null)

const setHeroPrompt = (text: string) => {
  heroInputRef.value?.setValue(text)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-screen bg-[var(--background)] text-[var(--text)] transition-colors duration-300">
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
  </div>
</template>
