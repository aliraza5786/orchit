<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
import { getProfile } from "../../../services/user";
import { useQuery } from '@tanstack/vue-query';
const props = defineProps<{
  mobileOpen?: boolean
  profile?: any
}>()

const emit = defineEmits(['close-mobile', 'switch-company'])

const route  = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// ─── Initials ────────────────────────────────────────────────
const initials = computed(() => {
  const name = props.profile?.u_full_name?.trim() || ''
  if (!name) return 'U'
  return name.split(/\s+/).slice(0, 2).map((n: any) => n[0]).join('').toUpperCase()
})

const personalPlan   = computed(() => props.profile?.individual_subscription?.package?.name || 'Free')
const isPersonalFree = computed(() =>
  !props.profile?.individual_subscription?.package?.packageType ||
  props.profile?.individual_subscription?.package?.packageType === 'free'
)

const isPendingDeletion = computed(() => !!activeCompany.value?.is_pending_deletion)
const isCompanyEmail = computed(() => {
  const email  = props.profile?.u_email || ''
  if (!email) return false
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  const generic = ['gmail.com','yahoo.com','outlook.com','hotmail.com','aol.com','icloud.com','protonmail.com','proton.me','live.com','msn.com']
  return !generic.includes(domain)
})

// ─── Active company + permissions ────────────────────────────
const activeCompanyFromProfile = computed(() => props.profile?.active_company ?? null)

const allCompanies = computed(() => {
  if (activeCompanyFromProfile.value?._id) return [activeCompanyFromProfile.value]
  return []
})

const hasOrgs = computed(() =>
  !!props.profile?.active_company?._id ||
  !!props.profile?.active_company_id ||
  hasAssociatedCompany.value
)
const activeCompanyId = computed(() => authStore.company_id ?? null)
const selectedCompanyId = ref<string | null>(null)

const displayCompanyId = computed(() =>
  selectedCompanyId.value || activeCompanyId.value || allCompanies.value[0]?._id || null
)

const activeCompany = computed(() =>
  allCompanies.value.find((c: any) => c._id === displayCompanyId.value)
    ?? allCompanies.value[0]
    ?? null
)

// ─── Permission helpers ───────────────────────────────────────
const permissions = computed<string[]>(() => activeCompany.value?.permissions ?? [])

function hasPerm(p: string): boolean {
  return permissions.value.includes(p)
}

const membershipRole  = computed(() => activeCompany.value?.membership_role ?? '')
const isOwnerOfActive = computed(() => membershipRole.value === 'owner')
const canSeeUpgradeBanner = computed(() => 
  ['owner', 'super_admin', 'admin', 'editor'].includes(membershipRole.value)
)
const isMember = computed(() => membershipRole.value === 'viewer')
const isOrgFree = computed(() =>
  !props.profile?.active_company?.company_subscription?.package?.packageType ||
  props.profile?.active_company?.company_subscription?.package?.packageType === 'free'
)

// ─── Tabs ────────────────────────────────────────────────────
const ORG_TABS = new Set([
  'org-setup','org-domain','org-users','org-roles',
  'org-packages','token-allocation','ownership-transfer',
])

const currentTab = computed(() => (route.query.tab as string) || 'profile')
const mode = computed<'personal' | 'org'>(() =>
  ORG_TABS.has(currentTab.value) ? 'org' : 'personal'
)

function selectTab(tab: string) {
  router.push({ query: { tab } })
  emit('close-mobile')
}

function goBack() { router.push('/dashboard') }

// ─── Company switching ────────────────────────────────────────
const isSwitching = ref(false)
const { data: profile, isPending: isProfileLoading } = useQuery({
  queryKey: ['profile'],
  queryFn: getProfile,
  placeholderData: (prev) => prev,
})
const hasNoCompanyContext = computed(() => {
  const active = profile.value?.active_company?._id
  const associated = profile.value?.associated_company

  const hasAssociated =
    associated && Object.keys(associated || {}).length > 0

  return !active && !hasAssociated
})
const profileData = computed(() => profile.value?.data ?? null);
const isPendingOrgMember = computed(() =>
  !!profileData.value?.associated_company?._id && !profileData.value?.active_company?._id
)
async function selectCompany(company: any, navigate = true) {
  if (!company?._id || isSwitching.value) return
  isSwitching.value = true
  selectedCompanyId.value = company._id
  try {
    localStorage.setItem('company_id', company._id)
    localStorage.setItem('company_name', company.title)
    authStore.setCompany(company._id)
    emit('switch-company', company)
    if (!navigate) return
    router.push({ path: router.currentRoute.value.path, query: { tab: 'org-setup' } })
  } finally {
    isSwitching.value = false
  }
}

