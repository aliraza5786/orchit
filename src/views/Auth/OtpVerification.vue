<template>
    <AuthLayout>
      <template #form>
        <div class="max-w-[496px] md:mx-auto w-full">
          <div class="mb-12 space-y-2">
            <h2 class="text-[32px] font-medium text-center text-text-primary" v-once>Enter Verification Code</h2>
            <p class="text-base sm:text-nowrap font-medium text-text-secondary text-center" v-once>
              We sent a five-digit code to your email <span class="font-bold">({{ email }})</span>.
            </p>
          </div>
  
          <form @submit.prevent class="space-y-4 w-full">
            <!-- OTP Inputs -->
            <div class="flex justify-center gap-2 sm:gap-4 pb-4">
              <input
                v-for="(_, index) in DIGITS"
                :key="index"
                :ref="(el) => setDigitRef(el, index)" 
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="1"
                autocomplete="one-time-code"
                enterkeyhint="done"
                class="w-full aspect-square text-3xl sm:text-5xl p-1 md:p-2 font-bold text-center border rounded-lg focus:outline-none"
                :class="[
                  'border-accent',
                  otpError ? 'border-red-500' : '',
                  isVerifying ? 'opacity-60 pointer-events-none' : ''
                ]"
                :value="code[index]"
                @keydown="handleKey(index, $event)"
                @paste.prevent="handlePaste(index, $event)"
                @input="handleInput(index, $event)"
                @focus="selectOnFocus"
              />
            </div>
  
            <Button :disabled="isVerifying" size="lg" :block="true" @click="verifyCode">
              {{ isVerifying ? 'Verifying...' : 'Verify' }}
            </Button>
  
            <p v-if="otpError" class="text-red-500 text-sm text-center mt-2">{{ otpError }}</p>
  
            <!-- Resend -->
            <p class="text-sm font-medium text-text-secondary text-center">
              Didn't receive an email? Try checking your junk folder.
              <span
                class="text-text-primary font-bold underline"
                :class="cooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'"
                role="button"
                :aria-disabled="cooldown > 0 || isResending"
                @click="cooldown === 0 && !isResending && resendCode()"
              >
                {{ cooldown > 0 ? `Resend in ${cooldownLabel}` : (isResending ? 'Resending...' : 'Resend code') }}
              </span>
            </p>
  
            <p v-if="successMessage" class="text-green-600 text-sm text-center mt-2">{{ successMessage }}</p>
            <p v-if="resendErrorMsg" class="text-red-500 text-sm text-center mt-2">Failed to resend OTP. Please try again.</p>
          </form>
        </div>
      </template>
    </AuthLayout>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { useMutation } from '@tanstack/vue-query'
  import { useRouter, useRoute } from 'vue-router'
  import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
  import Button from '../../components/ui/Button.vue'
  import { verifyOtp, resendOtp } from '../../services/auth'
  import { useAuthStore } from '../../stores/auth'
  import type { ComponentPublicInstance } from 'vue'

  defineOptions({ name: 'OtpVerify' })
  const authStore = useAuthStore()
  // ---- Constants (non-reactive) ----
  const DIGITS = 5
  const INITIAL_COOLDOWN = 45 // seconds
  const digitRefs = ref<(HTMLInputElement | null)[]>(Array.from({ length: DIGITS }, () => null))

  // ---- Router & email ----
  const router = useRouter()
  const route = useRoute()
  const email = ref<string>((route.params.email as string) || '')
  
  // ---- OTP state ----
  const code = ref<string[]>(Array.from({ length: DIGITS }, () => ''))
  const otpError = ref('')
  const successMessage = ref('')
  let successClearTimer: number | undefined
  
  // ---- Input refs (stable collector) ----
  function setDigitRef(
  el: Element | ComponentPublicInstance | null,
  index: number
) {
  // Narrow the DOM element type
  digitRefs.value[index] = el instanceof HTMLInputElement ? el : null
}

