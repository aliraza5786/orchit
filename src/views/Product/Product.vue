<template>
  <div
    class="flex-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px] flex-grow h-full bg-bg-card border border-border overflow-x-auto overflow-y-hidden flex-col flex scrollbar-visible w-full"
  >
    <div class="relative">
      <div class="header py-3 px-4  border-b border-border flex items-center justify-between gap-3  overflow-x-auto h-full">
        <div class="flex gap-3">
        <!-- ... Sheet Dropdown ... -->
        <Dropdown
          ref="sheetDropdownRef"
          @open="closeAllDropdowns('sheet')"
          @edit-option="openEditSprintModal"
          v-model="selected_sheet_id"
          :canEdit="canEditSheet"
          :canDelete="canDeleteSheet"
          @delete-option="handleDeleteSheetModal"
          :options="transformedData"
          variant="secondary"
          customClasses="fixed w-auto"
          custom-title="Create Sheet"
          :multiple="true"
        >
          <template #more>
            <div
              v-if="canCreateSheet"
              @click="createSheet()"
              class="sticky bottom-0 bg-bg-dropdown shadow-border capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap min-w-[150px]"
            >
              <i class="fa-solid fa-plus"></i> Add new
            </div>
          </template>
        </Dropdown>
        <!-- filters -->
        <div class="relative flex items-center gap-3">
            <button
              ref="filterTriggerRef"
              @click="toggleFilters"
              class="flex items-center gap-2 px-3 h-[33px] rounded-md border cursor-pointer bg-bg-card hover:border-accent transition-all text-xs font-semibold relative"
              :class="showFilterBar ? 'border-accent' : 'border-border'"
            >
              <i class="fa-solid fa-filter text-accent text-[14px]"></i>
              <span>Filter</span>
              <span 
                v-if="activeFilterCount" 
                class="bg-accent text-white rounded-full px-1.5 py-0.5 text-[9px] min-w-[16px] flex items-center justify-center"
              >
                {{ activeFilterCount }}
              </span>
            </button>
            
            <button 
              v-if="hasActiveFilters"
              @click="handleClearFilters"
              class="text-[11px] font-medium text-text-secondary hover:text-accent transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>

            <!-- Floating Filter Dropdown -->
            <ProductFilters
              v-if="showFilterBar"
              :triggerRef="filterTriggerRef"
              :variables="variables"
              :workspaceId="workspaceId"
              :moduleId="moduleId"
              :activeFilters="activeFilters"
              @apply="(f) => { handleApplyFilters(f); showFilterBar = false; }"
              @clear="handleClearFilters"
              @close="showFilterBar = false"
            />
        </div> 
          <div v-if="view != 'table'" class="relative flex items-center gap-3">
             <button
                ref="variableTriggerRef"
                @click="toggleVariableDropdown"
                class="flex items-center gap-2 text-nowrap px-3 h-[33px] rounded-md border cursor-pointer bg-bg-card hover:border-accent transition-all text-xs font-semibold relative"
                :class="showVariableDropdown ? 'border-accent text-accent' : 'border-border text-text-primary'"
            >
                <i class="fa-solid fa-layer-group text-[14px]" :class="showVariableDropdown ? 'text-accent' : 'text-accent'"></i>
                <span class="text-nowrap">Group: {{ selectedViewByLabel }}</span>
            </button>

            <!-- Variable View Dropdown -->
            <VariableViewDropdown
                v-if="showVariableDropdown"
                :triggerRef="variableTriggerRef"
                :options="variables"
                v-model="selected_view_by"
                :canCreateVariable="canCreateVariable"
                @close="showVariableDropdown = false"
                @nested-select="handleProcessNestedSelection"
                @add-new="() => { isCreateVar = true; showVariableDropdown = false; }"
            />
          </div>
           <!-- Group button for Table View -->
           <div v-if="view === 'table'" class="relative flex items-center gap-3">
            <button
                ref="groupTriggerRef"
                @click="toggleGroupDropdown"
                class="flex items-center gap-2 px-3 h-[33px] rounded-md border cursor-pointer bg-bg-card hover:border-accent transition-all text-xs font-semibold relative"
                :class="showGroupDropdown ? 'border-accent text-accent' : 'border-border text-text-primary'"
            >
                <i class="fa-solid fa-layer-group text-[14px]" :class="showGroupDropdown ? 'text-accent' : 'text-accent'"></i>
                <span>Group: {{ selectedGroupLabel }}</span>
            </button>

            <!-- Table Group Dropdown -->
            <TableGroupDropdown
                v-if="showGroupDropdown"
                :triggerRef="groupTriggerRef"
                v-model="selectedGroup"
                @close="showGroupDropdown = false"
            />
           </div>
        </div>

        <div
          class="flex gap-3 items-center"
          :class="{ 'opacity-60 pointer-events-none': !transformedData?.length }"
        >
         

          <Searchbar
            @onChange="(e) => searchQuery = e"
            placeholder="Search in Orchit AI space"
          />

          

          <div class="flex items-center gap-3 bg-bg-surface/50 h-[32px] px-2 rounded-md">
            <!-- View Buttons ... -->
            <button
              class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
              :class="view === 'kanban' ? 'text-accent bg-accent-text' : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
              title="Kanban view"
              @click="view = 'kanban'"
            >
              <i class="fa-solid fa-chart-kanban"></i>
            </button>

            <button
              @click="view = 'table'"
              class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
              :class="view === 'table' ? 'text-accent bg-accent-text' : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
              title="List view"
            >
              <i class="fa-solid fa-align-left"></i>
            </button>

            <button
              @click="view = 'mindmap'"
              class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
              :class="view === 'mindmap' ? 'text-accent bg-accent-text' : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
              title="MindMap view"
            >
              <i class="fa-solid fa-chart-diagram"></i>
            </button>

            <button
              @click="view = 'calendar'"
              class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
              :class="view === 'calendar' ? 'text-accent bg-accent-text' : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
              title="Calendar view"
            >
              <i class="fa-regular fa-calendar"></i>
            </button>

            <button
              @click="view = 'gantt'"
              class="aspect-square cursor-pointer rounded-sm p-0"
              :class="view === 'gantt' ? 'text-accent bg-accent-text' : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
              title="Gantt Chart view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 6h2v12H4V6Zm4 4h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h10v2H8V6Z" />
              </svg>
            </button>

            <button
              @click="view = 'timeline'"
              class="aspect-square cursor-pointer rounded-sm p-0"
              :class="view === 'timeline' ? 'text-accent bg-accent-text' : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
              title="Timeline view"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm16 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0-16a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" opacity="0" />
                <path d="M4 12h4m8 0h4M9 12h6M9 12v-6M15 12v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    
    <!-- ── Kanban View ─────────────────────────────────────────────────────── -->
    <template v-if="view == 'kanban'">
      <KanbanSkeleton v-show="(isPending || isSheetPending) && hasSheets" />
      <div
        v-show="!isPending && !isSheetPending && hasSheets"
        class="flex overflow-x-auto gap-3 scrollbar-visible h-full mx-4 py-4"
      >
        <div class="flex gap-3">
          <KanbanBoard
            @onPlus="plusHandler"
            :board="filteredBoard"
            @delete:column="(e: any) => deleteHandler(e)"
            @update:column="(e: any) => handleUpdateColumn(e)"
            @reorder="onReorder"
            @addColumn="handleAddColumn"
            @select:ticket="selectCardHandler"
            @onBoardUpdate="handleBoardUpdate"
            :variable_id="selected_view_by"
            :sheet_id="selected_sheet_id"
          >
            <template #column-footer="column">
              <div
                class="mx-auto text-text-secondary/80 m-2 w-[90%] h-full justify-center flex items-center border border-dashed border-border"
                v-if="
                  workspaceStore?.transitions?.all_allowed &&
                  !workspaceStore?.transitions?.all_allowed?.includes(
                    column.column.title,
                  ) &&
                  workspaceStore.transitions.currentColumn !=
                    column.column.title
                "
              >
                Disbale ( you can't drop here )
              </div>
            </template>
            <template #ticket="{ ticket }">
              <KanbanTicket
                :selectedVar="selected_view_by"
                :invalidateKeys="['sheet-list', 'table-cards-flat']"
                @select="
                  () => {
                    selectCardHandler(ticket);
                  }
                "
                :ticket="ticket"
              />
            </template>
          </KanbanBoard>

          <div class="min-w-[270px] sm:min-w-[328px]" @click.stop>
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
                  varaint="primary"
                  class="px-3 py-1 bg-accent cursor-pointer text-white rounded"
                  >{{ addingList ? "Adding..." : "Add list" }}</Button
                >
                <i class="fa-solid fa-close" @click="setActiveAddList"></i>
              </div>
            </div>
            <button
              v-else
              :disabled="!canCreateVariable"
              class="text-sm text-text-primary py-2.5 font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
              :class="
                !canCreateVariable ? 'cursor-not-allowed' : 'cursor-pointer'
              "
              @click.stop="setActiveAddList"
            >
              + Add List
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ── Table View ──────────────────────────────────────────────────────── -->
    <template v-if="view == 'table'">
      <div class="ps-4 pe-4">
      <TableView
        ref="tableViewRef"
        class="mx-3"
        @toggleVisibility="toggleVisibilityHandler"
        @addVar="
          () => {
            isCreateVar = true;
          }
        "
        :isPending="isPending || isVariablesPending || isFlatTablePending || (!!selectedGroup && isTablePending)"
        :isCreating="isAddingTableTicket"
        :columns="columns"
        :rows="filteredBoard"
        :groups="tableGroups"
        :isGrouped="!!selectedGroup"
        :selectedGroup="selectedGroup"
        :canCreate="canCreateCard"
        :canCreateVariable="canCreateVariable"
        :canDelete="canDeleteCard"
        @delete="
          (t) => {
            ticketToDelete = t;
            selectedDeleteId = t._id;
            showTicketDelete = true;
          }
        "
        @create="handleCreateTicket"
        @quickCreate="handleQuickCreate"
        @refresh="refreshTable"
        @update:rows="handleTableRowsUpdate"
        :totalCount="totalTableCount"
        :totalTotal="totalTableTotal"
      />
      </div>
    </template>

    <!-- ── MindMap View ────────────────────────────────────────────────────── -->
    <template v-if="view === 'mindmap'">
      <MindMapView
        :listsData="Lists?.sheets[0]?.sheet_lists ?? []"
        :selectedSheetId="selected_sheet_id"
        :selectedViewBy="selected_view_by"
        :workspaceId="workspaceId"
        :moduleId="moduleId"
        :addingList="!!addingList"
        :activeAddList="activeAddList"
        :selectedSheetTitle="sheetTitle"
        :newColumn="newColumn"
        :canCreateCard="canCreateCard"
        :canEditCard="canEditCard"
        :canDeleteCard="canDeleteCard"
        :canAssignCard="canAssignCard"
        :canCreateSheet="canCreateSheet"
        :canCreateVariable="canCreateVariable"
        :canEditSheet="canEditSheet"
        @select:ticket="selectCardHandler"
        @delete:ticket="handleMindmapDeleteTicket"
        @create:sheet="handleMindmapCreateSheet"
        @create:card="handleMindmapCreateCard"
        @update:card="handleMindmapUpdateCard"
        @update:sheet="handleMindmapUpdateSheet"
        @reorder:card="handleMindmapReorderCard"
        @toggle-add-list="setActiveAddList"
        @add-column="handleAddColumn"
      />
    </template>

    <!-- ── Calendar View ───────────────────────────────────────────────────── -->
    <template v-if="view === 'calendar'">
      <CalendarView :data="filteredBoard" @select:ticket="selectCardHandler" />
    </template>

    <!-- ── Gantt View ──────────────────────────────────────────────────────── -->
    <template v-if="view === 'gantt'">
      <GanttChartView
        :data="filteredBoard"
        @select:ticket="selectCardHandler"
      />
    </template>

    <!-- ── Timeline View ───────────────────────────────────────────────────── -->
    <template v-if="view === 'timeline'">
      <TimelineView :data="filteredBoard" @select:ticket="selectCardHandler" />
    </template>

    <!-- ── No Sheets Modal ─────────────────────────────────────────────────── -->
    <div
      v-if="(!transformedData?.length && !isPending) || !isSheetPending"
      v-show="hideNoSheetsModal && canCreateSheet"
      class="flex items-center justify-center h-full"
    >
      <div
        class="bg-bg-card rounded-lg p-6 w-[420px] text-center shadow-md border border-border"
      >
        <div class="flex items-center flex-col justify-center mb-4 gap-2">
          <i class="fa-regular fa-file-lines text-2xl text-accent"></i>
          <h3 class="text-lg font-semibold">No Sheets Created</h3>
        </div>
        <p class="text-sm text-text-secondary mb-6">
          You don't have any sheets yet. Create a new sheet to start organizing
          your tasks and managing projects efficiently.
        </p>
        <div class="flex justify-center gap-3">
          <Button
            class="px-4 py-2 bg-accent text-white"
            @click="handleCreateSheetFromModal"
          >
            + Create Sheet
          </Button>
        </div>
      </div>
    </div>
  </div>

  <!-- ── Modals ──────────────────────────────────────────────────────────── -->
  <ConfirmDeleteModal
    @click.stop=""
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
    @cancel="
      () => {
        showDelete = false;
      }
    "
  />

  <CreateTaskModal
    :selectedVariable="selected_view_by"
    :listId="localColumnData?.title"
    :sheet_id="selected_sheet_id === 'all' ? sheetId : selected_sheet_id"
    :sheetVariables="variables"
    v-if="createTeamModal"
    key="createTaskModalKey"
    v-model="createTeamModal"
    @submit=""
  />

  <SidePanel
    v-if="selectedCard?._id"
    :details="selectedCard"
    :moduleId="moduleId"
    @close="
      () => {
        selectCardHandler({ variables: {} });
      }
    "
    @closeSidePanel="closeSidePanel"
    @comment:post="incrementCommentCount"
    :showPanel="selectedCard?._id ? true : false"
    :sheetID="selected_sheet_id === 'all' ? sheetId : selected_sheet_id"
  />

  <CreateSheetModal
    size="md"
    :sheet="selectedSheettoAction"
    v-model="isCreateSheetModal"
  />

  <CreateVariableModal
    v-model="isCreateVar"
    v-if="isCreateVar"
    :sheetID="selected_sheet_id === 'all' ? sheetId : selected_sheet_id"
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

  <ConfirmDeleteModal
    v-model="showTicketDelete"
    title="Delete Ticket"
    itemLabel="Ticket"
    :itemName="ticketToDelete?.title"
    :requireMatchText="ticketToDelete?.title"
    confirmText="Delete Ticket"
    cancelText="Cancel"
    size="md"
    :loading="isDeletingTicket"
    @confirm="handleDeleteTicket"
    @cancel="
      () => {
        showTicketDelete = false;
        ticketToDelete = null;
      }
    "
  />
</template>

<script setup lang="ts">
import {
  defineAsyncComponent,
  ref,
  computed,
  watch,
  triggerRef,
  h,
  onMounted,
} from "vue";
import { useWorkspaceStore } from "../../stores/workspace";
import { useRoute } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { useRouteIds } from "../../composables/useQueryParams";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import { getInitials } from "../../utilities";
import { avatarColor } from "../../utilities/avatarColor";
import { toast } from "vue-sonner";
import { usePermissions } from "../../composables/usePermissions";
import { request, toApiMessage } from "../../libs/api";
import {
  ReOrderCard,
  ReOrderList,
  useAddList,
  useAddTicket,
  useLanes,
  useMoveCard,
  useSheetList,
  useSheets,
  useTableCards,
  useUpdateWorkspaceSheet,
  useVarVisibilty,
  useVariables,
  useCreateWorkspaceSheet,
} from "../../queries/useSheets";
import { useSidePanelStore } from "../../stores/sidePanelStore";
import { useAgentStore } from "../../stores/agentStore";

// ─── Lazy-loaded components ───────────────────────────────────────────────────
const Dropdown = defineAsyncComponent(
  () => import("../../components/ui/Dropdown.vue"),
);
const Searchbar = defineAsyncComponent(
  () => import("../../components/ui/SearchBar.vue"),
);
const KanbanSkeleton = defineAsyncComponent(
  () => import("../../components/skeletons/KanbanSkeleton.vue"),
);
const BaseTextField = defineAsyncComponent(
  () => import("../../components/ui/BaseTextField.vue"),
);
const Button = defineAsyncComponent(
  () => import("../../components/ui/Button.vue"),
);
const KanbanTicket = defineAsyncComponent(
  () => import("../../components/feature/kanban/KanbanTicket.vue"),
);
const TableView = defineAsyncComponent(
  () => import("../../components/feature/TableView/TableView.vue"),
);
const DatePicker = defineAsyncComponent(
  () => import("./components/DatePicker.vue"),
);
const TableSearchCell = defineAsyncComponent(
  () => import("../../components/feature/TableView/TableSearchCell.vue"),
);
const TableAssigneeCell = defineAsyncComponent(
  () => import("../../components/feature/TableView/TableAssigneeCell.vue"),
);
const CalendarView = defineAsyncComponent(
  () => import("../../components/feature/CalendarView.vue"),
);
const GanttChartView = defineAsyncComponent(
  () => import("../../components/feature/GanttChartView.vue"),
);
const TimelineView = defineAsyncComponent(
  () => import("../../components/feature/TimelineView.vue"),
);
const CreateTaskModal = defineAsyncComponent(
  () => import("./modals/CreateTaskModal.vue"),
);
const CreateSheetModal = defineAsyncComponent(
  () => import("./modals/CreateSheetModal.vue"),
);
const CreateVariableModal = defineAsyncComponent(
  () => import("./modals/CreateVariableModal.vue"),
);
const ConfirmDeleteModal = defineAsyncComponent(
  () => import("./modals/ConfirmDeleteModal.vue"),
);
const SidePanel = defineAsyncComponent(
  () => import("./components/SidePanel.vue"),
);
const KanbanBoard = defineAsyncComponent(
  () => import("../../components/feature/kanban/KanbanBoard.vue"),
);

// ── MindMapView component (extracted from this file) ──────────────────────────
const MindMapView = defineAsyncComponent(
  () => import("../../components/feature/MindmapView.vue"),
);
const ProductFilters = defineAsyncComponent(
  () => import("./components/ProductFilters.vue"),
);
const TableGroupDropdown = defineAsyncComponent(
  () => import("./components/TableGroupDropdown.vue"),
);
const VariableViewDropdown = defineAsyncComponent(
  () => import("./components/VariableViewDropdown.vue"),
);

// ─── Permissions ──────────────────────────────────────────────────────────────
const {
  canEditSheet,
  canDeleteSheet,
  canCreateVariable,
  canCreateSheet,
  canCreateCard,
  canEditCard,
  canDeleteCard,
  canAssignCard,
} = usePermissions();

// ─── State ────────────────────────────────────────────────────────────────────
const showDeleteModal = ref(false);
const ticketToDelete = ref<any>(null);
const showTicketDelete = ref(false);
const selectedDeleteId = ref<string | null>(null);
const isDeletingTicket = ref(false);
const view = ref("kanban");
const isCreateVar = ref(false);
const sheetDropdownRef = ref<any>(null);
const route = useRoute();
const { workspaceId, moduleId } = useRouteIds();
const queryClient = useQueryClient();
const createTeamModal = ref(false);
const selectedCard = ref<any>();
const hideNoSheetsModal = ref(false);
const sidePanelStore = useSidePanelStore();
const agentStore = useAgentStore();
const localPendingTickets = ref<any[]>([]);
const localTableOrder = ref<any[]>([]);
const selectedProcessMeta = ref<any>(null);
const showBgPicker = ref(false);
const showTextColorPicker = ref(false);
const showFilterBar = ref(false);
const activeFilters = ref<any>({});
const filterTriggerRef = ref<HTMLElement | null>(null);
const showGroupDropdown = ref(false);
const selectedGroup = ref('');
const groupTriggerRef = ref<HTMLElement | null>(null);

const showVariableDropdown = ref(false);
const variableTriggerRef = ref<HTMLElement | null>(null);

const selectedGroupLabel = computed(() => {
  const options: Record<string, string> = {
    'priority': 'Priority',
    'status': 'Status',
    'assignee': 'Assignee',
    'owner': 'Owner/Reporter',
    'card_type': 'Card Type'
  };
  return options[selectedGroup.value] || 'None';
});

watch(showBgPicker, (v) => {
  if (v) showTextColorPicker.value = false;
});
watch(showTextColorPicker, (v) => {
  if (v) showBgPicker.value = false;
});

// ─── Table row update ─────────────────────────────────────────────────────────
const handleTableRowsUpdate = (newRows: any[]) => {
  localPendingTickets.value = newRows.filter((r) => !r._id);
  localTableOrder.value = newRows.map((r) => r._id || r.id);
};

const handleProcessNestedSelection = (val: any) => {
  selectedProcessMeta.value = val;
};

// ─── Sheets ───────────────────────────────────────────────────────────────────
const {
  data,
  refetch: refetchSheets,
  isPending: isSheetPending,
} = useSheets({ workspace_id: workspaceId, workspace_module_id: moduleId });

const sheetId = computed(() => (data.value ? data.value[0]?._id : ""));
const sheetTitle = computed(() => (data.value ? data.value[0]?.variables?.["sheet-title"] : ""));
const selected_sheet_id = ref<any>(
  localStorage.getItem("selected_sheet_id") || sheetId.value,
);
watch([sheetId, sheetTitle], ([id, title]) => {
  if (id) {
    localStorage.setItem("selected_sheet_id", id);
    selected_sheet_id.value = id;
    agentStore.saveSelectedSheetId(id);
  }

  if (title) {
    localStorage.setItem("selected_sheet_title", title);
     agentStore.saveSelectedSheetTitle(title);
  }
}, { immediate: true });
const { data: variables, isPending: isVariablesPending } = useVariables(
  workspaceId,
  moduleId,
  selected_sheet_id,
);

const storageKey = computed(() => {
  return `selected_sheet_${route.params.workspace_id}_${route.params.workspace_module_id}`;
});
const sheetName = ref("");

watch(
  data,
  (newData) => {
    if (!newData?.length) return;
    const storedId = localStorage.getItem(storageKey.value);
    const exists = newData.some((item: any) => item._id === storedId);
    selected_sheet_id.value = storedId && exists ? storedId : newData[0]._id;
  },
  { immediate: true },
);

watch(selected_sheet_id, (newId) => {
  if (!newId) return;
  const selectedSheet = transformedData.value.find(
    (item) => item._id === newId,
  );
  if (selectedSheet) {
    agentStore.saveSelectedSheetTitle(selectedSheet.title);
    agentStore.saveSelectedSheetId(newId);
    sheetName.value = selectedSheet.title || "";
  }
});

// ─── Add List ─────────────────────────────────────────────────────────────────
const { mutate: addList, isPending: addingList } = useAddList({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    newColumn.value = "";
    showDelete.value = false;
    activeAddList.value = false;
  },
});

