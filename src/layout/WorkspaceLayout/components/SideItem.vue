<template>
  <div
    @mouseenter="showTooltip = true"
    @mouseleave="showTooltip = false"
    @click="clickHandler"
    class="group cursor-pointer flex items-center px-2 rounded-lg text-xs transition-all duration-300 ease-in-out relative hover:bg-bg-card hover:text-text-primary select-none"
    :class="[
      progress == 'processing' && status == 'running'
        ? 'disbled !cursor-not-allowed opacity-50'
        : workspaceStore.background.startsWith('url') && !isActive
        ? 'text-text-primary bg-bg-card'
        : workspaceStore.background.startsWith('url') && isActive
        ? 'text-text-primary bg-accent'
        : isActive
        ? 'text-text-primary bg-bg-card '
        : ' text-text-secondary',
      expanded
        ? 'w-[36px] h-[36px] sm:w-full sm:h-[38px] gap-2.5'
        : ' w-[36px] h-[36px] gap-1.5 ',
    ]"
    ref="itemRef"
  >
    <!-- Icon -->
    <i
      v-if="progress == 'processing' && status == 'running'"
      class="fa-regular opacity-50 text-left fa-arrows-spin animate-spin duration-250"
    ></i>

    <i
      v-else
      :class="[...iconClasses, expanded ? 'text-[14px]' : 'text-[14px]']"
    ></i>

    <!-- Label -->
    <Transition name="sidebar-label">
  <div
    v-if="expanded"
    class="flex items-center justify-between w-full gap-2"
  >
   <span
  v-if="label"
  class="whitespace-nowrap font-medium line-clamp-1 w-full overflow-ellipsis text-center min-h-3"
  :class="expanded ? 'text-start text-[14px]' : 'text-[10px]'"
>
  {{ label.length > 20 ? label.slice(0, 20) + '...' : label }}
</span>


    <!-- Delete Icon (only if exists + hover) -->
    <div
  v-if="deleteIcon && label !== 'Tasks' && label !== 'Pin'"
  class="relative"
>
  <i
    :class="[
      ...deleteIconClasses,
      'opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[13px] cursor-pointer'
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
      :class="!canDelete? 'cursor-not-allowed':'cursor-pointer'"
      @click.stop="emitDelete"
    >
        <i class="fa-solid fa-trash text-red-500 text-[11px] me-1"></i> Delete Module
    </button>
  </li>
  <li>
    <button
      :disabled="!canUpdate"
      class="w-full text-left px-3 py-2 hover:bg-[var(--hover)] text-sm flex items-center"
      :class="!canUpdate? 'cursor-not-allowed':'cursor-pointer'"
      @click.stop="emitEdit"
    >
     <i class="fa-regular fa-edit text-[12px] me-1"></i> Edit Module
    </button>
  </li>
   <li>
    <button
      class="w-full text-left px-3 py-2 hover:bg-[var(--hover)] text-sm cursor-pointer"
      @click.stop="emitConfigure"
    >
     <i class="fa-solid fa-gear text-[11px] me-1"></i> Configure Agent
    </button>
    </li>
    <li>
    <button
      v-if="canShare?.toLocaleLowerCase() === 'owner'"
      :disabled="canShare?.toLocaleLowerCase() !== 'owner'"
      class="w-full text-left px-3 py-2 hover:bg-[var(--hover)] text-sm"
      :class="canShare?.toLocaleLowerCase() !== 'owner'? 'cursor-not-allowed':'cursor-pointer'"
      @click.stop="emitShare"
    >
     <i class="fa-solid fa-share-nodes text-[11px] me-1"></i> Share Module
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
import { useWorkspaceStore } from "../../../stores/workspace"; 
const emit = defineEmits(['toggleDropdown','delete','closeDropdown','share','edit'])
/** --- PROPS --- **/
const props = defineProps<{
  label: string;
  jobId?: string;
  id: string; // this is job_id
  icon: any;
  to: string;
  status?: string;
  expanded?: boolean;
  deleteIcon?:any;
  activeDropdownId?: string | null;
  canDelete?: boolean;
  canShare?: string;
  canUpdate?: boolean;
}>();
const showTooltip = ref(false);
const itemRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null)
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
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(e.target as Node)
  ) {
    emit('closeDropdown')
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

/** --- STATE --- **/
const progress = ref<any>(""); // store only progress as required
const eventSource = ref<EventSource | null>(null);
let stopped = false;
/** --- SSE URL --- **/
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const toggleDropdown = () => {
  emit('toggleDropdown', props.id)
}
const emitDelete = () => { 
  if(!props.canDelete) return
  emit('closeDropdown')
  emit('delete', props.id)
}

const emitConfigure = () => {
  emit('closeDropdown')
  workspaceStore.toggleChatBotPanel()
  workspaceStore.saveAgentModule(props.label)
}
const emitShare = () => {
  emit('closeDropdown')
  emit('share', props.id)
}
const emitEdit = () => {
  if (!props.canDelete) return
  emit('closeDropdown')
  emit('edit', props.id)
}
const connectStream = () => {
  if (stopped) return;
  if (!props.id) return; // no job id → no stream
  if (props.status != "running") return; // already done → skip
  if (eventSource.value) return; // prevent multiple streams

  const token = localStorage.getItem("token") || "";
  const url = `${SERVER_BASE_URL}workspace/modules/generation/${props?.jobId}/stream?token=${token}`;

  const es = new EventSource(url);
  eventSource.value = es;

  es.onopen = () => {
    if (stopped) return;
    console.log("STREAM CONNECTED:", url);
  };

  es.onmessage = (event) => {
    if (stopped) return;
    try {
      const data = JSON.parse(event.data);
      if (data.status) {
        progress.value = data.status;

        // Auto-close at 100%
        if (progress.value == "completed") {
          disconnectStream();
        }
      }
    } catch (_) {}
  };
  eventSource.value.addEventListener("progress", (event: MessageEvent) => {
    console.log(">> trki g");

    try {
      const data = JSON.parse(event.data);
      if (data.status) {
        progress.value = data.status;

        // Auto-close at 100%
        if (progress.value == "completed") {
          disconnectStream();
        }
      }
    } catch {}
  });
  es.onerror = () => {
    // DO NOT RECONNECT
    disconnectStream();
  };
};

/** Close stream completely */
const disconnectStream = () => {
  if (eventSource.value) {
    eventSource.value.close();
    eventSource.value = null;
  }
};

/** Lifecycle */
onMounted(() => {
  stopped = false;
  connectStream(); // connect once
});

/** Close on unmount */
onUnmounted(() => {
  stopped = true;
  disconnectStream();
});

/**
 * If props.id changes → restart stream
 */
watch(
  () => props.id,
  () => {
    disconnectStream();
    progress.value = 0;
    connectStream();
  }
);

/** other existing logic */
const route = useRoute();
const workspaceStore = useWorkspaceStore();
const isActive = computed(() => route.fullPath === props.to);
const router = useRouter();
function clickHandler() {
  if (progress.value == "processing" && props.status == "running") return;
  router.push(props.to);
  workspaceStore.saveAgentModule(props.label)
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
