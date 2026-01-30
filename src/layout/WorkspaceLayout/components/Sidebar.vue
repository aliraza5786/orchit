<template>
  <SidebarSkeleton v-if="isLoading" />
  <div class="sidebar_mobile bottom-0 start-0 fixed sm:static overflow-hidden z-2 sm:z-1 sm:h-full">
    <aside
      class="sm:overflow-y-auto whitespace-nowrap overflow-x-auto bg-transparent z-1 sm:min-w-[36px] sm:px-2 sm:max-h-full h-[60px] sm:h-full flex flex-row sm:flex-col gap-1 pt-2.5 sm:pt-0 pb-2.5 transition-all duration-300 ease-in-out"
      :class="{ 'w-full sm:w-[250px]': expanded, 'w-full sm:w-14': !expanded }"
    >
      <!-- Mobile Toggle -->
      <div class="hidden sm:block py-1.5 px-2 bg-bg-card mb-2 w-[35px] rounded-lg">
        <button 
          @click="emit('toggle-sidebar')"
          class="text-text-secondary hover:text-text-primary cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <i class="fa-solid fa-bars text-[14px]"></i>
        </button>
      </div> 
      <!-- Workspace Logo Component -->
    <!-- <div class="hidden sm:block">
       <WorkSpaceDropdown :expanded="expanded" />
    </div> -->

    <div class="text-center min-w-max">
      <SideItem
        label="Peak"
        :to="`/workspace/peak/${workspaceId}/${
          workspace?.generation_task?.job_id
            ? workspace?.generation_task?.job_id
            : ''
        }`"
        key="peak"
        id="peak"
        :icon="{
          prefix: 'fa-regular',
          iconName: 'fa-home',
        }"
        :expanded="expanded"
      />
    </div>
    <div class="text-center min-w-max">
      <SideItem
        label="People"
        :to="`/workspace/people/${workspaceId}`"
        key="people"
        id="people"
        :icon="{
          prefix: 'fa-regular',
          iconName: 'fa-users',
        }"
        :expanded="expanded"
      />
    </div>
    <div class="text-center min-w-max">
      <SideItem
        label="Process"
        :to="`/workspace/process/${workspaceId}`"
        key="process"
        id="process"
        :icon="{
          prefix: 'fa-regular',
          iconName: 'fa-diagram-project',
        }"
        :expanded="expanded"
      />
    </div>
    <div class="text-center flex-col flex gap-1 min-w-max">
      <SideItem
        label="Plan"
        :to="`/workspace/plan/${workspaceId}`"
        key="plan"
        id="plan"
        :icon="{
          prefix: 'fa-regular',
          iconName: 'fa-brain',
        }"
        :expanded="expanded"
      />
    </div>
    <div class="flex flex-col gap-1 max-sm:flex-row pin_task min-w-max">
      <SideItem
        v-for="(item, index) in filteredModules"
        :key="index"
        :id="item._id"
        :label="item.variables['module-title']"
        :jobId="item?.generation_task?.job_id"
        :status="item?.generation_task?.status"
        :to="`/${
          item?.variables['module-title'].toLowerCase() == 'pin'
            ? 'workspace/pin'
            : 'workspace'
        }/${workspaceId}/${item._id}`"
        :icon="item?.variables['module-icon']"
        :expanded="expanded"
      />
    </div>

    <!-- Draggable Navigation Items -->
    <!-- <Draggable v-model="modules" item-key="label"
            class="flex-grow overflow-y-auto w-full space-y-1 transition-all text-center" handle=".drag-handle"
            animation="400" drag-class="drag" ghost-class="ghost">
            <template #item="{ element }">
                <div>
                    <SideItem :id="element._id" :label="element.title" :to="`/workspace/${workspace_id}/${element._id}`"
                        :icon="element?.icon" />

                </div>
            </template>
</Draggable> -->

    <!-- Static More Item -->
    <div v-if="canCreateModule" class="text-center min-w-max">
      <SideItem
        id="more"
        label="Add"
        :to="`/workspace/more/${workspaceId}`"
        :icon="{
          prefix: 'fa-solid',
          iconName: 'fa-plus',
        }"
        :expanded="expanded"
      />
    </div>
  </aside>
  </div>
  
</template>

<script setup lang="ts">
import { computed } from "vue";
import SideItem from "./SideItem.vue";
import { useRouteIds } from "../../../composables/useQueryParams";
import { usePermissions } from "../../../composables/usePermissions";
import SidebarSkeleton from "../../../components/skeletons/SidebarSkeleton.vue";
import { useWorkspaceStore } from "../../../stores/workspace";

const {
  workspaceId
} = useRouteIds();

const workspaceStore = useWorkspaceStore();
const { canCreateModule, canAccessModule } = usePermissions();

// Removed workspace from props
const props = defineProps<{
  // workspace: { modules: any; generation_task: any }; 
  isLoading: boolean;
  expanded: boolean;
}>();  
// Use store data for workspace
const workspace = computed(() => workspaceStore.singleWorkspace);

const filteredModules = computed(() => {
  if (!workspace.value?.modules) return [];
  return workspace.value.modules.filter((m: any) => canAccessModule(m._id, 'view_all'));
});

// Removed manual watcher for modules as we use computed directly now
const emit = defineEmits<{ (e: "toggle-sidebar"): void }>();

</script>

<style scoped>
.drag > div {
  transform: rotate(5deg);
}

.ghost {
  background-color: rgba(211, 211, 211, 0.775);
  border-radius: 6px;
}

.ghost > * {
  visibility: hidden;
}

@media (max-width: 639px) {
  aside {
    gap: 8px;
  }

  .pin_task {
    gap: 8px;
  }
  .sidebar_mobile{
     width:100%;
     padding:0   15px;
  }
}
</style>
