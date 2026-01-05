<template>
  <div
    class="flex-auto flex-grow h-full min-h-0 bg-bg-card rounded-[6px] border border-border overflow-x-auto flex-col flex"
  >
    <template v-if="showActiveSprint">
      <ActiveSprint :sptint_id="selectedSprintId" :searchQuery="searchQuery" @go-back="showActiveSprint = false" />
    </template>
<div v-if="!showActiveSprint">
    <template v-if="isStartingSprint">
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
              Tickets ({{ backlogResp?.cards?.length }}
              {{ backlogResp?.cards?.length > 1 ? "Tasks" : "Task" }})
            </h2>
            <div
              class="flex items-center gap-2 relative"
              ref="filterDropdownRef"
            >
              <!-- Add Card Button -->
              <button
                v-if="canCreateCard"
                class="w-8 h-8 rounded cursor-pointer text-sm hover:bg-bg-body flex items-center justify-center"
                @click="openCreateBacklogTicket"
              >
                <i class="text-text-primary fa-regular fa-plus"></i>
              </button>
            </div>
          </div>
          <!-- filters -->
          <div>
            <!-- Milestone: Horizontal Tabs -->
            <div
              v-if="sprintType === 'milestone'"
              class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
            >
              <!-- Default "All" Tab -->
              <button
                @click="selectMilestoneTab('all')"
                class="flex-shrink-0 px-4 py-1 rounded-2xl text-sm font-medium transition-colors whitespace-nowrap"
                :class="
                  selectedMilestoneTab === 'all'
                    ? 'bg-accent text-white border-none'
                    : 'bg-transparent text-accent border border-accent'
                "
              >
                All Modules
              </button>

              <!-- Dynamic Module Tabs -->
              <button
                v-for="option in visibleModules"
                :key="option._id"
                @click="selectMilestoneTab(option._id)"
                class="flex-shrink-0 px-4 py-1 rounded-2xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                :class="
                  selectedMilestoneTab === option._id
                    ? 'bg-accent text-white border-none'
                    : 'bg-transparent text-accent border border-accent'
                "
              >
                {{ option.variables["module-title"] }}
              </button>
            </div>

            <!-- Huddle: Dropdown -->
            <div
              v-else-if="sprintType === 'huddle' || sprintType === 'sprint'"
              class="relative flex items-center gap-3"
            >
              <!-- FILTER DROPDOWN (NO OVERFLOW PARENT) -->
              <div class="relative flex-shrink-0">
                <button
                  class="h-8 min-w-[160px] flex items-center justify-between px-2 rounded-md border text-sm border-border hover:bg-bg-body"
                  @click="isHuddleDropdownOpen = !isHuddleDropdownOpen"
                >
                  <span class="flex items-center gap-2 truncate">
                    <img :src="filter" alt="filter" class="w-4 h-4" />
                    <span class="truncate">
                      {{ selectedHuddleModuleLabel || "All Milestones" }}
                    </span>
                  </span>
                  <i class="fas fa-chevron-down text-xs ml-2"></i>
                </button>

                <!-- DROPDOWN -->
                <div
                  v-if="isHuddleDropdownOpen"
                  class="absolute left-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]"
                >
                  <ul class="flex flex-col">
                    <li
                      class="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      @click="selectHuddleModule('all')"
                    >
                      All Milestones
                    </li>

                    <li
                      v-for="option in visibleModules"
                      :key="option._id"
                      class="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      @click="selectHuddleModule(option._id)"
                    >
                      {{ option.variables["module-title"] }}
                    </li>
                  </ul>
                </div>
              </div>

              <!-- SPRINT TABS (SCROLL ONLY HERE) -->
              <div class="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                <button
                  v-for="option in sprintsList?.sprints"
                  :key="option._id"
                  @click="selectMilestoneTab(option._id)"
                  class="flex-shrink-0 px-4 py-1 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors"
                  :class="
                    selectedMilestoneTab === option._id
                      ? 'bg-accent text-white'
                      : 'bg-transparent text-accent border border-accent'
                  "
                >
                  {{ option.title }}
                </button>
              </div>
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
          class="space-y-4 rounded-md relative group pt-2 ovrflow-hidden flex-1 h-full min-h-0 box-border min-w-[400px] border border-border-input overflow-x-hidden"
          :class="theme === 'dark' ? 'bg-bg-surface' : 'bg-bg-surface/30'"
        >
          <div class="flex justify-between px-3">
            <!-- Left Section: Sprint Tabs -->
            <div class="flex items-center gap-2 bg-transparent min-w-0 pe-2">
              <!-- Sprint Dropdown -->
              <div ref="elipseWrapperSprint" class="relative inline-block">
                <!-- Trigger Button -->
                <button
                  @click.stop="openElipseDropDown = !openElipseDropDown"
                  class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-transparent rounded-lg"
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
                    class="absolute left-0 mt-2 w-44 bg-bg-dropdown border border-border rounded-xl shadow-lg z-50"
                  >
                    <li
                      v-for="item in sprintTypes"
                      :key="item.value"
                      @click="
                        selectType(item),
                          (openElipseDropDown = !openElipseDropDown)
                      "
                      class="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer"
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
                  <div ref="sprintDropdownWrapperRef" class="relative min-w-0">
                    <!-- Trigger -->
                    <button
                      @click="isSprintDropdownOpen = !isSprintDropdownOpen"
                      v-if="sprintsList?.sprints.length"
                      class="flex items-center gap-3 lg:px-6 px-2 py-1.5 rounded-lg text-sm font-medium transition-all"
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
                            (sprint: any) => sprint._id === selectedSprintId
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
                        class="relative px-4 py-2 flex items-center justify-between text-sm cursor-pointer transition-colors hover:bg-gray-100"
                      >
                        <!-- Title / Edit -->
                        <div class="relative flex-1">
                          <template v-if="editingSprintId !== sprint._id">
                            <button
                              class="text-left truncate w-full"
                              @click="selectSprint(sprint)"
                            >
                              {{ sprint.title }}
                            </button>
                          </template>

                          <template v-else>
                            <input
                              ref="editingInputRef"
                              v-model="editingSprintTitle"
                              class="w-full px-1 py-1 text-sm rounded outline-none bg-white border border-[#7d68c8]"
                              placeholder="Enter new name"
                              @click.stop
                              @blur="saveInlineSprintTitle(sprint)"
                              @keyup.enter="saveInlineSprintTitle(sprint)"
                              @keyup.esc="cancelEdit"
                            />
                          </template>
                        </div>

                        <!-- Delete Button -->
                        <div class="relative ml-2 flex gap-2">
                          <button
                            class="ml-2 text-xs text-gray-400 hover:text-accent"
                            @click.stop="enableEdit(sprint)"
                          >
                            <i class="fas fa-pen"></i>
                          </button>
                          <button
                            v-if="
                              sprintsList?.sprints.length > 1 &&
                              editingSprintId !== sprint._id
                            "
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
                  class="w-7 h-7 flex items-center justify-center rounded-full bg-accent border text-white transition-colors shrink-0"
                >
                  <i class="fa-solid fa-plus text-xs"></i>
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
                class="sm:hidden flex items-center justify-center w-7 h-7 ms-10 rounded-full bg-accent border"
                @click="openSearchModal"
              >
                <i class="fa-solid fa-magnifying-glass text-white"></i>
              </button>

              <!-- End / Start Sprint Buttons -->
              <!-- End Sprint Button -->

              <div class="gap-2 hidden lg:flex">
                <!-- End Sprint Button -->
                <div v-if="sprintDetailData?.status === 'active'" class="flex gap-2">
                  <Button
                 
                  size="sm"
                  @click="handleCompleteSprint"
                  :variant="theme === 'dark' ? 'primary' : 'primary'"
                  class="border-border-input border"
                >
                  {{ isCompletingSprint ? "Ending..." : "End" }}
                </Button>
                    <button class="cursor-pointer bg-gradient-to-tr from-accent to-accent-hover text-white flex items-center justify-center gap-1 px-2 py-1 rounded-md text-sm font-medium" @click="handlePreviewClick"><i class="fa-regular fa-eye text-sm"></i> Preview</button>
                </div>
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

              <div
                class="flex gap-2 lg:hidden"
                v-if="firstSprint && firstSprint.tickets.length"
              >
                <!-- End Sprint Icon -->
                 {{ sprintDetailData?.status }}
                <div v-if="sprintDetailData?.status === 'active'" class="border border-red-600">
                  <button
                  
                  @click="handleCompleteSprint"
                  class="w-8 h-8 flex items-center justify-center rounded-full bg-accent border"
                  :title="isCompletingSprint ? 'Ending...' : 'End Sprint'"
                >
                  <i class="fa-solid fa-flag-checkered text-gray-700"></i>
                </button>

                </div>
                <!-- Start Sprint Icon -->
                <button
                  v-else
                  @click="openStartSprintModal"
                  :disabled="!firstSprint || firstSprint.tickets.length === 0"
                  class="w-7 h-7 flex items-center justify-center rounded-full bg-accent border disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Start Sprint"
                >
                  <i class="fa-solid fa-play"></i>
                </button>
                
              </div>
            </div>

            <!-- Search Modal -->
            <transition name="fade">
              <div
                v-if="showSearchModal"
                class="fixed inset-0 z-50 -top-30 flex items-center justify-center"
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
                      class="p-2 rounded hover:bg-gray-100 text-accent"
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
</div>
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
import { useSingleWorkspaceCompany } from "../../queries/useWorkspace";
const { theme } = useTheme();
const showTaskModal = ref(false);
const searchQuery = ref("");
const checkedAll = ref(false);
const checkedSprintAll = ref(false);
import { usePermissions } from "../../composables/usePermissions";
const { canCreateCard } = usePermissions();
const showActiveSprint = ref(false);
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
const handlePreviewClick = () => {
  showActiveSprint.value = true;
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
const { data: backlogResp, refetch: refetchBackLogList } = useBacklogList(
  workspaceId,
  sprintType,
  {}
);
const { data: workspaceData } = useSingleWorkspaceCompany(workspaceId);
const visibleModules = computed(
  () =>
    workspaceData.value?.modules.filter(
      (m: any) => m?.variables?.["module-title"] !== "Pin"
    ) || []
);
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
const { refetch: refetchBacklog, isPending: isBacklogPenidng } = useBacklogList(
  workspaceId,
  sprintType
);
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

function selectSprint(sprint: any) {
  selectedSprintId.value = sprint._id;
  isSprintDropdownOpen.value = false;
}

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
const editingSprintTitle = ref("");
function saveInlineSprintTitle(sprint: any) {
  const newTitle = editingSprintTitle.value.trim();

  if (!newTitle || newTitle === sprint.title) {
    cancelEdit();
    return;
  }

  updateSprint({
    id: sprint._id,
    payload: {
      workspace_id: workspaceId.value,
      title: newTitle,
    },
  });

  editingSprintId.value = null;
}

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

function enableEdit(sprint: any) {
  editingSprintId.value = sprint._id;
  sprint.tempTitle = sprint.title;
}

function cancelEdit() {
  const sprint = sprintsList.value?.sprints.find(
    (s: any) => s._id === editingSprintId.value
  );

  if (sprint) {
    sprint.tempTitle = sprint.title;
  }

  editingSprintId.value = null;
}

onClickOutside(elipseWrapperSprint, () => {
  openElipseDropDown.value = false;
});
const selectType = (item: (typeof sprintTypes)[number]) => {
  selectedType.value = item;
  open.value = false;
};

onClickOutside(elipseWrapper, () => {
  open.value = false;
});

const sprintDropdownWrapperRef = ref<HTMLElement | null>(null);
const isSprintDropdownOpen = ref(false);

onClickOutside(sprintDropdownWrapperRef, () => {
  isSprintDropdownOpen.value = false;
});

const showSearchModal = ref(false);

const openSearchModal = () => {
  showSearchModal.value = true;
};

const closeSearchModal = () => {
  showSearchModal.value = false;
};

// filters
const selectedHuddleModule = ref("all");
const isHuddleDropdownOpen = ref(false);
function selectHuddleModule(id: string) {
  selectedHuddleModule.value = id;
  isHuddleDropdownOpen.value = false;
  console.log("Selected Huddle Module:", id);
}

// Computed label for huddle button
const selectedHuddleModuleLabel = computed(() => {
  if (selectedHuddleModule.value === "all") return "All Milestones";

  const module = workspaceData.value?.modules?.find(
    (m: { _id: string; variables: Record<string, any> }) =>
      m._id === selectedHuddleModule.value
  );

  return module?.variables?.["module-title"] || "Select Module";
});

// Selected tab (default to "All")
const selectedMilestoneTab = ref("all");

// Function to select tab
function selectMilestoneTab(value: string) {
  selectedMilestoneTab.value = value;
}
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
