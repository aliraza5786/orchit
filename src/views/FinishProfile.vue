<template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[360px] mx-auto w-full min-h-full py-8 flex flex-col justify-center items-center text-center">
        
        <!-- Premium Minimal Checkmark -->
        <div class="w-16 h-16 rounded-full flex items-center justify-center mb-6" :style="iconBgStyle">
          <svg class="w-8 h-8" :style="{ color: isPersonal ? '#0d9488' : 'var(--accent)' }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <!-- Dynamic Success Title -->
        <h2 class="text-[24px] font-medium text-text-primary tracking-tight mb-2">
          {{ isPersonal ? 'Personal Space Ready!' : 'Organization Set Up!' }}
        </h2>

        <!-- Elegant Subtitle -->
        <p class="text-xs text-text-secondary leading-relaxed mb-6">
          {{ isPersonal 
            ? 'Your account is ready. Get started with Orchit AI to organize your thoughts and manage your tasks.' 
            : 'Your team\'s digital workspace has been successfully provisioned. Start collaborating efficiently.' }}
        </p>

        <!-- Minimal Workspace Link Card -->
        <div v-if="!isPersonal && workspaceUrl" class="w-full rounded-xl border border-border p-3.5 bg-bg-card text-left space-y-1 mb-6">
          <span class="text-[9px] font-bold uppercase tracking-wider text-text-secondary">Workspace URL</span>
          <div class="flex items-center justify-between gap-3">
            <a :href="workspaceUrl" target="_blank" rel="noopener noreferrer" class="text-xs font-bold text-accent hover:underline truncate">
              {{ workspaceUrl.replace('https://', '') }}
            </a>
            <svg class="w-3.5 h-3.5 text-text-tertiary" viewBox="0 0 12 12" fill="none"><path d="M3.5 8.5l5-5M8.5 3.5H5M8.5 3.5V7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <!-- Main Buttons -->
        <div class="w-full space-y-3.5">
          <Button size="md" :block="true" @click="register">Explore Dashboard</Button>

          <div class="flex items-center gap-3">
            <div class="flex-1 h-px bg-border"></div>
            <span class="text-[9px] text-text-tertiary font-bold tracking-wider uppercase">or</span>
            <div class="flex-1 h-px bg-border"></div>
          </div>

          <Button size="md" :block="true" @click="createWS" variant="secondary">
            Let's Start Creating Your First Workspace
          </Button>
        </div>

      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '../layout/AuthLayout/AuthLayout.vue';
import Button from '../components/ui/Button.vue';
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from '../composables/useTheme';

const { theme } = useTheme();
const router = useRouter()
const route = useRoute()

const isPersonal = computed(() => route.query.type === 'personal')

const iconBgStyle = computed(() => {
  if (isPersonal.value) {
    return {
      background: 'color-mix(in srgb, var(--teal-500, #14b8a6) 10%, transparent)',
      border: '1.5px solid color-mix(in srgb, var(--teal-500, #14b8a6) 20%, transparent)',
    }
  }
  return {
    background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
    border: '1.5px solid color-mix(in srgb, var(--accent) 20%, transparent)',
  }
})

const workspaceUrl = computed(() => {
  const cd = route.query.customDomain as string
  if (cd) return `https://${cd}`
  const slug = route.query.siteSlug as string
  if (slug) return `https://${slug}.streamed.space`
  return ''
})

const COOKIE_KEY = 'auth_session'

function setAuthCookie(data: { token?: string, company_id?: string }) {
  let existing: Record<string, string> = {}
  try {
    const raw = document.cookie
      .split('; ')
      .find(row => row.startsWith(COOKIE_KEY + '='))
      ?.split('=')[1]
    if (raw) existing = JSON.parse(decodeURIComponent(raw))
  } catch {}

  const merged = { ...existing, ...data }
  const value = encodeURIComponent(JSON.stringify(merged))
  const maxAge = 60 * 60 * 24 * 30
  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
  } else if (hostname === 'orchit.ai' || hostname.endsWith('.orchit.ai')) {
    document.cookie = `${COOKIE_KEY}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=None`
  }
}

function register() {
  const type = route.query.type as string

  if (type === 'personal') {
    const encodedUserId = route.query._uid as string
    if (encodedUserId) {
      const userId = atob(encodedUserId.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
      localStorage.setItem('user_id', userId)
    }
    router.push({ path: '/dashboard', query: { welcome: '1', theme: theme.value } })
    return
  }

  const encodedToken = route.query._auth as string
  const encodedCompanyId = route.query._cid as string
  const domainLink = route.query.domainLink as string

  if (!encodedToken) {
    console.error('❌ No _auth token in URL')
    return
  }

  if (!encodedCompanyId) {
    console.error('❌ No _cid in URL')
    return
  }

  let token = encodedToken
  try {
    if (!encodedToken.startsWith('eyJ')) {
      token = atob(encodedToken.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
    }
  } catch (e) {
    console.error('❌ Token decode failed:', e)
    return
  }

  let companyId = encodedCompanyId
  try {
    companyId = atob(encodedCompanyId.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
  } catch (e) {
    console.error('❌ company_id decode failed:', e)
    return
  }

  setAuthCookie({ token, company_id: companyId })

  const isLocalhost = window.location.hostname === 'localhost'

  const buildUrl = (base: string) => {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    return `${cleanBase}/dashboard?welcome=1&_auth=${encodedToken}`
  }

  if (isLocalhost) {
    const port = window.location.port ? `:${window.location.port}` : ''
    window.location.href = `http://custom.localhost${port}/dashboard?welcome=1&_auth=${encodedToken}&theme=${theme.value}`
  } else if (domainLink) {
    const finalUrl = buildUrl(domainLink)
    const separator = finalUrl.includes('?') ? '&' : '?'
    window.location.href = `${finalUrl}${separator}theme=${theme.value}`
  } else {
    router.push({ path: '/dashboard', query: { welcome: '1', theme: theme.value } })
  }
}

function createWS() {
  const encodedToken = route.query._auth as string
  const domainLink = route.query.domainLink as string
  const encodedCompanyId = route.query._cid as string
  const encodedUserId = route.query._uid as string
  const type = route.query.type as string

  router.push({
    path: '/create-workspace',
    query: { _auth: encodedToken, domainLink, _cid: encodedCompanyId, _uid: encodedUserId, type, theme: theme.value }
  })
}
</script>