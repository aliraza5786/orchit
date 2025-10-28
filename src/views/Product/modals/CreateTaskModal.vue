<template>
  <BaseModal v-model="isOpen" modalClass="!py-0" size="lg">
    <!-- Header -->
    <div class="sticky top-0 z-10 flex flex-col items-start pt-6 px-6 border-b border-border bg-bg-body pb-4 mb-4">
      <h2 class="text-xl font-semibold">Create Ticket</h2>
      <p class="text-sm text-text-secondary mt-1">
        Provide the details below and click <span class="font-medium">Add Ticket</span>.
      </p>
    </div>

    <!-- Body -->
    <div class="px-6 grid grid-cols-2 gap-4">
      <!-- Title -->
      <BaseTextField v-model="form.title" label="Ticket Title" placeholder="e.g., Implement real-time notifications"
        :error="!!titleError" :message="titleError" @blur="touched.title = true" />

      <!-- Lane (required) -->
      <div class="flex flex-col" v-if="laneOptions.length>0">
        <BaseSelectField size="md" label="Lane" :options="laneOptions" placeholder="Select lane" :allowCustom="false"
          :model-value="form.lane_id" @update:modelValue="setLane" />
      </div>

      <!-- Dynamic Select Variables -->
      <BaseSelectField size="md" v-for="item in selectVariables" v-show="item?._id != selectedVariable"
        :key="getVarKey(item)" v-model="form.variables[item.slug]" :options="mapOptions(item.data)" :label="item.title"
        placeholder="Select value" :allowCustom="true" />

      <!-- Start date -->
      <div class="flex gap-1 flex-col" v-if="!pin">
        <label class="text-sm">Start date</label>
        <div class="border flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
          :class="startDateError ? 'border-red-500' : ''">
          <DatePicker placeholder="Set start date" class="w-full" :model-value="form.startDate" emit-as="ymd"
            @update:modelValue="setStartDate" />
        </div>
        <p v-if="startDateError" class="text-xs text-red-500">{{ startDateError }}</p>
      </div>

      <!-- End date -->
      <div class="flex gap-1 flex-col" v-if="!pin">
        <label class="text-sm">End date</label>
        <div class="border flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
          :class="endDateError ? 'border-red-500' : ''">
          <DatePicker placeholder="Set end date" class="w-full" :model-value="form.endDate" emit-as="ymd"
            @update:modelValue="setEndDate" />
        </div>
        <p v-if="endDateError" class="text-xs text-red-500">{{ endDateError }}</p>
      </div>
    </div>

    <div class="px-6 mt-2">
      <BaseRichTextEditor label="Description" placeholder="What needs to be done, acceptance criteria, links…"
        @blur="touched.description = true" v-model="form.description" />
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-2 p-6 mt-8 sticky bottom-0 bg-bg-body border-t border-border">
      <Button variant="secondary" @click="cancel">Cancel</Button>
      <Button variant="primary" :disabled="!isValid || isSubmitting" @click="create">
        {{ isSubmitting ? 'Adding…' : 'Add Ticket' }}
      </Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import Button from '../../../components/ui/Button.vue'
import { useAddTicket, useLanes, useVariables } from '../../../queries/useSheets'
import { useRouteIds } from '../../../composables/useQueryParams'
import BaseRichTextEditor from '../../../components/ui/BaseRichTextEditor.vue'
import DatePicker from '../components/DatePicker.vue'
import { useQueryClient } from '@tanstack/vue-query'

/** Emits */
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created', payload: any): void
}>()

/** Props */
const props = withDefaults(
  defineProps<{ modelValue: boolean; sheet_id?: string; listId?: string | number, selectedVariable: any, pin?: Boolean }>(),
  { modelValue: false }
)
const queryClient = useQueryClient()
const { workspaceId, moduleId } = useRouteIds()
const { mutate: addTicket, isPending: isSubmitting } = useAddTicket({
  onSuccess: () => {
    reset()
    queryClient.invalidateQueries({ queryKey: ['sheet-list'] })
    isOpen.value = false
  }
})

/** Lanes */
type Lane = { _id: string | number; variables?: Record<string, any> }
const { data: lanes } = useLanes(workspaceId.value)

