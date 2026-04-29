<template>
  <div ref="wrapperRef" class="relative inline-block text-left">
    <button
      ref="triggerRef"
      @click="toggle"
      type="button"
        class="text-nowrap inline-flex justify-between items-center gap-2 border rounded-[6px] font-medium cursor-pointer transition bg-transparent px-3 py-1.5 text-sm"
     
      :class="[
        buttonSizeClass, 
        open ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:border-accent-hover'
      ]"
    >
      <!-- prefix (image or component) -->
      <span v-if="selectedOption?.prefix" :class="iconWrapSizeClass">
        <img
          v-if="typeof selectedOption?.prefix === 'string'"
          :src="selectedOption?.prefix"
          :class="iconSizeClass"
        />
        <component v-else :is="selectedOption?.prefix" :class="iconSizeClass" />
      </span>

      <i
  class="text-accent "
  :class="[
    `${selectedOption?.icon?.prefix} ${selectedOption?.icon?.iconName ?? 'file'}`,
    isAgent ? 'text-[6px]' : 'text-[14px]'
  ]"
></i>
<span :class="labelSizeClass">
  <span v-if="prefix" class="font-bold">{{ prefix }}:</span>

  <span class="text-nowrap">
    {{ displayTitle }}
    <template v-if="displayNestedTitle">
      ({{ displayNestedTitle }})
    </template>
  </span>
