<script setup lang="ts">
import { onMounted, computed, watch } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import { useTheme } from './composables/useTheme'
import { useAuthStore } from './stores/auth'
import { useDeletionGuard } from './composables/useDeletionGuard'
import { useQuery } from '@tanstack/vue-query'
import { getProfile } from './services/user'
const { isDark } = useTheme()
const authStore = useAuthStore()
const { data: profile } = useQuery({
  queryKey: ['profile'],
  queryFn: getProfile,
  placeholderData: (prev) => prev,
  enabled: computed(() => !!localStorage.getItem('token'))
})
const profileData = computed(() => profile.value?.data ?? null)
onMounted(async () => {
  await authStore.bootstrap()
})
useDeletionGuard(profileData)
watch(
  profileData,
  async (user) => { 
    if (user?.is_suspended) {
      await authStore.logout()
    }
  },
  { immediate: true }
)
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