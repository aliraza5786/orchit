import api, { request } from "../libs/api";
import { useApiMutation } from "../libs/vq";

export const login = (payload: { u_email: string; u_password: string }) =>
  api.post("/auth/login", payload).then((res) => res.data);

export const register = (payload: {
  u_full_name: string;
  u_email: string;
  u_password: string;
}) => api.post("/auth/signup", payload).then((res) => res.data);

export const verifyOtp = (payload: { u_email: string; otp: string }) =>
  api.post("/auth/verify-otp", payload).then((res) => res.data);

export const resendOtp = (payload: { u_email: string }) =>
  api.post("/auth/resend-otp", payload).then((res) => res.data);

export const socailLogin = (payload: {
  u_email: string;
  u_password?: string;
  u_social_id?: string;
  u_social_type?: string;
  u_full_name?: string;
}) => api.post("/auth/login", payload).then((res) => res.data);

type createCompany = { payload: any };
export const useCreateCompany = (options = {}) =>
  useApiMutation<any, createCompany>(
    {
      key: ["create-company"],
    } as any,
    {
      mutationFn: (vars: createCompany) =>
        request({
          url: `/workspace/company`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );

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
