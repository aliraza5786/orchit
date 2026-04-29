<template>
  <AuthLayout
  :steps="stepLabels"
  :activeStep="displayStep"
  :showSteps="activeStep !== 6"
>
    <template #form>
      <div class="max-w-125 mx-auto w-full min-h-full py-5 flex flex-col justify-center">
        <!-- Step 1 -->
        <div class="mb-6 md:mb-12 space-y-2" v-show="activeStep === 1">
          <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-once>
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
          <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-if="selected ==='team'">
           Tell us about your company
          </h2>
         <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-if="selected ==='personal'">
           Tell us about yourself
          </h2>
          <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-if="selected ==='school'">
           Tell us about your School
          </h2>
          <p class="text-[14px] md:text-base sm:text-nowrap font-medium text-text-secondary" v-once>
            This will help us personalize your experience in Orchit AI.
          </p>
        </div>

        <div class="space-y-6" v-show="activeStep === 2 && selected === 'team'">
          <div class="space-y-1.5">
  <BaseTextField
    v-model="team"
    label="Company Name"
    placeholder="Company name"
    size="lg"
    :error="!!errors.team"
    :message="errors.team"
  />
</div>

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
<BaseSelectField v-model="role" label="What is your role in school?" :options="rolesList || []"
            placeholder="Select Role" size="lg" :error="!!errors.role" :message="errors.role" />

</div>
<div v-show="activeStep === 3" class="space-y-6">

  <!-- Heading -->
  <div class="space-y-2">
    <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary">
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
    <p v-if="errors.selectedModules" class="text-xs text-red-500">
    {{ errors.selectedModules }}
  </p>
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
<div v-if="activeStep === 5" class="flex items-center justify-center w-full min-h-full py-10">

  <div class="w-full max-w-115">

    <!-- CARD -->
    <div class="rounded-2xl border p-10 space-y-6" style="background: var(--bg-card); border-color: var(--border);">

      <!-- HEADER -->
      <div class="text-center space-y-3">

        <!-- Icon -->
        <div class="w-14 h-14 rounded-[14px] border flex items-center justify-center mx-auto"
          style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.2);">
             <img src="/src/assets/global/favicon.png"  alt="logo">
        </div>

        <h2 class="text-[22px] font-bold tracking-tight" style="color: var(--text-primary);">
          Create your site
        </h2>
        <p class="text-sm leading-relaxed max-w-75 mx-auto" style="color: var(--text-secondary);">
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
            'ring-[3px] ring-(--accent)/[0.14]': isFocused && isSlugAvailable !== false,
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
            class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
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
              class="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
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
                class="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                style="background: #1d9e75;">
                <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span v-else-if="isSlugAvailable === false && !isCheckingSlug"
                class="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                style="background: #e55050;">
                <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M3 3l4 4M7 3l-4 4" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </span>
            </Transition>
          </div>
        </div>
          <p v-if="isSlugAvailable === false && !isCheckingSlug"
            class="text-xs" style="color: #e55050;">
            This site name is already taken. Please choose another.
          </p>
          <p v-else-if="isSlugAvailable === true && !isCheckingSlug"
            class="text-xs" style="color: #1d9e75;">
            <span class="font-medium">{{ siteSlug }}</span>.orchit.ai is available
          </p>
          <p v-else class="text-xs" style="color: var(--text-secondary);">
            This is just a suggestion — feel free to change it to something your team will recognize.
          </p>

      </div>

      <!-- LIVE URL PREVIEW -->
      <div v-if="siteSlug"
        class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 border"
        style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.18);">
        <div class="w-2 h-2 rounded-full shrink-0" style="background: var(--accent); opacity: 0.7;" />
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
  :disabled="!siteName || isCheckingSlug || isCreating || creatingProfile"
  class="w-full flex items-center justify-center gap-2 py-3.25 rounded-[9px] text-[15px] font-bold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
  style="background: var(--accent); color: var(--accent-text);"
  :style="(!isCreating && !creatingProfile) ? 'box-shadow: 0 2px 0 rgba(0,0,0,0.15)' : ''"
  @mouseenter="(e) => (!isCreating && !creatingProfile) && ((e.target as HTMLButtonElement).style.background = 'var(--accent-hover)')"
  @mouseleave="(e) => ((e.target as HTMLButtonElement).style.background = 'var(--accent)')"
  @click="continueSiteHandler"
