import { ref, computed } from 'vue'

export interface LaneProgressRow {
  lane_title: string
  progress?: number
  status?: string
  total_cards?: number
  status_distribution?: Record<string, number>
  [key: string]: unknown
}

export interface TaskProgress {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled' | string
  percent: number
  message: string
  progress_details?: { lanes_progress?: LaneProgressRow[] }
  result?: { sheet_lists?: number; cards?: number; lanes_summary: LaneProgressRow[] }
  error?: string
  updated_at: string
}

const taskProgress = ref<TaskProgress | null>(null)
const isConnected = ref(false)

let eventSource: EventSource | null = null
let isStopped = false
let activeStreamKey = ''

const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL
const TERMINAL_STATUSES = ['completed', 'failed', 'canceled']

function handleStreamPayload(raw: string) {
  const payload = JSON.parse(raw) as TaskProgress
  taskProgress.value = payload

  const status = payload?.status ?? ''
  if (TERMINAL_STATUSES.includes(status)) {
    localStorage.removeItem('jobId')
    disconnect()
    activeStreamKey = ''
  }
}

function resolveJob(workspaceId: string, jobId: string) {
  const paramJob = jobId
  const storedJob = localStorage.getItem('jobId') || ''
  const effectiveJob = paramJob || storedJob || workspaceId
  const isManual = paramJob || storedJob ? 'false' : 'true'
  return { effectiveJob, isManual, paramJob }
}

function getStreamKey(workspaceId: string, jobId: string) {
  const { effectiveJob, isManual } = resolveJob(workspaceId, jobId)
  return `${effectiveJob}:${isManual}`
}

function disconnect() {
  isConnected.value = false
  if (eventSource) {
    eventSource.close()
    eventSource = null
  }
}

function connect(workspaceId: string, jobId: string) {
  if (isStopped || !workspaceId) return

  const streamKey = getStreamKey(workspaceId, jobId)
  if (activeStreamKey === streamKey && eventSource) return

  if (activeStreamKey && activeStreamKey !== streamKey) {
    disconnect()
    taskProgress.value = null
  }

  activeStreamKey = streamKey

  const { effectiveJob, isManual, paramJob } = resolveJob(workspaceId, jobId)
  if (paramJob) localStorage.setItem('jobId', paramJob)

  const token = localStorage.getItem('token') || ''
  const url = `${SERVER_BASE_URL}common/step2/tasks/${effectiveJob}/stream?token=${token}&is_manual=${isManual}`
  const es = new EventSource(url)
  eventSource = es

  es.onopen = () => {
    if (!isStopped) isConnected.value = true
  }

  es.onmessage = (event: MessageEvent) => {
    if (isStopped) return
    try {
      handleStreamPayload(event.data)
    } catch {
      // ignore malformed payloads
    }
  }

  es.onerror = () => {
    const status = taskProgress.value?.status ?? ''
    if (TERMINAL_STATUSES.includes(status)) {
      disconnect()
      activeStreamKey = ''
    }
  }

  es.addEventListener('progress', (event: MessageEvent) => {
    if (isStopped) return
    try {
      handleStreamPayload(event.data)
    } catch {
      // ignore malformed payloads
    }
  })
}

function stopAll() {
  isStopped = true
  disconnect()
  activeStreamKey = ''
  taskProgress.value = null
}

function resume() {
  isStopped = false
}

function normalizeLabel(label: string) {
  return label.toLowerCase().replace(/s$/, '').trim()
}

function isLaneGenerating(laneTitle: string): boolean {
  if (!laneTitle) return false

  const normalized = normalizeLabel(laneTitle)
  const lanes = taskProgress.value?.progress_details?.lanes_progress ?? []
  const lane = lanes.find(
    (row) => normalizeLabel(row.lane_title || '') === normalized,
  )

  if (lane) {
    return lane.status === 'in_progress' || lane.status === 'pending'
  }

  return false
}

const isGenerating = computed(() => {
  const status = taskProgress.value?.status
  if (status) {
    return !TERMINAL_STATUSES.includes(status)
  }
  return !!localStorage.getItem('jobId')
})

const cardProgress = computed(() => taskProgress.value?.percent === 100)
const lanes = computed<LaneProgressRow[]>(
  () => taskProgress.value?.result?.lanes_summary ?? [],
)
const lanes2 = computed<LaneProgressRow[]>(
  () => taskProgress.value?.progress_details?.lanes_progress ?? [],
)

export function useSpaceCreationStream() {
  return {
    taskProgress,
    isConnected,
    isGenerating,
    cardProgress,
    lanes,
    lanes2,
    connect,
    disconnect,
    stopAll,
    resume,
    isLaneGenerating,
  }
}