/** Variables from sheets */
type Variable = {
  _id?: string
  id?: string
  title: string
  type?: { title?: string }
  data: string[]
  slug: string
}
const { data: variables } = useVariables(workspaceId.value, moduleId.value)

/** Modal open proxy */
const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

/** Filter to "Select" variables */
const selectVariables = computed<Variable[]>(() =>
  (variables?.value ?? []).filter((v: any) => v?.type?.title === 'Select')
)

/** Option mapping */
type Option = { _id: string | number; title: string }
const mapOptions = (arr: string[]): Option[] => arr.map(e => ({ _id: e, title: e }))

/** Lane options (memoized) */
const laneOptions = computed<Option[]>(() =>
  (lanes?.value ?? []).map((el: Lane) => ({
    _id: el._id,
    title: el?.variables?.['lane-title'] ?? String(el._id)
  }))
)

/** Helpers */
const getVarKey = (v: Variable) => v.slug

/** Form */
type SelectValue = string | number | null
type Form = {
  title: string
  description: string
  startDate: string | null
  endDate: string | null
  lane_id: SelectValue
  variables: Record<string, SelectValue>
}
const form = reactive<Form>({
  title: '',
  description: '',
  startDate: null,
  endDate: null,
  lane_id: null,
  variables: {}
})

/** Initialize dynamic selects to null */
watch(
  selectVariables,
  list => {
    for (const v of list) {
      const k = getVarKey(v)
      if (!(k in form.variables)) form.variables[k] = null
    }
  },
  { immediate: true }
)

/** Auto-pick the only lane (UX nicety) */

/** Touched & Validation */
const touched = reactive({
  title: false,
  description: false,
  startDate: false,
  endDate: false,
  lane: false
})

const titleError = computed(() => (touched.title && !form.title.trim() ? 'Title is required' : ''))
const startDateError = computed(() => {
  if (!touched.startDate) return ''
  if (!form.startDate) return 'Start date is required'
  return ''
})
const endDateError = computed(() => {
  if (!touched.endDate) return ''
  if (!form.endDate) return 'End date is required'
  if (form.startDate && form.endDate && form.endDate < form.startDate) return 'End date cannot be before start date'
  return ''
})
const laneError = computed(() => {
  if (!touched.lane) return ''
  if (form.lane_id === null || form.lane_id === undefined || form.lane_id === '') return 'Lane is required'
  return ''
})

const isValid = computed(
  () =>
    !titleError.value &&
    !startDateError.value &&
    !endDateError.value &&
    !laneError.value &&
    !!form.title.trim() &&
    (!props.pin ? !!form.startDate &&
      !!form.endDate : true)

)

/** Date + Lane handlers */
function setStartDate(v: string | null) {
  form.startDate = v
  touched.startDate = true
}
function setEndDate(v: string | null) {
  form.endDate = v
  touched.endDate = true
}
function setLane(v: SelectValue) {
  form.lane_id = v
  touched.lane = true
}

/** Actions */
function cancel() {
  isOpen.value = false
  reset()
}
function reset() {
  form.title = ''
  form.description = ''
  form.startDate = null
  form.endDate = null
  form.lane_id = null
  form.variables = {}
  touched.title = false
  touched.description = false
  touched.startDate = false
  touched.endDate = false
  touched.lane = false
}
const selectedVar = computed(() => variables.value.find((e:any) => e?._id == props.selectedVariable))

function create() {
  touched.title = true
  if (!props.pin) {
    touched.startDate = true
    touched.endDate = true
  }
  if (!isValid.value || isSubmitting.value) return
  const payload = {
    sheet_list_id: props.listId,
    workspace_id: workspaceId.value,
    sheet_id: props.sheet_id,
    workspace_lane_id: form.lane_id, // ✅ included and required
    variables: { ...form.variables, [`${selectedVar.value?.slug}`]: props.listId, ['card-title']: form.title.trim(), ['card-description']: form.description.trim(), ['start-date']: form.startDate, ['end-date']: form.endDate, },
    createdAt: new Date().toISOString()
  }
  addTicket(payload)
}
</script>