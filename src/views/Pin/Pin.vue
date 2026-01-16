<template>
    <div class="flex-auto flex-grow h-full bg-bg-card rounded-[6px] border border-border overflow-x-auto flex-col flex">

        <!-- Header -->
        <div class="header px-4 py-3 border-b border-border flex items-center justify-between gap-1">
            <Dropdown   v-model="selected_sheet_id" :options="transformedData"
                variant="secondary" v-bind="dropdownListeners"  :canEdit="canEditSheet" :canDelete="canDeleteSheet" >
                <template #more>
                    <div @click="toggleCreateSheet" v-if="canCreateSheet"
                        class="capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap">
                        <i class="fa-solid fa-plus"></i> Add new
                    </div>
                </template>
            </Dropdown>

            <SearchBar class="max-w-[250px]" @onChange="(e) => {
                    searchQuery = e
                }" placeholder="Search in Orchit AI space">
                </SearchBar>
        </div>

        <!-- Kanban Skeleton -->
        <KanbanSkeleton v-show="isListPending" />

        <!-- Kanban Board -->
        <div v-show="!isListPending" class="flex overflow-x-auto gap-3 p-4">
            <KanbanBoard @onPlus="plusHandler" @delete:column="deleteHandler" @update:column="handleUpdateColumn"
                @reorder="onReorder" @addColumn="handleAddColumn" @select:ticket="selectCardHandler"
                @onBoardUpdate="handleBoardUpdate" :board="filteredBoard" :variable_id="selected_view_by"
                :sheet_id="selected_sheet_id">
                <template #ticket="{ ticket }">
                    <KanbanCard @click="handleClickTicket(ticket)" :ticket="ticket" />
                </template>

                <template #emptyState="{ column }">
                    <div class="flex flex-col items-center justify-center gap-2 py-10">
                        <img src="../../assets/emptyStates/pin.png" alt="" />
                        <h1 class="text-sm text-text-primary mt-2">Start creating your pins</h1>
                        <p class="text-sm text-text-secondary mb-2 text-center">
                            Create pins and add your ideas into the related pins.
                        </p>
                        <Button :disabled="!canCreateVariable" size="sm" @click="plusHandler(column)">Create Pin</Button>
                    </div>
                </template>
            </KanbanBoard>

            <!-- Add List Section -->
            <div class="min-w-[328px]" @click.stop>
                <div v-if="activeAddList" class="bg-bg-body rounded-lg p-4">
                    <BaseTextField :autofocus="true" v-model="newColumn" placeholder="Add New list"
                        @keyup.enter="emitAddColumn" />
                    <p class="text-xs mt-1.5">You can add details while editing</p>
                    <div class="flex items-center mt-3 gap-3">
                        <Button @click="emitAddColumn" variant="primary"
                            class="px-3 py-1 bg-accent cursor-pointer text-white rounded">
                            {{ addingList ? 'Adding...' : 'Add list' }}
                        </Button>
                        <i class="fa-solid fa-close" @click="toggleAddList"></i>
                    </div>
                </div>
                <button v-else
                    class="text-sm text-text-primary py-2.5 font-medium flex items-center justify-center w-full gap-2 bg-bg-body rounded-lg"
                    :class="!canCreateVariable ? 'cursor-not-allowed': 'cursor-pointer'"
                    @click.stop="toggleAddList" :disabled="!canCreateVariable">
                    + Add List
                </button>
            </div>
        </div>

        <!-- Modals -->
        <ConfirmDeleteModal v-model="showDelete" title="Delete List" itemLabel="list" :itemName="localColumnData?.title"
            :requireMatchText="localColumnData?.title" confirmText="Delete List" cancelText="Cancel" size="md"
            :loading="addingList" @confirm="handleDeleteColumn" @cancel="() => (showDelete = false)" />

        <CreateTaskModal size="md" :pin="true" :selectedVariable="selected_view_by" :listId="localColumnData?.title"
            :sheet_id="selected_sheet_id" v-if="createTeamModal" key="createTaskModalKey" v-model="createTeamModal" />



        <CreateSheetModal :sheet="selectedSheettoAction" size="md" v-model="isCreateSheetModal" />
        <CreateVariableModal v-if="isCreateVar" v-model="isCreateVar" :sheetID="selected_sheet_id" />
        <ConfirmDeleteModal @click.stop="" v-model="showDeleteModal" title="Delete Sheet" itemLabel="Sheet"
            :itemName="selectedSheettoAction?.title" :requireMatchText="selectedSheettoAction?.title"
            confirmText="Delete Sheet" cancelText="Cancel" size="md" :loading="isDeleting" @confirm="handleDeleteSheet"
            @cancel="() => { showDeleteModal = false }" />
    </div>
    <SidePanel  v-if="selectedCard?._id" :pin="true" :details="selectedCard" :showPanel="!!selectedCard?._id"
        @close="() => selectCardHandler({ variables: {} })" />
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { useWorkspaceStore } from '../../stores/workspace';
import {
    useAddList,
    useSheetList,
    useSheets,
    useVariables,
    ReOrderList,
    ReOrderCard,
    useUpdateWorkspaceSheet
} from '../../queries/useSheets';
import { useRouteIds } from '../../composables/useQueryParams';

