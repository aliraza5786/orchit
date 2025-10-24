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
export const useSprintDetail = (id: any, options = {}) => {
  return useQuery({
    queryKey: ["sprint-detail", id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `sprints/detail/${unref(id)}`,
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
