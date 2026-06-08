<template>
  <LoaderPeak v-if="isLoading" />
  <div
    v-else
    :class="`h-[100dvh] bg-blend-multiply  text-text-primary  overflow-x-hidden flex flex-col bg-cover bg-no-repeat`"
    :style="{
      background: `${workspaceStore.background} `,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }"
  >
    <WorkSpaceNav
      ref="workspaceNavRef"
      :expanded="sidebarExpanded"
      @toggle-sidebar="toggleSidebar"
    />
    <div
      class="flex flex-grow items-start h-full max-w-full overflow-x-hidden"
      style="max-height: calc(100dvh - 40px)"
    >
      <Sidebar
        v-if="localWorkspace"
        :isLoading="isPending || isLoading"
        :expanded="sidebarExpanded"
        @toggle-sidebar="toggleSidebar"
      />
      <div
        class="dashboard_content h-full w-full z-1 relative rounded-lg flex pb-3 sm:max-w-[calc(100vw - 100px)] transition-all duration-200 pe-[6px] gap-[10px]"
        :style="dashboardContentStyle"
      >
        <router-view />
        <ProfilePanel v-if="workspaceStore.showProfilePanel" />
        <FilterDrawer
          v-if="workspaceStore.showFilter"
          v-model="filters"
          :open="isDrawerOpen"
        />
        <SettingPanel
          v-if="workspaceStore.showSettingPanel"
          :workspace="getWorkspace"
        />
        <ChatBotPanel v-if="workspaceStore.showChatBotPanel" />
      </div>
    </div>
  </div>
  <!-- modals  -->
  <CreateLaneModal :key="'manual-modal'" />
  <CreateLaneWithAI :key="'ai-modal'" />
  <UpdateLaneModal
    v-if="workspaceNavRef?.laneId && workspaceStore.showUpdateLaneModal"
    :id="workspaceNavRef.laneId"
  />
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted, onMounted, watch } from "vue";
import { useSpaceCreationStream } from "../../composables/useSpaceCreationStream";
import { useWorkspaceStore } from "../../stores/workspace";
import ProfilePanel from "./components/ProfilePanel.vue";
import SettingPanel from "./components/SettingPanel.vue";
import ChatBotPanel from "./components/ChatBotPanel.vue";
import Sidebar from "./components/Sidebar.vue";
import WorkSpaceNav from "./components/WorkSpaceNav.vue";
import FilterDrawer from "./components/FilterDrawer.vue";
import CreateLaneModal from "./modals/CreateLaneModal.vue";
import CreateLaneWithAI from "./modals/CreateLaneWithAI.vue";
import UpdateLaneModal from "./modals/UpdateLaneModal.vue";
import { useSingleWorkspace } from "../../queries/useWorkspace";
import LoaderPeak from "../../components/ui/LoaderPeak.vue";
import { useRouteIds } from "../../composables/useQueryParams";
import { useTheme } from "../../composables/useTheme";
import {
  loadUserThemePreference,
  applyActiveUserTheme,
  resetActiveUserThemeState,
} from "../../composables/useUserWorkspaceTheme";
import { getWorkspaceBackground } from "../../utilities/themeUtils";
const { isDark } = useTheme();
const workspaceStore = useWorkspaceStore();
const { workspaceId, jobId } = useRouteIds();
const { connect, resume, stopAll } = useSpaceCreationStream();

async function syncUserThemeForWorkspace(ws: any, id?: string) {
  const wsId = id || workspaceId.value;
  if (!ws || !wsId) return;
  if (ws.variables?.theme) {
    workspaceStore.setBackground(getWorkspaceBackground(ws.variables, isDark.value));
    return;
  }
  await loadUserThemePreference(wsId, ws.variables);
  applyActiveUserTheme(ws.variables, isDark.value);
}

// Pass the ref directly. useSingleWorkspace handles unref internally if designed correctly,
// or we can pass a computed if needed. Inspecting useSingleWorkspace, it accepts MaybeRef.
const {
  data: getWorkspace,
  isPending,
  isLoading,
} = useSingleWorkspace(workspaceId);
const localWorkspace = ref<any>(null);
// ─── Paste this into your WorkspaceLayout.vue <script setup> ─────────────────
// Replace only the two watch() blocks that handle workspace + isDark.
// Everything else (sidebar, resize, modals) stays untouched.

// 1. Seed workspace data (do NOT apply theme here — avoids reacting to other users' saves)
watch(
  getWorkspace,
  (newWorkspace) => {
    if (newWorkspace) {
      const wsClone = { ...newWorkspace };
      localWorkspace.value = wsClone;
      workspaceStore.setSingleWorkspace(wsClone);
      workspaceStore.setLanes(wsClone?.lanes);

      if (wsClone.variables?.theme) {
        workspaceStore.setBackground(
          getWorkspaceBackground(wsClone.variables, isDark.value),
        );
      }
    }
  },
  { immediate: true },
);

// 2. Reset theme state when switching spaces
watch(workspaceId, () => {
  resetActiveUserThemeState();
}, { immediate: true });

// 3. Load & apply ONLY this user's private theme (localStorage + per-user API)
watch(
  [workspaceId, getWorkspace],
  async ([id, ws]) => {
    if (!id || !ws) return;
    await syncUserThemeForWorkspace(ws, id);
  },
  { immediate: true },
);

watch(isDark, async () => {
  const ws = workspaceStore.singleWorkspace;
  if (!ws) return;
  await syncUserThemeForWorkspace(ws);
});

const workspaceNavRef = ref<any>(null);
const isDrawerOpen = ref(true);

const filters = ref({
  role: [],
  tags: [],
  status: [],
});

// sidebar toggle concept
const sidebarExpanded = ref(true);
const isSmallScreen = ref(false); // sm breakpoint
const handleResize = () => {
  isSmallScreen.value = window.innerWidth < 640;
};
// Update sidebar automatically if screen is small
watch(
  isSmallScreen,
  (val) => {
    if (val) {
      sidebarExpanded.value = false;
    }
  },
  { immediate: true },
);
onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
  resume();
  if (workspaceId.value) connect(workspaceId.value, jobId.value);
});

watch([workspaceId, jobId], ([wsId, jId]) => {
  if (wsId) connect(wsId, jId || "");
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  stopAll();
});
// Toggle function for button
function toggleSidebar() {
  sidebarExpanded.value = !sidebarExpanded.value;
}

const dashboardContentStyle = computed(() => ({
  maxWidth: sidebarExpanded.value
    ? "calc(100vw - 230px)"
    : "calc(100vw - 43px)",
  maxHeight: "calc(100dvh - 40px)",
}));
</script>

<style scoped>
@media (max-width: 639px) {
  .dashboard_content {
    max-width: 100% !important;
    padding: 0 14px 52px 14px;
  }
}
</style>
