import { defineStore } from "pinia";
import api from "../libs/api";
const baseUrl = import.meta.env.VITE_API_BASE_URL;

interface AgentChatPayload {
  workspace_id: string;
  message: string;
  module_id?: string;
  lane_id?: string;
  sheet_id?: string;
  card_id?: string;
  session_id?: string;
}

interface AgentChatResponse {
  data: {
    data: any;
  }
}

interface AgentMessage {
  _id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    intent?: string;
    status?: string;
  };
}

export interface ChatSession {
  _id: string;
  session_id: string;
  context: {
    module_id: string | null;
    sheet_id: string | null;
    lane_id: string | null;
    card_id: string | null;
  };
  messages: AgentMessage[];
}

export interface CreatedEntityItem {
  id: string;
  type: string;
  title: string;
  created_at: string;
  created_by?: string;
  module_id?: string;
  lane_id?: string;
  sheet_id?: string;
  card_id?: string;
}

export const useAgentStore = defineStore("agent", {
  state: () => ({
    chatHistory: [] as ChatSession[],
    createdEntities: [] as CreatedEntityItem[],
    isSending: false,
    isAiTyping: false,
    isLoadingHistory: false,
    isLoadingEntities: false,
  }),

  getters: {
    latestMessage: (state) => {
      if (state.chatHistory.length === 0) return null;
      const lastSession = state.chatHistory[state.chatHistory.length - 1];
      if (!lastSession.messages || lastSession.messages.length === 0) return null;
      return lastSession.messages[lastSession.messages.length - 1];
    },
    chatCount: (state) => {
      return state.chatHistory.reduce((total, session) => total + session.messages.length, 0);
    },
  },

  actions: {
    async sendMessage(payload: AgentChatPayload): Promise<AgentChatResponse | null> {
      if (!payload.workspace_id) return null;
      this.isSending = true;
      try {
        const response = await api.request<AgentChatResponse>({
          url: `${baseUrl}agent-chat/message`,
          method: "POST",
          data: payload,
        });
        return response;
      } catch (err) {
        console.error("❌ Failed to send message:", err);
        return null;
      } finally {
        this.isSending = false;
      }
    },

    async fetchChatHistory(workspace_id: string, forceRefresh = false) {
      if (!workspace_id) return;
      this.isLoadingHistory = true;
      try {
        const cacheBuster = forceRefresh ? `?_t=${Date.now()}` : '';
        const url = `${baseUrl}agent-chat/${workspace_id}/history${cacheBuster}`;
        const res = await api.request<{ data: { chats: ChatSession[], pagination: any } }>({
          url,
          method: "GET",
          headers: forceRefresh ? {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          } : undefined,
        });
        const newChats = res.data.data?.chats ?? [];
        this.chatHistory = [...newChats];
        
      } catch (err) {
        console.error("❌ Failed to fetch chat history:", err);
      } finally {
        this.isLoadingHistory = false;
      }
    },

    async fetchCreatedEntities(workspace_id: string) {
      if (!workspace_id) return;
      this.isLoadingEntities = true;
      try {
        const res = await api.request<{ data: CreatedEntityItem[] }>({
          url: `${baseUrl}agent-chat/${workspace_id}/created-entities`,
          method: "GET",
        });
        this.createdEntities = res.data.data ?? [];
      } catch (err) {
        console.error("❌ Failed to fetch created entities:", err);
      } finally {
        this.isLoadingEntities = false;
      }
    },

    clearChatHistory() {
      this.chatHistory = [];
    },

    clearCreatedEntities() {
      this.createdEntities = [];
    },
  },
});