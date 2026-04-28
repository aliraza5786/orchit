<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { joinCompany } from '../../services/auth'
import api from '../../libs/api'

const route  = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const token = route.params.token as string

const isLoading   = ref(true)
const isJoining   = ref(false)
const error       = ref<string | null>(null)
const errorDetail = ref<string | null>(null)

const companyName  = ref<string | null>(null)
const companyType  = ref<'team' | 'school' | null>(null)
const memberCount  = ref<number | null>(null)
const companyId    = ref<string | null>(null)

const steps = ref([
  { label: 'Verifying link',            state: 'active' },
  { label: 'Loading workspace details', state: 'idle'   },
  { label: 'Joining workspace',         state: 'idle'   },
])

// ── Dynamic content based on type ──────────────────────────────
const isSchool = computed(() => companyType.value === 'school')

const content = computed(() => {
  if (isSchool.value) {
    return {
      badge:       "You've been invited to study together",
      title:       'Join your school workspace',
      subtitle:    "You've been invited to join your school or university workspace on Orchit AI.",
      workspaceLabel: 'School workspace',
      memberLabel: 'students',
      perks: [
        'Access to class notes, assignments and research',
        'Collaborate on group projects in real-time',
        'Shared study plans, exam prep and schedules',
      ],
      cta: 'Create account & join school',
    }
  }
  return {
    badge:       "You've been invited",
    title:       'Join your workspace',
    subtitle:    "You've been invited to collaborate on Orchit AI.",
    workspaceLabel: 'Team workspace',
    memberLabel: 'members',
    perks: [
      'Access to all team projects and docs',
      'Collaborate in real-time with your team',
      'Shared goals, tasks and knowledge base',
    ],
    cta: 'Create account & join',
  }
})
// ───────────────────────────────────────────────────────────────

