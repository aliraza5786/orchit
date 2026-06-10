<template>
  <div class="flex-auto flex-grow h-full bg-bg-surface rounded-[6px] border border-border overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="overflow-x-auto shrink-0 sticky top-0 z-20 bg-bg-surface border-b border-border">
      <div class="flex items-center justify-between gap-4 py-2 px-2">
       <div class="flex gap-4 ms-1.5">
        <div class="flex items-center gap-2">
        <i class="fa-solid fa-diagram-project text-primary-color"></i>
        <h2 class="text-sm font-semibold text-text-primary">All Processes</h2>
        <span class="text-[10px] font-semibold px-1.5 py-1 rounded-full bg-primary-color/10 text-primary-color">
          {{ filteredList?.reduce((acc, col) => acc + (col.transitions?.length || 0), 0) }}
        </span>
      </div>

          <div class="relative flex items-center gap-2">
            <button
              ref="filterTriggerRef"
              @click="toggleFilters"
              class="flex items-center gap-2 px-3 h-[33px] rounded-md border cursor-pointer bg-bg-transparent hover:border-primary-color transition-all text-xs font-semibold relative"
              :class="showFilterBar ? 'border-primary-color' : 'border-border'"
            >
              <i class="fa-solid fa-filter text-primary-color text-[14px]"></i>
              <span>Filter</span>
              <span
                v-if="activeFilterCount"
                class="bg-primary-color text-white rounded-full px-1.5 py-0.5 text-[9px] min-w-[16px] flex items-center justify-center"
              >
                {{ activeFilterCount }}
              </span>
            </button>

            <button
              v-if="hasActiveFilters"
              @click="handleClearFilters"
              class="text-[11px] font-medium text-text-secondary hover:text-primary-color transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>

            <ProductFilters
              v-if="showFilterBar"
              :triggerRef="filterTriggerRef"
              :variables="variables"
              :workspaceId="workspaceId"
              :activeFilters="activeFilters"
              :hideCategories="{
                plan: true,
                priority: true,
                type: true
              }"
              :labelOverrides="{
                assignees: 'Created By'
              }"
              @apply="(f) => { handleApplyFilters(f); showFilterBar = false; }"
              @clear="handleClearFilters"
              @close="showFilterBar = false"
            />
          </div>

        <div
          ref="viewByTriggerEl"
          class="inline-flex items-center rounded-md overflow-hidden text-xs whitespace-nowrap"
        >
          <button
            @click="showViewDropdown = !showViewDropdown"
            class="flex items-center gap-2 text-nowrap px-3 h-[33px] rounded-md border cursor-pointer bg-transparent hover:border-primary-color transition-all text-xs font-semibold relative"
            :class="showViewDropdown ? 'border-primary-color text-primary-color' : 'border-border text-text-primary'"
          >
            <i class="fa-solid fa-layer-group text-[14px] text-primary-color"></i>
            <span class="text-nowrap">Group: {{ selectedViewLabel }}</span>
          </button>
        </div>

        <VariablesDropdown
          v-if="showViewDropdown"
          :trigger-ref="viewByTriggerEl"
          :options="processOptions"
          :model-value="selectedViewBy"
          :hide-static="true"
          @update:model-value="(val: string) => { selectedViewBy = val; showViewDropdown = false; }"
          @close="showViewDropdown = false"
        />
       </div>

        <!-- replace the right-side div in the header -->
<div class="flex items-center gap-2">
  <div class="w-[250px]">
    <SearchBar
      placeholder="Search processes..."
      @onChange="(val: any) => searchQuery = val"
    />
  </div>
  <!-- View Switcher -->
  <div class="flex items-center gap-1 bg-bg-surface/50 h-[36px] px-1.5 border-border border rounded-[6px]">
    <button
      class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
      :class="view === 'kanban' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
      title="Kanban view"
      @click="view = 'kanban'"
    >
      <i class="fa-solid fa-chart-kanban text-[14px]"></i>
    </button>
    <button
      @click="view = 'table'"
      class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
      :class="view === 'table' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
      title="List view"
    >
      <i class="fa-solid fa-align-left text-[14px]"></i>
    </button>
    <button
      @click="view = 'mindmap'"
      class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
      :class="view === 'mindmap' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
      title="MindMap view"
    >
      <i class="fa-solid fa-chart-diagram text-[14px]"></i>
    </button>
    <button
      @click="view = 'gantt'"
      class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
      :class="view === 'gantt' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
      title="Gantt Chart view"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 6h2v12H4V6Zm4 4h10v2H8v-2Zm0 4h10v2H8v-2Zm0-8h10v2H8V6Z" />
      </svg>
    </button>
    <button
      @click="view = 'calendar'"
      class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
      :class="view === 'calendar' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
      title="Calendar view"
    >
      <i class="fa-regular fa-calendar text-[14px]"></i>
    </button>
    <button
      @click="view = 'timeline'"
      class="aspect-square cursor-pointer rounded-sm h-[28px] flex items-center justify-center border border-border outline-0"
      :class="view === 'timeline' ? 'text-white bg-primary-color' : 'backdrop-blur-2xl transition-all duration-75 hover:text-primary-color'"
      title="Timeline view"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm16 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm-8 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm0-16a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" opacity="0"/>
        <path d="M4 12h4m8 0h4M9 12h6M9 12v-6M15 12v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  
