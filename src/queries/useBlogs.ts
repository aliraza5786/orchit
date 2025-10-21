import { useQuery } from "@tanstack/vue-query";
import api from "../libs/api";
import { computed, unref, type Ref } from "vue";
 

// ---------------------------
// Fetch Active Categories
// ---------------------------
export const fetchActiveCategories = async () => {
  const { data } = await api.get("/blogs/categories/active");
  return data.data; 
};

export const useActiveCategories = (options = {}) => {
  return useQuery({
    queryKey: ["blogs", "categories", "active"],
    queryFn: fetchActiveCategories,
    ...options,
  });
};

// ---------------------------
// Fetch Featured Categories
// ---------------------------
export const fetchFeaturedCategories = async () => {
  const { data } = await api.get("/blogs/categories/featured");
  return data.data;
};

export const useFeaturedCategories = (options = {}) => {
  return useQuery({
    queryKey: ["blogs", "categories", "featured"],
    queryFn: fetchFeaturedCategories,
    ...options,
  });
};

// ---------------------------
//  Fetch Category by Slug
// ---------------------------
export const fetchCategoryBySlug = async (slug: string) => {
  const { data } = await api.get(`/blogs/categories/slug/${slug}`);
  return data.data;
};

export const useCategoryBySlug = (slug: string, options = {}) => {
  return useQuery({
    queryKey: ["blogs", "categories", "slug", slug],
    queryFn: () => fetchCategoryBySlug(slug),
    enabled: !!slug, // only fetch if slug is defined
    ...options,
  });
};


// ---------------------------
//  Fetch Published Blogs
// ---------------------------
export const fetchPublishedBlogs = async () => {
  const { data } = await api.get("/blogs/published");
  return data.data;
};

export const usePublishedBlogs = (options = {}) => {
  return useQuery({
    queryKey: ["blogs", "published"],
    queryFn: fetchPublishedBlogs,
    ...options,
  });
};



// ---------------------------
// Fetch Featured Blogs
// ---------------------------
export const fetchFeaturedBlogs = async () => {
  const { data } = await api.get("/blogs/featured");
  return data.data;
};

export const useFeaturedBlogs = (options = {}) => {
  return useQuery({
    queryKey: ["blogs", "featured"],
    queryFn: fetchFeaturedBlogs,
    ...options,
  });
};




// ---------------------------
//  Fetch Blog by Slug
// ---------------------------
export const fetchBlogBySlug = async (slug: string) => {
  const { data } = await api.get(`/blogs/slug/${slug}`);
  return data.data;
};

export const useBlogBySlug = (slug: Ref<string>, options = {}) => {
  const reactiveSlug = computed(() => unref(slug));

  return useQuery({
    queryKey: ["blogs", "slug", reactiveSlug],
    queryFn: () => fetchBlogBySlug(reactiveSlug.value),
    enabled: computed(() => !!reactiveSlug.value),
    ...options,
  });
};



// ---------------------------
//  Fetch Related Blogs
// ---------------------------
export const fetchRelatedBlogs = async (id: any) => {
  if (!id) throw new Error("Blog ID is required for fetching related blogs");
  const { data } = await api.get(`/blogs/${id}/related`);
  return data.data;
};

export const useRelatedBlogs = (
  id: Ref<string | number | undefined> | string | number,
  options = {}
) => {
  const reactiveId = computed(() => unref(id));

  return useQuery({
    queryKey: ["blogs", "related", reactiveId],
    queryFn: () => fetchRelatedBlogs(reactiveId.value),
    enabled: computed(() => !!reactiveId.value),
    ...options,
  });
};



// ---------------------------
//  Fetch Blogs by Category Slug
// ---------------------------
export const fetchBlogsByCategorySlug = async (slug: string) => {
  const { data } = await api.get(`/blogs/categories/slug/${slug}`);
  return data.data;  
};

export const useBlogsByCategorySlug = (slug: string, options = {}) => {
  return useQuery({
    queryKey: ["blogs", "category", slug],
    queryFn: () => fetchBlogsByCategorySlug(slug),
    enabled: !!slug, // only fetch when slug exists
    ...options,
  });
};

