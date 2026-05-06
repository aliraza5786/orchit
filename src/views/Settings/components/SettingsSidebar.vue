<template>
  <aside
    class="bg-bg-body ps-3 pe-1 md:bg-transparent h-full flex flex-col gap-1 transition-all duration-300 md:duration-200 py-3 fixed md:static top-[60px] left-0 z-20 overflow-y-auto"
    :class="[
      props.mobileOpen ? 'w-full translate-x-0' : 'md:w-[260px] -translate-x-full md:translate-x-0'
    ]"
  >
    <!-- Back Button -->
    <div class="mb-4 hidden md:block">
      <button
        @click="goBack"
        class="group flex items-center px-2 py-2 cursor-pointer rounded-[6px] border border-border text-xs text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none justify-start gap-2"
      >
        <i class="fa-solid fa-arrow-left text-[12px]"></i>
        <span class="whitespace-nowrap font-medium text-[14px] tracking-normal leading-[14px]">Go back</span>
      </button>
    </div>

    <!-- Personal Account Section -->
    <div class="space-y-3 ps-1 pe-3 md:px-0">
      <!-- Account Header -->
      <div class="px-2 py-3 rounded-lg bg-bg-card/40 border border-border/40">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary pb-2">
          Account
        </p>
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center text-accent text-xs font-bold overflow-hidden">
            <img v-if="profile?.u_profile_image"
              class="object-cover w-full h-full"
              :src="profile?.u_profile_image"
              alt="profile_img"
            />
            <i v-else class="fa-solid fa-user text-sm"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[12px] font-semibold text-text-primary truncate">Personal</p>
            <p class="text-[10px] text-text-secondary">Your account</p>
          </div>
        </div>
      </div>

      <!-- Personal Items -->
      <div class="space-y-0.5">
        <div
          v-for="item in personalItems"
          :key="item.tab"
          @click="selectTab(item.tab)"
          class="group cursor-pointer flex items-center px-2 py-2.5 rounded-lg text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none w-full justify-start gap-2.5"
          :class="currentTab === item.tab ? 'text-text-primary bg-bg-card' : ''"
        >
          <i :class="[item.icon, 'text-[14px]']"></i>
          <span class="whitespace-nowrap font-medium text-[13px]">{{ item.label }}</span>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="h-px bg-border/50 mx-2 my-3"></div>

    <!-- Organization Section -->
    <div class="space-y-2 ps-1 pe-3 md:px-0">
      <!-- Section Header -->
      <div class="px-2 flex items-center justify-between">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">
          Organization
        </p>
        <span
          v-if="companiesList.length > 0"
          class="text-[10px] text-text-secondary bg-bg-card border border-border/50 px-1.5 py-0.5 rounded-full"
        >
          {{ companiesList.length }}
        </span>
      </div>

      <!-- Companies List -->
      <template v-if="companiesList.length > 0">
        <!-- Company Entries -->
        <div class="space-y-1">
          <div
            v-for="company in companiesList"
            :key="company._id"
            class="rounded-lg border transition-all duration-150 overflow-hidden"
            :class="isActiveCompany(company._id)
              ? 'border-accent/40 bg-accent/5'
              : 'border-border/30 bg-transparent hover:border-border/60 hover:bg-bg-card/30'"
          >
            <!-- Company Header Row -->
            <div
              class="flex items-center gap-2 px-2 py-2 cursor-pointer"
              @click="toggleCompany(company._id)"
            >
              <!-- Logo / Avatar -->
              <div
                class="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-[11px] font-bold overflow-hidden"
                :class="isActiveCompany(company._id)
                  ? 'bg-accent/20 text-accent'
                  : 'bg-bg-card text-text-secondary'"
              >
                <img
                  v-if="company.logo"
                  :src="company.logo"
                  class="w-full h-full object-cover"
                  :alt="company.title"
                />
                <span v-else>{{ getInitials(company.title) }}</span>
              </div>

              <!-- Name + Role -->
              <div class="flex-1 min-w-0">
                <p class="text-[12px] font-semibold text-text-primary truncate leading-tight">{{ company.title }}</p>
                <div class="flex items-center gap-1 mt-0.5">
                  <span
                    class="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded-full tracking-wider"
                    :class="getRoleBadgeClass(company.membership_role)"
                  >
                    {{ company.membership_role }}
                  </span>
                </div>
              </div>

              <!-- Active indicator / expand chevron -->
              <div class="flex items-center gap-1 shrink-0">
                <span
                  v-if="isActiveCompany(company._id)"
                  class="w-1.5 h-1.5 rounded-full bg-accent"
                  title="Active"
                ></span>
                <i
                  class="fa-solid fa-chevron-down text-[10px] text-text-secondary transition-transform duration-200"
                  :class="expandedCompanyId === company._id ? 'rotate-180' : ''"
                ></i>
              </div>
            </div>

            <!-- Expanded: Set Active + Nav Items -->
            <div
              v-show="expandedCompanyId === company._id"
              class="border-t border-border/30 bg-bg-card/20"
            >
              <!-- Set as Active button (if not already active) -->
              <div v-if="!isActiveCompany(company._id)" class="px-2 py-2">
               <button
                @click.stop="setActiveCompany(company)"
                :disabled="isSwitching"
                class="w-full text-[11px] font-semibold text-accent border border-accent/30 rounded-md py-1.5 
                      hover:bg-accent/10 transition-all flex items-center justify-center gap-1.5
                      disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <template v-if="isSwitching">
                  <i class="fa-solid fa-spinner animate-spin text-[10px]"></i>
                  Switching...
                </template>

                <template v-else>
                  <i class="fa-solid fa-circle-check text-[10px]"></i>
                  Switch to this organization
                </template>
              </button>
              </div>

              <!-- Active badge -->
              <div v-else class="px-2 py-1.5 flex items-center gap-1.5">
                <i class="fa-solid fa-circle-check text-accent text-[10px]"></i>
                <span class="text-[10px] text-accent font-medium">Currently active</span>
              </div>

              <!-- Org Nav Items (permission-gated, only shown for active company) -->
              <template v-if="isActiveCompany(company._id)">
                <div class="px-1 pb-1.5 space-y-0.5">
                  <div
                    v-for="item in getPermittedOrgItems(company)"
                    :key="item.tab"
                    @click="selectTab(item.tab)"
                    class="group relative cursor-pointer flex items-center gap-2 px-2 py-1.5 rounded-md text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary select-none w-full text-[12px]"
                    :class="currentTab === item.tab ? 'text-text-primary bg-bg-card' : ''"
                  >
                    <i :class="[item.icon, 'text-[11px] shrink-0 w-3.5 text-center']"></i>
                    <span class="whitespace-nowrap font-medium">{{ item.label }}</span>
                    <span
                      v-if="currentTab === item.tab"
                      class="ml-auto w-1 h-3 rounded-full bg-accent"
                    ></span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Create new org CTA (compact) -->
        <div
          <div
            v-if="!hasAnyOwnerCompany"
            @click="selectTab('org-create')"
          class="group cursor-pointer flex items-center px-2.5 py-2 rounded-lg text-text-secondary transition-all hover:bg-accent/8 hover:text-accent select-none w-full gap-2 border border-dashed border-border/30 hover:border-accent/30 mt-1"
          :class="currentTab === 'org-create' ? 'bg-accent/8 text-accent border-accent/30' : ''"
        >
          <div class="w-5 h-5 rounded flex items-center justify-center">
            <i class="fa-regular fa-plus text-[12px]"></i>
          </div>
          <span class="text-[12px] font-medium">Create organization</span>
        </div>
      </template>

      <!-- No Orgs Yet -->
      <template v-else>
        <!-- Create Org CTA -->
        <div
          v-if="!hasAnyOwnerCompany"
          @click="selectTab('org-create')"
          class="group cursor-pointer flex items-center px-3 py-3 rounded-lg text-text-secondary transition-all relative hover:bg-accent/10 hover:text-accent select-none w-full justify-start gap-2.5 border-2 border-dashed border-border/40 hover:border-accent/40"
          :class="currentTab === 'org-create' ? 'bg-accent/10 text-accent border-accent/30' : ''"
        >
          <i class="fa-regular fa-plus text-[14px]"></i>
          <div class="min-w-0 flex-1">
            <span class="whitespace-nowrap font-semibold text-[13px]">Create organization</span>
            <p class="text-[10px] text-text-secondary/70 mt-0.5">Set up your team workspace</p>
          </div>
        </div>

        <!-- Packages always visible -->
        <div
          @click="selectTab('org-packages')"
          class="group cursor-pointer flex items-center px-2 py-2.5 rounded-lg text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none w-full justify-start gap-2.5"
          :class="currentTab === 'org-packages' ? 'text-text-primary bg-bg-card' : ''"
        >
          <i class="fa-regular fa-credit-card text-[14px]"></i>
          <span class="whitespace-nowrap font-medium text-[13px]">Packages</span>
        </div>

        <!-- Upgrade Notice -->
        <div class="mt-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
          <p class="text-[11px] font-semibold text-accent mb-1 flex items-center gap-1.5">
            <i class="fa-solid fa-star text-xs"></i> Upgrade available
          </p>
          <p class="text-[10px] text-text-secondary leading-relaxed mb-3">
            Create an organization to collaborate with your team and unlock all features.
          </p>
          <button
            @click="selectTab('org-packages')"
            class="w-full px-2 py-1.5 bg-accent text-white cursor-pointer text-xs font-semibold rounded-md hover:bg-accent/90 transition-all"
          >
            Learn more
          </button>
        </div>
      </template>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <div
    v-if="props.mobileOpen"
    class="fixed inset-0 bg-black/50 z-10 md:hidden top-[60px]"
    @click="$emit('close-mobile')"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../../stores/auth'

