<template>
  <div class=" flex flex-col gap-4 h-full overflow-x-auto w-full flex-auto">
    <!-- Header / Overview -->
    <div class="p-5 rounded-[6px] bg-bg-card space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex flex-col w-full">
          <h3 class="text-2xl text-text-primary font-semibold">Project Overview</h3>
          <p class="text-sm text-text-secondary mt-2">Last update on Sep 12, 2024 - 09.45 AM</p>

          <!-- Cards Row -->
          <div class="flex gap-2.5 overflow-x-auto w-full py-8 custom_scroll_bar">
            <!-- Loading skeletons -->
            <template v-if="isLoading">
              <SkeletonCard v-for="n in 3" :key="n" />
            </template>

            <!-- Cards with transitions -->
            <TransitionGroup name="list" tag="div" class="flex gap-2.5" v-else>
              <button v-if="cardProgress" v-for="lane in lanes" :key="lane?.lane_title"
                class="group focus:outline-none border-border border focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
                type="button" role="button" aria-label="Open lane details" @click="onLaneClick(lane)">
                <ProjectCard :ai="false" :doneCard="lane?.status_distribution['Done']"
                  :loading="isLoading || lane?.status === 'in_progress'" :title="lane?.lane_title" subtitle=""
                  :progress="cardProgress ? getCardProgress(lane?.total_cards, lane?.status_distribution) : lane?.progress"
                  :totalCard="lane?.total_cards" :status="cardProgress ? '' : (lane?.status ?? '')" :avatars="avatars"
                  date="May 28"
                  class="transition-transform duration-200 ease-out group-hover:shadow-lg  border border-transparent hover:border-border-subtle rounded-xl cursor-pointer" />

              </button>
              <button v-else v-for="lane in lanes2" :key="`2-${lane?.lane_title}`"
                class="group focus:outline-none border-border border focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
                type="button" role="button" aria-label="Open lane details" @click="onLaneClick(lane)">
                <ProjectCard :ai="true" :loading="isLoading || lane?.status === 'in_progress'" :title="lane?.lane_title"
                  subtitle=""
                  :progress="cardProgress ? getCardProgress(lane?.total_cards, lane?.status_distribution) : lane?.progress"
                  :totalCard="lane?.total_cards" :status="cardProgress ? '' : (lane?.status ?? '')" :avatars="avatars"
                  date="May 28"
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
    <div class="flex flex-grow flex-col sm:flex-row  gap-4">
      <!-- Team Workload -->
      <div class="bg-bg-card w-full  max-h-full flex-auto p-5 rounded-lg">
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-text-primary">Team workload</h3>
          <p class="text-sm text-text-secondary mt-1">
            Monitor the capacity of your team.
            <span v-if="teamSize > 0" class="ml-1">({{ teamSize }} member{{ teamSize !== 1 ? 's' : '' }})</span>
          </p>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between text-sm font-medium text-text-secondary mb-2">
            <span>Assignee</span>
            <span>Work distribution</span>
          </div>

          <!-- Loading State -->
          <template v-if="isLoadingTeams">
            <div v-for="n in 3" :key="n" class="flex items-center gap-3 animate-pulse">
              <div class="flex items-center gap-2 w-32 flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-bg-body"></div>
                <div class="h-4 w-20 bg-bg-body rounded"></div>
              </div>
              <div class="flex-1 h-6 bg-bg-body rounded"></div>
            </div>
          </template>

          <!-- Error State -->
          <div v-else-if="teamsError" class="text-center py-8">
            <p class="text-sm text-red-500 mb-2">Failed to load team workload</p>
            <button @click="() => refetchTeams()" class="text-xs text-accent hover:underline">
              Try again
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="teamWorkload.length === 0" class="text-center py-8">
            <i class="pi pi-users text-3xl text-text-secondary mb-2"></i>
            <p class="text-sm text-text-secondary">No team members assigned yet</p>
          </div>

          <!-- Workload items -->
          <div v-else v-for="member in teamWorkload" :key="member.id" class="flex items-center gap-3">
            <div class="flex items-center gap-2 w-32 flex-shrink-0">
              <div v-if="member.avatarUrl" class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img :src="member.avatarUrl" :alt="member.name" class="w-full h-full object-cover" />
              </div>
              <div v-else-if="member.avatar"
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                :style="{ backgroundColor: avatarColor({ name: member?.name }) }">
                {{ getInitials(member.name) }}
              </div>
              <div v-else class="w-8 h-8 rounded-full bg-bg-body flex items-center justify-center flex-shrink-0">
                <i class="pi pi-user text-text-secondary"></i>
              </div>
              <span class="text-sm text-text-primary truncate" :title="member.name">{{ member.name }}</span>
            </div>

            <div class="flex-1">
              <div class="h-6 bg-bg-body rounded overflow-hidden relative group cursor-help"
                :title="`${member.totalTasks} task${member.totalTasks !== 1 ? 's' : ''} • ${member.totalHours}h`">
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
      <div class="bg-bg-card w-full flex-auto p-5 max-h-full rounded-lg overflow-y-auto  flex flex-col">
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-text-primary">Recent activity</h3>
          <p class="text-sm text-text-secondary mt-1">Stay up to date with what's happening across the project.</p>
        </div>

        <div class="space-y-4 overflow-y-auto flex-1">
          <div class="text-xs font-semibold text-text-secondary mb-3">Today</div>

          <div v-for="activity in dashboardActiviesData?.activities" :key="activity.id"
            class="flex gap-3 pb-4 border-b border-border last:border-0">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
              :style="{ backgroundColor: avatarColor({ email: activity.user.email }) }">
              {{ getInitials(activity.user.name) }}
            </div>

            <div class="flex-1 min-w-0">
              <div class="text-sm text-text-primary">
                <span class="font-medium text-accent/90">{{ activity.user.name }}</span>
                <span class="text-text-secondary"> {{ activity.message }} </span>
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
import { ref, onMounted, onUnmounted, computed, defineComponent, h, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProjectCard from '../components/feature/ProjectCard.vue'
import { toParamString } from '../composables/useQueryParams'
import { useDashboardActivities, useDashboardTeams } from '../queries/usePeople'
import { getInitials, generateAvatarColor } from '../utilities'
import { avatarColor } from '../utilities/avatarColor'
import type { TeamWorkloadMember } from '../types'

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
  result?: { sheet_lists?: number; cards?: number; lanes_summary: any }
  error?: string
  updated_at: string
}

