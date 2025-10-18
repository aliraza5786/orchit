<template>
    <header
        class="w-full bg-body text-primary border-b lg:border-b-0" :class="theme === 'dark'? 'border-gray-800':'border-gray-300'">
        <div class="custom_container px-[15px]">
            <nav
                class="flex items-center justify-between py-[20px] md:py-[24px]  border-gray-800 " :class="theme === 'dark'? 'lg:border-b':'border-b-0'">
                <!-- Logo Section -->
                <RouterLink to="/" class="transition-opacity duration-300 hover:opacity-80">
                    <img :src="theme === 'dark'
                            ? darkLogo
                            : lightLogo
                        " alt="Logo" class="max-w-[110px] sm:max-w-[144px] object-contain" />
                </RouterLink>

                <!-- Nav Links -->
                <ul class="hidden lg:flex items-center gap-[24px]">
                    <li v-for="(item, index) in navItems" :key="index">
                        <RouterLink :to="item.link" :class="[
                            'transition-all duration-300 text-primary font-lato text-[16px] hover:opacity-70 hover:translate-y-[-2px]',
                            isActive(item.link)
                                ? 'font-bold'
                                : 'font-normal',
                        ]">
                            {{ item.label }}
                        </RouterLink>
                    </li>
                </ul>

                <!-- Auth Buttons -->
                <div class="flex items-center gap-[12px] md:gap-[16px]">
                    <!-- Login Link -->
                    <RouterLink
                        to="/login"
                        class="text-primary font-lato text-[14px] lg:text-[16px] font-medium transition-all duration-300 hover:opacity-70 px-[8px] py-[8px]">
                        Login
                    </RouterLink>

                    <!-- Get Started Button -->
                    <button
                        @click="handleGetStarted"
                        class="flex text-primary items-center gap-[4px] border-2 border rounded-full px-[15px] md:px-[20px] lg:px-[32px] py-[10px] md:py-[13px] lg:py-[18px] font-lato text-[14px] lg:text-[16px] transition-all duration-300 leading-[100%] hover:bg-accent hover:text-accent-text hover:border-accent hover:scale-105">
                        Get Started
                        <div class="flex items-center gap-[4px]">
                            <img :src="googleLogo" alt="Google"
                                class="w-[18px] md:w-[24px]" />
                            <img :src="theme === 'dark'
                                    ? darkApple
                                    : lightApple
                                " alt="Apple icon" class="w-[20px] md:w-[24px]"
                     />
                        </div>
                    </button>
                </div>
            </nav>
        </div>
    </header>
</template>

<script lang="ts" setup>
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useTheme } from "../../../composables/useTheme";
import lightLogo from '@assets/LandingPageImages/logo/header-logo.png';
import darkLogo from '@assets/LandingPageImages/logo/dark_logo.png';
import googleLogo from '@assets/LandingPageImages/header-icons/google.png';
import lightApple from '@assets/LandingPageImages/header-icons/lightapple.png';
import darkApple from '@assets/LandingPageImages/header-icons/apple.png';

const { theme } = useTheme();
const route = useRoute();
const router = useRouter();

const navItems = [
    { label: "Home", link: "/home" },
    { label: "Pricing", link: "/pricing" },
    { label: "Contact Sales", link: "/contact-sales" },
];

const isActive = (link: string) => route.path === link;

const handleGetStarted = () => {
    router.push('/register');
};
</script>
