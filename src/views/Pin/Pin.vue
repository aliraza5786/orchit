<template>
  <div
    class="flex-auto flex-grow h-full bg-bg-surface  rounded-[6px] border border-border flex-col flex overflow-hidden"
  >
    <!-- Header -->
    <div class="overflow-x-auto shrink-0 border-b border-border">
      <div class="header px-2 py-2 flex items-center justify-between gap-2">
        <Dropdown
          :inSpace="true"
          v-model="selected_sheet_id"
          :options="transformedData"
          variant="secondary"
          @open="closeAllDropdowns('sheet')"
          @edit-option="openEditSprintModal"
          :canEdit="canEditSheet"
          :canDelete="canDeleteSheet"
          @delete-option="handleDeleteSheetModal"
          :multiple="true"
          ref="sheetDropdownRef"
        >
          <template #more>
            <div
              @click="toggleCreateSheet"
              v-if="canCreateSheet"
              class="capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap"
            >
              <i class="fa-solid fa-plus"></i> Add new
            </div>
          </template>
        </Dropdown>
        <div class="flex gap-3">
          <!-- Grouping -->
          <div v-if="view != 'table'" class="relative flex items-center gap-2">
            <button
              ref="variableTriggerRef"
              @click="toggleVariableDropdown"
              class="flex items-center gap-2 text-nowrap px-3 h-[33px] rounded-md border cursor-pointer bg-bg-transparent hover:border-primary-color transition-all text-xs font-semibold relative"
              :class="
                showVariableDropdown
                  ? 'border-primary-color text-primary-color'
                  : 'border-border text-text-primary'
              "
            >
              <i
                class="fa-solid fa-layer-group text-[14px]"
                :class="
                  showVariableDropdown
                    ? 'text-primary-color'
                    : 'text-primary-color'
                "
              ></i>
              <span class="text-nowrap">Group: {{ selectedViewByLabel }}</span>
            </button>

            <!-- Variable View Dropdown -->
            <VariableViewDropdown
              v-if="showVariableDropdown"
              :triggerRef="variableTriggerRef"
              :options="variables"
              v-model="selected_view_by"
              :canCreateVariable="canCreateVariable"
              :hide-assignee="true"
              @close="showVariableDropdown = false"
              @add-new="
                () => {
                  isCreateVar = true;
                  showVariableDropdown = false;
                }
              "
            />
          </div>
          <!-- Group button for Table View -->
          <div v-if="view === 'table'" class="relative flex items-center gap-2">
            <button
              ref="groupTriggerRef"
              @click="toggleGroupDropdown"
              class="flex items-center gap-2 px-3 h-[33px] rounded-md border cursor-pointer bg-bg-transparent hover:border-primary-color transition-all text-xs font-semibold relative"
              :class="
                showGroupDropdown
                  ? 'border-primary-color text-primary-color'
                  : 'border-border text-text-primary'
              "
            >
              <i
                class="fa-solid fa-layer-group text-[14px]"
                :class="
                  showGroupDropdown
                    ? 'text-primary-color'
                    : 'text-primary-color'
                "
              ></i>
              <span>Group: {{ selectedGroupLabel }}</span>
            </button>

            <!-- Table Group Dropdown -->
            <TableGroupDropdown
              v-if="showGroupDropdown"
              :triggerRef="groupTriggerRef"
              :options="variables"
              :pin="true"
              v-model="selectedGroup"
              @close="showGroupDropdown = false"
            />
          </div>

          <SearchBar
            class="max-w-[250px]"
            @onChange="
              (e) => {
                searchQuery = e;
              }
            "
            placeholder="Search in Orchit AI space"
          >
          </SearchBar>
          <div
            class="flex items-center gap-1 bg-bg-surface/50 h-[36px] px-1.5 border-border border rounded-[6px]"
          >
            <button
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="
                view === 'kanban'
                  ? 'text-white bg-primary-color'
                  : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'
              "
              title="Kanban view"
              @click="view = 'kanban'"
            >
              <i class="fa-solid fa-chart-kanban text-[14px]"></i>
            </button>

            <button
              @click="view = 'table'"
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="
                view === 'table'
                  ? 'text-white bg-primary-color'
                  : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'
              "
              title="List view"
            >
              <i class="fa-solid fa-align-left text-[14px]"></i>
            </button>

            <button
              @click="view = 'mindmap'"
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="
                view === 'mindmap'
                  ? 'text-white bg-primary-color'
                  : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'
              "
              title="MindMap view"
            >
              <i class="fa-solid fa-chart-diagram text-[14px]"></i>
            </button>

            <button
              @click="view = 'gantt'"
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="
                view === 'gantt'
                  ? 'text-white bg-primary-color'
                  : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'
              "
              title="Gantt Chart view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M4 6h2v12H4V6Zm4 4h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h10v2H8V6Z"
                />
              </svg>
            </button>

            <button
              @click="view = 'calendar'"
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="
                view === 'calendar'
                  ? 'text-white bg-primary-color'
                  : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'
              "
              title="Calendar view"
            >
              <i class="fa-regular fa-calendar text-[14px]"></i>
            </button>

            <button
              @click="view = 'timeline'"
              class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
              :class="
                view === 'timeline'
                  ? 'text-white bg-primary-color'
                  : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'
              "
              title="Timeline view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M4 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm16 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0-16a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z"
                  opacity="0"
                />
                <path
                  d="M4 12h4m8 0h4M9 12h6M9 12v-6M15 12v6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- Kanban Skeleton -->
    <KanbanSkeleton v-show="isListPending && view === 'kanban'" />

    <!-- Kanban Board -->
    <div
      v-show="!isListPending"
      class="flex overflow-x-auto custom_scroll_bar gap-2 pt-2 h-full mx-2"
      v-if="view === 'kanban'"
    >
      <KanbanBoard
        @onPlus="plusHandler"
        @delete:column="deleteHandler"
        @update:column="handleUpdateColumn"
        @reorder="onReorder"
        @addColumn="handleAddColumn"
        @select:ticket="selectCardHandler"
        @onBoardUpdate="handleBoardUpdate"
        :board="filteredBoard"
        :variable_id="selected_view_by"
        :sheet_id="selected_sheet_id"
      >
        <template #ticket="{ ticket }">
          <KanbanCard
            @click="handleClickTicket(ticket)"
            :ticket="ticket"
            :moduleId="moduleId"
            :workspaceId="workspaceId"
          />
        </template>

        <template #emptyState="{ column }">
          <div class="flex flex-col items-center justify-center gap-2 py-10">
            <img src="../../assets/emptyStates/pin.png" alt="" />
            <h1 class="text-sm text-text-primary mt-2">
              Start creating your pins
            </h1>
            <p class="text-sm text-text-secondary mb-2 text-center">
              Create pins and add your ideas into the related pins.
            </p>
            <Button
              :inSpace="true"
              :disabled="!canCreateVariable"
              size="sm"
              @click="plusHandler(column)"
              >Create Pin</Button
            >
          </div>
        </template>
      </KanbanBoard>
      <!-- Add List Section -->
      <div
        class="min-w-[270px]"
        v-if="view === 'kanban' && isStatusView"
        @click.stop
      >
        <div v-if="activeAddList" class="bg-bg-body rounded-lg p-4">
          <BaseTextField
            :autofocus="true"
            v-model="newColumn"
            placeholder="Add New list"
            @keyup.enter="emitAddColumn"
          />
          <p class="text-xs mt-1.5">You can add details while editing</p>
          <div class="flex items-center mt-3 gap-3">
            <Button
              @click="emitAddColumn"
              variant="primary"
              class="px-3 py-1 bg-primary-color hover:bg-primary-color cursor-pointer text-white rounded"
            >
              {{ addingList ? "Adding..." : "Add list" }}
            </Button>
            <i class="fa-solid fa-close" @click="toggleAddList"></i>
          </div>
        </div>
        <button
          v-else
          class="text-sm text-text-primary py-2.5 font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
          :class="!canCreateVariable ? 'cursor-not-allowed' : 'cursor-pointer'"
          @click.stop="toggleAddList"
          :disabled="!canCreateVariable"
        >
          + Add List
        </button>
      </div>
    </div>
    <template v-if="view == 'table'">
      <div class="ps-4 pe-4 overflow-auto">
        <TableView
          ref="tableViewRef"
          :columns="columns"
          :isCreating="isAddingTicket"
          :isPending="
            isListPending ||
            isFlatTablePending ||
            (!!selectedGroup && isTablePending)
          "
          @addVar="
            () => {
              isCreateVar = true;
            }
          "
          :rows="tableRows"
          :groups="tableGroups"
          :isGrouped="!!selectedGroup"
          :selectedGroup="selectedGroup"
          :canCreate="canCreateCard"
          :canCreateVariable="canCreateVariable"
          :canDelete="canDeleteCard"
          :totalCount="totalTableCount"
          :totalTotal="totalTableTotal"
          @create="handleCreateTicket"
          @quickCreate="handleQuickCreate"
          @refresh="refreshTable"
          @update:rows="handleTableRowsUpdate"
          @delete="handleTableDelete"
        />
      </div>
    </template>
    <div
      v-if="view === 'mindmap'"
      class="relative flex-1 h-full min-h-0 p-2 overflow-hidden"
    >
      <div
        v-if="isListPending"
        class="absolute inset-0 z-20 flex items-center justify-center bg-bg-card/60 backdrop-blur-[2px]"
      >
        <div class="flex flex-col items-center gap-3">
          <i
            class="fa-solid fa-spinner fa-spin text-primary-color text-3xl"
          ></i>
          <span class="text-sm font-medium text-text-secondary italic"
            >Mapping your data...</span
          >
        </div>
      </div>
      <PinMindmapView
        :listsData="filteredBoard ?? []"
        :workspaceId="String(workspaceId)"
        :moduleId="String(moduleId)"
        :canCreateCard="canCreateCard"
        :canEditCard="canEditCard"
        :canDeleteCard="canDeleteCard"
        :canAssignCard="canAssignCard"
        :canCreateSheet="canCreateSheet"
        :canCreateVariable="canCreateVariable"
        :canEditSheet="canEditSheet"
        @update:card="handleMindmapUpdateCard"
        @select:ticket="selectCardHandler"
        @delete:ticket="(id) => openDeleteModal(id)"
        @create:card="(payload) => handleMindmapCreateCard(payload)"
      />
    </div>
    <!-- <template v-if="view === 'calendar'">
      <CalendarView :data="filteredBoard" @select:ticket="selectCardHandler" />
    </template> -->
    <!-- ── Gantt View ──────────────────────────────────────────────────────── -->
    <!-- <template v-if="view === 'gantt'">
      <GanttChartView
        :data="filteredBoard"
        @select:ticket="selectCardHandler"
      />
    </template> -->

    <!-- ── Timeline View ───────────────────────────────────────────────────── -->
    <!-- <template v-if="view === 'timeline'">
      <TimelineView :data="filteredBoard" @select:ticket="selectCardHandler" />
    </template> -->

    <!-- ── Custom Calendar View ─────────────────────────────────────────────── -->
    <template v-if="view === 'calendar'">
      <CustomCalendarView
        :data="timelineData"
        @select:ticket="selectCardHandler"
      />
    </template>

    <!-- ── Gantt View ───────────────────────────────────────────────────────── -->
    <template v-if="view === 'gantt'">
      <CustomGanttChart
        :data="timelineData"
        :loading="isAddingTicket"
        @select:ticket="selectCardHandler"
        @create:ticket="handleCreateTicket"
        @update:ticket="handleUpdateTicket"
      />
    </template>

    <!-- ── Custom Timeline View ─────────────────────────────────────────────── -->
    <template v-if="view === 'timeline'">
      <CustomTimelineView
        :data="timelineData"
        :loading="isAddingTicket"
        @select:ticket="selectCardHandler"
        @create:ticket="handleCreateTicket"
        @update:ticket="handleUpdateTicket"
      />
    </template>

    <!-- Modals -->
    <ConfirmDeleteModal
      v-model="showDelete"
      title="Delete List"
      itemLabel="list"
      :itemName="localColumnData?.title"
      :requireMatchText="localColumnData?.title"
      confirmText="Delete List"
      cancelText="Cancel"
      size="md"
      :loading="addingList"
      @confirm="handleDeleteColumn"
      @cancel="() => (showDelete = false)"
    />
    <ConfirmDeleteModal
      v-model="showDeleteTicket"
      title="Delete Ticket"
      itemLabel="Ticket"
      :itemName="localColumnData?.title"
      :requireMatchText="localColumnData?.title"
      confirmText="Delete Ticket"
      cancelText="Cancel"
      size="md"
      :loading="isDeletingTicket"
      @confirm="handleDeleteCard"
      @cancel="() => (showDeleteTicket = false)"
    />
    <CreateTaskModal
      size="md"
      :pin="true"
      :selectedVariable="selected_view_by"
      :listId="localColumnData?.title"
      :sheet_id="selected_sheet_id"
      v-if="createTeamModal"
      key="createTaskModalKey"
      v-model="createTeamModal"
      :sheetVariables="variables"
    />

    <CreateSheetModal
      :sheet="selectedSheettoAction"
      size="md"
      v-model="isCreateSheetModal"
    />
    <CreateVariableModal
      v-if="isCreateVar"
      v-model="isCreateVar"
      :sheetID="selected_sheet_id"
      :tableView="view === 'table'"
    />
    <ConfirmDeleteModal
      @click.stop=""
      v-model="showDeleteModal"
      title="Delete Sheet"
      itemLabel="Sheet"
      :itemName="selectedSheettoAction?.title"
      :requireMatchText="selectedSheettoAction?.title"
      confirmText="Delete Sheet"
      cancelText="Cancel"
      size="md"
      :loading="isDeleting"
      @confirm="handleDeleteSheet"
      @cancel="
        () => {
          showDeleteModal = false;
        }
      "
    />
  </div>
  <SidePanel
    v-if="selectedTicketId"
    :details="selectedCard"
    :showPanel="!!selectedCard?._id"
    :pin="true"
    :moduleId="moduleId"
    moduleName="pin"
    @close="() => selectCardHandler({ variables: {} })"
  />
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, watch, h } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { useWorkspaceStore } from "../../stores/workspace";
import {
  useAddList,
  useSheetList,
  useSheets,
  useVariables,
  ReOrderList,
  ReOrderCard,
  useUpdateWorkspaceSheet,
  useAddTicket,
  useMoveCard,
  useLanes,
  useTableCards,
} from "../../queries/useSheets";
import { useRouteIds } from "../../composables/useQueryParams";

