import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRef, unref } from 'vue'
import { request } from '../libs/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ScopeType = 'workspace' | 'module' | 'sheet' | 'card' | 'agent' | 'user'
export type KnowledgeCategory =
  | 'uploaded' | 'linked' | 'manual' | 'operational' | 'conversation'
  | 'behavioral' | 'analytical' | 'agent_chat' | 'agent_feedback'
  | 'agent_action' | 'agent_memory'
export type SourceType =
  | 'file' | 'url' | 'text' | 'note' | 'log' | 'comment' | 'api'
  | 'database' | 'agent_chat' | 'agent_feedback' | 'agent_action'
  | 'agent_memory' | 'analytical_insight'
export type LearningStatus =
  | 'draft' | 'pending_review' | 'approved' | 'indexed' | 'rejected' | 'archived' | 'failed'
export type TrustLevel =
  | 'source_of_truth' | 'approved_learning' | 'supporting' | 'suggested' | 'unverified'
export type Visibility = 'private' | 'team' | 'workspace' | 'agent_only'
export type GroupBy =
  | 'scope_type' | 'knowledge_category' | 'visibility' | 'learning_status'
  | 'trust_level' | 'added_by_type'
export type SortBy =
  | 'sort_order' | 'createdAt' | 'updatedAt' | 'name' | 'learning_status'
  | 'trust_level' | 'confidence_score'

export interface KnowledgeItem {
  _id: string
  workspace_id: string
  scope_type: ScopeType
  scope_id?: string
  knowledge_category: KnowledgeCategory
  source_type: SourceType
  name: string
  description?: string | null
  content?: string | null
  learning_status: LearningStatus
  trust_level: TrustLevel
  visibility: Visibility
  sort_order: number
  indexed_at?: string | null
  assigned_agents: Array<{ _id: string; name: string; model: string }>
  created_by: { _id: string; u_full_name: string; u_email: string }
  created_at: string
}

export interface KnowledgeListParams {
  workspace_id: string
  scope_type?: ScopeType
  scope_id?: string
  knowledge_category?: KnowledgeCategory
  source_type?: SourceType
  learning_status?: LearningStatus
  trust_level?: TrustLevel
  visibility?: Visibility
  added_by_type?: 'user' | 'system' | 'agent' | 'admin'
  assigned_agent?: string
  search?: string
  created_by?: string 
  group_by?: GroupBy
  sort_by?: SortBy
  sort_order?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface CreateKnowledgeItemPayload {
  workspace_id: string
  title: string
  scope_type: ScopeType
  knowledge_category: KnowledgeCategory
  source_type: SourceType
  scope_id?: string
  description?: string
  content?: string
  source_url?: string
  visibility?: Visibility
  trust_level?: TrustLevel
  learning_status?: LearningStatus
  assigned_agents?: string[]
  sort_order?: number
}

export interface UpdateKnowledgeItemPayload {
  workspace_id: string
  title?: string
  description?: string
  content?: string
  source_url?: string
  scope_type?: ScopeType
  scope_id?: string
  knowledge_category?: KnowledgeCategory
  source_type?: SourceType
  visibility?: Visibility
  trust_level?: TrustLevel
  assigned_agents?: string[]
  sort_order?: number
}

export interface ApproveItemPayload {
  workspace_id: string
  content?: string
  scope_type?: ScopeType
  scope_id?: string
  trust_level?: TrustLevel
}

export interface RejectItemPayload {
  workspace_id: string
  reason?: string
}

export interface BulkSortPayload {
  workspace_id: string
  group_by: GroupBy
  group_value: string
  items: Array<{ id: string; sort_order: number }>
}

export interface MoveGroupPayload {
  workspace_id: string
  group_by: GroupBy
  new_group_value: string
  sort_order: number
  source_items?: Array<{ id: string; sort_order: number }>
  dest_items?: Array<{ id: string; sort_order: number }>
}

export interface IngestUrlPayload {
  workspace_id: string
  scope_type: ScopeType
  knowledge_category: KnowledgeCategory
  url: string
  scope_id?: string
  title?: string
  description?: string
  visibility?: Visibility
  trust_level?: TrustLevel
  sort_order?: number
}

export interface IngestTextPayload {
  workspace_id: string
  scope_type: ScopeType
  knowledge_category: KnowledgeCategory
  title: string
  content: string
  scope_id?: string
  description?: string
  visibility?: Visibility
  trust_level?: TrustLevel
  sort_order?: number
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const knowledgeKeys = {
  all: ['knowledge-hub'] as const,
  lists: () => [...knowledgeKeys.all, 'list'] as const,
  list: (params: KnowledgeListParams) => [...knowledgeKeys.lists(), params] as const,
  pendingReview: (workspaceId: string) => [...knowledgeKeys.all, 'pending-review', workspaceId] as const,
  byScope: (scopeType: string, scopeId: string, workspaceId: string) =>
    [...knowledgeKeys.all, 'by-scope', scopeType, scopeId, workspaceId] as const,
  byAgent: (agentId: string, workspaceId: string) =>
    [...knowledgeKeys.all, 'by-agent', agentId, workspaceId] as const,
  detail: (id: string) => [...knowledgeKeys.all, 'detail', id] as const,
  indexStatus: (id: string) => [...knowledgeKeys.all, 'index-status', id] as const,
  chunks: (id: string) => [...knowledgeKeys.all, 'chunks', id] as const,
  filters: (workspaceId: string) => [...knowledgeKeys.all, 'filters', workspaceId] as const,
  agents: (workspaceId: string) => [...knowledgeKeys.all, 'agents', workspaceId] as const,
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a URLSearchParams string from an object, skipping undefined/null/empty values.
 */
function buildQuery(params: Record<string, any>): string {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, String(v))
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

// ─── 1. List Knowledge Items ──────────────────────────────────────────────────

export function useKnowledgeList(params: MaybeRef<KnowledgeListParams>) {
  return useQuery({
    queryKey: computed(() => knowledgeKeys.list(unref(params))),
    queryFn: () => {
      const p = unref(params)
      return request<any>({
        url: `my-knowledge${buildQuery(p)}`,
        method: 'GET',
      })
    },
    enabled: computed(() => !!unref(params).workspace_id),
  })
}

// ─── 2. Create Knowledge Item ─────────────────────────────────────────────────

export function useCreateKnowledgeItem(options?: { onSuccess?: (data: KnowledgeItem) => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateKnowledgeItemPayload) =>
      request<{ data: KnowledgeItem }>({
        url: 'my-knowledge',
        method: 'POST',
        data: payload,
      }),
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.filters(vars.workspace_id) })
      options?.onSuccess?.(data as unknown as KnowledgeItem)
    },
  })
}

