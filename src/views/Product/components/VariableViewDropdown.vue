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
              placeholder="Search variables"
              class="w-full bg-bg-input border border-border rounded-md pl-9 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-text-secondary/50"
              ref="searchInput"
            />
          </div>
        </div>

        <div class="max-h-[400px] overflow-y-auto py-1 scrollbar-custom">
          <!-- Recent used Section -->
          <template v-if="!searchQuery && recentOption">
            <div class="px-3 py-1.5">
              <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Recent used</span>
            </div>
            <div 
              :ref="(el) => { if (el && recentOption) itemRefs['recent-' + recentOption._id] = el; }"
              @click="handleOptionClick(recentOption, 'recent-')"
              @mouseenter="handleMouseEnter(recentOption, 'recent-')"
              @mouseleave="handleItemLeave"
              class="px-3 py-2 flex items-center justify-between cursor-pointer transition-colors group relative"
              :class="modelValue === recentOption?._id ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-bg-body text-text-primary'"
            >
              <div class="flex items-center gap-2 min-w-0">
                 <i v-if="recentOption.icon" :class="[recentOption.icon.prefix, recentOption.icon.iconName]" class="text-accent text-[14px]"></i>
                 <span class="text-xs truncate">{{ recentOption.title }}</span>
              </div>
              
              <div class="flex items-center gap-1">
                 <i v-if="recentOption.nested?.length" class="fa-regular fa-ellipsis text-[12px] text-text-secondary"></i>
              </div>
            </div>
          </template>

          <!-- All Fields Section -->
          <div v-if="filteredOptions.length > 0" class="px-3 py-1.5 mt-1 border-t border-border/40">
            <span class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">All fields</span>
          </div>
          
          <div 
            v-for="option in filteredOptions" 
            :key="option._id"
            :ref="(el) => { if (el) itemRefs[option._id] = el; }"
            @click="handleOptionClick(option)"
            @mouseenter="handleMouseEnter(option)"
            @mouseleave="handleItemLeave"
            class="px-3 py-2 flex items-center justify-between cursor-pointer transition-colors group relative"
            :class="modelValue === option._id ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-bg-body text-text-primary'"
          >
            <div class="flex items-center gap-2 min-w-0">
               <i v-if="option.icon" :class="[option.icon.prefix, option.icon.iconName]" class="text-accent text-[14px]"></i>
               <span class="text-xs truncate">{{ option.title }}</span>
            </div>

            <div class="flex items-center gap-1">
               <i v-if="option.nested?.length" class="fa-regular fa-ellipsis text-[12px] text-text-secondary"></i>
            </div>
          </div>
        </div>

        <!-- Footer: Add New -->
        <div v-if="canCreateVariable" class="border-t border-border mt-1 sticky bottom-0 bg-bg-dropdown">
          <button 
            @click="emit('add-new')"
            class="w-full px-4 py-2 text-left text-xs text-text-primary hover:bg-bg-dropdown-menu-hover transition-colors flex items-center gap-2"
          >
             <i class="fa-solid fa-plus"></i> Add new
          </button>
        </div>
      </div>
    </Transition>

    <!-- Single Teleported Nested Menu -->
    <Teleport to="body">
      <div
        v-if="hoveredOptionId && activeNestedOptions.length"
        ref="nestedMenuRef"
        :style="nestedStyles"
        class="z-[10000] min-w-48 bg-bg-dropdown border border-border rounded-md shadow-lg max-h-60 overflow-y-auto scrollbar-custom"
        @mouseenter="keepMenuOpen"
        @mouseleave="handleMouseLeave"
        @click.stop
      >
        <ul class="py-1 text-sm">
          <li
            v-for="subOption in activeNestedOptions"
            :key="subOption._id"
            class="px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer text-text-primary"
            @click="emitNestedSelectFromActive(subOption)"
          >
            {{ subOption.title }}
          </li>
        </ul>
      </div>
    </Teleport>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, type CSSProperties } from 'vue';
import { computePosition, autoUpdate, flip, shift, offset } from "@floating-ui/dom";
import { onClickOutside } from "@vueuse/core";

interface IconData {
  prefix: string;
  iconName: string;
}

interface Option {
  _id: string;
  title: string;
  icon?: IconData;
  nested?: Option[];
  is_checkbox_table?: boolean;
}

const props = defineProps<{
  triggerRef: HTMLElement | null;
  modelValue: string;
  options: Option[];
  canCreateVariable?: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'close', 'nested-select', 'add-new']);

