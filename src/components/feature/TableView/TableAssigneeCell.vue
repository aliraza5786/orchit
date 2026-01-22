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
        v-if="displayUser?.user?.avatar || displayUser?._id || seat?._id"
      >
        <div class="flex gap-2 items-center truncate">
          <img
            v-if="
              displayUser?.avatar?.src ||
              displayUser?.user?.avatar ||
              displayUser?.u_profile_image
            "
            :src="
              displayUser?.avatar?.src ??
              displayUser?.u_profile_image ??
              displayUser?.user?.avatar
            "
            class="w-5 h-5 object-cover rounded-full flex-shrink-0"
            alt=""
          />

          <div
            v-else-if="displayUser?.u_full_name || displayUser?.name"
            class="w-5 h-5 aspect-square rounded-full text-[11px] bg-bg-surface  text-text-primary flex items-center justify-center flex-shrink-0"
            :style="{
              backgroundColor:
                displayUser?.u_full_name ?? displayUser?.title
                  ? avatarColor({
                      name: displayUser?.u_full_name ?? displayUser?.title,
                      _id: displayUser?._id,
                    })
                  : '',
            }"
          >
            {{ getInitials(displayUser?.u_full_name ?? displayUser?.name) }}
          </div>

          <div
            v-else
            class="w-6 h-6 bg-bg-body border border-border rounded-full flex justify-center items-center flex-shrink-0"
          >
            <i class="fa-regular fa-user text-xs"></i>
          </div>

          <span class="text-[11px] text-text-primary truncate">{{
            (displayUser?.name ||
              displayUser?.title ||
              displayUser?.u_full_name) ??
            "Unassigned"
          }}</span>
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
                    <span v-if="u._id && displayUser?._id === u._id" class="text-[10px] px-2 py-1 border rounded-full border-red-500 transition group-hover:bg-red-500 group-hover:text-white">
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
  (e: "update:modelValue", value: string | null): void;
  (e: "assign", user: any): void;
  (e: "unassign"): void;
}>();

const { canAssignCard } = usePermissions();
const { workspaceId } = useRouteIds();
const { data: roles } = useWorkspacesRoles(
  computed(() => props?.workspaceId ?? workspaceId.value)
);

const assignedUser = ref<any>(props.assigneeId ?? props.seat);
watch(() => [props.assigneeId, props.seat], () => {
  assignedUser.value = props.assigneeId ?? props.seat
}, { deep: true })

const isEditing = ref(false);
const isOpen = ref(false);
const query = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownStyles = ref({ top: "0px", left: "0px", width: "100%" });

const displayUser = computed(() => {
  const current = assignedUser.value
  if (!current) return null
  
  const currentId = current._id || current.id || current

  // Robust search: Check membership ID, direct ID, and nested user ID
  const found = (roles.value || []).find((u: any) => {
    const uId = u._id || u.id
    const uUserId = u.user?._id || u.user?.id
    return (uId == currentId) || (uUserId == currentId)
  })
  
  return found || current
})

const membersData = computed(() => {
  const current = displayUser.value 
  const list = roles.value || []

  if (current && (current._id || current.id)) {
    const currentId = current._id || current.id
    const currentUserInList = current
    
    const others = list.filter((u: any) => {
       const uId = u._id || u.id
       const uUserId = u.user?._id || u.user?.id
       const cUserId = current.user?._id || current.user?.id
       
       return !(
         (uId == currentId) || 
         (uUserId && uUserId == (cUserId || currentId))
       )
    })
    
    return [
      currentUserInList,
      // { _id: null, name: 'Unassign', email: '' },
      ...others
    ]
  }

  return [
    // { _id: null, name: 'Unassign', email: '' },
    ...list
  ]
});

const filteredUsers = computed(() => {
  const q = query.value.trim().toLowerCase();
  const arr = membersData.value;
  if (!q) return arr;
  return arr.filter(
    (u: any) =>
      (u.title || u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
  );
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
  const currentName =
    displayUser.value?.name ||
    displayUser.value?.title ||
    displayUser.value?.u_full_name;
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

function assign(userId: any) {
  const user = membersData.value.find((u: any) => u._id == userId);

  if (user) {
    assignedUser.value = user;
    emit("assign", user);
    emit("update:modelValue", userId);
  }
  cancelEditing();
};

function onUnassign() {
  assignedUser.value = null
  emit('unassign')
  emit('assign', { _id: null })
  emit('update:modelValue', null)
  cancelEditing()
}

function onRowClick(u: any) {
  // Explicit unassign row
  if (u._id == null) {
    onUnassign()
    return
  }

  // Clicking assigned user → unassign
  if (displayUser.value && u._id === displayUser.value._id) {
    onUnassign()
    return
  }

  // Assign new user
  assign(u._id)
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
