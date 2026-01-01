<template>
  <div class="flex-auto flex-grow h-full bg-bg-card rounded-lg border border-border overflow-x-auto flex-col flex items-start">
    <!-- <div class="header px-4 py-3 border-b border-border flex items-center justify-between gap-1">
      <Dropdown v-model="selectedSheetId" :options="transformedSheets" variant="secondary">
        <template #more>
          <div @click="openCreateSheetModal()"
            class="capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap">
            <i class="fa-solid fa-plus"></i> Add new sheet
          </div>
        </template>
</Dropdown>
<div class="flex gap-3 items-center">
  <Searchbar placeholder="Search processes">
  </Searchbar>
</div>
</div> -->
    <!-- <KanbanSkeleton v-if="isListPending" />
    <div v-else class="flex p-4 overflow-x-auto gap-3"> -->
    <!-- <KanbanBoard v-if="localList?.length > 0" @delete:column="(e: any) => handleDelete(e)"
        @update:column="(e) => handleUpdateColumn(e)" @addColumn="handleAddColumn" @select:ticket="selectCardHandler"
        :board="localList" @onBoardUpdate="handleBoardUpdate" variable_id="" sheet_id="">
        <template #ticket="{ ticket, index }"> -->
    <div class="max-w-82 p-4 bg-bg-body rounded-md m-4">
      <ProcessKanbanCard @click="handleClickTicket(item)" v-for="(item, index) in localList[0]?.cards" :key="index"
        :ticket="item" :index="index" />
    </div>
    <button 
      class="max-w-82 ms-4 text-sm text-text-primary py-2.5 font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg cursor-pointer"
      @click="isAddProcessModal = true"
    >
      + Add New Process
    </button>
    <!-- </template> -->
    <!-- <template #column-footer="{ column }: any">
          <div v-if="!column.showADDNEW" @click="toggleAddNewProcess(column)"
            class="flex py-3 px-3 justify-center text-sm text-text-primary items-center gap-3 border border-text-primary cursor-pointer border-dashed mb-4 mx-4 rounded-md">
            <i class="fa-solid fa-plus"></i> Add Process
          </div>
          <div v-else-if="column.showADDNEW" class="p-4 space-y-2 bg-bg-surface m-4 rounded-md">
            <p class="text-sm text-text-primary">New Process</p>
            <BaseTextField v-model="newProcessTitle" placeholder="Process title" />
            <BaseTextAreaField v-model="newProcessDescription" placeholder="Process description (optional)" />
            <Button size="md" @click="addProcessToColumn(column)">{{ isPending ? 'Adding...' : 'Add Process' }}
            </Button>
            <i class="fa-solid fa-close cursor-pointer ml-2" @click="toggleAddNewProcess(column)"></i>
          </div>
        </template> -->
    <!-- </KanbanBoard> -->
    <div class="min-w-[328px]" @click.stop>
      <div v-if="activeAddList" class="bg-bg-body rounded-lg p-4">
        <BaseTextField :autofocus="true" v-model="newColumn" placeholder="Add New Column"
          @keyup.enter="emitAddColumn" />
        <p class="text-xs mt-1.5">You can add details while editing</p>
        <div class="flex items-center mt-3 gap-3">
          <Button @click="emitAddColumn" variant="primary"
            class="px-3 py-1 bg-accent cursor-pointer text-white rounded">
            {{ addingList ? 'Adding...' : 'Add Column' }}
          </Button>
          <i class="fa-solid fa-close cursor-pointer" @click="setActiveAddList"></i>
        </div>
      </div>
      <!-- <button v-else
          class="text-sm text-white py-2.5 cursor-pointer font-medium flex items-center justify-center w-full gap-2 bg-accent rounded-lg"
          @click.stop="setActiveAddList">
          + Add Column
        </button> -->
    </div>
    <!-- </div> -->
  </div>

  <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete Column" itemLabel="column"
    :itemName="localColumn?.title" :requireMatchText="localColumn?.title" confirmText="Delete column"
    cancelText="Cancel" size="md" :loading="isDeletingList" @confirm="handleDeleteColumn"
    @cancel="() => { showDelete = false }" />

  <WorkflowBuilderModal  v-model="showWorkflowBuilder" :process="selectedProcess" @close="closeWorkflowBuilder" />

  <CreateProcessSheetModal v-model="isCreateSheetModal" @created="handleSheetCreated" />
  
  <AddProcessModal v-model="isAddProcessModal" @created="handleProcessCreated" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, watchEffect } from 'vue';
