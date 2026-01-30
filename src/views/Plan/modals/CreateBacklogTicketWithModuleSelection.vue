<template>
  <BaseModal v-model="isOpen" modalClass="!py-0" size="lg" >
    <div class="sticky top-0 z-10 flex flex-col items-start pt-6 px-6 border-b border-border bg-bg-body pb-4 mb-4">
  <div class="w-full flex items-start justify-between">
    <div>
      <h2 class="text-xl font-semibold">Create Backlog Ticket</h2>
      <p class="text-sm text-text-secondary mt-1">
        {{ stepDescription }}
      </p>
    </div>

    <!-- Close button -->
    <button
      class="ml-4 p-2 rounded-md hover:bg-border transition-colors cursor-pointer"
      @click="cancel"
      aria-label="Close"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10 3.636 5.05a1 1 0 011.414-1.414L10 8.586z" clip-rule="evenodd" />
      </svg>
    </button>
  </div>

  <div class="flex items-center gap-2 mt-4 w-full">
    <div v-for="step in 3" :key="step" class="flex items-center flex-1">
      <div class="flex items-center gap-2 flex-1">
        <div
          class="h-1 flex-1 rounded-full transition-colors"
          :class="currentStep >= step ? 'bg-primary' : 'bg-border'"
        ></div>
      </div>
    </div>
  </div>
</div>
    <div class="px-6 min-h-[400px]">
      <div v-if="currentStep === 1">
        <h3 class="text-lg font-medium mb-4">Select Module</h3>
        <div v-if="loadingModules" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <div v-else-if="!modules || modules.length === 0" class="text-center py-12 text-text-secondary">
          No modules available
        </div>
        <div v-else class="grid grid-cols-2 gap-3">
          <button v-for="module in modules" :key="module._id" @click="selectModule(module)"
            class="p-4 border rounded-lg hover:border-primary transition-all text-left group"
            :class="selectedModuleId === module._id ? 'border-primary bg-primary/5' : 'border-border'">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-bg-input flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <i :class="`${module?.variables?.['module-icon']?.prefix} ${module?.variables?.['module-icon']?.iconName}`"
                  class="text-lg"></i>
              </div>
              <div>
                <p class="font-medium">{{ module.variables?.['module-title'] || 'Untitled' }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div v-else-if="currentStep === 2">
        <h3 class="text-lg font-medium mb-4">Select Sheet</h3>
        <div v-if="loadingSheets" class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <div v-else-if="!sheets || sheets.length === 0" class="text-center py-12 text-text-secondary">
          No sheets available for this module
        </div>
        <div v-else class="grid grid-cols-2 gap-3">
          <button v-for="sheet in sheets" :key="sheet._id" @click="selectSheet(sheet)"
            class="p-4 border rounded-lg hover:border-primary transition-all text-left group"
            :class="selectedSheetId === sheet._id ? 'border-primary bg-primary/5' : 'border-border'">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-lg bg-bg-input flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <i
                  :class="`fa ${sheet?.variables['sheet-icon']?.prefix} ${sheet?.variables['sheet-icon']?.iconName} text-lg`"></i>
              </div>
              <div>
                <p class="font-medium">{{ sheet?.variables['sheet-title'] || 'Untitled Sheet' }}</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div v-else-if="currentStep === 3">
        <h3 class="text-lg font-medium mb-4">Ticket Details</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <BaseTextField v-model="form.title" label="Ticket Title" placeholder="e.g., Implement real-time notifications"
            :error="!!titleError" :message="titleError" @blur="touched.title = true" />

          <div class="flex flex-col" v-if="laneOptions.length > 0">
            <BaseSelectField size="md" label="Tab" :options="laneOptions" placeholder="Select tab"
              :allowCustom="false" :model-value="form.lane_id" @update:modelValue="setLane" :error="!!laneError"
              :message="laneError" />
          </div>
          <BaseSelectField
            size="md"
            v-for="item in selectVariables"
            v-show="item?._id != selectedVariable"
            :key="getVarKey(item)"
            v-model="form.variables[item.slug]"
            :options="
              item.data
                .filter((e: string) => e !== 'process')
                .map((e: string) => ({ _id: e, title: e }))
            "
            :label="item.title"
            placeholder="Select value"
            :allowCustom="true"
          />
          <div class="flex gap-1 flex-col">
            <label class="text-sm">Start date</label>
            <div class="border flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
              :class="startDateError ? 'border-red-500' : ''">
              <DatePicker placeholder="Set start date" class="w-full" :model-value="form.startDate" emit-as="ymd"
                @update:modelValue="setStartDate" :min-date="today" />
            </div>
            <p v-if="startDateError" class="text-xs text-red-500">{{ startDateError }}</p>
          </div>

          <div class="flex gap-1 flex-col">
            <label class="text-sm">End date</label>
            <div class="border flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
              :class="endDateError ? 'border-red-500' : ''">
              <DatePicker placeholder="Set end date" class="w-full" :model-value="form.endDate" emit-as="ymd"
                @update:modelValue="setEndDate" :min-date="form.startDate || today" />
            </div>
            <p v-if="endDateError" class="text-xs text-red-500">{{ endDateError }}</p>
          </div>

          <!-- Assignee -->
             <div class="flex flex-col gap-1">
             <label class="text-sm">Assignee</label>
             <div class="mt-2">
                <AssigmentDropdown 
                  :name="true" 
                  :workspaceId="workspaceId" 
                  @assign="setAssignee" 
                  @unassign="setAssignee(null)"
                  :assigneeId="form.assignee" 
                  :seat="null" 
                  :disabled="false" 
                  :skipPermissionCheck="true"
                  class="w-full"
                />
             </div>
          </div>
        </div>

        <div class="mt-4">
          <BaseRichTextEditor label="Description" placeholder="What needs to be done, acceptance criteria, links…"
            v-model="form.description" @blur="touched.description = true" />
        </div>
      </div>
    </div>

    <div class="flex justify-between gap-2 p-6 mt-8 sticky bottom-0 bg-bg-body border-t border-border">
      <Button v-if="currentStep > 1" variant="secondary" @click="goBack">Back</Button>
      <div v-else></div>
      <div class="flex gap-2">
        <Button variant="secondary" @click="cancel">Cancel</Button>
        <Button v-if="currentStep === 3" variant="primary" :disabled="!isValid || isSubmitting" @click="create">
          {{ isSubmitting ? 'Adding…' : 'Add Ticket' }}
        </Button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import Button from '../../../components/ui/Button.vue'
import { useAddTicket, useLanes, useVariables, useSheets } from '../../../queries/useSheets'
import { useRouteIds } from '../../../composables/useQueryParams'
import BaseRichTextEditor from '../../../components/ui/BaseRichTextEditor.vue'
import DatePicker from '../../Product/components/DatePicker.vue'
import AssigmentDropdown from '../../Product/components/AssigmentDropdown.vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useSingleWorkspace } from '../../../queries/useWorkspace'
import { useSidePanelStore } from '../../../stores/sidePanelStore'
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'created', payload: any): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    listId?: string | number
    selectedVariable?: any
  }>(),
  { modelValue: false }
)

