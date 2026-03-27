<template>
  <SidebarSkeleton v-if="isLoading" />
  <div class="sidebar_mobile bottom-0 start-0 fixed sm:static overflow-hidden z-2 sm:z-1 sm:h-full">
    <aside
      class="sm:overflow-y-auto whitespace-nowrap overflow-x-auto bg-transparent z-1 sm:min-w-[36px] sm:px-2 sm:max-h-full h-[60px] sm:h-full flex flex-row sm:flex-col gap-1 pt-2.5 sm:pt-0 pb-2.5  transition-all duration-200 justify-start items-start"
      :class="{ 'w-full sm:w-[250px]': expanded, 'w-full sm:w-14': !expanded }"
    >
      <!-- Mobile Toggle -->
      <div class="hidden sm:block py-1.5 px-2 bg-bg-card mb-2  rounded-lg">
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
    <div class="text-center min-w-max" :class="expanded? 'w-full': 'w-max'">
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
    <div class="text-center min-w-max" :class="expanded? 'w-full': 'w-max'">
      <SideItem
        label="Talent"
        :to="`/workspace/talent/${workspaceId}`"
        key="people"
        id="people"
        :icon="{
          prefix: 'fa-regular',
          iconName: 'fa-users',
        }"
        :expanded="expanded"
      />
    </div>
    <div class="text-center min-w-max" :class="expanded? 'w-full': 'w-max'">
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
    <div class="text-center flex-col flex gap-1 min-w-max" :class="expanded? 'w-full': 'w-max'">
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
    <div class="flex flex-col gap-1 max-sm:flex-row pin_task min-w-max" :class="expanded? 'w-full': 'w-max'">
      <SideItem
  v-for="(item, index) in filteredModules"
  :key="index"
  :id="item?._id"
  :label="item.variables['module-title']"
  :jobId="item?.generation_task?.job_id"
  :status="item?.generation_task?.status"
  :to="`/${
    item?.variables['module-title']?.toLowerCase() == 'pin'
      ? 'workspace/pin'
      : 'workspace'
  }/${workspaceId}/${item._id}`"
  :icon="item?.variables['module-icon']"
  :expanded="expanded"
  :activeDropdownId="activeDropdownId"
  :delete-icon="{
    prefix:'far',
    iconName:'ellipsis'
  }"
  :canDelete="item.user_permissions?.can_update"
  :canShare = item.user_permissions.source
  @delete="deleteModule"
  @share="openShareModal"
  @toggleDropdown="toggleDropdown"
  @closeDropdown="activeDropdownId = null"
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
    <div v-if="canCreateModule" class="text-center min-w-max" :class="expanded? 'w-full': 'w-max'">
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
 <div
  v-if="showDeleteDialog"
  class="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50"
>
  <div
    class="bg-bg-card rounded-xl shadow-xl w-[520px] max-w-[92vw] p-6 flex gap-4 relative"
  >
    <!-- Left Icon -->
    <div
      class="w-12 h-12 flex items-center justify-center rounded-full bg-red-100 text-red-600 shrink-0"
    >
      <i class="fa-regular fa-trash text-lg"></i>
    </div>

    <!-- Content -->
    <div class="flex flex-col gap-1.5 flex-1">
      <div class="flex items-start justify-between">
        <h3 class="text-[16px] font-semibold text-text-primary">
          Delete Module
        </h3>

        <!-- Close Button -->
        <button
          class="cursor-pointer text-text-secondary hover:text-text-primary transition"
          @click="cancelDelete"
        >
          <i class="fa-regular fa-xmark text-sm"></i>
        </button>
      </div>

      <p class="text-[13px] text-text-secondary leading-relaxed">
        This action cannot be undone. This will permanently delete this module.
      </p>

      <!-- Actions -->
      <div class="flex justify-end gap-3 mt-4">
        <button
          class="cursor-pointer px-4 py-2 text-[13px] border border-border-input rounded-md hover:bg-bg-hover transition disabled:opacity-50"
          @click="cancelDelete"
          :disabled="isPending"
        >
          Cancel
        </button>

        <button
          class="cursor-pointer px-4 py-2 text-[13px] bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="isPending"
          @click="confirmDelete"
        >
          <!-- Loader -->
          <i
            v-if="isPending"
            class="fa-regular fa-arrows-spin animate-spin"
          ></i>

          <span>
            {{ isPending ? "Deleting..." : "Delete Module" }}
          </span>
        </button>
      </div>
    </div>
  </div>
</div>

<ShareModal
  v-if="showShareModal"
  v-model="showShareModal"
  :resourceId="activeShareId"
/>

</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import SideItem from "./SideItem.vue";
import ShareModal from "./ShareModal.vue";
import { useRouteIds } from "../../../composables/useQueryParams";
import { usePermissions } from "../../../composables/usePermissions";
import SidebarSkeleton from "../../../components/skeletons/SidebarSkeleton.vue";
import { useWorkspaceStore } from "../../../stores/workspace";
import { useDeleteModule } from "../../../queries/useMore"
import { useSingleWorkspace } from "../../../queries/useWorkspace";
import { toast } from "vue-sonner";
import { useRouter } from "vue-router";
const showDeleteDialog = ref(false);
const moduleToDelete = ref<string | null>(null);
const router = useRouter()
const { mutate: deleteModuleMutation, isPending } = useDeleteModule();
const {
  workspaceId
} = useRouteIds();
const { refetch } = useSingleWorkspace(workspaceId);
const workspaceStore = useWorkspaceStore();
const activeDropdownId = ref<string | null>(null)
const showShareModal = ref(false)
const activeShareId = ref<string | undefined>(undefined)

function toggleDropdown(id: string) {
  activeDropdownId.value =
    activeDropdownId.value === id ? null : id
}

function openShareModal(id: string) {
  activeShareId.value = id;
  showShareModal.value = true;
}

// Use store data for workspace
const workspace = computed(() => workspaceStore.singleWorkspace);
function deleteModule(id: string) {
  moduleToDelete.value = id;
  showDeleteDialog.value = true;
}

function confirmDelete() {
  if (!moduleToDelete.value) return;

  deleteModuleMutation(
    {
      payload: {
        module_id: moduleToDelete.value,
        is_trash:true
      },
    },
        {
          onSuccess: () => {
            showDeleteDialog.value = false;
            toast.success("Module has been Deleted Successfully!")
            moduleToDelete.value = null;
            const peakPath = `/workspace/peak/${workspaceId.value}/${
             workspace.value?.generation_task?.job_id || ''
             }`;
            router.push(peakPath);
            refetch();
          },
        }
      );
    }


function cancelDelete() {
  showDeleteDialog.value = false;
  moduleToDelete.value = null;
}


const { canCreateModule, canAccessModule } = usePermissions();

// Removed workspace from props
  defineProps<{
  // workspace: { modules: any; generation_task: any }; 
  isLoading: boolean;
  expanded: boolean;
}>();  


const filteredModules = computed(() => {
 if (!workspace.value?.modules) return [];

const alwaysAllowed = ["tasks", "pin"];

return workspace.value.modules.filter((m: any) => {
  const source = m.user_permissions?.source?.toLowerCase();

  // Always allowed modules
  if (alwaysAllowed.includes(m.title?.toLowerCase())) return true;

  // Owner can always view
  if (source === "owner") return true;

  // Shared with read permission
  if (source === "shared" && m.user_permissions?.can_read) return true;

  // Team permission
  // if (canAccessModule(m._id, "view_all")) return true;

  return false; // important
});
});
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
