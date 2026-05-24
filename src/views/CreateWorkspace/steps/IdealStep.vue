<template>
  <Loader v-if="(route.params.id && isPending)" />
  <div class="ideal-step w-full flex flex-col gap-6">
    <!-- Hero -->
    <div class="ideal-enter ideal-enter-1 text-center space-y-3 mb-4">
      <span
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border shadow-sm"
        :style="badgeStyle"
      >
        <i class="fa-solid fa-sparkles text-[10px]"></i>
        AI-Powered Setup
      </span>
      <h2 class="text-[24px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight">
        Welcome to Orchit AI Space
      </h2>
      <p class="text-sm text-text-secondary mb-0 max-w-[520px] mx-auto leading-relaxed">
        Describe your workspace, and we'll build the plan instantly with AI magic.
      </p>
    </div>

    <!-- AI input -->
    <div class="ideal-enter ideal-enter-2 flex flex-col gap-6 w-full">
      <div class="relative min-h-[3.5rem] w-full max-w-[800px] mx-auto">
        <div
          :class="[
            isPending ? 'neon-flow-border' : '',
            'ai-input-shell flex h-[120px] items-start gap-2.5 self-stretch pl-[17px] pr-[48px] py-[15px] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300',
          ]"
        >
          <textarea
            ref="textareaRef"
            autofocus
            :disabled="isPending"
            v-if="!isRecording && !audioURL"
            v-model="description"
            :placeholder="isFocused || description ? 'Ask Orchit AI to create a workspace...' : ''"
            style="height: 100% !important"
            class="w-full h-full bg-transparent text-text-primary text-sm font-normal leading-normal resize-none outline-none placeholder:text-text-secondary/60 relative z-[1]"
            @focus="isFocused = true"
            @blur="isFocused = false"
          />
          <div
            v-if="!description && !isFocused && !isRecording && !audioURL"
            class="absolute inset-0 pl-[17px] pr-[48px] py-[15px] max-sm:px-5 max-sm:py-5 pointer-events-none flex items-start z-0"
            aria-hidden="true"
          >
            <span class="text-sm  text-text-secondary/55 font-normal">
              {{ animatedPlaceholder }}<span class="typing-caret">|</span>
            </span>
          </div>
        </div>

        <transition v-if="!description" name="fade-slide" appear>
          <div class="bottom-5 right-4" :class="isRecording || audioURL ? 'w-full rounded-full' : 'absolute'">
            <AudioRecorder
              v-model="description"
              @transcribed="onTranscription"
              v-model:isRecording="isRecording"
              v-model:hasAudio="audioURL"
            />
          </div>
        </transition>

        <transition v-else name="rotate-fade" appear>
          <div
            @click="handleGenerate"
            class="absolute bottom-5 flex justify-center items-center right-4 w-9 h-9 aspect-square rounded-xl cursor-pointer bg-gradient-to-br from-accent to-accent-hover shadow-md hover:shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all duration-300"
            :class="isPending ? 'animate-pulse-ring' : ''"
          >
            <i class="text-[13px] text-white fa-solid fa-arrow-right"></i>
          </div>
        </transition>
      </div>

      <p class="text-sm max-md:text-xs text-text-secondary text-center m-0">Or try these examples:</p>
      <div class="suggestions flex gap-3 max-w-[800px] w-full mx-auto">
        <div
          v-if="isSuggestionPending"
          class="suggestions flex gap-3 max-w-[800px] w-full"
          aria-busy="true"
          aria-live="polite"
        >
          <div
            v-for="n in 3"
            :key="n"
            class="flex h-[136px] flex-[1_0_0] rounded-xl border border-border/20 bg-bg-card/50 p-[17px] backdrop-blur-sm"
          >
            <div class="w-full space-y-2 animate-pulse">
              <div class="h-4 w-5/6 rounded bg-border/40"></div>
              <div class="h-4 w-4/6 rounded bg-border/30"></div>
              <div class="h-4 w-3/6 rounded bg-border/20"></div>
            </div>
          </div>
        </div>

        <div v-else class="suggestions flex overflow-auto gap-3 max-w-[800px] w-full pt-1">
          <div
            v-for="(suggestion, idx) in suggestions"
            :key="idx"
            :style="{ animationDelay: `${0.08 * Number(idx)}s` }"
            @click="handleSuggestionClick(suggestion)"
            class="suggestion-card group flex min-w-[160px] h-[100px] items-center flex-[1_0_0] cursor-pointer bg-bg-card/40 border border-border/40 backdrop-blur-md p-[15px] rounded-2xl hover:bg-bg-surface hover:border-accent/40 hover:shadow-sm hover:shadow-accent/15 hover:-translate-y-0.5  transition-all duration-400"
          >
            <span
              class="text-text-secondary line-clamp-3 text-sm font-normal leading-5 group-hover:text-text-primary transition-colors duration-300 max-md:static max-md:w-auto max-md:h-auto"
            >
              {{ suggestion.description }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Manual path -->
    <div class="ideal-enter ideal-enter-4 w-full max-w-[800px] mx-auto">
      <div class="flex w-full text-xs text-text-secondary/70 items-center gap-4">
        <hr class="flex-auto border-border/60" />
        <span class="font-medium tracking-widest uppercase text-[10px]">or</span>
        <hr class="flex-auto border-border/60" />
      </div>

      <Transition name="manual-reveal" appear>
        <div v-if="showManualSection" class="mt-5">
          <button
            type="button"
            class="manual-btn group w-full flex items-center justify-center gap-3 rounded-2xl border border-border/60 bg-bg-card/30 px-5 py-4 text-sm font-medium text-text-primary backdrop-blur-md transition-all duration-400 hover:border-accent/50 hover:bg-bg-surface hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--accent)_15%,transparent)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            :class="{ 'manual-btn--ready': manualTypingDone }"
            @click="mannualHandler"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/80 bg-bg-surface text-accent shadow-sm transition-transform duration-400 group-hover:scale-110 group-hover:border-accent/40 group-hover:shadow-accent/20"
            >
              <i class="fa-solid fa-sliders text-sm"></i>
            </span>
            <span class="flex items-center min-h-[1.25rem]">
              <span>{{ manualLabelDisplayed }}</span>
              <span
                v-if="!manualTypingDone"
                class="typing-caret typing-caret--btn ml-0.5"
                aria-hidden="true"
              >|</span>
            </span>
            <i
              class="fa-solid fa-arrow-right text-[13px] text-text-secondary/60 ml-auto transition-all duration-400 group-hover:translate-x-1 group-hover:text-accent"
              :class="{ 'opacity-0': !manualTypingDone, 'opacity-100': manualTypingDone }"
            ></i>
          </button>
          <p
            class="text-center text-[11px] text-text-secondary/60 mt-2.5 transition-opacity duration-500"
            :class="manualTypingDone ? 'opacity-100' : 'opacity-0'"
          >
            Prefer full control? Set up lanes, roles, and details step by step.
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import AudioRecorder from '../components/AudioRecorder.vue';
import { toast } from 'vue-sonner';
import { useCreateWorkspaceWithAIPrivate, useDescription, useSuggestions } from '../../../queries/useWorkspace';
import { useRoute } from 'vue-router';
import Loader from '../../../components/ui/Loader.vue';
import { useWorkspaceStore } from '../../../stores/workspace';

const workspaceStore = useWorkspaceStore();
const route = useRoute();
const { data: suggestions, isPending: isSuggestionPending } = useSuggestions('workspace');
const { data: descriptionData, isSuccess } = useDescription();

const hasId = computed(() => Boolean(route.params.id));
const autoTriggered = ref(false);
const allLoaded = computed(() => !hasId.value || isSuccess.value);

watch(
  allLoaded,
  (ready) => {
    if (ready && !autoTriggered.value && hasId.value) {
      description.value = descriptionData.value?.data ?? '';
      handleGenerate();
      autoTriggered.value = true;
    }
  },
  { immediate: true },
);

const description = ref('');
const isRecording = ref(false);
const audioURL = ref<string | null>(null);
const isFocused = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const badgeStyle = {
  color: 'var(--accent)',
  background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
  borderColor: 'color-mix(in srgb, var(--accent) 28%, transparent)',
};

// Rotating placeholder (textarea)
const staticPrefix = 'Ask Orchit AI to ';
const placeholderSuffixes = [
  'create a product launch workspace...',
  'plan a marketing campaign...',
  'organize an engineering sprint...',
  'build a client onboarding flow...',
  'structure a design review process...',
];
const animatedPlaceholder = ref(staticPrefix);
const currentPlaceholderIndex = ref(0);
let typingInterval: ReturnType<typeof setInterval> | null = null;
let erasingInterval: ReturnType<typeof setInterval> | null = null;
let delayTimeout: ReturnType<typeof setTimeout> | null = null;

function clearPlaceholderTimers() {
  if (typingInterval) clearInterval(typingInterval);
  if (erasingInterval) clearInterval(erasingInterval);
  if (delayTimeout) clearTimeout(delayTimeout);
  typingInterval = erasingInterval = delayTimeout = null;
}

function typePlaceholder() {
  const suffix = placeholderSuffixes[currentPlaceholderIndex.value];
  let charIndex = 0;
  typingInterval = setInterval(() => {
    if (charIndex < suffix.length) {
      animatedPlaceholder.value = staticPrefix + suffix.substring(0, charIndex + 1);
      charIndex++;
    } else {
      if (typingInterval) clearInterval(typingInterval);
      delayTimeout = setTimeout(erasePlaceholder, 2200);
    }
  }, 42);
}

function erasePlaceholder() {
  const suffix = placeholderSuffixes[currentPlaceholderIndex.value];
  let charIndex = suffix.length;
  erasingInterval = setInterval(() => {
    if (charIndex > 0) {
      animatedPlaceholder.value = staticPrefix + suffix.substring(0, charIndex - 1);
      charIndex--;
    } else {
      if (erasingInterval) clearInterval(erasingInterval);
      currentPlaceholderIndex.value =
        (currentPlaceholderIndex.value + 1) % placeholderSuffixes.length;
      delayTimeout = setTimeout(typePlaceholder, 400);
    }
  }, 28);
}

// Manual button typing
const MANUAL_LABEL = 'Create Manually';
const manualLabelDisplayed = ref('');
const showManualSection = ref(false);
const manualTypingDone = ref(false);
let manualTypingTimeouts: ReturnType<typeof setTimeout>[] = [];

function typeManualLabel() {
  manualTypingTimeouts.forEach(clearTimeout);
  manualTypingTimeouts = [];
  manualLabelDisplayed.value = '';
  manualTypingDone.value = false;
  MANUAL_LABEL.split('').forEach((char, index) => {
    const t = setTimeout(() => {
      manualLabelDisplayed.value += char;
      if (index === MANUAL_LABEL.length - 1) {
        manualTypingDone.value = true;
      }
    }, index * 55);
    manualTypingTimeouts.push(t);
  });
}

const { mutate: generate, isPending } = useCreateWorkspaceWithAIPrivate({
  onSuccess: (aiResponse: any) => {
    workspaceStore.setWorkspace(aiResponse);
    emit('manual');
  },
  onError: (error: any) => {
    toast.error('Something went wrong', error);
  },
});

const typingTimeouts: ReturnType<typeof setTimeout>[] = [];

function typeEffect(text: string) {
  typingTimeouts.forEach(clearTimeout);
  typingTimeouts.length = 0;
  description.value = '';
  const chars = text.split('');
  chars.forEach((char, index) => {
    const timeout = setTimeout(() => {
      description.value += char;
    }, index * 25);
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
  localStorage.setItem('mannualWorkspace', 'false');
  typePlaceholder();
  delayTimeout = setTimeout(() => {
    showManualSection.value = true;
    typeManualLabel();
  }, 1100);
});

onUnmounted(() => {
  clearPlaceholderTimers();
  manualTypingTimeouts.forEach(clearTimeout);
  typingTimeouts.forEach(clearTimeout);
});

function mannualHandler() {
  localStorage.setItem('mannualWorkspace', 'true');
  workspaceStore.setWorkspace(null);
  localStorage.removeItem('jobId');
  emit('manual', 'mannual');
}

function handleSuggestionClick(suggestion: { description: string }) {
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

<style scoped>
.ideal-enter {
  opacity: 0;
  animation: slideUpFade 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.ideal-enter-1 {
  animation-delay: 0.05s;
}
.ideal-enter-2 {
  animation-delay: 0.15s;
}
.ideal-enter-4 {
  animation-delay: 0.45s;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.ai-input-shell { 
  backdrop-filter: blur(5px);
  background: var(--bg-input, var(--color-bg-input));
  border: 1px solid color-mix(in srgb, var(--border) 80%, transparent);
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}
.ai-input-shell:focus-within {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border)); 
}

.suggestion-card {
  animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
.suggestion-card:hover {
  transform: translateY(-2px);
}

.typing-caret {
  display: inline-block;
  margin-left: 1px;
  color: var(--accent);
  font-weight: 300;
  animation: caretBlink 0.9s step-end infinite;
}
.typing-caret--btn {
  font-size: 0.95em;
}

@keyframes caretBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

.manual-reveal-enter-active {
  transition:
    opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.55s cubic-bezier(0.16, 1, 0.3, 1);
}
.manual-reveal-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.manual-btn {
  opacity: 0.92;
}
.manual-btn--ready {
  opacity: 1;
  animation: manualGlow 2.4s ease-in-out 0.2s 1;
}
@keyframes manualGlow {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 0%, transparent);
  }
  40% {
    box-shadow: 0 8px 28px color-mix(in srgb, var(--accent) 18%, transparent);
  }
  100% {
    box-shadow: none;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.rotate-fade-enter-active,
.rotate-fade-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
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
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 45%, transparent);
  }
  70% {
    box-shadow: 0 0 0 16px color-mix(in srgb, var(--accent) 0%, transparent);
  }
  100% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 0%, transparent);
  }
}
</style>