import BaseTextField from '../../components/ui/BaseTextField.vue';
import { useRouteIds } from '../../composables/useQueryParams';
import {
  useProcessColumns,
  useCreateProcessColumn,
  useDeleteProcessColumn,
  useProcessSheets
} from '../../queries/useProcess';
import ProcessKanbanCard from './components/ProcessKanbanCard.vue';
import ConfirmDeleteModal from '../Product/modals/ConfirmDeleteModal.vue';
import { useQueryClient } from '@tanstack/vue-query';
import Button from '../../components/ui/Button.vue';
import WorkflowBuilderModal from './modals/WorkflowBuilderModal.vue';

import CreateProcessSheetModal from './modals/CreateProcessSheetModal.vue';
import AddProcessModal from './modals/AddProcessModal.vue';

const isAddProcessModal = ref(false);
const showDelete = ref(false);
const localColumn = ref();
const { workspaceId } = useRouteIds();

const { data: processSheets } = useProcessSheets(workspaceId.value);
const selectedSheetId = ref<string>('sheet-1');



watch(processSheets, (newSheets) => {
  if (newSheets && newSheets.length > 0 && !selectedSheetId.value) {
    selectedSheetId.value = newSheets[0]?._id;
  }
});

const isCreateSheetModal = ref(false);
const { mutate: addList, isPending: addingList } = useCreateProcessColumn({
  onSuccess: (data: any) => {
    localList.value = [...(localList.value || []), { ...data, cards: [] }];
    newColumn.value = '';
    activeAddList.value = false;
  },
});

const localList = ref<any>([]);
const { data: Lists, } = useProcessColumns(workspaceId.value, selectedSheetId);
watchEffect(()=>{
  console.log(Lists.value, "this is the list ")
})
watch(Lists, (newVal) => {
  if (newVal) {
    localList.value = newVal.map((col: any) => ({
      ...col,
      _id: col.id,
      cards: col.processes || []
    }));
  }
});
onMounted(() => {
  if (Lists.value) {
    localList.value = Lists.value.map((col: any) => ({
      ...col,
      _id: col.id,
      cards: col.processes || []
    }));
  }
});

const selectedProcess = ref<any>(null);
const showWorkflowBuilder = ref(false);


const activeAddList = ref(false);
const newColumn = ref('');

function setActiveAddList() {
  activeAddList.value = !activeAddList.value;
}

function emitAddColumn() {
  const t = newColumn.value.trim();
  if (!t) return;
  handleAddColumn(t);
}

const handleAddColumn = (name: any) => {
  const payload = {
    workspace_id: workspaceId.value,
    sheet_id: selectedSheetId.value,
    title: name,
    order: localList.value.length
  }
  addList({ payload })
}

const queryClient = useQueryClient();

const { mutate: deleteList, isPending: isDeletingList } = useDeleteProcessColumn({
  onSuccess: () => {
    showDelete.value = false;
    queryClient.invalidateQueries({ queryKey: ['process-columns'] });
  },
});

const handleDeleteColumn = () => {
  deleteList({ id: localColumn.value?.columnId });
};




const handleClickTicket = (ticket: any) => {
  selectedProcess.value = ticket;
  showWorkflowBuilder.value = true;
};

const closeWorkflowBuilder = () => {
  showWorkflowBuilder.value = false;
  selectedProcess.value = null;
};

const handleSheetCreated = () => {
  isCreateSheetModal.value = false;
  queryClient.invalidateQueries({ queryKey: ['process-sheets'] });
};

const handleProcessCreated = () => {
  isAddProcessModal.value = false;
  queryClient.invalidateQueries({ queryKey: ['process-columns'] });
};
</script>
