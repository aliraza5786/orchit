<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useWorkspaceStore } from '../../stores/workspace';
import { useRouter } from 'vue-router';
import { useCreateWorkspaceWithAI } from '../../queries/useWorkspace';
import { useAuthStore } from '../../stores/auth';
import { toast } from 'vue-sonner';
import Button from "../../components/ui/Button.vue";

const props = defineProps<{
  theme?: any;
  placeholder?: string;
}>();
const theme = props.theme;
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const router = useRouter();

const inputValue = ref("");
const showError = ref(false);
const isFocused = ref(false);
const animatedPlaceholder = ref("");
const currentPlaceholderIndex = ref(0);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const attachedFiles = ref<Array<{ id: string; name: string; size: string; type: string }>>([]);

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

let typingInterval: ReturnType<typeof setInterval> | null = null;
let erasingInterval: ReturnType<typeof setInterval> | null = null;
let delayTimeout: ReturnType<typeof setTimeout> | null = null;

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

function autoResize() {
  const textarea = textareaRef.value;
  if (!textarea) return;

  // Reset height to auto to get the correct scrollHeight
  textarea.style.height = 'auto';
  
  const lineHeight = 24; // Approximate line height in pixels
  const maxLines = 10;
  const maxHeight = lineHeight * maxLines;
  
  const newHeight = textarea.scrollHeight;
  
  if (newHeight <= maxHeight) {
    // If content is less than max lines, grow the textarea
    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = 'hidden';
  } else {
    // If content exceeds max lines, fix height and show scroll
    textarea.style.height = `${maxHeight}px`;
    textarea.style.overflowY = 'auto';
  }
}

function handleInput() {
  showError.value = false;
  autoResize();
}

function handleKeydown(event: KeyboardEvent) {
  // Submit on Enter (without Shift)
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSubmit();
  }
  // Allow Shift+Enter for new line (default behavior)
}

// function handleAttachment() {
//   const fileInput = document.createElement('input');
//   fileInput.type = 'file';
//   fileInput.accept = 'image/*,.pdf,.doc,.docx';
//   fileInput.multiple = true;
//   fileInput.onchange = (e: any) => {
//     const files = e.target.files;
//     if (files && files.length > 0) {
//       Array.from(files).forEach((file: any) => {
//         const fileSize = file.size < 1024 * 1024 
//           ? `${(file.size / 1024).toFixed(1)} KB` 
//           : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        
//         const fileType = file.type.split('/')[0] || 'file';
        
//         attachedFiles.value.push({
//           id: `${Date.now()}-${Math.random()}`,
//           name: file.name,
//           size: fileSize,
//           type: fileType
//         });
//       });
//     }
//   };
//   fileInput.click();
// }

function removeAttachment(fileId: string) {
  attachedFiles.value = attachedFiles.value.filter(file => file.id !== fileId);
}

function getFileIcon(type: string) {
  switch(type) {
    case 'image':
      return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
    case 'application':
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
    default:
      return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
  }
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
          <!-- Attached Files Display -->
          <transition-group 
            name="file-list"
            tag="div"
            v-if="attachedFiles.length > 0"
            class="flex flex-wrap gap-2 px-4 sm:px-5 lg:px-6 pt-4 sm:pt-5 lg:pt-6"
          >
            <div
              v-for="file in attachedFiles"
              :key="file.id"
              class="group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"
              :class="theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-750' 
                : 'bg-gray-100 hover:bg-gray-200'"
            >
              <!-- File Icon -->
              <svg class="w-4 h-4 flex-shrink-0" 
                   :class="theme === 'dark' ? 'text-purple-400' : 'text-purple-600'"
                   fill="none" 
                   stroke="currentColor" 
                   viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getFileIcon(file.type)" />
              </svg>
              
              <!-- File Info -->
              <div class="flex flex-col min-w-0">
                <span class="text-[12px] font-medium truncate max-w-[150px] sm:max-w-[200px]"
                      :class="theme === 'dark' ? 'text-gray-200' : 'text-gray-900'">
                  {{ file.name }}
                </span>
                <span class="text-[10px]"
                      :class="theme === 'dark' ? 'text-gray-500' : 'text-gray-500'">
                  {{ file.size }}
                </span>
              </div>
              
              <!-- Remove Button -->
              <button
                type="button"
                @click="removeAttachment(file.id)"
                class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full transition-all duration-200 opacity-70 hover:opacity-100"
                :class="theme === 'dark' 
                  ? 'hover:bg-red-500/20 text-red-400' 
                  : 'hover:bg-red-500/10 text-red-600'"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </transition-group>

          <!-- Textarea Field -->
          <textarea 
            ref="textareaRef"
            v-model="inputValue" 
            :placeholder="animatedPlaceholder" 
            @input="handleInput"
            @focus="isFocused = true"
            @blur="isFocused = false"
            @keydown="handleKeydown"
            rows="1"
            class="w-full px-4 sm:px-5 lg:px-6 pb-3 sm:pb-4
                   text-[14px] sm:text-[15px] lg:text-[16px] font-medium
                   bg-transparent focus:outline-none transition-all duration-200
                   placeholder:font-normal placeholder:transition-all placeholder:duration-200
                   resize-none"
            :class="[
              theme === 'dark' 
                ? 'text-gray-100 placeholder:text-gray-500' 
                : 'text-gray-900 placeholder:text-gray-400',
              attachedFiles.length > 0 ? 'pt-3 sm:pt-4' : 'pt-4 sm:pt-5 lg:pt-6'
            ]"
            style="min-height: 56px; overflow-y: auto;"
          ></textarea>
          
          <!-- Bottom Actions Bar -->
          <div class="flex items-center justify-end px-3 sm:px-4 lg:px-5 pb-3 sm:pb-4 lg:pb-5 pt-2">
            <!-- Left Side - Attachment Button -->
            <!-- <Button
              @click="handleAttachment"
              variant="gray"
              size="lg"
              appearance="outlined"
              type="button"
            >
              <div class="flex gap-1">
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span class="text-[13px] sm:text-[14px] font-medium">Attach</span>
              </div>
            </Button> -->

            <!-- Right Side - Generate Button -->
            <Button 
              :disabled="isPending"
              size="lg"
              type="submit"
            >
              <div class="flex gap-1">
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
              <span>{{ isPending ? "Planning..." : "Plan" }}</span>
              </div>
            </Button>
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
textarea:focus {
  outline: none;
}

/* Custom scrollbar - Always visible */
textarea::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track {
  background: rgba(199, 76, 240, 0.05);
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb {
  background: rgba(199, 76, 240, 0.4);
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: rgba(199, 76, 240, 0.6);
}

/* For Firefox */
textarea {
  scrollbar-width: thin;
  scrollbar-color: rgba(199, 76, 240, 0.4) rgba(199, 76, 240, 0.05);
}

/* File list animations */
.file-list-enter-active,
.file-list-leave-active {
  transition: all 0.3s ease;
}

.file-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.file-list-leave-to {
  opacity: 0;
  transform: translateX(-10px);
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