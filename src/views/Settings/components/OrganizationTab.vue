<template>
  <div class="w-full space-y-6 flex-1">
<!-- Replace the entire v-if="!hasOrg" block -->
<div v-if="!hasOrg">

  <!-- ── Inline creation flow ─────────────────────────────────── -->
  <div class="space-y-6" v-if="isCreatingOrg">
    <div class="flex items-center gap-3 mb-2">
      <button
        @click="isCreatingOrg = true"
        class="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <i class="fa-solid fa-arrow-left text-xs"></i>
        Back
      </button>
      <div class="h-px flex-1 bg-border/40"></div>
      <span class="text-xs text-text-secondary font-medium">Create Organization</span>
    </div>
    <div>
  <CreateOrganizationInline @done="onOrgCreated" />
</div>
  </div>

  <!-- ── Empty state ──────────────────────────────────────────── -->
  <div v-if="!hasOrg && !isCreatingOrg" class="flex flex-col items-center justify-center py-12 px-4">
    <div class="flex flex-col items-center max-w-xl text-center">

      <!-- Icon -->
      <div class="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 flex items-center justify-center mb-6">
        <i class="fa-regular fa-building text-accent text-4xl"></i>
      </div>

      <!-- Heading -->
      <h2 class="text-3xl font-bold text-text-primary mb-3">Ready to collaborate?</h2>
      <p class="text-sm text-text-secondary mb-8 leading-relaxed max-w-md">
        Create an organization to invite team members, manage projects together, and scale your business.
      </p>

      <!-- Feature cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8 text-left">
        <div class="flex flex-col gap-2 p-3 rounded-lg bg-bg-card/40 border border-border/40">
          <div class="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <i class="fa-solid fa-users text-accent text-sm"></i>
          </div>
          <p class="text-xs font-semibold text-text-primary">Invite members</p>
          <p class="text-[11px] text-text-secondary">Build your team</p>
        </div>
        <div class="flex flex-col gap-2 p-3 rounded-lg bg-bg-card/40 border border-border/40">
          <div class="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <i class="fa-solid fa-shield-halved text-accent text-sm"></i>
          </div>
          <p class="text-xs font-semibold text-text-primary">Manage roles</p>
          <p class="text-[11px] text-text-secondary">Control permissions</p>
        </div>
        <div class="flex flex-col gap-2 p-3 rounded-lg bg-bg-card/40 border border-border/40">
          <div class="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <i class="fa-solid fa-chart-line text-accent text-sm"></i>
          </div>
          <p class="text-xs font-semibold text-text-primary">Scale easily</p>
          <p class="text-[11px] text-text-secondary">Grow your team</p>
        </div>
      </div>

      <!-- CTA -->
      <button
        @click="isCreatingOrg = true"
        class="px-6 py-3 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 active:scale-95 transition-all shadow-lg shadow-accent/20"
      >
        <i class="fa-solid fa-sparkles mr-2"></i> Create organization
      </button>

      <p class="text-xs text-text-secondary mt-6">
        💡 Your personal account will be linked as the owner
      </p>

    </div>
  </div>

