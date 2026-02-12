<template>
  <div
  v-if="workspaceStore.showChatBotPanel"
    :class="[
        'flex h-full overflow-y-auto bg-gradient-to-b from-bg-card/95 to-bg-card/90 backdrop-blur rounded-[6px] border border-border overflow-x-hidden transition-all duration-300 ease-in-out',
        isExpanded
          ? 'min-w-full max-w-full'
          : 'min-w-full max-w-[380px] sm:min-w-[380px]',
      ]"
      role="complementary"
      aria-label="Details panel"
  >
    <!-- CONFIG PANEL -->
   <div
  v-if="isExpanded && showConfigPanel"
  class="w-1/2 border-r border-border bg-bg-card h-full min-h-0 flex flex-col overflow-y-hidden pb-4 pt-2"
>
  <!-- HEADER -->
  <div class="px-6 py-2.5 bg-bg-card border-b border-border">
   <h3 class="text-lg text-text-primary font-semibold">
    Configure your Agent
   </h3>
   <p class="text-text-secondary text-sm">Configure your Agent according to your workspace.</p>
  <!-- TABS -->
  <div class="px-6 flex justify-center gap-6 text-sm pb-2">
    <button
      @click="activeTab='persona'"
      :class="activeTab==='persona'
        ? 'pt-3 border-b-2 border-accent text-accent font-bold'
        : 'pt-3 text-text-primary font-bold'">
      Agent
    </button>

    <button
      @click="activeTab='knowledge'"
      :class="activeTab==='knowledge'
        ? 'pt-3 border-b-2 border-accent text-accent font-bold'
        : 'pt-3 text-text-primary font-bold'">
      Knowledge Sources
    </button>

    <button
      @click="activeTab='upload'"
      :class="activeTab==='upload'
        ? 'pt-3 border-b-2 border-accent text-accent font-bold'
        : 'pt-3 text-text-primary font-bold'">
      Training Content
    </button>
  </div>
  </div>
<!-- BODY -->
<div class="flex-1 overflow-y-auto flex flex-col">

  <div class="p-6 space-y-8">

    <!-- ================= PERSONA TAB ================= -->
    <div v-if="activeTab==='persona'" class="space-y-6">
      <div class="space-y-1">
        <label class="text-sm text-text-primary">Agent Name</label>
        <input v-model="agentConfig.name"
          class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"/>
      </div>
      <div class="space-y-1">
        <label class="text-sm text-text-primary">Description</label>
        <textarea v-model="agentConfig.description"
          rows="4"
          class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"/>
      </div>
      <div class="space-y-1">
        <label class="text-sm text-text-primary">Role</label>
        <input v-model="agentConfig.role"
          class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"/>
      </div>
       <div class="space-y-1 relative" ref="levelRef">
  <label class="text-sm text-text-primary">Level</label>

  <!-- Trigger -->
  <button
    type="button"
    @click="openLevel = !openLevel"
    class="w-full flex justify-between items-center border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm mt-2"
  >
    <span>{{ selectedLevelLabel }}</span>

    <!-- Chevron -->
    <svg
      class="w-4 h-4 ml-3 flex-shrink-0 text-text-secondary"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <!-- Dropdown -->
  <div
    v-if="openLevel"
    class="absolute z-50 mt-1 w-full rounded-lg border border-border bg-bg-dropdown shadow-lg"
  >
    <ul class="py-1 text-sm">
      <li
        v-for="level in availableAgentsLevels"
        :key="level.value"
        @click="selectLevel(level.value)"
        class="px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover"
      >
        {{ level.title }}
      </li>
    </ul>
  </div>