// Components
import Dropdown from "../../components/ui/Dropdown.vue";
import BaseTextField from "../../components/ui/BaseTextField.vue";
import Button from "../../components/ui/Button.vue";
import KanbanCard from "./components/KanbanCard.vue";
import KanbanSkeleton from "../../components/skeletons/KanbanSkeleton.vue";
import CreateTaskModal from "../Product/modals/CreateTaskModal.vue";
import SidePanel from "../Product/components/SidePanel.vue";
import CreateSheetModal from "../Product/modals/CreateSheetModal.vue";
import { useAuthStore } from "../../stores/auth";
import { getInitials } from "../../utilities";
import { avatarColor } from "../../utilities/avatarColor";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import { request, toApiMessage } from "../../libs/api";
import SearchBar from "../../components/ui/SearchBar.vue";
import PinMindmapView from "../Pin/components/MindMap.vue";
import TableView from "../../components/feature/TableView/TableView.vue";
// import CalendarView from "../../components/feature/CalendarView.vue";
// import GanttChartView from "../../components/feature/GanttChartView.vue";
// import TimelineView from "../../components/feature/TimelineView.vue";
import { useSidePanelStore } from "../../stores/sidePanelStore";
import { useAgentStore } from "../../stores/agentStore";
const TableSearchCell = defineAsyncComponent(
  () => import("../../components/feature/TableView/TableSearchCell.vue"),
);
const ConfirmDeleteModal = defineAsyncComponent(
  () => import("../Product/modals/ConfirmDeleteModal.vue"),
);
const CreateVariableModal = defineAsyncComponent(
  () => import("../Product/modals/CreateVariableModal.vue"),
);
const KanbanBoard = defineAsyncComponent(
  () => import("../../components/feature/kanban/KanbanBoard.vue"),
);
const TableGroupDropdown = defineAsyncComponent(
  () => import("../Product/components/TableGroupDropdown.vue"),
);
const VariableViewDropdown = defineAsyncComponent(
  () => import("../Product/components/VariableViewDropdown.vue"),
);
const CustomTimelineView = defineAsyncComponent(
  () => import("../../components/feature/CustomTimelineView.vue"),
);
const CustomGanttChart = defineAsyncComponent(
  () => import("../../components/feature/CustomGanttChart.vue"),
);
const CustomCalendarView = defineAsyncComponent(
  () => import("../../components/feature/CustomCalendarView.vue"),
);
import {
  updateCardInStructure,
  performOptimisticUpdate,
  rollbackOptimisticUpdate,
} from "../../utilities/cacheSync";