</div>

    <!-- Has org — settings form -->
    <div v-else class="space-y-6">
      <!-- Organization Info Section -->
      <section class="rounded-2xl border border-border/40 bg-bg-body/50 p-6" :class="{ 'opacity-60 pointer-events-none': !canUpdateOrg }">
        <div class="mb-6">
          <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
            <i class="fa-solid fa-building text-accent"></i>
            Organization Information
          </h3>
          <p class="text-sm text-text-secondary mt-1">Manage your organization's basic details and branding.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Organization Logo -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden group relative">
                <img
                  v-if="orgLogoPreview || orgData.logo"
                  :src="orgLogoPreview || orgData.logo"
                  class="w-full h-full object-cover"
                  alt="Organization logo"
                />
                <i v-else class="fa-solid fa-image text-accent text-2xl"></i>
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <i class="fa-solid fa-upload text-white text-xs"></i>
                </div>
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-semibold text-text-primary mb-2">Organization Logo</h4>
                <p class="text-xs text-text-secondary mb-3">PNG, JPG up to 2MB</p>
                <button
                  @click="triggerLogoPicker"
                  :disabled="isUploadingLogo"
                  class="px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i class="fa-solid fa-cloud-arrow-up mr-2"></i>
                  {{ isUploadingLogo ? 'Uploading...' : 'Upload logo' }}
                </button>
                <input ref="logoInputRef" type="file" accept="image/*" class="hidden" @change="onLogoPicked" />
              </div>
            </div>
          </div>

          <!-- Organization Name -->
          <div>
            <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
              Organization Name
            </label>
            <input
              v-model="orgName"
              class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
              placeholder="Acme Corp"
              @blur="validateOrgName"
            />
            <p v-if="errors.orgName" class="text-xs text-red-500 mt-1">{{ errors.orgName }}</p>
          </div>
            <div>
  <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
    Domain
  </label>
  <div
    class="flex items-center border rounded-lg overflow-hidden transition-all"
    :class="[
      errors.orgSlug ? 'border-red-500/60' :
      isSlugAvailable === false ? 'border-red-500/60' :
      isSlugAvailable === true ? 'border-green-500/60' :
      'border-border/60',
      'bg-bg-body/80 focus-within:ring-2',
      isSlugAvailable === false ? 'focus-within:ring-red-500/10' :
      isSlugAvailable === true ? 'focus-within:ring-green-500/10' :
      'focus-within:ring-accent/10 focus-within:border-accent/50'
    ]"
  >
    <input
      v-model="orgSlug"
      class="flex-1 px-4 py-2.5 text-sm bg-transparent outline-none placeholder:text-text-tertiary"
      placeholder="acme"
      @blur="validateOrgSlug"
    />
    <!-- Slug check indicator -->
    <div class="px-3 flex items-center shrink-0">
      <i v-if="isCheckingSlug" class="fa-solid fa-spinner fa-spin text-text-secondary text-xs"></i>
      <i v-else-if="isSlugAvailable === true && orgSlug !== currentCompany.value?.slug" class="fa-solid fa-circle-check text-green-500 text-xs"></i>
      <i v-else-if="isSlugAvailable === false" class="fa-solid fa-circle-xmark text-red-500 text-xs"></i>
    </div>
    <span class="px-3 py-2.5 text-sm text-text-secondary bg-bg-body border-l border-border/40 shrink-0 whitespace-nowrap">
      {{ domainSuffix }}
    </span>
  </div>
  <p v-if="errors.orgSlug" class="text-xs text-red-500 mt-1">{{ errors.orgSlug }}</p>
  <p v-else-if="isSlugAvailable === false && orgSlug !== currentCompany.value?.slug" class="text-xs text-red-500 mt-1">This domain is already taken.</p>
  <p v-else-if="isSlugAvailable === true && orgSlug !== currentCompany.value?.slug" class="text-xs text-green-500 mt-1">Domain is available!</p>
  <p v-else class="text-xs text-text-secondary mt-1">This will be your organization's public workspace URL.</p>
</div>
          <!-- Organization Size -->
          <div>
  <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
    Team Size
  </label>
  <div class="relative">
    <select
      v-model="orgSize"
      class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 pr-10 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all appearance-none cursor-pointer"
    >
      <option value="1–10">1–10 people</option>
      <option value="11–50">11–50 people</option>
      <option value="51–200">51–200 people</option>
      <option value="201–500">201–500 people</option>
      <option value="500+">500+ people</option>
    </select>
    <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs pointer-events-none"></i>
  </div>
