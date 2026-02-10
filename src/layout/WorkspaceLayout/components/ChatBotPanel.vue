<template>
  <div
  v-if="workspaceStore.showChatBotPanel"
  :class="[
    'flex flex-col max-h-screen max-w-full w-full overflow-hidden bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px] shadow-[0_10px_40px_-10px_rgba(0,0,0,.5)] border border-orchit-white/5 transition-all duration-300 ease-in-out',
    isExpanded
      ? 'w-full min-w-[1200px]'
      : 'w-full sm:w-[380px] max-w-[380px] min-w-[380px]'
  ]"
>

    <!-- Header -->
    <div
      class="flex justify-between items-center border-b border-border px-5 py-4.5 sticky top-0 bg-bg-card z-30"
    >
      <h5 class="text-[16px] font-medium flex items-center gap-2">
        <i class="fa-solid fa-sparkles text-accent"></i>
        {{ moduleSelected && moduleSelected?.length > 20 ? moduleSelected?.slice(0,20) + '...':moduleSelected }}
        <div class="flex items-center gap-2">
          <span
            class="w-2 h-2 rounded-full"
            :class="isSocketConnected ? 'bg-green-500' : 'bg-red-500'"
          ></span>
        </div>
      </h5>
      <div class="flex items-center gap-3 shrink-0">
  <!-- Expand Toggle -->
  <i
    class="fa-solid cursor-pointer transition-colors"
    :class="isExpanded ? 'fa-compress' : 'fa-expand'"
    @click="isExpanded = !isExpanded"
  ></i>
<button class="cursor-pointer" label="Configure Ai" @click="showConfigModal = true">
  <i class="fa-regular fa-ellipsis-vertical"></i>
</button>
  <!-- Close -->
  <i
    class="cursor-pointer text-text-primary fa-solid fa-close transition-colors"
    @click="closeHandler"
  ></i>
</div>
    </div>
    <!-- Chat Area -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
      <template v-if="orderedMessages.length || isAiThinkingBubbleVisible">
        <div
          v-for="msg in orderedMessages"
          :key="msg._id"
          class="flex gap-2 relative animate-fade-in"
          :class="msg.type === 'user' ? 'flex-row-reverse' : ''"
        >
          <!-- Avatar -->
          <div
            class="w-6 h-6 rounded-full p-1.5 flex items-center justify-center shrink-0"
            :class="msg.type === 'user' ? 'bg-bg-surface' : 'bg-accent/10'"
          >
            <i
              v-if="msg.type === 'assistant'"
              class="fa-solid fa-robot text-accent text-sm"
            ></i>
            <div
              v-else-if="msg.type === 'user'"
              class="text-xs font-semibold text-accent"
            >
              ME
            </div>
          </div>

          <!-- Message bubble -->
          <div
            class="px-3 py-1.5 rounded-lg max-w-[85%] text-sm leading-relaxed border relative"
            :class="
              msg.type === 'user'
                ? 'bg-accent/10 border-accent/20 rounded-tr-none'
                : 'bg-bg-body border-border rounded-tl-none'
            "
          >
            <p class="whitespace-pre-wrap">{{ msg.content }}</p>
            <div
              class="flex justify-end items-center gap-1 text-[10px] text-text-secondary mt-0.5"
            >
              <span>{{ formatTimestamp(msg.timestamp) }}</span>
              <span v-if="msg.type === 'user'">
                <i
                  v-if="msg.metadata?.status === 'completed'"
                  class="fa-solid fa-check-double text-green-500"
                ></i>
                <i v-else class="fa-solid fa-check text-text-secondary"></i>
              </span>
            </div>
          </div>
        </div>

        <!-- AI Thinking Bubble (separate from messages) -->
        <div
          v-if="isAiThinkingBubbleVisible"
          class="flex gap-2 relative animate-fade-in"
        >
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-accent/10"
          >
            <i class="fa-solid fa-robot text-accent text-sm"></i>
          </div>
          <div
            class="px-3 py-1.5 rounded-lg max-w-[85%] text-sm leading-relaxed border bg-bg-body border-border rounded-tl-none"
          >
            <div class="flex items-center gap-1">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span class="text-xs text-text-secondary ml-2"
                >AI is thinking...</span
              >
            </div>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div
        v-else
        class="flex flex-col items-center justify-center h-full text-text-secondary"
      >
        <i class="fa-solid fa-comments text-4xl mb-2 opacity-50"></i>
        <p class="text-sm">No messages yet. Start a conversation!</p>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-border bg-bg-card">
      <div
        v-if="contextTitle"
        class="mb-2 flex justify-between items-center gap-1.5"
      >
        <nav class="flex items-center text-xs text-text-secondary gap-2">
          <div class="flex items-center font-medium text-text-primary" v-if="!moduleId">
            <span>Workspace</span>
          </div>
          <span v-if="!moduleId"><i class="fa-solid fa-chevron-right text-xs"></i></span>
          <div class="flex items-center font-medium text-text-primary">
            <span>{{ contextTitle }}</span>
          </div>
          <div v-if="moduleId" class="flex">
            <span><i class="fa-solid fa-chevron-right text-xs"></i></span>
          <div class="flex items-center gap-1"><span>Sheet</span></div>
          <span><i class="fa-solid fa-chevron-right text-xs"></i></span>
          <div class="flex items-center gap-1"><span>Cards</span></div>
          </div>
        </nav>
        <button
          @click="showAIPreview = !showAIPreview"
          v-if="entities.length"
          class="py-1 px-2 text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors"
        >
          <i class="fa-regular fa-eye text-sm"></i> Preview
        </button>
      </div>
      <div class="relative">
        <textarea
          ref="autoTextarea"
          v-model="userMessage"
          placeholder="Ask anything..."
          rows="1"
          class="w-full pl-4 pr-10 py-3 rounded-xl border border-border bg-bg-body focus:outline-none focus:border-accent resize-none text-sm transition-colors overflow-y-auto"
          @keydown.enter.prevent="sendMessage()"
          @input="autoResize"
          :disabled="agentStore.isSending"
        ></textarea>
        <button
          @click="sendMessage()"
          :disabled="!userMessage.trim() || agentStore.isSending"
          class="absolute right-2 bottom-2 p-1.5 text-accent hover:text-accent-hover transition-colors rounded-lg hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i
            class="fa-solid"
            :class="
              agentStore.isSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'
            "
          ></i>
        </button>
      </div>

      <p class="text-[12px] text-text-secondary text-center mt-2">
        AI can make mistakes. Please verify important information.
      </p>
    </div>
  </div>
  <ChatBotPreviewModal
    v-model="showAIPreview"
    @accept="acceptChanges"
    @decline="declineAgentGeneratedEntities"
    :title="contextTitle"
    :data="entities"
  />
  <div
  v-if="showConfigModal"
  class="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
