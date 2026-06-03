<template>
  <div :key="isStartOver"
    class="create-workspace-page px-[15px] pt-[100px] md:pt-[110px] lg:pt-[120px] pb-[40px] md:pb-[50px] lg:pb-[70px] w-full justify-start items-center flex flex-col relative overflow-hidden">
    <div v-if="currentStep === 0" class="create-workspace-ambient pointer-events-none" aria-hidden="true">
      <div class="ambient-orb ambient-orb--1"></div>
      <div class="ambient-orb ambient-orb--2"></div>
    </div>
    <div class="flex justify-between items-center fixed top-0 z-[2] w-full flex-row px-[15px] bg-bg-surface border-b border-border h-[60px] lg:h-[70px]"
      v-show="isStepperVisible">
      <div class="flex items-center py-5 justify-start gap-2 md:gap-4 overflow-x-auto no-scrollbar max-w-[calc(100%-40px)]"
        v-memo="[currentStep]">
        <div v-for="(step, index) in STEPS" :key="index" class="flex items-center group">
          <div class="flex items-center gap-2">
            <!-- Step Circle Indicator -->
            <div 
              class="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-[10px] md:text-xs font-semibold transition-all duration-300 border-2"
              :class="[
                index < currentStep 
                  ? 'bg-accent border-accent text-accent-text' 
                  : index === currentStep 
                    ? 'bg-bg-body border-accent text-accent shadow-[0_0_10px_rgba(125,104,200,0.3)]' 
                    : 'bg-bg-body border-border text-text-secondary'
              ]"
            >
              <i v-if="index < currentStep" class="fa-solid fa-check"></i>
              <span v-else>{{ index + 1 }}</span>
            </div>
            
            <!-- Step Label -->
            <span 
              class="whitespace-nowrap transition-colors duration-300 font-medium text-[10px] md:text-sm"
              :class="index <= currentStep ? 'text-text-primary' : 'text-text-secondary'"
            >
              {{ step }}
            </span>
          </div>

          <!-- Connecting Line -->
          <div 
            v-if="index < STEPS.length - 1" 
            class="mx-2 md:mx-4 h-[2px] w-4 md:w-8 transition-colors duration-300"
            :class="index < currentStep ? 'bg-accent' : 'bg-text-secondary'"
          ></div>
        </div>
      </div>
      <div class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-bg-body transition-colors duration-200 cursor-pointer" @click="handleClose" aria-label="Close">
        <i class="fa-regular fa-close text-lg"></i>
      </div>
    </div>
    <div
      class="z-[1] overflow-y-auto h-auto flex-grow relative flex flex-col gap-10 max-w-[800px] mx-auto w-full items-center">
      <template v-if="currentStep === 0">
        <IdealStep @manual="onManualStart" />
      </template>
      <StepOne v-if="currentStep === 1" :ai="isAI" ref="stepOneRef" @next="goNext2" />
      <KeepAlive>
        <StepTwo v-if="currentStep === 2" :ai="isAI" ref="stepTwoRef" @next="goNext2" />
      </KeepAlive>
      <KeepAlive>
        <StepThree v-if="currentStep === 3" :ai="isAI" ref="stepThreeRef" @next="goNext" />
      </KeepAlive>
      <StepFour v-if="currentStep === 4" :ai="isAI" ref="stepFourRef" @back="startOver" />
    </div>
    <div v-if="currentStep !== 0"
  class="flex z-2 bg-bg-body justify-between mt-15 fixed bottom-0 w-full px-6 border-t items-center border-border h-[80px]">
  
  <Button variant="secondary" size="md" :disabled="isLoading" @click="goBack">
    <div class="flex items-center gap-2">
      <i class="text-sm fa-solid fa-arrow-left"></i> Back
    </div>
  </Button>

  <div class="flex items-center gap-2 ml-auto">
    <Button v-if="showSkip" variant="secondary" size="md" @click="handleSkip">
      Skip
    </Button>

    <Button :disabled="continueDisabled" :loading="isLoading" size="md" variant="primary" @click="goNext">
      <div class="flex items-center w-full justify-between gap-2">
        {{ continueLabel }}
        <i v-if="!isLoading" class="text-sm fa-solid fa-arrow-right"></i>
      </div>
    </Button>
  </div>
