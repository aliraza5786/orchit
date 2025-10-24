<template>
  <div class="space-y-6 p-4">
    <!-- Header -->
    <header class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold">Backlog</h1>
        <p class="text-sm text-gray-500">Plan work, create sprints, and move tickets between backlog and sprints —
          Jira-style.</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus-visible:ring-2 focus-visible:ring-orange-300"
          @click="openCreateTicket('backlog')">
          + Create Backlog Ticket
        </button>
        <button
          class="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-orange-300"
          @click="openCreateSprint">
          + Create Sprint
        </button>
      </div>
    </header>

    <div class="flex flex-col gap-6">
      <!-- Backlog -->
      <section class="lg:col-span-7 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Product Backlog</h2>
          <div class="flex items-center gap-2">
            <button class="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
              :disabled="!selectedBacklogIds.length" @click="moveSelectedToSprint">
              Move to Sprint
            </button>
            <button class="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-40"
              :disabled="!selectedBacklogIds.length" @click="deleteSelected('backlog')">
              Delete
            </button>
          </div>
        </div>

        <!-- Backlog table -->
        <div class="rounded-lg border bg-white" :class="dropOverBacklog ? 'ring-2 ring-blue-400' : ''" @dragover.prevent
          @dragenter="dropOverBacklog = true" @dragleave="dropOverBacklog = false" @drop="onDropBacklog($event)">
          <Table :rowDraggable="true" @row-dragstart="({ row, $event }) => onDragStart($event, row, 'backlog')" @row-dragend="onDragEnd"
            :columns="columnsWithSelect" :rows="backlog" :page-size="20" :hover="true" striped
            :itemKey="(row) => row.id" :sorters="sorters" @row-click="({ row }) => openTicket(row)">
            <!-- Backlog handle -->


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

      <!-- Sprints -->
      <section class="lg:col-span-5 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Sprints</h2>
          <div class="flex items-center gap-2">
            <select class="rounded-md border px-2 py-1 text-sm" v-model="activeSprintId">
              <option v-for="s in sprints" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
            <button class="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50" @click="openCreateTicket('sprint')">+
              Create Sprint Ticket</button>
          </div>
        </div>

        <div v-if="!sprints.length" class="rounded-lg border bg-white p-6 text-center text-gray-500">
          No sprints yet. Click <span class="font-medium">Create Sprint</span> to get started.
        </div>

        <div v-for="s in sprints" :key="s.id" class="rounded-lg border bg-white">
          <header class="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <div class="flex min-w-0 items-center gap-3">
              <h3 class="truncate text-base font-semibold">{{ s.name }}</h3>
              <span v-if="s.started" class="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">In
                Progress</span>
              <span v-else class="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-600">Planned</span>
            </div>
            <div class="flex items-center gap-2">
              <button class="rounded-md border px-2.5 py-1.5 text-xs hover:bg-gray-50"
                @click="openEditSprint(s)">Edit</button>
              <button class="rounded-md border px-2.5 py-1.5 text-xs hover:bg-gray-50"
                @click="duplicateSprint(s)">Duplicate</button>
              <button class="rounded-md border px-2.5 py-1.5 text-xs hover:bg-gray-50"
                @click="deleteSprint(s.id)">Delete</button>
              <button class="rounded-md px-3 py-1.5 text-xs font-medium text-white"
                :class="s.started ? 'bg-gray-700 hover:opacity-90' : 'bg-blue-600 hover:bg-blue-700'"
                @click="toggleStartSprint(s)">
                {{ s.started ? 'Complete Sprint' : 'Start Sprint' }}
              </button>
            </div>
          </header>

          <!-- Sprint tickets area (drop zone) -->
          <div class="px-2 py-2" >
            <div class="flex items-center justify-between px-2 pb-2">
              <div class="text-sm text-gray-600">
                {{ s.tickets.length }} tickets · {{ sprintPoints(s) }} pts
              </div>
              <div class="flex items-center gap-2">
                <button class="rounded-md border px-2.5 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
                  :disabled="!selectedSprintIds[s.id]?.length" @click="moveSelectedToBacklog(s.id)">
                  Move to Backlog
                </button>
                <button class="rounded-md border px-2.5 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-40"
                  :disabled="!selectedSprintIds[s.id]?.length" @click="deleteSelected('sprint', s.id)">
                  Delete
                </button>
              </div>
            </div>

            <!-- Sprint table -->
            <div class="px-2 py-2" :class="dropOverSprintId === s.id ? 'ring-2 ring-blue-400 rounded-lg' : ''"
              @dragover.prevent @dragenter="onDragEnterSprint(s.id)" @dragleave="onDragLeaveSprint(s.id)"
              @drop="onDropSprint($event, s)">
              <Table :rowDraggable="true"
  @row-dragstart="({ row, $event }) => onDragStart($event, row, 'sprint', s.id)"
  @row-dragend="onDragEnd"
                :columns="columnsWithSelect" :rows="s.tickets" :page-size="100" :hover="true" striped
                :itemKey="(row) => row.id" :sorters="sorters" @row-click="({ row }) => openTicket(row)">
                <template #select-header>
                  <input type="checkbox" :checked="allSprintChecked(s.id)"
                    @change="toggleAll('sprint', $event, s.id)" />
                </template>
                <template #select="{ row }">
                  <input type="checkbox" :checked="(selectedSprintIds[s.id] || []).includes(row.id)"
                    @change="toggleOne('sprint', row.id, $event, s.id)" />
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
                    @dragstart="onDragStart($event, row, 'sprint', s.id)" @dragend="onDragEnd">↕</button>
                </template>
              </Table>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Create / Edit Sprint Modal -->
    <dialog ref="sprintDialog" class="modal">
      <form method="dialog" class="modal-box max-w-lg space-y-4" @submit.prevent>
        <h3 class="text-lg font-semibold">{{ editingSprint ? 'Edit Sprint' : 'Create Sprint' }}</h3>
        <div class="grid grid-cols-1 gap-3">
          <label class="space-y-1">
            <span class="text-sm">Name</span>
            <input v-model="sprintForm.name" class="w-full rounded-md border px-3 py-2" placeholder="Sprint 1" />
          </label>
          <label class="space-y-1">
            <span class="text-sm">Goal (optional)</span>
            <textarea v-model="sprintForm.goal" class="w-full rounded-md border px-3 py-2" rows="2"
              placeholder="Ship onboarding flow" />
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="space-y-1">
              <span class="text-sm">Start</span>
              <input type="date" v-model="sprintForm.start" class="w-full rounded-md border px-3 py-2" />
            </label>
            <label class="space-y-1">
              <span class="text-sm">End</span>
              <input type="date" v-model="sprintForm.end" class="w-full rounded-md border px-3 py-2" />
            </label>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="rounded-md border px-3 py-1.5" @click="closeSprintDialog">Cancel</button>
          <button type="button" class="rounded-md bg-blue-600 px-3 py-1.5 text-white" @click="saveSprint">Save</button>
        </div>
      </form>
    </dialog>

    <!-- Create / Edit Ticket Modal -->
    <dialog ref="ticketDialog" class="modal">
      <form method="dialog" class="modal-box max-w-lg space-y-4" @submit.prevent>
        <h3 class="text-lg font-semibold">{{ editingTicket ? 'Edit' : 'Create' }} Ticket</h3>
        <div class="grid grid-cols-1 gap-3">
          <label class="space-y-1">
            <span class="text-sm">Summary</span>
            <input v-model="ticketForm.summary" class="w-full rounded-md border px-3 py-2"
              placeholder="As a user, I want…" />
          </label>
          <div class="grid grid-cols-2 gap-3">
            <label class="space-y-1">
              <span class="text-sm">Type</span>
              <select v-model="ticketForm.type" class="w-full rounded-md border px-3 py-2">
                <option>Story</option>
                <option>Bug</option>
                <option>Task</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-sm">Priority</span>
              <select v-model="ticketForm.priority" class="w-full rounded-md border px-3 py-2">
                <option>Highest</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </label>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <label class="space-y-1">
              <span class="text-sm">Story Points</span>
              <input type="number" min="0" v-model.number="ticketForm.storyPoints"
                class="w-full rounded-md border px-3 py-2" />
            </label>
            <label class="space-y-1">
              <span class="text-sm">Assignee</span>
              <input v-model="ticketForm.assignee" class="w-full rounded-md border px-3 py-2"
                placeholder="Unassigned" />
            </label>
          </div>
          <label class="space-y-1">
            <span class="text-sm">Description</span>
            <textarea v-model="ticketForm.description" class="w-full rounded-md border px-3 py-2" rows="3" />
          </label>
        </div>

        <div class="modal-action">
          <button type="button" class="rounded-md border px-3 py-1.5" @click="closeTicketDialog">Cancel</button>
          <button type="button" class="rounded-md bg-blue-600 px-3 py-1.5 text-white" @click="saveTicket">Save</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
