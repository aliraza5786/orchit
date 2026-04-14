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
        v-if="isVisible"
        class="fixed bg-bg-dropdown border border-border shadow-2xl rounded-[6px] z-[9999] flex flex-col overflow-hidden origin-top-right"
        :style="dropdownStyles"
        @click.stop
      >
        <div class="flex flex-1 min-h-[60vh] max-w-[860px] max-h-[60vh] md:w-[650px] w-[95vw]">
          <!-- Left Sidebar: Categories -->
          <div class="w-1/3 border-r border-border bg-bg-dropdown flex flex-col">
            <div class="flex-1 py-2 overflow-y-auto flex flex-col gap-[4px]">
              <button
                v-for="cat in categories"
                :key="cat.id"
                @click="activeCategory = cat.id"
                class="w-full px-4 py-3 flex items-center justify-between group transition-colors hover:bg-bg-body"
                :class="activeCategory === cat.id ? 'bg-bg-body text-accent' : 'text-text-secondary'"
              >
                <div class="flex items-center gap-3">
                  <i :class="[cat.icon, 'text-sm', activeCategory === cat.id ? 'text-accent' : 'text-text-secondary group-hover:text-text-primary']"></i>
                  <span class="text-xs font-medium">{{ cat.label }}</span>
                </div>
                <span 
                  v-if="getSelectionCount(cat.id)"
                  class="bg-accent/10 text-accent text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                >
                  {{ getSelectionCount(cat.id) }}
                </span>
              </button>
            </div>
          </div>

          <!-- Right Pane: Options -->
          <div class="flex-1 flex flex-col bg-bg-dropdown">
            <!-- Search within category -->
            <div class="p-4 border-b border-border">
              <div class="relative">
                <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs"></i>
                <input 
                  v-model="searchQuery"
                  type="text" 
                  :placeholder="`Search ${currentCategoryLabel.toLowerCase()}`"
                  class="w-full bg-bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-accent outline-none transition-all"
                  ref="searchInput"
                />
              </div>
            </div>

            <!-- Options list -->
            <div class="flex-1 overflow-y-auto p-2">
              <div v-if="activeCategory === 'dates'" class="p-2 space-y-4">
                <div v-for="dateType in dateCategories" :key="dateType.id" class="space-y-2">
                  <label class="text-[10px] font-bold text-text-secondary uppercase tracking-wider">{{ dateType.label }}</label>
                  <div class="flex gap-2">
                    <DatePicker v-model="localFilters[dateType.from]" placeholder="From" class="flex-1" />
                    <DatePicker v-model="localFilters[dateType.to]" placeholder="To" class="flex-1" />
                  </div>
                </div>
              </div>
              
              <template v-else>
                <div 
                  v-for="option in filteredOptions" 
                  :key="option._id"
                  @click="toggleOption(option._id)"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bg-body transition-colors group"
                >
                  <div 
                    class="w-4 h-4 border rounded flex items-center justify-center transition-colors"
                    :class="isSelected(option._id) ? 'bg-accent border-accent text-white' : 'border-border group-hover:border-accent/50'"
                  >
                    <i v-if="isSelected(option._id)" class="fa-solid fa-check text-[10px]"></i>
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-xs font-medium text-text-primary truncate">{{ option.title }}</span>
                    <span v-if="option.description" class="text-[10px] text-text-secondary truncate">{{ option.description }}</span>
                  </div>
                </div>
                
                <div v-if="filteredOptions.length === 0" class="flex flex-col items-center justify-center h-full opacity-40 py-10">
                  <i class="fa-solid fa-folder-open text-3xl mb-2"></i>
                  <span class="text-xs">No matches found</span>
                </div>
              </template>
            </div>

            <!-- Footer actions for Right Pane -->
            <div class="p-3 bg-bg-surface/20 flex justify-between items-center border-t border-border">
              <span class="text-[10px] text-text-secondary">
                 {{ getSelectionCount(activeCategory) }} selected
              </span>
              <button 
                @click="clearCurrentCategory"
                class="text-[10px] font-medium text-accent hover:underline"
              >
                Clear current
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom Footer (Global Actions) -->
        <div class="p-4 bg-bg-surface/50 border-t border-border flex items-center justify-between">
          <div class="flex items-center gap-4 text-text-secondary">
             <button 
                @click="clearAll"
                class="text-xs text-text-secondary hover:text-red-500 transition-colors flex items-center gap-2"
              >
                <i class="fa-solid fa-trash-can"></i>
                Clear all
              </button>
          </div>
          
          <div class="flex gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              class="!px-4 !h-8 text-[11px]" 
              @click="$emit('close')"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              class="!px-6 !h-8 bg-accent hover:bg-accent/90 text-white text-[11px]" 
              @click="saveFilters"
            >
              Save Filters
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, type CSSProperties } from 'vue';
import { computePosition, autoUpdate, flip, shift, offset } from "@floating-ui/dom";
import DatePicker from "./DatePicker.vue";
import Button from "../../../components/ui/Button.vue";
import { useWorkspacesRoles } from "../../../queries/useWorkspace";
import { useGroupedSprints } from "../../../queries/usePlan";

