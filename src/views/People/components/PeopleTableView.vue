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
                  <span class="text-text-secondary font-normal text-[11px] ml-2">{{ group.cards?.length || 0 }} seats</span>
                  
                  <!-- Group Header Quick Create '+' -->
                  <button 
                    v-if="isTalent && isTeamView && canInviteUser"
                    class="ml-2 w-5 h-5 flex items-center justify-center rounded-md border border-border bg-bg-surface hover:border-accent hover:text-accent opacity-0 group-hover/header:opacity-100 transition-all text-[10px]"
                    @click.stop="$emit('add-seat', group)"
                    title="Add Seat"
                  >
                    <i class="fa-solid fa-plus font-bold"></i>
                  </button>
                </div>
              </td>
            </tr>

            <!-- GROUP CARDS -->
            <template v-if="expandedGroups[group.title]">
              <tr 
                v-for="(person, index) in group.cards" 
                :key="person._id || index"
                @mouseenter="hoverIndex = Number(index)"
                @mouseleave="hoverIndex = null"
                class="border-b border-border transition-colors relative group/row hover:bg-bg-surface/40"
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
                  :style="{ width: columnWidths[col.key] + 'px' }"
                  :colspan="i === visibleColumns.length - 1 ? 2 : 1"
                >
                    <!-- Special Renderers -->
                    
                    <!-- Title/Name -->
                    <div v-if="col.key === 'title'" class="flex items-center gap-2 overflow-hidden h-full">
                       <div 
                        class="w-8 h-8 min-w-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 bg-bg-surface"
                        :style="{ backgroundColor: (person.name || person.user_info?.name || person.email) ? avatarColor({ email: person.email || person.user_info?.email, name: person.name || person.user_info?.name }) : '' }"
                      >
                        <img v-if="person.user_info?.avatar" :src="person.user_info.avatar" class="w-full h-full rounded-full object-cover" />
                        <template v-else-if="person.name || person.user_info?.name">{{ getInitials(person.name || person.user_info?.name || '') }}</template>
                        <template v-else-if="person.email">{{ getEmailInitials(person.email) }}</template>
                        <i v-else class="fa-solid fa-user text-white"></i>
                      </div>
                      <div class="flex flex-col justify-center min-w-0">
                        <span class="truncate font-medium text-[13px] text-text-primary leading-tight">
                          {{ person.name || person.user_info?.name || person.title || 'Team Member ' }}
                        </span>
                        <span 
                          v-if="person.email || person.user_info?.email"
                          class="truncate text-[11px] text-text-secondary leading-tight mt-0.5"
                        >
                          {{ person.email || person.user_info?.email }}
                        </span>
                      </div>
                    </div>

                    <!-- Status -->
                    <div v-else-if="col.key === 'status'">
                      <span 
                        class="px-2 py-0.5 rounded-md text-[11px] font-medium capitalize"
                        :class="getStatusClass(person.status ?? (person.is_active ? 'Active' : 'Inactive'))"
                      >
                        {{ person.status ?? (person.is_active ? 'Active' : 'Inactive') }}
                      </span>
                    </div>

                    <!-- Role / Access Role -->
                    <div v-else-if="col.key === 'role'" class="w-full">
                      <TableSearchCell
                        :modelValue="person.workspace_access_role_id"
                        :options="workspaceRoles"
                        placeholder="Assign Access Role"
                        emptyText="Access Role"
                        @change="(val: any) => handleRoleChange(person, val)"
                      >
                        <template #display>
                          <span v-if="getRoleTitle(person.workspace_access_role_id)" class="text-[12px] font-medium text-text-primary truncate">
                            {{ getRoleTitle(person.workspace_access_role_id) }}
                          </span>
                        </template>
                      </TableSearchCell>
                    </div>

                    <!-- Level -->
                    <div v-else-if="col.key === 'level'">
                      <span 
                        class="px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase"
                        :class="getLevelClass(person.level)"
                      >
                        {{ person.level || '-' }}
                      </span>
                    </div>

                    <!-- Model -->
                    <div v-else-if="col.key === 'model'" class="flex items-center gap-1.5">
                      <i class="fa-solid fa-microchip text-[10px] text-text-secondary/70"></i>
                      <span class="text-[12px]">{{ person.model || '-' }}</span>
                    </div>

                    <!-- Assigned Cards -->
                    <div v-else-if="col.key === 'assigned_cards_count'" class="text-[12px] text-text-secondary">
                       <div class="flex items-center gap-1.5">
                          <i class="fa-regular fa-clone opacity-50"></i>
                          <span>{{ person.assigned_cards_count || '-' }}</span>
                       </div>
                    </div>

                    <!-- Variable / Generic -->
                    <div v-else class="text-[12px] text-text-secondary truncate">
                       {{ person[col.key] || getVariableValue(person, col.key) || '-' }}
                    </div>
                </td>

                <!-- Removed the extra sticky column to let colspan=2 take over -->
              </tr>
            </template>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Modals -->
    <div @click.stop>
      <ConfirmDeleteModal 
        v-model="showDelete" 
        title="Delete Team seat" 
        itemLabel="Seat"
        :itemName="activePerson?.title || activePerson?.name || 'Seat'" 
        :requireMatchText="activePerson?.title || activePerson?.name || 'Seat'" 
        confirmText="Delete Seat" 
        cancelText="Cancel"
        size="md" 
        :loading="deletingTicket" 
        @confirm="handleDeletePerson" 
        @cancel="() => { showDelete = false; activePerson = null; }"
      />
      <AssignmentModal
        :isSubmitting="inviting"
        v-model="showAddMembers"
        :members="people?.people"
        :directory="people?.people"
        @submit="handleAssignSubmit"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch, ref, defineAsyncComponent, onMounted, onUnmounted, computed } from 'vue';
