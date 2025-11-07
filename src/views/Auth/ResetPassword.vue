<template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[500px] md:mx-auto w-full text-text-primary bg-bg-body">
        <div v-if="verifying" class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p class="text-sm text-text-secondary">Verifying your reset link...</p>
        </div>

        <div v-else-if="tokenExpired" class="text-center">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fa-solid fa-times text-red-600 text-2xl"></i>
          </div>
          <h2 class="text-2xl font-medium mb-4 text-text-primary">
            Reset link expired
          </h2>
          <p class="text-sm text-text-secondary mb-8">
            This password reset link has expired or is invalid.<br />
            Please request a new one.
          </p>
          <router-link to="/forgot-password">
            <Button size="md" variant="primary">
              Request new reset link
            </Button>
          </router-link>
          <div class="mt-6">
            <router-link to="/login" class="text-sm text-text-secondary hover:text-text-primary">
              <i class="fa-solid fa-arrow-left mr-2"></i>Back to login
            </router-link>
          </div>
        </div>

        <div v-else-if="resetSuccess" class="text-center">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fa-solid fa-check text-green-600 text-2xl"></i>
          </div>
          <h2 class="text-2xl font-medium mb-4 text-text-primary">
            Password reset successful
          </h2>
          <p class="text-sm text-text-secondary mb-8">
            Your password has been successfully reset.<br />
            You can now sign in with your new password.
          </p>
          <router-link to="/login">
            <Button size="md" variant="primary">
              Go to login
            </Button>
          </router-link>
        </div>

        <div v-else>
          <h2 class="text-[32px] font-medium mb-4 text-center text-text-primary">
            Reset your password
          </h2>
          <p class="text-sm text-text-secondary text-center mb-8">
            Enter your new password below.
          </p>

          <form @submit.prevent="handleResetPassword" class="space-y-4 w-full">
            <BaseTextField
              v-model="newPassword"
              label="New Password"
              placeholder="Enter new password"
              size="lg"
              type="password"
              :error="newPasswordHasError"
              :message="newPasswordError"
              @blur="touched.newPassword = true"
              @update:modelValue="onFieldInput"
            />

            <BaseTextField
              v-model="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm new password"
              size="lg"
              type="password"
              :error="confirmPasswordHasError"
              :message="confirmPasswordError"
              @blur="touched.confirmPassword = true"
              @update:modelValue="onFieldInput"
            />

            <div class="bg-bg-card border border-border rounded-lg p-4">
              <p class="text-xs text-text-secondary mb-2">Password requirements:</p>
              <ul class="text-xs text-text-secondary space-y-1">
                <li :class="{ 'text-green-600': hasMinLength }">
                  <i class="fa-solid fa-check mr-1" v-if="hasMinLength"></i>
                  <i class="fa-solid fa-circle text-[4px] mr-1" v-else></i>
                  At least 8 characters
                </li>
                <li :class="{ 'text-green-600': hasNumber }">
                  <i class="fa-solid fa-check mr-1" v-if="hasNumber"></i>
                  <i class="fa-solid fa-circle text-[4px] mr-1" v-else></i>
                  Contains a number
                </li>
                <li :class="{ 'text-green-600': hasSpecialChar }">
                  <i class="fa-solid fa-check mr-1" v-if="hasSpecialChar"></i>
                  <i class="fa-solid fa-circle text-[4px] mr-1" v-else></i>
                  Contains a special character
                </li>
                <li :class="{ 'text-green-600': hasUpperCase }">
                  <i class="fa-solid fa-check mr-1" v-if="hasUpperCase"></i>
                  <i class="fa-solid fa-circle text-[4px] mr-1" v-else></i>
                  Contains an uppercase letter
                </li>
                <li :class="{ 'text-green-600': hasLowerCase }">
                  <i class="fa-solid fa-check mr-1" v-if="hasLowerCase"></i>
                  <i class="fa-solid fa-circle text-[4px] mr-1" v-else></i>
                  Contains a lowercase letter
                </li>
              </ul>
            </div>

            <Button :disabled="submitDisabled" size="lg" :block="true" type="submit">
              {{ submitLabel }}
            </Button>

            <p v-if="errorMessage" class="text-red-500 text-sm text-center mt-2">
              {{ errorMessage }}
            </p>
          </form>
        </div>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import Button from '../../components/ui/Button.vue'
import { verifyResetToken, resetPassword } from '../../services/auth'

defineOptions({ name: 'ResetPasswordPage' })

const route = useRoute()
const router = useRouter()

const token = computed(() => route.query.token as string)
const newPassword = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const verifying = ref(true)
const tokenExpired = ref(false)
const resetSuccess = ref(false)

const touched = {
  newPassword: false,
  confirmPassword: false,
}

const hasMinLength = computed(() => newPassword.value.length >= 8)
const hasNumber = computed(() => /\d/.test(newPassword.value))
const hasSpecialChar = computed(() => /[!@#$%^&*(),.?":{}|<>]/.test(newPassword.value))
const hasUpperCase = computed(() => /[A-Z]/.test(newPassword.value))
const hasLowerCase = computed(() => /[a-z]/.test(newPassword.value))

const newPasswordError = computed(() => {
  if (!touched.newPassword) return ''
  if (!newPassword.value) return 'Password is required'
  if (!hasMinLength.value) return 'Password must be at least 8 characters'
  if (!hasNumber.value) return 'Password must contain a number'
  if (!hasSpecialChar.value) return 'Password must contain a special character'
  if (!hasUpperCase.value) return 'Password must contain an uppercase letter'
  if (!hasLowerCase.value) return 'Password must contain a lowercase letter'
  return ''
})
const newPasswordHasError = computed(() => !!newPasswordError.value)

const confirmPasswordError = computed(() => {
  if (!touched.confirmPassword) return ''
  if (!confirmPassword.value) return 'Please confirm your password'
  if (confirmPassword.value !== newPassword.value) return 'Passwords do not match'
  return ''
})
const confirmPasswordHasError = computed(() => !!confirmPasswordError.value)

const isFormValid = computed(() => !newPasswordError.value && !confirmPasswordError.value)

const { mutateAsync: verifyToken } = useMutation({ mutationFn: verifyResetToken })
const { mutateAsync: resetPass, isPending } = useMutation({ mutationFn: resetPassword })

const submitDisabled = computed(() => isPending.value || !isFormValid.value)
const submitLabel = computed(() => (isPending.value ? 'Resetting...' : 'Reset password'))

function onFieldInput() {
  if (errorMessage.value) errorMessage.value = ''
}

onMounted(async () => {
  if (!token.value) {
    tokenExpired.value = true
    verifying.value = false
    return
  }

  try {
    await verifyToken({ token: token.value })
    verifying.value = false
  } catch (err: any) {
    verifying.value = false
    tokenExpired.value = true
  }
})

async function handleResetPassword() {
  errorMessage.value = ''
  touched.newPassword = true
  touched.confirmPassword = true

  if (!isFormValid.value) {
    errorMessage.value = 'Please fill all fields correctly.'
    return
  }

  try {
    await resetPass({
      token: token.value,
      new_password: newPassword.value,
      confirm_password: confirmPassword.value
    })
    resetSuccess.value = true
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (err: any) {
    errorMessage.value = err?.message || 'Failed to reset password. Please try again.'
  }
}
</script>
