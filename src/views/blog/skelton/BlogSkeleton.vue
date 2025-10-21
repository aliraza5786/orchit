<script setup lang="ts">
import { useTheme } from "../../../composables/useTheme";

const { theme } = useTheme();
</script>

<template>
  <div class="space-y-6 animate-pulse">
    <!-- Skeleton Title -->
    <div class="h-10 w-3/4 rounded-md mx-auto md:mx-0"
         :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>

    <!-- Skeleton Meta -->
    <div class="flex gap-4">
      <div class="h-4 w-20 rounded-md" :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
      <div class="h-4 w-24 rounded-md" :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
      <div class="h-4 w-16 rounded-md" :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
    </div>

    <!-- Skeleton Featured Image -->
    <div class="h-64 w-full rounded-xl" :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>

    <!-- Skeleton Content -->
    <div class="space-y-3">
      <div class="h-4 w-full rounded-md" :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
      <div class="h-4 w-5/6 rounded-md" :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
      <div class="h-4 w-4/6 rounded-md" :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
      <div class="h-4 w-3/6 rounded-md" :class="theme === 'dark' ? 'bg-gray-900' : 'bg-gray-200'"></div>
    </div>
  </div>
</template>
