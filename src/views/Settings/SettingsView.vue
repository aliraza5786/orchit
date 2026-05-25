<template>
  <div class="h-[100dvh] bg-bg-body text-text-primary flex flex-col md:flex-row overflow-hidden">
    <!-- Mobile Header -->
    <div class="md:hidden h-[60px] bg-bg-body border-b border-border flex items-center justify-between px-4 shrink-0 z-30 relative">
      <button
        @click="toggleMobileSidebar"
        v-if="!isMobileSidebarOpen"
        class="text-sm font-medium text-text-secondary flex items-center gap-2"
      >
        <i class="fa-solid fa-chevron-left text-xs mt-1"></i> Settings
      </button>
      <button
        v-if="isMobileSidebarOpen"
        @click="goBack"
        class="group flex items-center px-2 py-2 cursor-pointer rounded-[6px] border border-border text-xs text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none justify-start gap-2"
      >
        <i class="fa-solid fa-arrow-left text-[10px]"></i>
        <span class="whitespace-nowrap font-medium text-[12px] tracking-normal leading-[14px]">Go back</span>
      </button>

      <h2 class="text-base font-semibold text-text-primary absolute left-1/2 -translate-x-1/2">
        Account settings
      </h2>
    </div>

    <SettingsSidebar
      :mobile-open="isMobileSidebarOpen"
      :profile="profileData"
      @close-mobile="closeMobileSidebar"
      @switch-company="onSwitchCompany"
    />

    <!-- Main Content Area -->
    <main
      class="flex-grow flex flex-col min-w-0 max-w-full md:m-2 md:rounded-lg md:border border-border overflow-hidden relative"
      :class="isDark ? 'bg-bg-card/30' : 'bg-bg-card'"
    >
      <div class="py-6 px-4 sm:px-6 sm:p-10 overflow-y-auto h-full flex flex-col">
        <div class="mx-auto w-full flex-1 flex flex-col">

          <!-- Verification Warning Banner -->
          <div v-if="showVerificationWarning && hasOrgDomain" class="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 shadow-sm">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div class="flex gap-3">
                <div class="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <i class="fa-solid fa-shield-halved text-amber-600 text-lg"></i>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-amber-800">Organization Verification Required</h4>
                  <p class="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
                    {{ verificationWarningMessage }}
                  </p>
                </div>
              </div>
              <div class="flex gap-2">
                <button
                  v-if="!hasVerifiedDomain"
                  @click="router.push({ query: { ...route.query, tab: 'org-domain' } })"
                  class="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all cursor-pointer whitespace-nowrap"
                >
                  Verify Domain
                </button>
                <button
                  v-if="hasVerifiedDomain && !isSuperAdminVerified"
                  @click="router.push({ query: { ...route.query, tab: 'org-setup' } })"
                  class="px-4 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-all cursor-pointer whitespace-nowrap"
                >
                  Verify Admin
                </button>
              </div>
            </div>
          </div>

          <!-- Dynamic Content -->
          <ProfileTab v-if="currentTab === 'profile'" />
          <BillingTab v-else-if="currentTab === 'billing'" />
          <PersonalTokens v-else-if="currentTab === 'token-utilization'" />

          <!-- Org tabs — always pass profileData (active_company drives the context) -->
          <OrganizationTab v-else-if="currentTab === 'org-setup'" :profile="profileData" />
          <OrgUsersTab v-else-if="currentTab === 'org-users'" :profile="profileData" />
          <OrgRolesTab v-else-if="currentTab === 'org-roles'" :profile="profileData" />
          <OwnershipTransfer v-else-if="currentTab === 'ownership-transfer'" :profile="profileData" />
          <OrgPackagesTab v-else-if="currentTab === 'org-packages'" :profile="profileData" />
          <OrgDomainSetup v-else-if="currentTab === 'org-domain'" :profile="profileData" />
          <OrgAiTokensAllocationTab v-else-if="currentTab === 'token-allocation'" :profile="profileData" />

        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SettingsSidebar from './components/SettingsSidebar.vue'
import ProfileTab from './components/ProfileTab.vue'
import BillingTab from './components/BillingTab.vue'
import OrganizationTab from './components/OrganizationTab.vue'
import OrgUsersTab from './components/OrgUsersTab.vue'
import OrgRolesTab from './components/OrgRolesTab.vue'
import OrgPackagesTab from './components/OrgPackagesTab.vue'
import OrgAiTokensAllocationTab from './components/AiTokensAllocation.vue'
import OrgDomainSetup from './components/OrgDomainSetup.vue'
import OwnershipTransfer from './components/OwnershipTransfer.vue'
import PersonalTokens from './components/PersonalTokens.vue'
import { useTheme } from '../../composables/useTheme'
import { useQuery } from '@tanstack/vue-query'
import { getProfile } from '../../services/user'
import { useListDomains } from '../../queries/useCommon'
import { useAuthStore } from '../../stores/auth'

const { isDark } = useTheme()
const route = useRoute()
const router = useRouter()
// const queryClient = useQueryClient()

const isMobileSidebarOpen = ref(false)
const currentTab = computed(() => (route.query.tab as string) || 'profile')

const { data: profile } = useQuery({
  queryKey: ['profile'],
  queryFn: getProfile,
  staleTime: 1000 * 60 * 5,
})

const profileData = computed(() => profile.value?.data ?? null)
const authStore = useAuthStore()
const hasOrgDomain = computed(() => profileData.value?.activeCompany?.custom_domain)
// --- Verification Logic ---
const { data: domainsData } = useListDomains()

const hasVerifiedDomain = computed(() => {
  if (!authStore.company_id) return true
  return domainsData.value?.domains?.some((d: any) => d.status === 'verified') ?? false
})

const isSuperAdminVerified = computed(() => {
  if (!authStore.company_id) return true
  const activeCompany = profileData.value?.active_company
  return activeCompany?.membership_status !== 'pending_super_admin_otp'
})

const isAdminOrOwner = computed(() => {
  const role = profileData.value?.active_company?.membership_role
  return role === 'owner' || role === 'admin'
})

const showVerificationWarning = computed(() => {
  if (!authStore.company_id || !isAdminOrOwner.value) return false
  return !hasVerifiedDomain.value || !isSuperAdminVerified.value
})

const verificationWarningMessage = computed(() => {
  if (!hasVerifiedDomain.value) return "Your organization's domain is not verified. Please complete verification to unlock all features."
  if (!isSuperAdminVerified.value) return "Super admin verification is pending. Please complete the verification process."
  return ""
})
async function onSwitchCompany(company: any) {
  localStorage.setItem('company_id', company._id)
  localStorage.setItem('company_name', company.title)
}


// ─── Mobile sidebar ───────────────────────────────────────────────────────────
function toggleMobileSidebar() {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false
}

function goBack() {
  router.push('/dashboard')
}
</script>

<style scoped>
/* View-specific styles */
</style>