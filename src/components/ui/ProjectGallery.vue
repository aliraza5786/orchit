<template>
  <!-- Cards -->
  <section v-if="!loading && projects?.length"
    class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
    :aria-busy="loading ? 'true' : 'false'" aria-live="polite">
    <article v-for="(project, index) in projects" :key="project._id ?? index"
      class="group relative overflow-hidden rounded-xl cursor-pointer border border-border/70 bg-bg-card shadow-sm outline-none transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-orange-300">
      <!-- Click surface -->
      <button type="button" class="absolute inset-0 z-10" @click="onClick(project)"
        :aria-label="`Open project ${displayTitle(project)}`" />
      <!-- Top banner with simple gradient -->
      <div class="flex h-39 items-center justify-center"
        :style="{ background: bannerBackground(project) }">
        <img :src="project.logo" class="aspect-square h-10 w-10 rounded-md object-cover" alt="" loading="lazy"
          decoding="async" />
      </div>

      <!-- Meta -->
      <div class="flex justify-between gap-2.5 border-t border-border bg-bg-card p-3.5 text-sm">
        <div class="flex items-start gap-2.5">
             <img :src="project.logo" class="h-6 w-6 rounded-md object-cover" alt="" loading="lazy" decoding="async" />
             <div class="min-w-0">
                <h3 class="truncate text-sm font-medium text-text-primary w-20">{{ displayTitle(project) }}</h3>
                <p class="truncate text-xs text-text-secondary">{{ formatWhen(project.created_at) }}</p>
             </div>
        </div>
        <div>
           <h3 class="truncate text-sm font-medium text-text-primary w-30 text-end">{{ project.owner?.name }}</h3> 
            <p class="truncate text-xs text-text-secondary text-end">Workspace Owner</p>

        </div>
      </div>

    </article>
  </section>

  <!-- Skeletons -->
  <section v-else-if="loading" class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
    <div v-for="n in resolvedSkeletonCount" :key="'sk-' + n"
      class="overflow-hidden rounded-xl border border-border/70 bg-bg-card shadow-sm" role="status"
      aria-label="Loading project">
      <div
        class="h-39 bg-[linear-gradient(90deg,theme(colors.slate.200/20),theme(colors.slate.200/40),theme(colors.slate.200/20))] bg-[length:200%_100%] animate-[shimmer_1.1s_ease_infinite]" />
      <div class="flex items-start gap-2.5 border-t border-border p-3.5 text-sm">
        <div class="h-6 w-6 rounded-md bg-surface"></div>
        <div class="flex w-full flex-col gap-2">
          <div class="h-3 w-32 rounded bg-surface"></div>
          <div class="h-2.5 w-20 rounded bg-surface"></div>
        </div>
      </div>
    </div>
  </section>

  <!-- Empty state -->
  <div v-else class="col-span-full flex items-center justify-center py-10 text-sm text-text-secondary">
    No projects yet
  </div>
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
}

const props = withDefaults(defineProps<{ projects: Project[]; loading?: boolean; skeletonCount?: number }>(), {
  loading: false,
  skeletonCount: 8,
})

const router = useRouter()

/* ---------- UX helpers ---------- */
const resolvedSkeletonCount = computed(() => props.skeletonCount ?? 8)
const displayTitle = (p: Project) => p?.variables?.title || p?.title || 'Untitled'

function formatWhen(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(+d)) return '—'
  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  return fmt.format(d)
}

/* ---------- Simple color generation (no extraction) ---------- */
function hashedColor(seed: string): string {
  let h = 0
  for (let i = 0; i < (seed?.length || 0); i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  return `linear-gradient(135deg, hsl(${hue} 55% 55%), hsl(${hue} 60% 48%))`
}

// Simple banner background using hash-based color
function bannerBackground(p: Project) {
  return hashedColor(displayTitle(p))
}

/* ---------- Navigation ---------- */
function onClick(p: Project) {
  const job = p?.LatestTask?.job_id
  if (job) localStorage.setItem('jobId', job)
  else localStorage.removeItem('jobId')
  router.push(`/workspace/peak/${p._id}/${job ?? ''}`)
}

</script>
