<template>
  <div class="relative w-full h-full" ref="containerRef" @click.stop>
    <!-- Display Mode -->
    <div
      v-if="!isEditing"
      @click="startEditing"
      class="w-full h-full flex items-center px-3 py-1.5 cursor-pointer hover:bg-bg-surface-hover rounded-md truncate transition-all duration-200 min-h-[36px] group"
      :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    >
      <template
        v-if="displayUsers.length > 0"
      >
        <div class="flex items-center -space-x-1.5 truncate">
          <template v-for="(u, index) in displayUsers.slice(0, 2)" :key="index">
             
            <img
              v-if="
                u?.avatar?.src ||
                u?.user?.avatar ||
                u?.u_profile_image
              "
              :src="
                u?.avatar?.src ??
                u?.u_profile_image ??
                u?.user?.avatar
              "
              class="w-5 h-5 object-cover rounded-full border-2 border-bg-card flex-shrink-0"
              alt=""
            />

            <div
              v-else-if="u?.u_full_name || u?.name"
              class="w-5 h-5 aspect-square rounded-full text-[9px] bg-bg-surface text-text-primary flex items-center justify-center border-2 border-bg-card flex-shrink-0"
              :style="{
                backgroundColor:
                  u?.u_full_name ?? u?.title
                    ? avatarColor({
                        name: u?.u_full_name ?? u?.title,
                        _id: u?._id,
                      })
                    : '',
              }"
            >
              {{ getInitials(u?.u_full_name ?? u?.title) }}
            </div>

            <div
              v-else
              class="w-5 h-5 bg-bg-surface border-2 border-bg-card rounded-full flex justify-center items-center flex-shrink-0"
            >
              <i class="fa-regular fa-user text-[8px]"></i>
            </div>
          </template>
          
          <div v-if="displayUsers.length > 2" 
            class="w-5 h-5 rounded-full bg-bg-surface border-2 border-bg-card flex items-center justify-center text-[9px] font-bold text-text-primary">
            +{{ displayUsers.length - 2 }}
          </div>

          <span class="text-[11px] text-text-primary truncate ml-3">
            {{ displayUsers.length === 1 
               ? (displayUsers[0]?.name || displayUsers[0]?.title || displayUsers[0]?.u_full_name || 'Assigned')
               : (displayUsers.length === 2 
                   ? `${(displayUsers[0]?.name || displayUsers[0]?.u_full_name || 'User').split(' ')[0]} & ${(displayUsers[1]?.name || displayUsers[1]?.u_full_name || 'User').split(' ')[0]}`
                   : `${displayUsers.length} assignees`)
            }}
          </span>
        </div>
      </template>

      <!-- Empty State with Hover -->
      <template v-else>
        <span
          class="truncate text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs"
        >
          <i class="fa-solid fa-plus text-[10px]"></i> Add
          {{ emptyText || "Assignee" }}
        </span>
      </template>
    </div>

    <!-- Edit Mode -->
    <div v-else class="relative w-full">
      <input
        ref="inputRef"
        v-model="query"
        @blur="handleBlur"
        @keydown.enter="handleEnter"
        @keydown.esc="cancelEditing"
        @input="isOpen = true"
        class="absolute left-0 top-1/2 h-8 -translate-y-1/2 min-w-[200px] w-full p-1 border border-accent/60 rounded-sm focus:outline-none focus:ring-1 focus:ring-accent bg-bg-body z-50 text-[12px]"
        placeholder="Search people by name"
      />

      <!-- Dropdown -->
      <Teleport to="body">
        <div
          v-if="isOpen"
          ref="dropdownRef"
          class="fixed z-[9999] bg-bg-dropdown border border-border rounded-md shadow-lg"
          :style="dropdownStyles"
          @mousedown.prevent
        >
          <ul class="max-h-60 overflow-y-auto py-1">
            <!-- USERS FOUND -->
            <template v-if="filteredUsers.length > 0">
              <li
                v-for="u in filteredUsers"
                :key="u._id ?? 'unassign'"
                @mousedown.prevent="onRowClick(u)"
                class="px-3 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover text-[12px] text-text-primary flex items-center justify-between group"
              >
               <div class="flex items-center gap-3 min-w-0">
                <!-- Avatar -->
                <img
                  v-if="u?.user?.avatar"
                  :src="u.user.avatar"
                  class="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  alt=""
                />

                <!-- Initials -->
                <div
                  v-else-if="u.name && u._id"
                  class="w-6 h-6 border border-border rounded-full text-xs font-semibold flex items-center justify-center flex-shrink-0"
                  :style="{
                    backgroundColor: u?.email
                      ? avatarColor({
                          name: u.name,
                          email: u.email,
                          _id: u._id,
                        })
                      : '',
                  }"
                >
                  {{ getInitials(u.name) }}
                </div>

                <!-- Fallback icon -->
                <div
                  v-else
                  class="w-6 h-6 bg-bg-body border border-border rounded-full flex justify-center items-center flex-shrink-0"
                >
                  <i class="fa-regular fa-user text-xs"></i>
                </div>

                <!-- Text -->
                <div class="min-w-0">
                  <div class="text-xs font-medium truncate">
                    {{ u.name || u.title }}
                  </div>
                  <div class="text-[10px] text-text-secondary truncate">
                    {{ u.role_title }}
                  </div>
                </div>
               </div>

                <!-- Action Text -->
                <div class="text-xs font-medium text-text-secondary whitespace-nowrap ml-2">
                    <!-- Selected user: Hover to Unassign -->
                    <span v-if="u._id && displayUsers.some(du => (du._id === u._id) || (du.user?._id === u._id))" class="text-[10px] px-2 py-1 border rounded-full border-red-500 transition group-hover:bg-red-500 group-hover:text-white">
                        Unassign
                    </span>
                    <!-- Explicit unassign row -->
                    <span v-else-if="u._id == null" class="text-red-500">
                        <!-- Unassign Label if needed, or matched by u.name -->
                    </span>
                    <!-- Other users: Assign -->
                    <span v-else class="text-[10px] px-2 py-1 border rounded-full border-accent group-hover:bg-accent transition group-hover:text-white">
                        Assign to
                    </span>
                </div>
              </li>
            </template>

            <!-- NO MATCH FOUND -->
            <template v-else>
              <div
                class="px-4 py-3 text-center text-sm text-text-secondary"
              >
                No match found
              </div>
            </template>
          </ul>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  computed,
  nextTick,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
