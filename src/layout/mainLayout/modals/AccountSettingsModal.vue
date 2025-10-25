<template>
  <BaseModal v-model="isOpen" size="lg" :modalClass="'!max-w-[900px]'">
    <div class="px-6">
      <h2 class="text-2xl font-semibold text-text-primary mb-6">Account Settings</h2>

      <Tabs :tabs="['Profile', 'Subscription']" :defaultTab="route.query.stripePayment ? 1 : 0">
        <template #Profile>
          <div class="py-4" v-if="profileData">
            <div class="space-y-6">
              <div class="flex items-center gap-6">
                <div class="relative group">
                  <div
                    class="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-text-primary text-2xl font-bold border-4 border-border overflow-hidden">
                    <img v-if="avatarPreview || profileData.u_profile_image"
                      :src="avatarPreview || profileData.u_profile_image" class="w-full h-full object-cover"
                      alt="Profile" />
                    <span v-else>{{ initials }}</span>
                  </div>
                  <button type="button"
                    class="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition grid place-items-center text-white text-xs cursor-pointer"
                    :disabled="isUploadingAvatar" @click="triggerAvatarPicker" aria-label="Change profile picture">
                    <div class="flex flex-col items-center justify-center gap-1">
                      <span v-if="isUploadingAvatar"
                        class="inline-block h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin"
                        aria-hidden="true"></span>
                      <i v-else class="fa-solid fa-camera text-xl"></i>
                      <span v-if="!isUploadingAvatar" class="text-xs">Change</span>
                    </div>
                  </button>
                  <input ref="avatarInputRef" type="file" accept="image/*" class="hidden" @change="onAvatarPicked" />
                </div>

                <div class="flex-1">
                  <h3 class="text-xl font-semibold capitalize text-text-primary">
                    {{ form.fullName }}
                  </h3>
                  <p class="text-text-secondary">{{ form.email }}</p>
                </div>
              </div>

              <hr class="border-border" />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BaseTextField label="Full Name" placeholder="Enter your full name" v-model="form.fullName" />
                <BaseTextField label="Email Address" v-model="form.email" disabled class=" cursor-not-allowed" />
              </div>

              <hr class="border-border" />

              <div v-if="profileData.companies">
                <h4 class="text-sm font-semibold text-text-secondary mb-3">Organization Details</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow label="Organization" :value="profileData.companies.title" />
                  <InfoRow label="Company Size" :value="profileData.companies.company_size" />
                  <InfoRow label="Job Title" :value="profileData.companies.role?.title" />
                </div>
              </div>

              <!-- <div v-if="profileData.companies?.invitations?.length">
                <h4 class="text-sm font-semibold text-text-secondary mb-3">Team Members</h4>
                <div class="space-y-2">
                  <div v-for="(item, index) in profileData.companies.invitations" :key="index"
                    class="flex items-center justify-between p-3 bg-bg-card rounded-lg border border-border">
                    <span class="text-sm text-text-primary">{{ item.email }}</span>
                    <span class="badge py-1 px-3 text-xs rounded-full" :class="getStatusBadge(item.status)">
                      {{ item.status }}
                    </span>
                  </div>
                </div>
              </div> -->



              <div class="flex justify-end gap-3 pt-4">
                <Button variant="secondary" @click="cancelChanges">
                  Cancel
                </Button>
                <Button variant="primary" @click="saveChanges" :disabled="isSaving">
                  {{ isSaving ? 'Saving...' : 'Save Changes' }}
                </Button>
              </div>
            </div>
          </div>
          <div v-else-if="isLoading" class="py-8 text-center text-text-secondary">
            Loading profile...
          </div>
          <div v-else class="py-8 text-center text-red-500">
            Failed to load profile data.
          </div>
        </template>

        <template #Subscription>
          <div class="py-4">
            <div class="space-y-6">
              <div class="bg-bg-body  rounded-xl p-6 border border-border">
                <h3 class="text-lg font-semibold text-text-primary mb-4">Current Plan</h3>
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="text-2xl font-bold text-text-primary">{{ currentPackage?.package?.name }}</p>
                    <p class="text-sm text-text-secondary">{{ currentPlan.billingCycle }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-text-primary">{{ currentPackage?.package?.currencySymbol +
                      currentPackage?.package?.amount }}</p>
                    <p class="text-xs text-text-secondary">per {{ currentPlan?.billingCycle === 'Monthly' ? 'month' :
                      'year' }}</p>
                  </div>
                </div>
                <p class="text-sm text-text-secondary mb-4">Next billing date: {{ formatDate(currentPackage?.renewsAt) +
                  `, ${extractYear(currentPackage?.renewsAt)}` }}</p>
                <h3 class="text-lg font-semibold text-text-primary mb-4">Usage & Limits</h3>

                <div class="space-y-4">
                  <div v-for="(item, index) in currentPackage?.features" :key="index">
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex flex-col ">

                        <span class="text-sm font-medium text-text-primary">{{ item.name }}</span>
                        <span class="text-xs font-medium text-text-secondary">{{ item.description }}</span>
                      </div>
                      <span class="text-sm text-text-secondary">{{ item?.usage.limit }} {{ item?.usage.unit }} / {{
                        item.limits.limit }} {{item?.limits?.unit}}</span>
                    </div>
                    <div class="h-2 w-full bg-border/60 rounded-full overflow-hidden">
                      <div class="h-full bg-accent rounded-full transition-all"
                        :style="{ width: item?.usage.percentage + '%' }"></div>
                    </div>
                    <!-- <p class="text-xs text-text-secondary mt-1">{{ item?.usage.limits?.storageGB }} {{item?.limits?.unit}} remaining</p> -->
                  </div>


                </div>
              </div>


              <div class="bg-bg-body gap-6 items-center flex  rounded-xl p-6 border border-border"
                v-if="currentPackage?.nextPackage">
                <div class=" border-r border-border pr-6 min-w-80">

                  <h1 class="mb-2 uppercase">Upgrade to {{ currentPackage?.nextPackage?.name }}</h1>
                  <div v-if="currentPackage?.nextPackage" class="bg-bg-body rounded-xl  transition-all hover:shadow-lg">
                    <div class="text-left mb-4">
                      <h3 class="text-xl font-bold text-text-primary mb-2">{{ currentPackage.nextPackage.name }}</h3>
                      <div class="mb-2">
                        <span class="text-3xl font-bold text-text-primary">{{
                          currentPackage?.nextPackage?.pricing?.month?.amount +
                          currentPackage?.nextPackage?.pricing?.month?.currencySymbol }} </span>
                        <span class="text-sm text-text-secondary">/ {{
                          currentPackage?.nextPackage?.pricing?.month?.interval
                          }}</span>
                      </div>
                      <p class="text-sm text-text-secondary">{{ currentPackage?.nextPackage?.description }}</p>
                    </div>
                  </div>
                  <!-- <form action="/create-checkout-session" method="POST"> -->
                  <Button class="mt-3 block w-full uppercase" @click="pay(currentPackage?.nextPackage)"> {{ isUpgrading
                    ? 'Upgrading...' : 'UPGRADE' }}</Button>
                  <!-- </form> -->
                </div>
                <div>

                  <h3 class="text-lg font-semibold text-text-primary mb-3">Plan Features</h3>
                  <ul class="space-y-2">
                    <li v-for="(feature, index) in currentPackage?.nextPackage?.features" :key="index"
                      class="flex items-center gap-2 text-sm text-text-secondary">
                      <i class="fa-solid fa-check text-green-500"></i>
                      <span>{{ feature?.description }}</span>
                    </li>
                  </ul>

                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- 
        <template #Pricing>
          <div class="py-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div v-for="plan in pricingPlans" :key="plan.name"
                class="bg-bg-body rounded-xl p-6 border-2 transition-all hover:shadow-lg"
                :class="plan.name === currentPlan.name ? 'border-accent shadow-accent/20' : 'border-border'">
                <div class="text-center mb-4">
                  <h3 class="text-xl font-bold text-text-primary mb-2">{{ plan.name }}</h3>
                  <div class="mb-2">
                    <span class="text-3xl font-bold text-text-primary">{{ plan.price }}</span>
                    <span class="text-sm text-text-secondary">/ {{ plan.billingCycle }}</span>
                  </div>
                  <p class="text-sm text-text-secondary">{{ plan.description }}</p>
                </div>

                <hr class="border-border my-4" />

                <ul class="space-y-3 mb-6">
                  <li v-for="(feature, index) in plan.features" :key="index"
                    class="flex items-start gap-2 text-sm text-text-secondary">
                    <i class="fa-solid fa-check text-green-500 mt-1"></i>
                    <span>{{ feature }}</span>
                  </li>
                </ul>

                <Button v-if="plan.name === currentPlan.name" variant="secondary" class="w-full" disabled>
                  Current Plan
                </Button>
                <Button v-else-if="plan.name === 'Free'" variant="secondary" class="w-full"
                  @click="downgradePlan(plan)">
                  Downgrade
                </Button>
                <Button v-else variant="primary" class="w-full" @click="upgradePlan(plan)">
                  Upgrade to {{ plan.name }}
                </Button>
              </div>
            </div>
          </div>
        </template>
         -->
      </Tabs>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import Tabs from '../../../components/ui/Tabs.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import Button from '../../../components/ui/Button.vue'
