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
  membership_status: 'active' | 'suspended' | 'deactivated' | 'pending' | 'pending_super_admin_otp' |'invited'
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
  role?: string
  u_job_title?: string
  u_department?: string
  u_location?: string
}

export interface UpdateCompanyUserPayload {
  u_full_name?: string
  u_job_title?: string
  u_department?: string
  u_location?: string
  company_role_id?: string | 'null'
  is_active?: boolean
  u_password?: string
  membership_role?: string
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

import { computed, toValue, type MaybeRefOrGetter } from 'vue'

export function useCompanyUsers(params: MaybeRefOrGetter<ListCompanyUsersParams>) {
  return useQuery({
    queryKey: computed(() => companyUserKeys.list(
      toValue(params).company_id,
      toValue(params)
    )),
    queryFn: () => {
      const p = toValue(params)
      return request({
        url: 'workspace/company/users',
        method: 'GET',
        params: p,
      })
    },
    enabled: computed(() => !!toValue(params).company_id),
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

// organization delete
// ─── Domain Deletion (Password + OTP) ────────────────────────────────────────

export interface VerifyPasswordForDeletionPayload {
  password: string
}

export interface VerifyPasswordForDeletionData {
  message: string
}

export interface ConfirmDomainDeletionPayload {
  otp: string
}

export interface ConfirmDomainDeletionData {
  message: string
}

export const useVerifyPasswordForDeletion = (
  companyId: string,
  options: Record<string, unknown> = {}
) => {
  return useMutation<any, Error, VerifyPasswordForDeletionPayload>({
    mutationKey: ['verify-password-for-deletion', companyId],
    mutationFn: (payload) =>
      request({
        url: `profile/company/${companyId}/verify-password`,
        method: 'POST',
        data: payload,
      }),
    ...options,
  })
}

export const useConfirmDomainDeletion = (
  companyId: string,
  options: Record<string, unknown> = {}
) => {
  const queryClient = useQueryClient()
  return useMutation<any, Error, ConfirmDomainDeletionPayload>({
    mutationKey: ['confirm-company-deletion', companyId],
    mutationFn: (payload) =>
      request({
        url: `profile/company/${companyId}/confirm-delete`,
        method: 'POST',
        data: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    ...options,
  })
}
export function useSendSuperAdminOtp() {
  return useMutation({
    mutationFn: ({
      user_id,
      company_id,
    }: {
      user_id: string
      company_id: string
    }) =>
      request({
        url: `/workspace/company/users/${user_id}/send-super-admin-otp`,
        method: 'POST',
        data: {
          company_id,
        },
      }),
  })
}

export function useVerifySuperAdminOtp() {
  return useMutation({
    mutationFn: ({
      user_id,
      otp,
      company_id,
    }: {
      user_id: string
      otp: string
      company_id: string
    }) =>
      request({
        url: `/workspace/company/users/${user_id}/verify-super-admin-otp`,
        method: 'POST',
        data: {
          otp,
          company_id,
        },
      }),
  })
}


