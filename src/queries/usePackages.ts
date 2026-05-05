import { useRoute } from "vue-router";
import { request } from "../libs/api";
import { useApiMutation, useApiQuery } from "../libs/vq";
import { useQuery } from "@tanstack/vue-query";
import { unref } from "vue";
import api from "../libs/api";
import { ref, computed } from "vue"
const companyId = ref(localStorage.getItem("company_id"))
export const useCompany = () => {
  const setCompanyId = (id: string) => {
    localStorage.setItem("company_id", id)
    companyId.value = id
  }

  return { companyId, setCompanyId }
}

const getCookie = (name: string) => {
  const match = document.cookie.match(
    new RegExp('(^| )' + name + '=([^;]+)')
  )
  return match ? decodeURIComponent(match[2]) : null
}

export const useCurrentPackage = () => {
  // ✅ derive from cookie (source of truth)
  const companyId = computed(() => {
    const personalMode = getCookie('personal_mode')
    const companyFromCookie = getCookie('company_id')

    if (personalMode === 'true') return null
    if (companyFromCookie) return companyFromCookie

    return null
  })

  const url = computed(() => {
    const base = `/auth/subscription-stats`
    return companyId.value
      ? `${base}?company_id=${companyId.value}`
      : base
  })

  return useApiQuery({
    key: computed(() => ["current-package", companyId.value]), // ✅ reactive + stable
    url,
    method: "GET",

    // ✅ IMPORTANT: allow both personal + company
    enabled: computed(() => true),
  })
}
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
    queryFn: ({ signal }) => {
      let url = `/roles/workspace-access-roles`;
      if (unref(id)?._id) {
        url += `?company_id=${unref(id)?._id}`;
      }
      return request<any>({
        url,
        method: "GET",
        signal,
      });
    },
    ...options,
  });
};
  
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




 