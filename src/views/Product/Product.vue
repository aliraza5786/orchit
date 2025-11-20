<template>
    <div
        class="flex-auto  bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur
             rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] flex-grow h-full bg-bg-card  border border-border  overflow-x-auto flex-col flex  scrollbar-visible ">
        <div class="header px-4 py-3 border-b  border-border flex items-center justify-between gap-1">
            <Dropdown @edit-option="openEditSprintModal" v-model="selected_sheet_id"
                @delete-option="handleDeleteSheetModal" :options="transformedData" variant="secondary">
                <template #more>
                    <div @click="createSheet()"
                        class="capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap ">
                        <i class="fa-solid fa-plus"></i> Add new
                    </div>
                </template>
            </Dropdown>
            <div class="flex gap-3 items-center ">
                <Dropdown v-if="view=='kanban'" :actions="false" prefix="View by" v-model="selected_view_by" :options="variables"
                    variant="secondary">
                    <template #more>
                        <div @click="() => {

                            isCreateVar = true
                        }"
                            class=" sticky bottom-0 bg-bg-dropdown shadow-md shadow-border  capitalize border-t  border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover  cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap ">
                            <i class="fa-solid fa-plus"></i> Add new
                        </div>
                    </template>
                </Dropdown>
                <Searchbar @onChange="(e) => {
                    searchQuery = e
                }" placeholder="Search in Orchit AI space">
                </Searchbar>

                <div class="flex items-center gap-3 bg-bg-surface/50 h-[32px] px-2 rounded-md">
                <button class="aspect-square  cursor-pointer rounded-sm p-0 px-0.5"
                    :class="view === 'kanban' ? 'text-accent bg-accent-text' : ' hover:bg-border/50 backdrop-blur-2xl  transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                    title="List view" @click="view = 'kanban'">
                    <i class="fa-solid fa-chart-kanban"></i>
                </button>

                <button @click="view = 'table'" class="aspect-square  cursor-pointer rounded-sm p-0 px-0.5"
                    :class="view === 'table' ? 'text-accent bg-accent-text' : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
                    title="Gallery view">
                    <i class="fa-solid fa-align-left"></i>
                </button>
            </div>
            </div>

           
        </div>
        <template v-if="view == 'kanban'">
            <KanbanSkeleton v-show="isPending" />
            <div v-show="!isPending" class="flex  overflow-x-auto gap-3 p-4 scrollbar-visible">
                <KanbanBoard @onPlus="plusHandler" :board="filteredBoard" @delete:column="(e: any) => deleteHandler(e)"
                    @update:column="(e: any) => handleUpdateColumn(e)" @reorder="onReorder" @addColumn="handleAddColumn"
                    @select:ticket="selectCardHandler" @onBoardUpdate="handleBoardUpdate"
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
                <div class="min-w-[328px] " @click.stop>
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
                </div>
            </div>
        </template>
        <template v-if="view == 'table'">
            <TableView :columns="columns" :rows="normalizedTableData" @create="handleCreateTicket" />
        </template>
    </div>
    <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete List" itemLabel="list"
        :itemName="localColumnData?.title" :requireMatchText="localColumnData?.title" confirmText="Delete List"
        cancelText="Cancel" size="md" :loading="addingList" @confirm="handleDeleteColumn" @cancel="() => {
            showDelete = false
        }" />
    <CreateTaskModal :selectedVariable="selected_view_by" :listId="localColumnData?.title" :sheet_id="selected_sheet_id"
        v-if="createTeamModal" key="createTaskModalKey" v-model="createTeamModal" @submit="" />
    <SidePanel v-if="selectedCard?._id" :details="selectedCard" @close="() => { selectCardHandler({ variables: {} }) }"
        :showPanel="selectedCard?._id ? true : false" />
    <CreateSheetModal size="md" :sheet="selectedSheettoAction" v-model="isCreateSheetModal" />
    <CreateVariableModal v-model="isCreateVar" v-if="isCreateVar" :sheetID="selected_sheet_id" />
    <ConfirmDeleteModal @click.stop="" v-model="showDeleteModal" title="Delete Sheet" itemLabel="Sheet"
        :itemName="selectedSheettoAction?.title" :requireMatchText="selectedSheettoAction?.title"
        confirmText="Delete Sheet" cancelText="Cancel" size="md" :loading="isDeleting" @confirm="handleDeleteSheet"
        @cancel="() => { showDeleteModal = false }" />
