<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
import { useTheme } from './composables/useTheme'
import { useAuthStore } from './stores/auth'
import { useDeletionGuard } from './composables/useDeletionGuard'
import { useRouter, useRoute } from 'vue-router'
import AuthTransitionLoader from './components/ui/AuthTransitionLoader.vue'
const { isDark } = useTheme()
const authStore = useAuthStore()
const showSuspendedModal = ref(false)
const router = useRouter()
const route = useRoute()
const authReady = ref(false)

const showAuthLoader = computed(() => {
  if (authReady.value) return false
  if (route.meta.requiresAuth === false) return false
  return true
})

const profileData = computed(() => authStore.user?.data ?? null)
onMounted(async () => {
  try {
    if (!authStore.isBootstrapped) {
      await authStore.bootstrap()
    }
  } finally {
    authReady.value = true
  }
})

useDeletionGuard(profileData)

watch(
  profileData,
  (user) => {
    if (user?.is_suspended) showSuspendedModal.value = true
  },
  { immediate: true }
)

async function handleSuspendedConfirm() {
  localStorage.removeItem('token')
  document.cookie = 'auth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  await authStore.logout()
  router.push('/login')
  showSuspendedModal.value = false
}
</script>

<template>
  <div class="min-h-[100dvh] relative text-text-primary transition-colors bg-bg-body">
    <Transition
      leave-active-class="transition-opacity duration-300 ease-in"
      leave-to-class="opacity-0"
    >
      <AuthTransitionLoader v-if="showAuthLoader" />
    </Transition>
    <router-view />
  </div>

  <Toaster position="bottom-right" :theme="isDark ? 'dark' : 'light'" closeButton />
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showSuspendedModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          appear
        >
          <div class="w-full max-w-sm bg-bg-body rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div class="px-6 pt-6 pb-5 bg-gradient-to-br from-red-500/8 to-bg-body">
              <div class="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                <i class="fa-solid fa-ban text-red-500 text-xl"></i>
              </div>
              <h3 class="text-base font-bold text-text-primary">Account suspended</h3>
              <p class="text-sm text-text-secondary mt-1.5 leading-relaxed">
                Your account has been suspended. You won't be able to access any features until this is resolved.
                Please contact your admin.
              </p>
            </div>
            <div class="px-6 pb-5">
              <button
                @click="handleSuspendedConfirm"
                class="w-full py-2.5 bg-red-600 cursor-pointer text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <i class="fa-solid fa-arrow-right-from-bracket text-xs"></i>
                Sign out
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
body {
  font-family: 'Lato', sans-serif;
}
</style>