<template>
  <div :class="theme === 'dark' ? 'text-white' : 'text-text-primary '">
    <!-- Label + Tooltip -->
    <label v-if="label" :class="[
      ' font-medium mb-1 flex items-center',
      size === 'md' ? 'text-sm' : 'text-base',
      theme === 'dark' ? 'text-white' : 'text-text-primary '
    ]">
      {{ label }}
      <span v-if="tooltip" class="inline-block text-text-secondary  ml-1 cursor-help" :title="tooltip">
        <img src="../../assets/icons/info.svg" alt="info" />
      </span>
    </label>

    <!-- Input wrapper -->
    <div class="relative">
      <div :class="[
        'flex items-center border rounded-xl px-3 py-2 w-full text-sm focus-within:ring-2',
        size === 'md' ? 'h-10' : 'h-12',
        error ? 'border-red-500 focus-within:ring-red-500' : ' focus-within:ring-black',
        theme == 'dark' ? 'bg-[#131318] border-border  ' : 'bg-bg-input border-border'
      ]">
        <!-- Prefix slot -->
        <span v-if="$slots.prefix" class="mr-2 text-text-secondary">
          <slot name="prefix" />
        </span>

        <!-- Input -->
        <input v-bind="$attrs" v-model="model" :type="type" :placeholder="placeholder" :class="[
          'w-full outline-none bg-transparent',
          theme == 'dark' ? '!text-white placeholder-white/70' : 'text-text-primary placeholder-text-secondary '
        ]" />

        <!-- Suffix slot -->
        <span v-if="$slots.suffix" class="ml-2 text-text-secondary">
          <slot name="suffix" />
        </span>
      </div>
    </div>

    <!-- Help/Error Text -->
    <p v-if="message" class="mt-2 text-xs flex items-center gap-1"
      :class="error ? 'text-red-500' : theme === 'dark' ? 'text-text-secondary' : 'text-text-secondary'">
      <slot v-if="$slots.msgIcon" name="msgIcon" /> {{ message }}
    </p>
  </div>
</template>


<script setup lang="ts">
import { computed } from 'vue';

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

    theme?: 'dark' | 'light'
  }>(),
  {
    size: 'md',
    type: 'text',
    error: false,
    theme: 'light',

  }
);

const emit = defineEmits(['update:modelValue']);

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});
</script>