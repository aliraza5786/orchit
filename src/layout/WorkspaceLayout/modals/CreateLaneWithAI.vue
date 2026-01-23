<template>
    <BaseModal v-model="workspaceStore.showCreateLaneModalWithAI" size="lg">
        <!-- Header -->
        <div class="flex justify-between items-start px-6 border-b border-border pb-6">
            <h2 class="text-xl font-semibold">Create a New Tab</h2>
        </div>

        <!-- Main Content -->
        <div class="flex flex-col gap-6 px-6 py-5">
            <!-- Step 1: AI Lane Creation -->
            <div>

                <!-- Textarea for description -->
                <div class="relative min-h-[3.5rem] w-full  max-w-[800px]">
                    <div
                        class="neon-flow-border bg-bg-input after:p-4  flex h-[200px] items-start gap-2.5 self-stretch shadow-[-1px_-1px_0_0_rgba(255,255,255,0.20)_inset,1px_1px_1px_0_rgba(255,255,255,0.60)_inset] backdrop-blur-[5px]  pl-[17px] pr-[48px] py-[30px] rounded-3xl max-sm:h-[120px] max-sm:px-5 max-sm:py-5">
                        <textarea autofocus :disabled="isPending" v-if="!isRecording && !audioURL" v-model="description"
                            placeholder="Ask  Orchit AI to create a tab..."
                            class="w-full h-full  text-text-primary text-base font-normal leading-7 resize-none outline-none placeholder:opacity-70" />

                        <!-- AI Generation Button -->
                        <transition v-if="!description" name="fade-slide" appear>
                            <div class="bottom-5 right-4"
                                :class="isRecording || audioURL ? 'w-full rounded-full' : 'absolute'">
                                <AudioRecorder v-model="description" @transcribed="onTranscription"
                                    v-model:isRecording="isRecording" v-model:hasAudio="audioURL" />
                            </div>
                        </transition>

                        <transition v-else name="rotate-fade" appear>
                            <div @click="() => { if (!isPending) { handleGenerate(); } }"
                                class="absolute bottom-5 right-4 w-8 h-8 cursor-pointer p-1 bg-accent rounded-md flex items-center justify-center shadow"
                                :class="isCreatingLane ? 'animate-pulse-ring' : ' cursor-pointer'">
                                <i class="text-white fa-solid fa-arrow-right"></i>
                            </div>
                        </transition>
                    </div>
                </div>
            </div>

            <!-- Suggestions -->
            <p class="text-sm text-text-secondary text-center">Or try these examples:</p>
            <div class="suggestions flex gap-3 max-w-[800px] w-full overflow-x-auto">
                <div v-if="isSuggestionPending" class="suggestions flex gap-3 max-w-[800px] w-full" aria-busy="true"
                    aria-live="polite">
                    <div v-for="n in 3" :key="n"
                        class="flex h-[136px] flex-[1_0_0] rounded-xl border border-border/20 bg-bg-card/50 p-[17px] backdrop-blur-sm">
                        <div class="w-full space-y-2 animate-pulse">
                            <div class="h-4 w-5/6 rounded bg-border/40"></div>
                            <div class="h-4 w-4/6 rounded bg-border/30"></div>
                            <div class="h-4 w-3/6 rounded bg-border/20"></div>
                        </div>
                    </div>
                </div>

                <!-- Your real content (shown when not loading) -->
                <div v-else class="suggestions flex gap-3 max-w-[800px] w-full">
                    <div v-for="(suggestion, idx) in suggestionData" :key="idx" @click="() => {
                        if (!isPending && suggestion.description.length > 3) {
                            typeEffect(suggestion.description)
                        } else {
                            description = suggestion.description
                        }
                    }"
                        class="flex h-[136px] items-center flex-[1_0_0] cursor-pointer bg-bg-card/50 border border-border/20 backdrop-blur-sm p-[17px] rounded-xl max-md:h-20 max-md:p-5 max-sm:h-[60px] max-sm:p-[15px] hover:bg-bg-card/70 hover:border-accent-hover/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 hover-scale">
                        <span
                            class="text-text-secondary line-clamp-3 text-base font-normal leading-5 hover:text-text-primary transition-colors max-md:static max-md:w-auto max-md:h-auto max-sm:text-sm max-sm:leading-[18px]">
                            {{ suggestion.description }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex w-full px-6 text-sm text-text-secondary  items-center gap-4 mt-6">
            <hr class=" flex-auto text-border">
            <span>OR</span>
            <hr class="flex-auto text-border">
        </div>
        <div class="px-6 mt-5">
            <Button variant="primary" color="dark" :block="true" @click="createManualHandler">
                Create Manually
            </Button>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { useWorkspaceStore } from '../../../stores/workspace';
import { useSuggestions } from '../../../queries/useWorkspace';
import BaseModal from '../../../components/ui/BaseModal.vue';
import AudioRecorder from '../../../views/CreateWorkspace/components/AudioRecorder.vue';
import Button from '../../../components/ui/Button.vue';
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { useCreateWorkspaceLaneAi } from '../../../queries/useLane';
import { useWorkspaceId } from '../../../composables/useQueryParams';
import { useQueryClient } from '@tanstack/vue-query';

const isRecording = ref(false);
const audioURL = ref<string | null>(null);
const emit = defineEmits(['generate', 'manual', 'update:isRecording', 'update:hasAudio']);
watch(isRecording, (val) => emit('update:isRecording', val));
watch(audioURL, (val) => emit('update:hasAudio', !!val));
const { workspaceId } = useWorkspaceId()
const workspaceStore = useWorkspaceStore();
const description = ref('');
const isPending = ref(false); // Keep track of the AI process
const queryClient = useQueryClient()
// Suggestions and AI generation
const { data: suggestionData, isPending: isSuggestionPending } = useSuggestions('lane');
const { mutate: createLane, isPending: isCreatingLane } = useCreateWorkspaceLaneAi({
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        queryClient.invalidateQueries({ queryKey: ['workspaces', 'byId', workspaceId.value] }); // Ensure current workspace is refreshed
        workspaceStore.toggleCreateLaneModalWithAI();
    }
})
const handleGenerate = () => {
    const payload = {
        workspace_id: workspaceId.value,
        lane_intent: description.value
    }
    createLane(payload)
};