import { usePermissions } from "../../composables/usePermissions";
import { toast } from "vue-sonner";
const {
  canEditSheet,
  canDeleteSheet,
  canCreateVariable,
  canCreateSheet,
  canCreateCard,
  canDeleteCard,
  canAssignCard,
  canEditCard,
} = usePermissions();

// State
const isCreateVar = ref(false);
const isCreateSheetModal = ref(false);
const createTeamModal = ref(false);
const showDelete = ref(false);
const showDeleteTicket = ref(false);

const showVariableDropdown = ref(false);
const variableTriggerRef = ref<HTMLElement | null>(null);

const showGroupDropdown = ref(false);
const groupTriggerRef = ref<HTMLElement | null>(null);
const selectedGroup = ref<any | null>(null);

const localColumnData = ref<any>();
const activeAddList = ref(false);
const newColumn = ref("");
const selectedCard = ref<{ _id: any; variables: any }>();
const localList = ref<any>([]);
const view = ref("kanban");
// Routing & Stores
const route = useRoute();
const router = useRouter();
const { workspaceId, moduleId } = useRouteIds();
const workspaceStore = useWorkspaceStore();
const queryClient = useQueryClient();
const selectedTicketId = ref("");
const isDeletingTicket = ref(false);
const agentStore = useAgentStore();
const sidePanelStore = useSidePanelStore();

const sheetDropdownRef = ref<any>(null);
// Variables & Sheets
// Sheets Data
const { data, refetch: refetchSheets } = useSheets(
  { workspace_id: workspaceId, workspace_module_id: moduleId },
  { onSuccess: () => refetchList() },
);
const sheetId = computed(() => (data.value ? data.value[0]?._id : ""));
const sheetTitle = computed(() =>
  data.value ? data.value[0]?.variables?.["sheet-title"] : "",
);
const authStore = useAuthStore();
const pendingCreations = ref(new Set<string | number>());
const localTableOrder = ref<any[]>([]);

const selected_sheet_id = ref<any>([]);
const { data: variables } = useVariables(
  workspaceId,
  moduleId,
  selected_sheet_id,
);
const viewBy = computed(() => variables.value?.[0]?._id ?? "");
const selected_view_by = ref(viewBy.value);
watch(viewBy, (val) => (selected_view_by.value = val));

const storageKey = computed(
  () => `pin_selected_sheets_${workspaceId.value}_${moduleId.value}`,
);

const isStatusView = computed(() => {
  if (
    selected_view_by.value === "owner" ||
    selected_view_by.value === "assignee"
  )
    return false;

  const v = selectedViewByVariable.value;
  if (!v) return false;

  // Match slug or title
  const slug = v.slug?.toLowerCase() || "";
  const title = v.title?.toLowerCase() || "";

  return (
    slug === "pin-list" ||
    slug === "status" ||
    title === "pin list" ||
    slug === "card-status"
  );
});

