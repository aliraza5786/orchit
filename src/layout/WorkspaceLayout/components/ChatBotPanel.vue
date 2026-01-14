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
      </h5>
      <i
        class="cursor-pointer text-text-primary fa-solid fa-close transition-colors"
        @click="closeHandler"
      ></i>
    </div>

    <!-- Chat Area -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      <!-- Chat History Loader -->
      <div v-if="isHistoryLoading" class="flex items-center justify-center h-full">
        <div class="flex flex-col items-center gap-3">
          <div class="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin"></div>
          <p class="text-sm text-text-secondary">Loading chat history...</p>
        </div>
      </div>

      <!-- Chat Messages -->
      <template v-else>
       <div
  v-for="(msg, idx) in chatHistory"
  :key="idx"
  class="flex gap-2 relative"
  :class="msg.sender === 'me' ? 'flex-row-reverse' : ''"
>
  <!-- Avatar -->
  <div
    class="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
    :class="msg.sender === 'me' ? 'bg-bg-surface' : 'bg-accent/10'"
  >
    <i v-if="msg.sender === 'ai'" class="fa-solid fa-robot text-accent text-sm"></i>
    <div v-else class="text-xs font-semibold">ME</div>
  </div>

  <!-- Message bubble -->
  <div
    class="px-3 py-1.5 rounded-lg max-w-[85%] text-sm leading-relaxed border relative"
    :class="msg.sender === 'me'
      ? 'bg-accent/10 border-accent/20 rounded-tr-none'
      : 'bg-bg-body border-border rounded-tl-none'"
  >
    <p>{{ msg.text }}</p>

    <!-- Timestamp and status -->
    <div class="flex justify-end items-center gap-1 text-[10px] text-text-secondary mt-0.5">
      <span>{{ formatTimestamp(msg.timestamp) }}</span>
      <span v-if="msg.sender === 'me'">
        <i
          v-if="msg.status === 'completed'"
          class="fa-solid fa-check-double text-green-500"
        ></i>
        <i
          v-else
          class="fa-solid fa-check text-text-secondary"
        ></i>
      </span>
    </div>
  </div>
</div>


        <!-- Sending Loader -->
        <div v-if="isSending" class="flex gap-3 animate-pulse">
          <div class="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <i class="fa-solid fa-robot text-accent text-sm"></i>
          </div>
          <div class="bg-bg-body p-3 rounded-lg rounded-tl-none max-w-[85%] text-sm leading-relaxed border border-border">
            <p>AI is typing...</p>
          </div>
        </div>
      </template>
    </div>
    <!-- Input Area -->
    <div class="p-4 border-t border-border bg-bg-card">
      <!-- Context and Preview Button -->
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
          class="py-1 px-2 text-white bg-accent rounded-lg"
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
          @keydown.enter.prevent="sendMessage"
        ></textarea>
        <button
          @click="sendMessage"
          class="absolute right-2 bottom-2 p-1.5 text-accent hover:text-accent-hover transition-colors rounded-lg hover:bg-accent/5"
        >
          <i class="fa-solid fa-paper-plane"></i>
        </button>
      </div>

      <p class="text-[10px] text-text-secondary text-center mt-2">
        AI can make mistakes. Please verify important information.
      </p>
    </div>
  </div>

  <!-- Preview Modal -->
  <ChatBotPreviewModal
    v-model="showAIPreview"
    @accept="showAIPreview = false"
    @decline="showAIPreview = false"
    :data="Lists"
    :title="contextTitle"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import { useWorkspaceStore } from "../../../stores/workspace";
import ChatBotPreviewModal from "./ChatBotPreviewModal.vue";
import { usePeopleList } from "../../../queries/usePeople";
import { useRouteIds } from "../../../composables/useQueryParams";
import { useAgentChatMessage, useChatHistory } from "../../../queries/useAgent";

// --- TYPES ---
interface ChatMessage {
  _id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    status?: string;
  };
}

interface ChatSession {
  _id: string;
  session_id: string;
  context: {
    module_id: string | null;
    sheet_id: string | null;
    lane_id: string | null;
    card_id: string | null;
  };
  messages: ChatMessage[];
  created_at: string;
}

