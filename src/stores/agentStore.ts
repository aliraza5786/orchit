import { defineStore } from "pinia";
import api from "../libs/api";
import { toast } from "vue-sonner";
const baseUrl = import.meta.env.VITE_API_BASE_URL;
interface Attachment {
  mode: "inline" | "inline_text";
  file_id: string | null;
  data_url: string | null;
  text: string | null;
  filename: string;
  mimetype: string;
  size: number;
  is_image: boolean;
}
interface AgentChatPayload {
  workspace_id: string;
  message: string;
  agent_id: string;
  module_id?: string;
  module_name?: string;
  user_id?: string;
  lane_id?: string;
  sheet_id?: string;
  card_id?: string;
  session_id?: string;
  stream?: boolean;
  attachments?: Attachment[];
  route_path?: string;
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

type Agent = {
  module_id: string;
  moduleName: string;
  _id: string;
  name: string;
  description: string;
  level?: string;
  is_active?: boolean;
  model?: string;
  role?: string;
};
interface CreateSessionPayload {
  agent_id: string;
  title?: string;
  module_id?: string;
  module_name?: string;
  sheet_id?: string;
  sheet_name?: string;
  lane_id?: string;
}
export const useAgentStore = defineStore("agent", {
  state: () => ({
    chatHistory: [] as ChatSession[],
    createdEntities: [] as CreatedEntityItem[],
    isSending: false,
    assistantStreamedChunks: [] as any[],
    currentStreamText: "",
    currentPhase: "",
    isAiTyping: false,
    isLoadingHistory: false,
    isLoadingEntities: false,
    isAcceptingEntities: false,
    agentSettings: {} as Record<string, any>,
    agentsCreated: {} as Record<string, any>,
    isLoadingSettings: false,
    isLoadingKnowledge: false,
    isUpdatingAgent: false,
    isDeletingAgent: false,
    sheetTitle: localStorage.getItem("selected_sheet_title") || "",
    sheetId: localStorage.getItem("selected_sheet_id") || "",
    isLoadingAgent: false,
    agentsForTalent: {} as Record<string, any>,
    ogTypesTicket: {} as Record<string, any>,
    isLoadingRoles: false,
    agentsRolesPermissions: {} as Record<string, any>,
    agentPassed: null as Agent | null,
    module_id: null as string | null,
    moduleName: null as string | null,
    isLoading: false,
    pinnedMessages: [] as AgentMessage[],
    isLoadingPinnedMessages: false,
    isCreatingDashboard: false,
    isUpdatingAgentSettings: false,
    settings: null as null | Record<string, any>,
    isLoadingWebSettings: false,
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
      this.resetStream();
 
      try {
        const { route_path, ...basePayload } = payload;
 
        let finalPayload: Omit<AgentChatPayload, "route_path"> = {
          ...basePayload,
        };
 
        if (route_path?.includes("peak")) {
          finalPayload = {
            workspace_id: payload.workspace_id,
            agent_id: payload.agent_id,
            message: payload.message,
            session_id: payload.session_id,
            stream: payload.stream,
            module_id: payload.module_id,
            module_name: payload.module_name,
            attachments: payload.attachments,
          };
        } else if (route_path?.includes("plan")) {
          finalPayload = {
            workspace_id: payload.workspace_id,
            agent_id: payload.agent_id,
            message: payload.message,
            session_id: payload.session_id,
            stream: payload.stream,
            module_id: payload.module_id,
            module_name: payload.module_name,
            sheet_id: payload.sheet_id,
            attachments: payload.attachments,
          };
        }
 
        // ✅ Resolve auth token: axios defaults → localStorage → auth_session cookie
        const axiosAuthHeader =
          api.defaults?.headers?.common?.["Authorization"] as string | undefined;
 
        const getTokenFromCookie = (): string => {
          try {
            const match = document.cookie
              .split("; ")
              .find((row) => row.startsWith("auth_session="));
            if (!match) return "";
            const raw = decodeURIComponent(match.split("=").slice(1).join("="));
            const parsed = JSON.parse(raw);
            return parsed?.token ?? "";
          } catch {
            return "";
          }
        };
 
        const token =
          axiosAuthHeader?.replace(/^Bearer\s+/i, "") ||
          localStorage.getItem("token") ||
          localStorage.getItem("access_token") ||
          getTokenFromCookie() ||
          "";
 
        if (!token) {
          console.error("❌ No auth token found — request will be rejected.");
        }
 
        const url = `${baseUrl}agent-chat/message/assistant`;
 
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(finalPayload),
        });
 
        if (!response.ok || !response.body) {
          console.error("Stream response failed:", response.status);
          return null;
        }
 
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
 
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
 
          buffer += decoder.decode(value, { stream: true });
 
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
 
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            this.handleIncomingChunk(trimmed);
          }
        }
 
        if (buffer.trim().startsWith("data:")) {
          this.handleIncomingChunk(buffer.trim());
        }
 
        return null;
      } catch (err) {
        console.error("❌ Failed to send message:", err);
        return null;
      } finally {
        this.isSending = false;
      }
    },

    handleIncomingChunk(raw: string) {
      try {
        const cleaned = raw.replace(/^data:\s*/, "");
        const parsed = JSON.parse(cleaned);

        this.assistantStreamedChunks.push(parsed);

        if (parsed.type === "chunk") {
          this.currentStreamText += parsed.content;
        }

        if (parsed.type === "phase") {
          this.currentPhase = parsed.phase;
        }

        if (parsed.type === "done") {
          this.isAiTyping = false;
        }
      } catch (err) {
        console.error("Chunk parse failed:", raw);
      }
    },

    resetStream() {
      this.assistantStreamedChunks = [];
      this.currentStreamText = "";
      this.currentPhase = "";
      this.isAiTyping = true;
    },

    async uploadAssistantFiles(files: File[] | File) {
      const formData = new FormData();
      const filesArray = Array.isArray(files) ? files : [files];
      filesArray.forEach((file) => {
        formData.append("files[]", file);
      });

      try {
        const res = await api.post(
          `${baseUrl}agent-chat/message/assistant/upload`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        return res.data;
      } catch (err) {
        console.error("Failed to upload file", err);
        throw err;
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

        // ✅ Use timestamp as query param for cache-busting instead of headers
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

        // ✅ Removed cache headers — use query param busting above instead
        const res = await api.request<{
          data: { chats: ChatSession[]; pagination: any };
        }>({
          url,
          method: "GET",
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

        // ✅ Removed cache headers
        const res = await api.request<{ data: CreatedEntityItem[] }>({
          url,
          method: "GET",
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
        });

        this.createdEntities = res.data.data ?? [];
      } catch (err) {
        console.error("Not accepted", err);
        throw err;
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
          data: entity_id ? { entity_id } : undefined,
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
      payload: { /* ...same type... */ },
    ) {
      if (!workspace_id) return;
      try {
        const url = `${baseUrl}agent-chat/${workspace_id}/train/persona`;
        const res = await api.request({
          url,
          method: "POST",
          data: payload,
        });
        if (res.status >= 200 && res.status < 300) {
          toast.success("Agent created successfully.");
        } else {
          toast.error("Failed to create Agent.");
        }
      } catch (err: any) {
        console.error("Failed to create Agent.", err);
        toast.error(
          err?.response?.data?.message ||
            "Something went wrong while creating Agent.",
        );
      }
    },

    async fetchAgentSettings(
      workspace_id: string,
      module_id?: string,
      module_name?: string,
      agent_id?: string,
    ) {
      if (!workspace_id) return;
      this.isLoadingSettings = true;
      try {
        const queryParams = new URLSearchParams();
        if (module_id) queryParams.append("module_id", module_id);
        if (module_name) queryParams.append("module_name", module_name);
        if (agent_id) queryParams.append("agent_id", agent_id);
        const url = `${baseUrl}agent-chat/${workspace_id}/settings?${queryParams.toString()}`;

        // ✅ Removed cache headers
        const res = await api.request<{ data: any }>({
          url,
          method: "GET",
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

    async saveSelectedSheetId(id: string | string[]) {
      const idStr = Array.isArray(id) ? id.join(",") : id;
      this.sheetId = idStr;
      localStorage.setItem("selected_sheet_id", idStr);
    },

    async fetchSavedAgents(
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
        const url = `${baseUrl}agent-chat/${workspace_id}/assigned-agents?${queryParams.toString()}`;

        // ✅ Removed cache headers
        const res = await api.request<{ data: any }>({
          url,
          method: "GET",
        });

        this.agentsCreated = res.data;
        return res.data.data;
      } catch (err) {
        console.error("❌ Failed to fetch agent settings:", err);
      } finally {
        this.isLoadingSettings = false;
      }
    },

    async updateSelectedAgent(
      workspace_id: string,
      payload: Record<string, any>,
      agent_id?: string,
    ) {
      if (!workspace_id) return;
      this.isUpdatingAgent = true;
      try {
        const base = `${baseUrl}agent-chat/${workspace_id}/agent`;
        const url = agent_id ? `${base}/${agent_id}` : base;
        await api.request<{ data: any }>({
          url,
          method: "PUT",
          data: payload,
        });
        this.isUpdatingAgent = false;
        toast.success("Agent configuration has been updated successfully.");
      } catch (err) {
        toast.error("Failed to update agent configuration");
        console.error("Failed to update agent settings:", err);
        this.isUpdatingAgent = false;
        throw err;
      } finally {
        this.isUpdatingAgent = false;
      }
    },

    async deleteSelectedAgent(workspace_id: string, agent_id?: string) {
      if (!workspace_id) return;
      this.isDeletingAgent = true;
      try {
        const base = `${baseUrl}agent-chat/${workspace_id}/agent`;
        const url = agent_id ? `${base}/${agent_id}` : base;
        const res = await api.request<{ data: any }>({
          url,
          method: "DELETE",
        });
        return res.data;
      } catch (err) {
        this.isDeletingAgent = false;
        console.error("❌ Failed to Delete agent:", err);
        throw err;
      } finally {
        this.isDeletingAgent = false;
      }
    },

    async fetchAgentsByRoleOrModule(workspace_id: string, groupBy?: string) {
      if (!workspace_id) return;

      this.isLoadingAgent = true;

      try {
        const queryParams = new URLSearchParams();
        if (groupBy) queryParams.append("groupBy", groupBy);
        const url = `${baseUrl}workspace/teams/${workspace_id}/agents-grouped?${queryParams.toString()}`;

        // ✅ Removed cache headers
        const res = await api.request<{ data: any }>({
          url,
          method: "GET",
        });

        this.agentsForTalent = res.data?.data;
        this.isLoadingAgent = false;
      } catch (err) {
        console.error("Failed to fetch agents:", err);
        this.isLoadingAgent = false;
      } finally {
        this.isLoadingSettings = false;
        this.isLoadingAgent = false;
      }
    },

    async shareTicketTypes(cardId: string) {
      if (!cardId) return;
      try {
        const url = `${baseUrl}common/share/ticket/${cardId}`;
        // ✅ Removed cache headers
        const res = await api.request<{ data: any }>({
          url,
          method: "GET",
        });

        this.ogTypesTicket = res?.data;
        this.isLoadingAgent = false;
      } catch (err) {
        console.error("Failed to fetch agents:", err);
        this.isLoadingAgent = false;
      } finally {
        this.isLoadingSettings = false;
        this.isLoadingAgent = false;
      }
    },

    async fetchAgentsRolesPermissions(workspace_id: string) {
      if (!workspace_id) return;

      this.isLoadingRoles = true;

      try {
        const url = `${baseUrl}agent-chat/${workspace_id}/roles`;

        // ✅ Removed cache headers — these were causing CORS preflight failures
        const res = await api.request<{ data: any }>({
          url,
          method: "GET",
        });

        this.agentsRolesPermissions = res.data?.data;
        this.isLoadingRoles = false;
      } catch (err) {
        console.error("Failed to fetch agents:", err);
        this.isLoadingRoles = false;
      } finally {
        this.isLoadingSettings = false;
        this.isLoadingRoles = false;
      }
    },

    handleAgentPassed(agent: any, module_id: any, module_name: any) {
      this.agentPassed = agent;
      this.module_id = module_id;
      this.moduleName = module_name;
    },

    async unpinStructure(payload: { workspace_id: string; log_id?: string }) {
      this.isLoading = true;
      try {
        await api.request({
          url: `${baseUrl}agent-chat/unpin-structure`,
          method: "POST",
          data: payload,
        });
      } catch (err) {
        console.error("Unpin failed", err);
        throw err;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchAllAgentChatHistory(
      workspace_id: string,
      params?: {
        session_id?: string;
        agent_id?: string;
        user_id?: string;
        module_id?: string;
        module_name?: string;
        sheet_id?: string;
        limit?: number;
        skip?: number;
      },
    ) {
      if (!workspace_id) return;

      this.isLoadingHistory = true;

      try {
        const queryParams = new URLSearchParams();

        const addParam = (key: string, value?: string | number) => {
          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
          ) {
            queryParams.append(key, String(value));
          }
        };

        addParam("session_id", params?.session_id);
        addParam("agent_id", params?.agent_id);
        addParam("user_id", params?.user_id);
        addParam("module_id", params?.module_id);
        addParam("module_name", params?.module_name);
        addParam("sheet_id", params?.sheet_id);
        addParam("limit", params?.limit);
        addParam("skip", params?.skip);

        const query = queryParams.toString();
        const url = `${baseUrl}agent-chat/${workspace_id}/history${query ? `?${query}` : ""}`;

        // ✅ Removed cache headers
        const res = await api.request<{
          data: { chats: ChatSession[]; pagination: any };
        }>({
          url,
          method: "GET",
        });

        return res.data?.data ?? { chats: [], pagination: null };
      } catch (err) {
        console.error("❌ Failed to fetch all agent chat history:", err);
        return { chats: [], pagination: null };
      } finally {
        this.isLoadingHistory = false;
      }
    },

    async fetchSessions(
      workspace_id: string,
      params?: { agent_id?: string; limit?: number; skip?: number },
    ) {
      if (!workspace_id) return;
      try {
        const queryParams = new URLSearchParams();
        if (params?.agent_id) queryParams.append("agent_id", params.agent_id);
        if (params?.limit != null)
          queryParams.append("limit", String(params.limit));
        if (params?.skip != null)
          queryParams.append("skip", String(params.skip));

        const url = `${baseUrl}agent-chat/${workspace_id}/sessions?${queryParams.toString()}`;

        // ✅ Removed cache headers
        const res = await api.request<{
          data: { sessions: any[]; pagination: any };
        }>({
          url,
          method: "GET",
        });
        return res.data?.data ?? { sessions: [], pagination: null };
      } catch (err) {
        console.error("❌ Failed to fetch sessions:", err);
        return { sessions: [], pagination: null };
      }
    },

    async getSession(workspace_id: string, session_id: string) {
      if (!workspace_id || !session_id) return null;
      try {
        const url = `${baseUrl}agent-chat/${workspace_id}/sessions/${session_id}`;

        // ✅ Removed cache headers — these were causing CORS preflight failures
        const res = await api.request<{ data: any }>({
          url,
          method: "GET",
        });
        return res.data?.data ?? null;
      } catch (err) {
        console.error("❌ Failed to get session:", err);
        return null;
      }
    },

    async renameSession(
      workspace_id: string,
      session_id: string,
      title: string,
    ) {
      if (!workspace_id || !session_id) return;
      try {
        const url = `${baseUrl}agent-chat/${workspace_id}/sessions/${session_id}`;
        // ✅ Removed cache headers
        await api.request({
          url,
          method: "PATCH",
          data: { title },
        });
      } catch (err) {
        console.error("❌ Failed to rename session:", err);
        throw err;
      }
    },

    async deleteSession(workspace_id: string, session_id: string) {
      if (!workspace_id || !session_id) return;
      try {
        const url = `${baseUrl}agent-chat/${workspace_id}/sessions/${session_id}`;
        // ✅ Removed cache headers
        await api.request({
          url,
          method: "DELETE",
        });
      } catch (err) {
        console.error("❌ Failed to delete session:", err);
        throw err;
      }
    },

    async createSession(workspace_id: string, payload: CreateSessionPayload) {
      if (!workspace_id) return null;

      try {
        const url = `${baseUrl}agent-chat/${workspace_id}/sessions`;

        // ✅ Removed cache headers
        const res = await api.request<{ data: any }>({
          url,
          method: "POST",
          data: payload,
        });

        const newSession = res.data?.data;

        if (newSession) {
          this.chatHistory.unshift(newSession);
        }

        return newSession;
      } catch (err: any) {
        console.error("❌ Failed to create session:", err);
        toast.error(err?.response?.data?.message || "Failed to create session");
        return null;
      }
    },

    async pinMessage(
      workspace_id: string,
      session_id: string,
      message_id: string,
      is_pinned: boolean,
    ) {
      if (!workspace_id || !session_id || !message_id) return;
      try {
        // ✅ Removed cache headers
        await api.request({
          url: `${baseUrl}agent-chat/${workspace_id}/sessions/${session_id}/messages/${message_id}/pin`,
          method: "PATCH",
          data: { is_pinned },
        });

        for (const session of this.chatHistory) {
          const msg = session.messages?.find((m) => m._id === message_id);
          if (msg) {
            (msg as any).is_pinned = is_pinned;
            break;
          }
        }
      } catch (err) {
        console.error("Failed to pin/unpin message:", err);
        throw err;
      }
    },

    async fetchPinnedMessages(
      workspace_id: string,
      params?: {
        session_id?: string;
        agent_id?: string;
        limit?: number;
        skip?: number;
      },
    ) {
      if (!workspace_id) return;

      this.isLoadingPinnedMessages = true;

      try {
        const queryParams = new URLSearchParams();

        const addParam = (key: string, value?: string | number) => {
          if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
          ) {
            queryParams.append(key, String(value));
          }
        };

        addParam("session_id", params?.session_id);
        addParam("agent_id", params?.agent_id);
        addParam("limit", params?.limit ?? 50);
        addParam("skip", params?.skip ?? 0);

        const query = queryParams.toString();
        const url = `${baseUrl}agent-chat/${workspace_id}/pinned-messages${
          query ? `?${query}` : ""
        }`;

        // ✅ Removed cache headers
        const res = await api.request<{
          data: { pinned_messages: AgentMessage[] };
        }>({
          url,
          method: "GET",
        });

        this.pinnedMessages = res.data?.data?.pinned_messages ?? [];
        return this.pinnedMessages;
      } catch (err) {
        console.error("❌ Failed to fetch pinned messages:", err);
        return [];
      } finally {
        this.isLoadingPinnedMessages = false;
      }
    },

    async createDashboardWithWidgets(payload: {
      workspace_id: string;
      title: string;
      widgets: { type: string; title: string }[];
    }) {
      if (!payload?.workspace_id) return;

      this.isCreatingDashboard = true;

      try {
        const url = `${baseUrl}agent-actions/create-dashboard`;

        const res = await api.request<{ data: any }>({
          url,
          method: "POST",
          data: {
            type: "create_dashboard",
            payload,
          },
        });

        return res.data?.data;
      } catch (err) {
        console.error("Failed to create dashboard:", err);
        throw err;
      } finally {
        this.isCreatingDashboard = false;
      }
    },

    async updateAgentWebBrowsing(
      workspace_id: string,
      agent_id: string,
      payload?: { web_browsing_enabled?: boolean },
    ) {
      if (!workspace_id || !agent_id) return;
      this.isUpdatingAgentSettings = true;
      try {
        const url = `${baseUrl}agent-chat/${workspace_id}/agent/${agent_id}`;

        // ✅ Removed cache headers
        const res = await api.request<{
          data: { web_browsing_enabled: boolean };
        }>({
          url,
          method: "PUT",
          data: {
            web_browsing_enabled: payload?.web_browsing_enabled ?? true,
          },
        });

        this.agentSettings = {
          ...this.agentSettings,
          [agent_id]: {
            ...this.agentSettings?.[agent_id],
            web_browsing_enabled:
              res.data?.data?.web_browsing_enabled ??
              payload?.web_browsing_enabled,
          },
        };

        return res.data?.data;
      } catch (err) {
        console.error("❌ Failed to update agent web browsing:", err);
        return null;
      } finally {
        this.isUpdatingAgentSettings = false;
      }
    },
  },
});