const listProcessPayload = computed(() => {
  if (
    selectedViewByVariable.value?.title === "Process" &&
    selectedProcessMeta.value
  ) {
    return {
      variable_slug: "card-type",
      type_value: selectedProcessMeta.value.title,
    };
  }
  return {};
});

const handleAddColumn = (v: any) => {
  const payload: any = {
    workspace_id: workspaceId.value,
    module_id: moduleId.value,
    variable_id: selected_view_by.value,
    value: v,
    ...listProcessPayload.value,
  };
  addList(payload);
};

watch(sheetId, () => {
  selected_sheet_id.value = sheetId.value;
});

const viewBy = computed(() =>
  variables?.value ? variables?.value[0]?._id : "",
);
const selected_view_by = ref(viewBy.value);
watch(viewBy, () => {
  selected_view_by.value = viewBy.value;
});

const selectedViewByVariable = computed(() => {
  return variables.value?.find((v: any) => v._id === selected_view_by.value);
});

const selectedViewByLabel = computed(() => {
  const opt = selectedViewByVariable.value;
  if (!opt) return "None";

  if (selectedProcessMeta.value && opt._id === selected_view_by.value) {
    return `${opt.title} (${selectedProcessMeta.value.title})`;
  }

  return opt.title;
});

watch(selected_view_by, (newVal) => {
  const opt = variables.value?.find((v: any) => v._id === newVal);
  if (!opt?.nested?.length) {
    selectedProcessMeta.value = null;
  }
});