</div>
      </div>
    </div>

    <!-- Skeleton Loader — first load only -->
    <KanbanSkeleton v-if="isPending" />

    <!-- Refetch indicator -->
    <div v-if="!isPending && isFetching" class="h-[2px] bg-primary-color animate-pulse shrink-0" />

    <!-- Board Area -->
    <div v-if="!isPending && view === 'kanban'" class="flex-1 w-full px-2 overflow-hidden flex flex-col">
      <div class="flex-1 overflow-x-auto flex items-start gap-2 scrollbar-visible py-2">

        <ProcessKanbanBoard
          v-if="filteredList?.length > 0"
          @delete:column="(e: any) => handleDeleteColumn(e)"
          @update:column="(e: any) => handleUpdateColumn(e)"
          @onPlus="openAddTransition"
          @select:ticket="handleClickTicket"
          :board="filteredList"
          @reorder="handleReorder"
        >
          <template #ticket="{ ticket, index }">
            <ProcessKanbanCard
              @click="handleClickTicket(ticket)"
              @dblclick="handleDblClick(ticket)"
              @open-builder="handleOpenBuilder(ticket)"
              :ticket="ticket"
              :index="index"
            />
          </template>
        </ProcessKanbanBoard>

        <!-- Inline Add Column -->
        <div class="min-w-[270px] max-w-[270px] shrink-0">
          <div
            v-if="!activeAddList"
            @click="canCreateVariable ? activeAddList = true : null"
            class="text-sm text-text-primary py-2.5 font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
            :class="canCreateVariable ? 'cursor-pointer' : 'cursor-not-allowed'"
          >
            <i class="fa-solid fa-plus"></i>
            <span class="font-medium text-[14px]">Add Process Group</span>
          </div>

          <div v-else class="bg-bg-body rounded-lg p-3 border border-border shadow-sm">
            <BaseTextField size="md" :autofocus="true" v-model="newColumn" placeholder="Group Name..."
              @keydown.enter.prevent="emitAddColumn" />
            <div class="flex items-center gap-2">
              <Button :inSpace="true" @click="emitAddColumn" variant="primary" size="sm" :loading="addingList" class="mt-4">
                Add Group
              </Button>
              <i class="fa-solid fa-close cursor-pointer text-text-secondary hover:text-text-primary px-2" @click="activeAddList = false"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- ── Table View ──────────────────────────────────────────────────────────── -->
<template v-if="!isPending && view === 'table'">
  <div class="ps-4 pe-4 flex-1 overflow-hidden">
    <TableView
      :columns="tableColumns"
      :rows="flatTransitions"
      :groups="[]"
      :isGrouped="false"
      :isPending="isPending || isFetching"
      :canCreate="false"
      :canCreateVariable="false"
      :canDelete="canCreateVariable"
      :totalCount="flatTransitions.length"
      :totalTotal="flatTransitions.length"
      @delete="(t) => { handleDeleteColumn(t) }"
      @refresh="() => queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] })"
    />
  </div>
