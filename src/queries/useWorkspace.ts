// src/features/workspaces/queries.ts
import { useApiQuery, useApiMutation } from "../libs/vq.ts";
import api, { request } from "../libs/api.ts"; // for dynamic-URL mutations
import { computed, unref, type Ref } from "vue";
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { useAuthStore } from "../stores/auth.ts";
export const keys = {
  description: (id: string | number) => ["description", id] as const,
  suggestions: (category: string) => ["suggestions", category] as const,
  industries: ["industries"] as const,
  userTypes: ["user-types"] as const,
  technologies: ["technologies"] as const,
  platforms: ["platforms"] as const,
  workspacesPrompt: ["workspaces", "prompt"] as const,

  workspaces: ["workspaces"] as const,
  workspacesTitles: ["workspaces", "titles"] as const,
  singleWorkspace: (id: string | number) => ["workspaces", "byId", id] as const,
  workspaceModules: ["workspaces", "modules"] as const,
  workspaceRoles: (id: string | number) => ["workspaces", "roles", id] as const,
  workspaceVariables: ["workspaces", "variables"] as const,
  workspaceProcessFlow: (id: string | number) => ["workspaces", "processFlow", id] as const,

  invitedWorkspace: (id: string | number) =>
    ["invited", "workspace", id] as const,
  invitedSpace: (id: string | number) => ["invited", "space", id] as const,
  checkProgress: (id: string | number) =>
    ["workspace", "progress", id] as const,

  // mutations
  invitePeople: ["invitations", "send"] as const,
  createWorkspaceAI: ["workspace", "create-ai"] as const,
  createWorkspace: ["workspace", "create"] as const,
  createLanes: ["workspace", "create-lanes-ai"] as const,
  updateInvited: ["invited", "update"] as const,
  deleteInvited: ["invited", "delete"] as const,
  deleteWorkspace: ["workspace", "delete"] as const,
};

/** -----------------
 * Queries (GET)
 * ----------------- */
export const useDescription = () =>
  useApiQuery({
    key: keys.description("suggestion"),
    url: `/common/session-data/`,
    method: "GET",
  });

export const useSuggestions = (category: string) =>
  useApiQuery({
    key: keys.suggestions(category),
    url: "/common/workspace-descriptions-filter",
    method: "GET",
    params: { description_category: category },
    enabled: !!category,
  });

export const useIndustries = () =>
  useApiQuery({
    key: keys.industries,
    url: "/common/industries",
    method: "GET",
  });

export const useUserType = () =>
  useApiQuery({
    key: keys.userTypes,
    url: "/common/industry-users",
    method: "GET",
  });

export const useTechnologies = () =>
  useApiQuery({
    key: keys.technologies,
    url: "/common/technologies",
    method: "GET",
  });

// NOTE: endpoint spelling kept as in your API: /common/plateforms
export const usePlatforms = () =>
  useApiQuery({
    key: keys.platforms,
    url: "/common/plateforms",
    method: "GET",
  });

export const useWorkspacesPrompt = () =>
  useApiQuery({
    key: keys.workspacesPrompt,
    url: "/common/prompts-byname/workspace",
    method: "GET",
  });