const formattedExtraParams = computed(() => {
  const f = activeFilters.value;
  const toLower = (val: any) =>
  typeof val === "string" ? val.toLowerCase() : val;
  return {
    ...listProcessPayload.value,
    ...(f.seat_ids?.length ? { seat_ids: f.seat_ids.join(",") } : {}),
    priority: toLower(f.priority),
    status: toLower(f.status),
    card_type: toLower(f.card_type),
    sprint_id: f.sprint_id,
    milestone_id: f.milestone_id,
    huddle_id: f.huddle_id,
    start_date_from: f.start_date_from,
    start_date_to: f.start_date_to,
    end_date_from: f.end_date_from,
    end_date_to: f.end_date_to,
    created_at_from: f.created_at_from,
    created_at_to: f.created_at_to,
  };
});

const handleApplyFilters = (filters: any) => {
  activeFilters.value = filters;
};

const handleClearFilters = () => {
  activeFilters.value = {};
};

const activeFilterCount = computed(() => {
  const f = activeFilters.value;
  let count = 0;
  Object.keys(f).forEach((key) => {
    if (Array.isArray(f[key])) count += f[key].length;
    else if (f[key]) count += 1;
  });
  return count;
});

const closeAllDropdowns = (except: string) => {
  if (except !== 'sheet') {
    sheetDropdownRef.value?.closeDropdown();
  }
  if (except !== 'variable') {
    showVariableDropdown.value = false;
  }
  if (except !== 'filter') showFilterBar.value = false;
  if (except !== 'group') showGroupDropdown.value = false;
};