</template>
<!-- ── MindMap View ──────────────────────────────────────────────────── -->
<template v-if="!isPending && view === 'mindmap'">
  <div class="relative flex-1 flex flex-col px-2 overflow-hidden">
    <div
      v-if="isFetching"
      class="absolute inset-0 z-20 flex items-center justify-center bg-bg-card/60 backdrop-blur-[2px]"
    >
      <div class="flex flex-col items-center gap-3">
        <i class="fa-solid fa-spinner fa-spin text-primary-color text-3xl"></i>
        <span class="text-sm font-medium text-text-secondary italic">Mapping your data...</span>
      </div>
    </div>
    <MindMapView
      :listsData="mindmapListsData"
      :selectedSheetId="''"
      :sheetId="''"
      :selectedViewBy="''"
      :workspaceId="workspaceId"
      :moduleId="workspaceId"
      :addingList="addingList"
      :activeAddList="activeAddList"
      :newColumn="newColumn"
      :selectedSheetTitle="'Processes'"
      :canCreateCard="false"
      :canEditCard="false"
      :canDeleteCard="false"
      :canAssignCard="false"
      :canCreateSheet="false"
      :canCreateVariable="canCreateVariable"
      :canEditSheet="false"
      @select:ticket="handleMindmapSelectTicket"
      @delete:ticket="handleMindmapDeleteTicket"
      @create:card="handleMindmapCreateCard"
      @update:card="handleMindmapUpdateCard"
      @update:sheet="handleMindmapUpdateSheet"
      @reorder:card="handleMindmapReorderCard"
      @create:sheet="handleMindmapCreateSheet"
      @toggle-add-list="() => { activeAddList = !activeAddList }"
      @add-column="emitAddColumn"
    />
  </div>
</template>
<!-- ── Gantt View ───────────────────────────────────────────────────── -->
<template v-if="!isPending && view === 'gantt'">
  <div class="flex-1 overflow-hidden px-2">
    <CustomGanttChart
      :data="ganttListsData"
      @select:ticket="handleClickTicket"
    />
  </div>
</template>
<!-- ── Calendar View ─────────────────────────────────────────────────── -->
<template v-if="!isPending && view === 'calendar'">
  <div class="flex-1 overflow-hidden px-2">
    <CustomCalendarView
      :data="ganttListsData"
      @select:ticket="handleClickTicket"
    />
  </div>
</template>
<!-- ── Timeline View ─────────────────────────────────────────────────── -->
<template v-if="!isPending && view === 'timeline'">
  <div class="flex-1 overflow-hidden px-2">
    <CustomTimelineView
      :data="ganttListsData"
      @select:ticket="handleClickTicket"
    />
  </div>
</template>
  </div>

  <ConfirmDeleteModal
    @click.stop=""
    v-model="showDelete"
    title="Delete Group"
    itemLabel="group"
    :itemName="localColumn?.title"
    :requireMatchText="localColumn?.title"
    confirmText="Delete Group"
    cancelText="Cancel"
    size="md"
    :loading="isDeletingList"
    @confirm="confirmDeleteColumn"
    @cancel="() => { showDelete = false }"
  />

  <AddTransitionModal v-model="isAddTransitionModal" :group="selectedGroupForAdd" @created="handleTransitionCreated" />

  <ProcessWorkflowBuilderModal v-model="showWorkflowBuilder" :process="selectedProcess" @close="closeWorkflowBuilder" />

  <WorkflowBuilderModal
    v-model="showGeneralWorkflowBuilder"
    :process="{ title: 'General Process', _id: 'static-general-process' }"
    @close="showGeneralWorkflowBuilder = false"
  />

  <ProcessSidePanel
    v-if="selectedSidePanelCard"
    :showPanel="showSidePanel"
    :details="selectedSidePanelCard"
    @close="closeSidePanel"
    @open-builder="handleOpenBuilder(selectedSidePanelCard)"
  />
</template>

