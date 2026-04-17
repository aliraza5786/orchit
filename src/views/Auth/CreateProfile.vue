<template>
  <AuthLayout :steps="['Purpose', 'About Company', 'Invite Team']" :activeStep="activeStep">
    <template #form>
      <div class="max-w-[500px] mx-auto w-full min-h-full py-5 flex flex-col justify-center">
        <!-- Step 1 -->
        <div class="mb-6 md:mb-12 space-y-2" v-show="activeStep === 1">
          <h2 class="text-[24px] lg:text-[32px] leading-[32px] lg:leading-[44px] font-medium text-text-primary" v-once>
            How will you use Orchit AI?</h2>
          <p class="text-[14px] md:text-base sm:text-nowrap font-medium text-text-secondary" v-once>
            This will help us personalize your experience in Orchit AI.
          </p>
        </div>

        <div class="how_help_steps grid sm:grid-cols-3 gap-4" v-show="activeStep === 1">
          <label v-for="option in options" :key="option._id"
            class="border rounded-xl py-4 px-2.5 cursor-pointer transition-all sm:aspect-square"
            :class="optionClass(option._id)" v-memo="[selected, option._id]">
            <input type="radio" class="hidden" v-model="selected" :value="option._id" />
            <div class="flex flex-col items-center">
              <img :src="option.icon" class="w-12 h-12" />
              <h3 class="font-medium text-sm text-text-primary mt-4">{{ option.title }}</h3>
              <p class="text-[11px] text-text-secondary mt-2 text-center">{{ option.description }}</p>
            </div>
          </label>
        </div>
        <!-- Step 2 -->
        <div class="space-y-2 mb-6 md:mb-12" v-show="activeStep === 2">
          <h2 class="text-[24px] lg:text-[32px] leading-[32px] lg:leading-[44px] font-medium text-text-primary" v-if="selected ==='team'">
           Tell us about your company
          </h2>
         <h2 class="text-[24px] lg:text-[32px] leading-[32px] lg:leading-[44px] font-medium text-text-primary" v-if="selected ==='personal'">
           Tell us about yourself
          </h2>
          <h2 class="text-[24px] lg:text-[32px] leading-[32px] lg:leading-[44px] font-medium text-text-primary" v-if="selected ==='school'">
           Tell us about your School
          </h2>
          <p class="text-[14px] md:text-base sm:text-nowrap font-medium text-text-secondary" v-once>
            This will help us personalize your experience in Orchit AI.
          </p>
        </div>

        <div class="space-y-6" v-show="activeStep === 2 && selected === 'team'">
          <BaseTextField v-model="team" label="Company Name" placeholder="Company name" size="lg" :error="!!errors.team"
            :message="errors.team" />

          <BaseSelectField v-model="role" label="What role do you perform in your company?" :options="rolesList || []"
            placeholder="Select Role" size="lg" :error="!!errors.role" :message="errors.role" />

          <BaseSelectField v-model="companySize" label="What’s your company size?" :options="companySizeOptions"
            placeholder="Select Company size" size="lg" :error="!!errors.companySize" :message="errors.companySize" />
        </div>
         <div class="space-y-6" v-show="activeStep === 2 && selected === 'personal'">
          <BaseTextField
            v-model="personalRole"
            label="What do you do?"
            placeholder="e.g. Frontend Developer, Student, Designer"
            size="lg"
            :error="!!errors.personalRole"
            :message="errors.personalRole"
          />
        </div>
        <div class="space-y-6" v-show="activeStep === 2 && selected === 'school'">

  <BaseTextField
    v-model="schoolName"
    label="School / University Name"
    placeholder="e.g. University of Punjab"
    size="lg"
    :error="!!errors.schoolName"
    :message="errors.schoolName"
  />

  <BaseSelectField
    v-model="educationLevel"
    label="Education Level"
    :options="educationOptions"
    placeholder="Select level"
    size="lg"
    :error="!!errors.educationLevel"
    :message="errors.educationLevel"
  />

  <BaseTextField
    v-model="fieldOfStudy"
    label="Field of Study"
    placeholder="e.g. Computer Science, Business, Arts"
    size="lg"
    :error="!!errors.fieldOfStudy"
    :message="errors.fieldOfStudy"
  />

  <BaseSelectField
    v-model="schoolUseCase"
    label="Primary Use"
    :options="schoolUseOptions"
    placeholder="How will you use Orchit AI?"
    size="lg"
    :error="!!errors.schoolUseCase"
    :message="errors.schoolUseCase"
  />

