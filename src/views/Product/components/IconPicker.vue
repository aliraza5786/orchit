<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import Button from '../../../components/ui/Button.vue';
import { byPrefixAndName } from '@awesome.me/kit-9632b12cc3/icons';

type FAPrefix =
  | 'fa-solid'
  | 'fa-regular'
  | 'fa-brands'
  | 'fa-light'
  | 'fa-thin'
  | 'fa-duotone'
  | 'fa-sharp-solid'
  | 'fa-sharp-duotone';

type FAValue = { prefix: FAPrefix; iconName: string } | null;

defineProps<{ modelValue?: FAValue }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: any): void }>();

/**
 * Map Kit shorthand prefixes (fas, far, fab, fal, fat, fad, fass, fasds)
 * to the CSS class prefix we need to render and emit.
 */
const KIT_TO_CLASS: Record<string, FAPrefix | null> = {
  fas: 'fa-solid',
  far: 'fa-regular',
  fab: 'fa-brands',
  fal: 'fa-light',       // Pro
  fat: 'fa-thin',        // Pro
  fad: 'fa-duotone',     // Pro
  // Sharp styles (Pro+). We’ll add the right classes during rendering.
  fass: 'fa-sharp-solid',
  fasds: 'fa-sharp-duotone',
  // Custom (fak) not included here — add if you use custom kit icons
};

/** Our catalog is built at runtime from your Kit. */
type CatalogItem = {
  prefix: FAPrefix;        // e.g. 'fa-solid'
  iconName: string;        // e.g. 'fa-house'
  renderClasses: string[]; // full class list to render accurately
  label: string;           // search label
};

const catalog = ref<CatalogItem[]>([]);
const showIconPicker = ref(false);
const query = ref('');
const page = ref(1);
const pageSize = 120;

/** Enable/disable styles (defaults: all on). */
const activePrefixes = ref<FAPrefix[]>([
  'fa-solid',
  'fa-regular',
  'fa-brands',
  'fa-light',
  'fa-thin',
  'fa-duotone',
  'fa-sharp-solid',
  'fa-sharp-duotone',
]);

