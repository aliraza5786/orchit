<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import { useTheme } from "../../../composables/useTheme";
const { theme, setTheme } = useTheme(); // light / dark / system
import growth from '@assets/blogPageImages/growth.webp'
import BlogCard from '../blog/components/BlogCard.vue'
import spaceImage from '@assets/blogPageImages/introSpace.webp';
import changelog from '@assets/blogPageImages/changelog.webp';


// get route id
const route = useRoute()
const blogId = Number(route.params.id)

// blog data (for now static example)
const blog = ref({
  id: blogId,
  tag: "Product",
  title: "Introducing Space: a faster way to draft, decide, and ship",
  subtitle:
    "Meet Space — your all-in-one workspace for writing, planning, and sharing docs without the busywork.",
  date: "July 1, 2025",
  author: {
    name: "Ava Rahman",
    role: "Co-founder & CEO",
    avatar: "https://ui-avatars.com/api/?name=Ava+Rahman&background=random",
  },
  image: growth,
  sections: [
    {
      heading: "What you can do today",
      content: [
        "Draft with focus using a minimal editor that stays out of the way.",
        "Collect feedback inline with comments and suggestions.",
        "Decide with lightweight approvals and tracked outcomes.",
        "Publish to a public link or your site with one click.",
      ],
    },
    {
      heading: "Works with your stack",
      content: [
        "Embed from videos, Figma frames, and GitHub issues. Paste links and they just work.",
        "If you want to automate more, our API and webhooks are available on paid plans.",
      ],
    },
    {
      heading: "Pricing and access",
      content: [
        "There's a free plan for small teams and personal projects.",
        "Paid plans add granular permissions, SSO, and audit trails.",
      ],
    },
    {
      heading: "What's next",
      content: [
        "Shared components libraries for reusable sections.",
        "Per-doc analytics.",
      ],
    },
  ],
})

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
 
 
 
])
</script>

