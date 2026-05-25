<template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[400px] mx-auto w-full">
        <!-- Logo -->
        <router-link to="/">
          <img
            :src="isDark ? darkLogo : lightLogo"
            class="w-[130px] mb-6 d-block mx-auto"
            alt="logo"
          />
        </router-link>

        <div v-if="!emailSent" class="space-y-6">
          <div class="mb-6 text-center animate-slide-up-step-1">
            <h3 class="text-[24px] leading-7 font-medium text-text-primary">Forgot Password?</h3>
            <p class="text-sm text-text-secondary mt-3">Enter your email address and we'll send you instructions to reset your password.</p>
          </div>

          <form @submit.prevent="handleForgotPassword" class="space-y-3 w-full">
            <BaseTextField
              v-model="email"
              placeholder="Email address"
              size="md"
              :error="emailHasError"
              :message="emailError"
              @blur="touched.email = true"
              @update:modelValue="onFieldInput"
              :disabled="isPending"
            />

            <Button :loading="isPending" size="md" :block="true" type="submit">
              Send reset instructions
            </Button>

            <Button
              size="md"
              :block="true"
              appearance="outlined"
              variant="ghost"
              type="button"
              @click="router.push('/login')"
              :disabled="isPending"
            >
              Back to login
            </Button>

            <p v-if="errorMessage" class="text-red-500 text-sm text-center mt-2">
              {{ errorMessage }}
            </p>
          </form>
        </div>

        <div v-else class="text-center space-y-6">
          
          <div class="space-y-3">
            <h3 class="text-[24px] leading-7 font-medium text-text-primary">Check your email</h3>
            <p class="text-sm text-text-secondary mt-1">
              We've sent password reset instructions to<br />
              <strong class="text-text-primary">{{ email }}</strong>
            </p>
          </div>

          <div class="space-y-3">
            <p class="text-xs text-text-secondary">
              Didn't receive the email? Check your spam folder or
            </p>
            <Button
              size="md"
              variant="secondary"
              :block="true"
              :disabled="cooldown > 0 || isPending"
              @click="resendEmail"
            >
              {{ cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email' }}
            </Button>
            <Button
              size="md"
              appearance="outlined"
              variant="ghost"
              :block="true"
              @click="emailSent = false"
            >
              Back
            </Button>
          </div>
        </div>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import Button from '../../components/ui/Button.vue'
import { forgotPassword } from '../../services/auth'
import darkLogo from '@assets/global/dark-logo.png'
import lightLogo from '@assets/global/light-logo.png'
import { useTheme } from '../../composables/useTheme'

defineOptions({ name: 'ForgotPasswordPage' })

const router = useRouter()
const { isDark } = useTheme()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const email = ref('')
const errorMessage = ref('')
const emailSent = ref(false)

const touched = reactive({
  email: false,
})

const emailError = computed(() => {
  if (!touched.email) return ''
  if (!email.value.trim()) return 'Email is required'
  if (!EMAIL_RE.test(email.value)) return 'Invalid email'
  return ''
})
const emailHasError = computed(() => !!emailError.value)

const isFormValid = computed(() => EMAIL_RE.test(email.value))

const { mutateAsync, isPending } = useMutation({ mutationFn: forgotPassword })

const cooldown = ref(0)
let timerInterval: any = null

function startCooldown() {
  cooldown.value = 30
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = setInterval(() => {
    if (cooldown.value > 0) {
      cooldown.value--
    } else {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }, 1000)
}

watch(emailSent, (sent) => {
  if (sent) {
    startCooldown()
  } else {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    cooldown.value = 0
  }
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

function onFieldInput() {
  if (errorMessage.value) errorMessage.value = ''
}

async function handleForgotPassword() {
  errorMessage.value = ''
  touched.email = true

  if (!isFormValid.value) {
    errorMessage.value = 'Please enter a valid email address.'
    return
  }

  try {
    await mutateAsync({ u_email: email.value })
    emailSent.value = true
  } catch (err: any) {
    errorMessage.value = err?.message || 'Failed to send reset email. Please try again.'
  }
}

function resendEmail() {
  emailSent.value = false
  touched.email = false
  handleForgotPassword()
}
</script>

<style scoped>
.icon-container {
  animation: float 4s ease-in-out infinite;
}

.lock-icon {
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.icon-container:hover .lock-icon {
  transform: scale(1.1) rotate(5deg);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.2; }
  50% { transform: scale(1.08); opacity: 0.35; }
}

.animate-slide-up-step-1 {
  animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
