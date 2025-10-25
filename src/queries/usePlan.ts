import { useQuery } from "@tanstack/vue-query";
import { request } from "../libs/api";
// import { unref } from "vue";
import { useApiMutation } from "../libs/vq";
import { unref } from "vue";

export const useSprintList = (workspace_id: any, options = {}) => {
  return useQuery({
    queryKey: ["sprint-list"],
    queryFn: ({ signal }) =>
      request<any>({
        url: `sprints/${workspace_id}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};
export const useSprintCard = (id: any, options = {}) => {
  return useQuery({
    queryKey: ["sprint-cards", id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `sprints/${unref(id)}/backlog`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};
export const useSprintKanban = (sprint_id: any, options = {}) => {
  return useQuery({
    queryKey: ["sprint-kanban", sprint_id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/cards/sprintgrouped?sprint_id=${unref(
          sprint_id
        )}&variable_id=68b6c96e0a95eef7d14e6981`,
        method: "GET",
        signal,
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
  return useQuery({
    queryKey: ["sprint-detail", id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `sprints/detail/${unref(id)}?include_cards=true`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};
export const useBacklogList = (id: any, options = {}) => {
  return useQuery({
    queryKey: ["backlog-list", id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `sprints/workspace/${unref(id)}/cards?include_sprint_cards=false`,
        method: "GET",
        signal,
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
