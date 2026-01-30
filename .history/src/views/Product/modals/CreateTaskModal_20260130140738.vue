<template>
  <BaseModal v-model="isOpen" modalClass="!py-0" :size="size">
    <!-- Header -->
    <div
      class="sticky top-0 z-10 flex flex-col items-start pt-6 px-6 border-b border-border bg-bg-body pb-4 mb-4"
    >
     <div class="flex justify-between w-full">
     <h2 class="text-xl font-semibold">Create Ticket</h2>
     <div
      class="w-6 h-6 rounded-full cursor-pointer hover:bg-border/50 transition p-0.5"
      @click="cancel"
      title="Close"
    >
    <i class="fa-solid fa-xmark text-sm"></i>
    </div>
     </div>
      <p class="text-sm text-text-secondary mt-1">
        Provide the details below and click <span class="font-medium">Add Ticket</span>.
      </p>
    </div>

    <!-- Body -->
    <div class="px-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
      <BaseTextField
        v-model="form.title"
        label="Ticket Title"
        placeholder="e.g., Implement real-time notifications"
        :error="!!titleError"
        :message="titleError"
        @blur="touched.title = true"
      />

      <!-- Lane -->
      <div class="flex flex-col" v-if="laneOptions.length > 0">
        <BaseSelectField
          size="md"
          label="Tab"
          :options="laneOptions"
          placeholder="Select tab"
          :allowCustom="false"
          :model-value="form.lane_id"
          @update:modelValue="setLane"
          :error="!!laneError"
          :message="laneError"
        />
      </div>

      <!-- Dynamic Select Variables -->
      <BaseSelectField
        size="md"
        v-for="item in selectVariables"
        v-show="item?._id != selectedVariable && item?.title !== 'Process'"
        :key="getVarKey(item)"
        v-model="form.variables[item.slug]"
        :options="mapOptions(item.data)"
        :label="item.title"
        placeholder="Select value"
        :allowCustom="true"
      />

      <!-- Start date -->
      <div class="flex gap-1 flex-col" v-if="!pin">
        <label class="text-sm">Start date</label>
        <div
          class="border flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
          :class="startDateError ? 'border-red-500' : ''"
        >
          <DatePicker
            placeholder="Set start date"
            class="w-full"
            :model-value="form.startDate"
            emit-as="ymd"
            @update:modelValue="setStartDate"
            :min-date="today"
          />
        </div>
        <p v-if="startDateError" class="text-xs text-red-500">{{ startDateError }}</p>
      </div>

      <!-- End date -->
      <div class="flex gap-1 flex-col" v-if="!pin">
        <label class="text-sm">End date</label>
        <div
          class="border flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
          :class="endDateError ? 'border-red-500' : ''"
        >
          <DatePicker
            placeholder="Set end date"
            class="w-full"
            :model-value="form.endDate"
            emit-as="ymd"
            @update:modelValue="setEndDate"
            :min-date="form.startDate || today"
          />
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
      <div v-if="route.path.includes('/plan')" class="flex flex-col">
  <BaseSelectField
    size="md"
    label="Select Sheet"
    placeholder="Select Sheet"
    :options="sheetOptions"
    :model-value="selected_sheet_id"
    :allowCustom="false"
    @update:modelValue="onSheetChange"
  />
</div>

    </div>

    <div class="px-6 mt-2">
      <BaseRichTextEditor
        label="Description"
        placeholder="What needs to be done, acceptance criteria, links…"
        v-model="form.description"
        @blur="touched.description = true"
      />
      <!-- <p v-if="descriptionError" class="text-xs text-red-500 mt-1 px-1">{{ descriptionError }}</p> -->
    </div>

    <!-- Footer -->
    <div
      class="flex justify-end gap-2 p-6 mt-8 sticky bottom-0 bg-bg-body border-t border-border"
    >
      <Button variant="secondary" @click="cancel">Cancel</Button>
      <Button variant="primary" :disabled="isSubmitting" @click="create">
        {{ isSubmitting ? "Adding…" : "Add Ticket" }}
      </Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, computed, watch, ref } from "vue";
