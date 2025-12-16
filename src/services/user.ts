import api from "../libs/api";
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '../stores/auth'
import { watch } from 'vue'
export const getProfile = () => api.get('/profile').then(r => r.data)


export function useProfile() {
  const auth = useAuthStore()

  const query = useQuery({
    queryKey: ['me'],
    queryFn: getProfile,
    enabled: auth.isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  watch(
    () => query.error.value,
    (err) => {
      if (err) {
        auth.logout()
      }
    }
  )

  return query
}

export function useCompanyId() {
  return useQuery({
    queryKey: ['me'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
    select: (p) => p.data.companies, // only expose what you need
  })
}
export function useUserId() {
  return useQuery({
    queryKey: ['me'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
    select: (p) => p.data?._id, // only expose what you need
  })
}

export const updateProfile = (payload: {
    u_full_name?: string;
    u_job_title?: string;
    u_department?: string;
    u_organization?: string;
    u_location?: string;
    u_profile_image?: string;
  }) => {
    return api.put('/profile', payload).then(res => res.data);
  };


