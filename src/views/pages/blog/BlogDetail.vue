<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import growth from '@assets/blogPageImages/growth.webp';
const route = useRoute()
const blogId = Number(route.params.id)

const blog = ref({
  id: blogId,
  title: 'Introducing Space: a faster way to draft, decide, and ship',
  date: 'July 1, 2025',
  author: 'Ava Rahman',
  image: growth,
  content: `
  <p>Welcome to Space — your all-in-one workspace for writing, planning, and sharing docs.</p>
  <p>With AI assistance, you can focus on creativity while Space takes care of structure and clarity.</p>
  <p>More updates are coming soon!</p>
  `,
})
</script>

<template>
  <section class="max-w-3xl mx-auto py-[60px] px-[20px]">
    <img :src="blog.image" :alt="blog.title" class="rounded-xl mb-8" />
    <h1 class="text-3xl font-bold text-text-primary mb-2">{{ blog.title }}</h1>
    <p class="text-gray-400 text-sm mb-6">{{ blog.author }} · {{ blog.date }}</p>
    <article class="prose prose-invert" v-html="blog.content"></article>
  </section>
</template>
