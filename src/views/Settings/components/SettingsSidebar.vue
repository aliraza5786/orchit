<template>
  <aside
    class="bg-bg-body ps-3 pe-1 md:bg-transparent h-full flex flex-col gap-1 transition-all duration-300 md:duration-200 py-3 fixed md:static top-[60px] left-0 z-20 overflow-y-auto border-r border-border md:border-none "
    :class="[
      mobileOpen ? 'w-full translate-x-0' : 'md:w-[250px] -translate-x-full md:translate-x-0'
    ]"
  >
    <!-- Back Button (Hidden on Mobile as it is in header) -->
    <div class="mb-4 hidden md:block">
      <button
        @click="goBack"
        class="group flex items-center px-2 py-2 cursor-pointer rounded-[6px] border border-border text-xs text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none justify-start gap-2"
      >
        <i class="fa-solid fa-arrow-left text-[12px]"></i>
        <span class="whitespace-nowrap font-medium text-[14px] tracking-normal leading-[14px]">Go back</span>
      </button>
    </div>

    <!-- Navigation Items -->
    <div class="space-y-1 ps-1 pe-3 md:px-0">
      
      <div
        v-for="item in navItems"
        :key="item.tab"
        @click="selectTab(item.tab)"
        class="group cursor-pointer flex items-center px-2 py-2.5 md:py-3.5 rounded-lg  text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none md:w-full md:h-[38px] md:justify-start md:gap-2.5 w-full justify-start gap-4 text-base"
        :class="[
          currentTab === item.tab
            ? 'text-text-primary bg-bg-card'
            : 'text-text-secondary'
        ]"
      >
        <i :class="[item.icon, 'md:text-[14px]', 'text-sm']"></i>
        <!-- Always show label on mobile -->
        <span class="whitespace-nowrap font-medium text-[14px]">{{ item.label }}</span>
      </div>
    </div>
  </aside>
  
  <!-- Mobile Overlay -->
  <div 
    v-if="mobileOpen" 
    class="fixed inset-0 bg-black/50 z-10 md:hidden top-[60px]"
    @click="$emit('close-mobile')"
  ></div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps<{
  mobileOpen?: boolean;
}>();

const emit = defineEmits(['close-mobile']);

const route = useRoute();
const router = useRouter();

const currentTab = computed(() => (route.query.tab as string) || "profile");

const navItems = [
  { label: "Profile", tab: "profile", icon: "fa-regular fa-user" },
  { label: "Billing", tab: "billing", icon: "fa-regular fa-credit-card" },
  // { label: "Notifications", tab: "notifications", icon: "fa-regular fa-bell" },
];

function selectTab(tab: string) {
  router.push({ query: { ...route.query, tab } });
  emit('close-mobile');
}

function goBack() {
  router.push('/dashboard');
}
</script>