export const useWorkspaces = (
  page?: MaybeRef<number | undefined>,
  limit?: MaybeRef<number | undefined>,
  filter?: Ref<string>,
  isPaginated?: MaybeRef<boolean | undefined>
) => {
  const companyId = computed(() => {
    const hostname = window.location.hostname

    // ✅ Detect if we're on a subdomain (both orchit.ai, streamed.space and localhost)
    const isSubdomain =
      (hostname.endsWith('.orchit.ai') && hostname !== 'orchit.ai') ||
      (hostname.endsWith('.streamed.space') && hostname !== 'streamed.space') ||
      (hostname.endsWith('.localhost') && hostname !== 'localhost')

    // ✅ Parse auth_session cookie directly (same source of truth as auth store)
    let session: { company_id?: string; personal_mode?: boolean } | null = null
    try {
      const raw = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_session='))
        ?.split('=')[1]
      if (raw) session = JSON.parse(decodeURIComponent(raw))
    } catch { /* ignore */ }

    // ✅ On main domain with personal_mode=true → no company
    if (session?.personal_mode && !isSubdomain) return null

    // ✅ On subdomain → always use company_id from cookie
    // (ignores personal_mode even if stale from before redirect)
    if (isSubdomain && session?.company_id) return session.company_id

    // ✅ Fallback to cookie company_id for any other case
    if (session?.company_id) return session.company_id

    return null
  })

  return useQuery({
    queryKey: computed(() => [
      'workspaces',
      unref(page),
      unref(limit),
      unref(filter) ?? 'all',
      unref(companyId),
      unref(isPaginated)
    ]),

    queryFn: async () => {
      const pageVal = unref(page)
      const limitVal = unref(limit)
      const filterVal = unref(filter) ?? 'all'
      const company = unref(companyId)
      const isPaginatedVal = unref(isPaginated)

      let url = `/workspace/all?filter=${filterVal}`

      if (isPaginatedVal !== undefined) {
        url += `&is_paginated=${isPaginatedVal}`
      }

      // Only add page/limit if not explicitly disabled
      if (isPaginatedVal !== false) {
        if (pageVal) {
          url += `&page=${pageVal}`
        }
        if (limitVal) {
          url += `&limit=${limitVal}`
        }
      }

      if (company) {
        url += `&company_id=${company}`
      }

      return request({ url, method: 'GET' })
    },

    refetchOnMount: true,
    enabled: true,
  })
}
type CreateRolePayload = {
  title: string
  slug: string
  description?: string
  company_id?: string | null
  is_admin: boolean
  is_editor: boolean
  is_viewer: boolean
  permission_ids: string[]
}

export const useCreateCompanyRole = (options?: any) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateRolePayload) => {
      return request({
        url: "/roles/company-roles",
        method: "POST",
        data: payload,
      })
    },

    onSuccess: async (data:any, variables:any) => {
      
      await queryClient.invalidateQueries({
        queryKey: ["company-roles", variables.company_id || "personal"],
      })

      options?.onSuccess?.(data, variables)
    },

    ...options,
  })
}
export const useWorkspacesTitles = () => {
  const authStore = useAuthStore();

  return useApiQuery({
    key: computed(() => {
      const companyId = computed(() => 
  authStore.company_id ?? localStorage.getItem('company_id') ?? null
);
      return ["workspaces", "titles", companyId];
    }),
    url: "/workspace/titles",
    method: "GET",
    enabled: computed(() => !!authStore.company_id),
  });
};
type WorkspaceId = string | number | undefined;
type MaybeRef<T> = T | Ref<T>;

export const useSingleWorkspace = (id: MaybeRef<WorkspaceId>) => {
  const resolvedId = computed(() => unref(id));

  return useApiQuery(
    {
      key: computed(() =>
  resolvedId.value ? keys.singleWorkspace(resolvedId.value) : ["singleWorkspace"]
),
      url: computed(() => `/workspace/${resolvedId.value}`),
      method: 'GET',
      params: { is_archive: false },
      enabled: computed(() => !!resolvedId.value),
    },
    {
      staleTime: 3 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      retry: false,
    }
  );
};


export const useWorkspacesModules = () =>
  useApiQuery({
    key: keys.workspaceModules,
    url: "/common/workspace-modules",
    method: "GET",
  });

type IdLike =
  | Ref<string | number | null | undefined>
  | string
  | number
  | null
  | undefined;

export const useWorkspacesRoles = (id: IdLike) => {
  const authStore = useAuthStore();
  const idRef = computed(() => unref(id));

  return useQuery({
  queryKey: computed(() => {
      const wid = idRef.value ?? "";
      const companyId = computed(() => 
      authStore.company_id ?? localStorage.getItem('company_id') ?? null
   );
      return ["workspaceRoles", wid, companyId];
    }),
    enabled: computed(() => !!idRef.value),
    queryFn: async () => {
      const wid = idRef.value;
      if (!wid && wid !== 0) return [];
      return await api.get(`/workspace/teams/${wid}`).then((r) => r.data.data);
    },
    staleTime: 15_000,
  });
};
export const useWorkspacesVariables = () =>
  useApiQuery({
    key: keys.workspaceVariables,
    url: "/common/prompt-variables-filterable",
    method: "GET",
  });
