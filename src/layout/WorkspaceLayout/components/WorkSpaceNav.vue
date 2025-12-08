<template>
  <nav
    class="flex items-center justify-between min-h-16 w-full overflow-x-auto"
  >
    <!-- Left side: Logo + lanes -->
    <div
      :class="`text-2xl font-bold flex items-center min-w-[320px] gap-4 sm:gap-8 ${
        workspaceStore.background.startsWith('url')
          ? 'text-text-secondary'
          : 'text-text-primary'
      }`"
    >
      <!-- Logo + Title (now a dropdown trigger) -->
      <div class="relative flex items-center">
        <div class="block sm:hidden">
          <button
            ref="logoBtnRef"
            class="flex items-center pl-3 cursor-pointer rounded-md"
            aria-haspopup="menu"
            :aria-expanded="logoMenuOpen ? 'true' : 'false'"
            @click="toggleLogoMenu"
            @keydown.down.prevent="openAndFocusFirst"
            @keydown.enter.prevent="toggleLogoMenu"
            @keydown.space.prevent="toggleLogoMenu"
          >
            <img
              :src="getWorkspace?.logo ?? dp"
              alt="Workspace menu"
              class="min-w-10 shadow-2xl rounded-md h-10 cursor-pointer aspect-square object-contain me-2"
            />
            <h3
              class="text-lg text-left font-medium max-w-43 text-nowrap overflow-hidden text-ellipsis text-text-primary hidden sm:block"
            >
              {{ getWorkspace?.variables?.title }}
            </h3>
            <svg
              class="w-4 h-4 opacity-70 transition-transform duration-200 ms-1 mt-1"
              :class="logoMenuOpen ? 'rotate-180' : 'rotate-0'"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div
          class="flex items-center justify-between transition-all duration-200"
          :class="expanded ? 'w-[250px]' : 'w-auto'"
        >
          <!-- Logo  and icon for unexpand-->
          <div 
            class="w-[40px] relative "
            @mouseenter="hoveringLogo = true"
            @mouseleave="hoveringLogo = false"
          >
            <RouterLink
              v-if="!expanded && !hoveringLogo"
              to="/"
              class="transition-opacity duration-300"
            >
              <img :src="Logo" alt="Logo" class="max-w-[40px] object-contain" />
            </RouterLink>
             <RouterLink
            v-if="expanded"
            to="/"
            class="transition-opacity duration-300"
          >
            <img :src="Logo" alt="Logo" class="max-w-[40px] object-contain" />
          </RouterLink>
            <i
              v-show="!expanded && hoveringLogo"
              class="fa-solid fa-sidebar ms-3 left-[-2px] top-[-12px] absolute text-[16px] hover:text-[18px] cursor-w-resize text-text-secondary "
              @click="handleSidebarToggle"
            >
            </i>
          </div> 
          <!-- Icon (toggle sidebar) -->
          <i
            v-if="expanded"
            class="fa-solid fa-sidebar ms-3 text-[16px] hover:text-[18px] cursor-w-resize text-text-secondary shrink-0 "
            @click="handleSidebarToggle"
          ></i>
        </div>
      </div>

      <!-- Navigation Links -->
      <ul
        :class="`flex text-xs font-bold overflow-x-auto items-center gap-2 ${
          workspaceStore.background.startsWith('url')
            ? 'text-white'
            : 'text-text-primary'
        }`"
      >
        <li
          class="px-3 py-2 hover:bg-bg-card cursor-pointer group rounded-lg"
          :class="
            workspaceStore.selectedLaneIds.length == 0
              ? 'bg-bg-card text-text-primary'
              : ''
          "
          @click="workspaceStore.toggleAllLane()"
        >
          Main
        </li>

        <li
          v-for="item in localWorkspace?.lanes"
          :key="item._id"
          @click="workspaceStore.toggleLane(item._id)"
        >
          <LaneDropdown
            @duplicate="duplicateHandler"
            :lanes="localWorkspace"
            @update="openUpdateModal"
            :id="item._id"
            :label="item?.variables['lane-title']"
            :link="item?.link ?? ''"
            :color="item?.variables['lane-color']"
            :selected="workspaceStore.isLaneSelected(item._id)"
          />
        </li>

        <li
          v-if="canCreateLane"
          class="hover:text-accent text-nowrap text-text-primary flex gap-2 items-center text-xs cursor-pointer px-2 py-1"
          @click="createLaneHandler"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.9998 23.3346V14.0013M13.9998 14.0013V4.66797M13.9998 14.0013H23.3332M13.9998 14.0013H4.6665"
              stroke="currentColor"
              stroke-opacity="0.8"
              stroke-width="2.8"
              stroke-linecap="round"
            />
          </svg>
          New lane
        </li>
      </ul>
    </div>

    <!-- Right side -->
    <div class="flex gap-2">
      <button class="cursor-pointer rounded-lg p-2" @click="handleClick">
        <i class="fa-solid fa-ellipsis rotate-90 cursor-pointer"></i>
      </button>
    </div>
  </nav>
  <!-- Dropdown -->
  <Transition name="fade-scale" @after-leave="logoBtnRef?.focus()">
    <div
      v-show="logoMenuOpen"
      ref="menuRef"
      class="absolute top-10 left-[11px] z-50 mt-2 w-72 rounded-md border border-border shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-bg-body/60 bg-bg-body origin-top-left"
      role="menu"
      aria-label="Workspace switcher"
      @keydown.esc.stop.prevent="closeLogoMenu"
    >
      <!-- Home -->
      <button
        class="w-full px-3 py-2 cursor-pointer text-left text-sm hover:bg-bg-card/70 rounded-t-xl flex items-center gap-2"
        role="menuitem"
        @click="goHome"
        ref="firstItemRef"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
        Home
      </button>

      <div class="my-1 h-px bg-border"></div>

      <!-- Workspaces -->
      <div class="max-h-72 py-1 cursor-pointer">
        <button
          v-for="ws in workspaces?.workspaces"
          :key="ws._id"
          class="w-full px-3 py-2 text-left text-sm hover:bg-bg-card/70 cursor-pointer flex items-center gap-3"
          role="menuitem"
          @click="switchTo(ws)"
        >
          <img
            :src="ws.logo ?? dp"
            alt=""
            class="w-6 h-6 rounded object-contain bg-white"
          />
          <span class="flex-1 line-clamp-1">{{
            ws?.variables?.title ?? "Untitled workspace"
          }}</span>
          <span
            v-if="ws._id === workspaceId"
            class="text-xs px-2 py-0.5 rounded-full border border-border"
          >
            Current
          </span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import LaneDropdown from "./LaneDropdown.vue";
import { useWorkspaceStore } from "../../../stores/workspace";
import dp from "../../../assets/global/dummy.jpeg";
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import { useRouter } from "vue-router";
import {
  useSingleWorkspace,
  useWorkspaces,
} from "../../../queries/useWorkspace";
import { useWorkspaceId } from "../../../composables/useQueryParams";
import { useQueryClient } from "@tanstack/vue-query";
import { usePermissions } from "../../../composables/usePermissions";
import Logo from "@assets/global/favicon.png";
const { canCreateLane } = usePermissions();
const router = useRouter();
const workspaceStore = useWorkspaceStore();
const { data: workspaces } = useWorkspaces(1, 30);
const laneId = ref("");
const { workspaceId } = useWorkspaceId();
const {
  data: getWorkspace,
  refetch,
  isFetched,
} = useSingleWorkspace(useWorkspaceId().workspaceId.value);

const localWorkspace = ref(getWorkspace.value);

const duplicateHandler = (data: any) => {
  localWorkspace.value = {
    ...localWorkspace,
    lanes: [...localWorkspace.value?.lanes, data],
  };
};
watch(
  () => isFetched,
  () => {
    localWorkspace.value = getWorkspace.value;
  }
);
// toggle side bar
const emit = defineEmits<{ (e: "toggle-sidebar"): void }>();
const handleSidebarToggle = () => {
  emit("toggle-sidebar");
};

// === Logo dropdown state & refs ===
const logoMenuOpen = ref(false);
const logoBtnRef = ref<HTMLButtonElement | null>(null);
const menuRef = ref<HTMLDivElement | null>(null);
const firstItemRef = ref<HTMLButtonElement | null>(null);

const toggleLogoMenu = async () => {
  logoMenuOpen.value = !logoMenuOpen.value;
  if (logoMenuOpen.value) {
    await nextTick();
    // Focus first actionable item for a11y
    firstItemRef.value?.focus();
  }
};

const closeLogoMenu = () => {
  logoMenuOpen.value = false;
  // Return focus to the trigger
  logoBtnRef.value?.focus();
};

const openAndFocusFirst = async () => {
  if (!logoMenuOpen.value) {
    logoMenuOpen.value = true;
    await nextTick();
  }
  firstItemRef.value?.focus();
};

// Close on outside click
const onDocClick = (e: MouseEvent) => {
  if (!logoMenuOpen.value) return;
  const target = e.target as Node;
  if (
    menuRef.value &&
    !menuRef.value.contains(target) &&
    logoBtnRef.value &&
    !logoBtnRef.value.contains(target)
  ) {
    closeLogoMenu();
  }
};

// Close on window blur (optional nice touch)
const onWindowBlur = () => {
  if (logoMenuOpen.value) closeLogoMenu();
};

onMounted(() => {
  document.addEventListener("click", onDocClick);
  window.addEventListener("blur", onWindowBlur);
});
onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  window.removeEventListener("blur", onWindowBlur);
});

// Actions
const goHome = () => {
  closeLogoMenu();
  router.push({ path: "/" });
};
const queryClient = useQueryClient();
const switchTo = async (ws: any) => {
  router.push(
    `/workspace/peak/${ws._id}/${
      ws.LatestTask?.job_id ? ws.LatestTask?.job_id : ""
    }`
  );
  queryClient.invalidateQueries({ queryKey: ["workspaces", "byId"] });
  refetch();
  // Call your store action to switch workspaces
  closeLogoMenu();
};

const handleClick = () => {
  workspaceStore.toggleSettingPanel();
};
const createLaneHandler = () => {
  workspaceStore.toggleCreateLaneModalWithAI();
};

const openUpdateModal = (id: any) => {
  laneId.value = id;
  workspaceStore.toggleUpdateLaneModal();
};

defineExpose({ laneId });
defineProps<{ getWorkspace: any; expanded?: Boolean }>();

// sidebar toogle and icon
const hoveringLogo = ref(false);
</script>

<style scoped>
/* Prevent accidental text selection while navigating the menu quickly */
[role="menu"] button {
  user-select: none;
}

/* Fade + slight scale + slide-down */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
  will-change: opacity, transform;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
