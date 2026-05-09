<template>
  <div class="flex h-full w-full gap-2">
    <div
      class="flex-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px]
      flex flex-col border border-border overflow-hidden"
    >
      <div class="sticky top-0 z-20 bg-bg-card overflow-x-auto shrink-0">
        <div
          class="header lg:px-4 px-2 py-2 flex justify-between items-center gap-1 overflow-auto border-b border-border"
        >
          <div class="flex lg:gap-4 gap-2 py-1 items-center">
            <div>
              <button
                class=" bg-bg-body px-2 py-2 rounded-[6px] font-medium text-[14px] cursor-pointer gap-2 flex items-center"
                @click="$emit('go-back')"
                tooltip="go back"
                v-tooltip="'Go Back'"
              >
                <i class="fa-solid fa-chevrons-left text-[10px]"></i> Back
              </button>
            </div> 
            <div
              class="text-lg font-semibold text-foreground text-nowrap"
            >
              {{ activeSprintTitle }}
            </div>
          </div>

          <!-- VIEW SWITCHER -->
          <div class="flex gap-3 items-center">
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
                  :hidePlanItems="true"
                  @apply="(f: any) => { handleApplyFilters(f); showFilterBar = false; }"
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

            <SearchBar
            @onChange="(e: string) => { search = e; }"
            placeholder="Search in Orchit AI space"
          />
            <div class="flex gap-3 items-center">
              <div class="flex items-center gap-3 bg-bg-surface/50 h-[32px] px-2 rounded-md">
                <button
                  class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                  :class="view === 'kanban'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  @click="view = 'kanban'"
                >
                  <i class="fa-solid fa-chart-kanban"></i>
                </button>

                <button
                  @click="view = 'table'"
                  class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                  :class="view === 'table'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  title="Gallery view"
                >
                  <i class="fa-solid fa-align-left"></i>
                </button>

                <!-- MindMap button — kept, logic lives in MindMapView component -->
                <button
                  @click="view = 'mindmap'"
                  class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                  :class="view === 'mindmap'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  title="MindMap view"
                >
                  <i class="fa-solid fa-chart-diagram"></i>
                </button>

                <button
                  @click="view = 'calendar'"
                  class="aspect-square cursor-pointer rounded-sm p-0 px-0.5"
                  :class="view === 'calendar'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  title="Calendar view"
                >
                  <i class="fa-regular fa-calendar"></i>
                </button>

                <button
                  @click="view = 'gantt'"
                  class="aspect-square cursor-pointer rounded-sm p-0"
                  :class="view === 'gantt'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  title="Gantt Chart view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 6h2v12H4V6Zm4 4h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h10v2H8V6Z" />
                  </svg>
                </button>

                <button
                  @click="view = 'timeline'"
                  class="aspect-square cursor-pointer rounded-sm p-0"
                  :class="view === 'timeline'
                    ? 'text-accent bg-accent-text'
                    : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                  title="Timeline view"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
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
      </div>

      <!-- ===== MAIN ===== -->
      <div class="flex flex-1 overflow-hidden bg-bg-card">
        <div class="flex-1 min-w-0 flex flex-col">

          <!-- ── Kanban View ─────────────────────────────────────── -->
          <template v-if="view === 'kanban'">
            <KanbanSkeleton v-show="isPending" />
            <div
              v-show="!isPending"
              class="flex-1 overflow-x-auto overflow-y-hidden scrollbar-visible py-4 mx-4"
            >
              <div class="flex gap-3 min-w-max h-full">
                <KanbanBoard
                  class="flex h-full"
                  :board="filteredBoard"
                  :variable_id="selected_view_by"
                  :sheet_id="selected_sheet_id"
                  :sprint_id="selected_sprint_id"
                  @onPlus="plusHandler"
                  @delete:column="(e: any) => deleteHandler(e)"
                  @update:column="(e: any) => handleUpdateColumn(e)"
                  @reorder="onReorder"
                  @addColumn="handleAddColumn"
                  @select:ticket="selectCardHandler"
                  @onBoardUpdate="handleBoardUpdate"
                >
                  <!-- <template #column-footer="column">
                    <div
                      class="mx-auto text-text-secondary/80 m-2 w-[90%] h-full justify-center flex items-center border border-dashed border-border"
                      v-if="
                        workspaceStore?.transitions?.all_allowed &&
                        !workspaceStore?.transitions?.all_allowed?.includes(column.column.title) &&
                        workspaceStore.transitions.currentColumn != column.column.title
                      "
                    >
                      Disable ( you can't drop here )
                    </div>
                  </template> -->

                  <template #ticket="{ ticket }">
                    <div class="max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                      <KanbanTicket
                        :selectedVar="selected_view_by"
                        :ticket="ticket"
                        :invalidateKeys="['sprint-kanban', 'sprint-table-flat']"
                        :workspaceId="workspaceId"
                        :moduleId="selected_module_id"
                        @select="() => selectCardHandler(ticket)"
                      />
                    </div>
                  </template>
                </KanbanBoard>
              </div>
            </div>
          </template>

          <!-- ── Table View ──────────────────────────────────────── -->
          <template v-if="view === 'table'">
            <div class="flex-1 overflow-auto ps-4 pe-4">
              <TableView
                ref="tableViewRef"
                @toggleVisibility="toggleVisibilityHandler"
                @addVar="() => { isCreateVar = true }"
                :isPending="isPending || isVariablesPending || isFlatTablePending || (!!selectedGroup && isTablePending)"
                :isCreating="isAddingTableTicket"
                :columns="columns"
                :rows="filteredBoard"
                :canCreate="canCreateCard"
                :canCreateVariable="canCreateVariable"
                :canDelete="canDeleteCard"
                @delete="handleDeleteTicketModal"
                @create="handleCreateTicket"
                @quickCreate="handleQuickCreate"
                @refresh="refreshTable"
                @update:rows="handleTableRowsUpdate"
                :groups="tableGroups"
                :isGrouped="!!selectedGroup"
                :selectedGroup="selectedGroup"
                :totalCount="totalTableCount"
                :totalTotal="totalTableTotal"
              />
            </div>
          </template>

          <!-- ── MindMap View ─────────────────────────────────────── -->
          <template v-if="view === 'mindmap'">
            <div class="relative flex-1 flex flex-col overflow-hidden px-2">
              <div v-if="isPending" class="absolute inset-0 z-20 flex items-center justify-center bg-bg-card/60 backdrop-blur-[2px]">
                <div class="flex flex-col items-center gap-3">
                  <i class="fa-solid fa-spinner fa-spin text-accent text-3xl"></i>
                  <span class="text-sm font-medium text-text-secondary italic">Mapping your data...</span>
                </div>
              </div>
              <MindMapView
                :listsData="filteredBoard ?? []"
              :style="Lists?.style"
              :selectedSheetId="selected_sheet_id"
              :selectedViewBy="selected_view_by"
              :workspaceId="workspaceId"
              :moduleId="moduleId"
              :sheetId="selectedSheetId"
              :addingList="!!addingList"
              :activeAddList="activeAddList"
              :newColumn="newColumn"
              :canCreateCard="canCreateCard"
              :canEditCard="canEditCard"
              :canDeleteCard="canDeleteCard"
              :canAssignCard="canAssignCard"
              :canCreateSheet="false"
              :canCreateVariable="canCreateVariable"
              :canEditSheet="false"
              @select:ticket="selectCardHandler"
              @delete:ticket="handleMindmapDeleteTicket"
              @create:sheet="handleMindmapCreateSheet"
              @create:card="handleMindmapCreateCard"
              @update:card="handleMindmapUpdateCard"
              @update:sheet="handleMindmapUpdateSheet"
              @reorder:card="handleMindmapReorderCard"
              @toggle-add-list="setActiveAddList"
              @add-column="handleAddColumn"
              @save:theme="handleSaveTheme "
            />
          </div>
          </template>

          <!-- ── Calendar View ───────────────────────────────────── -->
          <template v-if="view === 'calendar'" class="max-h-[calc(100vh-100px)] overflow-y-auto">
            <CalendarView
              :data="filteredBoard"
              @select:ticket="selectCardHandler"
              class="min-h-[600px]"
            />
          </template>

          <!-- ── Gantt View ───────────────────────────────────────── -->
          <template v-if="view === 'gantt'" class="max-h-[calc(100vh-100px)] overflow-y-auto">
            <GanttChartView
              :data="filteredBoard"
              @select:ticket="selectCardHandler"
            />
          </template>

          <!-- ── Timeline View ───────────────────────────────────── -->
          <template v-if="view === 'timeline'" class="max-h-[calc(100vh-100px)] overflow-y-auto">
            <TimelineView
              :data="filteredBoard"
              @select:ticket="selectCardHandler"
            />
          </template>

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
            @cancel="() => { showDelete = false }"
          />

          <CreateTaskModal
            :selectedVariable="selected_view_by"
            :listId="localColumnData?.title"
            :sheet_id="selected_sheet_id"
            :sprint_id="sprintId"
            :sheetVariables="variables"
            :sheets="sheets"
            v-if="createTeamModal"
            key="createTaskModalKey"
            v-model="createTeamModal"
            @submit=""
          />

          <ConfirmDeleteModal
            v-model="showTicketDelete"
            title="Delete Ticket"
            itemLabel="Ticket"
            :itemName="ticketToDelete?.['card-title'] || ticketToDelete?.title"
            :requireMatchText="ticketToDelete?.['card-title'] || ticketToDelete?.title"
            confirmText="Delete Ticket"
            cancelText="Cancel"
            size="md"
            :loading="isDeletingTicket"
            @confirm="deleteTicket"
            @cancel="
              () => {
                showTicketDelete = false;
                ticketToDelete = null;
              }
            "
          />

          <CreateVariableModal
            v-model="isCreateVar"
            v-if="isCreateVar"
            :sheetID="selected_sheet_id || sheetId"
          />

        </div>
      </div>
    </div>

    <!-- ===== SIDE PANEL ===== -->
    <SidePanel
      v-if="selectedCard?._id"
      class="shrink-0 h-full"
      :details="selectedCard"
      :moduleId="selected_sprint_id"
      moduleName="plan"
      @close="() => selectCardHandler({ variables: {} })"
      :showPanel="!!selectedCard?._id"
    />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  ref,
  watch,
  h, 
  onMounted,
} from "vue";
import { toast } from "vue-sonner";
import { usePermissions } from "../../../composables/usePermissions";
import { useWorkspaceStore } from "../../../stores/workspace";
import TableView from "../../../components/feature/TableView/TableView.vue";
import { request, toApiMessage } from "../../../libs/api";
import {
  ReOrderCard,
  ReOrderList,
  useAddList,
  useSheets,
  useVariables,
  useLanes,
  useMoveCard,
  useCreateWorkspaceSheet,
  useUpdateWorkspaceSheet,
  useVarVisibilty,
  useAddTicket,
} from "../../../queries/useSheets";
import { useRoute, useRouter } from "vue-router";
import KanbanSkeleton from "../../../components/skeletons/KanbanSkeleton.vue";
import { useQueryClient } from "@tanstack/vue-query";
import { useRouteIds } from "../../../composables/useQueryParams";
import { useSprintKanban, useSprintTable } from "../../../queries/usePlan";
import KanbanTicket from "../../../components/feature/kanban/KanbanTicket.vue";
import Fuse from "fuse.js";
import { debounce } from "lodash";
import { useSingleWorkspace } from "../../../queries/useWorkspace";
import { getInitials } from "../../../utilities";
import { avatarColor } from "../../../utilities/avatarColor";
import SearchBar from "../../../components/ui/SearchBar.vue";
import { useSidePanelStore } from "../../../stores/sidePanelStore";
import { useUpdateSprint } from "../../../queries/usePlan";
import { performOptimisticUpdate, rollbackOptimisticUpdate } from "../../../utilities/cacheSync";
// ─── Lazy components ──────────────────────────────────────────────────────────
const CreateTaskModal = defineAsyncComponent(() => import("../../Product/modals/CreateTaskModal.vue"));
const ConfirmDeleteModal = defineAsyncComponent(() => import("../../Product/modals/ConfirmDeleteModal.vue"));
const SidePanel = defineAsyncComponent(() => import("../../Product/components/SidePanel.vue"));
const KanbanBoard = defineAsyncComponent(() => import("../../../components/feature/kanban/KanbanBoard.vue"));
const DatePicker = defineAsyncComponent(() => import("../../Product/components/DatePicker.vue"));
const TableSearchCell = defineAsyncComponent(() => import("../../../components/feature/TableView/TableSearchCell.vue"));
const TableAssigneeCell = defineAsyncComponent(() => import("../../../components/feature/TableView/TableAssigneeCell.vue"));
const CalendarView = defineAsyncComponent(() => import("../../../components/feature/CalendarView.vue"));
const GanttChartView = defineAsyncComponent(() => import("../../../components/feature/GanttChartView.vue"));
const TimelineView = defineAsyncComponent(() => import("../../../components/feature/TimelineView.vue"));
const MindMapView = defineAsyncComponent(
  () => import("../../../components/feature/MindmapView.vue"),
);
const ProductFilters = defineAsyncComponent(
  () => import("../../Product/components/ProductFilters.vue"),
);
const TableGroupDropdown = defineAsyncComponent(
  () => import("../../Product/components/TableGroupDropdown.vue"),
);
const VariableViewDropdown = defineAsyncComponent(
  () => import("../../Product/components/VariableViewDropdown.vue"),
);
const CreateVariableModal = defineAsyncComponent(
  () => import("../../Product/modals/CreateVariableModal.vue"),
);
// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{
  sprint_id: any;
  searchQuery: string;
  activeSprint: string;
  selectedSheetId:string;
}>();
const {
  canCreateVariable,
  canCreateCard,
  canEditCard,
  canDeleteCard,
  canAssignCard,
} = usePermissions();
const view = ref("kanban");
const search = ref("");
const route = useRoute();
const router = useRouter();
const { workspaceId, moduleId } = useRouteIds();

