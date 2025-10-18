<template>
  <!-- Slide-in panel -->
  <Transition name="panel" appear>
    <div v-show="showPanel" class="flex flex-col max-w-[380px] min-w-[380px] h-full
     overflow-y-auto
             bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur
             rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)]
             border border-white/5 overflow-hidden" role="complementary" aria-label="Details panel">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-transparent border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <h5 class="text-[18px] font-semibold tracking-tight">Details</h5>
        <button class="p-2 rounded-xl hover:bg-white/5 active:scale-[.98] transition" @click="$emit('close')"
          aria-label="Close details">
          <i class="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>

      <!-- Body -->
      <div class="py-5 px-6 flex flex-col gap-5 flex-grow">
        <!-- Title row -->
        <div class="capitalize">
          <Transition name="fade-scale" mode="out-in">
            <input v-if="editingTitle" key="title-edit" ref="titleInput" v-model="localTitle" @blur="saveTitle"
              @keydown.enter.prevent="saveTitle" @keydown.esc.prevent="cancelEdit" class="w-full text-2xl font-semibold rounded-xl px-3 py-2 bg-white/5 border border-white/10
                     focus:outline-none focus:ring-2 focus:ring-accent/40 transition" type="text"
              aria-label="Edit title" />
            <h1 v-else key="title-view" class="text-2xl font-semibold tracking-tight cursor-text rounded-lg px-2 py-1
                     hover:bg-white/5 transition" @click="editTitle" aria-label="Card title">
              {{ localTitle || 'Untitled' }}
            </h1>
          </Transition>
        </div>

        <!-- Description -->
        <div>
          <h3 class="mb-2 text-base font-semibold tracking-wide px-1">Description</h3>

          <Transition name="fade-scale" mode="out-in">
            <!-- view mode -->
            <div v-if="!editingDesc" key="desc-view" class="text-[15px] leading-6 text-text-secondary whitespace-pre-wrap cursor-text
                     rounded-xl px-4 py-3 border border-white/10 bg-white/5
                     hover:border-white/20 transition" @click="startEditDesc">
              <div v-if="description" v-html="description"></div>
              <span v-else class="opacity-60">Click to add a description…</span>
            </div>

            <!-- edit mode -->
            <div v-else key="desc-edit" ref="descEditorWrap"
              class="rounded-xl overflow-hidden border border-white/10 shadow-sm">
              <BaseRichTextEditor v-model="description" @focusOut="finishDescEdit" />
            </div>
          </Transition>
        </div>

        <!-- Tabs (segmented) -->
        <SwitchTab v-model="activeTab" :options="tabOptions" size="md" />
        <!-- Sections -->
        <Transition name="section" mode="out-in">
          <!-- TAB: Details -->
          <section v-if="activeTab === 'details'" key="tab-details" class="space-y-6">
            <!-- Meta tiles -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="rounded-xl bg-white/5 border border-white/10 p-4">
                <div class="text-xs uppercase tracking-wider text-text-secondary">Posted On</div>
                <div class="mt-1 font-medium">{{ dateISO }}</div>
              </div>
              <div class="rounded-xl bg-white/5 border border-white/10 p-4">
                <div class="text-xs uppercase tracking-wider text-text-secondary">ID</div>
                <div class="mt-1 font-medium">{{ details['card-code'] }}</div>
              </div>
            </div>

            <!-- Fields grid -->
            <div class="rounded-2xl border border-white/10 bg-white/5 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <div class="text-xs uppercase tracking-wider text-text-secondary">Lane</div>
                <BaseSelectField size="sm" :options="laneOptions" placeholder="Select lane" :allowCustom="false"
                  :model-value="lane" @update:modelValue="setLane" />
              </div>

              <template v-if="!pin">
                <div class="space-y-2">
                  <div class="text-xs uppercase tracking-wider text-text-secondary">Start Date</div>
                  <div class="h-10 px-3 flex items-center gap-2 rounded-lg bg-bg-input border border-white/10">
                    <i class="fa-regular fa-calendar"></i>
                    <DatePicker placeholder="Set start date" class="w-full" :model-value="form.startDate" emit-as="ymd"
                      @update:modelValue="setStartDate" />
                  </div>
                </div>

                <div class="space-y-2">
                  <div class="text-xs uppercase tracking-wider text-text-secondary">Target End</div>
                  <div class="h-10 px-3 flex items-center gap-2 rounded-lg bg-bg-input border transition-colors"
                    :class="endDateError ? 'border-red-500' : 'border-white/10'">
                    <i class="fa-regular fa-calendar"></i>
                    <DatePicker placeholder="Set end date" class="w-full" :model-value="form.endDate" emit-as="ymd"
                      @update:modelValue="setEndDate" />
                  </div>
                  <p v-if="endDateError" class="text-xs text-red-400 mt-1">{{ endDateError }}</p>
                </div>

                <div class="space-y-2 sm:col-span-2">
                  <div class="text-xs uppercase tracking-wider text-text-secondary">Assign</div>
                  <AssigmentDropdown @assign="assignHandle" :assigneeId="curentAssigne" :seat="details.seat" />
                </div>
              </template>

              <!-- Dynamic Select variables -->
              <template v-for="(item, index) in details.variables" :key="`var-${index}`">
                <div v-if="item?.type === 'Select'" class="space-y-2 sm:col-span-1">
                  <div class="text-xs uppercase tracking-wider text-text-secondary">{{ item.title }}</div>
                  <TypeChanger :default="item?.value" :data="item?.data" :cardId="details?._id"
                    @onselect="(val: any) => handleSelect(val, item.slug)" />
                </div>
              </template>
            </div>

          </section>
          <section v-else-if="activeTab === 'history'">
            <!-- History timeline -->
            <div>
              <h3 class="text-sm font-semibold tracking-wide mb-2">History</h3>
              <ol class="relative border-l border-white/10 pl-5 space-y-4">
                <li v-for="(h, i) in details.history" :key="i" class="group">
                  <span
                    class="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent/70 ring-4 ring-accent/10"></span>
                  <div class="rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/7 transition">
                    <span class="font-semibold">{{ h.user.u_full_name }}</span>
                    <span class="text-text-secondary"> changed </span>
                    <span class="font-semibold">{{ h.field_name }}</span>
                  </div>
                </li>
              </ol>
            </div>

          </section>

          <!-- TAB: Comments -->
          <section v-else-if="activeTab === 'comments'" key="tab-comments" class="space-y-4">
            <div v-for="c in (comments ?? [])" :key="c._id"
              class="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/7 transition">
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="h-8 w-8 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold">
                  {{ initials(c.created_by?.u_full_name) }}
                </div>
                <div class="flex-1">
                  <div class="text-sm font-medium">{{ c.created_by?.u_full_name }}</div>
                  <div class="text-xs text-text-secondary">{{ formatDateTime(c.created_at) }}</div>
                </div>
                <div v-if="isMine(c)" class="flex items-center gap-2">
                  <button v-if="editingId !== c._id" class="text-xs text-accent hover:underline"
                    @click="beginEdit(c)">Edit</button>
                  <button class="text-xs text-red-400 hover:underline" @click="removeComment(c)">Delete</button>
                </div>
              </div>

              <Transition name="fade" mode="out-in">
                <p v-if="editingId !== c._id" :key="`c-view-${c._id}`" class="text-[15px] leading-6">
                  {{ c.comment_text }}
                </p>
                <div v-else :key="`c-edit-${c._id}`" class="space-y-2">
                  <textarea v-model="editText" rows="3" class="w-full p-3 rounded-lg bg-bg-input/80 border border-white/10
                           focus:ring-2 focus:ring-accent/40 outline-none" />
                  <div class="flex items-center gap-2 justify-end">
                    <Button variant="secondary" size="sm" @click="cancelEdit">Cancel</Button>
                    <Button class="btn" size="sm" @click="saveEdit(c)"
                      :disabled="!editText.trim() || isUpdatingComment">
                      {{ isUpdatingComment ? 'Saving…' : 'Save' }}
                    </Button>
                  </div>
                </div>
              </Transition>

              <div v-if="c?.attachments?.length" class="mt-3 grid grid-cols-2 gap-2">
                <a v-for="(file, index) in c.attachments" :key="index" :href="file.url" target="_blank" class="group flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2 py-1
                         hover:bg-white/10 transition">
                  <i class="fa-regular fa-file text-text-secondary group-hover:text-text-primary transition"></i>
                  <span class="text-xs truncate">{{ file?.name }}</span>
                </a>
              </div>
            </div>

            <!-- New comment -->
            <div class="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              <textarea v-model="newComment" rows="3" class="w-full p-3 bg-transparent outline-none text-sm"
                placeholder="Write a comment" />
              <div class="flex items-center justify-between p-2 border-t border-white/10">
                <input type="file" multiple @change="handleFileChange" class="text-xs text-text-secondary
                         file:mr-3 file:px-3 file:py-1.5 file:rounded-md
                         file:border file:border-white/10 file:bg-white/10
                         hover:file:bg-white/15 file:text-text-primary transition" />
                <Button variant="primary" size="sm" @click="postComment"
                  :disabled="!newComment.trim() && !commentAttachments.length">
                  {{ isPostingComment ? 'Posting…' : 'Post' }}
                </Button>
              </div>
            </div>
          </section>

          <!-- TAB: Attachment -->
          <section v-else key="tab-attachments" class="space-y-3">
            <div class="text-xs text-text-secondary">
              Files attached to this {{ details?.type ?? 'item' }}.
            </div>

            <div class="grid sm:grid-cols-2 gap-4">
              <div v-for="file in attachments" :key="file._id"
                class="rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:bg-white/8 transition group">
                <div class="p-3">
                  <div v-if="file.kind === 'image'" class="rounded-lg overflow-hidden">
                    <img :src="file.url" class="w-full h-40 object-cover group-hover:scale-[1.02] transition" />
                  </div>
                  <div v-else-if="file.kind === 'video'" class="rounded-lg overflow-hidden">
                    <video :src="file.url" controls class="w-full h-40 object-cover"></video>
                  </div>
                  <div v-else class="h-40 rounded-lg bg-black/5 grid place-items-center">
                    <i class="fa-regular fa-file text-3xl text-text-secondary"></i>
                  </div>
                  <div class="mt-3">
                    <div class="font-medium truncate">{{ file.name }}</div>
                    <div class="text-xs text-text-secondary capitalize">{{ file.kind }}</div>
                  </div>
                </div>
                <div class="p-3 pt-0">
                  <a :href="file.url" target="_blank" rel="noopener" class="w-full inline-flex items-center justify-center gap-2 h-9 rounded-lg
                           bg-accent text-white text-sm hover:opacity-90 transition">
                    <i class="fa-regular fa-arrow-up-right-from-square"></i> View
                  </a>
                </div>
              </div>
            </div>
          </section>
        </Transition>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import BaseRichTextEditor from '../../../components/ui/BaseRichTextEditor.vue'
