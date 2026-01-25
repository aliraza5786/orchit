<template>
  <div :key="isStartOver"
    class="px-2 pt-[100px] md:pt-[120px] lg:pt-[170px] pb-[40px] md:pb-[60px] lg:pb-[100px] w-full justify-start items-center flex flex-col relative">
    <div class="flex justify-between items-center fixed top-0 z-1 w-full flex-row px-5 bg-bg-surface border-b border-border h-[60px] lg:h-[70px]"
      v-show="isStepperVisible">
      <div class="flex max-md:flex-wrap max-md:gap-2 text-sm max-md:text-[9px] py-5 justify-start gap-4"
        v-memo="[currentStep]">
        <div v-for="(step, index) in STEPS" :key="index" class="flex gap-4">
          <span :class="index <= currentStep ? 'text-text-primary' : 'text-text-secondary'">{{ step }}</span>
          <img v-if="index < STEPS.length - 1" src="../../assets/icons/arrow.svg"
            class="transition-opacity duration-200 max-md:w-2 w-3" alt="arrow icon" />
        </div>
      </div>
      <i class="cursor-pointer fa-regular fa-close" @click="handleClose" aria-label="Close"></i>
    </div>
    <div
      class="z-0 overflow-y-auto px-3 h-auto flex-grow relative flex flex-col gap-10 max-w-[800px] mx-auto w-full items-center">
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
      <Button variant="secondary" size="md" @click="goBack">
        <div class="flex items-center gap-2">
          <i class="text-base fa-solid fa-arrow-left"></i> Back
        </div>
      </Button>

      <div class="flex items-center gap-2">
        <Button v-if="showSkip" variant="secondary" size="md" @click="handleSkip">
          Skip
        </Button>

        <Button :disabled="continueDisabled" size="md" variant="primary" @click="goNext">
          <div class="flex items-center w-full justify-between gap-2">
            {{ continueLabel }}
            <i class="text-base fa-solid fa-arrow-right"></i>
          </div>
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, defineAsyncComponent, shallowRef, } from 'vue'
import { useRouter } from 'vue-router'
import Button from '../../components/ui/Button.vue'
import IdealStep from './steps/IdealStep.vue'
import StepOneSync from './steps/StepOne.vue'
const StepOne = StepOneSync
const StepTwo = defineAsyncComponent(() => import('./steps/StepTwo.vue'))
const StepThree = defineAsyncComponent(() => import('./steps/StepThree.vue'))
const StepFour = defineAsyncComponent(() => import('./steps/StepFour.vue'))
import { useWorkspaceStore } from '../../stores/workspace';
defineOptions({ name: 'CreateWorkspace' })
const router = useRouter()
const workspaceStore = useWorkspaceStore()
const STEPS = Object.freeze([
  'Get Started',
  'Project Setup',
  'Define Work streams',
  'Team Planning',
  'Review Space'
] as const)


const currentStep = ref<0 | 1 | 2 | 3 | 4>(!workspaceStore.workspace ? 0 : workspaceStore.workspace?.logo ? 4 : 1)
const isStepperVisible = ref(true)
const isAI = ref(true)
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

const continueDisabled = computed(() => currentStep.value === 1 && stepOnePending.value)
const continueLabel = computed(() => (currentStep.value === 1 && stepOnePending.value) ? 'Continuing...' : currentStep.value === 4 ? 'Complete' :'Continue')

/** Handlers (stable) */
function handleClose() {
  router.push('/')
}
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
  if (currentStep.value === 4 && stepFourRef.value?.createProjectHandler) {
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
  currentStep.value = 0
  isStartOver.value++;
}


</script>

<style scoped>
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