const dropdownRef = ref<HTMLElement | null>(null);
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const itemRefs = ref<Record<string, any>>({});
const nestedMenuRef = ref<HTMLElement | null>(null);

const dropdownStyles = ref<CSSProperties>({
  position: "fixed",
  top: "-9999px",
  left: "-9999px",
});

const nestedStyles = ref<CSSProperties>({
  position: 'fixed',
  top: '-9999px',
  left: '-9999px'
});

let cleanupFloating: (() => void) | null = null;
let cleanupNested: (() => void) | null = null;

const recentId = ref(localStorage.getItem('last_selected_view_by') || '');

const recentOption = computed(() => {
  if (!recentId.value) return null;
  return props.options.find(o => o._id === recentId.value);
});

const filteredOptions = computed(() => {
  const q = searchQuery.value.toLowerCase();

  return props.options.filter(o => {
    const matchesSearch = o.title.toLowerCase().includes(q);

    // ❌  hide if is_checkbox_table === true
    const isHidden = o.is_checkbox_table === true;

    return matchesSearch && !isHidden;
  });
});

function selectOption(option: Option) {
  if (option._id !== props.modelValue) {
    localStorage.setItem('last_selected_view_by', props.modelValue);
    recentId.value = props.modelValue;
  }
  emit('update:modelValue', option._id);
  emit('close');
}

function handleOptionClick(option: Option, idPrefix: string = '') {
  if (option.nested?.length) {
    const targetId = idPrefix + option._id;
    if (hoveredOptionId.value === targetId) {
      handleMouseLeave();
    } else {
      handleMouseEnter(option, idPrefix);
    }
  } else {
    selectOption(option);
  }
}

function emitNestedSelect(subOption: Option, parentOption: Option) {
    if (parentOption._id !== props.modelValue) {
    localStorage.setItem('last_selected_view_by', props.modelValue);
    recentId.value = props.modelValue;
  }
  emit('nested-select', subOption);
  emit('update:modelValue', parentOption._id);
  emit('close');
}

/* ------- Nested Menu Hover Logic ------- */
const hoveredOptionId = ref<string | null>(null);
const activeOption = ref<Option | null>(null);
let hoverTimeout: any = null;

const activeNestedOptions = computed(() => activeOption.value?.nested || []);

function handleMouseEnter(option: Option, idPrefix: string = '') {
  if (hoverTimeout) clearTimeout(hoverTimeout);
  const targetId = idPrefix + option._id;
  hoveredOptionId.value = targetId;
  activeOption.value = option;
  if (option.nested?.length) {
    nextTick(() => startNestedFloating(targetId));
  }
}

function keepMenuOpen() {
  if (hoverTimeout) clearTimeout(hoverTimeout);
}

function handleMouseLeave() {
  if (hoverTimeout) clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(() => {
    hoveredOptionId.value = null;
    activeOption.value = null;
    if (cleanupNested) { cleanupNested(); cleanupNested = null; }
  }, 150);
}

function handleItemLeave() {
  handleMouseLeave();
}

function emitNestedSelectFromActive(subOption: Option) {
  if (activeOption.value) {
    emitNestedSelect(subOption, activeOption.value);
  }
}

function startNestedFloating(id: string) {
  const reference = itemRefs.value[id];
  const floating = nestedMenuRef.value;
  if (cleanupNested) { cleanupNested(); cleanupNested = null; }
  if (reference && floating) {
    cleanupNested = autoUpdate(reference, floating, () => {
      computePosition(reference, floating, {
        placement: 'right-start',
        strategy: 'fixed',
        middleware: [offset(10), flip(), shift()]
      }).then(({ x, y }) => {
        nestedStyles.value = { position: 'fixed', left: `${x-7}px`, top: `${y}px` };
      });
    });
  }
}

/* ------- Main Positioning Logic ------- */
function updatePosition() {
  if (!props.triggerRef || !dropdownRef.value) return;

  computePosition(props.triggerRef, dropdownRef.value, {
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [
      offset(5),
      flip(),
      shift({ padding: 10 }),
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
  if (cleanupNested) cleanupNested();
});

onClickOutside(dropdownRef, (e) => {
  if (props.triggerRef?.contains(e.target as Node)) return;
  // If click is in nested menu, don't close
  if (nestedMenuRef.value?.contains(e.target as Node)) return;
  emit('close');
});

</script>

<style scoped>
.scrollbar-custom::-webkit-scrollbar {
  width: 4px;
}
.scrollbar-custom::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-custom::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 10px;
}
.scrollbar-custom::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}
</style>