</div>

      <!-- Array Sections Reused -->
      <div v-for="(label,group) in personaGroups":key="group" class="space-y-2.5">

        <label class="text-sm text-text-primary">{{label}}</label>

        <div v-for="(item,i) in getAgentArrayField(group)" :key="item"
          class="flex gap-3 mt-2">

          <input v-model="agentConfig[group][i]"
            class="flex-1 border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"/>

          <button @click="agentConfig[group].splice(i,1)"
            class="px-3 py-2.5 text-red-500 text-sm">Remove</button>

        </div>

        <button @click="agentConfig[group].push('')"
          class="w-full px-4 py-2.5 text-sm bg-bg-body border border-border rounded-lg">
          + Add
        </button>

      </div>

      <!-- Capabilities -->
      <div class="space-y-3">
        <label class="text-sm text-text-primary">Capabilities</label>
        <div v-for="capability in availableCapabilities"
          :key="capability.value"
          class="flex items-center gap-3 mt-2">
          <input type="checkbox"
            :value="capability.value"
            v-model="agentConfig.capabilities"
            class="h-4 w-4 rounded border-border"/>
          <span class="text-sm text-text-primary">
            {{ capability.label }}
          </span>
        </div>
      </div>
      <button
  @click="submitPersona"
  v-if="!agentsData"
  :disabled="isLoading || !agentConfig.name || !agentConfig.role"
  class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  <span v-if="isLoading">Saving...</span>
  <span v-else>Save Agent</span>
</button>
<div class="flex gap-4">
<button
  @click="submitPersona"
  v-if="agentsData"
  :disabled="isLoading || !agentConfig.name || !agentConfig.role"
  class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-red-600 text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  <span v-if="isLoading">Deleting...</span>
  <span v-else>Delete Agent</span>
</button>
<button
  @click="submitPersona"
  v-if="agentsData"
  :disabled="isLoading || !agentConfig.name || !agentConfig.role"
  class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  <span v-if="isLoading">Updating...</span>
  <span v-else>Update Agent</span>
</button>
</div>

    </div>

    <!-- ================= KNOWLEDGE TAB ================= -->
    <div v-if="activeTab==='knowledge'" class="space-y-6">

  <div class="space-y-1">
    <label class="text-sm text-text-primary">Source Type</label>
    <select v-model="knowledgeConfig.source_type"
      class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm">
      <option value="INTERNAL_TICKET">Internal Ticket</option>
      <option value="INTERNAL_MODULE">Internal Module</option>
      <option value="WEB_SEARCH">Web Search</option>
      <option value="PROMPT">Prompt</option>
    </select>
  </div>

  <div class="space-y-1">
    <label class="text-sm text-text-primary">Metadata (JSON)</label>
    <textarea v-model="knowledgeMetadataString"
      rows="4"
      class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"/>
  </div>

  <div class="flex items-center gap-3">
    <input type="checkbox" v-model="knowledgeConfig.is_active"/>
    <span class="text-sm text-text-primary">Active Source</span>
  </div>
  <button
    @click="submitKnowledge"
    :disabled="isKnowledgeLoading || !moduleId || !moduleSelected"
    class="w-full mt-4 px-4 py-2.5 text-sm rounded-lg cursor-pointer text-white bg-accent hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
  >
    <span v-if="isKnowledgeLoading">Saving...</span>
    <span v-else>Save Knowledge</span>
  </button>

</div>
    <!-- ================= TRAINING CONTENT TAB ================= -->
