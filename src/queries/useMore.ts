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

export const useMarketModules = (queryParam: any, options = {}) => {
  return useQuery({
    queryKey: ["marketplace-modules", queryParam],
    queryFn: ({ signal }) =>
      request<any>({
        url: `common/market-modules?marketplace_category_id=${unref(
          queryParam
        )}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};

export const useModuleList = (queryParam: any, options = {}) => {
  return useQuery({
    queryKey: ["module-list", queryParam],
    queryFn: ({ signal }) =>
      request<any>({
        url: `common/market-modules?marketplace_category_id=${unref(
          queryParam
        )}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};
export const useModuleDetail = (id: any, options = {}) => {
  return useQuery({
    queryKey: ["module-detail", id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `/common/workspace-modules-filter?workspace_module_id=${unref(
          id
        )}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};

export const useModuleLists = (id: string, sheetId: any, options = {}) => {
  return useQuery({
    queryKey: ["module-lists", sheetId, id],
    queryFn: ({ signal }) =>
      request<any>({
        url: `common/market-modules/cards-grouped?module_id=${id}&sheet_id=${unref(
          sheetId
        )}`,
        method: "GET",
        signal,
      }),
    ...options,
  });
};

export const useCreateComment = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["create-comment-module"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `common/workspace-module-comments`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
export const useUseModule = (options = {}) =>
  useApiMutation<any, any>(
    {
      key: ["use-module"],
    } as any,
    {
      mutationFn: (vars: any) =>
        request({
          url: `common/workspace-modules/clone`,
          method: "POST",
          data: vars.payload,
        }),
      ...(options as any),
    } as any
  );