const toggleVariableDropdown = () => {
    closeAllDropdowns('variable');
    showVariableDropdown.value = !showVariableDropdown.value;
};

const toggleFilters = () => {
  const willShow = !showFilterBar.value;
  if (willShow) closeAllDropdowns('filter');
  showFilterBar.value = willShow;
};

const toggleGroupDropdown = () => {
  const willShow = !showGroupDropdown.value;
  if (willShow) closeAllDropdowns('group');
  showGroupDropdown.value = willShow;
};

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

const workspaceStore = useWorkspaceStore();
const {
  data: Lists,
  isPending,
  refetch: refetchSheetLists,
} = useSheetList(
  moduleId,
  selected_sheet_id,
  computed(() => [...workspaceStore.selectedLaneIds]),
  selected_view_by,
  formattedExtraParams,
);

// ─── Dedicated flat Table View data (no variable_id = no grouping shuffle) ─────
const {
  data: FlatTableData,
  isPending: isFlatTablePending,
} = useTableCards(
  moduleId,
  selected_sheet_id,
  computed(() => [...workspaceStore.selectedLaneIds]),
  formattedExtraParams,
);

const tableActiveVariableId = computed(() => {
  if (!selectedGroup.value) return "";

  const group = selectedGroup.value;

  // Assignee and Owner use variable_slug instead — skip variable_id lookup for them
  if (group === 'assignee' || group === 'owner') return "";

  let slug = group;
  if (slug === 'card_type') slug = 'card-type';

  const findVar = (searchSlug: string) =>
    variables.value?.find((v: any) =>
      v.slug?.toLowerCase() === searchSlug.toLowerCase() ||
      v.title?.toLowerCase() === searchSlug.toLowerCase()
    );

  let variable = findVar(slug);

  if (!variable && slug === 'status') variable = findVar('card-status');
  if (!variable && slug === 'card-type') variable = findVar('type');

  return variable?._id || "";
});

// Maps group selections that use variable_slug instead of variable_id
const tableActiveVariableSlug = computed(() => {
  if (selectedGroup.value === 'assignee') return 'assigned_to';
  if (selectedGroup.value === 'owner') return 'created_by';
  return '';
});

// Extra params for the grouped table query — injects variable_slug when needed
const tableGroupExtraParams = computed(() => {
  const base = formattedExtraParams.value || {};
  if (tableActiveVariableSlug.value) {
    return { ...base, variable_slug: tableActiveVariableSlug.value };
  }
  return base;
});

const {
  data: TableGroupedLists,
  isPending: isTablePending,
} = useSheetList(
  moduleId,
  selected_sheet_id,
  computed(() => [...workspaceStore.selectedLaneIds]),
  tableActiveVariableId,
  tableGroupExtraParams,  // uses variable_slug for assignee/owner, falls back to regular extra params
);

// ─── Route card open ──────────────────────────────────────────────────────────
onMounted(() => {
  openPanelFromRoute();
});
watch(
  () => route.params.card_id,
  () => openPanelFromRoute(),
);

async function openPanelFromRoute() {
  const cardId = route.params.card_id as string;
  if (!cardId) return;
  sidePanelStore.saveLocalId(cardId);
  selectCardHandler({ _id: cardId, id: cardId });
}

const selectCardHandler = (card: any) => {
  if (!card._id) card._id = card.id;
  selectedCard.value = card;
  sidePanelStore.selectTaskCard(card);
};
(window as any).selectCardHandler = selectCardHandler;

const closeSidePanel = () => {
  selectedCard.value = null;
  sidePanelStore.clearSelectedCard();
};

// ─── Sheet CRUD ───────────────────────────────────────────────────────────────
const isCreateSheetModal = ref(false);
const createSheet = () => {
  sheetDropdownRef.value?.closeDropdown();
  selectedSheettoAction.value = {};
  isCreateSheetModal.value = !isCreateSheetModal.value;
};
const handleCreateSheetFromModal = async () => {
  await createSheet();
};

// ─── Reorder ──────────────────────────────────────────────────────────────────
const reorderList = ReOrderList();
const reorderCard = ReOrderCard();

function onReorder(a: any) {
  if (a.type === "column") {
    reorderList.mutate(
      {
        payload: {
          workspace_id: workspaceId.value,
          workspace_module_id: moduleId.value,
          variable_id: selected_view_by.value,
          moved_value: a.meta.id,
          new_index: a.meta.newIndex,
        },
      },
      {
        onSuccess: () => {
          refetchSheets();
          refetchSheetLists();
        },
      },
    );
  } else {
    reorderCard.mutate(
      {
        payload: {
          workspace_id: workspaceId.value,
          card_id: a.meta.moved._id,
          group_value: a.meta.fromColumnId,
          group_variable_id: selected_view_by.value,
          new_index: a.meta.newIndex,
          sheet_id: selected_sheet_id.value === 'all' ? (a.meta.moved.sheet_id || sheetId.value) : selected_sheet_id.value,
        },
      },
      {
        onSuccess: () => {
          refetchSheets();
          refetchSheetLists();
        },
      },
    );
  }
}

const handleBoardUpdate = (_: any) => {};

// ─── Transformed Data ─────────────────────────────────────────────────────────
interface IconData {
  prefix: string;
  iconName: string;
}
interface DropdownOption {
  _id: string;
  title: string;
  icon: IconData;
}

const transformedData = computed<DropdownOption[]>(() => {
  const options = (data.value || []).map((item: any) => {
    const icon =
      item?.icon ??
      item?.variables?.["sheet-icon"] ??
      { prefix: "fa-solid", iconName: "fa-file" };

    return {
      _id: item._id,
      title: item?.variables?.["sheet-title"],
      description: item?.variables?.["sheet-description"],
      icon,
      status: item?.generation_status,
    } as any;
  });

  if (options.length > 0) {
    options.unshift({
      _id: "all",
      title: "All sheet",
      icon: { prefix: "fa-solid", iconName: "fa-layer-group" },
    } as any);
  }
  return options;
});

watch(
  () => transformedData.value,
  (val) => {
    if (!val?.length && canCreateSheet)
      sheetDropdownRef.value?.openDropdown?.();
  },
  { immediate: true },
);

const hasSheets = computed(() => {
  return Array.isArray(transformedData?.value)
    ? transformedData.value.length > 0
    : transformedData.value > 0;
});

const showNosheetsModal = () => {
  hideNoSheetsModal.value = !transformedData.value?.length;
};
watch(
  transformedData,
  () => {
    showNosheetsModal();
  },
  { immediate: true },
);

