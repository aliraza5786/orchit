<template>
  <BaseModal v-model="isOpen" modalClass="!py-0" size="md" :title="`Add New ${formattedLabel}`">
    
    <div class="px-6 gap-4 bg-bg-input pt-5 pb-8">
      <!-- Name (required) -->
      <BaseTextField
        class="rounded-1"
        v-model="form.name"
        label="Name"
        :placeholder="lable"
        :error="!!nameError"
        :message="nameError"
        @blur="touched.name = true"
      />
 
      <!-- Extra Fields Based on Type -->
      <!-- Milestone: Number of Sprints -->
      <div v-if="form.sprintType === 'milestone'" class="flex flex-col mt-3">
        <BaseSelectField
          v-model="form.num_sprints"
          :options="[
            { _id: 1, title: '1' },
            { _id: 2, title: '2' },
            { _id: 3, title: '3' },
            { _id: 4, title: '4' },
            { _id: null, title: 'More' }
          ]"
          label="Number of Sprints"
          placeholder="Select number of sprints"
        />
      </div>

      <!-- Sprint: Parent Milestone -->
      <div v-if="form.sprintType === 'sprint'" class="flex flex-col mt-3">
        <BaseSelectField
          v-model="form.parent_sprint_id"
          :options="milestoneOptions"
          label="Select Milestone"
          placeholder="Choose milestone"
          :disabled="milestoneOptions.length <= 1"
        />
      </div>

      <!-- Huddle: Parent Sprint -->
      <div v-if="form.sprintType === 'huddle'" class="flex flex-col mt-3">
        <BaseSelectField
          v-model="form.parent_sprint_id"
          :options="sprintOptionsList"
          label="Select Sprint"
          placeholder="Choose sprint"
          :disabled="sprintOptionsList.length <= 1"
        />
      </div>

      <!-- Duration -->
      <div class="mt-3">
        <BaseSelectField
          v-model="form.duration"
          :options="durationOptions"
          label="Duration"
          placeholder="Select duration"
        />
      </div>

      <!-- Dates -->
      <div class="grid grid-cols-2 gap-4 mt-3">
        <!-- Start date -->
        <div class="flex gap-1 flex-col">
          <label class="text-sm font-medium">Start date</label>
          <div
            class="border relative flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
          >
            <DatePicker
              placeholder="Set start date"
              class="w-full z-1"
              :model-value="form.start"
              emit-as="ymd"
              @update:modelValue="setStartDate"
            />
            <i class="fa-regular fa-calendar absolute right-2 top-3 z-0"></i>
          </div>
        </div>

        <!-- End date -->
        <div class="flex gap-1 flex-col">
          <label class="text-sm font-medium">End date</label>
          <div
            class="border relative flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
          >
            <DatePicker
              placeholder="Set end date"
              class="w-full"
              :model-value="form.end"
              emit-as="ymd"
              :disabled="!isCustom"
              @update:modelValue="setEndDate"
              :min-date="form.start"
            />
            <i
              class="fa-regular fa-calendar absolute right-2 top-3 z-0"
              :class="{
                'text-text-secondary/30 pointer-events-none': !isCustom,
                'text-text-primary': isCustom,
              }"
            ></i>
          </div>
        </div>
      </div>

      <!-- Goal -->
      <div class="mt-3">
        <BaseTextAreaField
          v-model="form.goal"
          label="Goal"
          placeholder="Enter goal..."
          :rows="2"
        />
      </div>

      <div class="flex flex-col mt-3">
        <p
          class="bg-bg-body w-full px-4 py-3 rounded-lg text-xs text-text-secondary"
          v-if="form.start && form.end"
        >
          Duration: {{ durationDays }} days
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="flex justify-end gap-2 p-6 sticky bottom-0 bg-bg-input border-t border-border"
    >
      <Button variant="secondary" @click="cancel">Cancel</Button>
      <Button variant="primary" :disabled="!isValid" @click="save">{{
        creatingSprint ? "Saving..." : "Save"
      }}</Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from "vue";
