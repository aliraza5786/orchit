<template>
    <section class="get_started_sec z-1 relative float-left w-full px-[15px] mb-10 md:mb-16 lg:mb-20 ">
        <div class="custom_container">
            <!-- Heading Section -->
            <div class="text-center mb-[40px] lg:mb-[48px]">
                <small
                    class="text-sky inline-block leading-[24px] md:leading-[32px] text-[16px] md:text-[20px] lg:text-[24px] font-manrope font-bold lg:tracking-[-1px] mb-[10px] md:mb-[15px] xl:mb-[20px]">
                    Steps</small>
                <h3 class="font-manrope text-center text-primary font-bold text-[24px] md:text-[36px] lg:text-[48px] 
               leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px] mb-4 md:mb-6">
                    Get Started in 3 Simple Steps
                </h3>
                <p class=" font-manrope text-[#797E86] text-[16px] md:text-[18px] lg:text-[20px] 
                 leading-[24px] lg:leading-[28px] font-normal max-w-[550px] mx-auto text-center">
                    From idea to execution, Space turns your thoughts
                    into projects with AI-powered ease.
                </p>
            </div>
            <div
                class="content_box grid grid-cols-[1fr] md:grid-cols-[1fr_1.2fr] lg:grid-cols-[1fr_1.4fr] gap-[40px] lg:gap-[80px] xl:gap-[105px]">
                <div class="steps_accordion">
                    <div class="steps_box flex flex-col">
                        <div v-for="(step, i) in steps" :key="i" :class="openIndex === i ? 'active' : ''"
                            class=" overflow-hidden step_box bg-transparent">
                            <div class="ml-[30px] lg:ml-[45px] border-b border-primary py-[20px] lg:py-[33px] ">
                                <button @click="toggle(i)"
                                    class=" w-full flex justify-start items-center gap-[15px] transition cursor-pointer">
                                    <span
                                        class="font-manrope text-left text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] lg:leading-[32px] tracking-[0px] ">{{
                                            step.question }}</span>

                                    <i class="fas fa-chevron-down fa-rotatable text-[12px]"
                                        :class="{ 'rotated': openIndex === i }" aria-hidden="true"></i>
                                </button>

                                <transition name="accordion">
                                    <div v-show="openIndex === i"
                                        class=" pt-[20px] lg:pt-[33px] text-[#797E86] font-manrope text-[16px] md:text-[18px]  font-normal leading-[24px] lg:leading-[30px] lg:tracking-[-0.5px] ">
                                        {{ step.answer }}
                                    </div>
                                </transition>
                            </div>



                        </div>
                    </div>
                </div>
                <figure class="m-0">
                    <img :src="manageJobs" alt="manageJobs image" width="100%"  
                        loading="lazy">
                </figure>
            </div>
        </div>
    </section>
</template>
<script lang="ts" setup>
import manageJobs from '@assets/LandingPageImages/getStartedStepsSec/managejobs.webp';

import { ref } from 'vue';
const steps = [
    { question: 'Think It   ', answer: 'Space is an AI-powered workspace that helps you plan, manage, and orchestrate projects—whether it’s for your team, your business, or your personal productivity.' },
    { question: 'Prompt It', answer: 'Efficiently oversee all job assignments to ensure nothing falls through the cracks.' },
    { question: 'Plan It', answer: ' Plan it as you want' },
]
const openIndex = ref<number | null>(1);
const toggle = (i: number) => {
    openIndex.value = openIndex.value === i ? null : i
}

</script>
<style scoped>
.get_started_sec::before {
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

.steps_box .active {
    border-left: 4px solid rgba(66, 115, 212, 1);
}

.fa-rotatable {
    display: inline-block;
    transform-origin: center;
    transition: transform 0.28s ease;
}

.rotated {
    transform: rotate(180deg);
}

.accordion-enter-active,
.accordion-leave-active {
    transition: all 0.3s ease;
}

.accordion-enter-from,
.accordion-leave-to {
    opacity: 0;
    max-height: 0;
}

.accordion-enter-to,
.accordion-leave-from {
    opacity: 1;
    max-height: 200px;
}

@media(max-width:768px) {
    .get_started_sec::before {
        left: 50%;
        width: 400px;
        height: 400px;
        margin-left: -200px;
    }

}
@media(max-width:500px) {
    .get_started_sec::before {
        left: 50%;
        width: 300px;
        height: 300px;
        margin-left: -150px;
    }

}
</style>
