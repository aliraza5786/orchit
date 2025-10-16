<template>
  <div class="flex-auto flex-grow h-full bg-bg-card rounded-lg border border-border  overflow-x-auto flex-col flex  ">
    <div class="header px-4 py-3 border-b  border-border flex items-center justify-between gap-1">
      <Dropdown prefix="View By" v-model="selected_view_id" :options="viewData" variant="secondary">
      </Dropdown>
      <div class="flex gap-3 items-center ">
        <Searchbar placeholder="Search in Orchit AI space">
        </Searchbar>
      </div>
    </div>
    <KanbanSkeleton v-if="isListPending" />
    <div v-else-if="currentView == 'kanban'" class="flex p-4 overflow-x-auto gap-3">
      <KanbanBoard v-if="localList?.length > 0" @onPlus="(e) => handlePLus(e)"
        @delete:column="(e: any) => handleDelete(e)" @update:column="(e) => handleUpdateColumn(e)" @reorder="onReorder"
        @addColumn="handleAddColumn" @select:ticket="selectCardHandler" :board="localList"
        @onBoardUpdate="handleBoardUpdate" variable_id="" sheet_id="selected_sheet_id">
        <template #ticket="{ ticket, index }">
          <KanbanCard @click="handleClickTicket(ticket)" :ticket="ticket" :index="index" />
        </template>
        <template #column-footer="{ column }: any">
          <div v-if="!column.showADDNEW" @click="toggleAddNewColumn(column)"
            class="flex py-3 px-3 justify-center text-sm text-text-primary items-center gap-3 border border-text-primary cursor-pointer border-dashed mb-4 mx-4 rounded-md">
            <i class="fa-solid fa-plus"></i> Add Seat
          </div>
          <div v-else-if="column.showADDNEW" class="p-4 space-y-2 bg-bg-surface m-4 rounded-md">
            <p class="text-sm text-text-primary">{{ column.title }} {{ column.cards.length + 1 }}</p>
            <BaseEmailChip placeholder="team member email" v-model="column.email" />
            <p class="text-sm text-text-secondary">You can assign user later</p>
            <Button size="md" @click="addSeatToColumn(column)">{{ isPending ? 'Adding...' : 'Add Seat' }}</Button>
            <i class="fa-solid fa-close cursor-pointer ml-2" @click="toggleAddNewColumn(column)"></i>
          </div>
        </template>
      </KanbanBoard>
      <!-- Add Column -->
      <div class="min-w-[328px]" @click.stop>
        <div v-if="activeAddList" class="bg-bg-body rounded-lg p-4">
          <BaseTextField :autofocus="true" v-model="newColumn" placeholder="Add New list"
            @keyup.enter="emitAddColumn" />
          <p class="text-xs mt-1.5">You can add details while editing</p>
          <div class="flex items-center mt-3 gap-3">
            <Button @click="emitAddColumn" variant="primary"
              class="px-3 py-1 bg-accent cursor-pointer text-white rounded">
              {{ addingList ? 'Adding...' : 'Add Team' }}
            </Button>
            <i class="fa-solid fa-close cursor-pointer" @click="setActiveAddList"></i>
          </div>
        </div>
        <button v-else
          class="text-sm text-text-primary py-2.5 cursor-pointer font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
          @click.stop="setActiveAddList">
          + Add Team
        </button>
      </div>
    </div>
  </div>
  <!-- ConfirmDeleteModal Component -->
  <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete List" itemLabel="list"
    :itemName="localColumn?.title" :requireMatchText="localColumn?.title" confirmText="Delete workspace"
    cancelText="Cancel" size="md" :loading="isDeletingList" @confirm="handleDeleteColumn"
    @cancel="() => { showDelete = false }" />

  <DetailPanel :details="selectedCard" @close="() => { selectCardHandler({ variables: {} }) }"
    :showPanel="selectedCard?.title ? true : false" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watch, onMounted } from 'vue';
// import { ReOrderCard, ReOrderList } from '../../queries/useSheets';
import KanbanSkeleton from '../../components/skeletons/KanbanSkeleton.vue';
import BaseTextField from '../../components/ui/BaseTextField.vue';
import { useRouteIds } from '../../composables/useQueryParams';
import { useCreateTeam, useCreateTeamMember, useDeleteTeam, usePeopleList } from '../../queries/usePeople';
import KanbanCard from './components/KanbanCard.vue';
import ConfirmDeleteModal from '../Product/modals/ConfirmDeleteModal.vue';
import { useQueryClient } from '@tanstack/vue-query';
import Button from '../../components/ui/Button.vue';
import BaseEmailChip from '../../components/ui/BaseEmailChip.vue';
import { useUpdateInvitedWorkspace } from '../../queries/useWorkspace';
import Dropdown from '../../components/ui/Dropdown.vue';
import DetailPanel from './components/DetailPanel.vue';