watch(
  data,
  (sheets) => {
    if (!sheets?.length) return;

    const currentVal = Array.isArray(selected_sheet_id.value)
      ? selected_sheet_id.value
      : [selected_sheet_id.value].filter(Boolean);
    const validCurrent = currentVal.filter(
      (id: string) => id === "all" || sheets.some((s: any) => s._id === id),
    );

    if (validCurrent.length > 0) {
      if (validCurrent.length !== currentVal.length) {
        selected_sheet_id.value = validCurrent;
      }
      return;
    }

    const stored = localStorage.getItem(storageKey.value);
    const storedIds = stored ? JSON.parse(stored) : [];
    const validIds = storedIds.filter(
      (id: string) => id === "all" || sheets.some((s: any) => s._id === id),
    );

    if (validIds.length > 0) {
      selected_sheet_id.value = validIds;
    } else {
      // Default to 'General' if exists, otherwise first sheet
      const general = sheets.find(
        (s: any) => s.variables?.["sheet-title"]?.toLowerCase() === "general",
      );
      selected_sheet_id.value = [general?._id || sheets[0]._id];
    }
  },
  { immediate: true },
);

watch(selected_sheet_id, (newVal) => {
  if (Array.isArray(newVal)) {
    localStorage.setItem(storageKey.value, JSON.stringify(newVal));
  }
});

const formattedExtraParams = computed(() => ({}));

const kanbanActiveVariableId = computed(() => {
  const val = selected_view_by.value;
  if (val === "owner" || val === "assignee") return "";

  return val;
});

const kanbanActiveVariableSlug = computed(() => {
  if (selected_view_by.value === "owner") return "created_by";
  if (selected_view_by.value === "assignee") return "assigned_to";
  return "";
});

const kanbanGroupExtraParams = computed(() => {
  const base = formattedExtraParams.value || {};
  const result: any = { ...base, variable_id: kanbanActiveVariableId.value };
  if (kanbanActiveVariableSlug.value) {
    result.variable_slug = kanbanActiveVariableSlug.value;
  }
  return result;
});

const {
  data: Lists,
  isPending: isListPending,
  refetch: refetchList,
} = useSheetList(
  moduleId,
  selected_sheet_id,
  computed(() => [...workspaceStore.selectedLaneIds]),
  kanbanActiveVariableId,
  kanbanGroupExtraParams,
);

const toggleVariableDropdown = () => {
  showVariableDropdown.value = !showVariableDropdown.value;
};

const toggleGroupDropdown = () => {
  showGroupDropdown.value = !showGroupDropdown.value;
};

const selectedViewByVariable = computed(() => {
  return variables.value?.find((v: any) => v._id === selected_view_by.value);
});

const selectedViewByLabel = computed(() => {
  if (selected_view_by.value === "owner") return "Owner/Reporter";
  if (selected_view_by.value === "assignee") return "Assignee";
  return selectedViewByVariable.value?.title || "None";
});

const selectedGroupLabel = computed(() => {
  if (selectedGroup.value === "owner") return "Owner/Reporter";
  if (selectedGroup.value === "assignee") return "Assignee";
  return selectedGroup.value?.title || "None";
});

// ─── Dedicated flat Table View data (no variable_id = no grouping shuffle) ─────
const { data: FlatTableData, isPending: isFlatTablePending } = useTableCards(
  moduleId,
  selected_sheet_id,
  computed(() => [...workspaceStore.selectedLaneIds]),
  formattedExtraParams,
);

const tableActiveVariableId = computed(() => {
  const group = selectedGroup.value;
  if (!group) return "";

  const groupId = typeof group === "string" ? group : group?._id;
  if (groupId === "assignee" || groupId === "owner") return "";

  return groupId || "";
});

// Maps group selections that use variable_slug instead of variable_id
const tableActiveVariableSlug = computed(() => {
  const group = selectedGroup.value;
  const groupId = typeof group === "string" ? group : group?._id;

  if (groupId === "assignee") return "assigned_to";
  if (groupId === "owner") return "created_by";
  return "";
});

// Extra params for the grouped table query
const tableGroupExtraParams = computed(() => {
  const base = formattedExtraParams.value || {};
  const result: any = { ...base };
  if (tableActiveVariableSlug.value) {
    result.variable_slug = tableActiveVariableSlug.value;
  }
  // If we have a regular variable ID, ensure it's in the payload too
  if (tableActiveVariableId.value) {
    result.variable_id = tableActiveVariableId.value;
  }
  return result;
});

const { data: TableGroupedLists, isPending: isTablePending } = useSheetList(
  moduleId,
  selected_sheet_id,
  computed(() => [...workspaceStore.selectedLaneIds]),
  tableActiveVariableId,
  tableGroupExtraParams, // uses variable_slug for assignee/owner, falls back to regular extra params
);

// ─── View & Grouping Synchronization ──────────────────────────────────────────
// Sync Table grouping selection to Kanban view for consistency
watch(selectedGroup, (newGroup: any) => {
  if (newGroup?._id && selected_view_by.value !== newGroup._id) {
    selected_view_by.value = newGroup._id;
  }
});

const refreshTable = () => {
  queryClient.invalidateQueries({ queryKey: ["sheets"] });
  queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
  queryClient.invalidateQueries({ queryKey: ["table-cards-flat"] });
  toast.success("Data refreshed");
};

watch(Lists, (newLists) => {
  localList.value = Array.isArray(newLists)
    ? JSON.parse(JSON.stringify(newLists))
    : [];
});

onMounted(() => {
  localList.value = Array.isArray(Lists.value)
    ? JSON.parse(JSON.stringify(Lists.value))
    : [];
  openPanelFromRoute();
});

watch(
  () => route.query.card_id,
  () => openPanelFromRoute(),
);

async function openPanelFromRoute() {
  const cardId = route.query.card_id as string;
  if (!cardId) return;
  handleClickTicket({ _id: cardId });
}

const { data: lanes } = useLanes(workspaceId);
const laneOptions = computed<any[]>(() => {
  const mainOption = { _id: "Main", title: "Main" };
  const dynamicOptions = (lanes?.value ?? []).map((el: any) => ({
    ...el,
    _id: el._id,
    title: el?.variables?.["lane-title"] ?? String(el._id),
  }));
  return [mainOption, ...dynamicOptions];
});

// Add List Logic
const { mutate: addList, isPending: addingList } = useAddList({
  onSuccess: (data: any, payload: any) => {
    if (payload.is_trash) {
      localList.value = localList.value.filter(
        (e: any) => e.title !== payload.value,
      );
      showDelete.value = false;
    } else {
      localList.value = [...localList.value, { title: data?.value }];
    }
    activeAddList.value = false;

    newColumn.value = "";
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    Object.assign({ newColumn: "", showDelete: false, activeAddList: false });
  },
});

function handleAddColumn(value: string) {
  addList({
    workspace_id: workspaceId.value,
    module_id: moduleId.value,
    variable_id: selected_view_by.value,
    value,
  });
}

