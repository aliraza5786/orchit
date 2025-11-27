<template>
  <BaseModal v-model="isOpen" modalClass="!py-0" size="md">
    <!-- Header -->
    <div
      class="sticky top-0 z-10 flex justify-between items-center py-6 px-6 border-b border-border bg-bg-input"
    >
      <h2 class="text-xl font-semibold">Start Sprint</h2>
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
          label="Sprint Name"
          placeholder="Enter sprint name"
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
        />
      </div>

      <!-- Start date -->
      <div class="flex gap-1 flex-col">
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
      <div class="flex gap-1 flex-col">
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
      <Button variant="primary" :disabled="!isValid" @click="save">{{
        creatingSprint ? "Starting..." : "Start"
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

/** Emits */
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "save", v: Partial<Sprint>): void;
  (e: "close"): void;
}>();

/** Props */
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    sprint: Sprint;
    creatingSprint: boolean;
  }>(),
  { modelValue: false }
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

/** Local form */
const form = reactive<any>({
  goal: "",
  start: "",
  end: "",
  sprint_name: "",
  duration: null,
});

/** Hydrate form when sprint changes or when opened */
watch(
  () => props.sprint,
  (s) => {
    if (!s) return;
    form.goal = s.goal ?? "";
    form.start = s.start ?? "";
    form.end = s.end ?? "";
    form.sprint_name = s.title ?? "";
    resetTouched();
  },
  { immediate: true }
);

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
  return !startError.value && !endError.value;
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
  isOpen.value = false;
  emit("close");
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
watch(() => form.duration, (val) => {
  if (!val) return;

  const weeks = typeof val === "object" ? val._id : val;

  if (weeks !== 5 && form.start) {
    const end = addDays(form.start, weeks * 7);
    form.end = end;
  }
});


watch(
  () => form.start,
  (v) => {
    if (!v) return;

    if (form.duration && form.duration !== 5) {
      form.end = addDays(form.start, form.duration * 7);
    }

    // Always ensure end >= start
    if (form.end && toDayStartMs(form.end) < toDayStartMs(form.start)) {
      form.end = form.start;
    }
  }
);
function addDays(date: string, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const durationDays = computed(() => {
  if (!form.start || !form.end) return 0;
  return form.duration !== 5
    ? form.duration * 7
    : (toDayStartMs(form.end) - toDayStartMs(form.start)) / 86400000;
});
</script>
