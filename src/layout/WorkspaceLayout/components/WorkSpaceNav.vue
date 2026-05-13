<template>
  <nav class="flex items-center justify-between min-h-11 w-full gap-3 pe-1.5">
    <!-- Left side: Logo + lanes -->
    <div
      :class="[
        'text-2xl font-bold flex items-center min-w-0',
        expanded ? 'gap-1.5' : 'gap-1.5 ps-2 sm:ps-0',
        workspaceStore.background.startsWith('url')
          ? 'text-text-secondary'
          : 'text-text-primary',
      ]"
    >
      <!-- Logo + Title (now a dropdown trigger) -->
      <div class="relative flex items-center ps-1.5">
        <div
          class="transition-all duration-300 ease-in-out overflow-visible justify-between flex items-center gap-1"
          :class="expanded ? 'w-[220px]' : 'w-8'"
        >
          <button
            ref="logoBtnRef"
            class="flex relative group items-center border-0 outline-0 overflow-hidden justify-between cursor-pointer rounded-lg transition-all duration-300"
            :class="
              expanded
                ? 'border border-transparent hover:bg-bg-card w-max-content px-1.5 py-1'
                : 'w-auto'
            "
            aria-haspopup="menu"
            :aria-expanded="logoMenuOpen ? 'true' : 'false'"
            @click="handleLogoClick"
            @keydown.down.prevent="openAndFocusFirst"
            @keydown.enter.prevent="handleLogoClick"
            @keydown.space.prevent="handleLogoClick"
          >
            <div class="flex items-center">
              <!-- Loader -->
              <div
                v-if="isWorkspaceLoading"
                class="flex items-center gap-2 px-1"
              >
                <svg
                  class="animate-spin h-5 w-5 text-text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#6e3b96"
                    stroke-width="2"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>

              <!-- Workspace content -->
              <div v-else class="flex items-center">
                <div
                  class="rounded-full text-white flex items-center justify-center font-bold text-[13px] shrink-0 shadow-sm"
                  :class="expanded ? 'w-[25px] h-[25px]' : 'w-[30px] h-[30px]'"
                  :style="{
                    backgroundColor: 
                      'var(--primary-color)',
                  }"
                  v-if="!localWorkspace.logo"
                >
                  {{
                    localWorkspace.variables.title
                      ?.substring(0, 2)
                      .toUpperCase() || "WS"
                  }}
                </div>
                <img
                   v-else
                   :src="localWorkspace.logo ?? dp"
                   alt="Workspace menu"
                   class="rounded-full"
                  :class="expanded ? 'w-[25px] h-[25px]' : 'w-[30px] h-[30px]'"
                  :style="{
                  borderColor: localWorkspace.variables?.['workspace-color']
                  ? 'var(--primary-color)'
                  : 'transparent',

                  borderWidth: localWorkspace.variables?.['workspace-color']
                  ? '2px'
                  : '0px',

                  borderStyle: 'solid',
                   }"
                  />
                <Transition name="title-fade">
                  <h3
                    v-if="expanded"
                    class="text-[15px] text-left font-semibold max-w-[120px] text-nowrap overflow-hidden text-ellipsis text-text-primary hidden sm:block ms-1.5"
                  >
                    {{ localWorkspace.variables.title }}
                  </h3>
                </Transition>
              </div>
            </div>

            <svg
              v-if="expanded"
              class="w-4 h-4 opacity-50 transition-transform duration-200 ms-1 shrink-0"
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

          <button
            v-if="expanded"
            @click="handleSidebarToggle"
            class="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg hover:bg-bg-card transition-colors text-text-secondary opacity-70 border-0 cursor-pointer"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
              <path d="M15 15l-3-3 3-3"></path>
            </svg>
          </button>

          <Transition name="fade-scale" @after-leave="logoBtnRef?.focus()">
            <div
              v-show="logoMenuOpen"
              ref="menuRef"
              class="absolute top-full left-[5px] z-50 mt-2 rounded-md border border-border shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-bg-body/60 bg-bg-body origin-top-left"
              :class="expanded ? 'w-full' : 'w-[235px]'"
              role="menu"
              aria-label="Workspace switcher"
              @keydown.esc.stop.prevent="closeLogoMenu"
            >
              <!-- Home -->
              <button
                class="w-full px-3 py-2 cursor-pointer text-left text-sm font-normal hover:bg-bg-card/70 transition-all duration-200 ease-out hover:scale-[1.02] hover:translate-x-1 rounded-t-xl flex items-center gap-2"
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
              <div class="overflow-y-auto">
                <div class="max-h-72 py-1 cursor-pointer">
                  <button
                    v-for="ws in workspaceList"
                    :key="ws._id"
                    class="w-full px-3 py-2 text-left text-sm font-normal hover:bg-bg-card/70 transition-all duration-200 ease-out hover:scale-[1.02] hover:translate-x-1 cursor-pointer flex items-center gap-3"
                    role="menuitem"
                    @click="switchTo(ws)"
                  >
                    <img
                      :src="ws.logo ?? dp"
                      alt=""
                      class="w-6 h-6 rounded-full object-cover bg-white"
                    />
                    <span class="flex-1 line-clamp-1">{{
                      ws?.variables?.title ?? "Untitled workspace"
                    }}</span>
                    <span
                      v-if="ws._id === workspaceId"
                      class="text-xs px-2 py-0.5 rounded-full border border-border bg-primary-color/30 text-primary-color"
                    >
                      Current
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </div>

      <!-- Navigation Links -->
      <ul
        :class="`flex text-xs overflow-x-auto items-center gap-1 ${
          workspaceStore.background.startsWith('url')
            ? 'text-white'
            : 'text-text-primary'
        }`"
      >
        <li
          class="px-2 text-[13px] font-normal py-1.5 hover:bg-bg-card cursor-pointer group rounded-lg"
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
          v-for="item in localLanes"
          :key="localWorkspace._id + '-' + item._id"
          @click="workspaceStore.toggleLane(item._id)"
        >
          <LaneDropdown
            @duplicate="duplicateHandler"
            :lanes="localLanes"
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
          class="hover:text-primary-color text-nowrap text-text-secondary flex gap-1 items-center text-[13px] font-normal cursor-pointer px-2 py-1"
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
          New Tab
        </li>
      </ul>
    </div>

    <!-- Right side -->
    <div class="flex sm:gap-1 min-w-max items-center">
      <button
        class="bg-primary-color cursor-pointer text-white flex items-center gap-2 px-3 py-2 rounded-[6px] text-xs font-medium transition-all hover:shadow-lg hover:shadow-primary-color/20"
        @click="workspaceStore.toggleChatBotPanel()"
        v-tooltip="'Ask any question'"
      >
        <i class="fa-solid fa-sparkles"></i>
        Ask Ai
      </button>

      <button
        class="cursor-pointer rounded-lg p-2 w-8 h-8 flex items-center justify-center hover:bg-bg-card"
        @click="handleClick"
      >
        <i class="fa-solid fa-ellipsis rotate-90 cursor-pointer"></i>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import LaneDropdown from "./LaneDropdown.vue";
import { useWorkspaceStore } from "../../../stores/workspace";
import dp from "../../../assets/global/dummy.jpeg";
import {
  ref,
  onMounted,
  onBeforeUnmount,
  nextTick,
  computed,
  watch,
} from "vue";
import { useRouter } from "vue-router";
import { useWorkspaces } from "../../../queries/useWorkspace"; // keep workspaces listing
import { useWorkspaceId } from "../../../composables/useQueryParams";
import { usePermissions } from "../../../composables/usePermissions";
const { canCreateLane } = usePermissions();

const router = useRouter();
const workspaceStore = useWorkspaceStore();
const page = ref(1);
const limit = ref(30);

const { data: workspaces } = useWorkspaces(page, limit);
const laneId = ref("");
const { workspaceId } = useWorkspaceId();
const workspaceList = computed(() => workspaces.value?.workspaces || []);
// Use computed from store instead of local ref
const localWorkspace = computed(() => workspaceStore.singleWorkspace);
// Computed lanes from store
const localLanes = computed(() => workspaceStore.lanes || []);
const isWorkspaceLoading = computed(() => {
  return !localWorkspace.value || !localWorkspace.value.variables?.title;
});

// Initialize props - removed getWorkspace
const props = defineProps<{
  expanded?: boolean;
}>();

// Watch title to update localStorage (preserving existing logic)
watch(
  () => localWorkspace.value?.variables?.title,
  (newTitle) => {
    if (newTitle) {
      localStorage.setItem("currentName", newTitle);
    }
  },
  { immediate: true },
);

// Duplicate lane handler - updates store now
const duplicateHandler = (data: any) => {
  if (!localWorkspace.value) return;
  // const updatedWorkspace = {
  //   ...localWorkspace.value,
  //   lanes: [...localWorkspace.value.lanes, data],
  // };
  // workspaceStore.setSingleWorkspace(updatedWorkspace);
  workspaceStore.setLanes([...localLanes.value, data]);
};

// Toggle sidebar
const emit = defineEmits<{ (e: "toggle-sidebar"): void }>();
const handleSidebarToggle = () => emit("toggle-sidebar");
[];
// === Logo dropdown state & refs ===
const logoMenuOpen = ref(false);
const logoBtnRef = ref<HTMLButtonElement | null>(null);
const menuRef = ref<HTMLDivElement | null>(null);
const firstItemRef = ref<HTMLButtonElement | null>(null);

const toggleLogoMenu = async () => {
  logoMenuOpen.value = !logoMenuOpen.value;
  if (logoMenuOpen.value) await nextTick();
  firstItemRef.value?.focus();
};

const handleLogoClick = (_e?: Event) => {
  if (window.innerWidth < 640) {
    toggleLogoMenu();
  } else {
    if (!props.expanded) {
      emit("toggle-sidebar");
    } else {
      toggleLogoMenu();
    }
  }
};

const closeLogoMenu = () => {
  logoMenuOpen.value = false;
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

// Close on window blur
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

// Navigation actions
const goHome = () => {
  closeLogoMenu();
  router.push({ path: "/dashboard" });
};

// Switch workspace
const switchTo = (ws: any) => {
  const base = ws?.company?.domain_link;
  const path = `/workspace/peak/${ws._id}/${ws?.LatestTask?.job_id ?? ""}`;
  if (base) {
    window.location.href = `${base}${path}`;
    return;
  }
  router.push(path);
  closeLogoMenu();
  clearWorkspaceStorage();
};

const clearWorkspaceStorage = () => {
  localStorage.removeItem("activeSprintId");
  localStorage.removeItem("showActiveSprint");
  localStorage.removeItem("selectedModuleId");
  localStorage.removeItem("activeSprintKey");
  localStorage.removeItem("lastSelectedParentId");
  localStorage.removeItem("selectedSprintTitle");
  localStorage.removeItem("activeMilestoneId");
  localStorage.removeItem("activeSheetId");
  localStorage.removeItem("activeMilestoneLabel");
  localStorage.removeItem("activePlanIds");
  localStorage.removeItem("activePlanLabel");
  localStorage.removeItem("sprintType");
  localStorage.removeItem("asFirstTime");
  localStorage.removeItem("activeSessionId");
  localStorage.removeItem("activeSessionTitle");
  localStorage.removeItem("selected_sheet_id");
};

const handleClick = () => workspaceStore.toggleSettingPanel();
const createLaneHandler = () => workspaceStore.toggleCreateLaneModalWithAI();
const openUpdateModal = (id: any) => {
  laneId.value = id;
  workspaceStore.toggleUpdateLaneModal();
};

defineExpose({ laneId });
</script>

<style scoped>
/* Prevent accidental text selection while navigating the menu quickly */
[role="menu"] button {
  user-select: none;
}

/* Fade + slight scale + slide-down */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
  will-change: opacity, transform;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}

/* Title Fade Transition */
.title-fade-enter-active,
.title-fade-leave-active {
  transition: all 0.3s ease;
}

.title-fade-enter-from,
.title-fade-leave-to {
  opacity: 0;
  transform: translateX(-10px);
  max-width: 0;
}
</style>
