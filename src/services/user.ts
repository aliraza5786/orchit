import api from "../libs/api";
import { useQuery } from '@tanstack/vue-query'


export const getProfile = () => api.get('/profile').then(r => r.data)


export function useProfile() {
  return useQuery({
    queryKey: ['me'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000, // 5 min: adjust as needed
  })
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


