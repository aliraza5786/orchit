<template>
  <div
    class="flex flex-col items-center justify-center text-center"
    :class="containerClass"
  >
    <div
      class="relative mb-5 flex h-10 w-10 items-center justify-center rounded-[6px] border border-border bg-bg-body shadow-sm"
    >
      <div
        class="absolute inset-0 rounded-[6px] bg-primary-color/5 blur-xl"
      />
      <i :class="[icon, 'text-xl text-accent relative z-10']" />
    </div>

    <h4 class="text-[15px] font-bold text-text-primary font-manrope">
      {{ title }}
    </h4>

    <p
      class="mt-1 max-w-[260px] text-[13px] leading-relaxed text-text-secondary font-manrope"
    >
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    icon: string;
    title: string;
    description: string;
    containerClass?: string;
  }>(),
  {
    containerClass: 'px-6 py-14',
  },
);
</script>