import { useLanes, useMoveCard } from '../../../queries/useSheets'
import TypeChanger from './TypeChanger.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import DatePicker from './DatePicker.vue'
import AssigmentDropdown from './AssigmentDropdown.vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useRouteIds } from '../../../composables/useQueryParams'
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '../../../queries/useProductCard'
import { useUserId } from '../../../services/user'
import Button from '../../../components/ui/Button.vue'
import { useUploadFile } from '../../../queries/useCommon'
import SwitchTab from '../../../components/ui/SwitchTab.vue'

const { workspaceId } = useRouteIds()

const props = defineProps({
  pin: { type: Boolean, default: false },
  showPanel: { type: Boolean, default: true },
  details: { type: Object as () => any, default: () => ({}) }
})
const emit = defineEmits(['close', 'update:details', 'comment:post', 'priority:change'])

/* -------------------- Tabs -------------------- */
const activeTab = ref<'details' | 'comments' | 'attachment' | 'history'>('details')
const tabOptions = [
  { label: 'Details', value: 'details' },
  { label: 'Comments', value: 'comments' },
  { label: 'History', value: 'history' },
  { label: 'Attachment', value: 'attachment' },
]

/* -------------------- Title -------------------- */
const editingTitle = ref(false)
const localTitle = ref(props.details['card-title'] ?? '')
watch(() => props.details['card-title'], (val) => { localTitle.value = val })