>
  <div
    class="bg-bg-card w-[900px] max-w-[95vw] max-h-[90vh] overflow-y-auto rounded-lg border border-border shadow-xl"
  >
    <!-- Header -->
    <div class="flex justify-between items-center px-6 py-4 border-b border-border">
      <h3 class="text-lg font-semibold">Configure Agent</h3>
      <i class="fa-solid fa-close cursor-pointer" @click="showConfigModal = false"></i>
    </div>

    <!-- Body -->
    <div class="p-6 space-y-6">

      <!-- Name -->
      <div>
        <label class="text-sm font-medium">Agent Name</label>
        <input v-model="agentConfig.name"
          class="mt-1 w-full border border-border bg-bg-body rounded px-3 py-2 text-sm"/>
      </div>

      <!-- Description -->
      <div>
        <label class="text-sm font-medium">Description</label>
        <textarea v-model="agentConfig.description"
          rows="2"
          class="mt-1 w-full border border-border bg-bg-body rounded px-3 py-2 text-sm"/>
      </div>

      <!-- Instructions (System Prompt) -->
      <div>
        <label class="text-sm font-medium">Instructions</label>
        <textarea v-model="agentConfig.instructions"
          rows="4"
          placeholder="How should the AI behave?"
          class="mt-1 w-full border border-border bg-bg-body rounded px-3 py-2 text-sm"/>
      </div>

      <!-- Tone -->
      <div>
        <label class="text-sm font-medium">Tone</label>
        <select v-model="agentConfig.tone"
          class="mt-1 w-full border border-border bg-bg-body rounded px-3 py-2 text-sm">
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="balanced">Balanced</option>
          <option value="technical">Technical</option>
        </select>
      </div>

      <!-- Response Style -->
      <div>
        <label class="text-sm font-medium">Response Style</label>
        <select v-model="agentConfig.responseStyle"
          class="mt-1 w-full border border-border bg-bg-body rounded px-3 py-2 text-sm">
          <option value="concise">Concise</option>
          <option value="detailed">Detailed</option>
          <option value="step-by-step">Step by Step</option>
        </select>
      </div>

      <!-- Creativity -->
      <div>
        <label class="text-sm font-medium">Creativity (Temperature)</label>
        <input type="range" min="0" max="1" step="0.1"
          v-model="agentConfig.temperature"
          class="w-full mt-2"/>
        <p class="text-xs text-text-secondary">{{ agentConfig.temperature }}</p>
      </div>

      <!-- Permissions -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Capabilities</label>

        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="agentConfig.allowWorkspaceData"/>
          Access Workspace Data
        </label>

        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="agentConfig.allowWeb"/>
          Web Browsing
        </label>
      </div>

    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-3 px-6 py-4 border-t border-border">
      <button class="px-4 py-2 border border-border rounded"
        @click="showConfigModal = false">
        Cancel
      </button>

      <button class="px-4 py-2 bg-accent text-white rounded"
        @click="saveConfig">
        Save Configuration
      </button>
    </div>
  </div>
