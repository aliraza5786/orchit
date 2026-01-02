<template>
  <div :class="[
    'max-w-[358px] flex-grow rounded-[6px] overflow-hidden relative transition-all flex flex-col',
    'text-text-primary bg-bg-card',
    workspaceStore.showChatBotPanel ? 'translate-x-0 min-w-full sm:min-w-[380px] w-full h-full' : 'translate-x-[200%] !max-w-0 h-0 hidden'
  ]">
    <!-- Header -->
    <div class="flex justify-between items-center border-b border-border px-5 py-4.5 sticky top-0 bg-bg-card z-10">
      <h5 class="text-[16px] font-medium flex items-center gap-2">
        <i class="fa-solid fa-sparkles text-accent"></i>
        Ask Ai
      </h5>
      <i class="cursor-pointer text-text-primary fa-solid fa-close transition-colors" @click="closeHandler"></i>
    </div>

    <!-- Chat Area -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Welcome Message -->
      <div class="flex gap-3">
        <div class="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <i class="fa-solid fa-robot text-accent text-sm"></i>
        </div>
        <div class="bg-bg-body p-3 rounded-lg rounded-tl-none max-w-[85%] text-sm leading-relaxed border border-border">
          <p>Hi! I'm your AI assistant. How can I help you with your workspace today?</p>
        </div>
      </div>

      <!-- User Message Example (Hidden by default, just for structure) -->
      <!-- <div class="flex gap-3 flex-row-reverse">
        <div class="w-8 h-8 rounded-full bg-bg-surface flex items-center justify-center shrink-0">
          <div class="text-xs font-semibold">ME</div>
        </div>
        <div class="bg-accent/10 p-3 rounded-lg rounded-tr-none max-w-[85%] text-sm leading-relaxed border border-accent/20">
          <p>Show me my tasks for today.</p>
        </div>
      </div> -->
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-border bg-bg-card">
      <!-- Context Indicator -->
      <div v-if="contextTitle" class="mb-2 flex items-center gap-1.5">
        <span class="text-[10px] uppercase font-bold text-text-secondary tracking-wider">Context:</span>
        <div class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent/10 border border-accent/20 text-accent text-xs font-medium">
           <i class="fa-solid fa-layer-group text-[10px]"></i>
           {{ contextTitle }}
        </div>
      </div>
      
      <div class="relative">
        <textarea
          placeholder="Ask anything..."
          rows="1"
          class="w-full pl-4 pr-10 py-3 rounded-xl border border-border bg-bg-body focus:outline-none focus:border-accent resize-none text-sm transition-colors"
          @keydown.enter.prevent="sendMessage"
        ></textarea>
        <button class="absolute right-2 bottom-2 p-1.5 text-accent hover:text-accent-hover transition-colors rounded-lg hover:bg-accent/5">
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>
      <p class="text-[10px] text-text-secondary text-center mt-2">
        AI can make mistakes. Please verify important information.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useWorkspaceStore } from '../../../stores/workspace'

const props = defineProps<{ workspace?: any }>()
const workspaceStore = useWorkspaceStore()
const route = useRoute()

// Calculate context based on route params and workspace lanes
// Calculate context based on route params and workspace lanes
const contextTitle = computed(() => {
  const routeName = (route.name as string)?.toLowerCase()
  if (!routeName) return 'Workspace'

  // Handle static/known routes
  if (routeName.includes('peak')) return 'Project Overview'
  if (routeName.includes('plan')) return 'Project Plan'
  if (routeName.includes('process')) return 'Process'
  if (routeName.includes('people')) return 'People'
  if (routeName.includes('more')) return 'More'

  // Handle dynamic modules via ID
  const moduleId = route.params.module_id || route.params.job_id
  
  if (moduleId && props.workspace?.lanes) {
    const lane = props.workspace.lanes.find((l: any) => l._id === moduleId)
    if (lane?.variables?.['lane-title']) {
       return lane.variables['lane-title']
    }
  }

  // Fallback
  return 'Workspace'
})

function closeHandler() {
  workspaceStore.toggleChatBotPanel()
}

function sendMessage() {
  // detailed implementation will come later
  console.log('Sending message...')
}
</script>

<style scoped>
/* Custom scrollbar for chat area */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: var(--border-color, #e5e7eb);
  border-radius: 20px;
}
</style>