// ─── Initializers ─────────────────────────────────────────────────────────────
onMounted(() => {
  openPanelFromRoute();
});

watch(
  () => route.query.card_id,
  () => openPanelFromRoute(),
);
 

async function openPanelFromRoute() {
  const cardId = route.query.card_id as string;
  if (!cardId) return;
  selectCardHandler({ _id: cardId, id: cardId });
}
// ─── Selection & Grouping ─────────────────────────────────────────────────────
const queryClient = useQueryClient();
const workspaceStore = useWorkspaceStore();
const isCreateVar = ref(false);
const selected_module_id = ref<string>("");
const selectedCard = ref<any>();
const createTeamModal = ref(false);
const showDelete = ref(false);
const localColumnData = ref();
const activeAddList = ref(false);
const newColumn = ref("");
const showDeleteModal = ref(false);
const selectedDeleteId = ref<string | null>(null);
const isDeletingTicket = ref(false);
const selectedSheetTitle = ref<string>("");
const isAddingTableTicket = ref(false);
const localPendingTickets = ref<any[]>([]);
const localTableOrder = ref<any[]>([]);
const tableViewRef = ref<any>(null);

const handleTableRowsUpdate = (newRows: any[]) => {
  localPendingTickets.value = newRows.filter((r) => !r._id);
  localTableOrder.value = newRows.map((r) => r._id || r.id);
};