</div>
<div v-show="activeStep === 3" class="space-y-6">

  <!-- Heading -->
  <div class="space-y-2">
    <h2 class="text-[24px] lg:text-[32px] leading-[32px] lg:leading-[44px] font-medium text-text-primary">
      What would you like to manage?
    </h2>

    <p class="text-[14px] md:text-base font-medium text-text-secondary">
      You can select multiple options. This helps us personalize your workspace.
    </p>
  </div>

  <!-- Tabs -->
  <div class="flex flex-wrap gap-3">

    <button
      v-for="module in activeModules"
      :key="module.id"
      type="button"
      @click="toggleModule(module.id)"
      class="px-4 py-2 rounded-full border text-sm transition-all"
      :class="selectedModules.includes(module.id)
        ? 'bg-accent/30 border-accent text-text-primary'
        : 'border-border text-text-secondary'"
    >
      {{ module.label }}
    </button>

  </div>

</div>
<!-- Step 4 Modal -->
<div v-if="activeStep === 4">

  <div class="space-y-2 mb-6">
    <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">
      What kind of work do you do?
    </h2>

    <p class="text-text-secondary text-sm md:text-base">
      This helps us tailor your workspace experience.
    </p>
  </div>

  <!-- Grid (2 per row) -->
  <div class="grid grid-cols-2 gap-4">

    <button
      v-for="item in workTypeOptions"
      :key="item.id"
      @click="workType = item.id"
      type="button"
      class="flex items-center gap-3 p-4 rounded-xl border transition-all text-left"
      :class="workType === item.id
        ? 'bg-accent/30 border-accent'
        : 'border-border'"
    >

      <!-- Icon -->
      <FontAwesomeIcon
        :icon="['fas', item.icon]"
        class="text-lg text-text-primary"
      />

      <!-- Label -->
      <span class="text-sm font-medium text-text-primary">
        {{ item.label }}
      </span>

    </button>

  </div>