</div>

</template>

<script setup lang="ts">
import {
  ref,
  computed,
  watch,
  onBeforeUnmount,
  nextTick,
  onMounted,
  reactive,
} from "vue";
import { useRoute } from "vue-router";
import { io, Socket } from "socket.io-client";
import { useWorkspaceStore } from "../../../stores/workspace";
import { useRouteIds } from "../../../composables/useQueryParams";
import { useAgentStore } from "../../../stores/agentStore";
import ChatBotPreviewModal from "./ChatBotPreviewModal.vue";
import { toast } from "vue-sonner";
import { useSingleWorkspace } from "../../../queries/useWorkspace";
const workspaceStore = useWorkspaceStore();
const isExpanded = ref(false)
const route = useRoute();
const showAIPreview = ref(false);
const userMessage = ref("");
const socket = ref<Socket | null>(null);
const isSocketConnected = ref(false);
const socketURL = import.meta.env.VITE_SOCKET_IO_URL;
const isAiThinkingBubbleVisible = ref(false);
const { workspaceId, moduleId } = useRouteIds();
const agentStore = useAgentStore();
const autoTextarea = ref<HTMLTextAreaElement | null>(null)
const { refetch:refetchModules} = useSingleWorkspace(workspaceId.value)
const showConfigModal = ref(false)
const moduleSelected = computed(() =>{
  return workspaceStore.selectedAgent
})
const agentConfig = reactive({
  name: '',
  description: '',
  instructions: '',
  tone: 'balanced',
  responseStyle: 'concise',
  temperature: 0.7,
  allowWeb: false,
  allowWorkspaceData: true,
})

const autoResize = () => {
  const el = autoTextarea.value
  if (!el) return

  el.style.height = "auto"

  const maxHeight = 5 * 24 
  el.style.height = Math.min(el.scrollHeight, maxHeight) + "px"

  if (el.scrollHeight > maxHeight) {
    el.style.overflowY = "auto"
  } else {
    el.style.overflowY = "hidden"
  }
}

const contextTitle = computed(() => {
  const routeName = (route.name as string)?.toLowerCase() || "workspace";
  if (routeName.includes("peak")) return "Peak";
  if (routeName.includes("plan")) return "Plan";
  if (routeName.includes("process")) return "Process";
  if (routeName.includes("people")) return "People";
  if (routeName.includes("more")) return "More";
  if (routeName.includes("pin")) return "Pin";
  return "Workspace";
});
const entities = computed(() => agentStore.createdEntities);
const orderedMessages = computed(() => {
  if (!Array.isArray(agentStore.chatHistory)) return [];

  return agentStore.chatHistory
    .flatMap((s) => s.messages || [])
    .filter((msg) => msg.metadata?.status !== "thinking") // Filter out thinking status messages
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
});

function closeHandler() {
  workspaceStore.toggleChatBotPanel();
}

const messagesContainer = ref<HTMLElement | null>(null);

function scrollToBottom() {
  nextTick(() => {
    requestAnimationFrame(() => {
      const el = messagesContainer.value;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  });
}

onMounted(() => {
  scrollToBottom();
});

// Watch for new messages and hide thinking bubble
watch(
  () => orderedMessages.value.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && isAiThinkingBubbleVisible.value) {
      const lastMessage =
        orderedMessages.value[orderedMessages.value.length - 1];
      if (lastMessage?.type === "assistant") {
        isAiThinkingBubbleVisible.value = false;
        agentStore.isAiTyping = false;
      }
    }
    scrollToBottom();
  },
);

watch(
  () => isAiThinkingBubbleVisible.value,
  () => {
    scrollToBottom();
  },
);

