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

    <!-- Personal group -->
    <div class="space-y-1 ps-1 pe-3 md:px-0">
      <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary px-2 pb-1">
        Personal
      </p>
      <div
        v-for="item in personalItems"
        :key="item.tab"
        @click="selectTab(item.tab)"
        class="group cursor-pointer flex items-center px-2 py-2.5 md:py-3.5 rounded-lg text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none md:w-full md:h-[38px] md:justify-start md:gap-2.5 w-full justify-start gap-4 text-base"
        :class="currentTab === item.tab ? 'text-text-primary bg-bg-card' : ''"
      >
        <i :class="[item.icon, 'md:text-[14px]', 'text-sm']"></i>
        <span class="whitespace-nowrap font-medium text-[14px]">{{ item.label }}</span>
      </div>
    </div>

    <!-- Divider -->
    <div class="h-px bg-border/50 mx-2 my-2"></div>

    <!-- Organization group -->
    <div class="space-y-1 ps-1 pe-3 md:px-0">
      <p class="text-[10px] font-semibold uppercase tracking-widest text-text-secondary px-2 pb-1">
        Organization
      </p>

      <!-- Organization Setup parent -->
      <div
        @click="selectTab('organization')"
        class="group cursor-pointer flex items-center px-2 py-2.5 md:py-3.5 rounded-lg text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none md:w-full md:h-[38px] md:justify-start md:gap-2.5 w-full justify-start gap-4 text-base"
        :class="currentTab === 'organization' ? 'text-text-primary bg-bg-card' : ''"
      >
        <i class="fa-regular fa-buildings md:text-[14px] text-sm"></i>
        <span class="whitespace-nowrap font-medium text-[14px] flex-1">Organization setup</span>
      </div>

      <!-- Org sub-items — always visible as indented children -->
      <div class="ml-3 pl-3 border-l border-border/50 space-y-0.5 mt-0.5">
        <div
          v-for="sub in orgSubItems"
          :key="sub.tab"
          @click="selectTab(sub.tab)"
          class="group cursor-pointer flex items-center gap-2.5 px-2 py-2 rounded-lg text-text-secondary transition-all hover:bg-bg-card hover:text-text-primary select-none w-full md:h-[34px]"
          :class="currentTab === sub.tab ? 'text-text-primary bg-bg-card' : ''"
        >
          <i :class="[sub.icon, 'text-[12px] shrink-0']"></i>
          <span class="whitespace-nowrap font-medium text-[13px]">{{ sub.label }}</span>
        </div>
      </div>
    </div>
  </aside>

  <!-- Mobile Overlay -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 bg-black/50 z-10 md:hidden top-[60px]"
    @click="$emit('close-mobile')"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{ mobileOpen?: boolean }>()
const emit = defineEmits(['close-mobile'])

const route = useRoute()
const router = useRouter()

const currentTab = computed(() => (route.query.tab as string) || 'profile')

const personalItems = [
  { label: 'Profile', tab: 'profile', icon: 'fa-regular fa-user' },
  { label: 'Billing', tab: 'billing', icon: 'fa-regular fa-credit-card' },
]

const orgSubItems = [
  { label: 'Packages',          tab: 'org-packages',   icon: 'fa-regular fa-box-open' },
  { label: 'User management',   tab: 'org-users',      icon: 'fa-regular fa-users' },
  { label: 'Roles management',  tab: 'org-roles',      icon: 'fa-regular fa-shield-halved' },
  { label: 'Domain setup',      tab: 'org-domain',     icon: 'fa-regular fa-globe' },
]

const isOrgTab = computed(() =>
  currentTab.value === 'organization' || orgSubItems.some(s => s.tab === currentTab.value)
)

function selectTab(tab: string) {
  router.push({ query: { ...route.query, tab } })
  emit('close-mobile')
}

function goBack() {
  router.push('/dashboard')
}
</script>