// ─── 3. Get Single Item ───────────────────────────────────────────────────────

export function useKnowledgeItem(
  id: MaybeRef<string>,
  workspaceId: MaybeRef<string>,
) {
  return useQuery({
    queryKey: computed(() => knowledgeKeys.detail(unref(id))),
    queryFn: () =>
      request<{ data: KnowledgeItem }>({
        url: `my-knowledge/${unref(id)}?workspace_id=${unref(workspaceId)}`,
        method: 'GET',
      }),
    enabled: computed(() => !!unref(id) && !!unref(workspaceId)),
  })
}

// ─── 4. Update Knowledge Item ─────────────────────────────────────────────────

export function useUpdateKnowledgeItem(options?: { onSuccess?: (data: KnowledgeItem) => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateKnowledgeItemPayload }) =>
      request<{ data: KnowledgeItem }>({
        url: `my-knowledge/${id}`,
        method: 'PATCH',
        data: payload,
      }),
    onSuccess: (data, { id, payload }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      if (payload.workspace_id) {
        queryClient.invalidateQueries({ queryKey: knowledgeKeys.filters(payload.workspace_id) })
      }
      options?.onSuccess?.(data as unknown as KnowledgeItem)
    },
  })
}

// ─── 5. Delete Knowledge Item ─────────────────────────────────────────────────

export function useDeleteKnowledgeItem(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) =>
      request<{ success: boolean }>({
        url: `my-knowledge/${id}?workspace_id=${workspaceId}`,
        method: 'DELETE',
      }),
    onSuccess: (_data, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.filters(workspaceId) })
      options?.onSuccess?.()
    },
  })
}

// ─── 6. Approve Item ──────────────────────────────────────────────────────────

export function useApproveKnowledgeItem(options?: { onSuccess?: (data: KnowledgeItem) => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApproveItemPayload }) =>
      request<{ data: KnowledgeItem }>({
        url: `my-knowledge/${id}/approve`,
        method: 'POST',
        data: payload,
      }),
    onSuccess: (data, { id, payload }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.filters(payload.workspace_id) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.pendingReview(payload.workspace_id) })
      options?.onSuccess?.(data as unknown as KnowledgeItem)
    },
  })
}

// ─── 7. Reject Item ───────────────────────────────────────────────────────────

export function useRejectKnowledgeItem(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RejectItemPayload }) =>
      request<{ data: KnowledgeItem }>({
        url: `my-knowledge/${id}/reject`,
        method: 'POST',
        data: payload,
      }),
    onSuccess: (_data, { id, payload }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.filters(payload.workspace_id) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.pendingReview(payload.workspace_id) })
      options?.onSuccess?.()
    },
  })
}

