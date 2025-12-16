import { useQuery } from "@tanstack/vue-query";
import api from "../libs/api";
import { computed, unref, type Ref } from "vue";

// ---------------------------
// Fetch All Packages
// ---------------------------
export const fetchPackages = async () => {
  const { data } = await api.get("/billing/packages");
  return data.data; // return the array of packages
};

export const usePackages = (options = {}) => {
  return useQuery({
    queryKey: ["billing", "packages"],
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