</span>

      <!-- Chevron -->
      <svg
        class="transition-transform duration-200"
        :class="[chevronSizeClass, 'text-text-secondary mt-1', open? 'rotate-180': '' ]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>

    <!-- Dropdown menu -->
    <Teleport to="body">
      <Transition
        name="fade-scale"
        enter-active-class="transition duration-200 ease-out"
        leave-active-class="transition duration-150 ease-in"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="open"
          ref="menuRef"
          :style="dropdownStyles"
          class="z-[9999] min-w-fit rounded-[6px] border border-border shadow-lg bg-bg-dropdown fixed"
          :class="[
            menuBorderClass,
            props.customClasses ? props.customClasses : '',
          ]"
          @click.stop
        >
          <div class="max-h-[400px] overflow-y-auto">
            <ul :class="['py-1 z-[2]', listTextSizeClass]">
              <li
                v-for="option in options"
                :key="option._id"
                class="group cursor-pointer flex items-stretch text-nowrap hover:bg-bg-dropdown-menu-hover"
                :class="itemPaddingClass"
                @click="handleOptionClick(option)"
                @mouseenter="handleMouseEnter(option)"
                @mouseleave="handleItemLeave"
              >
                <!-- Left: icon/prefix -->
                <div class="flex items-center gap-2 min-w-0 flex-1">
                  <!-- Checkbox for multi-select -->
                  <div v-if="multiple" class="flex-shrink-0 pointer-events-none">
                    <Checkbox :checked="isOptionSelected(option)" />
                  </div>
                  <span v-if="option.prefix" :class="iconWrapSizeClass">
                    <img
                      v-if="typeof option.prefix === 'string'"
                      :src="option.prefix"
                      :class="iconSizeClass"
                    />
                    <component
                      v-else
                      :is="option.prefix"
                      :class="['text-text-primary', iconSizeClass]"
                    />
                  </span>
                      <i
                        class="text-accent"
                        :class="[
                          `${option.icon?.prefix} ${option.icon?.iconName ?? 'file'}`,
                          isAgent ? 'text-[6px]' : 'text-[16px]'
                        ]"
                      ></i>

                  <div class="flex flex-col gap-1 max-w-40">
                    <span
                      class="overflow-hidden font-semibold overflow-ellipsis"
                      >{{ option.title }}</span
                    >
                    <p
                      v-if="option.description"
                      class="min-w-40 line-clamp-2 text-wrap text-text-secondary text-xs"
                    >
                      {{ option.description }}
                    </p>
                  </div>
                  <i
                    v-if="option?.status == 'running'"
                    class="fa-regular text-left fa-arrows-spin animate-spin duration-250"
                  ></i>
                </div>

                <!-- Right: row actions or nested indicator -->
                <div
                  v-if="option.nested?.length && !option.hideActions"
                  class="pl-2 flex items-center relative ml-auto"
                >
                  <span
                    :ref="
                      (el) => {
                        if (el) itemRefs[option._id] = el;
                      }
                    "
                    class="text-text-secondary"
                    ><i class="fa-regular fa-ellipsis"></i></span
                  >

                  <Teleport to="body">
                    <div
                      v-if="hoveredOptionId === option._id"
                      :ref="(el: any) => { nestedMenuRef = el; }"
                      :style="nestedStyles"
                      class="z-[10000] min-w-48 bg-bg-dropdown border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
                      @mouseenter="handleMouseEnter(option)"
                      @mouseleave="handleMouseLeave"
                      @click.stop
                    >
                      <ul class="py-1 text-sm">
                        <li
                          v-for="subOption in option.nested"
                          :key="subOption._id"
                          class="px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer"
                          @click="emitNestedSelect(subOption, option)"
                        >
                          {{ subOption.title }}
                        </li>
                      </ul>
                    </div>
                  </Teleport>
                </div>

                <!-- Existing actions logic (only if NOT nested, to avoid conflict or visual clutter, though user didn't say remove actions) -->
                <div
                 v-else-if="actions && (canEdit || canDelete || canShare) && !option.hideActions"
                  class="pl-2 flex items-center relative"
                >
                  <button
                    :ref="
                      (el) => {
                        if (el) actionTriggerRefs[option._id] = el;
                      }
                    "
                    class="opacity-0 cursor-pointer group-hover:opacity-100 focus:opacity-100 transition rounded-md px-1.5 py-1 text-text-secondary hover:bg-bg-dropdown-menu-hover"
                    @click.stop="toggleRowActions(option._id)"
                    @mouseenter="handleActionEnter(option)"
                    @mouseleave="handleActionLeave"
                  >
                    <i class="fa-regular fa-ellipsis"></i>
                  </button>

                  <Teleport to="body">
                    <div
                      v-if="actionOpenId === option._id"
                      :ref="(el: any) => { actionMenuRef = el; }"
                      :style="actionStyles"
                      class="z-[10001] rounded-md border border-border bg-bg-dropdown shadow-lg w-28 py-1 flex flex-col text-sm"
                      @mouseenter="handleActionEnter(option)"
                      @mouseleave="handleActionLeave"
                      @click.stop
                    >
                      <button
                        v-if="canEdit"
                        class="px-3 py-1.5 text-left hover:bg-bg-dropdown-menu-hover cursor-pointer"
                        @click.stop="onEdit(option)"
                      >
                        <i class="fa-regular fa-edit text-[12px]"></i> Edit
                      </button>
                      <button
                        v-if="canShare"
                        class="px-3 py-1.5 text-left hover:bg-bg-dropdown-menu-hover cursor-pointer"
                        @click.stop="onShare(option)"
                      >
                        <i class="fa-solid fa-share-nodes text-[12px]"></i> Share
                      </button>
                      <button
                        v-if="canDelete && !option.disableDelete"
                        class="px-3 py-1.5 text-left text-red-600 cursor-pointer"
                        :disabled="option.disableDelete" 
                        @click.stop="!option.disableDelete && onDelete(option)"
                      >
                        <i class="fa-regular fa-trash text-[12px]"></i> Delete
                      </button>
                    </div>
                  </Teleport>
                </div>
              </li>

              <slot name="more" />
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from "vue";
import Checkbox from "./Checkbox.vue";
import { onClickOutside } from "@vueuse/core";
import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  offset,
} from "@floating-ui/dom";
import type { CSSProperties } from "vue";

interface IconData {
  prefix: string;
  iconName: string;
}
interface Option {
  title: string;
  _id: string;
  prefix?: string | any;
  icon?: IconData;
  description?: string;
  status?: string;
  slug?: string;
  nested?: Option[];
  disableDelete?: boolean;
  hideActions?: boolean;
}

const props = withDefaults(
  defineProps<{
    prefix?: string;
    options: Option[];
    modelValue: string | string[];
    variant?: "secondary" | "primary";
    icon?: IconData;
    size?: "sm" | "md";
    actions?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    customClasses?: string;
    customTitle?: string;
    isAgent?:boolean;
    multiple?: boolean;
  }>(),
  {
    options: () => [],
    modelValue: "",
    variant: "primary",
    size: "md",
    actions: true,
    canEdit: true,
    canDelete: true,
    canShare: false,
    customClasses: "",
    multiple: false,
  },
);

const emit = defineEmits([
  "update:modelValue",
  "edit-option",
  "delete-option",
  "share-option",
  "nested-select",
  "open",
  "close"
] as const);

const open = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const dropdownStyles = ref<CSSProperties>({
  position: "fixed",
  top: "-9999px",
  left: "-9999px",
});

let cleanupFloating: (() => void) | null = null;