// Assumes your provided table is globally registered as DataTable or import it:
import Table from '../../components/ui/Table.vue'

/* ---------------------------------
 * Types
 * --------------------------------- */
interface Ticket {
  id: string
  key: string
  summary: string
  type: 'Story' | 'Bug' | 'Task'
  status: 'Todo' | 'In Progress' | 'Done'
  assignee?: string
  storyPoints?: number
  priority: 'Highest' | 'High' | 'Medium' | 'Low'
  createdAt: string
  description?: string
}

interface Sprint {
  id: string
  name: string
  goal?: string
  start?: string
  end?: string
  started: boolean
  tickets: Ticket[]
}

/* ---------------------------------
 * State
 * --------------------------------- */
const backlog = ref<Ticket[]>(loadFromLS('backlog', []))
const sprints = ref<Sprint[]>(loadFromLS('sprints', []))
const activeSprintId = ref<string | null>(sprints.value[0]?.id ?? null)

watch([backlog, sprints], () => {
  saveToLS('backlog', backlog.value)
  saveToLS('sprints', sprints.value)
}, { deep: true })

/* ---------------------------------
 * Columns (reuse your table)
 * --------------------------------- */
const baseColumns = [
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
const columnsWithSelect = computed(() => baseColumns)

const sorters = {
  createdAt: (a: Ticket, b: Ticket, dir: 'asc' | 'desc') => {
    const av = new Date(a.createdAt).getTime()
    const bv = new Date(b.createdAt).getTime()
    return dir === 'asc' ? av - bv : bv - av
  },
}

/* ---------------------------------
 * Selection state
 * --------------------------------- */
const selectedBacklogIds = ref<string[]>([])
const selectedSprintIds = reactive<Record<string, string[]>>({}) // sprintId -> ids

const allBacklogChecked = computed(() => backlog.value.length > 0 && selectedBacklogIds.value.length === backlog.value.length)
const allSprintChecked = (sprintId: string) => {
  const s = sprints.value.find(x => x.id === sprintId)
  return !!s && s.tickets.length > 0 && (selectedSprintIds[sprintId]?.length || 0) === s.tickets.length
}

function toggleAll(area: 'backlog' | 'sprint', e: Event, sprintId?: string) {
  const checked = (e.target as HTMLInputElement).checked
  if (area === 'backlog') {
    selectedBacklogIds.value = checked ? backlog.value.map(t => t.id) : []
  } else if (sprintId) {
    const s = sprints.value.find(x => x.id === sprintId)
    selectedSprintIds[sprintId] = checked && s ? s.tickets.map(t => t.id) : []
  }
}
function toggleOne(area: 'backlog' | 'sprint', id: string, e: Event, sprintId?: string) {
  const checked = (e.target as HTMLInputElement).checked
  const arr = area === 'backlog' ? selectedBacklogIds.value : (selectedSprintIds[sprintId!] ||= [])
  if (checked && !arr.includes(id)) arr.push(id)
  if (!checked) {
    const i = arr.indexOf(id)
    if (i >= 0) arr.splice(i, 1)
  }
}

/* ---------------------------------
 * Modals: Sprint
 * --------------------------------- */
const sprintDialog = ref<HTMLDialogElement>()
const sprintForm = reactive<Partial<Sprint>>({ name: '', goal: '', start: '', end: '' })
let editingSprint: Sprint | null = null

function openCreateSprint() {
  editingSprint = null
  sprintForm.name = suggestedSprintName()
  sprintForm.goal = ''
  sprintForm.start = ''
  sprintForm.end = ''
  sprintDialog.value?.showModal()
}
function openEditSprint(s: Sprint) {
  editingSprint = s
  Object.assign(sprintForm, s)
  sprintDialog.value?.showModal()
}
function closeSprintDialog() {
  sprintDialog.value?.close()
}
function saveSprint() {
  if (!sprintForm.name?.trim()) return
  if (editingSprint) {
    editingSprint.name = sprintForm.name!
    editingSprint.goal = sprintForm.goal
    editingSprint.start = sprintForm.start
    editingSprint.end = sprintForm.end
  } else {
    const s: Sprint = {
      id: uid('sprint'),
      name: sprintForm.name!,
      goal: sprintForm.goal || '',
      start: sprintForm.start || '',
      end: sprintForm.end || '',
      started: false,
      tickets: [],
    }
    sprints.value.push(s)
    if (!activeSprintId.value) activeSprintId.value = s.id
  }
  closeSprintDialog()
}
function deleteSprint(id: string) {
  const i = sprints.value.findIndex(s => s.id === id)
  if (i === -1) return
  // Return tickets to backlog
  backlog.value.push(...sprints.value[i].tickets)
  sprints.value.splice(i, 1)
  if (activeSprintId.value === id) activeSprintId.value = sprints.value[0]?.id ?? null
}
function duplicateSprint(s: Sprint) {
  const copy: Sprint = JSON.parse(JSON.stringify(s))
  copy.id = uid('sprint')
  copy.name = nextName(copy.name)
  copy.started = false
  sprints.value.push(copy)
}
function toggleStartSprint(s: Sprint) {
  s.started = !s.started
}
function sprintPoints(s: Sprint) {
  return s.tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0)
}
function suggestedSprintName() {
  const base = 'Sprint '
  const nums = sprints.value
    .map(s => Number(String(s.name).replace(/[^0-9]/g, '')))
    .filter(n => !Number.isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return base + next
}

/* ---------------------------------
 * Modals: Ticket
 * --------------------------------- */
const ticketDialog = ref<HTMLDialogElement>()
const ticketForm = reactive<Partial<Ticket>>({ type: 'Story', priority: 'Medium', storyPoints: 1, status: 'Todo' })
let editingTicket: Ticket | null = null
let createTarget: 'backlog' | 'sprint' = 'backlog'
let createTargetSprintId: string | null = null

function openCreateTicket(target: 'backlog' | 'sprint') {
  editingTicket = null
  createTarget = target
  createTargetSprintId = target === 'sprint' ? (activeSprintId.value || sprints.value[0]?.id || null) : null
  Object.assign(ticketForm, { summary: '', type: 'Story', priority: 'Medium', storyPoints: 1, status: 'Todo', assignee: '', description: '' })
  ticketDialog.value?.showModal()
}
function openTicket(t: Ticket) {
  editingTicket = t
  Object.assign(ticketForm, t)
  ticketDialog.value?.showModal()
}
function closeTicketDialog() {
  ticketDialog.value?.close()
}
function saveTicket() {
  if (!ticketForm.summary?.trim()) return
  if (editingTicket) {
    Object.assign(editingTicket, ticketForm)
  } else {
    const t: Ticket = {
      id: uid('T'),
      key: nextKey(),
      summary: ticketForm.summary!,
      type: ticketForm.type as Ticket['type'],
      status: ticketForm.status as Ticket['status'],
      assignee: ticketForm.assignee?.trim() || 'Unassigned',
      storyPoints: Number(ticketForm.storyPoints) || 0,
      priority: ticketForm.priority as Ticket['priority'],
      createdAt: new Date().toISOString(),
      description: ticketForm.description || ''
    }
    if (createTarget === 'backlog') backlog.value.push(t)
    else {
      const s = sprints.value.find(x => x.id === (createTargetSprintId || activeSprintId.value))
      if (s) s.tickets.push(t)
      else backlog.value.push(t)
    }
  }
  closeTicketDialog()
}

/* ---------------------------------
 * Move / Bulk actions
 * --------------------------------- */
function moveSelectedToSprint() {
  const s = getActiveSprint()
  if (!s || !selectedBacklogIds.value.length) return
  const [kept, moved] = partition(backlog.value, t => !selectedBacklogIds.value.includes(t.id))
  backlog.value = kept
  s.tickets.push(...moved)
  selectedBacklogIds.value = []
}
function moveSelectedToBacklog(sprintId: string) {
  const s = sprints.value.find(x => x.id === sprintId)
  if (!s) return
  const ids = selectedSprintIds[sprintId] || []
  const [kept, moved] = partition(s.tickets, t => !ids.includes(t.id))
  s.tickets = kept
  backlog.value.push(...moved)
  selectedSprintIds[sprintId] = []
}
function deleteSelected(area: 'backlog' | 'sprint', sprintId?: string) {
  if (area === 'backlog') {
    backlog.value = backlog.value.filter(t => !selectedBacklogIds.value.includes(t.id))
    selectedBacklogIds.value = []
  } else if (sprintId) {
    const ids = selectedSprintIds[sprintId] || []
    const s = sprints.value.find(x => x.id === sprintId)
    if (!s) return
    s.tickets = s.tickets.filter(t => !ids.includes(t.id))
    selectedSprintIds[sprintId] = []
  }
}


/* ---------------------------------
 * Helpers
 * --------------------------------- */
function getActiveSprint() {
  return sprints.value.find(s => s.id === activeSprintId.value) || sprints.value[0]
}
function priorityClass(p: Ticket['priority']) {
  switch (p) {
    case 'Highest': return 'rounded-md bg-red-50 px-2 py-0.5 text-xs text-red-700'
    case 'High': return 'rounded-md bg-orange-50 px-2 py-0.5 text-xs text-orange-700'
    case 'Medium': return 'rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700'
    case 'Low': return 'rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600'
  }
}
function uid(prefix = 'id') { return `${prefix}_${Math.random().toString(36).slice(2, 9)}` }
function nextKey() {
  const all = [...backlog.value, ...sprints.value.flatMap(s => s.tickets)]
  const keys = all.map(t => Number(String(t.key).replace(/[^0-9]/g, ''))).filter(n => !Number.isNaN(n))
  const next = keys.length ? Math.max(...keys) + 1 : 1
  return `PRJ-${next}`
}
function nextName(name: string) {
  const m = name.match(/(.*?)(\d+)$\/i/) // tail number
  if (!m) return name + ' Copy'
  return `${m[1]}${Number(m[2]) + 1}`
}
function partition<T>(arr: T[], keep: (x: T) => boolean): [T[], T[]] {
  const kept: T[] = []; const moved: T[] = []
  for (const x of arr) (keep(x) ? kept : moved).push(x)
  return [kept, moved]
}
function saveToLS(key: string, val: unknown) {
  try { localStorage.setItem(`jira-like:${key}`, JSON.stringify(val)) } catch { }
}
function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`jira-like:${key}`)
    return raw ? JSON.parse(raw) as T : fallback
  } catch { return fallback }
}


