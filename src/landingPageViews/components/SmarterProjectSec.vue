<template>
  <div
    class="smarter_project_section relative overflow-hidden  float-left w-full mb-10 md:mb-16 lg:mb-20 pt-10 md:pt-16 lg:pt-20">
    <div class="heading_sec px-[15px] relative flex flex-col items-center pb-[80px]">
      <small
        class="text-sky inline-block leading-[24px] md:leading-[32px] text-[16px] md:text-[20px] lg:text-[24px] font-manrope font-bold lg:tracking-[-1px] mb-[10px] md:mb-[15px] xl:mb-[20px]">Work
        Without Limits</small>
      <h3 class="relative z-3 font-manrope text-center text-primary font-bold text-[24px] md:text-[36px] lg:text-[48px] 
               leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px] mb-4 md:mb-6">
        Smarter Projects Start Here</h3>
      <p class="relative z-3  font-manrope text-[#797E86] text-[16px] md:text-[18px] lg:text-[20px] 
                 leading-[24px] lg:leading-[28px] font-normal max-w-[550px] mx-auto text-center">
        Run projects seamlessly across tools, teams, and devices—all in real time.</p>
        <!-- glowing arrow -->
      <div
        class="z-1 arrow_handler items-center relative absolute w-100 flex  ml-[-400px] lg:ml-[-600px] bottom-[-40px] lg:bottom-[-60px] justify-center">
        <img class="relative z-3 max-w-[400] lg:max-w-[600px] glowing-arrow" loading="lazy" :src="arrow" alt="arrow">
        <div class="pivot-glow"></div>
      </div>

    </div>
    <div class="goble_sec relative bg-cover bg-no-repeat bg-top  px-[15px]"
      :style="{ backgroundImage: `url(${globe})` }">
      <div class="content_box w-full">
        <div class="product_image relative z-1 -translate-y-[80px]">
          <img :src="product" alt="product image" class="max-w-[1033px] block mx-auto w-full" loading="lazy">
        </div>
        <section ref="statsSection"
          class="relative z-3 flex flex-wrap justify-between gap-[25px] sm:gap-[40px] lg:gap-[60px] xl:gap-[82px] transition-opacity duration-700 opacity-0 translate-y-[-60px]  md:translate-y-[-100px] max-w-[280px] sm:max-w-[550px] md:max-w-[750px] lg:max-w-[850px] mx-auto"
          :class="{ 'opacity-100': visible }">
          <div v-for="(item, index) in stats" :key="index" class="counter_sec text-center">
            <h2 class="font-manrope text-white font-bold text-[30px] md:text-[36px] lg:text-[48px] 
               leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px]">
              <span class="counted_number">{{ formatNumber(item.current) }}</span><span v-if="item.suffix">{{
                item.suffix }}</span>
            </h2>
            <p class="font-manrope text-[#797E86] text-[16px] md:text-[18px] lg:text-[20px] 
                 leading-[24px] lg:leading-[28px] font-normal mt-[5px] md:mt-[16px]">{{ item.label }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import globe from '@assets/LandingPageImages/smarterProjSec/worldMap.png';
import product from '@assets/LandingPageImages/smarterProjSec/product.webp';
import arrow from '@assets/LandingPageImages/smarterProjSec/arrow.webp';


import { ref, onMounted, onBeforeUnmount } from 'vue'

interface Stat {
  label: string
  value: number
  current: number
  suffix?: string
}

const stats = ref<Stat[]>([
  { label: 'Projects', value: 100, current: 1, suffix: '+' },
  { label: 'Users', value: 1000, current: 1, suffix: '+' },
  { label: 'Integrations', value: 100, current: 1, suffix: '+' },
  { label: 'Bandwidth', value: 999, current: 1, suffix: ' Unlimited' },
])

const statsSection = ref<HTMLElement | null>(null)
const visible = ref(false)
let observer: IntersectionObserver | null = null

function animateValue(item: Stat, duration = 5000) {
  const start = 1
  const end = item.value
  const startTime = performance.now()

  const update = (currentTime: number) => {
    const progress = Math.min((currentTime - startTime) / duration, 1)
    item.current = Math.floor(progress * (end - start) + start)
    if (progress < 1) requestAnimationFrame(update)
  }

  requestAnimationFrame(update)
}

function startAnimation() {
  stats.value.forEach((item) => {
    item.current = 1
    animateValue(item, 1000)
  })
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (entry.isIntersecting) {
        visible.value = true
        startAnimation()
        observer?.disconnect()
      }
    },
    { threshold: 0.3 }
  )

  if (statsSection.value) observer.observe(statsSection.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

function formatNumber(num: number): string {
  return num.toLocaleString()
}


</script>

<style scoped>
.smarter_project_section::after {
  content: '';
  width: 100%;
  height: 60%;
  position: absolute;
  z-index: 2;
  bottom: 0;
  left: 0;
  background: linear-gradient(180deg, rgba(15, 15, 15, 0) 10.03%, #1C0E26 65.02%);
}

.counter_sec:last-child h2 span.counted_number {
  display: none;
}

.smarter_project_section::before {
  content: "";
  position: absolute;
  top: 0px;
  left: 50%;
  width: 900px;
  height: 900px;
  margin-left: -450px;
  background: radial-gradient(circle,
      rgba(130, 144, 255, 0.9) 0%,
      rgba(255, 255, 255, 0) 70%);
  filter: blur(120px);
  z-index: 0;
}

@keyframes rotate360 {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

/*  Enhanced glowing pulse */
@keyframes pulseGlow {

  0%,
  100% {
    filter:
      drop-shadow(0 0 25px rgba(130, 144, 255, 0.8)) drop-shadow(0 0 60px rgba(130, 144, 255, 0.7)) drop-shadow(0 0 120px rgba(130, 144, 255, 0.6)) brightness(1.3);
  }

  50% {
    filter:
      drop-shadow(0 0 50px rgba(130, 144, 255, 1)) drop-shadow(0 0 100px rgba(130, 144, 255, 1)) drop-shadow(0 0 200px rgba(130, 144, 255, 0.9)) brightness(2);
  }
}

/*  Glowing + rotating arrow */
.glowing-arrow {
  animation:
    rotate360 18s linear infinite,
    pulseGlow 2.5s ease-in-out infinite;
  transform-origin: right top;
  transition: filter 0.3s ease;
  z-index: 3;
}

.pivot-glow {
  position: absolute;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle,
      rgba(130, 144, 255, 0.1) 0%,
      rgba(255, 255, 255, 0) 80%);
  filter: blur(170px);
  border-radius: 50%;
  top: 1px;
  right: -98px;
  transform: translate(50%, -50%);
  z-index: 1;
  animation: pulseGlow 3s ease-in-out infinite;
}


@media(max-width:1200px) {
  .smarter_project_section::before {
    width: 700px;
    height: 700px;
    margin-left: -350px;
  }
}

@media(max-width:991px) {
  .pivot-glow {
    right: -0px;
  }
}

@media(max-width:767px) {
  .smarter_project_section::before {
    width: 500px;
    height: 500px;
    margin-left: -250px;
  }
}

@media(max-width:540px) {
  .smarter_project_section::before {
    width: 300px;
    height: 300px;
    margin-left: -150px;
  }
}
</style>