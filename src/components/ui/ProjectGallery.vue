<template>
  <AnimatePresence mode="wait">
    <div
      v-if="!loading && safeProjects.length"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
      :aria-busy="loading ? 'true' : 'false'"
      aria-live="polite"
    >
      <Motion
        v-for="(project, index) in safeProjects"
        :key="project._id ?? index"
        as="article"
        :initial="{ opacity: 0, y: 20, scale: 0.97 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :transition="{ duration: 0.35, delay: index * 0.055, ease: 'easeOut' }"
        :while-hover="{
          scale: 1.015,
          y: -5,
          transition: { duration: 0.25, ease: 'easeOut' },
        }"
        class="group relative flex flex-col rounded-2xl border border-border bg-bg-card transition-all duration-300 hover:border-accent/40 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        <!-- Card content below -->

        <!-- Banner -->
        <div
          class="relative flex h-24 items-center justify-center px-3 overflow-hidden cursor-pointer group/banner"
          :style="{ background: bannerBackground(project) }"
          @click="onClick(project)"
        >
          <!-- Type Badge -->
          <Motion
            :initial="{ opacity: 0, x: -10 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.3, delay: index * 0.055 + 0.15 }"
            class="absolute top-2 left-3"
          >
            <span
              class="rounded-md bg-white/20 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white border border-white/20"
            >
              {{
                project.variables?.["workspace-type"] === "team"
                  ? "Organization"
                  : (project.variables?.["workspace-type"] ?? "Project")
              }}
            </span>
          </Motion>

          <!-- Actions -->
          <div
            class="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <button
              v-if="project.is_shared_with_me === false"
              @click.stop="$emit('share', project)"
              class="h-7 w-7 flex items-center justify-center rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors border border-white/20 shadow-sm"
              title="Share"
            >
              <i class="fa-regular fa-share-nodes text-xs"></i>
            </button>
            <button
              @click.stop="$emit('archive', project)"
              class="h-7 w-7 flex items-center justify-center rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-colors border border-white/20 shadow-sm"
              :title="project.is_archive ? 'Unarchive' : 'Archive'"
            >
              <i
                :class="[
                  project.is_archive
                    ? 'fa-solid fa-box-archive'
                    : 'fa-regular fa-box-archive',
                  'text-xs',
                ]"
              ></i>
            </button>
            <button
              @click.stop="$emit('delete', project)"
              class="h-7 w-7 flex items-center justify-center rounded-lg bg-white/20 backdrop-blur-md text-white hover:bg-red-500/80 transition-colors border border-white/20 shadow-sm"
              title="Delete"
            >
              <i class="fa-regular fa-trash-can text-xs"></i>
            </button>
          </div>

          <!-- Logo -->
          <Motion
            :initial="{ opacity: 0, scale: 0.65 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{
              duration: 0.3,
              delay: index * 0.055 + 0.2,
              ease: 'easeOut',
            }"
          >
            <div
              v-if="!project.logo"
              class="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/30 shadow-lg"
              :style="{
                backgroundColor:
                  project.variables?.['workspace-color'] || '#3b82f6',
              }"
            >
              {{ getInitials(displayTitle(project)) }}
            </div>
            <img
              v-else
              :src="project.logo"
              class="h-12 w-12 rounded-xl object-cover ring-2 ring-white/30 shadow-lg bg-white"
              alt=""
              loading="lazy"
              decoding="async"
            />
          </Motion>
        </div>

        <!-- Body -->
        <div class="flex flex-col gap-2.5 p-3 relative z-10">
          <Motion
            :initial="{ opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: index * 0.055 + 0.18 }"
            class="min-w-0"
          >
            <div class="flex items-start justify-between gap-2">
              <h3
                class="truncate text-[14px] font-bold text-text-primary leading-tight hover:text-accent transition-colors cursor-pointer"
                @click="onClick(project)"
              >
                {{ displayTitle(project) }}
              </h3>
            </div>
            <p
              class="mt-1 text-[10px] text-text-secondary flex items-center gap-1.5 font-medium uppercase tracking-wider"
            >
              <i class="fa-regular fa-calendar-days text-[9px]"></i>
              {{ formatWhen(project.created_at) }}
            </p>
          </Motion>

          <div class="h-px w-full bg-border/40" />

          <Motion
            :initial="{ opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: index * 0.055 + 0.22 }"
            class="flex items-center gap-2"
          >
            <div
              class="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20"
              :style="{
                backgroundColor: avatarColor(project.owner?.name ?? ''),
              }"
            >
              {{ getInitials(project.owner?.name ?? "") }}
            </div>
            <div
              class="flex flex-col min-w-0 flex-1 cursor-pointer group/owner"
              @click="onClick(project)"
            >
              <span
                class="truncate text-[12px] text-text-primary font-bold group-hover/owner:text-accent transition-colors"
              >
                {{ project.owner?.name ?? "—" }}
              </span>
              <span
                class="text-[9px] text-text-secondary font-medium uppercase tracking-tight"
                >Workspace Owner</span
              >
            </div>

            <!-- Collaborators -->
            <Collaborators
              v-if="project.People?.length"
              :people="project.People"
              :count="project.PeopleCount || 0"
              size="xs"
            />
          </Motion>

          <!-- Tasks & Progress Info -->
          <Motion
            :initial="{ opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: index * 0.055 + 0.24 }"
            class="flex items-center justify-between text-[10px] font-bold"
          >
            <div class="flex items-center gap-1.5 text-text-secondary">
              <i class="fa-regular fa-circle-check text-[11px]"></i>
              <span
                >{{ project.task_stats?.completed_tasks ?? 0 }}/{{
                  project.task_stats?.total_tasks ?? 0
                }}
                Tasks</span
              >
            </div>
            <span
              :style="{
                color:
                  project.variables?.['workspace-color'] || 'var(--accent)',
              }"
            >
              {{ project.task_stats?.total_percentage ?? 0 }}%
            </span>
          </Motion>

          <Motion
            :initial="{ opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: index * 0.055 + 0.26 }"
            class="w-full"
          >
            <div
              class="h-[6px] w-full rounded-full bg-bg-body overflow-hidden border border-border/10"
            >
              <Motion
                :initial="{ width: '0%' }"
                :animate="{
                  width: `${project.task_stats?.total_percentage ?? 0}%`,
                }"
                :transition="{
                  duration: 0.8,
                  delay: index * 0.055 + 0.45,
                  ease: [0.34, 1.56, 0.64, 1],
                }"
                class="h-full rounded-full shadow-[0_0_10px_-2px_rgba(0,0,0,0.2)]"
                :style="{
                  backgroundColor:
                    project.variables?.['workspace-color'] || 'var(--accent)',
                }"
              />
            </div>
          </Motion>
        </div>
      </Motion>
    </div>

    <!-- Skeletons -->
    <div
      v-else-if="loading"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
    >
      <Motion
        v-for="n in resolvedSkeletonCount"
        :key="'sk-' + n"
        as="div"
        :initial="{ opacity: 0, y: 12 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ duration: 0.25, delay: n * 0.04 }"
        class="overflow-hidden rounded-xl border border-border/70 bg-bg-card"
        role="status"
        aria-label="Loading project"
      >
        <div
          class="h-20 bg-[linear-gradient(90deg,theme(colors.slate.200/20),theme(colors.slate.200/40),theme(colors.slate.200/20))] bg-[length:200%_100%] animate-[shimmer_1.1s_ease_infinite]"
        />
        <div class="flex flex-col gap-2.5 p-3">
          <div class="flex flex-col gap-1.5">
            <div class="h-3 w-28 rounded bg-surface" />
            <div class="h-2 w-20 rounded bg-surface" />
          </div>
          <div class="h-px w-full bg-border/60" />
          <div class="flex items-center gap-2">
            <div
              class="h-[22px] w-[22px] rounded-full bg-surface flex-shrink-0"
            />
            <div class="h-2.5 flex-1 rounded bg-surface" />
            <div class="h-2 w-8 rounded bg-surface" />
          </div>
          <div class="flex items-center gap-2">
            <div class="h-[5px] flex-1 rounded-full bg-surface" />
            <div class="h-2 w-6 rounded bg-surface" />
          </div>
        </div>
      </Motion>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="col-span-full flex flex-col items-center justify-center gap-3 py-20 text-center"
    >
      <div
        class="grid h-14 w-14 place-items-center rounded-2xl bg-bg-card border border-border/70"
      >
        <i class="fa-regular fa-folder-open text-xl text-text-secondary"></i>
      </div>
      <div class="flex flex-col gap-1">
        <p class="text-sm font-medium text-text-primary">{{ emptyMessage }}</p>
        <p class="text-xs text-text-secondary">
          {{
            filter === "all"
              ? "Get started by creating your first workspace."
              : "Try switching to a different filter."
          }}
        </p>
      </div>
    </div>
  </AnimatePresence>
