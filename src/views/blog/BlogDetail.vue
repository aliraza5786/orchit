<script setup lang="ts">
import { computed, watchEffect, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useBlogBySlug, useRelatedBlogs } from "../../queries/useBlogs.ts";
import { useTheme } from "../../composables/useTheme";
import BlogSkeleton from "./skelton/BlogSkeleton.vue";
import RelatedBlogSkeleton from "./skelton/RelatedBlogSkeleton.vue";

const { theme } = useTheme();
const route = useRoute();
const router = useRouter();

// Get slug from route
const slug = computed(() => route.params.id as string);

// Fetch main blog by slug
const { data: blog, isLoading: loadingBlog, refetch: refetchBlog } = useBlogBySlug(slug, {
  enabled: computed(() => !!slug.value),
}); 

// Blog ID 
const blogId = computed(() => blog.value?._id);

// Fetch related blogs  
const { data: relatedBlogs, isLoading: loadingRelated, refetch: refetchRelated } = useRelatedBlogs(blogId);

// to refetch related blogs
watch(blogId, () => {
  if (blogId.value) refetchRelated();
});

// Watch slug and refetch blog when it changes
watch(slug, () => {
  if (slug.value) {
    refetchBlog();
  }
}); 

</script>


<template>
  <section class="float-left w-full px-[15px] my-[40px] md:my-[60px] lg:my-[80px]">
    <div class="detail_container mx-auto max-w-[1000px]">
      
      <!-- Main Blog Loading -->
      <BlogSkeleton v-if="loadingBlog" />

      <!--  Blog Not Found -->
      <div v-else-if="!blog" class="text-center text-red-500 font-medium my-5">
        Blog not found.
      </div>

      <!--  Blog Content -->
      <div v-else class="animate-fadeIn">
        <!-- Blog Meta Info -->
        <div class="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-text-secondary mb-4 md:mb-6">
          <span>
            <i class="fa-solid fa-calendar-days mr-1"></i>
            {{ new Date(blog.published_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }) }}
          </span>
          <span>
            <i class="fa-solid fa-user mr-1"></i>
            {{ blog.author?.name || "Unknown Author" }}
          </span>
          <span>
            <i class="fa-solid fa-clock mr-1"></i>
            {{ blog.reading_time }} min
          </span>
        </div>
        <!-- Title -->
        <h1
          class="font-manrope text-[28px] md:text-[40px] lg:text-[60px] leading-[60px] font-bold text-text-primary mb-[30px] ">
          {{ blog.title }}
        </h1>

        <!-- Featured Image -->
        <div class="overflow-hidden rounded-xl mb-8 shadow-md">
          <img v-if="blog.featured_image" :src="blog.featured_image" :alt="blog.featured_image_alt || blog.title"
            class="w-full h-auto object-cover transition-transform duration-500 hover:scale-105" />
        </div>



        <!-- Blog Content -->
        <article class="blog_content prose dark:prose-invert max-w-none leading-relaxed text-text-secondary mb-16"
          v-html="blog.content">
        </article>

        <!--  Related Blogs -->
        <section>
          <h2 class="font-manrope text-[24px] md:text-[32px] font-bold mb-8 text-text-primary">
            More form Space
          </h2>

          <!-- Related Blogs Loading -->
          <RelatedBlogSkeleton v-if="loadingRelated" />

          <div v-else-if="relatedBlogs?.length" class="grid sm:grid-cols-2 gap-8">
            <div v-for="r in relatedBlogs" :key="r._id" @click="router.push(`/blog/${r.slug}`)"
              class="cursor-pointer rounded-2xl bg-bg-lavender overflow-hidden border transition-all hover:shadow-xl group"
               :class="theme === 'dark' ? 'border border-border-input' : 'border border-[#a495e9b5]'">
              <div class="overflow-hidden">
                <img v-if="r.featured_image" :src="r.featured_image" :alt="r.featured_image_alt || r.title"
                  class="w-full aspect-[3/2] h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              </div>

              <div class="p-5">
                <h3
                  class="font-manrope text-[18px] sm:text-[20px] font-semibold leading-[28px] mb-[8px] text-text-primary group-hover:text-accent transition line-clamp-2">
                  {{ r.title }}
                </h3>
                <p class="line-clamp-3 font-normal font-manrope text-[14px] leading-[20px] text-text-secondary mb-[16px]"
                  v-html="r.excerpt"></p>
                <span class="text-accent text-[16px] font-medium group-hover:underline">
                  Read more →
                </span>
              </div>
            </div>
          </div>

          <div v-else class="text-text-secondary my-4">No related blogs available.</div>
        </section>
      </div>
    </div>
  </section>
</template>

<style>
.blog_content h2 {
  font-size: 36px;
  margin: 15px 0px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 40px !important;
}

.blog_content h3 {
  font-size: 32px;
  margin: 15px 0px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 40px !important; 
}

.blog_content h4 {
  font-size: 20px;
  margin: 10px 0px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 28px !important;
}

.blog_content p {
  font-size: 16px;
  line-height: 24px;
  margin-bottom: 10px;
  font-weight: 400;
  font-family: manrope;
  color: var(--color-text-secondary);
}

.blog_content p strong {
  font-size: 16px;
  line-height: 24px;
  margin-bottom: 10px;
  color: var(--color-text-primary);
}

.blog_content a {
  color: var(--accent);
  text-decoration: underline;
}
ul{
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: inside !important;
}
li{
  font-size: 16px;
  line-height: 24px; 
  font-weight: 400;
  font-family: manrope;
  color: var(--color-text-secondary);
}


.animate-fadeIn {
  animation: fadeIn 0.5s ease-in-out;
}

@media(max-width:1024px) {
  .blog_content h2 {
    font-size: 24px;
    line-height: 32px;
  }

  .blog_content h3 {
    font-size: 22px;
    line-height: 28px;
    margin: 10px 0px;
  }

  .blog_content h4 {
    font-size: 18px;
    line-height: 26px;
  }
}

@media(max-width:768px) {
  .blog_content p {
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 10px;
    color: var(--color-text-secondary);
  }

}


@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
