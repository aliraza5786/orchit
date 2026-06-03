<template>
  <div ref="wrapperRef" class="relative inline-block text-left">
    <!-- Trigger Button -->
    <button
      ref="triggerRef"
      @click="toggle"
      type="button"
      class="text-nowrap inline-flex justify-between items-center gap-1 border rounded-[6px] font-medium cursor-pointer transition bg-transparent px-3 py-1.5 text-sm"
      :class="isOpen ? 'border-primary-color ring-1 ring-primary-color/20' : 'border-border hover:border-primary-color'"
    >
      <div class="flex items-center gap-2 truncate">
        <i class="fa-regular fa-calendar-days text-primary-color opacity-70"></i>
        <span class="truncate">{{ selectedLabel || 'Select Plans' }}</span>
      </div>
      <svg
        class="w-4 h-4 text-text-secondary mt-1 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
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

    <!-- Main Dropdown Menu -->
    <Teleport to="body">
      <Transition name="fade-scale">
        <div
          v-if="isOpen"
          ref="menuRef"
          :style="dropdownStyles"
          class="z-[9999] min-w-[220px] rounded-[6px] border border-border shadow-lg bg-bg-dropdown fixed"
          @click.stop
        >
          <div class="max-h-[400px] overflow-y-auto custom-scrollbar">
            <ul class="py-1 text-sm">
              <!-- All Plans Option -->
              <li
                class="px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover flex items-center gap-3 transition-colors"
                @click="toggleAllPlans"
                @mouseenter="hoveredGroupId = null"
              >
                <div class="w-4 h-4 flex items-center justify-center">
                  <div 
                    class="w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors"
                    :class="isSelectedAll ? 'bg-primary-color border-primary-color' : (props.selectedIds.length > 0 ? 'border-primary-color bg-primary-color/20' : 'border-border bg-white')"
                  >
                    <i v-if="isSelectedAll" class="fas fa-check text-[10px] text-white"></i>
                    <div v-else-if="props.selectedIds.length > 0" class="w-2 h-0.5 bg-primary-color"></div>
                  </div>
                </div>
                <span>All Plans</span>
              </li>

              <div class="h-px bg-border mx-2 my-1 opacity-50"></div>

              <!-- Plan Groups (Milestones, Sprints, Huddles) -->
              <li
                v-for="group in groups"
                :key="group.id"
                :ref="(el) => { if (el) itemRefs[group.id] = el as HTMLElement; }"
                class="relative px-4 py-2 flex items-center gap-3 transition-colors group"
                :class="[
                  hoveredGroupId === group.id ? 'bg-bg-dropdown-menu-hover text-primary' : '',
                  isGroupEmpty(group) ? 'opacity-90 grayscale-[0.3]' : 'cursor-pointer hover:bg-bg-dropdown-menu-hover'
                ]"
                @click="!isGroupEmpty(group) && toggleGroup(group)"
                @mouseenter="onHoverGroup(group.id)"
                @mouseleave="handleItemLeave"
              >
                <div class="w-4 h-4 flex items-center justify-center">
                  <div 
                    class="w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors"
                    :class="[
                       isGroupFullySelected(group) ? 'bg-primary-color border-primary-color' : (isGroupPartiallySelected(group) ? 'border-primary-color bg-primary-color/20' : 'border-border bg-white'),
                       isGroupEmpty(group) ? 'opacity-50 cursor-not-allowed' : ''
                    ]"
                  >
                    <i v-if="isGroupFullySelected(group)" class="fas fa-check text-[10px] text-white"></i>
                    <div v-else-if="isGroupPartiallySelected(group)" class="w-2 h-0.5 bg-primary-color"></div>
                  </div>
                </div>
                <div class="w-4 h-4 flex items-center justify-center opacity-70">
                  <i :class="getGroupIcon(group.id)" class="text-xs"></i>
                </div>
                <span class="truncate flex-1 font-medium">{{ group.title }}</span>
                <i class="fas fa-chevron-right text-[10px] opacity-30 group-hover:opacity-100 transition-opacity"></i>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Nested Items Menu -->
    <Teleport to="body">
      <div
        v-if="hoveredGroupId && isOpen"
        ref="nestedMenuRef"
        :style="nestedStyles"
        class="z-[10000] min-w-56 bg-bg-dropdown border border-border rounded-[6px] shadow-lg max-h-80 overflow-y-auto py-1 fixed"
        @mouseenter="onHoverNested"
        @mouseleave="handleItemLeave"
        @click.stop
      >
        <ul v-if="!isGroupEmpty(getCurrentGroup!)">
           <!-- All in Group Option -->
           <li
            class="px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer text-sm flex items-center gap-3 border-b border-border/30 mb-1"
            @click="toggleGroup(getCurrentGroup!)"
          >
            <div class="w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors"
                 :class="isGroupFullySelected(getCurrentGroup!) ? 'bg-primary-color border-primary-color' : (isGroupPartiallySelected(getCurrentGroup!) ? 'border-primary-color bg-primary-color/20' : 'border-border bg-white')">
              <i v-if="isGroupFullySelected(getCurrentGroup!)" class="fas fa-check text-[10px] text-white"></i>
              <div v-else-if="isGroupPartiallySelected(getCurrentGroup!)" class="w-2 h-0.5 bg-primary-color"></div>
            </div>
            <span class="font-semibold text-xs">All {{ getCurrentGroup?.title }}</span>
           </li>
 
           <!-- Items List -->
           <li
            v-for="item in getCurrentGroup?.sprints"
            :key="item._id"
            class="px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer text-sm flex items-center gap-3"
            @click="toggleItem(item._id)"
          >
             <div class="w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors"
                  :class="isItemSelectedRecursive(item) ? 'bg-primary-color border-primary-color' : (isItemPartiallySelected(item) ? 'border-primary-color bg-primary-color/20' : 'border-border bg-white')">
               <i v-if="isItemSelectedRecursive(item)" class="fas fa-check text-[10px] text-white"></i>
               <div v-else-if="isItemPartiallySelected(item)" class="w-2 h-0.5 bg-primary-color"></div>
             </div>
             <i class="fa-regular fa-calendar text-[10px] opacity-40"></i>
             <span class="truncate">{{ item.title }}</span>
           </li>
        </ul>
        <div v-else class="flex items-center justify-center px-4 py-6 w-full">
          <EmptyState
            icon="fa-regular fa-calendar"
            :title="planSelectEmptyTitle"
            description="Create one using the add button to get started."
            container-class="py-0"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';