<div v-if="activeTab==='upload'" class="space-y-6">

  <!-- Training Name -->
  <div class="space-y-1">
    <label class="text-sm text-text-primary">Training Name</label>
    <input v-model="uploadConfig.name"
      class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"/>
  </div>

  <!-- Type -->
  <div class="space-y-1">
    <label class="text-sm text-text-primary">Type</label>
    <select v-model="uploadConfig.type"
      class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm">
      <option>TEXT</option>
      <option>URL</option>
      <option>CMS_PAGE</option>
      <option>MIXED</option>
    </select>
  </div>

  <!-- Training Text -->
  <div class="space-y-1">
    <label class="text-sm text-text-primary">Training Text</label>
    <textarea v-model="uploadConfig.text"
      rows="4"
      class="w-full border border-border bg-bg-body rounded-lg px-4 py-2.5 text-sm"/>
  </div>

  <!-- File Upload -->
  <input type="file" multiple
    @change="handleUploadFiles"
    class="w-full border-2 border-dashed border-border bg-bg-body rounded-lg px-4 py-3 text-sm"/>

  <!-- Uploaded Files List -->
  <div v-for="(file,i) in uploadConfig.files"
    :key="i"
    class="flex justify-between text-sm border border-border rounded-lg px-3 py-2">
    <span>{{file.name}}</span>
    <button @click="uploadConfig.files.splice(i,1)"
      class="text-red-500">Remove</button>
  </div>

  <!-- Save / Upload Button -->
  <button
    @click="submitTrainingContent"
    :disabled="!uploadConfig.name || (uploadConfig.text === '' && uploadConfig.files.length === 0) || isUploading"
    class="w-full mt-4 px-4 py-2.5 cursor-pointer text-sm bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <span v-if="isUploading">Uploading...</span>
    <span v-else>Upload Training Content</span>
  </button>

</div>
  </div>
</div>
</div>
    <!-- CHAT PANEL WRAPPER -->
    <div
  :class="(isExpanded && showConfigPanel)
    ? 'w-1/2 overflow-hidden me-5'
    : (isExpanded ? 'w-full me-5' : 'w-full me-0')"
  class="border-r border-border bg-bg-card h-full min-h-0 flex flex-col py-2 overflow-x-hidden"
