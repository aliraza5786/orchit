<template>
  <aside
    class="h-full bg-transparent sm:min-w-[36px] sm:px-2 flex flex-col gap-1 transition-all duration-200 py-3"
    :class="{ 'w-[250px]': expanded, 'w-14': !expanded }"
  >
    <!-- Back Button -->
    <div class="mb-4">
      <button
        @click="goBack"
        class="group flex items-center px-2 py-3.5 rounded-lg text-xs text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none w-full"
        :class="expanded ? 'justify-start gap-2.5' : 'justify-center'"
      >
        <i class="fa-solid fa-arrow-left" :class="expanded ? 'text-[16px]' : 'text-[14px]'"></i>
        <span v-if="expanded" class="whitespace-nowrap font-medium text-[14px]">Go back</span>
      </button>
    </div>

    <!-- Navigation Items -->
    <div class="space-y-1">
      <div
        v-for="item in navItems"
        :key="item.tab"
        @click="selectTab(item.tab)"
        class="group cursor-pointer flex items-center px-2 py-3.5 rounded-lg text-xs text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none"
        :class="[
          currentTab === item.tab
            ? 'text-text-primary bg-bg-card'
            : 'text-text-secondary'
          ,
          expanded
            ? 'w-full h-[38px] justify-start gap-2.5'
            : 'w-[36px] h-[36px] justify-center'
        ]"
      >
        <i :class="[item.icon, expanded ? 'text-[16px]' : 'text-[14px]']"></i>
        <span v-if="expanded" class="whitespace-nowrap font-medium text-[14px]">{{ item.label }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps<{
  expanded: boolean;
}>();

const route = useRoute();
const router = useRouter();

const currentTab = computed(() => (route.query.tab as string) || "profile");

const navItems = [
  { label: "Profile", tab: "profile", icon: "fa-regular fa-user" },
  { label: "Billing", tab: "billing", icon: "fa-regular fa-credit-card" },
];

function selectTab(tab: string) {
  router.push({ query: { ...route.query, tab } });
}

function goBack() {
  router.back();
}
</script>
