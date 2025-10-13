<template>
    <div class="flex bg-bg-body justify-center items-center z-20  fixed top-0 bottom-0 min-h-[100dvh] w-[100vw]">

        <!-- <video autoplay muted loop playsinline class="absolute inset-0 z-0 w-full h-full object-cover ">
      <source src="../../assets/videos/Glowing-particles-overlay.mp4" type="video/mp4" />
      Your browser does not support the video tag.
    </video> -->
        <div class="text-center text-text-secondary space-y-6 z-10">
            <!-- Logo (you can replace it with your logo URL) -->
            <img src="../../assets/icons/streamed-logo-icon.svg" alt="Logo" class="w-15 h-15 mx-auto" />

            <!-- Main loader text -->
            <p class="text-base text-text-secondary font-medium">Assembling Your Project Powerhouse...</p>

            <!-- Scrolling steps -->
            <div class="overflow-hidden max-h-24 relative">
                <div class=" absolute h-40 w-100 bottom-0 z-1"
                    style="background: linear-gradient(180deg, var(--bg-body) 0%, var(--bg-body) 100%);"></div>
                <div class="animate-scroll space-y-5 ">
                    <p class="text-sm  animate-fadeInUp">Creating your peak view dashboard</p>
                    <p class="text-sm  animate-fadeInUp">Building your dream team</p>
                    <p class="text-sm  animate-fadeInUp">Streamlining your workflow</p>
                    <p class="text-sm  animate-fadeInUp">Highlighting what matters most</p>
                    <p class="text-sm  animate-fadeInUp">Crafting your product roadmap</p>
                    <p class="text-sm  animate-fadeInUp">Getting everything ready to launch</p>
                    <p class="text-sm  animate-fadeInUp">Laying out your action plan</p>
                    <p class="text-sm  animate-fadeInUp">Launching your project into motion</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
@keyframes scrollText {
    0% {
        transform: translateY(100%);
    }

    100% {
        transform: translateY(-100%);
    }
}

@keyframes fadeInUp {
    0% {
        /* opacity: 0; */
        transform: translateY(30px);
    }

    50% {
        /* opacity: 1; */
        transform: translateY(0);
    }

    100% {
        /* opacity: 0; */
        transform: translateY(-30px);
    }
}

/* Apply animation classes using Tailwind */
.animate-scroll {
    animation: scrollText 9s linear infinite;
}

.animate-fadeInUp {
    animation: fadeInUp 9s linear infinite;
}
</style>