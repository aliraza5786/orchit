import { computed, unref, type Ref } from "vue";
import { useQuery, type UseQueryOptions } from "@tanstack/vue-query";
import { useApiMutation } from "../libs/vq";
import { request } from "../libs/api";


/** -----------------------------
 * Stable query keys
 * ----------------------------- */
export const keys = {
  sheets: (wmId?: string | number, wId?: string | number) =>
    ["sheets", wmId, wId] as const,
  sheetList: (
    moduleId?: string | number,
    sheetId?: string | number,
    laneIds?: string | number | (string | number)[] | null | undefined,
    viewBy?: string | number
  ) => ["sheet-list", moduleId, sheetId, laneIds, viewBy] as const,
};

/** -----------------------------
 * Mutations
 * ----------------------------- */

// POST /sheets  (create workspace sheet)
export const useCreateWorkspaceSheet = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: ["product-sheet"],
      url: "/sheets/add",
      method: "POST",
    },
    options as any
  );

export const useCreateWorkspaceSheetAI = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: ["product-sheet-ai"],
      url: "/workspace/generate-sheet-ai",
      method: "POST",
    },
    options as any
  );

export const useUpdateWorkspaceSheet = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: ["upadte-sheet"],
      url: "/workspace/sheet/update",
      method: "PATCH",
    },
    options as any
  );

// PATCH /workspace/sheet-list/update
export const useMoveList = (options = {}) =>
  useApiMutation<{ data: unknown }, { payload: any }>(
    {
      key: ["move-list"],
      url: "/workspace/sheet-list/update",
      method: "PATCH",
    },
    options as any
  );

// PATCH /workspace/cards/update
export const useMoveCard = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: ["move-card"],
      url: "/workspace/cards/update",
      method: "PATCH",
    },
    options as any
  );

// POST /workspace/catalog/variable/value
export const useAddList = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: ["add-list"],
      url: "/workspace/catalog/variable/value",
      method: "POST",
    },
    options as any
  );
// POST /workspace/catalog/variable/value
export const useAddTicket = (options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: ["add-ticket"],
      url: "/workspace/cards/add",
      method: "POST",
    },
    options as any
  );
export const useDeleteTicket = (id: string, options = {}) =>
  useApiMutation<{ data: unknown }, any>(
    {
      key: ["delete-ticket", id],
      url: `workspace/card/${id}`,
      method: "DELETE",
    },
    options as any
  );


type UpdateTicketVars = { id: any; payload: any };