</div>
<div v-show="activeStep === 5" class="flex items-center justify-center w-full min-h-full py-10">

  <div class="w-full max-w-[460px]">

    <!-- CARD -->
    <div class="rounded-2xl border p-10 space-y-6" style="background: var(--bg-card); border-color: var(--border);">

      <!-- HEADER -->
      <div class="text-center space-y-3">

        <!-- Icon -->
        <div class="w-[56px] h-[56px] rounded-[14px] border flex items-center justify-center mx-auto"
          style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.2);">
             <img src="/src/assets/global/favicon.png"  alt="logo">
        </div>

        <h2 class="text-[22px] font-bold tracking-tight" style="color: var(--text-primary);">
          Create your site
        </h2>
        <p class="text-sm leading-relaxed max-w-[300px] mx-auto" style="color: var(--text-secondary);">
          Sites are the shared space where your team organizes work, projects, and goals.
        </p>

      </div>

      <!-- SITE NAME INPUT -->
      <div class="space-y-1.5">

        <label class="text-[11px] font-semibold uppercase tracking-wider block"
          style="color: var(--text-secondary);">
          Site name
        </label>

        <div
          class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
          :class="{
            'ring-[3px] ring-[var(--accent)]/[0.14]': isFocused && isSlugAvailable !== false,
            'ring-[3px] ring-red-500/10':             isFocused && isSlugAvailable === false,
          }"
          :style="{
            borderColor: isFocused && isSlugAvailable === true  ? 'var(--accent)'
                       : isFocused && isSlugAvailable === false ? '#e55050'
                       : 'var(--border-input)',
            background: 'var(--bg-input)',
          }"
        >
          <input
            v-model="siteName"
            type="text"
            placeholder="e.g. acme, my-team"
            class="flex-1 min-w-0 px-3.5 py-[11px] text-[15px] outline-none bg-transparent"
            style="color: var(--text-primary); font-family: 'Lato', sans-serif;"
            @focus="isFocused = true"
            @blur="isFocused = false"
          />

          <div class="flex items-center gap-2 px-3.5 border-l"
            style="background: var(--bg-surface); border-color: var(--border);">
            <span class="text-[13px] font-semibold whitespace-nowrap" style="color: var(--text-secondary);">
              .orchit.ai
            </span>

            <!-- checking -->
            <span v-if="isCheckingSlug"
              class="w-[14px] h-[14px] rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
              style="border-color: var(--border); border-top-color: var(--accent);" />

            <!-- available -->
            <Transition
              enter-active-class="transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              enter-from-class="opacity-0 scale-50"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-50"
            >
              <span v-if="isSlugAvailable === true && !isCheckingSlug"
                class="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                style="background: #1d9e75;">
                <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span v-else-if="isSlugAvailable === false && !isCheckingSlug"
                class="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                style="background: #e55050;">
                <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M3 3l4 4M7 3l-4 4" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </span>
            </Transition>
          </div>
        </div>

        <!-- Error message -->
        <p v-if="isSlugAvailable === false && !isCheckingSlug"
          class="text-xs" style="color: #e55050;">
          This site name is already taken. Please choose another.
        </p>
        <p v-else class="text-xs" style="color: var(--text-secondary);">
          This is just a suggestion — feel free to change it to something your team will recognize.
        </p>

      </div>

      <!-- LIVE URL PREVIEW -->
      <div v-if="siteSlug"
        class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 border"
        style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.18);">
        <div class="w-2 h-2 rounded-full flex-shrink-0" style="background: var(--accent); opacity: 0.7;" />
        <span class="text-[13px] font-semibold break-all" style="color: var(--accent);">
          https://{{ siteSlug }}.orchit.ai
        </span>
      </div>

      <!-- SUGGESTIONS when taken -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="isSlugAvailable === false && siteSlug && !isCheckingSlug" class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">
            Try one of these
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="s in [`${siteSlug}-app`, `${siteSlug}-hq`, `${siteSlug}-team`]"
              :key="s"
              type="button"
              class="px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 hover:-translate-y-px"
              style="border-color: var(--border); color: var(--text-secondary); background: var(--bg-card);"
              @click="siteName = s"
            >
              {{ s }}
            </button>
          </div>
        </div>
      </Transition>

      <!-- CTA -->
      <button
        type="button"
        :disabled="!siteName || isCheckingSlug || isCreating"
        class="w-full flex items-center justify-center gap-2 py-[13px] rounded-[9px] text-[15px] font-bold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
        style="background: var(--accent); color: var(--accent-text);"
        :style="!isCreating ? 'box-shadow: 0 2px 0 rgba(0,0,0,0.15)' : ''"
        @mouseenter="(e) => !isCreating && ((e.target as HTMLButtonElement).style.background = 'var(--accent-hover)')"
        @mouseleave="(e) => ((e.target as HTMLButtonElement).style.background = 'var(--accent)')"
        @click="continueSiteHandler"
      >
        <span
          v-if="isCreating"
          class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
        />
        <span v-else>Create site</span>
      </button>

      <!-- DIVIDER + FOOTNOTE -->
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div class="flex-1 h-px" style="background: var(--border);" />
          <span class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">or</span>
          <div class="flex-1 h-px" style="background: var(--border);" />
        </div>
        <p class="text-xs text-center" style="color: var(--text-secondary);">
          You can update your site name later in
          <a class="font-semibold cursor-pointer hover:underline" style="color: var(--accent);">Settings → Site details</a>.
        </p>
      </div>

    </div>

  </div>

</div> 
<div v-if="activeStep === 6" class=" flex items-center mx-auto">

  <div class="w-full max-w-[700px] bg-card rounded-2xl p-8 space-y-6 text-center">
<div class="flex justify-center">
  <div class="rocket-loader">
    <div class="rocket">🚀</div>
    <div class="flame"></div>
    <div class="smoke"></div>
  </div>
