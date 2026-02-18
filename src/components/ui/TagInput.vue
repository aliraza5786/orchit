<template>
  <div class="space-y-3">
    <!-- Label -->
    <label class="text-sm text-text-primary">{{ label }}</label>

    <!-- Tags Container -->
    <div
      class="w-full flex flex-wrap gap-2 p-3 bg-bg-body border border-border rounded-lg min-h-11"
      @click="focusInput"
    >
      <!-- Tag Chips -->
      <div
        v-for="(tag, index) in modelValue.filter((t) => t.trim())"
        :key="index"
        class="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/30 rounded-full group hover:bg-accent/15 transition-colors"
      >
        <span class="text-sm text-accent font-medium">{{ tag }}</span>
        <button
          type="button"
          @click.stop="removeTag(index)"
          class="opacity-60 hover:opacity-100 transition-opacity"
          :aria-label="`Remove ${tag}`"
        >
          <svg
            class="w-4 h-4 text-accent"
            fill="none"
            stroke="red"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Input Field -->
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        :placeholder="modelValue.filter((t) => t.trim()).length === 0 ? placeholder : ''"
        @keydown.enter.prevent="addTag"
        @keydown.comma.prevent="addTag"
        @keydown.delete="handleDelete"
        class="flex-1 min-w-24 bg-transparent text-sm outline-none text-text-primary placeholder-text-secondary"
      />
    </div>

    <!-- Helper Text -->
    <p class="text-xs text-text-secondary">
      Press Enter or comma to add  and Click the X to remove
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Props {
  modelValue: string[];
  label: string;
  placeholder?: string;
}

interface Emits {
  (e: "update:modelValue", value: string[]): void;
}

const inputRef = ref<HTMLInputElement>();
const inputValue = ref("");

const emit = defineEmits<Emits>();

const addTag = () => {
  const trimmedValue = inputValue.value.trim();
  if (trimmedValue && !props.modelValue.includes(trimmedValue)) {
    emit("update:modelValue", [...props.modelValue, trimmedValue]);
    inputValue.value = "";
  }
};

const removeTag = (index: number) => {
  const newTags = props.modelValue.filter((_, i) => i !== index);
  emit("update:modelValue", newTags);
};

const handleDelete = () => {
  if (inputValue.value === "" && props.modelValue.length > 0) {
    const newTags = props.modelValue.slice(0, -1);
    emit("update:modelValue", newTags);
  }
};

const focusInput = () => {
  inputRef.value?.focus();
};

const props = defineProps<Props>();
</script>

<style scoped>
.inline-flex {
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
