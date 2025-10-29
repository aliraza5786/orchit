<template>
  <BaseModal :modelValue="modelValue" @update:modelValue="closeModal" class="!pt-0">
   

        <div v-if="isLoading" class="flex items-center justify-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>

        <template v-else-if="cardDetails">
          <div
            class="sticky top-0 z-1 backdrop-blur border-b border-orchit-white/5 px-6 pb-4 flex items-center justify-between">
            <h5 id="modal-title" class="text-lg font-semibold tracking-tight">Task Details</h5>
          
          </div>

          <div class="flex-1 overflow-y-auto py-6 px-6">
            <div class="flex flex-col gap-5">
              <div class="capitalize">
                <Transition name="fade-scale" mode="out-in">
                  <input v-if="editingTitle" key="title-edit" ref="titleInput" v-model="localTitle" @blur="saveTitle"
                    @keydown.enter.prevent="saveTitle" @keydown.esc.prevent="cancelEdit" class="w-full text-2xl font-semibold rounded-xl px-3 py-2 bg-orchit-white/5 border border-orchit-white/10
                             focus:outline-none focus:ring-2 focus:ring-accent/40 transition" type="text"
                    aria-label="Edit title" />
                  <h1 v-else key="title-view" class="text-2xl font-semibold tracking-tight cursor-text rounded-lg px-2 py-1
                             hover:bg-orchit-white/5 transition" @click="editTitle" aria-label="Card title">
                    {{ localTitle || 'Untitled' }}
                  </h1>
                </Transition>
              </div>

              <div>
                <h3 class="mb-2 text-base font-semibold tracking-wide px-1">Description</h3>
                <Transition name="fade-scale" mode="out-in">
                  <div v-if="!editingDesc" key="desc-view" class="text-[15px] leading-6 text-text-secondary whitespace-pre-wrap cursor-text
                             rounded-xl px-4 py-3 border border-orchit-white/10 bg-orchit-white/5
                             hover:border-orchit-white/20 transition" @click="startEditDesc">
                    <div v-if="description" v-html="description"></div>
                    <span v-else class="opacity-60">Click to add a description…</span>
                  </div>
                  <div v-else key="desc-edit" ref="descEditorWrap"
                    class="rounded-xl overflow-hidden border border-orchit-white/10 shadow-sm">
                    <BaseRichTextEditor v-model="description" @focusOut="finishDescEdit" />
                  </div>
                </Transition>
              </div>

              <SwitchTab v-model="activeTab" :options="tabOptions" size="md" />

              <Transition name="section" mode="out-in">
                <section v-if="activeTab === 'details'" key="tab-details" class="space-y-6">
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div class="rounded-xl bg-orchit-white/5 border border-orchit-white/10 p-4">
                      <div class="text-xs uppercase tracking-wider text-text-secondary">Posted On</div>
                      <div class="mt-1 font-medium">{{ dateISO }}</div>
                    </div>
                    <div class="rounded-xl bg-orchit-white/5 border border-orchit-white/10 p-4">
                      <div class="text-xs uppercase tracking-wider text-text-secondary">ID</div>
                      <div class="mt-1 font-medium">{{ details['card-code'] }}</div>
                    </div>
                  </div>

                  <div
                    class="rounded-2xl border border-orchit-white/10 bg-orchit-white/5 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="space-y-2">
                      <div class="text-xs uppercase tracking-wider text-text-secondary">Lane</div>
                      <BaseSelectField size="sm" :options="laneOptions" placeholder="Select lane" :allowCustom="false"
                        :model-value="lane" @update:modelValue="setLane" />
                    </div>
                    <div class="space-y-2">
                      <div class="text-xs uppercase tracking-wider text-text-secondary">Assign</div>
                      <AssigmentDropdown @assign="assignHandle" :assigneeId="curentAssigne" :seat="details.seat" />
                    </div>
                    <template v-if="!pin">
                      <div class="space-y-2">
                        <div class="text-xs uppercase tracking-wider text-text-secondary">Start Date</div>
                        <div
                          class="h-8 px-3 flex items-center gap-2 rounded-lg bg-bg-input border border-orchit-white/10">
                          <i class="fa-regular fa-calendar"></i>
                          <DatePicker placeholder="Set start date" class="w-full" :model-value="form.startDate"
                            emit-as="ymd" @update:modelValue="setStartDate" />
                        </div>
                      </div>
                      <div class="space-y-2">
                        <div class="text-xs uppercase tracking-wider text-text-secondary">Target End</div>
                        <div class="h-8 px-3 flex items-center gap-2 rounded-lg bg-bg-input border transition-colors"
                          :class="endDateError ? 'border-red-500' : 'border-orchit-white/10'">
                          <i class="fa-regular fa-calendar"></i>
                          <DatePicker placeholder="Set end date" class="w-full" :model-value="form.endDate"
                            emit-as="ymd" @update:modelValue="setEndDate" />
                        </div>
                        <p v-if="endDateError" class="text-xs text-red-400 mt-1">{{ endDateError }}</p>
                      </div>
                    </template>
                    <template v-if="cardDetails?.variables" v-for="(item, index) in cardDetails?.variables"
                      :key="item.slug || `var-${index}`">
                      <div v-if="item?.type === 'Select'" class="space-y-2 sm:col-span-1">
                        <div class="text-xs uppercase tracking-wider text-text-secondary">{{ item.title }}</div>
                        <BaseSelectField size="sm" :options="item?.data.map((e: any) => ({ _id: e, title: e }))"
                          placeholder="Select option" :allowCustom="false" :model-value="localVarValues[item.slug]"
                          @update:modelValue="(val: any) => handleSelect(val, item.slug)" />
                      </div>
                    </template>
                  </div>
                </section>

                <section v-else-if="activeTab === 'history'" key="tab-history">
                  <div>
                    <h3 class="text-sm font-semibold tracking-wide mb-3">History</h3>
                    <ol class="relative border-l border-orchit-white/10 pl-5 space-y-4 ml-1">
                      <li v-for="(h, i) in details.history" :key="i" class="group">
                        <span
                          class="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent/70 ring-4 ring-accent/10"></span>
                        <div
                          class="rounded-xl bg-orchit-white/5 border border-orchit-white/10 p-3 hover:bg-orchit-white/7 transition">
                          <span class="font-semibold">{{ h.user.u_full_name }}</span>
                          <span class="text-text-secondary"> changed </span>
                          <span class="font-semibold">{{ h.field_name }}</span>
                        </div>
                      </li>
                    </ol>
                  </div>
                </section>

                <section v-else-if="activeTab === 'comments'" key="tab-comments" class="space-y-4">
                  <div v-for="c in (comments ?? [])" :key="c._id"
                    class="rounded-xl border border-orchit-white/10 bg-orchit-white/5 p-4 hover:bg-orchit-white/7 transition">
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
                        <textarea v-model="editText" rows="3" class="w-full p-3 rounded-lg bg-bg-input/80 border border-orchit-white/10
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
                      <a v-for="(file, index) in c.attachments" :key="index" :href="file.url" target="_blank" class="group flex items-center gap-2 rounded-lg border border-orchit-white/10 bg-orchit-white/5 px-2 py-1
                                 hover:bg-orchit-white/10 transition">
                        <i class="fa-regular fa-file text-text-secondary group-hover:text-text-primary transition"></i>
                        <span class="text-xs truncate">{{ file?.name }}</span>
                      </a>
                    </div>
                  </div>

                  <div class="rounded-xl border border-orchit-white/10 bg-orchit-white/5 overflow-hidden">
                    <textarea v-model="newComment" rows="3" class="w-full p-3 bg-transparent outline-none text-sm"
                      placeholder="Write a comment" />
                    <div class="flex items-center justify-between p-2 border-t border-orchit-white/10">
                      <input type="file" multiple @change="handleFileChange" class="text-xs text-text-secondary
                                 file:mr-3 file:px-3 file:py-1.5 file:rounded-md
                                 file:border file:border-orchit-white/10 file:bg-orchit-white/10
                                 hover:file:bg-orchit-white/15 file:text-text-primary transition" />
                      <Button variant="primary" size="sm" @click="postComment"
                        :disabled="!newComment.trim() && !commentAttachments.length">
                        {{ isPostingComment ? 'Posting…' : 'Post' }}
                      </Button>
                    </div>
                  </div>
                </section>

                <section v-else key="tab-attachments" class="space-y-3">
                  <div class="text-xs text-text-secondary">
                    Files attached to this {{ details?.type ?? 'item' }}.
                  </div>
                  <div class="grid sm:grid-cols-2 gap-4">
                    <div v-for="file in attachments" :key="file._id"
                      class="rounded-2xl overflow-hidden border border-orchit-white/10 bg-orchit-white/5 hover:bg-orchit-white/8 transition group">
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
                                   bg-accent text-orchit-white text-sm hover:opacity-90 transition">
                          <i class="fa-regular fa-arrow-up-right-from-square"></i> View
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
              </Transition>
            </div>
          </div>
        </template>
   

  </BaseModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseRichTextEditor from '../../../components/ui/BaseRichTextEditor.vue'
