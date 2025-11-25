import { useQuery } from "@tanstack/vue-query";
import { request } from "../libs/api";
import { useApiMutation } from "../libs/vq";
import { unref } from "vue";

export const useCreateModule = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["create-module"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `/workspace/modules/save`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useCreateModuleAI = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["create-module-ai"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `workspace/modules/create-with-ai`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useMPCatlog = (options = {}) => {
  return useQuery({
    queryKey: ["marketplace-catlog"],
    queryFn: ({ signal }) =>
      request<any>({
        url: `common/marketplace-categories`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};

export const useMarketModules = (queryParam:any,options = {}) => {
  return useQuery({
    queryKey: ["marketplace-modules", queryParam],
    queryFn: ({ signal }) =>
      request<any>({
        url: `common/market-modules?marketplace_category_id=${unref(queryParam)}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};
