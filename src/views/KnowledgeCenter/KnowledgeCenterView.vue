<template> 
  <div class="flex min-h-screen ">
    <!-- Sidebar -->
    <aside :class="[
      'fixed md:static md:flex flex-col w-[100%] md:w-64 bg-bg-primary z-50 transition-transform duration-300',
      sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    ]">

      <!-- Scrollable Sidebar -->
      <div
        class="h-screen  flex flex-col justify-between bg-bg-body z-50 overflow-y-auto bg-bg-primary custom-scrollbar transition-all"
        :class="theme === 'dark' ? 'dark_scroll' : 'light_scroll'">

        <div>
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-4 border-b border-border-input md:border-0">
            <div
              class="text-[16px] font-manrope leading-[24px] font-semibold text-text-secondary flex items-center gap-2">
              <i class="fa-regular fa-house text-text-primary"></i>
              Docs
            </div>
            <button @click="sidebarOpen = false" class="md:hidden text-text-primary ">
              <i class="fa-solid fa-xmark font-bold"></i>
            </button>
          </div>

          <!-- Search -->
          <div class="p-4 hidden md:block"
            :class="theme === 'dark' ? 'border-y border-border-input' : 'border-y border-black'">
            <div class="relative">
              <i class="fa-light fa-magnifying-glass absolute top-[11px] left-[10px] text-text-secondary"></i>
              <input type="text" placeholder="Search..." @click="openSearch"
                class="w-full font-manrope text-sm pl-[35px] pr-3 py-2  rounded-lg bg-bg-lavender focus:outline-none focus:ring-1 focus:ring-bg-lavender"
                :class="theme === 'dark' ? 'border border-border-input' : 'border border-black'" />
            </div>
          </div>

          <!--  Show Skeleton While Loading -->
          <KnowledgeSidebarSkeleton v-if="isLoading" />

          <!--  Show Error if api is not working -->
          <div v-else-if="isError" class="text-center text-red py-8">
            ⚠️ Failed to load categories
          </div>

          <!-- Navigation -->
          <nav v-else class="px-2 py-4 space-y-2 w-64 md:w-[100%]">
            <div v-for="(section, sIndex) in sections" :key="sIndex" class="space-y-1 mb-[24px]">
              <h3 class="text-[16px] font-semibold uppercase font-manrope px-2 mb-1 flex justify-between items-center"
                :class="theme === 'dark' ? 'text-text-secondary' : 'text-black'">
                {{ section.title }}
                <i class="fa-solid fa-chevron-right text-[8px]"
                :class="theme === 'dark' ? 'text-text-secondary' : 'text-black'"
                ></i>
              </h3>
              <div v-for="(item, iIndex) in section.items" :key="iIndex" @click="selectTab(item)"
                class="cursor-pointer ml-2 mr-1 px-3 py-2 font-medium rounded-lg text-[14px] font-manrope  transition-colors"
                :class="{
                  'bg-bg-lavender font-semibold text-text-primary': activeTab.slug === item.slug,
                  'text-text-secondary hover:bg-bg-lavender': activeTab.slug !== item.slug && theme === 'dark',
                  'text-black hover:bg-black hover:text-white': activeTab.slug !== item.slug && theme !== 'dark',
                  'text-white bg-black hover:bg-black': activeTab.slug == item.slug && theme !== 'dark',
                }">
                {{ item.label }}
              </div>
            </div>
          </nav>
        </div>

        <!-- Footer -->
        <div class="border-t border-border-input p-3 text-[14px] leading-[24px] font-manrope"
          :class="theme === 'dark' ? 'text-text-secondary' : 'text-black'">
          <p class=" cursor-pointer transition-colors">Linear Developers</p>
          <p class=" cursor-pointer transition-colors">Contact support</p>
        </div>
      </div>

    </aside>


    <!-- ======== Main Content ======== -->
    <main class="flex-1 mx-auto h-screen bg-bg-body overflow-y-auto bg-bg-primary custom-scrollbar transition-all"
      :class="theme === 'dark' ? 'dark_scroll' : 'light_scroll'">
      <!-- Mobile Header -->
      <header class="md:hidden flex items-center justify-between p-4  bg-bg-body sticky top-0 z-40"
        :class="theme === 'dark' ? 'border-b border-border-input' : 'border-b border-black'">
        <div class="flex items-center gap-3">
          <button @click="sidebarOpen = true" class="text-primary hover:text-white">
            <i class="fa-solid fa-bars font-bold text-[18px]"></i>
          </button>
          <span class="text-xl pb-1"> |</span>
          <div
            class="text-[16px] font-manrope leading-[24px] font-semibold text-text-secondary flex items-center gap-2">
            <i class="fa-regular fa-house text-text-primary"></i>
            Docs
          </div>
        </div>
        <button @click="openSearch"><i
            class="fa-regular fa-magnifying-glass text-text-primary text-[18px] "></i></button>
      </header>

      <div class="p-[15px] md:p-10 max-w-[1088px] mx-auto">
        <div class="mb-8">

          <!--  Show Skeleton While Loading -->
          <KnowledgeSidebarSkeleton v-if="isLoading" />

          <!--  Show Error if api is not working -->
          <div v-else-if="isError" class="text-center text-red py-8">
            ⚠️ Failed to load categories
          </div>

          <div v-else>
            <!-- <StartGuide v-if="activeTab.slug == 'start-guide'" /> -->
            <div>
              <h2 class="font-manrope text-text-primary font-bold text-[24px] lg:text-[34px] leading-[34px] lg:leading-[40px] tracking-[-1px] mb-[10px] lg:mb-[16px]">{{ activeTab.label }}</h2>
              <KnowledgeArticle :slug="activeTab.slug" />
            </div>
          </div>

        </div>
      </div>
    </main>

    <!--  search Fullscreen Overlay -->
    <transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-start pt-15 justify-center   "
        :class="theme === 'dark' ? ' bg-black/0 backdrop-blur-[4px]' : ' bg-[#dfe2e6]/1 backdrop-blur-[6px] '"
        @click.self="closeSearch">
        <transition name="slide-down">
          <div class="w-full max-w-3xl px-6">
            <div class="relative">
              <i
                class="fa-light fa-magnifying-glass absolute top-[14px] lg:top-[17px] left-[10px] text-text-secondary"></i>
              <input ref="inputRef" type="text" v-model="query" placeholder="Search..." @click="openSearch"
                class="w-full font-manrope text-sm h-[44px] lg:h-[50px] pl-[35px] pr-3 py-2  rounded-lg bg-bg-lavender focus:outline-none focus:ring-1 focus:ring-bg-lavender"
                :class="theme === 'dark' ? 'border border-border-input' : 'border border-black'" />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watchEffect, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StartGuide from './components/StartGuide.vue'
