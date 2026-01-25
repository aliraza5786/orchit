<script setup lang="ts">
import { ref, defineExpose, defineProps, onMounted, onUnmounted, nextTick } from "vue";
import { useWorkspaceStore } from '../../stores/workspace';
import { useRouter } from 'vue-router';
import { useCreateWorkspaceWithAI } from '../../queries/useWorkspace';
import { toast } from 'vue-sonner';

defineProps<{
  theme: any
}>();

const workspaceStore = useWorkspaceStore();
const inputValue = ref("");
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const placeholders = [
  "Ask Orchit to plan ecommerce solution...",
  "Ask Orchit to plan SaaS solution...",
  "Ask Orchit to plan mobile app development...",
  "Ask Orchit to plan marketing campaign...",
  "Ask Orchit to plan startup launch strategy...",
  "Ask Orchit to plan content creation workflow...",
];

const currentPlaceholder = ref(placeholders[0]);
let placeholderInterval: number | null = null;

onMounted(() => {
  let index = 0;
  placeholderInterval = window.setInterval(() => {
    index = (index + 1) % placeholders.length;
    currentPlaceholder.value = placeholders[index];
  }, 3000);
});

onUnmounted(() => {
  if (placeholderInterval) {
    clearInterval(placeholderInterval);
  }
});

function setValue(val: string) {
  inputValue.value = val;
  nextTick(() => {
    adjustTextareaHeight();
  });
}

function adjustTextareaHeight() {
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto';
    const newHeight = Math.min(textareaRef.value.scrollHeight, 560);
    textareaRef.value.style.height = `${newHeight}px`;
  }
}

function handleInput() {
  adjustTextareaHeight();
}

const router = useRouter()
const { mutate: generate, isPending } = useCreateWorkspaceWithAI({
  onSuccess: (aiResponse: any) => {
    workspaceStore.setWorkspace(aiResponse);
    router.push('/create-workspace')
  },
  onError: (error: any) => {
    toast.error("Something went wrong", error);
  }
});

function handleSubmit() {
  if (!inputValue.value.trim()) return;
  generate({ idea: inputValue.value })
  workspaceStore.setWorkspace(inputValue.value)
}

function handleAttach() {
  toast.info("Attachment feature coming soon!");
}

defineExpose({ setValue });
</script>

<template>
  <div class="w-full max-w-[700px] lg:max-w-[896px] mx-auto pb-[40px]">
    <form @submit.prevent="handleSubmit" class="w-full">
      <div class="orchit-prompt-box bg-[#2d2d2d] rounded-[16px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.4)] border border-[#404040] relative">
        <!-- Input Field with buttons inside -->
        <div class="relative">
          <textarea
            ref="textareaRef"
            v-model="inputValue"
            @input="handleInput"
            :placeholder="currentPlaceholder"
            class="w-full pl-24 pr-28 py-3 bg-transparent text-[#e0e0e0] text-[14px] md:text-[15px] font-normal placeholder-[#777]
            focus:outline-none transition-all duration-300 resize-none placeholder-transition text-right min-h-[80px] max-h-[560px]"
          ></textarea>

          <!-- Buttons Inside Input - Bottom Left and Right -->
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
            <!-- Attach Button - Left Side -->
            <button
              type="button"
              @click="handleAttach"
              class="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-transparent hover:bg-white/10
              transition-all duration-200 text-white/80 hover:text-white group font-medium text-[14px]"
              title="Attach file"
            >
              <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>Attach</span>
            </button>

            <!-- Submit Button - Right Side -->
            <button
              type="submit"
              :disabled="isPending || !inputValue.trim()"
              class="flex items-center gap-2 px-4 py-2 rounded-[8px]
              bg-[#9356c5] hover:bg-[#6e3b96] transition-all duration-200
              text-white disabled:opacity-40 disabled:cursor-not-allowed
              disabled:hover:bg-[#9356c5] group shadow-md hover:shadow-lg hover:scale-105 font-medium text-[14px]"
              title="Submit"
            >
              <span v-if="isPending">Planning...</span>
              <span v-else>Plan now</span>
              <svg v-if="isPending" class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
.orchit-prompt-box {
  backdrop-filter: blur(10px);
  padding: 12px;
}

.placeholder-transition::placeholder {
  transition: opacity 0.5s ease-in-out;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
