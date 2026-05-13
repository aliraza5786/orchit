import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import api, { request } from "../libs/api";
import { isRef, type Ref, type ComputedRef, computed } from 'vue'
import { useAuthStore } from "../stores/auth";
import type { VerificationMethod } from "../stores/workspace";
export const uploadFile = (formData: FormData) => {
  return api
    .post("/upload/file-common", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => res.data);
};
export const uploadPrivateFile = (formData: FormData) => {
  return api
    .post("/upload/file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => res.data);
};

export const useUploadFile = (options = {}) => {
  return useMutation({
    mutationKey: ["upload-file"],
    mutationFn: uploadFile,
    ...options,
  });
};


export const usePrivateUploadFile = (options = {}) => {
  return useMutation({
    mutationKey: ["p-upload-file"],
    mutationFn: uploadPrivateFile,
    ...options,
  });
};
export const useRolesList = ( options = {}) => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: ({ signal }) =>
      request<any>({
        url: `common/roles`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};
const getCookie = (name: string) => {
  const match = document.cookie.match(
    new RegExp('(^| )' + name + '=([^;]+)')
  )
  return match ? decodeURIComponent(match[2]) : null
}

// Get company roles without permission
export const useCompanyRolesWithoutPermission = (options = {}) => {

  const companyId = computed(() => {
    // 1. Prefer store (runtime state)
    const storeCompany = localStorage.getItem('company_id')

    // 2. Fallback to cookies (persistent state after refresh)
    const cookieCompany = localStorage.getItem('company_id')
    const personalMode = getCookie('personal_mode')

    // If personal mode → force null
    if (personalMode === 'true') return null

    return storeCompany ?? cookieCompany ?? null
  })

  const url = computed(() => {
    let base = `roles/company-roles/without-permission`

    if (companyId.value) {
      base += `?company_id=${companyId.value}`
    }

    return base
  })

  return useQuery({
    queryKey: computed(() => [
      "company-roles-without-permission",
      companyId.value,
    ]),

    queryFn: ({ signal }) =>
      request({
        url: url.value,
        method: "GET",
        signal,
      }),

    // IMPORTANT: don't block query when company is missing,
    // otherwise refresh may never refetch correctly in some flows
    enabled: true,

    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,

    ...options,
  })
}
// Get single company role by ID
// In useCommon.ts
export const useCompanyRoleById = (
  id: string | number | Ref<string | number> | ComputedRef<string | number>,
  options = {}
) => {
  return useQuery({
    queryKey: ["company-roles", id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `roles/company-roles/${isRef(id) ? id.value : id}`,
        method: "GET",
        signal,
      }),
    enabled: !!id,
    ...options,
  });
};

//domain setup apis
export interface DnsCheckResult {
  ok: boolean
  observed: string[] | null
  error: string | null
  checked_at: string
}
export interface CnameInstructions {
  method: 'cname'
  record_type: 'CNAME'
  record_host: string
  record_value: string
  ttl_recommended: number
  note: string
}

export interface TxtInstructions {
  method: 'txt'
  record_type: 'TXT'
  record_host: string
  record_value: string
  ttl_recommended: number
  note: string
}

export interface HttpInstructions {
  method: 'http'
  record_type: null
  file_url: string
  file_content: string
  ttl_recommended: null
  note: string
}

export type DnsInstructions =
  | CnameInstructions
  | TxtInstructions
  | HttpInstructions
export interface CompanyDomain {
  _id: string
  company_id: string
  domain: string
  domains:any
  status: 'pending' | 'verifying' | 'verified' | 'failed' | 'disabled'
  verification_method: VerificationMethod
  verification_token: string
  expected_target: string
  is_primary: boolean
  ssl_status: 'none' | 'provisioning' | 'active' | 'error'
  ssl_provisioned_at: string | null
  verified_at: string | null
  last_checked_at: string | null
  last_check_result: DnsCheckResult | null
  is_trash: boolean
  created_at: string
  instructions?: DnsInstructions
}
 
export interface ApiResponse<T> {
  status: boolean
  message: string
  domains: T
}
// ── API Response Shapes ────────────────────────────────────────────────────────
 
export interface PublicLookupData {
  domain: Pick<
    CompanyDomain,
    '_id' | 'company_id' | 'domain' | 'is_primary' | 'verified_at'
  > | null
}
 
export interface VerifyDomainData {
  verified: boolean
  domain: CompanyDomain
  result: DnsCheckResult
  instructions: DnsInstructions
  methodSwitched?: boolean
}
 
export interface ListDomainsData {
  domains: CompanyDomain[]
  status?: boolean
  message?: string
}
 
export interface GetDomainData {
  domain: CompanyDomain
  instructions: DnsInstructions | null
}
 
export interface SetPrimaryDomainData {
  domain: Pick<CompanyDomain, '_id' | 'domain' | 'is_primary' | 'status'>
}
 
export interface RemoveDomainData {
  domain: Pick<CompanyDomain, '_id' | 'domain' | 'is_trash' | 'is_primary'> & { deleted_at: string }
}
 
// ── Request Payloads ───────────────────────────────────────────────────────────
 
export interface VerifyDomainPayload {
  domain: string
  verification_method?: 'cname' | 'txt'
}
 
 const getCompanyId = () => {
  const cookieCompanyId = getCookie('company_id')
  const localCompanyId = localStorage.getItem('company_id')

  const companyId = cookieCompanyId || localCompanyId

  if (!companyId) {
    throw new Error('company_id is required but not found in cookies or localStorage')
  }

  return companyId
}

export const usePublicDomainLookup = (
  host: string,
  options: Record<string, unknown> = {}
) => {
  const companyId = getCompanyId()

  return useQuery<ApiResponse<PublicLookupData>>({
    queryKey: ['domain-lookup', host, companyId],
    queryFn: ({ signal }) =>
      request<ApiResponse<PublicLookupData>>({
        url: `company-domains/lookup?host=${encodeURIComponent(host)}&company_id=${companyId}`,
        method: 'GET',
        signal,
      }),
    enabled: !!host,
    ...options,
  })
}

export const useVerifyDomain = (options: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<VerifyDomainData>, Error, VerifyDomainPayload>({
    mutationKey: ['verify-domain'],
    mutationFn: (payload) => {
      const companyId = getCompanyId()

      return request<ApiResponse<VerifyDomainData>>({
        url: 'company-domains/verify',
        method: 'POST',
        data: {
          ...payload,
          company_id: companyId,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-domains'] })
    },
    ...options,
  })
}

export const useListDomains = (options: Record<string, unknown> = {}) => {
  const companyId = getCompanyId()

  return useQuery<ApiResponse<ListDomainsData>>({
    queryKey: ['company-domains', companyId],
    queryFn: ({ signal }) =>
      request<ApiResponse<ListDomainsData>>({
        url: `company-domains?company_id=${companyId}`,
        method: 'GET',
        signal,
      }),
    ...options,
  })
}

export const useGetDomain = (
  id: string,
  options: Record<string, unknown> = {}
) => {
  const companyId = getCompanyId()

  return useQuery<ApiResponse<GetDomainData>>({
    queryKey: ['company-domains', id, companyId],
    queryFn: ({ signal }) =>
      request<ApiResponse<GetDomainData>>({
        url: `company-domains/${id}?company_id=${companyId}`,
        method: 'GET',
        signal,
      }),
    enabled: !!id,
    ...options,
  })
}

export const useSetPrimaryDomain = (options: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<SetPrimaryDomainData>, Error, string>({
    mutationKey: ['set-primary-domain'],
    mutationFn: (id) => {
      const companyId = getCompanyId()

      return request<ApiResponse<SetPrimaryDomainData>>({
        url: `company-domains/${id}/primary?company_id=${companyId}`,
        method: 'PUT',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-domains'] })
    },
    ...options,
  })
}

export const useRemoveDomain = (options: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ApiResponse<RemoveDomainData>, Error, string>({
    mutationKey: ['remove-domain'],
    mutationFn: (id) => {
      const companyId = getCompanyId()

      return request<ApiResponse<RemoveDomainData>>({
        url: `company-domains/${id}?company_id=${companyId}`,
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-domains'] })
    },
    ...options,
  })
};

//Ai token allocations apis

// ─────────────────────────────────────────────────────────────────────────────
// Token Allocation Types
// ─────────────────────────────────────────────────────────────────────────────

export type AllocationMode = 'shared' | 'equal' | 'custom'

export interface PerUserAllocation {
  user_id: string
  allocated_tokens: number
  used_tokens: number
}

export interface TokenAllocation {
  _id: string
  company_id: string
  subscription_id: string
  package_id: string
  period_start: string
  period_end: string
  total_tokens: number
  reserved_tokens: number
  used_tokens: number
  allocation_mode: AllocationMode
  per_user: PerUserAllocation[]
  is_archived: boolean
  created_at?: string
}

// GET /me response shapes
export interface MyAllocationSummaryShared {
  mode: 'shared'
  company_total: number
  company_used: number
  company_remaining: number
  user_used: number
}

export interface MyAllocationSummaryEqualCustom {
  mode: 'equal' | 'custom'
  company_total: number
  company_used: number
  user_allocated: number
  user_used: number
  user_remaining: number
}

export type MyAllocationSummary = MyAllocationSummaryShared | MyAllocationSummaryEqualCustom

export interface MyAllocationData {
  tracking_enabled: boolean
  period_start?: string
  period_end?: string
  summary: MyAllocationSummary | null
}

// GET /  (company allocation) response
export interface CompanyAllocationUserSummary {
  mode: AllocationMode
  company_total: number
  company_used: number
  user_allocated: number
  user_used: number
  user_remaining: number
}

export interface CompanyAllocationData {
  tracking_enabled: boolean
  allocation: TokenAllocation | null
  user_summary: CompanyAllocationUserSummary | null
}

// Mutation payloads
export interface SetModePayload {
  mode: AllocationMode
}

export interface DistributeEqualPayload {
  reserved_tokens?: number
}

export interface SetUserAllocationPayload {
  userId: string
  allocated_tokens: number
}

// Mutation response shapes
export interface SetModeData {
  allocation: Pick<TokenAllocation, '_id' | 'allocation_mode' | 'total_tokens' | 'used_tokens' | 'per_user'>
}

export interface DistributeEqualData {
  allocation: Pick<TokenAllocation, '_id' | 'allocation_mode' | 'total_tokens' | 'reserved_tokens' | 'used_tokens' | 'per_user'>
}

export interface SetUserAllocationData {
  allocation: Pick<TokenAllocation, '_id' | 'allocation_mode' | 'total_tokens' | 'per_user'>
}

export interface TokenApiResponse<T> {
  status: boolean
  message: string
  data: T
}

const TOKEN_ALLOC_KEY = 'token-allocation'

// ─────────────────────────────────────────────────────────────────────────────
// 2.1 – Get my allocation
// ─────────────────────────────────────────────────────────────────────────────
export const useMyPersonalTokenAllocation = (options: Record<string, unknown> = {}) => {
  return useQuery<TokenApiResponse<MyAllocationData>>({
    queryKey: [TOKEN_ALLOC_KEY, 'me'],
    queryFn: ({ signal }) =>
      request<TokenApiResponse<MyAllocationData>>({
        url: `billing/token-allocation/me`,
        method: 'GET',
        signal,
      }),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    ...options,
  })
}
export const useMyTokenAllocation = (options: Record<string, unknown> = {}) => {
  const companyId = getCompanyId()

  return useQuery<TokenApiResponse<MyAllocationData>>({
    queryKey: [TOKEN_ALLOC_KEY, 'me', companyId],
    queryFn: ({ signal }) =>
      request<TokenApiResponse<MyAllocationData>>({
        url: `billing/token-allocation/me?company_id=${companyId}`,
        method: 'GET',
        signal,
      }),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    ...options,
  })
}
export const useCompanyTokenAllocation = (options: Record<string, unknown> = {}) => {
  const authStore = useAuthStore()

  const companyId = computed(() => {
    // 1. Prefer store (runtime state)
    const storeCompany = authStore.company_id

    // 2. Fallback to cookies
    const cookieCompany = getCookie('company_id')

    // 3. Fallback to localStorage
    const localCompany = localStorage.getItem('company_id')

    return storeCompany ?? cookieCompany ?? localCompany ?? null
  })

  const queryKey = computed(() => ['token-allocation', 'company', companyId.value])

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => {
      const id = companyId.value
      if (!id) return Promise.reject(new Error('No company ID'))
      return request({
        url: `billing/token-allocation?company_id=${id}`,
        method: 'GET',
        signal,
      })
    },
    enabled: computed(() => !!companyId.value),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    ...options,
  })
}
// ─────────────────────────────────────────────────────────────────────────────
// 2.3 – Set allocation mode
// ─────────────────────────────────────────────────────────────────────────────
export const useSetAllocationMode = (options: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TokenApiResponse<SetModeData>, Error, SetModePayload>({
    mutationKey: ['set-allocation-mode'],
    mutationFn: (payload) => {
      const companyId = getCompanyId()
      return request<TokenApiResponse<SetModeData>>({
        url: `billing/token-allocation/mode?company_id=${companyId}`,
        method: 'PUT',
        data: payload,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TOKEN_ALLOC_KEY] })
    },
    ...options,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 2.4 – Distribute equal
// ─────────────────────────────────────────────────────────────────────────────
export const useDistributeEqual = (options: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TokenApiResponse<DistributeEqualData>, Error, DistributeEqualPayload>({
    mutationKey: ['distribute-equal'],
    mutationFn: (payload) => {
      const companyId = getCompanyId()
      return request<TokenApiResponse<DistributeEqualData>>({
        url: `billing/token-allocation/distribute-equal?company_id=${companyId}`,
        method: 'POST',
        data: payload,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TOKEN_ALLOC_KEY] })
    },
    ...options,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 2.5 – Set user allocation
// ─────────────────────────────────────────────────────────────────────────────
export const useSetUserAllocation = (options: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TokenApiResponse<SetUserAllocationData>, Error, SetUserAllocationPayload>({
    mutationKey: ['set-user-allocation'],
    mutationFn: ({ userId, allocated_tokens }) => {
      const companyId = getCompanyId()
      return request<TokenApiResponse<SetUserAllocationData>>({
        url: `billing/token-allocation/users/${userId}?company_id=${companyId}`,
        method: 'PUT',
        data: { allocated_tokens },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TOKEN_ALLOC_KEY] })
    },
    ...options,
  })
}

// ownership transfer of organization

// ─────────────────────────────────────────────────────────────────────────────
// Ownership Transfer Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TransferUser {
  _id: string
  u_full_name: string
  u_email: string
  u_profile_image: string | null
}

export interface Transfer {
  _id: string
  company_id?: string
  token: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  expires_at: string
  note?: string
  from_user_id?: TransferUser
  to_user?: TransferUser
  to_user_id?: TransferUser
  created_at?: string
}

export interface InitiateTransferPayload {
  target_user_id: string
  note?: string
}

export interface InitiateTransferData {
  transfer: Transfer
}

export interface PendingTransferData {
  transfer: Transfer | null
}

export interface TransferApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

const TRANSFER_KEY = 'ownership-transfer'

// ─────────────────────────────────────────────────────────────────────────────
// 1. Get Pending Transfer
// ─────────────────────────────────────────────────────────────────────────────
export const usePendingTransfer = (options: Record<string, unknown> = {}) => {
  const companyId = getCompanyId()
return useQuery<PendingTransferData>({
    queryKey: [TRANSFER_KEY, 'pending', companyId],
    queryFn: ({ signal }) =>
      request<PendingTransferData>({
        url: `workspace/company/transfer-ownership/pending?company_id=${companyId}`,
        method: 'GET',
        signal,
      }),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    ...options,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Initiate Transfer
// ─────────────────────────────────────────────────────────────────────────────
export const useInitiateTransfer = (options: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TransferApiResponse<InitiateTransferData>, Error, InitiateTransferPayload>({
    mutationKey: ['initiate-transfer'],
    mutationFn: (payload) => {
      const companyId = getCompanyId()
      return request<TransferApiResponse<InitiateTransferData>>({
        url: `workspace/company/transfer-ownership`,
        method: 'POST',
        data: {
          ...payload,
          company_id: companyId,
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSFER_KEY] })
    },
    ...options,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Cancel Transfer
// ─────────────────────────────────────────────────────────────────────────────
export const useCancelTransfer = (options: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TransferApiResponse<null>, Error, string>({
    mutationKey: ['cancel-transfer'],
    mutationFn: (transferId) => {
      return request<TransferApiResponse<null>>({
        url: `workspace/company/transfer-ownership/${transferId}`,
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSFER_KEY] })
    },
    ...options,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Accept Transfer (for target user via email deep-link)
// ─────────────────────────────────────────────────────────────────────────────
export const useAcceptTransfer = (options: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TransferApiResponse<null>, Error, string>({
    mutationKey: ['accept-transfer'],
    mutationFn: (token) => {
      return request<TransferApiResponse<null>>({
        url: `workspace/company/transfer-ownership/accept`,
        method: 'POST',
        data: { token },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSFER_KEY] })
    },
    ...options,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Reject Transfer (for target user via email deep-link)
// ─────────────────────────────────────────────────────────────────────────────
export const useRejectTransfer = (options: Record<string, unknown> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<TransferApiResponse<null>, Error, string>({
    mutationKey: ['reject-transfer'],
    mutationFn: (token) => {
      return request<TransferApiResponse<null>>({
        url: `workspace/company/transfer-ownership/reject`,
        method: 'POST',
        data: { token },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TRANSFER_KEY] })
    },
    ...options,
  })
}

type CompanyJoinRegisterPayload = {
  u_full_name: string
  u_email: string
  u_password: string
}

export const useCompanyJoinRegister = (
  token: string,
  options: Record<string, unknown> = {},
) => {
  return useMutation<
    TransferApiResponse<null>,
    Error,
    CompanyJoinRegisterPayload
  >({
    mutationKey: ['company-join-register'],
    mutationFn: (data) => {
      return request<TransferApiResponse<null>>({
        url: `common/company-join/${token}/register`,
        method: 'POST',
        data,
      })
    },
    ...options,
  })
}

type CompanyJoinSendOtpPayload = {
  u_email: string
}

export const useCompanyJoinSendOtp = (
  token: string,
  options: Record<string, unknown> = {},
) => {
  return useMutation<
    TransferApiResponse<null>,
    Error,
    CompanyJoinSendOtpPayload
  >({
    mutationKey: ['company-join-send-otp'],
    mutationFn: (data) => {
      return request<TransferApiResponse<null>>({
        url: `common/company-join/${token}/send-otp`,
        method: 'POST',
        data,
      })
    },
    ...options,
  })
}

type CompanyJoinVerifyOtpPayload = {
  u_email: string
  otp: string
}

export const useCompanyJoinVerifyOtp = (
  token: string,
  options: Record<string, unknown> = {},
) => {
  return useMutation<
    TransferApiResponse<null>,
    Error,
    CompanyJoinVerifyOtpPayload
  >({
    mutationKey: ['company-join-verify-otp'],
    mutationFn: (data) => {
      return request<TransferApiResponse<null>>({
        url: `common/company-join/${token}/verify-otp`,
        method: 'POST',
        data,
      })
    },
    ...options,
  })
}