<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useCompanyJoinRegister, useCompanyJoinSendOtp, useCompanyJoinVerifyOtp } from '../../queries/useCommon'
import { useInvitedSpace } from '../../queries/useWorkspace'
/* -------------------------------------------------------------------------- */
/*  Setup                                                                     */
/* -------------------------------------------------------------------------- */
const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const token = route.params.token as string
const { data, error: queryError } = useInvitedSpace(token)
type Step = 'loading' | 'form' | 'otp' | 'joining' | 'error'
const step = ref<Step>('loading')

const error       = ref<string | null>(null)
const errorDetail = ref<string | null>(null)

/* -------------------------------------------------------------------------- */
/*  Invite info                                                               */
/* -------------------------------------------------------------------------- */
const companyName = ref<string>('your workspace')
const domain      = ref<string>('')
const lockedLocal = ref<string | null>(null)

watch(
  [() => data.value, () => queryError?.value],
  ([newVal, err]) => {
    if (err) {
      step.value = 'error'
      error.value = 'Invalid invitation link'
      errorDetail.value = (err as any)?.message || 'We could not fetch details for this invitation token.'
      return
    }

    if (newVal) {
      const inviteData = newVal.data || newVal

      // Check if invite is expired
      if (inviteData?.is_expired || inviteData?.is_expire) {
        step.value = 'error'
        error.value = 'Invitation link expired'
        errorDetail.value = 'This invitation has already expired. Please request a new invite link from your company administrator.'
        return
      }

      // Check if invite is accepted
      if (inviteData?.status === 'accepted') {
        step.value = 'error'
        error.value = 'Invitation already accepted'
        errorDetail.value = 'You have already accepted this invitation. Please log in to your account to access the workspace.'
        return
      }

      // Set companyName
      if (inviteData?.company?.title) {
        companyName.value = inviteData.company.title
      } else if (inviteData?.workspace?.name) {
        companyName.value = inviteData.workspace.name
      }

      // Set domain to the invitee's email domain because they must sign up with that domain
      if (inviteData?.email) {
        const emailVal = inviteData.email.trim()
        const parts = emailVal.split('@')
        domain.value = parts[1] || ''
        emailLocal.value = parts[0] || ''
        lockedLocal.value = parts[0] || '' // Locks the prefix so they can only submit the exact email invited
      }

      // Pre-fill full name if available in invite data
      if (inviteData?.name && !name.value) {
        name.value = inviteData.name
      }

      step.value = 'form'
    }
  },
  { immediate: true }
)

/* -------------------------------------------------------------------------- */
/*  Form state                                                                */
/* -------------------------------------------------------------------------- */
const name            = ref('')
const emailLocal      = ref('')
const password        = ref('')
const confirmPassword = ref('')

const showPassword        = ref(false)
const showConfirmPassword = ref(false)

const submitting = ref(false)

const fullEmail = computed(() =>
  emailLocal.value && domain.value ? `${emailLocal.value.trim()}@${domain.value}` : emailLocal.value.trim()
)

const passwordStrength = computed(() => {
  const v = password.value
  let s = 0
  if (v.length >= 8) s++
  if (/[A-Z]/.test(v)) s++
  if (/[0-9]/.test(v)) s++
  if (/[^A-Za-z0-9]/.test(v)) s++
  return s
})

const strengthLabel = computed(
  () => ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength.value]
)

const errors = ref<Record<string, string>>({})

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!name.value.trim() || name.value.trim().length < 2)
    e.name = 'Please enter your full name.'
  if (!emailLocal.value.trim())
    e.email = domain.value ? 'Enter the part before @' + domain.value : 'Please enter your email.'
  else if (domain.value && !/^[a-zA-Z0-9._%+-]+$/.test(emailLocal.value.trim()))
    e.email = 'Only letters, numbers and . _ % + - are allowed.'
  if (password.value.length < 8)
    e.password = 'Password must be at least 8 characters.'
  else if (passwordStrength.value < 2)
    e.password = 'Use a mix of letters, numbers or symbols.'
  if (confirmPassword.value !== password.value)
    e.confirmPassword = 'Passwords do not match.'
  errors.value = e
  return Object.keys(e).length === 0
}

