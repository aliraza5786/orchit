import api from "../libs/api";
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '../stores/auth'
import { watch } from 'vue'

// 🔑 Unified query key used across entire app to ensure deduplication
export const PROFILE_QUERY_KEY = ['profile']

export const getProfile = () => 
  api.get('/profile').then(r => {
    const activeCompanyId = r.data?.data?.active_company_id;
    const userId = r.data?.data?._id;
    
    // Persist company & user IDs from API response
    if (activeCompanyId) {
      localStorage.setItem('company_id', activeCompanyId)
    }
    if(userId){
      localStorage.setItem('user_id', userId)
    }
    return r.data
  })

export function useProfile() {
  const auth = useAuthStore()

  const query = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    enabled: auth.isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
    placeholderData: () => {
      // Try to load cached profile from sessionStorage (used during domain redirects)
      const cached = sessionStorage.getItem('__orchit_profile_cache__')
      if (cached) {
        try {
          return JSON.parse(cached)
        } catch {}
      }
      return undefined
    }
  })

  // ✅ Logout on error
  watch(
    () => query.error.value,
    (err) => {
      if (err) {
        auth.logout()
      }
    }
  )

  // ✅ Save company_id from API → localStorage + state
  watch(
    () => query.data.value?.data?.active_company_id,
    (activeCompanyId) => {
      if (!activeCompanyId) return

      const stored = localStorage.getItem('company_id')

      if (stored !== activeCompanyId) {
        localStorage.setItem('company_id', activeCompanyId)
        auth.company_id = activeCompanyId
      }
    },
    { immediate: true }
  )

  return query
}

export function useCompanyId() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
    select: (p) => {
      const companies = p.data?.companies
      if (Array.isArray(companies)) return companies[0] || null
      return companies || null
    },
  })
}

export function useUserId() {
  return useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
    select: (p) => p.data?._id,
  })
}

export const updateProfile = (payload: {
  u_full_name?: string;
  u_job_title?: string;
  u_department?: string;
  u_organization?: string;
  u_location?: string;
  u_profile_image?: string;
  u_work_to_do?: string;
  work_to_do?: string;
  like_to_manage?: string[];
  heard_about_us?: string[];
}) => {
  return api.put('/profile', payload).then(res => res.data);
};