import InfoRow from '../../../components/ui/InfoRow.vue'
import { useQuery, useMutation } from '@tanstack/vue-query'
import { getProfile, updateProfile } from '../../../services/user'
import { useUploadFile } from '../../../queries/useCommon'
import { toast } from 'vue-sonner'
import { confirmPayment, useCurrentPackage, useUpgradePackage } from '../../../queries/usePackages'
import { extractYear, formatDate } from '../../../utilities/FormatDate'
import { useRoute, useRouter } from 'vue-router'
import { useWorkspaceStore } from '../../../stores/workspace'
const workspaceStore= useWorkspaceStore()
const route = useRoute();
const router = useRouter();
const { data: currentPackage, refetch: reftechCurrentPackage } = useCurrentPackage();
const sessionId = route.query.session_id;

const { mutate: confirm } = confirmPayment({
  sessionId: sessionId, interval: 'month'
}, {
  onSuccess: () => {
    reftechCurrentPackage();
    router.push('/')
  }
})
onMounted(async () => {
  const sessionId = route.query.session_id;
  console.log(route.query.session_id, sessionId);
  if (sessionId) {
    confirm({ packageId: await currentPackage?.value.nextPackage?.id, })
  }
})
const { mutate: upgradePackage, isPending: isUpgrading } = useUpgradePackage({
  onSuccess: async (data: any) => {
    window.open(data?.checkoutUrl)
  }
})
function pay(p: any) {
  upgradePackage({
    "packageId": p?.id,
    "interval": "month",
  })
}
const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const { data: profile, isLoading, refetch } = useQuery({
  queryKey: ['profile'],
  queryFn: getProfile,
  enabled: computed(() => props.modelValue),

})
watch(() => currentPackage.value, () => {
  workspaceStore.setLimit(currentPackage.value)
  if (route.query.stripePayment) {
    confirm({
      sessionId: currentPackage.value?.sessionId, packageId: currentPackage?.value.nextPackage?.id, interval: 'month'
    })
  }
})
const profileData = computed(() => profile.value?.data || null)

