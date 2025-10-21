<template>
  <Loader v-if="(route.params.id && isPending)" />
  <div>
    <h2 v-once class="text-2xl md:text-5xl font-semibold text-text-primary text-center mb-1">
      Welcome to Orchit AI Space
    </h2>
    <p v-once class="text-sm md:text-base text-text-secondary text-center mt-5.5 mb-6">
      Describe your project, and we'll build the plan instantly with AI magic.
    </p>
  </div>

  <div class="flex flex-col gap-6 w-full">
    <div class="relative min-h-[3.5rem] w-full max-w-[800px]">
      <div
        :class="`${isPending ? 'neon-flow-border' : ''} flex h-[200px] items-start gap-2.5 self-stretch shadow-[-1px_-1px_0_0_rgba(255,255,255,0.20)_inset,1px_1px_1px_0_rgba(255,255,255,0.60)_inset] backdrop-blur-[5px] bg-bg-input pl-[17px] pr-[48px] py-[30px] rounded-3xl max-sm:h-[120px] max-sm:px-5 max-sm:py-5`">
        <textarea autofocus :disabled="isPending" v-if="!isRecording && !audioURL" v-model="description"
          placeholder="Ask Orchit AI to create a project..."
          class="w-full h-full bg-transparent text-text-primary text-base font-normal leading-7 resize-none outline-none placeholder:opacity-70" />
      </div>

      <transition v-if="!description" name="fade-slide" appear>
        <div class="bottom-5 right-4" :class="isRecording || audioURL ? 'w-full rounded-full' : 'absolute'">
          <AudioRecorder v-model="description" @transcribed="onTranscription" v-model:isRecording="isRecording"
            v-model:hasAudio="audioURL" />
        </div>
      </transition>

      <transition v-else name="rotate-fade" appear>
        <div @click="handleGenerate"
          class="absolute bottom-5 flex justify-center items-center right-4 w-8 h-8 aspect-square rounded-lg cursor-pointer bg-accent"
          :class="isPending ? 'animate-pulse-ring' : ''">
          <i class="text-base text-white fa-solid fa-arrow-right"></i>
        </div>
      </transition>
    </div>

    <p class="text-sm max-md:text-xs text-text-secondary text-center" v-once>Or try these examples:</p>
    <div class="suggestions flex gap-3 max-w-[800px] w-full">
      <!-- Skeleton (show when loading) -->
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

      <div v-else class="suggestions flex gap-3 max-w-[800px] w-full">
        <div v-for="(suggestion, idx) in suggestions" :key="idx" @click="handleSuggestionClick(suggestion)"
          class="flex h-[136px] items-center flex-[1_0_0] cursor-pointer bg-bg-card/50 border border-border/20 backdrop-blur-sm p-[17px] rounded-xl max-md:h-20 max-md:p-5 max-sm:h-[60px] max-sm:p-[15px] hover:bg-card/70 hover:border-accent-hover/30 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 hover-scale">
          <span
            class="text-text-secondary line-clamp-3 text-base font-normal leading-5 hover:text-text-primary transition-colors max-md:static max-md:w-auto max-md:h-auto max-sm:text-sm max-sm:leading-[18px]">
            {{ suggestion.description }}
          </span>
        </div>
      </div>
    </div>

    <div v-once class="flex w-full text-sm text-text-secondary/50 items-center gap-4 mt-6">
      <hr class="flex-auto" />
      <span>OR</span>
      <hr class="flex-auto" />
    </div>
    <div class="mt-5">
      <Button variant="secondary" :block="true" @click="mannualHandler">
        Create Manually
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import AudioRecorder from '../components/AudioRecorder.vue';
import { toast } from 'vue-sonner';
import { useCreateWorkspaceWithAI, useDescription, useSuggestions } from '../../../queries/useWorkspace';
import { useRoute } from "vue-router";
import Loader from '../../../components/ui/Loader.vue';
import Button from '../../../components/ui/Button.vue';
import { useWorkspaceStore } from '../../../stores/workspace';
const workspaceStore = useWorkspaceStore()
const route = useRoute();
const { data: suggestions, isPending: isSuggestionPending } = useSuggestions('workspace');
const { data: descriptionData, isSuccess } = useDescription();

const hasId = computed(() => Boolean(route.params.id));
const autoTriggered = ref(false);
const allLoaded = computed(() => (!hasId.value || isSuccess.value));

watch(allLoaded, (ready) => {
  if (ready && !autoTriggered.value && hasId.value) {
    description.value = descriptionData.value?.data ?? '';
    handleGenerate();
    autoTriggered.value = true;
  }
}, { immediate: true });

const description = ref('');
const isRecording = ref(false);
const audioURL = ref<string | null>(null);

const { mutate: generate, isPending } = useCreateWorkspaceWithAI({
  onSuccess: (aiResponse: any) => {
    workspaceStore.setWorkspace(aiResponse)
    emit('manual');
  },
  onError: (error: any) => {
    toast.error("Something went wrong", error);
  }
});

const typingTimeouts: ReturnType<typeof setTimeout>[] = [];

function typeEffect(text: string) {
  typingTimeouts.forEach(clearTimeout);  // Clear existing timeouts
  typingTimeouts.length = 0;
  description.value = '';
  const chars = text.split('');
  chars.forEach((char, index) => {
    const timeout = setTimeout(() => {
      description.value += char;
    }, index * 25);  // 25ms per character, adjust for speed
    typingTimeouts.push(timeout);
  });
}

function onTranscription(transcript: string) {
  typeEffect(transcript);
}

function handleGenerate() {
  localStorage.setItem('mannualWorkspace', 'false');
  generate({ idea: description.value });
}
onMounted(() => {
  localStorage.setItem('mannualWorkspace', 'false')
})
function mannualHandler() {
  localStorage.setItem('mannualWorkspace', 'true')
  workspaceStore.setWorkspace(null)
  localStorage.removeItem('jobId');
  emit('manual', 'mannual');
}

function handleSuggestionClick(suggestion: any) {
  if (!isPending && suggestion.description.length > 3) {
    typeEffect(suggestion.description);
  } else {
    description.value = suggestion.description;
  }
}

const emit = defineEmits(['generate', 'manual', 'update:isRecording', 'update:hasAudio']);

watch(isRecording, (val) => emit('update:isRecording', val));
watch(audioURL, (val) => emit('update:hasAudio', !!val));
</script>