export const useSharedUsers = (params: { resource_type: string; resource_id: string; workspace_id: string }) =>
  useApiQuery({
    key: ["shared-users", params.resource_type, params.resource_id, params.workspace_id],
    url: `/share/${params.resource_type}/${params.resource_id}`,
    method: "GET",
    params: { workspace_id: params.workspace_id },
    enabled: !!params.resource_id && !!params.workspace_id,
  });

export const useInvitedWorkspace = (id: string | number) =>
  useApiQuery({
    key: keys.invitedWorkspace(id),
    url: `/common/team/${id}`,
    method: "GET",
    enabled: !!id,
  });
export const useInvitedSpace = (id: string | number) =>
  useApiQuery({
    key: keys.invitedSpace(id),
    url: `common/space-invite/${id}`,
    method: "GET",
    enabled: !!id,
  });

export const useCheckProgress = (
  id: string | number,
  options?: Parameters<typeof useApiQuery>[1]
) =>
  useApiQuery(
    {
      key: keys.checkProgress(id),
      url: `/workspace/step2/tasks/${id}`,
      method: "GET",
      enabled: !!id,
    },
    options
  );

/** -----------------
 * Mutations (POST/PUT/DELETE)
 * ----------------- */

// payload: { ... }
export const useCreateWorkspaceWithAI = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: keys.createWorkspaceAI,
      url: "common/step-1-ai",
      method: "POST",
    },
    options as any
  );

  export const useCreateWorkspaceWithAIPrivate = (options = {}) =>
    useApiMutation<{ data: unknown }, any>(
      {
        key: keys.createWorkspaceAI,
        url: "workspace/step-1-ai",
        method: "POST",
      },
      options as any
    );
  
export const useCreateWorkspace = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: keys.createWorkspace,
      url: "/workspace",
      method: "POST",
    },
    options as any
  );

export const useCreateLanes = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: keys.createLanes,
      url: "/workspace/step-2-ai",
      method: "POST",
    },
    options as any
  );

// payload: { workspaceId, emails: string[] }
export const useInvitePeople = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: keys.invitePeople,
      url: "/workspace/invitation/send",
      method: "POST",
    },
    options as any
  );

export const useShareResource = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: ["share-resource"],
      url: "/share",
      method: "POST",
    },
    options as any
  );

export const useUpdateShareRole = (params: { type: string; id: string }, options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["update-share-role", params.type, params.id],
      url: `/share/${params.type}/${params.id}`,
      method: "PUT",
    },
    options as any
  );

export const useRemoveShareAccess = (params: { resource_type: string; resource_id: string }, options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["remove-share-access", params.resource_type, params.resource_id],
      url: `/share/${params.resource_type}/${params.resource_id}`,
      method: "DELETE",
    },
    options as any
  );

