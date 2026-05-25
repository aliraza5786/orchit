<template>
  <div class="relative inline-flex items-center" ref="searchContainer">
    <!-- Overlay Input -->
    <transition
      enter-active-class="transition-all duration-300 ease-out overflow-hidden"
      enter-from-class="opacity-0 max-w-0 !px-0 !border-transparent"
      enter-to-class="opacity-100 max-w-xs"
      leave-active-class="transition-all duration-200 ease-in overflow-hidden"
      leave-from-class="opacity-100 max-w-xs"
      leave-to-class="opacity-0 max-w-0 !px-0 !border-transparent"
    >
      <div
        v-if="isExpanded"
        class="absolute right-full mr-2 h-8.5 w-64 bg-bg-body border border-bg-input rounded-[6px] flex items-center px-3 shadow-md z-10"
        :class="inputContainerClass"
      >
        <input
          type="text"
          v-model="internalValue"
          ref="searchInput"
          class="flex-1 bg-transparent text-sm text-text-primary placeholder-text-secondary outline-none w-full"
          :placeholder="placeholder"
          @keyup.enter="handleEnter"
          @blur="handleBlur"
        />
      </div>
    </transition>

    <!-- Trigger Button -->
    <button
      type="button"
      class="flex items-center justify-center shrink-0 transition-colors"
      :class="buttonClass"
      :style="buttonStyle"
      @click="toggleSearch"
      :title="placeholder"
    >
      <slot name="icon">
        <i class="fa-solid fa-magnifying-glass text-[13px]"></i>
      </slot>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { onClickOutside } from '@vueuse/core';

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
  buttonClass?: string;
  buttonStyle?: any;
  inputContainerClass?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'enter'): void;
}>();

const isExpanded = ref(false);
const searchInput = ref<HTMLInputElement | null>(null);
const searchContainer = ref<HTMLElement | null>(null);

const internalValue = computed({
  get: () => props.modelValue || '',
  set: (val) => {
    emit('update:modelValue', val);
  }
});

const toggleSearch = async () => {
  if (isExpanded.value && internalValue.value) {
    // If it's expanded and has text, clicking the button could mean "search now"
    // Since we map typing natively via modelValue, we just leave it open or handle as needed.
    // The instructions say "when user click on again it should closed".
    isExpanded.value = false;
  } else {
    isExpanded.value = !isExpanded.value;
    if (isExpanded.value) {
      await nextTick();
      searchInput.value?.focus();
    }
  }
};

const handleEnter = () => {
  emit('enter');
};

const handleBlur = () => {
  // If we want it to close on blur when empty, we can do it here. 
  // Let's keep it handled by onClickOutside.
};

onClickOutside(searchContainer, () => {
  if (isExpanded.value && !internalValue.value) {
    isExpanded.value = false;
  }
});

watch(() => props.modelValue, (newVal) => {
  // if some external event clears the search, we might optionally collapse it
  if (!newVal && !searchInput.value?.matches(':focus')) {
    isExpanded.value = false;
  }
});
</script>