const queryClient = useQueryClient()
const { workspaceId } = useRouteIds()

const currentStep = ref(1)
const selectedModuleId = ref<string | null>(null)
const selectedSheetId = ref<string | null>(null)
const moduleIdForQuery = ref<string>('')
const { data: workspaceData, isLoading: loadingModules } = useSingleWorkspace(workspaceId.value)
const modules = computed(() => workspaceData.value?.modules || [])
const sidePanelStore = useSidePanelStore();
const { data: sheetsData, isFetching: loadingSheets, refetch: refetchSheet } = useSheets(
  {
    workspace_module_id: moduleIdForQuery,
    workspace_id: workspaceId
  },
  {
    enabled: computed(() => !!moduleIdForQuery)
  }
)
watch(() => selectedModuleId.value, () => {
  refetchSheet()
})
const sheets = computed(() => sheetsData.value || [])

const { data: lanes } = useLanes(workspaceId.value)


watch(selectedModuleId, (id) => {
  moduleIdForQuery.value = id ?? ''
})
const { data: variables } = useVariables(workspaceId, moduleIdForQuery, ref(''))

const { mutate: addTicket, isPending: isSubmitting } = useAddTicket({
  onSuccess: () => {
    reset()
    queryClient.invalidateQueries({ queryKey: ['backlog-list'] }) 
    isOpen.value = false
  }
})

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const stepDescription = computed(() => {
  switch (currentStep.value) {
    case 1:
      return 'Select a module to create the ticket in'
    case 2:
      return 'Select a sheet within the module'
    case 3:
      return 'Provide the ticket details below and click Add Ticket'
    default:
      return ''
  }
})

type Variable = {
  _id?: string
  id?: string
  title: string
  type?: { title?: string }
  data: string[]
  slug: string
}

const selectVariables = computed<Variable[]>(() =>
  (variables?.value?.variables ?? [])?.filter((v: any) => v?.type?.title === 'Select' && v?.slug !=='process')
)

