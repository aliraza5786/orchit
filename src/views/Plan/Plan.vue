<template>
  <div
    class="flex-auto flex-grow h-full min-h-0 bg-bg-card rounded-[6px] border border-border overflow-x-auto flex-col flex"
  >
    <template v-if="sprintDetailData?.status == 'active'">
      <ActiveSprint :sptint_id="selectedSprintId" :searchQuery="searchQuery" />
    </template>
  
    <template v-else-if="isStartingSprint">
      <KanbanSkeleton />
    </template>
    <div v-else class="p-4 w-full min-w-0 box-border h-full min-h-0">
      <div
        class="flex gap-2 h-full max-h-screen min-h-0 box-border overflow-x-auto group"
        ref="containerRef"
      >
        <section
          class="space-y-4 p-4 rounded-md relative group overflow-hidden box-border h-full min-h-0 min-w-[400px]"
          :class="theme === 'dark' ? 'bg-bg-surface' : 'bg-bg-surface/30'"
          :style="{ width: leftWidth + 'px' }"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold flex gap-2 items-center">
              <input
                type="checkbox"
                class="custom-checkbox bg-bg-body border border-border-input flex-shrink-0"
                v-model="checkedAll"
              />
              Backlog ({{ backlogResp?.cards?.length }}
              {{ backlogResp?.cards?.length > 1 ? "Tasks" : "Task" }})
            </h2>
            <div class="flex items-center gap-2">
              <button
                class="h-8 w-22 flex items-center justify-center gap-2 rounded-md border cursor-pointer aspect-square text-sm border-border hover:bg-bg-body"
              >
                <img :src="filter" alt="icon" class="w-[16px]" /> Filters
              </button>
              <button
                v-if="canCreateCard"
                class="w-8 h-8 rounded cursor-pointer aspect-square text-sm hover:bg-bg-body"
                @click="openCreateBacklogTicket"
              >
                <i class="text-text-primary fa-regular fa-plus"></i>
              </button>
            </div>
          </div>
          <div
            v-if="isBacklogPenidng"
            class="w-full h-full min-h-[250px] flex justify-center items-center"
          >
            <div
              role="status"
              aria-label="Loading"
              class="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-transparent animate-spin"
            ></div>
          </div>
          
          <BacklogTable
            v-else
            :checkedAll="checkedAll"
            :sprint-type="sprintType"
            :searchQuery="searchQuery"
            @move-selected-to-sprint="moveSelectedToSprint"
            @delete-selected-backlog="deleteSelected('backlog')"
            @open-ticket="openTicket"
            @ticket-moved-to-backlog="handleTicketMovedToBacklog"
            @open-create-ticket="openCreateBacklogTicket"
          />
        </section>
        <div
          class="h-full w-[3px] relative z-10 opacity-0 group-hover:opacity-100 bg-red hover:bg-accent cursor-col-resize transition"
          @mousedown="startResize"
        ></div>
        <section
          class="space-y-4 rounded-md relative group pt-2 ovrflow-hidden flex-1 h-full min-h-0 box-border min-w-[400px] border border-gray-200 overflow-x-hidden"
        >
          <div class="flex justify-between px-3">
            <!-- Left Section: Sprint Tabs -->
            <div class="flex items-center gap-2 bg-white min-w-0 pe-2">
              <!-- Sprint Dropdown -->
            <div ref="elipseWrapperSprint" class="relative inline-block">
  <!-- Trigger Button -->
  <button
    @click.stop="openElipseDropDown = !openElipseDropDown"
    class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-white rounded-lg hover:bg-gray-50"
    :style="{ border: '1px solid ' + selectedType.dot }"
  >
    <span
      class="w-2 h-2 rounded-full"
      :style="{ backgroundColor: selectedType.dot }"
    ></span>
    {{ selectedType.label }}
    <i class="fas fa-chevron-down text-xs"></i>
  </button>

  <!-- Dropdown -->
   <transition name="fade">
  <ul
    v-if="openElipseDropDown"
    @click.stop
    class="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
  >
    <li
      v-for="item in sprintTypes"
      :key="item.value"
      @click="selectType(item)"
      class="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer hover:bg-gray-50"
    >
      <span
        class="w-2 h-2 rounded-full"
        :style="{ backgroundColor: item.dot }"
      ></span>
      {{ item.label }}
    </li>
  </ul>
  </transition>
