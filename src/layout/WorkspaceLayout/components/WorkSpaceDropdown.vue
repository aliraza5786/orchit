<template>
  <div class="relative mb-4">
    <!-- Logo + Title -->
    <button
      ref="logoBtnRef"
      class="flex items-center justify-between px-2 py-1.5 cursor-pointer rounded-md w-full  border-border-input  hover:shadow-md border hover:border-accent"
      aria-haspopup="menu"
      :aria-expanded="logoMenuOpen ? 'true' : 'false'"
      @click="toggleLogoMenu"
      @keydown.down.prevent="openAndFocusFirst"
      @keydown.enter.prevent="toggleLogoMenu"
      @keydown.space.prevent="toggleLogoMenu"
    >
      <div class="flex items-center">
        <img
          :src="workspace?.logo ?? dp"
          alt="Workspace menu"
          class="w-[20px] shadow-2xl rounded-full h-[20px] cursor-pointer aspect-square object-cover"
        />
        <h3
          class="text-md text-left font-medium max-w-43 text-nowrap overflow-hidden text-ellipsis text-text-primary ms-2"
          :class="expanded ? 'hidden sm:block' : 'hidden'"
        >
          {{ workspace?.variables?.title }}
        </h3>
      </div>

      <svg
        class="w-4 h-4 opacity-70 transition-transform duration-200 ms-1 mt-1"
        :class="logoMenuOpen ? 'rotate-180' : 'rotate-0'"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fill-rule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    <!-- Dropdown -->
    <Transition name="fade-scale" @after-leave="logoBtnRef?.focus()">
      <div
        v-show="logoMenuOpen"
        ref="menuRef"
        class="fixed top-25 left-[11px] z-50 mt-2 w-72 rounded-md border border-border shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-bg-body/60 bg-bg-body origin-top-left"
        role="menu"
        aria-label="Workspace switcher"
        @keydown.esc.stop.prevent="closeLogoMenu"
      >
        <!-- Home -->
        <button
          class="w-full px-3 py-2 cursor-pointer text-left text-sm hover:bg-bg-card/70 rounded-t-xl flex items-center gap-2"
          role="menuitem"
          @click="goHome"
          ref="firstItemRef"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
            />
          </svg>
          Home
        </button>

        <div class="my-1 h-px bg-border"></div>

        <!-- Workspaces -->
        <div class="max-h-72 py-1 cursor-pointer">
          <button
            v-for="ws in workspaces?.workspaces"
            :key="ws._id"
            class="w-full px-3 py-2 text-left text-sm hover:bg-bg-card/70 cursor-pointer flex items-center gap-3"
            role="menuitem"
            @click="switchTo(ws)"
          >
            <img
              :src="ws.logo ?? dp"
              alt=""
              class="w-6 h-6 rounded object-contain bg-white"
            />
            <span class="flex-1 line-clamp-1">{{
              ws?.variables?.title ?? "Untitled workspace"
            }}</span>
            <span
              v-if="ws._id === workspaceId"
              class="text-xs px-2 py-0.5 rounded-full border border-border"
            >
              Current
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import dp from "../../../assets/global/dummy.jpeg";
import { useRouter } from "vue-router";
import {
  useWorkspaces,
  useSingleWorkspace,
} from "../../../queries/useWorkspace";
import { useWorkspaceId } from "../../../composables/useQueryParams";
import { useQueryClient } from "@tanstack/vue-query";

const props = defineProps<{
  expanded?: boolean;
}>();

// Internal states & refs
const logoMenuOpen = ref(false);
const logoBtnRef = ref<HTMLButtonElement | null>(null);
const menuRef = ref<HTMLDivElement | null>(null);
const firstItemRef = ref<HTMLButtonElement | null>(null);

const { workspaceId } = useWorkspaceId();
const { data: workspaces } = useWorkspaces(1, 30);
const { refetch, data: workspace } = useSingleWorkspace(workspaceId.value);
const router = useRouter();
const queryClient = useQueryClient();

// Dropdown logic
const toggleLogoMenu = async () => {
  logoMenuOpen.value = !logoMenuOpen.value;
  if (logoMenuOpen.value) await nextTick(), firstItemRef.value?.focus();
};
const closeLogoMenu = () => (
  (logoMenuOpen.value = false), logoBtnRef.value?.focus()
);
const openAndFocusFirst = async () => {
  if (!logoMenuOpen.value) toggleLogoMenu();
  firstItemRef.value?.focus();
};

// Close on outside click or window blur
const onDocClick = (e: MouseEvent) => {
  if (!logoMenuOpen.value) return;
  const target = e.target as Node;
  if (
    menuRef.value &&
    !menuRef.value.contains(target) &&
    logoBtnRef.value &&
    !logoBtnRef.value.contains(target)
  )
    closeLogoMenu();
};
const onWindowBlur = () => {
  if (logoMenuOpen.value) closeLogoMenu();
};

onMounted(() => {
  document.addEventListener("click", onDocClick);
  window.addEventListener("blur", onWindowBlur);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
  window.removeEventListener("blur", onWindowBlur);
});

// Actions
const goHome = () => (closeLogoMenu(), router.push({ path: "/" }));
const switchTo = async (ws: any) => {
  router.push(`/workspace/peak/${ws._id}/${ws.LatestTask?.job_id ?? ""}`);
  queryClient.invalidateQueries({ queryKey: ["workspaces", "byId"] });
  refetch(), closeLogoMenu();
};
</script>

<style scoped>
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
  will-change: opacity, transform;
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.98);
}
</style>