// Components
import Dropdown from '../../components/ui/Dropdown.vue';
import BaseTextField from '../../components/ui/BaseTextField.vue';
import Button from '../../components/ui/Button.vue';
import KanbanCard from './components/KanbanCard.vue';
import KanbanSkeleton from '../../components/skeletons/KanbanSkeleton.vue';
import CreateTaskModal from '../Product/modals/CreateTaskModal.vue';
import SidePanel from '../Product/components/SidePanel.vue';
import CreateSheetModal from '../Product/modals/CreateSheetModal.vue';
import Fuse from 'fuse.js';
import { debounce } from 'lodash';
import SearchBar from '../../components/ui/SearchBar.vue';
const ConfirmDeleteModal = defineAsyncComponent(() => import('../Product/modals/ConfirmDeleteModal.vue'));
const CreateVariableModal = defineAsyncComponent(() => import('../Product/modals/CreateVariableModal.vue'));
const KanbanBoard = defineAsyncComponent(() => import('../../components/feature/kanban/KanbanBoard.vue'));

import { usePermissions } from '../../composables/usePermissions'
const {  canEditSheet, canDeleteSheet, canCreateVariable, canCreateSheet } = usePermissions()

// State
const isCreateVar = ref(false);
const isCreateSheetModal = ref(false);
const createTeamModal = ref(false);
const showDelete = ref(false);
const localColumnData = ref<any>();
const activeAddList = ref(false);
const newColumn = ref('');
const selectedCard = ref<{ _id: any; variables: any }>();
const localList = ref<any>([]);

// Routing & Stores
const route = useRoute();
const { workspaceId, moduleId } = useRouteIds();
const workspaceStore = useWorkspaceStore();
const queryClient = useQueryClient();

// Variables & Sheets
// Sheets Data
const { data, refetch: refetchSheets } = useSheets(
    { workspace_id: workspaceId, workspace_module_id: moduleId },
    { onSuccess: () => refetchList() }
);

const selected_sheet_id = ref<any>(data.value?.[0]?._id ?? null);
const { data: variables } = useVariables(workspaceId, moduleId, selected_sheet_id);
const viewBy = computed(() => variables.value?.[0]?._id ?? '');
const selected_view_by = ref(viewBy.value);
watch(viewBy, (val) => (selected_view_by.value = val));


watch(data, (sheets) => {
    if (sheets?.length) selected_sheet_id.value = sheets[0]._id;
});

// Lists
const { data: Lists, isPending: isListPending, refetch: refetchList } = useSheetList(
    moduleId,
    selected_sheet_id,
    computed(() => [...workspaceStore.selectedLaneIds]),
    selected_view_by
);

watch(Lists, () => (localList.value = JSON.parse(JSON.stringify(Lists.value || []))
));
onMounted(() => (localList.value = JSON.parse(JSON.stringify(Lists.value || []))));