const selected = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const selectedOption = computed(
  () => {
    if (props.multiple && Array.isArray(selected.value)) {
      // For multi-select, we might just return the first selected or handle specialized display
      return props.options.find((opt) => opt._id === (selected.value as string[])[0]) ?? null;
    }
    return props.options.find((opt) => opt._id === selected.value) ?? null;
  }
);

function isOptionSelected(option: Option) {
  if (props.multiple && Array.isArray(selected.value)) {
    return selected.value.includes(option._id);
  }
  return selected.value === option._id;
}

function toggle() {
  if (open.value) {
    closeDropdown();
  } else {
    emit("open");
    open.value = true;
    nextTick(() => {
      startFloating();
    });
  }
}

function closeDropdown() {
  if (open.value) emit("close");
  open.value = false;
  openNestedId.value = null;
  if (cleanupFloating) {
    cleanupFloating();
    cleanupFloating = null;
  }
}

function startFloating() {
  if (triggerRef.value && menuRef.value) {
    cleanupFloating = autoUpdate(
      triggerRef.value,
      menuRef.value,
      updatePosition,
    );
  }
}
const truncate = (text:any, limit = 12) =>
  text?.length > limit ? text.slice(0, limit) + '...' : text;
  const displayTitle = computed(() => {
  if (props.multiple && Array.isArray(selected.value)) {
    if (selected.value.length === 0) return truncate(props.customTitle);
    if (selected.value.length === 1) {
      const opt = props.options.find(o => o._id === (selected.value as string[])[0]);
      return truncate(opt?.title || props.customTitle);
    }
    return `${selected.value.length} selected`;
  }
  if (selectedOption?.value?.title) {
    return truncate(selectedOption.value.title);
  }
  return truncate(props.customTitle);
});

