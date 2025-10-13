<template>
    <div class="bg-white flex-grow overflow-hidden relative">
        <!-- Selection Toolbar -->
        <div v-if="selectedIds.length" class="flex items-center justify-between px-4 py-2 bg-white sticky top-0 z-10">
            <div class="text-sm font-medium">
                {{ selectedIds.length }} selected
            </div>
            <div class="flex items-center gap-4">
                <button @click="downloadSelected"
                    class="text-text-secondary  hover:text-text-primary text-sm flex gap-1 cursor-pointer">
                    <img src="../../assets/icons/arrow-down.svg" alt="">
                    Download
                </button>
                <button @click="selectedIds = []" class="text-text-secondary  hover:text-text-primary text-sm cursor-pointer">
                    Clear
                </button>
            </div>
        </div>

        <div class="overflow-x-auto max-h-full overflow-y-auto relative">
            <table class="w-full text-sm">
                <thead
                    class="text-left border-b border-t border-border-gray text-text-secondary -500 bg-[#FAFAFA] sticky top-0 z-1">
                    <tr>
                        <th v-if="!noSelection" class="px-5 py-3">
                            <Checkbox :checked="isAllSelected" @change="toggleAll" name="checkbox-1" />
                        </th>
                        <th v-for="col in columns" :key="col.accessor" class="p-4 text-xs font-medium">
                            <div class="flex items-center gap-1">
                                {{ col.label }}
                                <img v-if="col.postfix" :src="col.postfix" alt="" />
                            </div>
                        </th>
                        <th class="p-4 w-8" />
                    </tr>
                </thead>
                <tbody>
                    <template v-for="(row) in paginatedData" :key="row.id">
                        <tr class="border-b border-border-gray hover:bg-gray transition-all duration-100 ease-linear cursor-pointer"
                            @mouseenter="hoveredRowId = row.id" @mouseleave="hoveredRowId = null"
                            @click="toggleExpandedRow(row.id);" :class="{ 'bg-gray': selectedIds.includes(row.id) }">
                            <td v-if="!noSelection" class="px-6 py-4 flex items-center gap-2 min-h-[72px]">
                                <template v-if="row.children && row.children.length">
                                    <svg @click.stop="toggleExpandedRow(row.id)" xmlns="http://www.w3.org/2000/svg"
                                        class="w-4 h-4 transition-transform duration-200 rotate-90"
                                        :class="{ 'rotate-270': expandedRowId === row.id }" fill="none"
                                        viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M9 5l7 7-7 7" />
                                    </svg>
                                </template>
                                <Checkbox :checked="selectedIds.includes(row.id)" @change="toggleSelection(row.id)"
                                    name="checkbox-1" />
                            </td>
                            <td v-for="col in columns" :key="col.accessor" class="px-5 py-3 min-h-[72px]">
                                <!-- Full Row Edit -->
                                <template v-if="editingRowId === row.id">
                                    <input v-if="col.type === 'text'" v-model="editedRow[col.accessor]"
                                        class="border px-2 py-1 rounded w-full" />
                                    <BaseSelectField v-else-if="col.type === 'select' && col.options"
                                        :modelValue="editedRow[col.accessor]" :options="col.options" :isTable="true" />

                                    <input v-else-if="col.type === 'date'" type="date" v-model="editedRow[col.accessor]"
                                        class="border px-2 py-1 rounded w-full" />
                                    <span v-else>{{ editedRow[col.accessor] }}</span>
                                </template>
                                <!-- Inline Select Edit -->
                                <template v-else-if="col.type === 'select' && col.options">

                                    <BaseSelectField :modelValue="row[col.accessor]" :defaultValue="col.default"
                                        :options="col.options"
                                        @change="handleInlineSelectChange(row.id, col.accessor, row[col.accessor])"
                                        @blur="inlineEditingCell = null" :isTable="true" />

                                </template>
                                <template v-else>
                                    <component v-if="row[col.accessor]?.component" :is="row[col.accessor].component"
                                        v-bind="row[col.accessor].props" />
                                    <span v-else-if="row[col.accessor]?.template" v-html="row[col.accessor].template" />
                                    <span v-else>
                                        {{ row[col.accessor] }}
                                    </span>
                                </template>
                            </td>
                            <td class="px-5 py-3 text-right min-h-[72px]">
                                <div v-if="selectedIds.includes(row.id) || hoveredRowId === row.id"
                                    class="flex gap-2 justify-end">
                                    <template v-if="editingRowId === row.id">
                                        <button @click.stop="saveEdit(row.id)"
                                            class="text-green-500 text-xs">Save</button>
                                        <button @click.stop="cancelEdit()" class="text-text-secondary -500 text-xs">Cancel</button>
                                    </template>
                                    <template v-else>
                                        <img src="../../assets/icons/share.svg" class="w-4 h-4 cursor-pointer"
                                            title="Share" />
                                        <img src="../../assets/icons/star.svg" class="w-4 h-4 cursor-pointer"
                                            title="Download" />
                                        <img src="../../assets/icons/edit.svg" class="w-4 h-4 cursor-pointer"
                                            title="Edit" @click.stop="startEdit(row)" />
                                        <img src="../../assets/icons/delete.svg" class="w-4 h-4 cursor-pointer"
                                            title="Favorite" />
                                    </template>
                                </div>
                            </td>
                        </tr>

                        <template v-if="expandedRowId === row.id && row.children">
                            <tr v-for="child in row.children" :key="child.id"
                                class="border-b border-border-gray min-h-[72px]">
                                <td v-if="!noSelection" class="px-6 py-4"></td>
                                <td v-for="col in columns" :key="col.accessor" class="px-5 py-3">
                                    <span v-if="child[col.accessor]?.template" v-html="child[col.accessor].template" />
                                    <component v-if="child[col.accessor]?.component" :is="child[col.accessor].component"
                                        v-bind="child[col.accessor].props" />
                                    <span v-if="!child[col.accessor]?.template && !child[col.accessor]?.component">{{
                                        child[col.accessor] }}</span>
                                </td>
                                <td class="px-5 py-3 text-right">
                                    <img src="../../assets/icons/fi_more-vertical.svg" class="w-4 h-4 cursor-pointer" />
                                </td>
                            </tr>
                        </template>
                    </template>
                </tbody>
            </table>
            <Pagination :currentPage="currentPage" :lastPage="totalPages" @update:page="currentPage = $event" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import Pagination from './Pagination.vue';
