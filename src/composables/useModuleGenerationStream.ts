import { ref } from 'vue'
import type { QueryClient } from '@tanstack/vue-query'

export interface ModuleGenerationProgress {
  jobId: string
  moduleId: string
  status: string
  progress: number
  message: string
}

const moduleProgress = ref<Record<string, ModuleGenerationProgress>>({})
const pendingJobs = ref<Record<string, string>>({})
const activeStreams = new Map<string, EventSource>()

const TERMINAL_STATUSES = ['completed', 'failed', 'canceled']
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL

function isTerminal(status: string) {
  return TERMINAL_STATUSES.includes(status)
}

function updateProgress(
  moduleId: string,
  payload: {
    job_id?: string
    jobId?: string
    status?: string
    progress?: number
    message?: string
  },
) {
  const prev = moduleProgress.value[moduleId]
  moduleProgress.value = {
    ...moduleProgress.value,
    [moduleId]: {
      jobId: String(payload.job_id ?? payload.jobId ?? prev?.jobId ?? ''),
      moduleId,
      status: payload.status ?? prev?.status ?? 'running',
      progress: payload.progress ?? prev?.progress ?? 0,
      message: payload.message ?? prev?.message ?? '',
    },
  }
}

function closeStream(jobId: string) {
  const es = activeStreams.get(jobId)
  if (es) {
    es.close()
    activeStreams.delete(jobId)
  }
}

function clearPendingJob(moduleId: string) {
  if (!pendingJobs.value[moduleId]) return
  const next = { ...pendingJobs.value }
  delete next[moduleId]
  pendingJobs.value = next
}

function registerModuleJob(moduleId: string, jobId: string) {
  pendingJobs.value = {
    ...pendingJobs.value,
    [moduleId]: String(jobId),
  }
}

function startModuleGenerationStream(
  moduleId: string,
  jobId: string,
  workspaceId?: string,
  queryClient?: QueryClient,
) {
  const normalizedJobId = String(jobId)
  registerModuleJob(moduleId, normalizedJobId)

  const existing = moduleProgress.value[moduleId]
  if (
    existing?.jobId === normalizedJobId &&
    existing.status &&
    !isTerminal(existing.status)
  ) {
    return
  }

  if (activeStreams.has(normalizedJobId)) {
    return
  }

  updateProgress(moduleId, {
    jobId: normalizedJobId,
    status: 'running',
    progress: 0,
    message: '',
  })

  const token = localStorage.getItem('token') || ''
  const url = `${SERVER_BASE_URL}workspace/modules/generation/${normalizedJobId}/stream?token=${token}`
  const es = new EventSource(url)
  activeStreams.set(normalizedJobId, es)

  const handlePayload = (raw: Record<string, unknown>) => {
    const mid = String(raw.module_id ?? moduleId)
    const status = String(raw.status ?? '')

    updateProgress(mid, {
      job_id: String(raw.job_id ?? normalizedJobId),
      status,
      progress: Number(raw.progress ?? 0),
      message: String(raw.message ?? ''),
    })

    if (isTerminal(status)) {
      closeStream(normalizedJobId)
      clearPendingJob(mid)
      if (status === 'completed' && workspaceId && queryClient) {
        queryClient.invalidateQueries({ queryKey: ['workspaces'] })
        queryClient.invalidateQueries({
          queryKey: ['workspaces', 'byId', workspaceId],
        })
      }
    }
  }

  es.addEventListener('progress', (event: MessageEvent) => {
    try {
      handlePayload(JSON.parse(event.data))
    } catch {
      // ignore malformed payloads
    }
  })

  es.onmessage = (event: MessageEvent) => {
    try {
      handlePayload(JSON.parse(event.data))
    } catch {
      // ignore malformed payloads
    }
  }

  es.onerror = () => {
    const current = moduleProgress.value[moduleId]
    if (current && isTerminal(current.status)) {
      closeStream(normalizedJobId)
    }
  }
}

function getPendingJobId(moduleId: string) {
  return pendingJobs.value[moduleId]
}

function hasPendingJob(moduleId: string) {
  return !!pendingJobs.value[moduleId]
}

function isModuleGenerating(moduleId: string) {
  const progress = moduleProgress.value[moduleId]
  if (progress?.status) {
    return !isTerminal(progress.status)
  }
  return hasPendingJob(moduleId)
}

function getModuleProgress(moduleId: string) {
  return moduleProgress.value[moduleId]
}

export function useModuleGenerationStream() {
  return {
    moduleProgress,
    pendingJobs,
    registerModuleJob,
    startModuleGenerationStream,
    clearPendingJob,
    getPendingJobId,
    hasPendingJob,
    isModuleGenerating,
    getModuleProgress,
  }
}
