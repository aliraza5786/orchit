import { useMutation, useQuery } from "@tanstack/vue-query";
import api from "../libs/api";

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
  data: any;
}

export function useAgentChatMessage() {
  return useMutation<AgentChatResponse, unknown, AgentChatPayload>({
    mutationFn: (payload: AgentChatPayload) =>
      api.request({
        url: "/agent-chat/message",
        method: "POST",
        data: payload,
      }),
  });
}

export interface ChatHistoryItem {
  id: string;
  message: string;
  sender: "me" | "ai";
  timestamp: string;
  module_id?: string;
  lane_id?: string;
  sheet_id?: string;
  card_id?: string;
  session_id?: string;
}

export interface ChatHistoryResponse {
  data: ChatHistoryItem[];
}

export function useChatHistory(workspace_id: string) {
  return useQuery<ChatHistoryResponse, unknown>({
    queryKey: ["chat-history", workspace_id],
    queryFn: () =>
      api.request({
        url: `/agent-chat/${workspace_id}/history`,
        method: "GET",
      }),
    enabled: !!workspace_id,
  });
}
export interface CreatedEntityItem {
  id: string;
  type: string; // e.g., "sheet", "card", "list"
  title: string;
  created_at: string;
  created_by?: string;
  module_id?: string;
  lane_id?: string;
  sheet_id?: string;
  card_id?: string;
}

export interface CreatedEntitiesResponse {
  data: CreatedEntityItem[];
}
export function useCreatedEntities(workspace_id: string) {
  return useQuery<CreatedEntitiesResponse, unknown>({
    queryKey: ["created-entities", workspace_id],
    queryFn: () =>
      api.request({
        url: `/agent-chat/${workspace_id}/created-entities`,
        method: "GET",
      }),
    enabled: !!workspace_id,
  });
}