</div>

             <div class="flex items-center gap-2 max-w-full">
  <!-- Sprint Dropdown -->
            <div class="flex items-center gap-2 max-w-full">
              <!-- Sprint Dropdown -->
              <div
                ref="sprintDropdownWrapperRef"
                class="relative min-w-0"
              >
                <!-- Trigger -->
                <button
                  @click="isSprintDropdownOpen = !isSprintDropdownOpen"
                  v-if="sprintsList?.sprints.length"
                  class="flex items-center gap-3 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  :class="
                    selectedSprintId
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  "
                  :style="
                    selectedSprintId
                      ? { backgroundColor: selectedType.dot }
                      : {}
                  "
                >
                  <span class="truncate max-w-[160px]">
                    {{
                      sprintsList?.sprints?.find(
                        (sprint:any) => sprint._id === selectedSprintId
                      )?.title
                    }}
                  </span>
                  <i class="fas fa-chevron-down text-xs"></i>
                </button>

                <!-- Dropdown -->
                <div
  v-if="isSprintDropdownOpen"
  class="absolute left-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto overflow-x-hidden"
>
  <div
    v-for="sprint in sprintsList?.sprints"
    :key="sprint._id"
    v-if="sprintsList?.sprints.length"
    class="relative px-4 py-2 flex items-center justify-between text-sm cursor-pointer transition-colors hover:bg-gray-100"
  >
    <!-- Title + Edit Mode -->
    <div class="relative flex-1">
      <template v-if="editingSprintId !== sprint._id">
        <!-- Tooltip wrapper on title -->
        <div class="relative inline-block group w-full">
          <button
            class="text-left flex-1 truncate w-full"
            @dblclick.stop="enableEdit(sprint)"
          >
            {{ sprint.title }}
          </button>
        </div>
      </template>

      <template v-else>
        <input
          ref="editingInputRef"
          v-model="sprint.tempTitle"
          class="flex-1 px-1 py-1 text-sm rounded outline-none bg-white border border-[#7d68c8] text-gray-500"
          placeholder="Enter new name"
          @blur="saveSprintTitle()"
          @keyup.enter="saveSprintTitle()"
          @keyup.esc="cancelEdit()"
          autofocus
        />
      </template>
    </div>

    <!-- Delete Button + Tooltip -->
    <div class="relative ml-2 inline-block group">
      <button
        v-if="sprintsList?.sprints?.length > 1 && !sprint.isEditing"
        @click.stop="handleDeleteSprint(sprint)"
        class="w-4 h-4 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500"
      >
        <i class="fas fa-times text-xs"></i>
      </button>
    </div>
  </div>
</div>

              </div>
            </div>

              <!-- Add Sprint Button (Outside Dropdown) -->
              <button
                @click="openSprintModal()"
                class="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shrink-0"
              >
                <i class="fa-solid fa-plus text-sm"></i>
              </button>
            </div>

            </div>

            <!-- Right Section: Actions -->
            <div class="flex gap-3 items-center">
  <!-- Regular SearchBar (hidden on small screens) -->
  <div class="hidden sm:flex flex-1">
    <SearchBar
      placeholder="Search in sprint"
      v-model="searchQuery"
    />
  </div>

  <!-- Search Icon for small screens -->
  <button
    class="sm:hidden flex items-center justify-center w-8 h-8 ms-4 rounded-lg bg-gray-100 hover:bg-gray-200"
    @click="openSearchModal"
  >
    <i class="fa-solid fa-magnifying-glass text-gray-600"></i>
  </button>

  <!-- End / Start Sprint Buttons -->
  <!-- End Sprint Button -->
