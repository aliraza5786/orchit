<template>
    <section class="faqs_parent  float-left relative w-full px-[15px] pb-[40px] md:pb-[60px] lg:pb-[80px]">
        <div class="max-w-[846px] mx-auto relative z-2">
            <div class="heading_sec flex flex-col items-center mb-[40px] lg:mb-[56px]">
                <small
                    class="text-sky inline-block leading-[24px] md:leading-[32px] text-[16px] md:text-[20px] lg:text-[24px] font-manrope font-bold lg:tracking-[-1px] mb-[10px] md:mb-[15px] xl:mb-[20px]">
                    FAQ</small>
                <h3 class="font-manrope text-primary font-bold text-[24px] md:text-[36px] lg:text-[48px] 
               leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px] mb-4 md:mb-6 text-center">
                    Frequently Asked Questions</h3>
                <p class="font-manrope  text-[#797E86] text-[16px] md:text-[18px] lg:text-[20px] 
                 leading-[24px] lg:leading-[28px] font-normal max-w-[770px] mx-auto text-center">
                    We have compiled list of frequently asked questions to provide you with quick and comprehensive
                    answers.</p>
            </div>
            <div class="faqs_box flex flex-col gap-[16px] mb-[35px] lg:mb-[56px]">
                <div v-for="(faq, i) in faqs" :key="i"
                    class="border border-border-input overflow-hidden faq_box bg-bg-charcoal   p-[24px] rounded-[24px]">

                    <button @click="toggle(i)"
                        class="w-full flex justify-between items-center gap-[15px] transition cursor-pointer">
                        <span
                            class="font-manrope text-left text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] lg:leading-[32px] tracking-[0px] ">{{
                            faq.question }}</span>

                        <i class="fas fa-chevron-down fa-rotatable text-[12px]" :class="{ 'rotated': openIndex === i }"
                            aria-hidden="true"></i>
                    </button>

                    <transition name="accordion">
                        <div v-show="openIndex === i"
                            class="mt-[16px] text-[#797E86] font-manrope text-[16px] md:text-[18px]  font-normal leading-[24px] md:leading-[28px]">
                            {{ faq.answer }}
                        </div>
                    </transition>


                </div>
            </div>
            <p class="font-manrope text-[16px] font-medium text-center">More questions? <RouterLink
                    class="text-sky font-bold" to="/contact-us">Contact Us </RouterLink>
            </p>

        </div>

    </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useTheme } from "../../composables/useTheme";
const { theme } = useTheme(); // light / dark / system

const faqs = [
    { 
        question: 'What is Orchit.ai?', 
        answer: 'Orchit.ai is an AI-powered work and project management platform designed to help teams and individuals plan, organize, and manage tasks more efficiently using artificial intelligence.' 
    },
    { 
        question: 'How does Orchit.ai help with project management?', 
        answer: 'Orchit.ai uses AI to assist with task planning, prioritization, scheduling, and workflow organization, reducing manual effort and improving productivity.' 
    },
    { 
        question: 'Who can use Orchit.ai?', 
        answer: 'Orchit.ai is suitable for business teams, project managers, startups, organizations, and individuals who want a smarter way to manage work and collaborate.' 
    },
    { 
        question: 'What makes Orchit.ai different from traditional project tools?', 
        answer: 'Unlike traditional tools, Orchit.ai provides AI-driven suggestions, automation, and insights to help users make better decisions and manage work more effectively.' 
    },
    { 
        question: 'Can Orchit.ai be used for team collaboration?', 
        answer: 'Yes — Orchit.ai supports team collaboration, allowing members to organize tasks, track progress, and work together within a shared AI-assisted workspace.' 
    },
    { 
        question: 'What are the main benefits of using Orchit.ai?', 
        answer: 'The main benefits include better organization, improved productivity, smarter planning, reduced manual work, and enhanced visibility into tasks and projects.' 
    }
]


const openIndex = ref<number | null>(0);
if (theme.value === 'dark') {
    openIndex.value = (null);
}
const toggle = (i: number) => {
    openIndex.value = openIndex.value === i ? null : i
}
</script>

<style scoped>
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

.faqs_parent::before {
    content: "";
    position: absolute;
    bottom: -300px;
    left: 50%;
    width: 800px;
    height: 800px;
    margin-left: -400px;
    background: radial-gradient(circle,
            rgba(130, 144, 255, 0.4) 0%,
            rgba(255, 255, 255, 0) 70%);
    filter: blur(120px);
    z-index: 0;

}

@media(max-width:900px) {
    .faqs_parent::before {
        left: 50%;
        width: 400px;
        height: 400px;
        margin-left: -200px;
        bottom: -50px;
    }

}

@media(max-width:500px) {
    .faqs_parent::before {
        left: 50%;
        width: 300px;
        height: 300px;
        margin-left: -150px;
    }

}
</style>
