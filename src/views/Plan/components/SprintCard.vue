<template>
    <div class="rounded-lg flex flex-col">
        <div class="h-[300px]" :class="dropOverSprint ? 'ring-2 ring-blue-400 rounded-lg' : ''"
            @dragover.prevent @dragenter="onDragEnterSprint" @dragleave="onDragLeaveSprint"
            @drop="onDropSprint">
            <Table v-if="sprintTickets.length > 0" :row-draggable="true" class="h-full"
                @row-dragstart="({ row, $event }: any) => onDragStart($event, row, 'sprint', sprint.id)"
                @row-dragend="({ $event }: any) => onDragEnd($event)" :columns="columns" :rows="sprintTickets" :page-size="100" :hover="true"
                striped :item-key="(row: any) => row.id" @row-click="({ row }: any) => $emit('open-ticket', row)">
                <template #select-header>
                    <input type="checkbox" :checked="allSprintChecked(sprint.id)"
                        @change="toggleAll('sprint', $event, sprint.id)" />
                </template>

                <template #select="{ row }">
                    <input type="checkbox" :checked="(selectedSprintIds[sprint.id] || []).includes((row as any).id)"
                        @change="toggleOne('sprint', (row as any).id, $event, sprint.id)" />
                </template>

                <template #summary="{ row }">
                    <div class="flex items-center gap-2">
                        <span class="inline-block rounded-full border px-2 py-0.5 text-xs">{{ row.key }}</span>
                        <span class="truncate">{{ row.summary }}</span>
                    </div>
                </template>

                <template #priority="{ row }">
                    <span :class="priorityClass((row as any).priority)">{{ (row as any).priority }}</span>
                </template>

                <template #drag="{ row }">
                    <button class="cursor-grab" title="Drag to Backlog" draggable @click.stop
                        @dragstart="onDragStart($event, row as unknown as Ticket, 'sprint', sprint.id)" @dragend="onDragEnd">↕</button>
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
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import Table from '../../../components/ui/Table.vue'
import { useBacklogStore, priorityClass, type Sprint, type Ticket } from '../composables/useBacklogStore'
import { useMoveCard } from '../../../queries/usePlan'
import { toast } from 'vue-sonner'

const props = defineProps<{ sprint: Sprint }>()
const emit = defineEmits(['edit-sprint', 'toggle-start', 'open-ticket', 'move-selected-to-backlog', 'delete-selected-sprint', 'refresh'])

const store = useBacklogStore()
const { selectedSprintIds, allSprintChecked, toggleAll, toggleOne } = store

const sprintTickets = ref<Ticket[]>([])

watch(() => props.sprint.tickets, (tickets) => {
  sprintTickets.value = [...(tickets || [])]
}, { immediate: true, deep: true })

const dropOverSprint = ref(false)
const draggedTicketId = ref<string | null>(null)

const { mutate: moveCardApi } = useMoveCard({
  onSuccess: () => {
    toast.success('Card moved to sprint successfully')
    emit('refresh')
  },
  onError: (error: any) => {
    toast.error('Failed to move card: ' + (error.message || 'Unknown error'))
  }
})

function onDragStart(e: DragEvent, ticket: Ticket, from: 'backlog' | 'sprint', sprintId?: string) {
  draggedTicketId.value = ticket.id
  const payload = JSON.stringify({ id: ticket.id, from, sprintId, ticket })
  e.dataTransfer?.setData('text/plain', payload)
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onDragEnd(e: DragEvent) {
  dropOverSprint.value = false

  // Check if drop was successful on backlog
  if (e.dataTransfer?.dropEffect !== 'none' && draggedTicketId.value) {
    // Remove from sprint after successful drop on backlog
    sprintTickets.value = sprintTickets.value.filter(
      t => t.id !== draggedTicketId.value
    )
  }
  draggedTicketId.value = null
}

function onDragEnterSprint() {
  dropOverSprint.value = true
}

function onDragLeaveSprint() {
  dropOverSprint.value = false
}

function onDropSprint(e: DragEvent) {
  e.preventDefault()
  dropOverSprint.value = false

  try {
    const raw = e.dataTransfer?.getData('text/plain')
    if (!raw) return

    const data = JSON.parse(raw) as { id: string; from: 'backlog' | 'sprint'; sprintId?: string; ticket: Ticket }

    // Only accept drops from backlog
    if (data.from !== 'backlog') return

    const isDuplicate = sprintTickets.value.some(t => t.id === data.id)
    if (isDuplicate) return

    // Add to sprint (optimistic update)
    sprintTickets.value.push(data.ticket)

    // Call API
    moveCardApi({
      id: props.sprint.id,
      payload: {
        card_ids: [data.ticket.id],
        priority: data.ticket.priority.toLowerCase(),
        story_points: data.ticket.storyPoints || 0
      }
    })
  } catch (error) {
    console.error('Drop error:', error)
  }
}

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
