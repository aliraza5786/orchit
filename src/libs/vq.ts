// src/lib/vq.ts
import {
  useQuery,
  useMutation,
  type QueryKey,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/vue-query";
import { request, type DataExtractor, defaultExtractor } from "./api";

export function useApiQuery<TData = any, TVariables = undefined>(
  {
    key,
    url,
    method = "GET",
    params,
    variables,
    config,
    extract = defaultExtractor,
    enabled = true,
    select,
    staleTime,
  }: {
    key: QueryKey;
    url: string;
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    params?: any;
    variables?: TVariables; // rarely used; POST-as-query
    config?: any;
    extract?: DataExtractor;
    enabled?: boolean;
    select?: (d: TData) => any;
    staleTime?: number;
    placeholderData?: TData;
  },
  options?: Omit<
    UseQueryOptions<TData, unknown, any, QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<TData>({
    queryKey: key,
    queryFn: ({ signal }) =>
      request<TData>({
        url,
        method,
        params,
        data: variables,
        config,
        extract,
        signal,
      }),
    enabled,
    select,
    staleTime,

    ...options,
  });
}

export function useApiMutation<TData = any, TVariables = any>(
  {
    key,
    url,
    method = "POST",
    config,
    extract = defaultExtractor,
  }: {
    key: QueryKey;
    url: string;
    method?: "POST" | "PUT" | "PATCH" | "DELETE";
    config?: any;
    extract?: DataExtractor;
  },
  options?: Omit<
    UseMutationOptions<TData, unknown, TVariables, unknown>,
    "mutationKey" | "mutationFn"
  >
) {
  return useMutation<TData, unknown, TVariables>({
    mutationKey: key,
    mutationFn: (variables) =>
      request<TData>({ url, method, data: variables, config, extract }),
    ...options,
  });
}