<div class="gap-2 hidden lg:flex">
  <!-- End Sprint Button -->
  <Button
    v-if="sprintDetailData?.status === 'active'"
    size="sm"
    @click="handleCompleteSprint"
    :variant="theme === 'dark' ? 'primary' : 'primary'"
    class="border-border-input border "
  >
    {{ isCompletingSprint ? "Ending..." : "End" }}
  </Button>

  <!-- Start Sprint Button -->
  <Button
    v-else
    size="sm"
    :variant="theme === 'dark' ? 'primary' : 'primary'"
    class="border-border-input border"
    @click="openStartSprintModal"
    :disabled="!firstSprint || firstSprint.tickets.length === 0"
  >
    Start Sprint
  </Button>
</div>
<!-- Small Screen Icon Buttons -->
<div class="flex gap-2 lg:hidden">
  <!-- End Sprint Icon -->
  <button
    v-if="sprintDetailData?.status === 'active'"
    @click="handleCompleteSprint"
    class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
    :title="isCompletingSprint ? 'Ending...' : 'End Sprint'"
  >
    <i class="fa-solid fa-flag-checkered text-gray-700"></i>
  </button>

  <!-- Start Sprint Icon -->
  <button
    v-else
    @click="openStartSprintModal"
    :disabled="!firstSprint || firstSprint.tickets.length === 0"
    class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
    title="Start Sprint"
  >
    <i class="fa-solid fa-play text-gray-700"></i>
  </button>
</div>


</div>

<!-- Search Modal -->
<transition name="fade">
  <div
    v-if="showSearchModal"
    class="fixed inset-0 z-50 -top-30 flex items-center justify-center bg-black/40"
  >
    <div class="bg-white rounded-lg w-11/12 max-w-md p-4">
      <div class="flex items-center gap-2">
        <SearchBar
          placeholder="Search in sprint"
          v-model="searchQuery"
          class="flex-1"
        />
        <button
          @click="closeSearchModal"
          class="p-2 rounded hover:bg-gray-100"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  </div>
</transition>

          </div>

          <div
            v-if="isSprintPending"
            class="w-full h-full min-h-[250px] flex justify-center items-center"
          >
            <div
              role="status"
              aria-label="Loading"
              class="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-transparent animate-spin"
            ></div>
          </div>
          <SprintCard
            v-else
            :searchQuery="searchQuery"
            :sprintId="selectedSprintId"
            v-if="firstSprint"
            :checkedSprintAll="checkedSprintAll"
            :sprint="firstSprint"
            @open-ticket="openTicket"
            @edit-sprint="openEditSprint"
            @toggle-start="toggleStartSprint"
            @move-selected-to-backlog="moveSelectedToBacklog"
            @delete-selected-sprint="(id) => deleteSelected('sprint', id)"
            @refresh="handleRefresh"
          />
        </section>
      </div>
    </div>
  </div>
  <!-- <div v-else
      class="flex-auto flex-grow h-full bg-bg-card rounded-lg border border-border  overflow-x-auto flex-col flex  ">
      <div class="empty-state w-full flex flex-col h-full justify-center items-center ">
        <img src="../../assets/emptyStates/sprint-plan.svg" class="mb-4" alt="backlog-plan">
        <h6 class="text-sm text-text-primary font-semibold mb-1 text-center">Plan your sprint</h6>
        <p class="text-sm text-text-primary/90 mb-3 max-w-120 text-center">Drag work items from the <span
            class="font-bold">
            Backlog
          </span>
          section or create new ones to plan the
          work for this sprint. Select <span class="font-bold">Start sprint</span> when you're ready.</p>
        <Button @click="openSprintModal">Create Sprint</Button>
      </div>
    </div> -->

  <!-- Modals -->
  <ConfirmDeleteModal
    @click.stop=""
    v-model="showSprintDelete"
    title="Delete Sprint"
    itemLabel="Sprint"
    :itemName="selectedSprint?.title"
    :requireMatchText="selectedSprint?.title"
    confirmText="Delete Sprint"
    cancelText="Cancel"
    size="md"
    :loading="isDeleting"
    @confirm="handleDeleteTicket"
    @cancel="
      () => {
        selectedSprint = null;
        showSprintDelete = false;
      }
    "
  >
  </ConfirmDeleteModal>
  <!-- <TicketModal v-model="ticketModalOpen" :editing="!!editingTicket" :ticket="editingTicket" @save="handleSaveTicket" /> -->
  <SprintModal
    v-model="sprintModalOpen"
    @save="saveSprintHandler"
    :sprint="selectedSprint"
    :creatingSprint="selectedSprint ? isUpdatingSprint : creatingSprint"
  />
  <StartSprintModal
    :sprint="selectedSprint"
    v-model="startsprintModalOpen"
    @save="startSprintHandler"
    :creatingSprint="isStartingSprint || isUpdatingSprint2"
  />

  <TaskDetailsModal
    v-model="showTaskModal"
    :cardId="editingTicket?.id"
    @close="closeModal"
  />

  <CreateBacklogTicketWithModuleSelection v-model="isCreateTicketModalOpen" />
  <!-- <CreateSheetModal v-model="sprintModalOpen" size="md"  /> -->