</template>
<script setup lang="ts">
import { computed, defineAsyncComponent, h, ref, watch } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import Dropdown from '../../components/ui/Dropdown.vue';
import Searchbar from '../../components/ui/SearchBar.vue';
import { ReOrderCard, ReOrderList, useAddList, useAddTicket, useMoveCard, useSheetList, useSheets, useUpdateWorkspaceSheet, useVariables } from '../../queries/useSheets';
import { useRoute } from 'vue-router';
import KanbanSkeleton from '../../components/skeletons/KanbanSkeleton.vue';
import BaseTextField from '../../components/ui/BaseTextField.vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRouteIds } from '../../composables/useQueryParams';
import Button from '../../components/ui/Button.vue';
import KanbanTicket from '../../components/feature/kanban/KanbanTicket.vue';
import Fuse from 'fuse.js';
import { debounce } from 'lodash';
import TableView from '../../components/feature/TableView/TableView.vue';
// import { getStatusStyle } from '../../utilities/stausStyle';
import BaseSelectField from '../../components/ui/BaseSelectField.vue';
import { useProductVarsData } from '../../queries/useProductCard';
// import { Background } from '@vue-flow/background';
const view = ref('table')

const CreateTaskModal = defineAsyncComponent(() => import('./modals/CreateTaskModal.vue'))
const CreateSheetModal = defineAsyncComponent(() => import('./modals/CreateSheetModal.vue'))
const CreateVariableModal = defineAsyncComponent(() => import('./modals/CreateVariableModal.vue'))
const ConfirmDeleteModal = defineAsyncComponent(() => import('./modals/ConfirmDeleteModal.vue'))
const SidePanel = defineAsyncComponent(() => import('./components/SidePanel.vue'))
const KanbanBoard = defineAsyncComponent(() => import('../../components/feature/kanban/KanbanBoard.vue'));
const isCreateVar = ref(false)
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
const { data, refetch: refetchSheets } = useSheets({
    workspace_id: workspaceId,
    workspace_module_id: moduleId
});
const sheetId = computed(() => data.value ? data.value[0]?._id : '')
const selected_sheet_id = ref<any>(sheetId.value);
watch(sheetId, () => {
    selected_sheet_id.value = sheetId.value;
})

const viewBy = computed(() => variables?.value ? variables?.value[0]?._id : '')
const selected_view_by = ref(viewBy.value);
watch(viewBy, () => {
    selected_view_by.value = viewBy.value;
})
const workspaceStore = useWorkspaceStore();

// usage
const { data: Lists, isPending, } = useSheetList(
    moduleId,
    selected_sheet_id,                      // ref
    computed(() => [...workspaceStore.selectedLaneIds]), // clone so identity changes on mutation
    selected_view_by,                    // ref
)

const createTeamModal = ref(false);
const selectedCard = ref<any>()
const selectCardHandler = (card: any) => {
    selectedCard.value = card
}
const isCreateSheetModal = ref(false)
const createSheet = () => {
    selectedSheettoAction.value = {}
    isCreateSheetModal.value = !isCreateSheetModal.value
}

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

interface IconData {
    prefix: string;
    iconName: string;
}
interface DropdownOption {
    _id: string;
    title: string;
    icon: IconData
}
// Define the `transformedData` computed property
const transformedData = computed<DropdownOption[]>(() => {
    return (data.value || []).map((item: any) => ({
        _id: item._id,
        title: item?.variables["sheet-title"],
        description: item?.variables["sheet-description"],
        icon: item["icon"],
        status: item?.generation_status,
    }));
});
watch(data, (newSheetId) => {
    if (newSheetId?.length > 0) {
        selected_sheet_id.value = newSheetId[0]?._id; // Trigger the refetch with the new sheet_id
    }
});
// add column 
const activeAddList = ref(false)
const newColumn = ref('')
function setActiveAddList() { activeAddList.value = !activeAddList.value }
function emitAddColumn() {
    const t = newColumn.value.trim()
    if (!t) return
    handleAddColumn(t)
}

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
const showDeleteModal = ref(false)
const selectedSheettoAction = ref<any>()
function handleDeleteSheetModal(opt: any) {
    showDeleteModal.value = true
    selectedSheettoAction.value = opt;
}
const { mutate: updateSheet, isPending: isDeleting } = useUpdateWorkspaceSheet({
    onSuccess: () => {
        refetchSheets();
        showDeleteModal.value = false
    }
})
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

watch(searchQuery, debounce((val: any) => { debouncedQuery.value = val }, 200))
// computed filtered board

const fuse = computed(() => {
    const allCards = Lists.value.flatMap((col: any) => col.cards.map((card: any) => ({ ...card, columnId: col.title })))
    return new Fuse(allCards, { keys: ['card-title', 'card-description'], threshold: 0.3 })
})