<script setup lang="ts">
import { ref,h, watch, computed } from 'vue';
import BaseTextField from '../../components/ui/BaseTextField.vue';
import KanbanSkeleton from '../../components/skeletons/KanbanSkeleton.vue';
import { useRouteIds } from '../../composables/useQueryParams';
import VariablesDropdown from './components/VariablesDropdown.vue';
import {
  useProcessGroupsWithTransitions,
  useCreateProcessGroup,
  useDeleteProcessGroup,
  useUpdateProcessGroup,
  useReorderProcessGroups,
  useReorderTransitions,
  useUpdateTransition,
} from '../../queries/useProcess2';
import ProcessKanbanBoard from './components/ProcessKanbanBoard.vue';
import ProcessKanbanCard from './components/ProcessKanbanCard.vue';
import ConfirmDeleteModal from '../Product/modals/ConfirmDeleteModal.vue';
import { useQueryClient } from '@tanstack/vue-query';
import Button from '../../components/ui/Button.vue';
import ProcessWorkflowBuilderModal from './modals/ProcessWorkflowBuilderModal.vue';
import AddTransitionModal from './modals/AddTransitionModal.vue';
import ProcessSidePanel from './components/ProcessSidePanel.vue';
import WorkflowBuilderModal from '../Process/modals/WorkflowBuilderModal.vue';
import SearchBar from '../../components/ui/SearchBar.vue';
import { debounce } from 'lodash';
import { usePermissions } from '../../composables/usePermissions';
import { toast } from 'vue-sonner';
import ProductFilters from '../Product/components/ProductFilters.vue';
import { defineAsyncComponent } from 'vue';
const TableView = defineAsyncComponent(
  () => import('../../components/feature/TableView/TableView.vue')
);
const MindMapView = defineAsyncComponent(
  () => import('../../components/feature/MindmapView.vue')
);
const CustomGanttChart = defineAsyncComponent(
  () => import('../../components/feature/CustomGanttChart.vue')
);
const CustomCalendarView = defineAsyncComponent(
  () => import('../../components/feature/CustomCalendarView.vue')
);
const CustomTimelineView = defineAsyncComponent(
  () => import('../../components/feature/CustomTimelineView.vue')
);
const { workspaceId } = useRouteIds();

/* -------------------------------------------------------------------------- */
/*                           Filters & View State                             */
/* -------------------------------------------------------------------------- */
// ← Declare these FIRST so queryParams can safely reference them
const activeFilters        = ref<any>({});
const selectedViewBy       = ref('module');
const showFilterBar        = ref(false);
const showGroupDropdown    = ref(false);
const showVariableDropdown = ref(false);
const filterTriggerRef     = ref<HTMLElement | null>(null);
const view = ref('kanban');
const sheetDropdownRef     = ref<any>(null);
const queryParams = computed(() => {
  const f = activeFilters.value ?? {}

  const params: Record<string, any> = {
    group_by: selectedViewBy.value,
    sort: 'sort_order',
  }

  Object.entries(f).forEach(([key, val]) => {
    if (Array.isArray(val) && val.length > 0) {
      // convert array → single value OR comma string
      params[key] = val.join(',') // or val[0] if single-select
    } else if (val !== null && val !== undefined && val !== '') {
      params[key] = val
    }
  })

  return params
})

/* -------------------------------------------------------------------------- */
/*                                Query                                       */
/* -------------------------------------------------------------------------- */
interface ProcessGroupsResponse {
  grouped_by?: string
  groups?: any[]
}

const query = useProcessGroupsWithTransitions(workspaceId, queryParams);

const processGroups = computed<ProcessGroupsResponse | undefined>(
  () => query.data.value as ProcessGroupsResponse
);

const isPending  = query.isPending;
const isFetching = query.isFetching;

/* -------------------------------------------------------------------------- */
/*                              Permissions                                   */
/* -------------------------------------------------------------------------- */
const { canCreateVariable } = usePermissions();

/* -------------------------------------------------------------------------- */
/*                              View By Dropdown                              */
/* -------------------------------------------------------------------------- */
interface ProcessOption {
  _id: string;
  title: string;
}

const processOptions = ref<ProcessOption[]>([
  { _id: 'module',      title: 'Module'      },
  { _id: 'card_status', title: 'Card Status' },
  { _id: 'card_type',   title: 'Card Type'   },
]);

const viewByTriggerEl  = ref<HTMLElement | null>(null);
const showViewDropdown = ref(false);

const selectedViewLabel = computed(
  () => processOptions.value.find(o => o._id === selectedViewBy.value)?.title ?? 'View by'
);

/* -------------------------------------------------------------------------- */
/*                                Local List                                  */
/* -------------------------------------------------------------------------- */
const localList = ref<any[]>([]);

