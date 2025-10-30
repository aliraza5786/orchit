<template>
    <section class="float-left w-full overflow-x-hidden">
        <!-- Heading Section -->
        <div class="max-w-[876px] mx-auto px-4 text-center">
            <h3 class="font-manrope text-primary font-bold text-[24px] md:text-[36px] lg:text-[48px] 
               leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px] mb-4 md:mb-6">
                Achieve More, Effortlessly with Space
            </h3>
            <p class="font-manrope text-[#797E86] text-[16px] md:text-[18px] lg:text-[20px] 
                 leading-[24px] lg:leading-[28px] font-normal max-w-[780px] mx-auto">
                The only AI-driven platform you need to plan, automate, and adapt your work
                across all areas of your life and business.
            </p>
        </div>

        <!-- Moving Product Section -->
        <div class="overflow-auto pb-10 md:pb-16 lg:pb-20 pt-10 lg:pt-14 ">
            <div class="flex gap-[14px] px-4 animate-marquee will-change-transform ">
                <!-- Repeat marquee twice for continuous loop -->
                <div v-for="n in 5" :key="n" class="flex gap-[14px] flex-shrink-0 ">
                    <div v-for="(product, index) in products" :key="index" class="product_box w-[260px] border border-border-input 
                   shadow-[0px_4px_6px_-4px_#00000040,0px_10px_15px_-3px_#00000040]
                    pt-[29px] pl-[34px] rounded-[22px] 
                   transition-all duration-300 hover:scale-[1.02]">
                        <small class="text-center sm:text-left text-[12px] leading-[16px] mb-[7px] uppercase text-secondary block">
                            {{ product.tag }}
                        </small>
                        <h4 class="font-lato text-center sm:text-left text-[24px] leading-[30px] text-primary mb-[30px] lg:mb-[48px] font-semibold">
                            {{ product.name }}
                        </h4>
                        <figure>
                            <img :src="product.img" :alt="product.name + ' image'" class="rounded-br-[22px] w-full"
                                loading="lazy" />
                        </figure>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import developmentImg from "@assets/LandingPageImages/achiveMore/development.webp";
import designImg from "@assets/LandingPageImages/achiveMore/design.webp";
import salesImg from "@assets/LandingPageImages/achiveMore/sales.webp";
import marketplaceImg from "@assets/LandingPageImages/achiveMore/marketplace.webp";
import legalImg from "@assets/LandingPageImages/achiveMore/legal.webp";

interface Product {
    tag: string;
    name: string;
    img: string;
}

const products: Product[] = [
    { tag: "build & deploy", name: "Development", img: developmentImg },
    { tag: "build creative workflows", name: "Design", img: designImg },
    { tag: "close & convert deals", name: "Sales", img: salesImg },
    { tag: "plan & launch campaigns", name: "Marketplace", img: marketplaceImg },
    { tag: "protect & comply", name: "Legal", img: legalImg },
];
</script>

<style scoped>
@keyframes marquee {
    0% {
        transform: translateX(0);
    }

    100% {
        transform: translateX(-50%);
    }
}

.animate-marquee {
    display: flex;
    width: max-content;
    animation: marquee 120s linear infinite;
}

.animate-marquee:hover {
    animation-play-state: paused;
    cursor: pointer;
}
</style>