<template>
  <section class="float-left w-full py-[40px] md:py-[60px] px-[15px] text-text-primary">
    <div class="blog_container max-w-[850px] mx-auto">
      <!-- Tag and meta -->
      <div class="flex items-center gap-3 mb-4 ">
        <span class="bg-bg-lavender text-primary px-3 font-manrope py-1 rounded-full font-medium text-[14px]">
          {{ blog.tag }}
        </span>
        <span class="font-manrope font-normal text-[14px] leading-[20px]"
          :class="theme === 'dark' ? 'text-text-secondary' : 'text-text-primary'"><i class="fa-solid fa-calendar"></i>
          {{
            blog.date }}</span>
        <span class="font-manrope font-normal text-[14px] leading-[20px]"
          :class="theme === 'dark' ? 'text-text-secondary' : 'text-text-primary'"><i
            class="fa-solid fa-alarm-clock"></i> 4
          min read</span>
      </div>

      <!-- Title and subtitle -->
      <h1
        class="font-manrope text-left text-primary font-bold text-[24px] md:text-[36px] lg:text-[60px] leading-[34px] md:leading-[44px] lg:leading-[68px] tracking-[-1px] mb-4 md:mb-6">
        {{ blog.title }}</h1>
      <p
        class="font-manrope text-[#797E86] text-[16px] md:text-[18px] lg:text-[20px] leading-[24px] lg:leading-[28px] font-normal mb-[20px] lg:mb-[32px]">
        {{ blog.subtitle }}</p>

      <!-- Featured image -->
      <img :src="blog.image" :alt="blog.title" class="rounded-xl w-full object-cover  mb-[20px] lg:mb-[32px]" />

      <!-- Author Info -->
      <div class="border-b border-border-input mb-[32px]">
        <div class="flex items-center gap-4 mb-[50px]">
          <div
            class="icon bg-bg-lavender flex items-center justify-center font-manrope font-bold text-[20px] text-primary w-[48px] h-[48px] rounded-full">
            AV</div>
          <div>
            <p class="font-medium font-manrope text-[16px] text-primary">{{ blog.author.name }}</p>
            <p class="text-[14px] font-normal leading-[20px] text-text-secondary">{{ blog.author.role }}</p>
          </div>
        </div>
      </div>


      <!-- Table of contents -->

      <div class="border border-border-input bg-bg-lavender py-[40px] px-[25px] rounded-[12px] mb-[32px]">
        <h2 class="font-semibold text-primary leading-[28px] text-[18px] mb-[16px]">Table of Contents</h2>
        <ul class="list-decimal ps-4 space-y-3 font-manrope text-[14px] leading-[20px] font-normal text-text-secondary">
          <li v-for="(sec, index) in blog.sections" :key="index">
            {{ sec.heading }}
          </li>
        </ul>
      </div>

      <!-- Main content -->
      <div class="space-y-7 pb-[62px] border-b border-border-input">
        <p
          class="font-manrope text-[14px] md:text-[16px]  md:leading-[24px] font-normal text-text-secondary">
          We built Space for one persistent problem: writing and shipping work takes too much overhead.
          Too many tools, too many tabs, too many status pages. The result is slow decisions and scattered context.
        </p>

        <p
          class="font-manrope text-[14px] md:text-[16px]  md:leading-[24px] font-normal text-text-secondary">
          Space brings writing, feedback, and publishing into one clean surface.
          Create a doc, invite the right people, capture decisions, and publish — all without leaving the page.
        </p>

        <div v-for="(sec, index) in blog.sections" :key="index" class="space-y-4">
          <h3 class="font-semibold text-primary leading-[28px] text-[18px] mb-[16px]">{{ sec.heading }}</h3>
          <ul class="list-disc list-inside space-y-3">
            <li
              class="font-manrope text-[14px] md:text-[16px]  md:leading-[26px] font-normal text-text-secondary"
              v-for="(point, idx) in sec.content" :key="idx">
              {{ point }}
            </li>
          </ul>
        </div>

        <p
          class="font-manrope text-[14px] md:text-[16px] md:leading-[26px] font-normal text-text-secondary">
          "Space helped us replace three tools and ship product updates twice as fast." — Early customer</p>
        <h3 class="font-semibold text-primary leading-[28px] text-[18px] mb-[16px]">Works with your stack</h3>
        <p
          class="font-manrope text-[14px] md:text-[16px]  md:leading-[26px] font-normal text-text-secondary">
          Embed Loom videos, Figma frames, and GitHub issues. Paste links and they just work. If you want to automate
          more,
          our API and webhooks are available on paid plans.</p>
        <h3 class="font-semibold text-primary leading-[28px] text-[18px] mb-[16px]">Pricing and access</h3>
        <p
          class="font-manrope text-[14px] md:text-[16px] md:leading-[26px] font-normal text-text-secondary">
          There's a free plan for small teams and personal projects. Paid plans add granular permissions, SSO, and audit
          trails.</p>
        <h3 class="font-semibold text-primary leading-[28px] text-[18px] mb-[16px]">What's next</h3>
        <ul
          class="space-y-3 list-disc list-inside  font-manrope text-[14px] md:text-[16px]  md:leading-[26px] font-normal text-text-secondary">
          <li>Shared component libraries for reusable sections</li>
          <li>Per-doc analytics</li>
          <li>Per-doc analytics</li>
        </ul>
        <p
          class="font-manrope text-[14px] md:text-[16px] md:leading-[26px] font-normal text-text-secondary">
          If you want to try Space with your team, start a workspace and tell us what you think — we read every note.
        </p>
      </div>
      <div
        class="tagBox border-b border-border-input mb-[30px] lg:mb-[64px] pb-[30px] lg:pb-[64px] flex gap-2 items-center mt-[33px]  text-text-secondary font-normal text-[14px] leading-[20px]">
        Tags: <span class="bg-bg-lavender text-primary px-3 font-manrope py-1 rounded-full font-medium text-[14px]">
          launch
        </span> <span class="bg-bg-lavender text-primary px-3 font-manrope py-1 rounded-full font-medium text-[14px]">
          {{ blog.tag }}
        </span> <span class="bg-bg-lavender text-primary px-3 font-manrope py-1 rounded-full font-medium text-[14px]">
          Workspace
        </span>
      </div>
      <div class="related_blogs">
        <h3 class="font-semibold text-primary leading-[32px] text-[24px] mb-[20px] lg:mb-[33px]">More from Space</h3>
      </div>

       <div class="grid md:grid-cols-2 gap-6">
      <BlogCard
        v-for="blog in blogs"
        :key="blog.id"
        :blog="blog"
      />
    </div>
    </div>
  </section>
</template>

<style scoped>
section {
  color-scheme: dark;
}
</style>
