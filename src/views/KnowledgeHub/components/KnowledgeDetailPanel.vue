<template>
  <Transition name="panel" appear>
    <div
      v-show="showPanel"
      :class="[
        'flex flex-col h-full bg-gradient-to-b from-bg-surface/95 to-bg-surface/90 backdrop-blur rounded-[6px] shadow-[0_10px_40px_-10px_rgba(0,0,0,.1)] border border-border overflow-hidden transition-all duration-300 ease-in-out',
        isExpanded
          ? 'min-w-full max-w-full'
          : 'min-w-full max-w-[420px] sm:min-w-[420px]',
      ]"
      role="complementary"
      aria-label="Knowledge item details panel"
    >
      <!-- ── Loading skeleton ── -->
      <div
        v-if="isPending && !item"
        class="flex flex-col gap-5 p-6 animate-pulse"
      >
        <div class="h-8 bg-orchit-white/10 rounded-xl w-3/4"></div>
        <div class="space-y-2">
          <div class="h-4 bg-orchit-white/10 rounded w-full"></div>
          <div class="h-4 bg-orchit-white/10 rounded w-5/6"></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="h-20 bg-orchit-white/10 rounded-xl"></div>
          <div class="h-20 bg-orchit-white/10 rounded-xl"></div>
        </div>
      </div>

      <div v-else class="flex flex-col h-full min-h-0">

        <!-- ── Header ── -->
        <div class="flex-shrink-0 sticky top-0 z-10 border-b border-border px-3 py-[10px] flex items-center justify-between bg-bg-surface">
          <h5 class="text-[18px] font-semibold tracking-tight">Knowledge Item</h5>
          <div class="flex items-center gap-1">
            <!-- Expand / collapse -->
            <button
              class="shrink-0 hidden sm:flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
              @click="isExpanded = !isExpanded"
              :aria-label="isExpanded ? 'Collapse panel' : 'Expand panel'"
            >
              <i :class="['fa-solid', isExpanded ? 'fa-compress' : 'fa-expand', 'text-md']"></i>
            </button>
            <!-- Close -->
            <button
              class="shrink-0 flex items-center text-text-primary justify-center w-8 h-8 rounded-lg hover:bg-orchit-white/5 active:scale-[.98] transition-colors border-0 cursor-pointer"
              @click="emit('close')"
              aria-label="Close panel"
            >
              <i class="fa-solid fa-xmark text-md"></i>
            </button>
          </div>
        </div>

        <!-- ── Body ── -->
        <div class="flex-1 overflow-y-auto min-h-0">
          <div class="py-3 px-3 flex flex-col gap-3">

            <!-- Status badge + source type -->
            <div class="flex items-center justify-between gap-2">
              <span
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                :style="{ background: statusBg, color: statusColor, borderColor: statusColor + '33' }"
              >
                <span
                  v-if="item?.learning_status === 'indexed'"
                  class="flex h-1.5 w-1.5 relative"
                >
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                {{ item?.learning_status?.replace(/_/g, ' ') }}
              </span>
              <span class="flex items-center gap-1.5 text-[11px] text-text-secondary">
                <i :class="sourceIcon" class="text-[12px]"></i>
                <span class="capitalize">{{ sourceLabel }}</span>
              </span>
            </div>

            <!-- Title (editable) -->
            <div>
              <Transition name="fade-scale" mode="out-in">
                <input
                  v-if="editingTitle"
                  key="title-edit"
                  ref="titleInput"
                  v-model="localTitle"
                  :disabled="!canEditCard"
                  @keydown.enter.prevent="saveTitle"
                  @keydown.esc.prevent="cancelTitleEdit"
                  @blur="saveTitle"
                  class="w-full text-[18px] font-semibold rounded-xl px-3 py-2 bg-bg-body border border-border focus:outline-none focus:ring-2 focus:ring-primary-color/40 transition"
                  type="text"
                  aria-label="Edit title"
                />
                <h1
                  v-else
                  key="title-view"
                  :class="canEditCard ? 'cursor-text' : 'cursor-default'"
                  class="text-[18px] leading-[24px] break-words font-semibold tracking-tight rounded-lg px-2 py-1 hover:bg-bg-body transition"
                  @click="startEditTitle"
                  aria-label="Item title"
                >
                  {{ localTitle || 'Untitled' }}
                </h1>
              </Transition>
            </div>

            <!-- Description (editable) -->
            <div class="desc-section">
              <h3 class="mb-1 text-[11px] font-semibold uppercase tracking-widest text-text-secondary px-1">
                Description
              </h3>
              <Transition name="fade-scale" mode="out-in">
                <div
                  v-if="!editingDesc"
                  key="desc-view"
                  class="group relative rounded-lg px-3 py-2.5 transition-all duration-150 max-h-[300px] overflow-y-auto"
                  :class="canEditCard ? 'cursor-text hover:bg-bg-body hover:ring-1 hover:ring-bg-body/50' : 'cursor-default opacity-60'"
                  @click="startEditDesc"
                >
                  <div
                    v-if="localDescription"
                    v-html="localDescription"
                    class="word-break desc-rendered text-[14px] leading-6 text-text-primary"
                  ></div>
                  <div v-else class="flex items-center gap-2 text-text-secondary">
                    <i class="fa-regular fa-pen-to-square text-[13px] opacity-50"></i>
                    <span class="text-[14px] italic opacity-60">Add a description…</span>
                  </div>
                  <span
                    v-if="canEditCard && !localDescription"
                    class="absolute bottom-2 right-2 text-[10px] text-text-secondary opacity-0 group-hover:opacity-60 transition-opacity"
                  >Click to edit</span>
                </div>
                <div
                  v-else
                  key="desc-edit"
                  ref="descEditorWrap"
                  class="rounded-lg overflow-hidden ring-2 ring-primary-color/40 border border-primary-color/25 shadow-sm"
                >
                  <BaseRichTextEditor v-model="localDescription" />
                  <div class="flex items-center gap-2 px-3 py-2 border-t border-border bg-orchit-white/3">
                    <button
                      type="button"
                      class="px-3 py-1.5 rounded-md text-[13px] font-medium text-text-secondary bg-orchit-white/5 hover:bg-orchit-white/10 border border-border transition-all active:scale-95"
                      @click="cancelDescEdit"
                    >Cancel</button>
                    <button
                      type="button"
                      class="px-4 py-1.5 rounded-md bg-primary-color text-[13px] font-semibold text-white transition-all active:scale-95 hover:opacity-90"
                      @click="saveDesc"
                    >Save</button>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Tabs -->
            <SwitchTab
              :inSpace="true"
              v-model="activeTab"
              :options="tabOptions"
              size="md"
            />

            <!-- ── TAB: Details ── -->
            <Transition name="section" mode="out-in">
              <section v-if="activeTab === 'details'" key="tab-details" class="space-y-4">

                <!-- Meta tiles -->
                <div class="grid grid-cols-2 gap-3 text-sm">
                  <div class="rounded-xl bg-bg-body border border-border p-4">
                    <div class="text-xs uppercase tracking-wider text-text-secondary">Created</div>
                    <div class="mt-1 font-medium text-[13px]">{{ formatDate(item?.created_at) }}</div>
                  </div>
                  <div class="rounded-xl bg-bg-body border border-border p-4">
                    <div class="text-xs uppercase tracking-wider text-text-secondary">Updated</div>
                    <div class="mt-1 font-medium text-[13px]">{{ formatDate(item?.updated_at) }}</div>
                  </div>
                </div>

                <!-- Fields -->
                <div class="rounded-2xl border border-border bg-bg-body p-4 grid grid-cols-1 gap-4">

                  <!-- Scope -->
                  <div class="space-y-1.5">
                    <div class="text-xs uppercase tracking-wider text-text-secondary">Scope</div>
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        v-for="opt in scopeOptions"
                        :key="opt._id"
                        @click="canEditCard && updateField('scope_type', opt._id)"
                        class="text-[11px] px-3 py-1 rounded-full border transition-colors"
                        :class="[
                          item?.scope_type === opt._id
                            ? 'border-primary-color/40 bg-primary-color/10 text-primary-color font-medium'
                            : 'border-border bg-bg-surface text-text-secondary',
                          canEditCard ? 'cursor-pointer hover:bg-bg-surface' : 'cursor-default',
                        ]"
                      >{{ opt.title }}</span>
                    </div>
                  </div>

                  <!-- Visibility -->
                  <div class="space-y-1.5">
                    <div class="text-xs uppercase tracking-wider text-text-secondary">Visibility</div>
                    <BaseSelectField
                      :disabled="!canEditCard"
                      size="md"
                      :options="visibilityOptions"
                      placeholder="Select visibility"
                      :allowCustom="false"
                      :model-value="item?.visibility ?? null"
                      @update:modelValue="(v) => updateField('visibility', v as string)"
                    />
                  </div>

                  <!-- Knowledge Category -->
                  <div class="space-y-1.5">
                    <div class="text-xs uppercase tracking-wider text-text-secondary">Category</div>
                    <BaseSelectField
                      :disabled="!canEditCard"
                      size="md"
                      :options="categoryOptions"
                      placeholder="Select category"
                      :allowCustom="false"
                      :model-value="item?.knowledge_category ?? null"
                      @update:modelValue="(v) => updateField('knowledge_category', v as string)"
                    />
                  </div>

                  <!-- Source Type -->
                  <div class="space-y-1.5">
                    <div class="text-xs uppercase tracking-wider text-text-secondary">Source Type</div>
                    <BaseSelectField
                      :disabled="!canEditCard"
                      size="md"
                      :options="sourceTypeOptions"
                      placeholder="Select source type"
                      :allowCustom="false"
                      :model-value="item?.source_type ?? null"
                      @update:modelValue="(v) => updateField('source_type', v as string)"
                    />
                  </div>

                  <!-- Assigned Agents -->
                  <div v-if="item?.assigned_agents?.length" class="space-y-1.5">
                    <div class="text-xs uppercase tracking-wider text-text-secondary">Assigned Agents</div>
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        v-for="agent in item.assigned_agents"
                        :key="agent._id || agent.name"
                        class="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-bg-surface border border-border text-text-secondary"
                      >
                        <i class="fa-solid fa-robot text-[10px]"></i>
                        {{ agent.name }}
                      </span>
                    </div>
                  </div>

                </div>

                <!-- Action buttons based on status -->
                <div class="flex flex-col gap-2">
                  <div
                    v-if="item?.learning_status === 'draft' || item?.learning_status === 'pending_review'"
                    class="grid grid-cols-2 gap-2"
                  >
                    <button
                      @click="emit('approve', item)"
                      :disabled="!canEditCard"
                      class="py-2 px-4 text-sm font-semibold rounded-lg border border-primary-color/30 bg-primary-color/10 text-primary-color hover:bg-primary-color/20 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i class="fa-solid fa-check text-xs"></i>
                      Approve
                    </button>
                    <button
                      @click="emit('reject', item)"
                      :disabled="!canEditCard"
                      class="py-2 px-4 text-sm font-semibold rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <i class="fa-solid fa-xmark text-xs"></i>
                      Reject
                    </button>
                  </div>

                  <button
                    v-if="item?.learning_status === 'indexed' || item?.learning_status === 'failed'"
                    @click="emit('reindex', item)"
                    class="w-full py-2 px-4 text-sm font-semibold rounded-lg border border-border bg-bg-body text-text-secondary hover:text-primary-color hover:border-primary-color/30 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <i class="fa-solid fa-arrows-rotate text-xs"></i>
                    Re-index
                  </button>

                  <button
                    v-if="item?.learning_status === 'indexed'"
                    @click="emit('view-chunks', item)"
                    class="w-full py-2 px-4 text-sm font-semibold rounded-lg border border-border bg-bg-body text-text-secondary hover:text-primary-color hover:border-primary-color/30 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <i class="fa-solid fa-puzzle-piece text-xs"></i>
                    View Chunks
                  </button>

                  <button
                    v-if="item?.learning_status === 'archived'"
                    @click="emit('unarchive', item)"
                    class="w-full py-2 px-4 text-sm font-semibold rounded-lg border border-violet-500/30 bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <i class="fa-solid fa-box-open text-xs"></i>
                    Unarchive
                  </button>

                  <div v-if="canEditCard || canDeleteCard" class="flex gap-2 pt-1">
                    <button
                      v-if="canEditCard"
                      @click="emit('edit', item as any)"
                      class="flex-1 py-2 px-4 text-sm font-semibold text-white bg-primary-color rounded-lg border border-primary-color active:scale-95 transition-all duration-150 flex items-center justify-center gap-2"
                    >
                      <i class="fa-solid fa-pen text-xs"></i>
                      Edit
                    </button>
                    <button
                      v-if="item?.learning_status !== 'archived' && canEditCard"
                      @click="emit('archive', item as any)"
                      class="py-2 px-3 text-sm rounded-lg border border-border bg-bg-body text-text-secondary hover:text-text-primary hover:border-border active:scale-95 transition-all duration-150"
                      title="Archive"
                    >
                      <i class="fa-solid fa-box-archive text-xs"></i>
                    </button>
                    <button
                      v-if="canDeleteCard"
                      @click="emit('delete', item as any)"
                      class="py-2 px-3 text-sm rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/15 active:scale-95 transition-all duration-150"
                      title="Delete"
                    >
                      <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                  </div>
                </div>

              </section>

              <!-- ── TAB: Content ── -->
              <section v-else-if="activeTab === 'content'" key="tab-content" class="space-y-4">

                <!-- URL source -->
                <div v-if="item?.source_type === 'url' && item?.url" class="rounded-xl border border-border bg-bg-body p-4 flex items-center gap-3">
                  <i class="fa-solid fa-link text-primary-color flex-shrink-0"></i>
                  <a
                    :href="item.url"
                    target="_blank"
                    rel="noopener"
                    class="text-[13px] text-primary-color hover:underline truncate flex-1"
                  >{{ item.url }}</a>
                  <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-text-secondary flex-shrink-0"></i>
                </div>

                <!-- Raw content preview -->
                <div v-if="item?.content" class="rounded-xl border border-border bg-bg-body p-4">
                  <div class="text-xs uppercase tracking-wider text-text-secondary mb-3">Content Preview</div>
                  <div
                    v-html="item.content"
                    class="word-break text-[13px] leading-6 text-text-primary max-h-[400px] overflow-y-auto"
                  ></div>
                </div>

                <!-- Chunks count if indexed -->
                <div v-if="item?.learning_status === 'indexed' && item?.chunk_count" class="rounded-xl border border-border bg-bg-body p-4">
                  <div class="text-xs uppercase tracking-wider text-text-secondary mb-2">Indexed Chunks</div>
                  <div class="flex items-center gap-2">
                    <i class="fa-solid fa-puzzle-piece text-primary-color text-[13px]"></i>
                    <span class="font-semibold text-[15px]">{{ item.chunk_count }}</span>
                    <span class="text-[12px] text-text-secondary">chunks indexed</span>
                  </div>
                  <button
                    @click="emit('view-chunks', item)"
                    class="mt-3 w-full py-1.5 px-3 text-[12px] rounded-lg border border-border bg-bg-surface text-text-secondary hover:text-primary-color hover:border-primary-color/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <i class="fa-solid fa-eye text-[11px]"></i>
                    View all chunks
                  </button>
                </div>

                <!-- Empty state -->
                <div
                  v-if="!item?.content && !item?.url && item?.source_type !== 'file'"
                  class="py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl bg-orchit-white/2"
                >
                  <i class="fa-regular fa-file-lines text-3xl text-text-secondary opacity-40 mb-3"></i>
                  <p class="text-sm text-text-secondary opacity-60">No content available</p>
                  <p class="text-[11px] text-text-secondary opacity-40 mt-1">Content will appear once indexed</p>
                </div>

              </section>

              <!-- ── TAB: History ── -->
              <section v-else-if="activeTab === 'history'" key="tab-history" class="space-y-4">
                <h3 class="text-sm font-semibold tracking-wide">History</h3>
                <div v-if="item?.history?.length">
                  <ol class="relative border-l border-border pl-5 space-y-4 ml-1">
                    <li v-for="(h, i) in item.history" :key="i" class="group">
                      <span class="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-primary-color/70 ring-4 ring-primary-color/10"></span>
                      <div class="rounded-xl bg-orchit-white/5 border border-border p-3 hover:bg-orchit-white/7 transition">
                        <div class="flex items-center gap-2 mb-1">
                          <div class="h-5 w-5 rounded-full bg-primary-color/15 text-primary-color flex items-center justify-center text-[9px] font-semibold">
                            {{ initials(h.user?.u_full_name) }}
                          </div>
                          <span class="text-[12px] font-semibold">{{ h.user?.u_full_name }}</span>
                          <span class="text-[11px] text-text-secondary ml-auto">{{ formatDate(h.created_at) }}</span>
                        </div>
                        <p class="text-[12px] text-text-secondary">
                          Changed <span class="font-medium text-text-primary">{{ h.field_name }}</span>
                        </p>
                      </div>
                    </li>
                  </ol>
                </div>
                <div
                  v-else
                  class="py-12 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl bg-orchit-white/2"
                >
                  <i class="fa-regular fa-clock text-3xl text-text-secondary opacity-40 mb-3"></i>
                  <p class="text-sm text-text-secondary opacity-60">No history yet</p>
                </div>
              </section>

            </Transition>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  nextTick,
  defineAsyncComponent,
} from 'vue'
import { usePermissions } from '../../../composables/usePermissions'
import { toast } from 'vue-sonner'
import {
  useUpdateKnowledgeItem,
  type KnowledgeItem,
  type UpdateKnowledgeItemPayload,
} from '../../../queries/useKnowledgeHub'
import { useRouteIds } from '../../../composables/useQueryParams.ts'
const { workspaceId } = useRouteIds();
// ─── Async component imports ──────────────────────────────────────────────────
const BaseRichTextEditor = defineAsyncComponent({
  loader: () => import('../../../components/ui/BaseRichTextEditor.vue'),
  loadingComponent: {
    template: '<div class="h-20 w-full animate-pulse bg-neutral-700/30 rounded-lg"></div>',
  },
  delay: 200,
})
const BaseSelectField = defineAsyncComponent(
  () => import('../../../components/ui/BaseSelectField.vue'),
)
const SwitchTab = defineAsyncComponent(
  () => import('../../../components/ui/SwitchTab.vue'),
)

