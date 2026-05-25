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
          <!-- ── TAB: Added Tickets ── -->
<section v-else-if="activeTab === 'tickets'" key="tab-tickets" class="space-y-4">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
      Tickets using this process
    </div>
    <div
      class="text-[11px] text-text-secondary bg-orchit-white/5 px-2 py-0.5 rounded-full border border-border"
      v-if="computedTickets.length"
    >
      {{ computedTickets.length }} ticket{{ computedTickets.length !== 1 ? 's' : '' }}
    </div>
  </div>

  <!-- Ticket list -->
  <div v-if="computedTickets.length" class="space-y-2">
    <div
      v-for="ticket in computedTickets"
      :key="ticket.id"
      class="group flex items-start gap-3 p-3 rounded-xl bg-orchit-white/5 border border-border hover:bg-orchit-white/8 hover:border-orchit-white/20 transition-all duration-150 cursor-pointer"
    >
      <!-- Type icon -->
      <div
        class="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        :class="ticket.typeColor"
      >
        <i :class="['text-[11px]', ticket.typeIcon]"></i>
      </div>

      <div class="flex-1 min-w-0">
        <!-- Code + status badge -->
        <div class="flex items-center gap-2 mb-1">
          <span class="text-[11px] font-mono text-text-secondary tracking-tight">{{ ticket.code }}</span>
          <span
            class="text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-tighter border"
            :class="ticket.statusClass"
          >
            {{ ticket.status }}
          </span>
        </div>
        <!-- Title -->
        <div class="text-[13px] font-medium text-text-primary leading-snug truncate">
          {{ ticket.title }}
        </div>
        <!-- Meta -->
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

  <!-- Empty state -->
  <div
    v-else
    class="flex flex-col items-center justify-center gap-3 py-10 px-4 rounded-xl border border-dashed border-orchit-white/10 bg-orchit-white/3"
  >
    <div class="w-10 h-10 rounded-full bg-orchit-white/5 border border-orchit-white/10 flex items-center justify-center">
      <i class="fa-regular fa-rectangle-list text-text-secondary text-base"></i>
    </div>
    <div class="text-center space-y-1">
      <p class="text-[13px] font-medium text-text-primary">No tickets linked</p>
      <p class="text-[11px] text-text-secondary leading-relaxed max-w-[200px]">
        Tickets that use this process will appear here once linked.
      </p>
    </div>
  </div>

</section>