function initSocket() {
  const token = localStorage.getItem("token");
  if (!token || socket.value?.connected) return;

  socket.value = io(socketURL, {
    auth: { token },
    transports: ["websocket", "polling"],
  });

  socket.value.on("connect", () => {
    isSocketConnected.value = true;
    if (workspaceId.value) {
      socket.value?.emit("join-workspace", workspaceId.value);
    }
  });

  socket.value.on("disconnect", () => {
    isSocketConnected.value = false;
  });

  // Listen to ALL realtime updates
  socket.value.on("realtime-update", async (data: any) => {
    if (data.type === "agent-response" || data.type === "message_complete") {
      isAiThinkingBubbleVisible.value = false;
      agentStore.isAiTyping = false;
      await agentStore.fetchChatHistory(workspaceId.value, true);
      await agentStore.fetchCreatedEntities(workspaceId.value, true);
      scrollToBottom();
    }
  });

  socket.value.onAny((eventName, ...args) => {
    console.log("Socket event:", eventName, args);
  });
}
async function sendMessage() {
  const message = userMessage.value?.trim();
  if (!message || !workspaceId.value || agentStore.isSending) return;

  userMessage.value = "";
  isAiThinkingBubbleVisible.value = true;
  agentStore.isSending = true;
  agentStore.isAiTyping = true;

  scrollToBottom();

  try {
    await agentStore.sendMessage({
      workspace_id: workspaceId.value,
      message,
      module_id: moduleId.value as string,
      lane_id: route.params.lane_id as string,
      sheet_id: route.params.sheet_id as string,
      card_id: route.params.card_id as string,
      session_id: route.params.session_id as string,
    });

    // Fetch both chat history and entities incrementally
    await Promise.all([
      agentStore.fetchChatHistory(workspaceId.value),
      agentStore.fetchCreatedEntities(workspaceId.value, false), // incremental fetch
    ]);

    scrollToBottom();
    isAiThinkingBubbleVisible.value = false;
    agentStore.isAiTyping = false;

  } catch (err) {
    console.error("Error sending message:", err);
    isAiThinkingBubbleVisible.value = false;
    agentStore.isAiTyping = false;
  } finally {
    agentStore.isSending = false;
  }
}
async function acceptChanges(payload: any) {
  await agentStore.acceptEntities(payload);
  showAIPreview.value = false;
  refetchModules();
}
async function declineAgentGeneratedEntities(){
  await agentStore.declineSuggestedEntities(workspaceId.value);
  showAIPreview.value =false;
  toast.success("Preview entities has been rejected and deleted")
}
watch(
  workspaceId,
  (newId, oldId) => {
    if (!newId) return;
    if (!socket.value) {
      initSocket();
    } else if (socket.value.connected) {
      if (oldId && oldId !== newId) {
        socket.value.emit("leave-workspace", oldId);
      }
      socket.value.emit("join-workspace", newId);
    }
  },
  { immediate: true },
);

watch(
  () => workspaceStore.showChatBotPanel,
  (isOpen) => {
    if (!workspaceId.value || !socket.value) return;
    if (isOpen) {
      socket.value.emit("join-workspace", workspaceId.value);
      // Fetch chat history when panel opens
      agentStore.fetchChatHistory(workspaceId.value, true);
      agentStore.fetchCreatedEntities(workspaceId.value, false);
    } else {
      socket.value.emit("leave-workspace", workspaceId.value);
    }
  },
);

const formatTimestamp = (ts?: string) => {
  if (!ts) return "";
  const date = new Date(ts);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

onMounted(() => {
  initSocket();
  if (workspaceId.value && workspaceStore.showChatBotPanel) {
    agentStore.fetchChatHistory(workspaceId.value, true);
    agentStore.fetchCreatedEntities(workspaceId.value, false);
  }
});

onBeforeUnmount(() => {
  if (workspaceId.value && socket.value) {
    socket.value.emit("leave-workspace", workspaceId.value);
  }
  socket.value?.removeAllListeners();
  socket.value?.disconnect();
});
function saveConfig() {
  console.log('Agent Config:', agentConfig)
  showConfigModal.value = false
}

</script>

<style scoped>
.typing-dots {
  display: flex;
  gap: 4px;
  align-items: center;
}
.typing-dots span {
  width: 6px;
  height: 6px;
  background-color: #7d68c8;
  border-radius: 50%;
  opacity: 0.4;
  animation: typing-bounce 1.4s infinite ease-in-out;
}
.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}
.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}
@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}
</style>
