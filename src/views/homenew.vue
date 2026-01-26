<template>
  <div
    class="min-h-screen bg-[var(--background)] text-[var(--text)] transition-colors duration-300"
  >
  <!-- <Header :isDark="isDark" :toggleTheme="toggleTheme"  /> -->
    <!-- Hero Section - Fade in on load -->
    <div class="animate-on-load" >
      <HeroSection ref="heroInputRef" :isDark="isDark" />
    </div>

    <!-- Stats Section - Slide up on scroll -->
    <div class="scroll-animate" data-animation="slide-up">
      <StatsSection />
    </div>

    <!-- Social Proof - Fade in on scroll -->
    <!-- <div class="scroll-animate" data-animation="fade-in">
      <SocialProof />
    </div> -->

    <!-- Idea Cards - Slide up with stagger -->
    <div class="scroll-animate" data-animation="slide-up-stagger">
      <IdeaCards @select-idea="setHeroPrompt" />
    </div>

    <!-- Audience Section - Scale in -->
    <div class="scroll-animate" data-animation="scale-in">
      <AudienceSection @try-prompt="setHeroPrompt" />
    </div>

    <!-- Templates Marketplace - Slide from left -->
    <div class="scroll-animate" data-animation="slide-left">
      <TemplatesMarketplace />
    </div>

    <!-- Unlimited Modules - Slide from right -->
    <!-- <div class="scroll-animate" data-animation="slide-right">
      <UnlimitedModules />
    </div> -->

    <!-- How It Works - Slide up -->
    <div class="scroll-animate" data-animation="slide-up" id="product">
      <HowItWorks />
    </div>

    <!-- Testimonials - Fade and scale -->
    <div class="scroll-animate" data-animation="fade-scale">
      <Testimonials />
    </div>

    <!-- Pricing Section - Slide up -->
    <!-- <div class="scroll-animate" data-animation="slide-up">
      <Pricing />
    </div> -->
<!-- Contact sales -->
 <!-- <div class="scroll-animate" data-animation="slide-up">
      <ContactUs />
    </div> -->
    <!-- FAQ Section - Fade in -->
    <div class="scroll-animate" data-animation="fade-in" id="faq">
      <FaqSection />
    </div>

    <!-- Final CTA - Scale in -->
    <!-- <div class="scroll-animate" data-animation="scale-in">
      <FinalCTA :isDark="isDark" :toggleTheme="toggleTheme"/>
    </div> -->

    <!-- Scroll to Top Button -->
    <transition name="scroll-button">
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
          p-3
          transition-all duration-300
          hover:scale-110
          hover:shadow-xl
          focus:outline-none
          focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]
          active:scale-95
        "
      >
        <i class="fa-solid fa-arrow-up text-lg"></i>
      </button>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme'
// import Header from '../components/HomeNew/Header.vue'
import HeroSection from '../components/HomeNew/HeroSection.vue'
import StatsSection from '../components/HomeNew/StatsSections.vue'
// import SocialProof from '../components/HomeNew/SocialProof.vue'
import IdeaCards from '../components/HomeNew/IdeaCards.vue'
import AudienceSection from '../components/HomeNew/AudienceSection.vue'
import TemplatesMarketplace from '../components/HomeNew/TemplateMarketplace.vue'
// import UnlimitedModules from '../components/HomeNew/UnlimitedModules.vue'
import HowItWorks from '../components/HomeNew/HowItWorks.vue'
import Testimonials from '../components/HomeNew/Testimonials.vue'
// import ContactUs from './ContactUs.vue'
import FaqSection from '../components/HomeNew/FaqSection.vue'
// import FinalCTA from '../components/HomeNew/FinalCTA.vue'
// import Pricing from './Pricing.vue'
import { useAuthStore } from '../stores/auth';
const authStore = useAuthStore();
const { isDark } = useTheme()
const heroInputRef = ref<any>(null)
const showScrollTop = ref(false)
const router = useRouter()
const isLoggedIn=() =>{
  if(authStore.isAuthenticated){
    router.push('/dashboard')
  }
 }
onMounted(isLoggedIn);

const setHeroPrompt = (text: string) => {
  heroInputRef.value?.setValue(text)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const handleScroll = () => {
  showScrollTop.value = window.scrollY > 300
  observeElements()
}

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}
onMounted(scrollToTop)
// Intersection Observer for scroll animations
const observeElements = () => {
  const elements = document.querySelectorAll('.scroll-animate:not(.animated)')
  
  elements.forEach((element) => {
    const rect = element.getBoundingClientRect()
    const windowHeight = window.innerHeight || document.documentElement.clientHeight
    
    // Trigger animation when element is 20% visible
    if (rect.top <= windowHeight * 0.8) {
      element.classList.add('animated')
    }
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  
  // Trigger initial check for elements in viewport
  setTimeout(() => {
    observeElements()
  }, 100)
  
  // Add load animation class
  const loadElements = document.querySelectorAll('.animate-on-load')
  loadElements.forEach((el) => {
    el.classList.add('loaded')
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* Initial page load animation */
.animate-on-load {
  opacity: 0;
  transform: translateY(30px);
  animation: fadeInUp 0.8s ease-out forwards;
}

.animate-on-load.loaded {
  animation: fadeInUp 0.8s ease-out forwards;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scroll animations base */
.scroll-animate {
  overflow: visible;
  pointer-events: auto;
  opacity: 0;
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}
.scroll-animate::before,
.scroll-animate::after {
  pointer-events: none;
}
.scroll-animate.animated {
  opacity: 1;
}

/* Slide Up Animation */
.scroll-animate[data-animation="slide-up"] {
  transform: translateY(50px);
}

.scroll-animate[data-animation="slide-up"].animated {
  transform: translateY(0);
}

/* Fade In Animation */
.scroll-animate[data-animation="fade-in"] {
  opacity: 0;
}

.scroll-animate[data-animation="fade-in"].animated {
  opacity: 1;
}

/* Scale In Animation */
.scroll-animate[data-animation="scale-in"] {
  transform: scale(0.9);
  opacity: 0;
}

.scroll-animate[data-animation="scale-in"].animated {
  transform: scale(1);
  opacity: 1;
}

/* Slide from Left */
.scroll-animate[data-animation="slide-left"] {
  transform: translateX(-50px);
  opacity: 0;
}

.scroll-animate[data-animation="slide-left"].animated {
  transform: translateX(0);
  opacity: 1;
}

/* Slide from Right */
.scroll-animate[data-animation="slide-right"] {
  transform: translateX(50px);
  opacity: 0;
}

.scroll-animate[data-animation="slide-right"].animated {
  transform: translateX(0);
  opacity: 1;
}

/* Fade and Scale */
.scroll-animate[data-animation="fade-scale"] {
  transform: scale(0.95);
  opacity: 0;
}

.scroll-animate[data-animation="fade-scale"].animated {
  transform: scale(1);
  opacity: 1;
}

/* Slide Up with Stagger (for cards) */
.scroll-animate[data-animation="slide-up-stagger"] {
  transform: translateY(60px);
  opacity: 0;
}

.scroll-animate[data-animation="slide-up-stagger"].animated {
  transform: translateY(0);
  opacity: 1;
  transition-delay: 0.1s;
}

/* Scroll to Top Button Animation */
.scroll-button-enter-active,
.scroll-button-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.scroll-button-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

.scroll-button-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.8);
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Add subtle animation to sections */
@media (prefers-reduced-motion: no-preference) {
  .scroll-animate {
    will-change: transform, opacity;
  }
}

/* Reduce animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .scroll-animate,
  .animate-on-load {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>