import { useTheme } from "../../composables/useTheme";
const { theme } = useTheme();
import { useActiveKnowledgeCategories } from "../../queries/useKnowledge";
import KnowledgeSidebarSkeleton from "./skelton/KnowledgeSidebarSkeleton.vue"
import KnowledgeArticle from './components/KnowledgeArticle.vue';

/**
 * Fetch API data
*/
const { data: knowledgeData, isLoading, isError } = useActiveKnowledgeCategories();

/**
 * Transform API response into sections array format
*/

const sections = computed(() => {
  if (!knowledgeData.value || !Array.isArray(knowledgeData.value)) return [];

  // Adjust keys based on your API response structure
  const apiSections = knowledgeData.value.map((section) => ({
    title: section?.title || 'Untitled',
    items: Array.isArray(section?.knowledge)
      ? section.knowledge.map((item) => ({
        label: item?.title || '',
        slug: item?.slug || '',
        description: item?.description || '',
      }))
      : [],
  }));

  // one manual section
  const manualSection = {
    title: "Getting started",
    items: [
      {
        label: "Start Guide",
        slug: "start-guide",
        description: "Get in touch with our support team for help.",
      },
    ],
  };
  return [...apiSections,];
});

const route = useRoute();
const router = useRouter();
const sidebarOpen = ref(false);

/**
 * Initialize activeTab safely (empty object at first)
*/
const activeTab = ref({ label: '', slug: '', description: '' });

/**
 * Watch for sections to load and set the default active tab
*/
watchEffect(() => {
  if (sections.value.length && sections.value[0].items.length && !activeTab.value.slug) {
    activeTab.value = sections.value[0].items[0];
  }
});

/**
 *  When route param changes, update activeTab dynamically
*/
watchEffect(() => {
  const slug = route.params.slug;
  if (slug && sections.value.length) {
    const found = sections.value.flatMap(s => s.items).find(i => i.slug === slug);
    if (found) activeTab.value = found;
  }
});

function selectTab(item) {
  activeTab.value = item;
  sidebarOpen.value = false;
  router.push(`/knowledge-center/${item.slug}`);
}

// search 
const isOpen = ref(false)
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

function openSearch() {
  isOpen.value = true
  nextTick(() => inputRef.value?.focus())
}

function closeSearch() {
  isOpen.value = false
  query.value = ''
}
</script>

<style scoped> 
/* ===== Scrollbar Styling (only for this page) ===== */
/* Light mode */
.light_scroll.custom-scrollbar::-webkit-scrollbar {
  width: 10px;
}

.light_scroll.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 9999px;
}

.light_scroll.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #b4b4b4;
  border-radius: 9999px;
  border: 2px solid #ffffff;
  /* creates clean gap on light background */
  transition: background-color 0.2s ease;
}

.light_scroll.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #9a9a9a;
}

/* Dark mode */
.dark_scroll.custom-scrollbar::-webkit-scrollbar {
  width: 10px;
}

.dark_scroll.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 9999px;
}

.dark_scroll.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #555;
  border-radius: 9999px;
  border: 2px solid #1e1e1e;
  /* subtle gap for dark backgrounds */
  transition: background-color 0.2s ease;
}

.dark_scroll.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #777;
}

/* ===== Firefox Support ===== */
.light_scroll.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #b4b4b4 transparent;
}

.light_scroll.custom-scrollbar:hover {
  scrollbar-color: #9a9a9a transparent;
}

.dark_scroll.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #555 transparent;
}

.dark_scroll.custom-scrollbar:hover {
  scrollbar-color: #777 transparent;
}

/* search Overlay fade-in/out */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Input slide animation */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}
</style>
