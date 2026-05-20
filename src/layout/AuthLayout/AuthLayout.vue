<template>
  <div class="bg-bg-body min-h-screen h-full sm:h-screen overflow-hidden">
    <div class="lg:shadow-xl flex w-full h-full min-h-screen">
      <div class="w-full h-full min-h-screen overflow-y-auto">
        <div
          class="min-h-screen w-full flex flex-col items-center justify-center px-[15px] py-8 sm:py-10"
        >
          <slot name="form" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"> 
import { useRoute } from 'vue-router'
const route = useRoute() 
console.log("route path", route.path);

 
// <script setup lang="ts">
defineProps<{
  activeStep?: number
  steps?: string[]
}>()

// AuthLayout with background video in the right panel
</script>

<style scoped></style>