const { data: workspaces } = useSingleWorkspace(workspaceId.value);
const modules = ref(workspaces.value.modules || []);
const activeSprintTitle = localStorage.getItem("selectedSprintTitle")
const sidePanelStore = useSidePanelStore()
const moduleOptions = computed(() => {
  return (modules.value || []).map((m: any) => ({
    _id: m._id,
    title: m.variables?.["module-title"] ?? "Untitled module",
    description: m.variables?.["module-description"] ?? "",
    icon: m.icon ?? null,
    status: m.status ?? null,
  }));
});

watch(
  moduleOptions,
  (opts) => {
    if (!opts.length) return;
    if (!selected_module_id.value) {
      const defaultModule = opts.find((m: any) => m.title === "Tasks") || opts[0];
      selected_module_id.value = defaultModule._id;
    }
  },
  { immediate: true },
); 

const { data: sheets, refetch: refetchSheets } = useSheets({
  workspace_id: workspaceId.value,
  workspace_module_id: selected_module_id.value,
}); 

watch(selected_module_id, (newModuleId) => {
  if (newModuleId) refetchSheets();
});
const laneIds = computed(() => {
  return workspaceStore.selectedLaneIds;
});
const sheetId = computed(() => (sheets.value ? sheets.value[0]?._id : ""));
const selected_sheet_id = ref<any>(sheetId);
const { data: variables, isPending: isVariablesPending } = useVariables(
  workspaceId,
  selected_module_id,
  selected_sheet_id,
);