</template>

<script setup lang="ts">
import BacklogTable from "./components/BacklogTable.vue";
import SprintCard from "./components/SprintCard.vue";
// import TicketModal from './modals/TicketModal.vue'
import SprintModal from "./modals/SprintModal.vue";
import { computed, ref, watch, onMounted } from "vue";
import { useBacklogStore, type Ticket } from "./composables/useBacklogStore";
import Button from "../../components/ui/Button.vue";
import SearchBar from "../../components/ui/SearchBar.vue";
import filter from "@assets/icons/filter.svg";
import {
  useBacklogList,
  useCompleteSprint,
  useCreateSprint,
  useDeleteSprint,
  useRemoveCardFromSprint,
  useSprintCard,
  useSprintDetail,
  useSprintList,
  useStartSprint,
  useUpdateSprint,
} from "../../queries/usePlan";

import { toast } from "vue-sonner";
import { useWorkspaceId } from "../../composables/useQueryParams";
import { useQueryClient } from "@tanstack/vue-query";
import ConfirmDeleteModal from "../Product/modals/ConfirmDeleteModal.vue";
import StartSprintModal from "./modals/StartSprintModal.vue";
import CreateBacklogTicketWithModuleSelection from "./modals/CreateBacklogTicketWithModuleSelection.vue";
import ActiveSprint from "./components/ActiveSprint.vue";
import TaskDetailsModal from "../Workspaces/Modals/TaskDetailsModal.vue";
import { useTheme } from "../../composables/useTheme";
import KanbanSkeleton from "../../components/skeletons/KanbanSkeleton.vue";
const { theme } = useTheme();
const showTaskModal = ref(false);
const searchQuery = ref("");
const checkedAll = ref(false);
const checkedSprintAll = ref(false);
import { usePermissions } from "../../composables/usePermissions";
const { canCreateCard } = usePermissions();
// sprint dropdown
const elipseWrapperSprint = ref<HTMLElement | null>(null);
const open = ref(false);
const openElipseDropDown = ref(false);
const sprintType = computed(() => selectedType.value.value);
const sprintTypes = [
  { label: "Milestone", value: "milestone", dot: "#2e9bda" },
  { label: "Sprint", value: "sprint", dot: "#7d68c8" },
  { label: "Huddle", value: "huddle", dot: "#eea832" },
];