type UpdateInvitedVars = { id: string | number; payload: any };
export const useUpdateInvitedWorkspace = (options = {}) =>
  useApiMutation<any, UpdateInvitedVars>(
    {
      key: keys.updateInvited,
    } as any,
    {
      mutationFn: (vars: UpdateInvitedVars) =>
        request({
          url: `/common/team/${vars.id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type DeleteInvitedVars = { id: string | number };
export const useDeleteInvitedPeople = (options = {}) =>
  useApiMutation<any, DeleteInvitedVars>(
    { key: keys.deleteInvited } as any,
    {
      mutationFn: (vars: DeleteInvitedVars) =>
        request({
          url: `/common/team/${vars.id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );

export const useUpdateWorkspace = (options = {}) =>
  useApiMutation<any>(
    {
      key: ["update-workspace"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `/workspace/team/${vars.id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useUpdateWorkspaceDetail = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: ["update-WS"],
      url: `/workspace`,
      method: "PATCH",
    },
    options as any
  );

export const getTasks = (id: any) =>
  api.get(`/workspace/user/${id}/assigned-cards`).then((r) => r.data);

export function useTasks(userId: any) {
  return useQuery({
    queryKey: computed(() => ["tasks", unref(userId)]),
    queryFn: async () => {
      const id = unref(userId)!;
      // your API call here
      return await getTasks(id);
    },
    enabled: computed(() => !!unref(userId)), // don't run until we have an id
  });
}
function getCompanyId(): string | null {
  const hostname = window.location.hostname

  const isSubdomain =
    (hostname.endsWith('.orchit.ai') && hostname !== 'orchit.ai') ||
    (hostname.endsWith('.streamed.space') && hostname !== 'streamed.space') ||
    (hostname.endsWith('.localhost') && hostname !== 'localhost')

  // ✅ Read from auth_session cookie — single source of truth
  let session: { token?: string; company_id?: string; personal_mode?: boolean } | null = null
  try {
    const raw = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_session='))
      ?.split('=')[1]
    if (raw) session = JSON.parse(decodeURIComponent(raw))
  } catch { /* ignore */ }

  // ✅ Personal mode on main domain → no company
  if (session?.personal_mode && !isSubdomain) return null

  // ✅ On subdomain → trust company_id from cookie
  if (isSubdomain && session?.company_id) return session.company_id

  // ✅ Main domain without personal_mode → use company_id if present
  if (session?.company_id && !session?.personal_mode) return session.company_id

  return null
}
export const getUsers = () => {
  const companyId = getCompanyId() 
  
  const url = companyId
    ? `workspace/team-users?company_id=${companyId}`
    : `workspace/team-users`

  return api.get(url).then((r) => r.data)
}
export function useUsers() {
  return useQuery({
    queryKey: computed(() => ["all-users"]),
    queryFn: async () => { 
      // your API call here
      return await getUsers();
    }, 
  });
}

type DeleteWorkspaceVars = { id: string | number };
export const useDeleteWorkspace = (options = {}) =>
  useApiMutation<any, DeleteWorkspaceVars>(
    { key: keys.deleteWorkspace } as any,
    {
      mutationFn: (vars: DeleteWorkspaceVars) =>
        request({
          url: `/workspace/${vars.id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );

export const useArchiveWorkspace = (options = {}) =>
  useApiMutation<any, { id: string | number }>(
    { key: ["workspace", "archive"] } as any,
    {
      mutationFn: (vars: { id: string | number }) =>
        request({
          url: `/workspace/${vars.id}/archive`,
          method: "PATCH",
        }),
      ...(options as any),
    } as any
  );



  export const useSingleWorkspaceCompany = (workspaceIdCompany: Ref<string | number>, options = {}) => {
  return useQuery({
    queryKey: ["workspaceCompany", workspaceIdCompany],
    queryFn: ({ signal }) => request({ url: `/workspace/${unref(workspaceIdCompany)}`, method: "GET", signal }),
    ...options,
  });
};
export const useWorkspaceModulesAndUsers = (workspaceId: Ref<string>) => {
  return useQuery({
    queryKey: ["workspace-modules-and-users", workspaceId],
    queryFn: async () => {
      const workspaceIdVal = unref(workspaceId)

      if (!workspaceIdVal) {
        console.warn("⚠️ useWorkspaceModulesAndUsers: No workspace_id provided")
        return { data: { modules: [], company_users: [] } }
      }

      const url = `/workspace/${workspaceIdVal}/modules-and-users`

      console.log("📡 Fetching:", url)

      return request({
        url,
        method: "GET",
      })
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    // ✅ Only guard on workspaceId — this query is used on the list page
    // where there is no route workspaceId, so we must NOT check authStore.company_id
    enabled: computed(() => !!unref(workspaceId)),
  })
}

export function useWorkspaceProcessFlow(workspaceId: Ref<string | undefined> | string | undefined) {
  return useQuery({
    queryKey: computed(() => keys.workspaceProcessFlow(unref(workspaceId) || "")),
    queryFn: async () => {
      const id = unref(workspaceId)
      if (!id) return null

      return request({
        url: `/workspace/${id}/process-flow`,
        method: "GET",
      })
    },
    staleTime: 1000 * 60 * 5,
    refetchOnMount: true,
    enabled: computed(() => !!unref(workspaceId)),
  })
}
