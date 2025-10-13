<template>
  <div class="flex items-center justify-between w-full ">
    <div v-for="(step, index) in steps" :key="index"
      :class="` flex items-center  ${index < steps.length - 1 ? 'flex-1' : ''}`">
      <!-- Step circle -->
      <div class="flex flex-col items-center text-center mt-5">
        <div
          class="w-8 h-8 rounded-full text-base font-medium flex items-center justify-center transition-all duration-300  "
          :class="[
            currentStep > index || currentStep == index
              ? 'bg-accent text-white'
              : 'bg-bg-surface text-text-secondary'
          ]">
          {{ index + 1 }}
        </div>
        <span class="mt-2 text-base font-medium" :class="currentStep === index ? 'text-text-primary font-medium ' : 'text-text-secondary'">
          {{ step }}
        </span>
      </div>

      <!-- Connector line (except after last) -->
      <div v-if="index < steps.length - 1" class="flex-1 h-1 mx-2 transition-all duration-300 rounded-full"
        :class="currentStep > index ? 'bg-accent text-white ' : 'bg-bg-surface'"></div>

    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  steps: string[]
  currentStep: number
}>()
</script>