type Option = { _id: string | number; title: string }
type Lane = { _id: string | number; variables?: Record<string, any> }
const laneOptions = computed<Option[]>(() => {
  const opts = (lanes?.value ?? []).map((el: Lane) => ({
    _id: el._id,
    title: el?.variables?.['lane-title'] ?? String(el._id)
  }));

  // Ensure "Main" exists in the options
  if (!opts.find((o: any) => o.title === "Main")) {
    opts.unshift({ _id: "main", title: "Main" });
  }

  return opts;
})

const getVarKey = (v: Variable) => v.slug

type SelectValue = string | number | null
type Form = {
  title: string
  description: string
  startDate: string | null
  endDate: string | null
  lane_id: SelectValue
  assignee: any
  variables: Record<string, SelectValue>
}
const form = reactive<Form>({
  title: '',
  description: '',
  startDate: null,
  endDate: null,
  lane_id: null,
  assignee: null,
  variables: {}
})

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

watch([laneOptions, isOpen], ([options, open]) => {
  // Only set default if user hasn’t picked any lane yet or when modal is opening
  if (open && !form.lane_id) {
    const mainLane = options.find(o => o.title === "Main");
    if (mainLane) form.lane_id = mainLane._id;
  }
}, { immediate: true });

const touched = reactive({
  title: false,
  description: false,
  startDate: false,
  endDate: false,
  lane: false
})

const isValid = computed(() =>
  !!form.title.trim() &&
  !!form.lane_id &&
  !!form.startDate &&
  !!form.endDate &&
  !titleError.value &&
  !startDateError.value &&
  !endDateError.value &&
  !laneError.value 
)

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

function setAssignee(user: any) {
  form.assignee = user
}

function selectModule(module: any) {
  selectedModuleId.value = module._id
  currentStep.value = 2
}

function selectSheet(sheet: any) {
  selectedSheetId.value = sheet._id
  currentStep.value = 3
}

function goBack() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function cancel() {
  isOpen.value = false
  reset()
}

function reset() {
  currentStep.value = 1
  selectedModuleId.value = null
  selectedSheetId.value = null
  form.title = ''
  form.description = ''
  form.startDate = null
  form.endDate = null
  form.lane_id = null
  form.assignee = null
  form.variables = {}
  touched.title = false
  touched.description = false
  touched.startDate = false
  touched.endDate = false
  touched.lane = false
  localStorage.removeItem("sprintType");
  localStorage.removeItem("activeMilestoneId");
}

const selectedVar = computed(() =>
  variables?.value?.variables?.find((e: any) => e?._id == props.selectedVariable)
)

const titleError = computed(() => (touched.title && !form.title.trim() ? 'Title is required' : ''))

const startDateError = computed(() => {
  if (!touched.startDate) return ''
  if (!form.startDate) return 'Start date is required'
  return ''
})

const endDateError = computed(() => {
  if (!touched.endDate) return ''
  if (!form.endDate) return 'End date is required'
  if (form.startDate && form.endDate && form.endDate < form.startDate)
    return 'End date cannot be before start date'
  return ''
})

const laneError = computed(() => {
  if (!touched.lane) return ''
  if (!form.lane_id) return 'Lane is required'
  return ''
})

const today = new Date().toISOString().split('T')[0]
function create() {
  touched.title = true
  touched.lane = true
  touched.description = true
  touched.startDate = true
  touched.endDate = true

  if (!isValid.value || isSubmitting.value) return

  const payload = {
    sheet_list_id: props.listId,
    workspace_id: workspaceId.value,
    sheet_id: selectedSheetId.value,
    ...(form.lane_id && form.lane_id !== "main"
      ? { workspace_lane_id: form.lane_id }
      : {}),
    variables: {
      ...form.variables,
      [`${selectedVar.value?.slug}`]: props.listId,
      ['card-title']: form.title.trim(),
      ['card-description']: form.description.trim(),
      ['start-date']: form.startDate,
      ['end-date']: form.endDate,
    },
    seat_id: form.assignee?._id ?? null,
    sprint_id: sidePanelStore.selectedMilestoneId || localStorage.getItem("activeMilestoneId") || null,
    createdAt: new Date().toISOString()
  }

  addTicket(payload)
}

watch(() => form.title, (v) => { if (v?.trim() && touched.title) touched.title = false })
watch(() => form.lane_id, (v) => { if (v && touched.lane) touched.lane = false })
watch(() => form.startDate, (v) => { if (v && touched.startDate) touched.startDate = false })
watch(() => form.endDate, (v) => { if (v && touched.endDate) touched.endDate = false })
watch(() => form.description, (v) => { if (v?.trim() && touched.description) touched.description = false })
</script>
