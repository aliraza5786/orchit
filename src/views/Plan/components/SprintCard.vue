<template>
  <div class="rounded-lg flex flex-col">
    <!-- Search Input -->
    <div class="mb-2">
      <SearchBar type="text"  @onChange="(e) => searchQuery = e" placeholder="Search tickets..."
        class="w-[250px]" />
    </div>

    <!-- Sprint Table -->
    <div
      class="h-[300px]"
      :class="dropOverSprint ? 'ring-2 ring-blue-400 rounded-lg' : ''"
      @dragover.prevent
      @dragenter="onDragEnterSprint"
      @dragleave="onDragLeaveSprint"
      @drop="onDropSprint"
    >
      <Table
        v-if="filteredTickets.length > 0"
        :showHeader="false"
        :pagination="false"
        :row-draggable="true"
        class="h-full"
        :columns="columns"
        :rows="filteredTickets"
        :page-size="100"
        :hover="true"
        :item-key="(row:any) => row.id"
        @row-dragstart="({ row, $event }) => onDragStart($event, row, 'sprint', sprint.id)"
        @row-dragend="({ $event }) => onDragEnd($event)"
        @row-click="({ row }) => $emit('open-ticket', row)"
      >
        <template #select-header>
          <input
            type="checkbox"
            :checked="allSprintChecked(sprint.id)"
            @change="toggleAll('sprint', $event, sprint.id)"
          />
        </template>

        <template #select="{ row }:any">
          <input
            type="checkbox"
            :checked="(selectedSprintIds[sprint.id] || []).includes(row.id)"
            @change="toggleOne('sprint', row.id, $event, sprint.id)"
          />
        </template>

        <template #summary="{ row }">
          <div class="flex items-center gap-2 text-text-secondary float-start">
            <img src="../../../assets/icons/ticket-code.svg" alt="">
            <span class="inline-block rounded-full px-2 py-0.5 text-xs">{{ row.key }}</span>
            <span class="truncate">{{ row.summary }}</span>
          </div>
        </template>

        <template #status="{ row }">
          <span :class="getStatusStyle(row.status)" class="px-2 py-1 rounded-md">{{ row.status }}</span>
        </template>

        <template #assignee="{ row}:any">
        
          <span v-if="row?.assignee == 'Unassigned'"
            class="float-end flex justify-center text-gray-500 items-center text-xs aspect-square max-w-6 min-h-6 bg-gray-500/10 rounded-full">UA</span>
          <div v-else-if="row.assignee.u_profile_image" class="w-6 h-6 rounded-full">
            <img :src="row.assignee.u_profile_image" alt="">
          </div>
          <span v-else
            class="text-xs aspect-square max-w-6 flex justify-center items-center min-h-6 bg-accent/30 text-accent border-accent border rounded-full">
            {{ getInitials(row.assignee.u_full_name ?? "") }}
          </span>
        </template>

        <template #priority="{ row }">
          <span :class="priorityClass(row.priority)">{{ row.priority }}</span>
        </template>

        <template #drag="{ row }">
          <button class="cursor-grab" title="Drag to Backlog" draggable @click.stop
                  @dragstart="onDragStart($event, row, 'sprint', sprint.id)"
                  @dragend="onDragEnd">↕</button>
        </template>
      </Table>

      <!-- Empty State -->
      <div v-else class="empty-state flex flex-col h-full justify-center items-center border-dashed border border-border">
        <img src="../../../assets/emptyStates/sprint-plan.svg" class="mb-4" alt="backlog-plan">
        <h6 class="text-sm text-text-primary font-semibold mb-1 text-center">Plan your sprint</h6>
        <p class="text-sm text-text-primary/90 mb-3 max-w-120 text-center">
          Drag work items from the <span class="font-bold">Backlog</span> section or create new ones to plan the
          work for this sprint. Select <span class="font-bold">Start sprint</span> when you're ready.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Table from '../../../components/ui/Table.vue'
import { useBacklogStore, priorityClass, type Sprint, type Ticket } from '../composables/useBacklogStore'
import { useMoveCard } from '../../../queries/usePlan'
import { toast } from 'vue-sonner'
import { getStatusStyle } from '../../../utilities/stausStyle'
import { getInitials } from '../../../utilities'
import SearchBar from '../../../components/ui/SearchBar.vue'

const props = defineProps<{ sprint: Sprint, sprintId: any }>()
const emit = defineEmits(['edit-sprint', 'toggle-start', 'open-ticket', 'move-selected-to-backlog', 'delete-selected-sprint', 'refresh'])

const store = useBacklogStore()
const { selectedSprintIds, allSprintChecked, toggleAll, toggleOne } = store

// Tickets state
const sprintTickets = ref<Ticket[]>([])
watch(() => props.sprint.tickets, (tickets) => {
  sprintTickets.value = [...(tickets || [])]
}, { immediate: true, deep: true })

// Search
const searchQuery = ref('')
const filteredTickets = computed(() => {
  if (!searchQuery.value) return sprintTickets.value
  const q = searchQuery.value.toLowerCase()
  return sprintTickets.value.filter(ticket =>
    ticket.key.toLowerCase().includes(q) ||
    ticket.summary.toLowerCase().includes(q) ||
    (ticket.assignee?.u_full_name ?? '').toLowerCase().includes(q)
  )
})

// Drag & Drop
const dropOverSprint = ref(false)
const draggedTicketId = ref<string | null>(null)
const { mutate: moveCardApi } = useMoveCard({
  onSuccess: () => { toast.success('Card moved to sprint successfully'); emit('refresh') },
  onError: (error: any) => { toast.error('Failed to move card: ' + (error.message || 'Unknown error')) }
})

function onDragStart(e: DragEvent, ticket: any, from: 'backlog' | 'sprint', sprintId?: string) {
  draggedTicketId.value = ticket.id
  const payload = JSON.stringify({ id: ticket.id, from, sprintId, ticket })
  e.dataTransfer?.setData('text/plain', payload)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd(e: DragEvent) {
  dropOverSprint.value = false
  if (e.dataTransfer?.dropEffect !== 'none' && draggedTicketId.value) {
    sprintTickets.value = sprintTickets.value.filter(t => t.id !== draggedTicketId.value)
  }
  draggedTicketId.value = null
}

function onDragEnterSprint() { dropOverSprint.value = true }
function onDragLeaveSprint() { dropOverSprint.value = false }

function onDropSprint(e: DragEvent) {
  e.preventDefault()
  dropOverSprint.value = false
  try {
    const raw = e.dataTransfer?.getData('text/plain')
    if (!raw) return
    const data = JSON.parse(raw) as { id: string; from: 'backlog' | 'sprint'; sprintId?: string; ticket: Ticket }
    if (data.from !== 'backlog') return
    if (sprintTickets.value.some(t => t.id === data.id)) return
    sprintTickets.value.push(data.ticket)

    moveCardApi({
      id: props.sprintId,
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

// Columns
const columns = [
  { key: 'summary', label: 'Summary', sortable: true },
  { key: 'status', label: 'Status', width: 120, sortable: true },
  { key: 'assignee', label: 'Assignee', width: 120, sortable: true },
]
</script>