// ─── Props / Emits ────────────────────────────────────────────────────────────
const props = defineProps<{
  item: (KnowledgeItem & Record<string, any>) | null
  showPanel?: boolean
  isPending?: boolean
}>()

const emit = defineEmits<{
  close: []
  approve:       [item: KnowledgeItem]
  reject:        [item: KnowledgeItem]
  archive:       [item: KnowledgeItem]
  unarchive:     [item: KnowledgeItem]
  delete:        [item: KnowledgeItem]
  reindex:       [item: KnowledgeItem]
  'view-chunks': [item: KnowledgeItem]
  edit:          [item: KnowledgeItem]
}>()

// ─── Permissions ──────────────────────────────────────────────────────────────
const { canEditCard, canDeleteCard } = usePermissions()

// ─── Mutation ─────────────────────────────────────────────────────────────────
const { mutateAsync: updateItem } = useUpdateKnowledgeItem()

// ─── Shared save helper ───────────────────────────────────────────────────────
const isSaving = ref(false)

// Change persistUpdate signature from Partial<KnowledgeItem> → Partial<UpdateKnowledgeItemPayload>
async function persistUpdate(payload: Partial<Omit<UpdateKnowledgeItemPayload, 'workspace_id'>>) {
  if (!props.item) return

  isSaving.value = true

  try {
    await updateItem({
      id: props.item._id,
      payload: {
        workspace_id: workspaceId.value,   // ← use props.workspaceId, not composable
        ...payload,
      },
    })

    toast.success('Knowledge item updated')
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to update item')
  } finally {
    isSaving.value = false
  }
}