const form = ref({
  fullName: '',
  email: '',
  jobTitle: '',
  department: '',
  location: ''
})

const avatarInputRef = ref<HTMLInputElement | null>(null)
const avatarPreview = ref<string>('')
const isUploadingAvatar = ref(false)
const uploadedAvatarUrl = ref<string>('')

// @ts-expect-error - Used in template
const tickets = ref([
  { id: 1, title: 'Fix dashboard layout', project: 'Orchit AI Dashboard' },
  { id: 2, title: 'Update profile endpoint', project: 'API Integration' }
])

watch(profileData, (data) => {
  if (!data) return
  form.value.fullName = data.u_full_name || ''
  form.value.email = data.u_email || ''
  form.value.jobTitle = data.u_job_title || ''
  form.value.department = data.u_department || ''
  form.value.location = data.u_location || ''
}, { immediate: true })

const initials = computed(() =>
  form.value.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
)

function triggerAvatarPicker() {
  avatarInputRef.value?.click()
}

const { mutate: uploadFileMutation } = useUploadFile({
  onSuccess: (data: any) => {
    const url = data?.data?.url
    if (!url) {
      toast.error('Upload succeeded but no URL was returned.')
      isUploadingAvatar.value = false
      return
    }
    uploadedAvatarUrl.value = url
    isUploadingAvatar.value = false
    toast.success('Profile picture uploaded successfully')
  },
  onError: (err: any) => {
    console.error('File upload failed', err)
    toast.error('File upload failed. Please try again.')
    isUploadingAvatar.value = false
    avatarPreview.value = ''
  }
})

