<script setup lang="ts">
import { Toaster } from 'vue-sonner';
import 'vue-sonner/style.css'
import { useTheme } from './composables/useTheme';
const { isDark } = useTheme();
const cookieCompanyId = document.cookie
  .split('; ')
  .find(row => row.startsWith('company_id='))
  ?.split('=')[1] ?? null

console.log('🖥️ App.vue running')
console.log('🍪 App.vue cookie company_id:', cookieCompanyId)
console.log('📦 App.vue localStorage company_id BEFORE:', localStorage.getItem('company_id'))

if (cookieCompanyId) {
  localStorage.setItem('company_id', cookieCompanyId)
  console.log('🔄 App.vue: Synced company_id:', cookieCompanyId)
} else {
  console.log('❌ App.vue: No company_id cookie found — localStorage NOT touched')
}

console.log('📦 App.vue localStorage company_id AFTER:', localStorage.getItem('company_id'))
</script>
<template>
  <div class="min-h-[100dvh] relative  text-text-primary  transition-colors bg-bg-body">
    <router-view />
  </div>
  <Toaster position="bottom-right" :theme="isDark ? 'dark' : 'light'" closeButton />
</template>
<style>
  body{
    font-family: 'Lato', sans-serif;
  }
</style>