const viewBy = computed(() => (variables.value ? variables.value[0]?._id : ""));
const selected_view_by = ref(viewBy.value);
watch(viewBy, () => {
  if (!selected_view_by.value) selected_view_by.value = viewBy.value;
});
const selected_sprint_id = ref(props.sprint_id || localStorage.getItem("activeSprintKey"));
watch(() => props.sprint_id, (newId) => {
  if (newId) {
    selected_sprint_id.value = newId;
  }
});

// Clear nested process selection when the main grouping variable changes
// We use a flag to skip clearing when the change comes from a nested selection
let lastSelectionWasNested = false;
watch(selected_view_by, () => {
    if (!lastSelectionWasNested) {
        selectedProcessMeta.value = null;
    }
    lastSelectionWasNested = false;
});

// ─── Filter Logic ─────────────────────────────────────────────────────────────
const showFilterBar = ref(false);
const activeFilters = ref<any>({});
const filterTriggerRef = ref<HTMLElement | null>(null);

const showGroupDropdown = ref(false);
const groupTriggerRef = ref<HTMLElement | null>(null);
const selectedGroup = ref<string>("");

const showVariableDropdown = ref(false);
const variableTriggerRef = ref<HTMLElement | null>(null);
const selectedProcessMeta = ref<any>(null);

const handleProcessNestedSelection = (item: any, _rootOpt: any) => {
  lastSelectionWasNested = true;
  selectedProcessMeta.value = item;
};

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

const GROUP_OPTIONS: Record<string, string> = {
  None: "",
  Status: "status",
  Priority: "priority",
  Assignee: "assignee",
  "Owner/Reporter": "owner",
  "Card Type": "card_type",
};

const selectedGroupLabel = computed(() => {
  return selectedGroup.value
    ? Object.keys(GROUP_OPTIONS).find((k) => GROUP_OPTIONS[k] === selectedGroup.value)
    : "None";
});

const closeAllDropdowns = (except: string) => {
  if (except !== 'variable') showVariableDropdown.value = false;
  if (except !== 'filter') showFilterBar.value = false;
  if (except !== 'group') showGroupDropdown.value = false;
};

const toggleVariableDropdown = () => {
  closeAllDropdowns('variable');
  showVariableDropdown.value = !showVariableDropdown.value;
};

