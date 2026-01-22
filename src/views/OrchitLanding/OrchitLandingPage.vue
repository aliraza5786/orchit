<script setup lang="ts">
import { ref } from 'vue'
import Header from './Header.vue'
import Hero from './Hero.vue'
import StatsSection from './StatsSection.vue'
import SocialProof from './SocialProof.vue'
import IdeasGrid from './IdeasGrid.vue'
import UseCases from './UseCases.vue'
import TabsFeature from './TabsFeature.vue'
import ViewsFeature from './ViewsFeature.vue'
import AIModules from './AIModules.vue'
import HowItWorks from './HowItWorks.vue'
import Templates from './Templates.vue'
import Marketplace from './Marketplace.vue'
import Community from './Community.vue'
import Integrations from './Integrations.vue'
import Testimonials from './Testimonials.vue'
import Pricing from './Pricing.vue'
import FAQ from './FAQ.vue'
import Footer from './Footer.vue'

const heroPromptInput = ref('')

const handlePopulatePrompt = (prompt: string) => {
  heroPromptInput.value = prompt
  // Scroll to hero
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="bg-neutral-950 text-white min-h-screen">
    <!-- Header -->
    <Header />

    <!-- Hero -->
    <Hero />

    <!-- Stats Section -->
    <StatsSection />

    <!-- Social Proof -->
    <SocialProof />

    <!-- Ideas Grid -->
    <IdeasGrid @populate="handlePopulatePrompt" />

    <!-- Use Cases -->
    <UseCases @populate="handlePopulatePrompt" />

    <!-- Tabs Feature -->
    <TabsFeature />

    <!-- Views Feature -->
    <ViewsFeature />

    <!-- AI Modules -->
    <AIModules />

    <!-- How It Works -->
    <HowItWorks />

    <!-- Templates -->
    <Templates />

    <!-- Marketplace -->
    <Marketplace />

    <!-- Community -->
    <Community />

    <!-- Integrations -->
    <Integrations />

    <!-- Testimonials -->
    <Testimonials />

    <!-- Pricing -->
    <Pricing />

    <!-- FAQ -->
    <FAQ />

    <!-- Footer -->
    <Footer />
  </div>
</template>

<style scoped>
</style>
