<template>
  <div
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
    @click="clickHandler"
    class="group cursor-pointer flex items-center px-2 rounded-lg text-xs transition-all duration-300 ease-in-out relative hover:bg-bg-card hover:text-text-primary select-none"
    :class="[
      showLoadingSpinner
        ? 'disbled !cursor-not-allowed opacity-50'
        : workspaceStore.background.startsWith('url') && !isActive
          ? 'text-text-primary bg-bg-card'
          : workspaceStore.background.startsWith('url') && isActive
            ? 'text-text-primary bg-primary-color'
            : isActive
              ? 'text-text-primary bg-bg-card '
              : ' text-text-secondary',
      expanded
        ? 'w-[32px] h-[32px] sm:w-full sm:h-[32px] gap-2.5'
        : isActive
          ? 'w-auto h-[32px] px-2 gap-1.5 sm:w-[32px] sm:px-2'
          : ' w-[32px] h-[32px] gap-1.5 ',
    ]"
    ref="itemRef"
  >
    <!-- Active Indicator (Left Border) -->
    <div
      v-if="isActive"
      class="absolute left-0 top-1/2 -translate-y-1/2 h-[60%] w-[2px] rounded-r-md"
      :style="{
        backgroundColor: 'var(--primary-color)',
      }"
    ></div>

    <!-- Icon -->
    <i
      v-if="showLoadingSpinner"
      class="fa-regular opacity-50 text-left fa-arrows-spin animate-spin duration-250"
    ></i>

    <i
      v-else
      :class="[
        ...iconClasses,
        expanded ? 'text-[16px]' : 'text-[16px]',
        isActive ? '' : 'text-text-secondary',
      ]"
      :style="
        isActive
          ? {
              color: 'var(--primary-color)',
            }
          : {}
      "
    ></i>

    <!-- Mobile active label (shows beside icon when not expanded, only on mobile) -->
    <span
      v-if="!expanded && isActive && label"
      class="sm:hidden block text-[11px] font-semibold leading-tight whitespace-nowrap truncate max-w-[80px]"
      :style="{ color: 'var(--primary-color)' }"
    >
      {{ label.length > 10 ? label.slice(0, 10) + '…' : label }}
    </span>

    <!-- Label (desktop expanded / mobile active) -->
    <Transition name="sidebar-label">
      <div
        v-if="expanded"
        class="flex items-center justify-between w-full gap-2"
      >
        <span
          v-if="label"
          class="whitespace-nowrap font-normal line-clamp-1 w-full overflow-ellipsis text-center min-h-3"
          :class="expanded ? 'text-start text-[13px]' : 'text-[10px]'"
        >
          {{ label.length > 20 ? label.slice(0, 20) + "..." : label }}
        </span>

        <!-- Delete Icon (only if exists + hover) -->
        <div
          v-if="deleteIcon && label !== 'Tasks' && label !== 'Pin'"
          class="relative"
        >
          <i
            :class="[
              ...deleteIconClasses,
              'opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[13px] cursor-pointer',
            ]"
            @click.stop="toggleDropdown"
          ></i>

          <!-- Dropdown -->
          <div
            v-if="activeDropdownId === props.id"
            ref="dropdownRef"
            class="absolute right-[-8px] top-7 w-44 rounded-md shadow-lg bg-bg-card z-50"
          >
            <ul>
              <li>
                <button
                  :disabled="!canDelete"
                  class="w-full text-left px-3 py-2 hover:bg-[var(--hover)] text-sm flex items-center"
                  :class="!canDelete ? 'cursor-not-allowed' : 'cursor-pointer'"
                  @click.stop="emitDelete"
                >
                  <i
                    class="fa-solid fa-trash text-red-500 text-[11px] me-1"
                  ></i>
                  Delete Module
                </button>
              </li>
              <li>
                <button
                  :disabled="!canUpdate"
                  class="w-full text-left px-3 py-2 hover:bg-[var(--hover)] text-sm flex items-center"
                  :class="!canUpdate ? 'cursor-not-allowed' : 'cursor-pointer'"
                  @click.stop="emitEdit"
                >
                  <i class="fa-regular fa-edit text-[12px] me-1"></i> Edit
                  Module
                </button>
              </li>
              <li>
                <button
                  class="w-full text-left px-3 py-2 hover:bg-[var(--hover)] text-sm cursor-pointer"
                  @click.stop="emitConfigure"
                >
                  <i class="fa-solid fa-gear text-[11px] me-1"></i> Configure
                  Agent
                </button>
              </li>
              <li>
                <button
                  v-if="canShare?.toLocaleLowerCase() === 'owner'"
                  :disabled="canShare?.toLocaleLowerCase() !== 'owner'"
                  class="w-full text-left px-3 py-2 hover:bg-[var(--hover)] text-sm"
                  :class="
                    canShare?.toLocaleLowerCase() !== 'owner'
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer'
                  "
                  @click.stop="emitShare"
                >
                  <i class="fa-solid fa-share-nodes text-[11px] me-1"></i> Share
                  Module
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </div>

  <!-- Tooltip rendered in body via Teleport -->
  <Teleport to="body" v-if="!expanded && showTooltip">
    <div
      class="hidden sm:block bg-bg-card text-text-primary text-xs font-medium px-3 py-2 border border-border-input rounded-md shadow-md whitespace-nowrap z-[9999] pointer-events-none fixed transition-all"
      :style="tooltipStyles"
    >
      {{ label }}
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQueryClient } from "@tanstack/vue-query";
import { useWorkspaceStore } from "../../../stores/workspace";
import { useSpaceCreationStream } from "../../../composables/useSpaceCreationStream";
import { useModuleGenerationStream } from "../../../composables/useModuleGenerationStream";
import { useRouteIds } from "../../../composables/useQueryParams";
const emit = defineEmits([
  "toggleDropdown",
  "delete",
  "closeDropdown",
  "share",
  "edit",
]);
/** --- PROPS --- **/
const props = defineProps<{
  label: string;
  jobId?: string;
  id: string; // this is job_id
  icon: any;
  to: string;
  status?: string;
  laneLabel?: string;
  expanded?: boolean;
  deleteIcon?: any;
  activeDropdownId?: string | null;
  canDelete?: boolean;
  canShare?: string;
  canUpdate?: boolean;
}>();

