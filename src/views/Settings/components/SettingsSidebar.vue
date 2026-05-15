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
// MODE
// ─────────────────────────────
const mode = ref<'personal' | 'org'>('personal')

const companiesList = computed(() => props.profile?.companies_list ?? [])
const hasOrgs = computed(() => companiesList.value.length > 0)

// Is the user an owner of at least one org? → hide "create new org" button
const isOwnerOfAnyOrg = computed(() =>
  companiesList.value.some((c: any) => c.membership_role === 'owner')
)

// Personal plan
const personalPlan = computed(() => props.profile?.package?.name || 'Free')
const isPersonalFree = computed(() => !personalPlan.value || personalPlan.value === 'Free')

onMounted(() => {
  const saved = localStorage.getItem('sidebar_mode')
  mode.value = saved === 'org' && hasOrgs.value ? 'org' : 'personal'

  if (mode.value === 'org' && !activeCompanyId.value && hasOrgs.value) {
    const first = companiesList.value[0]
    if (first) selectCompany(first, false)
  }

  // ── FIX: sync URL tab with resolved mode on mount ──────────────────────
  const tab = route.query.tab as string
  const isOrgTab = ['org-setup', 'org-domain', 'org-users', 'org-roles',
                    'org-packages', 'token-allocation', 'ownership-transfer',
                    'org-create'].includes(tab)
  const isPersonalTab = ['profile', 'token-utilization', 'billing'].includes(tab)

  if (mode.value === 'personal' && isOrgTab) {
    // Mode resolved to personal but URL has an org tab → reset to profile
    router.replace({ query: { tab: 'profile' } })
  } else if (mode.value === 'org' && isPersonalTab) {
    // Mode resolved to org but URL has a personal tab → reset to org-setup
    router.replace({ query: { tab: 'org-setup' } })
  }
  // If no tab in URL, nothing to fix — currentTab defaults to 'profile' ✅
})

watch(mode, (val) => localStorage.setItem('sidebar_mode', val))



function switchMode(val: 'personal' | 'org') {
  if (val === mode.value) return
  mode.value = val

  if (val === 'personal') {
    authStore.clearCompany()
    router.push({ query: { tab: 'profile' } })
  } else {
    const first = companiesList.value[0]
    if (first && !activeCompanyId.value) {
      selectCompany(first, true)
    } else if (activeCompanyId.value) {
      router.push({ query: { tab: 'org-setup' } })
    } else {
      router.push({ query: { tab: 'org-create' } })
    }
  }
}
// ─────────────────────────────
// COMPANY STATE
// ─────────────────────────────
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

    // ✅ ALWAYS stay in same app
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

// ─────────────────────────────
// MENU ITEMS
// ─────────────────────────────
const personalItems = [
  { label: 'Profile',  tab: 'profile',           icon: 'fa-regular fa-circle-user' },
  { label: 'Tokens',   tab: 'token-utilization', icon: 'fa-regular fa-coins' },
  { label: 'Billing',  tab: 'billing',           icon: 'fa-regular fa-credit-card' },
]

const orgItems = [
  { label: 'Overview',        tab: 'org-setup',          icon: 'fa-regular fa-sliders',       ownerOnly: false },
  { label: 'Domain',          tab: 'org-domain',         icon: 'fa-regular fa-globe',          ownerOnly: false },
  { label: 'Members',         tab: 'org-users',          icon: 'fa-regular fa-users',          ownerOnly: false },
  { label: 'Roles',           tab: 'org-roles',          icon: 'fa-regular fa-shield-halved',  ownerOnly: false },
  { label: 'Billing & Plans', tab: 'org-packages',       icon: 'fa-regular fa-credit-card',    ownerOnly: false },
  { label: 'Token Allocation',tab: 'token-allocation',   icon: 'fa-regular fa-chart-bar',      ownerOnly: false },
  { label: 'Transfer Owner',  tab: 'ownership-transfer', icon: 'fa-regular fa-user-gear',      ownerOnly: true  },
]

