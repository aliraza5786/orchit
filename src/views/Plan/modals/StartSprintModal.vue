<template>
  <BaseModal v-model="isOpen" modalClass="!py-0" size="md">
    <!-- Header -->
    <div
      class="sticky top-0 z-10 flex justify-between items-center py-6 px-6 border-b border-border bg-bg-input"
    >
      <h2 class="text-xl font-semibold" v-if="!updateData?.id">Start {{ formattedSprintType }}</h2>
      <h2 class="text-xl font-semibold" v-if="updateData?.id">Update {{ formattedSprintType }}</h2>
      <span @click="cancel" class="text-sm text-text-secondary cursor-pointer">
        <i class="fa-solid fa-xmark text-text-primary text-[19px]"></i>
      </span>
    </div>
    <!-- Body -->
    <div class="px-6 grid grid-cols-2 gap-4 bg-bg-input pt-5">
      <!-- sprint name -->
      <div class="flex flex-col col-span-2">
        <BaseTextField
          v-model="form.sprint_name"
          :label="`${formattedSprintType} Name`"
          :placeholder="`Enter ${sprintType} name`"
          size="md"
          class="rounded-1"
        />
      </div>
      <div class="flex flex-col col-span-2">
        <BaseSelectField
          v-model="form.duration"
          :options="durationOptions"
          label="Duration"
          placeholder="Select duration"
          :disabled="isUpdate"
        />
      </div>

      <!-- Start date -->
      <div class="flex gap-1 flex-col col-span-2 sm:col-span-1">
        <label class="text-sm font-medium">Start date</label>
        <div
          class="border relative flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
          :class="startError ? 'border-red-500' : ''"
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
        <p v-if="startError" class="text-xs text-red-500">{{ startError }}</p>
      </div>

      <!-- End date -->
      <div class="flex gap-1 flex-col col-span-2 sm:col-span-1">
        <label class="text-sm font-medium">End date</label>
        <div
          class="border relative flex items-center border-border h-10 px-2 bg-bg-input rounded-lg"
          :class="endError ? 'border-red-500' : ''"
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
        <p v-if="endError" class="text-xs text-red-500">{{ endError }}</p>
      </div>

      <!-- Goal (optional) -->
      <div class="flex flex-col col-span-2">
        <label class="text-sm font-medium pb-1">Goal (optional)</label>
        <textarea
          v-model="form.goal"
          class="w-full text-sm rounded-md border border-border px-3 py-2 bg-bg-input"
          rows="2"
          placeholder="Ship onboarding flow"
        />
      </div>

      <div class="flex flex-col col-span-2">
        <p
          class="bg-bg-body wfull px-4 py-3 rounded-lg text-xs text-text-secondary"
        >
          Duration: {{ form.start ? durationDays + " days" : "" }}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-2 p-6 sticky bottom-0 bg-bg-input">
      <Button variant="secondary" @click="cancel">Cancel</Button>
      <Button variant="primary" :disabled="!isValid" @click="save" v-if="!updateData.id">{{
        creatingSprint ? "Starting..." : "Start"
      }}</Button>
      <Button variant="primary" :disabled="!isValid" @click="save" v-if="updateData.id">{{
        creatingSprint ? "Updating..." : "Update"
      }}</Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from "vue";
import BaseModal from "../../../components/ui/BaseModal.vue";
import Button from "../../../components/ui/Button.vue";
import DatePicker from "../../Product/components/DatePicker.vue";
import type { Sprint } from "../composables/useBacklogStore";
import BaseTextField from "../../../components/ui/BaseTextField.vue";
import BaseSelectField from "../../../components/ui/BaseSelectField.vue";
import { useSidePanelStore } from "../../../stores/sidePanelStore";

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
    sprint: Sprint;
    creatingSprint: boolean;
    sprintType: string;
  }>(),
  { modelValue: false },
);

const durationOptions = [
  { _id: 1, title: "1 Week" },
  { _id: 2, title: "2 Weeks" },
  { _id: 3, title: "3 Weeks" },
  { _id: 4, title: "4 Weeks" },
  { _id: 5, title: "Custom" },
];

/** v-model proxy for BaseModal */
const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const sidePanelStore = useSidePanelStore();
const updateData = computed(() => sidePanelStore.startedSprint);
const isUpdate = computed(() => !!updateData.value && !!updateData.value._id);

