<template>
  <div
  v-if="workspaceStore.showChatBotPanel"
    :class="[
        'flex h-full overflow-y-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px] border border-orchit-white/5 overflow-x-hidden transition-all duration-300 ease-in-out',
        isExpanded
          ? 'min-w-full max-w-full overflow-x-hidden'
          : 'min-w-full max-w-[380px] sm:min-w-[380px]',
      ]"
      role="complementary"
      aria-label="Details panel"
  >
    <!-- CONFIG PANEL -->
   <div
  v-if="isExpanded"
  class="w-1/2 border-r border-border bg-bg-card h-full min-h-0 flex flex-col overflow-y-hidden pb-4 pt-2"
>
  <!-- HEADER -->
  <div class="px-6 pb-1.5 border-b border-border">
    <div class="flex justify-center">
      <div class="flex gap-1 bg-bg-body border border-border rounded-lg p-1 w-fit">
        <button
          class="px-5 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
          :class="activeTab==='create'
            ? 'bg-accent border border-accent text-white shadow-sm'
            : 'text-text-secondary hover:text-text-primary'"
          @click="activeTab='create'"
        >
          Create
        </button>

        <button
          class="px-5 py-1.5 text-sm font-medium rounded-md transition-all duration-200"
          :class="activeTab==='config'
            ? 'bg-accent border border-accent text-white shadow-sm'
            : 'text-text-secondary hover:text-text-primary'"
          @click="activeTab='config'"
        >
          Configure
        </button>
      </div>
    </div>
  </div>

  <!-- BODY -->
  <div class="flex-1 overflow-y-auto p-6 space-y-8">

    <!-- CREATE TAB FORM -->
    <div v-if="activeTab === 'create'" class="space-y-8">
      <!-- Agent Name -->
      <div class="space-y-2.5">
        <label class="text-sm font-semibold text-text-primary block">Agent Name</label>
        <input
          v-model="agentConfig.name"
          class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-all"
          placeholder="Enter agent name"
        />
      </div>

      <!-- Description -->
      <div class="space-y-2.5">
        <label class="text-sm font-semibold text-text-primary block">Description</label>
        <textarea
          v-model="agentConfig.description"
          rows="3"
          class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-all resize-none"
          placeholder="Brief description of your Agent"
        />
      </div>

      <!-- Instructions -->
      <div class="space-y-2.5">
        <label class="text-sm font-semibold text-text-primary block">Instructions</label>
        <textarea
          v-model="agentConfig.instructions"
          rows="4"
          class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-all resize-none"
          placeholder="How should the AI behave?"
        />
      </div>

      <!-- Conversation Starters -->
      <div class="space-y-2.5">
        <label class="text-sm font-semibold text-text-primary block">Conversation Starters</label>
        <div class="space-y-2.5">
          <div
            v-for="(starter, index) in agentConfig.conversationStarters"
            :key="starter"
            class="flex gap-3 items-center"
          >
            <input
              v-model="agentConfig.conversationStarters[index]"
              class="flex-1 border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-all"
              placeholder="Add a conversation starter"
            />
            <button
              @click="agentConfig.conversationStarters.splice(index, 1)"
              class="px-3 py-2.5 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              Remove
            </button>
          </div>
          <button
            @click="agentConfig.conversationStarters.push('')"
            class="w-full mt-2 px-4 py-2.5 text-sm font-medium bg-bg-body border border-border rounded-lg hover:bg-bg-card transition-colors"
          >
            + Add Starter
          </button>
        </div>
      </div>

      <!-- Knowledge -->
      <div class="space-y-2.5">
        <label class="text-sm font-semibold text-text-primary block">Knowledge</label>
        <div class="space-y-3">
          <!-- File Input -->
          <input
            type="file"
            multiple
            @change="handleKnowledgeUpload"
            class="w-full border-2 border-dashed border-border bg-bg-body rounded-lg px-4 py-3 text-sm cursor-pointer hover:border-accent transition-colors"
          />

          <!-- Uploaded files list -->
          <div v-if="agentConfig.knowledge.length" class="space-y-2">
            <div
              v-for="(file, index) in agentConfig.knowledge"
              :key="index"
              class="flex items-center justify-between gap-3 bg-bg-body border border-border rounded-lg px-4 py-2.5 hover:bg-bg-card transition-colors"
            >
              <span class="truncate text-sm text-text-primary">{{ file.name }}</span>
              <button
                @click="removeKnowledge(index)"
                class="px-3 py-1.5 text-red-500 text-sm font-medium rounded hover:bg-red-50 transition-colors whitespace-nowrap"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Capabilities -->
      <div class="space-y-2.5">
        <label class="text-sm font-semibold text-text-primary block">Capabilities</label>
        <div class="space-y-3">
          <div
            v-for="capability in availableCapabilities"
            :key="capability.value"
            class="flex items-center gap-3"
          >
            <input
              type="checkbox"
              :value="capability.value"
              v-model="agentConfig.capabilities"
              class="h-4 w-4 rounded border-border cursor-pointer"
            />
            <span class="text-sm text-text-primary">{{ capability.label }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="space-y-2.5">
        <label class="text-sm font-semibold text-text-primary block">Actions</label>
        <div class="space-y-2.5">
          <div
            v-for="(action, index) in agentConfig.actions"
            :key="action"
            class="flex gap-3 items-center"
          >
            <input
              v-model="agentConfig.actions[index]"
              class="flex-1 border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-all"
              placeholder="Add action"
            />
            <button
              @click="agentConfig.actions.splice(index,1)"
              class="px-3 py-2.5 text-red-500 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
            >
              Remove
            </button>
          </div>
          <button
            @click="agentConfig.actions.push('')"
            class="w-full mt-2 px-4 py-2.5 text-sm font-medium bg-bg-body border border-border rounded-lg hover:bg-bg-card transition-colors"
          >
            + Add Action
          </button>
        </div>
      </div>
    </div>

    <!-- CONFIGURE TAB FORM -->
    <div v-else-if="activeTab === 'config'" class="space-y-8">
      <!-- Tone -->
      <div class="space-y-2.5">
        <label class="text-sm font-semibold text-text-primary block">Tone</label>
        <select
          v-model="agentConfig.tone"
          class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-all"
        >
          <option value="professional">Professional</option>
          <option value="friendly">Friendly</option>
          <option value="balanced">Balanced</option>
          <option value="technical">Technical</option>
        </select>
      </div>

      <!-- Response Style -->
      <div class="space-y-2.5">
        <label class="text-sm font-semibold text-text-primary block">Response Style</label>
        <select
          v-model="agentConfig.responseStyle"
          class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-all"
        >
          <option value="concise">Concise</option>
          <option value="detailed">Detailed</option>
          <option value="step-by-step">Step by Step</option>
        </select>
      </div>

      <!-- Creativity / Temperature -->
      <div class="space-y-3">
        <div class="flex justify-between items-center">
          <label class="text-sm font-semibold text-text-primary">Creativity (Temperature)</label>
          <span class="text-sm font-medium text-accent">{{ agentConfig.temperature }}</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          v-model="agentConfig.temperature"
          class="w-full h-2 bg-bg-body border border-border rounded-lg appearance-none cursor-pointer accent-accent"
        />
      </div>

      <!-- Capabilities Checkboxes -->
      <div class="space-y-3">
        <label class="text-sm font-semibold text-text-primary block">Capabilities</label>

        <label class="flex items-center gap-3 cursor-pointer hover:bg-bg-body p-2 rounded-lg transition-colors">
          <input type="checkbox" v-model="agentConfig.allowWorkspaceData" class="h-4 w-4 rounded border-border" />
          <span class="text-sm text-text-primary">Access Workspace Data</span>
        </label>

        <label class="flex items-center gap-3 cursor-pointer hover:bg-bg-body p-2 rounded-lg transition-colors">
          <input type="checkbox" v-model="agentConfig.allowWeb" class="h-4 w-4 rounded border-border" />
          <span class="text-sm text-text-primary">Web Browsing</span>
        </label>
      </div>
    </div>
  </div>
</div>
    <!-- CHAT PANEL WRAPPER -->
    <div
    v-show="!isExpanded || isExpanded"
     :class="`${isExpanded ? 'me-12 w-1/2 overflow-hidden' : 'me-0 w-full'}`"
  class="border-r border-border bg-bg-card h-full min-h-0 flex flex-col py-2"
>
    <!-- Header -->
    <div
      class="flex justify-between items-center border-b border-border px-5 py-3 sticky top-0 bg-bg-card z-30 overflow-x-hidden"
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
         <!-- Expand Icon -->
        <i
          v-if="!isExpanded"      
          class="fa-solid cursor-pointer transition-colors fa-expand"
          @click="expandPanel"
        ></i>

        <!-- Compress Icon -->
        <i
          v-else    
          class="fa-solid cursor-pointer transition-colors fa-compress"
          @click="compressPanel"
        ></i>

        <button
          class="cursor-pointer"
          @click="openConfigPanel"
        >
          <i class="fa-regular fa-ellipsis-vertical"></i>
        </button>

        <i
          class="cursor-pointer text-text-primary fa-solid fa-close transition-colors"
          @click="closeHandler"
        ></i>
      </div>
    </div>

    <!-- Chat Area (UNCHANGED) -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
      <!-- KEEPING YOUR FULL ORIGINAL CHAT CONTENT EXACTLY SAME -->
      <template v-if="orderedMessages.length || isAiThinkingBubbleVisible">
        <div
          v-for="msg in orderedMessages"
          :key="msg._id"
          class="flex gap-2 relative animate-fade-in"
          :class="msg.type === 'user' ? 'flex-row-reverse' : ''"
        >
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
              <span class="text-xs text-text-secondary ml-2">
                AI is thinking...
              </span>
            </div>
          </div>
        </div>
      </template>

      <div
        v-else
        class="flex flex-col items-center justify-center h-full text-text-secondary"
      >
        <i class="fa-solid fa-comments text-4xl mb-2 opacity-50"></i>
        <p class="text-sm">No messages yet. Start a conversation!</p>
      </div>
    </div>
 <div class="p-4 border-t border-border bg-bg-card">
      <div
        v-if="contextTitle"
        class="mb-2 flex justify-between items-center gap-1.5"
      >
        <nav class="flex items-center text-xs text-text-secondary gap-1">
          <div class="flex items-center font-medium text-text-primary" v-if="!moduleId">
            <span>Workspace</span>
          </div>
          <span v-if="!moduleId"><i class="fa-solid fa-chevron-right text-xs"></i></span>
          <div class="flex items-center font-medium text-text-primary">
            <span>{{ contextTitle }}</span>
          </div>
          <span v-if="moduleId"><i class="fa-solid fa-chevron-right text-xs"></i></span>
          <div class="flex items-center font-medium text-text-primary" v-if="moduleId">
            <span>{{ moduleSelected && moduleSelected?.length > 20 ? moduleSelected?.slice(0,10) + '...':moduleSelected }}</span>
          </div>
          <div v-if="moduleId" class="flex">
            <span><i class="fa-solid fa-chevron-right text-xs"></i></span>
          <div class="flex items-center gap-1"><span>Sheets</span></div>
          <!-- <span><i class="fa-solid fa-chevron-right text-xs"></i></span> -->
          <!-- <div class="flex items-center gap-1"><span>Cards</span></div> -->
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
  </div>

  <ChatBotPreviewModal
    v-model="showAIPreview"
    @accept="acceptChanges"
    @decline="declineAgentGeneratedEntities"
    :title="contextTitle"
    :data="entities"
  />
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

// Stores
const workspaceStore = useWorkspaceStore();
const agentStore = useAgentStore();

// Route
const route = useRoute();
const { workspaceId, moduleId } = useRouteIds();

// Refs
const isExpanded = ref(false);
const showConfigPanel = ref(false);
const showAIPreview = ref(false);
const userMessage = ref("");
const socket = ref<Socket | null>(null);
const isSocketConnected = ref(false);
const socketURL = import.meta.env.VITE_SOCKET_IO_URL;
const isAiThinkingBubbleVisible = ref(false);
const autoTextarea = ref<HTMLTextAreaElement | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);