</div>

    <!-- Title -->
    <h2 class="text-xl font-semibold text-text-primary">
      Setting up your workspace
    </h2>

    <p class="text-sm text-text-secondary">
      Please wait while we prepare everything for you.
    </p>

    <!-- Steps -->
    <div class="space-y-3 text-left">

      <div
        v-for="(step, index) in provisionSteps"
        :key="step"
        class="flex items-center gap-3 transition-all duration-300"
        :class="['flex items-center gap-3', `provision-step-${index}`]"
      >

        <!-- Dot -->
        <div class="w-2.5 h-2.5 rounded-full"
             :class="index <= provisionStep ? 'bg-accent' : 'bg-gray-300'">
        </div>

        <!-- Text -->
        <span class="text-sm text-text-primary">
          {{ step }}
        </span>

      </div>

    </div>

  </div>

</div>
<div v-show="activeStep === 7" class="flex items-center justify-center min-h-full">

  <div class="w-full max-w-[520px] space-y-8">

    <div class="space-y-2 text-center">
      <h2 class="text-[28px] font-semibold text-text-primary">
        Where did you hear about us?
      </h2>

      <p class="text-text-secondary text-sm">
        This helps us improve onboarding experience.
      </p>
    </div>

    <!-- chips -->
    <div class="grid grid-cols-2 gap-3">

      <button
        v-for="item in referralOptions"
        :key="item.id"
        @click="toggleReferral(item.id)"
        type="button"
        class="px-4 py-3 rounded-xl border text-sm font-medium transition"
        :class="referralSources.includes(item.id)
          ? 'bg-accent/30 border-accent'
          : 'border-border'"
      >
        {{ item.label }}
      </button>

    </div>
    <div class="flex justify-between">
       <Button v-if="activeStep != 1" variant="secondary" size="md" type="button" @click="goBack"
            :disabled="activeStep === 1">
            <div class="flex items-center gap-1">
              <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
            </div>
          </Button>
    <!-- continue -->
    <Button size="md" @click="activeStep = 8">
      Continue
    </Button>
    </div>

  </div>

</div>
<div v-show="activeStep === 8" class="flex items-center justify-center min-h-full">

  <div class="w-full max-w-[520px] space-y-8">

    <!-- header -->
    <div class="text-center space-y-2">
      <h2 class="text-[28px] font-semibold text-text-primary">
        Your workspace is ready 🎉
      </h2>

      <p class="text-text-secondary text-sm">
        Invite your team or share your workspace link.
      </p>
    </div>

    <!-- workspace url -->
    <div class="border rounded-xl p-4 flex items-center justify-between">

      <span class="text-sm text-text-primary">
        https://{{ siteSlug }}.orchit.ai
      </span>

      <button
        class="text-sm text-accent font-medium"
        @click="copySiteUrl"
      >
        Copy
      </button>

    </div>

    <!-- invite -->
  <BaseEmailChip v-model="emailList" :error="!!errors.emailList" :message="errors.emailList" />

    <!-- actions -->
    <div class="flex justify-between gap-3">
        <Button v-if="activeStep != 1" variant="secondary" size="md" type="button" @click="goBack"
            :disabled="activeStep === 1">
            <div class="flex items-center gap-1">
              <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
            </div>
          </Button>
      <Button variant="secondary" size="md" @click="router.push('/dashboard')">
        Skip
      </Button>

      <Button size="md" @click="sendInvites">
        Invite & Continue
      </Button>

    </div>

  </div>

</div>
        <!-- Nav -->
        <div class="flex justify-between  items-center mt-[40px] md:mt-[60px]  lg:mt-[132px]" v-if="activeStep !== 6 && activeStep !== 7 && activeStep !== 8 && activeStep !== 9">
          <Button v-if="activeStep != 1" variant="secondary" size="md" type="button" @click="goBack"
            :disabled="activeStep === 1">
            <div class="flex items-center gap-1">
              <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
            </div>
          </Button>

          <div class="flex gap-4 items-center ml-auto">
            <router-link
            v-if="activeStep==3"
              :to="`${workspaceStore.pricing ? `/dashboard?stripePayment=${true}` : workspaceStore.workspace ? '/create-workspace' : '/finish-profile'}`"><button
                class="text-text-primary text-sm px-3 cursor-pointer">Skip</button></router-link>
            <Button :disabled="creatingProfile || invitingPeople" size="md" type="submit" @click="continueHandler">
              {{ creatingProfile || invitingPeople ? 'Continuing...' : activeStep == 3 ? 'Invite' : 'Continue' }}
            </Button>
          </div>

        </div>
      </div>

      <div class="max-w-[500px] md:mx-auto w-full space-y-6"></div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import teamIcon from '../../assets/platform/team.svg'
