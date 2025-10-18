<template>
  <AuthLayout :steps="['Purpose', 'About Company', 'Invite Team']" :activeStep="activeStep">
    <template #form>
      <div class="max-w-[500px] md:mx-auto w-full">
        <!-- Step 1 -->
        <div class="mb-12 space-y-2" v-show="activeStep === 1">
          <h2 class="text-[32px] font-medium text-text-primary" v-once>How will you use Orchit AI?</h2>
          <p class="text-base sm:text-nowrap font-medium text-text-secondary" v-once>
            This will help us personalize your experience in Orchit AI.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4" v-show="activeStep === 1">
          <label v-for="option in options" :key="option._id"
            class="border rounded-xl py-4 px-2.5 cursor-pointer transition-all aspect-square"
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
        <div class="pb-3 space-y-2 mb-12" v-show="activeStep === 2">
          <h2 class="text-[32px] font-medium" v-once>Tell us about your company</h2>
          <p class="text-base sm:text-nowrap font-medium text-text-secondary" v-once>
            This will help us personalize your experience in Orchit AI.
          </p>
        </div>

        <div class="space-y-6" v-show="activeStep === 2">
          <BaseTextField v-model="team" label="Company Name" placeholder="Select team" size="lg" />
          <BaseSelectField v-model="role" label="What role do you perform in your company?" :options="rolesList || []"
            placeholder="Select team" size="lg" />
          <BaseSelectField v-model="companySize" label="What’s your company size?" :options="companySizeOptions"
            placeholder="Select team" size="lg" />
        </div>

        <!-- Step 3 -->
        <div class="mb-12 space-y-2" v-show="activeStep === 3">
          <h2 class="text-[32px] font-medium" v-once>Invite your team</h2>
          <p class="text-base sm:text-nowrap font-medium text-text-secondary" v-once>
            Invite your teammates to your first project.
          </p>
        </div>

        <div class="space-y-6" v-show="activeStep === 3">
          <BaseEmailChip v-model="emailList" />

          <!-- <div class="flex flex-col gap-2.5 w-full">
            <p class="text-sm text-medium text-text-primary" v-once>Invite link for any email</p>
            <div class="flex items-center gap-3 w-full relative">
              <BaseTextField v-model="inviteLink" class="w-full"
                placeholder="https://chromewebstore.google.com/detail/co...." size="md" />
              <span @click="copyToClipboard" class="absolute text-text-secondary text-nowrap cursor-pointer right-2">
                <FontAwesomeIcon class="text-accent cursor-pointer text-base" :icon="['far', 'copy']" />
              </span>
            </div>
          </div> -->
        </div>

        <!-- Nav -->
        <div class="flex justify-between items-center mt-[132px]">
          <Button variant="secondary" size="md" type="button" @click="goBack" :disabled="activeStep === 1">
            <div class="flex items-center gap-1">
              <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
            </div>
          </Button>

          <div class="flex gap-4 items-center">
            <router-link to="/"><button
                class="text-text-primary text-sm px-3 cursor-pointer">Skip</button></router-link>
            <Button size="md" type="submit" @click="continueHandler" :disabled="isContinueDisabled">
              {{ creatingProfile || invitingPeople ? 'Continuing...' : 'Continue' }}
            </Button>
          </div>
        </div>
      </div>

      <div class="max-w-[500px] md:mx-auto w-full space-y-6"></div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import teamIcon from '../../assets/platform/team.svg'
import personalIcon from '../../assets/platform/personal-use.svg'
import schoolIcon from '../../assets/platform/school.svg'
import Button from '../../components/ui/Button.vue'
import BaseSelectField from '../../components/ui/BaseSelectField.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import { useRouter } from 'vue-router'
import BaseEmailChip from '../../components/ui/BaseEmailChip.vue'
import { toast } from 'vue-sonner'
import { useCreateCompany, useInviteCompany } from '../../services/auth'
import { useRolesList } from '../../queries/useCommon'
defineOptions({ name: 'OnboardingFlow' })
const companyID = ref()
const { mutate: createProfile, isPending: creatingProfile } = useCreateCompany({
  onSuccess: (data: any) => {
    activeStep.value = (activeStep.value + 1) as 1 | 2 | 3;
    companyID.value = data?._id
  }
});
const { mutate: invitePeople, isPending: invitingPeople } = useInviteCompany({
  onSuccess: () => {
    router.push('/finish-profile');
  }
});

const router = useRouter()
const { data: rolesList } = useRolesList();
// --- Static data moved out of template so it isn't re-created on every render ---
const options = Object.freeze([
  { _id: 'team', title: 'For my team', description: 'Collaborate on your docs and projects.', icon: teamIcon },
  { _id: 'personal', title: 'For personal use', description: 'Write better. Think more clearly. Stay organised.', icon: personalIcon },
  { _id: 'school', title: 'For school', description: 'Keep notes, research and tasks in one place.', icon: schoolIcon }
] as const)

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

// --- State ---
const selected = ref<'team' | 'personal' | 'school'>('team')
const activeStep = ref<1 | 2 | 3 | any>(1)
const role = ref('')
const team = ref('')
const companySize = ref('')
const emailList = ref<string[]>([])
const inviteLink = ref('https://chromewebstore.google.com/detail/co....')

// --- UI helpers ---
const isContinueDisabled = computed(() => {
  if (activeStep.value === 1) return !selected.value
  if (activeStep.value === 2) return !(role.value && companySize.value && team.value)
  if (activeStep.value === 3) return !emailList.value.every((e) => e && e.trim() !== '')
  return true
})

function optionClass(id: string) {
  return id === selected.value ? 'bg-accent/30 border-accent' : 'border-border'
}

// --- Actions ---
function copyToClipboard() {
  navigator.clipboard
    .writeText(inviteLink.value)
    .then(() => {
      toast.success('Copied!')
    })
    .catch((err) => {
      console.error('Copy failed:', err)
      toast.error('Copy failed')
    })
}

function goBack() {
  activeStep.value = Math.max(1, (activeStep.value - 1) as 1 | 2 | 3)
}

function continueHandler() {
  if (activeStep.value === 2) {
    const payload = {
      title: team.value,
      type: selected.value,
      role_id: role.value,
      company_size: companySize.value,
    }
    createProfile({ payload })
    return
  }
  if (activeStep.value === 3) {
    invitePeople({
      payload: {
        company_id: companyID.value,
        emails: [...emailList.value]
      }
    })
    return
  }
  activeStep.value = (activeStep.value + 1) as 1 | 2 | 3
}
</script>