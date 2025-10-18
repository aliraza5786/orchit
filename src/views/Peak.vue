<template>
  <div class="space-y-2 flex flex-col h-full overflow-x-auto w-full flex-auto">
    <!-- Header / Overview -->
    <div class="p-5 rounded-lg bg-bg-card space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex flex-col w-full">
          <h3 class="text-2xl text-text-primary font-semibold">Project Overview</h3>
          <p class="text-sm text-text-secondary mt-2">Last update on Sep 12, 2024 - 09.45 AM</p>

          <!-- Cards Row -->
          <div class="flex gap-2.5 overflow-x-auto w-full py-8">
            <!-- Loading skeletons -->
            <template v-if="isLoading">
              <SkeletonCard v-for="n in 3" :key="n" />
            </template>

            <!-- Cards with transitions -->
            <TransitionGroup name="list" tag="div" class="flex gap-2.5" v-else>
              <button
                v-for="lane in lanes"
                :key="lane.lane_title"
                class="group focus:outline-none border-border border focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
                type="button"
                role="button"
                aria-label="Open lane details"
                @click="onLaneClick(lane)"
              >
                <ProjectCard
                  :title="lane.lane_title"
                  subtitle="Mobile Application"
                  :progress="lane?.progress"
                  :status="lane?.status"
                  :avatars="avatars"
                  date="May 28"
                  class="transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-lg group-active:translate-y-0 border border-transparent hover:border-border-subtle rounded-xl cursor-pointer"
                />
              </button>
            </TransitionGroup>
          </div>
        </div>
      </div>

      <!-- Connection status with subtle animation
      <div class="workspace-progress" aria-live="polite">
        <div :class="['connection-status', isConnected ? 'connected' : 'disconnected']">
          <span v-if="isConnected">🟢 Connected to progress stream</span>
          <span v-else>🔴 Not connected</span>
        </div>

        <div v-if="taskProgress" class="progress-info">
          <h3 class="text-text-primary font-medium">Workspace Generation Progress</h3>

          <div class="progress-bar-container">
            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{ width: (taskProgress.percent ?? 0) + '%' }"
                :class="progressFillClass"
              ></div>
            </div>
            <div class="progress-text">{{ taskProgress.percent ?? 0 }}%</div>
          </div>

          <div class="status-info">
            <div class="status-item">
              <strong>Status:</strong>
              <span :class="'status-' + (taskProgress.status || 'queued')">{{ taskProgress.status }}</span>
            </div>

            <div class="status-item">
              <strong>Message:</strong> {{ taskProgress.message || '—' }}
            </div>

            <div v-if="taskProgress.result" class="status-item">
              <strong>Cards Generated:</strong> {{ taskProgress.result.cards || 0 }}
            </div>

            <div v-if="taskProgress.error" class="error-message">
              <strong>Error:</strong> {{ taskProgress.error }}
            </div>

            <div class="status-item">
              <strong>Last Updated:</strong> {{ formatTime(taskProgress.updated_at) }}
            </div>
          </div>

          <div class="actions">
            <button @click="reconnect" :disabled="isConnected" class="btn-default">Reconnect</button>
            <button @click="disconnect" :disabled="!isConnected" class="btn-default">Disconnect</button>
          </div>
        </div>
      </div> -->
    </div>

    <!-- Table Card -->
    <div class="bg-bg-card p-5 rounded-lg flex-grow">
      <template v-if="isLoading">
        <SkeletonTable />
      </template>
      <template v-else>
        <div >
          <StatusTable
            :columns="columns2"
            :rows="lanes"
            clickable
            @rowClick="onLaneRowClick"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, defineComponent, h } from 'vue'
import { useJobId, useWorkspaceId } from '../composables/useQueryParams'
import ProjectCard from '../components/feature/ProjectCard.vue'
import StatusTable from '../components/ui/StatusTable.vue'

/** Types */
interface LaneProgressRow {
  lane_title: string
  progress?: number
  status?: string
  [key: string]: any
}

interface TaskProgress {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled' | string
  percent: number
  message: string
  progress_details?: { lanes_progress?: LaneProgressRow[] }
  result?: { sheet_lists?: number; cards?: number }
  error?: string
  updated_at: string
}

