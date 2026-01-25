import { useQuery } from "@tanstack/vue-query";
import { request } from "../libs/api";
// import { unref } from "vue";
import { useApiMutation } from "../libs/vq";
import { unref, computed } from "vue";
import type { Ref } from "vue";

export const useSprintList = (
  workspace_id: Ref<string> | string,
  sprintType: Ref<string> | string,
  options = {}
) => {
  return useQuery({
    queryKey: computed(() => [
      "sprint-list",
      unref(workspace_id),
      unref(sprintType)
    ]),
    queryFn: ({ signal }) =>
      request<any>({
        url: `sprints/${unref(workspace_id)}`,
        method: "GET",
        signal,
        params: {
          sprintType: unref(sprintType),
        },
      }),
    ...options,
  });
};

export const useSprintCard = (id: any, options: any = {}) => {
  const enabled = computed(() => !!unref(id));

  return useQuery({
    queryKey: ["sprint-cards", id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `sprints/${unref(id)}/backlog`,
        method: "GET",
        signal,
      }),
    enabled,
    ...options, 
  });
};
export const useSprintKanban = (
  sprint_id: any,
  options = {}
) => {
  return useQuery({
    queryKey: ["sprint-kanban", sprint_id],

    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/cards/sprintgrouped`,
        method: "GET",
        signal,
        params: {
          sprint_id: unref(sprint_id),
          variable_id: "68b6c96e0a95eef7d14e6981", 
          // sheet_id: unref(sheet_id), 
        },
      }),

    ...options,
  });
};

export const useCompleteSprint = (sprint_id: any, options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["sprint-complete"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `sprints/${unref(sprint_id)}/complete`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useSprintDetail = (id: any, options = {}) => {
  const enabled = computed(() => !!unref(id));
  return useQuery({
    queryKey: ["sprint-detail", id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `sprints/detail/${unref(id)}?include_cards=true`,
        method: "GET",
        signal,
      }),
       enabled,
    ...options,
  });
};
export const useBacklogList = (
  workspaceId: Ref<string> | string,
  sprintType: Ref<string> | string,
  moduleId: Ref<string | number | null> | string | number | null = null,
  options = {}
) => {
  return useQuery({
    queryKey: ["backlog-list", workspaceId, unref(sprintType), unref(moduleId)],

    queryFn: ({ signal }) =>
      request<any>({
        url: `sprints/workspace/${unref(workspaceId)}/cards`,
        method: "GET",
        signal,
        params: {
          include_sprint_cards: false, // static param
          sprintType: unref(sprintType),
          module_id: unref(moduleId), // new dynamic param
        },
      }),

    ...options,
  });
};
// create team
type createTeam = { payload: any };
export const useCreateSprint = (options = {}) =>
  useApiMutation<any, createTeam>(
    {
      key: ["add-sprint"],
    } as any,
    {
      mutationFn: (vars: createTeam) =>
        request({
          url: `/sprints`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useMoveCard = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["move-card-to-sprint"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `/sprints/${vars.id}/cards`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

export const useUpdateSprint = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["add-sprint"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `/sprints/${vars.id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useStartSprint = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["start-sprint"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `/sprints/${vars.id}/start`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

export const useDeleteSprint = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["delete-sprint"],
    } as any,
    {
      mutationFn: (id: any) =>
        request({
          url: `/sprints/${id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );

export const useRemoveCardFromSprint = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["remove-card-from-sprint"],
    } as any,
    {
      mutationFn: (vars: { sprintId: string; cardId: string }) =>
        request({
          url: `sprints/${unref(vars.sprintId)}/cards/remove `,
          method: "POST",
          data: { card_ids: [vars.cardId] },
        }),
      ...(options as any),
    } as any
  );