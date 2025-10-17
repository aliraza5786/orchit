<template>

  <div class="space-y-2 flex flex-col h-full overflow-x-auto w-full flex-auto">
    <div class="p-5 rounded-lg bg-bg-card space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex flex-col w-full">
          <h3 class="text-2xl text-text-primary font-semibold">
            Project Overview
          </h3>
          <p class="text-sm text-text-secondary mt-2">
            Last update on Sep 12, 2024 - 09.45 AM
          </p>
          <div class="flex gap-2.5 overflow-x-auto w-full py-8">
            <ProjectCard v-for="lane in taskProgress?.progress_details?.lanes_progress" :title="lane.lane_title"
              subtitle="Mobile Application" :progress="lane?.progress" :status="lane?.status" :avatars="[
                'https://randomuser.me/api/portraits/women/1.jpg',
                'https://randomuser.me/api/portraits/men/2.jpg',
                'https://randomuser.me/api/portraits/men/3.jpg',
              ]" date="May 28" />
          </div>
          <!-- <div class="workspace-progress">
            <div v-if="isConnected" class="connection-status connected">
              🟢 Connected to progress stream
            </div>
            <div v-else class="connection-status disconnected">
              🔴 Not connected
            </div>

            <div v-if="taskProgress" class="progress-info">
              <h3>Workspace Generation Progress</h3>

            
              <div class="progress-bar-container">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: taskProgress.percent + '%' }"
                    :class="getProgressClass(taskProgress.status)"></div>
                </div>
                <div class="progress-text">{{ taskProgress.percent }}%</div>
              </div>


              <div class="status-info">
                <div class="status-item">
                  <strong>Status:</strong>
                  <span :class="'status-' + taskProgress.status">{{ taskProgress.status }}</span>
                </div>

                <div class="status-item">
                  <strong>Message:</strong> {{ taskProgress.message }}
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
                <button @click="reconnect" :disabled="isConnected">
                  Reconnect
                </button>
                <button @click="disconnect" :disabled="!isConnected">
                  Disconnect
                </button>
              </div>
            </div>

      
            <div v-if="showDebug" class="debug-info">
              <h4>Debug Info</h4>
              <pre>{{ debugInfo }}</pre>
            </div>

            <button @click="showDebug = !showDebug" class="debug-toggle">
              {{ showDebug ? 'Hide' : 'Show' }} Debug Info
            </button>
          </div> -->

        </div>
      </div>
    </div>
    <div class="bg-bg-card p-5 rounded-lg flex-grow">
      <StatusTable :columns="columns2" :rows="taskProgress?.progress_details?.lanes_progress ?? []" />

    </div>
  </div>

</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useJobId,useWorkspaceId } from '../composables/useQueryParams'
import ProjectCard from '../components/feature/ProjectCard.vue'
import StatusTable from '../components/ui/StatusTable.vue'
const { workspaceId } = useWorkspaceId();

interface TaskProgress {
  status: string
  percent: number
  message: string
  progress_details: any,
  result?: {
    sheet_lists: number
    cards: number
  }
  error?: string
  updated_at: string
}


// Reactive state
const isConnected = ref(false)
const taskProgress = ref<TaskProgress | null>(null)
const eventSource = ref<EventSource | null>(null)
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5
const debugInfo = ref<any>({})

// Server configuration
const SERVER_BASE_URL = 'https://backend.streamed.space/api/v1/workspace'