watch(processGroups, (newVal: any) => {
  if (!newVal?.groups) return; // keep previous data visible during refetch

  const groupedBy = newVal.grouped_by;
  const columns: any[] = [];

  if (groupedBy === 'module') {
    newVal.groups.forEach((moduleGroup: any) => {
      const pgs = moduleGroup.process_groups ?? [];
      pgs.forEach((pg: any) => {
        const raw = pg.transitions;
        const transitionsArray: any[] = raw
          ? Array.isArray(raw) ? raw : Object.values(raw)
          : [];

        columns.push({
          _id:         pg._id,
          columnId:    pg._id,
          title:       pg.title ?? 'Untitled Group',
          color:       pg.color ?? '#3b82f6',
          icon:        pg.icon ?? null,
          is_default:  pg.is_default ?? false,
          transitions: transitionsArray.map((t: any) => ({ ...t })),
        });
      });
    });

  } else if (groupedBy === 'card_type') {
    newVal.groups.forEach((group: any) => {
      const raw = group.transitions;
      const transitionsArray: any[] = raw
        ? Array.isArray(raw) ? raw : Object.values(raw)
        : [];

      columns.push({
        _id:         group.card_type,
        columnId:    group.card_type,
        title:       group.card_type ?? 'Untitled',
        subtitle:    group.module ?? null,
        color:       '#3b82f6',
        icon:        null,
        is_default:  false,
        transitions: transitionsArray.map((t: any) => ({ ...t })),
      });
    });

  } else if (groupedBy === 'card_status') {

  newVal.groups.forEach((group: any) => {

    const processGroups = group.process_groups ?? [];

    const transitions = processGroups.flatMap((pg: any) => {
      const raw = pg.transitions;

      const transitionsArray: any[] = raw
        ? Array.isArray(raw)
          ? raw
          : Object.values(raw)
        : [];

      return transitionsArray
        .filter((t: any) => {
          // ensure transition belongs to this status column
          return (
            t.step?.status === group.card_status ||
            t.flow_metadatas?.some(
              (meta: any) => meta.status === group.card_status
            )
          );
        })
        .map((t: any) => ({
          ...t,

          // preserve existing UI expectations
          title: t.title ?? t.type_value ?? 'Untitled',
          card_type: t.assigned_to?.card_type ?? t.type_value,
          module: t.assigned_to?.module ?? pg.title,

          card_status: group.card_status,

          process_group_id: pg._id,
          process_group_title: pg.title,

          // status metadata
          status_color: group.color,
          is_start: group.is_start,
          is_end: group.is_end,
          sort_order: group.sort_order,
        }));
    });

    columns.push({
      _id: group.card_status,
      columnId: group.card_status,

      title: group.card_status ?? 'Untitled',

      color: group.color ?? '#808080',

      is_start: group.is_start ?? false,
      is_end: group.is_end ?? false,
      sort_order: group.sort_order ?? 0,

      card_types: group.card_types ?? [],
      modules: group.modules ?? [],

      // REAL transitions
      transitions,
    });
  });
} else {
    console.warn('[Process2] Unknown grouped_by:', groupedBy);
  }

  localList.value = columns;
}, { immediate: true, deep: true });

/* -------------------------------------------------------------------------- */
/*                                Search Logic                                */
/* -------------------------------------------------------------------------- */
const searchQuery    = ref('');
const debouncedQuery = ref('');

watch(searchQuery, debounce((val: string) => { debouncedQuery.value = val; }, 200));

const filteredList = computed(() => {
  const query   = debouncedQuery.value.toLowerCase().trim();
  const filters = activeFilters.value as Record<string, any>;

  const hasFilters = Object.values(filters).some(v =>
    Array.isArray(v) ? v.length > 0 : Boolean(v)
  );

  return localList.value
    .map((col: any) => {
      const filtered = (col.transitions ?? []).filter((card: any) => {
        if (query) {
          const titleMatch = card.title?.toLowerCase().includes(query);
          const nameMatch  = card.name?.toLowerCase().includes(query);
          if (!titleMatch && !nameMatch) return false;
        }
        if (hasFilters && !cardMatchesFilters(card, filters)) return false;
        return true;
      });
      return { ...col, transitions: filtered };
    })
    .filter((col: any) => {
      if (processGroups.value?.grouped_by === 'card_status') return true;
      if (query || hasFilters) return col.transitions.length > 0;
      return true;
    });
});

/* -------------------------------------------------------------------------- */
/*                             Add Process Group                              */
/* -------------------------------------------------------------------------- */
const activeAddList = ref(false);
const newColumn     = ref('');
const queryClient   = useQueryClient();

const { mutate: addList, isPending: addingList } = useCreateProcessGroup({
  onSuccess: () => {
    newColumn.value     = '';
    activeAddList.value = false;
    queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] });
    toast.success('Process group created successfully!');
  },
  onError: (err: any) => { toast.error(err.message || 'Something went wrong!'); },
});

function emitAddColumn() {
  if (addingList.value) return;
  const t = newColumn.value.trim();
  if (!t) return;
  addList({ workspace_id: workspaceId.value, title: t, sort_order: localList.value.length });
}