watch([name, emailLocal, password, confirmPassword], () => {
  if (Object.keys(errors.value).length) validate()
})

/* -------------------------------------------------------------------------- */
/*  OTP state                                                                 */
/* -------------------------------------------------------------------------- */
const OTP_LENGTH = 5
const otp        = ref<string[]>(Array(OTP_LENGTH).fill(''))
const otpRefs    = ref<HTMLInputElement[]>([])
const otpError   = ref<string | null>(null)
const verifying  = ref(false)

const resendCooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

function startCooldown(seconds = 30) {
  resendCooldown.value = seconds
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

function onOtpInput(i: number, ev: Event) {
  const target = ev.target as HTMLInputElement
  const val = target.value.replace(/\D/g, '').slice(-1)
  otp.value[i] = val
  target.value = val
  if (val && i < OTP_LENGTH - 1) otpRefs.value[i + 1]?.focus()
  otpError.value = null
}

function onOtpKeydown(i: number, ev: KeyboardEvent) {
  if (ev.key === 'Backspace' && !otp.value[i] && i > 0) {
    otpRefs.value[i - 1]?.focus()
  } else if (ev.key === 'ArrowLeft' && i > 0) {
    otpRefs.value[i - 1]?.focus()
  } else if (ev.key === 'ArrowRight' && i < OTP_LENGTH - 1) {
    otpRefs.value[i + 1]?.focus()
  }
}

function onOtpPaste(ev: ClipboardEvent) {
  const text = ev.clipboardData?.getData('text')?.replace(/\D/g, '') ?? ''
  if (!text) return
  ev.preventDefault()
  for (let i = 0; i < OTP_LENGTH; i++) otp.value[i] = text[i] ?? ''
  const lastIdx = Math.min(text.length, OTP_LENGTH) - 1
  otpRefs.value[lastIdx >= 0 ? lastIdx : 0]?.focus()
}

const otpComplete = computed(() => otp.value.every((c) => c !== ''))

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                 */
/* -------------------------------------------------------------------------- */
const { mutateAsync: registerUser }  = useCompanyJoinRegister(token)
const { mutateAsync: sendOtp }       = useCompanyJoinSendOtp(token)
const { mutateAsync: verifyOtp }     = useCompanyJoinVerifyOtp(token)

/* -------------------------------------------------------------------------- */
/*  Actions                                                                   */
/* -------------------------------------------------------------------------- */
async function onSubmitForm() {
  if (!validate()) return
  submitting.value = true
  try {
    await registerUser({
      u_full_name: name.value.trim(),
      u_email:     fullEmail.value,
      u_password:  password.value,
    })

    // After successful registration, send OTP to the registered email
    await sendOtp({ u_email: fullEmail.value })

    step.value = 'otp'
    startCooldown(30)
    await nextTick()
    otpRefs.value[0]?.focus()
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? 'Could not create your account. Please try again.'
    if (/email/i.test(msg)) errors.value.email = msg
    else errors.value._global = msg
  } finally {
    submitting.value = false
  }
}

async function onVerifyOtp() {
  if (!otpComplete.value || verifying.value) return
  verifying.value = true
  otpError.value  = null
  try {
    const data = await verifyOtp({
      u_email: fullEmail.value,
      otp:     otp.value.join(''),
    })

    const authToken   = (data as any)?.data?.token
    const companyId   = (data as any)?.data?.company?.id ?? (data as any)?.data?.company?._id
    const redirectUrl = (data as any)?.data?.redirect_url

    if (authToken) localStorage.setItem('token', authToken)
    if (companyId) authStore.setCompany(companyId)
    if (authToken && companyId) saveAuthForSubdomain(authToken, companyId)

    step.value = 'joining'

    if (redirectUrl) {
      window.location.href = `${redirectUrl}/dashboard`
      return
    }

    await authStore.bootstrap()
    router.push('/dashboard')
  } catch (err: any) {
    otpError.value = err?.response?.data?.message ?? 'Invalid or expired code. Please try again.'
    otp.value = Array(OTP_LENGTH).fill('')
    await nextTick()
    otpRefs.value[0]?.focus()
  } finally {
    verifying.value = false
  }
}

async function onResendOtp() {
  if (resendCooldown.value > 0) return
  try {
    await sendOtp({ u_email: fullEmail.value })
    startCooldown(30)
  } catch (err: any) {
    otpError.value = err?.response?.data?.message ?? 'Could not resend the code.'
  }
}

function saveAuthForSubdomain(token: string, companyId: string) {
  const maxAge  = 60 * 60 * 24 * 30
  const session = JSON.stringify({ token, company_id: companyId })
  const value   = encodeURIComponent(session)
  const hostname = window.location.hostname

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    document.cookie = `auth_session=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
  } else {
    document.cookie = `auth_session=${value}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
  }
}