function emitAddColumn() {
  const trimmed = newColumn.value.trim();
  if (trimmed) handleAddColumn(trimmed);
}

function handleUpdateColumn({ title, oldTitle }: any) {
  addList({
    workspace_id: route.params.id,
    module_id: route.params.module_id,
    new_value: title,
    value: oldTitle,
    variable_id: selected_view_by.value,
  });
}

// Delete Column Logic
function handleDeleteColumn() {
  addList({
    value: localColumnData.value.title,
    workspace_id: workspaceId.value,
    module_id: moduleId.value,
    newValue: localColumnData.value.title,
    variable_id: selected_view_by.value,
    is_trash: true,
  });
}

function deleteHandler(e: any) {
  showDelete.value = true;
  localColumnData.value = e;
}

// Reorder Logic
const reorderList = ReOrderList();
const reorderCard = ReOrderCard();

function onReorder(a: any) {
  const { type, meta } = a;
  if (type === "column") {
    reorderList.mutate({
      payload: {
        workspace_id: workspaceId.value,
        workspace_module_id: moduleId.value,
        variable_id: selected_view_by.value,
        moved_value: meta.id,
        new_index: meta.newIndex,
      },
    });
  } else {
    reorderCard.mutate({
      payload: {
        workspace_id: workspaceId.value,
        card_id: meta.moved._id,
        group_value: meta.fromColumnId,
        group_variable_id: selected_view_by.value,
        new_index: meta.newIndex,
        sheet_id: selected_sheet_id.value,
      },
    });
  }
}

function handleBoardUpdate(_: any) {}

function selectCardHandler(card: any) {
  selectedTicketId.value = card?._id;
  selectedCard.value = card;

  // Clean up card_id query param if present
  if (route.query.card_id) {
    const query = { ...route.query };
    delete query.card_id;
    router.replace({ query });
  }
}

function handleClickTicket(ticket: any) {
  selectedTicketId.value = ticket?._id;
  selectedCard.value = ticket;

  // Clean up card_id query param if present
  if (route.query.card_id) {
    const query = { ...route.query };
    delete query.card_id;
    router.replace({ query });
  }
}

function plusHandler(e: any) {
  createTeamModal.value = true;
  localStorage.setItem("selectedStatusTitle", e?.title);
  localColumnData.value = e;
}
const moveCard = useMoveCard({
  onMutate: async (newPayload: any) => {
    const { card_id } = newPayload;
    await queryClient.cancelQueries({ queryKey: ["sheet-list"] });
    const previousLists = queryClient.getQueryData(["sheet-list"]);

    queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
      return updateCardInStructure(old, card_id, newPayload);
    });

    return { previousLists };
  },

  onSuccess: (serverCard: any, variables: any) => {
    const cardId = variables.card_id;
    if (serverCard) {
      queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
        return updateCardInStructure(old, cardId, serverCard);
      });
    }
  },

  onError: (_err: any, _variables: any, context: any) => {
    if (context?.previousLists) {
      queryClient.setQueryData(["sheet-list"], context.previousLists);
    }
  },

  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    queryClient.invalidateQueries({ queryKey: ["table-cards-flat"] });
  },
});
function handleMindmapUpdateCard(payload: any) {
  moveCard.mutate(payload);
}
function toggleCreateSheet() {
  sheetDropdownRef.value?.closeDropdown();
  selectedSheettoAction.value = {};
  isCreateSheetModal.value = !isCreateSheetModal.value;
}

function toggleAddList() {
  activeAddList.value = !activeAddList.value;
}
const sheetName = ref("");
const transformedData = computed(() => {
  const alwaysAllowed = ["general"];

  const filteredSheets = (data.value || []).filter((item: any) => {
    const title = item?.variables?.["sheet-title"]?.toLowerCase();
    const source = item?.user_permissions?.source?.toLowerCase();

    if (alwaysAllowed.includes(title)) return true;
    if (source === "owner") return true;
    if (source === "shared" && item?.user_permissions?.can_read) return true;

    return false;
  });

  const options = filteredSheets.map((item: any) => ({
    _id: item._id,
    title: item.variables["sheet-title"],
    description: item.variables["sheet-description"],
    icon: item.icon,
    disableDelete: item.variables["sheet-title"]?.toLowerCase() === "general",
    hideActions: false,
    user_permissions: item.user_permissions,
  }));

  if (options.length > 1) {
    options.unshift({
      _id: "all",
      title: "All sheet",
      icon: { prefix: "fa-solid", iconName: "fa-layer-group" },
      hideActions: true,
    } as any);
  }
  return options;
});
watch(
  selected_sheet_id,
  (newVal, oldVal) => {
    if (!newVal || (Array.isArray(newVal) && newVal.length === 0)) {
      if (data.value && data.value.length > 0) {
        selected_sheet_id.value = [data.value[0]._id];
      }
      return;
    }

    // Handle "All sheet" logic: mutual exclusivity
    if (Array.isArray(newVal)) {
      const hadAll =
        oldVal === "all" || (Array.isArray(oldVal) && oldVal.includes("all"));
      const hasAll = newVal.includes("all");
      let finalVal = [...newVal];

      if (hasAll && !hadAll) {
        finalVal = ["all"];
      } else if (hasAll && newVal.length > 1) {
        finalVal = newVal.filter((id) => id !== "all");
      }

      if (JSON.stringify(newVal) !== JSON.stringify(finalVal)) {
        selected_sheet_id.value = finalVal;
        return;
      }
    }

    const currentId = Array.isArray(newVal) ? newVal[0] : newVal;
    const selectedSheet = transformedData.value.find(
      (item: any) => item._id === currentId,
    );
    if (selectedSheet) {
      agentStore.saveSelectedSheetTitle(selectedSheet.title);
      agentStore.saveSelectedSheetId(currentId);
      sheetName.value = selectedSheet.title || "";
    } else if (currentId === "all") {
      agentStore.saveSelectedSheetTitle("All sheet");
      agentStore.saveSelectedSheetId("all");
      sheetName.value = "All sheet";
    } else {
      agentStore.saveSelectedSheetTitle(sheetTitle.value);
      agentStore.saveSelectedSheetId(sheetId.value);
      sheetName.value = "";
    }
  },
  { immediate: true },
);
const showDeleteModal = ref(false);
const selectedSheettoAction = ref<any>();
const closeAllDropdowns = (except: string) => {
  if (except !== "sheet") {
    sheetDropdownRef.value?.closeDropdown();
  }
  if (except !== "variable") {
    showVariableDropdown.value = false;
  }
  if (except !== "group") {
    showGroupDropdown.value = false;
  }
};

