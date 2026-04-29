<template>
  <div class="flex flex-col h-[calc(100vh-160px)] relative rounded-[6px] mt-4 overflow-hidden border border-border/60">
    <div ref="tableViewport" class="kanban-table flex-1 overflow-y-auto overflow-x-auto rounded-[6px]">
      <table class="w-full table-fixed border-collapse shadow-sm bg-bg-body/20 text-sm">
        <!-- HEADER -->
        <thead class="bg-bg-surface border-b border-border sticky top-[-1px] z-[999]">
          <tr class="text-text-secondary">
            <th class="w-8 p-0 sticky left-0 z-20 bg-bg-surface"></th>
            <th 
              v-for="col in visibleColumns" 
              :key="col.key" 
              class="relative font-bold px-3 py-2 uppercase text-left text-[11px] tracking-wide border-r border-border/40 select-none whitespace-nowrap min-w-[200px]"
              :style="{ width: columnWidths[col.key] ? columnWidths[col.key] + 'px' : '100%' }"
            >
              <span>{{ col.label }}</span>
              <!-- Column Resize Handle -->
              <div 
                class="absolute right-0 top-0 h-full w-2 cursor-col-resize z-30 hover:bg-accent/20 active:bg-accent/40 transition" 
                @mousedown="(e) => startResize(e, col.key)"
              ></div>
            </th>
            
            <!-- Toggle Columns Button -->
            <th class="w-10 p-2 text-center sticky right-0 z-20 bg-bg-surface border-l border-border/40">
              <div class="relative inline-block">
                <button 
                  @click.stop="showColumnMenu = !showColumnMenu" 
                  class="p-1 rounded hover:bg-bg-surface/50 cursor-pointer"
                >
                  <i class="fa-regular fa-columns-3"></i>
                </button>

                <!-- Column Toggle Menu -->
                <div 
                  v-if="showColumnMenu"
                  class="column-menu absolute w-[200px] -right-1 bg-bg-dropdown border border-border rounded shadow z-50 overflow-hidden"
                >
                  <div 
                    v-for="col in props.columns" 
                    :key="'toggle-' + col.key" 
                    class="flex items-center space-x-2 px-3 py-1.5 capitalize font-medium cursor-pointer hover:bg-bg-dropdown-menu-hover text-[12px] text-text-primary gap-2"
                  >
                    <input
                      type="checkbox"
                      :checked="visibleColumnKeys.includes(col.key)"
                      @change="toggleColumn(col.key)"
                      class="h-4 w-4 mt-0.5 rounded border-border accent-accent cursor-pointer flex-shrink-0"
                    />
                    <span>{{ col.label }}</span>
                  </div>
                  <div 
                    v-if="canCreateVariable" 
                    @click="() => { emit('addVar'); showColumnMenu = false; }" 
                    class="sticky bottom-0 bg-bg-dropdown shadow-md mt-2 shadow-border capitalize border-t border-border px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer flex items-center gap-1 overflow-hidden overflow-ellipsis text-nowrap"
                  >
                    <i class="fa-solid fa-plus"></i> Add new
                  </div>
                </div>
              </div>
            </th>
          </tr>
        </thead>

        <!-- BODY -->
        <tbody class="bg-bg-surface/20">
          <!-- SKELETON LOADING -->
          <template v-if="isPending">
            <tr v-for="n in 5" :key="'sk-' + n" class="border-b border-border animate-pulse">
              <td>
                <div class="w-4 h-4 bg-bg-surface rounded mx-auto"></div>
              </td>
              <td 
                v-for="(col, i) in visibleColumns" 
                :key="col.key" 
                class="border-r border-border h-8 px-3 py-1.5"
                :style="{ width: columnWidths[col.key] + 'px' }"
                :colspan="i === visibleColumns.length - 1 ? 2 : 1"
              >
                <div class="w-full h-4 bg-bg-surface rounded"></div>
              </td>
            </tr>
          </template>

          <!-- GROUPED VIEW -->
          <template v-else v-for="(group, gIndex) in groups" :key="group.title || gIndex">
            <!-- GROUP HEADER -->
            <tr 
              class="bg-bg-body/50 border-y border-border cursor-pointer hover:bg-bg-surface/60 transition-colors group/header"
              @click="toggleGroup(group.title)"
            >
              <td :colspan="visibleColumns.length + 2" class="p-2 text-sm font-semibold text-text-primary border-r-0">
                <div class="flex items-center gap-2">
                  <i 
                    class="fa-solid fa-chevron-right text-xs transition-transform"
                    :class="{ 'rotate-90': expandedGroups[group.title] }"
                  ></i>
                  <span class="capitalize">{{ group.title || 'Untitled' }}</span>
                  <span class="text-text-secondary font-normal text-[11px] ml-2">{{ (group.cards?.length || group.agents?.length || 0) }} seats</span>
                  
                  <!-- Group Header Quick Create '+' -->
                  <button 
                    v-if="(isTalent && isTeamView && canInviteUser) || !isTalent"
                    class="ml-2 w-5 h-5 flex items-center justify-center rounded-md border border-border bg-bg-surface hover:border-accent hover:text-accent opacity-0 group-hover/header:opacity-100 transition-all text-[10px]"
                    @click.stop="$emit('add-seat', group)"
                    :title="isTalent ? 'Add Seat' : 'Add Agent'"
                  >
                    <i class="fa-solid fa-plus font-bold"></i>
                  </button>
                </div>
              </td>
            </tr>

            <!-- GROUP CARDS -->
            <template v-if="expandedGroups[group.title]">
              <tr 
                v-for="(person, index) in (group.cards || group.agents || [])" 
                :key="person._id || index"
                class="border-b border-border transition-colors relative group/row hover:bg-bg-surface/40 cursor-pointer"
                @click="emit('select:ticket', person)"
              >
                <td @click.stop class="w-8 group text-center align-middle border-r border-border/40 sticky left-0 z-20 bg-bg-surface">
                   <div class="flex justify-center items-center h-full w-full relative">
                      <div 
                        v-if="getMenuItems(person).length > 0" 
                        class="h-6 w-5 flex items-center justify-center rounded hover:bg-bg-dropdown-menu-hover cursor-pointer text-text-secondary transition-opacity row-action-btn"
                        @click.stop="activeMenuId = activeMenuId === (person._id || index) ? null : (person._id || index)"
                      >
                        <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                      </div>
                      
                      <div 
                        v-if="activeMenuId === (person._id || index)" 
                        class="absolute left-6 top-6 bg-bg-dropdown border border-border rounded shadow-md z-50 min-w-[140px] text-left overflow-hidden row-action-menu"
                      >
                        <div 
                          v-for="item in getMenuItems(person)" 
                          :key="item.label" 
                          @click.stop="() => { if(item.action) item.action(); activeMenuId = null; }"
                          class="px-3 py-2 text-xs flex items-center gap-2 cursor-pointer transition-colors"
                          :class="item.danger ? 'text-red-500 hover:bg-red-500/10' : 'text-text-primary hover:bg-bg-dropdown-menu-hover'"
                        >
                          <i v-if="item.icon" :class="`${item.icon.prefix} ${item.icon.iconName}`"></i>
                          <span>{{ item.label }}</span>
                        </div>
                      </div>
                   </div>
                </td>
                
                <td
                  v-for="(col, i) in visibleColumns"
                  :key="col.key"
                  class="border-r border-border overflow-visible relative h-8 px-3 py-1.5"
                  :style="{ width: columnWidths[col.key] ? columnWidths[col.key] + 'px' : (i === 0 ? '250px' : '200px') }"
                  :colspan="i === visibleColumns.length - 1 ? 2 : 1"
                >
                    <!-- Render Function if provided -->
                    <component
                      v-if="col.render"
                      :is="RenderCell"
                      :row="person"
                      :column="col"
                      :index="person._id"
                    />

                    <!-- Generic Slot fallback -->
                    <slot 
                      v-else 
                      :name="col.key" 
                      :row="person" 
                      :column="col" 
                      :index="person._id"
                    >
                       <div class="text-[12px] text-text-secondary truncate">
                          {{ person[col.key] || getVariableValue(person, col.key) || '-' }}
                       </div>
                    </slot>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref, onMounted, onUnmounted, computed, h } from 'vue';
