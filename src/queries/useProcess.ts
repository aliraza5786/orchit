import { useQuery } from "@tanstack/vue-query";
import { request } from "../libs/api";
import { useApiMutation } from "../libs/vq";
import { unref } from "vue";

export const useProcessColumns = (workspace_id: any, options = {}) => {
  return useQuery({
    queryKey: ["process-columns", workspace_id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/process-columns?workspace_id=${unref(workspace_id)}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};

export const useProcessList = (workspace_id: any, options = {}) => {
  return useQuery({
    queryKey: ["process-list", workspace_id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/processes?workspace_id=${unref(workspace_id)}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};

type CreateProcessColumn = { payload: any };
export const useCreateProcessColumn = (options = {}) =>
  useApiMutation<any, CreateProcessColumn>(
    {
      key: ["create-process-column"],
    } as any,
    {
      mutationFn: (vars: CreateProcessColumn) =>
        request({
          url: `/workspace/process-columns`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type UpdateProcessColumn = { payload: any; id: any };
export const useUpdateProcessColumn = (options = {}) =>
  useApiMutation<any, UpdateProcessColumn>(
    {
      key: ["update-process-column"],
    } as any,
    {
      mutationFn: (vars: UpdateProcessColumn) =>
        request({
          url: `/workspace/process-columns/${vars.id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type DeleteProcessColumn = { id: any };
export const useDeleteProcessColumn = (options = {}) =>
  useApiMutation<any, DeleteProcessColumn>(
    {
      key: ["delete-process-column"],
    } as any,
    {
      mutationFn: (vars: DeleteProcessColumn) =>
        request({
          url: `/workspace/process-columns/${vars.id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );

type CreateProcess = { payload: any };
export const useCreateProcess = (options = {}) =>
  useApiMutation<any, CreateProcess>(
    {
      key: ["create-process"],
    } as any,
    {
      mutationFn: (vars: CreateProcess) =>
        request({
          url: `/workspace/processes`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type UpdateProcess = { payload: any; id: any };
export const useUpdateProcess = (options = {}) =>
  useApiMutation<any, UpdateProcess>(
    {
      key: ["update-process"],
    } as any,
    {
      mutationFn: (vars: UpdateProcess) =>
        request({
          url: `/workspace/processes/${vars.id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type DeleteProcess = { id: any };
export const useDeleteProcess = (options = {}) =>
  useApiMutation<any, DeleteProcess>(
    {
      key: ["delete-process"],
    } as any,
    {
      mutationFn: (vars: DeleteProcess) =>
        request({
          url: `/workspace/processes/${vars.id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );

export const useWorkflowData = (process_id: any, options = {}) => {
  return useQuery({
    queryKey: ["workflow-data", process_id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `workspace/workflows/${unref(process_id)}`,
        method: "GET",
        signal,
      }),
    enabled: !!unref(process_id),
    ...options,
  });
};

type CreateStatus = { payload: any };
export const useCreateStatus = (options = {}) =>
  useApiMutation<any, CreateStatus>(
    {
      key: ["create-status"],
    } as any,
    {
      mutationFn: (vars: CreateStatus) =>
        request({
          url: `/workspace/workflow-statuses`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type UpdateStatus = { payload: any; id: any };
export const useUpdateStatus = (options = {}) =>
  useApiMutation<any, UpdateStatus>(
    {
      key: ["update-status"],
    } as any,
    {
      mutationFn: (vars: UpdateStatus) =>
        request({
          url: `/workspace/workflow-statuses/${vars.id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type DeleteStatus = { id: any };
export const useDeleteStatus = (options = {}) =>
  useApiMutation<any, DeleteStatus>(
    {
      key: ["delete-status"],
    } as any,
    {
      mutationFn: (vars: DeleteStatus) =>
        request({
          url: `/workspace/workflow-statuses/${vars.id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );

type CreateTransition = { payload: any };
export const useCreateTransition = (options = {}) =>
  useApiMutation<any, CreateTransition>(
    {
      key: ["create-transition"],
    } as any,
    {
      mutationFn: (vars: CreateTransition) =>
        request({
          url: `/workspace/workflow-transitions`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type UpdateTransition = { payload: any; id: any };
export const useUpdateTransition = (options = {}) =>
  useApiMutation<any, UpdateTransition>(
    {
      key: ["update-transition"],
    } as any,
    {
      mutationFn: (vars: UpdateTransition) =>
        request({
          url: `/workspace/workflow-transitions/${vars.id}`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

type DeleteTransition = { id: any };
export const useDeleteTransition = (options = {}) =>
  useApiMutation<any, DeleteTransition>(
    {
      key: ["delete-transition"],
    } as any,
    {
      mutationFn: (vars: DeleteTransition) =>
        request({
          url: `/workspace/workflow-transitions/${vars.id}`,
          method: "DELETE",
        }),
      ...(options as any),
    } as any
  );