import { avatarColor } from '../../../utilities/avatarColor';
import { getInitials } from '../../../utilities';
import { usePermissions } from '../../../composables/usePermissions';
import { useAssignRole, useAssignTeam, useDeleteSeat, usePeople, useUnAssignTeam } from '../../../queries/usePeople';
import { useWorkspaceId } from '../../../composables/useQueryParams';
import { useCompanyId } from '../../../services/user';
import { toast } from 'vue-sonner';
import { useQueryClient } from '@tanstack/vue-query';

const AssignmentModal = defineAsyncComponent(() => import("../modals/AssignmentModal.vue"));
const ConfirmDeleteModal = defineAsyncComponent(() => import("../../Product/modals/ConfirmDeleteModal.vue"));
const TableSearchCell = defineAsyncComponent(() => import("../../../components/feature/TableView/TableSearchCell.vue"));

const props = defineProps<{
  columns: any[];
  groups: any[];
  isPending: boolean;
  isTalent?: boolean;
  isTeamView?: boolean;
  workspaceRoles?: any[];
}>();

const emit = defineEmits(['select:ticket', 'deleted', 'assigned', 'unAssigned', 'add-seat', 'addVar']);

const { canInviteUser, canEditUser, canDeleteUser, canCreateVariable } = usePermissions();
const { workspaceId } = useWorkspaceId();
const { data: companyId } = useCompanyId();
const { data: people } = usePeople(workspaceId.value, companyId);

const queryClient = useQueryClient();
const hoverIndex = ref<number | null>(null);
const activePerson = ref<any>(null);
const showAddMembers = ref(false);
const showDelete = ref(false);
const activeMenuId = ref<string | number | null>(null);

const visibleColumnKeys = ref<string[]>(props.columns.map((c: any) => c.key));
const showColumnMenu = ref(false);
const columnWidths = ref<Record<string, number>>({});
let isResizing = false;
let currentResizeKey: string | null = null;
let startX = 0;
let startWidth = 0;

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

// Mutations
const { mutate: deleteSeat, isPending: deletingTicket } = useDeleteSeat({
    onSuccess: () => {
        toast.success("Seat deleted successfully!");
        emit("deleted", activePerson.value?._id);
        showDelete.value = false;
        activePerson.value = null;
    },
    onError: (err: any) => {
        toast.error(err.message || "Failed to delete seat.");
    }
});

