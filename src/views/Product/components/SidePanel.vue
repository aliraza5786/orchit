<template>
  <div
    :class="`max-w-[358px] bg-bg-card  rounded-lg overflow-y-auto overflow-x-hidden relative ${showPanel ? '!translate-x-0 w-full h-full min-w-[350px] overflow-y-auto' : '!translate-x-100 w-0 h-0'} transition-all`">
    <!-- Header -->
    <div class="py-4 flex justify-between items-center border-b border-border px-5 sticky top-0  bg-bg-card z-1">
      <h5 class="text-[16px] font-medium">Details</h5>
      <i class=" cursor-pointer text-text-primary fa-solid fa-close" @click="() => { $emit('close') }"></i>

    </div>

    <!-- Body -->
    <div class="py-4 px-5">
      <!-- Title -->
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
      <!-- Description -->
      <BaseRichTextEditor @focusOut="updateDetailHandler" v-model="description" />
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center text-sm capitalize gap-3  text-text-secondary ">
          posted on:<span class="text-xs">{{ dateISO }}</span>

        </div>
        <div class="flex  items-center gap-2">
          <span class="card_code ml-auto text-sm text-text-secondary flex gap-2 text-nowrap items-center">
            ID:{{ details['card-code'] }}
          </span>
        </div>
      </div>
      <!-- Posted By -->
      <div class="grid grid-cols-2 capitalize items-center gap-2 text-sm mt-4">
        <span class="text-sm">
          Lane
        </span>

        <!-- Lane (required) -->
        <div class="flex flex-col">
          <BaseSelectField size="sm" :options="laneOptions" placeholder="Select lane" :allowCustom="false"
            :model-value="lane" @update:modelValue="setLane" />
        </div>
        <span>start date</span>
        <!-- Start date -->
        <div class="border flex items-center gap-3 border-border h-8 px-4 bg-bg-input rounded-md">
          <i class="fa-regular fa-calendar"></i>
          <DatePicker placeholder="Set start date" class="w-full" :model-value="form.startDate" emit-as="ymd"
            @update:modelValue="setStartDate" />
        </div>

        <span>end date</span>
        <!-- End date -->
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

        <div class="col-span-full grid grid-cols-2" v-for="(item, index) in details.variables"
          v-show="item?.type === 'Select'">
          <span>{{ item.title }}</span>
          <TypeChanger :key="index" @click.stop :default="item?.value" :data="item?.data" :cardId="details?._id"
            @onselect="(val: any) => handleSelect(val, item.slug)" />

        </div>

      </div>
      <!-- Activity / Comments -->
      <div class="mt-8">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-text-primary  ">History</h3>

        </div>

        <ul class=" list-disc list-inside">
          <li class="text-sm text-text-secondary " v-for="h in details.history">{{ h.message }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import BaseRichTextEditor from '../../../components/ui/BaseRichTextEditor.vue'
import { useLanes, useMoveCard } from '../../../queries/useSheets'
import TypeChanger from './TypeChanger.vue'
import { nextTick } from 'vue'
import { useRouteIds } from '../../../composables/useQueryParams'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import DatePicker from './DatePicker.vue'
import AssigmentDropdown from './AssigmentDropdown.vue'
import { useQueryClient } from '@tanstack/vue-query'
const { workspaceId } = useRouteIds()
const props = defineProps({
  showPanel: { type: Boolean, default: true },
  details: { type: Object as () => any, default: () => ({}) }
})
const curentAssigne = computed(() => props.details.assigned_to)
const editingTitle = ref(false)
const localTitle = ref(props.details['card-title'] ?? '')
const lane = ref(props.details['workspace_lane_id'] ?? '')

// Watch for prop updates if details change
watch(() => props.details['card-title'], (val) => {
  localTitle.value = val
  lane.value = props.details['workspace_lane_id']
})


const description = ref(props.details['card-description'])
watch(() => props.details, () => {
  description.value = props.details['card-description'];
})
const emit = defineEmits(['close', 'update:details', 'comment:post', 'priority:change'])

// Local editable copy
const local = reactive({
  description: props.details?.description ?? '',
  posted_by: props.details?.posted_by ?? { id: null, name: '' },
  posted_on: props.details?.posted_on ?? props.details?.created_at ?? new Date().toISOString(),
})


const dateISO = computed({
  get: () => new Date(local.posted_on).toISOString().slice(0, 10),
  set: (v: string) => { local.posted_on = new Date(v + 'T00:00:00').toISOString() }
})



const updateDetailHandler = () => {
  // console.log(ticketID.value, '>>>');

  moveCard.mutate({ card_id: props.details._id, variables: { 'card-description': description.value } })
}
// const queryClient = useQueryClient()
// const moveCard = useMoveCard({
//   onSuccess: () => {
//     queryClient.invalidateQueries({
//       queryKey: ['get-sheets']
//     })
//   }
// })
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
const titleInput = ref<HTMLInputElement | null>(null)

function editTitle() {
  editingTitle.value = true
  nextTick(() => {
    titleInput.value?.focus()
    titleInput.value?.select()
  })
}

function saveTitle() {
  if (!localTitle.value.trim()) {
    localTitle.value = props.details['card-title'] ?? ''
  }

  // Update the backend
  moveCard.mutate({
    card_id: props.details._id,
    variables: {
      'card-title': localTitle.value.trim(),

    }
  })

  editingTitle.value = false
}

function cancelEdit() {
  localTitle.value = props.details['card-title'] ?? ''
  editingTitle.value = false
}
const { data: lanes } = useLanes(workspaceId.value)

/** Lane options (memoized) */
const laneOptions = computed<any[]>(() =>
  (lanes?.value ?? []).map((el: any) => ({
    _id: el._id,
    title: el?.variables?.['lane-title'] ?? String(el._id)
  }))
)
function setLane(v: any) {
  lane.value = v
  moveCard.mutate({ card_id: props.details._id, 'workspace_lane_id': v })

}
const form = ref<any>({ startDate: props.details['start-date'], endDate: props.details['end-date'] })
const setStartDate = (e:any) => {
  moveCard.mutate({ card_id: props.details._id, variables: { 'start-date': e } })

}
const startDate = computed(() => props.details['start-date'])
watch(startDate, (newVal) => {
  form.value = {
    ...form.value, startDate: newVal
  }
})
const setEndDate = (e:any) => {  
  moveCard.mutate({ card_id: props.details._id, variables: { 'end-date': e } })

}
const endDateError = computed(() => {
  if (form?.value.startDate && form.value.endDate && form.value.endDate < form.value.startDate) return 'End date cannot be before start date'
  return ''
})
const queryClient = useQueryClient()
const moveCard = useMoveCard({
  onSuccess: () => {
    queryClient.invalidateQueries({
      queryKey: ['get-sheets']
    })
    queryClient.invalidateQueries({
      queryKey: ['sheet-list']
    })
    queryClient.invalidateQueries({
      queryKey: ['roles']
    })

  }
})
const assignHandle = (user: any) => {
  const payload = {
    card_id: props.details._id,
    assigned_to: user?.user_info?._id
    // variable_id: id,
  }
  moveCard.mutate(payload)

}
</script>

<style scoped>
/* simple fade for the dropdowns already defined elsewhere */
</style>