const toggleGroupDropdown = () => {
  const willShow = !showGroupDropdown.value;
  if (willShow) closeAllDropdowns('group');
  showGroupDropdown.value = willShow;
};

const toggleFilters = () => {
  const willShow = !showFilterBar.value;
  if (willShow) closeAllDropdowns('filter');
  showFilterBar.value = willShow;
};

const formattedExtraParams = computed(() => {
  const f = activeFilters.value;
  const toLower = (val: any) =>
    typeof val === "string" ? val.toLowerCase() : val;

  const result: any = {
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

  return result;
});

const kanbanExtraParams = computed(() => ({
  ...formattedExtraParams.value,
  variable_id: selected_view_by.value
}));

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

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

// ─── Queries ──────────────────────────────────────────────────────────────────
// Kanban view data (defaults to Status grouping handled by the hook)
const {
  data: Lists,
  isPending,
  refetch: refetchSheetLists,
} = useSprintKanban(selected_sprint_id, laneIds, kanbanExtraParams);

// Dedicated flat Table View data (no variable_id passed = no grouping)
const {
  data: FlatTableData,
  isPending: isFlatTablePending,
} = useSprintTable(selected_sprint_id, laneIds, formattedExtraParams);

const tableActiveVariableId = computed(() => {
  if (!selectedGroup.value) return "";
  const group = selectedGroup.value;
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

const tableActiveVariableSlug = computed(() => {
  if (selectedGroup.value === 'assignee') return 'assigned_to';
  if (selectedGroup.value === 'owner') return 'created_by';
  return '';
});

const tableGroupExtraParams = computed(() => {
  const base = formattedExtraParams.value || {};
  const result = { ...base };
  if (tableActiveVariableSlug.value) {
    result.variable_slug = tableActiveVariableSlug.value;
  }
  if (tableActiveVariableId.value) {
    result.variable_id = tableActiveVariableId.value;
  }
  return result;
});

// Grouped Table View data
const {
  data: TableGroupedLists,
  isPending: isTablePending,
} = useSprintKanban(selected_sprint_id, laneIds, tableGroupExtraParams);

const refreshTable = () => {
  queryClient.invalidateQueries({ queryKey: ["sheets"] });
  queryClient.invalidateQueries({ queryKey: ["sprint-kanban"] });
  queryClient.invalidateQueries({ queryKey: ["sprint-table-flat"] });
  toast.success("Data refreshed");
};

// ─── Table Utilities ─────────────────────────────────────────────────────────
// Helper to extract cards from both Flat and Grouped sprint responses
const flattenSprintCards = (apiData: any): any[] => {
  if (!apiData) return [];
  // Flat response (no variable_id): root-level cards array
  if (Array.isArray(apiData?.cards)) return apiData.cards;
  // Grouped response: flatten groups[].cards
  const all: any[] = [];
  (apiData?.groups ?? []).forEach((group: any) => {
    (group.cards ?? []).forEach((card: any) => all.push(card));
  });
  return all;
};

const totalTableCount = computed(() => {
  if (selectedGroup.value) {
    return tableGroups.value.reduce((acc: number, group: any) => acc + (group.cards?.length || 0), 0);
  }
  return filteredBoard.value.length;
});

const totalTableTotal = computed(() => {
  const currentData = selectedGroup.value ? TableGroupedLists.value : FlatTableData.value;
  const cards = flattenSprintCards(currentData);
  return cards.length + localPendingTickets.value.length;
});

watch(selected_sprint_id, () => {
  refetchSheetLists();
});
interface DropdownOption {
  _id: string;
  title: string;
  description?: string;
  icon?: any;
  status?: string;
}

const transformedData = computed<DropdownOption[]>(() => {
  if (!sheets.value?.length) return [];
  return sheets.value.map((item: any) => ({
    _id: item._id,
    title: item.variables?.["sheet-title"] || "Untitled Sheet",
    description: item.variables?.["sheet-description"] || "",
    icon: item.icon || null,
    status: item.generation_status || null,
  }));
});

watch(
  transformedData,
  (newVal) => {
    if (newVal.length > 0 && !selected_sheet_id.value) {
      selected_sheet_id.value = newVal[0]._id;
    }
  },
  { immediate: true },
);

watch(
  transformedData,
  (newData) => {
    selectedSheetTitle.value = newData.length > 0 ? newData[0].title : props.activeSprint;
  },
  { immediate: true },
);

watch(sheets, (newSheetId) => {
  if (newSheetId?.length > 0) selected_sheet_id.value = newSheetId[0]?._id;
});

const selectCardHandler = (card: any) => {
  if (!card._id) card._id = card.id;
  selectedCard.value = card;
  sidePanelStore.selectTaskCard(card);

  // Clean up card_id query param if present
  if (route.query.card_id) {
    const query = { ...route.query };
    delete query.card_id;
    router.replace({ query });
  }
};
(window as any).selectCardHandler = selectCardHandler;

const reorderList = ReOrderList();
const reorderCard = ReOrderCard();

function onReorder(a: any) {
  if (a.type === "column") {
    reorderList.mutate({
      payload: {
        workspace_id: workspaceId.value,
        workspace_module_id: moduleId.value || selected_sprint_id.value || localStorage.getItem("activeSprintKey") || "",
        variable_id: selected_view_by.value,
        moved_value: a.meta.id,
        new_index: a.meta.newIndex,
      },
    });
  } else {
    reorderCard.mutate(
      {
        payload: {
          workspace_id: workspaceId.value,
          card_id: a.meta.moved._id,
          group_value: a.meta.fromColumnId,
          group_variable_id: selected_view_by.value,
          new_index: a.meta.newIndex,
          sheet_id: selected_sheet_id.value || a?.meta?.moved?.sheet_id || "",
        },
      },
      {
        onSuccess: () => {
          refetchSheetLists();
        },
      },
    );
  }
}
const handleBoardUpdate = (_: any) => {};

const { mutate: updateSheet } = useUpdateWorkspaceSheet({
  onSuccess: () => {
    if(!route?.path?.includes("plan")) {
      refetchSheets();
    }
    showDeleteModal.value = false;
    refetchSheetLists();
  },
});

const { mutate: addList, isPending: addingList } = useAddList({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sprint-kanban"] });
    queryClient.invalidateQueries({ queryKey: ["sprint-table-flat"] });  
    newColumn.value = "";
    showDelete.value = false;
    activeAddList.value = false;
  },
});

const handleAddColumn = (v: any) => {
  addList({
    workspace_id: workspaceId.value,
    module_id: moduleId.value,
    variable_id: selected_view_by.value,
    value: v,
    ...listProcessPayload.value,
  });
};

function setActiveAddList() {
  activeAddList.value = !activeAddList.value;
}

const handleUpdateColumn = (newTitle: any) => {
  addList({
    workspace_id: route.params.id,
    module_id: route.params.module_id || selected_sprint_id.value || localStorage.getItem("activeSprintKey") || "",
    new_value: newTitle.title,
    value: newTitle.oldTitle,
    variable_id: selected_view_by.value,
    ...listProcessPayload.value,
  });
};

const handleDeleteColumn = () => {
  addList({
    value: localColumnData.value.title,
    workspace_id: workspaceId.value,
    module_id: selected_sprint_id.value,
    newValue: localColumnData.value.title,
    variable_id: selected_view_by.value,
    is_trash: true,
    ...listProcessPayload.value,
  });
};

const deleteHandler = (e: any) => {
  showDelete.value = true;
  localColumnData.value = e;
};
const plusHandler = (e: any) => {
  createTeamModal.value = true;
  localStorage.setItem("selectedStatusTitle", e?.title);
  localStorage.setItem("selectedModuleId", selected_module_id.value);
  localColumnData.value = e;
};

// ─── Search & Fuse Logic ──────────────────────────────────────────────────────
const searchQuery = computed(() => props.searchQuery);
const debouncedQuery = ref("");

watch(
  searchQuery,
  debounce((val: string) => {
    debouncedQuery.value = val;
  }, 200),
);

const fuse = computed(() => {
  const allCards = (Lists.value?.groups ?? []).flatMap((col: any) =>
    (col.cards ?? []).map((card: any) => ({ ...card, columnId: col.title })),
  );
  return new Fuse(allCards, { 
    keys: ["card-title", "card-description", "title", "name"], 
    threshold: 0.3 
  });
});

const filteredBoard = computed(() => {
  const query = searchQuery.value?.trim() || search.value?.trim();
  
  if (view.value === "kanban" || view.value === "mindmap") {
    if (!query) return Lists.value?.groups;
    const results = fuse.value.search(query).map((r: any) => r.item);
    return (Lists.value?.groups ?? []).map((col: any) => ({
      ...col,
      cards: results.filter((c: any) => c.columnId === col.title),
    }));
  } else {
    // TABLE VIEW
    const currentData = selectedGroup.value ? TableGroupedLists.value : FlatTableData.value;
    const allCards = flattenSprintCards(currentData);

    if (!query) {
      return [...allCards, ...localPendingTickets.value];
    }

    const fuseTable = new Fuse(allCards, {
      keys: ["card-title", "card-description"],
      threshold: 0.3,
    });
    const results = fuseTable.search(query).map((r) => r.item);
    return [...results, ...localPendingTickets.value];
  }
});

const tableGroups = computed(() => {
  if (!selectedGroup.value) return [];
  const query = searchQuery.value?.trim() || search.value?.trim();
  const sourceLists = TableGroupedLists.value?.groups ?? [];
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

// ─── Lane & Dropdown Helpers ──────────────────────────────────────────────────
const { data: lanes } = useLanes(workspaceId);

const laneOptions = computed<any[]>(() =>
  (lanes?.value ?? []).map((el: any) => ({
    ...el,
    _id: el._id,
    title: el?.variables?.["lane-title"] ?? String(el._id),
  })),
);

const getOptions = (options: any) =>
  options.map((el: any) => ({ _id: el.value ?? el, title: el.value ?? el }));

// ─── Mutations & Handlers ─────────────────────────────────────────────────────
const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["get-sheets"] });
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    queryClient.invalidateQueries({ queryKey: ["roles"] });
  },
});

