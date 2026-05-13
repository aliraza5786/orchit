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
        <div class="flex flex-1 md:min-h-[60vh] md:max-h-[60vh] max-h-[80vh] max-w-[860px] md:w-[650px] w-[95vw]">
          <!-- Left Sidebar: Categories (Desktop) -->
          <div class="hidden md:flex w-1/3 border-r border-border bg-bg-dropdown flex-col">
            <div class="flex-1 py-2 overflow-y-auto flex flex-col gap-[4px]">
              <button
                v-for="cat in categories"
                :key="cat.id"
                @click="activeCategory = cat.id"
                class="w-full px-4 py-3 flex items-center justify-between group transition-colors hover:bg-bg-body"
                :class="activeCategory === cat.id ? 'bg-bg-body text-primary-color' : 'text-text-secondary'"
              >
                <div class="flex items-center gap-3">
                  <i :class="[cat.icon, 'text-sm', activeCategory === cat.id ? 'text-primary-color' : 'text-text-secondary group-hover:text-text-primary']"></i>
                  <span class="text-xs font-medium">{{ cat.label }}</span>
                </div>
                <span 
                  v-if="getSelectionCount(cat.id)"
                  class="bg-primary-color/10 text-primary-color text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                >
                  {{ getSelectionCount(cat.id) }}
                </span>
              </button>
            </div>
          </div>

          <!-- Right Pane: Options (Desktop) -->
          <div class="hidden md:flex flex-1 flex-col bg-bg-dropdown">
            <!-- Search within category -->
            <div v-if="activeCategory !== 'dates'" class="p-4 border-b border-border">
              <div class="relative">
                <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs"></i>
                <input 
                  v-model="searchQuery"
                  type="text" 
                  :placeholder="`Search ${currentCategoryLabel.toLowerCase()}`"
                  class="w-full bg-bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary-color outline-none transition-all"
                  ref="searchInput"
                />
              </div>
            </div>

            <!-- Options list -->
            <div class="flex-1 overflow-y-auto p-2">
              <div v-if="activeCategory === 'dates'" class="p-4 space-y-6">
                <div v-for="dateType in dateCategories" :key="dateType.id" class="space-y-3">
                  <div class="flex items-center gap-2 px-1">
                    <div class="w-1.5 h-1.5 rounded-full bg-primary-color/60"></div>
                    <label class="text-[10px] font-bold text-text-secondary uppercase tracking-[0.1em]">{{ dateType.label }}</label>
                  </div>
                  <div class="flex items-center gap-3">
                    <!-- From Wrapper -->
                    <div class="flex-1 h-9 px-2.5 flex items-center gap-2 rounded-[6px] bg-bg-body border border-border group transition-all focus-0">
                      <i class="fa-regular fa-calendar text-text-secondary/70 text-xs shrink-0 group-hover:text-primary-color transition-colors"></i>
                      <DatePicker v-model="localFilters[dateType.from]" placeholder="From" size="sm" class="flex-1" />
                    </div>
                    
                    <div class="w-2.5 h-[1px] bg-border shrink-0"></div>
                    
                    <!-- To Wrapper -->
                    <div class="flex-1 h-9 px-2.5 flex items-center gap-2 rounded-[6px] bg-bg-body border border-border group transition-all">
                      <i class="fa-regular fa-calendar text-text-secondary/70 text-xs shrink-0 group-hover:text-primary-color transition-colors"></i>
                      <DatePicker v-model="localFilters[dateType.to]" placeholder="To" size="sm" class="flex-1" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div v-if="activeCategory === 'plan'" class="flex flex-col h-[400px]">
                <!-- Type Selection Tabs -->
                <div class="px-2 pt-1">
                  <SwitchTab 
                    v-model="selectedPlanType"
                    :options="planTypeOptions"
                    size="sm"
                  />
                </div>

                <!-- List of Items -->
                <div class="flex-1 overflow-y-auto p-2 min-h-0">
                  <div 
                    v-for="option in currentPlanOptionsFiltered" 
                    :key="option._id"
                    @click="togglePlanOption(option)"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bg-body transition-colors group"
                  >
                    <div 
                      class="w-4 h-4 border rounded flex items-center justify-center transition-colors shrink-0"
                      :class="isPlanSelected(option) ? 'bg-primary-color border-primary-color text-white' : 'border-border group-hover:border-primary-color/50'"
                    >
                      <i v-if="isPlanSelected(option)" class="fa-solid fa-check text-[10px]"></i>
                    </div>

                    <div class="flex flex-col min-w-0">
                      <span class="text-xs font-medium text-text-primary truncate">{{ option.title }}</span>
                      <span v-if="option.description" class="text-[10px] text-text-secondary truncate">{{ option.description }}</span>
                    </div>
                  </div>
                  
                  <div v-if="currentPlanOptionsFiltered.length === 0" class="flex flex-col items-center justify-center h-full opacity-40 py-10">
                    <i class="fa-solid fa-calendar-xmark text-3xl mb-2"></i>
                    <span class="text-xs">No {{ selectedPlanType }}s found</span>
                  </div>
                </div>
              </div>

              <template v-else-if="activeCategory !== 'dates'">
                <div 
                  v-for="option in filteredOptions" 
                  :key="option._id"
                  @click="toggleOption(option._id)"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bg-body transition-colors group"
                >
                  <div 
                    class="w-4 h-4 border rounded flex items-center justify-center transition-colors shrink-0"
                    :class="isSelected(option._id) ? 'bg-primary-color border-primary-color text-white' : 'border-border group-hover:border-primary-color/50'"
                  >
                    <i v-if="isSelected(option._id)" class="fa-solid fa-check text-[10px]"></i>
                  </div>

                  <!-- Avatar (only for assignees) -->
                  <template v-if="activeCategory === 'assignees'">
                      <img v-if="option.avatar" :src="option.avatar" class="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                      <div v-else class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          :style="{ backgroundColor: avatarColor({ name: option.title, email: option.description, _id: option._id }) }">
                          {{ getInitials(option.title) }}
                      </div>
                  </template>

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
                class="text-[10px] font-medium text-primary-color hover:underline"
              >
                Clear current
              </button>
            </div>
          </div>

          <!-- Mobile Accordion View -->
          <div class="flex md:hidden flex-1 flex-col bg-bg-dropdown overflow-y-auto w-full">
            <div v-for="cat in categories" :key="cat.id" class="border-b border-border flex flex-col">
              <!-- Accordion Header -->
              <button
                @click="activeCategory = activeCategory === cat.id ? '' : cat.id"
                class="w-full px-4 py-3 flex items-center justify-between transition-colors hover:bg-bg-body sticky top-0 bg-bg-dropdown z-10"
              >
                <div class="flex items-center gap-3">
                  <i :class="[cat.icon, 'text-sm', activeCategory === cat.id ? 'text-primary-color' : 'text-text-secondary']"></i>
                  <span class="text-xs font-medium">{{ cat.label }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span 
                    v-if="getSelectionCount(cat.id)"
                    class="bg-primary-color/10 text-primary-color text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                  >
                    {{ getSelectionCount(cat.id) }}
                  </span>
                  <i class="fa-solid fa-chevron-down text-[10px] transition-transform"
                     :class="activeCategory === cat.id ? 'rotate-180 text-primary-color' : 'text-text-secondary'"></i>
                </div>
              </button>

              <!-- Accordion Body -->
              <div v-if="activeCategory === cat.id" class="bg-bg-surface/30 flex flex-col border-t border-border" style="max-height: 400px;">
                <!-- Search within category -->
                <div v-if="activeCategory !== 'dates'" class="p-4 border-b border-border shrink-0">
                  <div class="relative">
                    <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs"></i>
                    <input 
                      v-model="searchQuery"
                      type="text" 
                      :placeholder="`Search ${currentCategoryLabel.toLowerCase()}`"
                      class="w-full bg-bg-input border border-border rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-primary-color outline-none transition-all"
                    />
                  </div>
                </div>

                <!-- Options list -->
                <div class="flex-1 overflow-y-auto p-2">
                  <div v-if="activeCategory === 'dates'" class="p-4 space-y-6">
                    <div v-for="dateType in dateCategories" :key="dateType.id" class="space-y-3">
                      <div class="flex items-center gap-2 px-1">
                        <div class="w-1.5 h-1.5 rounded-full bg-primary-color/60"></div>
                        <label class="text-[10px] font-bold text-text-secondary uppercase tracking-[0.1em]">{{ dateType.label }}</label>
                      </div>
                      <div class="flex flex-col gap-3">
                        <div class="flex-1 h-9 px-2.5 flex items-center gap-2 rounded-[6px] bg-bg-body border border-border group transition-all focus-0">
                          <i class="fa-regular fa-calendar text-text-secondary/70 text-xs shrink-0 group-hover:text-primary-color transition-colors"></i>
                          <DatePicker v-model="localFilters[dateType.from]" placeholder="From" size="sm" class="flex-1" />
                        </div>
                        <div class="flex-1 h-9 px-2.5 flex items-center gap-2 rounded-[6px] bg-bg-body border border-border group transition-all">
                          <i class="fa-regular fa-calendar text-text-secondary/70 text-xs shrink-0 group-hover:text-primary-color transition-colors"></i>
                          <DatePicker v-model="localFilters[dateType.to]" placeholder="To" size="sm" class="flex-1" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="activeCategory === 'plan'" class="flex flex-col h-[300px]">
                    <div class="px-2 pt-1 pb-2 shrink-0">
                      <SwitchTab v-model="selectedPlanType" :options="planTypeOptions" size="sm" />
                    </div>
                    <div class="flex-1 overflow-y-auto p-2 min-h-0">
                      <div 
                        v-for="option in currentPlanOptionsFiltered" 
                        :key="option._id"
                        @click="togglePlanOption(option)"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bg-body transition-colors group"
                      >
                        <div 
                          class="w-4 h-4 border rounded flex items-center justify-center transition-colors shrink-0"
                          :class="isPlanSelected(option) ? 'bg-primary-color border-primary-color text-white' : 'border-border group-hover:border-primary-color/50'"
                        >
                          <i v-if="isPlanSelected(option)" class="fa-solid fa-check text-[10px]"></i>
                        </div>
                        <div class="flex flex-col min-w-0">
                          <span class="text-xs font-medium text-text-primary truncate">{{ option.title }}</span>
                          <span v-if="option.description" class="text-[10px] text-text-secondary truncate">{{ option.description }}</span>
                        </div>
                      </div>
                      <div v-if="currentPlanOptionsFiltered.length === 0" class="flex flex-col items-center justify-center h-full opacity-40 py-10">
                        <i class="fa-solid fa-calendar-xmark text-3xl mb-2"></i>
                        <span class="text-xs">No {{ selectedPlanType }}s found</span>
                      </div>
                    </div>
                  </div>

                  <template v-else-if="activeCategory !== 'dates'">
                    <div 
                      v-for="option in filteredOptions" 
                      :key="option._id"
                      @click="toggleOption(option._id)"
                      class="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-bg-body transition-colors group"
                    >
                      <div 
                        class="w-4 h-4 border rounded flex items-center justify-center transition-colors shrink-0"
                        :class="isSelected(option._id) ? 'bg-primary-color border-primary-color text-white' : 'border-border group-hover:border-primary-color/50'"
                      >
                        <i v-if="isSelected(option._id)" class="fa-solid fa-check text-[10px]"></i>
                      </div>
                      <template v-if="activeCategory === 'assignees'">
                          <img v-if="option.avatar" :src="option.avatar" class="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                          <div v-else class="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                              :style="{ backgroundColor: avatarColor({ name: option.title, email: option.description, _id: option._id }) }">
                              {{ getInitials(option.title) }}
                          </div>
                      </template>
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

                <!-- Footer actions for Mobile Pane -->
                <div class="p-3 bg-bg-surface/20 flex justify-between items-center border-t border-border shrink-0">
                  <span class="text-[10px] text-text-secondary">
                    {{ getSelectionCount(activeCategory) }} selected
                  </span>
                  <button 
                    @click.stop="clearCurrentCategory"
                    class="text-[10px] font-medium text-primary-color hover:underline"
                  >
                    Clear {{ currentCategoryLabel.toLowerCase() }}
                  </button>
                </div>
              </div>
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
              class="!px-6 !h-8 bg-primary-color hover:bg-primary-color/90 text-white text-[11px]" 
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
import { onClickOutside } from "@vueuse/core";
import { computePosition, autoUpdate, flip, shift, offset } from "@floating-ui/dom";
import DatePicker from "./DatePicker.vue";
import Button from "../../../components/ui/Button.vue";
import { useWorkspacesRoles } from "../../../queries/useWorkspace";
import { useGroupedSprints } from "../../../queries/usePlan";
import { avatarColor } from "../../../utilities/avatarColor";
import { getInitials } from "../../../utilities";
import SwitchTab from "../../../components/ui/SwitchTab.vue";

const props = defineProps<{
  triggerRef: HTMLElement | null;
  variables: any[];
  workspaceId: string;
  moduleId: string;
  activeFilters: any;
  hidePlanItems?: boolean;
}>();

const emit = defineEmits(['apply', 'clear', 'close']);

const dropdownRef = ref<HTMLElement | null>(null);
const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
const activeCategory = ref(isMobile ? '' : 'assignees');
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

const categories = computed(() => {
  const base = [
    { id: 'assignees', label: 'Assignees', icon: 'fa-solid fa-user-group' },
    { id: 'priority', label: 'Priority', icon: 'fa-solid fa-arrow-up-wide-short' },
    { id: 'status', label: 'Status', icon: 'fa-solid fa-circle-check' },
    { id: 'type', label: 'Card Type', icon: 'fa-solid fa-briefcase' },
    { id: 'plan', label: 'Plan Items', icon: 'fa-solid fa-map-location-dot' },
    { id: 'dates', label: 'Date Ranges', icon: 'fa-solid fa-calendar-days' },
  ];
  return props.hidePlanItems ? base.filter(c => c.id !== 'plan') : base;
});

const dateCategories = [
  { id: 'start', label: 'Start Date', from: 'start_date_from', to: 'start_date_to' },
  { id: 'end', label: 'End Date', from: 'end_date_from', to: 'end_date_to' },
  { id: 'created', label: 'Created At', from: 'created_at_from', to: 'created_at_to' },
];

const localFilters = ref<any>({
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

const selectedPlanType = ref('milestone');
const planTypes = [
  { id: 'milestone', label: 'Milestones', icon: 'fas fa-flag' },
  { id: 'sprint', label: 'Sprints', icon: 'fas fa-sync' },
  { id: 'huddle', label: 'Huddles', icon: 'fas fa-users' },
];

const planTypeOptions = computed(() => planTypes.map(t => ({ label: t.label, value: t.id })));

function getRecursivePlanIds(item: any, rootType?: string) {
  let milestone_ids: string[] = [];
  let sprint_ids: string[] = [];
  let huddle_ids: string[] = [];

  function traverse(node: any, currentType: string) {
    if (!node._id) return;
    
    if (currentType === 'milestone') {
       milestone_ids.push(node._id);
       (node.sprints || []).forEach((child: any) => traverse(child, 'sprint'));
       (node.hurdles || []).forEach((child: any) => traverse(child, 'huddle'));
    } else if (currentType === 'sprint') {
       sprint_ids.push(node._id);
    } else if (currentType === 'huddle') {
       huddle_ids.push(node._id);
    }
  }

  traverse(item, rootType || selectedPlanType.value);
  return { milestone_ids, sprint_ids, huddle_ids };
}

function getParentMilestoneId(childId: string): string | null {
  const milestones = groupedPlanPoints.value?.grouped?.milestone || [];
  for (const m of milestones) {
    const hasSprint = (m.sprints || []).some((s: any) => s._id === childId);
    const hasHuddle = (m.hurdles || []).some((h: any) => h._id === childId);
    if (hasSprint || hasHuddle) {
      return m._id;
    }
  }
  return null;
}

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

onClickOutside(dropdownRef, (e) => {
  if (props.triggerRef?.contains(e.target as Node)) return;
  emit('close');
}, { ignore: ['.dp__menu', '.dp__outer_menu_wrap', '.datepicker-popover'] });

const { data: roles } = useWorkspacesRoles(computed(() => props.workspaceId));
const { data: groupedPlanPoints } = useGroupedSprints(computed(() => props.workspaceId));

const currentCategoryLabel = computed(() => {
  return categories.value.find(c => c.id === activeCategory.value)?.label || '';
});

const currentOptions = computed(() => {
  switch (activeCategory.value) {
    case 'assignees':
      return (roles.value || []).map((r: any) => ({
        _id: r._id,
        title: r.name || r.title || 'Unknown',
        description: r.email,
        avatar: r.user?.avatar
      }));
    case 'priority':
      return getVariableOptions('priority');
    case 'status':
      return getVariableOptions('card-status') || getVariableOptions('status');
    case 'type':
      return getVariableOptions('card-type') || getVariableOptions('type');
    case 'plan':
      const grouped = groupedPlanPoints.value?.grouped;
      if (!grouped) return [];
      
      if (selectedPlanType.value === 'milestone') {
        return (grouped.milestone || []).map((m: any) => ({
          ...m,
          _id: m._id,
          title: m.title,
          description: `${(m.sprints?.length || 0) + (m.hurdles?.length || 0)} items`
        }));
      } else if (selectedPlanType.value === 'sprint') {
        return (grouped.sprint || []).map((s: any) => ({
          ...s,
          _id: s._id,
          title: s.title,
          description: 'Sprint'
        }));
      } else {
        return (grouped.hurdle || []).map((h: any) => ({
          ...h,
          _id: h._id,
          title: h.title,
          description: 'Huddle'
        }));
      }
    default:
      return [];
  }
});

const filteredOptions = computed(() => {
  if (activeCategory.value === 'plan') return currentPlanOptionsFiltered.value;
  if (!searchQuery.value) return currentOptions.value;
  const q = searchQuery.value.toLowerCase();
  return currentOptions.value.filter((o: any) => 
    o.title.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q))
  );
});

const currentPlanOptionsFiltered = computed(() => {
  const options = currentOptions.value;
  if (!searchQuery.value) return options;
  const q = searchQuery.value.toLowerCase();
  return options.filter((o: any) => 
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
  const key = getFilterKey(cat);
  return Array.isArray(localFilters.value[key]) && localFilters.value[key].includes(id);
}

function isPlanSelected(option: any) {
  const type = selectedPlanType.value;
  if (type === 'milestone') return localFilters.value.milestone_id.includes(option._id);
  if (type === 'sprint') return localFilters.value.sprint_id.includes(option._id);
  if (type === 'huddle') return localFilters.value.huddle_id.includes(option._id);
  return false;
}

function togglePlanOption(option: any) {
  const { milestone_ids, sprint_ids, huddle_ids } = getRecursivePlanIds(option, selectedPlanType.value);
  const isCurrentlySelected = isPlanSelected(option);

  const updateArray = (filterKey: string, ids: string[]) => {
    const arr = [...localFilters.value[filterKey]];
    if (isCurrentlySelected) {
      localFilters.value[filterKey] = arr.filter(id => !ids.includes(id));
    } else {
      ids.forEach(id => {
        if (!arr.includes(id)) arr.push(id);
      });
      localFilters.value[filterKey] = arr;
    }
  };

  updateArray('milestone_id', milestone_ids);
  updateArray('sprint_id', sprint_ids);
  updateArray('huddle_id', huddle_ids);

  if (isCurrentlySelected && (selectedPlanType.value === 'sprint' || selectedPlanType.value === 'huddle')) {
    const parentId = getParentMilestoneId(option._id);
    if (parentId) {
      localFilters.value.milestone_id = localFilters.value.milestone_id.filter((id: string) => id !== parentId);
    }
  }
}

function toggleOption(id: any) {
  const cat = activeCategory.value;
  const key = getFilterKey(cat);
  const arr = localFilters.value[key];
  const idx = arr.indexOf(id);
  if (idx > -1) arr.splice(idx, 1);
  else arr.push(id);
}

function getFilterKey(cat: string) {
  switch (cat) {
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