function goToLogin() {
  router.push({ path: '/login', query: { redirect: `/company-join/${token}` } })
}

function backToForm() {
  step.value = 'form'
  otp.value  = Array(OTP_LENGTH).fill('')
  otpError.value = null
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-10"
    style="background: var(--bg-surface, #f5f5f5);">

    <div class="w-full max-w-xl rounded-2xl border p-8 md:p-10 space-y-5"
      style="background: var(--bg-card); border-color: var(--border);">

      <!-- Logo -->
      <div class="w-13 h-13 rounded-[14px] border flex items-center justify-center mx-auto"
        style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.2);">
        <img src="/src/assets/global/favicon.png" alt="logo" class="w-7 h-7" />
      </div>

      <!-- ── LOADING ── -->
      <template v-if="step === 'loading'">
        <div class="text-center space-y-4">
          <div class="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin mx-auto"
            style="border-color: var(--border); border-top-color: var(--accent);" />
          <h1 class="text-xl font-medium" style="color: var(--text-primary);">
            Checking your invite...
          </h1>
          <p class="text-sm" style="color: var(--text-secondary);">
            Please wait while we verify your link.
          </p>
        </div>
      </template>

      <!-- ── JOINING ── -->
      <template v-else-if="step === 'joining'">
        <div class="text-center space-y-4">
          <div class="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin mx-auto"
            style="border-color: var(--border); border-top-color: var(--accent);" />
          <h1 class="text-xl font-medium" style="color: var(--text-primary);">
            Joining workspace...
          </h1>
          <p class="text-sm" style="color: var(--text-secondary);">
            Setting up your access. This only takes a moment.
          </p>
        </div>
      </template>

      <!-- ── REGISTRATION FORM ── -->
      <template v-else-if="step === 'form'">
        <div class="text-center space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
            style="background: var(--bg-lavender); color: var(--accent); border: 1px solid rgba(125,104,200,0.2);">
            <span class="w-1.5 h-1.5 rounded-full" style="background: var(--accent);" />
            You've been invited
          </div>
          <h1 class="text-[22px] font-medium" style="color: var(--text-primary);">
            Join {{ companyName }}
          </h1>
          <p class="text-sm" style="color: var(--text-secondary);">
            Create your account to start collaborating with your team.
          </p>
        </div>

        <form class="space-y-4" novalidate @submit.prevent="onSubmitForm">
          <!-- Name -->
          <div class="space-y-1.5">
            <label for="name" class="block text-xs font-medium" style="color: var(--text-secondary);">
              Full name
            </label>
            <input
              id="name"
              v-model="name"
              type="text"
              autocomplete="name"
              placeholder="e.g. Sarah Khan"
              class="w-full h-11 px-3.5 rounded-[10px] text-sm border outline-none transition-all"
              :class="errors.name ? 'ring-1 ring-red-400' : ''"
              style="background: var(--bg-surface); border-color: var(--border); color: var(--text-primary);"
            />
            <p v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</p>
          </div>

          <!-- Email — split input when domain is known, plain input otherwise -->
          <div class="space-y-1.5">
            <label for="emailLocal" class="block text-xs font-medium" style="color: var(--text-secondary);">
              Work email
            </label>

            <!-- Split input: username + @domain -->
            <div v-if="domain"
              class="flex items-stretch rounded-[10px] border overflow-hidden"
              :class="errors.email ? 'ring-1 ring-red-400' : ''"
              style="background: var(--bg-surface); border-color: var(--border);">
              <input
                id="emailLocal"
                v-model="emailLocal"
                type="text"
                autocomplete="email"
                spellcheck="false"
                :readonly="!!lockedLocal"
                placeholder="your.name"
                class="flex-1 min-w-0 h-11 px-3.5 text-sm outline-none bg-transparent"
                style="color: var(--text-primary);"
              />
              <div class="flex items-center px-3 text-sm select-none border-l"
                style="background: var(--bg-lavender); color: var(--accent); border-color: var(--border);">
                @{{ domain }}
              </div>
            </div>

            <!-- Plain email input when no domain is set -->
            <input
              v-else
              id="emailLocal"
              v-model="emailLocal"
              type="email"
              autocomplete="email"
              spellcheck="false"
              placeholder="e.g. sarah@company.com"
              class="w-full h-11 px-3.5 rounded-[10px] text-sm border outline-none transition-all"
              :class="errors.email ? 'ring-1 ring-red-400' : ''"
              style="background: var(--bg-surface); border-color: var(--border); color: var(--text-primary);"
            />

            <p v-if="errors.email" class="text-xs text-red-500">{{ errors.email }}</p>
            <p v-else-if="lockedLocal" class="text-xs" style="color: var(--text-secondary);">
              This invite is for {{ fullEmail }}.
            </p>
          </div>

          <!-- Password -->
          <div class="space-y-1.5">
            <label for="password" class="block text-xs font-medium" style="color: var(--text-secondary);">
              Password
            </label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                class="w-full h-11 pl-3.5 pr-11 rounded-[10px] text-sm border outline-none"
                :class="errors.password ? 'ring-1 ring-red-400' : ''"
                style="background: var(--bg-surface); border-color: var(--border); color: var(--text-primary);"
              />
              <button type="button" tabindex="-1"
                class="absolute inset-y-0 right-0 flex items-center px-3"
                style="color: var(--text-secondary);"
                @click="showPassword = !showPassword">
                <svg v-if="showPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.58 10.58a2 2 0 102.83 2.83"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9 7 9 7a17.45 17.45 0 01-4.23 5.17M6.61 6.61C3.73 8.57 2 12 2 12a17.73 17.73 0 003.66 4.59"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>

            <!-- Strength meter -->
            <div v-if="password" class="flex items-center gap-2 pt-1">
              <div class="flex-1 flex gap-1">
                <span v-for="i in 4" :key="i"
                  class="h-1 flex-1 rounded-full transition-all"
                  :style="{
                    background: i <= passwordStrength
                      ? (passwordStrength >= 3 ? '#1d9e75' : passwordStrength === 2 ? '#d99a2b' : '#e55050')
                      : 'var(--border)'
                  }" />
              </div>
              <span class="text-[11px] font-medium" style="color: var(--text-secondary);">
                {{ strengthLabel }}
              </span>
            </div>
            <p v-if="errors.password" class="text-xs text-red-500">{{ errors.password }}</p>
          </div>

          <!-- Confirm Password -->
          <div class="space-y-1.5">
            <label for="confirmPassword" class="block text-xs font-medium" style="color: var(--text-secondary);">
              Confirm password
            </label>
            <div class="relative">
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Re-enter password"
                class="w-full h-11 pl-3.5 pr-11 rounded-[10px] text-sm border outline-none"
                :class="errors.confirmPassword ? 'ring-1 ring-red-400' : ''"
                style="background: var(--bg-surface); border-color: var(--border); color: var(--text-primary);"
              />
              <button type="button" tabindex="-1"
                class="absolute inset-y-0 right-0 flex items-center px-3"
                style="color: var(--text-secondary);"
                @click="showConfirmPassword = !showConfirmPassword">
                <svg v-if="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10.58 10.58a2 2 0 102.83 2.83"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9 7 9 7a17.45 17.45 0 01-4.23 5.17M6.61 6.61C3.73 8.57 2 12 2 12a17.73 17.73 0 003.66 4.59"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <p v-if="errors.confirmPassword" class="text-xs text-red-500">{{ errors.confirmPassword }}</p>
          </div>

          <p v-if="errors._global" class="text-sm text-red-500 text-center">{{ errors._global }}</p>

          <button type="submit" :disabled="submitting"
            class="w-full h-11 rounded-[10px] text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            style="background: var(--accent); color: var(--accent-text);">
            <span v-if="submitting" class="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style="border-color: var(--accent-text);" />
            {{ submitting ? 'Creating account...' : 'Continue' }}
          </button>

          <p class="text-xs text-center" style="color: var(--text-secondary);">
            Already have an account?
            <button type="button" class="font-medium" style="color: var(--accent);" @click="goToLogin">
              Log in
            </button>
          </p>
        </form>
      </template>

      <!-- ── OTP STEP ── -->
      <template v-else-if="step === 'otp'">
        <div class="text-center space-y-2">
          <div class="w-13 h-13 rounded-full flex items-center justify-center mx-auto"
            style="background: var(--bg-lavender); border: 1px solid rgba(125,104,200,0.2);">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16v12H4z M4 6l8 7 8-7" stroke="currentColor"
                stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"
                style="color: var(--accent);" />
            </svg>
          </div>
          <h1 class="text-[22px] font-medium" style="color: var(--text-primary);">
            Enter verification code
          </h1>
          <p class="text-sm" style="color: var(--text-secondary);">
            We've sent a 5-digit code to
            <span class="font-medium" style="color: var(--text-primary);">{{ fullEmail }}</span>
          </p>
        </div>

        <div class="flex justify-between gap-2" @paste="onOtpPaste">
          <input
            v-for="(_, i) in otp"
            :key="i"
            :ref="(el) => { if (el) otpRefs[i] = el as HTMLInputElement }"
            :value="otp[i]"
            type="text"
            inputmode="numeric"
            maxlength="1"
            class="w-11 h-13 text-center text-lg font-medium rounded-[10px] border outline-none transition-all focus:ring-2"
            :class="otpError ? 'ring-1 ring-red-400' : ''"
            style="background: var(--bg-surface); border-color: var(--border); color: var(--text-primary);"
            @input="onOtpInput(i, $event)"
            @keydown="onOtpKeydown(i, $event)"
          />
        </div>

        <p v-if="otpError" class="text-xs text-red-500 text-center">{{ otpError }}</p>

        <button type="button" :disabled="!otpComplete || verifying"
          class="w-full h-11 rounded-[10px] text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          style="background: var(--accent); color: var(--accent-text);"
          @click="onVerifyOtp">
          <span v-if="verifying" class="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
            style="border-color: var(--accent-text);" />
          {{ verifying ? 'Verifying...' : 'Verify & join' }}
        </button>

        <div class="flex items-center justify-between text-xs" style="color: var(--text-secondary);">
          <button type="button" class="font-medium hover:underline" @click="backToForm">
            ← Edit details
          </button>
          <button type="button" :disabled="resendCooldown > 0"
            class="font-medium disabled:opacity-50"
            :style="resendCooldown > 0 ? '' : 'color: var(--accent);'"
            @click="onResendOtp">
            {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code' }}
          </button>
        </div>
      </template>

      <!-- ── ERROR ── -->
      <template v-else-if="step === 'error'">
        <div class="text-center space-y-5">
          <div class="w-13 h-13 rounded-full flex items-center justify-center mx-auto"
            style="background: rgba(229,80,80,0.1); border: 1px solid rgba(229,80,80,0.2);">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="#e55050" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                stroke="#e55050" stroke-width="1.6"/>
            </svg>
          </div>

          <h1 class="text-xl font-medium" style="color: var(--text-primary);">{{ error }}</h1>

          <div v-if="errorDetail" class="rounded-xl border px-4 py-3 text-left"
            style="background: var(--bg-surface); border-color: var(--border);">
            <div class="text-xs mb-1" style="color: var(--text-secondary);">Error details</div>
            <div class="text-sm" style="color: var(--text-primary);">{{ errorDetail }}</div>
          </div>

          <button @click="goToLogin"
            class="w-full h-11 rounded-[10px] text-sm font-medium border"
            style="border-color: var(--border); color: var(--text-secondary);">
            Back to log in
          </button>
        </div>
      </template>
    </div>
  </div>
</template>