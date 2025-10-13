<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import Button from '../../../components/ui/Button.vue';
import { primeIcons } from '../../../data/primeIconsNames';

type IconPrefix = 'pi';

type IconValue = { prefix: IconPrefix; iconName: string } | null;

defineProps<{ modelValue?: IconValue }>();
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

const activePrefixes = ref<IconPrefix[]>(['pi']);

onMounted(() => {
  const items: CatalogItem[] = primeIcons.map((name) => {
    const iconName = `pi-${name}`;
    return {
      prefix: 'pi' as IconPrefix,
      iconName,
      renderClasses: ['pi', iconName],
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
      <p class="text-xs text-text-secondary mt-2">Browse PrimeIcons</p>
    </div>

    <!-- Icon picker -->
    <div v-else-if="showIconPicker" class="mt-6">
      <div class="grid gap-3 w-full">
        <!-- Search -->
        <input v-model="query" placeholder="Search icons…" class="px-3 py-2 rounded-lg border col-span-full border-border bg-bg-card text-sm placeholder-text-secondary
                 focus:outline-none focus:ring-2 focus:ring-accent focus:border-border" type="text" />

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
      <i :class="[modelValue.prefix, modelValue.iconName]" class="text-xl" />
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
