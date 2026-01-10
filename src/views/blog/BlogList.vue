<script setup lang="ts">
import { ref, computed } from 'vue'
import BlogCard from '../blog/components/BlogCard.vue'
import { useTheme } from "../../composables/useTheme";
import BlogCardSkeleton from './skelton/BlogCardSkeleton.vue';
import CategoryTabsSkeleton from './skelton/CategoryTabsSkeleton.vue';
import { usePublishedBlogs } from '../../queries/useBlogs.ts';

const { theme, isDark } = useTheme();

// Active tab
const activeTab = ref('all')

// Fetch all blogs
const { data: allBlogs, isLoading: allLoading } = usePublishedBlogs();

// Map API data into BlogCard structure
const blogs = computed(() => {
  if (!allBlogs.value?.length) return [];
  return allBlogs.value.map((b: any) => ({
    id: b._id,
    title: b.title,
    slug: b.slug,
    category: {
      id: b.category_id?._id,
      slug: b.category_id?.slug || "uncategorized",
      title: b.category_id?.title || "Uncategorized",
    },
    date: new Date(b.published_at).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    author: b.author?.name || "Unknown",
    time: `${b.reading_time} min`,
    image: b.featured_image,
    description: b.excerpt,
  }));
});

// Extract unique categories
const categories = computed(() => {
  const unique = new Map();
  blogs.value.forEach((b:any) => {
    if (b.category && b.category.slug !== "uncategorized") {
      unique.set(b.category.slug, b.category);
    }
  });
  return Array.from(unique.values());
});

// Filter blogs by active tab
const filteredBlogs = computed(() => {
  if (!blogs.value) return [];
  if (activeTab.value === 'all') return blogs.value;
  return blogs.value.filter(
    (b:any) => b.category?.slug === activeTab.value
  );
});
</script>

<template>
  <section class=" mx-auto max-w-[1000px] w-full px-[15px] py-[40px] md:py-[60px] lg:py-[80px]">
    <header class="mb-[30px] lg:mb-[48px]">
      <h2
        class="font-manrope text-left text-primary font-bold text-[24px] md:text-[36px] lg:text-[48px] leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px] mb-[16px]">
        Blogs
      </h2>
      <p
        class="font-manrope font-normal text-text-secondary text-[16px] md:text-[18px] md:leading-[24px] lg:leading-[28px]">
        Updates, ideas, and stories from the team building Space.
      </p>
    </header>

    <!-- Tabs -->
    <div v-if="allLoading" >
      <CategoryTabsSkeleton />
    </div>
    <div v-else class="flex flex-wrap gap-3 mb-8 ">
      <button @click="activeTab = 'all'"
        class="px-[16px] py-[8px] rounded-full font-manrope text-[14px] font-medium transition border cursor-pointer"
        :class="[
          isDark
            ? activeTab === 'all'
              ? 'bg-white text-black border-white'
              : 'bg-bg-charcoal text-white border-bg-charcoal'
            : activeTab === 'all'
              ? 'bg-black text-white border-black'
              : 'bg-[#EFEFEF] text-black border-0'
        ]">
        All
      </button>

      <button v-for="cat in categories" :key="cat.slug" @click="activeTab = cat.slug"
        class="px-[16px] py-[8px] rounded-full font-manrope text-[14px] font-medium transition border cursor-pointer"
        :class="[
          isDark
            ? activeTab === cat.slug
              ? 'bg-white text-black border-white'
              : 'bg-bg-charcoal text-white border-bg-charcoal'
            : activeTab === cat.slug
              ? 'bg-black text-white border-black'
              : 'bg-[#EFEFEF] text-black border-0'
        ]">
        {{ cat.title }}
      </button>
    </div>

    <!--  Blog list -->
    <div v-if="allLoading" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 ">
      <BlogCardSkeleton v-for="n in 6" :key="n" />
    </div>

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mx-auto max-w-[1000px]">
      <BlogCard v-for="blog in filteredBlogs" :key="blog.id" :blog="blog" />
    </div>
  </section>
</template>