const { mutate: addTicket } = useAddTicket({
  onMutate: (variables: any) => {
    const tempId = variables.temp_row_id;
    if (tempId) {
      const exists = localPendingTickets.value.some(t => t._id === tempId || t.id === tempId);
      if (!exists) {
        localPendingTickets.value.push({
          _id: tempId,
          "card-title": variables.variables?.["card-title"] || "New Ticket",
          ...variables.variables
        });
      }
    }
  },
  onSuccess: (newCard: any, variables: any) => {
    const tempId = variables.temp_row_id;
    toast.success("Ticket created successfully");
    tableViewRef.value?.closeQuickCreate();
    
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
    queryClient.invalidateQueries({ queryKey: ["sprint-kanban"] });
    queryClient.invalidateQueries({ queryKey: ["sprint-table-flat"] });
  },
});

// Removed manual updateOptimisticCard as it's replaced by performOptimisticUpdate

function setLane(id: any, v: any) {
  const newLane = laneOptions.value.find((l: any) => l._id === v);
  const snapshots = performOptimisticUpdate({
    queryClient,
    sidePanelStore,
    cardId: id,
    updates: { lane: newLane, workspace_lane_id: v },
    invalidateKeys: ['sprint-kanban', 'sprint-table-flat']
  });
  
  moveCard.mutate(
    { card_id: id, workspace_lane_id: v },
    { onError: () => rollbackOptimisticUpdate(queryClient, snapshots) }
  );
}

