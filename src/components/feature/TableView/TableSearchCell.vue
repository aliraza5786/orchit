<template> 
  <div class="relative w-full h-full" ref="containerRef" @click.stop>
    <!-- Display Mode -->
    <div
      v-if="!isEditing"
      @click="startEditing"
      class="h-full flex items-center px-3 py-1.5 cursor-pointer hover:bg-bg-surface-hover rounded-md truncate transition-all duration-200 group"
      :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    >
      <slot name="display">
        <span
          v-if="displayValue"
          class="truncate font-normal text-[12px] text-text-primary"
          >{{ displayValue }}</span
        >
        <span
          v-else-if="emptyText && !disabled"
          class="truncate text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-xs font-medium"
        >
          <i class="fa-solid fa-plus text-[10px]"></i> Add {{ emptyText }}
        </span>
      </slot>
    </div>

    <!-- Edit Mode -->
    <div v-else class="relative w-full">
      <input
        ref="inputRef"
        v-model="searchTerm"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        @keydown.esc="cancelEditing"
        @input="isOpen = true"
        class="absolute left-0 top-1/2 -translate-y-1/2 min-w-[200px] w-full p-1 border border-accent/60 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent bg-bg-body z-50 text-[12px]"
        :placeholder="placeholder"
      />

      <!-- Dropdown --> 
      <Teleport to="body">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="fixed z-[9999] bg-bg-dropdown border border-border rounded-md shadow-lg py-2"
          :style="dropdownStyles"
        >
          <div class="max-h-50 overflow-y-auto">
            <!-- If options exist -->
            <template v-if="filteredOptions.length > 0">
              <div
                v-for="option in filteredOptions"
                :key="option._id ?? option.value"
                @mousedown.prevent="selectOption(option)"
                class="px-3 py-1.5 capitalize font-medium cursor-pointer hover:bg-bg-dropdown-menu-hover text-[12px] text-text-primary flex items-center gap-2"
              >
                <slot name="option" :option="option">
                  {{ getOptionLabel(option) }}
                </slot>
              </div>
            </template>

            <!-- If no options match -->
            <template v-else>
              <div
                class="px-3 py-2 text-center text-text-secondary text-sm "
              >
                No match found
              </div>
            </template>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  nextTick,
  watch,
  onMounted,
  onBeforeUnmount,
  watchEffect,
} from "vue";

interface Option {
  _id?: string | number;
  title?: string;
  label?: string;
  value?: string | number;
  [key: string]: any;
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null | any;
    options?: (Option | string)[];
    placeholder?: string;
    disabled?: boolean;
    displayField?: string; // Field to use for display if modelValue is an ID
    emptyText?: string;
  }>(),
  {
    options: () => [],
    placeholder: "Type to search...",
    disabled: false,
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: any): void;
  (e: "change", value: any): void;
}>();

const isEditing = ref(false);
const isOpen = ref(false);
const searchTerm = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownStyles = ref({ top: "0px", left: "0px", width: "100%" });

// Positioning logic similar to TableSelect
const positionDropdown = () => {
  if (!inputRef.value || !dropdownRef.value) return;

  const rect = inputRef.value.getBoundingClientRect();
  const dropdownHeight = dropdownRef.value.offsetHeight || 200; // Estimate if not rendered yet
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom;

  // Default to opening down, flip up if space is tight
  const dropdownOffset = 6;
  let top = rect.bottom + window.scrollY + dropdownOffset;
  if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
    top = rect.top + window.scrollY - dropdownHeight - 5;
  }

  dropdownStyles.value = {
    top: `${top}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`, // Match input width
  };
};



// Helper to get display string from an option
const getOptionLabel = (opt: Option | string) => {
  
  if (typeof opt === "string") return opt;
  return String(opt.title ?? opt.label ?? opt.value ?? "");
};

// Computed display value for the read-only view
const displayValue = computed(() => {
  if (!props.modelValue) return "";
  const match = props.options.find((opt) => {
    if (typeof opt === "string") return opt === props.modelValue;
    if (typeof props.modelValue !== "object") {
      return opt._id == props.modelValue || opt.value == props.modelValue;
    }
    return opt._id == props.modelValue?._id || opt.value == props.modelValue?.value;
  }); 
  return match ? getOptionLabel(match) : "";
});





//  watchEffect(()=>{
//     alert();
//  })

const normalizedOptions = computed<Option[]>(() =>
  (props.options ?? []).map((opt) =>
    typeof opt === "string"
      ? { value: opt, label: opt }
      : opt
  )
);

watch(
  () => props.modelValue,
  (newVal) => {
    const match = normalizedOptions.value.find(
      (opt) => opt._id == newVal || opt.value == newVal   // note `==` instead of `===`
    );
    searchTerm.value = match ? getOptionLabel(match) : "";
  },
  { immediate: true }
);

// Filter options based on search term
const filteredOptions = computed<Option[]>(() => {
  // show all options if empty
  if (!searchTerm.value) return normalizedOptions.value;

  // show all if input equals display value
  if (searchTerm.value === displayValue.value)
    return normalizedOptions.value;

  const lowerTerm = searchTerm.value.toLowerCase();

  return normalizedOptions.value.filter((opt) =>
    getOptionLabel(opt).toLowerCase().includes(lowerTerm)
  );
});

const startEditing = async () => {
  if (props.disabled) return;
  isEditing.value = true;
  searchTerm.value = displayValue.value;
  isOpen.value = true;

  await nextTick();
  inputRef.value?.focus();
  inputRef.value?.select();
  positionDropdown(); // Calculate position after render

  // Add listeners for scroll/resize to update position
  window.addEventListener("scroll", positionDropdown, true);
  window.addEventListener("resize", positionDropdown);
};

const cancelEditing = () => {
  isEditing.value = false;
  isOpen.value = false;
  searchTerm.value = "";
  window.removeEventListener("scroll", positionDropdown, true);
  window.removeEventListener("resize", positionDropdown);
};

const selectOption = (option: Option | string) => {
  let value: any;
  if (typeof option === "string") value = option;
  else value = option._id ?? option.value ?? option.title;

  emit("update:modelValue", value);
  emit("change", value); 

  // set searchTerm to display the selected value
  const match = normalizedOptions.value.find(
    (opt) => opt._id == value || opt.value == value
  ); 
  searchTerm.value = match ? getOptionLabel(match) : "";
  // displayValue.value = match ? getOptionLabel(match) : "";

  cancelEditing();
};

const handleEnter = () => {
  if (filteredOptions.value.length > 0) {
    const match = filteredOptions.value.find(
      (opt) =>
        getOptionLabel(opt).toLowerCase() === searchTerm.value.toLowerCase()
      );
    if (match) {
      selectOption(match);
      return;
    }
    // If one exact match? or select first?
    // Default to text if no match
  }

  emit("update:modelValue", searchTerm.value);
  emit("change", searchTerm.value);
  cancelEditing();
};

const handleBlur = (e: FocusEvent) => {
  // Give time for mousedown on option to fire
  setTimeout(() => {
    // Only close if we didn't just click an option (which is handled by mousedown.prevent)
    if (isEditing.value) {
      handleEnter();
    }
  }, 150);
};

// Close on click outside
const handleClickOutside = (event: MouseEvent) => {
  // Check if click is outside BOTH container and dropdown (in case of teleport)
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    if (isEditing.value) {
      handleEnter();
    }
  }
};

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  window.removeEventListener("scroll", positionDropdown, true);
  window.removeEventListener("resize", positionDropdown);
});
</script>