<!-- ── TAB: History ── -->
<section v-else-if="activeTab === 'history'" key="tab-history" class="space-y-4">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="text-xs font-semibold text-text-secondary uppercase tracking-wider">
      Change History
    </div>
    <div
      class="text-[11px] text-text-secondary bg-orchit-white/5 px-2 py-0.5 rounded-full border border-border"
      v-if="computedHistory.length"
    >
      {{ computedHistory.length }} event{{ computedHistory.length !== 1 ? 's' : '' }}
    </div>
  </div>

  <!-- Timeline -->
  <ol v-if="computedHistory.length" class="space-y-3">
    <li
      v-for="(h, i) in computedHistory"
      :key="i"
      class="relative flex gap-3"
    >
      <!-- Dot + vertical line -->
      <div class="flex flex-col items-center flex-shrink-0">
        <div
          class="w-2.5 h-2.5 rounded-full mt-[14px] ring-[3px] ring-bg-surface flex-shrink-0"
          :class="h.dotColor || 'bg-primary-color/70'"
        ></div>
        <div
          v-if="i < computedHistory.length - 1"
          class="w-px flex-1 min-h-[16px] bg-border mt-1"
        ></div>
      </div>

      <!-- Card -->
      <div class="flex-1 pb-1">
        <div class="rounded-xl bg-orchit-white/5 border border-border p-3 hover:bg-orchit-white/8 hover:border-orchit-white/15 transition-all duration-150">

          <!-- Actor + time -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <div class="w-5 h-5 rounded-full bg-primary-color/15 text-primary-color flex items-center justify-center text-[9px] font-semibold flex-shrink-0 tracking-tight">
                {{ initials(h.user) }}
              </div>
              <span class="text-[12px] font-semibold text-text-primary truncate max-w-[140px]">{{ h.user }}</span>
            </div>
            <span class="text-[10px] text-text-secondary whitespace-nowrap">{{ h.time }}</span>
          </div>

          <!-- Action description -->
          <div class="text-[12px] text-text-secondary leading-snug flex flex-wrap items-center gap-x-1 gap-y-1">
            <!-- Action verb pill -->
            <span
              class="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border"
              :class="{
                'bg-blue-500/10 text-blue-400 border-blue-500/20':   h.dotColor === 'bg-blue-500/70',
                'bg-red-500/10 text-red-400 border-red-500/20':      h.dotColor === 'bg-red-500/70',
                'bg-green-500/10 text-green-400 border-green-500/20': h.dotColor === 'bg-green-500/70',
                'bg-primary-color/10 text-primary-color border-primary-color/20': !h.dotColor || h.dotColor === 'bg-primary-color/70',
              }"
            >
              <i
                class="text-[8px]"
                :class="{
                  'fa-solid fa-plus':           h.action.toLowerCase().includes('added'),
                  'fa-solid fa-minus':          h.action.toLowerCase().includes('removed'),
                  'fa-solid fa-pen':            h.action.toLowerCase().includes('updated'),
                  'fa-solid fa-arrow-right-arrow-left': h.action.toLowerCase().includes('changed'),
                  'fa-solid fa-bolt':           !h.action.toLowerCase().match(/added|removed|updated|changed/),
                }"
              ></i>
              {{ h.action }}
            </span>

            <!-- Field -->
            <template v-if="h.field">
              <span class="text-text-secondary text-[11px]">on</span>
              <span class="font-semibold text-text-primary text-[11px]">{{ h.field }}</span>
            </template>

            <!-- From → To chips -->
            <template v-if="h.from && h.to">
              <span class="text-text-secondary text-[11px] ml-0.5">from</span>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded-md bg-orchit-white/5 border border-border text-[10px] font-mono text-text-secondary line-through decoration-red-400/60">
                {{ h.from }}
              </span>
              <i class="fa-solid fa-arrow-right text-[8px] text-text-secondary/50"></i>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded-md bg-primary-color/10 border border-primary-color/20 text-primary-color text-[10px] font-mono">
                {{ h.to }}
              </span>
            </template>
          </div>

        </div>
      </div>
    </li>
  </ol>

  <!-- Empty state -->
  <div
    v-else
    class="flex flex-col items-center justify-center gap-3 py-10 px-4 rounded-xl border border-dashed border-orchit-white/10 bg-orchit-white/3"
  >
    <div class="w-10 h-10 rounded-full bg-orchit-white/5 border border-orchit-white/10 flex items-center justify-center">
      <i class="fa-regular fa-clock-rotate-left text-text-secondary text-base"></i>
    </div>
    <div class="text-center space-y-1">
      <p class="text-[13px] font-medium text-text-primary">No history yet</p>
      <p class="text-[11px] text-text-secondary leading-relaxed max-w-[200px]">
        Changes to this process will be recorded here automatically.
      </p>
    </div>
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
  details: { _id: string; title: string; description?: string; history?: any[]; cards?: any[]; [key: string]: any }
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

// ── Helpers ────────────────────────────────────────────────
const initials = (name: string) =>
  (name ?? '')
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Derived: History from real API data ────────────────────
//
// Each history entry has:
//   changes.flow_metadatas.from[]  — steps before
//   changes.flow_metadatas.to[]    — steps after
//
// We diff them to surface:
//   - added steps (in "to" but not "from")
//   - removed steps (in "from" but not "to")
//   - changed steps (same _id but different values)
//
// performed_by.u_email is used as the actor name.
// created_at is used for the timestamp.

