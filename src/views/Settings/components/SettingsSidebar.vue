<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

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

const hasOrgs         = computed(() => allCompanies.value.length > 0)
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
// ✅ isMember: ONLY plain members/viewers with no elevated role
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

const visiblePersonalItems = computed(() =>
  personalItems.filter(item => {
    if (item.tab === 'billing' && hasOrgs.value && !isMember.value && isCompanyEmail.value) return false
    return true
  })
)
const orgItems = [
  {
    label: 'Overview',
    tab: 'org-setup',
    icon: 'fa-regular fa-sliders',
    perm: null,
    ownerOnly: false,
  },
  {
    label: 'Domain',
    tab: 'org-domain',
    icon: 'fa-regular fa-globe',
    perm: 'domain.read',
    ownerOnly: false,
  },
  {
    label: 'Members',
    tab: 'org-users',
    icon: 'fa-regular fa-users',
    perm: 'company_user.read',
    ownerOnly: false,
  },
  {
    label: 'Roles',
    tab: 'org-roles',
    icon: 'fa-regular fa-shield-halved',
    perm: 'company_user.read', // ✅ visible to anyone with this perm
    ownerOnly: false,
  },
  {
    label: 'Billing & Plans',
    tab: 'org-packages',
    icon: 'fa-regular fa-credit-card',
    perm: 'package.read',
    ownerOnly: false,
  },
  {
    label: 'Token Allocation',
    tab: 'token-allocation',
    icon: 'fa-regular fa-chart-bar',
    perm: 'package.read',      // ✅ visible to anyone with this perm
    ownerOnly: false,
  },
  {
    label: 'Transfer Owner',
    tab: 'ownership-transfer',
    icon: 'fa-regular fa-user-gear',
    perm: null,
    ownerOnly: true,           // ✅ owner only, always
  },
]

const visibleOrgItems = computed(() => {
  // Pure members/viewers with zero permissions → Overview only
  if (isMember.value && permissions.value.length === 0) {
    return orgItems.filter(i => i.tab === 'org-setup')
  }

  return orgItems.filter(i => {
    if (i.ownerOnly && !isOwnerOfActive.value) return false
    // null perm = always show; otherwise check permissions array
    if (i.perm && !hasPerm(i.perm)) return false
    return true
  })
})

function orgInitials(title: string) {
  return (title ?? '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'OR'
}
</script>

<template>
  <aside
    class="settings-sidebar h-full flex flex-col bg-bg-body border-r border-border w-[240px] shrink-0 overflow-y-auto"
    :class="{ 'mobile-open': mobileOpen }"
  >
    <!-- Back -->
    <div class="px-2 pt-4 pb-3 shrink-0">
      <button
        @click="goBack"
        class="flex items-center gap-2 cursor-pointer text-[12px] text-text-secondary hover:text-accent group transition-colors px-2 py-1.5 rounded-lg hover:bg-bg-card w-full mb-1"
      >
        <i class="fa-solid fa-arrow-left text-[10px] group-hover:-translate-x-0.5 transition-transform"></i>
        Back to dashboard
      </button>
    </div>

    <div class="flex flex-col flex-1 px-2 pb-5 min-h-0 gap-6">

      <!-- ── PERSONAL (non-company emails) ── -->
      <template v-if="mode === 'personal' && !isCompanyEmail">
        <div class="flex items-center gap-3 px-2 pt-1">
          <div class="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center text-accent text-[12px] font-bold shrink-0">
            {{ initials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-semibold text-text-primary truncate leading-tight">
              {{ profile?.u_full_name || 'Your Account' }}
            </p>
            <p class="text-[10px] text-text-secondary truncate leading-tight mt-0.5">{{ personalPlan }} plan</p>
          </div>
        </div>

        <div>
          <p class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold mb-2 px-1">Account</p>
          <nav class="space-y-0.5">
            <button
              v-for="item in visiblePersonalItems"
              :key="item.tab"
              @click="selectTab(item.tab)"
              class="w-full flex items-center cursor-pointer gap-3 px-3 py-2 rounded-lg text-[13px] transition-all"
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
            <ul class="text-[11px] text-text-secondary mb-3 space-y-1">
              <li>• More AI tokens per month</li>
              <li>• Access to advanced features</li>
              <li>• Faster processing &amp; priority usage</li>
            </ul>
            <button
              @click="selectTab('billing')"
              class="w-full py-2 rounded-lg text-white text-[12px] cursor-pointer font-bold hover:opacity-90 active:scale-[0.97] transition-all"
              style="background: linear-gradient(90deg, #7c3aed, #6c63ff)"
            >
              Upgrade plan →
            </button>
          </div>
        </div>
      </template>

      <!-- ── ORGANIZATION ── -->
      <template v-if="isCompanyEmail || mode === 'org'">
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
                  class="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 overflow-hidden"
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
                <span v-else-if="displayCompanyId === company._id" class="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></span>
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
                @click="selectTab(item.tab)"
                class="w-full flex items-center cursor-pointer gap-3 px-3 py-2 rounded-lg text-[13px] transition-all"
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

          <!-- Upgrade banner — org owners on free plan -->
          <div v-if="isOrgFree && canSeeUpgradeBanner">
  <div class="rounded-xl border border-purple-500/25 bg-gradient-to-b from-purple-500/10 to-purple-500/5 p-4">
    <div class="flex items-center gap-2 mb-2">
      <i class="fa-solid fa-crown text-purple-400 text-[11px]"></i>
      <p class="text-[12px] font-bold text-text-primary">You're on the Free plan</p>
    </div>

    <p class="text-[11px] text-text-secondary leading-snug mb-3">
      Upgrade to unlock the full power of your organization.
    </p>

    <ul class="mb-3 space-y-1.5">
      <li class="flex items-start gap-2 text-[11px] text-text-secondary">
        <i class="fa-solid fa-circle-check text-purple-400 text-[10px] mt-0.5 shrink-0"></i>
        <span>Unlimited workspaces &amp; team members</span>
      </li>
      <li class="flex items-start gap-2 text-[11px] text-text-secondary">
        <i class="fa-solid fa-circle-check text-purple-400 text-[10px] mt-0.5 shrink-0"></i>
        <span>Org AI Token Pool — up to 25M tokens/month</span>
      </li>
      <li class="flex items-start gap-2 text-[11px] text-text-secondary">
        <i class="fa-solid fa-circle-check text-purple-400 text-[10px] mt-0.5 shrink-0"></i>
        <span>Advanced controls, roles &amp; integrations</span>
      </li>
    </ul>

    <button
      @click="selectTab('org-packages')"
      class="w-full py-2 rounded-lg text-white text-[12px] cursor-pointer font-bold hover:opacity-90 active:scale-[0.97] transition-all"
      style="background: linear-gradient(90deg, #7c3aed, #6c63ff)"
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
.settings-sidebar { transition: transform 0.22s cubic-bezier(0.4,0,0.2,1); }
@media (max-width: 768px) {
  .settings-sidebar { position: fixed; top: 60px; left: 0; bottom: 0; z-index: 40; transform: translateX(-100%); }
  .settings-sidebar.mobile-open { transform: translateX(0); }
}
</style>