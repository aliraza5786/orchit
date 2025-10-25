<template>
    <header class="w-full bg-body text-primary border-b"
        :class="theme === 'dark' ? 'border-gray-800' : 'border-gray-300'">
        <div class="mx-auto px-10">
            <nav class="flex items-center justify-between "
            :class="theme === 'dark'? 'py-[12px]':'py-[11px]' "
            >
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
                            'active_style transition-all relative duration-300 text-primary font-lato text-[16px] hover:opacity-70 hover:translate-y-[-2px]',
                            isActive(item.link)
                                ? 'font-bold is_active text-accent'
                                : 'font-normal',
                        ]">
                            {{ item.label }}
                        </RouterLink>
                    </li>
                </ul>

                <!-- Get Started Button -->
                <div class="flex gap-3">
                    <div class="lg:flex hidden items-center gap-[12px] md:gap-[16px]">
                        <!-- Login Link -->
                        <RouterLink to="/login"
                            class="  text-primary font-lato text-[14px] lg:text-[16px] font-medium transition-all duration-300 hover:opacity-70 px-[8px] py-[8px]">
                            Login
                        </RouterLink>

                        <!-- Get Started Button -->
                        <button @click="handleGetStarted"
                            class="flex text-primary items-center gap-[4px] border rounded-full px-[15px] py-[8px] font-lato text-[14px] transition-all duration-300 leading-[100%] hover:bg-accent hover:text-accent-text hover:border-accent hover:scale-105 hover:cursor-pointer">
                            Get Started
                            <div class="flex items-center gap-[4px]">
                                <img :src="googleLogo" alt="Google" class="w-[18px] md:w-[24px]" />
                                <img :src="theme === 'dark'
                                    ? darkApple
                                    : lightApple
                                    " alt="Apple icon" class="w-[20px] md:w-[24px]" />
                            </div>
                        </button>
                    </div>
                    <!-- Mobile Hamburger -->
                    <button class="lg:hidden focus:outline-none font-bold text-text-primary text-[20px]"
                        @click="toggleMobileMenu">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                </div>


            </nav>
            <!-- Mobile Menu -->
            <div v-show="true"
                class="mobile_nav fixed bg-bg-body inset-0 z-50 lg:hidden transform transition-transform  duration-400 ease-in-out"
                :class="mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'">
                <button @click="toggleMobileMenu"
                    class="mb-4 font-extrabold text-white text-xl text-left bg-[#C74CF0] w-13 h-13 flex justify-center items-center ">
                    <i class="fa-solid fa-xmark"></i>
                </button>
                <ul class="flex list-none flex-col space-y-6 p-4">
                    <li v-for="(item, i) in navItems" :key="i">
                        <RouterLink :to="item.link" @click="closeMenu"
                            class="text-text-primary font-manrope hover:text-primary font-semibold leading-[30px] text-[20px]">
                            {{ item.label }}
                        </RouterLink>
                    </li>
                    <li>



                        <div class="flex items-center gap-[12px] md:gap-[16px]">
                            <!-- Login Link -->
                            <RouterLink to="/login"
                                class="text-primary font-lato text-[14px] lg:text-[16px] font-medium transition-all duration-300 hover:opacity-70 px-[8px] py-[8px]">
                                Login
                            </RouterLink>

                            <!-- Get Started Button -->
                            <button @click="handleGetStarted"
                                class="flex text-primary items-center gap-[4px] border rounded-full px-[15px] py-[8px] font-lato text-[14px] transition-all duration-300 leading-[100%] hover:bg-accent hover:text-accent-text hover:border-accent hover:scale-105 hover:cursor-pointer">
                                Get Started
                                <div class="flex items-center gap-[4px]">
                                    <img :src="googleLogo" alt="Google" class="w-[18px] md:w-[24px]" />
                                    <img :src="theme === 'dark'
                                        ? darkApple
                                        : lightApple
                                        " alt="Apple icon" class="w-[20px] md:w-[24px]" />
                                </div>
                            </button>
                        </div>
                    </li>
                </ul>

            </div>
        </div>
    </header>
</template>

<script lang="ts" setup>
import { useRoute, RouterLink, useRouter } from "vue-router";
import { ref } from "vue";
import { useTheme } from "../../../composables/useTheme";
import lightLogo from '@assets/global/light-logo.png';
import darkLogo from '@assets/global/dark-logo.png';
import googleLogo from '@assets/LandingPageImages/header-icons/google.png';
import lightApple from '@assets/LandingPageImages/header-icons/lightapple.png';
import darkApple from '@assets/LandingPageImages/header-icons/apple.png';

const { theme } = useTheme();
const route = useRoute();
const router = useRouter();
const navItems = [
    { label: "Home", link: "/home" },
    { label: "Pricing", link: "/pricing" },
    { label: "Contact Sales", link: "/contact-us" },
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
}

const handleGetStarted = () => {
    router.push('/register');
};
</script>

<style scoped>
.active_style {
    position: relative;
}

.active_style::after {
    position: absolute;
    width: 0%;
    height: 1px;
    background-color: #9356c5;
    bottom: -30px;
    left: 0;
    content: '';
    transition: width 0.4s ease;
}

.active_style.is_active::after {
    width: 100%;
}
</style>
