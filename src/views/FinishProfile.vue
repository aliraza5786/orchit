<template>
    <AuthLayout>
        <template #form>
            <div class="max-w-[500px] mx-auto w-full min-h-full py-5 flex flex-col justify-center">
                <div class="mb-12 space-y-2">
                    <h2 class="text-[24px] md:text-[32px] font-medium text-text-primary">Great! Your Account is All Set</h2>
                    <p class="text-base  font-medium text-text-secondary ">Get started with
                        Orchit AI. Create a project or explore your dashboard.
                    </p>
                </div>
                <Button size="lg" :block="true" @click="register"> Explore Home</Button>
                <Button size="lg" :block="true" @click="createWS" variant="secondary" class="mt-4"> Let’s Start
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

const cookieCompanyId = document.cookie
  .split('; ')
  .find(row => row.startsWith('company_id='))
  ?.split('=')[1]
console.log("company id from cookie:", cookieCompanyId)
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
  const domainLink = route.query.domainLink as string
  const rawCid = route.query._cid as string

  if (!rawCid) {
    console.error('❌ No _cid found in finish-profile URL')
    return
  }

  if (!encodedToken) {
    console.error('❌ No _auth token found in finish-profile URL')
    return
  }

  // ✅ Decode company_id — pass plain ID in URL
  let companyId = ''
  try {
    companyId = atob(rawCid.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
    console.log('✅ company_id decoded:', companyId)
  } catch (e) {
    console.error('❌ Failed to decode _cid:', e)
    return
  }

  const buildUrl = (base: string) => {
    const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base
    return `${cleanBase}/dashboard?welcome=1&_auth=${encodedToken}&company_id=${companyId}`
  }

  const isLocalhost = window.location.hostname === 'localhost'

  if (isLocalhost) {
    const port = window.location.port ? `:${window.location.port}` : ''
    window.location.href = `http://custom.localhost${port}/dashboard?welcome=1&_auth=${encodedToken}&company_id=${companyId}`
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