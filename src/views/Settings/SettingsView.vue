<template>
  <div class="h-[100dvh] bg-bg-body text-text-primary flex flex-col md:flex-row overflow-hidden">
    <!-- Mobile Header -->
    <div class="md:hidden h-[60px] bg-bg-body border-b border-border flex items-center justify-between px-4 shrink-0 z-30 relative">
      <button @click="toggleMobileSidebar"  v-if="!isMobileSidebarOpen"  class="text-sm font-medium text-text-secondary flex items-center gap-2">
         <i class="fa-solid fa-chevron-left text-xs mt-1"></i> Settings
      </button> 
      <button
        v-if="isMobileSidebarOpen"
        @click="goBack"
        class="group flex items-center px-2 py-2 cursor-pointer rounded-[6px] border border-border text-xs text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none justify-start gap-2"
      >
        <i class="fa-solid fa-arrow-left text-[10px]"></i>
        <span class="whitespace-nowrap font-medium text-[12px] tracking-normal leading-[14px]">Go back </span>
      </button>
     
      <h2 class="text-base font-semibold text-text-primary absolute left-1/2 -translate-x-1/2">
        Account settings
      </h2>
      
    </div>
     <SettingsSidebar
  :mobile-open="isMobileSidebarOpen"
  :active-org-name="activeOrgName"
  :membership-role="membershipRole"
  :profile="profileData"
  @close-mobile="closeMobileSidebar"
/>

    <!-- Main Content Area -->
<main
  class="flex-grow flex flex-col min-w-0 max-w-full md:m-2 md:rounded-2xl md:border border-border overflow-hidden relative"
  :class="isDark ? 'bg-bg-card/30' : 'bg-bg-card'"
>
  <div class="py-6 px-4 sm:px-6 sm:p-10 overflow-y-auto h-full flex flex-col">
    <div class="mx-auto w-full flex-1 flex flex-col">

      <!-- Title & Description -->
      <header class="mb-4 md:mb-8 text-center md:text-left">
        <h1 class="text-2xl lg:text-3xl font-bold font-manrope mb-2 sm:mb-3 tracking-tight text-text-primary">
          {{ pageTitle }}
        </h1>
        <p class="text-text-secondary mt-1">
          {{ tabDescription }}
        </p>
      </header>
      <!-- Dynamic Content -->
      <ProfileTab v-if="currentTab === 'profile'" />
      <BillingTab v-else-if="currentTab === 'billing'" />
      <OrganizationTab v-else-if="currentTab === 'org-setup'" :profile="profileData" />
      <OrgUsersTab v-else-if="currentTab === 'org-users'" />
      <OrgRolesTab v-else-if="currentTab === 'org-roles'" />
      <OrgPackagesTab v-else-if="currentTab === 'org-packages'" />

    </div>
  </div>
</main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import SettingsSidebar from "./components/SettingsSidebar.vue";
import ProfileTab from "./components/ProfileTab.vue";
import BillingTab from "./components/BillingTab.vue";
import OrganizationTab from "./components/OrganizationTab.vue";
import OrgUsersTab from "./components/OrgUsersTab.vue";
import OrgRolesTab from "./components/OrgRolesTab.vue";
import OrgPackagesTab from "./components/OrgPackagesTab.vue";
import { useTheme } from "../../composables/useTheme";
import { useQuery } from "@tanstack/vue-query";
import { getProfile } from "../../services/user";
const { isDark } = useTheme(); // light / dark / system
const activeOrgName = localStorage.getItem('company_name') ?? ''

const route = useRoute();
const router = useRouter();
const isMobileSidebarOpen = ref(false); // Mobile sidebar state
const currentTab = computed(() => (route.query.tab as string) || "profile");
const { data: profile } = useQuery({
  queryKey: ["profile"],
  queryFn: getProfile,
  staleTime: 1000 * 60 * 5,
});

const profileData = computed(() => profile.value?.data ?? null);
const membershipRole = profileData.value?.active_company?.membership?.role || ''
const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    'profile': 'Your profile',
    'billing': 'Billing & subscription',
    'org-setup': 'Organization setup',
    'org-users': 'Team members',
    'org-roles': 'Role management',
    'org-packages': 'Organization billing',
  };
  return titles[currentTab.value] || 'Account';
});

const tabDescription = computed(() => {
  switch (currentTab.value) {
    case "profile":
      return "Manage your public profile and personal information.";
    case "billing":
      return "Manage your subscription, billing details, and usage limits.";
    case "org-setup":
      return "Create and configure your organization's basic information, branding, and settings.";
    case "org-users":
      return "Invite team members, manage their roles, and control access to your organization.";
    case "org-roles":
      return "Create custom roles and manage permissions for your team members.";
    case "org-packages":
      return "Manage billing and subscription plans for your organization.";
    default:
      return "";
  }
});

function toggleMobileSidebar() {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
}

function closeMobileSidebar() {
  isMobileSidebarOpen.value = false;
}

function goBack() {
  router.push('/dashboard');
}
</script>

<style scoped>
/* Any view specific styles */
</style>