const filteredBoard = computed(() => {
    if (!searchQuery.value) return Lists.value
    const results = fuse.value.search(searchQuery.value).map((r: any) => r.item)
    return Lists.value.map((col: any) => ({
        ...col,
        cards: results.filter((c: any) => c.columnId === col.title)
    }))
})
// import ticket from '../../assets/icons/ticket.svg'
const columns = [
    // {
    //     key: "card-code", label: '#', render: ({ value }: any) =>
    //         h('div', { class: ' capitalize flex items-center gap-2 ', }, [h('img', { src: ticket }), h('span', { class: 'text-sm text-text-primary capitalize' }), h('span', { class: 'text-sm text-text-primary capitalize' }, value)]),
    // },
    {
        key: "card-title", label: 'Title', render: ({ row, value }: any) =>
            h('input', {
                onFocusout: (e: any) => {
                    handleChangeTicket(row?._id, 'card-title', e?.target?.value)
                }, class: 'text-sm cursor-pointer text-text-primary capitalize outline-none border-none focus:border  active:bg-bg-surface focus:bg-bg-card backdrop-blur focus:border-accent p-1 rounded-md', defaultValue: value
            },),
    },
    {
        key: 'card-status', label: 'Status',
        render: ({ row, value }: any) => {
            const { data } = useProductVarsData(workspaceId, moduleId, 'card-status')
            const status = ref(value)

            return h('div', { class: ' capitalize flex items-center gap-2 ' }, [

                h(BaseSelectField, {
                    options: getOptions(data.value?.values ?? []) || [], size: 'sm', modelValue: status.value, defaultValue: status.value,
                    "onUpdate": (val: any) => {

                        handleChangeTicket(row?._id, 'card-status', val)
                        // row["card-status"] = val; // write back to row
                    },
                })
            ])
        }
    },
    {
        key: 'card-type', label: 'Type',
        render: ({ row, value }: any) => {
            const { data } = useProductVarsData(workspaceId, moduleId, 'card-type')
            const type = ref(value)
            return h('div', { class: ' capitalize flex items-center gap-2 ' }, [

                h(BaseSelectField, {
                    options: getOptions(data.value?.values ?? []) || [], size: 'sm', modelValue: type.value, defaultValue: type.value, "onUpdate": (val: any) => {

                        handleChangeTicket(row?._id, 'card-type', val)
                        // row["card-status"] = val; // write back to row
                    },
                })
            ])
        }
    },
    {
        key: 'end-date', label: 'Due Date',
        render: ({ value }: any) => h('div', { class: ' capitalize flex items-center gap-2 ' }, [
            h('span', value)
        ])
    },
    {
        key: 'lane', label: 'Lane',
        render: ({ value }: any) => h('div', { class: 'capitalize flex items-center gap-2 ' }, [
            h('div', { class: `w-3 h-3 rounded-full  `, style: `background:${value?.variables ? value?.variables['lane-color'] : ''}` }, ''), h('span', value?.variables ? value?.variables['lane-title'] : '')
        ])
    }
]
const normalizedTableData = computed(() => {
    let array: any = [];
    (Lists.value ?? []).forEach((col: any) => { array = [...array, ...col?.cards] })
    return array

})

const getOptions = (options: any) => {
    // console.log(options, 'options');

    return options.map((el: any) => ({ _id: el.value, title: el.value }))
}
const moveCard = useMoveCard({
    onSuccess: () => {
        // queryClient.invalidateQueries({ queryKey: ['get-sheets'] })
        // queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
        // queryClient.invalidateQueries({ queryKey: ['roles'] })
    }
})
function handleChangeTicket(id: any, key: any, value: any) {
    moveCard.mutate({ card_id: id, variables: { [key]: value.trim() } })
}
const { mutate: addTicket, } = useAddTicket({
    onSuccess: () => {
        // queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
    }
})
function handleCreateTicket(title: any) {
    console.log(title, 'titele');

    const payload = {
        sheet_list_id: 'To Do',
        workspace_id: workspaceId.value,
        sheet_id: selected_sheet_id.value,
        // workspace_lane_id: form.lane_id,
        variables: {
            ['card-title']: title['card-title'].trim(),

        },
        createdAt: new Date().toISOString()
    }
    addTicket(payload)

}
</script>
<style scoped>
/* Force visible scrollbars only where applied */
.scrollbar-visible::-webkit-scrollbar {
    display: block !important;
    height: 8px;
    /* horizontal scrollbar height */
    width: 8px;
    /* vertical scrollbar width */
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
    /* Firefox */
    scrollbar-color: rgba(150, 150, 150, 0.5) transparent !important;
}
</style>