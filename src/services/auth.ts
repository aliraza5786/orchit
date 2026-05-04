import api, { request } from "../libs/api";
import { useApiMutation } from "../libs/vq";

export const login = (payload: { u_email: string; u_password: string }) =>
  api.post("/auth/login", payload).then((res) => res.data);

export const register = (payload: {
  u_full_name: string;
  u_email: string;
  u_password: string;
  agree_to_terms?: boolean
}) => api.post("/auth/signup", payload).then((res) => res.data);

export const verifyOtp = (payload: { u_email: string; otp: string }) =>
  api.post("/auth/verify-otp", payload).then((res) => res.data);

export const resendOtp = (payload: { u_email: string }) =>
  api.post("/auth/resend-otp", payload).then((res) => res.data);

export const socialLogin = (payload: {
  u_email: string;
  u_password?: string;
  u_social_id?: string;
  u_social_type?: string;
  u_full_name?: string;
  
}) => api.post("/auth/social-login", payload).then((res) => res.data);

type createCompany = { payload: any };

export const useCreateCompany = (options = {}) =>
  useApiMutation<any, createCompany>(
    {
      key: ["create-company"],
    } as any,
    {
      mutationFn: async (vars: createCompany) => {
        const data = await request({
          url: `/workspace/company`,
          method: "POST",
          data: vars.payload,
        })

        // ✅ Treat API-level failures as thrown errors
        if (data?.status === false) {
          const err = new Error(data?.message ?? 'Request failed')
          ;(err as any).response = { data }
          throw err
        }

        return data
      },
      ...(options as any),
    } as any
  );
export const useUpdateCompany = (options = {}) =>
  useApiMutation<any, createCompany>(
    {
      key: ["update-company"],
    } as any,
    {
      mutationFn: (vars: createCompany) =>
        request({
          url: `/workspace/company`,
          method: "PUT",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
type UpdateCompanyProfilePayload = {
  id: string
  title?: string
  company_size?: string
  description?: string | null
  logo?: string | null
  work_to_do?: string | null
  heard_about_us?: string | null
  like_to_manage?: string[]
}

export const useUpdateCompanyProfile = (options = {}) =>
  useApiMutation<any, UpdateCompanyProfilePayload>(
    {
      key: ['update-company-profile'],
      url: '/profile/company',
      method: 'PUT',
    },
    {
      mutationFn: ({ id, ...payload }: UpdateCompanyProfilePayload) =>
        request({
          url: `/profile/company/${id}`,
          method: 'PUT',
          data: payload,
        }),
      ...(options as any),
    }
  )
export const useInviteCompany = (options = {}) =>
  useApiMutation<any, createCompany>(
    {
      key: ["invite-company"],
    } as any,
    {
      mutationFn: (vars: createCompany) =>
        request({
          url: `/workspace/company/invitations`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

export const forgotPassword = (payload: { u_email: string }) =>
  api.post("/auth/forget-password", payload).then((res) => res.data);

export const verifyResetToken = (payload: { token: string }) =>
  api.post("/auth/verify-reset-token", payload).then((res) => res.data);

export const resetPassword = (payload: { token: string; new_password: string; confirm_password: string }) =>
  api.post("/auth/reset-password", payload).then((res) => res.data);

export async function joinCompany(token: string) {
  const response = await api.post(`/common/company-join/${token}`)
  return response.data
}