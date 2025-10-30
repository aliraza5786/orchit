<template>
  <section class="space-y-3 flex flex-col overflow-y-auto">
    <!-- Table -->
    <div class="rounded-lg border h-[300px] border-border  flex flex-col"
      :class="dropOverBacklog ? 'ring-2 ring-blue-400' : ''" @dragover.prevent @dragenter="dropOverBacklog = true"
      @dragleave="dropOverBacklog = false" @drop="onDropBacklog($event)">
      <div v-if="!isBacklogListPending && normalizedBacklog.length === 0"
        class="empty-state flex flex-col justify-center items-center h-full">
        <img src="../../../assets/emptyStates/plan-backlog.svg" class="mb-4" alt="backlog-plan" />
        <h6 class="text-sm text-text-primary font-semibold mb-1">Get started in the backlog</h6>
        <p class="text-sm text-text-primary/90 mb-3">Plan and start a sprint to see issues here.</p>
        <Button>Add Task Backlog</Button>
      </div>
      <Table v-else :showHeader="false"  :pagination="false" class="flex-grow h-full" :rowDraggable="true"
        @row-dragstart="({ row, $event }: any) => onDragStart($event, row, 'backlog')"
        @row-dragend="({ $event }: any) => onDragEnd($event)" :columns="columns" :rows="normalizedBacklog"
        :page-size="20" :hover="true"  :itemKey="(row: any) => row.id" :sorters="sorters"
        @row-click="({ row }: any) => $emit('open-ticket', row)">
        <!-- <template #select-header>
          <input type="checkbox" :checked="allBacklogChecked" @change="toggleAll('backlog', $event)" />
        </template> -->

        <!-- <template #select="{ row }">

          <input type="checkbox" :checked="selectedBacklogIds.includes(row.id)"
            @change="toggleOne('backlog', row.id, $event)" />
        </template> -->

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
          <span v-if="row.assignee == 'Unassigned'"
            class="  float-end flex justify-center text-gray-500 items-center text-xs aspect-square max-w-6  min-h-6 bg-gray-500/10 rounded-full  ">UA</span>
          <span v-else class="  text-xs aspect-square max-w-6 flex justify-center items-center text-center min-h-6 bg-accent/30 text-accent border-accent border rounded-full  ">{{ getInitials(row.assignee) }}</span>
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
import { computed, ref, watch } from 'vue'
import Table from '@/components/ui/Table.vue'
import Button from '@/components/ui/Button.vue'
import {
  // useBacklogStore,
  // priorityClass,
  type Ticket
} from '../composables/useBacklogStore'
import { useBacklogList } from '../../../queries/usePlan'
import { useWorkspaceId } from '../../../composables/useQueryParams'
import { getInitials } from '../../../utilities'

defineProps<{ sorters: Record<string, (a: Ticket, b: Ticket, dir: 'asc' | 'desc') => number> }>()
const emit = defineEmits(['ticket-dragged-to-sprint', 'open-ticket', 'ticket-moved-to-backlog'])

const { workspaceId } = useWorkspaceId()
const { data: backlogResp, isPending: isBacklogListPending } = useBacklogList(workspaceId)

const normalizedBacklog = ref<Ticket[]>([])

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
      assignee: c.card?.assigned_to?.name ?? 'Unassigned',
      storyPoints: Number(c.story_points ?? 0) || 0,
      priority: mapPriority(rawPriority),
      createdAt: c.card?.created_at ?? new Date().toISOString(),
      description: (v['card-description'] as string) || '',
    }
  })
}, { immediate: true })

function mapStatus(s: string) {
  const normalized = s.toLowerCase()
  switch (normalized.trim()) {
    case 'todo':
      return 'bg-gray-500/10 text-gray-500'
          case 'to do':
      return 'bg-gray-500/10 text-gray-500'
    case 'in progress':
      return 'bg-gray-amber/10 text-amber-500'
    case 'done':
      return 'bg-green-500/10 text-green-500'


    default:
      break;
  }
  if (normalized.includes('progress')) return 'In Progress'
  if (normalized.includes('done') || normalized.includes('complete')) return 'Done'
  return 'Todo'
}

function mapPriority(p: string | null | undefined): Ticket['priority'] {
  const s = String(p ?? '').toLowerCase()
  if (s === 'highest' || s === 'blocker' || s === 'critical') return 'Highest'
  if (s === 'high' || s === 'major') return 'High'
  if (s === 'medium' || s === 'normal') return 'Medium'
  if (s === 'low' || s === 'minor' || s === 'trivial' || s === '') return 'Low'
  return 'Low'
}

/** Store (single instance) */
// const {
//   selectedBacklogIds,
//   allBacklogChecked,
//   toggleAll,
//   toggleOne,
// } = useBacklogStore()

const dropOverBacklog = ref(false)
const draggedTicketId = ref<string | null>(null)

function onDragStart(e: DragEvent, ticket: Ticket, from: 'backlog' | 'sprint') {
  draggedTicketId.value = ticket.id
  const payload = JSON.stringify({ id: ticket.id, from, ticket })
  e.dataTransfer?.setData('text/plain', payload)
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onDragEnd(e: DragEvent) {
  dropOverBacklog.value = false

  // Check if drop was successful (dropEffect is not 'none')
  if (e.dataTransfer?.dropEffect !== 'none' && draggedTicketId.value) {
    // Remove from backlog after successful drop on sprint
    normalizedBacklog.value = normalizedBacklog.value.filter(
      t => t.id !== draggedTicketId.value
    )
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

    // Only accept drops from sprint
    if (data.from !== 'sprint') return

    // Check if already exists
    const isDuplicate = normalizedBacklog.value.some(t => t.id === data.id)
    if (isDuplicate) return

    // Add to backlog
    normalizedBacklog.value.push(data.ticket)

    // Notify parent that ticket was moved back to backlog
    emit('ticket-moved-to-backlog', data.id, data.sprintId)
  } catch (error) {
    console.error('Drop error:', error)
  }
}

/** Columns for the new shape */
const columns = computed(() => [
  // { key: 'select', label: '', width: 36 },
  { key: 'summary', label: 'Summary', sortable: false },
  { key: 'status', label: 'Status', width: 120, sortable: false },
  { key: 'assignee', label: '', width: 120, sortable: false },
])
</script>
