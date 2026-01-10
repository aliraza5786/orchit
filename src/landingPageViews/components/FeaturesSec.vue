<template>
    <section class="features_sec z-1 relative float-left w-full px-[15px] ">
        <div class="custom_container">
            <!-- Heading Section -->
            <div class=" text-center">
                <small
                    class="text-sky inline-block leading-[24px] md:leading-[32px] text-[16px] md:text-[20px] lg:text-[24px] font-manrope font-bold lg:tracking-[-1px] mb-[10px] md:mb-[15px] xl:mb-[20px]">
                    Features</small>
                <h3 class="font-manrope text-center text-primary font-bold text-[24px] md:text-[36px] lg:text-[48px] 
               leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px] mb-4 md:mb-6">
                    Why Use Space
                </h3>
                <p class="font-manrope text-[#797E86] text-[16px] md:text-[18px] lg:text-[20px] 
                 leading-[24px] lg:leading-[28px] font-normal max-w-[570px] mx-auto text-center">
                    we offering a range of cutting-edge features that set us apart
                    in the world of online security and privacy.
                </p>
            </div>

            <div class="overflow-hidden pt-10 lg:pt-14  pb-10 md:pb-16 lg:pb-20 ">
                <div class="flex justify-center flex-wrap gap-y-[24px] -mx-[12px] ">
                    <div v-for="(project, index) in projects" :key="index"
                        class="project_box 
                     transition-all duration-300 hover:scale-[1.02] w-[100%] sm:w-[50%]  md:w-[33.333%] flex  px-[12px]">
                        <div class="card_inner_box rounded-[24px] lg:rounded-[40px] py-[28px]   px-[32px] md:p-[32px] lg:p-[40px] w-full"
                            :class="isDark ? 'bg-bg-charcoal' : 'bg-[#F1EEFF]'">
                            <figure class="mb-[20px] lg:mb-[30px] xl:mb-[40px]">
                                <img :src="project.img" :alt="project.name + ' image'" width="100%" class="w-full"
                                    loading="lazy" />
                            </figure>
                            <h4
                                class="font-lato text-center mx-auto sm:mx-0 sm:text-left max-w-[140px] lg:max-w-[220px] text-capitalize text-[24px] lg:text-[30px]  [@media(min-width:1500px)]:text-[40px] leading-[30px] lg:leading-[36px] [@media(min-width:1500px)]:leading-[48px] text-primary mb-[10px] lg:mb-[24px] font-bold">
                                {{ project.name }}
                            </h4>
                            <p class="font-manrope text-center sm:text-left text-[#797E86] text-[16px] md:text-[18px] lg:text-[20px] 
                           leading-[24px] lg:leading-[28px] font-normal m-0"> {{ project.description }}</p>
                        </div>


                    </div>
                </div>
            </div>

        </div>

    </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import aiproject from '@assets/LandingPageImages/whyusespace/aiproject.webp';
import collboration from '@assets/LandingPageImages/whyusespace/collaboration.webp';
import projectivity from '@assets/LandingPageImages/whyusespace/productivity.webp';
import ligtAiproject from '@assets/LandingPageImages/whyusespace/lightAiproject.webp';
import lightCollboration from '@assets/LandingPageImages/whyusespace/lightCollaboration.webp';
import lightProjectivity from '@assets/LandingPageImages/whyusespace/lightProductivity.webp';
import { useTheme } from "../../composables/useTheme";
const { isDark } = useTheme(); // light / dark / system

interface Project {
    name: string;
    description: string;
    img: string;
}

const projects = computed<Project[]>(() => [
  {
    name: "Smarter projectivity",
    description: "Automatically organize tasks and workflows with AI to keep projects moving forward.",
    img: isDark.value ? projectivity : lightProjectivity,
  },
  {
    name: "AI Project Builder",
    description: "Instantly generate complete projects with AI, from setup to delivery in just a few clicks.",
    img: isDark.value ? aiproject : ligtAiproject,
  },
  {
    name: "Effortless Collaboration",
    description: "Connect people, files, and tools with AI that adapts to every interaction.",
    img: isDark.value ? collboration : lightCollboration,
  },
]);
</script>

<style scoped>
.features_sec::before {
    content: "";
    position: absolute;
    top: 0px;
    left: 50%;
    width: 600px;
    height: 600px;
    margin-left: -300px;
    background: radial-gradient(circle,
            rgba(130, 144, 255, 0.6) 0%,
            rgba(255, 255, 255, 0) 70%);
    filter: blur(120px);
    z-index: -1;

}
@media(max-width:768px) {
    .features_sec::before  {
        left: 50%;
        width: 400px;
        height: 400px;
        margin-left: -200px;
    }

}
@media(max-width:500px) {
    .features_sec::before  {
        left: 50%;
        width: 300px;
        height: 300px;
        margin-left: -150px;
    }

}
</style>