</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineAsyncComponent, shallowRef, } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from '../../components/ui/Button.vue'
import IdealStep from './steps/IdealStep.vue'
import StepOneSync from './steps/StepOne.vue'
const StepOne = StepOneSync
const StepTwo = defineAsyncComponent(() => import('./steps/StepTwo.vue'))
const StepThree = defineAsyncComponent(() => import('./steps/StepThree.vue'))
const StepFour = defineAsyncComponent(() => import('./steps/StepFour.vue'))
import { useWorkspaceStore } from '../../stores/workspace';
import { getToken } from '../../stores/auth';
import { useTheme } from '../../composables/useTheme';
const { theme } = useTheme();
defineOptions({ name: 'CreateWorkspace' })
const router = useRouter()
const route = useRoute()
const workspaceStore = useWorkspaceStore()
const STEPS = Object.freeze([
  'Get Started',
  'Project Setup',
  'Define Work streams',
  'Team Planning',
  'Review Space'
] as const)


const draftMeta = workspaceStore.hydrateWorkspaceDraft()

function resolveInitialStep(): 0 | 1 | 2 | 3 | 4 {
  const saved = draftMeta?.currentStep
  if (saved !== undefined && saved >= 0 && saved <= 4) {
    return saved as 0 | 1 | 2 | 3 | 4
  }
  if (!workspaceStore.workspace) return 0
  return workspaceStore.workspace?.logo ? 4 : 1
}

const currentStep = ref<0 | 1 | 2 | 3 | 4>(resolveInitialStep())
const isStepperVisible = ref(true)
const isAI = ref(draftMeta?.isAI ?? true)

watch(
  [currentStep, isAI],
  ([step, ai]) => {
    if (workspaceStore.workspace) {
      saveCreateWorkspaceDraft(workspaceStore.workspace, {
        currentStep: step,
        isAI: ai,
      })
    }
  },
)
type StepOneInst = InstanceType<typeof StepOneSync> | null
type StepTwoInst = InstanceType<typeof StepTwo> | null
type StepFourInst = InstanceType<typeof StepFour> | null
const isStartOver = ref(0);
const stepOneRef = shallowRef<StepOneInst>(null)
const stepTwoRef = shallowRef<StepTwoInst>(null)
const stepThreeRef = shallowRef<StepTwoInst>(null)
const stepFourRef = shallowRef<StepFourInst>(null)
const showSkip = computed(() => currentStep.value === 2 || currentStep.value === 3)
const stepOnePending = computed<boolean>(() => {
  const inst = stepOneRef.value as unknown as {
    isPending?: boolean | { value: boolean }
    isPrivatePending?: boolean | { value: boolean }
  } | null

  if (!inst) return false

  const pending =
    typeof inst.isPending === 'object'
      ? inst.isPending?.value
      : inst.isPending

  const privatePending =
    typeof inst.isPrivatePending === 'object'
      ? inst.isPrivatePending?.value
      : inst.isPrivatePending

  return !!(pending || privatePending)
})

const isLoading = computed(() => {
  if (currentStep.value === 1) return stepOnePending.value
  if (currentStep.value === 4) {
    if (!stepFourRef.value) return false
    return !!(stepFourRef.value.createWorkspacePending || stepFourRef.value.isPending)
  }
  return false
})