/* -------------------------------------------------------------------------- */
/*                            Delete Process Group                            */
/* -------------------------------------------------------------------------- */
const showDelete  = ref(false);
const localColumn = ref<any>(null);

const { mutate: deleteList, isPending: isDeletingList } = useDeleteProcessGroup({
  onSuccess: () => {
    showDelete.value = false;
    queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] });
    toast.success('Group deleted successfully!');
  },
  onError: (err: any) => { toast.error(err.message || 'Something went wrong!'); },
});

const handleDeleteColumn   = (col: any) => { localColumn.value = col; showDelete.value = true; };
const confirmDeleteColumn  = () => {
  if (localColumn.value) {
    deleteList({ workspace_id: workspaceId.value, group_id: localColumn.value.columnId });
  }
};

/* -------------------------------------------------------------------------- */
/*                            Update Process Group                            */
/* -------------------------------------------------------------------------- */
const { mutate: updateGroup } = useUpdateProcessGroup({
  onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] }); },
});

const handleUpdateColumn = (col: any) => {
  updateGroup({ workspace_id: workspaceId.value, group_id: col._id, payload: { title: col.title } });
};

/* -------------------------------------------------------------------------- */
/*                               Reorder Logic                                */
/* -------------------------------------------------------------------------- */
const { mutate: reorderGroups }      = useReorderProcessGroups();
const { mutate: reorderTransitions } = useReorderTransitions();
const { mutate: updateTransition }   = useUpdateTransition({
  onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] }); },
});

const handleReorder = (event: any) => {
  if (event.type === 'column') {
    const groups = event.board.columns.map((col: any, index: number) => ({
      group_id: col._id, sort_order: index,
    }));
    reorderGroups({ workspace_id: workspaceId.value, groups });
  } else if (event.type === 'ticket') {
    const meta = event.meta;
    if (meta.fromColumnId === meta.toColumnId) {
      const group = localList.value.find((g: any) => g._id === meta.toColumnId);
      if (group) {
        const transitions = group.cards.map((t: any, index: number) => ({
          transition_id: t._id, sort_id: index,
        }));
        reorderTransitions({ workspace_id: workspaceId.value, group_id: meta.toColumnId, transitions });
      }
    } else {
      const movedTicket = meta.moved;
      if (movedTicket && meta.toColumnId) {
        updateTransition({
          workspace_id: workspaceId.value,
          transition_id: movedTicket._id,
          payload: { group_id: meta.toColumnId },
        });
      }
    }
  }
};

/* -------------------------------------------------------------------------- */
/*                              Ticket Handling                               */
/* -------------------------------------------------------------------------- */
const selectedProcess       = ref<any>(null);
const showWorkflowBuilder   = ref(false);
const showSidePanel         = ref(false);
const selectedSidePanelCard = ref<any>(null);
const singleClickTimer      = ref<ReturnType<typeof setTimeout> | null>(null);

const handleOpenBuilder = (ticket: any) => {
  selectedProcess.value     = ticket;
  showWorkflowBuilder.value = true;
  showSidePanel.value       = false;
};

const handleDblClick = (ticket: any) => {
  if (singleClickTimer.value) { clearTimeout(singleClickTimer.value); singleClickTimer.value = null; }
  handleOpenBuilder(ticket);
};

const handleClickTicket = (ticket: any) => {
  if (singleClickTimer.value) clearTimeout(singleClickTimer.value);
  singleClickTimer.value = setTimeout(() => {
    singleClickTimer.value      = null;
    selectedSidePanelCard.value = ticket;
    showSidePanel.value         = true;
  }, 300);
};

const closeWorkflowBuilder = () => { showWorkflowBuilder.value = false; selectedProcess.value = null; };
const closeSidePanel       = () => { showSidePanel.value = false; selectedSidePanelCard.value = null; };

/* -------------------------------------------------------------------------- */
/*                                Variables                                   */
/* -------------------------------------------------------------------------- */
const variables = [
  {
    key:   'created_by',
    slug:  'created_by',
    label: 'Created By',
    type:  'users',
    value: [],
  },
  {
    key:   'status',
    slug:  'card-status',
    label: 'Status',
    type:  'select',
    value: [],
    data: [
      { title: 'Draft',  value: 'draft'  },
      { title: 'Active', value: 'active' },
    ],
  },
  {
    key:   'date_range',
    slug:  'date_range',
    label: 'Date Range',
    type:  'date-range',
    value: { start: null, end: null },
  },
];