import { usePermissions } from '../../../composables/usePermissions';

const props = defineProps<{
  columns: any[];
  groups: any[];
  isPending: boolean;
  isTalent?: boolean;
  isTeamView?: boolean;
  workspaceRoles?: any[];
}>();

const emit = defineEmits(['select:ticket', 'deleted', 'assigned', 'unAssigned', 'add-seat', 'addVar', 'invite', 'unassign', 'delete-seat']);

const { canInviteUser, canEditUser, canDeleteUser, canCreateVariable } = usePermissions();

const activeMenuId = ref<string | number | null>(null);

const visibleColumnKeys = ref<string[]>([]);
const showColumnMenu = ref(false);
const columnWidths = ref<Record<string, number>>({});
let isResizing = false;
let currentResizeKey: string | null = null;
let startX = 0;
let startWidth = 0;

// Update visibleColumnKeys when columns prop changes (e.g. tab switch)
watch(() => props.columns, (newCols) => {
  visibleColumnKeys.value = newCols.map((c: any) => c.key);
}, { immediate: true });

const visibleColumns = computed(() => {
  return props.columns.filter((c: any) => visibleColumnKeys.value.includes(c.key));
});

const toggleColumn = (key: string) => {
  if (visibleColumnKeys.value.includes(key)) {
    visibleColumnKeys.value = visibleColumnKeys.value.filter(k => k !== key);
  } else {
    visibleColumnKeys.value.push(key);
  }
};