</div>

          <!-- Industry -->
          <div>
            <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
              Industry
            </label>
                <div class="relative">
  <select
    v-model="industry"
    class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 pr-10 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all appearance-none cursor-pointer"
  >
    <option value="">Select an industry</option>
    <option value="software_development">Software Development</option>
    <option value="product_management">Product Management</option>
    <option value="marketing">Marketing</option>
    <option value="sales">Sales</option>
    <option value="finance">Finance</option>
    <option value="healthcare">Healthcare</option>
    <option value="education">Education</option>
    <option value="class_management">Class Management</option>
    <option value="operations">Operations</option>
    <option value="other">Other</option>
  </select>
  <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs pointer-events-none"></i>
</div>
          </div>
        </div>

        <!-- Description -->
        <div class="mt-6">
          <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">
            Organization Description
          </label>
          <textarea
            v-model="orgDescription"
            placeholder="Tell us about your organization..."
            class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary resize-none h-24"
          />
          <p class="text-xs text-text-secondary mt-1">{{ orgDescription.length }}/500 characters</p>
        </div>
      </section>

   <div class="flex flex-col sm:flex-row gap-3 justify-start">
<button
  @click="saveOrg"
  :disabled="isSaving || !isFormValid || !canUpdateOrg"
  class="px-6 py-2.5 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
>
  <span v-if="isSaving" class="flex items-center gap-2">
    <i class="fa-solid fa-spinner fa-spin text-xs"></i> Saving...
  </span>
  <span v-else>
    <i class="fa-solid fa-check mr-2"></i> Save changes
  </span>
</button>

  <button
  v-if="canDeleteOrg"
    @click="showDeleteConfirm = true"
    class="px-6 py-2.5 text-sm font-semibold rounded-lg border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-all active:scale-95"
  >
    <i class="fa-solid fa-trash mr-2"></i> Delete organization
  </button>
</div>
<p v-if="!canUpdateOrg" class="text-xs text-red-500 mt-2">
  You don’t have permission to modify organization settings.
</p>
<!-- Save error -->
<p v-if="saveError" class="text-xs text-red-500 mt-2 flex items-center gap-1.5">
  <i class="fa-solid fa-circle-exclamation"></i> {{ saveError }}
</p>

      <!-- Info Box -->
      <div class="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
        <p class="text-sm text-blue-600 font-medium flex items-start gap-2">
          <i class="fa-solid fa-info-circle mt-0.5 text-xs"></i>
          <span>You can invite team members from the <strong>User Management</strong> section once you save your organization details.</span>
        </p>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
      v-if="showDeleteConfirm"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      @click="showDeleteConfirm = false"
    >
      <div class="bg-bg-body rounded-2xl border border-border p-6 max-w-md w-full" @click.stop>
        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mx-auto mb-4">
          <i class="fa-solid fa-exclamation text-red-600 text-lg"></i>
        </div>
        <h3 class="text-lg font-bold text-text-primary text-center mb-2">Delete Organization?</h3>
        <p class="text-sm text-text-secondary text-center mb-6">
          This action cannot be undone. All data associated with <strong>{{ orgName }}</strong> will be permanently deleted.
        </p>
        <div class="flex gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-bg-card transition-all"
          >
            Cancel
          </button>
          <button
            @click="deleteOrg"
            :disabled="isDeleting"
            class="flex-1 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isDeleting" class="flex items-center justify-center gap-2">
              <i class="fa-solid fa-spinner fa-spin text-xs"></i> Deleting...
            </span>
            <span v-else>Delete permanently</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useDebounceFn } from '@vueuse/core'
import { useWorkspaceStore } from '../../../stores/workspace'
import { useUpdateCompanyProfile, useDeleteOrganization } from '../../../services/auth'
import { useQueryClient } from '@tanstack/vue-query'
import { uploadPrivateFile } from '../../../queries/useCommon'
import CreateOrganizationInline from './CreateOrganizationInline.vue'
const queryClient = useQueryClient()
const isCreatingOrg = ref(false)

function onOrgCreated() {
  isCreatingOrg.value = false
  queryClient.invalidateQueries({ queryKey: ['profile'] })
}
const props = defineProps<{
  forceCreate?: boolean
  profile?: any
}>()
// const activeCompany = computed(() => props.profile?.active_company)
import { onMounted, onBeforeUnmount } from 'vue'

