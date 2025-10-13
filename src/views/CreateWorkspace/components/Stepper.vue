<template>
    <div class="flex justify-between mb-6 ">
      <div
        v-for="(step, index) in steps"
        :key="step"
        class="flex-1 text-center last:text-end first:text-start relative"
      >
        <div
          class="text-sm font-medium"
          :class="{ 'text-text-primary': currentStep === index, 'text-text-secondary -400': currentStep !== index }"
        >
          {{ index + 1 }}. {{ step }}
        </div>
        <div class="h-2 mt-2 last:rounded-r-full first:rounded-l-full bg-gray-200">
          <div
            class="h-full   bg-black transition-all duration-300"
            :style="{ width: currentStep > index ? '100%' : currentStep === index ? '100%' : '0%' }"
          ></div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts" setup>
  defineProps<{
    steps: string[];
    currentStep: number;
  }>();
  </script>
  