const { mutate: invitePeople, isPending: inviting } = useAssignTeam({
    onSuccess: (res: any) => {
        toast.success("Seat assigned successfully!");
        showAddMembers.value = false;
        emit("assigned", res?.data ?? res);
        activePerson.value = null;
    },
    onError: (err: any) => {
        toast.error(err.message || "Failed to assign seat.");
    }
});

const { mutate: unassign } = useUnAssignTeam({
    onSuccess: () => {
        toast.success("Seat unassigned successfully!");
        emit("unAssigned");
        activePerson.value = null;
    },
    onError: (err: any) => {
        toast.error(err.message || "Failed to unassign seat.");
    }
});

const { mutate: assignRole } = useAssignRole({
  onSuccess: () => {
    toast.success("Access role updated!");
    queryClient.invalidateQueries({ queryKey: ["people-lists"] });
  }
});

const handleRoleChange = (person: any, roleId: string) => {
  assignRole({
    id: person._id,
    workspace_access_role_id: roleId
  });
};

const getRoleTitle = (id: string) => {
  if (!id) return "";
  const role = props.workspaceRoles?.find(r => r._id === id);
  return role?.title || id;
};

// Group collapse state
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
      action: () => {
        activePerson.value = person;
        showAddMembers.value = true;
      },
      icon: { prefix: 'fa-regular', iconName: 'fa-user-plus' }
    });
  }

  if (hasUser && canEditUser.value) {
    items.push({
      label: 'UnAssign User',
      danger: true,
      action: () => unassignHandler(person),
      icon: { prefix: 'fa-regular', iconName: 'fa-user-minus' }
    });
  }

  if (canDeleteUser.value) {
    items.push({
      label: 'Delete Seat',
      danger: true,
      action: () => {
        activePerson.value = person;
        showDelete.value = true;
      },
      icon: { prefix: 'fa-regular', iconName: 'fa-trash' }
    });
  }

  return items as { label: string; icon?: any; action?: () => void; danger?: boolean }[];
}

function handleAssignSubmit(payload: { invite: any }) {
  if (!activePerson.value) return;
  invitePeople({
      id: activePerson.value._id,
      payload: {
          name: extractNameFromEmail(payload.invite.email),
          email: payload.invite.email
      }
  });
}

function handleDeletePerson() { 
    if (!activePerson.value) return;
    deleteSeat({ id: activePerson.value._id });
}

function unassignHandler(person: any) {
    unassign({ id: person._id });
}

function extractNameFromEmail(email: string) {
    const local = (email.split('@')[0] || '').split('+')[0]
    const parts = local.split(/[^a-zA-Z]+/).filter(Boolean)
    if (!parts.length) return email
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}

function getEmailInitials(email: string): string {
    const local = email.split('@')[0] || ''
    return local.slice(0, 2).toUpperCase()
}

const getStatusClass = (status: string) => {
  const s = status?.toLowerCase();
  if (s === 'accepted' || s === 'active') return 'bg-green-600/10 text-green-600';
  if (s === 'pending') return 'bg-amber-600/10 text-amber-600';
  if (s === 'rejected' || s === 'inactive') return 'bg-red-600/10 text-red-600';
  if (s === 'unassigned') return 'bg-bg-surface/60 text-text-secondary';
  return 'bg-bg-surface/60 text-text-secondary';
};

const getLevelClass = (level: string) => {
  const map: Record<string, string> = {
    EXPERT: "bg-purple-100 text-purple-700 border border-purple-200",
    LEAD: "bg-blue-100   text-blue-700   border border-blue-200",
    SENIOR: "bg-green-100  text-green-700  border border-green-200",
    MID: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    JUNIOR: "bg-gray-100   text-gray-600   border border-gray-200",
  };
  return map[level] ?? "bg-gray-100 text-gray-600 border border-gray-200";
};

const getVariableValue = (person: any, colKey: string) => {
  if (!person.variables || !Array.isArray(person.variables)) return null;
  const v = person.variables.find((v: any) => v._id === colKey || v.variable_id === colKey);
  return v?.value || null;
};
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