watch(
  selected_sheet_id,
  (newVal, oldVal) => {
    if (!newVal) return;
    
    // Handle "All sheet" logic: mutual exclusivity
    if (Array.isArray(newVal)) {
      const hadAll = oldVal === 'all' || (Array.isArray(oldVal) && oldVal.includes('all'));
      const hasAll = newVal.includes('all');
      
      let finalVal = [...newVal];
      
      if (hasAll && !hadAll) {
        // If "All" was just selected, unselect everything else
        finalVal = ['all'];
      } else if (hasAll && newVal.length > 1) {
        // If "All" was already selected and a new sheet was selected, unselect "All"
        finalVal = newVal.filter(id => id !== 'all');
      }
      
      // Ensure specific output format: string if single, array if multiple
      if (finalVal.length === 1) {
        const singleId = finalVal[0];
        if (selected_sheet_id.value !== singleId) {
          selected_sheet_id.value = singleId;
          return;
        }
      } else if (finalVal.length > 1) {
        if (JSON.stringify(selected_sheet_id.value) !== JSON.stringify(finalVal)) {
          selected_sheet_id.value = finalVal;
          return;
        }
      }
    }

    const currentId = Array.isArray(newVal) ? newVal[0] : newVal;
    const selectedSheet = transformedData.value.find(
      (item) => item._id === currentId,
    );
    if (selectedSheet) {
      agentStore.saveSelectedSheetTitle(selectedSheet.title);
      agentStore.saveSelectedSheetId(currentId);
      sheetName.value = selectedSheet.title || "";
    } else if (currentId === 'all') {
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

watch(data, (newData, oldData) => {
  if (!newData?.length) return;
  // If a brand-new sheet was added, select it
  const oldIds = new Set((oldData || []).map((s: any) => s._id));
  const brandNew = newData.find((s: any) => !oldIds.has(s._id));
  if (brandNew) {
    selected_sheet_id.value = brandNew._id;
    localStorage.setItem(storageKey.value, brandNew._id);
  }
});

watch(
  [() => storageKey.value, () => data.value],
  ([newKey, newData]) => {
    if (!newData?.length) return;
    const storedId = localStorage.getItem(newKey);
    const exists = newData.some((item: any) => item._id === storedId);
    selected_sheet_id.value = storedId && exists ? storedId : newData[0]._id;
  },
  { immediate: true },
);

// ─── Column management ────────────────────────────────────────────────────────
const activeAddList = ref(false);
const newColumn = ref("");

function setActiveAddList() {
  activeAddList.value = !activeAddList.value;
}
function emitAddColumn() {
  const t = newColumn.value.trim();
  if (!t) return;
  handleAddColumn(t);
}

const handleUpdateColumn = (newTitle: any) => {
  addList({
    workspace_id: route.params.id,
    module_id: route.params.module_id,
    new_value: newTitle.title,
    value: newTitle.oldTitle,
    variable_id: selected_view_by.value,
  });
};

const showDelete = ref(false);
const localColumnData = ref();

const handleDeleteColumn = () => {
  addList({
    value: localColumnData.value.title,
    workspace_id: workspaceId.value,
    module_id: moduleId.value,
    newValue: localColumnData.value.title,
    variable_id: selected_view_by.value,
    is_trash: true,
  });
};

const deleteHandler = (e: any) => {
  showDelete.value = true;
  localColumnData.value = e;
};
const plusHandler = (e: any) => {
  createTeamModal.value = true;
  localStorage.setItem("selectedStatusTitle", e?.title);
  localColumnData.value = e;
};

// ─── Sheet delete/edit ────────────────────────────────────────────────────────
const selectedSheettoAction = ref<any>();

function handleDeleteSheetModal(opt: any) {
  sheetDropdownRef.value?.closeDropdown();
  showDeleteModal.value = true;
  selectedSheettoAction.value = opt;
}

const { mutate: updateSheet, isPending: isDeleting } = useUpdateWorkspaceSheet({
  onSuccess: () => {
    refetchSheets();
    showDeleteModal.value = false;
      refetchSheetLists();
  },
});

function handleDeleteSheet() {
  updateSheet({
    sheet_id: selectedSheettoAction.value?._id,
    workspace_module_id: moduleId.value,
    is_trash: true,
  });
}

function openEditSprintModal(opt: any) {
  sheetDropdownRef.value?.closeDropdown();
  isCreateSheetModal.value = true;
  selectedSheettoAction.value = opt;
}

// ─── Search ───────────────────────────────────────────────────────────────────
const searchQuery = ref("");
const debouncedQuery = ref("");

watch(
  searchQuery,
  debounce((val: any) => {
    debouncedQuery.value = val;
  }, 200),
);

const fuse = computed(() => {
  const lists = Lists.value?.sheets?.[0]?.sheet_lists || [];
  const allCards = lists.flatMap((col: any) =>
    (col.cards || []).map((card: any) => {
      const descVar = Array.isArray(card.variables)
        ? card.variables.find((v: any) => v.slug === "card-description")
        : null;
      return {
        ...card,
        columnId: col.title,
        "card-description": card["card-description"] || descVar?.value || "",
      };
    }),
  );
  return new Fuse(allCards, {
    keys: ["card-title", "card-description"],
    threshold: 0.3,
  });
});

// Helper: flatten cards from the /workspace/cards/grouped response.
// request() returns the JSON body directly — same level as Lists.value?.sheets[0] works.
// Without variable_id: { cards: [...], variable: null }
// With variable_id:    { sheets: [{ sheet_lists: [{ cards: [...] }] }] }
const flattenSheetListCards = (apiData: any): any[] => {
  // Flat response (no variable_id): root-level cards array
  if (Array.isArray(apiData?.cards)) return apiData.cards;
  // Grouped response: flatten sheets[].sheet_lists[].cards
  const all: any[] = [];
  (apiData?.sheets ?? []).forEach((sheet: any) => {
    (sheet.sheet_lists ?? []).forEach((list: any) => {
      (list.cards ?? []).forEach((card: any) => all.push(card));
    });
  });
  return all;
};

const filteredBoard = computed(() => {
  const query = debouncedQuery.value?.trim();
  if (view.value === "kanban") {
    if (!query) return Lists.value?.sheets[0]?.sheet_lists;
    const results = fuse.value
      .search(query)
      .map((r: any) => r.item);
    return Lists.value?.sheets[0]?.sheet_lists?.map((col: any) => ({
      ...col,
      cards: results.filter((c: any) => c.columnId === col.title),
    }));
  } else {
    // ── Table View: flatten all cards from FlatTableData (no variable_id passed) ──
    // API returns: { data: { sheets: [{ sheet_lists: [{ cards: [...] }] }] } }
    const flatCards: any[] = flattenSheetListCards(FlatTableData.value);
    let array: any[] = [...flatCards];
    if (!query) {
      if (localTableOrder.value.length > 0) {
        const cardMap = new Map();
        array.forEach((c: any) => cardMap.set(c._id, c));
        localPendingTickets.value.forEach((c: any) => cardMap.set(c.id, c));
        const ordered = localTableOrder.value
          .map((id) => cardMap.get(id))
          .filter(Boolean);
        const returnedIds = new Set(ordered.map((c) => c._id || c.id));
        const extras = [
          ...array.filter((c: any) => !returnedIds.has(c._id)),
          ...localPendingTickets.value.filter((c) => !returnedIds.has(c.id)),
        ];
        return [...ordered, ...extras];
      }
      return [...array, ...localPendingTickets.value];
    }

    const fuseTable = new Fuse(flattenSheetListCards(FlatTableData.value), {
      keys: ["card-title", "card-description"],
      threshold: 0.3,
    });
    const results = fuseTable.search(query).map((r) => r.item);
    return [...results, ...localPendingTickets.value];
  }
});

const tableGroups = computed(() => {
  // Only populate when a group is actively selected
  if (!selectedGroup.value) return [];
  const query = debouncedQuery.value?.trim();
  // Use TableGroupedLists (has variable_id) for grouped UI
  const sourceLists = TableGroupedLists.value?.sheets?.[0]?.sheet_lists ?? [];
  if (!query) return sourceLists;
  
  const fuseTable = new Fuse(
    sourceLists.flatMap((col: any) => (col.cards || []).map((c: any) => ({...c, columnId: col.title}))), 
    { keys: ["card-title", "card-description"], threshold: 0.3 }
  );
  const results = fuseTable.search(query).map((r: any) => r.item);
  return sourceLists.map((col: any) => ({
    ...col,
    cards: results.filter((c: any) => c.columnId === col.title),
  }));
});

// ─── Table Counts ─────────────────────────────────────────────────────────────
const totalTableCount = computed(() => {
  if (selectedGroup.value) {
    return tableGroups.value.reduce((acc: number, group: any) => acc + (group.cards?.length || 0), 0);
  }
  return filteredBoard.value.length;
});

const totalTableTotal = computed(() => {
  if (selectedGroup.value) {
    const sourceLists = TableGroupedLists.value?.sheets?.[0]?.sheet_lists ?? [];
    return sourceLists.reduce((acc: number, group: any) => acc + (group.cards?.length || 0), 0);
  }
  const flatCards = flattenSheetListCards(FlatTableData.value);
  return flatCards.length + localPendingTickets.value.length;
});

const refreshTable = async () => {
  await Promise.all([
    refetchSheetLists(),
    queryClient.invalidateQueries({ queryKey: ["table-cards-flat"] })
  ]);
};

function handleQuickCreate(title: string, group: any) { 
  if (!title?.trim()) return;   
  let cardPriority = '';
  let cardStatus = '';
  let cardType = '';
  let cardAssignee = '';
  let cardReporter = '';

  
  const label = selectedGroupLabel.value?.toLowerCase();
  
  if (label === 'priority') {
    cardPriority = group.title; 
  }

  if (label === 'status') {
    cardStatus = group.title;
  }

  if (label === 'card type') {
    cardType = group.title;
  }

  if (label === 'assignee') {
    cardAssignee = group?.cards[0]?.seat?._id; 
  }

  if (label === 'owner/reporter') {
    cardReporter = group.title;
    console.log(cardReporter)
  }

  const laneId = laneOptions.value[0]?._id || ""; 

  const payload = {
    "card-title": title,
    "card-status": cardStatus,
    "card-type": cardType,
    "priority": cardPriority,
    "seat_id": cardAssignee,
    workspace_lane_id: laneId,
    variables: {
      "card-title": title,
      "card-status": cardStatus || 'General',
      "card-type": cardType,
      "priority": cardPriority
    }
  };

  handleCreateTicket(payload);
}

// ─── Lanes ────────────────────────────────────────────────────────────────────
const { data: lanes } = useLanes(workspaceId);
const laneOptions = computed<any[]>(() =>
  (lanes?.value ?? []).map((el: any) => ({
    ...el,
    _id: el._id,
    title: el?.variables?.["lane-title"] ?? String(el._id),
  })),
);

// ─── Table Columns ────────────────────────────────────────────────────────────
const columns = computed(() => {
  return [
    {
      key: "card-title",
      label: "Title",
      render: ({ row, value }: any) =>
        h("div", { class: "flex items-center gap-1 w-full ps-2" }, [
          h(
            "a",
            {
              onClick: () => (selectedCard.value = row),
              class:
                "text-[12px] underline text-blue-500 shrink-0 overflow-ellipsis cursor-pointer",
            },
            row["card-code"],
          ),
          h("div", { class: "flex-1 min-w-0" }, [
            h("input", {
              onFocusout: (e: any) => {
                handleChangeTicket(row, "card-title", e?.target?.value);
              },
              class:
                "text-[12px] w-full overflow-ellipsis capitalize p-1 w-full p-1 focus:border border-accent/60 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent bg-transparent focus:bg-bg-body text-[12px] h-8",
              defaultValue: value,
              disabled: !canEditCard.value,
            }),
          ]),
        ]),
    },
    {
      key: "end-date",
      label: "Due Date",
      render: ({ row, value }: any) => {
        const date = ref<any>(value);
        return h(DatePicker, {
          class: "capitalize flex items-center gap-2 text-[12px]",
          placeholder: "Set start date",
          tableInputClass: true,
          modelValue: date.value,
          disabled: !canEditCard.value,
          "onUpdate:modelValue": (e: any) => setStartDate(row, e),
          emptyText: "Date",
        });
      },
    },
    {
      key: "lane",
      label: "Lane",
      render: ({ row }: any) =>
        h(TableSearchCell, {
          options: laneOptions.value ?? [],
          placeholder: "Select lane",
          modelValue: row.lane?._id || null,
          disabled: !canEditCard.value,
          "onUpdate:modelValue": (e: any) => setLane(row, e),
          displayField: "title",
          emptyText: "Lane",
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
    {
      key: "seat",
      label: "Assignee",
      render: ({ row, value }: any) =>
        h(TableAssigneeCell, {
          class: "capitalize flex items-center gap-2",
          onAssign: (users: any[]) => assignHandle(row, users),
          assigneeId: row.seats || row.seat_id || value,
          seat: row.seats || row.seat || value,
          name: true,
          disabled: !canAssignCard.value,
          emptyText: "Assignee",
        }),
    },
    ...(variables.value
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
              options: getOptions(e.data ?? []),
              modelValue: cellValue,
              disabled: !canEditCard.value,
              emptyText: e.slug,
              "onUpdate:modelValue": (val: any) => {
                handleChangeTicket(row, e.slug, val);
              },
              columnName: e.slug,
            }),
          ]);
        },
        visible: e?.is_visible,
      })) ?? []),
  ];
});

