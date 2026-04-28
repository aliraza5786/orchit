<template>
    <AuthLayout>
        <template #form>
            <div class="max-w-125 mx-auto w-full min-h-full py-5 flex flex-col justify-center">
                <!-- Success badge -->
                <div class="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5 mb-6 w-fit">
                    <span class="w-2 h-2 rounded-full bg-green-500"></span>
                    <span class="text-xs font-medium text-green-700">Account verified</span>
                </div>

                <div class="mb-6 space-y-2">
                    <h2 class="text-[24px] md:text-[32px] font-medium text-text-primary">Great! Your Account is All Set</h2>
                    <p class="text-base font-medium text-text-secondary">Get started with Orchit AI. Create a project or explore your dashboard.</p>
                </div>

                <!-- Progress steps -->
                <div class="flex items-center gap-1 mb-8">
                    <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-1">
                        <div class="flex items-center gap-1.5">
                            <div class="w-5 h-5 rounded-full bg-accent-hover flex items-center justify-center">
                                <svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span class="text-xs font-medium text-accent-hover">{{ step }}</span>
                        </div>
                        <div v-if="i < steps.length - 1" class="w-6 h-px bg-purple-300 mx-1"></div>
                    </div>
                </div>

                <!-- Feature cards -->
                <div class="grid grid-cols-3 gap-2.5 mb-6">
                    <div v-for="feature in features" :key="feature.title"
                        class="bg-bg-card border border-border rounded-xl p-3.5 cursor-pointer hover:border-accent-hover transition-all hover:-translate-y-0.5">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" :class="feature.iconBg">
                            <i :class="[feature.icon, feature.iconColor, 'text-md']"></i>
                        </div>
                        <p class="text-sm font-semibold text-primary mb-1">{{ feature.title }}</p>
                        <p class="text-xs text-secondary leading-relaxed">{{ feature.desc }}</p>
                    </div>
                </div>

                <Button size="lg" :block="true" @click="register">Explore Home</Button>

                <div class="flex items-center gap-2.5 my-3">
                    <div class="flex-1 h-px bg-gray-200"></div>
                    <span class="text-xs text-secondary font-medium">OR</span>
                    <div class="flex-1 h-px bg-gray-200"></div>
                </div>

                <Button size="lg" :block="true" @click="createWS" variant="secondary">Let's Start Creating Your First WorkSpace</Button>
            </div>
        </template>
    </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '../layout/AuthLayout/AuthLayout.vue';
import Button from '../components/ui/Button.vue';
import { useRouter, useRoute } from 'vue-router'
const steps = ['Sign up', 'Verify email', 'Account ready']
const features = [
  { 
    title: 'Dashboard', 
    desc: 'Overview of all your projects', 
    icon: 'fa-regular fa-chart-bar',
    iconBg: 'bg-purple-50', 
    iconColor: 'text-purple-500' 
  },
  { 
    title: 'Workspace', 
    desc: 'Organize your team and flows', 
    icon: 'fa-regular fa-folder',
    iconBg: 'bg-teal-50', 
    iconColor: 'text-teal-600' 
  },
  { 
    title: 'AI Tools', 
    desc: "Explore Orchit's AI features", 
    icon: 'fa-regular fa-lightbulb',
    iconBg: 'bg-amber-50', 
    iconColor: 'text-amber-600' 
  },
]

const router = useRouter()
const route = useRoute()

const COOKIE_KEY = 'auth_session'

function setAuthCookie(data: { token?: string, company_id?: string }) {
  // Read existing cookie
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
  } else if (hostname.endsWith('.streamed.space')) {
    document.cookie = `${COOKIE_KEY}=${value}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
  }

  console.log('🍪 auth_session cookie set:', merged)
}

function register() {
  const type = route.query.type as string

  if (type === 'personal') {
    const encodedUserId = route.query._uid as string
    if (encodedUserId) {
      const userId = atob(encodedUserId.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
      localStorage.setItem('user_id', userId)
    }
    router.push({ path: '/dashboard', query: { welcome: '1' } })
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

  // ✅ Decode token
  let token = encodedToken
  try {
    if (!encodedToken.startsWith('eyJ')) {
      token = atob(encodedToken.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
    }
  } catch (e) {
    console.error('❌ Token decode failed:', e)
    return
  }

  // ✅ Decode company_id
  let companyId = encodedCompanyId
  try {
    companyId = atob(encodedCompanyId.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
  } catch (e) {
    console.error('❌ company_id decode failed:', e)
    return
  }

  console.log('✅ Token decoded:', !!token)
  console.log('✅ company_id decoded:', companyId)

  // ✅ Save both in shared cookie — accessible on ALL subdomains
  setAuthCookie({ token, company_id: companyId })

  const isLocalhost = window.location.hostname === 'localhost'

  const buildUrl = (base: string) => {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    // ✅ Only pass _auth in URL — company_id comes from cookie
    return `${cleanBase}/dashboard?welcome=1&_auth=${encodedToken}`
  }

  if (isLocalhost) {
    const port = window.location.port ? `:${window.location.port}` : ''
    window.location.href = `http://custom.localhost${port}/dashboard?welcome=1&_auth=${encodedToken}`
  } else if (domainLink) {
    window.location.href = buildUrl(domainLink)
  } else {
    router.push({ path: '/dashboard', query: { welcome: '1' } })
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
    query: { _auth: encodedToken, domainLink, _cid: encodedCompanyId, _uid: encodedUserId, type }
  })
}
</script>