onMounted(() => {
  const tab = route.query.tab as string | undefined
  if (!tab) {
    selectTab(isCompanyEmail.value && hasOrgs.value ? 'org-setup' : 'profile')
  }
  if (hasOrgs.value && !activeCompanyId.value) {
    const first = allCompanies.value[0]
    if (first) selectCompany(first, false)
  }
})

// ─── Personal nav ─────────────────────────────────────────────
const personalItems = [
  { label: 'Profile', tab: 'profile', icon: 'fa-regular fa-circle-user' },
  { label: 'Billing', tab: 'billing', icon: 'fa-regular fa-credit-card'  },
]
const hasAssociatedCompany = computed(() =>
  !!props.profile?.associated_company &&
  Object.keys(props.profile.associated_company).length > 0
)
const visiblePersonalItems = computed(() =>
  personalItems.filter(item => {
    if (item.tab !== 'billing') return true

    // Always show billing if user has no company context
    if (hasNoCompanyContext.value) return true

    // Existing restriction (only applies when org context exists)
    if (hasOrgs.value && !isMember.value && isCompanyEmail.value) return false

    return true
  })
)
const orgItems = [
  { label: 'Overview', tab: 'org-setup', icon: 'fa-regular fa-gauge', perm: null, ownerOnly: false },
  { label: 'Domain',           tab: 'org-domain',         icon: 'fa-regular fa-globe',           perm: 'domain.read',       ownerOnly: false },
  { label: 'Members',          tab: 'org-users',          icon: 'fa-regular fa-users',           perm: 'company_user.read', ownerOnly: false },
  { label: 'Roles',            tab: 'org-roles',          icon: 'fa-regular fa-shield-halved',   perm: 'company_user.read', ownerOnly: false },
  { label: 'Tokens Allocation', tab: 'token-allocation',  icon: 'fa-regular fa-microchip-ai',    perm: 'package.read', ownerOnly: false },
  { label: 'Billing & Plans',  tab: 'org-packages',     icon: 'fa-regular fa-credit-card',     perm: 'package.read', ownerOnly: false },
  { label: 'Transfer Owner',   tab: 'ownership-transfer', icon: 'fa-regular fa-user-gear',       perm: null,                ownerOnly: true }
]

const visibleOrgItems = computed(() => {
  if (isMember.value && permissions.value.length === 0) {
    return orgItems.filter(i => i.tab === 'org-setup')
  }
  return orgItems.filter(i => {
    if (i.ownerOnly && !isOwnerOfActive.value) return false
    if (i.perm && !hasPerm(i.perm)) return false
    return true
  })
})

