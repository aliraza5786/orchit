<script setup lang="ts">
import { onMounted } from 'vue'
import { Toaster } from 'vue-sonner';
import 'vue-sonner/style.css'
import { useTheme } from './composables/useTheme';
import { useAuthStore } from './stores/auth';
const { isDark } = useTheme();
const authStore = useAuthStore();

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const companyId = params.get('company_id')
  if (companyId) {
    localStorage.setItem('company_id', companyId)
  }
  window.history.replaceState({}, '', window.location.pathname)
})
onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const companyId = params.get('company_id')
  const theme = params.get('theme')

  // ✅ Save company_id from URL before bootstrap runs
  if (companyId) {
    authStore.setCompany(companyId)
  }
  if (companyId || theme) {
    window.history.replaceState({}, '', window.location.pathname)
  }
  await authStore.bootstrap()
})
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