const selectedType = ref(sprintTypes[0]);
// const selectedCardId = ref('');
// const rowClickHandler= (rowId:any)=>{
//   selectedCardId.value=rowId;
// }
import { onClickOutside } from "@vueuse/core";
const elipseWrapper = ref<HTMLElement | null>(null);
const openElipseDrop = ref(false);
onClickOutside(elipseWrapper, () => {
  openElipseDrop.value = false;
});

const closeModal = () => {
  showTaskModal.value = false;
};
// import CreateSheetModal from '../Product/modals/CreateSheetModal.vue'
const { workspaceId } = useWorkspaceId();
const isCreateTicketModalOpen = ref(false);
const {
  // backlog, sprints,
  // selectedBacklogIds, selectedSprintIds,
  moveSelectedToSprint,
  moveSelectedToBacklog,
  deleteSelected,
  saveSprintMeta,
  toggleStartSprint,
} = useBacklogStore();
const { data: backlogResp, refetch: refetchBackLogList } = useBacklogList(workspaceId, sprintType, {
});

watch(
  () => sprintType.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      refetchBackLogList();
    }
  }
);

// delete sprint
const { mutate: deleteSprint, isPending: isDeleting } = useDeleteSprint({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sprint-list"] });
    showSprintDelete.value = false;
  },
});
const selectedSprint = ref<any>(null);
const showSprintDelete = ref(false);
const handleDeleteTicket = () => {
  deleteSprint(selectedSprint.value?._id);
};
const { mutate: updateSprint2, isPending: isUpdatingSprint2 } = useUpdateSprint(
  {
    onSuccess: (data: any) => {
      saveSprintMeta({ name: data.title });
      console.log(data, "this is testing data");
      startSprint({
        id: selectedSprintId.value,
        payload: {
          title: data.title,
          start_date: data.start_date,
          end_date: data.end_date,
          goal: data.goal,
          duration: Number(data.duration_days),
        },
      });
      // queryClient.invalidateQueries({ queryKey: ['sprint-list'] })
      startsprintModalOpen.value = false;
    },
  }
);
const { mutate: startSprint, isPending: isStartingSprint } = useStartSprint({
  onSuccess: () => {
    refetchSprintDetail();
  },
});
const startSprintHandler = (e: any) => {
  console.log("helo", selectedSprint.value, e);

  updateSprint2({
    id: selectedSprintId.value,
    payload: {
      title: e.title,
      duration: e.duration,
      start_date: e.start,
      end_date: e.end,
      goal: e.goal,
    },
  });
};


const { data: sprintsList, refetch: refetchSprints } = useSprintList(
  workspaceId.value,
  sprintType
);
watch(
  () => sprintType.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      refetchSprints();
    }
  }
);
const { refetch: refetchBacklog, isPending: isBacklogPenidng } =
  useBacklogList(workspaceId, sprintType);
const firstSprintId = computed(() => sprintsList?.value?.sprints[0]?._id);
const selectedSprintId = ref(firstSprintId.value);
watch(
  () => firstSprintId.value,
  (newVal) => {
    selectedSprintId.value = newVal;
  }
);
watch(
  () => selectedSprintId.value,
  (id) => {
    selectedSprint.value =
      sprintsList.value?.sprints.find((s: any) => s._id === id) || null;
  }
);

// const openSprintMadal = () => {
//   sprintModalOpen.value = true
// }

const { data: sprintDetailData, refetch: refetchSprintDetail } =
  // useSprintDetail(firstSprintId);
  useSprintDetail(selectedSprintId);
const startsprintModalOpen = ref(false);
const openStartSprintModal = () => {
  console.log(firstSprint.value, "this is sprint");
  startsprintModalOpen.value = true;
};
const {
  data: sprintData,
  isPending: isSprintPending,
  refetch: refetchSprintData,
} = useSprintCard(selectedSprintId);



watch(
  () => selectedSprintId.value,
  () => {
    refetchSprintDetail();
  }
);

