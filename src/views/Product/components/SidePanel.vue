<template>
  <div :class="` flex flex-col  max-w-[358px] bg-bg-card rounded-lg overflow-y-auto overflow-x-hidden relative
      ${showPanel ? '!translate-x-0 w-full h-full min-w-[350px] ' : '!translate-x-100 w-0 h-0'}
      transition-all`">
    <!-- Header -->
    <div class="py-4 flex justify-between items-center border-b border-border px-5 sticky top-0 bg-bg-card z-1">
      <h5 class="text-[16px] font-medium">Details</h5>
      <i class="cursor-pointer text-text-primary fa-solid fa-close" @click="$emit('close')"></i>
    </div>

    <!-- Body -->
    <div class="py-4 px-5 flex flex-col  flex-grow space-y-4">
      <!-- Title row -->
      <div class="mb-2 capitalize">
        <template v-if="editingTitle">
          <input ref="titleInput" v-model="localTitle" @blur="saveTitle" @keydown.enter.prevent="saveTitle"
            @keydown.esc.prevent="cancelEdit" class="border border-border rounded px-2 py-1 w-full text-xl font-medium"
            type="text" />
        </template>
        <template v-else>
          <h1 class="text-xl font-medium text-text-primary cursor-pointer" @click="editTitle">
            {{ localTitle }}
          </h1>
        </template>
      </div>

      <!-- Tabs (Switcher) -->
      <SwitchTab v-model="activeTab" :options="tabOptions" />

      <!-- TAB: Details -->
      <section v-if="activeTab === 'details'" class="space-y-4">
        <!-- Description -->
        <BaseRichTextEditor v-model="description" @focusOut="updateDetailHandler" />

        <!-- Meta row -->
        <div class="flex items-center justify-between py-2">
          <div class="flex items-center text-sm capitalize gap-3 text-text-secondary">
            posted on:<span class="text-xs">{{ dateISO }}</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="card_code ml-auto text-sm text-text-secondary flex gap-2 text-nowrap items-center">
              ID:{{ details['card-code'] }}
            </span>
          </div>
        </div>

        <!-- Fields grid -->
        <div class="grid grid-cols-2 capitalize items-center gap-3 text-sm mt-2">
          <span>Lane</span>
          <BaseSelectField size="sm" :options="laneOptions" placeholder="Select lane" :allowCustom="false"
            :model-value="lane" @update:modelValue="setLane" />

          <span>Start date</span>
          <div class="border flex items-center gap-3 border-border h-8 px-4 bg-bg-input rounded-md">
            <i class="fa-regular fa-calendar"></i>
            <DatePicker placeholder="Set start date" class="w-full" :model-value="form.startDate" emit-as="ymd"
              @update:modelValue="setStartDate" />
          </div>

          <span>Target end</span>
          <div class="flex gap-1 flex-col">
            <div class="border flex items-center gap-3 border-border h-8 px-4 bg-bg-input rounded-md"
              :class="endDateError ? 'border-red-500' : ''">
              <i class="fa-regular fa-calendar"></i>
              <DatePicker placeholder="Set end date" class="w-full" :model-value="form.endDate" emit-as="ymd"
                @update:modelValue="setEndDate" />
            </div>
            <p v-if="endDateError" class="text-xs text-red-500">{{ endDateError }}</p>
          </div>

          <span>Assign</span>
          <AssigmentDropdown @assign="assignHandle" :assigneeId="curentAssigne" :seat="details.seat" />

          <!-- Dynamic Select variables -->
          <template v-for="(item, index) in details.variables" :key="`var-${index}`">
            <template v-if="item?.type === 'Select'">
              <span>{{ item.title }}</span>
              <TypeChanger :default="item?.value" :data="item?.data" :cardId="details?._id"
                @onselect="(val: any) => handleSelect(val, item.slug)" />
            </template>
          </template>
        </div>

        <!-- History -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-sm font-medium text-text-primary">History</h3>
          </div>
          <ul class=" flex flex-col gap-3  border border-border rounded-md p-4  bg-bg-surface/30">
            <li v-for="(h, i) in details.history" :key="i"  class="text-xs text-text-secondary">
       <span class=" capitalize font-bold">{{ h.user.u_full_name }}</span> changed   <span class=" capitalize font-bold">{{ h.field_name }}</span>  
            </li>
          </ul>
        </div>
      </section>


      <!-- TAB: Comments -->
      <section v-else-if="activeTab === 'comments'" class="space-y-4 flex-grow overflow-y-auto ">
        <div class="space-y-3">
          <div v-for="c in (comments ?? [])" :key="c._id" class="rounded-md border border-border p-3 bg-bg-input/40">

            <div class="flex items-center gap-2 mb-2">
              <div class="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center text-[11px] font-medium">
                {{ initials(c.created_by?.u_full_name) }}
              </div>
              <span class="text-xs font-medium">{{ c.created_by?.u_full_name }}</span>
            </div>
            <!-- view mode -->
            <p v-if="editingId !== c._id" class="text-sm text-text-primary leading-5 whitespace-pre-wrap">
              {{ c.comment_text }}
            </p>

            <!-- edit mode -->
            <div v-else class="space-y-2">
              <textarea v-model="editText" rows="3"
                class="w-full p-2 border border-border rounded-md bg-transparent text-sm" />
              <div class="flex items-center gap-2 justify-end">
                <Button variant="secondary" size="sm" @click="cancelEdit">Cancel</Button>
                <Button class="btn" size="sm" @click="saveEdit(c)" :disabled="!editText.trim() || isUpdatingComment">
                  {{ isUpdatingComment ? 'Saving…' : 'Save' }}
                </Button>
              </div>
            </div>


            <div class="flex items-center gap-3 mt-1">
              <span class="text-xs text-text-secondary">{{ formatDateTime(c.created_at) }}</span>
              <!-- actions, only for own comments -->
              <template v-if="isMine(c)">
                <button class="text-xs text-accent hover:underline" @click="beginEdit(c)" v-if="editingId !== c._id">
                  Edit
                </button>
                <button class="text-xs text-red-500 hover:underline" @click="removeComment(c)">
                  Delete
                </button>
              </template>
            </div>
          </div>
        </div>

        <!-- New comment -->
        <div class="border border-border rounded-md overflow-hidden sticky bottom-0 bg-bg-body">
          <textarea v-model="newComment" rows="3" class="w-full bg-bg-input p-3  outline-none text-sm"
            placeholder="Write a comment" />
          <div class="flex items-center justify-end p-2 bg-bg-body">
            <Button variant="primary" label="" size="sm"  @click="postComment" :disabled="!newComment.trim()">{{isPostingComment? 'Posting....':'Post'}}</Button>
          </div>
        </div>
      </section>

      <!-- TAB: Attachment -->
      <section v-else class="space-y-3">
        <div class="text-xs text-text-secondary">Files attached to this {{ details?.type ?? 'item' }}.</div>

        <div class="grid gap-3">
          <div v-for="file in attachments" :key="file._id"
            class="border border-border rounded-lg overflow-hidden bg-bg-input/40">
            <!-- Preview -->
            <div class="p-2">
              <div v-if="file.kind === 'video'" class="aspect-video rounded-md overflow-hidden bg-black/80">
                <!-- thumbnail or <video> poster; swap to your thumb prop if available -->
                <video :src="file.url" controls class="w-full h-full object-cover"></video>
              </div>
              <div v-else-if="file.kind === 'image'" class="rounded-md overflow-hidden">
                <img :src="file.url" class="w-full h-auto" />
              </div>
              <div v-else class="rounded-md overflow-hidden bg-black/5 h-36 flex items-center justify-center">
                <i class="fa-regular fa-file text-2xl text-text-secondary"></i>
              </div>
              <div class="mt-2 text-sm">
                <div class="font-medium truncate">{{ file.name }}</div>
                <div class="text-xs text-text-secondary capitalize">{{ file.kind }} file</div>
              </div>
            </div>

            <!-- Action -->
            <div class="p-3">
              <a :href="file.url" target="_blank" rel="noopener"
                class="w-full inline-flex items-center justify-center h-9 rounded-md bg-neutral-900 text-white text-sm hover:opacity-90">
                View Full Size
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, nextTick } from 'vue'
import BaseRichTextEditor from '../../../components/ui/BaseRichTextEditor.vue'
import { useLanes, useMoveCard } from '../../../queries/useSheets'
import TypeChanger from './TypeChanger.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import DatePicker from './DatePicker.vue'
import AssigmentDropdown from './AssigmentDropdown.vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useRouteIds } from '../../../composables/useQueryParams'
import SwitchTab from '../../../components/ui/SwitchTab.vue'
import { useComments, useCreateComment } from '../../../queries/useProductCard'
import { useUpdateComment, useDeleteComment } from '../../../queries/useProductCard'
import { useUserId } from '../../../services/user'
import Button from '../../../components/ui/Button.vue'

const { workspaceId } = useRouteIds()

const props = defineProps({
  showPanel: { type: Boolean, default: true },
  details: { type: Object as () => any, default: () => ({}) }
})

const emit = defineEmits(['close', 'update:details', 'comment:post', 'priority:change'])

/* -------------------- Tabs -------------------- */
const activeTab = ref<'details' | 'comments' | 'attachment'>('details')
const tabOptions = [
  { label: 'Details', value: 'details' },
  { label: 'Comments', value: 'comments' },
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
const updateDetailHandler = () => {
  moveCard.mutate({ card_id: props.details._id, variables: { 'card-description': description.value } })
}

/* -------------------- Meta -------------------- */
const local = reactive({
  posted_on: props.details?.posted_on ?? props.details?.created_at ?? new Date().toISOString(),
})
const dateISO = computed({
  get: () => new Date(local.posted_on).toISOString().slice(0, 10),
  set: (v: string) => { local.posted_on = new Date(v + 'T00:00:00').toISOString() }
})

/* -------------------- Lane / Dates / Assign -------------------- */
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
const endDateError = computed(() => (form?.value.startDate && form.value.endDate && form.value.endDate < form.value.startDate)
  ? 'End date cannot be before start date' : '')

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
watch(() => commentsData.value, () => {
  comments.value = commentsData.value?.comments
})
const { mutate: createComment , isPending:isPostingComment} = useCreateComment({
  onSuccess: (data: any) => {
      newComment.value = ''
    comments.value = [...comments.value, data]
  }
})
const newComment = ref('')
const initials = (n?: string) => (n ?? '')
  .split(' ').map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

const formatDateTime = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString()
}
function postComment() {
  const comment_text = newComment.value.trim()
  if (!comment_text) return
  createComment({
    id: props.details._id,
    payload: { comment_text }
  })

}

/* -------------------- Attachments -------------------- */
const attachments = computed(() => (props.details?.attachments ?? []).map((f: any) => ({
  _id: f._id ?? f.id ?? crypto.randomUUID?.() ?? Math.random(),
  name: f.name ?? f.filename ?? 'file',
  url: f.url,
  kind: (f.type ?? f.kind ?? '').toLowerCase().includes('image') ? 'image'
    : (f.type ?? f.kind ?? '').toLowerCase().includes('video') ? 'video'
      : 'file'
})))

/* -------------------- Mutations -------------------- */
const queryClient = useQueryClient()
const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['get-sheets'] })
    queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
    queryClient.invalidateQueries({ queryKey: ['roles'] })
  }
})






// Identify current user (adjust to your auth source)
// Option A: parent passes current user id via details.current_user_id
const { data: currentUserId } = useUserId();

// If you already have an auth store/composable, swap the line above to:
// const { user } = useAuth(); const currentUserId = computed(() => user.value._id)

const isMine = (c: any) => c?.created_by?._id === currentUserId.value

// Editing state
const editingId = ref<string | null>(null)
const editText = ref('')

// Mutations
const { mutate: updateComment, isPending: isUpdatingComment } = useUpdateComment()
const { mutate: deleteComment } = useDeleteComment()

function beginEdit(c: any) {
  editingId.value = c._id
  editText.value = c.comment_text ?? ''
}

function cancelEdit() {
  editingId.value = null
  editText.value = ''
}

function saveEdit(c: any) {
  const text = editText.value.trim()
  if (!text) return

  // optimistic update
  const idx = comments.value.findIndex((x: any) => x._id === c._id)
  const prev = idx > -1 ? { ...comments.value[idx] } : null
  if (idx > -1) comments.value[idx] = { ...comments.value[idx], comment_text: text }

  updateComment(
    { id: c._id, payload: { comment_text: text } },
    {
      onError: () => { if (idx > -1 && prev) comments.value[idx] = prev },
      onSuccess: (serverComment: any) => {
        if (idx > -1) comments.value[idx] = serverComment ?? comments.value[idx]
        cancelEdit()
      }
    }
  )
}

function removeComment(c: any) {
  // optimistic remove
  const idx = comments.value.findIndex((x: any) => x._id === c._id)
  const prev = idx > -1 ? comments.value[idx] : null
  if (idx > -1) comments.value.splice(idx, 1)

  deleteComment(
    { id: c._id },
    {
      onError: () => { if (prev) comments.value.splice(idx, 0, prev) }
    }
  )
}
const handleSelect = (val: any, slug: any) => {
  // console.log(ticketID.value, '>>>');

  moveCard.mutate({
    card_id: props.details._id,
    variables: {
      [slug]: val
    },
    // ariable_id: id,

  })
}
</script>