// ─── Panel state ──────────────────────────────────────────────────────────────
const isExpanded = ref(false)
const activeTab  = ref<'details' | 'content' | 'history'>('details')

const tabOptions = [
  { label: 'Details', value: 'details' },
  { label: 'Content', value: 'content' },
  { label: 'History', value: 'history' },
]

// ─── Local editable fields ────────────────────────────────────────────────────
const localTitle       = ref(props.item?.name ?? '')
const localDescription = ref(props.item?.description ?? '')
const editingTitle     = ref(false)
const editingDesc      = ref(false)
const descSnapshot     = ref('')
const titleInput       = ref<HTMLInputElement | null>(null)
const descEditorWrap   = ref<HTMLElement | null>(null)

watch(
  () => props.item,
  (newItem) => {
    if (!editingTitle.value) localTitle.value       = newItem?.name        ?? ''
    if (!editingDesc.value)  localDescription.value = newItem?.description ?? ''
  },
  { immediate: true },
)

// ── Title edit ────────────────────────────────────────────────────────────────
function startEditTitle() {
  if (!canEditCard.value) return
  editingTitle.value = true
  nextTick(() => titleInput.value?.focus())
}

async function saveTitle() {
  const newTitle = localTitle.value.trim()
  editingTitle.value = false
  if (!newTitle || !props.item) return
  if (newTitle === props.item.name) return   // no change — skip the call
  await persistUpdate({ title: newTitle })
}