import BaseModal from "../../../components/ui/BaseModal.vue";
import BaseTextField from "../../../components/ui/BaseTextField.vue";
import Button from "../../../components/ui/Button.vue";
import type { Sprint } from "../composables/useBacklogStore";
import BaseTextAreaField from "../../../components/ui/BaseTextAreaField.vue";
import BaseSelectField from "../../../components/ui/BaseSelectField.vue";
import DatePicker from "../../Product/components/DatePicker.vue";
import { useWorkspaceId } from "../../../composables/useQueryParams";
import { useGroupedSprints } from "../../../queries/usePlan";

/** Emits */
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "save", v: any): void;
  (e: "close"): void;
}>();

/** Props */
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    lable: string;
    sprint: Sprint;
    creatingSprint: boolean;
    sprints:any
  }>(),
  { modelValue: false }
);
const formattedLabel = computed(() => {
  if (!props.lable) return "";
  return props.lable.charAt(0).toUpperCase() + props.lable.slice(1);
});
/** v-model proxy for BaseModal */
const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

/** Local form */
const form = reactive<any>({
  name: "",
  sprintType: "",
  description: "",
  duration: null,
  start: new Date().toISOString().slice(0, 10),
  end: "",
  goal: "",
  num_sprints: null,
  parent_sprint_id: null,
});

const { workspaceId } = useWorkspaceId();
const { data: groupedSprints } = useGroupedSprints(workspaceId);

const milestoneOptions = computed(() => {
  const milestones = [
    { _id: null, title: "None" },
    ...(groupedSprints.value?.grouped?.milestone || []).map((m: any) => ({
      _id: m._id,
      title: m.title
    }))
  ];
  return milestones;
});

const sprintOptionsList = computed(() => {
  const sprints = [
    { _id: null, title: "None" },
    ...(groupedSprints.value?.grouped?.sprint || []).map((s: any) => ({
      _id: s._id,
      title: s.title
    }))
  ];
  return sprints;
});

const durationOptions = computed(() => {
  if (form.sprintType === 'milestone') {
    return [
      { _id: 14, title: "2 Weeks" },
      { _id: 28, title: "4 Weeks" },
      { _id: 42, title: "6 Weeks" },
      { _id: 56, title: "8 Weeks" },
      { _id: -1, title: "Custom" },
    ];
  }
  if (form.sprintType === 'huddle') {
    return [
      { _id: 1, title: "1 Day" },
      { _id: 2, title: "2 Days" },
      { _id: 3, title: "3 Days" },
      { _id: -1, title: "Custom" },
    ];
  }
  // Sprint
  return [
    { _id: 7, title: "1 Week" },
    { _id: 14, title: "2 Weeks" },
    { _id: 21, title: "3 Weeks" },
    { _id: 28, title: "4 Weeks" },
    { _id: -1, title: "Custom" },
  ];
});

const isCustom = computed(() => form.duration === -1);

function setStartDate(v: string | null) {
  form.start = v || "";
}

function setEndDate(v: string | null) {
  form.end = v || "";
}

