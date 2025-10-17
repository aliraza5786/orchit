<template>
    <section class="discover_more_sec relative z-1 float-left w-full mb-[40px] lg:mb-[60px] px-[15px]">
        <div class="custom_container">
            <div class="discover_more_main grid sm:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1.1fr] gap-[30px] lg:gap-[40px] bg-[#A33B92] rounded-[24px]">
                <div class="text_box p-[32px] text-center sm:text-left sm:py-[64px] sm:pl-[50px] lg:pl-[64px]">
                     <h3 class="font-manrope text-white font-bold text-[24px] md:text-[28px] lg:text-[48px] leading-[30px] md:leading-[34px] lg:leading-[110%] lg:tracking-[-1px] mb-[16px] lg:mb-[24px]">Discover More in the 
                    Space Marketplace</h3>
                    <p class="font-manrope font-normal text-white text-[16px] md:text-[18px] md:leading-[24px]  lg:leading-[28px] mb-[24px] lg:mb-[48px]">Discover More in the Space Marketplace</p>
                   <RouterLink class="rounded-full inline-block mx-auto sm:mx-0 text-black bg-white  px-[32px] py-[12px] text-[16px] leading-[160%] font-semibold " to="#">View Marketplace</RouterLink> 
                </div>
                <figure class="figure_box hidden sm:block m-0 self-end">
                      <img :src="discoverMore" class="rounded-br-[24px]" width="100%" alt="discover more image" loading="lazy">
                </figure>
               
            </div>
        </div>
    </section>

</template>

<script lang="ts" setup>
import discoverMore from '@assets/LandingPageImages/discoverMoreSec/discoverMore.webp';
</script>
