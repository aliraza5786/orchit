<!-- components/CreateOrganizationInline.vue -->
<template>
  <div class="w-full space-y-6">

    <!-- Step 2: Company Info -->
    <div v-if="activeStep === 2" class="space-y-6">
      <div class="space-y-2 mb-6">
        <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">Tell us about your company</h2>
        <p class="text-sm font-medium text-text-secondary">This will help us personalize your experience.</p>
      </div>

      <BaseTextField v-model="team" label="Company Name" placeholder="Company name" size="lg"
        :error="!!errors.team" :message="errors.team" />

      <BaseSelectField v-model="role" label="What role do you perform in your company?" :options="rolesList || []"
        placeholder="Select Role" size="lg" :error="!!errors.role" :message="errors.role" />

      <BaseSelectField v-model="companySize" label="What's your company size?" :options="companySizeOptions"
        placeholder="Select Company size" size="lg" :error="!!errors.companySize" :message="errors.companySize" />
    </div>

    <!-- Step 3: Modules -->
    <div v-if="activeStep === 3" class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">What would you like to manage?</h2>
        <p class="text-sm font-medium text-text-secondary">You can select multiple options.</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button v-for="module in teamModules" :key="module.id" type="button" @click="toggleModule(module.id)"
          class="px-4 py-2 rounded-full border text-sm transition-all"
          :class="selectedModules.includes(module.id) ? 'bg-accent/30 border-accent text-text-primary' : 'border-border text-text-secondary'">
          {{ module.label }}
        </button>
      </div>
      <p v-if="errors.selectedModules" class="text-xs text-red-500">{{ errors.selectedModules }}</p>
    </div>

    <!-- Step 4: Work Type -->
    <div v-if="activeStep === 4" class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">What kind of work do you do?</h2>
        <p class="text-sm text-text-secondary">This helps us tailor your workspace experience.</p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <button v-for="item in teamWorkTypeOptions" :key="item.id" @click="workType = item.id" type="button"
          class="flex items-center gap-3 p-4 rounded-xl border transition-all text-left"
          :class="workType === item.id ? 'bg-accent/30 border-accent' : 'border-border'">
          <FontAwesomeIcon :icon="['fas', item.icon]" class="text-lg text-text-primary" />
          <span class="text-sm font-medium text-text-primary">{{ item.label }}</span>
        </button>
      </div>
      <p v-if="errors.workType" class="text-xs text-red-500 mt-2">{{ errors.workType }}</p>
    </div>

    <!-- Step 5: Create Site -->
    <div v-if="activeStep === 5">
      <div class="rounded-2xl border p-8 space-y-6" style="background: var(--bg-card); border-color: var(--border);">
        <div class="text-center space-y-3">
          <div class="w-14 h-14 rounded-[14px] border flex items-center justify-center mx-auto"
            style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.2);">
            <img src="/src/assets/global/favicon.png" alt="logo" />
          </div>
          <h2 class="text-[22px] font-bold tracking-tight" style="color: var(--text-primary);">Create your site</h2>
          <p class="text-sm leading-relaxed max-w-75 mx-auto" style="color: var(--text-secondary);">
            Sites are the shared space where your team organizes work, projects, and goals.
          </p>
        </div>

        <!-- Site name input -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
            Site name
          </label>
          <div class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
            :class="{
              'ring-[3px] ring-(--accent)/[0.14]': isFocused && isSlugAvailable !== false,
              'ring-[3px] ring-red-500/10': isFocused && isSlugAvailable === false,
            }"
            :style="{
              borderColor: isFocused && isSlugAvailable === true ? 'var(--accent)'
                : isFocused && isSlugAvailable === false ? '#e55050'
                : 'var(--border-input)',
              background: 'var(--bg-input)',
            }">
            <input v-model="siteName" type="text" placeholder="e.g. acme, my-team"
              class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
              style="color: var(--text-primary);"
              @focus="isFocused = true" @blur="isFocused = false" />
            <div class="flex items-center gap-2 px-3.5 border-l"
              style="background: var(--bg-surface); border-color: var(--border);">
              <span class="text-[13px] font-semibold whitespace-nowrap" style="color: var(--text-secondary);">.orchit.ai</span>
              <span v-if="isCheckingSlug"
                class="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                style="border-color: var(--border); border-top-color: var(--accent);" />
              <Transition
                enter-active-class="transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                enter-from-class="opacity-0 scale-50" enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-50">
                <span v-if="isSlugAvailable === true && !isCheckingSlug"
                  class="flex items-center justify-center w-5 h-5 rounded-full shrink-0" style="background: #1d9e75;">
                  <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span v-else-if="isSlugAvailable === false && !isCheckingSlug"
                  class="flex items-center justify-center w-5 h-5 rounded-full shrink-0" style="background: #e55050;">
                  <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                    <path d="M3 3l4 4M7 3l-4 4" stroke="white" stroke-width="1.6" stroke-linecap="round" />
                  </svg>
                </span>
              </Transition>
            </div>
          </div>
          <p v-if="isSlugAvailable === false && !isCheckingSlug" class="text-xs" style="color: #e55050;">
            This site name is already taken. Please choose another.
          </p>
          <p v-else-if="isSlugAvailable === true && !isCheckingSlug" class="text-xs" style="color: #1d9e75;">
            <span class="font-medium">{{ siteSlug }}</span>.orchit.ai is available
          </p>
          <p v-else class="text-xs" style="color: var(--text-secondary);">
            This is just a suggestion — feel free to change it.
          </p>
        </div>

        <!-- URL preview -->
        <div v-if="siteSlug" class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 border"
          style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.18);">
          <div class="w-2 h-2 rounded-full shrink-0" style="background: var(--accent); opacity: 0.7;" />
          <span class="text-[13px] font-semibold break-all" style="color: var(--accent);">
            https://{{ siteSlug }}.orchit.ai
          </span>
        </div>

        <!-- Suggestions when taken -->
        <Transition enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
          <div v-if="isSlugAvailable === false && siteSlug && !isCheckingSlug" class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Try one of these</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in [`${siteSlug}-app`, `${siteSlug}-hq`, `${siteSlug}-team`]" :key="s"
                type="button"
                class="px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 hover:-translate-y-px"
                style="border-color: var(--border); color: var(--text-secondary); background: var(--bg-card);"
                @click="siteName = s">
                {{ s }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Step 6: Loading -->
    <div v-if="activeStep === 6" class="flex items-center justify-center py-12">
      <LoadingCreateProfile :active="true" :abort="!!companySlugError" @complete="activeStep = 7" />
    </div>

    <!-- Step 7: Referral -->
    <div v-if="activeStep === 7" class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">Where did you hear about us?</h2>
        <p class="text-sm text-text-secondary">This helps us improve our onboarding experience.</p>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button v-for="item in referralOptions" :key="item.id" @click="toggleReferral(item.id)" type="button"
          class="px-4 py-3 rounded-xl border text-sm font-medium transition"
          :class="referralSources.includes(item.id) ? 'bg-accent/30 border-accent' : 'border-border'">
          {{ item.label }}
        </button>
      </div>
    </div>

    <!-- Step 8: Invite -->
    <div v-if="activeStep === 8" class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">Better when used together</h2>
        <p class="text-sm text-text-secondary leading-relaxed">
          Orchit AI works better with your team onboard. Invite a teammate to try it out with you.
        </p>
      </div>

      <!-- Share link -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-text-primary">Share via link</label>
        <div class="flex items-center gap-2">
          <div class="flex-1 border border-border rounded-lg px-3 py-2 bg-surface overflow-hidden">
            <span class="text-sm text-text-secondary truncate block">{{ joinLink }}</span>
          </div>
          <Button variant="secondary" size="md" @click="copySiteUrl">
            <div class="flex items-center gap-1.5">
              <FontAwesomeIcon :icon="['fas', isCopied ? 'check' : 'link']"
                :class="isCopied ? 'text-green-500' : ''" />
              <span :class="isCopied ? 'text-green-500' : ''">{{ isCopied ? 'Copied!' : 'Copy link' }}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>

    <!-- Company slug conflict modal -->
    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="companySlugError"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
        @click.self="companySlugError = null">
        <div class="w-full max-w-md rounded-2xl bg-bg-dropdown p-6 shadow-xl ring-1 ring-black/5">
          <div class="mb-4 flex h-13 w-13 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <i class="fa-solid fa-triangle-exclamation text-red-500 text-lg"></i>
          </div>
          <h3 class="text-md font-semibold text-text-primary mb-1">Company name already taken</h3>
          <p class="text-sm text-text-secondary leading-relaxed mb-5">{{ companySlugError }}</p>
          <div class="flex gap-2">
            <button type="button"
              class="flex-1 rounded-lg border border-black/10 bg-bg-dropdown px-3 py-2.5 text-sm font-medium text-text-secondary hover:border-black/20 hover:text-text-primary transition cursor-pointer"
              @click="companySlugError = null">
              Dismiss
            </button>
            <button type="button"
              class="flex-[1.5] rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition cursor-pointer"
              @click="() => { companySlugError = null; activeStep = 2 }">
              Change company name
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Navigation buttons -->
    <div v-if="activeStep !== 6" class="flex justify-between items-center pt-4">
      <Button v-if="activeStep > 2" variant="secondary" size="md" type="button" @click="goBack">
        <div class="flex items-center gap-1">
          <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
        </div>
      </Button>

      <div class="ml-auto flex gap-3">
        <!-- Skip button on step 8 -->
        <Button v-if="activeStep === 8" variant="secondary" size="md"
          :disabled="isSkipping || isInviting" @click="sendInvites(true)">
          <div class="flex items-center gap-2">
            <span v-if="isSkipping" class="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
            <span>Do this later</span>
          </div>
        </Button>

        <!-- Primary action button -->
        <Button v-if="activeStep !== 8" size="md"
          :disabled="isSiteStepBlocked || creatingProfile || updatingProfile" @click="handleContinue">
          <div class="flex items-center gap-2">
            <span v-if="creatingProfile && activeStep === 5"
              class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>{{ activeStep === 5 ? 'Create site' : 'Continue' }}</span>
          </div>
        </Button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Button from '../../../components/ui/Button.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import LoadingCreateProfile from '../../../components/LoadingCreateProfile.vue'
import { useCreateCompany, useUpdateCompanyProfile, useInviteCompany } from '../../../services/auth'
import { useRolesList } from '../../../queries/useCommon'
import { useWorkspaceStore } from '../../../stores/workspace'
import { useAuthStore } from '../../../stores/auth'

const emit = defineEmits<{ done: [] }>()
const workspaceStore = useWorkspaceStore()
const authStore = useAuthStore()
const { data: rolesList } = useRolesList()

// ── State ─────────────────────────────────────────────────────────────────────
const activeStep = ref(2)
const team = ref('')
const role = ref('')
const companySize = ref('')
const workType = ref('')
const siteName = ref('')
const siteSlug = ref('')
const selectedModules = ref<string[]>([])
const referralSources = ref<string[]>([])
const emailList = ref<string[]>([])
const joinLink = ref('')
const domainLink = ref('')
const companyID = ref('')
const isFocused = ref(false)
const isCheckingSlug = ref(false)
const isSlugAvailable = ref<boolean | null>(null)
const isInviting = ref(false)
const isSkipping = ref(false)
const isCopied = ref(false)
const companySlugError = ref<string | null>(null)
const errors = ref<Record<string, string | undefined>>({})

// ── Static data ───────────────────────────────────────────────────────────────
const companySizeOptions = [
  { title: '1 – 10', _id: '1–10' },
  { title: '11 – 50', _id: '11–50' },
  { title: '51 – 200', _id: '51–200' },
  { title: '201 – 500', _id: '201–500' },
  { title: '501 – 1,000', _id: '501–1000' },
  { title: '1,001 – 5,000', _id: '1001–5000' },
  { title: '5,001 – 10,000', _id: '5001–10000' },
  { title: '10,001+', _id: '10001+' },
]

const teamModules = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'projects', label: 'Projects' },
  { id: 'docs', label: 'Docs' },
  { id: 'goals', label: 'Goals' },
  { id: 'support', label: 'Support Desk' },
  { id: 'operations', label: 'Operations' },
  { id: 'knowledge', label: 'Knowledge Base' },
  { id: 'reporting', label: 'Reports' },
]

