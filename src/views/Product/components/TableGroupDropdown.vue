<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div 
        ref="dropdownRef"
        class="fixed bg-bg-dropdown border border-border shadow-2xl rounded-[6px] z-[9999] flex flex-col overflow-hidden origin-top-left w-[240px]"
        :style="dropdownStyles"
        @click.stop
      >
        <!-- Search bar -->
        <div class="p-3 border-b border-border">
          <div class="relative">
            <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs"></i>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search grouping options"
              class="w-full bg-bg-input border border-border rounded-md pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-text-secondary/50"
              ref="searchInput"
            />
          </div>
        </div>

        <!-- Options Container -->
        <div class="max-h-[300px] overflow-y-auto py-1">
          <!-- Watch and Track Section -->
          <template v-if="!searchQuery && lastSelectedOption">
            <div class="px-3 py-1.5">
              <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Recent used</span>
            </div>
            <div 
              @click="selectOption(lastSelectedOption.id)"
              class="px-3 py-2 flex items-center justify-between cursor-pointer transition-colors group"
              :class="modelValue === lastSelectedOption.id ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-bg-body text-text-primary'"
            >
              <div class="flex items-center gap-2">
                 <span class="text-xs">{{ lastSelectedOption.label }}</span>
              </div>
              <i v-if="modelValue === lastSelectedOption.id" class="fa-solid fa-check text-[10px]"></i>
            </div>
          </template>

          <!-- All Fields Section -->
          <div v-if="filteredOptions.length > 0" class="px-3 py-1.5 mt-1 border-t border-border/40">
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">All fields</span>
          </div>
          
          <div 
            v-for="option in filteredOptions" 
            :key="option.id"
            @click="selectOption(option.id)"
            class="px-3 py-2 flex items-center justify-between cursor-pointer transition-colors group"
            :class="modelValue === option.id ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-bg-body text-text-primary'"
          >
            <span class="text-xs">{{ option.label }}</span>
            <i v-if="modelValue === option.id" class="fa-solid fa-check text-[10px]"></i>
          </div>
        </div>

        <!-- Footer: Clear Selection -->
        <div class="border-t border-border mt-1">
          <button 
            @click="selectOption('')"
            class="w-full px-3 py-2.5 text-left text-xs text-text-secondary hover:bg-bg-body hover:text-text-primary transition-colors flex items-center gap-2"
          >
             Clear selection
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, type CSSProperties } from 'vue';
import { computePosition, autoUpdate, flip, shift, offset } from "@floating-ui/dom";
import { onClickOutside } from "@vueuse/core";

const props = defineProps<{
  triggerRef: HTMLElement | null;
  modelValue: string;
}>();

const emit = defineEmits(['update:modelValue', 'close']);

const dropdownRef = ref<HTMLElement | null>(null);
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);

const dropdownStyles = ref<CSSProperties>({
  position: "fixed",
  top: "-9999px",
  left: "-9999px",
});

let cleanupFloating: (() => void) | null = null;

const allOptions = [
  { id: 'priority', label: 'Priority' },
  { id: 'status', label: 'Status' },
  { id: 'assignee', label: 'Assignee' },
  { id: 'owner', label: 'Owner/Reporter' },
  { id: 'card_type', label: 'Card Type' },
];

const lastSelectedGroup = ref(localStorage.getItem('last_selected_group') || '');

const lastSelectedOption = computed(() => {
  if (!lastSelectedGroup.value) return null;
  return allOptions.find(o => o.id === lastSelectedGroup.value);
});

const filteredOptions = computed(() => {
  const q = searchQuery.value.toLowerCase();
  return allOptions.filter(o => 
    o.label.toLowerCase().includes(q) && 
    o.id !== lastSelectedGroup.value
  );
});

function selectOption(id: string) {
  if (id !== props.modelValue && props.modelValue) {
    localStorage.setItem('last_selected_group', props.modelValue);
    lastSelectedGroup.value = props.modelValue;
  }
  emit('update:modelValue', id);
  emit('close');
}

function updatePosition() {
  if (!props.triggerRef || !dropdownRef.value) return;

  computePosition(props.triggerRef, dropdownRef.value, {
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [
      offset(5),
      flip(),
      shift({ padding: 5 }),
    ],
  }).then(({ x, y }) => {
    dropdownStyles.value = {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
    };
  });
}

onMounted(() => {
  nextTick(() => {
    updatePosition();
    if (props.triggerRef && dropdownRef.value) {
      cleanupFloating = autoUpdate(props.triggerRef, dropdownRef.value, updatePosition);
    }
    searchInput.value?.focus();
  });
});

onBeforeUnmount(() => {
  if (cleanupFloating) cleanupFloating();
});

onClickOutside(dropdownRef, (e) => {
  if (props.triggerRef?.contains(e.target as Node)) return;
  emit('close');
});

</script>

<style scoped>
div::-webkit-scrollbar {
  width: 4px;
}
div::-webkit-scrollbar-track {
  background: transparent;
}
div::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}
div::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
