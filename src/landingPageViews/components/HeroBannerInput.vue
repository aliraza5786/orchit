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

defineExpose({ setValue });
</script>

<template>
  <div class="w-full max-w-[700px] lg:max-w-[896px] mx-auto pb-[40px]">
    <h3 class="text-[#e0e0e0] text-[16px] md:text-[18px] font-medium mb-[12px] text-left">
      Ask Orchit to create a plan for…
    </h3>

    <form @submit.prevent="handleSubmit" class="w-full">
      <div class="orchit-prompt-box bg-[#2d2d2d] rounded-[16px] p-[12px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.4)] border border-[#404040]">
        <div class="flex flex-col gap-3">
          <!-- Input Field -->
          <textarea
            v-model="inputValue"
            rows="4"
            placeholder="Describe your project idea in detail..."
            class="w-full px-4 py-3 bg-[#1a1a1a] text-[#e0e0e0] text-[14px] md:text-[15px] font-normal placeholder-[#777]
            rounded-[12px] border border-[#404040] focus:outline-none focus:border-[#2563eb]
            transition-colors duration-200 resize-none"
          ></textarea>

          <!-- Buttons Row -->
          <div class="flex items-center justify-between gap-3">
            <!-- Attach Button -->
            <button
              type="button"
              @click="handleAttach"
              class="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-transparent hover:bg-[#3d3d3d]
              border border-[#404040] transition-colors duration-200 text-[#e0e0e0] text-[14px] font-medium"
              title="Attach file"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>Attach</span>
            </button>

            <!-- Orchestrate Button -->
            <button
              type="submit"
              :disabled="isPending || !inputValue.trim()"
              class="flex items-center justify-center gap-2 px-6 py-2.5 rounded-[10px]
              bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors duration-200
              text-white text-[14px] font-semibold disabled:opacity-60 disabled:cursor-not-allowed
              disabled:hover:bg-[#2563eb] min-w-[140px]"
              title="Start orchestrating"
            >
              <span v-if="isPending">
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <span>{{ isPending ? "Orchestrating..." : "Orchestrate" }}</span>
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
