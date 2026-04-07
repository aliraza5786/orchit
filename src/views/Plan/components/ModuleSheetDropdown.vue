<template>
  <div ref="wrapperRef" class="relative inline-block text-left">
    <!-- Trigger Button -->
    <button
      ref="triggerRef"
      @click="toggle"
      type="button"
      class="text-nowrap inline-flex justify-between items-center gap-1 border rounded-[6px] font-medium cursor-pointer transition bg-transparent px-3 py-1.5 text-sm"
      :class="isOpen ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:border-accent-hover'"
    >
      <div class="flex items-center gap-2 truncate">
        <i class="fa-regular fa-filter text-accent opacity-70"></i>
        <span class="truncate">{{ selectedLabel || 'All Modules' }}</span>
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
              <!-- All Modules Option -->
              <li
                class="px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover flex items-center gap-3 transition-colors"
                @click="handleSelectAll"
                @mouseenter="hoveredModuleId = null"
              >
                <div class="w-4 h-4 flex items-center justify-center">
                  <div 
                    class="w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors"
                    :class="isSelectedAllModules ? 'bg-accent border-accent' : 'border-border bg-white'"
                  >
                    <i v-if="isSelectedAllModules" class="fas fa-check text-[10px] text-white"></i>
                  </div>
                </div>
                <span>All Modules</span>
              </li>

              <div class="h-px bg-border mx-2 my-1 opacity-50"></div>

              <!-- Modules -->
              <li
                v-for="module in modules"
                :key="module._id"
                :ref="(el) => { if (el) itemRefs[module._id] = el as HTMLElement; }"
                class="relative px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover flex items-center gap-3 transition-colors group"
                :class="{ 'bg-bg-dropdown-menu-hover text-primary': hoveredModuleId === module._id }"
                @click="toggleModule(module._id)"
                @mouseenter="onHoverModule(module._id)"
                @mouseleave="handleItemLeave"
              >
                <div class="w-4 h-4 flex items-center justify-center">
                  <div 
                    class="w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors"
                    :class="isSelectedModule(module._id) ? 'bg-accent border-accent' : 'border-border bg-white'"
                  >
                    <i v-if="isSelectedModule(module._id)" class="fas fa-check text-[10px] text-white"></i>
                  </div>
                </div>
                <div class="w-4 h-4 flex items-center justify-center opacity-70">
                  <i :class="getModuleIcon(module)" class="text-xs"></i>
                </div>
                <span class="truncate flex-1 font-medium">{{ module.variables['module-title'] }}</span>
                <i class="fas fa-chevron-right text-[10px] opacity-30 group-hover:opacity-100 transition-opacity"></i>
              </li>
            </ul>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Nested Sheets Menu -->
    <Teleport to="body">
      <div
        v-if="hoveredModuleId && isOpen"
        ref="nestedMenuRef"
        :style="nestedStyles"
        class="z-[10000] min-w-56 bg-bg-dropdown border border-border rounded-[6px] shadow-lg max-h-80 overflow-y-auto py-1 fixed"
        @mouseenter="onHoverNested"
        @mouseleave="handleItemLeave"
        @click.stop
      >
        <div v-if="loadingMap[hoveredModuleId]" class="px-4 py-3 flex items-center gap-2">
           <div class="w-3 h-3 border-2 border-accent border-t-transparent animate-spin rounded-full"></div>
           <span class="text-xs text-text-secondary">Loading sheets...</span>
        </div>
        <div v-else-if="!sheetsMap[hoveredModuleId] || sheetsMap[hoveredModuleId].length === 0" class="px-4 py-3 text-xs text-text-secondary italic">
           No sheets found
        </div>
        <ul v-else>
           <!-- All Sheets Option -->
           <li
            class="px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer text-sm flex items-center gap-3 border-b border-border/30 mb-1"
            @click="toggleAllSheetsForModule(hoveredModuleId)"
          >
            <div class="w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors"
                 :class="isAllSheetsSelected(hoveredModuleId) ? 'bg-accent border-accent' : 'border-border bg-white'">
              <i v-if="isAllSheetsSelected(hoveredModuleId)" class="fas fa-check text-[10px] text-white"></i>
            </div>
            <span class="font-semibold text-xs">All Sheets</span>
          </li>

           <!-- Sheets List -->
           <li
            v-for="sheet in sheetsMap[hoveredModuleId]"
            :key="sheet._id"
            class="px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer text-sm flex items-center gap-3"
            @click="toggleSheet(hoveredModuleId!, sheet._id)"
          >
             <div class="w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors"
                  :class="isSelectedSheet(sheet._id) ? 'bg-accent border-accent' : 'border-border bg-white'">
               <i v-if="isSelectedSheet(sheet._id)" class="fas fa-check text-[10px] text-white"></i>
             </div>
             <i class="fa-regular fa-file-lines text-[10px] opacity-40"></i>
             <span class="truncate">{{ sheet.variables['sheet-title'] }}</span>
           </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, computed } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { useWorkspaceId } from '../../../composables/useQueryParams';
import { computePosition, autoUpdate, flip, shift, offset } from '@floating-ui/dom';
import type { CSSProperties } from 'vue';

const props = defineProps<{
  modules: any[];
  selectedIds: string[];
  selectedSheetIds: string[];
  selectedLabel: string;
}>();

const emit = defineEmits<{
  (e: 'select', payload: { ids: string[], sheetIds: string[], label: string }): void;
}>();

