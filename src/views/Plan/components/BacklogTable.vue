<template>
  <section class="space-y-3 flex flex-col overflow-y-auto">
    <!-- Empty state -->
    <div v-if="!isBacklogListPending && normalizedBacklog.length === 0"
      class="empty-state flex flex-col justify-center items-center">
      <img src="../../../assets/emptyStates/plan-backlog.svg" class="mb-4" alt="backlog-plan" />
      <h6 class="text-sm text-text-primary font-semibold mb-1">Get started in the backlog</h6>
      <p class="text-sm text-text-primary/90 mb-3">Plan and start a sprint to see issues here.</p>
      <Button>Add Task Backlog</Button>
    </div>

    <!-- Table -->
    <div v-else class="rounded-lg border h-[300px] border-border bg-bg-body flex flex-col"
      :class="dropOverBacklog ? 'ring-2 ring-blue-400' : ''" @dragover.prevent @dragenter="dropOverBacklog = true"
      @dragleave="dropOverBacklog = false" @drop="onDropBacklog($event)">
      <Table :showHeader="false"
      :pagination="false"
      class="flex-grow h-full" :rowDraggable="true"
        @row-dragstart="({ row, $event }: any) => onDragStart($event, row, 'backlog')" @row-dragend="onDragEnd"
        :columns="columns" :rows="normalizedBacklog" :page-size="20" :hover="true" striped
        :itemKey="(row: any) => row.id" :sorters="sorters" @row-click="({ row }: any) => $emit('open-ticket', row)">
        <template #select-header>
          <input type="checkbox" :checked="allBacklogChecked" @change="toggleAll('backlog', $event)" />
        </template>

        <template #select="{ row }">
          <input type="checkbox" :checked="selectedBacklogIds.includes(row.id)"
            @change="toggleOne('backlog', row.id, $event)" />
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
  useBacklogStore,
  priorityClass,
  type Ticket
} from '../composables/useBacklogStore'
import { useBacklogList } from '../../../queries/usePlan'
import { useWorkspaceId } from '../../../composables/useQueryParams'

defineProps<{ sorters: Record<string, (a: Ticket, b: Ticket, dir: 'asc' | 'desc') => number> }>()
const emit = defineEmits(['ticket-dragged-to-sprint', 'open-ticket'])

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
      status: mapStatus(rawStatus),
      assignee: c.card?.assigned_to?.name ?? 'Unassigned',
      storyPoints: Number(c.story_points ?? 0) || 0,
      priority: mapPriority(rawPriority),
      createdAt: c.card?.created_at ?? new Date().toISOString(),
      description: (v['card-description'] as string) || '',
    }
  })
}, { immediate: true })

function mapStatus(s: string): Ticket['status'] {
  const normalized = s.toLowerCase()
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
const {
  selectedBacklogIds,
  allBacklogChecked,
  toggleAll,
  toggleOne,
} = useBacklogStore()

const dropOverBacklog = ref(false)

function onDragStart(e: DragEvent, ticket: Ticket, from: 'backlog' | 'sprint') {
  const payload = JSON.stringify({ id: ticket.id, from, ticket })
  e.dataTransfer?.setData('text/plain', payload)
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onDragEnd() {
  dropOverBacklog.value = false
}

function onDropBacklog(e: DragEvent) {
  e.preventDefault()
  dropOverBacklog.value = false
  // Backlog doesn't accept drops from sprint (optional feature)
}

/** Columns for the new shape */
const columns = computed(() => [
  { key: 'select', label: '', width: 36 },
  { key: 'summary', label: 'Summary', sortable: false },
  { key: 'status', label: 'Status', width: 120, sortable: false },
  { key: 'assignee', label: '', width: 120, sortable: false },
])
</script>
