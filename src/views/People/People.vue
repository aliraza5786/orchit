<template>
  <div class="flex-auto flex-grow h-full bg-bg-card rounded-[6px] border border-border  overflow-x-auto flex-col flex  ">
   <div class="overflow-x-auto shrink-0 border-b border-border">
        <div class="header px-4 py-3 flex items-center justify-between gap-2">
      <Dropdown :actions="false" prefix="View By" v-model="selected_view_id" :options="viewData" variant="secondary" customClasses="fixed w-[135px]">
      </Dropdown>
      <div class="flex gap-3 items-center ">
        <SearchBar class="max-w-[250px]" @onChange="(e:any) => {
                    searchQuery = e
                }" placeholder="Search in Orchit AI space">
                </SearchBar>
      </div>
    </div>
   </div>
    <KanbanSkeleton v-show="isListPending" />
    <div v-show="currentView == 'kanban' && !isListPending" class="flex p-4 overflow-x-auto gap-3 custom_scroll_bar h-full">
      <KanbanBoard :plusIcon="false" v-if="filteredBoard?.length > 0" @onPlus="(e) => handlePLus(e)"
        @delete:column="(e: any) => handleDelete(e)" @update:column="(e) => handleUpdateColumn(e)" @reorder="onReorder"
        @addColumn="handleAddColumn" @select:ticket="selectCardHandler" :board="filteredBoard"
        @onBoardUpdate="handleBoardUpdate" variable_id="" sheet_id="selected_sheet_id">
        <template #ticket="{ ticket }">
          <KanbanCard @click="handleClickTicket(ticket)" :ticket="ticket" />
        </template>
        <template #column-footer="{ column }: any">
          <div  v-if="!column.showADDNEW" @click="toggleAddNewColumn(column)"
            :disabled="!canInviteUser" :class="canInviteUser? 'cursor-pointer':'cursor-not-allowed'"
            class="flex py-3 px-3 justify-center text-sm text-text-primary items-center gap-3 border border-text-primary border-dashed mb-4 mx-4 rounded-md">
            <i class="fa-solid fa-plus"></i> Add Seat
          </div>
          <div v-else-if="column.showADDNEW" class="p-4 space-y-2 bg-bg-surface m-4 rounded-md">
            <p class="text-sm text-text-primary">{{ column.title }} {{ column.cards.length + 1 }}</p>
            <BaseEmailChip :maxEmails="1" placeholder="team member email" v-model="column.email" />
            <p class="text-sm text-text-secondary">You can assign user later</p>
            <Button size="md" @click="addSeatToColumn(column)">{{ isPending ? 'Adding...' : 'Add Seat' }}</Button>
            <i class="fa-solid fa-close cursor-pointer ml-2" @click="toggleAddNewColumn('')"></i>
          </div>
        </template>
      </KanbanBoard>
      <!-- Add Column -->
      <div class="min-w-[270px] sm:min-w-[328px]" @click.stop>
        <form @submit.prevent="" v-if="activeAddList" class="bg-bg-body rounded-lg p-4">
          <BaseTextField :autofocus="true" v-model="newColumn" placeholder="Add New list"
            />
          <p class="text-xs mt-1.5">You can add details while editing</p>
          <div class="flex items-center mt-3 gap-3">
            <Button :disabled="!canCreateVariable" :class="canCreateVariable? 'cursor-pointer':'cursor-not-allowed'" @click="emitAddColumn" type="submit"  variant="primary"
              class="px-3 py-1 bg-accent  text-white rounded">
              {{ addingList ? 'Adding...' : 'Add Team' }}
            </Button>
            <i class="fa-solid fa-close cursor-pointer" @click="setActiveAddList"></i>
          </div>
        </form>
        <button v-else
          class="text-sm text-text-primary py-2.5  font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
          @click.stop="setActiveAddList" :disabled="!canCreateVariable" :class="canCreateVariable? 'cursor-pointer':'cursor-not-allowed'">
          + Add Team
        </button>
      </div>
    </div>
  </div>
  <!-- ConfirmDeleteModal Component -->
  <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete List" itemLabel="list"
    :itemName="localColumn?.title" :requireMatchText="localColumn?.title" confirmText="Delete List"
    cancelText="Cancel" size="md" :loading="isDeletingList" @confirm="handleDeleteColumn"
    @cancel="() => { showDelete = false }" />

  <DetailPanel :details="selectedCard" @close="() => { selectCardHandler({ }) }"
    :showPanel="selectedCard?.title ? true : false" />
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref, watch, onMounted, computed } from 'vue';
// import { ReOrderCard, ReOrderList } from '../../queries/useSheets';
import KanbanSkeleton from '../../components/skeletons/KanbanSkeleton.vue';
import BaseTextField from '../../components/ui/BaseTextField.vue';
import { useRouteIds } from '../../composables/useQueryParams';
import { ReOrderCard, ReOrderList, useCreateTeam, useCreateTeamMember, useDeleteTeam, usePeopleList } from '../../queries/usePeople';
import ConfirmDeleteModal from '../Product/modals/ConfirmDeleteModal.vue';
import { useQueryClient } from '@tanstack/vue-query';
import Button from '../../components/ui/Button.vue';
import BaseEmailChip from '../../components/ui/BaseEmailChip.vue';
import { useUpdateInvitedWorkspace } from '../../queries/useWorkspace';
import Dropdown from '../../components/ui/Dropdown.vue';
import DetailPanel from './components/DetailPanel.vue';
import Fuse from 'fuse.js';
import { debounce } from 'lodash';
import SearchBar from '../../components/ui/SearchBar.vue';
const KanbanBoard = defineAsyncComponent(() => import('../../components/feature/kanban/KanbanBoard.vue'));
const KanbanCard = defineAsyncComponent(() => import('./components/KanbanCard.vue'));

