<script setup lang="ts">
import { useTheme } from '../../composables/useTheme'
import lightLogo from '@assets/global/light-logo.png'
import darkLogo from '@assets/global/dark-logo.png'

const { isDark } = useTheme()
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50 bg-bg-surface/95 backdrop-blur-sm border-b border-border">
    <nav class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center gap-8">
        <a href="#" class="hover:opacity-80 transition">
          <img :src="isDark ? darkLogo : lightLogo" alt="Orchit.ai" class="h-8 object-contain">
        </a>
        
        <!-- Center Navigation -->
        <div class="hidden lg:flex items-center gap-8">
          <a href="#features" class="text-text-secondary hover:text-text-primary transition text-sm">Product</a>
          <a href="#templates" class="text-text-secondary hover:text-text-primary transition text-sm">Templates</a>
          <a href="#marketplace" class="text-text-secondary hover:text-text-primary transition text-sm">Marketplace</a>
          <a href="#pricing" class="text-text-secondary hover:text-text-primary transition text-sm">Pricing</a>
          <a href="#faq" class="text-text-secondary hover:text-text-primary transition text-sm">FAQ</a>
        </div>
      </div>

      <!-- Right Side -->
      <div class="flex items-center gap-4">
        <button class="text-text-secondary hover:text-text-primary transition text-sm hidden sm:block">
          Log in
        </button>
        <button class="px-6 py-2 rounded-lg bg-accent hover:bg-accent-hover text-accent-text font-medium hover:opacity-90 transition text-sm">
          Get started free
        </button>
      </div>
    </nav>
  </header>
</template>

<style scoped>
</style>