// (optional) helper if you prefer a function for focusing
function focusIdx(i: number) {
  digitRefs.value[i]?.focus()
}
  
  // ---- Derived flags ----
  const isCodeComplete = computed(() => code.value.every((c) => c.length === 1))
  
  // ---- Verify mutation (async to avoid re-created callbacks) ----
  const { mutateAsync: verifyAsync, isPending: isVerifying } = useMutation({ mutationFn: verifyOtp })
  
  async function verifyCode() {
    otpError.value = ''
  
    if (!isCodeComplete.value) {
      otpError.value = 'Please enter the complete 5-digit code.'
      return
    }
  
    try {
      const fullCode = code.value.join('')
      const data = await verifyAsync({ u_email: email.value, otp: fullCode })
      localStorage.setItem('token', data?.data?.token)
      await authStore.bootstrap()
      
      const intentStr = localStorage.getItem('post_auth_intent');
      if (intentStr) {
        try {
          const intent = JSON.parse(intentStr);
          localStorage.removeItem('post_auth_intent');
          if (intent.aiResponse) {
            const workspaceStore = (await import('../../stores/workspace')).useWorkspaceStore();
            workspaceStore.setWorkspace(intent.aiResponse);
          }
          router.push(intent.path || "/dashboard");
          return;
        } catch (e) {
          console.error("Failed to parse post_auth_intent", e);
          localStorage.removeItem('post_auth_intent');
        }
      }

      router.push('/create-profile')
    } catch (err: any) {
      otpError.value = err?.response?.data?.message || 'Invalid code, please try again.'
    }
  }
  
 
  function handleKey(index: number, e: KeyboardEvent) {
    const { key } = e
    if (/^[0-9]$/.test(key)) {
      code.value[index] = key
      otpError.value && (otpError.value = '')
      e.preventDefault()
      if (index < DIGITS - 1) focusIdx(index + 1)
    } else if (key === 'Backspace') {
      if (code.value[index]) {
        code.value[index] = ''
        otpError.value && (otpError.value = '')
      } else if (index > 0) {
        focusIdx(index - 1)
      }
    } else if (key === 'ArrowLeft' && index > 0) {
      focusIdx(index - 1)
    } else if (key === 'ArrowRight' && index < DIGITS - 1) {
      focusIdx(index + 1)
    }
  }
  
  function distribute(value: string, startIndex = 0) {
    const digits = value.replace(/\D/g, '').slice(0, DIGITS - startIndex)
    if (!digits) return
    for (let i = 0; i < digits.length; i++) code.value[startIndex + i] = digits[i]
    const next = Math.min(startIndex + digits.length, DIGITS - 1)
    focusIdx(next)
    otpError.value && (otpError.value = '')
  }
  
  function handlePaste(index: number, e: ClipboardEvent) {
    distribute(e.clipboardData?.getData('text') ?? '', index)
  }
  
  function handleInput(index: number, e: Event) {
    const el = e.target as HTMLInputElement
    const sanitized = (el.value || '').replace(/\D/g, '')
    if (sanitized.length <= 1) {
      code.value[index] = sanitized
      if (sanitized && index < DIGITS - 1) focusIdx(index + 1)
    } else {
      distribute(sanitized, index)
    }
    // keep DOM in sync (avoid multi-char lingering)
    el.value = code.value[index] ?? ''
    otpError.value && (otpError.value = '')
  }
  
  function selectOnFocus(e: FocusEvent) {
    const el = e.target as HTMLInputElement
    // small delay improves mobile UX
    setTimeout(() => el.select(), 0)
  }
  
  // ---- Cooldown timer ----
  const cooldown = ref<number>(INITIAL_COOLDOWN)
  let cooldownTimer: number | undefined
  
  function clearCooldownTimer() {
    if (cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = undefined
    }
  }
  function startCooldown() {
    clearCooldownTimer()
    cooldown.value = INITIAL_COOLDOWN
    cooldownTimer = window.setInterval(() => {
      if (cooldown.value > 0) cooldown.value -= 1
      if (cooldown.value === 0) clearCooldownTimer()
    }, 1000)
  }
  
  const cooldownLabel = computed(() => {
    const mm = Math.floor(cooldown.value / 60).toString().padStart(2, '0')
    const ss = (cooldown.value % 60).toString().padStart(2, '0')
    return `${mm}:${ss}`
  })
  
  // ---- Resend mutation ----
  const {
    mutateAsync: resendAsync,
    isPending: isResending,
    error: resendErrObj,
    reset: resetResendStatus,
  } = useMutation({ mutationFn: resendOtp })
  
  const resendErrorMsg = computed(() => (resendErrObj?.value ? '1' : '')) // truthy flag for template
  
  async function resendCode() {
    otpError.value = ''
    resetResendStatus()
  
    if (!email.value) {
      otpError.value = 'Email not found. Please login again.'
      return
    }
  
    try {
      await resendAsync({ u_email: email.value })
      successMessage.value = 'A new code has been sent to your email.'
      // clear success after 4s without a global watch
      if (successClearTimer) clearTimeout(successClearTimer)
      successClearTimer = window.setTimeout(() => (successMessage.value = ''), 4000)
      startCooldown()
    } catch (err: any) {
      otpError.value = err?.response?.data?.message || 'Failed to resend code.'
    }
  }
  
  // ---- Mount / Unmount ----
  onMounted(() => {
    // autofocus first input once the DOM is ready
    setTimeout(() => focusIdx(0), 0)
    startCooldown()
  })
  onUnmounted(() => {
    clearCooldownTimer()
    if (successClearTimer) clearTimeout(successClearTimer)
  })
  </script>
  