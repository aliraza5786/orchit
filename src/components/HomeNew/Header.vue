<template>
    <header class="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-lg border-b border-[var(--border)]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center">
            <RouterLink to="/" class="flex items-center gap-2">
              <img v-if="!isDark" src="../../assets/global/light-logo.png" alt="Orchit AI logo" class="w-24 sm:w-30"
                loading="eager" decoding="async" />
              <img v-else src="../../assets/global/dark-logo.png" alt="Orchit AI logo" class="w-24 sm:w-30" loading="eager"
                decoding="async" />
            </RouterLink> 
          </div>

          <!-- Navigation (Desktop Only) -->
          <nav class="hidden md:flex items-center space-x-8">
            <a href="#product" @click.prevent="scrollTo('product')" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Product</a>
            <a href="#templates" @click.prevent="scrollTo('templates')" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Templates</a>
            <a href="#templates" @click.prevent="scrollTo('templates')" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Marketplace</a>
            <a href="/pricing" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Pricing</a>
            <a href="#faq" @click.prevent="scrollTo('faq')" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">FAQ</a>
            <router-link to="/contact-us" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors">Contact Sales</router-link> 
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

            <!-- Get started (Desktop Only) -->
            <button @click="goToRegister" class="hidden cursor-pointer md:inline-block px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors font-medium">
              Get started free
            </button>

            <!-- Menu Icon (Mobile Only) -->
            <button
              class="md:hidden p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
              @click="toggleSidebar"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Mobile Sidebar -->
    <transition name="fade">
      <div v-if="sidebarOpen" class="fixed inset-0 z-50 bg-black/40" @click="toggleSidebar"></div>
    </transition>

    <transition name="slide">
      <aside
        v-if="sidebarOpen"
        class="fixed top-0 right-0 z-50 h-full w-72 bg-[var(--background)] border-l border-[var(--border)] p-6"
      >
        <div class="flex items-center justify-between mb-6">
          <div class="font-bold text-lg">Menu</div>
          <button @click="toggleSidebar" class="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav class="flex flex-col gap-4">
          <a href="#product" @click.prevent="scrollTo('product')" class="text-[var(--text)]">Product</a>
          <a href="#templates" @click.prevent="scrollTo('templates')" class="text-[var(--text)]">Templates</a>
          <a href="#marketplace" @click.prevent="scrollTo('marketplace')" class="text-[var(--text)]">Marketplace</a>
          <a href="#pricing" @click.prevent="scrollTo('pricing')" class="text-[var(--text)]">Pricing</a>
          <a href="#faq" @click.prevent="scrollTo('faq')" class="text-[var(--text)]">FAQ</a>
           <router-link
            to="/contact-us"
            class="text-[var(--text)]"
            @click="sidebarOpen = false"
          >
            Contact Sales
          </router-link>
          <button  @click="goToRegister" class="mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
            Get started free
          </button>
        </nav>
      </aside>
    </transition>
</template>
<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router';
const sidebarOpen = ref(false);
const router = useRouter();
const route = useRoute()
defineProps<{
  isDark: boolean
  toggleTheme: () => void
}>()
const toggleSidebar = () => {
sidebarOpen.value = !sidebarOpen.value;
};
function goToRegister(){
    router.push('/register')
}
const scrollTo = (id: string) => {
  if(route.path !=='/'){
    router.push('/');
    document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
  sidebarOpen.value=false;
  }else{
      document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
  sidebarOpen.value=false;
  }
  
};

</script>