// Convert API sprint to store Sprint format with cards
const firstSprint = computed(() => {
  const apiSprint = sprintData?.value?.backlog_items;
  if (!apiSprint) return null;

  // Map sprint cards from API
  const sprintCards = (sprintData?.value?.backlog_items || []).map((c: any) => {
    const v = c?.card?.variables || {};
    const id = c?.card?._id || c.card_id;

    return {
      id,
      key: (v["card-code"] as string) || id?.slice(-6) || "PRJ-?",
      summary: (v["card-title"] as string) || "(untitled)",
      type: "Story" as const,
      status: mapStatus(String(v["card-status"] || "").trim()),
      assignee: c?.card?.assigned_to?.name || "Unassigned",
      storyPoints: Number(c.story_points || 0),
      priority: mapPriority(String(v["priority"] || "").trim()),
      createdAt: c?.card?.created_at || new Date().toISOString(),
      description: (v["card-description"] as string) || "",
    };
  });

  return {
    id: apiSprint._id,
    name: apiSprint.title || "Sprint 1",
    title: apiSprint.title,
    goal: "",
    start: "",
    end: "",
    started: false,
    tickets: sprintCards,
  };
});

function mapStatus(s: string): "Todo" | "In Progress" | "Done" {
  const normalized = s.toLowerCase();
  if (normalized.includes("progress")) return "In Progress";
  if (normalized.includes("done") || normalized.includes("complete"))
    return "Done";
  return "Todo";
}

function mapPriority(p: string): "Highest" | "High" | "Medium" | "Low" {
  const s = p.toLowerCase();
  if (s === "highest" || s === "blocker" || s === "critical") return "Highest";
  if (s === "high" || s === "major") return "High";
  if (s === "medium" || s === "normal") return "Medium";
  return "Low";
}

const { mutate: removeCardFromSprint } = useRemoveCardFromSprint({
  onSuccess: () => {
    toast.success("Card removed from sprint successfully");
    handleRefresh();
  },
  onError: (error: any) => {
    toast.error("Failed to remove card from sprint");
    console.error("Failed to remove card from sprint:", error);
  },
});

function handleRefresh() {
  refetchSprintData();
  refetchSprints();
  refetchBacklog();
  refetchSprintDetail();
}

function handleTicketMovedToBacklog(
  ticketIds: string[] | string,
  sprintId?: string
) {
  const ids = Array.isArray(ticketIds) ? ticketIds : [ticketIds];
  const sourceSprintId = sprintId || selectedSprintId.value;
  if (!sourceSprintId || !ids.length) return;
  ids.forEach((id) => {
    removeCardFromSprint({
      sprintId: sourceSprintId,
      cardId: id,
    });
  });
}

// Ticket modal state
const ticketModalOpen = ref(false);
const editingTicket = ref<Ticket | null>(null);
// const createTarget = ref<'backlog' | 'sprint'>('backlog')

function openCreateBacklogTicket() {
  isCreateTicketModalOpen.value = true;
  editingTicket.value = null;
  // createTarget.value = 'backlog'
  // ticketModalOpen.value = true
}

function openTicket(t: Ticket) {
  editingTicket.value = t;
  showTaskModal.value = true;
  // createTarget.value = 'backlog' // not used on edit path
  ticketModalOpen.value = true;
}
// function handleSaveTicket(partial: Partial<Ticket>) {
//   if (editingTicket.value) {
//     Object.assign(editingTicket.value, partial)
//   } else {
//     createTicket(createTarget, {
//       summary: partial.summary!,
//       type: partial.type as Ticket['type'],
//       status: (partial.status as Ticket['status']) || 'Todo',
//       assignee: (partial.assignee?.trim() || 'Unassigned'),
//       storyPoints: Number(partial.storyPoints) || 0,
//       priority: partial.priority as Ticket['priority'],
//       description: partial.description || ''
//     })
//   }
// }