import { useWorkspacesRoles } from "../../../queries/useWorkspace";
import { useRouteIds } from "../../../composables/useQueryParams";
import { avatarColor } from "../../../utilities/avatarColor";
import { getInitials } from "../../../utilities";
import { usePermissions } from "../../../composables/usePermissions";

const props = defineProps<{
  assigneeId?: any;
  disabled?: boolean;
  seat: any;
  workspaceId?: any;
  name?: any;
  emptyText?: string;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string[] | null): void;
  (e: "assign", users: any[]): void;
  (e: "unassign"): void;
}>();

const { canAssignCard } = usePermissions();
const { workspaceId } = useRouteIds();
const { data: roles } = useWorkspacesRoles(
  computed(() => props?.workspaceId ?? workspaceId.value)
);

const assignedUsers = ref<any[]>([]);

function normalizeAssignees(assigneeId: any, seat: any) {
  if (Array.isArray(assigneeId)) return assigneeId;
  if (Array.isArray(seat)) return seat;
  if (assigneeId || seat) return [assigneeId || seat];
  return [];
}

assignedUsers.value = normalizeAssignees(props.assigneeId, props.seat);

watch(() => [props.assigneeId, props.seat], () => {
  assignedUsers.value = normalizeAssignees(props.assigneeId, props.seat);
}, { deep: true })

const isEditing = ref(false);
const isOpen = ref(false);
const query = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownStyles = ref({ top: "0px", left: "0px", width: "100%" });

const displayUsers = computed(() => {
  const current = (assignedUsers.value || []).filter(Boolean);
  
  // Deduplicate by ID to avoid showing the same user twice
  const uniqueItems = new Map();
  
  current.forEach(item => {
    const id = item?._id || item?.id || (typeof item === 'string' ? item : null);
    if (!id) return;
    
    // Always prefer the object if we have both, or the first one we see
    if (!uniqueItems.has(id) || (typeof item === 'object' && typeof uniqueItems.get(id) === 'string')) {
      uniqueItems.set(id, item);
    }
  });

  return Array.from(uniqueItems.values()).map(item => {
    const currentId = item?._id || item?.id || item
    if (!currentId) return item

    const found = (roles.value || []).find((u: any) => {
      const uId = u._id || u.id
      const uUserId = u.user?._id || u.user?.id
      return (uId == currentId) || (uUserId == currentId)
    })
    return found || item
  })
})