const startResize = (e: MouseEvent, key: string) => {
  isResizing = true;
  currentResizeKey = key;
  startX = e.clientX;
  const th = (e.target as HTMLElement).parentElement;
  startWidth = th?.offsetWidth || 200;
  
  document.addEventListener('mousemove', doDrag);
  document.addEventListener('mouseup', stopDrag);
};

const doDrag = (e: MouseEvent) => {
  if (!isResizing || !currentResizeKey) return;
  const delta = e.clientX - startX;
  const newWidth = Math.max(100, startWidth + delta);
  columnWidths.value = {
    ...columnWidths.value,
    [currentResizeKey]: newWidth
  };
};

const stopDrag = () => {
  isResizing = false;
  currentResizeKey = null;
  document.removeEventListener('mousemove', doDrag);
  document.removeEventListener('mouseup', stopDrag);
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.row-action-btn') && !target.closest('.row-action-menu')) {
    activeMenuId.value = null;
  }
  if (!target.closest('.column-menu') && !target.closest('.fa-columns-3')) {
    showColumnMenu.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Cell Rendering Logic
const getVariableValue = (person: any, colKey: string) => {
  const values = person.variable_values || person.variables || [];
  if (!Array.isArray(values)) return null;
  const v = values.find((v: any) => v.module_variable_id === colKey || v._id === colKey || v.variable_id === colKey);
  return v?.value || null;
};

const RenderCell = (p: { row: any; column: any; index: any }) => {
  if (p.column?.render) {
    return p.column.render({ 
      row: p.row, 
      column: p.column, 
      value: p.row[p.column.key] || getVariableValue(p.row, p.column.key), 
      index: p.index 
    });
  }
  return h('span', String(p.row[p.column.key] || getVariableValue(p.row, p.column.key) || '-'));
};

const expandedGroups = reactive<Record<string, boolean>>({});

watch(() => props.groups, (newGroups) => {
  if (newGroups) {
    newGroups.forEach((g: any) => {
      if (expandedGroups[g.title] === undefined) {
        expandedGroups[g.title] = true;
      }
    });
  }
}, { immediate: true });

const toggleGroup = (title: string) => {
  expandedGroups[title] = !expandedGroups[title];
};

function getMenuItems(person: any) {
  const items = [];

  items.push({
    label: 'Open Detail',
    action: () => emit('select:ticket', person),
    icon: { prefix: 'fa-regular', iconName: 'fa-id-card' }
  });

  if (!props.isTalent) return items; 
  
  const isOwner = Boolean(person?.is_owner);
  const hasUser = Boolean(person?.email);

  if (isOwner) return items; 

  if (canInviteUser.value && !hasUser) {
    items.push({
      label: 'Assign User',
      action: () => emit('invite', person),
      icon: { prefix: 'fa-regular', iconName: 'fa-user-plus' }
    });
  }

  if (hasUser && canEditUser.value) {
    items.push({
      label: 'UnAssign User',
      danger: true,
      action: () => emit('unassign', person),
      icon: { prefix: 'fa-regular', iconName: 'fa-user-minus' }
    });
  }

  if (canDeleteUser.value) {
    items.push({
      label: 'Delete Seat',
      danger: true,
      action: () => emit('delete-seat', person),
      icon: { prefix: 'fa-regular', iconName: 'fa-trash' }
    });
  }

  return items as { label: string; icon?: any; action?: () => void; danger?: boolean }[];
}
</script>

<style scoped>
.kanban-table::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.kanban-table::-webkit-scrollbar-thumb {
  background-color: rgba(150, 150, 150, 0.4);
  border-radius: 10px;
}
.kanban-table::-webkit-scrollbar-track {
  background: transparent;
}

 
</style>
