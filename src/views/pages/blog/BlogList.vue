<script setup lang="ts">
import { ref, computed } from 'vue'
import BlogCard from '../blog/components/BlogCard.vue'
import BlogFilters from '../blog/components/BlogFilters.vue';
import spaceImage from '@assets/blogPageImages/introSpace.webp';
import changelog from '@assets/blogPageImages/changelog.webp';
import Security from '@assets/blogPageImages/Security.webp';
import spaceAi from '@assets/blogPageImages/spaceAi.webp';
import velocity from '@assets/blogPageImages/velocity.webp';
import growth from '@assets/blogPageImages/growth.webp'; 



interface Blog {
  id: number
  title: string
  category: string
  date: string
  author: string
  time: string
  image: string
  description: string
}

const categories = ['All', 'Product', 'Changelog', 'Playbooks', 'Trust', 'Stories', 'Guides']
const activeCategory = ref('All')

const blogs = ref<Blog[]>([
  {
    id: 1,
    title: 'Introducing Space: a faster way to draft, decide, and ship',
    category: 'Product',
    date: 'July 1, 2025',
    author: 'Ava Rahman',
    time: '4 min',
    image: spaceImage,
    description: 'Meet Space — your all-in-one workspace for writing, planning, and sharing docs without the busywork.',
  },
  {
    id: 2,
    title: 'Changelog — July 2025',
    category: 'Changelog',
    date: 'July 29, 2025',
    author: 'Jonas Lee',
    time: '3 min',
    image: changelog,
    description: 'Speed boosts, AI-powered summaries, and a simpler sharing flow.',
  },
  {
    id: 3,
    title: 'How high-velocity teams use Spaces',
    category: 'Playbooks',
    date: 'August 12, 2025',
    author: 'Mina Tariq',
    time: '6 min',
    image:  velocity,
    description: 'From standups to specs: seven lightweight rituals to keep momentum without meetings.',
  },
    {
    id: 4,
    title: 'Space AI: write clearer, faster',
    category: 'Product',
    date: 'August 28, 2025',
    author: 'Ava Rahman',
    time: '5 min',
    image: spaceAi,
    description: 'Turn rough notes into publish-ready docs — with your voice intact.',
  },
    {
    id: 5,
    title: 'Security at Space',
    category: 'Trust',
    date: 'August 12, 2025',
    author: 'Jonas Lee',
    time: '4 min',
    image: Security,
    description: 'Our approach to data protection, encryption, and responsible AI.',
  },
    {
    id: 6,
    title: 'Case study: Aurora scales docs without scaling meetings',
    category: 'Stories',
    date: 'August 12, 2025',
    author: 'Mina Tariq',
    time: '6 min',
    image:  growth,
    description: 'How a 40-person startup replaced status meetings with async docs in Space.',
  },
])

const filteredBlogs = computed(() =>
  activeCategory.value === 'All'
    ? blogs.value
    : blogs.value.filter((b) => b.category === activeCategory.value)
)
</script>

<template>
  <section class="float-left w-full px-[15px] py-[40px] md:py-[60px] lg:py-[80px] ">
    <header class="mb-[30px] lg:mb-[48px]">
      <h2 class="font-manrope text-left text-primary font-bold text-[24px] md:text-[36px] lg:text-[48px] leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px] mb-[16px]">Blogs</h2>
      <p class="font-manrope font-normal text-text-secondary text-[16px] md:text-[18px] md:leading-[24px] lg:leading-[28px]">
        Updates, ideas, and stories from the team building Space.
      </p>
    </header>

    <BlogFilters
      :categories="categories"
      v-model="activeCategory"
      class="mb-[30px] lg:mb-[40px]"
    />

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <BlogCard
        v-for="blog in filteredBlogs"
        :key="blog.id"
        :blog="blog"
      />
    </div>
  </section>
</template>
