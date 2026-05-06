import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import api, { request } from "../libs/api";
import { isRef, type Ref, type ComputedRef, computed } from 'vue'
import { useAuthStore } from "../stores/auth";
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
  const authStore = useAuthStore()

  const companyId = computed(() => {
    // 1. Prefer store (runtime state)
    const storeCompany = authStore.company_id

    // 2. Fallback to cookies (persistent state after refresh)
    const cookieCompany = getCookie('company_id')
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
 
export interface DnsInstructions {
  method: 'cname' | 'txt'
  record_type: 'CNAME' | 'TXT'
  record_host: string
  record_value: string
  ttl_recommended: number
  note: string
}
 
export interface CompanyDomain {
  _id: string
  company_id: string
  domain: string
  status: 'pending' | 'verifying' | 'verified' | 'failed' | 'disabled'
  verification_method: 'cname' | 'txt'
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
  data: T
}
 
// ── API Response Shapes ────────────────────────────────────────────────────────
 
export interface PublicLookupData {
  domain: Pick<CompanyDomain, '_id' | 'company_id' | 'domain' | 'is_primary' | 'verified_at'>
}
 
export interface VerifyDomainData {
  verified: boolean
  domain: Partial<CompanyDomain>
  result: DnsCheckResult
  instructions: DnsInstructions
}
 
export interface ListDomainsData {
  domains: CompanyDomain[]
}
 
export interface GetDomainData {
  domain: CompanyDomain
  instructions: DnsInstructions
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