import { useRoute } from "vue-router";
import { request } from "../libs/api";
import { useApiMutation, useApiQuery } from "../libs/vq";
import { useQuery } from "@tanstack/vue-query";
import { unref } from "vue";
import api from "../libs/api";

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
        url: `/roles/workspace-access-roles?company_id=${unref(id)?._id}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};
// export const usePermissionRoles = (id:any,options = {}) => {
//   return useQuery({
//     queryKey: ["roles"],
//     queryFn: ({ signal }) =>
//       request<any>({
//         url: `/roles/workspace-access-roles/without-permission?company_id=${unref(id)?._id}`,
//         method: "GET",
//         signal,
//       }),
//     ...options,
//   });
// };


export const useUpdatePermissions = (options = {}) => {
  return useApiMutation<any, any>(
    {
      key: ["update-permissions"],
    } as any,
    {
      mutationFn: ({ roleId, payload }: { roleId: string; payload: any }) =>
        request({
          url: `/roles/workspace-access-roles/${roleId}`,
          method: "PUT",
          data: payload,
        }),
      ...(options as any),
    } as any
  );
};


 


export const fetchWorkspacePermissions = async ({ signal }: any) => {
  try {
    const { data } = await api.get(
      "/roles/workspace-access-roles/without-permission",
      { signal }
    );

    return data?.data || [];
  } catch (err) {
    console.warn("⚠️ Permissions API failed");
    return [];
  }
};
export const useWorkspacePermissions = (options = {}) => {
  return useQuery({
    queryKey: ["workspace-permissions"],
    queryFn: fetchWorkspacePermissions,
    staleTime: 1000 * 60 * 5, // optional
    ...options,
  });
};




 