import { useLanes, useMoveCard } from '../../../queries/useSheets'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import DatePicker from '../../../views/Product/components/DatePicker.vue'
import AssigmentDropdown from '../../../views/Product/components/AssigmentDropdown.vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useRouteIds } from '../../../composables/useQueryParams'
import { useComments, useCreateComment, useUpdateComment, useDeleteComment, useProductCard } from '../../../queries/useProductCard'
import { useUserId } from '../../../services/user'
import Button from '../../../components/ui/Button.vue'
import { useUploadFile } from '../../../queries/useCommon'
import SwitchTab from '../../../components/ui/SwitchTab.vue'

const { workspaceId } = useRouteIds()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  cardId: { type: String, default: '' },
  pin: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'close'])
const card_Id = ref(props.cardId);

const { data: cardDetails, isLoading, refetch } = useProductCard(card_Id)

const details = computed(() => cardDetails.value || {})

const activeTab = ref<'details' | 'comments' | 'attachment' | 'history'>('details')
const tabOptions = [
  { label: 'Details', value: 'details' },
  { label: 'Comments', value: 'comments' },
  { label: 'History', value: 'history' },
  { label: 'Attachment', value: 'attachment' },
]

const editingTitle = ref(false)
const localTitle = ref('')
watch(() => details.value?.['card-title'], (val) => { localTitle.value = val || '' }, { immediate: true })

