<template>
  <nav class="flex items-center justify-between   min-h-16  w-full   ">
    <!-- Logo -->
    <div
      :class="`text-2xl font-bold   ${workspaceStore.background.startsWith('url') ? 'text-text-secondary' : 'text-text-primary'}  flex items-center gap-8`">
      <div class="flex items-center gap-3 pl-3">
        <img :src="getWorkspace?.logo ?? dp" alt="Orchit AI Logo" @click="handleClick"
          class="min-w-10 shadow-2xl rounded-md h-10 cursor-pointer aspect-square object-contain" />
        <h3 class="text-lg max-w-42 font-medium line-clamp-1 text-text-primary">{{ getWorkspace?.variables?.title }}
        </h3>
      </div>
      <!-- Navigation Links -->
      <ul
        :class="`flex  text-xs font-bold items-center gap-2    ${workspaceStore.background.startsWith('url') ? 'text-white' : 'text-text-primary'}`">
        <li class="  px-3 py-2 hover:bg-bg-card cursor-pointer  group rounded-lg "
          :class="workspaceStore.selectedLaneIds.length == 0 ? 'bg-bg-card text-text-primary  ' : ''"
          @click="workspaceStore.toggleAllLane('')">
          Main
        </li>
        <li v-for="item in getWorkspace?.lanes" :key="item._id" @click="workspaceStore.toggleLane(item._id)">
          <LaneDropdown @update="openUpdateModal" :id="item._id" :label="item?.variables['lane-title']"
            :link="item?.link" :color="item?.variables['lane-color']"
            :selected="workspaceStore.isLaneSelected(item._id)" />
        </li>

        <li class="hover:text-accent text-text-primary flex gap-2 items-center text-xs  cursor-pointer px-2 py-1"
          @click="createLaneHandler">
          <svg width="16" height="16" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.9998 23.3346V14.0013M13.9998 14.0013V4.66797M13.9998 14.0013H23.3332M13.9998 14.0013H4.6665"
              stroke="currentColor" stroke-opacity="0.8" stroke-width="2.8" stroke-linecap="round" />
          </svg>
          New lane
        </li>
      </ul>
    </div>
    <div class="flex gap-2">
      <!-- <Collaborators :avatars="collaborators" :maxVisible="3" size="8" overlapSpace="5" /> -->
      <button class="  cursor-pointer rounded-lg p-2" @click="handleClick">
        <i class="fa-solid fa-ellipsis rotate-90 cursor-pointer"></i>

      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
// import Collaborators from '../../../components/ui/Collaborators.vue';
import LaneDropdown from './LaneDropdown.vue';
import { useWorkspaceStore } from '../../../stores/workspace';
import dp from "../../../assets/global/dummy.jpeg"
import { ref } from 'vue';
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

const workspaceStore = useWorkspaceStore();
const laneId = ref('');
const handleClick = () => {
  workspaceStore.toggleSettingPanel()
}
const createLaneHandler = () => {
  workspaceStore.toggleCreateLaneModalWithAI()
}
// const collaborators = [
//   {
//     name: 'A', image: 'https://i.pravatar.cc/100?img=1', onclick: () => {
//       workspaceStore.toggleProfilePanel()
//     }
//   },
//   {
//     name: 'B', image: 'https://i.pravatar.cc/100?img=2', onclick: () => {
//       workspaceStore.toggleProfilePanel()
//     }
//   },
//   {
//     name: 'C', image: 'https://i.pravatar.cc/100?img=3', onclick: () => {
//       workspaceStore.toggleProfilePanel()
//     }
//   },
//   {
//     name: 'D', image: 'https://i.pravatar.cc/100?img=4', onclick: () => {
//       workspaceStore.toggleProfilePanel()
//     }
//   },
//   {
//     name: 'E', image: 'https://i.pravatar.cc/100?img=5', onclick: () => {
//       workspaceStore.toggleProfilePanel()
//     }
//   },
// ];
const openUpdateModal = (id: any) => {
  laneId.value = id;
  console.log("id", id);
  workspaceStore.toggleUpdateLaneModal();
}
// const router = useRouter()

defineExpose({ laneId })
defineProps<{
  getWorkspace: any
}>()
</script>