/** Build the catalog from the Kit’s byPrefixAndName object. */
onMounted(() => {
  const items: CatalogItem[] = [];

  Object.entries(byPrefixAndName).forEach(([kitPrefix, namesObj]) => {
    const cssPrefix = KIT_TO_CLASS[kitPrefix];
    if (!cssPrefix) return;

    // namesObj is a map of { 'house': IconDef, ... } – we just need the names
    Object.keys(namesObj).forEach((name) => {
      const iconName = `fa-${name}`;
      const renderClasses: string[] = (() => {
        switch (cssPrefix) {
          case 'fa-sharp-solid':
            return ['fa-sharp fa-solid', iconName];
          case 'fa-sharp-duotone':
            return ['fa-sharp-duotone', iconName];
          default:
            return [cssPrefix, iconName];
        }
      })();
      items.push({
        prefix: cssPrefix,
        iconName,
        renderClasses,
        label: iconName.replace(/^fa-/, ''), // search label
      });
    });
  });

  // Sort nicely (style, then name)
  items.sort((a, b) => (a.prefix === b.prefix ? a.iconName.localeCompare(b.iconName) : a.prefix.localeCompare(b.prefix)));
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
  <div>
    <!-- Button / Empty state -->
    <div v-if="!showIconPicker && !modelValue?.iconName"
      class="border border-dashed bg-bg-input border-border rounded-xl p-6 flex flex-col items-center text-center">
      <Button variant="primary" @click="openIconLibrary">Select Icon</Button>
      <p class="text-xs text-text-secondary mt-2">Browse Font Awesome (from your Kit)</p>
    </div>

    <!-- Icon picker -->
    <div v-else-if="showIconPicker" class="mt-6">
      <div class="grid gap-3 w-full">
        <!-- Search -->
        <input v-model="query" placeholder="Search icons…" class="px-3 py-2 rounded-lg border col-span-full border-border bg-bg-card text-sm placeholder-text-secondary
                 focus:outline-none focus:ring-2 focus:ring-accent focus:border-border" type="text" />

        <!-- Style filters -->
        <div class="flex flex-wrap w-full px-3  py-2 col-span-full gap-5 items-center text-sm">
          <label class="flex items-center cursor-pointer gap-1">
            <input type="checkbox" class=" accent-accent" value="fa-solid" v-model="activePrefixes" /> Solid
          </label>
          <label class="flex items-center cursor-pointer gap-1">
            <input type="checkbox" class=" accent-accent" value="fa-regular" v-model="activePrefixes" /> Regular
          </label>
          <label class="flex items-center cursor-pointer gap-1">
            <input type="checkbox" class=" accent-accent" value="fa-brands" v-model="activePrefixes" /> Brands
          </label>
          <label class="flex items-center cursor-pointer gap-1">
            <input type="checkbox" class=" accent-accent" value="fa-light" v-model="activePrefixes" /> Light
          </label>
          <label class="flex items-center cursor-pointer gap-1">
            <input type="checkbox" class=" accent-accent" value="fa-thin" v-model="activePrefixes" /> Thin
          </label>
          <label class="flex items-center cursor-pointer gap-1">
            <input type="checkbox" class=" accent-accent" value="fa-duotone" v-model="activePrefixes" /> Duotone
          </label>
          <label class="flex items-center cursor-pointer gap-1">
            <input type="checkbox" class=" accent-accent" value="fa-sharp-solid" v-model="activePrefixes" /> Sharp Solid
          </label>
          <label class="flex items-center cursor-pointer gap-1">
            <input type="checkbox" class=" accent-accent" value="fa-sharp-duotone" v-model="activePrefixes" /> Sharp
            Duotone
          </label>
        </div>

        <!-- Grid -->
        <div class="grid gap-2 col-span-full grid-cols-[repeat(auto-fill,minmax(90px,1fr))] max-h-[360px] overflow-auto pr-1
                 rounded-lg border-border" @scroll="onScroll">
          <button v-for="item in visibleIcons" :key="item.prefix + item.iconName" type="button" @click="select(item)"
            :aria-label="`${item.prefix} ${item.iconName}`" :title="`${item.prefix} ${item.iconName}`" class="group grid place-items-center gap-1.5 p-2 bg-bg-body cursor-pointer
                   border border-transparent rounded-lg text-text-secondary
                   hover:border-border focus:outline-none focus:ring-2 focus:ring-accent">
            <i :class="item.renderClasses" class="text-base"></i>
            <small class="max-w-[84px] text-[11px] text-text-secondary truncate">
              {{ item.iconName }}
            </small>
          </button>
        </div>

        <p v-if="!filteredIcons.length" class="text-sm text-neutral-400">
          No icons match “{{ query }}”.
        </p>
      </div>
    </div>

    <!-- Selected preview -->
    <div v-if="modelValue" class="mt-4 p-3 bg-bg-input rounded-lg flex items-center gap-2">
      <!-- Render with correct classes for sharp/duotone/etc -->
      <i :class="[
        modelValue.prefix === 'fa-sharp-solid' ? 'fa-sharp fa-solid' :
          modelValue.prefix === 'fa-sharp-duotone' ? 'fa-sharp-duotone' :
            modelValue.prefix,
        modelValue.iconName
      ]" class="text-xl" />
      <div class="min-w-0">
        <p class="font-medium truncate">{{ modelValue.prefix }} {{ modelValue.iconName }}</p>
        <code class="text-xs block break-all">
          { prefix: '{{ modelValue.prefix }}', iconName: '{{ modelValue.iconName }}' }
        </code>
      </div>
      <img src="../../../assets/icons/cross.svg" @click="select(null)" class="ml-auto cursor-pointer"
        alt="Clear icon" />
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 1rem;
}
</style>
