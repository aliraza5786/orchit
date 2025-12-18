<template>
  <Loader v-if="isPending || isFetching" />
  <div v-else
    :class="`h-[100dvh] bg-blend-multiply  text-text-primary  overflow-x-hidden flex flex-col bg-cover bg-no-repeat`"
    :style="{
      background: `${workspaceStore.background} `,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '110%',
      backgroundPosition: 'center'
    }">
    <WorkSpaceNav :getWorkspace="getWorkspace" ref="workspaceNavRef" @toggle-sidebar="toggleSidebar" :expanded="sidebarExpanded" />
    <div class="flex flex-grow items-start h-full max-w-full overflow-x-hidden "
      style="max-height:calc(100dvh - 55px);">
        <Sidebar :workspace="getWorkspace" :isLoading="isPending || isLoading"
       :expanded="sidebarExpanded" />
       <div class="dashboard_content h-full w-full z-[1]  rounded-lg flex  pb-2 sm:gap-1 sm:max-w-[calc(100vw - 100px)] transition-all duration-200"  
        :style="dashboardContentStyle"
        >
        <router-view />
        <ProfilePanel />
        <FilterDrawer v-model="filters" :open="isDrawerOpen" />
        <SettingPanel :workspace="getWorkspace" />
        <ChatBotPanel :workspace="getWorkspace" />
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
import { toParamString, } from '../../composables/useQueryParams';
import { useRoute } from 'vue-router';
const workspaceStore = useWorkspaceStore();
const route = useRoute();
 const workspaceId = computed<string>(() => toParamString(route?.params?.id));
console.log("workspace id", workspaceId.value);

const { data: getWorkspace, isPending, isLoading ,isFetching, refetch } = useSingleWorkspace(workspaceId.value)
watch(
  workspaceId,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await refetch();
    }
  },
  { immediate: true } 
);
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
    : 'calc(100vw - 70px)',
  maxHeight: 'calc(100dvh - 65px)'
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
