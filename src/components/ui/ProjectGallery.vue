<template>
  <AnimatePresence mode="wait">

    <Motion
      v-if="!loading && projects?.length"
      :key="'gallery-' + projects.length"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0 }"
      :transition="{ duration: 0.2 }"
      as="section"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
      :aria-busy="loading ? 'true' : 'false'"
      aria-live="polite"
    >
      <Motion
        v-for="(project, index) in projects"
        :key="project._id ?? index"
        as="article"
        :initial="{ opacity: 0, y: 20, scale: 0.97 }"
        :animate="{ opacity: 1, y: 0, scale: 1 }"
        :transition="{ duration: 0.35, delay: index * 0.055, ease: 'easeOut' }"
        :while-hover="{ y: -3, transition: { duration: 0.18 } }"
        class="group relative overflow-hidden rounded-xl cursor-pointer border border-border/70 bg-bg-card transition-colors duration-200 hover:border-border focus-within:ring-2 focus-within:ring-accent/40"
      >
        <button
          type="button"
          class="absolute inset-0 z-10"
          @click="onClick(project)"
          :aria-label="`Open project ${displayTitle(project)}`"
        />

       <!-- Banner -->
     <!-- Banner -->
<div
  class="relative flex h-24 items-center justify-center px-3 overflow-hidden"
  :style="{ background: bannerBackground(project) }"
>
  <Motion
    :initial="{ opacity: 0, x: -10 }"
    :animate="{ opacity: 1, x: 0 }"
    :transition="{ duration: 0.3, delay: index * 0.055 + 0.15 }"
    class="absolute top-1.5 left-3"
  >
    <span class="rounded-md bg-accent px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
  {{
    project.variables?.['workspace-type'] === 'team'
      ? 'Organization'
      : (project.variables?.['workspace-type'] ?? 'Project')
  }}
</span>
  </Motion>

  <Motion
    :initial="{ opacity: 0, scale: 0.65 }"
    :animate="{ opacity: 1, scale: 1 }"
    :transition="{ duration: 0.3, delay: index * 0.055 + 0.2, ease: 'easeOut' }"
  >
    <img
      :src="project.logo"
      class="h-12 w-12 rounded-xl object-cover ring-2 ring-white/30 shadow-lg"
      alt=""
      loading="lazy"
      decoding="async"
    />
  </Motion>
</div>
        <!-- Body -->
        <div class="flex flex-col gap-2.5 p-3">

          <Motion
            :initial="{ opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: index * 0.055 + 0.18 }"
            class="min-w-0"
          >
            <h3 class="truncate text-[13px] font-semibold text-text-primary leading-snug">
              {{ displayTitle(project) }}
            </h3>
            <p class="mt-0.5 text-[11px] text-text-secondary">
              {{ formatWhen(project.created_at) }}
            </p>
          </Motion>

          <div class="h-px w-full bg-border/60" />

          <Motion
            :initial="{ opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: index * 0.055 + 0.22 }"
            class="flex items-center gap-2"
          >
            <div
              class="grid h-[22px] w-[22px] flex-shrink-0 place-items-center rounded-full text-[9px] font-medium text-white"
              :style="{ backgroundColor: avatarColor(project.owner?.name ?? '') }"
            >
              {{ getInitials(project.owner?.name ?? '') }}
            </div>
            <span class="flex-1 truncate text-[12px] text-text-primary font-semibold">
              {{ project.owner?.name ?? '—' }}
            </span>
            <span class="flex-shrink-0 text-[12px] font-semibold text-text-secondary">Owner</span>
          </Motion>

          <Motion
            :initial="{ opacity: 0, y: 8 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ duration: 0.3, delay: index * 0.055 + 0.26 }"
            class="flex items-center gap-2"
          >
            <div class="flex-1 h-[5px] rounded-full bg-bg-body overflow-hidden">
              <Motion
                :initial="{ width: '0%' }"
                :animate="{ width: `${project.task_stats?.total_percentage ?? 0}%` }"
                :transition="{ duration: 0.7, delay: index * 0.055 + 0.4, ease: 'easeOut' }"
                class="h-full rounded-full bg-accent"
              />
            </div>
            <span class="flex-shrink-0 text-[11px] font-medium text-text-secondary tabular-nums w-7 text-right">
              {{ project.task_stats?.total_percentage ?? 0 }}%
            </span>
          </Motion>

        </div>
      </Motion>
    </Motion>

    <!-- Skeletons -->
    <Motion
      v-else-if="loading"
      key="skeletons"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0 }"
      :transition="{ duration: 0.2 }"
      as="section"
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
        <div class="h-20 bg-[linear-gradient(90deg,theme(colors.slate.200/20),theme(colors.slate.200/40),theme(colors.slate.200/20))] bg-[length:200%_100%] animate-[shimmer_1.1s_ease_infinite]" />
        <div class="flex flex-col gap-2.5 p-3">
          <div class="flex flex-col gap-1.5">
            <div class="h-3 w-28 rounded bg-surface" />
            <div class="h-2 w-20 rounded bg-surface" />
          </div>
          <div class="h-px w-full bg-border/60" />
          <div class="flex items-center gap-2">
            <div class="h-[22px] w-[22px] rounded-full bg-surface flex-shrink-0" />
            <div class="h-2.5 flex-1 rounded bg-surface" />
            <div class="h-2 w-8 rounded bg-surface" />
          </div>
          <div class="flex items-center gap-2">
            <div class="h-[5px] flex-1 rounded-full bg-surface" />
            <div class="h-2 w-6 rounded bg-surface" />
          </div>
        </div>
      </Motion>
    </Motion>

   <!-- Empty -->
