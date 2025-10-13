<template>
  <Loader v-if="isPending" />
  <div v-else
    :class="`h-[100dvh] bg-blend-multiply  text-text-primary  overflow-x-hidden flex flex-col bg-cover bg-no-repeat`"
    :style="{
      background: `${workspaceStore.background} `,
      backgroundRepeat: 'no-repeat',
      backgroundSize: '110%',
      backgroundPosition: 'center'
    }">
    <WorkSpaceNav :getWorkspace="getWorkspace" ref="workspaceNavRef" />
    <div class="flex flex-grow items-start h-full max-w-full overflow-x-hidden "
      style="max-height:calc(100dvh - 55px);">
      <Sidebar :workspace="getWorkspace" :isLoading="isPending || isLoading" />
      <div class=" h-full w-full  rounded-lg flex  pb-2 gap-1 max-w-[calc(100vw - 100px)] "
        style="max-width: calc(100vw - 70px); max-height: calc(100dvh - 65px);">
        <router-view />
        <ProfilePanel />
        <FilterDrawer v-model="filters" :open="isDrawerOpen" />
        <SettingPanel :workspace="getWorkspace" />

      </div>
    </div>
  </div>
  <!-- modals  -->
  <CreateLaneModal  :key="'manual-modal'" />
  <CreateLaneWithAI :key="'ai-modal'" />
  <UpdateLaneModal v-if="workspaceNavRef?.laneId && workspaceStore.showUpdateLaneModal" :id="workspaceNavRef.laneId" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import ProfilePanel from './components/ProfilePanel.vue';
import SettingPanel from './components/SettingPanel.vue';
import Sidebar from './components/Sidebar.vue';
import WorkSpaceNav from './components/WorkSpaceNav.vue';
import FilterDrawer from './components/FilterDrawer.vue';
import CreateLaneModal from './modals/CreateLaneModal.vue';
import CreateLaneWithAI from './modals/CreateLaneWithAI.vue';
import UpdateLaneModal from './modals/UpdateLaneModal.vue';
import { useSingleWorkspace } from '../../queries/useWorkspace';
import Loader from '../../components/ui/Loader.vue';
import { useWorkspaceId } from '../../composables/useQueryParams';
const workspaceStore = useWorkspaceStore();
const { workspaceId } = useWorkspaceId();


const { data: getWorkspace, isPending, isLoading } = useSingleWorkspace(workspaceId.value)
const workspaceNavRef = ref<any>(null);
const isDrawerOpen = ref(true)

const filters = ref({
  role: [],
  tags: [],
  status: []
})
</script>