// ─── 8. Archive Item ──────────────────────────────────────────────────────────

export function useArchiveKnowledgeItem(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) =>
      request<{ data: KnowledgeItem }>({
        url: `my-knowledge/${id}/archive`,
        method: 'POST',
        data: { workspace_id: workspaceId },
      }),
    onSuccess: (_data, { id, workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.filters(workspaceId) })
      options?.onSuccess?.()
    },
  })
}
export function useUnarchiveKnowledgeItem(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) =>
      request({
        url: `knowledge/${id}`,
        method: 'PATCH',
        data: {
          workspace_id: workspaceId,
          learning_status: 'draft',
        },
      }),
    ...options,
  })
}
// ─── 9. Get Pending Review ────────────────────────────────────────────────────

export function usePendingReviewItems(
  workspaceId: MaybeRef<string>,
  page: MaybeRef<number> = 1,
  limit: MaybeRef<number> = 20,
) {
  return useQuery({
    queryKey: computed(() => knowledgeKeys.pendingReview(unref(workspaceId))),
    queryFn: () =>
      request<any>({
        url: `my-knowledge/pending-review${buildQuery({
          workspace_id: unref(workspaceId),
          page: unref(page),
          limit: unref(limit),
        })}`,
        method: 'GET',
      }),
    enabled: computed(() => !!unref(workspaceId)),
  })
}

// ─── 10. Get by Scope ─────────────────────────────────────────────────────────

export function useKnowledgeByScope(
  scopeType: MaybeRef<ScopeType>,
  scopeId: MaybeRef<string>,
  workspaceId: MaybeRef<string>,
  page: MaybeRef<number> = 1,
  limit: MaybeRef<number> = 20,
) {
  return useQuery({
    queryKey: computed(() =>
      knowledgeKeys.byScope(unref(scopeType), unref(scopeId), unref(workspaceId)),
    ),
    queryFn: () =>
      request<any>({
        url: `my-knowledge/by-scope/${unref(scopeType)}/${unref(scopeId)}${buildQuery({
          workspace_id: unref(workspaceId),
          page: unref(page),
          limit: unref(limit),
        })}`,
        method: 'GET',
      }),
    enabled: computed(() => !!unref(scopeType) && !!unref(scopeId) && !!unref(workspaceId)),
  })
}

// ─── 11. Get by Agent ─────────────────────────────────────────────────────────

export function useKnowledgeByAgent(
  agentId: MaybeRef<string>,
  workspaceId: MaybeRef<string>,
  page: MaybeRef<number> = 1,
  limit: MaybeRef<number> = 20,
) {
  return useQuery({
    queryKey: computed(() => knowledgeKeys.byAgent(unref(agentId), unref(workspaceId))),
    queryFn: () =>
      request<any>({
        url: `my-knowledge/agent/${unref(agentId)}${buildQuery({
          workspace_id: unref(workspaceId),
          page: unref(page),
          limit: unref(limit),
        })}`,
        method: 'GET',
      }),
    enabled: computed(() => !!unref(agentId) && !!unref(workspaceId)),
  })
}

// ─── 12. Bulk Update Sort Order ───────────────────────────────────────────────

export function useBulkUpdateSortOrder(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: BulkSortPayload) =>
      request<any>({
        url: 'my-knowledge/group-sort',
        method: 'PATCH',
        data: payload,
      }),
    onSuccess: (_data, vars) => {
        console.log(vars);
        
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      options?.onSuccess?.()
    },
  })
}

// ─── 13. Move Item Between Groups ────────────────────────────────────────────

export function useMoveKnowledgeItem(options?: { onSuccess?: (data: any) => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MoveGroupPayload }) =>
      request<any>({
        url: `my-knowledge/${id}/move-group`,
        method: 'PATCH',
        data: payload,
      }),
    onSuccess: (data, { id, payload }) => {
        console.log(payload);
        
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      options?.onSuccess?.(data)
    },
  })
}

// ─── 14. Assign Agent ─────────────────────────────────────────────────────────

export function useAssignAgent(options?: { onSuccess?: (data: KnowledgeItem) => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      workspaceId,
      agentId,
    }: {
      id: string
      workspaceId: string
      agentId: string
    }) =>
      request<{ data: KnowledgeItem }>({
        url: `my-knowledge/${id}/assign-agent`,
        method: 'POST',
        data: { workspace_id: workspaceId, agent_id: agentId },
      }),
    onSuccess: (data, { id, workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.agents(workspaceId) })
      options?.onSuccess?.(data as unknown as KnowledgeItem)
    },
  })
}

// ─── 15. Remove Agent ─────────────────────────────────────────────────────────