// audio
const onTranscription = (transcript: any) => {
    typeEffect(transcript)
}

const typingTimeouts: ReturnType<typeof setTimeout>[] = []

function typeEffect(text: string) {
    // Clear existing timeouts
    typingTimeouts.forEach(clearTimeout)
    typingTimeouts.length = 0

    description.value = ''
    const chars = text.split('')

    chars.forEach((char, index) => {
        const timeout = setTimeout(() => {
            description.value += char
        }, index * 25) // 25ms per character, adjust for speed

        typingTimeouts.push(timeout)
    })
}
const createManualHandler = async () => {
    workspaceStore.toggleCreateLaneModalWithAI();
    await nextTick() // ✅ Wait for both to update
    workspaceStore.toggleCreateLaneModal();
     // ✅ RESET STATE
    description.value = '';
    isRecording.value = false;
     audioURL.value = null;
}
watch(
  () => workspaceStore.showCreateLaneModalWithAI,
  (isOpen) => {
    if (isOpen) {
      description.value = '';
      isRecording.value = false;
      audioURL.value = null;
    }
  }
);

</script>

<style scoped>
/* Modal and animation styles */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.rotate-fade-enter-active,
.rotate-fade-leave-active {
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.rotate-fade-enter-from,
.rotate-fade-leave-to {
    opacity: 0;
    transform: rotate(180deg);
}

.animate-pulse-ring {
    animation: pulse-ring 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-ring {
    0% {
        box-shadow: 0 0 0 0 rgba(138, 49, 246, 0.4);
    }

    70% {
        box-shadow: 0 0 0 20px rgba(59, 130, 246, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
    }
}
</style>