import personalIcon from '../../assets/platform/personal-use.svg'
import schoolIcon from '../../assets/platform/school.svg'
import Button from '../../components/ui/Button.vue'
import BaseSelectField from '../../components/ui/BaseSelectField.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import { useRouter } from 'vue-router'
import BaseEmailChip from '../../components/ui/BaseEmailChip.vue'
import { useCreateCompany, useInviteCompany } from '../../services/auth'
import { useRolesList } from '../../queries/useCommon'
import { useWorkspaceStore } from '../../stores/workspace'
import { useAuthStore } from '../../stores/auth'
import gsap from 'gsap'
defineOptions({ name: 'OnboardingFlow' })
const workspaceStore = useWorkspaceStore()
const errors = ref<{
  team?: string
  role?: string
  companySize?: string
  emailList?: string
  personalRole?: string

  schoolName?: string
  educationLevel?: string
  fieldOfStudy?: string
  schoolUseCase?: string
  siteName?:string;
}>({})
const authStore = useAuthStore()
const personalRole = ref('')
const schoolName = ref('')
const educationLevel = ref('')
const fieldOfStudy = ref('')
const schoolUseCase = ref('')
const selectedModules = ref<string[]>([])
const isProvisioning = ref(false)
const provisionStep = ref(0)
const provisionSteps = [
  'Creating your workspace',
  'Setting up modules',
  'Preparing your dashboard',
  'Configuring personalization',
  'Almost ready...'
]
const moduleOptionsMap = {
  team: [
    { id: 'tasks', label: 'Tasks' },
    { id: 'projects', label: 'Projects' },
    { id: 'docs', label: 'Docs' },
    { id: 'goals', label: 'Goals' },

    { id: 'support', label: 'Support Desk' },
    { id: 'operations', label: 'Operations' },
    { id: 'knowledge', label: 'Knowledge Base' },

    { id: 'reporting', label: 'Reports' }
  ],

  personal: [
    { id: 'tasks', label: 'Personal Tasks' },
    { id: 'notes', label: 'Notes' },
    { id: 'planning', label: 'Daily Planning' },
    { id: 'journaling', label: 'Journaling' }
  ],

  school: [
    { id: 'notes', label: 'Notes' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'research', label: 'Research' },
    { id: 'exams', label: 'Exam Prep' }
  ]
} as const
const activeModules = computed(() => {
  return moduleOptionsMap[selected.value as keyof typeof moduleOptionsMap] || []
})
function toggleModule(id: string) {
  if (selectedModules.value.includes(id)) {
    selectedModules.value = selectedModules.value.filter(m => m !== id)
  } else {
    selectedModules.value.push(id)
  }
}
function validateCompanyStep() {
  const next: { team?: string; role?: string; companySize?: string } = {}
  if (!team.value.trim()) next.team = 'Please enter your company name.'
  if (!role.value) next.role = 'Please select your role.'
  if (!companySize.value) next.companySize = 'Please select your company size.'
  errors.value = next
  return Object.keys(next).length === 0
}

