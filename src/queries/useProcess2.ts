import { useQuery } from "@tanstack/vue-query";
import { request } from "../libs/api";
import { useApiMutation } from "../libs/vq";
import { unref } from "vue";

/* -------------------------------------------------------------------------- */
/*                                Process Groups                              */
/* -------------------------------------------------------------------------- */

export const useProcessGroupsWithTransitions = (workspace_id: any, options = {}) => {
  return useQuery({
    queryKey: ["process-groups-with-transitions", workspace_id],
    queryFn: ({ signal }) => {
      const wsId = unref(workspace_id);
      if (!wsId) return Promise.resolve(null);
      return request<any>({
        url: `workspace/${wsId}/process-groups/with-transitions?sort=sort_order`,
        method: "GET",
        signal,
      });
    },
    enabled: !!unref(workspace_id),
    ...options,
  });
};

type CreateProcessGroupPayload = {
    workspace_id: string;
    title: string;
    description?: string;
    color?: string;
    icon?: string;
    sort_order?: number;
};

export const useCreateProcessGroup = (options = {}) =>
  useApiMutation<any, CreateProcessGroupPayload>(
    {
      key: ["create-process-group"],
    } as any,
    {
      mutationFn: (vars: CreateProcessGroupPayload) =>
        request({
            // The API doc says POST /api/v1/workspace/:workspace_id/process-groups
            // But usually our request helper takes the relative path. 
            // We need to inject workspace_id into the URL.
          url: `workspace/${vars.workspace_id}/process-groups`,
          method: "POST",
          data: vars,
        }),
      ...(options as any),
    } as any
  );

type UpdateProcessGroupPayload = {
  workspace_id: string;
  group_id: string;
  payload: {
    title?: string;
    description?: string;
    color?: string;
    icon?: string;
    sort_order?: number;
    is_active?: boolean;
  };
};

export const useUpdateProcessGroup = (options = {}) =>
  useApiMutation<any, UpdateProcessGroupPayload>(
    {
      key: ["update-process-group"],
    } as any,
    {
      mutationFn: (vars: UpdateProcessGroupPayload) =>
        request({
          url: `workspace/${vars.workspace_id}/process-groups/${vars.group_id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type DeleteProcessGroupPayload = {
  workspace_id: string;
  group_id: string;
};

export const useDeleteProcessGroup = (options = {}) =>
  useApiMutation<any, DeleteProcessGroupPayload>(
    {
      key: ["delete-process-group"],
    } as any,
    {
      mutationFn: (vars: DeleteProcessGroupPayload) =>
        request({
          url: `workspace/${vars.workspace_id}/process-groups/${vars.group_id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );


type ReorderProcessGroupsPayload = {
    workspace_id: string;
    groups: {
        group_id: string;
        sort_order: number;
    }[];
};

export const useReorderProcessGroups = (options = {}) =>
  useApiMutation<any, ReorderProcessGroupsPayload>(
    {
      key: ["reorder-process-groups"],
    } as any,
    {
      mutationFn: (vars: ReorderProcessGroupsPayload) =>
        request({
          url: `workspace/${vars.workspace_id}/process-groups/reorder`,
          method: "POST",
          data: { groups: vars.groups },
        }),
      ...(options as any),
    } as any
  );


/* -------------------------------------------------------------------------- */
/*                           Process Flow Transitions                         */
/* -------------------------------------------------------------------------- */


type CreateTransitionPayload = {
   workspace_id: string;
   group_id: string;
   from_status?: string;
   to_status?: string;
   title?: string;
   description?: string;
   transition_type?: string;
   variable_type?: string;
   sort_id?: number;
   flow_metadata?: object;
   raw_object?: object;
   conditions?: object;
};

export const useCreateTransition = (options = {}) =>
  useApiMutation<any, CreateTransitionPayload>(
    {
      key: ["create-process-transition"],
    } as any,
    {
      mutationFn: (vars: CreateTransitionPayload) =>
        request({
          url: `workspace/${vars.workspace_id}/process-transitions`,
          method: "POST",
          data: vars,
        }),
      ...(options as any),
    } as any
  );

type UpdateTransitionPayload = {
    workspace_id: string;
    transition_id: string;
    payload: {
        title?: string;
        description?: string;
        variable_type?: string;
        sort_id?: number;
        is_active?: boolean;
        transition_type?: string;
        [key: string]: any;
    };
};

export const useUpdateTransition = (options = {}) =>
  useApiMutation<any, UpdateTransitionPayload>(
    {
      key: ["update-process-transition"],
    } as any,
    {
      mutationFn: (vars: UpdateTransitionPayload) =>
        request({
          url: `workspace/${vars.workspace_id}/process-transitions/${vars.transition_id}`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type DeleteTransitionPayload = {
    workspace_id: string;
    transition_id: string;
};

export const useDeleteTransition = (options = {}) =>
  useApiMutation<any, DeleteTransitionPayload>(
    {
      key: ["delete-process-transition"],
    } as any,
    {
      mutationFn: (vars: DeleteTransitionPayload) =>
        request({
          url: `workspace/${vars.workspace_id}/process-transitions/${vars.transition_id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );

type ReorderTransitionsPayload = {
    workspace_id: string;
    group_id: string;
    transitions: {
        transition_id: string;
        sort_id: number;
    }[];
};

export const useReorderTransitions = (options = {}) =>
  useApiMutation<any, ReorderTransitionsPayload>(
    {
      key: ["reorder-process-transitions"],
    } as any,
    {
      mutationFn: (vars: ReorderTransitionsPayload) =>
        request({
          url: `workspace/${vars.workspace_id}/process-groups/${vars.group_id}/transitions/reorder`,
          method: "POST",
          data: { transitions: vars.transitions },
        }),
      ...(options as any),
    } as any
  );

export const useProcessTransition = (workspace_id: any, transition_id: any, options = {}) => {
  return useQuery({
    queryKey: ["process-transition", workspace_id, transition_id],
    queryFn: ({ signal }) => {
      const wsId = unref(workspace_id);
      const trId = unref(transition_id);
      if (!wsId || !trId) return Promise.resolve(null);
      return request<any>({
        url: `workspace/${wsId}/process-transitions/${trId}`,
        method: "GET",
        signal,
      });
    },
    enabled: !!unref(workspace_id) && !!unref(transition_id),
    ...options,
  });
};

/* -------------------------------------------------------------------------- */
/*                                Card Types                                  */
/* -------------------------------------------------------------------------- */

export const useFilteredCardTypes = (workspace_id: any, options = {}) => {
  return useQuery({
    queryKey: ["filtered-card-types", workspace_id],
    queryFn: ({ signal }) => {
      const wsId = unref(workspace_id);
      if (!wsId) return Promise.resolve(null);
      return request<any>({
        url: `common/cardtypes-filtered?workspace_id=${wsId}&default=true`,
        method: "GET",
        signal,
      });
    },
    enabled: !!unref(workspace_id),
    ...options,
  });
};