const membersData = computed(() => {
  return roles.value || []
});

const filteredUsers = computed(() => {
  const q = query.value.trim().toLowerCase();
  const arr = membersData.value;
  
  let filtered = arr;
  if (q) {
    filtered = arr.filter(
      (u: any) =>
        (u.title || u.name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }

  // Sort: Assigned users first
  const assigned = filtered.filter((u: any) => 
    displayUsers.value.some(du => (du._id === u._id) || (du.user?._id === u._id))
  )
  const unassigned = filtered.filter((u: any) => 
    !displayUsers.value.some(du => (du._id === u._id) || (du.user?._id === u._id))
  )

  return [...assigned, ...unassigned];
});

const positionDropdown = () => {
  if (!inputRef.value || !dropdownRef.value) return;

  const rect = inputRef.value.getBoundingClientRect();
  const dropdownHeight = dropdownRef.value.offsetHeight || 200;
  const viewportHeight = window.innerHeight;
  const spaceBelow = viewportHeight - rect.bottom;

  // Default to opening down, flip up if space is tight
  const dropdownOffset = 6;
  let top = rect.bottom + window.scrollY + dropdownOffset;
  if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
    top = rect.top + window.scrollY - dropdownHeight - 5;
  }

  dropdownStyles.value = {
    top: `${top}px`,
    left: `${rect.left + window.scrollX}px`,
    width: `${rect.width}px`,
  };
};

const startEditing = async () => {
  if (props.disabled || !canAssignCard.value) return;
  isEditing.value = true;
  isOpen.value = true;
  
  // Pre-fill query with current name to avoid "removed" effect
  const currentName = displayUsers.value.length === 1
    ? (displayUsers.value[0]?.name || displayUsers.value[0]?.title || displayUsers.value[0]?.u_full_name)
    : (displayUsers.value.length > 1 ? `${displayUsers.value.length} assignees` : "");
  query.value = currentName || "";

  await nextTick();
  inputRef.value?.focus();
  inputRef.value?.select(); 
  positionDropdown();

  window.addEventListener("scroll", positionDropdown, true);
  window.addEventListener("resize", positionDropdown);
};

const cancelEditing = () => {
  isEditing.value = false;
  isOpen.value = false;
  query.value = "";
  window.removeEventListener("scroll", positionDropdown, true);
  window.removeEventListener("resize", positionDropdown);
};

function assign(user: any) {
  if (!user) return

  const isSelected = displayUsers.value.some(du => (du._id === user._id) || (du.user?._id === user._id))
  
  if (isSelected) {
    onUnassign(user)
  } else {
    assignedUsers.value = [...assignedUsers.value, user]
    emit("assign", assignedUsers.value);
    emit("update:modelValue", assignedUsers.value.map(u => u._id || u.id));
  }
};

function onUnassign(user: any) {
  assignedUsers.value = assignedUsers.value.filter(du => !((du._id === user._id) || (du.user?._id === user._id)))
  emit('unassign')
  emit('assign', assignedUsers.value)
  emit('update:modelValue', assignedUsers.value.map(u => u._id || u.id))
}

function onUnassignAll() {
  assignedUsers.value = []
  emit('unassign')
  emit('assign', [])
  emit('update:modelValue', [])
  cancelEditing()
}

function onRowClick(u: any) {
  // Explicit unassign row
  if (u._id == null) {
    onUnassignAll()
    return
  }

  // Assign/Toggle user
  assign(u)
}

const handleEnter = () => {
  // If one match or first match logic
  if (filteredUsers.value.length > 0) {
    onRowClick(filteredUsers.value[0]);
  } else {
    cancelEditing();
  }
};

const handleBlur = () => {
  // Timeout to allow mousedown on option to fire
  setTimeout(() => {
    if (isEditing.value) {
      cancelEditing();
    }
  }, 150);
};

// Close on click outside logic is handled by blur mostly, but just in case
const handleClickOutside = (event: MouseEvent) => {
  if (
    containerRef.value &&
    !containerRef.value.contains(event.target as Node) &&
    dropdownRef.value &&
    !dropdownRef.value.contains(event.target as Node)
  ) {
    if (isEditing.value) {
      cancelEditing();
    }
  }
};

onMounted(() => {
  document.addEventListener("mousedown", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleClickOutside);
  window.removeEventListener("scroll", positionDropdown, true);
  window.removeEventListener("resize", positionDropdown);
});
</script>
