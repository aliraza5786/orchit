<script setup lang="ts">
import lightGptIcon from '@assets/LandingPageImages/bnanerInputIcons/lightGpt.png';
import darkGptIcon from '@assets/LandingPageImages/bnanerInputIcons/darkGpt.png';

import { ref, defineExpose, defineEmits, defineProps } from "vue";
const props = defineProps<{ 
    loading?: boolean,
     theme: "light" | "dark"
 }>();

const emit = defineEmits<{
  (e: "submit", value: string): void;
}>();

const inputValue = ref("");

function setValue(val: string) {
  inputValue.value = val;
}

function handleSubmit() {
  if (!inputValue.value.trim()) return;
  emit("submit", inputValue.value);
}

defineExpose({ setValue });
</script>

<template>
  <form
    @submit.prevent="handleSubmit"
    class="w-full relative max-w-[700px]  lg:max-w-[896px] mx-auto pb-[40px]"
  >    
   <div class="input_box">
       <img  :src="theme === 'dark'? darkGptIcon : lightGptIcon"class="w-[34px] lg:w-[40px] absolute top-[9px] lg:top-[12px] left-[9px] lg:left-[12px] z-1" alt="chat icon">
  
    <input
      v-model="inputValue"
      type="text"
      placeholder="Describe your project..."
      class="w-full pl-[54px] lg:pl-[64px] pr-[100px] lg:pr-[130px] py-3 h-[54px] lg:h-[64px] rounded-[16px] bg-bg-body text-text-primary font-manrope text-[13px] md:text-[14px]
             text-text-primary border-2 lg:border-3 border-[#C74CF0] focus:outline-none focus:ring-0
             focus:ring-purple-500 transition-all duration-300 shadow-[0px_8px_32px_0px_#070A0D99]"
    />

    <button
      type="submit"
      class="absolute text-[14px] bg-[linear-gradient(113.71deg,#C74CF0_0%,#D371F4_100%)] top-[8px] end-[8px] rounded-[10px] leading-[100%]  bg-gradient-to-r from-purple-500 to-indigo-500
             text-white font-semibold hover:opacity-90 transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed w-[85px] lg:w-[110px] h-[38px] lg:h-[48px] flex items-center justify-center"
      :disabled="props.loading"
    >
      {{ props.loading ? "Generating..." : "Generate" }}
    </button>
     </div>
  </form>
</template>
