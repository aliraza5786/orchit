<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import Button from '../../../components/ui/Button.vue';
import EmptyState from '../../../components/ui/EmptyState.vue';
import { primeIcons } from '../../../data/primeIconsNames';

export type IconPrefix = 'fa' | 'fa-regular' | 'fa-solid';

export type IconValue = { prefix: IconPrefix; iconName: string } | null;

const props = defineProps<{ 
  modelValue?: IconValue,
  relevantIcons?: string[],
  inSpace?: boolean
  noSearch?: boolean
}>();
const emit = defineEmits<{ (e: 'update:modelValue', value: any): void }>();

type CatalogItem = {
  prefix: IconPrefix;
  iconName: string;
  renderClasses: string[];
  label: string;
};

const catalog = ref<CatalogItem[]>([]);
const showIconPicker = ref(false);
const query = ref('');
const page = ref(1);
const pageSize = 120;

const activePrefixes = ref<IconPrefix[]>(['fa']);

onMounted(() => {
  let iconsToUse = primeIcons;
  if (props.relevantIcons && props.relevantIcons.length > 0) {
    iconsToUse = primeIcons.filter(name => props.relevantIcons!.includes(name));
  }

  const items: CatalogItem[] = iconsToUse.map((name) => {
    const iconName = `fa-${name}`;
    return {
      prefix: 'fa' as IconPrefix,
      iconName,
      renderClasses: ['fa-regular', iconName],
      label: name,
    };
  });

  items.sort((a, b) => a.iconName.localeCompare(b.iconName));
  catalog.value = items;
});

/** Filtering + pagination */
const filteredIcons = computed(() => {
  const q = query.value.trim().toLowerCase();
  return catalog.value.filter(({ label, iconName, prefix }) => {
    if (!activePrefixes.value.includes(prefix)) return false;
    if (!q) return true;
    return label.includes(q) || iconName.includes(q);
  });
});

const visibleIcons = computed(() => filteredIcons.value.slice(0, page.value * pageSize));

const noIconsDescription = computed(() =>
  query.value.trim()
    ? `No icons match "${query.value.trim()}".`
    : 'No icons available.',
);

function onScroll(e: Event) {
  const el = e.target as HTMLElement;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) {
    if (visibleIcons.value.length < filteredIcons.value.length) page.value += 1;
  }
}

/** Selection */
function select(item: CatalogItem | null) {
  if (item) {
    emit('update:modelValue', { prefix: item.renderClasses[0], iconName: item.iconName });
  } else {
    emit('update:modelValue', null);
  }
  showIconPicker.value = false;
}

function openIconLibrary() {
  page.value = 1;
  showIconPicker.value = !showIconPicker.value;
}
</script>

<template>
  <div class="icon-picker-root min-w-0 w-full max-w-full">
    <!-- Button / Empty state -->
    <div v-if="!showIconPicker && !modelValue?.iconName"
      class="border border-dashed bg-bg-input border-border rounded-xl p-6 flex flex-col items-center text-center">
      <Button :inSpace="props.inSpace? props.inSpace : false"  variant="primary" @click="openIconLibrary">Select Icon</Button>
      <p class="text-xs text-text-secondary mt-2">Browse PrimeIcons</p>
    </div>

    <!-- Icon picker -->
    <div v-else-if="showIconPicker" class="min-w-0 w-full max-w-full">
      <div class="flex flex-col gap-3 w-full min-w-0 max-w-full">
        <input
          v-if="!props.noSearch"
          v-model="query"
          placeholder="Search icons…"
          class="px-3 py-2 rounded-[6px] border border-border bg-bg-input text-sm placeholder-text-secondary w-full min-w-0
                 focus:outline-none  focus:border-border"
          type="text"
        />

        <!-- Grid -->
        <div
          class="icon-picker-grid w-full min-w-0 max-w-full rounded-lg border border-border bg-bg-input"
          @scroll="onScroll"
        >
          <button
            v-for="item in visibleIcons"
            :key="item.prefix + item.iconName"
            type="button"
            :title="item.label"
            :aria-label="item.label"
            class="icon-picker-cell group flex flex-col items-center justify-center gap-1.5 p-2 min-h-[4.25rem] w-full min-w-0 overflow-hidden
                   bg-bg-body cursor-pointer border border-transparent rounded-lg text-text-secondary
                   hover:border-border hover:bg-bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            @click="select(item)"
          >
            <i :class="item.renderClasses" class="text-base shrink-0 leading-none" />
            <span class="icon-picker-label w-full min-w-0 px-0.5 text-[10px] leading-tight text-center text-text-secondary truncate">
              {{ item.label }}
            </span>
          </button>
        </div>

        <div v-if="!filteredIcons.length" class="flex items-center justify-center py-6">
          <EmptyState
            icon="fa-regular fa-icons"
            title="No icons found"
            :description="noIconsDescription"
            container-class="py-4"
          />
        </div>
      </div>
    </div>

    <!-- Selected preview -->
    <div v-if="modelValue" class="mt-1 p-3 bg-bg-input rounded-lg flex items-center gap-2 min-w-0">
      <i :class="[modelValue.prefix, modelValue.iconName]" class="text-xl shrink-0" />
      <div class="min-w-0 flex-1">
        <p class="font-medium truncate m-0">{{ modelValue.iconName }}</p>
      </div>
      <i class="fa-solid fa-xmark ml-auto shrink-0 cursor-pointer text-text-secondary" @click="select(null)" />
    </div>
  </div>
</template>

<style scoped>
.icon-picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 0.5rem;
  padding: 0.75rem;
  padding-bottom: 0.875rem;
  max-height: 280px;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

.icon-picker-cell {
  box-sizing: border-box;
}

.icon-picker-label {
  display: block;
  max-width: 100%;
}
</style>
