<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" class="text-xs font-medium text-text-secondary uppercase tracking-wider">
      {{ label }}
    </label>
    <div class="flex flex-col gap-2">
      <label
        v-for="option in options"
        :key="option._id"
        class="flex items-center gap-2 cursor-pointer group"
        :class="{ 'opacity-60 cursor-not-allowed': disabled }"
      >
        <div class="relative flex items-center justify-center">
          <input
            type="radio"
            :name="name"
            :value="option._id"
            :checked="modelValue === option._id"
            :disabled="disabled"
            class="sr-only"
            @change="$emit('update:modelValue', option._id)"
          />
          <div
            class="w-4 h-4 rounded-full border transition-colors flex items-center justify-center"
            :class="[
              isDark ? 'border-orchit-white/10' : 'border-border',
              modelValue === option._id ? 'bg-accent border-accent' : 'bg-bg-card'
            ]"
          >
            <div v-if="modelValue === option._id" class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
        </div>
        <span class="text-sm" :class="isDark ? 'text-white' : 'text-text-primary'">{{ option.title }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '../../composables/useTheme';
const { isDark } = useTheme();

defineProps<{
  modelValue: string | number | null;
  options: { title: string; _id: string | number }[];
  label?: string;
  name?: string;
  disabled?: boolean;
}>();

defineEmits(['update:modelValue']);
</script>