const KanbanBoard = defineAsyncComponent(() => import('../../components/feature/kanban/KanbanBoard.vue'));

const viewData = [
  {
    title: 'Role',
    _id: 'role',
  }, {
    title: 'Team',
    _id: 'team',
  },
  {
    title: 'Status',
    _id: 'status',
  },
]

const selected_view_id = ref('role');
const showDelete = ref(false);
const localColumn = ref();
const { workspaceId } = useRouteIds();
const { mutate: addList, isPending: addingList } = useCreateTeam({
  onSuccess: (data: any) => {
    localList.value = [...(localList.value || []), data];
    newColumn.value = '';
    activeAddList.value = false;
  },
});

const localList = ref<any>([]);
const { data: Lists, isPending: isListPending } = usePeopleList(workspaceId.value, selected_view_id);
watch(Lists, (newVal) => {
  localList.value = newVal;
});
onMounted(() => {
  localList.value = Lists.value;
});

const currentView = ref<'kanban' | 'list'>('kanban');
const selectedCard = ref<any>();
const selectCardHandler = (card: any) => {
  selectedCard.value = card;
};

// const reorderList = ReOrderList();
// const reorderCard = ReOrderCard();

function onReorder(a: any) {
  if (a.type === 'column') {
    // updateList.mutate({
    //   id:a.meta.id,
    //   payload: {
    //     workspace_id: workspaceId.value,
    //     workspace_module_id: moduleId.value,
    //     moved_value: a.meta.id,
    //     new_index: a.meta.newIndex,
    //   },
    // });
  } else {
    updateList.mutate({
      id: a.meta.moved._id,
      payload: {
        roleId: a.meta.toColumnId,
      },
    });
  }
}

const handleBoardUpdate = (_: any) => { };
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
    title: name,
    max_num_people: 1

  }
  addList({
    payload
  })
}


const queryClient = useQueryClient();
const updateList = useUpdateInvitedWorkspace({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['people-lists'] });
  },
});

const handleUpdateColumn = (newTitle: any) => {
  const payload = {
    workspace_id: workspaceId.value,
    title: newTitle?.title,
    max_num_people: 1,
  };
  updateList.mutate({ id: newTitle._id, payload });
};

const { mutate: deleteList, isPending: isDeletingList } = useDeleteTeam({
  onSuccess: (data: any) => {
    showDelete.value = false;
    localList.value = localList.value.filter((e: any) => e._id !== data.deletedRole?._id);
  },
});

const handleDeleteColumn = () => {
  deleteList({ id: localColumn.value?.columnId });
};

const handleDelete = (e: any) => {
  showDelete.value = true;
  localColumn.value = e;
};
const { mutate: createTeam, isPending } = useCreateTeamMember({
  onSuccess: () => {
    newColumn.value = '';
    activeAddList.value = false;
    queryClient.invalidateQueries({ queryKey: ['people-lists'] });
  }
});
const handlePLus = (column: any) => {
  localColumn.value = column;
  const payload = {
    name: extractNameFromEmail(column.email[0]),
    email: column.email[0],
    role_id: column._id,
    workspace_id: workspaceId.value,
    additional_seats: 1,
    // max_num_people: column.cards.length + 1,
  };
  createTeam({ id: column._id, payload });
};
/** Optional: Name extraction for chip display */
function extractNameFromEmail(email: string) {
  const local = (email.split('@')[0] || '').split('+')[0]
  const parts = local.split(/[^a-zA-Z]+/).filter(Boolean)
  if (!parts.length) return email
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}
// Handle toggling of "Add Seat" form for each column
const toggleAddNewColumn = (column: any) => {
  column.showADDNEW = !column.showADDNEW;
};

// Handle adding seat to the specific column (this will now trigger handlePLus)
const addSeatToColumn = (column: any) => {
  handlePLus(column); // Call handlePLus when adding a seat
};

const handleClickTicket = (ticket: any) => {
  selectedCard.value = ticket
}
</script>