import BaseModal from "../../../components/ui/BaseModal.vue";
import BaseTextField from "../../../components/ui/BaseTextField.vue";
import BaseSelectField from "../../../components/ui/BaseSelectField.vue";
import Button from "../../../components/ui/Button.vue";
import { useAddTicket, useLanes, useVariables, useSheets } from "../../../queries/useSheets";
import { useRouteIds } from "../../../composables/useQueryParams";
import BaseRichTextEditor from "../../../components/ui/BaseRichTextEditor.vue";
import DatePicker from "../components/DatePicker.vue";
import AssigmentDropdown from "../components/AssigmentDropdown.vue";
import { useQueryClient } from "@tanstack/vue-query";
import { usePermissions } from "../../../composables/usePermissions";
import { useSprintKanban } from "../../../queries/usePlan"
import { useRoute } from "vue-router";
const { canCreateCard, canEditSheet,
  canDeleteSheet,
  canCreateSheet, } = usePermissions();
const route = useRoute();
/** Emits */
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "created", payload: any): void;
}>();

/** Props */
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    sheet_id?: string;
    listId?: string | number;
    selectedVariable: any;
    pin?: Boolean;
    size?: string;
  }>(),
  { modelValue: false, size: "lg" }
);
const queryClient = useQueryClient();
const { workspaceId, moduleId } = useRouteIds();
const { mutate: addTicket, isPending: isSubmitting } = useAddTicket({
  onSuccess: () => {
    reset();
    queryClient.invalidateQueries({ queryKey: ["sheet-list"] });
    isOpen.value = false;
    refetchSheetLists();
  },
  
});
const { refetch: refetchSheetLists, } = useSprintKanban(
  localStorage.getItem("activeSprintId") || "",
);
/** Lanes */
type Lane = { _id: string | number; variables?: Record<string, any> };
const { data: lanes } = useLanes(workspaceId.value);

/** Variables from sheets */
type Variable = {
  _id?: string;
  id?: string;
  title: string;
  type?: { title?: string };
  data: string[];
  slug: string;
};
const module_id= ref(localStorage.getItem("selectedModuleId") ||"");
const {
  data
} = useSheets({
  workspace_id: workspaceId,
  workspace_module_id: module_id,
});
const sheetId = computed(() => (data.value ? data.value[0]?._id : ""));

const selected_sheet_id = ref<any>(sheetId.value);
const isCreateSheetModal = ref(false);
const selectedSheettoAction = ref<any>();
const resolvedSheetId = computed(() => {
  return props.sheet_id || selected_sheet_id.value || ''
})
const { data: variables } = useVariables(
  workspaceId,
  moduleId,
  resolvedSheetId
)

/** Modal open proxy */
const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

/** Filter to "Select" variables */
const selectVariables = computed<Variable[]>(() =>
  (variables?.value ?? []).filter((v: any) => v?.type?.title === "Select")
);

/** Option mapping */
type Option = { _id: string | number; title: string };
const mapOptions = (arr: string[]): Option[] => arr.map((e) => ({ _id: e, title: e }));

/** Lane options (memoized) */
const laneOptions = computed<Option[]>(() => {
  const opts = (lanes?.value ?? []).map((el: Lane) => ({
    _id: el._id,
    title: el?.variables?.["lane-title"] ?? String(el._id),
  }));

  // Ensure "Main" exists in the options
  if (!opts.find((o:any) => o.title === "Main")) {
    opts.unshift({ _id: "main", title: "Main" });
  }

  return opts;
});



/** Helpers */
const getVarKey = (v: Variable) => v.slug;

/** Form */
type SelectValue = string | number | null;
type Form = {
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  lane_id: SelectValue;
  assignee: any;
  variables: Record<string, SelectValue>;
};
const form = reactive<Form>({
  title: "",
  description: "",
  startDate: null,
  endDate: null,
  lane_id: null,
  assignee: null,
  variables: {},
});

/** Initialize dynamic selects to null */
watch(
  selectVariables,
  (list) => {
    for (const v of list) {
      const k = getVarKey(v);
      if (!(k in form.variables)) form.variables[k] = null;
    }
  },
  { immediate: true }
);

/** Auto-pick the only lane (UX nicety) */

/** Touched & Validation */
const touched = reactive({
  title: false,
  description: false,
  startDate: false,
  endDate: false,
  lane: false,
});

const isValid = computed(
  () =>
    !!form.title.trim() &&
    (!props.pin ? !!form.startDate && !!form.endDate : true) &&
    !titleError.value &&
    !startDateError.value &&
    !endDateError.value &&
    !laneError.value
);

/** Date + Lane handlers */
function setStartDate(v: string | null) {
  form.startDate = v;
  touched.startDate = true;
}
function setEndDate(v: string | null) {
  form.endDate = v;
  touched.endDate = true;
}
function setLane(v: SelectValue) {
  form.lane_id = v;
  touched.lane = true;
}