const { mutate: updateSheet, isPending: isDeleting } = useUpdateWorkspaceSheet({
  onSuccess: () => {
    showDeleteModal.value = false;
    refetchSheets();
    refetchList();
  },
});
function handleDeleteSheetModal(opt: any) {
  showDeleteModal.value = true;
  selectedSheettoAction.value = opt;
}
function handleDeleteSheet() {
  updateSheet({
    sheet_id: selectedSheettoAction.value?._id,
    workspace_module_id: moduleId.value,
    is_trash: true,
  });
}
function openEditSprintModal(opt: any) {
  isCreateSheetModal.value = true;
  selectedSheettoAction.value = opt;
}

const searchQuery = ref("");
const debouncedQuery = ref("");

watch(
  searchQuery,
  debounce((val: any) => {
    debouncedQuery.value = val;
  }, 200),
);

// Helper: flatten cards from the /workspace/cards/grouped response.
const flattenSheetListCards = (apiData: any): any[] => {
  if (!apiData) return [];
  const target = apiData.data || apiData;
  // Flat response (no variable_id): root-level cards array
  if (Array.isArray(target.cards)) return target.cards;
  // Grouped response: flatten sheets[].sheet_lists[].cards
  const all: any[] = [];
  (target.sheets ?? []).forEach((sheet: any) => {
    (sheet.sheet_lists ?? []).forEach((list: any) => {
      (list.cards ?? []).forEach((card: any) => {
        all.push({
          ...card,
          columnId: list.title,
        });
      });
    });
  });
  return all;
};

// computed filtered board
const fuse = computed(() => {
  const allCards = flattenSheetListCards(Lists.value);

  return new Fuse(allCards, {
    keys: ["card-title", "card-description"],
    threshold: 0.3,
  });
});

const filteredBoard = computed(() => {
  const target = Lists.value?.data || Lists.value || {};
  const sheets = target.sheets || [];

  if (!sheets.length) return [];

  // Merge columns by title across all sheets to support multi-sheet Kanban
  const columnMap = new Map<string, any>();

  sheets.forEach((sheet: any) => {
    (sheet.sheet_lists || []).forEach((list: any) => {
      if (!columnMap.has(list.title)) {
        columnMap.set(list.title, {
          ...list,
          cards: [...(list.cards || [])],
        });
      } else {
        const existing = columnMap.get(list.title);
        // Merge cards, avoiding duplicates if any
        const existingIds = new Set(existing.cards.map((c: any) => c._id));
        (list.cards || []).forEach((c: any) => {
          if (!existingIds.has(c._id)) {
            existing.cards.push(c);
            existingIds.add(c._id);
          }
        });
      }
    });
  });

  const mergedLists = Array.from(columnMap.values());

  // Include local pending tickets in their respective columns
  if (localPendingTickets.value.length > 0) {
    localPendingTickets.value.forEach((pending) => {
      // Logic for where to put pending tickets in Kanban:
      // In Pin module, we often use 'General' or the first column
      const targetCol =
        mergedLists.find((l) => l.title === "General") || mergedLists[0];
      if (targetCol) {
        if (
          !targetCol.cards.some(
            (c: any) => c.id === pending.id || c._id === pending.id,
          )
        ) {
          targetCol.cards.unshift(pending);
        }
      }
    });
  }

  const query = debouncedQuery.value?.trim();
  if (!query) {
    return mergedLists;
  }

  const results = fuse.value.search(query).map((r: any) => r.item);

  return mergedLists.map((col: any) => {
    const filteredCards = results.filter((c: any) => c.columnId === col.title);
    return { ...col, cards: filteredCards };
  });
});

const timelineData = computed(() => {
  return filteredBoard.value.map((column: any) => {
    return {
      ...column,
      cards: column.cards?.map((card: any) => {
        let start = card.variables?.["start-date"] || card["start-date"];
        let end = card.variables?.["end-date"] || card["end-date"];

        if (!start) {
          start = card.createdAt || new Date().toISOString();
        }
        if (!end) {
          const startDate = new Date(start);
          startDate.setDate(startDate.getDate() + 2);
          end = startDate.toISOString();
        }

        return {
          ...card,
          "start-date": start,
          "end-date": end,
        };
      }),
    };
  });
});

const tableRows = computed(() => {
  const query = debouncedQuery.value?.trim();
  const allCards = flattenSheetListCards(FlatTableData.value);
  let rows: any[] = [...allCards];

  if (!query) {
    if (localTableOrder.value.length > 0) {
      const cardMap = new Map();
      rows.forEach((c: any) => cardMap.set(c._id, c));
      localPendingTickets.value.forEach((c: any) =>
        cardMap.set(c.id || c._id, c),
      );

      const ordered = localTableOrder.value
        .map((id) => cardMap.get(id))
        .filter(Boolean);

      const returnedIds = new Set(ordered.map((c) => c._id || c.id));

      const extras = [
        ...rows.filter((c: any) => !returnedIds.has(c._id)),
        ...localPendingTickets.value.filter(
          (c: any) => !returnedIds.has(c.id || c._id),
        ),
      ];
      return [...ordered, ...extras];
    }

    return [...rows, ...localPendingTickets.value];
  }

  const fuseTable = new Fuse(flattenSheetListCards(FlatTableData.value), {
    keys: ["card-title", "card-description"],
    threshold: 0.3,
  });
  const results = fuseTable.search(query).map((r: any) => r.item);
  return [...results, ...localPendingTickets.value];
});

const tableGroups = computed(() => {
  // Only populate when a group is actively selected
  if (!selectedGroup.value) return [];

  const target = TableGroupedLists.value?.data || TableGroupedLists.value || {};
  const sheets = target.sheets || [];

  if (!sheets.length) return [];

  // Merge columns across sheets for multi-sheet Table grouping
  const columnMap = new Map<string, any>();
  sheets.forEach((sheet: any) => {
    (sheet.sheet_lists || []).forEach((list: any) => {
      if (!columnMap.has(list.title)) {
        columnMap.set(list.title, {
          ...list,
          cards: [...(list.cards || [])],
        });
      } else {
        const existing = columnMap.get(list.title);
        const existingIds = new Set(existing.cards.map((c: any) => c._id));
        (list.cards || []).forEach((c: any) => {
          if (!existingIds.has(c._id)) {
            existing.cards.push(c);
            existingIds.add(c._id);
          }
        });
      }
    });
  });

  const mergedGroups = Array.from(columnMap.values());
  const query = debouncedQuery.value?.trim();

  if (!query) return mergedGroups;

  const fuseTable = new Fuse(
    mergedGroups.flatMap((col: any) =>
      (col.cards || []).map((c: any) => ({ ...c, columnId: col.title })),
    ),
    { keys: ["card-title", "card-description"], threshold: 0.3 },
  );
  const results = fuseTable.search(query).map((r: any) => r.item);

  return mergedGroups.map((col: any) => ({
    ...col,
    cards: results.filter((c: any) => c.columnId === col.title),
  }));
});

