<template>
  <div class="flex-auto flex-grow h-full bg-bg-surface rounded-[6px] border border-border overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="overflow-x-auto shrink-0 sticky top-0 z-20 bg-bg-surface border-b border-border">
      <div class="flex items-center justify-between gap-4 py-2 px-2">
       <div class="flex gap-4 ms-1.5">
         <h2 class="text-md font-semibold text-foreground text-nowrap">All Processes</h2>

        <!-- Group By split-button -->
        <div
          ref="viewByTriggerEl"
          class="inline-flex items-center rounded-md border border-border overflow-hidden text-xs whitespace-nowrap shadow-sm"
        >
          <!-- Left: static label -->
          <button
            @click="showViewDropdown = !showViewDropdown"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-surface hover:bg-bg-body text-text-secondary font-medium transition-colors"
          >
            <i class="fa-solid fa-layer-group text-[10px]"></i>
            Group By
          </button>

          <!-- Divider -->
          <div class="w-px self-stretch bg-border"></div>

          <!-- Right: active value -->
          <button
            @click="showViewDropdown = !showViewDropdown"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 hover:bg-primary/15 text-primary font-semibold transition-colors"
          >
            {{ selectedViewLabel }}
            <i
              class="fa-solid fa-chevron-down text-[9px] transition-transform duration-200"
              :class="{ 'rotate-180': showViewDropdown }"
            ></i>
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

        <div class="w-[250px]">
          <SearchBar
            placeholder="Search processes..."
            @onChange="(val: any) => searchQuery = val"
          />
        </div>
      </div>
    </div>

    <!-- Skeleton Loader -->
    <KanbanSkeleton v-if="isPending" />

    <!-- Board Area -->
   <div v-if="!isPending" class="flex-1 w-full px-2 overflow-hidden flex flex-col">
  <div class="flex-1 overflow-x-auto flex items-start gap-2 scrollbar-visible py-2">
    
    <!-- DEBUG: remove after fix -->
    <div style="display:none">
      <span v-for="col in filteredList" :key="col._id">
        {{ col.title }}: {{ col.cards?.length ?? 0 }} cards
      </span>
    </div>

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
import { ref, watch, computed } from 'vue';
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

const { workspaceId } = useRouteIds();
const selectedViewBy    = ref('module');

const queryParams = computed(() => ({
  group_by: selectedViewBy.value,
}))

interface ProcessGroupsResponse {
  grouped_by?: string
  groups?: any[]
}

const query = useProcessGroupsWithTransitions(workspaceId, queryParams)

const processGroups = computed<ProcessGroupsResponse | undefined>(
  () => query.data.value as ProcessGroupsResponse
)

const isPending = query.isPending

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

const viewByTriggerEl   = ref<HTMLElement | null>(null);
const showViewDropdown  = ref(false);

const selectedViewLabel = computed(
  () => processOptions.value.find(o => o._id === selectedViewBy.value)?.title ?? 'View by'
);

/* -------------------------------------------------------------------------- */
/*                                 Local List                                 */
/* -------------------------------------------------------------------------- */
const localList = ref<any[]>([]);

