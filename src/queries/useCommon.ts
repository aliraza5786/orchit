import { useMutation, useQuery } from "@tanstack/vue-query";
import api, { request } from "../libs/api";

export const uploadFile = (formData: FormData) => {
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