const totalTableCount = computed(() => {
  if (selectedGroup.value) {
    return tableGroups.value.reduce(
      (acc: number, group: any) => acc + (group.cards?.length || 0),
      0,
    );
  }
  return tableRows.value.length;
});

const totalTableTotal = computed(() => {
  const currentData = selectedGroup.value
    ? TableGroupedLists.value
    : FlatTableData.value;
  const cards = flattenSheetListCards(currentData);
  return cards.length + localPendingTickets.value.length;
});

const columns = computed(() => {
  const variableList = variables.value || [];
  return [
    {
      key: "card-title",
      label: "Title",
      render: ({ row, value }: any) =>
        h("div", { class: "flex items-center gap-1 w-full ps-2" }, [
          row._id
            ? h(
                "a",
                {
                  class:
                    "text-[12px] underline text-blue-500 shrink-0 overflow-ellipsis cursor-pointer",
                  onClick: (e: Event) => {
                    e.stopPropagation();
                    handleClickTicket(row);
                  },
                },
                row["card-code"] || "Link",
              )
            : null,
          h("div", { class: "flex-1 min-w-0" }, [
            h("input", {
              class:
                "text-[12px] w-full overflow-ellipsis capitalize p-1 focus:border border-primary-color/60 rounded-sm focus:outline-none focus:ring-1 focus:ring-primary-color bg-transparent focus:bg-bg-body h-8",
              value: row["card-title"] || value,
              placeholder: "Enter title...",
              disabled: !canEditCard.value,
              onInput: (e: any) => {
                row["card-title"] = e.target.value;
              },
              onBlur: (e: any) => {
                if (row._id) {
                  // Existing server row — update in place
                  handleChangeTicket(row, "card-title", e.target.value);
                } else {
                  // New temp row — attempt to create
                  row["card-title"] = e.target.value;
                  checkAndCreateTicket(row);
                }
              },
              onKeydown: (e: KeyboardEvent) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              },
            }),
          ]),
        ]),
    },
    {
      key: "lane",
      label: "Tab",
      render: ({ row, value }: any) =>
        h(TableSearchCell, {
          options: laneOptions.value ?? [],
          modelValue:
            row.lane?._id ||
            row.workspace_lane_id ||
            value?._id ||
            value ||
            "Main",
          "onUpdate:modelValue": (val: any) => setLane(row, val),
          displayField: "title",
          disabled: !canEditCard.value,
          placeholder: "Select tab",
          emptyText: "Tab",
        }),
    },
    {
      key: "created_by",
      label: "Owner",
      render: ({ value }: any) =>
        h("div", { class: "capitalize flex items-center gap-2 px-3" }, [
          h("div", { class: "rounded-full" }, [
            value?.u_profile_image
              ? h("img", {
                  class: "w-6 h-6 rounded-full",
                  src: value?.u_profile_image,
                })
              : h(
                  "div",
                  {
                    class:
                      "w-5 h-5 rounded-full flex justify-center items-center text-[11px]",
                    style: `background:${value?.u_full_name ? avatarColor({ name: value.u_full_name, email: value.u_email }) : ""}`,
                  },
                  getInitials(value?.u_full_name),
                ),
          ]),
          h("span", { class: "text-[12px]" }, value ? value?.u_full_name : ""),
        ]),
    },
    // {
    //   key: "seat",
    //   label: "Assignee",
    //   render: ({ row, value }: any) =>
    //     h(TableAssigneeCell, {
    //       class: "capitalize flex items-center gap-2",
    //       onAssign: (users: any[]) => assignHandle(row, users),
    //       assigneeId: row.seats || row.seat_id || value,
    //       seat: row.seats || row.seat || value,
    //       name: true,
    //       disabled: !canAssignCard.value,
    //       emptyText: "Assignee",
    //     }),
    // },
    ...(variableList
      ?.filter((e: any) => e?.type?.title === "Select")
      .map((e: any) => ({
        key: e?.slug,
        label: e?.slug,
        render: ({ row, value }: any) => {
          let cellValue = value;
          if (Array.isArray(row?.variables)) {
            const found = row.variables.find((v: any) => v.slug === e.slug);
            if (found) cellValue = found.value;
          } else {
            cellValue = row?.variables?.[e.slug] ?? row?.[e.slug] ?? value;
          }
          return h("div", { class: "capitalize flex items-center gap-2" }, [
            h(TableSearchCell, {
              options: (e.data ?? []).map((el: any) => ({
                _id: el.value ?? el,
                title: el.value ?? el,
              })),
              modelValue: cellValue,
              disabled: !canEditCard.value,
              emptyText: e.slug,
              "onUpdate:modelValue": (val: any) =>
                handleChangeTicket(row, e.slug, val),
              columnName: e.slug,
            }),
          ]);
        },
        visible: e?.is_visible,
      })) ?? []),
  ];
});

function handleTableRowsUpdate(newRows: any[]) {
  // new rows have numeric `id` but no `_id` — treat those as pending
  const pending = newRows.filter((r) => !r._id);
  localPendingTickets.value = pending;
  localTableOrder.value = newRows.map((r) => r._id || r.id);
}

function setLane(row: any, laneId: string) {
  if (row._id) {
    if (laneId === "Main") return;
    moveCard.mutate({ card_id: row._id, workspace_lane_id: laneId });
    // Update local state optimistically
    const newLane = laneOptions.value.find((l: any) => l._id === laneId);
    if (newLane) {
      row.lane = newLane;
      row.workspace_lane_id = laneId;
    }
  } else {
    const newLane = laneOptions.value.find((l: any) => l._id === laneId);
    if (newLane) {
      row.lane = newLane;
      row.workspace_lane_id = laneId;
    }
    checkAndCreateTicket(row);
  }
}

function handleChangeTicket(row: any, key: any, value: any) {
  if (row._id) {
    moveCard.mutate({ card_id: row._id, variables: { [key]: value } });
  } else {
    if (!row.variables) row.variables = {};
    if (Array.isArray(row.variables)) {
      const idx = row.variables.findIndex((v: any) => v.slug === key);
      if (idx !== -1) row.variables[idx].value = value;
      else row.variables.push({ slug: key, value });
    } else {
      row.variables[key] = value;
    }
    checkAndCreateTicket(row);
  }
}