const companyID = ref()
const { mutate: createProfile, isPending: creatingProfile } = useCreateCompany({
  onSuccess: (data: any) => {
    activeStep.value = (activeStep.value + 1) as 1 | 2 | 3 | 4 | 5 | 6;
    companyID.value = data?._id
  }
});
const { mutate: invitePeople, isPending: invitingPeople } = useInviteCompany({
  onSuccess: async () => {
    if (workspaceStore.pricing) {
      await authStore.bootstrap();
      router.push(`/dashboard?stripePayment=${true}`)
    } else if (workspaceStore.workspace) {
       await authStore.bootstrap();
      router.push('/create-workspace')
    } else {
      await authStore.bootstrap();
      router.push('/finish-profile');
    }
  }
});
function validateSchoolStep() {
  const next: typeof errors.value = {}

  if (!schoolName.value.trim()) {
    next.schoolName = 'Please enter your school or university name.'
  }

  if (!educationLevel.value) {
    next.educationLevel = 'Please select your education level.'
  }

  if (!fieldOfStudy.value.trim()) {
    next.fieldOfStudy = 'Please enter your field of study.'
  }

  if (!schoolUseCase.value) {
    next.schoolUseCase = 'Please select how you will use Orchit AI.'
  }

  errors.value = { ...errors.value, ...next }

  return Object.keys(next).length === 0
}
const router = useRouter()
const { data: rolesList } = useRolesList();
// --- Static data moved out of template so it isn't re-created on every render ---
const options = Object.freeze([
  { _id: 'team', title: 'For my team', description: 'Collaborate on your docs and projects.', icon: teamIcon },
  { _id: 'personal', title: 'For personal use', description: 'Write better. Think more clearly. Stay organised.', icon: personalIcon },
  { _id: 'school', title: 'For school', description: 'Keep notes, research and tasks in one place.', icon: schoolIcon }
] as const)
// script setup additions
const isFocused  = ref(false)
const isCreating = ref(false)


const companySizeOptions = Object.freeze([
  { title: '1 – 10', _id: '1–10' },
  { title: '11 – 50', _id: '11–50' },
  { title: '51 – 200', _id: '51–200' },
  { title: '201 – 500', _id: '201–500' },
  { title: '501 – 1,000', _id: '501–1000' },
  { title: '1,001 – 5,000', _id: '1001–5000' },
  { title: '5,001 – 10,000', _id: '5001–10000' },
  { title: '10,001+', _id: '10001+' }
] as const)
function validatePersonalStep() {
  const next: { personalRole?: string } = {}

  if (!personalRole.value.trim()) {
    next.personalRole = 'Please tell us what you do.'
  }

  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}
// --- State ---
const selected = ref<'team' | 'personal' | 'school'>('team')
const activeStep = ref<1 | 2 | 3 | 4 |5 | 6 | 7 | 8 | 9| any>(1)
const role = ref('')
const team = ref('')
const companySize = ref('')
const emailList = ref<string[]>([])
const workType = ref('')
const siteName = ref('')
const siteSlug = ref('')
const isCheckingSlug = ref(false)
const isSlugAvailable = ref<boolean | null>(null)
const referralSources = ref<string[]>([])
const referralOptions = [
  { id: 'google', label: 'Google Search' },
  { id: 'social', label: 'Social Media' },
  { id: 'friend', label: 'Friend / Colleague' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'twitter', label: 'X (Twitter)' },
  { id: 'producthunt', label: 'Product Hunt' },
  { id: 'ads', label: 'Ads' },
  { id: 'blog', label: 'Blog / Article' },
  { id: 'other', label: 'Other' }
]
const inviteEmails = ref<string[]>([])
function toggleReferral(id: string) {
  if (referralSources.value.includes(id)) {
    referralSources.value = referralSources.value.filter(i => i !== id)
  } else {
    referralSources.value.push(id)
  }
}
function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
async function checkSlugAvailability() {
  if (!siteSlug.value) return

  isCheckingSlug.value = true

  try {
    // replace with real API call
    const res = await fetch(`/api/site/check?slug=${siteSlug.value}`)
    const data = await res.json()

    isSlugAvailable.value = data.available
  } catch (err) {
    isSlugAvailable.value = false
  } finally {
    isCheckingSlug.value = false
  }
}
watch(siteName, (val) => {
  siteSlug.value = generateSlug(val)
  checkSlugAvailability()
})
function validateSiteStep() {
  if (!siteName.value.trim()) {
    errors.value.siteName = 'Please enter a site name.'
    return false
  }

  if (isSlugAvailable.value === false) {
    errors.value.siteName = 'This site name is already taken.'
    return false
  }

  return true
}
function copySiteUrl() {
  globalThis.navigator.clipboard.writeText(
    `https://${siteSlug.value}.orchit.ai`
  )
}
const educationOptions = Object.freeze([
  { title: 'School', _id: 'school' },
  { title: 'College', _id: 'college' },
  { title: 'University', _id: 'university' },
  { title: 'Postgraduate', _id: 'postgraduate' }
])

