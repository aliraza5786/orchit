<template>
  <Loader v-if="isLoading" />
  <div v-else
    :class="`h-[100dvh] bg-blend-multiply  text-text-primary  overflow-x-hidden flex flex-col bg-cover bg-no-repeat`"
    :style="{
      background: `${workspaceStore.background} `,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }">
    <WorkSpaceNav  ref="workspaceNavRef"   :expanded="sidebarExpanded" />
    <div class="flex flex-grow items-start h-full max-w-full overflow-x-hidden "
      style="max-height:calc(100dvh - 55px);">
        <Sidebar v-if="localWorkspace"   :isLoading="isPending || isLoading"
       :expanded="sidebarExpanded" @toggle-sidebar="toggleSidebar" />
       <div class="dashboard_content h-full w-full z-1 relative  rounded-lg flex  pb-2 sm:gap-1 sm:max-w-[calc(100vw - 100px)] transition-all duration-200"  
        :style="dashboardContentStyle"
        >
        <router-view  />
        <ProfilePanel />
        <FilterDrawer v-model="filters" :open="isDrawerOpen" />
        <SettingPanel :workspace="getWorkspace" />
        <ChatBotPanel />
      </div>
    </div>
  </div>
  <!-- modals  -->
  <CreateLaneModal  :key="'manual-modal'" />
  <CreateLaneWithAI :key="'ai-modal'" />
  <UpdateLaneModal v-if="workspaceNavRef?.laneId && workspaceStore.showUpdateLaneModal" :id="workspaceNavRef.laneId" />
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted, onMounted, watch } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import ProfilePanel from './components/ProfilePanel.vue';
import SettingPanel from './components/SettingPanel.vue';
import ChatBotPanel from './components/ChatBotPanel.vue';
import Sidebar from './components/Sidebar.vue';
import WorkSpaceNav from './components/WorkSpaceNav.vue';
import FilterDrawer from './components/FilterDrawer.vue';
import CreateLaneModal from './modals/CreateLaneModal.vue';
import CreateLaneWithAI from './modals/CreateLaneWithAI.vue';
import UpdateLaneModal from './modals/UpdateLaneModal.vue';
import { useSingleWorkspace } from '../../queries/useWorkspace';
import Loader from '../../components/ui/Loader.vue'; 
import { useRouteIds } from '../../composables/useQueryParams'; 
const workspaceStore = useWorkspaceStore();
const { workspaceId } = useRouteIds(); // Use the shared composable

// Pass the ref directly. useSingleWorkspace handles unref internally if designed correctly,
// or we can pass a computed if needed. Inspecting useSingleWorkspace, it accepts MaybeRef.
const { data: getWorkspace, isPending, isLoading } = useSingleWorkspace(workspaceId);
const localWorkspace = ref<any>(null); 
watch(
  getWorkspace,
  (newWorkspace) => {
    if (!newWorkspace) return;

    // shallow clone so local edits don’t mutate query cache
    const wsClone = { ...newWorkspace };
    localWorkspace.value = wsClone;
    workspaceStore.setSingleWorkspace(wsClone);
    workspaceStore.setLanes(wsClone?.lanes);

    // Initialize background from workspace variables
    const { theme, color } = wsClone?.variables || {};
    if (theme) {
      workspaceStore.setBackground(`url(${theme})`);
    } else if (color) { 
      workspaceStore.setBackground(hexToRgba(color, 0.3));
    }
  },
  { immediate: true }
);

function hexToRgba(hex: string, alpha = 0.3) {
  if (!hex || typeof hex !== 'string') return hex;
  let h = hex.trim();
  if (!h.startsWith('#')) return h;
  if (/^#([0-9a-f]{3})$/i.test(h)) {
    h = '#' + h.slice(1).split('').map(c => c + c).join('');
  }
  if (/^#([0-9a-f]{8})$/i.test(h)) h = '#' + h.slice(1, 7);
  if (!/^#([0-9a-f]{6})$/i.test(h)) return hex;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
 

const workspaceNavRef = ref<any>(null);
const isDrawerOpen = ref(true)

const filters = ref({
  role: [],
  tags: [],
  status: []
})

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
  { immediate: true }
);
onMounted(() => {
   handleResize(); // initial check
   window.addEventListener('resize', handleResize);
});
onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
// Toggle function for button
function toggleSidebar() {
  sidebarExpanded.value = !sidebarExpanded.value;
}

const dashboardContentStyle = computed(() => ({
  maxWidth: sidebarExpanded.value
    ? 'calc(100vw - 250px)'
    : 'calc(100vw - 56px)',
  maxHeight: 'calc(100dvh - 60px)'
}));
</script>

<style scoped>
@media(max-width:639px){
.dashboard_content{
  max-width: 100% !important;
  padding: 0 14px 70px 14px;
}

}
 
 </style>
