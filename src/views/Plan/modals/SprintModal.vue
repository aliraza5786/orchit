<template>
  <BaseModal v-model="isOpen" modalClass="!py-0" size="md">
    <!-- Header -->
    <div
      class="sticky top-0 z-10 flex flex-col items-start pt-6 px-6 border-b border-border  bg-bg-input pb-4"
    >
      <h2 class="text-xl font-semibold">Add New Sprint</h2>
      <!-- <p class="text-sm text-text-secondary mt-1">
        Add sprint name and then click <span class="font-medium">Save</span>.
      </p> -->
    </div>

    <!-- Body -->
    <div class="px-6 gap-4  bg-bg-input pt-5 pb-8">
      <!-- Name (required) -->
      <BaseTextField
        class="rounded-1"
        v-model="form.name"
        label="Name"
        placeholder="Sprint 1"
        :error="!!nameError"
        :message="nameError"
        @blur="touched.name = true"
      />
      <BaseSelectField
      class="rounded-1 mt-3"
      v-model="form.sprintType"
      label="Sprint Type"
      :options="sprintTypes"
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
        placeholder="Sprint description..."
        type="textarea"
        :rows="4" 
      />
       </div>
    
      <div></div>
    </div>

    <!-- Footer -->
    <div
      class="flex justify-end gap-2 p-6 sticky bottom-0  bg-bg-input border-t border-border"
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

/** Emits */
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "save", v:any): void;
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

/** v-model proxy for BaseModal */
const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

/** Local form */
const form = reactive<any>({
  name: "",
  sprintType: "",
  description: ''
});

/** Touched + validation */
const touched = reactive({ name: false });

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
    value: String(form.sprintType || "").trim(),
    description: String(form.description || '').trim()
  });
}

/** Utils */
function resetTouched() {
  touched.name = false;
}
/** Hydrate form when sprint changes or when opened */
watch(
  () => props.sprint,
  (s:any) => {
    if (!s) {
      form.name = "";
      return;
    }
    form.name = s.name ?? s?.title ?? "";
    form.sprintType = s.sprintType ?? s?.sprintType ?? "";
    form.description = s.description ?? ''

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

</script>