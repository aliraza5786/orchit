<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useTheme } from "../../../../composables/useTheme";
const { theme } = useTheme(); // light / dark / system

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

const props = defineProps<{ blog: Blog }>()

const router = useRouter();

function goToDetail() {
  router.push(`/blogs/${props.blog.id}`)
}
</script>

<template>
  <div
    @click="goToDetail"
    class="bg-bg-lavender rounded-[12px] shadow-sm hover:shadow-lg cursor-pointer transition-all duration-300 group"
    :class="theme === 'dark' ? 'border border-border-input' : 'border border-[#a495e9b5]'"
  >
    <div class="h-[245px] overflow-hidden rounded-t-[12px]">
      <img
        :src="blog.image"
        :alt="blog.title"
        class="w-full rounded-t-[12px] h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    </div>

    <div class="p-[24px] flex flex-col justify-between">
      <p class="uppercase font-semibold text-[12px] text-text-secondary mb-[12px]">
        {{ blog.category }} <span class="px-1">. </span> <span class="lowercase">{{ blog.date }}</span>
      </p>
      <h3 class="font-manrope text-[18px] sm:text-[20px] font-semibold leading-[28px]  mb-[8px] text-text-primary group-hover:text-accent transition">
        {{ blog.title }}
      </h3>
      <p class="text-sm line-clamp-3 font-normal font-manrope text-[14px] leading-[20px] text-text-secondary mb-[16px]">{{ blog.description }}</p>
      <div class="flex items-center justify-between text-[12px] text-text-secondary">
        <span>{{ blog.author }} <span class="px-1">. </span> {{ blog.time }}</span>
        <span class="group-hover:text-accent transition"><i class="fa-solid fa-arrow-right -rotate-45"></i></span>
      </div>
    </div>
  </div>
</template>