function orgInitials(title: string) {
  return (title ?? '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'OR'
}
</script>

<template>
  <!-- Backdrop overlay for mobile -->
  <Transition name="fade">
    <div
      v-if="mobileOpen"
      class="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
      @click="emit('close-mobile')"
    />
  </Transition>

  <aside
    class="settings-sidebar h-full flex flex-col bg-bg-body border-r border-border shrink-0 overflow-y-auto
           w-full max-w-[280px] md:w-[240px]"
    :class="{ 'mobile-open': mobileOpen }"
  >

    <!-- Back + mobile close -->
    <div class="px-3 pt-4 pb-3 shrink-0 flex items-center justify-between gap-2">
      <button
        @click="goBack"
        class="flex items-center gap-2 cursor-pointer text-[12px] text-text-secondary hover:text-accent group transition-colors px-2 py-2 rounded-lg hover:bg-bg-card flex-1 mb-1"
      >
        <i class="fa-solid fa-arrow-left text-[10px] group-hover:-translate-x-0.5 transition-transform"></i>
        Back to dashboard
      </button>

      <!-- Close button — mobile only -->
      <button
        @click="emit('close-mobile')"
        class="md:hidden mb-1 w-7 h-7 flex items-center justify-center rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card border border-border transition-all shrink-0 cursor-pointer"
        aria-label="Close menu"
      >
        <i class="fa-solid fa-xmark text-[12px]"></i>
      </button>
    </div>
<!-- Skeleton -->
<div v-if="isProfileLoading" class="flex flex-col flex-1 px-3 pb-6 gap-4 animate-pulse">
  <div class="h-2.5 w-16 rounded bg-border/20"></div>
  <div class="space-y-1">
    <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-3 py-2.5 rounded-lg">
      <div class="w-4 h-4 rounded bg-border/30 shrink-0"></div>
      <div class="h-3 rounded bg-border/25" :style="{ width: `${65 + (i * 19) % 60}px` }"></div>
    </div>
  </div>
  <div class="h-2.5 w-20 rounded bg-border/20 mt-2"></div>
  <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/30">
    <div class="w-8 h-8 rounded-lg bg-border/30 shrink-0"></div>
    <div class="space-y-1.5 flex-1">
      <div class="h-3 w-24 rounded bg-border/30"></div>
      <div class="h-2.5 w-16 rounded bg-border/20"></div>
    </div>
  </div>
  <div class="space-y-1 mt-1">
    <div v-for="i in 5" :key="i" class="flex items-center gap-3 px-3 py-2.5 rounded-lg">
      <div class="w-4 h-4 rounded bg-border/30 shrink-0"></div>
      <div class="h-3 rounded bg-border/25" :style="{ width: `${55 + (i * 23) % 70}px` }"></div>
    </div>
  </div>
  <div class="mt-auto flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/20">
    <div class="w-9 h-9 rounded-full bg-border/30 shrink-0"></div>
    <div class="space-y-1.5 flex-1">
      <div class="h-3 w-20 rounded bg-border/30"></div>
      <div class="h-2.5 w-28 rounded bg-border/20"></div>
    </div>
  </div>
</div>

    <div v-else class="flex flex-col flex-1 px-3 pb-6 min-h-0 gap-6">

      <!-- ── PERSONAL (non-company emails) ── -->
      <template v-if="mode === 'personal' && !isCompanyEmail">
        <!-- User identity card -->
        <div class="flex items-center gap-3 px-2 pt-1 pb-1">
          <div class="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[13px] font-bold shrink-0 ring-2 ring-accent/20">
            {{ initials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold text-text-primary truncate leading-tight">
              {{ profile?.data?.u_full_name || 'Your Account' }}
            </p>
            <p class="text-[11px] text-text-secondary truncate leading-tight mt-0.5">{{ personalPlan }} plan</p>
          </div>
        </div>

        <div>
          <p class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold mb-2 px-1">Account</p>
          <nav class="space-y-0.5">
            <button
              v-for="item in visiblePersonalItems"
              :key="item.tab"
              @click="selectTab(item.tab)"
              class="w-full flex items-center cursor-pointer gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all"
              :class="currentTab === item.tab
                ? 'bg-accent/10 text-accent font-semibold'
                : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'"
            >
              <i :class="[item.icon, 'w-4 text-center text-[13px] shrink-0']"></i>
              {{ item.label }}
              <i v-if="currentTab === item.tab" class="fa-solid fa-chevron-right text-[9px] ml-auto opacity-40"></i>
            </button>
          </nav>
        </div>

        <div v-if="isPersonalFree">
          <div class="rounded-xl border border-purple-500/25 bg-gradient-to-b from-purple-500/10 to-purple-500/5 p-4">
            <div class="flex items-center gap-2 mb-1.5">
              <i class="fa-solid fa-crown text-purple-400 text-[11px]"></i>
              <p class="text-[12px] font-bold text-text-primary">You're on the Free plan</p>
            </div>
            <p class="text-[11px] text-text-secondary leading-snug mb-3">
              Upgrade to unlock higher token limits, advanced AI features, and full access to premium tools.
            </p>
            <ul class="text-[11px] text-text-secondary mb-3 space-y-1.5">
              <li class="flex items-center gap-1.5"><i class="fa-solid fa-circle-check text-purple-400 text-[10px]"></i> More AI tokens per month</li>
              <li class="flex items-center gap-1.5"><i class="fa-solid fa-circle-check text-purple-400 text-[10px]"></i> Access to advanced features</li>
              <li class="flex items-center gap-1.5"><i class="fa-solid fa-circle-check text-purple-400 text-[10px]"></i> Faster processing &amp; priority usage</li>
            </ul>
            <button
              @click="selectTab('billing')"
              class="w-full py-2.5 rounded-lg text-white text-[12px] cursor-pointer font-bold hover:opacity-90 active:scale-[0.97] transition-all"
              style="background: linear-gradient(90deg, #7c3aed, #6c63ff)"
            >
              Upgrade plan →
            </button>
          </div>
        </div>
      </template>

      <!-- ── ORGANIZATION ── -->
      <template v-if="isCompanyEmail || mode === 'org'">

        <!-- No org state -->
        <div v-if="!hasOrgs && !hasAssociatedCompany && !isPendingOrgMember" class="flex flex-col gap-3">
          <div>
    <p class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold mb-2 px-1">Account</p>
    <nav class="space-y-0.5">
      <button
        v-for="item in visiblePersonalItems"
        :key="item.tab"
        @click="selectTab(item.tab)"
        class="w-full flex items-center cursor-pointer gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all"
        :class="currentTab === item.tab
          ? 'bg-accent/10 text-accent font-semibold'
          : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'"
      >
        <i :class="[item.icon, 'w-4 text-center text-[13px] shrink-0']"></i>
        {{ item.label }}
        <i v-if="currentTab === item.tab" class="fa-solid fa-chevron-right text-[9px] ml-auto opacity-40"></i>
      </button>
    </nav>
  </div>
          <p class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold px-1">Organization</p>
          <div class="rounded-xl border border-border bg-bg-card p-4">
            <div class="flex items-center gap-2 mb-1.5">
              <i class="fa-regular fa-building text-text-secondary text-[13px]"></i>
              <p class="text-[12px] font-bold text-text-primary">No organization yet</p>
            </div>
            <p class="text-[11px] text-text-secondary leading-snug mb-3">
              Create your organization to manage teams, members, and advanced settings.
            </p>
            <button
              @click="router.push({ path: '/onboarding', query: { mode: 'team', fromSettings: 'true' } })"
              class="w-full py-2.5 rounded-lg text-white text-[12px] cursor-pointer font-bold hover:opacity-90 active:scale-[0.97] transition-all"
              style="background: linear-gradient(90deg, #7c3aed, #6c63ff)"
            >
              <i class="fa-solid fa-plus text-[10px] mr-1"></i>
              Create organization
            </button>
          </div>
        </div>

        <div v-if="hasOrgs" class="flex flex-col gap-5">

          <!-- Org picker -->
          <div>
            <p class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold mb-2 px-1">Organization</p>
            <div class="space-y-1">
              <button
                v-for="company in allCompanies"
                :key="company._id"
                @click="selectCompany(company)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all border cursor-pointer"
                :class="displayCompanyId === company._id
                  ? 'bg-accent/10 border-accent/20 text-text-primary'
                  : 'border-transparent hover:bg-bg-card text-text-secondary hover:text-text-primary'"
              >
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden"
                  style="background: linear-gradient(135deg, #6c63ff 0%, #a78bfa 100%)"
                >
                  <img v-if="company.logo" :src="company.logo" class="w-full h-full object-cover" alt="" />
                  <span v-else>{{ orgInitials(company.title) }}</span>
                </div>
                <div class="flex-1 min-w-0 text-left">
                  <p class="text-[12px] font-semibold truncate leading-tight">{{ company.title }}</p>
                  <p class="text-[10px] text-text-secondary capitalize leading-tight mt-0.5">{{ company?.role?.title }}</p>
                </div>
                <span v-if="isSwitching && selectedCompanyId === company._id" class="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin shrink-0"></span>
                <span v-else-if="company.is_pending_deletion" class="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0" style="background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger-border);">Deleting</span>
                <span v-else-if="displayCompanyId === company._id" class="w-2 h-2 rounded-full bg-accent shrink-0"></span>
              </button>
            </div>
          </div>

          <!-- Org nav -->
          <div v-if="visibleOrgItems.length > 0">
            <p class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold mb-2 px-1">Settings</p>
            <nav class="space-y-0.5">
              <button
                v-for="item in visibleOrgItems"
                :key="item.tab"
                @click="!isPendingDeletion && selectTab(item.tab)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all"
                :class="isPendingDeletion
                  ? 'text-text-secondary/40 cursor-not-allowed'
                  : currentTab === item.tab
                    ? 'bg-accent/10 text-accent font-semibold cursor-pointer'
                    : 'text-text-secondary hover:bg-bg-card hover:text-text-primary cursor-pointer'"
                :disabled="isPendingDeletion"
                :title="isPendingDeletion ? 'Organization is pending deletion' : ''"
              >
                <i :class="[item.icon, 'w-4 text-center text-[13px] shrink-0']"></i>
                {{ item.label }}
                <i v-if="currentTab === item.tab && !isPendingDeletion" class="fa-solid fa-chevron-right text-[9px] ml-auto opacity-40"></i>
                <i v-if="isPendingDeletion" class="fa-solid fa-lock text-[9px] ml-auto" style="color: var(--danger);"></i>
              </button>
            </nav>
          </div>

          <!-- Upgrade banner — org owners on free plan -->
          <div v-if="isOrgFree && canSeeUpgradeBanner">
            <div
              class="rounded-xl border p-4 transition-all"
              :class="isPendingDeletion
                ? 'border-border opacity-40 cursor-not-allowed pointer-events-none'
                : 'border-purple-500/25 bg-gradient-to-b from-purple-500/10 to-purple-500/5'"
            >
              <div class="flex items-center gap-2 mb-2">
                <i class="fa-solid fa-crown text-[11px]" :class="isPendingDeletion ? 'text-text-secondary' : 'text-purple-400'"></i>
                <p class="text-[12px] font-bold text-text-primary">You're on the Free plan</p>
              </div>
              <p class="text-[11px] text-text-secondary leading-snug mb-3">
                Upgrade to unlock the full power of your organization.
              </p>
              <ul class="mb-3 space-y-1.5">
                <li class="flex items-start gap-2 text-[11px] text-text-secondary">
                  <i class="fa-solid fa-circle-check text-[10px] mt-0.5 shrink-0" :class="isPendingDeletion ? 'text-text-secondary' : 'text-purple-400'"></i>
                  <span>Unlimited workspaces &amp; team members</span>
                </li>
                <li class="flex items-start gap-2 text-[11px] text-text-secondary">
                  <i class="fa-solid fa-circle-check text-[10px] mt-0.5 shrink-0" :class="isPendingDeletion ? 'text-text-secondary' : 'text-purple-400'"></i>
                  <span>Org AI Token Pool — up to 25M tokens/month</span>
                </li>
                <li class="flex items-start gap-2 text-[11px] text-text-secondary">
                  <i class="fa-solid fa-circle-check text-[10px] mt-0.5 shrink-0" :class="isPendingDeletion ? 'text-text-secondary' : 'text-purple-400'"></i>
                  <span>Advanced controls, roles &amp; integrations</span>
                </li>
              </ul>
              <button
                @click="selectTab('org-packages')"
                :disabled="isPendingDeletion"
                class="w-full py-2.5 rounded-lg text-white text-[12px] font-bold transition-all"
                :class="isPendingDeletion
                  ? 'cursor-not-allowed opacity-50 bg-border'
                  : 'cursor-pointer hover:opacity-90 active:scale-[0.97]'"
                :style="isPendingDeletion ? '' : 'background: linear-gradient(90deg, #7c3aed, #6c63ff)'"
              >
                Upgrade organization →
              </button>
            </div>
          </div>

        </div>
      </template>

    </div>
  </aside>
</template>

<style scoped>
.settings-sidebar {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Mobile: sidebar is a fixed drawer sliding in from the left */
@media (max-width: 767px) {
  .settings-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 40;
    transform: translateX(-100%);
    max-width: 300px;
    width: 85vw;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.25);
  }

  .settings-sidebar.mobile-open {
    transform: translateX(0);
  }
}

/* Backdrop fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>