const titleInput = ref<HTMLInputElement | null>(null)
function editTitle() {
  editingTitle.value = true
  nextTick(() => { titleInput.value?.focus(); titleInput.value?.select() })
}

function saveTitle() {
  if (!localTitle.value.trim()) localTitle.value = props.details['card-title'] ?? ''
  moveCard.mutate({ card_id: props.details._id, variables: { 'card-title': localTitle.value.trim() } })
  editingTitle.value = false
}

/* -------------------- Description -------------------- */
const description = ref(props.details['card-description'])
watch(() => props.details, () => { description.value = props.details['card-description'] })

const editingDesc = ref(false)
const descEditorWrap = ref<HTMLElement | null>(null)

function focusProseMirror(container?: HTMLElement | null) {
  const pm = container?.querySelector?.('.ProseMirror') as HTMLElement | null
  if (!pm) return
  pm.focus()
  const sel = window.getSelection?.()
  const range = document.createRange()
  range.selectNodeContents(pm)
  range.collapse(false)
  sel?.removeAllRanges()
  sel?.addRange(range)
}
async function startEditDesc() {
  editingDesc.value = true
  await nextTick()
  focusProseMirror(descEditorWrap.value || undefined)
}
function finishDescEdit(attachmentsFromEditor?: any[]) {
  moveCard.mutate({
    card_id: props.details._id,
    attachments: attachmentsFromEditor ?? [],
    variables: { 'card-description': description.value }
  })
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

/* -------------------- Meta & Fields -------------------- */
const local = reactive({
  posted_on: props.details?.posted_on ?? props.details?.created_at ?? new Date().toISOString(),
})
const dateISO = computed({
  get: () => new Date(local.posted_on).toISOString().slice(0, 10),
  set: (v: string) => { local.posted_on = new Date(v + 'T00:00:00').toISOString() }
})

const { data: lanes } = useLanes(workspaceId.value)
const lane = ref(props.details['workspace_lane_id'] ?? '')
watch(() => props.details['workspace_lane_id'], (v) => { lane.value = v })

const laneOptions = computed<any[]>(() =>
  (lanes?.value ?? []).map((el: any) => ({ _id: el._id, title: el?.variables?.['lane-title'] ?? String(el._id) }))
)
function setLane(v: any) {
  lane.value = v
  moveCard.mutate({ card_id: props.details._id, 'workspace_lane_id': v })
}

const form = ref<any>({ startDate: props.details['start-date'], endDate: props.details['end-date'] })
const startDate = computed(() => props.details['start-date'])
watch(startDate, (v) => { form.value = { ...form.value, startDate: v } })

const endDateError = computed(() =>
  (form?.value.startDate && form.value.endDate && form.value.endDate < form.value.startDate)
    ? 'End date cannot be before start date'
    : ''
)
const setStartDate = (e: any) => moveCard.mutate({ card_id: props.details._id, variables: { 'start-date': e } })
const setEndDate = (e: any) => moveCard.mutate({ card_id: props.details._id, variables: { 'end-date': e } })

const curentAssigne = computed(() => props.details.assigned_to)
const assignHandle = (user: any) => {
  moveCard.mutate({ card_id: props.details._id, assigned_to: user?.user_info?._id })
}

/* -------------------- Comments -------------------- */
const comments = ref<any>([])
const commentId = computed(() => props.details?._id)
const { data: commentsData } = useComments(commentId)
watch(() => commentsData.value, () => { comments.value = commentsData.value?.comments })

const { mutate: createComment, isPending: isPostingComment } = useCreateComment({
  onSuccess: (data: any) => {
    newComment.value = ''
    commentAttachments.value = []
    comments.value = [...comments.value, data]
  }
})
const newComment = ref('')
const initials = (n?: string) => (n ?? '').split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
const formatDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString() : ''

const { data: currentUserId } = useUserId()
const isMine = (c: any) => c?.created_by?._id === currentUserId.value

const editingId = ref<string | null>(null)
const editText = ref('')
const { mutate: updateComment, isPending: isUpdatingComment } = useUpdateComment()
const { mutate: deleteComment } = useDeleteComment()

function beginEdit(c: any) { editingId.value = c._id; editText.value = c.comment_text ?? '' }
function cancelEdit() { editingId.value = null; editText.value = ''; editingTitle.value = false }
function saveEdit(c: any) {
  const text = editText.value.trim()
  if (!text) return
  const idx = comments.value.findIndex((x: any) => x._id === c._id)
  const prev = idx > -1 ? { ...comments.value[idx] } : null
  if (idx > -1) comments.value[idx] = { ...comments.value[idx], comment_text: text }
  updateComment(
    { id: c._id, payload: { comment_text: text } },
    {
      onError: () => { if (idx > -1 && prev) comments.value[idx] = prev },
      onSuccess: (server: any) => { if (idx > -1) comments.value[idx] = server ?? comments.value[idx]; cancelEdit() }
    }
  )
}
function removeComment(c: any) {
  const idx = comments.value.findIndex((x: any) => x._id === c._id)
  const prev = idx > -1 ? comments.value[idx] : null
  if (idx > -1) comments.value.splice(idx, 1)
  deleteComment({ id: c._id }, { onError: () => { if (prev) comments.value.splice(idx, 0, prev) } })
}

/* -------------------- Attachments (tab) -------------------- */
const attachments = computed(() =>
  (props.details?.attachments ?? []).map((f: any) => ({
    _id: f._id ?? f.id ?? crypto.randomUUID?.() ?? Math.random(),
    name: f.name ?? f.filename ?? 'file',
    url: f.url,
    kind: (f.type ?? f.kind ?? '').toLowerCase().includes('image') ? 'image'
      : (f.type ?? f.kind ?? '').toLowerCase().includes('video') ? 'video'
        : 'file'
  }))
)

/* -------------------- Mutations / cache -------------------- */
const queryClient = useQueryClient()
const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['get-sheets'] })
    queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
    queryClient.invalidateQueries({ queryKey: ['roles'] })
  }
})