const isOpen = ref(false);
const wrapperRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLElement | null>(null);
const menuRef = ref<HTMLElement | null>(null);
const nestedMenuRef = ref<HTMLElement | null>(null);
const hoveredModuleId = ref<string | null>(null);
const sheetsMap = ref<Record<string, any[]>>({});
const loadingMap = ref<Record<string, boolean>>({});

const dropdownStyles = ref<CSSProperties>({ position: 'fixed', top: '-9999px', left: '-9999px' });
const nestedStyles = ref<CSSProperties>({ position: 'fixed', top: '-9999px', left: '-9999px' });
const itemRefs = ref<Record<string, HTMLElement>>({});

const { workspaceId } = useWorkspaceId();

let cleanupFloating: (() => void) | null = null;
let cleanupNested: (() => void) | null = null;
let hoverTimeout: any = null;

// Helper to check selection
const isSelectedModule = (id: string) => props.selectedIds.includes(id);
const isSelectedSheet = (id: string) => props.selectedSheetIds.includes(id);
const isSelectedAllModules = computed(() => props.selectedIds.length === 0 && props.selectedSheetIds.length === 0);

const isAllSheetsSelected = (moduleId: string) => {
  return isSelectedModule(moduleId) && !props.selectedSheetIds.some(sid => 
    sheetsMap.value[moduleId]?.some(s => s._id === sid)
  );
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
  hoveredModuleId.value = null;
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

const onHoverModule = async (moduleId: string) => {
  if (hoverTimeout) clearTimeout(hoverTimeout);
  hoveredModuleId.value = moduleId;
  
  nextTick(() => startNestedFloating(moduleId));

  if (!sheetsMap.value[moduleId] && !loadingMap.value[moduleId]) {
    loadingMap.value[moduleId] = true;
    try {
      const { request } = await import('../../../libs/api');
      const response = await request<any>({
        url: '/sheets',
        method: 'GET',
        params: {
          workspace_module_id: moduleId,
          workspace_id: workspaceId.value,
        },
      });
      const sheets = Array.isArray(response) ? response : response?.data || [];
      sheetsMap.value[moduleId] = sheets;
    } catch (err) {
      console.error('Failed to fetch sheets:', err);
      sheetsMap.value[moduleId] = [];
    } finally {
      loadingMap.value[moduleId] = false;
    }
  }
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
    hoveredModuleId.value = null;
    if (cleanupNested) { cleanupNested(); cleanupNested = null; }
  }, 150);
}

// Multi-select logic handlers
const handleSelectAll = () => {
  emit('select', { ids: [], sheetIds: [], label: 'All Modules' });
};

const toggleModule = (id: string) => {
  let newIds = [...props.selectedIds];
  if (newIds.includes(id)) {
    newIds = newIds.filter(i => i !== id);
    // Also remove related sheets
    const relatedSheets = sheetsMap.value[id]?.map(s => s._id) || [];
    const newSheetIds = props.selectedSheetIds.filter(sid => !relatedSheets.includes(sid));
    updateEmit(newIds, newSheetIds);
  } else {
    newIds.push(id);
    updateEmit(newIds, props.selectedSheetIds);
  }
};

const toggleSheet = (moduleId: string, sheetId: string) => {
  let newSheetIds = [...props.selectedSheetIds];
  let newModuleIds = [...props.selectedIds];

  if (newSheetIds.includes(sheetId)) {
    newSheetIds = newSheetIds.filter(id => id !== sheetId);
  } else {
    newSheetIds.push(sheetId);
    if (!newModuleIds.includes(moduleId)) {
      newModuleIds.push(moduleId);
    }
  }
  updateEmit(newModuleIds, newSheetIds);
};

const toggleAllSheetsForModule = (moduleId: string) => {
  let newModuleIds = [...props.selectedIds];
  if (!newModuleIds.includes(moduleId)) {
    newModuleIds.push(moduleId);
  }
  // Clear specific sheets for this module to signify "All Sheets"
  const moduleSheets = sheetsMap.value[moduleId]?.map(s => s._id) || [];
  const newSheetIds = props.selectedSheetIds.filter(sid => !moduleSheets.includes(sid));
  updateEmit(newModuleIds, newSheetIds);
};

const updateEmit = (ids: string[], sheetIds: string[]) => {
  let label = '';
  if (ids.length === 0) {
    label = 'All Modules';
  } else if (ids.length === 1) {
    const mod = props.modules.find(m => m._id === ids[0]);
    const moduleTitle = mod?.variables['module-title'] || 'Module';
    const sheetsInMod = sheetIds.filter(sid => sheetsMap.value[ids[0]]?.some(s => s._id === sid));
    if (sheetsInMod.length === 0) {
      label = moduleTitle;
    } else if (sheetsInMod.length === 1) {
      const sheet = sheetsMap.value[ids[0]].find(s => s._id === sheetsInMod[0]);
      label = `${moduleTitle} (${sheet?.variables['sheet-title']})`;
    } else {
      label = `${moduleTitle} (+${sheetsInMod.length})`;
    }
  } else {
    label = `${ids.length} Modules`;
  }
  emit('select', { ids, sheetIds, label });
};

const getModuleIcon = (module: any) => {
  const icon = module?.variables?.['module-icon'];
  if (!icon) return 'fa-solid fa-layer-group';
  const prefix = icon.prefix || 'fa-solid';
  const name = icon.iconName?.startsWith('fa-') ? icon.iconName : `fa-${icon.iconName}`;
  return `${prefix} ${name}`;
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