const teamWorkTypeOptions = [
  { id: 'software_development', label: 'Software Development', icon: 'code' },
  { id: 'product_management', label: 'Product Management', icon: 'layer-group' },
  { id: 'marketing', label: 'Marketing', icon: 'bullhorn' },
  { id: 'design', label: 'Design', icon: 'palette' },
  { id: 'sales', label: 'Sales', icon: 'chart-line' },
  { id: 'operations', label: 'Operations', icon: 'cog' },
  { id: 'hr', label: 'Human Resources', icon: 'users' },
  { id: 'support', label: 'Customer Support', icon: 'headset' },
]

const referralOptions = [
  { id: 'google', label: 'Google Search' },
  { id: 'social', label: 'Social Media' },
  { id: 'friend', label: 'Friend / Colleague' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'producthunt', label: 'Product Hunt' },
  { id: 'ads', label: 'Ads' },
  { id: 'blog', label: 'Blog / Article' },
  { id: 'other', label: 'Other' },
]

// ── Computed ──────────────────────────────────────────────────────────────────
const isSiteStepBlocked = computed(() =>
  activeStep.value === 5 && (!isSlugAvailable.value || isCheckingSlug.value)
)

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSlug(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function toggleModule(id: string) {
  if (selectedModules.value.includes(id)) {
    selectedModules.value = selectedModules.value.filter(m => m !== id)
  } else {
    selectedModules.value.push(id)
    if (errors.value.selectedModules) errors.value.selectedModules = undefined
  }
}

function toggleReferral(id: string) {
  if (referralSources.value.includes(id)) {
    referralSources.value = referralSources.value.filter(i => i !== id)
  } else {
    referralSources.value.push(id)
  }
}

function copySiteUrl() {
  navigator.clipboard.writeText(joinLink.value).then(() => {
    isCopied.value = true
    setTimeout(() => (isCopied.value = false), 2000)
  })
}

function goBack() {
  if (activeStep.value === 7) { activeStep.value = 5; return }
  if (activeStep.value === 8) { activeStep.value = 7; return }
  activeStep.value = Math.max(2, activeStep.value - 1)
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateCompanyStep() {
  const next: Record<string, string> = {}
  if (!team.value.trim()) next.team = 'Please enter your company name.'
  if (!role.value) next.role = 'Please select your role.'
  if (!companySize.value) next.companySize = 'Please select your company size.'
  errors.value = next
  return Object.keys(next).length === 0
}

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(siteName, async (val) => {
  siteSlug.value = generateSlug(val)
  if (!siteSlug.value) { isSlugAvailable.value = null; return }
  isCheckingSlug.value = true
  try {
    const result = await workspaceStore.fetchTitleSlug(siteSlug.value)
    isSlugAvailable.value = result?.available ?? null
  } catch {
    isSlugAvailable.value = null
  } finally {
    isCheckingSlug.value = false
  }
})

watch(activeStep, (step) => {
  if (step === 5 && !siteName.value && team.value.trim()) {
    siteName.value = generateSlug(team.value)
  }
})

watch(team, (v) => { if (v?.trim() && errors.value.team) errors.value.team = undefined })
watch(role, (v) => { if (v && errors.value.role) errors.value.role = undefined })
watch(companySize, (v) => { if (v && errors.value.companySize) errors.value.companySize = undefined })
watch(workType, (v) => { if (v && errors.value.workType) errors.value.workType = undefined })

// ── Mutations ─────────────────────────────────────────────────────────────────
const { mutate: createProfile, isPending: creatingProfile } = useCreateCompany({
  onSuccess: (data: any) => {
    const payload = data?.data ?? data
    if (!payload || payload?.status === false) {
      const msg = payload?.message ?? ''
      companySlugError.value = msg.toLowerCase().includes('slug') || msg.toLowerCase().includes('already exists')
        ? 'A company with a similar name already exists. Please try a different name.'
        : 'Something went wrong while creating your company.'
      return
    }
    companyID.value = payload?.company_id ?? payload?._id ?? ''
    joinLink.value = payload?.join_link ?? ''
    domainLink.value = payload?.domain_link ?? ''
    localStorage.setItem('company_id', companyID.value)
    activeStep.value = 6
  },
  onError: (error: any) => {
    const msg = error?.response?.data?.message ?? error?.message ?? ''
    companySlugError.value = msg.toLowerCase().includes('slug') || msg.toLowerCase().includes('already exists')
      ? 'A company with a similar name already exists. Please try a different name.'
      : 'Something went wrong while creating your company.'
  },
})

const { mutate: updateProfile, isPending: updatingProfile } = useUpdateCompanyProfile({
  onSuccess: async () => {
    activeStep.value = 8
  },
  onError: () => {
    activeStep.value = 5
  },
})

const { mutate: invitePeople } = useInviteCompany({
  onSuccess: async () => {
    await authStore.bootstrap()
    emit('done')
  },
})

function handleContinue() {
  const company_id = localStorage.getItem('company_id')

  // STEP 2 → STEP 3
  if (activeStep.value === 2) {
    if (!validateCompanyStep()) return
    activeStep.value = 3
    return
  }

  // STEP 3 → STEP 4
  if (activeStep.value === 3) {
    if (selectedModules.value.length === 0) {
      errors.value.selectedModules = 'Please select at least one option.'
      return
    }
    activeStep.value = 4
    return
  }

  // STEP 4 → STEP 5
  if (activeStep.value === 4) {
    if (!workType.value) {
      errors.value.workType = 'Please select what kind of work you do.'
      return
    }
    activeStep.value = 5
    return
  }

  // STEP 5 → CREATE PROFILE
  if (activeStep.value === 5) {
    createProfile({
      payload: {
        company_id,

        title: team.value,
        type: 'team',
        role_id: role.value,
        company_size: companySize.value,
        work_to_do: workType.value,
        like_to_manage: selectedModules.value,
      },
    })
    return
  }

  // STEP 7 → UPDATE PROFILE
  if (activeStep.value === 7) {
    updateProfile({
      payload: {
        company_id,

        title: team.value,
        type: 'team',
        role_id: role.value,
        company_size: companySize.value,
        work_to_do: workType.value,
        like_to_manage: selectedModules.value,
        heard_about_us: referralSources.value,
      },
    })
    return
  }

  // DEFAULT STEP INCREMENT
  activeStep.value += 1
}
async function sendInvites(skip = false) {
  if (skip) {
    isSkipping.value = true
    await authStore.bootstrap()
    isSkipping.value = false
    emit('done')
    return
  }

  if (emailList.value.length === 0) {
    await authStore.bootstrap()
    emit('done')
    return
  }

  isInviting.value = true
  invitePeople(
    { payload: { company_id: companyID.value, emails: [...emailList.value] } },
    {
      onSuccess: async () => {
        isInviting.value = false
        await authStore.bootstrap()
        emit('done')
      },
      onError: () => {
        isInviting.value = false
      },
    }
  )
}
</script>