<template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[400px] mx-auto w-full min-h-full">
        <router-link to="/">
          <img
            :src="isDark ? darkLogo : lightLogo"
            class="w-[130px] d-block mx-auto"
            alt="Orchit"
          />
        </router-link>

        <!-- Step 1: Company details -->
        <template v-if="activeStep === 1">
          <div class="space-y-2 mb-8 text-center mt-6">
            <h2 class="text-[24px] font-medium text-text-primary">
              Create your Organization on Orchit
            </h2>
            <p class="text-sm font-normal text-text-secondary">
              Tell us about your Organization this will help us personalize your experience in Orchit AI.
            </p>
          </div>
          <div class="space-y-3">
            <BaseTextField
              ref="teamRef"
              v-model="team" 
              placeholder="Organization name"
              size="md"
              :error="!!errors.team"
              :message="errors.team"
            />
            <BaseSelectField
              :noSearchAble="true"
              ref="roleRef"
              v-model="role" 
              :options="staticRolesList"
              placeholder="Select your role"
              size="md"
              :error="!!errors.role"
              :message="errors.role"
            />
            <BaseSelectField
              :noSearchAble="true"
              ref="companySizeRef"
              v-model="companySize" 
              :options="companySizeOptions"
              placeholder="Select organization size"
              size="md"
              :error="!!errors.companySize"
              :message="errors.companySize"
            />
          </div>
        </template>

        <!-- Step 2: Register -->
        <template v-else>
          <div class="mb-8 text-center mt-6">
            <h3 class="text-[24px] leading-7 font-medium text-text-primary">
              What's your contact info?
            </h3>
            <p class="text-sm text-text-secondary mt-3">
              Use your work email to create your organization account
            </p>
          </div>
          <form class="space-y-3 w-full" @submit.prevent="handleRegister">
            <BaseTextField
              v-model="fName"
              placeholder="Full name"
              size="md"
              type="text"
              autocomplete="name"
              :error="!!nameError"
              :message="nameError"
              @blur="touchedFName = true"
              :disabled="isSubmitPending"
            />
            <BaseTextField
              v-model="email" 
              placeholder="you@yourcompany.com"
              size="md"
              autocomplete="email"
              :error="!!emailError"
              :message="emailError"
              @blur="touchedEmail = true"
              :disabled="isSubmitPending"
            />
            <BaseTextField
              v-model="password"
              placeholder="Set password"
              size="md"
              type="password"
              autocomplete="new-password"
              :error="!!passwordError"
              :message="passwordError"
              @blur="touchedPassword = true"
              :disabled="isSubmitPending"
            />
            <p v-if="errorMessage" class="text-red-500 text-sm text-center">{{ errorMessage }}</p>
          </form>
        </template>

        <div class="flex justify-between items-center mt-10">
          <Button
            v-if="activeStep === 2"
            variant="secondary"
            size="md"
            type="button"
            :disabled="isSubmitPending"
            @click="goBack"
          >
            <div class="flex items-center gap-1">Back</div>
          </Button>
          <div v-else />
          <Button
            class="ml-auto"
            :disabled="isSubmitPending"
            :loading="isSubmitPending"
            size="md"
            type="button"
            @click="activeStep === 1 ? continueCompanyStep() : handleRegister()"
          >
            Continue
          </Button>
        </div>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../components/ui/BaseSelectField.vue'
import Button from '../../components/ui/Button.vue'
import { register, login } from '../../services/auth'
import { useAuthStore } from '../../stores/auth'
import { saveOrgDraft, getOrgDraft } from '../../utilities/createOrganizationDraft'
import { isCompanyEmail, getEmailDomain } from '../../utilities/onboardingRedirect'
import { useTheme } from '../../composables/useTheme'
import darkLogo from '@assets/global/dark-logo.png'
import lightLogo from '@assets/global/light-logo.png'

const { isDark } = useTheme()

defineOptions({ name: 'CreateOrganization' })

const router = useRouter()
const authStore = useAuthStore()
const activeStep = ref(1)
const teamRef = ref(null)
const errors = ref<Record<string, string>>({})

const team = ref('')
const role = ref('')
const companySize = ref('')

const staticRolesList = Object.freeze([
  { title: 'CEO / Founder', _id: 'ceo_founder' },
  { title: 'CTO / Technical Lead', _id: 'cto_tech_lead' },
  { title: 'Product Manager', _id: 'product_manager' },
  { title: 'Software Engineer', _id: 'software_engineer' },
  { title: 'Designer', _id: 'designer' },
  { title: 'Marketing', _id: 'marketing' },
  { title: 'Sales', _id: 'sales' },
  { title: 'Operations', _id: 'operations' },
  { title: 'HR / People', _id: 'hr_people' },
  { title: 'Finance', _id: 'finance' },
  { title: 'Student', _id: 'student' },
  { title: 'Teacher / Lecturer', _id: 'teacher_lecturer' },
  { title: 'Other', _id: 'other' },
])