/* -------------------- Comment attachments -------------------- */
const commentAttachments = ref<File[]>([])
const { mutate: uploadFile } = useUploadFile({
  onSuccess: (data: any) => { commentAttachments.value = [data] }
})
function handleFileChange(event: any) {
  const files = event.target.files
  Array.from(files).forEach((file: any) => {
    const fd = new FormData()
    fd.append('file', file)
    uploadFile(fd)
  })
}
function postComment() {
  const comment_text = newComment.value.trim()
  if (!comment_text && !commentAttachments.value.length) return
  createComment({
    id: props.details._id,
    payload: {
      comment_text,
      attachments: commentAttachments.value.map((file: any) => ({
        name: file.data.name,
        url: file.data.url
      }))
    }
  })
}

/* -------------------- Dynamic select handler -------------------- */
function handleSelect(val: any, slug: string) {
  const prev = (props.details?.variables ?? []).find((v: any) => v.slug === slug)?.value
  if (prev === val) return
  moveCard.mutate({
    card_id: props.details._id,
    variables: { [slug]: val },
  })
}
</script>

<style scoped>
/* --- Transitions --- */
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

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(.98);
}

.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 140ms ease;
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

/* Optional: thin scrollbar for this panel */
:global(.rich-scroll)::-webkit-scrollbar {
  width: 8px
}

:global(.rich-scroll)::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, .08);
  border-radius: 9999px
}

:global(.rich-scroll)::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, .14)
}
</style>
