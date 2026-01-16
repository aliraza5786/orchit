<template>
  <div
    :class="[
      'max-w-[358px] flex-grow rounded-[6px] overflow-hidden relative transition-all flex flex-col',
      'text-text-primary bg-bg-card',
      workspaceStore.showChatBotPanel
        ? 'translate-x-0 min-w-full sm:min-w-[380px] w-full h-full'
        : 'translate-x-[200%] !max-w-0 h-0 hidden',
    ]"
  >
    <!-- Header -->
    <div class="flex justify-between items-center border-b border-border px-5 py-4.5 sticky top-0 bg-bg-card z-10">
      <h5 class="text-[16px] font-medium flex items-center gap-2">
        <i class="fa-solid fa-sparkles text-accent"></i>
        Ask Ai
        <div class="flex items-center gap-2">
          <span
            class="w-2 h-2 rounded-full"
            :class="isSocketConnected ? 'bg-green-500' : 'bg-red-500'"
          ></span>
        </div>
      </h5>
      <i
        class="cursor-pointer text-text-primary fa-solid fa-close transition-colors"
        @click="closeHandler"
      ></i>
    </div>

    <!-- Chat Area -->
    <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <template v-if="orderedMessages.length">
        <div
          v-for="msg in orderedMessages"
          :key="msg._id"
          class="flex gap-2 relative animate-fade-in"
          :class="msg.type === 'user' ? 'flex-row-reverse' : ''"
        >
          <!-- Avatar -->
          <div
            class="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
            :class="msg.type === 'user' ? 'bg-bg-surface' : 'bg-accent/10'"
          >
            <i
              v-if="msg.type === 'assistant' && msg.metadata?.status === 'thinking'"
              class="fa-solid fa-robot text-accent text-sm"
            ></i>
            <div v-else-if="msg.type === 'user'" class="text-xs font-semibold text-accent">ME</div>
          </div>

          <!-- Message bubble -->
          <div
            class="px-3 py-1.5 rounded-lg max-w-[85%] text-sm leading-relaxed border relative"
            :class="msg.type === 'user'
              ? 'bg-accent/10 border-accent/20 rounded-tr-none'
              : 'bg-bg-body border-border rounded-tl-none'"
          >
            <!-- AI Thinking Bubble -->
            <template v-if="msg.type === 'assistant' && msg.metadata?.status === 'thinking'">
              <div class="flex items-center gap-1">
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span class="text-xs text-text-secondary ml-2">AI is thinking...</span>
              </div>
            </template>

            <!-- Normal message -->
            <template v-else>
              <p class="whitespace-pre-wrap">{{ msg.content }}</p>
              <div class="flex justify-end items-center gap-1 text-[10px] text-text-secondary mt-0.5">
                <span>{{ formatTimestamp(msg.timestamp) }}</span>
                <span v-if="msg.type === 'user'">
                  <i
                    v-if="msg.metadata?.status === 'completed'"
                    class="fa-solid fa-check-double text-green-500"
                  ></i>
                  <i
                    v-else
                    class="fa-solid fa-check text-text-secondary"
                  ></i>
                </span>
              </div>
            </template>
          </div>
        </div>
      </template>

      <!-- Empty state -->
      <div v-else class="flex flex-col items-center justify-center h-full text-text-secondary">
        <i class="fa-solid fa-comments text-4xl mb-2 opacity-50"></i>
        <p class="text-sm">No messages yet. Start a conversation!</p>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-border bg-bg-card">
      <div v-if="contextTitle" class="mb-2 flex justify-between items-center gap-1.5">
        <nav class="flex items-center text-xs text-text-secondary gap-2">
          <div class="flex items-center gap-1 font-medium text-text-primary">
            <span>{{ contextTitle }}</span>
          </div>
          <span><i class="fa-solid fa-chevron-right text-xs"></i></span>
          <div class="flex items-center gap-1"><span>Sheet</span></div>
          <span><i class="fa-solid fa-chevron-right text-xs"></i></span>
          <div class="flex items-center gap-1"><span>Cards</span></div>
        </nav>
        <button
          @click="showAIPreview = !showAIPreview"
          class="py-1 px-2 text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors"
        >
          <i class="fa-regular fa-eye text-sm"></i> Preview
        </button>
      </div>

      <div class="relative">
        <textarea
          v-model="userMessage"
          placeholder="Ask anything..."
          rows="1"
          class="w-full pl-4 pr-10 py-3 rounded-xl border border-border bg-bg-body focus:outline-none focus:border-accent resize-none text-sm transition-colors"
          @keydown.enter.prevent="sendMessage()"
          :disabled="agentStore.isSending"
        ></textarea>
        <button
          @click="sendMessage()"
          :disabled="!userMessage.trim() || agentStore.isSending"
          class="absolute right-2 bottom-2 p-1.5 text-accent hover:text-accent-hover transition-colors rounded-lg hover:bg-accent/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i 
            class="fa-solid"
            :class="agentStore.isSending ? 'fa-spinner fa-spin' : 'fa-paper-plane'"
          ></i>
        </button>
      </div>

      <p class="text-[10px] text-text-secondary text-center mt-2">
        AI can make mistakes. Please verify important information.
      </p>
    </div>
  </div>

  <ChatBotPreviewModal
    v-model="showAIPreview"
    @accept="showAIPreview = false"
    @decline="showAIPreview = false"
    :data="Lists"
    :title="contextTitle"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount, nextTick, onMounted } from "vue";
import { useRoute } from "vue-router";
import { io, Socket } from "socket.io-client";
import { useWorkspaceStore } from "../../../stores/workspace";
import { usePeopleList } from "../../../queries/usePeople";
import { useRouteIds } from "../../../composables/useQueryParams";
import { useAgentStore } from "../../../stores/agentStore";

