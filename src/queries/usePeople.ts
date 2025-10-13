import { useQuery } from "@tanstack/vue-query";
import { request } from "../libs/api";
import { useApiMutation } from "../libs/vq";
import { unref } from "vue";

export const usePeopleList = (workspace_id: any, viewID: any, options = {}) => {
  return useQuery({
    queryKey: ["people-lists", viewID],
    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/teams/${workspace_id}/people-grouped?groupBy=${unref(
          viewID
        )}`,
        method: "GET",
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
