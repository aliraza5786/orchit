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
  const token = params.get('_token')
  if (token) {
    localStorage.setItem('token', token)
  }
  if (companyId) {
    authStore.setCompany(companyId)
  }
  if (token || companyId || theme) {
    window.history.replaceState({}, '', window.location.pathname)
  }else {
  // ✅ Read token from cookie and save to localStorage for this subdomain
  const cookieRaw = document.cookie
    .split('; ')
    .find(row => row.startsWith('space_auth='))
    ?.split('=')[1]

  if (cookieRaw) {
    try {
      const session = JSON.parse(decodeURIComponent(cookieRaw))
      if (session?.token) {
        localStorage.setItem('token', session.token)
      }
    } catch (e) {
      console.error('❌ Failed to parse space_auth cookie:', e)
    }
  }}
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