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
        v-if="assignedUser?.user?.avatar || assignedUser?._id || seat?._id"
      >
        <div class="flex gap-2 items-center truncate">
          <img
            v-if="
              assignedUser?.avatar?.src ||
              assignedUser?.user?.avatar ||
              assignedUser?.u_profile_image
            "
            :src="
              assignedUser?.avatar?.src ??
              assignedUser?.u_profile_image ??
              assignedUser?.user?.avatar
            "
            class="w-5 h-5 object-cover rounded-full flex-shrink-0"
            alt=""
          />

          <div
            v-else-if="assignedUser?.u_full_name || assignedUser?.name"
            class="w-5 h-5 aspect-square rounded-full text-[11px] bg-bg-surface  text-text-primary flex items-center justify-center flex-shrink-0"
            :style="{
              backgroundColor:
                assignedUser?.u_full_name ?? assignedUser?.title
                  ? avatarColor({
                      name: assignedUser?.u_full_name ?? assignedUser?.title,
                      _id: assignedUser?._id,
                    })
                  : '',
            }"
          >
            {{ getInitials(assignedUser?.u_full_name ?? assignedUser?.name) }}
          </div>

          <div
            v-else
            class="w-6 h-6 bg-bg-body border border-border rounded-full flex justify-center items-center flex-shrink-0"
          >
            <i class="fa-regular fa-user text-xs"></i>
          </div>

          <span class="text-[11px] text-text-primary truncate">{{
            (assignedUser?.name ||
              assignedUser?.title ||
              assignedUser?.u_full_name) ??
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
        placeholder="Search people..."
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
          <div class="max-h-60 overflow-y-auto">
            <!-- USERS FOUND -->
            <template v-if="filteredUsers.length > 0">
              <div
                v-for="u in filteredUsers"
                :key="u._id"
                @mousedown.prevent="assign(u._id)"
                class="px-3 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover text-[12px] text-text-primary flex items-center gap-3"
              >
                <!-- Avatar -->
                <img
                  v-if="u?.user?.avatar"
                  :src="u.user.avatar"
                  class="w-6 h-6 rounded-full object-cover flex-shrink-0"
                  alt=""
                />

                <!-- Initials -->
                <div
                  v-else-if="u.name"
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
            </template>

            <!-- NO MATCH FOUND -->
            <template v-else>
              <div
                class="px-4 py-3 text-center text-sm text-text-secondary"
              >
                No match found
              </div>
            </template>
          </div>
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
  props?.workspaceId ?? workspaceId.value
);

const assignedUser = ref<any>(props.assigneeId ?? props.seat);
const isEditing = ref(false);
const isOpen = ref(false);
const query = ref("");
const inputRef = ref<HTMLInputElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const dropdownStyles = ref({ top: "0px", left: "0px", width: "100%" });

const membersData = computed(() => {
  return [{ _id: null, name: "Unassign", email: "" }, ...(roles.value || [])];
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
    assignedUser.value?.name ||
    assignedUser.value?.title ||
    assignedUser.value?.u_full_name;
  query.value = currentName || "";

  await nextTick();
  inputRef.value?.focus();
  inputRef.value?.select(); // Select all text so user can easily overwrite if they want
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

const assign = (userId: string) => {
  const user = membersData.value.find((u: any) => u._id === userId);

  if (user) {
    assignedUser.value = user;
    emit("assign", user);
    emit("update:modelValue", userId);
  } else if (userId == null) {
    assignedUser.value = null;
    emit("unassign");
    emit("update:modelValue", null);
  }
  cancelEditing();
};

const handleEnter = () => {
  // If one match or first match? logic similar to search cell
  if (filteredUsers.value.length > 0) {
    assign(filteredUsers.value[0]._id);
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

// Update local state if props change
watch(
  () => props.seat,
  (val) => {
    assignedUser.value = val;
  }
);
</script>