interface MappedHistoryItem {
  user: string
  action: string
  field: string | null
  from: string | null
  to: string | null
  time: string
  dotColor: string
}

const computedHistory = computed<MappedHistoryItem[]>(() => {
  const raw: any[] = processDetails.value?.history ?? []
  if (!raw.length) return []

  const items: MappedHistoryItem[] = []

  for (const entry of raw) {
    const actor: string = entry.performed_by?.u_email ?? 'Unknown'
    const time: string = formatRelativeTime(entry.created_at)
    const changes = entry.changes ?? {}

    // ── flow_metadatas diff ──────────────────────────────
    if (changes.flow_metadatas) {
      const fromSteps: any[] = changes.flow_metadatas.from ?? []
      const toSteps: any[]   = changes.flow_metadatas.to   ?? []

      const fromMap = new Map(fromSteps.map((s: any) => [s._id, s]))
      const toMap   = new Map(toSteps.map((s: any) => [s._id, s]))

      // Added steps
      for (const step of toSteps) {
        if (!fromMap.has(step._id)) {
          items.push({
            user: actor,
            action: 'Added step',
            field: step.status,
            from: null,
            to: null,
            time,
            dotColor: 'bg-blue-500/70',
          })
        }
      }

      // Removed steps
      for (const step of fromSteps) {
        if (!toMap.has(step._id)) {
          items.push({
            user: actor,
            action: 'Removed step',
            field: step.status,
            from: null,
            to: null,
            time,
            dotColor: 'bg-red-500/70',
          })
        }
      }

      // Changed: forward_moves (transition target changed)
      for (const step of toSteps) {
        const prev = fromMap.get(step._id)
        if (!prev) continue

        const prevFwd = JSON.stringify(prev.forward_moves ?? [])
        const nextFwd = JSON.stringify(step.forward_moves ?? [])
        if (prevFwd !== nextFwd) {
          items.push({
            user: actor,
            action: 'Updated transition',
            field: step.status,
            from: (prev.forward_moves ?? []).join(', ') || '—',
            to:   (step.forward_moves  ?? []).join(', ') || '—',
            time,
            dotColor: 'bg-primary-color/70',
          })
        }

        // is_end changed (step gained/lost end status)
        if (prev.is_end !== step.is_end) {
          items.push({
            user: actor,
            action: 'Changed end status',
            field: step.status,
            from: prev.is_end ? 'End' : 'Not end',
            to:   step.is_end ? 'End' : 'Not end',
            time,
            dotColor: 'bg-green-500/70',
          })
        }
      }

      // Fallback: if none of the above fired but action is "updated"
      if (!items.length && entry.action) {
        items.push({
          user: actor,
          action: entry.action.charAt(0).toUpperCase() + entry.action.slice(1),
          field: `Version ${entry.version_label ?? entry.version_number}`,
          from: null,
          to: null,
          time,
          dotColor: 'bg-primary-color/70',
        })
      }
    }

    // ── raw_object diff (node/edge counts) ──────────────
    if (changes.raw_object && !changes.flow_metadatas) {
      const fromNodes: any[] = changes.raw_object.from?.flow_diagram?.nodes ?? []
      const toNodes: any[]   = changes.raw_object.to?.flow_diagram?.nodes ?? []
      const fromEdges: any[] = changes.raw_object.from?.flow_diagram?.edges ?? []
      const toEdges: any[]   = changes.raw_object.to?.flow_diagram?.edges ?? []

      if (toNodes.length !== fromNodes.length) {
        items.push({
          user: actor,
          action: 'Updated workflow nodes',
          field: null,
          from: `${fromNodes.length} nodes`,
          to:   `${toNodes.length} nodes`,
          time,
          dotColor: 'bg-primary-color/70',
        })
      }
      if (toEdges.length !== fromEdges.length) {
        items.push({
          user: actor,
          action: 'Updated workflow edges',
          field: null,
          from: `${fromEdges.length} edges`,
          to:   `${toEdges.length} edges`,
          time,
          dotColor: 'bg-blue-500/70',
        })
      }
    }
  }

  return items
})