const schoolUseOptions = Object.freeze([
  { title: 'Notes & Lectures', _id: 'notes' },
  { title: 'Assignments', _id: 'assignments' },
  { title: 'Research', _id: 'research' },
  { title: 'Exam Preparation', _id: 'exams' },
  { title: 'All of the above', _id: 'all' }
])
const workTypeOptions = [
  {
    id: 'software_development',
    label: 'Software Development',
    icon: 'code'
  },
  {
    id: 'product_management',
    label: 'Product Management',
    icon: 'layers'
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: 'megaphone'
  },
  {
    id: 'design',
    label: 'Design',
    icon: 'palette'
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: 'trending-up'
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: 'cog'
  },
  {
    id: 'hr',
    label: 'Human Resources',
    icon: 'users'
  },
  {
    id: 'support',
    label: 'Customer Support',
    icon: 'headphones'
  }
]
// --- UI helpers ---
function validateInviteStep() {
  const next: { emailList?: string } = {}

  // check if there is at least one non-empty email
  if (!emailList.value.length || !emailList.value.some(e => e && e.trim() !== '')) {
    next.emailList = 'Please add at least one email to invite.'
  }

  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}


function optionClass(id: string) {
  return id === selected.value ? 'bg-accent/30 border-accent' : 'border-border'
}

// --- Actions ---
// function copyToClipboard() {
//   navigator.clipboard
//     .writeText(inviteLink.value)
//     .then(() => {
//       toast.success('Copied!')
//     })
//     .catch((err) => {
//       console.error('Copy failed:', err)
//       toast.error('Copy failed')
//     })
// }

function goBack() {
  activeStep.value = Math.max(1, (activeStep.value - 1) as 1 | 2 | 3)
}
function continueHandler() {

  // =========================
  // STEP 2: ACCOUNT TYPE SETUP
  // =========================
  if (activeStep.value === 2) {

    // 👉 TEAM FLOW
    if (selected.value === 'team') {
      if (!validateCompanyStep()) return

      const payload = {
        title: team.value,
        type: selected.value,
        role_id: role.value,
        company_size: companySize.value,
      }

      createProfile({ payload })

      activeStep.value = 3
      return
    }

    // 👉 PERSONAL FLOW
    if (selected.value === 'personal') {
      if (!validatePersonalStep()) return

      const payload = {
        type: 'personal',
        role: personalRole.value
      }

      createProfile({ payload })

      activeStep.value = 3
      return
    }

    // 👉 SCHOOL FLOW
    if (selected.value === 'school') {
      if (!validateSchoolStep()) return

      const payload = {
        type: 'school',
        institution: schoolName.value,
        education_level: educationLevel.value,
        field_of_study: fieldOfStudy.value,
        primary_use: schoolUseCase.value
      }

      createProfile({ payload })

      activeStep.value = 3
      return
    }
  }


  // =========================
  // STEP 3: MODULE SELECTION
  // =========================
  if (activeStep.value === 3) {

    // personal users can skip invites/modules if needed
    if (selected.value === 'personal') {
      activeStep.value = 4
      return
    }

    if (!validateInviteStep()) return

    invitePeople({
      payload: {
        company_id: companyID.value,
        emails: [...emailList.value]
      }
    })

    activeStep.value = 4
    return
  }


  // =========================
  // STEP 4: WORK TYPE (JIRA STYLE)
  // =========================
  if (activeStep.value === 4) {

    if (!workType.value) {
      errors.value.role = 'Please select what kind of work you do.'
      return
    }
    activeStep.value = 5
  return
    // createProfile({
    //   payload: {
    //     company_id: companyID.value,
    //     work_type: workType.value,
    //     selected_modules: selectedModules.value
    //   }
    // })

    // router.push('/finish-profile')
    return
  }
if (activeStep.value === 5) {

  if (!validateSiteStep()) return

  createProfile({
    payload: {
      site_name: siteName.value,
      site_slug: siteSlug.value,
      domain: `${siteSlug.value}.orchit.ai`
    }
  })

  // router.push('/dashboard')
  return
}

  // =========================
  // DEFAULT STEP ADVANCE
  // =========================
  activeStep.value = (activeStep.value + 1) as 1 | 2 | 3 | 4
}