>

    <!-- Header -->
    <div
      class="flex justify-between items-center border-b border-border px-5 py-3 sticky top-0 bg-bg-card z-30 overflow-x-hidden"
    >
      <h5 class="text-[16px] font-medium flex items-center gap-2">
        <i class="fa-solid fa-sparkles text-accent"></i>
        {{ moduleSelected && moduleSelected?.length > 20 ? moduleSelected?.slice(0,20) + '...':moduleSelected }}  Agent
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
          title="Expand"
        ></i>

        <!-- Compress Icon -->
        <i
          v-else    
          class="fa-solid cursor-pointer transition-colors fa-compress"
          @click="compressPanel"
          title="Compress"
        ></i>

        <button
          class="cursor-pointer"
          @click="openConfigPanel"
          title="Agent Configuration"
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
 <div class="px-4 py-2 border-t border-border bg-bg-card">
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
            <span>{{ moduleSelected && moduleSelected?.length > 10 ? moduleSelected?.slice(0,10) + '...':moduleSelected }}</span>
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
          v-if="hasPreviewableEntities"
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
          @keydown="handleKeydown"
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

      <p class="text-[13px] text-text-secondary text-center mt-2">
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
import { onClickOutside } from '@vueuse/core'
import { toast } from "vue-sonner";
import { useSingleWorkspace } from "../../../queries/useWorkspace";
import { useAuthStore } from "../../../stores/auth";
// Stores
const workspaceStore = useWorkspaceStore();
const agentStore = useAgentStore();
const authStore = useAuthStore()
// Route
const route = useRoute();
const { workspaceId, moduleId } = useRouteIds();
const activeTab = ref<'persona' | 'knowledge' | 'upload'>('persona')
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
const pendingMessages = ref<any[]>([]);
const agentsData = computed(() =>{
  return agentStore.agentSettings.agent;
})
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
const hasPreviewableEntities = computed(() => {
  if (!Array.isArray(entities.value)) return false;

  return entities.value.some((entity: any) => {
    // For read actions (fetch_data)
    if (entity.action === 'read') {
      const itemsLength = entity?.result?.items?.length || 0;
      const count = entity?.result?.count || 0;
      return itemsLength > 0 || count > 0;
    }
    
    // For create actions (create_module)
    if (entity.action === 'create') {
      const hasCards = entity?.payload?.cards?.length > 0;
      const hasSheets = entity?.payload?.sheets_preview?.length > 0;
      const totalCreated = entity?.result?.total_created || 0;
      return hasCards || hasSheets || totalCreated > 0;
    }
    
    return false;
  });
});
const orderedMessages = computed(() => {
  const historyMessages = Array.isArray(agentStore.chatHistory)
    ? agentStore.chatHistory
        .flatMap((s) => s.messages || [])
        .filter((msg) => msg.metadata?.status !== "thinking")
    : [];

  return [...historyMessages, ...pendingMessages.value].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime()
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
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Enter" && e.shiftKey) {
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    sendMessage();
  }
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
  const tempId = "temp-" + Date.now();

pendingMessages.value.push({
  _id: tempId,
  type: "user",
  content: message,
  timestamp: new Date().toISOString(),
  metadata: { status: "sending", temp: true }
});

  try {
    await agentStore.sendMessage({
      workspace_id: workspaceId.value,
      user_id:authStore.userId as string,
      message,
      module_id: moduleId.value as string,
      module_name:moduleSelected.value as string,
      lane_id: route.params.lane_id as string,
      sheet_id: route.params.sheet_id as string,
      card_id: route.params.card_id as string,
      session_id: route.params.session_id as string,
    });

    await Promise.all([
      agentStore.fetchChatHistory(workspaceId.value),
      agentStore.fetchCreatedEntities(workspaceId.value, false),
    ]);
    pendingMessages.value = [];
    scrollToBottom();
    isAiThinkingBubbleVisible.value = false;
    agentStore.isAiTyping = false;
  } catch (err) {
    console.error("Error sending message:", err);
    pendingMessages.value = pendingMessages.value.filter(
      (m) => !m.metadata?.temp
    );

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
  toast.success(
    "Preview entities has been accepted and applied to workspace"
  );
  refetchModules();
  agentStore.fetchCreatedEntities(workspaceId.value, false)
}

async function declineAgentGeneratedEntities() {
  await agentStore.declineSuggestedEntities(workspaceId.value);
  showAIPreview.value = false;
  toast.success(
    "Preview entities has been rejected and deleted"
  );
  refetchModules();
  agentStore.fetchCreatedEntities(workspaceId.value, false)
}

// Close handler
function closeHandler() {
  workspaceStore.toggleChatBotPanel();
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
    loadAgentSettings();
  }
  scrollToBottom();
});
watch(
  () => workspaceStore.showChatBotPanel,
  async (isOpen) => {
    if (!workspaceId.value) return;

    if (isOpen) {
      await agentStore.fetchChatHistory(workspaceId.value, true);
      await agentStore.fetchCreatedEntities(workspaceId.value, false);
      scrollToBottom();
      loadAgentSettings();
    }
  },
  { immediate: true } // ← runs on mount also
);

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
    isExpanded.value = true;
    showConfigPanel.value=true;
  }else if (isExpanded.value) {
    showConfigPanel.value = !showConfigPanel.value;
  }
};
const expandPanel = () =>{
  isExpanded.value = true;
}
const compressPanel = () => {
  isExpanded.value = false;
};
// List of capabilities to show as checkboxes
const availableCapabilities = [
  { label: "Web Browsing", value: "webBrowsing" },
  { label: "Workspace Knowledge", value: "workspaceData" },
  { label: "Module knowledge", value: "module_knowledge" },
  { label: "Sheet knowledge", value: "sheet_knowledge" },
  { label: "Tickets knowledge", value: "tickets_knowledge" },
  {label:"Docs, images, screenshots, text, videos, notes knowledge", value:"accept_knowldge"},
  {label: "Prompt knowledge", value:"prompt_knowledge"}
];

interface AgentConfig {
  name: string
  description:string
  role: string
  system_prompt: string
  level: 'JUNIOR' | 'MID' | 'SENIOR' | 'EXPERT' | 'LEAD'
  responsibilities: string[]
  skills: string[]
  competencies: string[]
  capabilities: string[]
  conditions_rules: string[]
}

