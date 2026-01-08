<template>
  <div class="flex-auto flex-grow h-full bg-bg-card rounded-[6px] border border-border overflow-hidden flex flex-col">

     <!-- Skeleton Loader -->
    <KanbanSkeleton v-if="isPending" />
    <!-- Board Area -->
    <div  v-if="!isPending" class="flex-1 w-full p-4 overflow-x-auto flex items-start gap-4">

      <!-- Kanban Board (Columns) --> 
      <ProcessKanbanBoard 
        v-if="localList?.length > 0" 
        @delete:column="(e: any) => handleDeleteColumn(e)"
        @update:column="(e) => handleUpdateColumn(e)" 
        @onPlus="openAddTransition" 
        @select:ticket="handleClickTicket"
        :board="localList"
        @reorder="handleReorder">
        
        <template #ticket="{ ticket, index }">
          <ProcessKanbanCard 
            @click="handleClickTicket(ticket)" 
            @dblclick="handleDblClick(ticket)"
            @open-builder="handleOpenBuilder(ticket)"
            :ticket="ticket" 
            :index="index" />
        </template>
      </ProcessKanbanBoard>

      <!-- Inline Add Column Button/Form -->
      <div class="min-w-[300px] max-w-[300px] shrink-0">
        <div v-if="!activeAddList" 
          @click="activeAddList = true"
          class="max-w-82 ms-4 text-sm text-text-primary py-2.5 font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg cursor-pointer">
          <i class="fa-solid fa-plus"></i>
          <span class="font-medium">Add Process Group</span>
        </div>

        <div v-else class="bg-bg-body rounded-lg p-3 border border-border shadow-sm">
          <BaseTextField size="md" :autofocus="true" v-model="newColumn" placeholder="Group Name..." 
            class="mb-3"
            @keyup.enter="emitAddColumn" />
          <div class="flex items-center gap-2">
            <Button @click="emitAddColumn" variant="primary" size="sm" :loading="addingList">
              Add Group
            </Button>
            <i class="fa-solid fa-close cursor-pointer text-text-secondary hover:text-text-primary px-2" @click="activeAddList = false"></i>
          </div>
        </div>
      </div>
    </div>
  </div>

  <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete Group" itemLabel="group"
    :itemName="localColumn?.title" :requireMatchText="localColumn?.title" confirmText="Delete Group"
    cancelText="Cancel" size="md" :loading="isDeletingList" @confirm="confirmDeleteColumn"
    @cancel="() => { showDelete = false }" />

   <AddTransitionModal v-model="isAddTransitionModal" :group="selectedGroupForAdd" @created="handleTransitionCreated" />

   <ProcessWorkflowBuilderModal v-model="showWorkflowBuilder" :process="selectedProcess" @close="closeWorkflowBuilder" />

   <ProcessSidePanel 
        v-if="selectedSidePanelCard" 
        :showPanel="showSidePanel" 
        :details="selectedSidePanelCard" 
        @close="closeSidePanel" 
    />
</template>

<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue';
import BaseTextField from '../../components/ui/BaseTextField.vue';
import KanbanSkeleton from '../../components/skeletons/KanbanSkeleton.vue';
import { useRouteIds } from '../../composables/useQueryParams';
import {
  useProcessGroupsWithTransitions,
  useCreateProcessGroup,
  useDeleteProcessGroup,
  useUpdateProcessGroup,
  useReorderProcessGroups,
  useReorderTransitions,
  useUpdateTransition
} from '../../queries/useProcess2';
import ProcessKanbanBoard from './components/ProcessKanbanBoard.vue';
import ProcessKanbanCard from './components/ProcessKanbanCard.vue';
import ConfirmDeleteModal from '../Product/modals/ConfirmDeleteModal.vue';
import { useQueryClient } from '@tanstack/vue-query';
import Button from '../../components/ui/Button.vue';
import ProcessWorkflowBuilderModal from './modals/ProcessWorkflowBuilderModal.vue';
import AddTransitionModal from './modals/AddTransitionModal.vue';

const { workspaceId } = useRouteIds();
const { data: processGroups, isPending } = useProcessGroupsWithTransitions(workspaceId.value);

watchEffect(()=>{
  console.log(processGroups.value, "this ....")
})

const localList = ref<any>([]);

watch(processGroups, (newVal) => {
  const groups = newVal?.data?.groups || newVal?.groups || [];

  if (groups) {
    localList.value = groups.map((group: any) => ({
      ...group,
      cards: group.transitions || []
    }));
  }
}, { immediate: true });



/* -------------------------------------------------------------------------- */
/*                                Add Process Group                           */
/* -------------------------------------------------------------------------- */
const activeAddList = ref(false);
const newColumn = ref('');
const queryClient = useQueryClient();

