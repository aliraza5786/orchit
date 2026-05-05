import { useQuery } from "@tanstack/vue-query";
import api from "../libs/api";
import { computed, unref, type Ref } from "vue";
import type { QueryFunctionContext } from "@tanstack/vue-query";

type PackagesParams = {
  scope?: "personal" | "organization";
};

type PackagesQueryKey = readonly [
  "billing",
  "packages",
  PackagesParams?
];

export const fetchPackages = async (
  context: QueryFunctionContext<PackagesQueryKey>
) => {
  const [, , params] = context.queryKey;

  const { data } = await api.get("/billing/packages", {
    params: params?.scope ? { scope: params.scope } : {},
  });

  return data.data;
};
export const usePackages = (
  params: PackagesParams = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["billing", "packages", params] as const,
    queryFn: fetchPackages,
    ...options,
  });
};
// ---------------------------
// Fetch Package by Slug
// ---------------------------
export const fetchPackageBySlug = async (slug: string) => {
  const { data } = await api.get(`/billing/packages/slug/${slug}`);
  return data.data;
};

export const usePackageBySlug = (slug: Ref<string> | string, options = {}) => {
  const reactiveSlug = computed(() => unref(slug));

  return useQuery({
    queryKey: ["billing", "packages", "slug", reactiveSlug],
    queryFn: () => fetchPackageBySlug(reactiveSlug.value),
    enabled: computed(() => !!reactiveSlug.value),
    ...options,
  });
};
