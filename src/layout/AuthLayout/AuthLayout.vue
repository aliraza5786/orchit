<template>
  <div class="bg-bg-body h-full sm:h-screen overflow-hidden"> 
    <div class="lg:shadow-xl flex w-full h-full">
      <!-- Left Panel -->
      <div class="w-full overflow-y-auto h-full px-[15px]">
        <slot name="form" />
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