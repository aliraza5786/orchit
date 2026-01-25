<template>
  <router-link :to="to">
    <div
      class="group flex flex-col w-[48px] h-[48px] items-center justify-center gap-1.5 px-2 py-3.5 rounded-lg text-xs text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none"
      :class="[
        isActive
          ? 'text-text-primary bg-bg-card '
          : workspaceStore.background.startsWith('url')
            ? 'text-text-primary bg-bg-card'
            : ' text-text-secondary',
      ]">
      <!-- Drag Icon -->
      <img src="../../../assets/icons/Layer.svg"
        class="absolute top-1 left-1 opacity-0 group-hover:opacity-100 w-2 drag-handle cursor-grab" alt="" />

      <!-- Icon -->
      <i :class="`${icon?.prefix} ${icon?.iconName}`"></i>
      <!-- <FontAwesomeIcon  :icon="[icon.prefix, icon.iconName]"/> -->
      <!-- <FontAwesomeIcon :icon="faGrid2" />      Label -->
      <span class="whitespace-nowrap text-[10px] font-medium line-clamp-1 w-full overflow-ellipsis text-center min-h-3">
        {{ label }}
      </span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useWorkspaceStore } from "../../../stores/workspace";
// import {
//   library,
//   type IconDefinition,
// } from "@fortawesome/fontawesome-svg-core";
// import * as far from "@fortawesome/free-regular-svg-icons";
// import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

// Props
const props = defineProps<{
  label: string;
  id: string;
  icon: any;
  to: string;
}>();

const route = useRoute();
const workspaceStore = useWorkspaceStore();
const isActive = computed(() => route.fullPath === props.to);

// Convert kebab-case to PascalCase (e.g., "user-circle" -> "UserCircle")
// function toPascalCase(str: string) {
//   return str
//     .split("-")
//     .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
//     .join("");
// }

// Dynamically add the icon to the library if available
// const def = (far as Record<string, any>)[
//   `fa${toPascalCase(props.icon?.iconName || "")}`
// ];
// if (def) {
//   library.add(def); // ✅ No need to check library.definitions
// }
</script>

<style scoped>
.icons-div>* {
  width: 14px !important;
  height: 14px !important;
}
</style>