>
  <span
    v-if="isCreating || creatingProfile"
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
<div v-if="activeStep === 6" class="flex items-center justify-center mx-auto">
  <LoadingCreateProfile :active="activeStep === 6" :abort="!!companySlugError" @complete="activeStep = 7" />
</div>
<div v-show="activeStep === 7" class="flex items-center justify-center min-h-full">
  <div class="w-full max-w-130 space-y-8">

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

    <!-- ✅ Step 7 own nav -->
    <div class="flex justify-between items-center mt-10 md:mt-15">
      <Button variant="secondary" size="md" type="button" @click="goBack">
        <div class="flex items-center gap-1">
          <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
        </div>
      </Button>
      <Button 
  :disabled="isSiteStepBlocked || creatingProfile || updatingProfile || invitingPeople" 
  :class="{ 'pointer-events-none': isSiteStepBlocked }"
  size="md" 
  type="submit" 
  @click="activeStep === 5 ? continueSiteHandler() : continueHandler()"
>
  <div class="flex items-center gap-2">
    <span 
      v-if="creatingProfile && activeStep === 5" 
      class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" 
    />
    <span>Continue</span>
  </div>
</Button>
    </div>

  </div>
</div>
<div v-show="activeStep === 8" v-if="selected === 'team' || selected === 'school'" class="flex items-center justify-center min-h-full">

  <div class="w-full max-w-120 space-y-7">

    <!-- header -->
   <div class="space-y-2">
  <h2 class="text-[26px] font-semibold text-text-primary">
    {{ selected === 'school' ? 'Better when studied together' : 'Better when used together' }}
  </h2>
  <p class="text-text-secondary text-sm leading-relaxed">
    {{ selected === 'school' 
      ? 'Orchit AI works better with your classmates onboard. Invite someone to try it with you.'
      : 'Orchit AI works better with your team onboard. Invite a teammate to try it out with you.'
    }}
  </p>
</div>

    <!-- share via link -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium text-text-primary">Share via link</label>
      <p class="text-xs text-text-secondary mb-1">
    {{ selected === 'school' 
      ? 'Invite classmates or teachers to join your school workspace.' 
      : 'Invite teammates to join your company workspace.' 
    }}
  </p>
      <div class="flex items-center gap-2">
        <div class="flex-1 border border-border rounded-lg px-3 py-2 bg-surface overflow-hidden">
  <span class="text-sm text-text-secondary truncate block">
    {{ joinLink }}
  </span>
</div>
        <Button variant="secondary" size="md" @click="copySiteUrl">
  <div class="flex items-center gap-1.5 transition-all duration-200">
    <FontAwesomeIcon
      :icon="['fas', isCopied ? 'check' : 'link']"
      :class="isCopied ? 'text-green-500' : ''"
      class="transition-all duration-200"
    />
    <span :class="isCopied ? 'text-green-500' : ''" class="transition-colors duration-200">
      {{ isCopied ? 'Copied!' : 'Copy link' }}
    </span>
  </div>
</Button>
      </div>
    </div>

    <!-- invite via email -->
    <div class="space-y-1.5">
      <label class="text-sm font-medium text-text-primary">Invite via email</label>
      <BaseEmailChip
        v-model="emailList"
        :error="!!errors.emailList"
        :message="errors.emailList"
      />
    </div>

    <!-- actions -->
<!-- actions -->
<div class="flex items-center justify-between pt-2">
  <Button 
    variant="secondary" 
    size="md" 
    :disabled="invitingPeople"
    @click="sendInvites"
  >
    <div class="flex items-center gap-2">
      <span v-if="invitingPeople" class="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      <span>Do this later</span>
    </div>
  </Button>

  <Button 
    size="md" 
    :disabled="invitingPeople"
    @click="sendInvites"
  >
    <div class="flex items-center gap-2">
      <span v-if="invitingPeople" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
      <span>Invite</span>
    </div>
  </Button>
