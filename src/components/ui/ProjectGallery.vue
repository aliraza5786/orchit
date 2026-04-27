<template>
  <!-- Cards -->
  <section
    v-if="!loading && projects?.length"
    class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
    :aria-busy="loading ? 'true' : 'false'"
    aria-live="polite"
  >
    <article
      v-for="(project, index) in projects"
      :key="project._id ?? index"
      class="group relative overflow-hidden rounded-xl cursor-pointer border border-border/70 bg-bg-card shadow-sm outline-none transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 focus-within:ring-2 focus-within:ring-orange-300"
    >
      <!-- Click surface -->
      <button
        type="button"
        class="absolute inset-0 z-10"
        @click="onClick(project)"
        :aria-label="`Open project ${displayTitle(project)}`"
      />

      <!-- Top banner -->
      <div
        class="relative flex h-36 items-center justify-center overflow-hidden"
        :style="{ background: bannerBackground(project) }"
      >
        <img
          :src="project.logo"
          class="aspect-square h-12 w-12 rounded-xl object-cover shadow-lg ring-2 ring-white/20"
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>

      <!-- Meta -->
      <div class="flex flex-col gap-3 border-t border-border bg-bg-card p-3.5">

        <!-- Row 1: logo + title + owner -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <img
              :src="project.logo"
              class="h-7 w-7 flex-shrink-0 rounded-md object-cover"
              alt=""
              loading="lazy"
              decoding="async"
            />
            <div class="min-w-0">
              <h3 class="truncate text-sm font-semibold text-text-primary leading-tight">
                {{ displayTitle(project) }}
              </h3>
              <p class="truncate text-[11px] text-text-secondary leading-tight mt-0.5">
                {{ formatWhen(project.created_at) }}
              </p>
            </div>
          </div>

          <div class="flex-shrink-0 text-right">
            <p class="truncate text-xs font-medium text-text-primary max-w-[90px]">
              {{ project.owner?.name }}
            </p>
            <p class="text-[11px] text-text-secondary">Owner</p>
          </div>
        </div>

        <!-- Row 2: Progress bar -->
        <div class="flex items-center gap-2">
          <div class="flex-1 h-1.5 rounded-full bg-bg-secondary overflow-hidden">
            <div
              class="h-full rounded-full bg-orange-500 transition-all duration-500"
              :style="{ width: `${project.task_stats?.total_percentage ?? 0}%` }"
            />
          </div>
          <span class="flex-shrink-0 text-[11px] font-medium text-text-secondary w-8 text-right">
            {{ project.task_stats?.total_percentage ?? 0 }}%
          </span>
        </div>

      </div>
    </article>
  </section>

  <!-- Skeletons -->
  <section
    v-else-if="loading"
    class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
  >
    <div
      v-for="n in resolvedSkeletonCount"
      :key="'sk-' + n"
      class="overflow-hidden rounded-xl border border-border/70 bg-bg-card shadow-sm"
      role="status"
      aria-label="Loading project"
    >
      <div
        class="h-36 bg-[linear-gradient(90deg,theme(colors.slate.200/20),theme(colors.slate.200/40),theme(colors.slate.200/20))] bg-[length:200%_100%] animate-[shimmer_1.1s_ease_infinite]"
      />
      <div class="flex flex-col gap-3 border-t border-border p-3.5">
        <div class="flex items-center gap-2.5">
          <div class="h-7 w-7 flex-shrink-0 rounded-md bg-surface"></div>
          <div class="flex flex-col gap-1.5 flex-1">
            <div class="h-3 w-28 rounded bg-surface"></div>
            <div class="h-2 w-20 rounded bg-surface"></div>
          </div>
          <div class="flex flex-col gap-1.5 items-end">
            <div class="h-3 w-16 rounded bg-surface"></div>
            <div class="h-2 w-10 rounded bg-surface"></div>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <div class="h-1.5 flex-1 rounded-full bg-surface"></div>
          <div class="h-2 w-6 rounded bg-surface"></div>
        </div>
      </div>
    </div>
  </section>

  <!-- Empty state -->
  <div
    v-else
    class="col-span-full flex items-center justify-center py-10 text-sm text-text-secondary"
  >
    No projects yet
  </div>
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

interface Project {
  _id: string
  variables?: { title?: string }
  title?: string
  logo: string
  created_at?: string
  LatestTask?: { job_id?: string }
  owner?: { name: string }
  task_stats?: { total_percentage?: number }
}

const props = withDefaults(
  defineProps<{ projects: Project[]; loading?: boolean; skeletonCount?: number }>(),
  { loading: false, skeletonCount: 8 }
)

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
  return `linear-gradient(135deg, hsl(${hue} 55% 55%), hsl(${hue} 60% 48%))`
}

function bannerBackground(p: Project) {
  return hashedColor(displayTitle(p))
}

function onClick(p: Project) {
  const job = p?.LatestTask?.job_id
  if (job) localStorage.setItem('jobId', job)
  else localStorage.removeItem('jobId')
  router.push(`/workspace/peak/${p._id}/${job ?? ''}`)
}
</script>