import type { CSSProperties } from 'vue';
import EmptyState from '../../../components/ui/EmptyState.vue';

const props = defineProps<{
  groups: any[]; // Array of { id, title, sprints: [] }
  selectedIds: string[];
  selectedLabel: string;
}>();

const emit = defineEmits<{
  (e: 'select', payload: { ids: string[], label: string }): void;
}>();

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const nestedMenuRef = ref<HTMLElement | null>(null);
const hoveredGroupId = ref<string | null>(null);

const dropdownStyles = ref<CSSProperties>({ position: 'fixed', top: '-9999px', left: '-9999px' });
const nestedStyles = ref<CSSProperties>({ position: 'fixed', top: '-9999px', left: '-9999px' });
const itemRefs = ref<Record<string, HTMLElement>>({});

let cleanupFloating: (() => void) | null = null;
let cleanupNested: (() => void) | null = null;
let hoverTimeout: any = null;

const getCurrentGroup = computed(() => props.groups.find(g => g.id === hoveredGroupId.value));

const planSelectEmptyTitle = computed(() => {
  const title = getCurrentGroup.value?.title?.toLowerCase() || "items";
  return `No ${title} created yet`;
});
const isSelectedItem = (id: string) => props.selectedIds.includes(id);
computed(() => props.selectedIds.length === 0);

function getAllRecursiveIds(item: any): string[] {
  let ids = [item._id];
  if (item.sprints && Array.isArray(item.sprints)) {
    item.sprints.forEach((child: any) => {
      ids = [...ids, ...getAllRecursiveIds(child)];
    });
  }
  return ids;
}

const getAllIds = computed(() => {
  let ids: string[] = [];
  props.groups.forEach(g => {
    g.sprints.forEach((s: any) => {
      ids = [...ids, ...getAllRecursiveIds(s)];
    });
  });
  // Remove duplicates just in case
  return [...new Set(ids)];
});

const isSelectedAll = computed(() => {
  const allIds = getAllIds.value;
  if (!allIds.length) return false;
  return allIds.every(id => props.selectedIds.includes(id));
});

const isGroupEmpty = (group: any) => !group?.sprints?.length;
 
const isGroupFullySelected = (group: any) => {
  if (!group || !group.sprints?.length) return false;
  let allIds: string[] = [];
  group.sprints.forEach((s: any) => {
    allIds = [...allIds, ...getAllRecursiveIds(s)];
  });
  return allIds.every(id => isSelectedItem(id));
};
 
const isGroupPartiallySelected = (group: any) => {
  if (!group || !group.sprints?.length) return false;
  let allIds: string[] = [];
  group.sprints.forEach((s: any) => {
    allIds = [...allIds, ...getAllRecursiveIds(s)];
  });
  return allIds.some(id => isSelectedItem(id)) && !isGroupFullySelected(group);
};

const isItemSelectedRecursive = (item: any) => {
  const ids = getAllRecursiveIds(item);
  return ids.every(id => isSelectedItem(id));
};

const isItemPartiallySelected = (item: any) => {
  const ids = getAllRecursiveIds(item);
  return ids.some(id => isSelectedItem(id)) && !isItemSelectedRecursive(item);
};

onClickOutside(wrapperRef, (event) => {
  const target = event.target as Node;
  if (menuRef.value?.contains(target) || nestedMenuRef.value?.contains(target)) return;
  closeDropdown();
});

