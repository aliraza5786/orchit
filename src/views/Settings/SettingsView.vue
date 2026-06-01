<template>
  <div class="h-[100dvh] bg-bg-body text-text-primary flex flex-col overflow-hidden">

    <!-- ── Mobile Header ─────────────────────────────────────────── -->
    <header class="md:hidden h-[56px] bg-bg-body border-b border-border flex items-center justify-between px-4 shrink-0 z-30 relative">
      <!-- Left: menu toggle or back -->
      <div class="w-24 flex items-center">
        <button
          v-if="!isMobileSidebarOpen"
          @click="toggleMobileSidebar"
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-bg-card hover:text-text-primary transition-all text-xs font-medium"
        >
          <i class="fa-solid fa-bars text-[11px]"></i>
          <span>Menu</span>
        </button>
        <button
          v-else
          @click="closeMobileSidebar"
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border text-text-secondary hover:bg-bg-card hover:text-text-primary transition-all text-xs font-medium"
        >
          <i class="fa-solid fa-xmark text-[11px]"></i>
          <span>Close</span>
        </button>
      </div>

      <!-- Center: title -->
      <h1 class="absolute left-1/2 -translate-x-1/2 text-[14px] font-semibold text-text-primary whitespace-nowrap pointer-events-none">
        Account Settings
      </h1>

      <!-- Right: back to dashboard -->
      <div class="w-24 flex justify-end">
        <button
          @click="goBack"
          class="flex items-center gap-1.5 text-[11px] text-text-secondary hover:text-accent transition-colors"
        >
          <i class="fa-solid fa-arrow-left text-[10px]"></i>
          <span class="hidden xs:inline">Dashboard</span>
        </button>
      </div>
    </header>

    <!-- ── Body: sidebar + main ───────────────────────────────────── -->
    <div class="flex flex-1 min-h-0 overflow-hidden md:flex-row">

      <SettingsSidebar
        :mobile-open="isMobileSidebarOpen"
        :profile="profileData"
        @close-mobile="closeMobileSidebar"
        @switch-company="onSwitchCompany"
      />

      <!-- Main Content Area -->
      <main
        class="flex-1 min-w-0 flex flex-col overflow-hidden
               md:mx-2 md:rounded-[6px] md:border border-border"
        :class="isDark ? 'bg-bg-card/30' : 'bg-bg-card'"
      >
        <div class="flex-1 overflow-y-auto">
          <div class="py-6 px-4 sm:px-6 md:p-10 w-full flex flex-col min-h-full">

            <!-- Verification Warning Banner -->
            <div
              v-if="showVerificationWarning && hasOrgDomain"
              class="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5"
            >
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex gap-3">
                  <div class="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <i class="fa-solid fa-shield-halved text-amber-600 text-base"></i>
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-amber-800">Organization Verification Required</h4>
                    <p class="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
                      {{ verificationWarningMessage }}
                    </p>
                  </div>
                </div>
                <div class="flex gap-2 shrink-0">
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
/* xs breakpoint for very small screens */
@media (min-width: 480px) {
  .xs\:inline { display: inline; }
}
</style>