const companySizeOptions = Object.freeze([
  { title: '1 – 10', _id: '1–10' },
  { title: '11 – 50', _id: '11–50' },
  { title: '51 – 200', _id: '51–200' },
  { title: '201 – 500', _id: '201–500' },
  { title: '501 – 1,000', _id: '501–1000' },
  { title: '1,001 – 5,000', _id: '1001–5000' },
  { title: '5,001 – 10,000', _id: '5001–10000' },
  { title: '10,001+', _id: '10001+' },
])

onMounted(() => {
  const draft = getOrgDraft()
  if (draft) {
    team.value = draft.team
    role.value = draft.role
    companySize.value = draft.companySize
  }
})

const fName = ref('')
const email = ref('')
const password = ref('')
const errorMessage = ref('')

const touchedFName = ref(false)
const touchedEmail = ref(false)
const touchedPassword = ref(false)

const nameError = computed(() => {
  if (!touchedFName.value) return ''
  if (!fName.value.trim()) return 'Full name is required'
  if (fName.value.trim().length < 2) return 'Full name must be at least 2 characters'
  return ''
})

const PERSONAL_EMAIL_MESSAGE =
  'Please use your company work email. Personal email providers (Gmail, Yahoo, Outlook, etc.) are not allowed when creating an organization.'

const emailError = computed(() => {
  if (!touchedEmail.value) return ''
  const trimmed = email.value.trim()
  if (!trimmed) return 'Work email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return 'Invalid email format'
  if (!isCompanyEmail(trimmed)) {
    const domain = getEmailDomain(trimmed)
    if (domain) {
      return `Personal email domains (@${domain}) cannot be used. Please sign up with your company work email.`
    }
    return PERSONAL_EMAIL_MESSAGE
  }
  return ''
})

const passwordError = computed(() => {
  if (!touchedPassword.value) return ''
  if (!password.value) return 'Password is required'
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/
  if (!strongPasswordRegex.test(password.value)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a special character'
  }
  return ''
})

const isFormValid = computed(
  () => !nameError.value && !emailError.value && !passwordError.value,
)

function validateCompanyStep() {
  const next: Record<string, string> = {}
  if (!team.value.trim()) next.team = 'Please enter your organizationy name.'
  if (!role.value) next.role = 'Please select your role.'
  if (!companySize.value) next.companySize = 'Please select your organization size.'
  errors.value = next
  return Object.keys(next).length === 0
}

function continueCompanyStep() {
  if (!validateCompanyStep()) return
  saveOrgDraft({
    team: team.value.trim(),
    role: role.value,
    companySize: companySize.value,
  })
  activeStep.value = 2
}

function goBack() {
  activeStep.value = 1
  nextTick(() => teamRef.value?.focus?.())
}

const { mutateAsync: registerMutate, isPending: isRegisterPending } = useMutation({
  mutationFn: register,
})

const { mutateAsync: loginMutate, isPending: isLoginPending } = useMutation({
  mutationFn: login,
})

const isSubmitPending = computed(() => isRegisterPending.value || isLoginPending.value)

async function handleRegister() {
  errorMessage.value = ''
  touchedFName.value = true
  touchedEmail.value = true
  touchedPassword.value = true

  if (!isFormValid.value) {
    errorMessage.value = 'Please fill all required fields.'
    return
  }

  saveOrgDraft({
    team: team.value.trim(),
    role: role.value,
    companySize: companySize.value,
  })

  try {
    await registerMutate({
      u_full_name: fName.value,
      u_email: email.value.trim(),
      u_password: password.value,
      agree_to_terms: true,
    })

    const loginData = await loginMutate({
      u_email: email.value.trim(),
      u_password: password.value,
    })

    const token = loginData?.data?.token
    if (!token) {
      errorMessage.value = 'Account created but sign-in failed. Please try logging in.'
      return
    }

    localStorage.setItem('token', token)
    await authStore.bootstrap(true)

    router.replace({ path: '/onboarding', query: { step: '3' } })
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    errorMessage.value =
      err?.response?.data?.message || err?.message || 'Something went wrong'
  }
}

watch([fName, email, password], () => {
  if (errorMessage.value) errorMessage.value = ''
})
</script>
