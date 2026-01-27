<template>
  <BaseModal v-model="isOpen" modalClass="!py-0" size="md">
    <!-- Header -->
    <div
      class="sticky top-0 z-10 flex flex-col items-start pt-6 px-6 border-b border-border bg-bg-input pb-4"
    >
      <h2 class="text-xl font-semibold">Add New {{ formattedLabel }}</h2>
    </div>
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

      <!-- spacer to keep grid balanced -->
      <!-- Description -->
      <div class="mt-3">
        <BaseTextAreaField
          v-model="form.description"
          label="Description"
          :placeholder="`${formattedLabel} description...`"
          type="textarea"
          :rows="4"
        />
      </div>

      <div></div>
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
// import BaseSelectField from "../../../components/ui/BaseSelectField.vue";

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
    description: String(form.description || "").trim(),
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
      return;
    }
    form.name = "";
    form.description = "";
    form.sprintType = s.sprintType ?? null; // must be _id
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

    // Reset form completely
    form.description = "";
    form.sprintType = "";
    resetTouched();

    // Set sprint type
    const match = sprintTypeOptions.value.find(
      (o) => o.title === newLabel
    );
    form.sprintType = match?._id ?? "";

    // Auto-generate name
    autoFillFormName();
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
