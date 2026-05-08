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
import { getWorkspaceBackground } from "../../utilities/themeUtils";
const { isDark } = useTheme();
const workspaceStore = useWorkspaceStore();
const { workspaceId } = useRouteIds(); // Use the shared composable

// Pass the ref directly. useSingleWorkspace handles unref internally if designed correctly,
// or we can pass a computed if needed. Inspecting useSingleWorkspace, it accepts MaybeRef.
const {
  data: getWorkspace,
  isPending,
  isLoading,
} = useSingleWorkspace(workspaceId);
const localWorkspace = ref<any>(null);
watch(
  [getWorkspace, isDark],
  ([newWorkspace, dark]) => {
    if (!newWorkspace) return;

    // shallow clone so local edits don’t mutate query cache
    const wsClone = { ...newWorkspace };
    localWorkspace.value = wsClone;
    workspaceStore.setSingleWorkspace(wsClone);
    workspaceStore.setLanes(wsClone?.lanes);

    // Initialize background from workspace variables with fallback
    workspaceStore.setBackground(
      getWorkspaceBackground(wsClone?.variables, dark),
    );
  },
  { immediate: true },
);

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
  handleResize(); // initial check
  window.addEventListener("resize", handleResize);
});
onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
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
