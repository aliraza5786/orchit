<template>
  <section class="space-y-3 flex flex-col overflow-y-auto h-full">
    <!-- Search Input -->
    <!-- <div class="mb-2">
      <SearchBar type="text"  @onChange="(e) => searchQuery = e" placeholder="Search tickets..."
        class="w-[250px]" />
    </div> -->

    <!-- Table -->
    <div class="rounded-lg  h-full flex flex-col justify-center h-full"
      :class="dropOverBacklog ? 'ring-2 ring-blue-400' : ''" @dragover.prevent @dragenter="dropOverBacklog = true"
      @dragleave="dropOverBacklog = false" @drop="onDropBacklog($event)">
      <!-- Empty State -->
      <div v-if="!isBacklogListPending && filteredBacklog.length === 0"
        class="empty-state flex flex-col justify-center items-center h-full">
        <img src="../../../assets/emptyStates/plan-backlog.svg" class="mb-4" alt="backlog-plan" />
        <h6 class="text-sm text-text-primary font-semibold mb-1">Get started in the backlog</h6>
        <p class="text-sm text-text-primary/90 mb-3">Plan and start a sprint to see issues here.</p>
      </div>

      <!-- Tickets Table -->
      <Table v-else :showHeader="false" :pagination="false" class="flex-grow h-full min-w-max" :rowDraggable="true"
        @row-dragstart="({ row, $event }:any) => onDragStart($event, row, 'backlog')"
        @row-dragend="({ $event }:any) => onDragEnd($event)" :columns="columns" :rows="filteredBacklog" :page-size="20"
        :hover="true" :itemKey="(row:any) => row.id" :sorters="sorters" @row-click="({ row }:any) => $emit('open-ticket', row)">
        <template #summary="{ row }">
          <div class="flex items-center gap-2 text-text-secondary float-start">
            <img src="../../../assets/icons/ticket-code.svg" alt="">
            <span class="inline-block rounded-full px-2 py-0.5 text-xs">{{ row.key }}</span>
            <span class="truncate">{{ row.summary }}</span>
          </div>
        </template>

        <template #status="{ row }">
          <span :class="mapStatus(row.status)" class="px-2 py-1 rounded-md">{{ row.status }}</span>
        </template>

        <template #assignee="{ row }">
          <span v-if="row?.assignee === 'Unassigned'"
            class="float-end flex justify-center text-gray-500 items-center text-xs aspect-square max-w-6 min-h-6 bg-gray-500/10 rounded-full ">UA</span>
          <div v-else-if="row?.assignee.u_profile_image" class="float-end w-6 h-6 rounded-full">
            <img :src="row.assignee.u_profile_image" alt="">
          </div>
          <span v-else
            class="float-end text-xs aspect-square max-w-6 flex justify-center items-center min-h-6 bg-accent/30 text-accent border-accent border rounded-full">
            {{ getInitials(row?.assignee.u_full_name) }}
          </span>
        </template>

        <template #drag="{ row }">
          <button class="cursor-grab" title="Drag to Sprint" draggable @click.stop
            @dragstart="onDragStart($event, row, 'backlog')" @dragend="onDragEnd">↕</button>
        </template>
      </Table>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import Table from '@/components/ui/Table.vue'
import { type Ticket } from '../composables/useBacklogStore'
import { useBacklogList } from '../../../queries/usePlan'
import { useWorkspaceId } from '../../../composables/useQueryParams'
import { getInitials } from '../../../utilities'
import SearchBar from '../../../components/ui/SearchBar.vue'

defineProps<{ sorters: Record<string, (a: Ticket, b: Ticket, dir: 'asc' | 'desc') => number> }>()
const emit = defineEmits(['ticket-dragged-to-sprint', 'open-ticket', 'ticket-moved-to-backlog'])

const { workspaceId } = useWorkspaceId()
const { data: backlogResp, isPending: isBacklogListPending } = useBacklogList(workspaceId)

