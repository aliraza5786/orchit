import { useQuery } from "@tanstack/vue-query";
import { request } from "../libs/api";
import { useApiMutation } from "../libs/vq";
import { unref, type Ref, computed } from "vue"; 
// import type { DashboardTeamsData } from "../types";

export const usePeopleList = (
  workspace_id: Ref<string>,
  viewID: Ref<string>,
  options = {}
) => {
  return useQuery({
    queryKey: [
      "people-lists",
      unref(workspace_id),
      unref(viewID),
    ],
    staleTime: 5 * 60 * 1000,
    queryFn: ({ signal }) =>
      request({
        url: `workspace/teams/${unref(workspace_id)}/people-grouped`,
        method: "GET",
        params: {
          groupBy: unref(viewID),
        },
        signal,
      }),
    ...options,
  });
};

// create team
type createTeam = { payload: any };
export const useCreateTeam = (options = {}) =>
  useApiMutation<any, createTeam>(
    {
      key: ["add-team"],
    } as any,
    {
      mutationFn: (vars: createTeam) =>
        request({
          url: `/workspace/roles`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
type upadteTeam = { payload: any; id: any };
export const useUpdateTeam = (options = {}) =>
  useApiMutation<any, upadteTeam>(
    {
      key: ["update-team"],
    } as any,
    {
      mutationFn: (vars: upadteTeam) =>
        request({
          url: `/workspace/roles/${vars.id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type deleteTeam = { id: any };
export const useDeleteTeam = (options = {}) =>
  useApiMutation<any, deleteTeam>(
    {
      key: ["delete-team"],
    } as any,
    {
      mutationFn: (vars: deleteTeam) =>
        request({
          url: `/workspace/roles/${vars.id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );

export const useDeleteSeat = (options = {}) =>
  useApiMutation<any, deleteTeam>(
    {
      key: ["delete-seat"],
    } as any,
    {
      mutationFn: (vars: deleteTeam) =>
        request({
          url: `common/team/${vars.id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );
export const usePeople = (workspace_id: any, company_id: any, options = {}) => {  
  return useQuery({
    queryKey: ["people", company_id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/people?workspace_id=${workspace_id}&company_id=${unref(company_id)._id}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};

export const useAssignTeam = (options = {}) =>
  useApiMutation<any, upadteTeam>(
    {
      key: ["assign-team"],
    } as any,
    {
      mutationFn: (vars: upadteTeam) =>
        request({
          url: `/common/seats/${vars.id}/reassign`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useUnAssignTeam = (options = {}) =>
  useApiMutation<any>(
    {
      key: ["unassign-team"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `/common/seats/${vars.id}/unassign`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useCreateTeamMember = (options = {}) =>
  useApiMutation<any>(
    {
      key: ["add-team-member"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `common/workspace-roles/${vars.id}/seats/add`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
  export const usePeopleVar = (options = {}) => {
    return useQuery({
      queryKey: ["people-var"],
      queryFn: ({ signal }) =>
        request<any>({
          url: `/common/module-variables/filter?module=people`,
          method: "GET",
          signal,
        }),
      ...options,
    });
  };


  export const useUpdateVar = (options = {}) =>
    useApiMutation<any>(
      {
        key: ["update-var"],
      } as any,
      {
        mutationFn: (vars: any) =>
          request({
            url: `common/seats/${vars.id}/variables`,
            method: "PUT",
            data: vars.payload,
          }),
        ...(options as any),
      } as any
    );

export const useDashboardTeams = (workspace_id: Ref<string> | string, options = {}) => {
  return useQuery({
    queryKey: ["dashboard-teams", workspace_id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/dashboard-teams/${unref(workspace_id)}`,
        method: "GET",
        signal,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: "always",
    enabled: !!unref(workspace_id),
    ...options,
  });
};
 export const useDashboardActivities = (
  workspace_id: Ref<string> | string,
  options = {}
) => {
  const workspaceIdRef = computed(() => unref(workspace_id))

  return useQuery({
    queryKey: computed(() => [
      'dashboard-activities',
      workspaceIdRef.value,
    ]),

    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/${workspaceIdRef.value}/activities`,
        method: 'GET',
        signal,
      }),

    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,

    gcTime: 10 * 60 * 1000,

    enabled: computed(() => !!workspaceIdRef.value),

    ...options,
  })
}

export const ReOrderList = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["reorder-list-people"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `/workspace/${vars.id}/roles/sort-order`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

export const ReOrderCard = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["reorder-card-people"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `workspace/roles/${vars.id}/team/sort-order`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );



// work space roles
export const useWorkspaceRoles = (
  params: { company_id: any; workspace_id?: any },
  options = {}
) => {
  const { company_id, workspace_id } = params;

  return useQuery({
    queryKey: ["workspace-roles", company_id, workspace_id],
    queryFn: ({ signal }) => {
      let url = `roles/workspace-access-roles?company_id=${unref(company_id)}`;
      
      if (unref(workspace_id)) {
        url += `&workspace_id=${unref(workspace_id)}`;
      }

      return request<any>({
        url,
        method: "GET",
        signal,
      });
    },
    enabled: !!unref(company_id),
    ...options,
  });
};



 interface AssignRolePayload {
  id: string;
  workspace_access_role_id: string;
}

export const useAssignRole = (options = {}) => {
  return useApiMutation<any, AssignRolePayload>(
    {
      key: ["assign-role"],
    } as any,
    {
      mutationFn: (vars: AssignRolePayload) =>
        request({
          url: `common/team/${vars.id}`,
          method: "PUT",
          data: { workspace_access_role_id: vars.workspace_access_role_id },
        }),
      ...(options as any),
    } as any
  );
};

// team role
export const useWorkspaceTeamRoles = (workspace_id: any, options = {}) => {
  return useQuery({
    queryKey: ["team-roles", workspace_id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/workspace-roles/${workspace_id.value}`,
        method: "GET",
        signal,
      }),
    enabled: !!workspace_id,
    ...options,
  });
};



// custom roles permissions
export const useAllPermissions = (
  params: { scope?: any; workspace_id?: any },
  options = {}
) => {
  const { scope, workspace_id } = params;
  return useQuery({
    queryKey: ["all-permissions", scope?.value, workspace_id?.value],
    queryFn: ({ signal }) => {
      let url = `roles/permissions/grouped`;
      const queryParams = new URLSearchParams();
      
      if (scope?.value) queryParams.append('scope', scope.value);
      if (workspace_id?.value) queryParams.append('workspace_id', workspace_id.value);
      
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;

      return request<any>({
        url,
        method: "GET",
        signal,
      });
    },
    ...options,
  });
};

// create custom roles

export const useCreateRole = (options = {}) =>
  useApiMutation<any>(
    {
      key: ["create-role"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `/roles/workspace-access-roles`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );


 
