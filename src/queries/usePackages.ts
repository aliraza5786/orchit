import { useRoute } from "vue-router";
import { request } from "../libs/api";
import { useApiMutation, useApiQuery } from "../libs/vq";
import { useQuery } from "@tanstack/vue-query";
import { unref, computed, ref } from "vue";
import api from "../libs/api";
// ---------------------------------------------
// Company state (localStorage only)
// ---------------------------------------------

const companyId = ref<string | null>(
  localStorage.getItem("company_id")
);

export const useCompany = () => {
  const setCompanyId = (id: string | null) => {
    if (id) {
      localStorage.setItem("company_id", id);
    } else {
      localStorage.removeItem("company_id");
    }
    companyId.value = id;
  };

  return { companyId, setCompanyId };
};

// ---------------------------------------------
// Current Package
// ---------------------------------------------

export const useCurrentPackage = (
  overrideScope?: "individual" | "organization"
) => {
  const scope = computed(() => {
    return overrideScope ?? "organization";
  });

  const companyIdComputed = computed(() => {
    if (scope.value === "individual") return null;
    return localStorage.getItem("company_id");
  });

  const url = computed(() => {
    const base = `/auth/subscription-stats`;
    const params = new URLSearchParams();

    params.append("scope", scope.value);

    if (scope.value === "organization" && companyIdComputed.value) {
      params.append("company_id", companyIdComputed.value);
    }

    return `${base}?${params.toString()}`;
  });

  return useApiQuery({
    key: computed(() => [
      "current-package",
      scope.value,
      companyIdComputed.value,
    ]),
    url,
    method: "GET",
    enabled: computed(() => true),
  });
};

// ---------------------------------------------
// Upgrade Package
// ---------------------------------------------

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

// ---------------------------------------------
// Confirm Payment
// ---------------------------------------------

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
          data: {
            ...payload,
            ...vars,
            sessionId: route.query.session_id,
          },
        }),
      ...(options as any),
    } as any
  );
};

// ---------------------------------------------
// Roles & Permissions
// ---------------------------------------------

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

export const useRoles = (id: any, options = {}) => {
  return useQuery({
    queryKey: ["roles", unref(id)?._id],
    queryFn: ({ signal }) => {
      let url = `/roles/workspace-access-roles`;

      const company = unref(id)?._id;

      if (company) {
        url += `?company_id=${company}`;
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
      mutationFn: ({
        roleId,
        payload,
      }: {
        roleId: string;
        payload: any;
      }) =>
        request({
          url: `/roles/workspace-access-roles/${roleId}`,
          method: "PUT",
          data: payload,
        }),

      ...(options as any),
    } as any
  );
};

// ---------------------------------------------
// Workspace Permissions
// ---------------------------------------------

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
    staleTime: 1000 * 60 * 5,
    ...options,
  });
};