export const useUpdateTicket = (options = {}) =>
  useApiMutation<any, UpdateTicketVars>(
    { key: ["workspace-ticket", "update"] } as any,
    {
      mutationFn: (vars: UpdateTicketVars) =>
        request({
          url: `workspace/card/${vars.id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

/** -----------------------------
 * Queries
 * ----------------------------- */

export const useSheets = (
  queryParams: {
    workspace_module_id: any;
    workspace_id?: any;
  },
  options = {}
) => {
  const wmId = computed(() => unref(queryParams.workspace_module_id));
  const wId = computed(() => unref(queryParams.workspace_id));

  return useQuery({
    queryKey: keys.sheets(queryParams.workspace_module_id, wId.value),
    enabled: computed(() => !!wmId.value),
    queryFn: ({ signal }) =>
      request<any>({
        url: "/sheets",
        method: "GET",
        params: {
          workspace_module_id: wmId.value,
          workspace_id: wId.value,
        },
        signal,
      }).then((d) => d),
    ...options,
  });
};

// tiny helper for typing; you can omit if you like
type MaybeRef<T> = T | Ref<T>;

export function useSheetList(
  module_id: MaybeRef<string | null | undefined>,
  sheet_id: MaybeRef<string | null | undefined>,
  laneIds: MaybeRef<string[] | string | null | undefined>,
  view_by: MaybeRef<string | null | undefined>,
  extraParams?: MaybeRef<Record<string, any> | undefined>,
  options: Omit<
    UseQueryOptions<any, any, any, any>,
    "queryKey" | "queryFn"
  > = {}
) {
  // normalize laneIds -> "a,b,c"
  const laneIdsParam = computed<string | undefined>(() => {
    const v = unref(laneIds);
    if (v == null) return undefined;
    if (Array.isArray(v)) {
      const s = Array.from(
        new Set(v.map((x) => String(x).trim()).filter(Boolean))
      ).join(",");
      return s || undefined;
    }
    const one = String(v).trim();
    return one || undefined;
  });

  // reactive query key
  const queryKey = computed(() => [
    "sheet-list",
    unref(module_id),
    unref(sheet_id),
    unref(laneIdsParam),
    unref(view_by),
    unref(extraParams),
  ]);

  // reactive enabled
  const enabled = computed(() =>
    Boolean(unref(module_id) && unref(sheet_id) && unref(view_by))
  );

  return useQuery({
    retry: 0,
    queryKey, // pass the computed directly
    enabled, // pass the computed directly
    // keep previous data while switching keys (optional)
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const params = {
        module_id: unref(module_id)!,
        sheet_id: unref(sheet_id)!,
        variable_id: unref(view_by)!,
        ...(unref(laneIdsParam) ? { lane_ids: unref(laneIdsParam)! } : {}),
        ...(unref(extraParams) || {}),
      };

      // request() should return plain JSON (not AxiosResponse)
      return request({
        url: "/workspace/cards/grouped",
        method: "GET",
        params,
      });
    },
    refetchOnMount:false,
    ...options,
  });
}

export const useVariables = (
  workspace_id: Ref<string>,
  module_id: Ref<string>,
  sheetId: Ref<string>,
  options = {}
) => {
  return useQuery({
    queryKey: [
      "all-module-variables",
      unref(workspace_id),
      unref(module_id),
      unref(sheetId),
    ],
    enabled: computed(() => Boolean(unref(module_id))),
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const resolvedModuleId = unref(module_id);

      const [variables, typesData] = await Promise.all([
        request({
          url: `/workspace/catalog/${unref(workspace_id)}/card-variables/${resolvedModuleId}?sheet_id=${unref(sheetId)}`,
          method: "GET",
          signal,
        }),
        request({
          url: `/workspace/catalog/variable/values`,
          method: "GET",
          params: {
            workspace_id: unref(workspace_id),
            module_id: resolvedModuleId,
            variable_slug: "card-type",
          },
          signal,
        }),
      ]);

      const processTypes = typesData?.values ?? [];

      if (Array.isArray(variables)) {
        return variables.map((v) =>
          v.slug?.toLowerCase() === "process"
            ? {
                ...v,
                nested: processTypes.map((ct:any) => ({
                  _id: ct._id ?? ct.value,
                  title: ct.value,
                  ...ct,
                })),
              }
            : v
        );
      }

      return variables;
    },
    ...options,
  });
};

export const useLanes = (
  workspace_id: any,
  options = {}
) => {
  return useQuery({
    queryKey: computed(() => ["all-module-lanes", unref(workspace_id)]),
    queryFn: async ({ signal }) => {
      const wid = unref(workspace_id);
      if (!wid) return [];
      return request<any>({
        url: `/workspace/lane-by-workspace/${wid}`,
        method: "GET",
        signal,
      });
    },
    enabled: computed(() => !!unref(workspace_id)),
    ...options,
  });
};

type createVAr = { payload: any };
export const useCreateVar = (options = {}) =>
  useApiMutation<any, createVAr>(
    {
      key: ["addVariables"],
    } as any,
    {
      mutationFn: (vars: createVAr) =>
        request({
          url: `workspace/catalog/variable/add`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

export const ReOrderList = (options = {}) =>
  useApiMutation<any, createVAr>(
    {
      key: ["reorder-list"],
    } as any,
    {
      mutationFn: (vars: createVAr) =>
        request({
          url: `workspace/cards/group-order`,
          method: "PATCH",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

export const ReOrderCard = (options = {}) =>
  useApiMutation<any, createVAr>(
    {
      key: ["reorder-card"],
    } as any,
    {
      mutationFn: (vars: createVAr) =>
        request({
          url: `workspace/cards/group-card-order`,
          method: "PATCH",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useVarVisibilty = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["var-visibility"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `workspace/sheet-column-preferences`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
