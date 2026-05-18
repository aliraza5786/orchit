<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'
const props = defineProps<{
  mobileOpen?: boolean
  profile?: any
}>()

const emit = defineEmits(['close-mobile', 'switch-company'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// ─────────────────────────────
// STATE & MODE
// ─────────────────────────────
const mode = ref<'personal' | 'org'>('personal')

const companiesList = computed(() => 
  (props.profile?.companies_list ?? []).filter((c: any) => 
    c.membership_role === 'owner' || c.membership_role === 'admin'
  )
)
const hasOrgs = computed(() => companiesList.value.length > 0)

// Personal profile info
const initials = computed(() => {
  const name = props.profile?.u_full_name?.trim() || "";
  if (!name) return "U";
  return name.split(/\s+/).slice(0, 2).map((n: any) => n[0]).join("").toUpperCase();
});

const personalPlan = computed(() => props.profile?.package?.name || 'Free')
const isPersonalFree = computed(() => !personalPlan.value || personalPlan.value === 'Free')

const activeCompanyId = computed(() => authStore.company_id ?? null)
const selectedCompanyId = ref<string | null>(null)

const displayCompanyId = computed(() =>
  selectedCompanyId.value || activeCompanyId.value || companiesList.value[0]?._id || null
)

const activeCompany = computed(() =>
  companiesList.value.find((c: any) => c._id === displayCompanyId.value) ?? null
)

const isOrgFree = computed(() => {
  const plan = activeCompany.value?.package?.name
  return !plan || plan === 'Free'
})

const isOwnerOfActive = computed(() =>
  activeCompany.value?.membership_role === 'owner'
)

const isAdminOrOwnerOfActive = computed(() => {
  const role = activeCompany.value?.membership_role
  return role === 'owner' || role === 'admin'
})

const isCompanyEmail = computed(() => {
  const email = props.profile?.u_email || ''
  if (!email) return false
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return false
  const genericDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com']
  return !genericDomains.includes(domain)
})

const canCreateOrg = computed(() => {
  if (!isCompanyEmail.value) return true

  const activeCompany = props.profile?.active_company
  const list = props.profile?.companies_list ?? []
  
  const activeCompInList = list.find((c: any) => c._id === activeCompanyId.value) || activeCompany
  if (!activeCompInList) return true

  const role = (activeCompInList.membership_role || '').toLowerCase()
  const isOwner = role === 'owner'
  const isAdmin = role === 'admin'
  
  const roleTitle = (activeCompInList.company_role?.title || '').toLowerCase()
  const isSuperAdmin = roleTitle.includes('super') || roleTitle.includes('super admin') || activeCompInList.company_role?.is_super_admin === true

  return isOwner || isAdmin || isSuperAdmin
})

const isSwitching = ref(false)

// ─────────────────────────────
// METHODS
// ─────────────────────────────
onMounted(() => {
  // Determine initial mode
  const saved = localStorage.getItem('sidebar_mode')
  mode.value = (saved === 'org' && hasOrgs.value) ? 'org' : 'personal'

  if (hasOrgs.value && !activeCompanyId.value) {
    const first = companiesList.value[0]
    if (first) selectCompany(first, false)
  }

  // Sync URL tab with mode
  const tab = route.query.tab as string
  const isOrgTab = ['org-setup', 'org-domain', 'org-users', 'org-roles',
                    'org-packages', 'token-allocation', 'ownership-transfer',
                    'org-create'].includes(tab)
  
  if (isOrgTab && hasOrgs.value) mode.value = 'org'
  else if (['profile', 'token-utilization', 'billing'].includes(tab)) mode.value = 'personal'
})

watch(mode, (val) => localStorage.setItem('sidebar_mode', val))

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

    router.push({
      path: router.currentRoute.value.path,
      query: { tab: 'org-setup' }
    })
  } finally {
    isSwitching.value = false
  }
}

const currentTab = computed(() => (route.query.tab as string) || 'profile')

function selectTab(tab: string) {
  router.push({ query: { tab } })
  emit('close-mobile')
}

function goBack() {
  router.push('/dashboard')
}