const titleInput = ref<HTMLInputElement | null>(null)
function editTitle() {
  editingTitle.value = true
  nextTick(() => { titleInput.value?.focus(); titleInput.value?.select() })
}

function saveTitle() {
  if (!localTitle.value.trim()) localTitle.value = details.value?.['card-title'] ?? ''
  if (details.value._id) {
    moveCard.mutate({ card_id: details.value._id, variables: { 'card-title': localTitle.value.trim() } })
  }
  editingTitle.value = false
}

const description = ref('')
watch(() => details.value?.['card-description'], (val) => { description.value = val || '' }, { immediate: true })

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
  if (details.value._id) {
    moveCard.mutate({
      card_id: details.value._id,
      attachments: attachmentsFromEditor ?? [],
      variables: { 'card-description': description.value }
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

const local = reactive({
  posted_on: '',
})

watch(() => details.value, (val) => {
  if (val) {
    local.posted_on = val.posted_on ?? val.created_at ?? new Date().toISOString()
  }
}, { immediate: true })

const dateISO = computed({
  get: () => local.posted_on ? new Date(local.posted_on).toISOString().slice(0, 10) : '',
  set: (v: string) => { local.posted_on = new Date(v + 'T00:00:00').toISOString() }
})

const { data: lanes } = useLanes(workspaceId.value)
const lane = ref('')
watch(() => details.value?.['workspace_lane_id'], (v) => { lane.value = v || '' }, { immediate: true })

const laneOptions = computed<any[]>(() =>
  (lanes?.value ?? []).map((el: any) => ({ _id: el._id, title: el?.variables?.['lane-title'] ?? String(el._id) }))
)

function setLane(v: any) {
  lane.value = v
  if (details.value._id) {
    moveCard.mutate({ card_id: details.value._id, 'workspace_lane_id': v })
  }
}

const form = ref<any>({ startDate: null, endDate: null })
watch(() => [details.value?.['start-date'], details.value?.['end-date']], ([start, end]) => {
  form.value = { startDate: start || null, endDate: end || null }
}, { immediate: true })

const endDateError = computed(() =>
  (form?.value.startDate && form.value.endDate && form.value.endDate < form.value.startDate)
    ? 'End date cannot be before start date'
    : ''
)

const setStartDate = (e: any) => {
  if (details.value._id) {
    moveCard.mutate({ card_id: details.value._id, variables: { 'start-date': e } })
  }
}

const setEndDate = (e: any) => {
  if (details.value._id) {
    moveCard.mutate({ card_id: details.value._id, variables: { 'end-date': e } })
  }
}

const curentAssigne = computed(() => details.value?.assigned_to)
const assignHandle = (user: any) => {
  if (details.value._id) {
    moveCard.mutate({ card_id: details.value._id, assigned_to: user?.user_info?._id })
  }
}

const comments = ref<any>([])
const commentId = computed(() => props.cardId)
const { data: commentsData } = useComments(commentId, {
  enabled: computed(() => !!props.cardId && props.modelValue)
})
watch(() => commentsData.value, (val) => { comments.value = val?.comments || [] })

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

const attachments = computed(() =>
  (details.value?.attachments ?? []).map((f: any) => ({
    _id: f._id ?? f.id ?? crypto.randomUUID?.() ?? Math.random(),
    name: f.name ?? f.filename ?? 'file',
    url: f.url,
    kind: (f.type ?? f.kind ?? '').toLowerCase().includes('image') ? 'image'
      : (f.type ?? f.kind ?? '').toLowerCase().includes('video') ? 'video'
        : 'file'
  }))
)

const queryClient = useQueryClient()
const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
    queryClient.invalidateQueries({ queryKey: ['product-card', props.cardId] })
  }
})

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
  if (details.value._id) {
    createComment({
      id: details.value._id,
      payload: {
        comment_text,
        attachments: commentAttachments.value.map((file: any) => ({
          name: file.data.name,
          url: file.data.url
        }))
      }
    })
  }
}

