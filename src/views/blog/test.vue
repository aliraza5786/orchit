<script setup lang="ts">
import { useBlogs } from "../../../queries/useBlogs"

const { data: blogs, isLoading, error } = useBlogs()
</script>

<template>
  <section>
    <div v-if="isLoading">Loading blogs...</div>
    <div v-else-if="error">Failed to load blogs</div>
    <div v-else>
      <article
        v-for="blog in blogs"
        :key="blog.id"
        class="border-b py-4"
      >
        <h2 class="text-lg font-semibold">{{ blog.title }}</h2>
        <p class="text-gray-600">{{ blog.excerpt }}</p>
      </article>
    </div>
  </section>
</template>
