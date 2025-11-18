<template>
    <div class="flex gap-2 flex-auto overflow-y-auto">
      
        <div
            class="flex-auto  bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur
             rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] flex-grow h-full bg-bg-card  border border-border  overflow-x-auto  flex  ">

            <KanbanSkeleton v-show="isPending" />
            <div v-show="!isPending" class="flex  overflow-x-auto gap-3 p-4">
                <KanbanBoard @onPlus="plusHandler" @delete:column="(e: any) => deleteHandler(e)"
                    @update:column="(e: any) => handleUpdateColumn(e)" @reorder="onReorder" @addColumn="handleAddColumn"
                    @select:ticket="selectCardHandler" :board="filteredBoard" @onBoardUpdate="handleBoardUpdate"
                    :variable_id="selected_view_by" :sheet_id="selected_sheet_id">
                    <template #column-footer="column">

                        <div class=" mx-auto text-text-secondary/80  m-2 w-[90%] h-full justify-center flex items-center  border border-dashed border-border"
                            v-if="workspaceStore?.transitions?.all_allowed && !workspaceStore?.transitions?.all_allowed?.includes(column.column.title) && workspaceStore.transitions.currentColumn != column.column.title">
                            Disbale ( you can't drop here )</div>
                    </template>
                    <template #ticket="{ ticket }">
                        <KanbanTicket :selectedVar="selected_view_by" @select="() => {

                            selectCardHandler(ticket)

                        }" :ticket="ticket" />
                    </template>
                </KanbanBoard>
                <!-- <div class="min-w-[328px] " @click.stop>
                <div v-if="activeAddList" class="bg-bg-body  rounded-lg p-4">
                    <BaseTextField :autofocus="true" v-model="newColumn" placeholder="Add New list"
                        @keyup.enter="emitAddColumn" />
                    <p class="text-xs mt-1.5">You can add details while editing</p>
                    <div class="flex items-center mt-3 gap-3">
                        <Button @click="emitAddColumn" varaint="primary"
                            class="px-3 py-1 bg-accent cursor-pointer text-white rounded">{{ addingList ?
                                'Adding...' :
                                'Add list' }}</Button>
                        <i class="fa-solid fa-close" @click="setActiveAddList"></i>
                    </div>
                </div>
                <button v-else
                    class="text-sm text-text-primary   py-2.5 cursor-pointer font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
                    @click.stop="setActiveAddList">
                    + Add List
                </button>
            </div> -->
            </div>

        </div>
        <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete List" itemLabel="list"
            :itemName="localColumnData?.title" :requireMatchText="localColumnData?.title" confirmText="Delete workspace"
            cancelText="Cancel" size="md" :loading="addingList" @confirm="handleDeleteColumn" @cancel="() => {
                showDelete = false
            }" />
        <CreateTaskModal :selectedVariable="selected_view_by" :listId="localColumnData?.title"
            :sheet_id="selected_sheet_id" v-if="createTeamModal" key="createTaskModalKey" v-model="createTeamModal"
            @submit="" />
        <SidePanel v-if="selectedCard?._id" :details="selectedCard"
            @close="() => { selectCardHandler({ variables: {} }) }" :showPanel="selectedCard?._id ? true : false" />
    </div>
    <!-- <CreateSheetModal v-model="isCreateSheetModal" /> -->
    <!-- <CreateVariableModal v-model="isCreateVar" v-if="isCreateVar" :sheetID="selected_sheet_id" /> -->
</template>
<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { useWorkspaceStore } from '../../../stores/workspace';
// import Dropdown from '../../../components/ui/Dropdown.vue';
// import Searchbar from '../../../components/ui/SearchBar.vue';
import { ReOrderCard, ReOrderList, useAddList, useSheets, useVariables } from '../../../queries/useSheets';
import { useRoute } from 'vue-router';
import KanbanSkeleton from '../../../components/skeletons/KanbanSkeleton.vue';
// import BaseTextField from '../../../components/ui/BaseTextField.vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRouteIds } from '../../../composables/useQueryParams';
// import Button from '../../../components/ui/Button.vue';
import { useSprintKanban } from '../../../queries/usePlan';
import KanbanTicket from '../../../components/feature/kanban/KanbanTicket.vue';
import Fuse from 'fuse.js';
import { debounce } from 'lodash';
// import SearchBar from '../../../components/ui/SearchBar.vue';

