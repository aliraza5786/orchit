<script setup lang="ts">
import { ref, computed } from "vue";
import HeroBannerInput from "./HeroBannerInput.vue";
import { useTheme } from "../../composables/useTheme";
import mouse from "@assets/LandingPageImages/bnanerInputIcons/mouse.png"
import { usePromptSuggestions } from "../../queries/usePropmpSuggestions";
const { theme } = useTheme();

const examples = [
    "🍽️ I want to open a food truck business.",
    "💇 I want to start a luxury salon.",
    "🍹 I want to open a cocktail bar.",
    "📚 I want to write and publish a book.",
    "✈️ I want to start a travel agency.",
    "🚴 I want to open a fitness cycling studio.",
    "👗 I want to launch a fashion boutique.",
    "🚗 I want to open a car rental service.",
    "📸 I want to become a professional photographer."
];

// Call the query and auto-refetch on mount
const {
  data: promptSuggestions, 
  isError,
  error,
  refetch,
} = usePromptSuggestions({
  refetchOnMount: true, // automatically fetch when rendered
});

//  Computed list — use API data if available, else fallback to examples
const suggestionList = computed(() => {
  if (promptSuggestions?.value?.length) {
    return promptSuggestions.value.map((item: any) => item.prompt);
  }
  return examples;
});

const projectInputRef = ref<{ setValue: (val: string) => void } | null>(null);
const isLoading = ref(false);
const responseMessage = ref<string | null>(null);

function handleExampleClick(example: string) {
    projectInputRef.value?.setValue(example);
}

async function handleSubmit(value: string) {
    if (!value.trim()) return;
    isLoading.value = true;
    responseMessage.value = null;
    try {
        // Example: Replace this URL with your real endpoint
        const res = await fetch("https://api.example.com/generate-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: value }),
        });

        if (!res.ok) throw new Error("Failed to fetch plan");
        const data = await res.json();
        responseMessage.value = data.message || "Plan generated successfully!";
    } catch (err) {
        console.error(err);
        responseMessage.value = "Something went wrong. Please try again.";
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <section
        class="float-left pt-[40px] lg:pt-[80px] xl:pt-[125px]  mb-10 md:mb-16 lg:mb-20 w-full transition-colors duration-500">
        <div class="banner_main  px-[15px]">
            <div class="custom_container">
                <!-- Heading -->
                <h2 :class="theme === 'dark' ? 'heading-ingradient' : ''"
                    class="text-[30px] sm:text-[40px] lg:text-[72px] leading-[100%] font-manrope font-bold text-primary mb-[10px] text-center">
                    Welcome to Streamed Space
                </h2>

                <p class="font-manrope text-[16px] md:text-[18px] lg:text-[24px] mb-[24px] text-center"
                    :class="theme === 'dark' ? 'text-[#94A3B8]' : 'text-text-primary'">
                    Describe your project, and we’ll build the plan instantly with AI magic.
                </p>

                <!-- Input Section -->
                <div class="relative">
                    <HeroBannerInput ref="projectInputRef" :theme="theme" @submit="handleSubmit" :loading="isLoading" />
                    <!-- API Response -->
                    <p v-if="responseMessage"
                        class="text-center w-full bottom-[10px] absolute text-[13px] font-medium  text-red-600">
                        {{ responseMessage }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Example Buttons -->
        <div class="relative overflow-hidden  mb-[40px] lg:mb-[72px]">
            <p
                class="text-center text-[14px] font-medium text-primary leading-[20px] font-manrope mb-[25px] lg:mb-[31px]">
                Or try
                these
                examples:</p>
            <div class="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                <div class="examples-container flex gap-[15px] lg:gap-[24px] px-4 mb-[15px] lg:mb-[24px]
                    snap-x snap-mandatory animate-marquee
                   hover:[animation-play-state:paused] active:[animation-play-state:paused] touch-pan-x">
                    <div v-for="n in 2" :key="n" class="flex gap-[15px] lg:gap-[24px] flex-shrink-0">
                        <button v-for="example in suggestionList" :key="example + n" @click="handleExampleClick(example)"
                            class="flex-shrink-0 px-[10px] sm:px-[15px] lg:px-[19px] py-[10px] sm:py-[14px] lg:py-[17px] cursor-pointer  text-primary 
                    text-[12px] md:text-[14px] font-manrope rounded-full border-1  hover:border-purple-500
                    transition-all duration-300 whitespace-nowrap "
                            :class="theme === 'dark' ? 'bg-transparent border-gray-800' : 'border-gray-300 bg-gray-100'">
                            {{ example }}
                        </button>
                    </div>
                </div>
            </div>
            <div class="overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                <div
                    class="examples-container pb-1 flex gap-[15px] lg:gap-[24px] px-4 animate-marquee2 snap-x snap-mandatory hover:[animation-play-state:paused] active:[animation-play-state:paused] touch-pan-x">
                    <div v-for="n in 2" :key="n" class="flex gap-[15px] lg:gap-[24px] flex-shrink-0">
                        <button v-for="example in suggestionList" :key="example + n" @click="handleExampleClick(example)"
                            class="flex-shrink-0 px-[10px] sm:px-[15px] lg:px-[19px] py-[10px] sm:py-[14px] lg:py-[17px] cursor-pointer  text-primary 
                    text-[12px] md:text-[14px] font-manrope rounded-full border-1  hover:border-purple-500
                    transition-all duration-300 whitespace-nowrap "
                            :class="theme === 'dark' ? 'bg-transparent border-gray-800' : 'border-gray-300 bg-gray-100'">
                            {{ example }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- mouse text + imge -->
        <div class="mouse_box flex justify-center flex-col items-center ">
            <img :src="mouse" alt="mouse icon" class="w-[24px] mb-[12px] lg:mb-[16px] ">
            <p class="font-manrope text-[14px] text-center"
                :class="theme === 'dark' ? 'text-[#94A3B8]' : 'text-text-primary'">Work Without Limits</p>
        </div>

    </section>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

.heading-ingradient {
    background: linear-gradient(180deg, #f8fafc 0%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

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
    animation: marquee 400s linear infinite;
    will-change: transform;
}

@keyframes marquee2 {
    0% {
        transform: translateX(-50%);
    }

    100% {
        transform: translateX(0);
    }
}

.animate-marquee2 {
    display: flex;
    width: max-content;
    animation: marquee2 400s linear infinite;
    will-change: transform;

}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Pause on hover or touch */
.examples-container:hover,
.examples-container:active {
    animation-play-state: paused;
}
</style>