const displayNestedTitle = computed(() => {
  if (
    selectedNested.value &&
    selectedNested.value.parentId === selectedOption.value?._id
  ) {
    return truncate(selectedNested.value?.option?.title);
  }
  return null;
});
function updatePosition() {
  if (!triggerRef.value || !menuRef.value) return;

  computePosition(triggerRef.value, menuRef.value, {
    placement: "bottom-start",
    strategy: "fixed",
    middleware: [
      offset(({ placement }) => (placement.startsWith("top") ? 17 : 5)),
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

/** Keep menu open for actions; only close on outside click or explicit toggle */
function select(option: Option) {
  if (props.multiple) {
    const currentSelected = Array.isArray(selected.value) ? [...selected.value] : (selected.value ? [selected.value] : []);
    const index = currentSelected.indexOf(option._id);
    if (index > -1) {
      currentSelected.splice(index, 1);
    } else {
      currentSelected.push(option._id);
    }
    selected.value = currentSelected;
  } else {
    selected.value = option._id;
    // clear stale nested value
    if (!option.nested?.length) {
      selectedNested.value = null;
    }
    closeDropdown();
  }
}

/* ------- Nested & Actions state ------- */
const hoveredOptionId = ref<string | null>(null);
const openNestedId = ref<string | null>(null); // For click-to-toggle nested
const actionOpenId = ref<string | null>(null);

function handleOptionClick(option: Option) {
  if (option.nested?.length) {
    // Toggle nested visibility on click
    openNestedId.value = openNestedId.value === option._id ? null : option._id;
  } else {
    select(option);
  }
}

const selectedNested = ref<{
  parentId: string;
  option: Option;
} | null>(null);

function emitNestedSelect(subOption: Option, parentOption: Option) {
  emit("nested-select", subOption);

  selected.value = parentOption._id;

  selectedNested.value = {
    parentId: parentOption._id,
    option: subOption,
  };

  openNestedId.value = null;
  closeDropdown();
}

/* ------- Actions state ------- */
// actionOpenId defined above
const confirmDeleteId = ref<string | null>(null);

// function toggleRowActions(id: string) {
//   confirmDeleteId.value = null;
//   actionOpenId.value = actionOpenId.value === id ? null : id;
// }

function onEdit(option: Option) {
  emit("edit-option", option);
  // keep menu open; collapse action bar
  actionOpenId.value = null;
  confirmDeleteId.value = null;
}

function onDelete(option: Option) {
  emit("delete-option", option);
  // keep menu open but collapse all action UI
  actionOpenId.value = null;
  confirmDeleteId.value = null;
}

function onShare(option: Option) {
  emit("share-option", option);
  // keep menu open but collapse all action UI
  actionOpenId.value = null;
  confirmDeleteId.value = null;
}

onClickOutside(wrapperRef, (event) => {
  const target = event.target as Node;
  // If click is inside the teleported menu, ignore
  if (menuRef.value && menuRef.value.contains(target)) return;

  closeDropdown();
  actionOpenId.value = null;
  confirmDeleteId.value = null;
});

onBeforeUnmount(() => {
  if (cleanupFloating) cleanupFloating();
});

/* -------- size variants -------- */
const isSm = computed(() => props.size === "sm");
const buttonSizeClass = computed(() =>
  isSm.value ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
);
const labelSizeClass = computed(() => (isSm.value ? "text-xs" : "text-sm"));
const listTextSizeClass = computed(() => (isSm.value ? "text-xs" : "text-sm"));
const itemPaddingClass = computed(() =>
  isSm.value ? "px-3 py-1" : "px-4 py-2",
);
const iconWrapSizeClass = computed(() =>
  isSm.value ? "w-3.5 h-3.5" : "w-4 h-4",
);
const iconSizeClass = computed(() => (isSm.value ? "w-3.5 h-3.5" : "w-4 h-4"));
const faIconSizeClass = computed(() => (isSm.value ? "text-base" : "text-lg"));
const chevronSizeClass = computed(() =>
  isSm.value ? "w-3.5 h-3.5" : "w-4 h-4",
);
const menuBorderClass = computed(
  () => "dark:border-light-black border-border-gray",
);
console.log(faIconSizeClass);

// Positioning State
const itemRefs = ref<Record<string, any>>({});
const actionTriggerRefs = ref<Record<string, any>>({});
const nestedMenuRef = ref<HTMLElement | null>(null);
const actionMenuRef = ref<HTMLElement | null>(null);

const nestedStyles = ref<CSSProperties>({ position: 'fixed', top: '-9999px', left: '-9999px' });
const actionStyles = ref<CSSProperties>({ position: 'fixed', top: '-9999px', left: '-9999px' });

let cleanupNested: (() => void) | null = null;
let cleanupActions: (() => void) | null = null;

let hoverTimeout: any = null;

// Hover logic for Nested
function handleMouseEnter(option: any) {
  if (hoverTimeout) clearTimeout(hoverTimeout);
  hoveredOptionId.value = option._id;
  if (option.nested?.length) {
    nextTick(() => startNestedFloating(option._id));
  }
}

function handleMouseLeave() {
  if (hoverTimeout) clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(() => {
    hoveredOptionId.value = null;
    if (cleanupNested) { cleanupNested(); cleanupNested = null; }
  }, 150);
}

function handleItemLeave() {
  handleMouseLeave();
  handleActionLeave();
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
        nestedStyles.value = { position: 'fixed', left: `${x+10}px`, top: `${y}px` };
      });
    });
  }
}

// Logic for Actions
let actionHoverTimeout: any = null;

function handleActionEnter(option: any) {
  if (actionHoverTimeout) clearTimeout(actionHoverTimeout);
  actionOpenId.value = option._id;
  nextTick(() => startActionFloating(option._id));
}

function handleActionLeave() {
  if (actionHoverTimeout) clearTimeout(actionHoverTimeout);
  actionHoverTimeout = setTimeout(() => {
    actionOpenId.value = null;
    if (cleanupActions) { cleanupActions(); cleanupActions = null; }
  }, 150);
}

function toggleRowActions(id: string) {
  if (actionOpenId.value === id) {
    actionOpenId.value = null;
  } else {
    actionOpenId.value = id;
    nextTick(() => startActionFloating(id));
  }
}

function startActionFloating(id: string) {
  const reference = actionTriggerRefs.value[id];
  const floating = actionMenuRef.value;
  if (cleanupActions) { cleanupActions(); cleanupActions = null; }
  if (reference && floating) {
    cleanupActions = autoUpdate(reference, floating, () => {
      computePosition(reference, floating, {
        placement: 'left-start',
        strategy: 'fixed',
        middleware: [offset(5), flip(), shift()]
      }).then(({ x, y }) => {
        actionStyles.value = { position: 'fixed', left: `${x+165}px`, top: `${y}px` };
      });
    });
  }
}

/* optional dynamic FA loading kept as-is (omitted here) */
watch(
  () => props.options,
  () => {},
  { deep: true },
);

defineExpose({
  closeDropdown,
});
</script>

<style scoped>
.fade-scale-enter-active {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.fade-scale-leave-active {
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  transform: scale(0.97);
  opacity: 0;
}
</style>
