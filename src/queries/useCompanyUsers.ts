import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import { request } from '../libs/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompanyUser {
  _id: string
  u_full_name: string
  u_email: string
  u_profile_image: string | null
  u_job_title: string | null
  u_department: string | null
  u_location: string | null
  is_active: boolean
  is_owner: boolean 
  company_role_id: string | null
  u_is_verfied: boolean
  created_at: string
  membership_role: 'owner' | 'admin' | 'member' | 'viewer'
  membership_status: 'active' | 'suspended' | 'deactivated' | 'pending'
  accepted_at: string | null
}

export interface ListCompanyUsersParams {
  company_id: string
  page?: number
  per_page?: number
  search?: string
  is_active?: boolean
  membership_role?: string
}

export interface CreateCompanyUserPayload {
  company_id: string
  u_full_name: string
  u_email: string
  u_password: string
  company_role_id?: string
}

export interface UpdateCompanyUserPayload {
  u_full_name?: string
  u_job_title?: string
  u_department?: string
  u_location?: string
  company_role_id?: string | 'null'
  is_active?: boolean
  u_password?: string
}

export interface ChangePasswordPayload {
  new_password: string
}

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const companyUserKeys = {
  all: (companyId: string) => ['company-users', companyId] as const,
  list: (companyId: string, params?: Omit<ListCompanyUsersParams, 'company_id'>) =>
    ['company-users', companyId, 'list', params] as const,
  detail: (companyId: string, userId: string) =>
    ['company-users', companyId, userId] as const,
}

// ─── List Users ───────────────────────────────────────────────────────────────

export function useCompanyUsers(params: ListCompanyUsersParams) {
  return useQuery({
    queryKey: companyUserKeys.list(params.company_id, {
      page: params.page,
      per_page: params.per_page,
      search: params.search,
      is_active: params.is_active,
      membership_role: params.membership_role,
    }),
    queryFn: () =>
      request({
        url: 'workspace/company/users',
        method: 'GET',
        params: {
          company_id: params.company_id,
          page: params.page ?? 1,
          per_page: params.per_page ?? 50,
          search: params.search || undefined,
          is_active: params.is_active,
          membership_role: params.membership_role || undefined,
        },
      }),
    enabled: !!params.company_id,
    staleTime: 1000 * 30,
  })
}

// ─── Get Single User ──────────────────────────────────────────────────────────

export function useCompanyUser(companyId: string, userId: string) {
  return useQuery({
    queryKey: companyUserKeys.detail(companyId, userId),
    queryFn: () =>
      request({
        url: `workspace/company/users/${userId}`,
        method: 'GET',
        params: { company_id: companyId },
      }),
    enabled: !!companyId && !!userId,
  })
}

// ─── Create User ──────────────────────────────────────────────────────────────

export function useCreateCompanyUser(options?: {
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCompanyUserPayload) =>
      request({
        url: 'workspace/company/users',
        method: 'POST',
        data: payload,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: companyUserKeys.all(variables.company_id),
      })
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}

// ─── Update User ──────────────────────────────────────────────────────────────

export function useUpdateCompanyUser(
  companyId: string,
  options?: {
    onSuccess?: (data: any) => void
    onError?: (error: any) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateCompanyUserPayload }) =>
      request({
        url: `workspace/company/users/${userId}`,
        method: 'PATCH',
        params: { company_id: companyId },
        data: payload,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: companyUserKeys.all(companyId) })
      queryClient.invalidateQueries({
        queryKey: companyUserKeys.detail(companyId, variables.userId),
      })
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}

// ─── Deactivate (Soft-Delete) User ───────────────────────────────────────────

export function useDeactivateCompanyUser(
  companyId: string,
  options?: {
    onSuccess?: (data: any) => void
    onError?: (error: any) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      request({
        url: `workspace/company/users/${userId}`,
        method: 'DELETE',
        params: { company_id: companyId },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyUserKeys.all(companyId) })
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}

// ─── Toggle Active / Inactive ─────────────────────────────────────────────────

export function useToggleCompanyUserActive(
  companyId: string,
  options?: {
    onSuccess?: (data: any) => void
    onError?: (error: any) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) =>
      request({
        url: `workspace/company/users/${userId}/toggle-active`,
        method: 'PATCH',
        params: { company_id: companyId },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyUserKeys.all(companyId) })
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}

// ─── Admin Change Password ────────────────────────────────────────────────────

export function useChangeCompanyUserPassword(
  companyId: string,
  options?: {
    onSuccess?: (data: any) => void
    onError?: (error: any) => void
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: ChangePasswordPayload }) =>
      request({
        url: `workspace/company/users/${userId}/change-password`,
        method: 'PATCH',
        params: { company_id: companyId },
        data: payload,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyUserKeys.all(companyId) })
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}