const form = reactive<any>({
  goal: "",
  start: new Date().toISOString().slice(0, 10),
  end: "",
  sprint_name: "",
  duration: null,
});

const formattedSprintType = computed(() => {
  if (!props.sprintType) return "";
  return props.sprintType.charAt(0).toUpperCase() + props.sprintType.slice(1);
});

/** Touched + validation */
const touched = reactive({ start: false, end: false });

const startError = computed(() => {
  if (!form.start && touched.start) return "Start date is required";
  return "";
});

const endError = computed(() => {
  if (!form.end && touched.end) return "End date is required";
  if (form.start && form.end) {
    const s = toDayStartMs(form.start);
    const e = toDayStartMs(form.end);
    if (Number.isFinite(s) && Number.isFinite(e) && e < s)
      return "End date cannot be before start date";
  }
  return "";
});

const isValid = computed(() => {
  return !startError.value && !endError.value && form.sprint_name.trim();
});

/** Handlers */
function setStartDate(v: string | null) {
  form.start = v || "";
  touched.start = true;
}

function setEndDate(v: string | null) {
  form.end = v || "";
  touched.end = true;
}

function cancel() {
  isOpen.value = false;
  resetForm();
  emit("close");
}

function save() {
  touched.start = true;
  touched.end = true;

  if (!isValid.value) return;

  emit("save", {
    title: form.sprint_name || "new sprint",
    duration: String(durationDays.value) || null,
    start: form.start || "",
    end: form.end || "",
    goal: form.goal ?? "",
  });

  resetForm();
}

function resetForm() {
  form.goal = "";
  form.start = new Date().toISOString().slice(0, 10);
  form.end = "";
  form.sprint_name = "";
  form.duration = null;
  resetTouched();
}

/** Utils */
function resetTouched() {
  touched.start = false;
  touched.end = false;
}

function toDayStartMs(val?: string | null) {
  if (!val) return NaN;
  return new Date(`${val}T00:00:00`).getTime();
}

const isCustom = computed(() => form.duration === 5);

// Watch for duration changes (only for add mode)
watch(
  () => form.duration,
  (newDuration) => {
    if (isUpdate.value || !newDuration || newDuration === 5 || !form.start)
      return;

    // Auto-calculate end date based on duration
    form.end = addDays(form.start, newDuration * 7);
  },
);

// Watch for start date changes
watch(
  () => form.start,
  (v) => {
    if (!v) return;

    // Only auto-calculate end date in add mode with non-custom duration
    if (!isUpdate.value && form.duration && form.duration !== 5) {
      form.end = addDays(form.start, form.duration * 7);
    }

    // Always ensure end >= start
    if (form.end && toDayStartMs(form.end) < toDayStartMs(form.start)) {
      form.end = form.start;
    }
  },
);

function addDays(date: string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Calculate duration in days
const durationDays = computed(() => {
  if (!form.start || !form.end) return 0;

  const startMs = toDayStartMs(form.start);
  const endMs = toDayStartMs(form.end);

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return 0;

  // Calculate the difference in days
  return Math.round((endMs - startMs) / 86400000);
});

function isoToDateString(iso: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Map duration days to dropdown option
function getDurationOption(days: number) {
  if (days === 7) return 1; // 1 Week
  if (days === 14) return 2; // 2 Weeks
  if (days === 21) return 3; // 3 Weeks
  if (days === 28) return 4; // 4 Weeks
  return 5; // Custom
}

/** Hydrate form when sprint changes (for add mode via props) */
watch(
  () => props.sprint,
  (s) => {
    if (!s || isUpdate.value) return;

    form.goal = s.goal ?? "";
    form.start = s.start ?? new Date().toISOString().slice(0, 10);
    form.end = s.end ?? "";
    form.sprint_name = s.title ?? "";
    form.duration = null;
    resetTouched();
  },
  { immediate: true },
);

/** Hydrate form when updateData changes (for update mode via store) */
watch(
  updateData,
  (data) => {
    if (!data) {
      resetForm();
      return;
    }

    form.sprint_name = data.sprint_name ?? "";
    form.start = isoToDateString(data.start);
    form.end = isoToDateString(data.end);
    form.goal = data.goal ?? "";

    // Set duration dropdown based on actual duration
    if (data.duration) {
      const days = Number(data.duration);
      form.duration = getDurationOption(days);
    } else {
      form.duration = 5; // Custom
    }
  },
  { immediate: true },
);
</script>