function switchMode(newMode: 'personal' | 'org') {
  mode.value = newMode
  if (newMode === 'personal') {
    selectTab('profile')
  } else {
    if (hasOrgs.value) selectTab('org-setup')
    else selectTab('org-create')
  }
}

// ─────────────────────────────
// MENU ITEMS
// ─────────────────────────────
const personalItems = [
  { label: 'Profile',  tab: 'profile',           icon: 'fa-regular fa-circle-user' },
  { label: 'Tokens',   tab: 'token-utilization', icon: 'fa-regular fa-coins' },
  { label: 'Billing',  tab: 'billing',           icon: 'fa-regular fa-credit-card' },
]

const visiblePersonalItems = computed(() => {
  return personalItems.filter(item => {
    // Hide billing from personal if user has an organization
    if (item.tab === 'billing' && hasOrgs.value) return false
    return true
  })
})

const orgItems = [
  { label: 'Overview',        tab: 'org-setup',          icon: 'fa-regular fa-sliders',       ownerOnly: false },
  { label: 'Domain',          tab: 'org-domain',         icon: 'fa-regular fa-globe',          ownerOnly: false },
  { label: 'Members',         tab: 'org-users',          icon: 'fa-regular fa-users',          ownerOnly: false },
  { label: 'Roles',           tab: 'org-roles',          icon: 'fa-regular fa-shield-halved',  ownerOnly: false },
  { label: 'Billing & Plans', tab: 'org-packages',       icon: 'fa-regular fa-credit-card',    ownerOnly: false },
  { label: 'Token Allocation',tab: 'token-allocation',   icon: 'fa-regular fa-chart-bar',      ownerOnly: false },
  { label: 'Transfer Owner',  tab: 'ownership-transfer', icon: 'fa-regular fa-user-gear',      ownerOnly: true  },
]