const selectedCompanyId = ref(
  localStorage.getItem('company_id') || props.profile?.active_company_id
)

function handleCompanyChange(e: any) {
  selectedCompanyId.value = e.detail
}

onMounted(() => {
  window.addEventListener('company-changed', handleCompanyChange)
})

onBeforeUnmount(() => {
  window.removeEventListener('company-changed', handleCompanyChange)
})

const currentCompany = computed(() => {
  const list = props.profile?.companies_list || []
  return list.find((c: any) => c._id === selectedCompanyId.value) || null
})
const membershipRole = computed(() => 
  currentCompany.value?.membership_role || null
)

const permissions = computed<string[]>(() => 
  currentCompany.value?.permissions || []
)
function can(permission: string) {
  return permissions.value.includes(permission)
}
const isOwner = computed(() => membershipRole.value === 'owner')

const canUpdateOrg = computed(() => {
  return isOwner.value || can('company.update') || can('company_user.update')
})

const canDeleteOrg = computed(() => {
  return isOwner.value
})
const workspaceStore = useWorkspaceStore()
const router = useRouter()

const hasOrg = computed(() => {
  if (props.forceCreate) return false
  return !!props.profile?.active_company_id
})

// Form state
const orgName = ref('')
const orgSlug = ref('')
const orgSize = ref('1–10')
const industry = ref('')
const orgDescription = ref('')
const orgLogoPreview = ref<string | null>(null)
const orgData = ref({ logo: '' })

// Slug check state
const isCheckingSlug = ref(false)
const isSlugAvailable = ref<boolean | null>(null)

// Domain suffix from domain_link
const domainSuffix = computed(() => {
  const domainLink = currentCompany.value?.domain_link
  if (!domainLink) return ''
  try {
    const url = new URL(domainLink)
    return url.hostname.replace(/^[^.]+/, '')
  } catch {
    return ''
  }
})

const originalValues = ref({
  title: '',
  slug: '',
  company_size: '',
  work_to_do: '',
  logo: '',
  description: '',  
})
watch(
  currentCompany,
  (company) => {
    if (!company) return

    orgName.value = company.title ?? ''
    orgSlug.value = company.slug ?? ''
    orgSize.value = company.company_size ?? '1–10'
    orgData.value.logo = company.logo ?? ''
    industry.value = company.work_to_do ?? ''
    orgDescription.value = company.description ?? ''

    originalValues.value = {
      title: company.title ?? '',
      slug: company.slug ?? '',
      company_size: company.company_size ?? '1–10',
      work_to_do: company.work_to_do ?? '',
      logo: company.logo ?? '',
      description: company.description ?? '',
    }
  },
  { immediate: true }
)
// Slug availability check
const checkSlugAvailability = useDebounceFn(async (slug: string) => {
  if (!slug || slug === currentCompany.value?.slug) {
    isSlugAvailable.value = null
    isCheckingSlug.value = false
    return
  }
  isCheckingSlug.value = true
  try {
    const result = await workspaceStore.fetchTitleSlug(slug)
    isSlugAvailable.value = result?.available ?? null
  } catch {
    isSlugAvailable.value = null
  } finally {
    isCheckingSlug.value = false
  }
}, 500)

watch(orgSlug, (val) => {
  isSlugAvailable.value = null
  if (val) checkSlugAvailability(val)
})

// Change tracking
const hasChanges = ref(false)
async function onLogoPicked(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  isUploadingLogo.value = true

  try {
    const res = await uploadPrivateFile(formData)

    // ✅ correct mapping
    orgLogoPreview.value = res?.data?.url

    toast.success('Logo uploaded successfully')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Upload failed')
  } finally {
    isUploadingLogo.value = false
  }
}
watch(
  [orgName, orgSlug, orgSize, industry, orgLogoPreview, orgDescription],
  () => {
    hasChanges.value =
      orgName.value !== originalValues.value.title ||
      orgSlug.value !== originalValues.value.slug ||
      orgSize.value !== originalValues.value.company_size ||
      industry.value !== originalValues.value.work_to_do ||
      orgDescription.value !== originalValues.value.description ||
      (orgLogoPreview.value !== null && orgLogoPreview.value !== originalValues.value.logo) // ← add this
  }
)
// UI state
const showDeleteConfirm = ref(false)
const isUploadingLogo = ref(false)
const logoInputRef = ref<HTMLInputElement>()
const saveError = ref('')

