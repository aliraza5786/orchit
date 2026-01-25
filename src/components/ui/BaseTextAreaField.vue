<template>
  <div :class="theme === 'dark' ? 'text-white' : 'text-text-primary'">
    <!-- Label + Tooltip -->
    <label
      v-if="label"
      class="text-[16px] font-medium mb-2 flex items-center"
      :class="[theme === 'dark' ? 'text-white' : 'text-text-primary', ]"
    >
      {{ label }}
      <span
        v-if="tooltip"
        class="inline-block text-text-secondary -400 ml-1 cursor-help"
        :title="tooltip"
      >
        <img src="../../assets/icons/info.svg" alt="info" />
      </span>
    </label>

    <!-- Textarea wrapper -->
    <div
      class="border rounded-md px-3 py-2  text-sm"
      :class="[
        theme === 'dark' ? 'bg-[#131318] border-border 353D50] ' : 'bg-bg-input border-border ',
        error ? 'border-red-500 focus-within:ring-red-500' : ''
      ]"
    >
      <textarea
        v-bind="$attrs"
        v-model="model"
        :placeholder="placeholder"
        rows="4"
        class="w-full outline-none resize-none bg-transparent text-sm"
        :class="theme === 'dark' ? 'text-white placeholder-white/70' : 'text-text-primary placeholder-text-secondary'"
      />
    </div>

    <!-- Help/Error Text -->
    <p
      v-if="message"
      class="mt-1 text-xs"
      :class="error ? 'text-red-500' : theme === 'dark' ? 'text-text-secondary ' : 'text-text-secondary '"
    >
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    tooltip?: string;
    message?: string;
    error?: boolean;
    placeholder?: string;
    theme?: 'light' | 'dark';
  }>(),
  {
    theme: 'light',
  }
);

const emit = defineEmits(["update:modelValue"]);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>