const localVarValues = reactive<Record<string, any>>({})

const initLocalVars = () => {
  if (cardDetails?.value?.variables) {
    const vars = cardDetails.value.variables ?? []
    vars.forEach((v: any) => {
      if (!v || v.type !== 'Select') return
      const first = Array.isArray(v.data) && v.data.length ? v.data[0]?.value ?? v.data[0]?._id ?? v.data[0] : undefined
      localVarValues[v.slug] = v.value ?? localVarValues[v.slug] ?? first ?? null
    })
  }
}

onMounted(initLocalVars)
watch(() => cardDetails.value, initLocalVars, { deep: true })

function handleSelect(val: any, slug: string) {
  localVarValues[slug] = val
  const prev = (cardDetails.value?.variables ?? []).find((v: any) => v.slug === slug)?.value
  if (prev === val) return
  if (details.value._id) {
    moveCard.mutate({
      card_id: details.value._id,
      variables: { [slug]: val },
    })
  }
}

function closeModal() {
  emit('update:modelValue', false)
  emit('close')
  activeTab.value = 'details'
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    closeModal()
  }
}

watch(() => props.cardId, (newCardId) => {
  if (newCardId) {
    card_Id.value = newCardId;
    refetch()
  }
})

watch(() => props.modelValue, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  if (props.modelValue) {
    document.body.style.overflow = 'hidden'
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from>div:last-child,
.modal-leave-to>div:last-child {
  transform: scale(0.95) translateY(-20px);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 200ms ease;
}

.modal-enter-active>div:last-child,
.modal-leave-active>div:last-child {
  transition: transform 200ms ease;
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
</style>