const authStore = useAuthStore()

const props = defineProps<{
  mobileOpen?: boolean
  profile?: any
}>()

const emit = defineEmits(['close-mobile', 'switch-company'])

const route = useRoute()
const router = useRouter()
const hasAnyOwnerCompany = computed(() => {
  const list = props.profile?.companies_list || []
  return list.some((c: any) => c.membership_role === 'owner')
})

const activeCompanyId = ref<string | null>(null)

function syncCompanyFromStorage() {
  activeCompanyId.value =
    localStorage.getItem('company_id') ||
    props.profile?.active_company_id ||
    null
}

// init
onMounted(() => {
  syncCompanyFromStorage()

  // listen to changes from anywhere (important)
  window.addEventListener('company-changed', syncCompanyFromStorage)
})

onUnmounted(() => {
  window.removeEventListener('company-changed', syncCompanyFromStorage)
})

// also react when profile changes
watch(
  () => props.profile?.active_company_id,
  () => {
    syncCompanyFromStorage()
  }
)

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function isActiveCompany(id: string) {
  return activeCompanyId.value === id
}

/* ─────────────────────────────────────────────
   Companies List
───────────────────────────────────────────── */

const companiesList = computed(() => props.profile?.companies_list ?? [])

/* ─────────────────────────────────────────────
   Expanded accordion
───────────────────────────────────────────── */

