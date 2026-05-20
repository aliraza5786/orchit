<template>
  <Transition name="panel" appear>
    <div v-show="showPanel" :class="[
      'flex flex-col h-full overflow-y-auto bg-gradient-to-b from-bg-surface/95 to-bg-surface/90 backdrop-blur rounded-[6px] shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] border border-border overflow-hidden transition-all duration-300 ease-in-out',
      isExpanded ? 'min-w-full max-w-full' : 'min-w-full max-w-[380px] sm:min-w-[380px]'
    ]" role="complementary" aria-label="Details panel">

      <!-- Header -->
      <div class="sticky top-0 z-10 border-b border-border px-3 py-[5px] flex items-center justify-between bg-bg-surface">
        <h5 class="text-[18px] font-semibold tracking-tight">Details</h5>
        <div class="flex items-center gap-2">
          <button
            class="p-2 rounded-xl hover:bg-orchit-white/5 active:scale-[.98] cursor-pointer transition"
            @click="isExpanded = !isExpanded"
            :aria-label="isExpanded ? 'Collapse details' : 'Expand details'"
          >
            <i :class="['fa-solid', isExpanded ? 'fa-compress' : 'fa-expand', 'text-lg']"></i>
          </button>
          <button
            class="p-2 rounded-xl hover:bg-orchit-white/5 active:scale-[.98] cursor-pointer transition"
            @click="() => emit('close')"
            aria-label="Close details"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center h-40">
        <div class="animate-spin rounded-full h-8 w-8 border-4 border-primary-color border-t-transparent"></div>
      </div>

      <!-- Body -->
      <div v-else class="py-3 px-3 flex flex-col gap-5 flex-grow">

        <!-- ── Always-visible: Title ── -->
        <div class="capitalize">
          <div class="mb-2 text-base font-semibold tracking-wide px-1">Process Title</div>
          <div v-if="editingTitle" class="relative">
            <input
              ref="titleInput"
              v-model="localTitle"
              @blur="saveTitle"
              @keydown.enter.prevent="saveTitle"
              @keydown.esc.prevent="cancelEditTitle"
              class="w-full text-2xl font-semibold rounded-[6px] px-3 py-2 bg-orchit-white/5 border border-orchit-white/10 focus:outline-none focus:ring-2 focus:ring-primary-color/40 transition"
              type="text"
            />
          </div>
          <h2
            v-else
            class="text-[20px] leading-[28px] font-semibold tracking-tight rounded-[6px] px-2 py-2 hover:bg-bg-dropdown transition cursor-text border border-transparent hover:border-border"
            @click="editTitle"
          >
            {{ localTitle || 'Untitled' }}
          </h2>
        </div>

        <!-- ── Always-visible: Card Type ── -->
        <div class="space-y-2" v-if="!localTitle.toLowerCase().includes('general')">
          <div class="mb-2 text-base font-semibold tracking-wide px-1">Card Type</div>
          <BaseSelectField
            :options="cardTypeOptions"
            placeholder="Select Type"
            :model-value="localType"
            @update:modelValue="handleTypeChange"
            size="md"
          />
        </div>

        <!-- ── Always-visible: Workflow Preview ── -->
        <div v-if="processDetails?.raw_object?.flow_diagram" class="space-y-2">
          <div class="mb-2 text-base font-semibold tracking-wide px-1">Workflow Preview</div>
          <ProcessWorkflowPreview
            :workflow-data="processDetails.raw_object.flow_diagram"
            @open-builder="emit('open-builder')"
          />
        </div>

        <!-- ── Always-visible: Description ── -->
        <div>
          <h3 class="mb-2 text-base font-semibold tracking-wide px-1">Description</h3>
          <div
            v-if="!editingDesc"
            class="text-[15px] leading-6 text-text-secondary whitespace-pre-wrap rounded-[6px] px-4 py-3 border border-orchit-white/10 bg-orchit-white/5 hover:border-orchit-white/20 transition cursor-text"
            @click="startEditDesc"
          >
            <div v-if="localDesc" v-html="localDesc"></div>
            <span v-else class="opacity-60">Click to add a description…</span>
          </div>
          <div v-else ref="descEditorWrap" class="rounded-[6px] overflow-hidden border border-orchit-white/10 shadow-sm">
            <BaseTextAreaField v-model="localDesc" @focusOut="finishDescEdit" />
          </div>
        </div>

        <!-- ── Tabs (after description) ── -->
        <SwitchTab
          :inSpace="true"
          v-model="activeTab"
          :options="tabOptions"
          size="md"
        />

        <!-- ── Tab Sections ── -->
        <Transition name="section" mode="out-in">

          <!-- TAB: Details -->
          <section v-if="activeTab === 'details'" key="tab-details" class="flex flex-col gap-5">

            <!-- Workflow Stats -->
            <div class="space-y-4 mt-0">
              <!-- Metadata Grid -->
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 p-3 flex flex-col gap-1">
                  <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Group</span>
                  <span class="text-sm font-medium truncate">{{ processDetails?.group_id?.title || 'General' }}</span>
                </div>
                <div class="rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 p-3 flex flex-col gap-1">
                  <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Type</span>
                  <span class="text-sm font-medium truncate">{{ processDetails?.type_value || 'N/A' }}</span>
                </div>
                <div class="rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 p-3 flex flex-col gap-1">
                  <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Status</span>
                  <div class="flex items-center gap-2">
                    <div :class="['w-2 h-2 rounded-full', processDetails?.is_active ? 'bg-green-500' : 'bg-red-500']"></div>
                    <span class="text-sm font-medium">{{ processDetails?.is_active ? 'Active' : 'Inactive' }}</span>
                  </div>
                </div>
                <div class="rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 p-3 flex flex-col gap-1">
                  <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Active Version</span>
                  <span class="text-sm font-medium truncate flex items-center gap-1.5">
                    <i class="fa-solid fa-clock-rotate-left text-[10px] text-text-secondary" />
                    {{ activeVersionLabel }}
                  </span>
                </div>
                <div class="rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 p-3 flex flex-col gap-1">
                  <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Total Steps</span>
                  <span class="text-sm font-medium">{{ totalStatus }}</span>
                </div>
                <div class="rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 p-3 flex flex-col gap-1">
                  <span class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold">Total Transitions</span>
                  <span class="text-sm font-medium">{{ totalTransitions }}</span>
                </div>
              </div>

              <!-- Status Analysis -->
              <div v-if="processDetails?.flow_metadatas?.length" class="space-y-3">
                <h3 class="text-base font-semibold tracking-wide px-1">Status Breakdown</h3>
                <div class="space-y-2">
                  <div
                    v-for="status in processDetails.flow_metadatas"
                    :key="status._id"
                    class="group/item flex flex-col gap-2 p-3 rounded-[8px] bg-orchit-white/5 border border-orchit-white/10 hover:border-orchit-white/20 transition-all cursor-default"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold">{{ status.status }}</span>
                        <span v-if="status.is_start" class="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold uppercase tracking-tighter">Start</span>
                        <span v-if="status.is_end" class="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-bold uppercase tracking-tighter">End</span>
                      </div>
                      <span class="text-[10px] text-text-secondary">Position {{ status.position }}</span>
                    </div>

                    <div class="grid grid-cols-3 gap-2 mt-1">
                      <div class="flex flex-col">
                        <span class="text-[10px] uppercase text-text-secondary/70">Forward</span>
                        <span class="text-xs font-semibold">{{ status.forward_moves?.length || 0 }}</span>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-[10px] uppercase text-text-secondary/70">Backward</span>
                        <span class="text-xs font-semibold">{{ status.backward_moves?.length || 0 }}</span>
                      </div>
                      <div class="flex flex-col">
                        <span class="text-[10px] uppercase text-text-secondary/70">Total Moves</span>
                        <span class="text-xs font-semibold">{{ status.total_moves || 0 }}</span>
                      </div>
                    </div>

                    <!-- Jump-to statuses (tags) -->
                    <div v-if="status.forward_moves?.length" class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-for="move in status.forward_moves"
                        :key="move"
                        class="text-[9px] px-1.5 py-0.5 rounded bg-orchit-white/5 border border-orchit-white/10 text-text-secondary"
                      >
                        → {{ move }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ── TAB: Added Tickets ── -->
          <section v-else-if="activeTab === 'tickets'" key="tab-tickets" class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Tickets using this process
              </div>
              <div class="text-[11px] text-text-secondary bg-orchit-white/5 px-2 py-0.5 rounded-full border border-border">
                {{ staticTickets.length }} tickets
              </div>
            </div>

            <div class="space-y-2">
              <div
                v-for="ticket in staticTickets"
                :key="ticket.id"
                class="group flex items-start gap-3 p-3 rounded-xl bg-orchit-white/5 border border-border hover:bg-orchit-white/8 hover:border-orchit-white/20 transition-all duration-150 cursor-pointer"
              >
                <!-- Type icon -->
                <div class="mt-0.5 w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                  :class="ticket.typeColor">
                  <i :class="['text-[10px]', ticket.typeIcon]"></i>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-[11px] font-mono text-text-secondary">{{ ticket.code }}</span>
                    <span
                      class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter border"
                      :class="ticket.statusClass"
                    >
                      {{ ticket.status }}
                    </span>
                  </div>
                  <div class="text-[13px] font-medium text-text-primary leading-snug truncate">
                    {{ ticket.title }}
                  </div>
                  <div class="flex items-center gap-3 mt-1.5">
                    <div class="flex items-center gap-1 text-[10px] text-text-secondary">
                      <i class="fa-regular fa-user text-[9px]"></i>
                      <span>{{ ticket.assignee }}</span>
                    </div>
                    <div class="flex items-center gap-1 text-[10px] text-text-secondary">
                      <i class="fa-regular fa-calendar text-[9px]"></i>
                      <span>{{ ticket.date }}</span>
                    </div>
                  </div>
                </div>

                <i class="fa-solid fa-chevron-right text-[10px] text-text-secondary opacity-0 group-hover:opacity-60 transition-opacity mt-1 flex-shrink-0"></i>
              </div>
            </div>

            <!-- Empty hint -->
            <div class="py-2 px-3 rounded-lg bg-orchit-white/3 border border-dashed border-border text-[11px] text-text-secondary text-center">
              Showing static preview — real tickets will appear here once linked
            </div>
          </section>

          <!-- ── TAB: History ── -->
          <section v-else-if="activeTab === 'history'" key="tab-history" class="space-y-4">
            <div class="flex items-center justify-between">
              <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Change History
              </div>
              <div class="text-[11px] text-text-secondary bg-orchit-white/5 px-2 py-0.5 rounded-full border border-border">
                {{ staticHistory.length }} events
              </div>
            </div>

            <ol class="relative border-l border-border pl-5 space-y-4 ml-1">
              <li v-for="(h, i) in staticHistory" :key="i" class="group">
                <span class="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ring-4 ring-primary-color/10"
                  :class="h.dotColor || 'bg-primary-color/70'">
                </span>
                <div class="rounded-xl bg-orchit-white/5 border border-border p-3 hover:bg-orchit-white/8 transition">
                  <div class="flex items-center justify-between mb-1">
                    <div class="flex items-center gap-2">
                      <div class="w-5 h-5 rounded-full bg-primary-color/15 text-primary-color flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                        {{ initials(h.user) }}
                      </div>
                      <span class="text-[13px] font-semibold text-text-primary">{{ h.user }}</span>
                    </div>
                    <span class="text-[10px] text-text-secondary">{{ h.time }}</span>
                  </div>
                  <div class="text-[12px] text-text-secondary leading-snug">
                    <span class="text-text-primary font-medium">{{ h.action }}</span>
                    <span v-if="h.field"> on </span>
                    <span v-if="h.field" class="font-semibold text-text-primary">{{ h.field }}</span>
                    <span v-if="h.from && h.to">
                      &nbsp;from
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-orchit-white/5 border border-border text-[10px] font-mono">{{ h.from }}</span>
                      to
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-primary-color/10 border border-primary-color/20 text-primary-color text-[10px] font-mono">{{ h.to }}</span>
                    </span>
                  </div>
                </div>
              </li>
            </ol>

            <!-- Empty hint -->
            <div class="py-2 px-3 rounded-lg bg-orchit-white/3 border border-dashed border-border text-[11px] text-text-secondary text-center">
              Showing static preview — real history will stream here once connected
            </div>
          </section>

        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import { useProcessGroupsWithTransitions, useProcessTransition, useUpdateTransition, useFilteredCardTypes, useTransitionVersions } from '../../../queries/useProcess2'
import { useRouteIds } from '../../../composables/useQueryParams'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import ProcessWorkflowPreview from './ProcessWorkflowPreview.vue'

const SwitchTab = defineAsyncComponent(
  () => import('../../../components/ui/SwitchTab.vue')
)

const props = defineProps<{
  showPanel: boolean
  details: { _id: string; title: string; description?: string; [key: string]: any }
}>()

const emit = defineEmits(['close', 'open-builder'])

const isExpanded = ref(false)
const { workspaceId } = useRouteIds()

// ── Tab State ──────────────────────────────────────────────
const activeTab = ref<'details' | 'tickets' | 'history'>('details')

const tabOptions = [
  { label: 'Details',        value: 'details' },
  { label: 'Added Tickets',  value: 'tickets' },
  { label: 'History',        value: 'history' },
]

// ── Static Data (placeholder until real data is wired) ─────
const staticTickets = [
  {
    id: 1,
    code: 'TKT-0042',
    title: 'Onboarding flow needs approval gate before provisioning',
    status: 'In Progress',
    statusClass: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    assignee: 'Sarah M.',
    date: 'May 14, 2026',
    typeIcon: 'fa-solid fa-bolt',
    typeColor: 'bg-yellow-500/15 text-yellow-400',
  },
  {
    id: 2,
    code: 'TKT-0038',
    title: 'Review stage skipped when submitter is also approver',
    status: 'Open',
    statusClass: 'bg-orchit-white/10 text-text-secondary border-border',
    assignee: 'Hamza R.',
    date: 'May 10, 2026',
    typeIcon: 'fa-solid fa-bug',
    typeColor: 'bg-red-500/15 text-red-400',
  },
  {
    id: 3,
    code: 'TKT-0031',
    title: 'Add SLA timer to the pending-review transition step',
    status: 'Done',
    statusClass: 'bg-green-500/15 text-green-400 border-green-500/20',
    assignee: 'Aisha K.',
    date: 'Apr 28, 2026',
    typeIcon: 'fa-solid fa-circle-check',
    typeColor: 'bg-green-500/15 text-green-400',
  },
]

const staticHistory = [
  {
    user: 'Hamza Raza',
    action: 'Updated',
    field: 'Title',
    from: 'Draft Process',
    to: 'Approval Workflow',
    time: '2h ago',
    dotColor: 'bg-primary-color/70',
  },
  {
    user: 'Sarah Malik',
    action: 'Changed status',
    field: null,
    from: 'Inactive',
    to: 'Active',
    time: 'Yesterday',
    dotColor: 'bg-green-500/70',
  },
  {
    user: 'Aisha Khan',
    action: 'Added step',
    field: 'Pending Review',
    from: null,
    to: null,
    time: '3 days ago',
    dotColor: 'bg-blue-500/70',
  },
  {
    user: 'Hamza Raza',
    action: 'Created process',
    field: null,
    from: null,
    to: null,
    time: 'Apr 21, 2026',
    dotColor: 'bg-orchit-white/30',
  },
]

// ── Helpers ────────────────────────────────────────────────
const initials = (name: string) =>
  (name ?? '')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

// ── Data Fetching (unchanged) ──────────────────────────────
const processId = computed(() => props.details?._id)
const { data: processDetails, isLoading, refetch } = useProcessTransition(workspaceId, processId, {
  enabled: computed(() => !!processId.value && props.showPanel)
})

const { refetch: refetchAllTransitions } = useProcessGroupsWithTransitions(workspaceId, {
  enabled: computed(() => !!processId.value && props.showPanel)
})

const { data: cardTypes } = useFilteredCardTypes(workspaceId)
const cardTypeOptions = computed(() => {
  const opts = (cardTypes.value || []).map((t: any) => ({
    _id: t.slug || t.title || t._id,
    title: t.title
  }))
  return opts
})

const { data: versionsData } = useTransitionVersions(
  workspaceId,
  processId,
  { enabled: computed(() => !!processId.value && props.showPanel) }
)

const activeVersionLabel = computed(() => {
  const list = versionsData.value?.data || versionsData.value || []
  const active = list.find((v: any) => v.is_current_version)
  return active ? active.version_label || `v${active.version}` : 'v1'
})

// ── Local State Sync (unchanged) ──────────────────────────
const localTitle = ref('')
const localDesc = ref('')
const localType = ref('')

watch(() => processDetails.value, (val) => {
  if (val) {
    localTitle.value = val.title || ''
    localDesc.value = val.description || ''
    localType.value = val.type_value || ''
  }
}, { immediate: true })

// ── Stats (unchanged) ─────────────────────────────────────
const totalStatus = computed(() => {
  const raw = processDetails.value?.raw_object
  if (raw?.flow_diagram?.nodes && Array.isArray(raw.flow_diagram.nodes)) return raw.flow_diagram.nodes.length
  if (raw?.nodes && Array.isArray(raw.nodes)) return raw.nodes.length
  if (raw?.elements && Array.isArray(raw.elements)) return raw.elements.filter((e: any) => !e.source).length
  return 0
})

const totalTransitions = computed(() => {
  const raw = processDetails.value?.raw_object
  if (raw?.flow_diagram?.edges && Array.isArray(raw.flow_diagram.edges)) return raw.flow_diagram.edges.length
  if (raw?.edges && Array.isArray(raw.edges)) return raw.edges.length
  if (raw?.elements && Array.isArray(raw.elements)) return raw.elements.filter((e: any) => e.source && e.target).length
  return 0
})

// ── Mutations (unchanged) ─────────────────────────────────
const { mutate: updateTransition } = useUpdateTransition({
  onSuccess: () => {
    refetch()
    refetchAllTransitions()
  }
})

// ── Logic: Title (unchanged) ──────────────────────────────
const editingTitle = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)