import Checkbox from './Checkbox.vue';
import BaseSelectField from './BaseSelectField.vue';

interface TableRow {
    id: string;
    children?: TableRow[];
    [key: string]: any;
}

interface TableColumn {
    label: string;
    accessor: string;
    postfix?: any;
    type?: 'text' | 'select' | 'date';
    default?: string,
    options?: { title: string; _id: string , icon?:string }[];
}

const props = defineProps<{
    tableData: TableRow[];
    columns: TableColumn[];
    noSelection?: boolean;
    onRowClick?: (row: TableRow) => void;
    perPage?: number;
}>();

const selectedIds = ref<string[]>([]);
const expandedRowId = ref<string | null>(null);
const hoveredRowId = ref<string | null>(null);
const currentPage = ref(1);
const perPage = props.perPage ?? 10;

const editingRowId = ref<string | null>(null);
const editedRow = ref<Record<string, any>>({});
const inlineEditingCell = ref<{ rowId: string; accessor: string } | null>(null);

function toggleSelection(id: string) {
    selectedIds.value.includes(id)
        ? (selectedIds.value = selectedIds.value.filter((x) => x !== id))
        : selectedIds.value.push(id);
}

function toggleAll() {
    if (selectedIds.value.length === props.tableData.length)
        selectedIds.value = [];
    else selectedIds.value = props.tableData.map((row) => row.id);
}

function toggleExpandedRow(id: string) {
    expandedRowId.value = expandedRowId.value === id ? null : id;
}

function downloadSelected() {
    alert(`Downloading ${selectedIds.value.length} item(s)...`);
}

function startEdit(row: TableRow) {
    editingRowId.value = row.id;
    editedRow.value = { ...row };
}

function cancelEdit() {
    editingRowId.value = null;
    editedRow.value = {};
}

function saveEdit(id: string) {
    const index = props.tableData.findIndex(r => r.id === id);
    if (index !== -1) {
        props.tableData[index] = { id: '33', ...editedRow.value };
    }
    cancelEdit();
}

function handleInlineSelectChange(rowId: string, accessor: string, newValue: any) {
    const row = props.tableData.find(r => r.id === rowId);
    if (row) {
        row[accessor] = newValue;
    }
    inlineEditingCell.value = null;
}

const isAllSelected = computed(() => selectedIds.value.length === props.tableData.length);
const paginatedData = computed(() => {
    const start = (currentPage.value - 1) * perPage;
    return props.tableData.slice(start, start + perPage);
});
const totalPages = computed(() => Math.ceil(props.tableData.length / perPage));
</script>


<style scoped>
.sub-row-transition-enter-active,
.sub-row-transition-leave-active {
    transition: all 0.3s ease;
}

.sub-row-transition-enter-from,
.sub-row-transition-leave-to {
    opacity: 0;
    transform: scaleY(0);
    height: 0;
}

.sub-row-transition-enter-to,
.sub-row-transition-leave-from {
    opacity: 1;
    transform: scaleY(1);
    height: auto;
}

.sub-row-expand-enter-active,
.sub-row-expand-leave-active {
    transition: max-height 0.3s ease, opacity 0.3s ease;
}

.sub-row-expand-enter-from,
.sub-row-expand-leave-to {
    max-height: 0;
    opacity: 0;
}

.sub-row-expand-enter-to,
.sub-row-expand-leave-from {
    max-height: 800px;
    /* enough to contain children */
    opacity: 1;
}
</style>
