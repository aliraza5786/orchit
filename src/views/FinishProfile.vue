<template>
    <AuthLayout>
        <template #form>
            <div class="max-w-[500px] mx-auto w-full min-h-full py-5 flex flex-col justify-center">
                <div class="mb-12 space-y-2">
                    <h2 class="text-[24px] md:text-[32px] font-medium text-text-primary">Great! Your Account is All Set</h2>
                    <p class="text-base font-medium text-text-secondary">Get started with
                        Orchit AI. Create a project or explore your dashboard.
                    </p>
                </div>
                <Button size="lg" :block="true" @click="register">Explore Home</Button>
                <Button size="lg" :block="true" @click="createWS" variant="secondary" class="mt-4">Let's Start
                    Creating Your First WorkSpace</Button>
            </div>
        </template>
    </AuthLayout>
</template>

<script setup lang="ts">
import AuthLayout from '../layout/AuthLayout/AuthLayout.vue';
import Button from '../components/ui/Button.vue';
import { useRouter, useRoute } from 'vue-router'

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