const assignHandle = (row: any, users: any[]) => {
  const id = row?._id;
  const userIds = (users || [])
    .filter((u) => u && (u._id || u.id))
    .map((u) => u._id || u.id);
  if (id) {
    updateOptimisticCard(id, (card) => {
      card.seat = users;
      card.seats = users;
      card.seat_id = userIds;
    });
    moveCard.mutate({ card_id: id, seat_id: userIds, optimisticUser: users });
  } else {
    row.seat = users;
    row.seats = users;
    row.seat_id = userIds;
    checkAndCreateTicket(row);
  }
};

const getOptions = (options: any) =>
  options.map((el: any) => ({ _id: el.value ?? el, title: el.value ?? el }));

// ─── Optimistic Updates ───────────────────────────────────────────────────────
const updateCardInLists = (cardId: string, updates: Record<string, any>) => {
  if (!Lists.value?.sheets[0]?.sheet_lists) return false;
  let found = false;
  const newLists = Lists.value?.sheets[0]?.sheet_lists?.map((column: any) => {
    const newCards = (column.cards || []).map((card: any) => {
      if (card._id !== cardId) return card;
      found = true;
      const updatedCard = { ...card, ...updates };
      if (Array.isArray(card.variables)) {
        const newVariables = [...card.variables];
        Object.entries(updates).forEach(([key, value]) => {
          const idx = newVariables.findIndex((v: any) => v.slug === key);
          if (idx !== -1) newVariables[idx] = { ...newVariables[idx], value };
          else newVariables.push({ slug: key, value, type: "Text" });
        });
        updatedCard.variables = newVariables;
      } else {
        updatedCard.variables = { ...(card.variables || {}), ...updates };
      }
      return updatedCard;
    });
    return { ...column, cards: newCards };
  });
  Lists.value = { ...Lists.value, data: newLists };
  return found;
};

