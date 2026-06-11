<template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[400px] mx-auto w-full min-h-full py-10 flex flex-col justify-center items-center text-center">
        <!-- Success icon -->
        <div
          class="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-7 shadow-sm"
          :style="iconBgStyle"
        >
          <svg
            class="w-9 h-9"
            :style="{ color: isPersonal ? '#0d9488' : 'var(--accent)' }"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 class="text-[26px] font-semibold text-text-primary tracking-tight mb-2.5">
          {{ isPersonal ? 'Personal Space Ready!' : 'Organization Set Up!' }}
        </h2>

        <p class="text-sm text-text-secondary leading-relaxed mb-8 max-w-[320px]">
          {{
            isPersonal
              ? 'Your account is ready. Get started with Orchit AI to organize your thoughts and manage your tasks.'
              : "Your team's digital workspace has been successfully provisioned. Start collaborating efficiently."
          }}
        </p>

        <!-- Workspace URL (organization with tenant domain) -->
        <div
          v-if="!isPersonal && workspaceLabel"
          class="w-full rounded-2xl border border-border bg-bg-card/80 backdrop-blur-sm p-4 text-left mb-8 shadow-sm"
        >
          <span class="text-[10px] font-bold uppercase tracking-[0.12em] text-text-secondary">
            Workspace URL
          </span>
          <div
            class="mt-2.5 flex items-center gap-2 rounded-xl border border-border bg-bg-surface px-3 py-2.5"
          >
            <a
              v-if="workspaceOpenUrl"
              :href="workspaceOpenUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex-1 min-w-0 text-sm font-semibold text-accent hover:underline truncate text-left"
              :title="workspaceOpenUrl"
            >
              {{ workspaceLabel }}
            </a>
            <span v-else class="flex-1 min-w-0 text-sm font-semibold text-text-primary truncate text-left">
              {{ workspaceLabel }}
            </span>
            <a
              v-if="workspaceOpenUrl"
              :href="workspaceOpenUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="shrink-0 p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-bg-muted transition-colors"
              aria-label="Open workspace in new tab"
            >
              <svg class="w-4 h-4" viewBox="0 0 12 12" fill="none">
                <path
                  d="M3.5 8.5l5-5M8.5 3.5H5M8.5 3.5V7"
                  stroke="currentColor"
                  stroke-width="1.2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </a>
          </div>
        </div>

        <div class="w-full space-y-4">
          <Button size="md" :block="true" @click="goToDashboard">
            Explore Dashboard
          </Button>

          <div class="flex items-center gap-3 px-1">
            <div class="flex-1 h-px bg-border" />
            <span class="text-[10px] text-text-tertiary font-bold tracking-wider uppercase">or</span>
            <div class="flex-1 h-px bg-border" />
          </div>

          <Button size="md" :block="true" variant="secondary" @click="goToCreateWorkspace">
            Let's Start Creating Your First Workspace
          </Button>
        </div>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '../layout/AuthLayout/AuthLayout.vue'
import Button from '../components/ui/Button.vue'
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import { buildCompanyDomainUrl } from '../utilities/authRedirect'
import { getPendingInviteRedirectPath } from '../utilities/workspaceInvitePending'

const { theme } = useTheme()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  const invitePath = getPendingInviteRedirectPath()
  if (invitePath) {
    router.replace(invitePath)
  }
})

const isPersonal = computed(() => route.query.type === 'personal')
const domainLink = computed(() => String(route.query.domainLink ?? '').trim())
const encodedToken = computed(() => String(route.query._auth ?? ''))
const encodedCompanyId = computed(() => String(route.query._cid ?? ''))
const hasTenantDomain = computed(() => !!domainLink.value && !!encodedToken.value)

const iconBgStyle = computed(() => {
  if (isPersonal.value) {
    return {
      background: 'color-mix(in srgb, var(--teal-500, #14b8a6) 12%, transparent)',
      border: '1.5px solid color-mix(in srgb, var(--teal-500, #14b8a6) 28%, transparent)',
    }
  }
  return {
    background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
    border: '1.5px solid color-mix(in srgb, var(--accent) 30%, transparent)',
  }
})