interface ChatHistoryResponse {
  data?: {
    data?:{
      data?: {
      chats?: ChatSession[];
      pagination?: {
        total: number;
        limit: number;
        skip: number;
      };
    };
    }
    
  };
}


// --- STATE ---
const workspaceStore = useWorkspaceStore();
const route = useRoute();
const showAIPreview = ref(false);
const userMessage = ref("");
const chatHistory = ref<{ sender: "me" | "ai"; text: string, timestamp: string, status: string }[]>([]);
const isSending = ref(false);

// --- ROUTE & PEOPLE LIST ---
const { workspaceId, moduleId } = useRouteIds();
const selected_view_id = ref("team");
const { data: Lists, refetch: refetchList } = usePeopleList(workspaceId.value, selected_view_id);
watch(Lists, () => refetchList());

// --- CONTEXT TITLE ---
const contextTitle = computed(() => {
  const routeName = (route.name as string)?.toLowerCase() || "workspace";

  if (routeName.includes("peak")) return "Peak";
  if (routeName.includes("plan")) return "Plan";
  if (routeName.includes("process")) return "Process";
  if (routeName.includes("people")) return "People";
  if (routeName.includes("more")) return "More";
  if (routeName.includes("pin")) return "Pin";

  const moduleId = route.params.module_id || route.params.job_id;
  if (moduleId && Lists?.value?.workspace?.lanes) {
    const lane = Lists.value.workspace.lanes.find((l: any) => l._id === moduleId);
    if (lane?.variables?.["lane-title"]) return lane.variables["lane-title"];
  }

  return "Workspace";
});

// --- HANDLERS ---
function closeHandler() {
  workspaceStore.toggleChatBotPanel();
}

// --- AGENT CHAT MUTATION ---
const { mutateAsync: sendToAI } = useAgentChatMessage();
function formatTimestamp(ts?: string) {
  if (!ts) return "";
  const date = new Date(ts);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// --- CHAT HISTORY QUERY ---
const { refetch: fetchHistory, isFetching: isHistoryLoading, refetch: refetchHistory } = useChatHistory(workspaceId.value);
// const { refetch: fetchEntities } = useCreatedEntities(workspaceId.value);
 const fetchChatsHistory = async() =>{
  try {
      const res = await fetchHistory() as ChatHistoryResponse;
      const chats = res?.data?.data?.data?.chats ?? [];
      const messages: { sender: "me" | "ai"; text: string, timestamp: string, status: string }[] = [];
      
      chats.forEach((chat: ChatSession) => {
        if (chat.messages && Array.isArray(chat.messages)) {
          chat.messages.forEach((msg: ChatMessage) => {
            messages.push({
              sender: msg.type === "user" ? "me" : "ai",
              text: msg.content,
              timestamp: msg.timestamp,
              status: msg.metadata?.status ?? "pending" 
            });
          });
        }
      });

      // Reverse the order so latest messages appear last
      chatHistory.value = messages.reverse();
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    }
 }
fetchChatsHistory();
// --- SEND MESSAGE ---
async function sendMessage() {
  const message = userMessage.value.trim();
  if (!message || !workspaceId.value) return;

  // Push user message locally
  // chatHistory.value.push({ sender: "me", text: message, timestamp:timestamp, status:status });
  userMessage.value = "";
  isSending.value = true;

  try {
    const response = await sendToAI({
      workspace_id: workspaceId.value,
      message,
      module_id: moduleId.value as string,
      lane_id: route.params.lane_id as string,
      sheet_id: route.params.sheet_id as string,
      card_id: route.params.card_id as string,
      session_id: route.params.session_id as string,
    });

    const aiText = response.data?.message || "Sorry, I didn't understand that.";
    const aiStatus = response.data?.status || "Processing";
    chatHistory.value.push({ sender: "ai", text: aiText, timestamp: "", status:aiStatus });
    if(response.data){
     await refetchHistory();
    }
  } catch (err) {
    // chatHistory.value.push({ sender: "ai", text: "Error: Failed to send message." });
    console.error(err);
  } finally {
    isSending.value = false;
  }
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