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
                <p class="font-manrope text-center text-[#797E86] text-[16px] md:text-[18px] lg:text-[20px] 
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
                    class="text-sky font-bold" to="#">Contact Us </RouterLink>
            </p>

        </div>

    </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useTheme } from "../../composables/useTheme";
const { theme, setTheme } = useTheme(); // light / dark / system

const faqs = [
    { question: 'Why do I need Space?', answer: 'Space is an AI-powered workspace that helps you plan, manage, and orchestrate projects—whether it’s for your team, your business, or your personal productivity.' },
    { question: 'How does Space protect my data?', answer: 'Space uses advanced encryption...' },
    { question: 'Does Space work in the background?', answer: 'Yes, Space can run background tasks...' },
    { question: 'Can I use Space on the go?', answer: 'Absolutely. Space works across devices.' },
    { question: 'Can I use Space with multiple tools?', answer: 'Yes, Space integrates with Slack, GitHub...' }
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