// Sprint modal state (edit only)
const sprintModalOpen = ref(false);
function openEditSprint() {
  sprintModalOpen.value = true;
}
const queryClient = useQueryClient();
const { mutate: createSprint, isPending: creatingSprint } = useCreateSprint({
  onSuccess: (data: any) => {
    saveSprintMeta({ name: data.title });
    queryClient.invalidateQueries({ queryKey: ["sprint-list"] });
    sprintModalOpen.value = false;
  },
});
const { mutate: updateSprint, isPending: isUpdatingSprint } = useUpdateSprint({
  onSuccess: (data: any) => {
    saveSprintMeta({ name: data.title });
    queryClient.invalidateQueries({ queryKey: ["sprint-list"] });
    sprintModalOpen.value = false;
  },
});
function saveSprintHandler(e: any) {
  
  if (selectedSprint.value) {
    updateSprint({
      id: selectedSprint.value?._id,
      payload: {
        workspace_id: workspaceId.value,
        title: e.name,
        sprintType: e.value,
        description: e.description,
      },
    });
  } else {
    createSprint({
      payload: {
        workspace_id: workspaceId.value,
        title: e.name,
        sprintType: e.value,
        description: e.description,
      },
    });
  }
}
function openSprintModal() {
  selectedSprint.value = null;
  sprintModalOpen.value = true;
}

function handleDeleteSprint(e: any) {
  selectedSprint.value = e;
  showSprintDelete.value = true;
}
const { mutate: completeSprint, isPending: isCompletingSprint } =
  useCompleteSprint(selectedSprintId, {
    onSuccess: () => {
      refetchSprintDetail();
    },
  });

const handleCompleteSprint = () => {
  completeSprint({});
};

// resize sections

const containerRef = ref<HTMLElement | null>(null);
const leftWidth = ref(0);

let resizing = false;
const minWidth = 400; //  New minimum width (your requirement)

onMounted(() => {
  if (!containerRef.value) return;
  const full = containerRef.value.offsetWidth;
  leftWidth.value = full / 3; // start at 50%
});

function startResize() {
  resizing = true;
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);
}

function handleResize(e: MouseEvent) {
  if (!resizing) return;

  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const pos = e.clientX - rect.left;

  // Apply min and max limits
  if (pos < minWidth) leftWidth.value = minWidth;
  else if (pos > rect.width - minWidth) leftWidth.value = rect.width - minWidth;
  else leftWidth.value = pos;
}

function stopResize() {
  resizing = false;
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
}
/////
const editingSprintId = ref(null);

function enableEdit(sprint :any) {
  editingSprintId.value = sprint._id;
}

function cancelEdit() {
  editingSprintId.value = null;
}

function saveSprintTitle() {
  editingSprintId.value = null;
}

onClickOutside(elipseWrapperSprint, () => {
  openElipseDropDown.value = false
})
const selectType = (item: typeof sprintTypes[number]) => {
  selectedType.value = item;
  open.value = false;
};

onClickOutside(elipseWrapper, () => {
  open.value = false;
});

const sprintDropdownWrapperRef = ref<HTMLElement | null>(null);
const isSprintDropdownOpen = ref(false);
const editingInputRef = ref<HTMLInputElement | null>(null);

onClickOutside(sprintDropdownWrapperRef, () => {
  isSprintDropdownOpen.value = false;
});
onClickOutside(editingInputRef, () => {
  if (editingSprintId.value) {
    const sprint = sprintsList.value?.sprints?.find(
      (s: any) => s._id === editingSprintId.value
    );
    if (sprint) cancelEdit();
  }
});


const showSearchModal = ref(false);

const openSearchModal = () => {
  showSearchModal.value = true;
};

const closeSearchModal = () => {
  showSearchModal.value = false;
};
</script>

<style scoped>
.custom-checkbox {
  appearance: none; /* remove native checkbox UI */
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.custom-checkbox:checked {
  background-color: #5a2d7f;
  border-color: #5a2d7f !important;
}

.custom-checkbox:checked::after {
  content: "";
  display: block;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin: 3px auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