/** Reactive state */
const isConnected = ref(false)
const taskProgress = ref<TaskProgress | null>(null)
const eventSource = ref<EventSource | null>(null)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5
const debugInfo = ref<any>({})

/** Server configuration */
const { workspaceId } = useWorkspaceId()
const { jobId } = useJobId()?.jobId ? useJobId() : { jobId: ref<string | null>(null) }
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'https://backend.streamed.space/api/v1/workspace'

/** Derived */
const lanes = computed<LaneProgressRow[]>(() => taskProgress.value?.progress_details?.lanes_progress ?? [])
const isLoading = computed(() => !taskProgress.value || ['queued', 'running'].includes(taskProgress.value.status))
const progressFillClass = computed(() => {
  const s = taskProgress.value?.status
  if (s === 'running') return 'progress-running'
  if (s === 'completed') return 'progress-complete'
  if (s === 'failed') return 'progress-error'
  return 'progress-default'
})
const avatars = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg'
]

/** SSE Connection Management */
const connect = () => {
  if (eventSource.value && eventSource.value.readyState === EventSource.OPEN) return
  if (reconnectAttempts.value >= maxReconnectAttempts) return
  if (eventSource.value) eventSource.value.close()

  const token = localStorage.getItem('token') || ''
  const effectiveJob = localStorage.getItem('jobId') || jobId?.value || workspaceId.value
  const isManual = localStorage.getItem('jobId') ? 'false' : 'true'
  const sseUrl = `${SERVER_BASE_URL}/step2/tasks/${effectiveJob}/stream?token=${token}&is_manual=${isManual}`

  try {
    eventSource.value = new EventSource(sseUrl, { withCredentials: false })

    eventSource.value.onopen = () => {
      isConnected.value = true
      reconnectAttempts.value = 0
      debugInfo.value = { ...debugInfo.value, connectionStatus: 'Connected', lastConnected: new Date().toISOString(), url: sseUrl }
    }

    eventSource.value.onmessage = (event) => {
      try {
        const data: TaskProgress = JSON.parse(event.data)
        taskProgress.value = data
        debugInfo.value = { ...debugInfo.value, lastMessage: data, lastMessageTime: new Date().toISOString() }
        if (['completed', 'failed', 'canceled'].includes(data.status)) setTimeout(disconnect, 1200)
      } catch (error: any) {
        debugInfo.value = { ...debugInfo.value, parseError: error?.message, rawMessage: event.data }
      }
    }

    eventSource.value.addEventListener('progress', (event: MessageEvent) => {
      try { taskProgress.value = JSON.parse(event.data) } catch {}
    })

    eventSource.value.addEventListener('error', (event: any) => {
      try { debugInfo.value = { ...debugInfo.value, serverError: JSON.parse(event.data) } } catch {}
    })

    eventSource.value.onerror = () => {
      isConnected.value = false
      debugInfo.value = { ...debugInfo.value, connectionError: true, errorTime: new Date().toISOString(), readyState: eventSource.value?.readyState }

      if (reconnectAttempts.value < maxReconnectAttempts) {
        reconnectAttempts.value++
        const delay = Math.min(30000, 1000 * 2 ** reconnectAttempts.value)
        setTimeout(connect, delay)
      }
    }
  } catch (error: any) {
    debugInfo.value = { ...debugInfo.value, creationError: error?.message, errorTime: new Date().toISOString() }
  }
}

const disconnect = () => {
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }
  isConnected.value = false
  debugInfo.value = { ...debugInfo.value, disconnectedAt: new Date().toISOString() }
}

const reconnect = () => {
  disconnect()
  reconnectAttempts.value = 0
  setTimeout(connect, 600)
}

