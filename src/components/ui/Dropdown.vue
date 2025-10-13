<template>
  <div ref="dropdownRef" class="relative inline-block text-left">
    <button @click="toggle" type="button"
      class="text-nowrap  inline-flex justify-between items-center gap-1 border rounded-md font-medium cursor-pointer transition bg-bg-surface"
      :class="[
        buttonSizeClass,
        variant === 'secondary' ? '!bg-bg-body border-0  ' : 'border-border',
      ]">
      <!-- prefix (image or component) -->
      <span v-if="selectedOption?.prefix" :class="iconWrapSizeClass">
        <img v-if="typeof selectedOption?.prefix === 'string'" :src="selectedOption?.prefix" :class="iconSizeClass" />
        <component v-else :is="selectedOption?.prefix" :class="iconSizeClass" />
      </span>
      <i
        :class="`${selectedOption?.icon?.prefix} ${selectedOption?.icon?.iconName ? selectedOption?.icon?.iconName : 'file'} ${faIconSizeClass}`"></i>
      <span :class="labelSizeClass">      <span v-if="prefix" class=" font-bold">{{ prefix }}:</span>
      {{ selectedOption?.title }}</span>

      <!-- Chevron -->
      <svg :class="[chevronSizeClass, 'text-text-secondary ']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown menu -->
    <Transition name="fade-scale" enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in" enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100" leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95">
      <div v-if="open"
        class="absolute max-h-[500px] overflow-y-auto z-12 mt-1 w-full min-w-fit rounded-md border border-border shadow-lg bg-bg-dropdown"
        :class="menuBorderClass">
        <ul :class="['py-1 z-[2]', listTextSizeClass]">
          <li v-for="option in options" :key="option._id" @click="select(option)"
            class="cursor-pointer flex gap-2 overflow-hidden items-center text-nowrap hover:bg-bg-dropdown-menu-hover"
            :class="itemPaddingClass">
            <span v-if="option.prefix" :class="iconWrapSizeClass">
              <img v-if="typeof option.prefix === 'string'" :src="option.prefix" :class="iconSizeClass" />
              <component v-else :is="option.prefix" :class="['text-text-primary ', iconSizeClass]" />
            </span>

            <!-- <FontAwesomeIcon :icon="['fas', option.icon?.iconName]"
              :class="['text-text-primary', faIconSizeClass]" /> -->
            <i
              :class="` ${option.icon?.prefix} ${option.icon?.iconName ? option.icon?.iconName : 'file'} ${faIconSizeClass}`"></i>

            <div class="flex flex-col gap-1 max-w-40">
              <span class="overflow-hidden font-semibold overflow-ellipsis">{{
                option.title
              }}</span>
              <p v-if="option.description" class="min-w-40 line-clamp-2 text-wrap text-text-secondary text-xs">
                {{ option.description }}
              </p>
            </div>
          </li>

          <slot name="more" />
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, type Component, watch } from "vue";
// import { library } from "@fortawesome/fontawesome-svg-core";
// import * as far from "@fortawesome/free-regular-svg-icons";
import { onClickOutside } from "@vueuse/core";

interface IconData {
  prefix: string;
  iconName: string;
}
interface Option {
  title: string;
  _id: string;
  prefix?: string | Component;
  icon?: IconData;
  description?: string;
}

const props = withDefaults(
  defineProps<{
    prefix?: string,
    options: Option[];
    modelValue: string;
    variant?: "secondary" | "primary";
    icon?: IconData;
    size?: "sm" | "md";
  }>(),
  {
    options: () => [],
    modelValue: "",
    variant: "primary",
    size: "md",
  }
);

const emit = defineEmits(["update:modelValue"]);

const open = ref(false);
const selected = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
const selectedOption = computed(
  () => props.options.find((opt) => opt._id === selected.value) ?? null
);

const dropdownRef = ref<HTMLElement | null>(null);
function toggle() {
  open.value = !open.value;
}
function select(option: Option) {
  selected.value = option._id;
  open.value = false;
}
onClickOutside(dropdownRef, () => (open.value = false));

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
const faIconSizeClass = computed(() =>
  isSm.value ? "text-base " : "text-lg "
);
const chevronSizeClass = computed(() =>
  isSm.value ? "w-3.5 h-3.5" : "w-4 h-4"
);
const menuBorderClass = computed(
  () => "dark:border-light-black border-border-gray"
);

/* -------- dynamic icon loading for Free Regular set -------- */
// function toPascalCase(str: string) {
//   return str
//     .split("-")
//     .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
//     .join("");
// }
function addIconToLibrary(icon?: IconData) {
  if (!icon?.iconName) return;
  // const faName = `fa${toPascalCase(icon.iconName)}`;
  // const iconDef = (far as Record<string, any>)[faName];
  // if (iconDef) library.add(iconDef);
}
watch(
  () => props.icon,
  (i) => addIconToLibrary(i),
  { immediate: true }
);
watch(
  () => props.options,
  (opts) => opts.forEach((o) => addIconToLibrary(o.icon)),
  { immediate: true, deep: true }
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