function checkAndCreateTicket(row: any) {
  const title = row["card-title"];
  if (!title || !title.trim()) return;

  // Guard against duplicate creation
  const tempId = row._id || row.id;
  if (pendingCreations.value.has(tempId)) return;

  // Fallback: use first list's _id as the status/sheet_list_id

  const target = Lists.value?.data || Lists.value || {};
  const firstList = target.sheets?.[0]?.sheet_lists?.[0];
  const status = firstList?._id || firstList?.title;

  // Can now always proceed since we always have title, status fallback, and type fallback
  pendingCreations.value.add(tempId);

  const payloadVariables: Record<string, any> = {};
  if (variables.value) {
    variables.value.forEach((v: any) => {
      payloadVariables[v.slug] = null;
    });
  }

  payloadVariables["card-title"] = title.trim();
  if (status) payloadVariables["card-status"] = status;

  Object.keys(row).forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(payloadVariables, key)) {
      payloadVariables[key] = row[key];
    }
  });

  if (Array.isArray(row.variables)) {
    row.variables.forEach((v: any) => {
      if (Object.prototype.hasOwnProperty.call(payloadVariables, v.slug)) {
        payloadVariables[v.slug] = v.value;
      }
    });
  } else if (typeof row.variables === "object" && row.variables !== null) {
    Object.entries(row.variables).forEach(([k, v]) => {
      if (Object.prototype.hasOwnProperty.call(payloadVariables, k))
        payloadVariables[k] = v;
    });
  }

  const payload = {
    sheet_list_id: status,
    workspace_id: workspaceId.value,
    sheet_id: selected_sheet_id.value,
    workspace_lane_id: row.lane?._id || row.workspace_lane_id || null,
    variables: payloadVariables,
    temp_row_id: tempId,
    createdAt: new Date().toISOString(),
  };

  addTicket(payload);
}
const selectedDeleteId = ref<string | null>(null);

const openDeleteModal = (cardId: string) => {
  selectedDeleteId.value = cardId;
  showDeleteTicket.value = true;
};

const handleTableDelete = (row: any) => {
  selectedDeleteId.value = row._id;
  showDeleteTicket.value = true;
};
const handleDeleteCard = async () => {
  if (!selectedDeleteId.value) return;
  isDeletingTicket.value = true;
  try {
    await request({
      url: `workspace/card/${selectedDeleteId.value}`,
      method: "DELETE",
    });

    toast.success("Ticket deleted successfully");

    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    queryClient.invalidateQueries({ queryKey: ["table-cards-flat"] });
    await refetchSheets();
    refetchList();
  } catch (err) {
    toast.error(toApiMessage(err));
    isDeletingTicket.value = false;
  } finally {
    isDeletingTicket.value = false;
    showDeleteTicket.value = false;
    selectedDeleteId.value = null;
  }
};
const tableViewRef = ref<any>(null);
const localPendingTickets = ref<any[]>([]);
const { mutate: addTicket, isPending: isAddingTicket } = useAddTicket({
  onMutate: (variables: any) => {
    const tempId = variables.temp_row_id;
    if (tempId) {
      // Optimistically add to localPendingTickets if not already there
      const exists = localPendingTickets.value.some(
        (t) => t._id === tempId || t.id === tempId,
      );
      if (!exists) {
        localPendingTickets.value.push({
          _id: tempId,
          "card-title": variables.variables?.["card-title"] || "New Ticket",
          columnId: "General",
          ...variables.variables,
        });
      }
    }
  },
  onSuccess: (newCard: any, variables: any) => {
    const tempId = variables.temp_row_id;
    pendingCreations.value.delete(tempId);

    tableViewRef.value?.closeQuickCreate();
    toast.success("Ticket created successfully");

    if (tempId) {
      localPendingTickets.value = localPendingTickets.value.filter(
        (t) => t._id !== tempId && t.id !== tempId,
      );
      localTableOrder.value = localTableOrder.value.map((id) =>
        id === tempId ? newCard._id : id,
      );
    }
  },
  onSettled: () => {
    // Background refetch to sync with server without UI flicker
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    queryClient.invalidateQueries({ queryKey: ["table-cards-flat"] });
  },
  onError: (_err: any, variables: any) => {
    const tempId = variables.temp_row_id;
    pendingCreations.value.delete(tempId);
    if (tempId) {
      localPendingTickets.value = localPendingTickets.value.filter(
        (t) => t._id !== tempId && t.id !== tempId,
      );
    }
    toast.error("Failed to create ticket");
  },
});

function handleUpdateTicket(task: any) {
  const id = task?._id;
  if (!id) return;

  const updates: Record<string, any> = {};
  if (task._start) updates["start-date"] = task._start;
  if (task._end) updates["end-date"] = task._end;

  if (Object.keys(updates).length > 0) {
    const snapshots = performOptimisticUpdate({
      queryClient,
      sidePanelStore,
      cardId: id,
      updates: updates,
      invalidateKeys: ["sheet-list", "table-cards-flat"],
    });

    moveCard.mutate(
      { card_id: id, variables: updates },
      { onError: () => rollbackOptimisticUpdate(queryClient, snapshots) },
    );
  }
}

function handleCreateTicket(newRow: any) {
  // Fill default owner
  if (authStore.user?.data) {
    newRow.created_by = {
      u_full_name: authStore.user?.data.u_full_name,
      u_profile_image: authStore.user?.data.u_profile_image,
      u_email: authStore.user?.data.u_email,
    };
  }
  checkAndCreateTicket(newRow);
}

function handleQuickCreate(title: string, group: any) {
  if (!title?.trim()) return;

  const variableKey = selectedGroup.value?.slug;
  const label = selectedGroupLabel.value?.toLowerCase();
  const laneId = laneOptions.value?.[0]?._id || "";

  // Build variables object dynamically
  const variablesObj: Record<string, any> = {
    ["card-title"]: title.trim(),
    // Auto-detect variable from group and set its value
    ...(variableKey ? { [variableKey]: group.title } : {}),
  };

  const payload: any = {
    "card-title": title,
    workspace_lane_id: laneId,
    variables: variablesObj,
  };

  // Set default status if not grouped by
  if (!selectedGroup.value) {
    payload["pin-list"] = "General";
  }

  // Special handling for assignee grouping
  if (label === "assignee") {
    const cards = group?.cards || [];
    const firstCard = cards[0];
    const cardAssignee =
      firstCard?.seat_id ||
      firstCard?.seat?.map((u: any) => u._id || u.id) ||
      firstCard?.seat?._id;

    if (cardAssignee) {
      payload.seat_id = Array.isArray(cardAssignee)
        ? cardAssignee
        : [cardAssignee];
    }
  }

  handleCreateTicket(payload);
}

function handleMindmapCreateCard(payload: any) {
  addTicket(payload);
}
</script>

<style scoped>
.custom_scroll_bar::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}
.custom_scroll_bar::-webkit-scrollbar-thumb {
  background-color: rgba(150, 150, 150, 0.4);
  border-radius: 10px;
}
.custom_scroll_bar::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}
.custom_scroll_bar::-webkit-scrollbar-track {
  background: transparent;
}
.custom_scroll_bar {
  scrollbar-width: thin;
  scrollbar-color: rgba(150, 150, 150, 0.5) transparent !important;
}
 .node-card-stripe{
  background: var(--primary-color) !important;
}
</style>