async function onAvatarPicked(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input?.files?.length) return

  const file = input.files[0]
  avatarPreview.value = URL.createObjectURL(file)
  isUploadingAvatar.value = true

  const formData = new FormData()
  formData.append('file', file)
  uploadFileMutation(formData)
}

const { mutate: updateUser, isPending: isSaving } = useMutation({
  mutationFn: (payload: any) => updateProfile(payload),
  onSuccess: () => {
    toast.success('Profile updated successfully')
    refetch()
    uploadedAvatarUrl.value = ''
    avatarPreview.value = ''
  },
  onError: () => {
    toast.error('Failed to update profile.')
  }
})

function saveChanges() {
  const payload = {
    u_full_name: form.value.fullName,
    ...(uploadedAvatarUrl.value && { u_profile_image: uploadedAvatarUrl.value })
  }
  updateUser(payload)
}

function cancelChanges() {
  if (profileData.value) {
    form.value.fullName = profileData.value.u_full_name || ''
    form.value.jobTitle = profileData.value.u_job_title || ''
    form.value.department = profileData.value.u_department || ''
    form.value.location = profileData.value.u_location || ''
  }
  avatarPreview.value = ''
  uploadedAvatarUrl.value = ''
  isOpen.value = false
}

// @ts-expect-error - Used in template
function getStatusBadge(status: string) {
  switch (status) {
    case 'accepted':
      return 'bg-green-500/20 text-green-600'
    case 'pending':
      return 'bg-orange-500/20 text-orange-600'
    case 'rejected':
      return 'bg-red-500/20 text-red-600'
    default:
      return 'bg-gray-500/20 text-gray-600'
  }
}

const currentPlan = ref({
  name: 'Pro',
  price: '$29',
  billingCycle: 'Monthly',
  nextBillingDate: 'January 15, 2026',
  features: [
    'Unlimited workspaces',
    '100 GB storage',
    'Up to 10 team members',
    'Priority support',
    'Advanced analytics',
    'Custom integrations'
  ]
})

const usageData = ref({
  storage: {
    used: 45,
    limit: 100,
    remaining: 55,
    percentage: 45
  },
  users: {
    used: 7,
    limit: 10,
    remaining: 3,
    percentage: 70
  }
})

const pricingPlans = ref([
  {
    name: 'Free',
    price: '$0',
    billingCycle: 'month',
    description: 'Perfect for personal use',
    features: [
      '3 workspaces',
      '5 GB storage',
      'Up to 3 team members',
      'Basic support',
      'Basic analytics'
    ]
  },
  // {
  //   name: 'Pro',
  //   price: '$29',
  //   billingCycle: 'month',
  //   description: 'Best for growing teams',
  //   features: [
  //     'Unlimited workspaces',
  //     '100 GB storage',
  //     'Up to 10 team members',
  //     'Priority support',
  //     'Advanced analytics',
  //     'Custom integrations'
  //   ]
  // },
  // {
  //   name: 'Enterprise',
  //   price: '$99',
  //   billingCycle: 'month',
  //   description: 'For large organizations',
  //   features: [
  //     'Unlimited everything',
  //     'Unlimited storage',
  //     'Unlimited team members',
  //     '24/7 dedicated support',
  //     'Advanced security',
  //     'Custom integrations',
  //     'SLA guarantee',
  //     'Dedicated account manager'
  //   ]
  // }
])

// @ts-expect-error - Used in template
function manageBilling() {
  toast.info('Redirecting to Stripe billing portal...')
  window.open('https://billing.stripe.com/p/login/test_00000000000000', '_blank')
}

// @ts-expect-error - Used in template
function upgradePlan(plan: any) {
  toast.info(`Redirecting to checkout for ${plan.name} plan...`)
  window.open('https://checkout.stripe.com/test_00000000000000', '_blank')
}

// @ts-expect-error - Used in template
function downgradePlan(plan: any) {
  toast.warning(`You are about to downgrade to ${plan.name} plan. Please contact support.`)
}

</script>
