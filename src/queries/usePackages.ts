import { useRoute } from "vue-router";
import { request } from "../libs/api";
import { useApiMutation, useApiQuery } from "../libs/vq";
import { useQuery } from "@tanstack/vue-query";
import { unref } from "vue";

export const useCurrentPackage = () => {
  return useApiQuery({
    key: ["current-package"],
    url: `/auth/subscription-stats`,
    method: "GET",
  });
};

export const useUpgradePackage = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["package-payment"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `billing/payment-intent`,
          method: "POST",
          data: vars,
        }),
      ...(options as any),
    } as any
  );
export const confirmPayment = (payload: any, options = {}) => {
  const route = useRoute();
  console.log(payload, route.query.session_id, ">>>>");
  return useApiMutation<any, any>(
    {
      key: ["package-payment-confirm"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `billing/confirm-payment`,
          method: "POST",
          data: { ...payload, ...vars, sessionId: route.query.session_id },
        }),
      ...(options as any),
    } as any
  );
};
export const useRolesPermisions = (options = {}) => {
  return useQuery({
    queryKey: ["role-&-permission"],
    queryFn: ({ signal }) =>
      request<any>({
        url: `/roles/permissions/grouped?scope=workspace`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};
export const useRoles = (id:any,options = {}) => {
  return useQuery({
    queryKey: ["roles"],
    queryFn: ({ signal }) =>
      request<any>({
        url: `/roles/company-roles?company_id=${unref(id)?._id}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};


export const useUpdatePermissions = (id:any, options = {}) => {
 
  return useApiMutation<any, any>(
    {
      key: ["update-permissions", id],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `/roles/company-roles/${unref(id)?._id}?allow_system_update=true`,
          method: "PUT",
          data: { ...vars, },
        }),
      ...(options as any),
    } as any
  );
};