/** Reactive state */

const isLoading = ref(false)

/**
 * IMPORTANT FLAG:
 * Once the component is unmounted, this becomes true
 * and we NEVER create new EventSource or schedule reconnects.
 */
const isConnected = ref(false)
const taskProgress = ref<TaskProgress | null>(null)
const eventSource = ref<EventSource | null>(null)

/** Ensure no reconnect or re-init after unmount */
let isStopped = false

const SERVER_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL || 
  'https://backend.orchit.ai/api/v1/'
// 'https://backend.streamed.space/api/v1/'
const connect = () => {
  if (isStopped) return
  if (eventSource.value) return // prevent duplicate connections

  const token = localStorage.getItem('token') || ''
  const paramJob = jobId.value
  const storedJob = localStorage.getItem('jobId')
  const effectiveJob = paramJob || storedJob || workspaceId.value
  const isManual = paramJob || storedJob ? 'false' : 'true'

  const url = `${SERVER_BASE_URL}common/step2/tasks/${effectiveJob}/stream?token=${token}&is_manual=${isManual}`

  const es = new EventSource(url)
  eventSource.value = es

  es.onopen = () => {

    if (isStopped) return
    isConnected.value = true
  }

  es.onmessage = (event: MessageEvent) => {
    if (isStopped) return
    try {
      
      taskProgress.value = JSON.parse(event.data) 

      // Close automatically when completed/final state
      const status = taskProgress.value?.status ??'cancels'
      if (['completed', 'failed', 'canceled'].includes(status)) {
        disconnect()
      }
    } catch (_) { }
  }

  es.onerror = () => {
    // DO NOT RECONNECT
    disconnect()
  }

  eventSource.value.addEventListener('progress', (event: MessageEvent) => {
    console.log('>> trki g');
    
      try { taskProgress.value = JSON.parse(event.data) } catch { }
    })
}