</div>

  </div>

</div>
<!-- ✅ KEEP THIS ONE — the original at the bottom -->
<div class="flex justify-between items-center mt-10 md:mt-15" 
  v-if="activeStep !== 6 && activeStep !== 7 && activeStep !== 8 && activeStep !== 9">
  
  <Button v-if="activeStep != 1" variant="secondary" size="md" type="button" @click="goBack"
    :disabled="activeStep === 1">
    <div class="flex items-center gap-1">
      <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
    </div>
  </Button>

  <div class="flex gap-4 items-center ml-auto">
    <router-link
      v-if="activeStep == 3"
      :to="`${workspaceStore.pricing ? `/dashboard?stripePayment=${true}` : workspaceStore.workspace ? '/create-workspace' : '/finish-profile'}`">
    </router-link>
<Button 
  :disabled="isSiteStepBlocked || creatingProfile || updatingProfile || invitingPeople" 
  size="md" 
  type="submit" 
  @click="activeStep === 5 ? continueSiteHandler() : continueHandler()"
>
  Continue 
</Button>
  </div>

</div>
      </div>

      <div class="max-w-125 md:mx-auto w-full space-y-6"></div>
       <!-- Company slug conflict error modal -->
<Transition
  enter-active-class="transition duration-150 ease-out"
  enter-from-class="opacity-0 scale-95"
  enter-to-class="opacity-100 scale-100"
  leave-active-class="transition duration-100 ease-in"
  leave-from-class="opacity-100 scale-100"
  leave-to-class="opacity-0 scale-95"
>
  <div
    v-if="companySlugError"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
    @click.self="companySlugError = null"
  >
    <div class="w-full max-w-md rounded-2xl bg-bg-dropdown p-6 shadow-xl ring-1 ring-black/5">
      <!-- Icon -->
      <div class="mb-4 flex h-13 w-13 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <i class="fa-solid fa-triangle-exclamation text-red-500 text-lg"></i>
      </div>

      <!-- Title -->
      <h3 class="text-md font-semibold text-text-primary mb-1">
        Company name already taken
      </h3>

      <!-- Message -->
      <p class="text-sm text-text-secondary leading-relaxed mb-5">
        {{ companySlugError }}
      </p>

      <!-- Actions -->
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-lg border border-black/10 bg-bg-dropdown px-3 py-2.5 text-sm font-medium text-text-secondary hover:border-black/20 hover:text-text-primary transition cursor-pointer"
          @click="companySlugError = null"
        >
          Dismiss
        </button>
        <button
          type="button"
          class="flex-[1.5] rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition cursor-pointer"
          @click="() => { companySlugError = null; activeStep = 2 }"
        >
          Change company name
        </button>
      </div>
    </div>
  </div>
