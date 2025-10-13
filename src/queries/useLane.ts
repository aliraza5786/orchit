// src/features/lanes/api.ts
import { useQuery } from '@tanstack/vue-query'
import { useApiMutation } from '../libs/vq'
import { request } from '../libs/api'

/** Stable query keys */
export const keys = {
  workspaceLane: (id: string | number) => ['workspace', 'lane', id] as const,
}

/** GET /workspace/lane/:id */
export const useWorkspaceLane = (
  id: string | number,
  options = {}
) => {
  return useQuery({
    queryKey: keys.workspaceLane(id),
    enabled: !!id,
    queryFn: ({ signal }) =>
      request({
        url: `/workspace/lane/${id}`,
        method: 'GET',
        signal,
      }),
    ...options,
  })
}

/** POST /workspace/lane (create) */
export const useCreateWorkspaceLane = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ['workspace-lane', 'create'],
      url: '/workspace/lane',
      method: 'POST',
    },
    options as any
  )

/** DELETE /workspace/lane/:id */
type DeleteLaneVars = { id: string | number }
export const useDeleteWorkspaceLane = (options = {}) =>
  useApiMutation<any, DeleteLaneVars>(
    { key: ['workspace-lane', 'delete'] } as any,
    {
      mutationFn: (vars: DeleteLaneVars) =>
        request({
          url: `/workspace/lane/${vars.id}`,
          method: 'DELETE',
        }),
      ...(options as any),
    } as any
  )

/** PUT /workspace/lane/:id */
type UpdateLaneVars = {  payload: any }
export const useUpdateWorkspaceLane = (options = {}) =>
  useApiMutation<any, UpdateLaneVars>(
    { key: ['workspace-lane', 'update'] } as any,
    {
      mutationFn: (vars: UpdateLaneVars) =>
        request({
          url: `/workspace/lane`,
          method: 'PATCH',
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  )

/** POST /workspace/lanes/:id/duplicate  (note plural 'lanes') */
type DuplicateLaneVars = { id: string | number }
export const useDuplicateWorkspaceLane = (options = {}) =>
  useApiMutation<any, DuplicateLaneVars>(
    { key: ['workspace-lane', 'duplicate'] } as any,
    {
      mutationFn: (vars: DuplicateLaneVars) =>
        request({
          url: `/workspace/lanes/${vars.id}/duplicate`,
          method: 'POST',
        }),
      ...(options as any),
    } as any
  )


  // POST create lane with ai 

  export const useCreateWorkspaceLaneAi = (options = {}) =>
    useApiMutation<{ data: unknown }, any>(
      {
        key: ['workspace-lane', 'create-lane-ai'],
        url: "/workspace/lane-ai",
        method: "POST",
      },
      options as any
    );
  