const showTooltip = ref(false);
const itemRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const tooltipStyles = computed(() => {
  if (!itemRef.value) return {};

  const rect = itemRef.value.getBoundingClientRect();
  return {
    top: `${rect.top + rect.height / 2}px`,
    left: `${rect.right + 8}px`,
    transform: "translateY(-50%)",
  };
});

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    emit("closeDropdown");
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

/** --- STATE --- **/
const { isLaneGenerating, isGenerating } = useSpaceCreationStream();
const {
  moduleProgress,
  startModuleGenerationStream,
} = useModuleGenerationStream();
const queryClient = useQueryClient();
const { workspaceId } = useRouteIds();

const TERMINAL_STATUSES = ["completed", "failed", "canceled"];

const isModuleJobGenerating = computed(() => {
  if (!props.jobId) return false;
  const progress = moduleProgress.value[props.id];
  if (progress?.status) {
    return !TERMINAL_STATUSES.includes(progress.status);
  }
  return props.status === "running";
});

const showLoadingSpinner = computed(() => {
  // For lane-aware tabs (Plan + dynamic modules like Tasks), keep spinner visible
  // while the AI space creation stream is active.
  if (props.laneLabel && isGenerating.value) return true;
  if (props.laneLabel && isLaneGenerating(props.laneLabel)) return true;
  if (isModuleJobGenerating.value) return true;
  return false;
});

function ensureModuleStream() {
  if (!props.jobId || props.status !== "running") return;
  startModuleGenerationStream(
    props.id,
    props.jobId,
    workspaceId.value,
    queryClient,
  );
}
const toggleDropdown = () => {
  emit("toggleDropdown", props.id);
};
const emitDelete = () => {
  if (!props.canDelete) return;
  emit("closeDropdown");
  emit("delete", props.id);
};

const emitConfigure = () => {
  emit("closeDropdown");
  workspaceStore.toggleChatBotPanel();
  workspaceStore.saveAgentModule(props.label);
};
const emitShare = () => {
  emit("closeDropdown");
  emit("share", props.id);
};
const emitEdit = () => {
  if (!props.canDelete) return;
  emit("closeDropdown");
  emit("edit", props.id);
};

onMounted(() => {
  ensureModuleStream();
});

watch(
  () => props.jobId,
  (nextJobId, prevJobId) => {
    if (nextJobId === prevJobId) return;
    ensureModuleStream();
  },
);

/** other existing logic */
const route = useRoute();
const workspaceStore = useWorkspaceStore();
const isActive = computed(() => {
  const currentPath = route.path.replace(/\/$/, "");
  const targetPath = props.to.split("?")[0].replace(/\/$/, "");
  return currentPath === targetPath;
});
const router = useRouter();
function clickHandler() {
  if (showLoadingSpinner.value) return;
  router.push(props.to);
  workspaceStore.saveAgentModule(props.label);
}

// sidebar item icon normalizer
const iconClasses = computed(() => {
  const placeholder = { prefix: "fas", iconName: "fa-layer-group" };

  // Choose icon:
  // 1. props.icon (direct)
  // 2. props.icon.variables['module-icon'] if exists
  // 3. placeholder
  let icon = placeholder;

  if (props.icon?.iconName) {
    icon = props.icon;
  } else if (props.icon?.variables?.["module-icon"]?.iconName) {
    icon = props.icon.variables["module-icon"];
  }

  const prefix = icon.prefix || "fas";
  const name = icon.iconName;

  const normalizedName = name.startsWith("fa-") ? name : `fa-${name}`;

  return [prefix, normalizedName];
});
const deleteIconClasses = computed(() => {
  if (!props.deleteIcon) return [];

  const placeholder = { prefix: "fas", iconName: "fa-trash" };

  let icon = placeholder;

  if (props.deleteIcon?.iconName) {
    icon = props.deleteIcon;
  } else if (props.deleteIcon?.variables?.["module-icon"]?.iconName) {
    icon = props.deleteIcon.variables["module-icon"];
  }

  const prefix = icon.prefix || "fas";
  const name = icon.iconName.startsWith("fa-")
    ? icon.iconName
    : `fa-${icon.iconName}`;

  return [prefix, name];
});
</script>

<style scoped>
.icons-div > * {
  width: 14px !important;
  height: 14px !important;
}

.sidebar-label-enter-active,
.sidebar-label-leave-active {
  transition: all 0.3s ease;
}

.sidebar-label-enter-from,
.sidebar-label-leave-to {
  opacity: 0;
  transform: translateX(-10px);
  max-width: 0;
}
</style>
