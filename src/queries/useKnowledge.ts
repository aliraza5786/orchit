import { useQuery } from "@tanstack/vue-query";
import { api } from "../libs/api";  
import { unref, computed, type Ref } from "vue";


// ---------------------------
// Fetch Active Knowledge Categories
// ---------------------------

// Fetcher function
export const fetchActiveKnowledgeCategories = async () => {
  const { data } = await api.get("/knowledge/categories/active");
  return data.data;
};

// Composable for reactive usage
export const useActiveKnowledgeCategories = (options = {}) => {
  return useQuery({
    queryKey: ["knowledge", "categories", "active"],
    queryFn: fetchActiveKnowledgeCategories,
    ...options,
  });
};



 // ---------------------------
// Fetch Knowledge Article by Slug
// ---------------------------
export const fetchKnowledgeBySlug = async (slug: string) => {
  if (!slug) throw new Error("Slug is required");
  const { data } = await api.get(`/knowledge/slug/${slug}`);
  return data.data;
};
 
export const useKnowledgeBySlug = (slug: Ref<string> | string, options = {}) => {
  return useQuery({
    queryKey: ["knowledge", "slug", slug],
    queryFn: () => fetchKnowledgeBySlug(unref(slug)),
    enabled: computed(() => !!unref(slug)), // only run when slug exists
    ...options,
  });
};