// Tabs
const activeTab = ref<"create" | "config">("create");
onMounted(() => {
  workspaceStore.initSelectedAgent();
});
// Computed
const moduleSelected = computed(() => workspaceStore.selectedAgent);
const { refetch: refetchModules } = useSingleWorkspace(workspaceId.value)
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
    .filter((msg) => msg.metadata?.status !== "thinking")
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
});

// Auto resize textarea
const autoResize = () => {
  const el = autoTextarea.value;
  if (!el) return;

  el.style.height = "auto";

  const maxHeight = 5 * 24;
  el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";

  el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
};

// Scroll messages
function scrollToBottom() {
  nextTick(() => {
    requestAnimationFrame(() => {
      const el = messagesContainer.value;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    });
  });
}

// Watchers
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
  }
);

watch(
  () => isAiThinkingBubbleVisible.value,
  () => {
    scrollToBottom();
  }
);

// Socket
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

// Send Message
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

    await Promise.all([
      agentStore.fetchChatHistory(workspaceId.value),
      agentStore.fetchCreatedEntities(workspaceId.value, false),
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

// Accept / Decline
async function acceptChanges(payload: any) {
  await agentStore.acceptEntities(payload);
  showAIPreview.value = false;
  refetchModules();
}

async function declineAgentGeneratedEntities() {
  await agentStore.declineSuggestedEntities(workspaceId.value);
  showAIPreview.value = false;
  toast.success(
    "Preview entities has been rejected and deleted"
  );
}

// Close handler
function closeHandler() {
  workspaceStore.toggleChatBotPanel();
  workspaceStore.saveWorkspaceExpanded(false);
}

// Format timestamp
const formatTimestamp = (ts?: string) => {
  if (!ts) return "";
  const date = new Date(ts);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
};

// Lifecycle hooks
onMounted(() => {
  initSocket();
  if (workspaceId.value && workspaceStore.showChatBotPanel) {
    agentStore.fetchChatHistory(workspaceId.value, true);
    agentStore.fetchCreatedEntities(workspaceId.value, false);
  }
  scrollToBottom();
});

onBeforeUnmount(() => {
  if (workspaceId.value && socket.value) {
    socket.value.emit("leave-workspace", workspaceId.value);
  }
  socket.value?.removeAllListeners();
  socket.value?.disconnect();
});

// Config panel functions
const openConfigPanel = () => {
  if (!isExpanded.value) {
    
    isExpanded.value = !isExpanded.value;
    workspaceStore.saveWorkspaceExpanded(true)
  }
  showConfigPanel.value = !showConfigPanel.value;
};
const expandPanel = () =>{
  isExpanded.value = !isExpanded.value;
  workspaceStore.saveWorkspaceExpanded(true)
}
const compressPanel = () => {
  isExpanded.value = false;
  workspaceStore.saveWorkspaceExpanded(false);
};
// List of capabilities to show as checkboxes
const availableCapabilities = [
  { label: "Access Workspace Data", value: "workspaceData" },
  { label: "Web Browsing", value: "webBrowsing" },
  { label: "Execute Actions", value: "actions" },
  { label: "Summarize Documents", value: "summarizeDocs" },
  { label: "Answer Questions", value: "answerQuestions" },
];


interface AgentConfig {
  conversationStarters: string[];
  knowledge: File[];
  capabilities: string[];
  actions: string[];
  name: string;
  description: string;
  instructions: string;
  tone: 'professional' | 'friendly' | 'balanced' | 'technical';
  responseStyle: 'concise' | 'detailed' | 'step-by-step';
  temperature: number;
  allowWorkspaceData: boolean;
  allowWeb: boolean;
}

const agentConfig = reactive<AgentConfig>({
  conversationStarters: [''],
  knowledge: [],
  capabilities: [''],
  actions: [''],
  name: '',
  description: '',
  instructions: '',
  tone: 'professional',
  responseStyle: 'concise',
  temperature: 0.5,
  allowWorkspaceData: false,
  allowWeb: false
});

const handleKnowledgeUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files) return;
  for (const file of Array.from(target.files)) {
    agentConfig.knowledge.push(file);
  }
  // Clear input value so the same file can be uploaded again
  target.value = "";
};

// Remove file
const removeKnowledge = (index: number) => {
  agentConfig.knowledge.splice(index, 1);
};
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