const { mutate: addList, isPending: addingList } = useCreateProcessGroup({
  onSuccess: () => {
    newColumn.value = '';
    activeAddList.value = false;
    queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] });
  },
});

function emitAddColumn() {
  const t = newColumn.value.trim();
  if (!t) return;
  addList({ 
      workspace_id: workspaceId.value,
      title: t,
      sort_order: localList.value.length
  });
}

/* -------------------------------------------------------------------------- */
/*                               Delete Process Group                         */
/* -------------------------------------------------------------------------- */
const showDelete = ref(false);
const localColumn = ref<any>(null);

const { mutate: deleteList, isPending: isDeletingList } = useDeleteProcessGroup({
  onSuccess: () => {
    showDelete.value = false;
    queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] });
  },
});

const handleDeleteColumn = (col: any) => {
    localColumn.value = col;
    showDelete.value = true;
};

const confirmDeleteColumn = () => {
  if (localColumn.value) {
    deleteList({ workspace_id: workspaceId.value, group_id: localColumn.value.columnId });
  }
};

/* -------------------------------------------------------------------------- */
/*                               Update Process Group                         */
/* -------------------------------------------------------------------------- */
const { mutate: updateGroup } = useUpdateProcessGroup({
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] });
    }
});

const handleUpdateColumn = (col: any) => {
    updateGroup({ 
        workspace_id: workspaceId.value, 
        group_id: col._id, 
        payload: { title: col.title } 
    });
}

/* -------------------------------------------------------------------------- */
/*                               Reorder Logic                                */
/* -------------------------------------------------------------------------- */
const { mutate: reorderGroups } = useReorderProcessGroups();
const { mutate: reorderTransitions } = useReorderTransitions();
const { mutate: updateTransition } = useUpdateTransition({
    onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] });
    }
});

const handleReorder = (event: any) => {
    if (event.type === 'column') {
        const groups = event.board.columns.map((col: any, index: number) => ({
            group_id: col._id,
            sort_order: index
        }));
        reorderGroups({ workspace_id: workspaceId.value, groups });
    } else if (event.type === 'ticket') {
        const meta = event.meta;
        console.log(localList.value, "...")
        console.log("hites", meta)
        if (meta.fromColumnId === meta.toColumnId) {
             const group = localList.value.find((g: any) => g._id === meta.toColumnId);
             
             if(group) {
                 const transitions = group.cards.map((t: any, index: number) => ({
                     transition_id: t._id,
                     sort_id: index
                 }));
                 reorderTransitions({ 
                     workspace_id: workspaceId.value, 
                     group_id: meta.toColumnId, 
                     transitions 
                 });
             }
        } else {
            const movedTicket = meta.moved;
            if (movedTicket && meta.toColumnId) {
                 updateTransition({
                     workspace_id: workspaceId.value,
                     transition_id: movedTicket._id,
                     payload: { group_id: meta.toColumnId }
                 });
            }
        }
    }
}

 
/* -------------------------------------------------------------------------- */
/*                               Ticket Handling                              */
/* -------------------------------------------------------------------------- */
const selectedProcess = ref<any>(null);
const showWorkflowBuilder = ref(false);
const showSidePanel = ref(false);
const selectedSidePanelCard = ref<any>(null);
const singleClickTimer = ref<any>(null);

const handleOpenBuilder = (ticket: any) => {
    selectedProcess.value = ticket;
    showWorkflowBuilder.value = true;
    showSidePanel.value = false;
};

const handleDblClick = (ticket: any) => {
  if (singleClickTimer.value) {
    clearTimeout(singleClickTimer.value);
    singleClickTimer.value = null;
  }
  handleOpenBuilder(ticket);
}

const handleClickTicket = (ticket: any) => {
  if (singleClickTimer.value) clearTimeout(singleClickTimer.value);
  
  singleClickTimer.value = setTimeout(() => {
    singleClickTimer.value = null;
    // Single click: Side Panel
    selectedSidePanelCard.value = ticket;
    showSidePanel.value = true;
  }, 300); // 300ms delay to wait for potential double click
};

const closeWorkflowBuilder = () => {
  showWorkflowBuilder.value = false;
  selectedProcess.value = null;
};

const closeSidePanel = () => {
    showSidePanel.value = false;
    selectedSidePanelCard.value = null;
}

/* -------------------------------------------------------------------------- */
/*                               Add Transition                               */
/* -------------------------------------------------------------------------- */
const isAddTransitionModal = ref(false);
const selectedGroupForAdd = ref<any>(null);

const openAddTransition = (group: any) => {
    selectedGroupForAdd.value = group;
    isAddTransitionModal.value = true;
}

const handleTransitionCreated = () => {
    isAddTransitionModal.value = false;
    queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] });
}

import ProcessSidePanel from './components/ProcessSidePanel.vue';

</script>