/* -------------------------------------------------------------------------- */
/*                             Add Transition                                 */
/* -------------------------------------------------------------------------- */
const isAddTransitionModal = ref(false);
const selectedGroupForAdd  = ref<any>(null);

const openAddTransition = (group: any) => {
  selectedGroupForAdd.value  = group;
  isAddTransitionModal.value = true;
};

const handleTransitionCreated = () => {
  isAddTransitionModal.value = false;
  queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] });
};

/* -------------------------------------------------------------------------- */
/*                            Filter Helpers                                  */
/* -------------------------------------------------------------------------- */
const showGeneralWorkflowBuilder = ref(false);

const toggleFilters = () => {
  const willShow = !showFilterBar.value;
  if (willShow) closeAllDropdowns('filter');
  showFilterBar.value = willShow;
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

const handleClearFilters = () => { activeFilters.value = {}; };
const handleApplyFilters = (filters: any) => { activeFilters.value = filters; };

const closeAllDropdowns = (except: string) => {
  if (except !== 'sheet')    sheetDropdownRef.value?.closeDropdown();
  if (except !== 'variable') showVariableDropdown.value = false;
  if (except !== 'filter')   showFilterBar.value = false;
  if (except !== 'group')    showGroupDropdown.value = false;
};

/* -------------------------------------------------------------------------- */
/*                            Card Filter Logic                               */
/* -------------------------------------------------------------------------- */
function resolveCardValue(card: any, slug: string): any {
  const directKeyMap: Record<string, string> = {
    'card-type':   'type_value',
    'card-status': 'card_status',
    'process':     'process',
    'priority':    'priority',
  };

  if (directKeyMap[slug]) {
    const direct = card[directKeyMap[slug]];
    if (direct !== undefined && direct !== null && direct !== '') return direct;
  }

  if (Array.isArray(card.variables)) {
    const v = card.variables.find((vr: any) => vr.slug === slug);
    if (v) return v.value;
  }

  return card[slug] ?? card[slug.replace(/-/g, '_')] ?? undefined;
}

function cardMatchesFilters(card: any, filters: Record<string, any>): boolean {
  const dateRangeFields = [
    { from: 'created_at_from', to: 'created_at_to', keys: ['created_at', 'createdAt'] },
    { from: 'updated_at_from', to: 'updated_at_to', keys: ['updated_at', 'updatedAt'] },
    { from: 'start_date_from', to: 'start_date_to', keys: ['start_date', 'startDate'] },
    { from: 'end_date_from',   to: 'end_date_to',   keys: ['end_date',   'endDate']   },
  ];

  const dateKeys = new Set(dateRangeFields.flatMap(d => [d.from, d.to]));

  // 1. Date range checks
  for (const { from, to, keys } of dateRangeFields) {
    const fromVal = filters[from];
    const toVal   = filters[to];
    if (!fromVal && !toVal) continue;

    const raw = keys.map(k => card[k]).find(v => v != null && v !== '');
    if (!raw) return false;

    const cardDate = new Date(raw).getTime();
    if (fromVal && cardDate < new Date(fromVal).getTime()) return false;
    if (toVal   && cardDate > new Date(toVal).getTime())   return false;
  }

  // 2. Regular filters
  for (const [slug, selected] of Object.entries(filters)) {
    if (dateKeys.has(slug)) continue;

    const allowed: string[] = Array.isArray(selected)
      ? selected.filter(Boolean)
      : selected ? [selected] : [];

    if (allowed.length === 0) continue;

    const cardValue = resolveCardValue(card, slug);

    const cardValues: string[] = Array.isArray(cardValue)
      ? cardValue.map(String)
      : cardValue !== undefined && cardValue !== null && cardValue !== ''
        ? [String(cardValue)]
        : [];

    const passes = cardValues.some(cv =>
      allowed.some(a => a.toLowerCase() === cv.toLowerCase())
    );

    if (!passes) return false;
  }

  return true;
}
// ── Table View Data ────────────────────────────────────────────────────────
const flatTransitions = computed(() =>
  filteredList.value.flatMap((col: any) =>
    (col.transitions ?? []).map((t: any) => ({ ...t, _groupTitle: col.title }))
  )
);
const tableColumns = computed(() => [
  {
    key: 'title',
    label: 'Title',
    visible: true,
    render: ({ row, value }: any) =>
      h('div', { class: 'flex items-center gap-2 px-2' }, [
        h('span', {
          class: 'text-[12px] capitalize cursor-pointer hover:text-primary-color transition-colors',
          onClick: () => handleClickTicket(row),
        }, value || 'Untitled'),
      ]),
  },
  {
    key: 'card_type',
    label: 'Card Type',
    visible: true,
    render: ({ row }: any) => {
      // card_type field varies by grouping
      const val = row.card_type
        ?? row.type_value
        ?? row.assigned_to?.card_type
        ?? row.variables?.['card-type']
        ?? row['card-type']
        ?? '—'
      return h('div', { class: 'px-2 text-[12px] capitalize text-text-secondary' }, val)
    },
  },
  {
    key: 'module',
    label: 'Module',
    visible: true,
    render: ({ row }: any) => {
      // module field varies by grouping
      const val = row.module
        ?? row.assigned_to?.module
        ?? row.process_group_title
        ?? row._groupTitle
        ?? '—'
      return h('div', { class: 'px-2 text-[12px] text-text-secondary' }, val)
    },
  },
  {
    key: 'process_group_title',
    label: 'Process Group',
    visible: true,
    render: ({ row }: any) => {
      const val = row.process_group_title
        ?? row._groupTitle
        ?? '—'
      return h('div', { class: 'px-2 text-[12px] text-text-secondary' }, val)
    },
  },
]);
// ── MindMap View Data ────────────────────────────────────────────────────
// MindMapView expects sheet_lists format: [{ _id, title, cards: [], ... }]
const mindmapListsData = computed(() =>
  filteredList.value.map((col: any) => ({
    ...col,
    cards: (col.transitions ?? []).map((t: any) => ({
      ...t,
      _id: t._id,
      'card-title': t.title ?? t.name ?? 'Untitled',
      'card-status': t.card_status ?? col.title,
      'card-type': t.card_type ?? t.type_value ?? '',
      priority: t.priority ?? '',
      style: t.style ?? {},
      variables: t.variables ?? {},
    })),
  }))
);
// ── MindMap event handlers ───────────────────────────────────────────
function handleMindmapSelectTicket(card: any) {
  handleClickTicket(card);
}

function handleMindmapDeleteTicket(cardId: string) {
  localColumn.value = { columnId: cardId };
  // Transitions aren't deleted inline from mindmap in Process2
  // — open the side panel delete flow instead
  handleClickTicket({ _id: cardId });
}

function handleMindmapCreateCard(_payload: any) {
  // Process2 doesn't support inline card creation for transitions
  // Wire up if needed in future
}

function handleMindmapUpdateCard(_payload: any) {
  // Process2 transitions update via WorkflowBuilder
}

function handleMindmapUpdateSheet(_payload: any) {
  // Process groups are updated via handleUpdateColumn
}

function handleMindmapReorderCard(_payload: any) {
  queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] });
}