const continueDisabled = computed(() => isLoading.value)
const continueLabel = computed(() => {
  if (isLoading.value) {
    if (currentStep.value === 1) return 'Continuing...'
    if (currentStep.value === 4) return 'Creating...'
    return 'Loading...'
  }
  return currentStep.value === 4 ? 'Complete' : 'Continue'
})
function handleClose() {
  const type = route.query.type as string
  const encodedToken = route.query._auth as string
  const domainLink = route.query.domainLink as string
  const encodedCompanyId = route.query._cid as string
  const encodedUserId = route.query._uid as string

  if (type === 'personal') {
    router.push({ path: '/dashboard', query: { welcome: '1', theme: theme.value } })
    return
  }

  if (!encodedToken && !domainLink) {
    if (getToken()) {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
    return
  }

  const isLocalhost = window.location.hostname === 'localhost'

  if (isLocalhost) {
    const port = window.location.port ? `:${window.location.port}` : ''
    const subdomainUrl = `http://custom.localhost${port}/dashboard?welcome=1&_auth=${encodedToken}&_cid=${encodedCompanyId}&_uid=${encodedUserId}&theme=${theme.value}`
    localStorage.setItem('subdomainUrl', subdomainUrl)
    window.location.href = subdomainUrl
  } else if (domainLink) {
    const base = domainLink.endsWith('/') ? domainLink.slice(0, -1) : domainLink
    const subdomainUrl = `${base}/dashboard?welcome=1&_auth=${encodedToken}&_cid=${encodedCompanyId}&_uid=${encodedUserId}&theme=${theme.value}`
    localStorage.setItem('subdomainUrl', subdomainUrl)
    window.location.href = subdomainUrl
  } else {
    router.push({ path: '/dashboard', query: { welcome: '1', theme: theme.value } })
  }
}
import { onMounted, watch } from 'vue'
import { saveCreateWorkspaceDraft } from './workspaceDraft'

onMounted(() => {
  const wsFeature = workspaceStore.getFeature('no-of-workspaces')
  if (wsFeature && wsFeature.usage.current >= wsFeature.limits.limit) {
    workspaceStore.setLimitExccedModal(true)
    handleClose()
  }
})

function onManualStart(e: any) {
  isStartOver.value++;
  if (e == 'mannual')
    isAI.value = false
  currentStep.value = 1
}

function goNext() {
  if (currentStep.value === 1 && stepOneRef.value?.continueHandler) {
    stepOneRef.value.continueHandler()
    return
  }
  if (currentStep.value === 2 && stepTwoRef.value?.continueHandler) {
    stepTwoRef.value.continueHandler()
    return
  }
  if (currentStep.value === 3 && stepThreeRef.value?.continueHandler) {
    stepThreeRef.value.continueHandler()
    goNext2()
    return
  }
  if (currentStep.value === 4 && stepFourRef.value?.createProjectHandler ) {
    if (!localStorage.getItem('token')) {
      router.push('/register')
    }
    stepFourRef.value.createProjectHandler()
    return
  }
  if (currentStep.value < 4) currentStep.value = (currentStep.value + 1) as typeof currentStep.value
}
function goNext2() {
  currentStep.value = (currentStep.value + 1) as typeof currentStep.value

}
function goBack() {
  if (currentStep.value > 0) currentStep.value = (currentStep.value - 1) as typeof currentStep.value
}
function handleSkip() {
  currentStep.value = 4
}
function startOver() {
  workspaceStore.clearWorkspaceDraft()
  currentStep.value = 0
  isStartOver.value++;
}


</script>

<style scoped>
.create-workspace-ambient {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}
.ambient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  opacity: 0.35;
}
.ambient-orb--1 {
  width: 320px;
  height: 320px;
  top: -80px;
  right: -60px;
  background: color-mix(in srgb, var(--accent) 28%, transparent);
  animation: ambientDrift 14s ease-in-out infinite;
}
.ambient-orb--2 {
  width: 260px;
  height: 260px;
  bottom: 10%;
  left: -40px;
  background: color-mix(in srgb, var(--accent-hover) 22%, transparent);
  animation: ambientDrift 18s ease-in-out infinite reverse;
}
@keyframes ambientDrift {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  50% {
    transform: translate(12px, 18px) scale(1.06);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
