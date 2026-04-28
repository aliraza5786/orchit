<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { joinCompany } from '../../services/auth'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

// ✅ Gets token from URL: /company-join/7dfb4aff5cb9f8a630f34d8acace74d99865fbed6001ada0
const token = route.params.token as string

const isLoading   = ref(true)
const isJoining   = ref(false)
const error       = ref<string | null>(null)
const errorDetail = ref<string | null>(null)

onMounted(async () => {
  if (!token) {
    error.value       = 'Invalid invite link.'
    errorDetail.value = 'No token was found in the URL.'
    isLoading.value   = false
    return
  }

  localStorage.setItem('pending_invite_token', token)

  if (authStore.user) {
    await acceptInvite()
  } else {
    // Not logged in → show join prompt
    isLoading.value = false
  }
})
async function acceptInvite() {
  try {
    isLoading.value = false
    isJoining.value = true

    const data = await joinCompany(token)

    const companyId   = data?.data?.company?.id  ?? data?.data?.company?._id
    const redirectUrl = data?.data?.redirect_url  // "https://orchitai.streamed.space"

    // ✅ Save company + token to cookie for subdomain
    if (companyId) authStore.setCompany(companyId)

    const authToken = localStorage.getItem('token')
    if (authToken) {
      saveAuthForSubdomain(authToken, companyId)
    }

    localStorage.removeItem('pending_invite_token')

    // ✅ Redirect to subdomain dashboard
    if (redirectUrl) {
      window.location.href = `${redirectUrl}/dashboard`
      return
    }

    // Fallback
    await authStore.bootstrap()
    router.push('/dashboard')

  } catch (err: any) {
    error.value       = 'Could not join workspace'
    errorDetail.value = err?.response?.data?.message ?? 'Something went wrong. Please try again.'
    isJoining.value   = false
  }
}
// ✅ Sets cookie on .streamed.space so ALL subdomains can read it
function saveAuthForSubdomain(token: string, companyId: string) {
  const maxAge = 60 * 60 * 24 * 30  // 30 days

  const session = JSON.stringify({ token, company_id: companyId })
  const value   = encodeURIComponent(session)

  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    // localhost — no domain needed
    document.cookie = `auth_session=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
  } else {
    // ✅ .streamed.space — shared across ALL subdomains
    document.cookie = `auth_session=${value}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
  }
}
function goToRegister() {
  router.push({ path: '/register', query: { redirect: `/company-join/${token}` } })
}

function goToLogin() {
  router.push({ path: '/login', query: { redirect: `/company-join/${token}` } })
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-10"
    style="background: var(--bg-surface, #f5f5f5);">

    <div class="w-full max-w-md rounded-2xl border p-8 md:p-10 text-center space-y-5"
      style="background: var(--bg-card); border-color: var(--border);">

      <!-- Logo -->
      <div class="w-13 h-13 rounded-[14px] border flex items-center justify-center mx-auto"
        style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.2);">
        <img src="/src/assets/global/favicon.png" alt="logo" class="w-7 h-7" />
      </div>

      <!-- ── LOADING (checking auth) ── -->
      <template v-if="isLoading">
        <div class="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin mx-auto"
          style="border-color: var(--border); border-top-color: var(--accent);" />
        <h1 class="text-xl font-medium" style="color: var(--text-primary);">
          Checking your invite...
        </h1>
        <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
          Please wait while we verify your link.
        </p>
      </template>

      <!-- ── JOINING ── -->
      <template v-else-if="isJoining && !error">
        <div class="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin mx-auto"
          style="border-color: var(--border); border-top-color: var(--accent);" />
        <h1 class="text-xl font-medium" style="color: var(--text-primary);">
          Joining workspace...
        </h1>
        <p class="text-sm" style="color: var(--text-secondary);">
          Setting up your access. This only takes a moment.
        </p>
      </template>

      <!-- ── JOIN PROMPT (not logged in) ── -->
      <template v-else-if="!authStore.user && !error">

        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
          style="background: var(--bg-lavender); color: var(--accent); border: 1px solid rgba(125,104,200,0.2);">
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--accent);" />
          You've been invited
        </div>

        <h1 class="text-[22px] font-medium" style="color: var(--text-primary);">
          Join your workspace
        </h1>
        <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
          Create an account or log in to accept this invite and start collaborating.
        </p>

        <!-- Perks -->
        <div class="space-y-2.5 text-left">
          <div v-for="perk in [
            'Access to all team projects and docs',
            'Collaborate in real-time with your team',
            'Shared goals, tasks and knowledge base',
          ]" :key="perk" class="flex items-center gap-2.5 text-sm" style="color: var(--text-primary);">
            <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style="background: rgba(29,158,117,0.12);">
              <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" stroke-width="1.6"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            {{ perk }}
          </div>
        </div>

        <button @click="goToRegister"
          class="w-full py-3 rounded-[10px] text-sm font-medium transition-all"
          style="background: var(--accent); color: var(--accent-text);">
          Create account &amp; join
        </button>

        <div class="flex items-center gap-3">
          <div class="flex-1 h-px" style="background: var(--border);" />
          <span class="text-xs" style="color: var(--text-secondary);">or</span>
          <div class="flex-1 h-px" style="background: var(--border);" />
        </div>

        <button @click="goToLogin"
          class="w-full py-3 rounded-[10px] text-sm font-medium border transition-all"
          style="border-color: var(--border); color: var(--text-secondary);">
          Log in to existing account
        </button>

        <p class="text-xs" style="color: var(--text-tertiary, #9ca3af);">
          By joining, you agree to Orchit AI's terms of service and privacy policy.
        </p>
      </template>

      <!-- ── ERROR ── -->
      <template v-else-if="error">
        <div class="w-13 h-13 rounded-full flex items-center justify-center mx-auto"
          style="background: rgba(229,80,80,0.1); border: 1px solid rgba(229,80,80,0.2);">
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01" stroke="#e55050" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#e55050" stroke-width="1.6"/>
          </svg>
        </div>

        <h1 class="text-xl font-medium" style="color: var(--text-primary);">{{ error }}</h1>

        <div v-if="errorDetail"
          class="rounded-xl border px-4 py-3 text-left"
          style="background: var(--bg-surface); border-color: var(--border);">
          <div class="text-xs mb-1" style="color: var(--text-secondary);">Error details</div>
          <div class="text-sm" style="color: var(--text-primary);">{{ errorDetail }}</div>
        </div>

        <div class="flex gap-3">
          <button @click="goToLogin"
            class="flex-1 py-3 rounded-[10px] text-sm font-medium border transition-all"
            style="border-color: var(--border); color: var(--text-secondary);">
            Log in
          </button>
          <button @click="goToRegister"
            class="flex-1 py-3 rounded-[10px] text-sm font-medium"
            style="background: var(--accent); color: var(--accent-text);">
            Create account
          </button>
        </div>

        <p class="text-xs" style="color: var(--text-tertiary, #9ca3af);">
          Already have an account? Log in and ask your admin to resend the invite
          from workspace settings.
        </p>
      </template>

    </div>
  </div>
</template>