function setAssignee(user: any) {
  form.assignee = user;
}
interface IconData {
  prefix: string;
  iconName: string;
}
interface DropdownOption {
  _id: string;
  title: string;
  icon: IconData;
  status:string
}

function openEditSprintModal(opt: any) {
  isCreateSheetModal.value = true;
  selectedSheettoAction.value = opt;
}
const transformedData = computed<DropdownOption[]>(() => {  
  return (data.value || []).map((item: any) => ({
    _id: item._id,
    title: item?.variables["sheet-title"],
    description: item?.variables["sheet-description"],
    icon: item["icon"],
    status: item?.generation_status || localStorage.getItem("selectedStatusTitle"),
  }));
});
const isOpenSelect = ref(false);

const selectOption = (option: any) => {
  console.log("Selected option:", option);
  selected_sheet_id.value = option._id;
};

const showDeleteModal = ref(false);
function handleDeleteSheetModal(opt: any) {
  showDeleteModal.value = true;
  selectedSheettoAction.value = opt;
}
const createSheet = () => {
  selectedSheettoAction.value = {};
  isCreateSheetModal.value = !isCreateSheetModal.value;
};

/** Actions */
function cancel() {
  isOpen.value = false;
  reset();
}
function reset() {
  form.title = "";
  form.description = "";
  form.startDate = null;
  form.endDate = null;
  form.lane_id = null;
  form.assignee = null;
  form.variables = {};
  touched.title = false;
  touched.description = false;
  touched.startDate = false;
  touched.endDate = false;
  touched.lane = false;
}

const selectedVar = computed(() =>
  variables.value?.find((e: any) => e?._id == props.selectedVariable)
);

const titleError = computed(() =>
  touched.title && !form.title.trim() ? "Title is required" : ""
);

const startDateError = computed(() => {
  if (!touched.startDate) return "";
  if (!form.startDate) return "Start date is required";
  return "";
});

const endDateError = computed(() => {
  if (!touched.endDate) return "";
  if (!form.endDate) return "End date is required";
  if (form.startDate && form.endDate && form.endDate < form.startDate)
    return "End date cannot be before start date";
  return "";
});

const laneError = computed(() => {
  if (!touched.lane) return "";
  if (!form.lane_id) return "Lane is required";
  return "";
});

// const descriptionError = computed(() =>
//   touched.description && !form.description.trim() ? 'Description is required' : ''
// )
const today = new Date().toISOString().split("T")[0];
function create() {
  // mark all as touched
  touched.title = true;

  touched.description = true;
  if (!props.pin) {
    touched.startDate = true;
    touched.endDate = true;
  }

  // prevent submission if invalid
  if (!isValid.value || isSubmitting.value) return;
  if (!canCreateCard.value) return;

 const variableKey = selectedVar.value?.slug;

const payload = {
  sheet_list_id: props.listId,
  workspace_id: workspaceId.value,
  sheet_id: props.sheet_id || selected_sheet_id.value,
  ...(form.lane_id && form.lane_id !== "main"
    ? { workspace_lane_id: form.lane_id }
    : {}),
  variables: {
    ...form.variables,
    ...(variableKey ? { [variableKey]: props.listId } : {}),
    ["card-title"]: form.title.trim(),
    ["card-description"]: form.description.trim(),
    ["start-date"]: form.startDate,
    ["end-date"]: form.endDate,
    ["card-status"]: localStorage.getItem("selectedStatusTitle")
  },
  seat_id: form.assignee?._id ?? null,
  sprint_id: localStorage.getItem("activeSprintId") || null,
  createdAt: new Date().toISOString(),
};

  addTicket(payload);
}
watch(
  () => form.title,
  (v) => {
    if (v?.trim() && touched.title) touched.title = false;
  }
);
watch(
  () => form.lane_id,
  (v) => {
    if (v && touched.lane) touched.lane = false;
  }
);
watch(
  () => form.startDate,
  (v) => {
    if (v && touched.startDate) touched.startDate = false;
  }
);
watch(
  () => form.endDate,
  (v) => {
    if (v && touched.endDate) touched.endDate = false;
  }
);
watch(
  () => form.description,
  (v) => {
    if (v?.trim() && touched.description) touched.description = false;
  }
);

watch(laneOptions, (options) => {
  // Only set default if user hasn’t picked any lane yet
  if (!form.lane_id) {
    const mainLane = options.find(o => o.title === "Main");
    if (mainLane) form.lane_id = mainLane._id;
  }
}, { immediate: true });
const sheetOptions = computed(() =>
  transformedData.value.map(sheet => ({
    _id: sheet._id,
    title: sheet.title,
  }))
);

</script>
