<template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[500px] md:mx-auto w-full text-text-primary bg-bg-body">
        <div v-if="!emailSent">
          <h2 class="text-[32px] font-medium mb-4 text-center text-text-primary">
            Forgot Password?
          </h2>
          <p class="text-sm text-text-secondary text-center mb-8">
            Enter your email address and we'll send you instructions to reset your password.
          </p>

          <form @submit.prevent="handleForgotPassword" class="space-y-4 w-full">
            <BaseTextField
              v-model="email"
              label="Email"
              placeholder="Email address"
              size="lg"
              :error="emailHasError"
              :message="emailError"
              @blur="touched.email = true"
              @update:modelValue="onFieldInput"
            />

            <Button :disabled="submitDisabled" size="lg" :block="true" type="submit">
              {{ submitLabel }}
            </Button>

            <p v-if="errorMessage" class="text-red-500 text-sm text-center mt-2">
              {{ errorMessage }}
            </p>
          </form>

          <div class="text-center mt-6">
            <router-link to="/login" class="text-sm text-text-secondary hover:text-text-primary">
              <i class="fa-solid fa-arrow-left mr-2"></i>Back to login
            </router-link>
          </div>
        </div>

        <div v-else class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fa-solid fa-check text-green-600 text-2xl"></i>
          </div>
          <h2 class="text-2xl font-medium mb-4 text-text-primary">
            Check your email
          </h2>
          <p class="text-sm text-text-secondary mb-8">
            We've sent password reset instructions to<br />
            <strong class="text-text-primary">{{ email }}</strong>
          </p>
          <p class="text-sm text-text-secondary mb-6">
            Didn't receive the email? Check your spam folder or
          </p>
          <Button size="md" variant="secondary" @click="resendEmail">
            Resend email
          </Button>
          <div class="mt-8">
            <router-link to="/login" class="text-sm text-text-secondary hover:text-text-primary">
              <i class="fa-solid fa-arrow-left mr-2"></i>Back to login
            </router-link>
          </div>
        </div>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useMutation } from '@tanstack/vue-query'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import Button from '../../components/ui/Button.vue'
import { forgotPassword } from '../../services/auth'

defineOptions({ name: 'ForgotPasswordPage' })

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

const submitDisabled = computed(() => isPending.value || !isFormValid.value)
const submitLabel = computed(() => (isPending.value ? 'Sending...' : 'Send reset instructions'))

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