<Motion
  v-else
  key="empty"
  :initial="{ opacity: 0, y: 10 }"
  :animate="{ opacity: 1, y: 0 }"
  :exit="{ opacity: 0, y: -10 }"
  :transition="{ duration: 0.3 }"
  class="col-span-full flex flex-col items-center justify-center gap-3 py-20 text-center"
>
  <div class="grid h-14 w-14 place-items-center rounded-2xl bg-bg-card border border-border/70">
    <i class="fa-regular fa-folder-open text-xl text-text-secondary"></i>
  </div>
  <div class="flex flex-col gap-1">
    <p class="text-sm font-medium text-text-primary">{{ emptyMessage }}</p>
    <p class="text-xs text-text-secondary">
      {{ filter === 'all' ? 'Get started by creating your first workspace.' : 'Try switching to a different filter.' }}
    </p>
  </div>
</Motion>

  </AnimatePresence>
</template>

<style scoped>
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Motion, AnimatePresence } from 'motion-v'

interface Project {
  _id: string
  variables?: { title?: string; 'workspace-type'?: string }
  title?: string
  logo: string
  created_at?: string
  LatestTask?: { job_id?: string }
  owner?: { name: string }
  task_stats?: { total_percentage?: number }
  company?: {                          // ✅ add this
    _id: string
    title: string
    slug: string
    domain_link: string
    logo: string | null
    status: string
  }
}

const props = withDefaults(
  defineProps<{ projects: Project[]; loading?: boolean; skeletonCount?: number; filter?: string    }>(),
  { loading: false, skeletonCount: 8 }
)
const emptyMessage = computed(() => {
  switch (props.filter) {
    case 'archived': return 'No archived workspaces'
    case 'deleted':  return 'No deleted workspaces'
    case 'private':  return 'No private workspaces'
    case 'shared':   return 'No shared workspaces'
    default:         return 'No workspaces yet — create your first one'
  }
})
const router = useRouter()

const resolvedSkeletonCount = computed(() => props.skeletonCount ?? 8)
const displayTitle = (p: Project) => p?.variables?.title || p?.title || 'Untitled'

function formatWhen(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(+d)) return '—'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

function hashedColor(seed: string): string {
  let h = 0
  for (let i = 0; i < (seed?.length || 0); i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  return `linear-gradient(135deg, hsl(${hue} 55% 50%), hsl(${hue} 60% 43%))`
}

function bannerBackground(p: Project) {
  return hashedColor(displayTitle(p))
}

function avatarColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return `hsl(${Math.abs(h) % 360} 55% 48%)`
}

function getInitials(name: string): string {
  return name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
}
function onClick(p: Project) {
  const job = p?.LatestTask?.job_id
  if (job) localStorage.setItem('jobId', job)
  else localStorage.removeItem('jobId')

  const path = `/workspace/peak/${p._id}/${job ?? ''}`

  if (p?.company?.domain_link) {
    const domain = p.company.domain_link.replace('https://', '').replace('http://', '')
    window.location.href = `${window.location.protocol}//${domain}${path}`
  } else {
    router.push(path)
  }
}
</script>