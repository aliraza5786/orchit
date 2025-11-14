<template>
  <div @click="clickHandler"
    class="group cursor-pointer flex flex-col w-[48px] h-[48px] items-center justify-center gap-1.5 px-2 py-3.5 rounded-lg text-xs text-text-secondary transition-all relative hover:bg-bg-card hover:text-text-primary select-none"
    :class="[
      progress == 'processing' && status == 'running' ?
        'disbled !cursor-not-allowed opacity-50' :
        isActive
          ? 'text-text-primary bg-bg-card '
          : workspaceStore.background.startsWith('url')
            ? 'text-text-primary bg-bg-card'
            : ' text-text-secondary',
    ]">
    <!-- Drag Icon -->
    <img src="../../../assets/icons/Layer.svg"
      class="absolute top-1 left-1 opacity-0 group-hover:opacity-100 w-2 drag-handle cursor-grab" alt="" />
    <i v-if="progress == 'processing' && status == 'running'"
      class="fa-regular opacity-50 text-left fa-arrows-spin animate-spin duration-250"></i>
    <!-- Icon -->
    <i v-else :class="`${icon?.prefix} ${icon?.iconName}`"></i>
    <!-- <FontAwesomeIcon  :icon="[icon.prefix, icon.iconName]"/> -->
    <!-- <FontAwesomeIcon :icon="faGrid2" />      Label -->
    <span class="whitespace-nowrap text-[10px] font-medium line-clamp-1 w-full overflow-ellipsis text-center min-h-3">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "../../../stores/workspace";

/** --- PROPS --- **/
const props = defineProps<{
  label: string;
  jobId?: string;
  id: string;     // this is job_id
  icon: any;
  to: string;
  status?: string
}>();

/** --- STATE --- **/
const progress = ref<any>('');   // store only progress as required
const eventSource = ref<EventSource | null>(null)
let stopped = false;

/** --- SSE URL --- **/
const SERVER_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL || "https://backend.streamed.space/api/v1/";

/**
 * Open SSE stream for job progress
 * Endpoint: workspace/modules/generation/:job_id/stream
 */
const connectStream = () => {
  if (stopped) return;
  if (!props.id) return;           // no job id → no stream
  if (props.status != 'running') return;  // already done → skip
  if (eventSource.value) return;           // prevent multiple streams

  const token = localStorage.getItem('token') || ''
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
        if (progress.value == 'completed') {
          disconnectStream();
        }
      }
    } catch (_) { }
  };
  eventSource.value.addEventListener('progress', (event: MessageEvent) => {
    console.log('>> trki g');

    try {
      const data = JSON.parse(event.data);
      if (data.status) {
        progress.value = data.status;

        // Auto-close at 100%
        if (progress.value == 'completed') {
          disconnectStream();
        }
      }
    } catch { }
  })
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
  connectStream();      // connect once
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
const router = useRouter()
function clickHandler() {
  if (progress.value == 'processing' && props.status == 'running') return
  router.push(props.to)
}

</script>

<style scoped>
.icons-div>* {
  width: 14px !important;
  height: 14px !important;
}
</style>
