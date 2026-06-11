<template>
  <BaseModal :inSpace="true" v-model="isOpen" modalClass="!p-0 !gap-0" :title="''" :hideTitle="true" size="lg">

    <div class="flex" style="height: 580px;">

      <!-- ── Sidebar ── -->
      <div class="w-[200px] flex-shrink-0 flex flex-col border-r border-border bg-bg-surface">
        <div class="px-4 pt-5 pb-4 border-b border-border">
          <h2 class="text-sm font-semibold text-card-foreground">Add Knowledge</h2>
          <p class="text-[11px] text-text-secondary mt-0.5">Choose a source</p>
        </div>

        <nav class="flex flex-col gap-0.5 p-2 flex-1">
          <button
            v-for="src in sourceModes"
            :key="src.mode"
            @click="selectMode(src.mode)"
            class="flex items-start gap-2.5 px-3 py-2.5 rounded-md text-left w-full transition-colors"
            :class="mode === src.mode
              ? 'bg-primary-color/10'
              : 'hover:bg-bg-body'"
          >
            <i :class="src.icon" class="text-[14px] mt-0.5 flex-shrink-0" :style="mode === src.mode ? 'color: var(--primary-color)' : 'color: var(--text-secondary)'"></i>
            <div>
              <div
                class="text-[12px] font-medium leading-tight"
                :style="mode === src.mode ? 'color: var(--primary-color)' : ''"
                :class="mode === src.mode ? '' : 'text-card-foreground'"
              >
                {{ src.label }}
              </div>
              <div class="text-[10px] mt-0.5 leading-tight text-text-secondary">
                {{ src.sub }}
              </div>
            </div>
          </button>
        </nav>
      </div>

      <!-- ── Main panel ── -->
      <div class="flex flex-col flex-1 min-w-0">

        <!-- Panel header -->
        <div class="flex-shrink-0 px-5 py-4 border-b border-border">
          <h3 class="text-sm font-semibold text-card-foreground">{{ modeTitle }}</h3>
          <p class="text-[11px] text-text-secondary mt-0.5">{{ modeSubtitle }}</p>
        </div>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4" style="min-height: 0;">

          <!-- FILE mode -->
          <template v-if="mode === 'file'">
            <div class="flex flex-col gap-1">
              <label class="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                File <span class="text-red-400">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.csv,.xlsx,.xls"
                @change="handleFileChange"
                class="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary-color/10 file:text-primary-color hover:file:bg-primary-color/20 cursor-pointer border border-border rounded-lg px-3 py-2 bg-bg-input"
              />
              <p class="text-[10px] text-text-secondary mt-0.5">Supported: PDF, DOCX, TXT, MD, CSV, XLSX · Max 20 MB</p>
            </div>
            <BaseTextField v-model="form.title" label="Title (optional)" placeholder="Defaults to filename" />
          </template>

          <!-- URL mode -->
          <template v-else-if="mode === 'url'">
            <BaseTextField
              v-model="form.url"
              label="URL"
              placeholder="https://example.com/page"
              :error="!!urlError"
              :message="urlError"
            />
            <BaseTextField v-model="form.title" label="Title (optional)" placeholder="Defaults to URL" />
          </template>

          <!-- TEXT / NOTE mode -->
          <template v-else-if="mode === 'text'">
            <BaseTextField
              v-model="form.title"
              label="Title"
              placeholder="Note title"
              :error="touched.title && !form.title.trim()"
              message="Title is required"
            />
            <div>
              <BaseRichTextEditor
                label="Content"
                placeholder="Paste or write your content here… (min 10 characters)"
                v-model="form.content"
                @blur="touched.content = true"
              />
              <p class="text-[10px] text-text-secondary mt-1">{{ form.content?.length ?? 0 }} / 100,000 chars</p>
            </div>
          </template>

          <!-- MANUAL DRAFT mode -->
          <template v-else-if="mode === 'create'">
            <div>
              <label class="block text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-1.5">
                Notes <span class="text-text-secondary font-normal normal-case">(optional)</span>
              </label>
              <textarea
                v-model="form.description"
                placeholder="Leave empty to populate later."
                rows="3"
                class="w-full text-xs px-3 py-2 rounded-lg border border-border bg-bg-input text-card-foreground placeholder:text-text-secondary resize-none focus:outline-none focus:border-primary-color/60 transition-colors"
              ></textarea>
            </div>
            <BaseTextField
              v-model="form.title"
              label="Title *"
              placeholder="e.g. Q4 Onboarding Plan"
              :error="touched.title && !form.title.trim()"
              message="Title is required"
            />
          </template>

          <!-- Description (all modes except create) -->
          <div v-if="mode !== 'create'">
            <BaseRichTextEditor
              label="Description (optional)"
              placeholder="Short description or notes…"
              v-model="form.description"
            />
          </div>

          <!-- Scope + Category -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-2">Scope</label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="opt in scopeOptions"
                  :key="opt._id"
                  type="button"
                  @click="form.scope_type = opt._id as ScopeType"
                  class="text-[11px] px-3 py-1 rounded-full border transition-colors"
                  :class="form.scope_type === opt._id
                    ? 'border-primary-color/40 bg-primary-color/10 text-primary-color font-medium'
                    : 'border-border bg-bg-surface text-text-secondary hover:bg-bg-body'"
                >
                  {{ opt.title }}
                </button>
              </div>
            </div>

            <BaseSelectField
              size="md"
              label="Knowledge Category"
              :options="categoryOptions"
              :model-value="form.knowledge_category"
              @update:modelValue="form.knowledge_category = ($event as KnowledgeCategory)"
              :allowCustom="false"
              placeholder="Select category"
            />
          </div>

          <!-- Initial Status (create mode only) -->
          <div v-if="mode === 'create'">
            <label class="block text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-2">Initial Status</label>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="opt in initialStatusOptions"
                :key="opt._id"
                type="button"
                @click="form.initial_status = opt._id"
                class="text-[11px] px-3 py-1 rounded-full border transition-colors"
                :class="form.initial_status === opt._id
                  ? 'border-primary-color/40 bg-primary-color/10 text-primary-color font-medium'
                  : 'border-border bg-bg-surface text-text-secondary hover:bg-bg-body'"
              >
                {{ opt.title }}
              </button>
            </div>
          </div>

          <!-- Source Type + Visibility (create mode only) -->
          <div v-if="mode === 'create'" class="grid grid-cols-2 gap-4">
            <BaseSelectField
              size="md"
              label="Source Type"
              :options="sourceTypeOptions"
              :model-value="form.source_type"
              @update:modelValue="form.source_type = ($event as SourceType)"
              :allowCustom="false"
              placeholder="Select source type"
            />
            <BaseSelectField
              size="md"
              label="Visibility"
              :options="visibilityOptions"
              :model-value="form.visibility"
              @update:modelValue="form.visibility = ($event as 'workspace')"
              :allowCustom="false"
              placeholder="Select visibility"
            />
          </div>

          <!-- Tags -->
          <div>
            <label class="block text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-2">
              <i class="fa-solid fa-tag mr-1 text-[10px]"></i>Tags
            </label>
            <div
              class="flex flex-wrap gap-1.5 min-h-[36px] px-2.5 py-1.5 rounded-lg border border-border bg-bg-input cursor-text transition-colors focus-within:border-primary-color/60"
              @click="focusTagInput"
            >
              <span
                v-for="(tag, i) in form.tags"
                :key="i"
                class="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary-color/10 text-primary-color"
              >
                {{ tag }}
                <button
                  type="button"
                  @click.stop="removeTag(i)"
                  class="text-primary-color/60 hover:text-primary-color leading-none"
                  aria-label="Remove tag"
                >
                  <i class="fa-solid fa-xmark text-[9px]"></i>
                </button>
              </span>
              <input
                ref="tagInputRef"
                v-model="tagInput"
                @keydown.enter.prevent="addTag"
                @keydown.backspace="handleBackspace"
                placeholder="Press enter to add tag"
                class="text-[11px] bg-transparent border-none outline-none text-card-foreground placeholder:text-text-secondary flex-1 min-w-[120px]"
              />
            </div>
          </div>

        </div>

        <!-- ── Footer — sits OUTSIDE the scrollable div, always visible ── -->
        <div class="flex-shrink-0 flex items-center justify-between gap-2 px-5 py-3 border-t border-border bg-bg-surface">
          <span class="text-[11px] text-text-secondary">Will be saved as a knowledge entry</span>
          <div class="flex items-center gap-2">
            <Button :inSpace="true" variant="secondary" @click="isOpen = false">Cancel</Button>
            <Button
              :inSpace="true"
              variant="primary"
              :disabled="isSubmitting || !canSubmit"
              @click="submit"
            >
              <i class="fa-solid fa-check mr-1 text-[11px]"></i>
              {{ isSubmitting ? 'Processing…' : submitLabel }}
            </Button>
          </div>
        </div>

      </div>
    </div>

  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, reactive, nextTick } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import BaseRichTextEditor from '../../../components/ui/BaseRichTextEditor.vue'
