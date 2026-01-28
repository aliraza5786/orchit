<template>
  <div class="bg-bg-body h-screen overflow-hidden">
    <Header  v-if="showHeader" />
    <div class=" lg:shadow-xl flex flex-wrap w-full h-full p-4">
      <!-- Left Panel -->
      <div class="w-full lg:w-1/2 lg:pr-[15px] overflow-y-auto h-full lg:flex-1">
        <slot name="form" />
      </div>

      <!-- Right Panel with video background -->
      <div class="hidden md:flex w-full lg:w-1/2 max-w-full lg:max-w-[663px]
         rounded-4xl relative h-full lg:ml-auto
         overflow-hidden items-center justify-center bg-black">
        <!-- Video background -->
        <video autoplay muted loop playsinline class="absolute inset-0 w-full  h-full object-cover opacity-60 z-0">
          <source src="../../assets/videos/Glowing-particles-overlay.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <!-- Stepper -->
        <div v-if="steps && activeStep" class="absolute bottom-6 left-6 right-6 flex items-end justify-between">
          <div class="flex items-center gap-2 w-full">
            <template v-for="(step, index) in steps" :key="index">
              <div class="flex flex-col gap-1 transition-all duration-300" :class="[
                  index === activeStep - 1 ? ' w-full' : ' w-10'
                ]">
              <span class="text-white ">  {{ index + 1 }}.</span>
                <div class=" h-1 rounded transition-all duration-300 w-full" :class="[
                  index === activeStep - 1 ? 'bg-white ' : 'bg-white/30 '
                ]"></div>
                <div class="text-sm text-white/80 opacity-0 text-nowrap transition-all duration-300" :class="{ '!opacity-100': activeStep - 1 == index }">
                  {{ step }}
                </div>
              </div>
            </template>
          </div>

        </div>

        <!-- Overlay content -->
        <div class="relative z-10 text-white text-center px-10 w-full h-full flex justify-center items-center ">
          <!-- <img src="../../assets/global/favicon.png" class="absolute w-32 top-6 left-6" /> -->
          <slot name="illustration">
            <p class="text-2xl font-[200] leading-relaxed " style="font-family: 'Castoro', serif;">
              Experience Next-Gen Collaboration<br />
              from Mars <img src="../../assets/icons/mars.svg" class="inline" /> to Your Workflow
            </p>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Header from '../LandingPageLayout/components/Header.vue';
import { useRoute } from 'vue-router'
const route = useRoute()
import { computed } from 'vue'
console.log("route path", route.path);

const showHeader = computed(() => {
  return route.path !== '/login' && route.path !== '/register'
})
// <script setup lang="ts">
defineProps<{
  activeStep?: number
  steps?: string[]
}>()

// AuthLayout with background video in the right panel
</script>

<style scoped></style>