const moveCard = useMoveCard({
  onMutate: async (newPayload: any) => {
    const { card_id, variables: updatedVariables } = newPayload;
    await queryClient.cancelQueries({ queryKey: ["product-card", card_id] });
    await queryClient.cancelQueries({ queryKey: ["sheet-list"] });
    const previousCard = queryClient.getQueryData(["product-card", card_id]);
    const previousLists = queryClient.getQueryData(["sheet-list"]);

    const updateCardLogic = (oldCard: any) => {
      if (!oldCard) return oldCard;
      const updatedCard = {
        ...oldCard,
        variables: Array.isArray(oldCard.variables)
          ? [...oldCard.variables]
          : { ...(oldCard.variables || {}) },
      };
      if (newPayload.style !== undefined) {
        updatedCard.style = newPayload.style;
      }
      if (updatedVariables) {
        Object.assign(updatedCard, updatedVariables);
        if (Array.isArray(updatedCard.variables)) {
          Object.entries(updatedVariables).forEach(([key, value]) => {
            const idx = updatedCard.variables.findIndex(
              (v: any) => v.slug === key,
            );
            if (idx !== -1)
              updatedCard.variables[idx] = {
                ...updatedCard.variables[idx],
                value,
              };
            else updatedCard.variables.push({ slug: key, value, type: "Text" });
          });
        } else {
          Object.assign(updatedCard.variables, updatedVariables);
        }
      }
      if (newPayload.optimisticUser) {
        const users = Array.isArray(newPayload.optimisticUser)
          ? newPayload.optimisticUser
          : [newPayload.optimisticUser];
        updatedCard.seats = users;
        updatedCard.seat_id = users
          .map((u: any) => u?._id || u?.id)
          .filter(Boolean);
        updatedCard.seat = users[0] || null;
      }
      if (newPayload.workspace_lane_id)
        updatedCard.workspace_lane_id = newPayload.workspace_lane_id;
      return updatedCard;
    };

    if (updatedVariables && Lists.value)
      updateCardInLists(card_id, updatedVariables);
    if (selectedCard.value && selectedCard.value._id === card_id)
      selectedCard.value = updateCardLogic(selectedCard.value);

    queryClient.setQueryData(["product-card", card_id], updateCardLogic);
    queryClient.setQueriesData(
      { queryKey: ["sheet-list"], exact: false },
      (old: any) => {
        if (!old) return old;

        // CASE 1: array (rare)
        if (Array.isArray(old)) {
          return old.map((column: any) => ({
            ...column,
            cards: column.cards?.map((card: any) =>
              card._id === card_id ? updateCardLogic(card) : card,
            ),
          }));
        }

        // CASE 2: object with data (MOST COMMON)
        if (Array.isArray(old.data)) {
          return {
            ...old,
            data: old.data.map((column: any) => ({
              ...column,
              cards: column.cards?.map((card: any) =>
                card._id === card_id ? updateCardLogic(card) : card,
              ),
            })),
          };
        }

        return old;
      },
    );
    triggerRef(Lists);
    return { previousCard, previousLists };
  },
  onError: (err: any, variables: any, context: any) => {
    if (context?.previousCard)
      queryClient.setQueryData(
        ["product-card", variables.card_id],
        context.previousCard,
      );
    if (context?.previousLists)
      queryClient.setQueryData(["sheet-list"], context.previousLists);
    if (
      selectedCard.value &&
      selectedCard.value._id === variables.card_id &&
      context?.previousCard
    ) {
      selectedCard.value = context.previousCard;
    }
    console.log(err);
  },
});
const updateMoveCard = useMoveCard({
  onMutate: async (newPayload: any) => {
    const { card_id, variables: updatedVariables } = newPayload;

    await queryClient.cancelQueries({ queryKey: ["product-card", card_id] });
    await queryClient.cancelQueries({ queryKey: ["sheet-list"] });
    toast.success("Card Formatted successfully");
    const previousCard = queryClient.getQueryData(["product-card", card_id]);
    const previousLists = queryClient.getQueryData(["sheet-list"]);

    const updateCardLogic = (oldCard: any) => {
      if (!oldCard || oldCard._id !== card_id) return oldCard;

      const updatedCard = {
        ...oldCard,
        variables: Array.isArray(oldCard.variables)
          ? [...oldCard.variables]
          : [],
      };

      if (updatedVariables) {
        Object.assign(updatedCard, updatedVariables);

        Object.entries(updatedVariables).forEach(([key, value]) => {
          const idx = updatedCard.variables.findIndex(
            (v: any) => v.slug === key,
          );

          if (idx !== -1) {
            updatedCard.variables[idx] = {
              ...updatedCard.variables[idx],
              value,
            };
          } else {
            updatedCard.variables.push({ slug: key, value, type: "Text" });
          }

          if (key === "card-description") {
            updatedCard["card-description"] = value;
            updatedCard.description = value;
          }
        });
      }

      if (newPayload.workspace_lane_id) {
        updatedCard.workspace_lane_id = newPayload.workspace_lane_id;
      }

      if (newPayload.optimisticUser) {
        const users = Array.isArray(newPayload.optimisticUser)
          ? newPayload.optimisticUser
          : [newPayload.optimisticUser];
        updatedCard.seats = users;
        updatedCard.seat_id = users
          .map((u: any) => u?._id || u?.id)
          .filter(Boolean);
        updatedCard.seat = users[0] || null;
        updatedCard.assigned_to = users;
      }

      return updatedCard;
    };

    // Update product-card cache
    queryClient.setQueryData(["product-card", card_id], updateCardLogic);

    // Update sheet-list cache
    queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
      if (!old || !Array.isArray(old.data)) return old;
      return {
        ...old,
        data: old.data.map((column: any) => ({
          ...column,
          cards: column.cards?.map((card: any) =>
            card._id === card_id ? { ...updateCardLogic(card) } : card,
          ),
        })),
      };
    });
    return { previousCard, previousLists };
  },

  onSuccess: (serverCard: any, variables: any) => {
    const cardId = variables.card_id;

    if (serverCard) {
      // Update product-card cache with server response
      queryClient.setQueryData(["product-card", cardId], serverCard);

      // Update sheet-list cache with server response
      queryClient.setQueryData(["sheet-list"], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((column: any) => ({
            ...column,
            cards: column.cards?.map((card: any) =>
              card._id === cardId ? { ...card, ...serverCard } : card,
            ),
          })),
        };
      });

      // Update ALL sprint-kanban queries with server response
      queryClient.setQueriesData(
        { queryKey: ["sprint-kanban"] },
        (old: any) => {
          if (!old || !Array.isArray(old)) return old;

          const hasCard = old.some((col: any) =>
            col.cards?.some((c: any) => c._id === cardId),
          );

          if (!hasCard) return old;

          return old.map((col: any) => ({
            ...col,
            cards: (col.cards ?? []).map((card: any) =>
              card._id === cardId ? { ...card, ...serverCard } : card,
            ),
          }));
        },
      );
      queryClient.invalidateQueries({
        queryKey: ["product-card", cardId],
      });
    }
  },

  onError: (_err: any, variables: any, context: any) => {
    if (!context) return;

    const cardId = variables.card_id;

    // Rollback product-card cache
    queryClient.setQueryData(["product-card", cardId], context.previousCard);

    // Rollback sheet-list cache
    queryClient.setQueriesData(
      { queryKey: ["sheet-list"] },
      context.previousLists,
    );
  },

  onSettled: (_data: any, _err: any, variables: any) => {
    const cardId = variables.card_id;

    queryClient.invalidateQueries({ queryKey: ["product-card", cardId] });
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
  },
});
function incrementCommentCount({ cardId }: { cardId: string }) {
  queryClient.setQueriesData({ queryKey: ["sheet-list"] }, (old: any) => {
    if (!Array.isArray(old)) return old;
    return old.map((column: any) => ({
      ...column,
      cards: column.cards.map((card: any) =>
        card._id === cardId
          ? { ...card, comment_count: (card.comment_count || 0) + 1 }
          : card,
      ),
    }));
  });
}

const updateOptimisticCard = (cardId: string, updater: (card: any) => void) => {
  const cols = Lists.value?.sheets[0]?.sheet_lists || [];
  if (!Array.isArray(cols)) return;
  for (const column of cols) {
    if (!column.cards) continue;
    const cardIndex = column.cards.findIndex((c: any) => c._id === cardId);
    if (cardIndex !== -1) {
      updater(column.cards[cardIndex]);
      triggerRef(Lists);
      break;
    }
  }
};

// ─── Ticket CRUD ──────────────────────────────────────────────────────────────
interface Card {
  _id: string;
}
interface SheetList {
  cards: Card[];
}
interface Sheet {
  sheet_lists: SheetList[];
}

const removeCardFromState = (cardId: string) => {
  Lists.value?.data?.sheets?.forEach((sheet: Sheet) => {
    sheet.sheet_lists?.forEach((list: SheetList) => {
      list.cards = list.cards.filter((card: Card) => card._id !== cardId);
    });
  });
};

const deleteTicket = async () => {
  if (!selectedDeleteId.value) return;
  try {
    isDeletingTicket.value = true;
    await request({
      url: `workspace/card/${selectedDeleteId.value}`,
      method: "DELETE",
    });
    removeCardFromState(selectedDeleteId.value);
    showTicketDelete.value = false;
    ticketToDelete.value = null;
    toast.success("Ticket deleted successfully");
    await refetchSheets();
    await refetchSheetLists();
    // Also refetch flat table data so the deleted card disappears immediately
    queryClient.invalidateQueries({ queryKey: ['table-cards-flat'] });
  } catch (err) {
    toast.error(toApiMessage(err));
  } finally {
    isDeletingTicket.value = false;
  }
};

const handleDeleteTicket = async () => {
  await deleteTicket();
};