const visibleOrgItems = computed(() =>
  orgItems.filter(item => !item.ownerOnly || isOwnerOfActive.value)
)

function orgInitials(title: string) {
  return (title ?? '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || 'OR'
}
</script>

<template>
  <aside
    class="settings-sidebar h-full flex flex-col bg-bg-body border-r border-border w-[240px] shrink-0 overflow-y-auto"
    :class="{ 'mobile-open': mobileOpen }"
  >
    <!-- ── Fixed top section: back + toggle ── -->
    <div class="px-2 pt-5 pb-4 shrink-0">

      <!-- BACK -->
      <button
        @click="goBack"
        class="flex items-center gap-2 cursor-pointer text-xs text-text-secondary hover:text-accent group transition-colors mb-5 p-2 hover:font-semibold"
      >
        <i class="fa-solid fa-arrow-left text-[10px] group-hover:-translate-x-0.5 transition-transform"></i>
        Back to dashboard
      </button>

      <!-- PERSONAL / ORG TOGGLE — only shown if user has orgs -->
      <div v-if="hasOrgs" class="flex rounded-lg border border-border bg-bg-card p-[2px] gap-[3px]">

  <!-- Personal -->
  <button
    @click="switchMode('personal')"
    class="flex-1 flex items-center cursor-pointer justify-center gap-1.5 py-2 rounded-md text-[12px] font-semibold transition-all duration-200 ease-out hover:shadow-sm hover:-translate-y-[1px]"
    :class="mode === 'personal'
      ? 'bg-bg-body text-text-primary shadow-sm border border-border/70'
      : 'text-text-secondary hover:text-white hover:bg-accent hover:border border-accent'"
  >
    <i class="fa-regular fa-circle-user text-[11px] transition-colors duration-200"></i>
    Personal
  </button>

  <!-- Organization -->
  <button
    @click="switchMode('org')"
    class="flex-1 flex items-center cursor-pointer justify-center gap-1.5 py-2 rounded-md text-[12px] font-semibold transition-all duration-200 ease-out hover:shadow-sm hover:-translate-y-[1px]"
    :class="mode === 'org'
      ? 'bg-bg-body text-text-primary shadow-sm border border-border/70'
      : 'text-text-secondary hover:text-white hover:bg-accent hover:border border-accent'"
  >
    <i class="fa-regular fa-building text-[11px] transition-colors duration-200"></i>
    Organization
  </button>

</div>
    </div>

    <!-- ── Scrollable body ── -->
    <div class="flex flex-col flex-1 px-2 pb-5 min-h-0">

      <!-- ════════════════════
           PERSONAL MODE
      ════════════════════ -->
      <template v-if="mode === 'personal'">

        <!-- Identity chip -->
        <div class="flex items-center gap-3 p-2 mb-4 rounded-lg bg-bg-card border border-border/60">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-[12px] font-bold shrink-0 overflow-hidden">
            <img
              v-if="profile?.u_profile_image"
              :src="profile.u_profile_image"
              class="w-full h-full object-cover"
              alt="avatar"
            />
            <span v-else>{{ (profile?.u_full_name || 'U').charAt(0).toUpperCase() }}</span>
          </div>
          <div class="min-w-0">
            <p class="text-[13px] font-semibold text-text-primary truncate leading-tight">{{ profile?.u_full_name || 'My Account' }}</p>
            <p class="text-[11px] text-text-secondary leading-tight flex items-center gap-1.5 mt-0.5">
              <span
                class="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                :class="isPersonalFree ? 'bg-text-secondary/30' : 'bg-green-500'"
              ></span>
              {{ personalPlan }} plan
            </p>
          </div>
        </div>

        <!-- Section label -->
        <p class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold mb-2">Account</p>

        <!-- Nav items -->
        <nav class="space-y-0.5">
          <button
            v-for="item in personalItems"
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

        <!-- Push upgrade cards to bottom -->
        <div class="flex-1 min-h-[24px]"></div>

        <!-- FREE PLAN upgrade nudge -->
        <div v-if="isPersonalFree" class="mt-2">
          <div class="rounded-xl border border-accent/25 bg-gradient-to-b from-accent/10 to-accent/5 p-4">
            <div class="flex items-center gap-2 mb-1.5">
              <i class="fa-solid fa-bolt text-accent text-[11px]"></i>
              <p class="text-[12px] font-bold text-text-primary">Free plan</p>
            </div>
            <p class="text-[11px] text-text-secondary leading-snug mb-3">
              Upgrade for more AI tokens, storage &amp; features.
            </p>
            <button
              @click="selectTab('billing')"
              class="w-full py-2 rounded-lg cursor-pointer bg-accent text-white text-[12px] font-bold hover:bg-accent/90 active:scale-[0.97] transition-all"
            >
              Upgrade personal →
            </button>
          </div>
        </div>

        <!-- No orgs nudge -->
        <div v-if="!hasOrgs" class="mt-2">
          <button
            @click="switchMode('org')"
            class="w-full flex items-center justify-center cursor-pointer gap-2 px-3 py-2 rounded-lg border border-dashed border-border/80 text-text-secondary hover:text-accent hover:border-accent/40 text-[12px] font-medium transition-all"
          >
            <i class="fa-solid fa-plus text-[10px]"></i>
            Create an organization
          </button>
        </div>

      </template>

      <!-- ════════════════════
           ORG MODE
      ════════════════════ -->
      <template v-else-if="mode === 'org'">

        <!-- No orgs: empty state -->
        <div v-if="!hasOrgs" class="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
          <div class="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <i class="fa-regular fa-building text-accent text-xl"></i>
          </div>
          <div>
            <p class="text-[13px] font-bold text-text-primary">No organization yet</p>
            <p class="text-[11px] text-text-secondary mt-1.5 leading-snug">Create one to manage a team &amp; shared workspace.</p>
          </div>
          <button
            @click="selectTab('org-create')"
            class="px-5 py-2 rounded-lg bg-accent text-white text-[12px] font-bold hover:bg-accent/90 transition-all"
          >
            Get started
          </button>
        </div>

        <!-- Has orgs -->
        <template v-else>

          <!-- Org picker -->
          <div class="mb-4">
            <p class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold mb-2">Workspace</p>
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

          <!-- Divider -->
          <div class="h-px bg-border/50 mb-4"></div>

          <!-- Org nav -->
          <p class="text-[10px] uppercase tracking-widest text-text-secondary/50 font-semibold mb-2">Settings</p>
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

          <!-- Push upgrade cards to bottom -->
          <div class="flex-1 min-h-[24px]"></div>

          <!-- Org upgrade banner — owner only, free plan only -->
          <div v-if="isOrgFree && isOwnerOfActive" class="mt-2">
            <div class="rounded-xl border border-purple-500/25 bg-gradient-to-b from-purple-500/10 to-purple-500/5 p-4">
              <div class="flex items-center gap-2 mb-1.5">
                <i class="fa-solid fa-crown text-purple-400 text-[11px]"></i>
                <p class="text-[12px] font-bold text-text-primary">Free organization</p>
              </div>
              <p class="text-[11px] text-text-secondary leading-snug mb-3">
                Unlock team features, more members &amp; advanced controls.
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

          <!-- Create new org — hidden if user already owns one -->
          <div v-if="!isOwnerOfAnyOrg" class="mt-2">
            <button
              @click="selectTab('org-create')"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border/80 text-text-secondary hover:text-accent hover:border-accent/40 text-[12px] font-medium transition-all"
            >
              <i class="fa-solid fa-plus text-[10px]"></i>
              Create new organization
            </button>
          </div>

        </template>
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