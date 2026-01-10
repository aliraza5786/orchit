<template>
  <div :class="isDarkTheme ? 'text-white' : 'text-text-primary '">
    <!-- Label + Tooltip -->
    <label
      v-if="label"
      :class="[
        ' font-medium mb-1 flex items-center',
        size === 'md' ? 'text-sm' : 'text-base',
        isDarkTheme ? 'text-white' : 'text-text-primary '
      ]"
    >
      {{ label }}
      <span v-if="tooltip" class="inline-block text-text-secondary  ml-1 cursor-help" v-tooltip="tooltip">
        <img src="../../assets/icons/info.svg" alt="info" />
      </span>
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <div
        :class="[
          'flex items-center border rounded-md px-3 py-2 w-full text-sm focus-within:ring-2',
          size === 'md' ? 'h-10' : 'h-12',
          error ? 'border-red-500 focus-within:ring-red-500' : ' focus-within:ring-black',
          isDarkTheme ? 'bg-[#131318] border-border  ' : 'bg-bg-input border-border'
        ]"
      >
        <!-- Prefix slot -->
        <span v-if="$slots.prefix" class="mr-2 text-text-secondary">
          <slot name="prefix" />
        </span>

        <!-- Input -->
        <input
          v-bind="$attrs"
          v-model="model"
          :type="inputType"
          :placeholder="placeholder"
          :class="[
            'w-full outline-none bg-transparent',
            isDarkTheme ? '!text-white placeholder-white/70' : 'text-text-primary placeholder-text-secondary '
          ]"
        />

        <!-- Suffix slot -->
        <span v-if="$slots.suffix" class="ml-2 text-text-secondary">
          <slot name="suffix" />
        </span>

        <!-- Password visibility toggle -->
        <button
          v-if="props.type === 'password'"
          type="button"
          class="ml-2 inline-flex items-center justify-center text-text-secondary hover:opacity-80 focus:outline-none"
          @click="isPasswordVisible = !isPasswordVisible"
          :aria-label="isPasswordVisible ? 'Hide password' : 'Show password'"
        >
          <!-- Eye icon -->
          <svg
            v-if="!isPasswordVisible"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            aria-hidden="true"
          >
            <path d="M2.25 12s3.75-6.75 9.75-6.75 9.75 6.75 9.75 6.75-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z"/>
            <path d="M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
          </svg>
          <!-- Eye-off icon -->
         <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M3 3l18 18" />
            <path d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Help/Error Text -->
    <p
      v-if="message"
      class="mt-2 text-xs flex items-center gap-1"
      :class="error ? 'text-red-500' : isDarkTheme ? 'text-text-secondary' : 'text-text-secondary'"
    >
      <slot v-if="$slots.msgIcon" name="msgIcon" /> {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
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
    type?: string;
    size?: any;
    theme?: string; 
  }>(),
  {
    size: 'md',
    type: 'text',
    error: false,
    theme: 'system',
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>();

const model = computed({
  get: () => props.modelValue,
  set: (val: string) => emit('update:modelValue', val),
});

const isDarkTheme = computed(() => {
  return props.theme === 'dark' || (props.theme === 'system' && isDark.value);
});

/** Password visibility */
const isPasswordVisible = ref(false);
const inputType = computed(() =>
  props.type === 'password' ? (isPasswordVisible.value ? 'text' : 'password') : props.type
);
</script>
