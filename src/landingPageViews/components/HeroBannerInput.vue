<script setup lang="ts">
import { ref, defineExpose, defineProps } from "vue";
import { useWorkspaceStore } from '../../stores/workspace';
import { useRouter } from 'vue-router';
import { useCreateWorkspaceWithAI } from '../../queries/useWorkspace';
import { toast } from 'vue-sonner';

defineProps<{
  theme: any
}>();

const workspaceStore = useWorkspaceStore();
const inputValue = ref("");
const showThemeDropdown = ref(false);

function setValue(val: string) {
  inputValue.value = val;
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

function handleAudio() {
  toast.info("Voice input coming soon!");
}

defineExpose({ setValue });
</script>

<template>
  <form @submit.prevent="handleSubmit" class="w-full relative max-w-[700px] lg:max-w-[896px] mx-auto pb-[40px]">
    <div class="loveable-prompt-box bg-[#2d2d2d] rounded-[16px] p-[8px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.4)] border border-[#404040]">
      <div class="flex items-center gap-2">
        <!-- Left Actions -->
        <div class="flex items-center gap-2">
          <!-- Plus Button -->
          <button
            type="button"
            class="flex items-center justify-center w-[36px] h-[36px] rounded-lg bg-transparent hover:bg-[#3d3d3d] transition-colors duration-200 text-[#999]"
            title="New conversation"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          <!-- Attach Button -->
          <button
            type="button"
            @click="handleAttach"
            class="flex items-center gap-2 px-3 h-[36px] rounded-lg bg-transparent hover:bg-[#3d3d3d] transition-colors duration-200 text-[#e0e0e0] text-sm font-medium"
            title="Attach file"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span class="hidden sm:inline">Attach</span>
          </button>

          <!-- Theme Dropdown -->
          <div class="relative">
            <button
              type="button"
              @click="showThemeDropdown = !showThemeDropdown"
              class="flex items-center gap-2 px-3 h-[36px] rounded-lg bg-transparent hover:bg-[#3d3d3d] transition-colors duration-200 text-[#e0e0e0] text-sm font-medium"
              title="Theme settings"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span class="hidden sm:inline">Theme</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Center Input -->
        <div class="flex-1 min-w-0">
          <input
            v-model="inputValue"
            type="text"
            placeholder="Ask Orchit to create a plan for…"
            class="w-full px-3 py-2 bg-transparent text-[#e0e0e0] text-sm font-normal placeholder-[#777] focus:outline-none"
          />
        </div>

        <!-- Right Actions -->
        <div class="flex items-center gap-2">
          <!-- Chat Button -->
          <button
            type="submit"
            :disabled="isPending"
            class="flex items-center gap-2 px-4 h-[36px] rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors duration-200 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            title="Start chat"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{{ isPending ? "Generating..." : "Chat" }}</span>
          </button>

          <!-- Audio Button -->
          <button
            type="button"
            @click="handleAudio"
            class="flex items-center justify-center w-[36px] h-[36px] rounded-lg bg-transparent hover:bg-[#3d3d3d] transition-colors duration-200 text-[#e0e0e0]"
            title="Voice input"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </button>

          <!-- Up Arrow Button -->
          <button
            type="submit"
            :disabled="isPending || !inputValue.trim()"
            class="flex items-center justify-center w-[36px] h-[36px] rounded-lg bg-[#3d3d3d] hover:bg-[#4d4d4d] transition-colors duration-200 text-[#e0e0e0] disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send message"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </form>
</template>

<style scoped>
.loveable-prompt-box {
  backdrop-filter: blur(10px);
}
</style>
