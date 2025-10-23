<template>
  <div class=" flex flex-col gap-4 h-full overflow-x-auto w-full flex-auto">
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
              <button v-for="lane in lanes" :key="lane.lane_title"
                class="group focus:outline-none border-border border focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
                type="button" role="button" aria-label="Open lane details" @click="onLaneClick(lane)">
                <ProjectCard :loading="isLoading || lane?.status === 'in_progress'" :title="lane.lane_title"
                  subtitle="Mobile Application" :progress="lane?.progress ?? 0" :totalCard="lane?.total_cards" :status="lane?.status ?? ''"
                  :avatars="avatars" date="May 28"
                  class="transition-transform duration-200 ease-out group-hover:shadow-lg  border border-transparent hover:border-border-subtle rounded-xl cursor-pointer" />
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

    <!-- Three Column Stats Section -->



    <!-- Right Column: Team Workload & Recent Activity -->
    <div class="flex flex-grow  gap-4">
      <!-- Team Workload -->
      <div class="bg-bg-card w-full flex-auto p-5 rounded-lg">
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-text-primary">Team workload</h3>
          <p class="text-sm text-text-secondary mt-1">
            Monitor the capacity of your team.

          </p>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between text-sm font-medium text-text-secondary mb-2">
            <span>Assignee</span>
            <span>Work distribution</span>
          </div>

          <!-- Workload items -->
          <div v-for="member in teamWorkload" :key="member.id" class="flex items-center gap-3">
            <div class="flex items-center gap-2 w-32 flex-shrink-0">
              <div v-if="member.avatar"
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                :style="{ backgroundColor: member.color }">
                {{ member.initials }}
              </div>
              <div v-else class="w-8 h-8 rounded-full bg-bg-body flex items-center justify-center">
                <i class="pi pi-user text-text-secondary"></i>
              </div>
              <span class="text-sm text-text-primary truncate">{{ member.name }}</span>
            </div>

            <div class="flex-1">
              <div class="h-6 bg-bg-body rounded overflow-hidden relative">
                <div class="h-full bg-border-subtle transition-all duration-300"
                  :style="{ width: member.workload + '%' }">
                </div>
                <span v-if="member.workload > 10"
                  class="absolute inset-0 flex items-center justify-start px-2 text-xs text-text-primary font-medium">
                  {{ member.workload }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-bg-card w-full flex-auto p-5 rounded-lg  overflow-hidden flex flex-col">
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-text-primary">Recent activity</h3>
          <p class="text-sm text-text-secondary mt-1">Stay up to date with what's happening across the project.</p>
        </div>

        <div class="space-y-4 overflow-y-auto flex-1">
          <div class="text-xs font-semibold text-text-secondary mb-3">Today</div>

          <div v-for="activity in recentActivities" :key="activity.id"
            class="flex gap-3 pb-4 border-b border-border last:border-0">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
              :style="{ backgroundColor: activity.userColor }">
              {{ activity.userInitials }}
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-sm text-text-primary">
                <span class="font-medium text-accent/90">{{ activity.user }}</span>
                <span class="text-text-secondary"> {{ activity.action }} </span>
                <a href="#" class="text-accent/90 hover:underline">{{ activity.item }}</a>
                <span v-if="activity.status" class="ml-2 px-2 py-0.5 rounded text-xs font-medium"
                  :class="getStatusClass(activity.status)">
                  {{ activity.status }}
                </span>
              </div>
              <div class="text-xs text-text-secondary mt-1">{{ activity.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, defineComponent, h } from 'vue'
import { toParamString } from '../composables/useQueryParams'
import ProjectCard from '../components/feature/ProjectCard.vue'
import { useRoute } from 'vue-router'


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
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL || 'https://backend.streamed.space/api/v1/workspace'

/** Derived */
const lanes = computed<LaneProgressRow[]>(() => taskProgress.value?.progress_details?.lanes_progress ?? [])
const isLoading = computed(() => !taskProgress.value || ['queued', 'running'].includes(taskProgress.value.status))

const avatars = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg'
]
const route = useRoute();
const workspaceId = computed<string>(() => toParamString(route?.params?.id));
const jobId = computed<string>(() => toParamString(route?.params?.jobId));
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
      try { taskProgress.value = JSON.parse(event.data) } catch { }
    })

    eventSource.value.addEventListener('error', (event: any) => {
      try { debugInfo.value = { ...debugInfo.value, serverError: JSON.parse(event.data) } } catch { }
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



const onLaneClick = (lane: LaneProgressRow) => { console.log('Lane clicked:', lane) }

/** Team Workload Data */
const teamWorkload = ref([
  { id: 1, name: 'Unassigned', initials: '', avatar: false, color: '#6B7280', workload: 13 },
  { id: 2, name: 'Amal Lashari', initials: 'AL', avatar: true, color: '#3B82F6', workload: 35 },
  { id: 3, name: 'Anam Rehman', initials: 'AR', avatar: true, color: '#3B82F6', workload: 8 },
  { id: 4, name: 'Sufian', initials: 'S', avatar: true, color: '#6B7280', workload: 8 },
  { id: 5, name: 'Arooj Sajjad', initials: 'AS', avatar: true, color: '#EF4444', workload: 5 }
])

/** Recent Activities Data */
const recentActivities = ref([
  {
    id: 1,
    user: 'Streamed Bot',
    userInitials: 'VB',
    userColor: '#06B6D4',
    action: 'updated field "RemoteWorkItemLink" on',
    item: 'VFC-33073: IPU: Agenda Multilingual Issue (global issue)',
    status: 'DEPLOYED-PROD',
    time: 'about 4 hours ago'
  },
  {
    id: 2,
    user: 'Streamed Bot',
    userInitials: 'VB',
    userColor: '#06B6D4',
    action: 'updated field "RemoteWorkItemLink" on',
    item: 'VFC-31468: Show/Hide Team Members on Booth',
    status: 'REOPENED',
    time: 'about 4 hours ago'
  },
  {
    id: 3,
    user: 'Streamed Bot',
    userInitials: 'VB',
    userColor: '#06B6D4',
    action: 'updated field "RemoteWorkItemLink" on',
    item: 'VFC-32359: Favicon not displaying after uploading from Event Settings',
    status: '',
    time: 'about 4 hours ago'
  }
])

/** Helper function for status classes */
const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'DEPLOYED-PROD': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'REOPENED': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    'IN-PROGRESS': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

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

</script>

<style scoped>
/* TransitionGroup animations */
.list-enter-active,
.list-leave-active {
  transition: all 200ms ease-out;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.list-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.list-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Progress styles */
.progress-bar {
  flex: 1;
  height: 20px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 240ms ease;
  border-radius: 10px;
}

.progress-default {
  background-color: #6c757d;
}

.progress-running {
  background-color: #007bff;
}

.progress-complete {
  background-color: #28a745;
}

.progress-error {
  background-color: #dc3545;
}

/* Existing utility-backed blocks, refined for UX */
.workspace-progress {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.connection-status {
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}

.connected {
  background-color: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.disconnected {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.progress-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #dee2e6;
}

.status-info {
  display: grid;
  gap: 8px;
}

.status-item {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.status-queued {
  color: #6c757d;
}

.status-running {
  color: #007bff;
}

.status-completed {
  color: #28a745;
}

.status-failed {
  color: #dc3545;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  padding: 10px;
  border-radius: 5px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.btn-default {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
  background: white;
}

.btn-default:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
}

.btn-default:active {
  transform: translateY(0);
  box-shadow: none;
}

/* Hover affordances for clickability */
.rounded-xl,
.rounded-lg {
  transition: box-shadow 150ms ease, border-color 150ms ease;
}

.hoverable:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
}
</style>
