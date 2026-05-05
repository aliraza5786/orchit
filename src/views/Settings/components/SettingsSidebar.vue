<template>
  <aside
    class="bg-bg-body ps-3 pe-1 md:bg-transparent h-full flex flex-col gap-1 transition-all duration-300 md:duration-200 py-3 fixed md:static top-[60px] left-0 z-20 overflow-y-auto"
    :class="[
      props.mobileOpen ? 'w-full translate-x-0' : 'md:w-[250px] -translate-x-full md:translate-x-0'
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
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center text-accent text-xs font-bold">
            <img v-if="profile?.u_profile_image"
              class="object-cover cursor-pointer w-10 h-10 rounded-full"
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
      <div class="space-y-1">
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
    <div class="space-y-3 ps-1 pe-3 md:px-0">
      <div class="px-2">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary pb-1">
          Organization
        </p>
      </div>

      <!-- Active Org View -->
      <template v-if="hasActiveOrg">
  <!-- Org Info Card -->
  <div class="px-2 py-2.5 rounded-lg bg-bg-card/40 border border-border/40">
    <div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-600/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
        <i class="fa-solid fa-building text-xs"></i>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[12px] font-semibold text-text-primary truncate">{{ props.activeOrgName || 'My Organization' }}</p>
        <p class="text-[10px] text-text-secondary capitalize">{{ props.membershipRole ?? 'Member' }}</p>
      </div>
    </div>
  </div>
  <!-- Org Nav Items -->
  <div class="relative space-y-0.5 pl-3">
    <!-- Vertical line -->
    <div class="absolute left-[18px] top-1 bottom-1 w-px bg-border/50"></div>

    <div
      v-for="item in orgItems"
      :key="item.tab"
      @click="selectTab(item.tab)"
      class="group relative cursor-pointer flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-lg text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary select-none w-full"
      :class="currentTab === item.tab ? 'text-text-primary bg-bg-card' : ''"
    >
      <!-- Active dot -->
      <span
        class="absolute left-[13px] w-1.5 h-1.5 rounded-full border border-border/60 bg-bg-body transition-all"
        :class="currentTab === item.tab ? 'bg-accent border-accent' : 'group-hover:border-text-secondary'"
      ></span>

      <i :class="[item.icon, 'text-[13px] ms-3 shrink-0']"></i> 
      <span class="whitespace-nowrapfont-medium text-[12px]">{{ item.label }}</span>
    </div>
  </div>
</template>

      <!-- No Active Org View -->
      <template v-else>
        <!-- Create Org CTA -->
        <div
          @click="selectTab('org-setup')"
          class="group cursor-pointer flex items-center px-3 py-3 rounded-lg text-text-secondary transition-all relative hover:bg-accent/10 hover:text-accent select-none w-full justify-start gap-2.5 border-2 border-dashed border-border/40 hover:border-accent/40"
          :class="currentTab === 'org-setup' ? 'bg-accent/10 text-accent border-accent/30' : ''"
        >
          <i class="fa-regular fa-plus text-[14px]"></i>
          <div class="min-w-0 flex-1">
            <span class="whitespace-nowrap font-semibold text-[13px]">Create organization</span>
            <p class="text-[10px] text-text-secondary/70 mt-0.5">Set up your team workspace</p>
          </div>
        </div>

        <!-- Packages tab (always visible) -->
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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  mobileOpen?: boolean
  activeOrgName?: string
  membershipRole?: string
  profile?: any
}>()

const emit = defineEmits(['close-mobile'])

const route = useRoute()
const router = useRouter()
const hasActiveOrg = computed(() => {
  const localCompanyId = localStorage.getItem('company_id')
  const activeCompanyId = props.profile?.active_company_id
  return !!localCompanyId && !!activeCompanyId && localCompanyId === activeCompanyId
})

const currentTab = computed(() => (route.query.tab as string) || 'profile')

function selectTab(tab: string) {
  router.push({ query: { tab } })
  emit('close-mobile')
}

function goBack() {
  router.push('/dashboard')
}

const personalItems = [
  { label: 'Profile', tab: 'profile',  icon: 'fa-regular fa-user' },
  { label: 'Billing', tab: 'billing',  icon: 'fa-regular fa-credit-card' },
]

// Users & Roles only shown when org is active
const orgItems = [
  { label: 'Organization Settings', tab: 'org-setup', icon: 'fa-regular fa-sliders' },
  { label: 'Domain Setup', tab: 'org-domain', icon: 'fa-regular fa-globe' },
  { label: 'Users Management', tab: 'org-users', icon: 'fa-regular fa-users' },
  { label: 'Manage Roles', tab: 'org-roles', icon: 'fa-regular fa-shield-halved' },
  { label: 'Our Packages', tab: 'org-packages', icon: 'fa-regular fa-credit-card' },
  { label: 'Tokens Allocation', tab: 'token-allocation', icon: 'fa-regular fa-coins' }
]
</script>