function handleMindmapCreateSheet(_payload: any) {
  // Not applicable for Process2
}
// ── Gantt View Data ──────────────────────────────────────────────────────
// CustomGanttChart accepts CardList[]: [{ _id, title, cards: Card[] }]
const ganttListsData = computed(() =>
  filteredList.value.map((col: any) => ({
    _id:   col._id ?? col.columnId,
    title: col.title,
    cards: (col.transitions ?? []).map((t: any) => ({
      _id:          t._id,
      'card-title': t.title ?? t.name ?? t.type_value ?? t['card-title'] ?? 'Untitled',
      'card-code':  t.code ?? t['card-code'] ?? '',
      'card-status': t.card_status ?? col.title,
      'start-date': t['start-date'] ?? t.start_date ?? null,
      'end-date':   t['end-date']   ?? t.end_date   ?? null,
      created_at:   t.created_at    ?? new Date().toISOString(),
      color:        col.color       ?? null,
    })),
  }))
);
</script>

<style scoped>
.custom_scroll_bar::-webkit-scrollbar { width: 3px; height: 3px; }
.custom_scroll_bar::-webkit-scrollbar-thumb { background-color: rgba(150,150,150,0.4); border-radius: 10px; }
.custom_scroll_bar::-webkit-scrollbar-thumb:hover { background-color: #555; }
.custom_scroll_bar::-webkit-scrollbar-track { background: transparent; }
.custom_scroll_bar { scrollbar-width: thin; scrollbar-color: rgba(150,150,150,0.5) transparent !important; }
</style>