const agentConfig = reactive<AgentConfig>({
  name: '',
  description:'',
  role: '',
  system_prompt: '',
  level: 'MID',
  responsibilities: [],
  skills: [],
  competencies: [],
  capabilities: [],
  conditions_rules: []
})

const openLevel = ref(false)
const levelRef = ref(null)

onClickOutside(levelRef, () => {
  openLevel.value = false
})
const availableAgentsLevels =[
   {_id:'1',title:'Expert', value:'EXPERT'},
   {_id:'2', title:'Lead', value:'LEAD'},
   { _id:'3', title:"Senior", value:"SENIOR"}, 
   {_id:'4', title:'Mid', value:'MID'}, 
   {_id:'5', title:'Junior', value:'JUNIOR'}, ]
const selectedLevelLabel = computed(() => {
  return (
    availableAgentsLevels.find(
      l => l.value === agentConfig.level
    )?.title || availableAgentsLevels[0].title
  )
})

const selectLevel = (value:string) => {
  agentConfig.level = value as any
  openLevel.value = false
}

watch(
  agentsData,
  (agent) => {
    if (!agent) return

    agentConfig.name = agent.name || ''
    agentConfig.description = agent.description || ''
    agentConfig.role = agent.role || ''
    agentConfig.system_prompt = agent.system_prompt || ''
    agentConfig.level = agent.level || 'MID'
    agentConfig.responsibilities = Array.isArray(agent.responsibilities) ? [...agent.responsibilities] : []
    agentConfig.skills = Array.isArray(agent.skills) ? [...agent.skills] : []
    agentConfig.competencies = Array.isArray(agent.competencies) ? [...agent.competencies] : []
    agentConfig.capabilities = Array.isArray(agent.capabilities) ? [...agent.capabilities] : []
    agentConfig.conditions_rules = Array.isArray(agent.conditions_rules) ? [...agent.conditions_rules] : []
  },
  { immediate: true } // populate immediately if agentsData already has value
)
interface KnowledgeConfig {
  module_id: string
  module_name: string
  source_type: "INTERNAL_TICKET" | "INTERNAL_MODULE" | "WEB_SEARCH" | "PROMPT"
  is_active: boolean
  metadata: Record<string, any>
}


const knowledgeConfig = reactive<KnowledgeConfig>({
  module_id: moduleId.value,
  module_name: moduleSelected.value,
  source_type: 'INTERNAL_TICKET',
  is_active: true,
  metadata: {}
})

const knowledgeMetadataString = computed({
  get: () => JSON.stringify(knowledgeConfig.metadata, null, 2),
  set: (val: string) => {
    try {
      knowledgeConfig.metadata = JSON.parse(val || '{}')
    } catch {
      console.warn('Invalid JSON metadata')
    }
  }
})

// submit knowlege
const isKnowledgeLoading = ref(false)

const submitKnowledge = async () => {
  if (!workspaceId.value) return
  isKnowledgeLoading.value = true

  try {
    await agentStore.trainKnowledge(workspaceId.value, knowledgeConfig)
    toast.success("Knowledge trained successfully!")

    // Clear fields after successful save
    knowledgeConfig.module_id = ''
    knowledgeConfig.module_name = ''
    knowledgeConfig.metadata = {}
    knowledgeConfig.source_type = 'INTERNAL_TICKET'
    knowledgeConfig.is_active = true

  } catch (err) {
    console.error(err)
    toast.error("Failed to train knowledge")
  } finally {
    isKnowledgeLoading.value = false
  }
}

/* ---------------- UPLOAD CONFIG ---------------- */

