<script setup lang="ts">
import { ref, defineExpose, defineProps, computed, onMounted, onUnmounted } from "vue";
import { useWorkspaceStore } from '../../stores/workspace';
import { useRouter } from 'vue-router';
import { useCreateWorkspaceWithAI } from '../../queries/useWorkspace';
import { useAuthStore } from '../../stores/auth';
import { toast } from 'vue-sonner';

const props = defineProps<{
  theme?: any;
  placeholder?: string;
}>();

const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const router = useRouter();

const inputValue = ref("");
const showError = ref(false);
const isFocused = ref(false);
const animatedPlaceholder = ref("");
const currentPlaceholderIndex = ref(0);

// Static prefix and rotating suffixes
const staticPrefix = "Ask Orchit to create ";
const placeholderSuffixes = [
  "a plan for your project...",
  "project milestones...",
  "a task breakdown...",
  "a team workflow...",
  "sprint goals...",
  "a project roadmap...",
  "weekly schedules..."
];

let typingInterval: NodeJS.Timeout | null = null;
let erasingInterval: NodeJS.Timeout | null = null;
let delayTimeout: NodeJS.Timeout | null = null;

// Typing animation
const typeText = () => {
  const currentSuffix = placeholderSuffixes[currentPlaceholderIndex.value];
  let charIndex = 0;

  typingInterval = setInterval(() => {
    if (charIndex < currentSuffix.length) {
      animatedPlaceholder.value = staticPrefix + currentSuffix.substring(0, charIndex + 1);
      charIndex++;
    } else {
      if (typingInterval) clearInterval(typingInterval);
      // Wait before starting to erase
      delayTimeout = setTimeout(() => {
        eraseText();
      }, 2000);
    }
  }, 50);
};

// Erasing animation - only erase the suffix part
const eraseText = () => {
  const currentSuffix = placeholderSuffixes[currentPlaceholderIndex.value];
  let charIndex = currentSuffix.length;

  erasingInterval = setInterval(() => {
    if (charIndex > 0) {
      animatedPlaceholder.value = staticPrefix + currentSuffix.substring(0, charIndex - 1);
      charIndex--;
    } else {
      if (erasingInterval) clearInterval(erasingInterval);
      // Move to next placeholder
      currentPlaceholderIndex.value = (currentPlaceholderIndex.value + 1) % placeholderSuffixes.length;
      // Wait before starting to type again
      delayTimeout = setTimeout(() => {
        typeText();
      }, 500);
    }
  }, 30);
};

onMounted(() => {
  typeText();
});

onUnmounted(() => {
  if (typingInterval) clearInterval(typingInterval);
  if (erasingInterval) clearInterval(erasingInterval);
  if (delayTimeout) clearTimeout(delayTimeout);
});

function setValue(val: string) {
  inputValue.value = val;
  showError.value = false;
}

const { mutate: generate, isPending } = useCreateWorkspaceWithAI({
  onSuccess: (aiResponse: any) => {
    if (!authStore.isAuthenticated) {
      localStorage.setItem('post_auth_intent', JSON.stringify({
        path: '/create-workspace',
        aiResponse: aiResponse
      }));
      router.push('/login');
    } else {
      workspaceStore.setWorkspace(aiResponse);
      router.push('/create-workspace');
    }
  },
  onError: (error: any) => {
    toast.error("Something went wrong", error);
  }
});

const isInputEmpty = computed(() => !inputValue.value.trim());

function handleSubmit() {
  if (isInputEmpty.value) {
    showError.value = true;
    return;
  }

  showError.value = false;
  generate({ idea: inputValue.value })
}

function handleAttachment() {
  // Handle attachment logic
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*,.pdf,.doc,.docx';
  fileInput.onchange = (e: any) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      console.log('File selected:', files[0]);
      // Add your file handling logic here
    }
  };
  fileInput.click();
}

defineExpose({ setValue });
</script>

<template>
  <form @submit.prevent="handleSubmit" class="w-full relative max-w-[700px] lg:max-w-[896px] mx-auto pb-[40px]">
    <!-- Main Input Container -->
    <div 
      class="relative rounded-[20px] lg:rounded-[24px] transition-all duration-300 shadow-lg"
      :class="[
        isFocused 
          ? 'shadow-[0_0_0_3px_rgba(199,76,240,0.1)]' 
          : 'shadow-[0px_8px_32px_0px_rgba(7,10,13,0.15)]',
        showError ? 'ring-2 ring-red-500' : ''
      ]"
    >
      <!-- Input Wrapper with Gradient Border Effect -->
      <div 
        class="relative bg-gradient-to-r from-[#C74CF0] via-[#D371F4] to-[#C74CF0] p-[2px] rounded-[20px] lg:rounded-[24px]"
      >
        <div 
          class="relative rounded-[18px] lg:rounded-[22px] overflow-hidden"
          :class="theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white'"
        >
          <!-- Input Field -->
          <input 
            v-model="inputValue" 
            type="text" 
            :placeholder="animatedPlaceholder" 
            @input="showError = false"
            @focus="isFocused = true"
            @blur="isFocused = false"
            class="w-full px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6 pb-3 sm:pb-4
                   text-[14px] sm:text-[15px] lg:text-[16px] font-medium
                   bg-transparent focus:outline-none transition-all duration-200
                   placeholder:font-normal placeholder:transition-all placeholder:duration-200"
            :class="theme === 'dark' 
              ? 'text-gray-100 placeholder:text-gray-500' 
              : 'text-gray-900 placeholder:text-gray-400'"
          />
          
          <!-- Bottom Actions Bar -->
          <div class="flex items-center justify-between px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5 pt-2">
            <!-- Left Side - Attachment Button -->
            <button
              type="button"
              @click="handleAttachment"
              class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl
                     transition-all duration-200 hover:bg-opacity-10 border border-border-input"
              :class="theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-300 hover:bg-accent/30' 
                : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span class="text-[13px] sm:text-[14px] font-medium">Attach</span>
            </button>

            <!-- Right Side - Generate Button -->
            <button 
              type="submit"
              class="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 lg:py-3
                     bg-gradient-to-r from-[#C74CF0] to-[#D371F4] 
                     text-white text-[13px] sm:text-[14px] font-semibold rounded-lg sm:rounded-xl
                     hover:shadow-lg hover:shadow-purple-500/30
                     transition-all duration-200 
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                     whitespace-nowrap"
              :disabled="isPending"
            >
              <svg 
                v-if="!isPending"
                class="w-4 h-4 sm:w-[18px] sm:h-[18px]" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <svg 
                v-else
                class="w-4 h-4 sm:w-[18px] sm:h-[18px] animate-spin" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isPending ? "Generating..." : "Generate" }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <p v-if="showError" class="mt-3 ml-1 text-red-500 text-[13px] font-medium flex items-center gap-1.5">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        Please describe your project before generating
      </p>
    </transition>
  </form>
</template>

<style scoped>
/* Custom focus styles */
input:focus {
  outline: none;
}

/* Smooth gradient animation on hover */
@keyframes gradient-shift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.bg-gradient-to-r {
  background-size: 200% 200%;
  animation: gradient-shift 3s ease infinite;
}
</style>