const disconnect = () => {
  isConnected.value = false
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }
}

/** Lifecycle */
onMounted(() => {
  isStopped = false
  connect()
})



onUnmounted(() => {
  isStopped = true
  disconnect()
})



/** Derived state */
const cardProgress = computed(() =>
  taskProgress.value?.percent === 100 ? true : false
)

const lanes = computed<LaneProgressRow[]>(
  () => taskProgress.value?.result?.lanes_summary ?? []
)
const lanes2 = computed<LaneProgressRow[]>(
  () => taskProgress.value?.progress_details?.lanes_progress ?? []
)

const avatars = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg'
]

const route = useRoute()
const workspaceId = computed<string>(() => toParamString(route?.params?.id))
const jobId = computed<string>(() => toParamString(route?.params?.job_id))



/** Click handler for lanes */
const onLaneClick = (lane: LaneProgressRow) => {
  console.log('Lane clicked:', lane)
}

/** Queries for team + activities */
const {
  data: dashboardTeamsData,
  isPending: isLoadingTeams,
  error: teamsError,
  refetch: refetchTeams
} = useDashboardTeams(workspaceId)
const { data: dashboardActiviesData } = useDashboardActivities(workspaceId)

const teamWorkload = computed(() => {
  if (!dashboardTeamsData.value?.team_workload) {
    return []
  }

  return dashboardTeamsData.value.team_workload.map((member: TeamWorkloadMember) => ({
    id: member.assignee_id || 'unassigned',
    name: member.assignee_name,
    initials: member.initials || getInitials(member.assignee_name) || '',
    avatar: !!member.avatar_url || !!member.assignee_id,
    avatarUrl: member.avatar_url,
    color: generateAvatarColor(member.assignee_id, member.assignee_name),
    workload: member.work_distribution_percentage,
    totalTasks: member.total_tasks,
    totalHours: member.total_hours
  }))
})

const teamSize = computed(() => dashboardTeamsData.value?.team_size || 0)

/** Status chip styling */
const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    'DEPLOYED-PROD': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'REOPENED': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    'IN-PROGRESS': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
  return classes[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

/** Local skeleton component */
const SkeletonCard = defineComponent({
  name: 'SkeletonCard',
  setup() {
    return () =>
      h(
        'div',
        {
          class:
            'w-[380px] min-w-[280px] h-[180px] rounded-xl border border-border bg-bg-body/60 animate-pulse p-4'
        },
        [
          h('div', { class: 'h-5 w-2/3 rounded bg-bg-card/50 mb-2' }),
          h('div', { class: 'h-3 w-1/2 rounded bg-bg-card/50 mb-4' }),
          h('div', { class: 'h-2 w-full rounded bg-bg-card/50 mb-1' }),
          h('div', { class: 'h-2 w-11/12 rounded bg-bg-card/50 mb-1' }),
          h('div', { class: 'h-2 w-10/12 rounded bg-bg-card/50' })
        ]
      )
  }
})

/** Card progress helper */
const getCardProgress = (total: number, status_dis: any) => {
  if (!total) return 0
  const done = status_dis['Done'] ?? 0
  return (done / total) * 100
}

watch([workspaceId, jobId], () => {
  disconnect()
  connect()
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


.custom_scroll_bar::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}

.custom_scroll_bar::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 10px;
}

.custom_scroll_bar::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}

.custom_scroll_bar::-webkit-scrollbar-track {
  background: transparent;
}

/* Firefox support */
.custom_scroll_bar {
  scrollbar-width: thin;
  scrollbar-color: #888 transparent;
}
</style>