const props = defineProps<{ sptint_id: any ,searchQuery:string}>()
const CreateTaskModal = defineAsyncComponent(() => import('../../Product/modals/CreateTaskModal.vue'))
// const CreateSheetModal = defineAsyncComponent(() => import('../../Product/modals/CreateSheetModal.vue'))
// const CreateVariableModal = defineAsyncComponent(() => import('../../Product/modals/CreateVariableModal.vue'))
const ConfirmDeleteModal = defineAsyncComponent(() => import('../../Product/modals/ConfirmDeleteModal.vue'))
const SidePanel = defineAsyncComponent(() => import('../../Product/components/SidePanel.vue'))
const KanbanBoard = defineAsyncComponent(() => import('../../../components/feature/kanban/KanbanBoard.vue'));
// const isCreateVar = ref(false)
const route = useRoute();
const { workspaceId, moduleId } = useRouteIds()
const { data: variables } = useVariables(workspaceId.value, moduleId.value);
const queryClient = useQueryClient()
const { mutate: addList, isPending: addingList } = useAddList({
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
        newColumn.value = ''
        showDelete.value = false;
        activeAddList.value = false
        showDelete.value = false
    }
})
const handleAddColumn = (v: any) => {
    addList({
        "workspace_id": workspaceId.value,
        "module_id": moduleId.value,
        "variable_id": selected_view_by.value,
        "value": v
    })
}

// Fetch sheets using `useSheets`
const { data } = useSheets({
    workspace_id: workspaceId,
    workspace_module_id: moduleId
});
const sheetId = computed(() => data.value ? data.value[0]?._id : '')
const selected_sheet_id = ref<any>(sheetId);
const viewBy = computed(() => variables.value ? variables.value[0]?._id : '')
const selected_view_by = ref(viewBy);
const workspaceStore = useWorkspaceStore();
const selected_sprint_id = computed(() => props.sptint_id)
// usage
const { data: Lists, isPending, } = useSprintKanban(
    selected_sprint_id,                      // ref
    // ref
)

const createTeamModal = ref(false);
const selectedCard = ref<any>()
const selectCardHandler = (card: any) => {
    selectedCard.value = card
}
// const isCreateSheetModal = ref(false)
// const createSheet = () => {
//     isCreateSheetModal.value = !isCreateSheetModal.value
// }

const reorderList = ReOrderList()
const reorderCard = ReOrderCard();
function onReorder(a: any) {
    if (a.type == 'column')
        reorderList.mutate({
            payload: {
                workspace_id: workspaceId.value,
                workspace_module_id: moduleId.value,
                variable_id: selected_view_by.value,
                moved_value: a.meta.id,
                new_index: a.meta.newIndex
            }
        })
    else {
        reorderCard.mutate({
            payload: {
                workspace_id: workspaceId.value,
                card_id: a.meta.moved._id,
                group_value: a.meta.fromColumnId,
                group_variable_id: selected_view_by.value,
                new_index: a.meta.newIndex,
                sheet_id: selected_sheet_id.value
            }
        })
    }
}
const handleBoardUpdate = (_: any) => {

};

// interface IconData {
//     prefix: string;
//     iconName: string;
// }
// interface DropdownOption {
//     _id: string;
//     title: string;
//     icon: IconData
// }
// Define the `transformedData` computed property
// const transformedData = computed<DropdownOption[]>(() => {
//     return (data.value || []).map((item: any) => ({
//         _id: item._id,
//         title: item.variables["sheet-title"],
//         description: item.variables["sheet-description"],
//         icon: item["icon"]
//     }));
// });
watch(data, (newSheetId) => {
    if (newSheetId?.length > 0) {
        selected_sheet_id.value = newSheetId[0]?._id; // Trigger the refetch with the new sheet_id
    }
});
// add column 
const activeAddList = ref(false)
const newColumn = ref('')
// function setActiveAddList() { activeAddList.value = !activeAddList.value }
// function emitAddColumn() {
//     const t = newColumn.value.trim()
//     if (!t) return
//     handleAddColumn(t)
// }

const handleUpdateColumn = (newTitle: any) => {
    addList({
        workspace_id: route.params.id,
        module_id: route.params.module_id,
        new_value: newTitle.title,
        value: newTitle.oldTitle,
        variable_id: selected_view_by.value,
    })
}
const showDelete = ref(false);
const localColumnData = ref();
const handleDeleteColumn = () => {
    addList({
        value: localColumnData.value.title,
        workspace_id: workspaceId.value,
        module_id: moduleId.value,
        newValue: localColumnData.value.title,
        variable_id: selected_view_by.value,
        is_trash: true
    })
}
const deleteHandler = (e: any) => {
    showDelete.value = true;
    localColumnData.value = e;
}
const plusHandler = (e: any) => {
    createTeamModal.value = true;
    localColumnData.value = e
}
const searchQuery = computed(()=>props.searchQuery)
const debouncedQuery = ref('')
watch(searchQuery, debounce((val: string) => { debouncedQuery.value = val }, 200))
const fuse = computed(() => {
  const allCards = Lists.value.flatMap((col: any) =>
    col.cards.map((card: any) => ({ ...card, columnId: col.title }))
  )
  return new Fuse(allCards, { keys: ['card-title', 'card-description', 'card-key'], threshold: 0.3 })
})
const filteredBoard = computed(() => {
  if (!searchQuery.value) return Lists.value
  const results = fuse.value.search(searchQuery.value).map(r => r.item)
  return Lists.value.map((col: any) => ({
    ...col,
    cards: results.filter((c: any) => c.columnId === col.title)
  }))
})

</script>
