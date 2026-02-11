<template>
  <div class="home-page min-h-screen bg-[var(--background)] text-[var(--text)] transition-colors duration-300">
    <div class="animate-on-load" >
      <HeroSection ref="heroInputRef" :isDark="isDark" />
    </div>
    <div class="scroll-animate" data-animation="slide-up">
      <StatsSection />
    </div>
    <div class="scroll-animate" data-animation="slide-up-stagger">
      <IdeaCards @select-idea="setHeroPrompt" />
    </div>
    <div class="scroll-animate" data-animation="scale-in">
      <AudienceSection @try-prompt="setHeroPrompt" />
    </div>
    <div class="scroll-animate" data-animation="slide-left">
      <TemplatesMarketplace />
    </div>
    <div class="scroll-animate" data-animation="slide-up" id="product">
      <HowItWorks />
    </div>
    <div class="scroll-animate" data-animation="fade-scale">
      <Testimonials />
    </div>
    <div class="scroll-animate" data-animation="fade-in" id="faq">
      <FaqSection />
    </div>
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
import { ref, onMounted, onUnmounted, onBeforeMount,defineAsyncComponent  } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import { useAuthStore } from '../stores/auth';
const HeroSection = defineAsyncComponent(() => import('../components/HomeNew/HeroSection.vue'));
const StatsSection = defineAsyncComponent(() => import('../components/HomeNew/StatsSections.vue'));
const IdeaCards = defineAsyncComponent(() => import('../components/HomeNew/IdeaCards.vue'));
const AudienceSection = defineAsyncComponent(() => import('../components/HomeNew/AudienceSection.vue'));
const TemplatesMarketplace = defineAsyncComponent(() => import('../components/HomeNew/TemplateMarketplace.vue'));
const HowItWorks = defineAsyncComponent(() => import('../components/HomeNew/HowItWorks.vue'));
const Testimonials = defineAsyncComponent(() => import('../components/HomeNew/Testimonials.vue'));
const FaqSection = defineAsyncComponent(() => import('../components/HomeNew/FaqSection.vue'));
const authStore = useAuthStore();
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
/* Show scrollbar inside home page only */
.home-page *::-webkit-scrollbar {
  display: block;
  width: 8px; /* adjust thickness */
}

.home-page *::-webkit-scrollbar-track {
  background: #f0f0f0; /* track color */
}

.home-page *::-webkit-scrollbar-thumb {
  background-color: #7D68C8; /* thumb color */
  border-radius: 4px;
}

/* Firefox */
.home-page * {
  scrollbar-width: auto;
  scrollbar-color: #7D68C8 #f0f0f0;
}

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