function editTitle() {
  localTitle.value = processDetails.value?.title || props.details.title
  editingTitle.value = true
  nextTick(() => titleInput.value?.focus())
}

function saveTitle() {
  if (localTitle.value.trim() !== processDetails.value?.title) {
    updateTransition({
      workspace_id: workspaceId.value,
      transition_id: props.details._id,
      payload: { title: localTitle.value.trim() }
    })
  }
  editingTitle.value = false
}

function cancelEditTitle() {
  localTitle.value = processDetails.value?.title || ''
  editingTitle.value = false
}

// ── Logic: Description (unchanged) ────────────────────────
const editingDesc = ref(false)
const descEditorWrap = ref<HTMLElement | null>(null)

function startEditDesc() {
  editingDesc.value = true
}

function finishDescEdit() {
  if (localDesc.value !== processDetails.value?.description) {
    updateTransition({
      workspace_id: workspaceId.value,
      transition_id: props.details._id,
      payload: { description: localDesc.value }
    })
  }
  editingDesc.value = false
}

function onDocMouseDown(e: MouseEvent) {
  if (!editingDesc.value) return
  const target = e.target as Node
  if (descEditorWrap.value?.contains(target)) return
  finishDescEdit()
}
onMounted(() => document.addEventListener('mousedown', onDocMouseDown))
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMouseDown))

// ── Logic: Card Type (unchanged) ──────────────────────────
function handleTypeChange(val: any) {
  localType.value = val
  updateTransition({
    workspace_id: workspaceId.value,
    transition_id: props.details._id,
    payload: { type_value: val }
  })
}
</script>

<style scoped>
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(.98);
  filter: blur(2px);
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 200ms ease, transform 200ms ease, filter 200ms ease;
}

.section-enter-from,
.section-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.section-enter-active,
.section-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}
</style>