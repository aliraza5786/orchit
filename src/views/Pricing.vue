<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from "../composables/useTheme";
const { theme, setTheme } = useTheme(); // light / dark / system

const isYearly = ref(false)

interface Feature {
    text: string
    available: boolean
}
interface Plan {
    name: string
    description: string
    priceMonthly: number
    priceYearly: number
    button: string
    highlighted: boolean
    features: Feature[]
}

const pricingPlans: Plan[] = [
    {
        name: 'Free',
        description: 'Perfect for getting started',
        priceMonthly: 0,
        priceYearly: 0,
        button: 'Try for Free',
        highlighted: false,
        features: [
            { text: 'Collaborate with up to 10 teammates', available: false },
            { text: 'Unlimited tasks', available: true },
            { text: 'Unlimited projects', available: true },
            { text: 'Unlimited messages', available: true },
            { text: 'Unlimited activity log', available: true },
            { text: 'Unlimited file storage (100MB per file)', available: true },
            { text: 'Unlimited assignee and due dates', available: true },
            { text: 'Board view projects', available: true },
            { text: 'Basic search filters', available: true },
            { text: 'List view projects', available: true },
            { text: 'Calendar view', available: true },
            { text: 'Status updates', available: true },
            { text: 'iOS and Android mobile apps', available: true },
            { text: 'Time tracking with integrations', available: false },
            { text: '100+ free integrations', available: false }
        ]
    },
    {
        name: 'Team',
        description: 'Best for small teams',
        priceMonthly: 14.99,
        priceYearly: 149.99,
        button: 'Continue with Team',
        highlighted: true,
        features: [
            { text: 'Collaborate with up to 10 teammates', available: true },
            { text: 'Unlimited tasks', available: true },
            { text: 'Unlimited projects', available: true },
            { text: 'Unlimited messages', available: true },
            { text: 'Unlimited activity log', available: true },
            { text: 'Unlimited file storage (100MB per file)', available: true },
            { text: 'Unlimited assignee and due dates', available: true },
            { text: 'Board view projects', available: true },
            { text: 'Basic search filters', available: true },
            { text: 'List view projects', available: true },
            { text: 'Calendar view', available: true },
            { text: 'Status updates', available: true },
            { text: 'iOS and Android mobile apps', available: true },
            { text: 'Time tracking with integrations', available: true },
            { text: '100+ free integrations', available: true }
        ]
    },
    {
        name: 'Enterprise',
        description: 'For growing organizations',
        priceMonthly: 24.99,
        priceYearly: 249.99,
        button: 'Contact Sales',
        highlighted: false,
        features: [
            { text: 'Collaborate with up to 10 teammates', available: true },
            { text: 'Unlimited tasks', available: true },
            { text: 'Unlimited projects', available: true },
            { text: 'Unlimited messages', available: true },
            { text: 'Unlimited activity log', available: true },
            { text: 'Unlimited file storage (100MB per file)', available: true },
            { text: 'Unlimited assignee and due dates', available: true },
            { text: 'Board view projects', available: true },
            { text: 'Basic search filters', available: true },
            { text: 'List view projects', available: true },
            { text: 'Calendar view', available: true },
            { text: 'Status updates', available: true },
            { text: 'iOS and Android mobile apps', available: true },
            { text: 'Time tracking with integrations', available: true },
            { text: '100+ free integrations', available: true }
        ]
    }
]
</script>