</template>

<style scoped>
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>

<script setup lang="ts">
import { computed, watchEffect } from "vue";
import { useRouter } from "vue-router";
import { Motion, AnimatePresence } from "motion-v";
import Collaborators from "./Collaborators.vue";

interface Project {
  _id: string;
  variables?: {
    title?: string;
    "workspace-type"?: string;
    "workspace-color"?: string;
  };
  title?: string;
  logo: string;
  created_at?: string;
  LatestTask?: { job_id?: string };
  owner?: { name: string };
  People?: any[];
  PeopleCount?: number;  
  task_stats?: { total_percentage?: number; total_tasks?: number; completed_tasks?: number; };
  is_archive: boolean;
  is_shared_with_me: boolean;
  company?: {
    _id: string;
    title: string;
    slug: string;
    domain_link: string;
    logo: string | null;
    status: string;
  };
}

defineEmits(["share", "archive", "delete"]);

const props = withDefaults(
  defineProps<{
    projects: Project[];
    loading?: boolean;
    skeletonCount?: number;
    filter?: string;
  }>(),
  { loading: false, skeletonCount: 8 },
);
const safeProjects = computed(() => props.projects || []);

watchEffect(() => {
  console.log("Projects in gallery:", props.projects);
});
const emptyMessage = computed(() => {
  switch (props.filter) {
    case "archived":
      return "No archived workspaces";
    case "deleted":
      return "No deleted workspaces";
    case "private":
      return "No private workspaces";
    case "shared":
      return "No shared workspaces";
    default:
      return "No workspaces yet — create your first one";
  }
});
const router = useRouter();

const resolvedSkeletonCount = computed(() => props.skeletonCount ?? 8);
const displayTitle = (p: Project) =>
  p?.variables?.title || p?.title || "Untitled";

function formatWhen(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function hashedColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < (seed?.length || 0); i++)
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  const hue = Math.abs(h) % 360;
  return `linear-gradient(135deg, hsl(${hue} 55% 50%), hsl(${hue} 60% 43%))`;
}

function bannerBackground(p: Project) {
  const wsColor = p.variables?.["workspace-color"];
  if (wsColor) return wsColor;
  return hashedColor(displayTitle(p));
}

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(h) % 360} 55% 48%)`;
}

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}
function onClick(p: Project) {
  const job = p?.LatestTask?.job_id;
  if (job) localStorage.setItem("jobId", job);
  else localStorage.removeItem("jobId");

  const path = `/workspace/peak/${p._id}/${job ?? ""}`;

  if (p?.company?.domain_link) {
    const domain = p.company.domain_link
      .replace("https://", "")
      .replace("http://", "");
    window.location.href = `${window.location.protocol}//${domain}${path}`;
  } else {
    router.push(path);
  }
}
</script>