// SSE Connection Management
const connect = () => {
  if (eventSource.value && eventSource.value.readyState === EventSource.OPEN) {
    console.log('🔌 Already connected, skipping connection attempt')
    return // Don't reconnect if already connected
  }
  if (reconnectAttempts.value >= maxReconnectAttempts) {
    console.log('❌ Max reconnection attempts reached')
    return // Stop attempting after max reconnection attempts
  }
  if (eventSource.value) {
    eventSource.value.close()
  }
  const token = localStorage.getItem('token')
  console.log('🔌 Connecting to SSE stream...')
  console.log('📋 Task ID:', useJobId()?.jobId.value)
  console.log('🔐 Token:', token ? token.substring(0, 20) : '' + '...')

  // Construct the SSE URL with token as query parameter
  const sseUrl = `${SERVER_BASE_URL}/step2/tasks/${localStorage.getItem('jobId') ?? workspaceId.value}/stream?token=${localStorage.getItem('token')}&is_manual=${localStorage.getItem('jobId') ? 'false' : 'true'}`
  console.log('🌐 SSE URL:', sseUrl)

  try {
    // Create EventSource with proper configuration
    eventSource.value = new EventSource(sseUrl, {
      withCredentials: false // Set to true if your server requires credentials
    })

    // Connection opened
    eventSource.value.onopen = (event) => {
      console.log('✅ SSE Connection opened:', event)
      isConnected.value = true
      reconnectAttempts.value = 0

      debugInfo.value = {
        ...debugInfo.value,
        connectionStatus: 'Connected',
        lastConnected: new Date().toISOString(),
        url: sseUrl
      }
    }

    // Message received
    eventSource.value.onmessage = (event) => {
      console.log('📨 SSE Message received:', event)
      try {
        const data = JSON.parse(event.data)
        taskProgress.value = data

        debugInfo.value = {
          ...debugInfo.value,
          lastMessage: data,
          lastMessageTime: new Date().toISOString()
        }

        // Auto-disconnect if task is completed or failed
        if (['completed', 'failed', 'canceled'].includes(data.status)) {
          console.log('🏁 Task finished with status:', data.status)
          setTimeout(disconnect, 2000) // Disconnect after 2 seconds
        }
      } catch (error: any) {
        console.error('❌ Error parsing SSE message:', error)
        debugInfo.value = {
          ...debugInfo.value,
          parseError: error.message,
          rawMessage: event.data
        }
      }
    }

    // Handle 'progress' events specifically
    eventSource.value.addEventListener('progress', (event) => {
      console.log('📊 Progress event:', event)
      try {
        const data = JSON.parse(event.data)
        taskProgress.value = data
      } catch (error) {
        console.error('❌ Error parsing progress event:', error)
      }
    })

    // Handle error events
    eventSource.value.addEventListener('error', (event: any) => {
      console.log('🔥 SSE Error event:', event)
      try {
        const data = JSON.parse(event.data)
        console.error('❌ Server error:', data)
        debugInfo.value = {
          ...debugInfo.value,
          serverError: data,
          errorTime: new Date().toISOString()
        }
      } catch (error) {
        console.log('Error event (not JSON):', event)
      }
    })

    // Connection error
    eventSource.value.onerror = (event) => {
      console.error('💥 SSE Connection error:', event)
      isConnected.value = false

      debugInfo.value = {
        ...debugInfo.value,
        connectionError: event,
        errorTime: new Date().toISOString(),
        readyState: eventSource.value?.readyState
      }

      // Auto-reconnect logic
      if (reconnectAttempts.value < maxReconnectAttempts) {
        // reconnectAttempts.value++
        console.log(`🔄 Reconnecting... Attempt ${reconnectAttempts.value}/${maxReconnectAttempts}`)
        // setTimeout(connect, 3000 * reconnectAttempts.value) // Exponential backoff
      } else {
        console.log('❌ Max reconnection attempts reached')
      }
    }

  } catch (error: any) {
    console.error('💥 Error creating EventSource:', error)
    debugInfo.value = {
      ...debugInfo.value,
      creationError: error.message,
      errorTime: new Date().toISOString()
    }
  }
}

const disconnect = () => {
  if (eventSource.value) {
    console.log('🔌 Disconnecting SSE stream...')
    eventSource.value.close()
    eventSource.value = null
  }
  isConnected.value = false

  debugInfo.value = {
    ...debugInfo.value,
    disconnectedAt: new Date().toISOString()
  }
}

const reconnect = () => {
  disconnect()
  // setTimeout(connect, 1000)
}

// Lifecycle hooks
onMounted(() => {
  console.log('🚀 Component mounted, connecting to SSE...')
  connect()
})

onUnmounted(() => {
  console.log('💀 Component unmounted, disconnecting SSE...')
  disconnect()
})

// Handle page visibility change (pause when tab is hidden)
const handleVisibilityChange = () => {
  if (!document.hidden && !isConnected.value && eventSource.value?.readyState === EventSource.CLOSED) {
    console.log('👀 Page visible, reconnecting to stream...')
    reconnect()
  }
}


onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

const columns2 = [
  "lane_title",
  "RND",
  "Designing",
  "Design Review",
  "Spec Doc",
  "Development",
  "QA",
  "Content",
];

</script>

<style scoped>
.workspace-progress {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.connection-status {
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 20px;
  font-weight: bold;
}

.connected {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.disconnected {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.progress-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.progress-bar {
  flex: 1;
  height: 20px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
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

.progress-text {
  font-weight: bold;
  min-width: 50px;
}

.status-info {
  display: grid;
  gap: 10px;
}

.status-item {
  display: flex;
  gap: 10px;
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
  margin-top: 20px;
}

.actions button {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.debug-info {
  margin-top: 20px;
  background: #f1f1f1;
  padding: 15px;
  border-radius: 5px;
  font-size: 12px;
}

.debug-info pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.debug-toggle {
  margin-top: 10px;
  padding: 5px 10px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
</style>