// Add List Logic
const { mutate: addList, isPending: addingList } = useAddList({
    onSuccess: (data: any, payload: any) => {
        if (payload.is_trash) {
            localList.value = localList.value.filter((e: any) => e.title !== payload.value);
            showDelete.value = false
        } else {
            localList.value= [...localList.value, { title: data?.value }];
        }
        activeAddList.value = false;

        newColumn.value = '';
        queryClient.invalidateQueries({ queryKey: ['sheet-list'] });
        Object.assign({ newColumn: '', showDelete: false, activeAddList: false });
    }
});

function handleAddColumn(value: string) {
    addList({
        workspace_id: workspaceId.value,
        module_id: moduleId.value,
        variable_id: selected_view_by.value,
        value
    });
}
const dropdownListeners = computed(() => {
  const listeners: Record<string, Function> = {}

  if (canEditSheet.value) listeners['onEdit-option'] = openEditSprintModal
  if (canDeleteSheet.value) listeners['onDelete-option'] = handleDeleteSheetModal

  return listeners
})

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
        variable_id: selected_view_by.value
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
        is_trash: true
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
    if (type === 'column') {
        reorderList.mutate({
            payload: {
                workspace_id: workspaceId.value,
                workspace_module_id: moduleId.value,
                variable_id: selected_view_by.value,
                moved_value: meta.id,
                new_index: meta.newIndex
            }
        });
    } else {
        reorderCard.mutate({
            payload: {
                workspace_id: workspaceId.value,
                card_id: meta.moved._id,
                group_value: meta.fromColumnId,
                group_variable_id: selected_view_by.value,
                new_index: meta.newIndex,
                sheet_id: selected_sheet_id.value
            }
        });
    }
}

function handleBoardUpdate(_: any) { }

function selectCardHandler(card: any) {
    selectedCard.value = card;
}

function handleClickTicket(ticket: any) {
    selectedCard.value = ticket;
}

function plusHandler(e: any) {
    createTeamModal.value = true;
    localColumnData.value = e;
}

function toggleCreateSheet() {
    selectedSheettoAction.value = {};
    isCreateSheetModal.value = !isCreateSheetModal.value;
}

function toggleAddList() {
    activeAddList.value = !activeAddList.value;
}

// Dropdown Transformation
const transformedData = computed(() =>
    (data.value || []).map((item: any) => ({
        _id: item._id,
        title: item.variables['sheet-title'],
        description: item.variables['sheet-description'],
        icon: item.icon

    }))
);

const showDeleteModal = ref(false)
const selectedSheettoAction = ref<any>()
const { mutate: updateSheet, isPending: isDeleting } = useUpdateWorkspaceSheet({
    onSuccess: () => {
        console.log('>>. clicong');
        
        showDeleteModal.value = false
        refetchSheets();
        
    }
})
function handleDeleteSheetModal(opt: any) {
    
    showDeleteModal.value = true
    selectedSheettoAction.value = opt;
}
function handleDeleteSheet() {
    updateSheet({
        sheet_id: selectedSheettoAction.value?._id,
        workspace_module_id: moduleId.value,
        is_trash: true,
    })
}
function openEditSprintModal(opt: any) {
    isCreateSheetModal.value = true;
    selectedSheettoAction.value = opt;
}

// reactive search query
const searchQuery = ref('')
const debouncedQuery = ref('')

watch(searchQuery, debounce((val:any) => { debouncedQuery.value = val }, 200))
// computed filtered board

const fuse = computed(() => {
  const allCards = localList.value.flatMap((col:any) => col.cards.map((card:any) => ({ ...card, columnId: col.title })))
  return new Fuse(allCards, { keys: ['card-title', 'card-description'], threshold: 0.3 })
})

const filteredBoard = computed(() => {
  if (!searchQuery.value) return localList.value
  const results = fuse.value.search(searchQuery.value).map((r :any)=> r.item)
  return localList.value.map((col:any) => ({
    ...col,
    cards: results.filter((c:any) => c.columnId === col.title)
  }))
})

</script>