export function useRemoveAgent(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      agentId,
      workspaceId,
    }: {
      id: string
      agentId: string
      workspaceId: string
    }) =>
      request<{ data: KnowledgeItem }>({
        url: `my-knowledge/${id}/remove-agent/${agentId}?workspace_id=${workspaceId}`,
        method: 'DELETE',
      }),
    onSuccess: (_data, { id, workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.agents(workspaceId) })
      options?.onSuccess?.()
    },
  })
}

// ─── 16. Ingest File ──────────────────────────────────────────────────────────

export function useIngestFile(options?: { onSuccess?: (data: any) => void }) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formData: FormData) =>
      request<any>({
        url: 'my-knowledge/ingest/file',
        method: 'POST',
        data: formData,
        config: {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: knowledgeKeys.lists(),
      })
      options?.onSuccess?.(data)
    },
  })
}

// ─── 17. Ingest URL ───────────────────────────────────────────────────────────

export function useIngestUrl(options?: { onSuccess?: (data: any) => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: IngestUrlPayload) =>
      request<any>({
        url: 'my-knowledge/ingest/url',
        method: 'POST',
        data: payload,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      options?.onSuccess?.(data)
    },
  })
}

// ─── 18. Ingest Text / Note ───────────────────────────────────────────────────

export function useIngestText(options?: { onSuccess?: (data: any) => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: IngestTextPayload) =>
      request<any>({
        url: 'my-knowledge/ingest/text',
        method: 'POST',
        data: payload,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.lists() })
      options?.onSuccess?.(data)
    },
  })
}

// ─── 19. Re-Index Item ────────────────────────────────────────────────────────

export function useReindexItem(options?: { onSuccess?: (data: any) => void }) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, workspaceId }: { id: string; workspaceId: string }) =>
      request<any>({
        url: `my-knowledge/${id}/reindex`,
        method: 'POST',
        data: { workspace_id: workspaceId },
      }),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: knowledgeKeys.indexStatus(id) })
      options?.onSuccess?.(data)
    },
  })
}

// ─── 20. Get Index Status ─────────────────────────────────────────────────────

export function useIndexStatus(
  id: MaybeRef<string>,
  workspaceId: MaybeRef<string>,
  /** Poll while learning_status is 'approved' (in-progress). Default: false */
  enabled: MaybeRef<boolean> = true,
) {
  return useQuery({
    queryKey: computed(() => knowledgeKeys.indexStatus(unref(id))),
    queryFn: () =>
      request<any>({
        url: `my-knowledge/${unref(id)}/index-status?workspace_id=${unref(workspaceId)}`,
        method: 'GET',
      }),
    enabled: computed(() => !!unref(id) && !!unref(workspaceId) && unref(enabled)),
    // Poll every 3 s while processing
    refetchInterval: computed(() => (unref(enabled) ? 3000 : false)),
  })
}

// ─── 21. List Chunks ──────────────────────────────────────────────────────────

export function useKnowledgeChunks(
  id: MaybeRef<string>,
  workspaceId: MaybeRef<string>,
  page: MaybeRef<number> = 1,
  limit: MaybeRef<number> = 50,
) {
  return useQuery({
    queryKey: computed(() => knowledgeKeys.chunks(unref(id))),
    queryFn: () =>
      request<any>({
        url: `my-knowledge/${unref(id)}/chunks${buildQuery({
          workspace_id: unref(workspaceId),
          page: unref(page),
          limit: unref(limit),
        })}`,
        method: 'GET',
      }),
    enabled: computed(() => !!unref(id) && !!unref(workspaceId)),
  })
}

// ─── 22. Get Filter Options ───────────────────────────────────────────────────

export function useKnowledgeFilters(workspaceId: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => knowledgeKeys.filters(unref(workspaceId))),
    queryFn: () =>
      request<any>({
        url: `my-knowledge/filters?workspace_id=${unref(workspaceId)}`,
        method: 'GET',
      }),
    enabled: computed(() => !!unref(workspaceId)),
    staleTime: 1000 * 60 * 5, // 5 minutes — filter options rarely change
  })
}

// ─── 23. Agents List ──────────────────────────────────────────────────────────

export function useKnowledgeAgents(
  workspaceId: MaybeRef<string>,
  search?: MaybeRef<string>,
) {
  return useQuery({
    queryKey: computed(() => knowledgeKeys.agents(unref(workspaceId))),
    queryFn: () =>
      request<any>({
        url: `my-knowledge/agents${buildQuery({
          workspace_id: unref(workspaceId),
          ...(unref(search) ? { search: unref(search) } : {}),
        })}`,
        method: 'GET',
      }),
    enabled: computed(() => !!unref(workspaceId)),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}