watch(team, (v: any) => { if (v?.trim() && errors.value.team) errors.value.team = undefined })
watch(role, (v) => { if (v && errors.value.role) errors.value.role = undefined })
watch(companySize, (v) => { if (v && errors.value.companySize) errors.value.companySize = undefined })
watch(emailList, (v) => {
  if (Array.isArray(v) && v.some(e => e && e.trim() !== '') && errors.value.emailList) {
    errors.value.emailList = undefined
  }
})
function createSite(){
  console.log("abc");
  
}
async function continueSiteHandler() {
  isCreating.value = true
  try {
    await createSite()
  } finally {
    isCreating.value = false
    activeStep.value = 6
    isProvisioning.value = true
  startProvisioningFlow()
  }
}

function startProvisioningFlow() {
  provisionStep.value = 0

  const interval = setInterval(() => {
    provisionStep.value++

    if (provisionStep.value >= provisionSteps.length - 1) {
      clearInterval(interval)

      setTimeout(() => {
        finishProvisioning()
      }, 800)
    }
  }, 1200)
}
function finishProvisioning() {
  isProvisioning.value = false
  activeStep.value = 7
}
watch(provisionStep, (newVal) => {
  nextTick(() => {
    gsap.fromTo(
      `.provision-step-${newVal}`,
      { opacity: 0, x: -10 },
      { opacity: 1, x: 0, duration: 0.4 }
    )
  })
})
function sendInvites() {
  invitePeople({
    payload: {
      company_id: companyID.value,
      emails: [...inviteEmails.value]
    }
  })
router.push({
  path: '/dashboard',
  query: { welcome: '1' }
})
}
onMounted(() => {
  gsap.to(".rocket", {
    y: -10,
    rotation: -5,
    repeat: -1,
    yoyo: true,
    duration: 0.6,
    ease: "power1.inOut"
  })

  gsap.to(".trail", {
    scaleY: 1.3,
    opacity: 0.9,
    repeat: -1,
    yoyo: true,
    duration: 0.5
  })
})
</script>

<style scoped>
.rocket-loader {
  position: relative;
  width: 70px;
  height: 70px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 7px solid #6e3b96;
  border-radius: 50%;
}

/* ROCKET BODY */
.rocket {
  font-size: 28px;
  z-index: 2;

  /* IMPORTANT: no simple float */
  animation: rocketShake 0.25s infinite linear;
}

/* ENGINE FLAME */
.flame {
  position: absolute;
  bottom: 8px;
  width: 10px;
  height: 18px;
  background: linear-gradient(to top, #ff7a18, #ffb347, transparent);
  border-radius: 50%;
  filter: blur(0.6px);

  animation: flameFlicker 0.12s infinite alternate;
}

/* SMOKE PULSE */
.smoke {
  position: absolute;
  bottom: 0;
  width: 26px;
  height: 26px;
  background: radial-gradient(circle, rgba(124,92,252,0.25), transparent 70%);
  border-radius: 50%;

  animation: smokePulse 0.9s infinite ease-in-out;
}

/* 🚀 jitter = engine vibration (key Jira feel) */
@keyframes rocketShake {
  0%   { transform: translateY(0px) rotate(0deg); }
  25%  { transform: translateY(-1px) rotate(-1deg); }
  50%  { transform: translateY(0px) rotate(1deg); }
  75%  { transform: translateY(1px) rotate(-1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}

/* 🔥 flame instability */
@keyframes flameFlicker {
  0% {
    height: 14px;
    opacity: 0.7;
    transform: scaleX(0.9);
  }
  100% {
    height: 26px;
    opacity: 1;
    transform: scaleX(1.2);
  }
}

/* 🌫 smoke expansion */
@keyframes smokePulse {
  0% {
    transform: scale(0.6);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
@media(max-width:640px) {
  .how_help_steps {
    grid-template-columns: 1fr 1fr !important;
  }
}

@media(max-width:350px) {
  .how_help_steps {
    grid-template-columns: 1fr !important;
  }
}
</style>