const props = defineProps<{
  triggerRef: HTMLElement | null;
  sheets: any[];
  variables: any[];
  workspaceId: string;
  moduleId: string;
  activeFilters: any;
}>();

const emit = defineEmits(['apply', 'clear', 'close']);

const dropdownRef = ref<HTMLElement | null>(null);
const activeCategory = ref('sheets');
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const isVisible = ref(false);

const dropdownStyles = ref<CSSProperties>({
  position: "fixed",
  top: "-9999px",
  left: "-9999px",
  opacity: 0,
});

let cleanupFloating: (() => void) | null = null;

const categories = [
  { id: 'sheets', label: 'Parent Sheets', icon: 'fa-solid fa-layer-group' },
  { id: 'assignees', label: 'Assignees', icon: 'fa-solid fa-user-group' },
  { id: 'priority', label: 'Priority', icon: 'fa-solid fa-arrow-up-wide-short' },
  { id: 'status', label: 'Status', icon: 'fa-solid fa-circle-check' },
  { id: 'type', label: 'Work Type', icon: 'fa-solid fa-briefcase' },
  { id: 'plan', label: 'Plan Items', icon: 'fa-solid fa-map-location-dot' },
  { id: 'dates', label: 'Date Ranges', icon: 'fa-solid fa-calendar-days' },
];

const dateCategories = [
  { id: 'start', label: 'Start Date', from: 'start_date_from', to: 'start_date_to' },
  { id: 'end', label: 'End Date', from: 'end_date_from', to: 'end_date_to' },
  { id: 'created', label: 'Created At', from: 'created_at_from', to: 'created_at_to' },
];

const localFilters = ref<any>({
  sheet_ids: [],
  seat_ids: [],
  priority: [],
  status: [],
  card_type: [],
  sprint_id: [],
  milestone_id: [],
  huddle_id: [],
  start_date_from: "",
  start_date_to: "",
  end_date_from: "",
  end_date_to: "",
  created_at_from: "",
  created_at_to: ""
});

function updatePosition() {
  if (!props.triggerRef || !dropdownRef.value) return;

  computePosition(props.triggerRef, dropdownRef.value, {
    placement: "bottom-end",
    strategy: "fixed",
    middleware: [
      offset(10),
      flip(),
      shift({ padding: 5 }),
    ],
  }).then(({ x, y }) => {
    dropdownStyles.value = {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      opacity: 1,
    };
  });
}

onMounted(() => {
  // First, initialize the data from props
  if (props.activeFilters && Object.keys(props.activeFilters).length > 0) {
    Object.keys(props.activeFilters).forEach(key => {
      if (Array.isArray(localFilters.value[key])) {
         const val = props.activeFilters[key];
         localFilters.value[key] = Array.isArray(val) ? [...val] : (val ? [val] : []);
      } else {
         localFilters.value[key] = props.activeFilters[key];
      }
    });
  }

  // Then, handle visibility and positioning
  isVisible.value = true;
  nextTick(() => {
    if (props.triggerRef && dropdownRef.value) {
      updatePosition();
      cleanupFloating = autoUpdate(props.triggerRef, dropdownRef.value, updatePosition);
    }
  });
});

onBeforeUnmount(() => {
  if (cleanupFloating) cleanupFloating();
});

watch(activeCategory, () => {
  searchQuery.value = '';
  nextTick(() => searchInput.value?.focus());
});

const { data: roles } = useWorkspacesRoles(computed(() => props.workspaceId));
const { data: groupedPlanPoints } = useGroupedSprints(computed(() => props.workspaceId));

const currentCategoryLabel = computed(() => {
  return categories.find(c => c.id === activeCategory.value)?.label || '';
});