watch(processGroups, (newVal: any) => {
  if (!newVal?.groups) { localList.value = []; return }

  const groupedBy = newVal.grouped_by
  const columns: any[] = []

  if (groupedBy === 'module') {
    // { groups: [{ module, process_groups: [{ _id, title, transitions }] }] }
    newVal.groups.forEach((moduleGroup: any) => {
      const pgs = moduleGroup.process_groups ?? []
      pgs.forEach((pg: any) => {
        const raw = pg.transitions
        const transitionsArray: any[] = raw
          ? Array.isArray(raw) ? raw : Object.values(raw)
          : []

        columns.push({
          _id:         pg._id,
          columnId:    pg._id,
          title:       pg.title ?? 'Untitled Group',
          color:       pg.color ?? '#3b82f6',
          icon:        pg.icon ?? null,
          is_default:  pg.is_default ?? false,
          transitions: transitionsArray.map((t: any) => ({ ...t })),
        })
      })
    })

  } else if (groupedBy === 'card_type') {
    // { groups: [{ card_type, module, transitions: [...] }] }
    newVal.groups.forEach((group: any) => {
      const raw = group.transitions
      const transitionsArray: any[] = raw
        ? Array.isArray(raw) ? raw : Object.values(raw)
        : []

      columns.push({
        _id:         group.card_type,   // no _id on this shape
        columnId:    group.card_type,
        title:       group.card_type ?? 'Untitled',
        subtitle:    group.module ?? null,
        color:       '#3b82f6',
        icon:        null,
        is_default:  false,
        transitions: transitionsArray.map((t: any) => ({ ...t })),
      })
    })

  } else if (groupedBy === 'card_status') {
    // { groups: [{ card_status, color, is_start, is_end, sort_order, card_types, modules }] }
    // No transitions — each group IS a status column, cards would be loaded separately
    newVal.groups.forEach((group: any) => {
      columns.push({
        _id:         group.card_status,
        columnId:    group.card_status,
        title:       group.card_status ?? 'Untitled',
        color:       group.color ?? '#3b82f6',
        is_start:    group.is_start ?? false,
        is_end:      group.is_end ?? false,
        sort_order:  group.sort_order ?? 0,
        card_types:  group.card_types ?? [],
        modules:     group.modules ?? [],
        transitions: [],   // no cards in this response shape
      })
    })

  } else {
    console.warn('[Process2] Unknown grouped_by:', groupedBy)
  }

  localList.value = columns
}, { immediate: true, deep: true })

/* -------------------------------------------------------------------------- */
/*                                Search Logic                                */
/* -------------------------------------------------------------------------- */
const searchQuery    = ref('');
const debouncedQuery = ref('');

watch(searchQuery, debounce((val: string) => { debouncedQuery.value = val; }, 200));

const filteredList = computed(() => {
  const query = debouncedQuery.value.toLowerCase().trim()

  if (!query) return localList.value

  return localList.value
    .map((col: any) => {
      const matchingCards = (col.transitions ?? []).filter((card: any) =>
        card.title?.toLowerCase().includes(query) ||
        card.name?.toLowerCase().includes(query)
      )

      return {
        ...col,
        transitions: matchingCards
      }
    })
    .filter((col: any) => {
      // For card_status view columns have no transitions — don't hide them
      if (processGroups.value?.grouped_by === 'card_status') {
        return true
      }

      return col.transitions.length > 0
    })
})
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

const handleDeleteColumn = (col: any) => { localColumn.value = col; showDelete.value = true; };

const confirmDeleteColumn = () => {
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
const { mutate: reorderGroups }     = useReorderProcessGroups();
const { mutate: reorderTransitions} = useReorderTransitions();
const { mutate: updateTransition }  = useUpdateTransition({
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
const selectedProcess        = ref<any>(null);
const showWorkflowBuilder    = ref(false);
const showSidePanel          = ref(false);
const selectedSidePanelCard  = ref<any>(null);
const singleClickTimer       = ref<ReturnType<typeof setTimeout> | null>(null);

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
/*                             Add Transition                                 */
/* -------------------------------------------------------------------------- */
const isAddTransitionModal  = ref(false);
const selectedGroupForAdd   = ref<any>(null);

const openAddTransition = (group: any) => { selectedGroupForAdd.value = group; isAddTransitionModal.value = true; };

const handleTransitionCreated = () => {
  isAddTransitionModal.value = false;
  queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] });
};

const showGeneralWorkflowBuilder = ref(false);
</script>

<style scoped>
.custom_scroll_bar::-webkit-scrollbar { width: 3px; height: 3px; }
.custom_scroll_bar::-webkit-scrollbar-thumb { background-color: rgba(150,150,150,0.4); border-radius: 10px; }
.custom_scroll_bar::-webkit-scrollbar-thumb:hover { background-color: #555; }
.custom_scroll_bar::-webkit-scrollbar-track { background: transparent; }
.custom_scroll_bar { scrollbar-width: thin; scrollbar-color: rgba(150,150,150,0.5) transparent !important; }
</style>