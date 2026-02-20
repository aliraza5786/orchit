import { defineStore } from "pinia";
import api from "../libs/api";
import { toast } from "vue-sonner";
const baseUrl = import.meta.env.VITE_API_BASE_URL;

interface AgentChatPayload {
  workspace_id: string;
  message: string;
  module_id?: string;
  module_name?: string;
  user_id?: string;
  lane_id?: string;
  sheet_id?: string;
  card_id?: string;
  session_id?: string;
}

interface AgentChatResponse {
  data: {
    data: any;
  };
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
  module_name?: string;
  user_id?: string;
  lane_id?: string;
  sheet_id?: string;
  card_id?: string;
}
interface KnowledgePayload {
  module_id: string;
  module_name: string;
  sources: Array<{ source_type: string }>;
  is_active: boolean;
  metadata: Record<string, any>;
}
interface UploadConfig {
  name: string;
  text: string;
  type:
    | "UPLOAD"
    | "URL"
    | "CMS_PAGE"
    | "TEXT"
    | "MIXED"
    | "INTERNAL_MODULE"
    | "INTERNAL_SHEET"
    | "INTERNAL_TICKET"
    | "WEB_SEARCH"
    | "PROMPT";
  files: File[];
  module_id: string;
  module_name: string;
}

export const useAgentStore = defineStore("agent", {
  state: () => ({
    chatHistory: [] as ChatSession[],
    createdEntities: [] as CreatedEntityItem[],
    isSending: false,
    isAiTyping: false,
    isLoadingHistory: false,
    isLoadingEntities: false,
    isAcceptingEntities: false,
    agentSettings: {} as Record<string, any>,
    agentsCreated: {} as Record<string, any>,
    isLoadingSettings: false,
    isLoadingKnowledge: false,
    sheetTitle: localStorage.getItem("selected_sheet_title") || "",
    sheetId: localStorage.getItem("selected_sheet_id") || "",
  }),

  getters: {
    latestMessage: (state) => {
      if (state.chatHistory.length === 0) return null;
      const lastSession = state.chatHistory[state.chatHistory.length - 1];
      if (!lastSession.messages || lastSession.messages.length === 0)
        return null;
      return lastSession.messages[lastSession.messages.length - 1];
    },
    chatCount: (state) => {
      return state.chatHistory.reduce(
        (total, session) => total + session.messages.length,
        0,
      );
    },
  },

  actions: {
    async sendMessage(
      payload: AgentChatPayload,
    ): Promise<AgentChatResponse | null> {
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

    async fetchChatHistory(
      workspace_id: string,
      user_id?: string,
      module_name?: string,
      module_id?: string,
      sheet_name?: string,
      sheet_id?: string,
      forceRefresh = false,
    ) {
      if (!workspace_id) return;

      this.isLoadingHistory = true;

      try {
        const params = new URLSearchParams();

        // helper to safely append params
        const addParam = (key: string, value?: unknown) => {
          if (
            value !== undefined &&
            value !== null &&
            typeof value === "string" &&
            value.trim() !== ""
          ) {
            params.append(key, value);
          }
        };

        if (forceRefresh) {
          params.append("_t", Date.now().toString());
        }

        addParam("user_id", user_id);
        addParam("module_name", module_name);
        addParam("module_id", module_id);
        addParam("sheet_id", sheet_id);
        addParam("sheet_name", sheet_name);
        const query = params.toString();

        const url = `${baseUrl}agent-chat/${workspace_id}/history/${
          query ? `?${query}` : ""
        }`;

        const res = await api.request<{
          data: { chats: ChatSession[]; pagination: any };
        }>({
          url,
          method: "GET",
          headers: forceRefresh
            ? {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              }
            : undefined,
        });

        const newChats = res.data?.data?.chats ?? [];
        this.chatHistory = [...newChats];
      } catch (err) {
        console.error("❌ Failed to fetch chat history:", err);
      } finally {
        this.isLoadingHistory = false;
      }
    },

    async fetchCreatedEntities(
      workspace_id: string,
      user_id?: string,
      module_name?: string,
      module_id?: string,
      forceRefresh = false,
    ) {
      if (!workspace_id) return;

      this.isLoadingEntities = true;

      try {
        const params = new URLSearchParams();

        // helper to safely append params
        const addParam = (key: string, value?: unknown) => {
          if (
            value !== undefined &&
            value !== null &&
            typeof value === "string" &&
            value.trim() !== ""
          ) {
            params.append(key, value);
          }
        };

        if (forceRefresh) {
          params.append("_t", Date.now().toString());
        }

        addParam("user_id", user_id);
        addParam("module_name", module_name);
        addParam("module_id", module_id);

        const query = params.toString();

        const url = `${baseUrl}agent-chat/${workspace_id}/created-entities/${
          query ? `?${query}` : ""
        }`;

        const res = await api.request<{ data: CreatedEntityItem[] }>({
          url,
          method: "GET",
          headers: forceRefresh
            ? {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              }
            : undefined,
        });

        this.createdEntities = res.data?.data ?? [];
      } catch (err) {
        console.error("❌ Failed to fetch created entities:", err);
      } finally {
        this.isLoadingEntities = false;
      }
    },
    async acceptEntities(payload: any) {
      this.isAcceptingEntities = true;
      try {
        const res = await api.request<{ data: CreatedEntityItem[] }>({
          url: `${baseUrl}agent-chat/accept-structure`,
          method: "POST",
          data: payload,
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        this.createdEntities = res.data.data ?? [];
      } catch (err) {
        console.error("Not accepted", err);
      } finally {
        this.isAcceptingEntities = false;
      }
    },
    clearChatHistory() {
      this.chatHistory = [];
    },

    clearCreatedEntities() {
      this.createdEntities = [];
    },
    async declineSuggestedEntities(workspace_id: string, entity_id?: string) {
      if (!workspace_id) return;

      this.isLoadingHistory = true;

      try {
        const url = `${baseUrl}agent-chat/created-entities/${workspace_id}`;

        const res = await api.request<{
          data: { chats: ChatSession[]; pagination: any };
        }>({
          url,
          method: "DELETE",
          data: entity_id ? { entity_id } : undefined, // ✅ body payload
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        return res.data;
      } catch (err) {
        console.error("❌ Failed to decline suggested entities:", err);
      } finally {
        this.isLoadingHistory = false;
      }
    },
    async trainPersona(
      workspace_id: string,
      payload: {
        module_id?: string;
        module_name?: string;
        sheet_id?: string;
        sheet_name?: string;
        name: string;
        description?: string;
        role?: string;
        level?: "JUNIOR" | "MID" | "SENIOR" | "EXPERT" | "LEAD";
        responsibilities?: string[];
        skills?: string[];
        competencies?: string[];
        capabilities?: string[];
        conditions_rules?: string[];
      },
    ) {
      if (!workspace_id) return;
      this.isLoadingHistory = true;

      try {
        const url = `${baseUrl}agent-chat/${workspace_id}/train/persona`;

        const res = await api.request({
          url,
          method: "POST",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          data: payload,
        });
        if (res.status >= 200 && res.status < 300) {
          this.isLoadingHistory = false;
          toast.success("Agent created successfully.");
        } else {
          toast.error("Failed to create Agent.");
          this.isLoadingHistory = false;
        }
      } catch (err: any) {
        console.error("Failed to create Agent.", err);
        this.isLoadingHistory = false;
        toast.error(
          err?.response?.data?.message ||
            "Something went wrong while creating Agent.",
        );
      } finally {
        this.isLoadingHistory = false;
      }
    },
    async fetchAgentSettings(
      workspace_id: string,
      module_id?: string,
      module_name?: string,
    ) {
      if (!workspace_id) return;

      this.isLoadingSettings = true;

      try {
        const queryParams = new URLSearchParams();
        if (module_id) queryParams.append("module_id", module_id);
        if (module_name) queryParams.append("module_name", module_name);

        const url = `${baseUrl}agent-chat/${workspace_id}/settings?${queryParams.toString()}`;

        const res = await api.request<{ data: any }>({
          url,
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        this.agentSettings = res.data.data;
        return res.data.data;
      } catch (err) {
        console.error("❌ Failed to fetch agent settings:", err);
      } finally {
        this.isLoadingSettings = false;
      }
    },
    async trainKnowledge(workspace_id: string, payload: KnowledgePayload) {
      if (!workspace_id) return;
      this.isLoadingKnowledge = true;

      try {
        const url = `/agent-chat/${workspace_id}/train/knowledge`;

        const res = await api.request<{ data: any }>({
          url,
          method: "POST",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          data: payload,
        });

        return res.data;
      } catch (err) {
        console.error("❌ Failed to train knowledge:", err);
        throw err;
      } finally {
        this.isLoadingKnowledge = false;
      }
    },
    async uploadTrainingContent(workspace_id: string, payload: UploadConfig) {
      if (!workspace_id) return;

      const formData = new FormData();
      formData.append("module_id", payload.module_id);
      formData.append("module_name", payload.module_name);
      formData.append("name", payload.name);
      formData.append("text", payload.text);
      formData.append("type", payload.type);

      // append files if any
      payload.files.forEach((file) => {
        formData.append("files", file);
      });

      try {
        const res = await api.post(
          `/agent-chat/${workspace_id}/train/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        return res.data;
      } catch (err) {
        console.error("❌ Failed to upload training content:", err);
        throw err;
      }
    },
    async saveSelectedSheetTitle(title: string) {
      this.sheetTitle = title;
      localStorage.setItem("selected_sheet_title", title);
    },
    async saveSelectedSheetId(id: string) {
      this.sheetId = id;
      localStorage.setItem("selected_sheet_title", id);
    },
    async fetchSavedAgents(
      workspace_id: string,
      module_id?: string,
      module_name?: string,
      // sheet_name?: string,
      // sheet_id?: string,
    ) {
      if (!workspace_id) return;

      this.isLoadingSettings = true;

      try {
        const queryParams = new URLSearchParams();
        if (module_id) queryParams.append("module_id", module_id);
        if (module_name) queryParams.append("module_name", module_name);
        // if (sheet_name) queryParams.append("scope_type", sheet_name);
        // if (sheet_id) queryParams.append("scope_id", sheet_id);
        const url = `${baseUrl}agent-chat/${workspace_id}/assigned-agents?${queryParams.toString()}`;

        const res = await api.request<{ data: any }>({
          url,
          method: "GET",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        this.agentsCreated = res.data;
        return res.data.data;
      } catch (err) {
        console.error("❌ Failed to fetch agent settings:", err);
      } finally {
        this.isLoadingSettings = false;
      }
    },
  },
});
