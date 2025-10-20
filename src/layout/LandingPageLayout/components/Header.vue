<template>
    <header class="w-full float-left bg-body text-primary px-[15px] border-b lg:border-b-0"
        :class="theme === 'dark' ? 'border-gray-800' : 'border-gray-300'">
        <div class="custom_container">
            <nav class="flex items-center justify-between py-[15px] md:py-[24px]  border-gray-800 "
                :class="theme === 'dark' ? 'lg:border-b' : 'border-b-0'">
                <!-- Logo Section -->
                <RouterLink to="/home">                    
                    <img :src="theme === 'dark'
                        ? darkLogo
                        : lightLogo
                        " alt="Logo" class="max-w-[110px] sm:max-w-[144px] object-contain" />
                </RouterLink>

                <!-- Nav Links -->
                <ul class="hidden lg:flex items-center gap-[24px]">
                    <li v-for="(item, index) in navItems" :key="index">
                        <RouterLink :to="item.link" :class="[
                            'transition-colors duration-200 text-primary font-lato text-[16px]',
                            isActive(item.link)
                                ? 'font-bold'
                                : 'font-normal',
                        ]">
                            {{ item.label }}
                        </RouterLink>
                    </li>
                </ul>

                <!-- Get Started Button -->
                <div class="flex gap-3">
                    <button
                        class="flex text-primary items-center gap-[4px] border-2 border rounded-full px-[15px] md:px-[20px] lg:px-[32px] py-[10px] md:py-[13px] lg:py-[18px] font-lato text-[14px] lg:text-[16px] transition leading-[100%]">
                        Get Started
                        <div class="flex items-center gap-[4px]">
                            <img :src="googleLogo" alt="Google" class="w-[18px] md:w-[24px]" />
                            <img :src="theme === 'dark'
                                ? darkApple
                                : lightApple
                                " alt="Apple icon" class="w-[20px] md:w-[24px]" />
                        </div>
                    </button>
                    <!-- Mobile Hamburger -->
                    <button class="lg:hidden focus:outline-none font-bold text-text-primary text-[20px]"
                        @click="toggleMobileMenu">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                </div>


            </nav>
            <!-- Mobile Menu -->
            <div v-show="true" class="mobile_nav fixed bg-bg-body inset-0 z-50 lg:hidden transform transition-transform  duration-400 ease-in-out"
                :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'">
                <button @click="toggleMobileMenu"
                    class="mb-4 font-extrabold text-white text-xl text-left bg-accent w-13 h-13 flex justify-center items-center ">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <ul class="flex list-none flex-col space-y-6 p-4">
                    <li v-for="(item, i) in navItems" :key="i">
                        <RouterLink :to="item.link" @click="closeMenu"
                            class="text-text-primary font-manrope hover:text-primary font-semibold leading-[30px] text-[20px]">
                            {{ item.label }}
                        </RouterLink>
                    </li>
                </ul>

            </div>
        </div>
    </header>
</template>

<script lang="ts" setup>
import { useRoute, RouterLink } from "vue-router";
import { ref } from "vue";
import { useTheme } from "../../../composables/useTheme";
import lightLogo from '@assets/LandingPageImages/logo/header-logo.png';
import darkLogo from '@assets/LandingPageImages/logo/dark_logo.png';
import googleLogo from '@assets/LandingPageImages/header-icons/google.png';
import lightApple from '@assets/LandingPageImages/header-icons/lightapple.png';
import darkApple from '@assets/LandingPageImages/header-icons/apple.png';

const { theme, setTheme } = useTheme(); // light / dark / system

const route = useRoute();

const navItems = [
    { label: "Home", link: "/home" },
    { label: "Solutions", link: "/abc" },
    { label: "Marketplace", link: "/market-place" },
    { label: "Pricing", link: "/pricing" },
    { label: "Contact Sales", link: "/contact-sales" },
];

const isActive = (link: string) => route.path === link;
//state for mobile sidebar visibility
const mobileMenuOpen = ref(false);

// Toggle function for opening/closing sidebar
const toggleMobileMenu = () => {
    mobileMenuOpen.value = !mobileMenuOpen.value;
};
//  Close menu when link is clicked
const closeMenu = () => {
    mobileMenuOpen.value = false;
};
</script>
