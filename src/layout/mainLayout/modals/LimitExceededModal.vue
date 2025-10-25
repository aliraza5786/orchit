<template>
    <BaseModal v-model="workspaceStore.showLimitExccedModal" size="lg" :modalClass="'!max-w-[900px]'">
        <div class="px-6">
            <h2 class="text-2xl font-semibold text-text-primary mb-6">Upgrade your Account you have exceeded your limit
            </h2>
            <Button @click="$emit('upgrade')">Upgrade</Button>
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
const workspaceStore = useWorkspaceStore()
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
    // modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue','upgrade'])

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