// ── Derived: Tickets from real cards data ──────────────────
//
// Each card has:
//   variables['card-type']   → displayed as type/icon hint
//   variables['card-status'] → badge
//   created_at               → formatted date
//   created_by               → user id (no name available without lookup)
//
// Icon and color are derived from the card-type string.

interface MappedTicket {
  id: string
  code: string
  title: string
  status: string
  statusClass: string
  assignee: string
  date: string
  typeIcon: string
  typeColor: string
}

function cardStatusClass(status: string): string {
  const s = (status ?? '').toLowerCase()
  if (s.includes('progress') || s.includes('doing')) return 'bg-blue-500/15 text-blue-400 border-blue-500/20'
  if (s.includes('done') || s.includes('complete')) return 'bg-green-500/15 text-green-400 border-green-500/20'
  if (s.includes('block') || s.includes('hold')) return 'bg-red-500/15 text-red-400 border-red-500/20'
  // Default: "To Do" / "Open"
  return 'bg-orchit-white/10 text-text-secondary border-border'
}

function cardTypeIcon(type: string): { icon: string; color: string } {
  const t = (type ?? '').toLowerCase()
  if (t.includes('bug'))     return { icon: 'fa-solid fa-bug',          color: 'bg-red-500/15 text-red-400' }
  if (t.includes('feature')) return { icon: 'fa-solid fa-star',         color: 'bg-purple-500/15 text-purple-400' }
  if (t.includes('web'))     return { icon: 'fa-solid fa-globe',        color: 'bg-blue-500/15 text-blue-400' }
  if (t.includes('task'))    return { icon: 'fa-solid fa-circle-check', color: 'bg-green-500/15 text-green-400' }
  return { icon: 'fa-solid fa-bolt', color: 'bg-yellow-500/15 text-yellow-400' }
}

const computedTickets = computed<MappedTicket[]>(() => {
  const raw: any[] = processDetails.value?.cards ?? []
  return raw.map((card: any, _idx: number) => {
    const type   = card.variables?.['card-type']   ?? 'Task'
    const status = card.variables?.['card-status'] ?? 'Open'
    const { icon, color } = cardTypeIcon(type)

    // Generate a short code from the _id tail
    const shortId = (card._id ?? '').slice(-4).toUpperCase()

    return {
      id:          card._id,
      code:        `TKT-${shortId}`,
      title:       `${type} card — ${status}`,
      status,
      statusClass: cardStatusClass(status),
      assignee:    card.created_by ? `${(card.created_by as string).slice(-6).toUpperCase()}` : 'Unassigned',
      date:        formatDate(card.updated_at ?? card.created_at),
      typeIcon:    icon,
      typeColor:   color,
    }
  })
})

// ── Data Fetching ──────────────────────────────────────────
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

// ── Local State Sync ───────────────────────────────────────
const localTitle = ref('')
const localDesc  = ref('')
const localType  = ref('')

watch(() => processDetails.value, (val) => {
  if (val) {
    localTitle.value = val.title       || ''
    localDesc.value  = val.description || ''
    localType.value  = val.type_value  || ''
  }
}, { immediate: true })

// ── Stats ──────────────────────────────────────────────────
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

// ── Mutations ──────────────────────────────────────────────
const { mutate: updateTransition } = useUpdateTransition({
  onSuccess: () => {
    refetch()
    refetchAllTransitions()
  }
})

// ── Logic: Title ───────────────────────────────────────────
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

// ── Logic: Description ─────────────────────────────────────
const editingDesc = ref(false)
const descEditorWrap = ref<HTMLElement | null>(null)

function startEditDesc() { editingDesc.value = true }

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

// ── Logic: Card Type ───────────────────────────────────────
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