const assignHandle = (cardId: any, users: any[]) => {
  const userIds = users.map(u => typeof u === 'string' ? u : (u?._id || u?.id)).filter(Boolean)
  const primarySeat = users.length > 0 ? users[0] : null;
  
  const snapshots = performOptimisticUpdate({
    queryClient,
    sidePanelStore,
    cardId: cardId,
    updates: { seat: primarySeat, seats: users, seat_id: userIds },
    invalidateKeys: ['sprint-kanban', 'sprint-table-flat']
  });

  moveCard.mutate(
    { card_id: cardId, seat_id: userIds },
    { onError: () => rollbackOptimisticUpdate(queryClient, snapshots) }
  );
};

function handleChangeTicket(id: any, key: any, value: any) {
  const updates: Record<string, any> = { [key]: value.trim() };
  
  const snapshots = performOptimisticUpdate({
    queryClient,
    sidePanelStore,
    cardId: id,
    updates,
    invalidateKeys: ['sprint-kanban', 'sprint-table-flat']
  });

  moveCard.mutate(
    { card_id: id, variables: { [key]: value.trim() } },
    { onError: () => rollbackOptimisticUpdate(queryClient, snapshots) }
  );
}

function handleCreateTicket(title: any) {
  if (title["card-title"]) {
    isAddingTableTicket.value = true;
    addTicket({
      sheet_list_id: "General",
      workspace_id: workspaceId.value,
      sheet_id: selected_sheet_id.value,
      variables: { "card-title": title["card-title"].trim(), ...title.variables },
      sprint_id: sprintId.value,
      createdAt: new Date().toISOString(),
      ...title
    }, {
      onSettled: () => {
        isAddingTableTicket.value = false;
      }
    });
  }
}

function handleQuickCreate(title: string, group: any) {
  if (!title?.trim()) return;
  let cardPriority = '';
  let cardStatus = '';
  let cardType = '';
  let cardAssignee = '';

  const label = selectedGroupLabel.value?.toLowerCase();
  
  if (label === 'status') {
    cardStatus = group.title;
  } else if (label === 'priority') {
    cardPriority = group.title;
  } else if (label === 'card type') {
    cardType = group.title;
  } else if (label === 'assignee') {
     cardAssignee = group?.cards[0]?.seat?._id || group?.cards[0]?.seat_id;
  }

  const payload = {
    "card-title": title,
    "card-status": cardStatus,
    "card-type": cardType,
    "priority": cardPriority,
    "seat_id": cardAssignee,
    variables: {
      "card-title": title,
      "card-status": cardStatus || 'General',
      "card-type": cardType,
      "priority": cardPriority
    }
  };

  handleCreateTicket(payload);
}

