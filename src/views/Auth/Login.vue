<template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[500px] md:mx-auto w-full text-text-primary bg-bg-body">
        <h2 class="text-[32px] font-medium mb-12 text-center text-text-primary" v-once>
          Sign in to Orchit AI
        </h2>

        <form @submit.prevent="handleLogin" class="space-y-4 w-full">
          <BaseTextField v-model="email" label="Email" placeholder="Email address" size="lg" :error="emailHasError"
            :message="emailError" @blur="touched.email = true" @update:modelValue="onFieldInput" />

          <BaseTextField v-model="password" label="Password" placeholder="Enter your password" size="lg" type="password"
            :error="passwordHasError" :message="passwordError" @blur="touched.password = true"
            @update:modelValue="onFieldInput" />

          <Button :disabled="submitDisabled" size="lg" :block="true" type="submit">
            {{ submitLabel }}
          </Button>

          <p v-if="errorMessage" class="text-red-500 text-sm text-center mt-2">
            {{ errorMessage }}
          </p>
        </form>

        <p class="text-sm font-medium text-text-secondary text-center mt-6" v-once>
          By signing in, you agree to the
          <span class="text-text-primary font-bold">Privacy Policy</span> and
          <span class="text-text-primary font-bold">Terms of Service</span>.
        </p>

        <p class="text-sm font-medium text-text-secondary text-center mt-8" v-once>
          Don’t have an account?
          <router-link to="/register" class="text-text-primary font-bold underline">Sign up</router-link>
        </p>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import Button from '../../components/ui/Button.vue'
import { login } from '../../services/auth'

defineOptions({ name: 'LoginPage' })

// --- Constants (non-reactive) ---
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// --- State ---
const email = ref('')
const password = ref('')
const errorMessage = ref('')

const touched = {
  email: false,
  password: false,
}

// --- Validation (cheap computed) ---
const emailError = computed(() => {
  if (!touched.email) return ''
  if (!email.value.trim()) return 'Email is required'
  if (!EMAIL_RE.test(email.value)) return 'Invalid email'
  return ''
})
const emailHasError = computed(() => !!emailError.value)

const passwordError = computed(() => {
  if (!touched.password) return ''
  if (!password.value) return 'Password is required'
  if (password.value.length < 6) return 'Password must be at least 6 characters'
  return ''
})
const passwordHasError = computed(() => !!passwordError.value)

const isFormValid = computed(() => !emailError.value && !passwordError.value)
const router = useRouter()
const { mutateAsync, isPending } = useMutation({ mutationFn: login })

// --- Derived UI state ---
const submitDisabled = computed(() => isPending.value)
const submitLabel = computed(() => (isPending.value ? 'Signing In...' : 'Continue'))

// --- Handlers (stable) ---
function onFieldInput() {
  // Clear error on any user input (cheaper than a global watch over both fields)
  if (errorMessage.value) errorMessage.value = ''
}

async function handleLogin() {
  errorMessage.value = ''
  touched.email = true
  touched.password = true

  if (!isFormValid.value) {
    errorMessage.value = 'Please fill all fields correctly.'
    return
  }
  try {
    const data = await mutateAsync({ u_email: email.value, u_password: password.value })
    // adapt if token key differs
    localStorage.setItem('token', data?.data?.token)
    router.push('/dashboard')
  } catch (err: any) {
    errorMessage.value = err?.response?.data?.message || 'Login failed. Please try again.'
  }
}
</script>