// Allowed types for training content
type UploadType =
  | 'TEXT'
  | 'URL'
  | 'CMS_PAGE'
  | 'MIXED'
  | 'UPLOAD'
  | 'INTERNAL_MODULE'
  | 'INTERNAL_SHEET'
  | 'INTERNAL_TICKET'
  | 'WEB_SEARCH'
  | 'PROMPT'

// Updated UploadConfig interface
interface UploadConfig {
  name: string
  text: string
  type: UploadType
  files: File[]
  module_id: string
  module_name: string
}

// Reactive object with default values
const uploadConfig = reactive<UploadConfig>({
  name: '',
  text: '',
  type: 'TEXT',
  files: [],
  module_id: '',
  module_name: ''
})

// File upload handler
const handleUploadFiles = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files) return

  const files = Array.from(target.files)
  uploadConfig.files.push(...files)

  // reset input so same file can be re-uploaded
  target.value = ''
}

// Loading state
const isUploading = ref(false)

// Submit function
const submitTrainingContent = async () => {
  if (!workspaceId.value) return

  // Validate
  if (!uploadConfig.name || (uploadConfig.text === '' && uploadConfig.files.length === 0)) {
    toast.error('Please provide a name and either text or files')
    return
  }

  isUploading.value = true

  try {
    await agentStore.uploadTrainingContent(workspaceId.value, {
      ...uploadConfig,
      module_id: moduleId.value || '',
      module_name: moduleSelected.value || ''
    })

    toast.success('Training content uploaded successfully!')

    // Reset form
    uploadConfig.name = ''
    uploadConfig.text = ''
    uploadConfig.type = 'TEXT'
    uploadConfig.files = []
    uploadConfig.module_id = ''
    uploadConfig.module_name = ''
  } catch (err) {
    console.error(err)
    toast.error('Failed to upload training content')
  } finally {
    isUploading.value = false
  }
}


type AgentArrayField =
  | 'responsibilities'
  | 'skills'
  | 'competencies'
  | 'conditions_rules';

// Map the fields to labels for template rendering
const personaGroups: Record<AgentArrayField, string> = {
  responsibilities: 'Responsibilities',
  skills: 'Skills',
  competencies: 'Competencies',
  conditions_rules: 'Conditions / Rules'
}

// Helper function to safely get array fields
const getAgentArrayField = (key: AgentArrayField): string[] => {
  return agentConfig[key]
}
const isLoading =ref(false)
const resetAgentConfig = () => {
  agentConfig.name = ''
  agentConfig.description = ''
  agentConfig.role = ''
  agentConfig.system_prompt = ''
  agentConfig.level = 'MID'
  agentConfig.responsibilities = []
  agentConfig.skills = []
  agentConfig.competencies = []
  agentConfig.capabilities = []
  agentConfig.conditions_rules = []
}
// create new Agent
const submitPersona = async () => {
  if (!workspaceId.value) {
    toast.error('Workspace ID is missing!')
    return
  }
  if (!agentConfig.name || !agentConfig.role) {
    toast.error('Please fill in required fields!')
    return
  }
 isLoading.value=true;
  try {
    const payload = {
      module_id: moduleId.value,
      module_name: moduleSelected.value,
      name: agentConfig.name,
      description: agentConfig.description,
      role: agentConfig.role,
      level: agentConfig.level,
      responsibilities: agentConfig.responsibilities,
      skills: agentConfig.skills,
      competencies: agentConfig.competencies,
      capabilities: agentConfig.capabilities,
      conditions_rules: agentConfig.conditions_rules
    }

    const response = await agentStore.trainPersona(workspaceId.value, payload)
    isLoading.value=false;
    resetAgentConfig()
    toast.success('Agent persona saved successfully!')
    console.log('Persona response:', response)
  } catch (err) {
    isLoading.value=false;
    toast.error('Failed to save agent persona!')
  }
}
// Get the agent if created
const loadAgentSettings = async () => { 
  await agentStore.fetchAgentSettings(
  workspaceId.value,
  moduleId.value,
  moduleSelected.value
)
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