/** Lifecycle */
onMounted(() => {
  connect()
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  disconnect()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

const handleVisibilityChange = () => {
  if (!document.hidden && !isConnected.value && (!eventSource.value || eventSource.value.readyState === EventSource.CLOSED)) {
    reconnect()
  }
}

/** UI helpers */
const formatTime = (iso?: string) => {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

const onLaneClick = (lane: LaneProgressRow) => { console.log('Lane clicked:', lane) }
const onLaneRowClick = (row: LaneProgressRow) => { onLaneClick(row) }

/** Table columns */
const columns2 = ['lane_title', 'RND', 'Designing', 'Design Review', 'Spec Doc', 'Development', 'QA', 'Content']

/** Lightweight local skeletons — defined without a second <script> block */
 const SkeletonCard = defineComponent({
  name: 'SkeletonCard',
  setup() {
    return () => h('div', { class: 'w-[380px] min-w-[280px] h-[180px] rounded-xl border border-border bg-bg-body/60 animate-pulse p-4' }, [
      h('div', { class: 'h-5 w-2/3 rounded bg-bg-card/50 mb-2' }),
      h('div', { class: 'h-3 w-1/2 rounded bg-bg-card/50 mb-4' }),
      h('div', { class: 'h-2 w-full rounded bg-bg-card/50 mb-1' }),
      h('div', { class: 'h-2 w-11/12 rounded bg-bg-card/50 mb-1' }),
      h('div', { class: 'h-2 w-10/12 rounded bg-bg-card/50' })
    ])
  }
})

 const SkeletonTable = defineComponent({
  name: 'SkeletonTable',
  setup() {
    const items = Array.from({ length: 6 })
    return () => h('div', { class: 'rounded-xl border border-border overflow-hidden' }, [
      h('div', { class: 'h-10 bg-bg-body/50 animate-pulse' }),
      h('ul', {}, items.map((_, i) => h('li', { key: i, class: 'flex items-center gap-4 px-4 py-3 border-t border-border animate-pulse' }, [
        h('div', { class: 'h-4 w-1/5 bg-bg-card/50 rounded' }),
        h('div', { class: 'h-3 w-1/6 bg-bg-card/50 rounded' }),
        h('div', { class: 'h-3 w-1/6 bg-bg-card/50 rounded' }),
        h('div', { class: 'h-3 w-1/6 bg-bg-card/50 rounded' }),
        h('div', { class: 'h-3 w-1/6 bg-bg-card/50 rounded' })
      ])))
    ])
  }
})
</script>

<style scoped>
/* TransitionGroup animations */
.list-enter-active, .list-leave-active { transition: all 200ms ease-out; }
.list-enter-from { opacity: 0; transform: translateY(4px); }
.list-enter-to { opacity: 1; transform: translateY(0); }
.list-leave-from { opacity: 1; transform: translateY(0); }
.list-leave-to { opacity: 0; transform: translateY(4px); }

/* Progress styles */
.progress-bar { flex: 1; height: 20px; background-color: #e9ecef; border-radius: 10px; overflow: hidden; }
.progress-fill { height: 100%; transition: width 240ms ease; border-radius: 10px; }
.progress-default { background-color: #6c757d; }
.progress-running { background-color: #007bff; }
.progress-complete { background-color: #28a745; }
.progress-error { background-color: #dc3545; }

/* Existing utility-backed blocks, refined for UX */
.workspace-progress { max-width: 800px; margin: 0 auto; padding: 16px; }
.connection-status { padding: 10px; border-radius: 8px; margin-bottom: 12px; font-weight: 600; border: 1px solid transparent; }
.connected { background-color: #d4edda; color: #155724; border-color: #c3e6cb; }
.disconnected { background-color: #f8d7da; color: #721c24; border-color: #f5c6cb; }
.progress-info { background: #f8f9fa; padding: 16px; border-radius: 12px; border: 1px solid #dee2e6; }
.status-info { display: grid; gap: 8px; }
.status-item { display: flex; gap: 10px; align-items: baseline; }
.status-queued { color: #6c757d; }
.status-running { color: #007bff; }
.status-completed { color: #28a745; }
.status-failed { color: #dc3545; }
.error-message { color: #dc3545; background-color: #f8d7da; padding: 10px; border-radius: 5px; }
.actions { display: flex; gap: 10px; margin-top: 16px; }
.btn-default { padding: 8px 16px; border: 1px solid #ccc; border-radius: 8px; cursor: pointer; transition: transform 120ms ease, box-shadow 120ms ease; background: white; }
.btn-default:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(0,0,0,0.06); }
.btn-default:active { transform: translateY(0); box-shadow: none; }

/* Hover affordances for clickability */
.rounded-xl, .rounded-lg { transition: box-shadow 150ms ease, border-color 150ms ease; }
.hoverable:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.07); }
</style>
