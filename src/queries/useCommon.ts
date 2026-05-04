import { useMutation, useQuery } from "@tanstack/vue-query";
import api, { request } from "../libs/api";
import { isRef, type Ref, type ComputedRef } from 'vue'
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

// Get company roles without permission
export const useCompanyRolesWithoutPermission = (options = {}) => {
  return useQuery({
    queryKey: ["company-roles-without-permission"],
    queryFn: ({ signal }) =>
      request<any>({
        url: `roles/company-roles/without-permission`,
        method: "GET",
        signal,
      }),
    staleTime: 0,
    refetchOnMount: true,
    ...options,
  });
};
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