const normalizedBacklog = ref<Ticket[]>([])
const dropOverBacklog = ref(false)
const draggedTicketId = ref<string | null>(null)
const searchQuery = ref('')

// Normalize incoming backlog data
watch(backlogResp, (resp) => {
  if (!resp?.cards) return
  normalizedBacklog.value = resp.cards.map((c: any): Ticket => {
    const v = c.card?.variables ?? {}
    const id = c.card?._id ?? c.card_id
    const rawStatus = String(v['card-status'] ?? '').trim()
    const rawPriority = String(v['priority'] ?? '').trim()

    return {
      id,
      key: (v['card-code'] as string) || id?.slice(-6) || 'PRJ-?',
      summary: (v['card-title'] as string) || '(untitled)',
      type: 'Story',
      status: rawStatus,
      assignee: c.card?.assigned_to ?? 'Unassigned',
      storyPoints: Number(c.story_points ?? 0) || 0,
      priority: mapPriority(rawPriority),
      createdAt: c.card?.created_at ?? new Date().toISOString(),
      description: (v['card-description'] as string) || '',
    }
  })
}, { immediate: true })

// Filter tickets based on search query
const filteredBacklog = computed(() => {
  if (!searchQuery.value) return normalizedBacklog.value
  const q = searchQuery.value.toLowerCase()
  return normalizedBacklog.value.filter(ticket =>
    ticket.key.toLowerCase().includes(q) ||
    ticket.summary.toLowerCase().includes(q) ||
    (typeof ticket.assignee === 'string'
      ? ticket.assignee.toLowerCase().includes(q)
      : ticket.assignee?.u_full_name?.toLowerCase().includes(q))
  )
})

// Map status to CSS classes
function mapStatus(s: string) {
  const normalized = s.toLowerCase()
  if (normalized.includes('done') || normalized.includes('complete')) return 'bg-green-500/10 text-green-500'
  if (normalized.includes('progress')) return 'bg-gray-amber/10 text-amber-500'
  return 'bg-gray-500/10 text-gray-500'
}

// Map priority to standard values
function mapPriority(p: string | null | undefined): Ticket['priority'] {
  const s = String(p ?? '').toLowerCase()
  if (['highest', 'blocker', 'critical'].includes(s)) return 'Highest'
  if (['high', 'major'].includes(s)) return 'High'
  if (['medium', 'normal'].includes(s)) return 'Medium'
  return 'Low'
}

// Drag & Drop
function onDragStart(e: DragEvent, ticket: Ticket, from: 'backlog' | 'sprint') {
  draggedTicketId.value = ticket.id
  const payload = JSON.stringify({ id: ticket.id, from, ticket })
  e.dataTransfer?.setData('text/plain', payload)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd(e: DragEvent) {
  dropOverBacklog.value = false
  if (e.dataTransfer?.dropEffect !== 'none' && draggedTicketId.value) {
    normalizedBacklog.value = normalizedBacklog.value.filter(t => t.id !== draggedTicketId.value)
  }
  draggedTicketId.value = null
}

function onDropBacklog(e: DragEvent) {
  e.preventDefault()
  dropOverBacklog.value = false
  try {
    const raw = e.dataTransfer?.getData('text/plain')
    if (!raw) return
    const data = JSON.parse(raw) as { id: string; from: 'backlog' | 'sprint'; sprintId?: string; ticket: Ticket }
    if (data.from !== 'sprint') return
    if (normalizedBacklog.value.some(t => t.id === data.id)) return
    normalizedBacklog.value.push(data.ticket)
    emit('ticket-moved-to-backlog', data.id, data.sprintId)
  } catch (error) {
    console.error('Drop error:', error)
  }
}

// Columns for Table
const columns = computed(() => [
  { key: 'summary', label: 'Summary', sortable: false },
  { key: 'status', label: 'Status', width: 120, sortable: false },
  { key: 'assignee', label: '', width: 120, sortable: false },
])
</script>