</Transition>
    </template>
   
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import teamIcon from '../../assets/platform/team.svg'
import personalIcon from '../../assets/platform/personal-use.svg'
import schoolIcon from '../../assets/platform/school.svg'
import Button from '../../components/ui/Button.vue'
import BaseSelectField from '../../components/ui/BaseSelectField.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import { useRouter } from 'vue-router'
import BaseEmailChip from '../../components/ui/BaseEmailChip.vue'
import { useCreateCompany, useUpdateCompany, useInviteCompany } from '../../services/auth'
import { updateProfile as updateUserProfile } from '../../services/user'
import { useRolesList } from '../../queries/useCommon'
import { useWorkspaceStore } from '../../stores/workspace'
import { useAuthStore } from '../../stores/auth'
import LoadingCreateProfile from '../../components/LoadingCreateProfile.vue'
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
  siteName?:string;
  selectedModules?: string
}>({})
const authStore = useAuthStore()
const personalRole = ref('')
const schoolName = ref('')
const educationLevel = ref('')
const selectedModules = ref<string[]>([])
const isProvisioning = ref(false)
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
const joinLink = ref('')
const domainLink = ref('')
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
  { id: 'group_projects', label: 'Group Projects' },
  { id: 'research', label: 'Research' },
  { id: 'exam_prep', label: 'Exam Prep' },
  { id: 'class_management', label: 'Class Management' },
  { id: 'lecture_planning', label: 'Lecture Planning' },
  { id: 'homework_tracking', label: 'Homework Tracking' },
  { id: 'project_tracking', label: 'Project Tracking' },
  { id: 'study_planning', label: 'Study Planning' },
  { id: 'revision_schedule', label: 'Revision Schedule' },
  { id: 'collaboration', label: 'Student Collaboration' },
  { id: 'task_management', label: 'Task Management' }
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
watch(siteName, async (val) => {
  siteSlug.value = generateSlug(val)

  if (!siteSlug.value) {
    isSlugAvailable.value = null
    return
  }

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
// Add this ref at the top with your other refs
const companySlugError = ref<string | null>(null)
const { mutate: createProfile, isPending: creatingProfile } = useCreateCompany({
onSuccess: (data: any) => {
  const payload = data?.data ?? data

  if (!payload || payload?.status === false) {
    const serverMessage = payload?.message ?? ''
    const isSlugConflict =
      serverMessage.toLowerCase().includes('slug') ||
      serverMessage.toLowerCase().includes('already exists') ||
      serverMessage.toLowerCase().includes('company name')

    companySlugError.value = isSlugConflict
      ? 'A company with a similar name already exists. Please go back and try a different company name.'
      : 'Something went wrong while creating your company. Please try again.'
    return
  }

  const id = payload?.company_id ?? payload?._id
  const join = payload?.join_link ?? ''
  const domain = payload?.domain_link ?? ''

  companyID.value = id
  joinLink.value = join
  domainLink.value = domain

  if (selected.value === 'team') {
    localStorage.setItem('company_id', id ?? '')
    // ✅ Move to loading step directly
    activeStep.value = 6
    isProvisioning.value = true
  } else {
    const userId = authStore.user?._id ?? ''
    localStorage.setItem('user_id', userId)
    activeStep.value = 6
    isProvisioning.value = true
  }
},
  onError: (error: any) => {
    const serverMessage = error?.response?.data?.message ?? error?.message ?? ''
    const isSlugConflict =
      serverMessage.toLowerCase().includes('slug') ||
      serverMessage.toLowerCase().includes('already exists')

    companySlugError.value = isSlugConflict
      ? 'A company with a similar name already exists. Please go back and try a different company name.'
      : 'Something went wrong while creating your company. Please try again.'
  },
})
const { mutate: updateProfile, isPending: updatingProfile } = useUpdateCompany({
  onSuccess: async () => {
    // For team: move to step 8 (invite team)
    if (selected.value === 'team' || selected.value === 'school') {
      activeStep.value = 8
      return
    }
    // For personal and school: proceed to next steps
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
  },
  onError: () => {
    // If error on step 7, go back to step 5
    activeStep.value = 5
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
// const inviteEmails = ref<string[]>([])
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

const isCopied = ref(false)
function copySiteUrl() {
  const url = joinLink.value;
  globalThis.navigator.clipboard.writeText(url).then(() => {
    isCopied.value = true
    setTimeout(() => isCopied.value = false, 2000)
  })
}
const educationOptions = Object.freeze([
  { title: 'School', _id: 'school' },
  { title: 'College', _id: 'college' },
  { title: 'University', _id: 'university' },
  { title: 'Postgraduate', _id: 'postgraduate' }
])

const workTypeOptionsMap = {
  team: [
    { id: 'software_development', label: 'Software Development', icon: 'code' },
    { id: 'product_management', label: 'Product Management', icon: 'layer-group' },
    { id: 'marketing', label: 'Marketing', icon: 'bullhorn' },
    { id: 'design', label: 'Design', icon: 'palette' },
    { id: 'sales', label: 'Sales', icon: 'chart-line' },
    { id: 'operations', label: 'Operations', icon: 'cog' },
    { id: 'hr', label: 'Human Resources', icon: 'users' },
    { id: 'support', label: 'Customer Support', icon: 'headset' }
  ],

  school: [
    { id: 'study', label: 'Study & Learning', icon: 'book' },
    { id: 'assignments', label: 'Assignments', icon: 'file-lines' },
    { id: 'group_projects', label: 'Group Projects', icon: 'users' },
    { id: 'research', label: 'Research', icon: 'magnifying-glass' },
    { id: 'exam_prep', label: 'Exam Prep', icon: 'pen' },
    { id: 'class_management', label: 'Class Management', icon: 'chalkboard' },
    { id: 'teaching', label: 'Teaching', icon: 'person-chalkboard' },
    { id: 'notes', label: 'Notes', icon: 'clipboard' }
  ],

  personal: [
    { id: 'task_management', label: 'Task Management', icon: 'check-square' },
    { id: 'learning', label: 'Learning', icon: 'book' },
    { id: 'goal_tracking', label: 'Goal Tracking', icon: 'bullseye' },
    { id: 'daily_planning', label: 'Daily Planning', icon: 'calendar' }
  ]
};
const workTypeOptions = computed(() => {
  return workTypeOptionsMap[selected.value] || [];
});
function optionClass(id: string) {
  return id === selected.value ? 'bg-accent/30 border-accent' : 'border-border'
}

function buildProfilePayload() {
  const basePayload: Record<string, any> = {
    work_to_do: workType.value,
    like_to_manage: selectedModules.value,
    heard_about_us: referralSources.value,
  }

  if (selected.value === 'team') {
    return {
      ...basePayload,
      title: team.value,
      type: selected.value,
      role_id: role.value,
      company_size: companySize.value,
    }
  } else if (selected.value === 'personal') {
    return {
      ...basePayload,
      type: 'personal',
     u_work_to_do: personalRole.value,
    }
  } else if (selected.value === 'school') {
    return {
      ...basePayload,
      type: 'school',
      title: schoolName.value,
      company_size: educationLevel.value,
       role_id: role.value,
    }
  }

  return basePayload
}

function goBack() {
  // From step 7, go back to step 5 (skip loading phase at step 6)
  if (activeStep.value === 7) {
    activeStep.value = 5
    return
  }
  // From step 8, go back to step 7
  if (activeStep.value === 8) {
    activeStep.value = 7
    return
  }
  // Default: go back one step, but not below 1
  activeStep.value = Math.max(1, (activeStep.value - 1) as 1 | 2 | 3)
}
const isUpdatingProfile = ref(false)
async function continueHandler() {
  if (activeStep.value === 2) {

    // 👉 TEAM FLOW
    if (selected.value === 'team') {
      if (!validateCompanyStep()) return
      activeStep.value = (activeStep.value + 1) as 1 | 2 | 3 | 4
      return
    }

    // 👉 PERSONAL FLOW
    if (selected.value === 'personal') {
      if (!validatePersonalStep()) return
      activeStep.value = (activeStep.value + 1) as 1 | 2 | 3 | 4
      return
    }

    // 👉 SCHOOL FLOW
    if (selected.value === 'school') {
      if (!validateSchoolStep()) return
      activeStep.value = (activeStep.value + 1) as 1 | 2 | 3 | 4
      return
    }
  }

  if (activeStep.value === 3) {
    if (selectedModules.value.length === 0) {
      errors.value.selectedModules = 'Please select at least one option.'
      return
    }
    activeStep.value = (activeStep.value + 1) as 1 | 2 | 3 | 4
    return
  }
if (activeStep.value === 4) {
  if (!workType.value) {
    errors.value.role = 'Please select what kind of work you do.'
    return
  }

  if (selected.value === 'school') {
    activeStep.value = (activeStep.value + 1) as 1 | 2 | 3 | 4
    return
  }

  if (selected.value === 'personal') {
    isUpdatingProfile.value = true
    try {
      await updateUserProfile({
        u_work_to_do: personalRole.value,
        work_to_do: workType.value,
        like_to_manage: selectedModules.value,
        heard_about_us: referralSources.value,
      })
      activeStep.value = 6
    } finally {
      isUpdatingProfile.value = false
    }
    return
  }

  // For team: continue to step 5 (site creation)
  activeStep.value = 5
  return
}
if (activeStep.value === 7) {
  const payload = buildProfilePayload()
  
  if (selected.value === 'personal') {
    await updateUserProfile({
      u_work_to_do: personalRole.value,
      work_to_do: workType.value,
      like_to_manage: selectedModules.value,
      heard_about_us: referralSources.value,
    })
    router.push({ path: '/finish-profile', query: { welcome: '1', type: 'personal' } })
  } else if (selected.value === 'team' || selected.value === 'school') {
    updateProfile({ payload })
  } else {
    updateProfile({ payload })
  }
  return
}
  // DEFAULT STEP ADVANCE
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
async function continueSiteHandler() {
  isCreating.value = true
  try {
    const payload = buildProfilePayload()
    createProfile({ payload })
  } finally {
    isCreating.value = false
  }
}
function setAuthCookie(token: string) {
  const maxAge = 60 * 60 * 24 * 30 // 30 days
  const hostname = window.location.hostname

  let cookieString = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`

  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    // localhost — no domain, no Secure
    document.cookie = cookieString
  } else if (hostname.endsWith('.orchit.ai') || hostname === 'orchit.ai') {
    // streamed.space subdomains
    cookieString += `; domain=.orchit.ai; Secure`
    document.cookie = cookieString
  } else if (hostname.endsWith('.orchit.ai') || hostname === 'orchit.ai') {
    // orchit.ai subdomains
    cookieString += `; domain=.orchit.ai; Secure`
    document.cookie = cookieString
  }

  console.log('🍪 cookie set for:', hostname, '→', cookieString)
}
function sendInvites() {
  const token = localStorage.getItem('token')
  if (token) setAuthCookie(token)
  if (token) {
    authStore.writeAuthCookie({ token })
  }
  const encodedToken = token
    ? btoa(token).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.')
    : ''

  // ✅ Use companyID ref directly — already set in createProfile onSuccess
  const companyIdRaw = companyID.value ?? localStorage.getItem('company_id') ?? ''
  const encodedCompanyId = companyIdRaw
    ? btoa(companyIdRaw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.')
    : ''
  const domain = domainLink.value ?? ''
  const query: Record<string, string> = {
    siteSlug: siteSlug.value,
    domainLink: domain,
    type: 'team',
  }

  if (encodedToken) query._auth = encodedToken
  if (encodedCompanyId) query._cid = encodedCompanyId
  if (emailList.value.length > 0) {
    invitePeople(
      {
        payload: {
          company_id: companyID.value,
          emails: [...emailList.value]
        }
      },
      {
        onSuccess: () => {
          router.push({ path: '/finish-profile', query })
        }
      }
    )
  } else {
    router.push({ path: '/finish-profile', query })
  }
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
// active steps
const stepLabels = computed(() => {
  if (selected.value === 'personal') {
    return ['Purpose', 'About You', 'Modules', 'Work Type', 'Hearing About Us', 'Invite Team']
  }
  if (selected.value === 'school') {
    return ['Purpose', 'About School', 'Modules', 'Work Type', 'Hearing About Us', 'Invite Team']
  }
  // team (default)
  return ['Purpose', 'About Company', 'Modules', 'Work Type', 'Create Site', 'Hearing About Us', 'Invite Team']
})
const displayStep = computed(() => {
  if (selected.value === 'personal' || selected.value === 'school') {
    if (activeStep.value <= 4) return activeStep.value
    if (activeStep.value === 7) return 5
    if (activeStep.value === 8) return 6
  }
  // team: all steps 1-8, skip loading (6)
  if (activeStep.value <= 5) return activeStep.value
  if (activeStep.value === 7) return 6
  if (activeStep.value === 8) return 7
  return activeStep.value
})
const isSiteStepBlocked = computed(() => {
  if (activeStep.value !== 5) return false
  if (selected.value !== 'team' && selected.value !== 'school') return false
  return !isSlugAvailable.value || isCheckingSlug.value
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