<template>
    <section class="float-left w-full py-[40px] md:py-[70px] xl:py-[105px] px-[15px]">
        <div class="custom_container">
            <!-- Heading -->
            <div class="mb-[32px] text-center">
                <small
                    class="text-sky text-center block leading-[24px] md:leading-[32px] text-[16px] md:text-[20px] lg:text-[24px] font-manrope font-bold lg:tracking-[-1px] mb-[10px] md:mb-[15px] xl:mb-[20px]">
                    Pricing
                </small>
                <h2
                    class="font-manrope text-center text-primary font-bold text-[24px] md:text-[36px] lg:text-[40px] leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px]">
                    Simple, Transparent Pricing For Every Team.
                </h2>
            </div>

            <!-- Toggle -->
            <div class="mb-[30px] lg:mb-[50px] flex justify-center">
                <div
                    class="toggle_btn flex items-center justify-center gap-[10px] lg:gap-[24px] w-[290px] lg:w-[349px] h-[55px] lg:h-[59px] rounded-[30px] border border-border-input">
                    <span class="font-manrope text-[16px] lg:text-[18px] font-medium" :class="{ 'text-text-secondary': isYearly }">Pay
                        Monthly</span>

                    <button @click="isYearly = !isYearly" :aria-pressed="String(isYearly)"
                        class="relative inline-flex h-7 w-12 items-center cursor-pointer rounded-full bg-gray-700 p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                        <span
                            class="h-5 w-5 rounded-full bg-white transform transition-transform duration-250 ease-in-out"
                            :class="{ 'translate-x-5': isYearly, 'translate-x-0': !isYearly }" />
                    </button>

                    <span class="font-manrope text-[16px] lg:text-[18px] font-medium" :class="{ 'text-text-secondary': !isYearly }">Pay
                        Yearly</span>
                </div>
            </div>
            <!-- Cards -->
            <div class="grid md:grid-cols-3  gap-[25px] md:gap-[15px] xl:gap-[44px]">
                <div v-for="plan in pricingPlans" :key="plan.name"
                    class="relative group rounded-2xl border p-[28px] flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]" :class="theme==='light'?'border-[#a495e9b5]':'border-border-input'">
                    <!-- Gradient border -->
                    <div class="absolute  inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-opacity duration-300"
                        :class="{
                            'opacity-100': plan.highlighted,
                            'opacity-0 group-hover:opacity-100 ': !plan.highlighted
                        }">
                        <div class="w-full h-full rounded-2xl bg-bg-body"></div>
                    </div>

                    <!-- Content -->
                    <div class="relative z-10">
                        <h3
                            class="text-[14px] font-manrope text-text-primary text-center leading-[21px] font-normal mb-[7px]">
                            {{ plan.name }}</h3>
                        <p
                            class="text-[14px] font-manrope text-text-secondary text-center leading-[21px] font-normal mb-[21px]">
                            {{ plan.description }}</p>
                        <!-- Price -->
                        <div class="mb-[21px]">
                            <div class="relative flex items-center justify-center">
                                <div
                                    class="price-container tracking-normal inline-block text-[22px] leading-[21px] font-bold">
                                    <transition name="price-fade" mode="out-in">
                                        <span :key="(isYearly ? 'y' : 'm') + plan.name" class="block"
                                            style="font-variant-numeric: tabular-nums;">
                                            <span v-if="plan.priceMonthly === 0 && !isYearly">$0</span>
                                            <span v-else-if="plan.priceMonthly === 0 && isYearly">$0</span>
                                            <span v-else>
                                                ${{ (isYearly ? plan.priceYearly : plan.priceMonthly).toFixed(2) }}
                                            </span>
                                        </span>
                                    </transition>
                                </div>
                                <span class="text-[14px] leading-[21px] text-text-secondary font-normal ml-2">/ {{ isYearly ? 'year' : 'month' }}</span>
                            </div>
                        </div>

                        <!-- Button -->
                        <button class="w-full py-[14px] rounded-[12px] font-manrope font-normal text-[14px] transition relative z-10 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1)]" :class="[
                            // Dark Theme
                            theme === 'dark'
                                ? (plan.highlighted
                                    ? 'bg-white text-black hover:bg-gray-200' 
                                    : 'bg-bg-charcoal text-white hover:bg-white hover:text-black'  
                                )
                                // Light Theme
                                : (plan.highlighted
                                    ? 'bg-gradinet  text-white hover:bg-gradinet  hover:text-white' 
                                    : 'bg-gradinet  text-white hover:bg-gradinet  hover:text-white' 
                                )
                           ]">
                            {{ plan.button }}
                        </button>
                    </div>

                    <!-- Features -->
                    <div class="mt-8 text-left relative z-10">
                        <p class="text-[14px] font-manrope text-text-primary text-left leading-[21px] font-normal pb-[8px] border-b border-border mb-[14px] ">Features included:</p>
                        <ul class="space-y-[14px]">
                            <li v-for="feature in plan.features" :key="feature.text"
                                class="flex items-start gap-2 text-sm">
                                <span v-if="feature.available"
                                    class="text-green-400 font-bold text-lg leading-none">✓</span>
                                <span v-else class="text-text-secondary font-bold text-lg leading-none">✕</span>
                                <span class="text-[14px] font-manrope  text-left leading-[21px] font-normal" :class="[feature.available ? 'text-text-primary' : 'text-text-secondary', theme==='dark'? 'text-black':'']">
                                    {{ feature.text }}
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>


        </div>
    </section>
</template>

<style scoped>
.price-fade-enter-active,
.price-fade-leave-active {
    transition: opacity 220ms ease, transform 220ms ease;
}

.price-fade-enter-from {
    opacity: 0;
    transform: translateY(6px);
}

.price-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

.price-container {
    font-variant-numeric: tabular-nums;
}
.bg-gradinet {
    background: linear-gradient(142.27deg, #4E3C9E 11.4%, #B5A1F7 84.44%);
}
</style>
