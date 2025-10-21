import { useQuery } from "@tanstack/vue-query";
import { request } from "../libs/api";
import { useApiMutation } from "../libs/vq";
import { unref, computed } from "vue";
import {
  sampleProcessColumns,
  sampleProcesses,
  sampleWorkflowStatuses,
  sampleWorkflowTransitions,
} from "../data/sampleData";

export const useProcessSheets = (workspace_id: any, options = {}) => {
  return useQuery({
    queryKey: ["process-sheets", workspace_id],
    queryFn: ({ signal }) => {
      return request<any>({
        url: `workspace/${workspace_id}/process-flow`,
        method: "GET",
        signal,
      });
    },
    ...options,
  });
};

export const useProcessWorkflow = (workspace_id: any, options = {}) => {
  return useQuery({
    queryKey: ["process-workflow", workspace_id],
    queryFn: ({ signal }) => {
      return request<any>({
        url: `workspace/${workspace_id}/process-flow/transitions`,
        method: "GET",
        signal,
      });
    },
    ...options,
  });
};

export const useProcessColumns = (
  workspace_id: any,
  sheet_id: any,
  options = {}
) => {
  return useQuery({
    queryKey: ["process-columns", workspace_id, sheet_id],
    queryFn: () => {
      const sheetIdValue = unref(sheet_id);
      const columns = sampleProcessColumns.filter(
        (col) => col.sheet_id === sheetIdValue
      );

      return Promise.resolve(
        columns.map((col) => ({
          ...col,
          processes: sampleProcesses.filter((p) => p.column_id === col.id),
        }))
      );
    },
    enabled: computed(() => !!unref(sheet_id)),
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
    queryFn: () => {
      const procId = unref(process_id);
      const statuses = sampleWorkflowStatuses.filter(
        (s) => s.process_id === procId
      );
      const transitions = sampleWorkflowTransitions.filter(
        (t) => t.process_id === procId
      );

      return Promise.resolve({
        statuses,
        transitions,
      });
    },
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
export const useCreateTransition = (id: any, options = {}) =>
  useApiMutation<any, CreateTransition>(
    {
      key: ["create-transition"],
    } as any,
    {
      mutationFn: (vars: CreateTransition) =>
        request({
          url: `workspace/${id}/process-flow/transitions`,
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

type BatchUpdateWorkflow = {
  processId: string;
  statuses: {
    added: any[];
    updated: any[];
    deleted: string[];
  };
  transitions: {
    added: any[];
    updated: any[];
    deleted: string[];
  };
};

export const useBatchUpdateWorkflow = (options = {}) =>
  useApiMutation<any, BatchUpdateWorkflow>(
    {
      key: ["batch-update-workflow"],
    } as any,
    {
      mutationFn: async (vars: BatchUpdateWorkflow) => {
        const results = {
          statusesCreated: [] as any[],
          statusesUpdated: [] as any[],
          statusesDeleted: [] as any[],
          transitionsCreated: [] as any[],
          transitionsUpdated: [] as any[],
          transitionsDeleted: [] as any[],
        };

        for (const status of vars.statuses.deleted) {
          const result = await request({
            url: `/workspace/workflow-statuses/${status}`,
            method: "DELETE",
          });
          results.statusesDeleted.push(result);
        }

        for (const status of vars.statuses.updated) {
          const result = await request({
            url: `/workspace/workflow-statuses/${status.id}`,
            method: "PUT",
            data: status,
          });
          results.statusesUpdated.push(result);
        }

        for (const status of vars.statuses.added) {
          const result = await request({
            url: `/workspace/workflow-statuses`,
            method: "POST",
            data: status,
          });
          results.statusesCreated.push(result);
        }

        for (const transition of vars.transitions.deleted) {
          const result = await request({
            url: `/workspace/workflow-transitions/${transition}`,
            method: "DELETE",
          });
          results.transitionsDeleted.push(result);
        }

        for (const transition of vars.transitions.updated) {
          const result = await request({
            url: `/workspace/workflow-transitions/${transition.id}`,
            method: "PUT",
            data: transition,
          });
          results.transitionsUpdated.push(result);
        }

        for (const transition of vars.transitions.added) {
          const result = await request({
            url: `/workspace/workflow-transitions`,
            method: "POST",
            data: transition,
          });
          results.transitionsCreated.push(result);
        }

        return results;
      },
      ...(options as any),
    } as any
  );
export const useProcessStatus = (workspace_id: any, options = {}) => {
  return useQuery({
    queryKey: ["process-status", workspace_id],
    queryFn: ({ signal }) => {
      return request<any>({
        url: `common/cardstatus-sheet?workspace_id=${workspace_id}`,
        method: "GET",
        signal,
      });
    },
    ...options,
  });
};