const visibleOrgItems = computed(() => {
  if (!isAdminOrOwnerOfActive.value && hasOrgs.value) return []
  return orgItems.filter(item => !item.ownerOnly || isOwnerOfActive.value)
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
    <!-- Top section -->
    <div class="px-2 pt-5 pb-4 shrink-0">
      <button
        @click="goBack"
        class="flex items-center gap-2 cursor-pointer text-xs text-text-secondary hover:text-accent group transition-colors mb-5 p-2 hover:font-semibold"
      >
        <i class="fa-solid fa-arrow-left text-[10px] group-hover:-translate-x-0.5 transition-transform"></i>
        Back to dashboard
      </button>

      <!-- Toggle Tabs (Only if they have orgs) -->
      <div v-if="hasOrgs" class="flex rounded-lg border border-border bg-bg-card p-[2px] gap-[3px]">
        <button
          @click="switchMode('personal')"
          class="flex-1 flex items-center cursor-pointer justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200"
          :class="mode === 'personal'
            ? 'bg-bg-body text-text-primary shadow-sm border border-border/70'
            : 'text-text-secondary hover:text-text-primary'"
        >
          Personal
        </button>
        <button
          @click="switchMode('org')"
          class="flex-1 flex items-center cursor-pointer justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200"
          :class="mode === 'org'
            ? 'bg-bg-body text-text-primary shadow-sm border border-border/70'
            : 'text-text-secondary hover:text-text-primary'"
        >
          Organization
        </button>
      </div>
    </div>

    <!-- Scrollable body -->
    <div class="flex flex-col flex-1 px-2 pb-5 min-h-0">

      <!-- ORGANIZATION MODE -->
      <template v-if="mode === 'org'">
        <div v-if="hasOrgs" class="space-y-6">
          <!-- Org picker -->
          <div>
            <p class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold mb-2 px-1">Workspace</p>
            <div class="space-y-1">
              <button
                v-for="company in companiesList"
                :key="company._id"
                @click="selectCompany(company)"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all border"
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
                  <p class="text-[10px] text-text-secondary capitalize leading-tight mt-0.5">{{ company.membership_role || 'member' }}</p>
                </div>
                <span v-if="isSwitching && selectedCompanyId === company._id" class="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin shrink-0"></span>
                <span v-else-if="displayCompanyId === company._id" class="w-1.5 h-1.5 rounded-full bg-accent shrink-0"></span>
              </button>
            </div>
          </div>

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

          <!-- Org upgrade banner -->
          <div v-if="isOrgFree && isOwnerOfActive" class="mt-2">
            <div class="rounded-xl border border-purple-500/25 bg-gradient-to-b from-purple-500/10 to-purple-500/5 p-4">
              <div class="flex items-center gap-2 mb-1.5">
                <i class="fa-solid fa-crown text-purple-400 text-[11px]"></i>
                <p class="text-[12px] font-bold text-text-primary">Free organization</p>
              </div>
              <p class="text-[11px] text-text-secondary leading-snug mb-3">
                Unlock team features, more members & advanced controls.
              </p>
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

        <!-- No orgs: Empty State -->
        <div v-else class="flex-1 flex flex-col px-2 pt-4">
          <div class="rounded-2xl border border-accent/20 bg-gradient-to-b from-accent/10 to-bg-card p-6 text-center shadow-sm">
            <div class="w-12 h-12 rounded-2xl bg-bg-body shadow-sm flex items-center justify-center mx-auto mb-4 border border-accent/10">
              <i class="fa-solid fa-building text-accent text-xl"></i>
            </div>
            <h3 class="text-[14px] font-bold text-text-primary">Scale Your Team</h3>
            <p class="text-[11px] text-text-secondary mt-2 mb-5">
              Create an organization to invite your team and unlock professional collaboration tools.
            </p>
            <button
              v-if="canCreateOrg"
              @click="selectTab('org-create')"
              class="w-full py-2 rounded-lg bg-accent text-white text-[12px] font-bold hover:bg-accent/90 transition-all cursor-pointer"
            >
              Get Started
            </button>
            <div v-else class="text-[11px] text-text-secondary font-medium">
              Organization creation is restricted to administrators only.
            </div>
          </div>
        </div>
      </template>

      <!-- PERSONAL MODE -->
      <template v-else>
        <div class="space-y-6">
          <div v-if="hasOrgs" class="flex items-center gap-3 p-2 rounded-lg bg-bg-card border border-border/60">
            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0 overflow-hidden">
              <img v-if="profile?.u_profile_image" :src="profile.u_profile_image" class="w-full h-full object-cover" alt="" />
              <span v-else>{{ initials }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[11px] font-bold text-text-primary truncate">{{ profile?.u_full_name || 'My Account' }}</p>
              <p class="text-[9px] text-text-secondary truncate">{{ personalPlan }} plan</p>
            </div>
          </div>

          <div>
            <p v-if="hasOrgs" class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold mb-2 px-1">Account</p>
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

          <div class="mt-auto space-y-3 pt-4">
      <div v-if="isPersonalFree && !hasOrgs" class="rounded-xl border border-accent/25 bg-gradient-to-b from-accent/10 to-accent/5 p-4">
        <div class="flex items-center gap-2 mb-1.5">
          <i class="fa-solid fa-bolt text-accent text-[11px]"></i>
          <p class="text-[12px] font-bold text-text-primary">Free account</p>
        </div>
        <p class="text-[11px] text-text-secondary leading-snug mb-3">
          Upgrade for more AI tokens, storage & features.
        </p>
        <button
          @click="selectTab('billing')"
          class="w-full py-2 rounded-lg cursor-pointer bg-accent text-white text-[12px] font-bold hover:bg-accent/90 active:scale-[0.97] transition-all"
        >
          Upgrade personal →
        </button>
      </div>

      <div v-if="!hasOrgs && canCreateOrg">
        <button
          @click="switchMode('org'); selectTab('org-create')"
          class="w-full py-2 rounded-lg border border-dashed border-accent text-accent text-[12px] cursor-pointer font-bold hover:bg-accent/10 active:scale-[0.97] transition-all"
        >
          Create organization →
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
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 768px) {
  .settings-sidebar {
    position: fixed;
    top: 60px;
    left: 0;
    bottom: 0;
    z-index: 40;
    transform: translateX(-100%);
  }
  .settings-sidebar.mobile-open {
    transform: translateX(0);
  }
}
</style>