// Validation
const errors = ref({ orgName: '', orgSlug: '' })

const isFormValid = computed(() => {
  return (
    orgName.value.trim().length > 0 &&
    orgSlug.value.trim().length > 0 &&
    !errors.value.orgName &&
    !errors.value.orgSlug &&
    hasChanges.value
  )
})

function validateOrgName() {
  if (!orgName.value.trim()) {
    errors.value.orgName = 'Organization name is required'
  } else if (orgName.value.length < 2) {
    errors.value.orgName = 'Must be at least 2 characters'
  } else if (orgName.value.length > 100) {
    errors.value.orgName = 'Must be less than 100 characters'
  } else {
    errors.value.orgName = ''
  }
}

function validateOrgSlug() {
  if (!orgSlug.value.trim()) {
    errors.value.orgSlug = 'Domain is required'
  } else if (!/^[a-z0-9-]+$/.test(orgSlug.value)) {
    errors.value.orgSlug = 'Lowercase letters, numbers, and hyphens only'
  } else if (orgSlug.value.length < 3) {
    errors.value.orgSlug = 'Must be at least 3 characters'
  } else if (orgSlug.value.length > 50) {
    errors.value.orgSlug = 'Must be less than 50 characters'
  } else {
    errors.value.orgSlug = ''
  }
}

function triggerLogoPicker() {
  logoInputRef.value?.click()
}

const { mutate: updateCompany, isPending: isSaving } = useUpdateCompanyProfile({
  onSuccess: (data: any) => {
    const payload = data?.data ?? data

    if (!payload || payload?.status === false) {
      saveError.value =
        payload?.message || 'Something went wrong while saving.'
      return
    }

    saveError.value = ''
    hasChanges.value = false
    orgLogoPreview.value = null

    toast.success(payload?.message || 'Organization updated successfully')
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  },

  onError: (error: any) => {
    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.data ||
      error?.message ||
      'Something went wrong'

    saveError.value = serverMessage
    toast.error(serverMessage)
  },
})

async function saveOrg() {
  validateOrgName()
  validateOrgSlug()
  if (!isFormValid.value) return

  const slugChanged = orgSlug.value !== currentCompany.value?.slug

  if (slugChanged && isSlugAvailable.value === false) {
    toast.error('This domain is already taken. Please choose another.')
    return
  }

  updateCompany({
    payload: {
      company_id: localStorage.getItem('company_id'),

      title: orgName.value,
       description: orgDescription.value,
      slug: orgSlug.value,
      company_size: orgSize.value,
      work_to_do: industry.value,
      
      logo: orgLogoPreview.value ?? orgData.value.logo ?? null,
    },
  })
}
const { mutate: deleteOrganization, isPending: isDeleting } = useDeleteOrganization({
  onSuccess: (data: any) => {
    const payload = data?.data ?? data
    if (!payload || payload?.status === false) {
      toast.error(payload?.message || 'Failed to delete organization')
      return
    }
    toast.success(payload?.message || 'Organization deleted successfully')
    localStorage.removeItem('company_id')
    router.push('/dashboard')
    showDeleteConfirm.value = false
  },
  onError: (error: any) => {
    const msg = error?.response?.data?.message || error?.message || 'Failed to delete organization'
    toast.error(msg)
    showDeleteConfirm.value = false
  },
})
async function deleteOrg() {
  const companyId = localStorage.getItem('company_id')
  if (!companyId) return
  deleteOrganization({ payload: { company_id: companyId } })
}
</script>