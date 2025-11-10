<script lang="ts" setup>
import { RouterLink } from "vue-router";
import { useTheme } from "../../../composables/useTheme";
import lightLogo from '@assets/LandingPageImages/footer/lightLogo.webp';
import darkLogo from '@assets/global/dark-logo.png';
import borderGif from '@assets/LandingPageImages/footer/footer-top.gif';




const { theme } = useTheme(); // light / dark / system

// web menu 
interface FooterSection {
    title: string;
    links: { name: string; url: string }[];
}

const sections: FooterSection[] = [
    {
        title: "Resource",
        links: [
            { name: "Knowledge Center", url: "/knowledge-center" },
            { name: "Blog", url: "/blogs" },],
    },
    {
        title: "Company",
        links: [
            { name: "Privacy Policy", url: "/privacy-policy" },
            { name: "Terms of Services", url: "/terms-of-services" },

        ],
    },

];

// mobile menu
interface MobFooterMenu {
    name: string;
    url: string;
}
const moblinks: MobFooterMenu[] = [
    {
        name: 'Home',
        url: '/home'
    },
    { name: "Knowledge Center", url: "/knowledge-center" },
    { name: "Blog", url: "/blogs" },
    {
        name: 'Pricing',
        url: '/pricing'
    },
     { name: "Privacy Policy", url: "/privacy-policy" },
     { name: "Terms of Services", url: "/terms-of-services" },
]

</script>

<template>
    <img :src="borderGif" alt="border top gif" class="w-full block h-[13px] bg-cover object-cover" loading="lazy">
    <footer class="relative float-left w-full block pt-[40px] px-[15px] bg-primary ">
        <div class="custom_container">
            <div class="footer_main pb-[42px] lg:border-b-1 "
                :class="theme === 'dark' ? 'border-gray-800' : 'border-gray-300'">
                <div class="grid grid-cols-1 gap-[15px] sm:gap-[40px] xl:gap-[55px]
                 sm:grid-cols-[1fr_1fr] md:grid-cols-[1.2fr_1fr_1fr]
                 lg:grid-cols-[1.2fr_1fr_1fr_1fr]">
                    <div class="footer_logo_box">
                        <figure>
                            <img class="object-contain mx-auto sm:mx-0 block mb-[16px] sm:mb-[8px] max-w-[111.41px] sm:max-w-[117px] w-full"
                                :src="theme === 'dark' ? darkLogo : lightLogo" loading="lazy" alt="footer logo" />
                        </figure>
                        <p
                            class="text-center sm:text-left max-w-[375px] sm:max-w-[246px] mb-[15px] lg:mb-[36px] font-normal mx-auto sm:mx-0  font-inter text-primary text-[14px] sm:text-[15px] leading-[22px] sm:leading-[24px] tracking-normal">
                            Orchit AI is an AI-powered workspace that unifies project.
                        </p>


                    </div>
                    <!-- footer web menu -->
                    <div class="hidden sm:block" v-for="(section) in sections" :key="section.title">
                        <div class="heading_box mb-[16px]">
                            <h3
                                class="font-inter text-primary font-semibold text-[18px] md:text-[22.88px] leading-[32px] tracking-normal">
                                {{ section.title }}
                            </h3>
                        </div>

                        <ul class=" transition-all duration-300 sm:block">
                            <li class="mb-[18px] last:mb-0" v-for="link in section.links" :key="link.name">
                                <RouterLink :to="link.url"
                                    class="font-inter font-normal text-primary text-[15px] leading-[24px] tracking-normal hover:underline transition-colors">
                                    {{ link.name }}
                                </RouterLink>
                            </li>
                        </ul>
                    </div>
                    <div class="">
                        <div class="heading_box mb-[16px] hidden sm:block">
                            <h3
                                class="font-inter text-primary font-semibold text-[18px] md:text-[22.88px] leading-[32px] tracking-normal">
                                Social
                            </h3>
                        </div>
                        <div class="fotter_social_links flex gap-3 items-center justify-center  sm:justify-start">
                            <a href="https://www.linkedin.com/in/orchit-ai-990b40396/" target="_blank" class="text-primary text-[22px]">
                                <i class="fa-brands fa-linkedin"></i>
                            </a>
                            <a href="https://x.com/Orchitai1" target="_blank" class="text-primary text-[22px]">
                                <i class="fa-brands fa-square-x-twitter"></i>
                            </a>
                            <a href="https://discord.com/channels/@me" target="_blank" class="text-primary text-[22px]">
                                <i class="fa-brands fa-discord"></i>
                            </a>
                            <a href="https://www.youtube.com/@orchit.ai1" target="_blank" class="text-primary text-[22px]">
                                <i class="fa-brands fa-youtube"></i>
                            </a>
                            <a href="https://www.instagram.com/orchit.ai/" target="_blank" class="text-primary text-[22px]">
                                <i class="fa-brands fa-instagram"></i>
                            </a>
                            <a href="https://www.reddit.com/user/Brief_Challenge_5466/" target="_blank" class="text-primary text-[22px]">
                                <i class="fa-brands fa-reddit"></i>
                            </a>
                        </div>
                    </div>



                </div>
            </div>
        </div>
    </footer>
    <!-- footer mobile menu -->
    <div class="mobile_menu float-left w-full flex justify-center px-[15px] py-[42px] sm:hidden border-y-1"
        :class="theme === 'dark' ? 'border-gray-800' : 'border-gray-300'">
        <div class=" flex justify-center items-center gap-[16px] flex-wrap max-w-[350px] ">
            <RouterLink
                class="font-inter font-medium text-primary text-[14px] leading-[21px] tracking-normal hover:underline"
                v-for="(menu, index) in moblinks" :key="index" :to="menu.url">
                {{ menu.name }}
            </RouterLink>
        </div>
    </div>

    <!-- copy write -->
    <section
        class="copy_write px-[15px] bg-primary float-left w-full  border-t-1 lg:border-t-0  pt-[18px] md:pt-[24px] pb-[18px] md:pb-[24px]  lg:pb-[40px] xl:pb-[72px]"
        :class="theme === 'dark' ? 'border-gray-800' : 'border-gray-300'">
        <div class="custom_container">
            <div class="copy_write_main">
                <p
                    class="font-inter text-center text-primary font-normal text-[12px] sm:text-[14px] leading-[24px] tracking-normal">
                    {{
                        theme === 'dark'
                            ? `Copyright © ${new Date().getFullYear()} Space Technologies`
                            : `${new Date().getFullYear()} © Orchit AI. All Rights Reserved`
                    }}
                </p>
            </div>
        </div>
    </section>
</template>

<style scoped></style>