const { mutate: addTicket } = useAddTicket({
  onSuccess: (newCard:any) => {
  queryClient.setQueriesData(
    { queryKey: ["sheet-list"], exact: false },
    (oldData: any) => {
      if (!oldData) return oldData;

      const isList = Array.isArray(oldData);
      const sheets: any[] = isList ? oldData : (oldData?.data ?? oldData?.sheets ?? []);

      const updatedSheets = sheets.map((sheet: any) => {
        if (sheet._id !== newCard?.sheet_id) return sheet;

        const existingCards: any[] = sheet.cards ?? [];
        const alreadyExists = existingCards.some((c) => c._id === newCard._id);
        if (alreadyExists) return sheet;

        return { ...sheet, cards: [...existingCards, newCard] };
      });

      return isList ? updatedSheets : { ...oldData, data: updatedSheets };
    },
  );

    toast.success("Ticket created successfully");
    tableViewRef.value?.closeQuickCreate();
    localPendingTickets.value = [];
    localTableOrder.value = [];
},
});

const tableViewRef = ref<any>(null);

const { mutate: addTableTicket, isPending: isAddingTableTicket } = useAddTicket({
  onSuccess: () => {
    localPendingTickets.value = []
    localTableOrder.value = []
    // Auto-close the quick create UI in TableView
    tableViewRef.value?.closeQuickCreate();
    toast.success("Ticket created successfully");
    // Invalidate both the grouped lists AND the flat table data so the new card appears immediately
    queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
    queryClient.invalidateQueries({ queryKey: ['table-cards-flat'] })
  }
})

function checkAndCreateTicket(row: any) {
  const title = row["card-title"];
  const laneId = row.lane?._id || row.workspace_lane_id;
  let status = row["card-status"];
  let type = row["card-type"];
  let priority = row["priority"]; 

  if (Array.isArray(row.variables)) {
    const sVar = row.variables.find((v: any) => v.slug === "card-status");
    if (sVar) status = sVar.value;
    const tVar = row.variables.find((v: any) => v.slug === "card-type");
    if (tVar) type = tVar.value;
  } else if (typeof row.variables === "object" && row.variables !== null) {
    status = row.variables["card-status"] || status;
    type = row.variables["card-type"] || type;
  }

  if (title) {
    const payloadVariables: Record<string, any> = {};
    if (variables.value)
      variables.value.forEach((v: any) => {
        payloadVariables[v.slug] = null;
      });

    payloadVariables["card-title"] = title.trim();
    payloadVariables["card-status"] = status;
    payloadVariables["card-type"] = type;
    payloadVariables["priority"] = priority;

    Object.keys(row).forEach((key) => {
      if (payloadVariables.hasOwnProperty(key))
        payloadVariables[key] = row[key];
    });

    if (Array.isArray(row.variables)) {
      row.variables.forEach((v: any) => {
        if (payloadVariables.hasOwnProperty(v.slug))
          payloadVariables[v.slug] = v.value;
      });
    } else if (typeof row.variables === "object" && row.variables !== null) {
      Object.entries(row.variables).forEach(([k, v]) => {
        if (payloadVariables.hasOwnProperty(k)) payloadVariables[k] = v;
      });
    }

    const payload = {
      sheet_list_id: status,
      workspace_id: workspaceId.value,
      sheet_id: selected_sheet_id.value,
      workspace_lane_id: laneId,
      seat_id: row.seat?._id || row.seat_id || null,
      variables: payloadVariables,
      "start-date": row["start-date"] || null,
      "end-date": row["end-date"] || null,
      createdAt: new Date().toISOString(),
    };
    addTableTicket(payload);
  } else {
    console.warn("Card creation blocked: Missing required fields", { title, status, type });
    if (title) {
        toast.error(`Please provide ${!status ? 'Status' : ''} ${!status && !type ? 'and ' : ''} ${!type ? 'Type' : ''}`);
    }
  }
}

function handleChangeTicket(row: any, key: any, value: any) {
  const id = row?._id;
  const cleanValue = typeof value === "string" ? value.trim() : value;
  if (id) {
    updateOptimisticCard(id, (card) => {
      card[key] = cleanValue;
      if (Array.isArray(card.variables)) {
        const varIndex = card.variables.findIndex((v: any) => v.slug === key);
        if (varIndex !== -1) card.variables[varIndex].value = cleanValue;
        else
          card.variables.push({ slug: key, value: cleanValue, type: "Text" });
      } else if (
        typeof card.variables === "object" &&
        card.variables !== null
      ) {
        card.variables[key] = cleanValue;
      }
      if (selectedCard.value?._id === id) selectedCard.value[key] = cleanValue;
    });
    moveCard.mutate({ card_id: id, variables: { [key]: cleanValue } });
  } else {
    row[key] = cleanValue;
    if (Array.isArray(row.variables)) {
      const varIndex = row.variables.findIndex((v: any) => v.slug === key);
      if (varIndex !== -1) row.variables[varIndex].value = cleanValue;
      else row.variables.push({ slug: key, value: cleanValue, type: "Text" });
    } else {
      if (!row.variables) row.variables = {};
      row.variables[key] = cleanValue;
    }
    checkAndCreateTicket(row);
  }
}

function handleCreateTicket(row: any) {
  checkAndCreateTicket(row);
}

const setStartDate = (row: any, e: any) => {
  const card_id = row?._id;
  if (card_id) {
    updateOptimisticCard(card_id, (card) => {
      card["end-date"] = e;
    });
    moveCard.mutate({ card_id, variables: { "start-date": e } });
  } else {
    row["end-date"] = e;
    checkAndCreateTicket(row);
  }
};

function setLane(row: any, v: any) {
  const id = row?._id;
  if (id) {
    updateOptimisticCard(id, (card) => {
      const newLane = laneOptions.value.find((l: any) => l._id === v);
      if (newLane) card.lane = newLane;
    });
    triggerRef(Lists);
    moveCard.mutate({ card_id: id, workspace_lane_id: v });
  } else {
    const newLane = laneOptions.value.find((l: any) => l._id === v);
    if (newLane) {
      row.lane = newLane;
      row.workspace_lane_id = v;
    }
    checkAndCreateTicket(row);
  }
}

const { mutate: toggleVisibility } = useVarVisibilty();
const toggleVisibilityHandler = (key: any, visible: any) => {
  toggleVisibility({
    payload: {
      sheet_id: selected_sheet_id.value,
      workspace_id: workspaceId.value,
      variable_slug: key,
      is_visible: visible,
    },
  });
};

// ─── MindMap event handlers (bridge from MindMapView to parent data) ──────────
const { mutateAsync: createNewSheet } = useCreateWorkspaceSheet({
  onSuccess: (newSheet: any) => {
    queryClient.invalidateQueries({ queryKey: ["sheets"] });
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    const newId = newSheet?._id;
    if (newId) {
      selected_sheet_id.value = newId;
      localStorage.setItem(storageKey.value, newId);
    }
  },
});

async function handleMindmapDeleteTicket(cardId: string) {
  selectedDeleteId.value = cardId;
  await deleteTicket();
}

async function handleMindmapCreateSheet(payload: any) {
  try {
    await createNewSheet(payload);
  } catch (err) {
    console.error("Error creating workspace sheet:", err);
  }
}

function handleMindmapCreateCard(payload: any) {
  addTicket(payload);
}

function handleMindmapUpdateCard(payload: any) {
  updateMoveCard.mutate(payload);
}

function handleMindmapUpdateSheet(payload: any) {
  updateSheet(payload);
}

function handleMindmapReorderCard(_payload: any) {
  refetchSheets();
  refetchSheetLists();
}

// ─── Global window exposure ───────────────────────────────────────────────────
declare global {
  interface Window {
    toggleMenu: (el: HTMLElement) => void;
    handleEdit: (e: Event) => void;
    handleDelete: (e: Event) => void;
    handleStatusChange: (
      e: Event,
      sheetIdx: number,
      listIdx: number,
      cardIdx: number,
    ) => void;
  }
}

</script>

<style scoped>
/* Force visible scrollbars only where applied */
.scrollbar-visible::-webkit-scrollbar {
  display: block !important;
  height: 8px;
  width: 8px;
}
.scrollbar-visible::-webkit-scrollbar-thumb {
  background-color: rgba(150, 150, 150, 0.4);
  border-radius: 8px;
}
.scrollbar-visible::-webkit-scrollbar-thumb:hover {
  background-color: rgba(150, 150, 150, 0.6);
}
.scrollbar-visible {
  scrollbar-width: thin !important;
  scrollbar-color: rgba(150, 150, 150, 0.5) transparent !important;
}
</style>