// ----- Drag & drop state -----
const dropOverBacklog = ref(false)
const dropOverSprintId = ref<string | null>(null)

const dragData = reactive<{ ticket: Ticket | null; from: 'backlog' | 'sprint' | null; sprintId?: string }>(
  { ticket: null, from: null, sprintId: undefined }
)

function onDragStart(e: DragEvent, ticket: Ticket, from: 'backlog' | 'sprint', sprintId?: string) {
  dragData.ticket = ticket
  dragData.from = from
  dragData.sprintId = sprintId

  const payload = JSON.stringify({ id: ticket.id, from, sprintId })
  e.dataTransfer?.setData('text/plain', payload)
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.dropEffect = 'move'
  }
}

function onDragEnd() {
  dropOverBacklog.value = false
  dropOverSprintId.value = null
  dragData.ticket = null
  dragData.from = null
  dragData.sprintId = undefined
}

function onDragEnterSprint(sprintId: string) {
  dropOverSprintId.value = sprintId
}
function onDragLeaveSprint(sprintId: string) {
  if (dropOverSprintId.value === sprintId) dropOverSprintId.value = null
}

function readPayload(e: DragEvent) {
  try {
    const raw = e.dataTransfer?.getData('text/plain')
    if (!raw) return null
    return JSON.parse(raw) as { id: string; from: 'backlog' | 'sprint'; sprintId?: string }
  } catch { return null }
}

