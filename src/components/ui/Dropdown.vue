<template>
  <div ref="wrapperRef" class="relative inline-block text-left">
    <button
      ref="triggerRef"
      @click="toggle"
      type="button"
      class="text-nowrap inline-flex justify-between items-center gap-1 border rounded-[6px] font-medium cursor-pointer transition bg-bg-surface"
      :class="[
        buttonSizeClass,
        variant === 'secondary' ? '!bg-bg-body border-0' : 'border-border',
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
        :class="`${selectedOption?.icon?.prefix} ${
          selectedOption?.icon?.iconName
            ? selectedOption?.icon?.iconName
            : 'file'
        } ${faIconSizeClass}`"
      ></i>

      <span :class="labelSizeClass">
        <span v-if="prefix" class="font-bold">{{ prefix }}:</span>
        <span class="text-nowrap"> {{ selectedOption?.title }} </span>
      </span>

      <!-- Chevron -->
      <svg
        :class="[chevronSizeClass, 'text-text-secondary']"
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
          class="max-h-[500px] overflow-visible z-[9999] min-w-fit rounded-[6px] border border-border shadow-lg bg-bg-dropdown fixed"
          :class="[menuBorderClass, props.customClasses? props.customClasses :'' ]"
          @click.stop
        >
          <ul :class="['py-1 z-[2]', listTextSizeClass]">
            <li
              v-for="option in options"
              :key="option._id"
              class="group cursor-pointer flex items-stretch text-nowrap hover:bg-bg-dropdown-menu-hover"
              :class="itemPaddingClass"
              @click="handleOptionClick(option)"
              @mouseenter="hoveredOptionId = option._id"
              @mouseleave="hoveredOptionId = null"
            >
              <!-- Left: icon/prefix -->
              <div class="flex items-center gap-2 min-w-0 flex-1">
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
                  :class="`${option.icon?.prefix} ${
                    option.icon?.iconName ? option.icon?.iconName : 'file'
                  } ${faIconSizeClass}`"
                ></i>

                <div class="flex flex-col gap-1 max-w-40">
                  <span class="overflow-hidden font-semibold overflow-ellipsis">{{
                    option.title
                  }}</span>
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
              <div v-if="option.nested?.length" class="pl-2 flex items-center relative ml-auto">
                 <span class="text-text-secondary">...</span>
                 <!-- Nested Dropdown -->
                 <div
                    v-if="hoveredOptionId === option._id  || openNestedId === option._id"
                    class="absolute left-[-170px] sm:left-[30px] top-[-250px] sm:top-[-5px] ml-1 z-[30] min-w-48 bg-bg-dropdown border border-border rounded-md shadow-lg max-h-60 overflow-y-auto"
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
              </div>

              <!-- Existing actions logic (only if NOT nested, to avoid conflict or visual clutter, though user didn't say remove actions) -->
              <div v-else-if="actions && canEdit && canDelete" class="pl-2 flex items-center relative">
                <!-- Kebab: visible on hover/focus OR when toggled -->
                <button
                  class="opacity-0 cursor-pointer group-hover:opacity-100 focus:opacity-100 transition rounded-md px-1.5 py-1 text-text-secondary hover:bg-bg-dropdown-menu-hover"
                  @click.stop="toggleRowActions(option._id)"
                  :aria-expanded="actionOpenId === option._id ? 'true' : 'false'"
                  :aria-label="`Actions for ${option.title}`"
                >
                  ⋯
                </button>

                <!-- Inline action bar -->
                <!-- Sub dropdown menu for row actions -->
                <div
                  v-if="actionOpenId === option._id "
                  class="absolute left-[100%] right-0 top-full mt-1 z-[20]"
                  @click.stop
                >
                  <div
                    class="rounded-md border border-border bg-bg-dropdown shadow-lg w-28 py-1 flex flex-col text-sm"
                  >
                    <button
                     v-if="canEdit"
                      class="px-3 py-1.5 text-left hover:bg-bg-dropdown-menu-hover cursor-pointer"
                      @click.stop="onEdit(option)"
                    >
                      <i class="fa-regular fa-edit"></i> Edit
                    </button>
                    <button
                     v-if="canDelete"
                      class="px-3 py-1.5 text-left text-red-600 cursor-pointer"
                      @click.stop="onDelete(option)"
                    >
                      <i class="fa-regular fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              </div>
            </li>

            <slot name="more" />
          </ul>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick } from "vue";
import { onClickOutside } from "@vueuse/core";
import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';
import type { CSSProperties } from 'vue';

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
}

const props = withDefaults(
  defineProps<{
    prefix?: string;
    options: Option[];
    modelValue: string;
    variant?: "secondary" | "primary";
    icon?: IconData;
    size?: "sm" | "md";
    actions?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
    customClasses?: string 
  }>(),
  {
    options: () => [],
    modelValue: "",
    variant: "primary",
    size: "md",
    actions: true,
    canEdit: true,
    canDelete: true,
    customClasses: ""
  }
);

const emit = defineEmits([
  "update:modelValue",
  "edit-option",
  "delete-option",
  "nested-select"
] as const);

const open = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const dropdownStyles = ref<CSSProperties>({
   position: 'fixed',
   top: '-9999px',
   left: '-9999px',
});

let cleanupFloating: (() => void) | null = null;

const selected = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const selectedOption = computed(
  () => props.options.find((opt) => opt._id === selected.value) ?? null
);

function toggle() {
  if (open.value) {
    closeDropdown();
  } else {
    open.value = true;
    nextTick(() => {
      startFloating();
    });
  }
}

function closeDropdown() {
  open.value = false;
  openNestedId.value = null; 
  if (cleanupFloating) {
    cleanupFloating();
    cleanupFloating = null;
  }
}

function startFloating() {
  if (triggerRef.value && menuRef.value) {
    cleanupFloating = autoUpdate(triggerRef.value, menuRef.value, updatePosition);
  }
}

function updatePosition() {
  if (!triggerRef.value || !menuRef.value) return;
  
  computePosition(triggerRef.value, menuRef.value, {
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [
      offset(({ placement }) => placement.startsWith('top') ? 17 : 5),
      flip(),
      shift({ padding: 5 })
    ],
  }).then(({ x, y }) => {
    dropdownStyles.value = {
      position: 'fixed',
      left: `${x}px`,
      top: `${y}px`,
    };
  });
}

/** Keep menu open for actions; only close on outside click or explicit toggle */
function select(option: Option) {
  selected.value = option._id;
  closeDropdown();
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

function emitNestedSelect(subOption: Option, parentOption: Option) {
    emit("nested-select", subOption);
    select(parentOption);
}

/* ------- Actions state ------- */
// actionOpenId defined above
const confirmDeleteId = ref<string | null>(null);

function toggleRowActions(id: string) {
  confirmDeleteId.value = null;
  actionOpenId.value = actionOpenId.value === id ? null : id;
}

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
  isSm.value ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
);
const labelSizeClass = computed(() => (isSm.value ? "text-xs" : "text-sm"));
const listTextSizeClass = computed(() => (isSm.value ? "text-xs" : "text-sm"));
const itemPaddingClass = computed(() =>
  isSm.value ? "px-3 py-1" : "px-4 py-2"
);
const iconWrapSizeClass = computed(() =>
  isSm.value ? "w-3.5 h-3.5" : "w-4 h-4"
);
const iconSizeClass = computed(() => (isSm.value ? "w-3.5 h-3.5" : "w-4 h-4"));
const faIconSizeClass = computed(() => (isSm.value ? "text-base" : "text-lg"));
const chevronSizeClass = computed(() =>
  isSm.value ? "w-3.5 h-3.5" : "w-4 h-4"
);
const menuBorderClass = computed(
  () => "dark:border-light-black border-border-gray"
);

/* optional dynamic FA loading kept as-is (omitted here) */
watch(
  () => props.options,
  () => {},
  { deep: true }
);
</script>

<style scoped>
.fade-scale-enter-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.fade-scale-leave-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  transform: scale(0.97);
  opacity: 0;
}
</style>