const workspaceLabel = computed(() => {
  if (domainLink.value) {
    try {
      return new URL(domainLink.value).hostname
    } catch {
      return domainLink.value.replace(/^https?:\/\//, '').replace(/\/$/, '')
    }
  }
  const customDomain = String(route.query.customDomain ?? '').trim()
  if (customDomain) return customDomain.replace(/^https?:\/\//, '')
  const slug = String(route.query.siteSlug ?? '').trim()
  if (slug) return `${slug}.streamed.space`
  return ''
})

/** Tenant dashboard URL with auth + theme (active company). */
const workspaceOpenUrl = computed(() => {
  if (isPersonal.value || !hasTenantDomain.value) return ''
  return buildCompanyDomainUrl({
    domainLink: domainLink.value,
    path: '/dashboard',
    theme: theme.value,
    encodedAuth: encodedToken.value,
    encodedCompanyId: encodedCompanyId.value || undefined,
    extraQuery: { welcome: '1' },
  })
})

const COOKIE_KEY = 'auth_session'

function setAuthCookie(data: { token?: string; company_id?: string }) {
  let existing: Record<string, string> = {}
  try {
    const raw = document.cookie
      .split('; ')
      .find((row) => row.startsWith(COOKIE_KEY + '='))
      ?.split('=')[1]
    if (raw) existing = JSON.parse(decodeURIComponent(raw))
  } catch {
    /* ignore */
  }

  const merged = { ...existing, ...data }
  const value = encodeURIComponent(JSON.stringify(merged))
  const maxAge = 60 * 60 * 24 * 30
  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    document.cookie = `${COOKIE_KEY}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
  } else if (hostname.endsWith('.streamed.space')) {
    document.cookie = `${COOKIE_KEY}=${value}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
  } else if (hostname === 'orchit.ai' || hostname.endsWith('.orchit.ai')) {
    document.cookie = `${COOKIE_KEY}=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=None`
  }
}

function persistSessionFromQuery() {
  if (!encodedToken.value || !encodedCompanyId.value) return

  let token = encodedToken.value
  try {
    if (!encodedToken.value.startsWith('eyJ')) {
      token = atob(
        encodedToken.value.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='),
      )
    }
  } catch (e) {
    console.error('Token decode failed:', e)
    return
  }

  let companyId = encodedCompanyId.value
  try {
    companyId = atob(
      encodedCompanyId.value.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='),
    )
  } catch (e) {
    console.error('company_id decode failed:', e)
    return
  }

  localStorage.setItem('token', token)
  localStorage.setItem('company_id', companyId)
  setAuthCookie({ token, company_id: companyId })
}

function navigateToTenant(path: string, extraQuery?: Record<string, string>) {
  const isLocalhost = window.location.hostname === 'localhost'

  if (isLocalhost) {
    const port = window.location.port ? `:${window.location.port}` : ''
    const host = path.includes('create-workspace') ? 'custom.localhost' : 'localhost'
    const params = new URLSearchParams({ theme: theme.value, welcome: '1' })
    if (encodedToken.value) params.set('_auth', encodedToken.value)
    if (encodedCompanyId.value) params.set('_cid', encodedCompanyId.value)
    if (extraQuery) {
      Object.entries(extraQuery).forEach(([k, v]) => params.set(k, v))
    }
    window.location.href = `http://${host}${port}${path}?${params.toString()}`
    return
  }

  if (hasTenantDomain.value) {
    window.location.href = buildCompanyDomainUrl({
      domainLink: domainLink.value,
      path,
      theme: theme.value,
      encodedAuth: encodedToken.value,
      encodedCompanyId: encodedCompanyId.value || undefined,
      extraQuery: { welcome: '1', ...extraQuery },
    })
    return
  }

  const query: Record<string, string> = { welcome: '1', theme: theme.value }
  if (encodedToken.value) query._auth = encodedToken.value
  if (encodedCompanyId.value) query._cid = encodedCompanyId.value
  router.push({ path, query })
}

function goToDashboard() {
  if (isPersonal.value) {
    const encodedUserId = route.query._uid as string
    if (encodedUserId) {
      try {
        const userId = atob(
          encodedUserId.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='),
        )
        localStorage.setItem('user_id', userId)
      } catch {
        /* ignore */
      }
    }
    router.push({ path: '/dashboard', query: { welcome: '1', theme: theme.value } })
    return
  }

  if (!encodedToken.value) {
    console.error('No _auth token for dashboard redirect')
    router.push({ path: '/dashboard', query: { welcome: '1', theme: theme.value } })
    return
  }

  persistSessionFromQuery()
  navigateToTenant('/dashboard')
}

function goToCreateWorkspace() {
  if (isPersonal.value) {
    router.push({
      path: '/create-workspace',
      query: {
        type: 'personal',
        theme: theme.value,
        ...(route.query._uid ? { _uid: route.query._uid as string } : {}),
      },
    })
    return
  }

  if (!encodedToken.value) {
    router.push({ path: '/create-workspace', query: { welcome: '1', theme: theme.value } })
    return
  }

  persistSessionFromQuery()
  navigateToTenant('/create-workspace')
}
</script>
