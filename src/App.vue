<script setup lang="ts">
import { onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import { useTheme } from './composables/useTheme'
import { useAuthStore } from './stores/auth'
const { isDark } = useTheme()
const authStore = useAuthStore()

onMounted(async () => {
  await authStore.bootstrap()
})
</script>

<template>
  <div class="min-h-[100dvh] relative text-text-primary transition-colors bg-bg-body">
    <router-view />
  </div>
  <Toaster position="bottom-right" :theme="isDark ? 'dark' : 'light'" closeButton />
</template>

<style>
body {
  font-family: 'Lato', sans-serif;
}
</style>