function toggle() {
  if (isOpen.value) {
    closeDropdown();
  } else {
    isOpen.value = true;
    nextTick(() => startFloating());
  }
}

function closeDropdown() {
  isOpen.value = false;
  hoveredGroupId.value = null;
  if (cleanupFloating) { cleanupFloating(); cleanupFloating = null; }
  if (cleanupNested) { cleanupNested(); cleanupNested = null; }
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
    middleware: [offset(5), flip(), shift({ padding: 5 })],
  }).then(({ x, y }) => {
    dropdownStyles.value = { position: 'fixed', left: `${x}px`, top: `${y}px` };
  });
}

function onHoverNested() {
  if (hoverTimeout) clearTimeout(hoverTimeout);
}

const onHoverGroup = (groupId: string) => {
  if (hoverTimeout) clearTimeout(hoverTimeout);
  hoveredGroupId.value = groupId;
  nextTick(() => startNestedFloating(groupId));
};

function startNestedFloating(id: string) {
  const reference = itemRefs.value[id];
  const floating = nestedMenuRef.value;
  if (cleanupNested) { cleanupNested(); cleanupNested = null; }
  if (reference && floating) {
    cleanupNested = autoUpdate(reference, floating, () => {
      computePosition(reference, floating, {
        placement: window.innerWidth < 640 ? 'bottom-start' : 'right-start',
        strategy: 'fixed',
        middleware: [
          offset(window.innerWidth < 640 ? 5 : 10), 
          flip({ fallbackPlacements: ['left-start', 'bottom-start', 'top-start'] }), 
          shift({ padding: 5 })
        ]
      }).then(({ x, y }) => {
        nestedStyles.value = { position: 'fixed', left: `${x-8}px`, top: `${y}px` };
      });
    });
  }
}

function handleItemLeave() {
  if (hoverTimeout) clearTimeout(hoverTimeout);
  hoverTimeout = setTimeout(() => {
    hoveredGroupId.value = null;
    if (cleanupNested) { cleanupNested(); cleanupNested = null; }
  }, 150);
}

const toggleAllPlans = () => {
  if (isSelectedAll.value) {
    emit('select', { ids: [], label: 'Select Plans' });
  } else {
    const allIds = getAllIds.value;
    emit('select', { ids: allIds, label: 'All Plans' });
  }
};

const toggleGroup = (group: any) => {
  let newIds = [...props.selectedIds];
  let allGroupIds: string[] = [];
  group.sprints.forEach((s: any) => {
    allGroupIds = [...allGroupIds, ...getAllRecursiveIds(s)];
  });
  
  const isFullySelected = allGroupIds.every(id => newIds.includes(id));

  if (isFullySelected) {
    newIds = newIds.filter(id => !allGroupIds.includes(id));
  } else {
    allGroupIds.forEach((id: string) => {
      if (!newIds.includes(id)) newIds.push(id);
    });
  }
  updateEmit(newIds);
};

const toggleItem = (id: string) => {
  let newIds = [...props.selectedIds];
  
  // Find the item to get its children
  let targetItem = null;
  for (const g of props.groups) {
    targetItem = g.sprints.find((s: any) => s._id === id);
    if (targetItem) break;
  }

  if (targetItem) {
    const recursiveIds = getAllRecursiveIds(targetItem);
    const isCurrentlySelected = newIds.includes(id);

    if (isCurrentlySelected) {
      newIds = newIds.filter(i => !recursiveIds.includes(i));
    } else {
      recursiveIds.forEach(rid => {
        if (!newIds.includes(rid)) newIds.push(rid);
      });
    }
  } else {
    // Fallback if item not found in top-level of groups
    if (newIds.includes(id)) {
      newIds = newIds.filter(i => i !== id);
    } else {
      newIds.push(id);
    }
  }
  updateEmit(newIds);
};

const updateEmit = (ids: string[]) => {
  let label = '';
  if (ids.length === 0) {
    label = 'Select Plans';
  } else if (ids.length === 1) {
    // Find the item to get its title
    let foundTitle = 'Plan';
    props.groups.forEach(g => {
      const item = g.sprints.find((s: any) => s._id === ids[0]);
      if (item) foundTitle = item.title;
    });
    label = foundTitle;
  } else {
    label = `${ids.length} Plans`;
  }
  emit('select', { ids, label });
};

const getGroupIcon = (id: string) => {
  if (id === 'milestone') return 'fas fa-flag';
  if (id === 'sprint') return 'fas fa-sync';
  if (id === 'huddle') return 'fas fa-users';
  return 'fas fa-calendar-check';
};

onBeforeUnmount(() => {
  if (cleanupFloating) cleanupFloating();
  if (cleanupNested) cleanupNested();
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.2);
}

.fade-scale-enter-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.fade-scale-leave-active {
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.fade-scale-enter-from, .fade-scale-leave-to {
  transform: scale(0.97); opacity: 0;
}
</style>
