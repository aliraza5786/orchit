<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="text-xs font-medium text-text-secondary uppercase tracking-wider">
      {{ label }}
    </label>
    <div class="flex flex-col gap-2">
      <div
        v-for="option in options"
        :key="option._id"
        class="flex items-center gap-2"
      >
        <Checkbox
          :checked="Array.isArray(modelValue) && modelValue.includes(option._id)"
          :disabled="disabled"
          :label="option.title"
          @change="(e: any) => toggle(option._id, e.target.checked)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Checkbox from './Checkbox.vue';

const props = defineProps<{
  modelValue: (string | number)[];
  options: { title: string; _id: string | number }[];
  label?: string;
  disabled?: boolean;
}>();

const emit = defineEmits(['update:modelValue']);

function toggle(id: string | number, checked: boolean) {
  const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
  if (checked) {
    if (!current.includes(id)) current.push(id);
  } else {
    const idx = current.indexOf(id);
    if (idx > -1) current.splice(idx, 1);
  }
  emit('update:modelValue', current);
}
</script>
