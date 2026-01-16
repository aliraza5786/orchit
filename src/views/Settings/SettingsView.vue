<template>
  <div class="h-[100dvh] bg-bg-body text-text-primary flex overflow-hidden">
    <!-- Sidebar -->
    <SettingsSidebar :expanded="sidebarExpanded" />

    <!-- Main Content Area -->
    <main
      class="flex-grow flex flex-col min-w-0 bg-bg-card/30 m-2 rounded-2xl border border-border overflow-hidden relative"
    >
      <div class="p-6 sm:p-10 overflow-y-auto h-full">
        <!-- Title & description based on tab -->
        <div class="max-w-4xl mx-auto">
          <header class="mb-8">
            <h1
              class="text-3xl font-bold tracking-tight text-text-primary capitalize"
            >
              {{ currentTab }} Settings
            </h1>
            <p class="text-text-secondary mt-1">
              {{ tabDescription }}
            </p>
          </header>

          <!-- Dynamic Content -->
          <ProfileTab v-if="currentTab === 'profile'" />
          <BillingTab v-else-if="currentTab === 'billing'" />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";
import SettingsSidebar from "./components/SettingsSidebar.vue";
import ProfileTab from "./components/ProfileTab.vue";
import BillingTab from "./components/BillingTab.vue";


const route = useRoute();
const sidebarExpanded = ref(true);

const currentTab = computed(() => (route.query.tab as string) || "profile");

const tabDescription = computed(() => {
  switch (currentTab.value) {
    case "profile":
      return "Manage your public profile and personal information.";
    case "billing":
      return "Manage your subscription, billing details, and usage limits.";
    default:
      return "";
  }
});
</script>

<style scoped>
/* Any view specific styles */
</style>