import { usePermissions } from '../../composables/usePermissions'
import { toast } from 'vue-sonner';
const {  canCreateVariable,  canInviteUser} = usePermissions()

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

const selected_view_id = ref('team');
const showDelete = ref(false);
const localColumn = ref();
const { workspaceId} = useRouteIds();
const localList = ref<any>([]);

const { mutate: addList, isPending: addingList } = useCreateTeam({
  onSuccess: (data: any) => {
    localList.value = [...(localList.value || []), data];
    newColumn.value = '';
    activeAddList.value = false;
  },
});

const { data: Lists, isPending: isListPending } = usePeopleList(workspaceId.value, selected_view_id);
watch(Lists, (newVal) => {
  // deep-ish clone so we don't mutate vue-query cache objects
  localList.value = newVal ? JSON.parse(JSON.stringify(newVal)) : []
})
onMounted(() => {
  localList.value = Lists.value ? JSON.parse(JSON.stringify(Lists.value)) : []
})
const currentView = ref<'kanban' | 'list'>('kanban');
const selectedCard = ref<any>();
const selectCardHandler = (card: any) => {
  selectedCard.value = card;
};



const handleBoardUpdate = (_: any) => { };
const activeAddList = ref(false);
const newColumn = ref('');

function setActiveAddList() {
  activeAddList.value = !activeAddList.value;
}

function emitAddColumn() { 
  const t = newColumn.value.trim();
  if (!t) {
    toast.error('Column name is required.')
    return
  }
  handleAddColumn(t);
}

const handleAddColumn = (name: any) => {
  console.log('>>> clicking on adding pepople ');

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
  onSuccess: (data: any) => {
    newColumn.value = '';
    activeAddList.value = false;
    console.log(localColumn.value, '>>>. id local column');

    const idx = localList.value.findIndex((e: any) => e._id === localColumn.value._id)

    
    if (idx === -1) return
    console.log(idx , 'index>>>');

    const col = localList.value[idx]


    const nextCards = [...(col.cards ?? []), data?.assigned_seat]
    const nextCol = { ...col, cards: nextCards }

    // replace column (new identity) and array (new identity)
    localList.value = [
      ...localList.value.slice(0, idx),
      nextCol,
      ...localList.value.slice(idx + 1)
    ]
    queryClient.invalidateQueries({ queryKey: ['people-lists'] });
    queryClient.invalidateQueries({ queryKey: ['workspaceRoles'] });
    
  }
});
const handlePLus = (column: any) => {
  localColumn.value = column;
  const payload = {
    name: column?.email ? extractNameFromEmail(column?.email[0]) : '',
    email: column?.email ? column?.email[0] : '',
    role_id: column?._id,
    workspace_id: workspaceId?.value,
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
  if(!canInviteUser.value) return
  window.dispatchEvent(new CustomEvent('close-all-showADDNEW'));
  column.showADDNEW = !column.showADDNEW;
};

// Handle adding seat to the specific column (this will now trigger handlePLus)
const addSeatToColumn = (column: any) => {
  handlePLus(column); // Call handlePLus when adding a seat
};

const handleClickTicket = (ticket: any) => {
  selectedCard.value = ticket
}


const reorderList = ReOrderList()
const reorderCard = ReOrderCard();
function onReorder(a: any) {
  console.log(a , '>>');
  
    if (a.type == 'column')
        reorderList.mutate({
            id:workspaceId.value,
            payload: {
              "role_id": a.meta._id,

                new_sort_order: a.meta.newIndex
            }
        })
    else {
        reorderCard.mutate({
          id:a.meta.toColumnId,

            payload: {
              "team_member_id": a.meta.moved._id,
              "new_sort_order":  a.meta.newIndex
            
                // sheet_id: selected_sheet_id.value
            }
        })
    }
}

// reactive search query
const searchQuery = ref('')
const debouncedQuery = ref('')

watch(searchQuery, debounce((val:any) => { debouncedQuery.value = val }, 200))
// computed filtered board

const fuse = computed(() => {
  const allCards = localList.value.flatMap((col:any) => col.cards.map((card:any) => ({ ...card, columnId: col.title })))
  return new Fuse(allCards, { keys: ['title', 'name'], threshold: 0.3 })
})

const filteredBoard = computed(() => {
  if (!searchQuery.value) return localList.value
  const results = fuse.value.search(searchQuery.value).map((r :any)=> r.item)
  return localList.value.map((col:any) => ({
    ...col,
    cards: results.filter((c:any) => c.columnId === col.title)
  })).filter((col: any) => col.cards.length > 0)
})

</script>


<style>
  
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

/* Firefox support */
  .custom_scroll_bar {
  scrollbar-width: thin;
   scrollbar-color: rgba(150, 150, 150, 0.5) transparent !important;
}
</style>