function takeTicketById(id: string, from: 'backlog' | 'sprint', sprintId?: string): Ticket | null {
  if (from === 'backlog') {
    const i = backlog.value.findIndex(t => t.id === id)
    if (i >= 0) return backlog.value.splice(i, 1)[0]
  } else if (sprintId) {
    const src = sprints.value.find(x => x.id === sprintId)
    if (src) {
      const i = src.tickets.findIndex(t => t.id === id)
      if (i >= 0) return src.tickets.splice(i, 1)[0]
    }
  }
  return null
}

function clearSelectionForMoved(ticketId: string, from: 'backlog' | 'sprint', sprintId?: string) {
  if (from === 'backlog') {
    selectedBacklogIds.value = selectedBacklogIds.value.filter(id => id !== ticketId)
  } else if (sprintId) {
    selectedSprintIds[sprintId] = (selectedSprintIds[sprintId] || []).filter(id => id !== ticketId)
  }
}

function onDropSprint(e: DragEvent, s: Sprint) {
  const p = readPayload(e)
  let ticket: Ticket | null = null
  let from: 'backlog' | 'sprint' | null = null
  let srcSprintId: string | undefined

  if (p) {
    ticket = takeTicketById(p.id, p.from, p.sprintId)
    from = p.from
    srcSprintId = p.sprintId
  } else if (dragData.ticket) {
    ticket = takeTicketById(dragData.ticket.id, dragData.from!, dragData.sprintId)
    from = dragData.from
    srcSprintId = dragData.sprintId
  }
  if (!ticket) return

  s.tickets.push(ticket)
  if (from) clearSelectionForMoved(ticket.id, from, srcSprintId)

  dropOverSprintId.value = null
  onDragEnd()
}

function onDropBacklog(e: DragEvent) {
  const p = readPayload(e)
  let ticket: Ticket | null = null
  let from: 'backlog' | 'sprint' | null = null
  let srcSprintId: string | undefined

  if (p) {
    ticket = takeTicketById(p.id, p.from, p.sprintId)
    from = p.from
    srcSprintId = p.sprintId
  } else if (dragData.ticket) {
    ticket = takeTicketById(dragData.ticket.id, dragData.from!, dragData.sprintId)
    from = dragData.from
    srcSprintId = dragData.sprintId
  }
  if (!ticket) return

  backlog.value.push(ticket)
  if (from) clearSelectionForMoved(ticket.id, from, srcSprintId)

  dropOverBacklog.value = false
  onDragEnd()
}

</script>

<style scoped>
/* Minimal modal styles (works without libs) */
.modal {
  display: none;
}

.modal[open] {
  display: block;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .35);
  z-index: 50;
}

.modal-box {
  margin: 10vh auto;
  background: white;
  border-radius: 0.75rem;
  padding: 1rem;
}

.modal-action {
  display: flex;
  justify-content: flex-end;
  gap: .5rem;
  margin-top: .5rem;
}
</style>