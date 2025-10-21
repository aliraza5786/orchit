<script setup lang="ts">
import { useTheme } from "../../../composables/useTheme";

const { theme } = useTheme();
</script>

<template>
  <div class="rounded-[12px] shadow-sm cursor-pointer animate-pulse"
       :class="theme === 'dark' ? 'border border-border-input bg-bg-charcoal' : 'border border-[#a495e9b5] bg-bg-lavender'">
    
    <!-- Image Skeleton -->
    <div class="h-[245px] w-full object-cover rounded-t-[12px]" 
         :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>

    <!-- Blog Content Skeleton -->
    <div class="p-[24px] flex flex-col justify-between">
      
      <!-- Category + Date Skeleton -->
      <div class="h-4 w-3/5 rounded-md mb-3" 
           :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>

      <!-- Title Skeleton -->
      <div class="h-6 w-full rounded-md mb-3"
           :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
      <div class="h-6 w-4/5 rounded-md mb-3"
           :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>

      <!-- Excerpt Skeleton -->
      <div class="h-4 w-full rounded-md mb-2"
           :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
      <div class="h-4 w-5/6 rounded-md mb-2"
           :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>

      <!-- Footer Skeleton -->
      <div class="flex items-center justify-between mt-4">
        <div class="h-3 w-16 rounded-md" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'"></div>
        <div class="h-3 w-6 rounded-md" :class="theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'"></div>
      </div>
    </div>
  </div>
</template>
