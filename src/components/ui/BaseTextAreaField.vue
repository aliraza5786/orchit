<template>
  <div :class="isDarkTheme ? 'text-white' : 'text-text-primary'">
    <!-- Label + Tooltip -->
    <label
      v-if="label"
      class="text-[16px] font-medium mb-1 flex items-center"
      :class="[isDarkTheme ? 'text-white' : 'text-text-primary', ]"
    >
      {{ label }}
      <span
        v-if="tooltip"
        class="inline-block text-text-secondary -400 ml-1 cursor-help"
        v-tooltip="tooltip"
      >
        <img src="../../assets/icons/info.svg" alt="info" />
      </span>
    </label>

    <!-- Textarea wrapper -->
    <div
      class="border rounded-md px-3 py-2  text-sm"
      :class="[
        isDarkTheme ? 'bg-[#131318] border-border 353D50] ' : 'bg-bg-input border-border ',
        error ? 'border-red-500 focus-within:ring-red-500' : ''
      ]"
    >
      <textarea
        v-bind="$attrs"
        v-model="model"
        :placeholder="placeholder"
        rows="4"
        class="w-full outline-none resize-none bg-transparent text-sm"
        :class="isDarkTheme ? 'text-white placeholder-white/70' : 'text-text-primary placeholder-text-secondary'"
      />
    </div>

    <!-- Help/Error Text -->
    <p
      v-if="message"
      class="mt-1 text-xs"
      :class="error ? 'text-red-500' : isDarkTheme ? 'text-text-secondary ' : 'text-text-secondary '"
    >
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTheme } from '../../composables/useTheme';

const { isDark } = useTheme();

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    tooltip?: string;
    message?: string;
    error?: boolean;
    placeholder?: string;
    theme?: string;
  }>(),
  {
    theme: 'system',
  }
);

const emit = defineEmits(["update:modelValue"]);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isDarkTheme = computed(() => {
  return props.theme === 'dark' || (props.theme === 'system' && isDark.value);
});
</script>
