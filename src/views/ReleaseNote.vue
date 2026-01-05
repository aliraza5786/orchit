<script setup lang="ts">
import { computed, ref, onUnmounted, nextTick, watch } from "vue";
// @ts-ignore
import { useAllBlogs } from "../queries/useBlogs.ts"; 

 

// Fetch blogs for 'release-notes' category
const { data: blogs, isLoading } = useAllBlogs();

// Filter out any potential null/undefined blogs or blogs without IDs
const validBlogs = computed(() => {
  if (!blogs.value) return [];
  console.log(blogs);

  return Array.isArray(blogs.value)
    ? blogs.value.filter((b: any) => {
        // Basic validity check
        if (!b || !b._id) return false;

        // Category filter
        // Check both name and slug for robustness
        const categoryName = b.category_id?.title?.toLowerCase();
        const categorySlug = b.category_id?.slug?.toLowerCase();

        return (
          categoryName === "release notes" ||
          categoryName === "release note" ||
          categorySlug === "release-notes" ||
          categorySlug === "release-note"
        );
      })
    : [];
}); 

const activeBlogId = ref<string | null>(null);

// Intersection Observer for Scrollspy
let observer: IntersectionObserver | null = null;
const isManualScrolling = ref(false);

const setupObserver = () => {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      // If we are essentially scrolling via click, likely we don't want to switch active state erroneously,
      // but typically it settles on the target anyway.
      if (isManualScrolling.value) return;

      // Find the element that is most visible or intersecting
      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        activeBlogId.value = visibleEntry.target.id;
      }
    },
    {
      root: null,
      // Trigger when the element crosses the middle of the screen or is near top
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    }
  );

  validBlogs.value.forEach((blog) => {
    const el = document.getElementById(blog._id);
    if (el) observer?.observe(el);
  });
};

watch(
  validBlogs,
  () => {
    nextTick(() => {
      setupObserver();
      // Set initial active blog
      if (validBlogs.value.length > 0 && !activeBlogId.value) {
        activeBlogId.value = validBlogs.value[0]._id;
      }
    });
  },
  { immediate: true, deep: true }
);

onUnmounted(() => {
  if (observer) observer.disconnect();
});

const scrollToBlog = (id: string) => {
  activeBlogId.value = id;
  const element = document.getElementById(id);
  if (element) {
    isManualScrolling.value = true;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    // Re-enable observer after scroll animation (approximate time)
    setTimeout(() => {
      isManualScrolling.value = false;
    }, 1000);
  }
};
</script>

<template>
  <div class="py-[40px] lg:py-[80px] px-[15px] w-full float-end">
    <div class="custom_container">
      <div
        class=" flex flex-col md:flex-row gap-5"
      >
        <!-- Sidebar (Left) -->
        <aside class="sm:w-[180px] shrink-0 ">
          <div class="sticky top-5">
             <h2 class="text-3xl block mb-5 sm:hidden font-bold text-text-primary">Release notes for Current Channel</h2>
            <span class="text-xl font-bold mb-6 text-text-primary block">
              In this article
            </span>
            <nav class="flex flex-col gap-2 border-l-2 border-border-input">
              <button
                v-for="blog in validBlogs"
                :key="blog._id"
                @click="scrollToBlog(blog._id)"
                class="text-left px-4 py-2 text-sm font-medium transition-colors border-l-2 -ml-[2px]"
                :class="[
                  activeBlogId === blog._id
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-secondary',
                ]"
              >
                {{ blog.title }}
              </button>

              <div
                v-if="isLoading"
                class="px-4 py-2 text-text-secondary text-sm"
              >
                Loading...
              </div>
              <div
                v-if="!isLoading && validBlogs.length === 0"
                class="px-4 py-2 text-text-secondary text-sm"
              >
                No release notes found.
              </div>
            </nav>
          </div>
        </aside>

        <!-- Main Content (Right) -->
        <main class="flex-1 min-w-0">
          <div v-if="isLoading" class="space-y-8">
            <!-- Skeleton Loading -->
            <div v-for="i in 3" :key="i" class="animate-pulse">
              <div
                class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"
              ></div>
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"
              ></div>
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"
              ></div>
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8"
              ></div>
            </div>
          </div>

          <div
            v-else-if="!isLoading && validBlogs.length === 0"
            class="flex flex-col items-center justify-center py-20"
          >
            <p class="text-lg text-text-secondary">
              No release notes available at the moment.
            </p>
          </div>

          <div v-else class="space-y-16">
            <article
              v-for="blog in validBlogs"
              :key="blog._id"
              :id="blog._id"
              class="scroll-mt-24 border-b border-border-input pb-12 last:pb-0 last:border-0"
            >
              <!-- Blog Header -->
              <header class="mb-6">
                <div
                  class="flex items-center gap-3 text-sm text-text-secondary mb-3"
                >
                  <span>
                    {{
                      new Date(blog.published_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    }}
                  </span>
                  <span v-if="blog.author?.name">• {{ blog.author.name }}</span>
                </div>
                <h1 class="text-3xl md:text-4xl font-bold text-text-primary">
                  {{ blog.title }}
                </h1>
              </header>

              <!-- Featured Image -->
              <div
                v-if="blog.featured_image"
                class="mb-8 rounded-xl overflow-hidden shadow-sm"
              >
                <img
                  :src="blog.featured_image"
                  :alt="blog.featured_image_alt || blog.title"
                  class="w-full h-auto object-cover max-h-[500px]"
                />
              </div>

              <!-- Content -->
              <div
                class="blog-content prose dark:prose-invert text-text-secondary"
                v-html="blog.content"
              ></div>
            </article>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles for the blog content if needed, but using shared prose classes is better */
.blog-content :deep(h1) {
  font-size: 1.875rem;
  line-height: 2.25rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
.blog-content :deep(h2) {
  font-size: 1.5rem;
  line-height: 2rem;
  font-weight: 700;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}
.blog-content :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.75;
}
.blog-content :deep(img) {
  border-radius: 0.5rem;
  margin: 1.5rem 0;
}
.blog-content :deep(ul),
.blog-content :deep(ol) {
  margin-left: 1.5rem; /* space for bullets */
  margin-bottom: 1rem;
  list-style-type: disc;
}
</style>