function addDays(date: string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Watch for duration changes
watch(
  () => form.duration,
  (newDuration) => {
    if (!newDuration || newDuration === -1 || !form.start) return;
    form.end = addDays(form.start, newDuration);
  },
);

// Watch for start date changes
watch(
  () => form.start,
  (v) => {
    if (!v) return;
    if (form.duration && form.duration !== -1) {
      form.end = addDays(form.start, form.duration);
    }
  },
);

function toDayStartMs(val?: string | null) {
  if (!val) return NaN;
  return new Date(`${val}T00:00:00`).getTime();
}

// Calculate duration in days
const durationDays = computed(() => {
  if (!form.start || !form.end) return 0;

  const startMs = toDayStartMs(form.start);
  const endMs = toDayStartMs(form.end);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;

  return Math.round((endMs - startMs) / 86400000);
});

/** Touched + validation */
const touched = reactive({
  name: false,
  sprintType: false,
  description: false,
});

const nameError = computed(() =>
  touched.name && !String(form.name || "").trim() ? "Name is required" : ""
);

const isValid = computed(
  () => !!String(form.name || "").trim() && !nameError.value
);

function cancel() {
  isOpen.value = false;
  emit("close");
}

function save() {
  touched.name = true;

  if (!isValid.value) return;
  emit("save", {
    name: String(form.name || "").trim(),
    value: String(props.lable || "").trim(),
    duration: form.duration ? String(form.duration) : null,
    start: form.start,
    end: form.end,
    goal: form.goal,
    num_sprints: form.num_sprints,
    parent_sprint_id: form.parent_sprint_id,
  });
}

/** Utils */
function resetTouched() {
  touched.name = false;
  touched.sprintType = false;
  touched.description = false;
}
watch(
  () => props.sprint,
  (s: any) => {
    if (!s) {
      form.name = "";
      form.sprintType = null;
      form.description = "";
      form.duration = null;
      form.start = new Date().toISOString().slice(0, 10);
      form.end = "";
      form.goal = "";
      form.num_sprints = null;
      form.parent_sprint_id = null;
      return;
    }
    form.name = s.title || s.name || "";
    form.description = s.description || "";
    form.sprintType = s.sprintType || null;
    form.duration = s.duration ? Number(s.duration) : null;
    form.start = s.start ? s.start.slice(0, 10) : new Date().toISOString().slice(0, 10);
    form.end = s.end ? s.end.slice(0, 10) : "";
    form.goal = s.goal || "";
    form.num_sprints = s.num_sprints || null;
    form.parent_sprint_id = s.parent_sprint_id || null;
    resetTouched();
  },
  { immediate: true }
);

// sprint types options
const sprintTypes = [
  { title: "Milestone", _id: "milestone", dot: "#2e9bda" },
  { title: "Sprint", _id: "sprint", dot: "#7d68c8" },
  { title: "Huddle", _id: "huddle", dot: "#eea832" },
];

const sprintTypeOptions = computed(() => sprintTypes.map((t) => ({ ...t })));
// Watch label changes and auto-select
watch(
  () => props.lable,
  (newLabel) => {
    if (!newLabel) return;
    const lowerLabel = newLabel.toLowerCase();

    // Reset form fields that depend on type
    form.description = "";
    form.num_sprints = null;
    form.parent_sprint_id = null;
    resetTouched();

    // Set sprint type
    const match = sprintTypeOptions.value.find(
      (o) => o._id === lowerLabel || o.title.toLowerCase() === lowerLabel
    );
    form.sprintType = match?._id ?? "";

    // Auto-generate name
    autoFillFormName();

    // Default parents and num_sprints for NEW items
    if (!props.sprint) {
      if (lowerLabel === 'sprint' && milestoneOptions.value.length > 1) {
        form.parent_sprint_id = milestoneOptions.value[1]._id;
        form.duration = 7; // Default 1 week
      } else if (lowerLabel === 'huddle' && sprintOptionsList.value.length > 1) {
        form.parent_sprint_id = sprintOptionsList.value[1]._id;
        form.duration = 1; // Default 1 day
      } else if (lowerLabel === 'milestone') {
        form.num_sprints = 4;
        form.duration = 14; // Default 2 weeks
      }
    }
  },
  { immediate: true }
);

// pre fill title
function autoFillFormName() {
  const sprints = props.sprints || [];
  const baseTitle = props.lable;
  const capitalizedTitle = baseTitle.charAt(0).toUpperCase() + baseTitle.slice(1);
  form.name = `${capitalizedTitle} ${sprints.length + 1}`;
}


// Watch sprints and auto-fill form.name if empty
watch(
  () => props.sprints,
  () => {
    if (!form.name || form.name.trim() === "") {
      autoFillFormName();
    }
  },
  { immediate: true, deep: true }
);

</script>