const currentOptions = computed(() => {
  switch (activeCategory.value) {
    case 'sheets':
      return props.sheets.map(s => ({ 
        _id: s._id, 
        title: s.title || s.variables?.['sheet-title'] || 'Unnamed Sheet' 
      }));
    case 'assignees':
      return (roles.value || []).map((r: any) => ({
        _id: r._id,
        title: r.name || r.title || 'Unknown',
        description: r.email
      }));
    case 'priority':
      return getVariableOptions('priority');
    case 'status':
      return getVariableOptions('card-status') || getVariableOptions('status');
    case 'type':
      return getVariableOptions('card-type') || getVariableOptions('type');
    case 'plan':
      const options: any[] = [];
      if (groupedPlanPoints.value?.grouped) {
        const { sprint, milestone, hurdle } = groupedPlanPoints.value.grouped;
        if (sprint) sprint.forEach((s: any) => options.push({ _id: `sprint:${s._id}`, title: s.title, description: 'Sprint' }));
        if (milestone) milestone.forEach((m: any) => options.push({ _id: `milestone:${m._id}`, title: m.title, description: 'Milestone' }));
        if (hurdle) hurdle.forEach((h: any) => options.push({ _id: `huddle:${h._id}`, title: h.title, description: 'Huddle' }));
      }
      return options;
    default:
      return [];
  }
});

const filteredOptions = computed(() => {
  if (!searchQuery.value) return currentOptions.value;
  const q = searchQuery.value.toLowerCase();
  return currentOptions.value.filter((o: any) => 
    o.title.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q))
  );
});

function getVariableOptions(slug: string) {
  const v = props.variables?.find((varItem: any) => varItem.slug === slug || varItem.title?.toLowerCase() === slug.toLowerCase());
  return (v?.data || []).map((val: any) => ({ 
    _id: val.value || val, 
    title: val.value || val 
  }));
}

function isSelected(id: any) {
  const cat = activeCategory.value;
  if (cat === 'plan') {
    const [type, actualId] = String(id).split(':');
    if (type === 'sprint') return localFilters.value.sprint_id.includes(actualId);
    if (type === 'milestone') return localFilters.value.milestone_id.includes(actualId);
    if (type === 'huddle') return localFilters.value.huddle_id.includes(actualId);
  }
  
  const key = getFilterKey(cat);
  return Array.isArray(localFilters.value[key]) && localFilters.value[key].includes(id);
}

function toggleOption(id: any) {
  const cat = activeCategory.value;
  if (cat === 'plan') {
    const [type, actualId] = String(id).split(':');
    const key = `${type}_id`;
    const arr = localFilters.value[key];
    const idx = arr.indexOf(actualId);
    if (idx > -1) arr.splice(idx, 1);
    else arr.push(actualId);
    return;
  }

  const key = getFilterKey(cat);
  const arr = localFilters.value[key];
  const idx = arr.indexOf(id);
  if (idx > -1) arr.splice(idx, 1);
  else arr.push(id);
}

function getFilterKey(cat: string) {
  switch (cat) {
    case 'sheets': return 'sheet_ids';
    case 'assignees': return 'seat_ids';
    case 'priority': return 'priority';
    case 'status': return 'status';
    case 'type': return 'card_type';
    default: return '';
  }
}

function getSelectionCount(cat: string) {
  if (cat === 'dates') {
    return dateCategories.reduce((acc, d) => 
      acc + (localFilters.value[d.from] ? 1 : 0) + (localFilters.value[d.to] ? 1 : 0)
    , 0);
  }
  if (cat === 'plan') {
    return localFilters.value.sprint_id.length + 
           localFilters.value.milestone_id.length + 
           localFilters.value.huddle_id.length;
  }
  const key = getFilterKey(cat);
  return Array.isArray(localFilters.value[key]) ? localFilters.value[key].length : 0;
}

function clearCurrentCategory() {
  const cat = activeCategory.value;
  if (cat === 'dates') {
    dateCategories.forEach(d => {
      localFilters.value[d.from] = "";
      localFilters.value[d.to] = "";
    });
  } else if (cat === 'plan') {
    localFilters.value.sprint_id = [];
    localFilters.value.milestone_id = [];
    localFilters.value.huddle_id = [];
  } else {
    const key = getFilterKey(cat);
    if (Array.isArray(localFilters.value[key])) localFilters.value[key] = [];
  }
}

function clearAll() {
  Object.keys(localFilters.value).forEach(key => {
    if (Array.isArray(localFilters.value[key])) {
      localFilters.value[key] = [];
    } else {
      localFilters.value[key] = "";
    }
  });
  emit('clear');
}

function saveFilters() {
  emit('apply', { ...localFilters.value });
}
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