import Button from '../../../components/ui/Button.vue'
import { toast } from 'vue-sonner'
import {
  useIngestFile,
  useIngestUrl,
  useIngestText,
  useCreateKnowledgeItem,
  type ScopeType,
  type KnowledgeCategory,
  type SourceType,
} from '../../../queries/useKnowledgeHub'

const props = defineProps<{
  modelValue: boolean
  mode: 'file' | 'url' | 'text' | 'create'
  workspaceId: string
  scopeType: ScopeType
  filterOptions: any
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  success: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// ─── Internal mode (driven by sidebar, seeds from prop) ───────────────────────
const mode = ref<'file' | 'url' | 'text' | 'create'>(props.mode)

function selectMode(m: 'file' | 'url' | 'text' | 'create') {
  mode.value = m
  if (m !== 'file') selectedFile.value = null
}

// ─── Sidebar source options ───────────────────────────────────────────────────
const sourceModes = [
  { mode: 'file'   as const, label: 'Upload File',  sub: 'PDF, DOCX, PPT, images',    icon: 'fa-solid fa-upload' },
  { mode: 'url'    as const, label: 'Add URL',       sub: 'Web pages, docs, articles', icon: 'fa-solid fa-link' },
  { mode: 'text'   as const, label: 'Write Note',    sub: 'Markdown notes, snippets',  icon: 'fa-solid fa-pencil' },
  { mode: 'create' as const, label: 'Manual Draft',  sub: 'Empty draft to fill later', icon: 'fa-regular fa-file' },
]

// ─── Form ─────────────────────────────────────────────────────────────────────
const form = reactive({
  title: '',
  description: '',
  content: '',
  url: '',
  scope_type: props.scopeType as ScopeType,
  knowledge_category: 'uploaded' as KnowledgeCategory,
  source_type: 'file' as SourceType,
  visibility: 'workspace' as 'private' | 'team' | 'workspace' | 'agent_only',
  initial_status: 'draft' as string,
  tags: [] as string[],
})

const touched      = reactive({ title: false, content: false })
const selectedFile = ref<File | null>(null)
const tagInput     = ref('')
const tagInputRef  = ref<HTMLInputElement | null>(null)

// ─── Tags ─────────────────────────────────────────────────────────────────────
function addTag() {
  const val = tagInput.value.trim()
  if (val && !form.tags.includes(val)) form.tags.push(val)
  tagInput.value = ''
}
function removeTag(index: number) { form.tags.splice(index, 1) }
function handleBackspace() {
  if (!tagInput.value && form.tags.length) form.tags.pop()
}
function focusTagInput() { nextTick(() => tagInputRef.value?.focus()) }

// ─── Select options ────────────────────────────────────────────────────────────
const scopeOptions = [
  { _id: 'workspace', title: 'Workspace' },
  { _id: 'module',    title: 'Module' },
  { _id: 'sheet',     title: 'Sheet' },
  { _id: 'card',      title: 'Card' },
  { _id: 'agent',     title: 'Agent' },
  { _id: 'user',      title: 'User' },
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

const visibilityOptions = [
  { _id: 'private',    title: 'Private' },
  { _id: 'team',       title: 'Team' },
  { _id: 'workspace',  title: 'Workspace' },
  { _id: 'agent_only', title: 'Agent Only' },
]

const initialStatusOptions = [
  { _id: 'draft',          title: 'Draft' },
  { _id: 'pending_review', title: 'Pending Review' },
  { _id: 'approved',       title: 'Approved' },
]

function handleFileChange(e: Event) {
  selectedFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

// ─── Validation ───────────────────────────────────────────────────────────────
const urlError = computed(() => {
  if (!form.url) return ''
  try {
    const u = new URL(form.url)
    if (!['http:', 'https:'].includes(u.protocol)) return 'URL must start with http:// or https://'
  } catch { return 'Invalid URL' }
  return ''
})

const canSubmit = computed(() => {
  if (mode.value === 'file')   return !!selectedFile.value
  if (mode.value === 'url')    return !!form.url && !urlError.value
  if (mode.value === 'text')   return !!form.title.trim() && form.content.length >= 10
  if (mode.value === 'create') return !!form.title.trim()
  return false
})

// ─── Labels ───────────────────────────────────────────────────────────────────
const modeTitle = computed(() => ({
  file:   'Upload File',
  url:    'Add URL',
  text:   'Write Note / Text',
  create: 'Manual Draft',
}[mode.value]))

const modeSubtitle = computed(() => ({
  file:   'Upload a document to ingest into the knowledge base.',
  url:    'Provide a URL and click Add & Index to ingest the page.',
  text:   'Write or paste your content below and click Save & Index.',
  create: 'Empty draft to fill later.',
}[mode.value]))

const submitLabel = computed(() => ({
  file:   'Upload & Index',
  url:    'Add & Index',
  text:   'Save & Index',
  create: 'Add to Knowledge Base',
}[mode.value]))

// ─── Mutations ────────────────────────────────────────────────────────────────
const isSubmitting = ref(false)
const { mutateAsync: ingestFile }  = useIngestFile()
const { mutateAsync: ingestUrl }   = useIngestUrl()
const { mutateAsync: ingestText }  = useIngestText()
const { mutateAsync: createItem }  = useCreateKnowledgeItem()

async function submit() {
  touched.title   = true
  touched.content = true
  if (!canSubmit.value) return
  isSubmitting.value = true
  try {
    if (mode.value === 'file' && selectedFile.value) {
      const fd = new FormData()
      fd.append('file', selectedFile.value)
      fd.append('workspace_id', props.workspaceId)
      fd.append('scope_type', form.scope_type)
      fd.append('knowledge_category', form.knowledge_category)
      if (form.title)       fd.append('title', form.title)
      if (form.description) fd.append('description', form.description)
      await ingestFile(fd)
    } else if (mode.value === 'url') {
      await ingestUrl({
        workspace_id:       props.workspaceId,
        scope_type:         form.scope_type,
        knowledge_category: form.knowledge_category,
        url:                form.url,
        title:              form.title || undefined,
        description:        form.description || undefined,
      })
    } else if (mode.value === 'text') {
      await ingestText({
        workspace_id:       props.workspaceId,
        scope_type:         form.scope_type,
        knowledge_category: form.knowledge_category,
        title:              form.title,
        content:            form.content,
        description:        form.description || undefined,
      })
    } else if (mode.value === 'create') {
      await createItem({
        workspace_id:       props.workspaceId,
        title:              form.title,
        scope_type:         form.scope_type,
        knowledge_category: form.knowledge_category,
        source_type:        form.source_type,
        description:        form.description || undefined,
        visibility:         form.visibility,
      })
    }
    emit('success')
    isOpen.value = false
  } catch (err: any) {
    toast.error(err?.message ?? 'Something went wrong')
  } finally {
    isSubmitting.value = false
  }
}
</script>