function cancelTitleEdit() {
  localTitle.value   = props.item?.name ?? ''
  editingTitle.value = false
}

// ── Description edit ──────────────────────────────────────────────────────────
async function startEditDesc() {
  if (!canEditCard.value) return
  descSnapshot.value = localDescription.value
  editingDesc.value  = true
  await nextTick()
  const pm = descEditorWrap.value?.querySelector('.ProseMirror') as HTMLElement | null
  pm?.focus()
}

function cancelDescEdit() {
  localDescription.value = descSnapshot.value
  editingDesc.value      = false
}

async function saveDesc() {
  editingDesc.value = false
  if (!props.item) return
  const normalize = (h: string) => h.replace(/<p><\/p>/g, '').trim()
  const next = normalize(localDescription.value || '')
  const prev = normalize(props.item?.description || '')
  if (next === prev) return   // no change — skip the call
  await persistUpdate({ description: next || undefined })
}

// updateField: needs a cast since field is a loose string
async function updateField(field: keyof Omit<UpdateKnowledgeItemPayload, 'workspace_id'>, value: any) {
  if (!props.item) return
  await persistUpdate({ [field]: value })
}

// ─── Status styling ───────────────────────────────────────────────────────────
const statusMap: Record<string, { bg: string; color: string }> = {
  draft:          { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
  pending_review: { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  approved:       { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  indexed:        { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  rejected:       { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
  archived:       { bg: 'rgba(139,92,246,0.12)',  color: '#8b5cf6' },
  failed:         { bg: 'rgba(220,38,38,0.12)',   color: '#dc2626' },
}

const statusBg    = computed(() => statusMap[props.item?.learning_status ?? '']?.bg    ?? 'rgba(107,114,128,0.12)')
const statusColor = computed(() => statusMap[props.item?.learning_status ?? '']?.color ?? '#6b7280')

// ─── Source type icon / label ─────────────────────────────────────────────────
const sourceTypeMap: Record<string, { icon: string; label: string }> = {
  file:               { icon: 'fa-solid fa-file',          label: 'File' },
  url:                { icon: 'fa-solid fa-link',           label: 'URL' },
  text:               { icon: 'fa-solid fa-align-left',     label: 'Text' },
  note:               { icon: 'fa-solid fa-note-sticky',    label: 'Note' },
  log:                { icon: 'fa-solid fa-list',           label: 'Log' },
  comment:            { icon: 'fa-solid fa-comment',        label: 'Comment' },
  api:                { icon: 'fa-solid fa-code',           label: 'API' },
  database:           { icon: 'fa-solid fa-database',       label: 'Database' },
  agent_chat:         { icon: 'fa-solid fa-robot',          label: 'Agent Chat' },
  agent_feedback:     { icon: 'fa-solid fa-star',           label: 'Feedback' },
  agent_action:       { icon: 'fa-solid fa-bolt',           label: 'Action' },
  agent_memory:       { icon: 'fa-solid fa-brain',          label: 'Memory' },
  analytical_insight: { icon: 'fa-solid fa-chart-line',     label: 'Insight' },
  pdf:                { icon: 'fa-solid fa-file-pdf',       label: 'PDF' },
  docx:               { icon: 'fa-solid fa-file-word',      label: 'Word' },
  image:              { icon: 'fa-solid fa-image',          label: 'Image' },
  screenshot:         { icon: 'fa-solid fa-camera',         label: 'Screenshot' },
  manual:             { icon: 'fa-solid fa-pen',            label: 'Manual' },
}

const sourceIcon  = computed(() => sourceTypeMap[props.item?.source_type ?? '']?.icon  ?? 'fa-solid fa-file')
const sourceLabel = computed(() => sourceTypeMap[props.item?.source_type ?? '']?.label ?? (props.item?.source_type ?? ''))

// ─── Select options ────────────────────────────────────────────────────────────
const scopeOptions = [
  { _id: 'workspace', title: 'Workspace' },
  { _id: 'module',    title: 'Module' },
  { _id: 'sheet',     title: 'Sheet' },
  { _id: 'card',      title: 'Card' },
  { _id: 'agent',     title: 'Agent' },
  { _id: 'user',      title: 'User' },
]

const visibilityOptions = [
  { _id: 'private',    title: 'Private' },
  { _id: 'team',       title: 'Team' },
  { _id: 'workspace',  title: 'Workspace' },
  { _id: 'agent_only', title: 'Agent Only' },
]

const categoryOptions = [
  { _id: 'uploaded',       title: 'Uploaded' },
  { _id: 'linked',         title: 'Linked' },
  { _id: 'manual',         title: 'Manual' },
  { _id: 'operational',    title: 'Operational' },
  { _id: 'conversation',   title: 'Conversation' },
  { _id: 'behavioral',     title: 'Behavioral' },
  { _id: 'analytical',     title: 'Analytical' },
  { _id: 'agent_chat',     title: 'Agent Chat' },
  { _id: 'agent_feedback', title: 'Agent Feedback' },
  { _id: 'agent_action',   title: 'Agent Action' },
  { _id: 'agent_memory',   title: 'Agent Memory' },
]

const sourceTypeOptions = [
  { _id: 'file',               title: 'File' },
  { _id: 'url',                title: 'URL' },
  { _id: 'text',               title: 'Text' },
  { _id: 'note',               title: 'Note' },
  { _id: 'log',                title: 'Log' },
  { _id: 'comment',            title: 'Comment' },
  { _id: 'api',                title: 'API' },
  { _id: 'database',           title: 'Database' },
  { _id: 'agent_chat',         title: 'Agent Chat' },
  { _id: 'agent_feedback',     title: 'Agent Feedback' },
  { _id: 'agent_action',       title: 'Agent Action' },
  { _id: 'agent_memory',       title: 'Agent Memory' },
  { _id: 'analytical_insight', title: 'Analytical Insight' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const initials = (n?: string) =>
  (n ?? '').split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
</script>

<style scoped>
.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateX(24px) scale(0.98);
  filter: blur(2px);
}
.panel-enter-active,
.panel-leave-active {
  transition: opacity 200ms ease, transform 200ms ease, filter 200ms ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
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

.word-break :deep(p) {
  overflow-wrap: break-word !important;
}
.word-break :deep(a) {
  color: var(--primary-color) !important;
  text-decoration: underline !important;
}
.word-break :deep(img) {
  margin: 12px 0;
  border-radius: 8px;
  display: block;
  max-width: 100%;
}
</style>