function handleDeleteTicketModal(ticket: any) {
  ticketToDelete.value = ticket;
  selectedDeleteId.value = ticket._id || ticket.id;
  showTicketDelete.value = true;
}

const ticketToDelete = ref<any>(null);
const showTicketDelete = ref(false);

const setStartDate = (card_id: any, e: any) => {
  const snapshots = performOptimisticUpdate({
    queryClient,
    sidePanelStore,
    cardId: card_id,
    updates: { "end-date": e, "start-date": e }, // The UI seems to use end-date for display sometimes
    invalidateKeys: ['sprint-kanban', 'sprint-table-flat']
  });

  moveCard.mutate(
    { card_id, variables: { "start-date": e } },
    { onError: () => rollbackOptimisticUpdate(queryClient, snapshots) }
  );
};

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

// ─── Table Rendering (Columns) ────────────────────────────────────────────────
const columns = computed(() => {
  return [
    {
      key: "card-title",
      label: "Title",
      render: ({ row, value }: any) =>
        h("div", { class: "flex items-center gap-1 w-full" }, [
          h("a", {
            onClick: () => (selectedCard.value = row),
            class: "text-[12px] underline text-blue-500 shrink-0 overflow-ellipsis cursor-pointer",
          }, row["card-code"]),
          h("div", { class: "flex-1 min-w-0" }, [
            h("input", {
              onFocusout: (e: any) => { handleChangeTicket(row?._id, "card-title", e?.target?.value); },
              class: "text-[12px] w-full overflow-ellipsis capitalize p-1 focus:border border-accent/60 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent bg-transparent focus:bg-bg-body h-8",
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
          "onUpdate:modelValue": (e: any) => setStartDate(row?._id, e),
          emptyText: "Date",
        });
      },
    },
    {
      key: "lane",
      label: "Tab",
      render: ({ row }: any) =>
        h(TableSearchCell, {
          options: laneOptions.value ?? [],
          placeholder: "Select lane",
          modelValue: row.lane?._id || null,
          disabled: !canEditCard.value,
          "onUpdate:modelValue": (e: any) => setLane(row?._id, e),
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
              ? h("img", { class: "w-6 h-6 rounded-full", src: value?.u_profile_image })
              : h("div", {
                  class: "w-5 h-5 rounded-full flex justify-center items-center text-[11px]",
                  style: `background:${value?.u_full_name ? avatarColor({ name: value.u_full_name, email: value.u_email }) : ""}`,
                }, getInitials(value?.u_full_name)),
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
          onAssign: (users: any[]) => assignHandle(row?._id, users),
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
              "onUpdate:modelValue": (val: any) => { handleChangeTicket(row?._id, e.slug, val); },
              columnName: e.slug,
            }),
          ]);
        },
        visible: e?.is_visible,
      })) ?? []),
  ];
});

// interface Card { _id: string; }
// interface SheetList { cards: Card[]; }
// interface Sheet { sheet_lists: SheetList[]; }

const removeCardFromState = (cardId: string) => {
  if (!Lists.value?.groups) return;
  Lists.value.groups.forEach((list: any) => {
    if (list.cards) {
      list.cards = list.cards.filter((card: any) => (card._id || card.id) !== cardId);
    }
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
    queryClient.invalidateQueries({ queryKey: ["sprint-kanban"] });
    queryClient.invalidateQueries({ queryKey: ["sprint-table-flat"] });
    toast.success("Ticket deleted successfully");
    showTicketDelete.value = false;
    ticketToDelete.value = null;
  } catch (err) {
    toast.error(toApiMessage(err));
  } finally {
    isDeletingTicket.value = false;
    showTicketDelete.value = false;
  }
};
// ─── MindMap & Theme Helpers ──────────────────────────────────────────────────
const { mutateAsync: createNewSheet } = useCreateWorkspaceSheet({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sheets"] });
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
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
    console.error("Error creating sheet from mindmap:", err);
  }
}

function handleMindmapCreateCard(payload: any) {
  addTicket(payload);
}

function handleMindmapUpdateCard(payload: any) {
  moveCard.mutate(payload);
}

function handleMindmapUpdateSheet(payload: any) {
  updateSheet(payload);
}

function handleMindmapReorderCard(_payload: any) {
  refetchSheets();
  refetchSheetLists();
}
// saving theme
const { mutate: updateSprint2 } = useUpdateSprint();
const handleSaveTheme = (e: any) => {
  console.log("e data in plan active", e);

  updateSprint2(
    {
      id: localStorage.getItem("activeSprintKey") || props.sprint_id,
      payload: {
        style: e,
      },
    },
    {
      onSuccess: () => {
        refetchSheetLists(); 
      },
      onError: (err) => {
        console.error("Error updating sprint theme:", err);
      },
    }
  );
};

const sprintId = computed(() => {
  return props.sprint_id || localStorage.getItem("activeSprintKey");
})
</script>

<style scoped>

</style>