const expandedCompanyId = ref<string | null>(null)

watch(activeCompanyId, (val) => {
  if (val) expandedCompanyId.value = val
}, { immediate: true })

function toggleCompany(id: string) {
  expandedCompanyId.value =
    expandedCompanyId.value === id ? null : id
}

/* ─────────────────────────────────────────────
   🔥 SWITCH COMPANY (FIXED UI SYNC)
───────────────────────────────────────────── */

const isSwitching = ref(false)

async function setActiveCompany(company: any) {
  if (!company?._id) return

  isSwitching.value = true

  try {
    const token = localStorage.getItem('token')

    // ✅ update localStorage
    localStorage.setItem('company_id', company._id)
    localStorage.setItem('company_name', company.title)

    // ✅ update reactive state immediately
    activeCompanyId.value = company._id

    // ✅ notify whole app
    window.dispatchEvent(
      new CustomEvent('company-changed', { detail: company._id })
    )

    if (token) {
      authStore.writeAuthCookie({
        token,
        company_id: company._id,
        personal_mode: null
      })
    }

    authStore.setCompany(company._id)

    expandedCompanyId.value = company._id

    emit('switch-company', company)

    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (isLocalhost) {
      await authStore.bootstrap()
      router.push({ query: { tab: 'org-setup' } })
      return
    }

    await new Promise((res) => setTimeout(res, 300))

    if (company.domain_link) {
      const { pathname, search, hash } = window.location

      window.location.href =
        `${window.location.protocol}//${company.domain_link}${pathname}${search}${hash}`
    } else {
      await authStore.bootstrap()
      router.push({ query: { tab: 'org-setup' } })
    }

  } catch (e) {
    console.error('❌ Company switch failed:', e)
  } finally {
    isSwitching.value = false
  }
}