const workspaceStore = useWorkspaceStore();
const route = useRoute();
const showAIPreview = ref(false);
const userMessage = ref("");
const chatContainer = ref<HTMLElement | null>(null);
const socket = ref<Socket | null>(null);
const isSocketConnected = ref(false);
const socketURL = import.meta.env.VITE_SOCKET_IO_URL || "https://backend.streamed.space";
const isAiThinkingBubbleVisible = ref(false);
const { workspaceId, moduleId } = useRouteIds();
const selected_view_id = ref("team");
const { data: Lists, refetch: refetchList } = usePeopleList(workspaceId.value, selected_view_id);
const agentStore = useAgentStore();

watch(Lists, () => refetchList());

const contextTitle = computed(() => {
  const routeName = (route.name as string)?.toLowerCase() || "workspace";
  if (routeName.includes("peak")) return "Peak";
  if (routeName.includes("plan")) return "Plan";
  if (routeName.includes("process")) return "Process";
  if (routeName.includes("people")) return "People";
  if (routeName.includes("more")) return "More";
  if (routeName.includes("pin")) return "Pin";

  const modId = route.params.module_id || route.params.job_id;
  if (modId && Lists?.value?.workspace?.lanes) {
    const lane = Lists.value.workspace.lanes.find((l: any) => l._id === modId);
    if (lane?.variables?.["lane-title"]) return lane.variables["lane-title"];
  }
  return "Workspace";
});

const refreshKey = ref(0);

const orderedMessages = computed(() => {
  refreshKey.value; // force recompute
  if (!Array.isArray(agentStore.chatHistory)) return [];
  const messages = agentStore.chatHistory.flatMap(s => s.messages || [])
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (isAiThinkingBubbleVisible.value) {
    messages.push({ _id: 'ai-thinking-' + Date.now(), type: 'assistant', content: '', metadata: { status: 'thinking' }, timestamp: new Date().toISOString() });
  }

  return messages;
});

function closeHandler() {
  workspaceStore.toggleChatBotPanel();
}

function scrollToBottom() {
  nextTick(() => {
    if (chatContainer.value) chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  });
}

/* ================= SOCKET INIT ================= */
function initSocket() {
  const token = localStorage.getItem("token");
  if (!token || socket.value?.connected) return;

  socket.value = io(socketURL, { auth: { token }, transports: ["websocket", "polling"] });

  socket.value?.on("connect", () => {
  isSocketConnected.value = true;

  if (workspaceId.value) {
    socket.value?.emit("join-workspace", workspaceId.value);
  }
});


  socket.value.on("disconnect", () => {
    isSocketConnected.value = false;
  });
socket.value.on("realtime-update", async (data: any) => {
  console.log("📨 Realtime update received:", data);

  if (data.type === "agent-response") {
    console.log("🤖 Agent response received, fetching chat history...");
    
    // Keep the thinking bubble visible until history is fetched
    isAiThinkingBubbleVisible.value = true;

    await agentStore.fetchChatHistory(workspaceId.value, true);

    // Hide bubble once history is updated
    isAiThinkingBubbleVisible.value = false;

    // Scroll to bottom
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    });
  }
});

socket.value.onAny((event, data) => {
  console.log("📡 SOCKET EVENT:", event, data);
});

}
/* ================= SEND MESSAGE ================= */
async function sendMessage() {
  const message = userMessage.value.trim();
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

    // User message immediately visible
    await agentStore.fetchChatHistory(workspaceId.value);
    scrollToBottom();

    // Keep bubble visible until socket emits new update
  } catch (err) {
    console.error(err);
    isAiThinkingBubbleVisible.value = false;
    agentStore.isAiTyping = false;
  } finally {
    agentStore.isSending = false;
  }
}

watch(workspaceId, (newId, oldId) => {
  if (!newId) return;
  if (!socket.value) initSocket();
  else if (socket.value.connected) {
    if (oldId && oldId !== newId) socket.value.emit("leave-workspace", oldId);
    socket.value.emit("join-workspace", newId);
  }
}, { immediate: true });

watch(() => workspaceStore.showChatBotPanel, (isOpen) => {
  if (!workspaceId.value || !socket.value) return;
  if (isOpen) socket.value.emit("join-workspace", workspaceId.value);
  else socket.value.emit("leave-workspace", workspaceId.value);
});

const formatTimestamp = (ts?: string) => {
  if (!ts) return "";
  const date = new Date(ts);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

onMounted(() => initSocket());
// const pollInterval = ref<number | null>(null);

// onMounted(() => {
//   pollInterval.value = window.setInterval(async () => {
//     if (workspaceId.value) {
//       console.log("🔄 Polling chat history...");
//       await agentStore.fetchChatHistory(workspaceId.value, true);
//     }
//   }, 2000); // 2000ms = 2s
// });

// onBeforeUnmount(() => {
//   if (pollInterval.value) {
//     clearInterval(pollInterval.value);
//     pollInterval.value = null;
//   }
// });
onBeforeUnmount(() => {
  if (workspaceId.value && socket.value) socket.value.emit("leave-workspace", workspaceId.value);
  socket.value?.removeAllListeners();
  socket.value?.disconnect();
});
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
  background-color: #7D68C8;
  border-radius: 50%;
  opacity: 0.4;
  animation: typing-bounce 1.4s infinite ease-in-out;
}
.typing-dots span:nth-child(1) { animation-delay: -0.32s; }
.typing-dots span:nth-child(2) { animation-delay: -0.16s; }
@keyframes typing-bounce {
  0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
@keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in { animation: fade-in 0.3s ease-out; }
</style>