function setStep(index: number, state: 'idle' | 'active' | 'done') {
  steps.value[index].state = state
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function initials(name: string | null) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

onMounted(async () => {
  if (!token) {
    error.value       = 'Invalid invite link.'
    errorDetail.value = 'No token was found in the URL.'
    isLoading.value   = false
    return
  }

  localStorage.setItem('pending_invite_token', token)

  const valid = await validateToken()
  if (!valid) return

  setStep(0, 'done')
  setStep(1, 'active')
  await delay(600)
  setStep(1, 'done')

  isLoading.value = false

  if (authStore.user) {
    await acceptInvite()
  }
})

async function validateToken() {
  try {
    const { data } = await api.get(`/invites/validate/${token}`)
    companyName.value  = data?.company_name  ?? null
    companyType.value  = data?.type          ?? null
    memberCount.value  = data?.member_count  ?? null
    companyId.value    = data?.company_id    ?? null
    return true
  } catch (err: any) {
    error.value       = 'Invite link invalid'
    errorDetail.value = err?.response?.data?.message ?? 'This link may have expired or already been used.'
    isLoading.value   = false
    return false
  }
}

async function acceptInvite() {
  try {
    isJoining.value = true
    setStep(2, 'active')

    const data = await joinCompany(token)
    const id   = data?.company_id ?? data?.data?.company_id
    if (id) authStore.setCompany(id)

    setStep(2, 'done')
    await delay(400)

    localStorage.removeItem('pending_invite_token')
    await authStore.bootstrap()
    router.push('/dashboard')

  } catch (err: any) {
    error.value       = 'Could not join workspace'
    errorDetail.value = err?.response?.data?.message ?? 'Something went wrong. Please try again.'
    isJoining.value   = false
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

      <!-- ── LOADING ── -->
      <template v-if="isLoading && !error">
        <div class="space-y-4">
          <div class="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin mx-auto"
            style="border-color: var(--border); border-top-color: var(--accent);" />
          <h1 class="text-xl font-medium" style="color: var(--text-primary);">
            Verifying invite link
          </h1>
          <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
            Hang tight while we check your invite and prepare your workspace.
          </p>
        </div>
        <div class="space-y-3 text-left mt-6">
          <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-3">
            <div v-if="step.state === 'done'"
              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style="background: #1d9e75;">
              <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div v-else-if="step.state === 'active'"
              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style="background: var(--bg-lavender); border: 1px solid rgba(125,104,200,0.3);">
              <div class="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                style="border-color: rgba(125,104,200,0.3); border-top-color: var(--accent);" />
            </div>
            <div v-else class="w-7 h-7 rounded-full shrink-0"
              style="background: var(--bg-surface); border: 1px solid var(--border);" />
            <span class="text-sm"
              :style="step.state === 'idle' ? 'color: var(--text-secondary)' : 'color: var(--text-primary)'">
              {{ step.label }}
            </span>
          </div>
        </div>
      </template>

      <!-- ── JOIN PROMPT ── -->
      <template v-else-if="!isJoining && !error">

        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
          style="background: var(--bg-lavender); color: var(--accent); border: 1px solid rgba(125,104,200,0.2);">
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--accent);" />
          {{ content.badge }}
        </div>

        <h1 class="text-[22px] font-medium" style="color: var(--text-primary);">
          {{ content.title }}
        </h1>
        <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
          {{ content.subtitle }}
        </p>

        <!-- Workspace card -->
        <div v-if="companyName"
          class="flex items-center gap-3 rounded-xl border px-4 py-3 text-left"
          style="background: var(--bg-surface); border-color: var(--border);">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-medium text-white"
            style="background: var(--accent);">
            {{ initials(companyName) }}
          </div>
          <div>
            <div class="text-sm font-medium" style="color: var(--text-primary);">
              {{ companyName }}
            </div>
            <div class="text-xs mt-0.5" style="color: var(--text-secondary);">
              {{ content.workspaceLabel }}
              <span v-if="memberCount"> · {{ memberCount }} {{ content.memberLabel }}</span>
            </div>
          </div>
        </div>

        <!-- Perks -->
        <div class="space-y-2.5 text-left">
          <div v-for="perk in content.perks" :key="perk"
            class="flex items-center gap-2.5 text-sm"
            style="color: var(--text-primary);">
            <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style="background: rgba(29,158,117,0.12);">
              <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            {{ perk }}
          </div>
        </div>

        <!-- CTAs: logged in -->
        <template v-if="authStore.user">
          <button @click="acceptInvite"
            class="w-full py-3 rounded-[10px] text-sm font-medium transition-all"
            style="background: var(--accent); color: var(--accent-text);">
            Accept invite
          </button>
        </template>

        <!-- CTAs: logged out -->
        <template v-else>
          <button @click="goToRegister"
            class="w-full py-3 rounded-[10px] text-sm font-medium"
            style="background: var(--accent); color: var(--accent-text);">
            {{ content.cta }}
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
        </template>

        <p class="text-xs" style="color: var(--text-tertiary, #9ca3af);">
          By joining, you agree to Orchit AI's terms of service and privacy policy.
        </p>
      </template>

      <!-- ── JOINING ── -->
      <template v-else-if="isJoining && !error">
        <div class="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin mx-auto"
          style="border-color: var(--border); border-top-color: var(--accent);" />
        <h1 class="text-xl font-medium" style="color: var(--text-primary);">
          Joining {{ companyName ?? 'workspace' }}...
        </h1>
        <p class="text-sm" style="color: var(--text-secondary);">
          Setting up your access. This only takes a moment.
        </p>
        <div class="space-y-3 text-left mt-4">
          <div v-for="(step, i) in steps" :key="i" class="flex items-center gap-3">
            <div v-if="step.state === 'done'"
              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style="background: #1d9e75;">
              <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </div>
            <div v-else-if="step.state === 'active'"
              class="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
              style="background: var(--bg-lavender); border: 1px solid rgba(125,104,200,0.3);">
              <div class="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                style="border-color: rgba(125,104,200,0.3); border-top-color: var(--accent);" />
            </div>
            <div v-else class="w-7 h-7 rounded-full shrink-0"
              style="background: var(--bg-surface); border: 1px solid var(--border);" />
            <span class="text-sm"
              :style="step.state === 'idle' ? 'color: var(--text-secondary)' : 'color: var(--text-primary)'">
              {{ step.label }}
            </span>
          </div>
        </div>
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
          Already have an account? Log in and ask your admin to resend the invite from workspace settings.
        </p>
      </template>

    </div>
  </div>
</template>