/* ─────────────────────────────────────────────
   Tabs
───────────────────────────────────────────── */

const currentTab = computed(() => (route.query.tab as string) || 'profile')

function selectTab(tab: string) {
  router.push({ query: { tab } })
  emit('close-mobile')
}

function goBack() {
  router.push('/dashboard')
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getRoleBadgeClass(role: string): string {
  switch (role?.toLowerCase()) {
    case 'owner':
      return 'bg-amber-500/15 text-amber-400'
    case 'admin':
      return 'bg-blue-500/15 text-blue-400'
    case 'editor':
      return 'bg-green-500/15 text-green-400'
    case 'viewer':
      return 'bg-text-secondary/15 text-text-secondary'
    default:
      return 'bg-bg-card text-text-secondary'
  }
}

/* ─────────────────────────────────────────────
   🔥 PERMISSIONS FIX (THIS WAS YOUR BUG)
───────────────────────────────────────────── */

const allOrgItems = [
  { label: 'Organization Settings', tab: 'org-setup', icon: 'fa-regular fa-sliders', permission: 'workspace.update' },
  { label: 'Domain Setup', tab: 'org-domain', icon: 'fa-regular fa-globe', permission: 'domain.manage' },
  { label: 'Users Management', tab: 'org-users', icon: 'fa-regular fa-users', permission: 'company_user.read' },
  { label: 'Manage Roles', tab: 'org-roles', icon: 'fa-regular fa-shield-halved', permission: 'company_user.update' },
  { label: 'Ownership Transfer', tab: 'ownership-transfer', icon: 'fa-regular fa-user-gear', roles: ['owner'] },
  { label: 'Our Packages', tab: 'org-packages', icon: 'fa-regular fa-credit-card', permission: 'package.read' },
  { label: 'Tokens Allocation', tab: 'token-allocation', icon: 'fa-regular fa-coins' },
]

function getPermittedOrgItems(company: any) {
  const permissions: string[] = company?.permissions ?? []

  return allOrgItems.filter((item) => {
    if (item.permission && !permissions.includes(item.permission)) return false
    return true
  })
}

/* ─────────────────────────────────────────────
   Personal nav
───────────────────────────────────────────── */

const personalItems = [
  { label: 'Profile', tab: 'profile', icon: 'fa-regular fa-user' },
  { label: 'Tokens Utilization', tab: 'token-utilization', icon: 'fa-regular fa-coins' },
  { label: 'Billing', tab: 'billing', icon: 'fa-regular fa-credit-card' },
]
</script>