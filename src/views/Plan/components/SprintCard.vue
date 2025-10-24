<template>
    <!-- <button class="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                    :class="sprint.started ? 'bg-gray-700 hover:opacity-90' : 'bg-blue-600 hover:bg-blue-700'"
                    @click="$emit('toggle-start')">
                    {{ sprint.started ? 'Complete Sprint' : 'Start Sprint' }}
                </button> -->
    <div class="rounded-lg flex flex-col    ">

        <!-- <header class="flex flex-wrap items-center justify-between gap-2 ">
            <div class="flex min-w-0 items-center gap-3"> -->

        <!-- <span v-if="sprint.started" class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">In
                    Progress</span> -->
        <!-- <span v-else class="rounded-full bg-bg-surface px-2 py-0.5 text-xs text-text-secondary">Planned</span> -->
        <!-- </div> -->
        <!-- <div class="flex items-center gap-2">
                <button class="rounded-md border px-2.5 py-1.5 text-xs hover:bg-bg-surface"
                    @click="$emit('edit-sprint')">Edit</button>
              
            </div> -->
        <!-- </header> -->

        <!-- <div class="px-2 py-2">
            <div class="flex items-center justify-between px-2 pb-2">
                <div class="text-sm text-text-secondary">
                    {{ sprint.tickets.length }} tickets · {{ sprintPoints(sprint) }} pts
                </div>
                <div class="flex items-center gap-2">
                    <button class="rounded-md border px-2.5 py-1.5 text-xs hover:bg-bg-surface disabled:opacity-40"
                        :disabled="!selectedSprintIds[sprint.id]?.length"
                        @click="$emit('move-selected-to-backlog', sprint.id)">
                        Move to Backlog
                    </button>
                    <button class="rounded-md border px-2.5 py-1.5 text-xs hover:bg-bg-surface disabled:opacity-40"
                        :disabled="!selectedSprintIds[sprint.id]?.length"
                        @click="$emit('delete-selected-sprint', sprint.id)">
                        Delete
                    </button>
                </div>
            </div> -->

        <div class="h-[300px]" :class="dropOverSprintId === sprint.id ? 'ring-2 ring-blue-400 rounded-lg' : ''"
            @dragover.prevent @dragenter="onDragEnterSprint(sprint.id)" @dragleave="onDragLeaveSprint(sprint.id)"
            @drop="onDropSprint($event, sprint)">
            <Table v-if="sprint.tickets.length > 0" :row-draggable="true" class="h-full"
                @row-dragstart="({ row, $event }) => onDragStart($event, row, 'sprint', sprint.id)"
                @row-dragend="onDragEnd" :columns="columns" :rows="sprint.tickets" :page-size="100" :hover="true"
                striped :item-key="(row: any) => row.id" @row-click="({ row }) => $emit('open-ticket', row)">
                <template #select-header>
                    <input type="checkbox" :checked="allSprintChecked(sprint.id)"
                        @change="toggleAll('sprint', $event, sprint.id)" />
                </template>

                <template #select="{ row }">
                    <input type="checkbox" :checked="(selectedSprintIds[sprint.id] || []).includes(row.id)"
                        @change="toggleOne('sprint', row.id, $event, sprint.id)" />
                </template>

                <template #summary="{ row }">
                    <div class="flex items-center gap-2">
                        <span class="inline-block rounded-full border px-2 py-0.5 text-xs">{{ row.key }}</span>
                        <span class="truncate">{{ row.summary }}</span>
                    </div>
                </template>

                <template #priority="{ row }">
                    <span :class="priorityClass(row.priority)">{{ row.priority }}</span>
                </template>

                <template #drag="{ row }">
                    <button class="cursor-grab" title="Drag to Backlog" draggable @click.stop
                        @dragstart="onDragStart($event, row, 'sprint', sprint.id)" @dragend="onDragEnd">↕</button>
                </template>
            </Table>
            <div v-else class="empty-state flex flex-col h-full justify-center items-center border-dashed border border-border">
                <img src="../../../assets/emptyStates/sprint-plan.svg" class="mb-4" alt="backlog-plan">
                <h6 class="text-sm text-text-primary font-semibold mb-1 text-center">Plan your sprint</h6>
                <p class="text-sm text-text-primary/90 mb-3 max-w-120 text-center">Drag work items from the <span class="font-bold"> Backlog
                    </span>
                    section or create new ones to plan the
                    work for this sprint. Select <span class="font-bold">Start sprint</span> when you're ready.</p>
            </div>

        </div>
        <!-- </div> -->
    </div>
</template>

<script setup lang="ts">
import Table from '../../../components/ui/Table.vue'
import { useBacklogStore, priorityClass, type Sprint } from '../composables/useBacklogStore'
import { useDragDrop } from '../composables/useDragDrop'

// Destructure so `sprint` is directly available in the template
const { sprint } = defineProps<{ sprint: Sprint }>()
defineEmits(['edit-sprint', 'toggle-start', 'open-ticket', 'move-selected-to-backlog', 'delete-selected-sprint'])

// Get the store once
const store = useBacklogStore()
const { selectedSprintIds, allSprintChecked, toggleAll, toggleOne, sprintPoints } = store

// Pass store state into drag/drop composable once (no dynamic imports)
const { dropOverSprintId, onDropSprint, onDragStart, onDragEnd, onDragEnterSprint, onDragLeaveSprint } =
    useDragDrop(store.backlog, store.sprints, store.selectedBacklogIds, selectedSprintIds)

const columns = [
    { key: 'drag', label: '', width: 36 },
    { key: 'select', label: '', width: 36 },
    { key: 'summary', label: 'Summary', sortable: true },
    { key: 'type', label: 'Type', width: 80, sortable: true },
    { key: 'priority', label: 'Priority', width: 100, sortable: true },
    { key: 'assignee', label: 'Assignee', width: 120, sortable: true },
    { key: 'storyPoints', label: 'SP', width: 60, sortable: true, align: 'right' as const },
    { key: 'status', label: 'Status', width: 120, sortable: true },
    { key: 'createdAt', label: 'Created', width: 140, sortable: true },
]
</script>