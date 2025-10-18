<template>
  <!-- Cards (with transitions) -->
  <TransitionGroup v-if="!loading && projects?.length" name="card" tag="section"
    class="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4" appear
    :aria-busy="loading ? 'true' : 'false'" aria-live="polite">
    <article v-for="(project, index) in projects" :key="project._id ?? index"
      class="group relative overflow-hidden rounded-xl  cursor-pointer  border border-border/70 bg-bg-card shadow-sm outline-none transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-orange-300">
      <!-- Click surface -->
      <button type="button" class="absolute inset-0 z-10" @click="onClick(project)"
        :aria-label="`Open project ${displayTitle(project)}`" />
      <!-- Top banner -->
      <div class="flex h-39 items-center justify-center transition-colors"
        :style="{ background: bannerBackground(project) }">
        <img :src="project.logo" class="aspect-square h-10 w-10 rounded-md object-cover" alt="" loading="lazy"
          decoding="async" @load.once="queueColorExtraction(project)"
          @error="() => markColor(project, hashedColor(displayTitle(project)))" />
      </div>

      <!-- Meta -->
      <div class="flex items-start gap-2.5 border-t border-border bg-bg-card p-3.5 text-sm">
        <img :src="project.logo" class="h-6 w-6 rounded-md object-cover" alt="" loading="lazy" decoding="async" />
        <div class="min-w-0">
          <h3 class="truncate text-sm font-medium text-text-primary">{{ displayTitle(project) }}</h3>
          <p class="truncate text-xs text-text-secondary">{{ formatWhen(project.lastUpdated) }}</p>
        </div>
      </div>
    </article>
  </TransitionGroup>

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
.card-enter-from,
.card-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

.card-enter-active,
.card-leave-active {
  transition: all 160ms ease;
}

.card-move {
  transition: transform 160ms ease;
}

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
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

interface Project {
  _id: string
  variables?: { title?: string }
  title?: string
  logo: string
  lastUpdated?: string
  LatestTask?: { job_id?: string }
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

/* ---------- Color extraction (lazy + cached) ---------- */
const colorMap = ref<Record<string, string>>({})

function hashedColor(seed: string): string {
  let h = 0
  for (let i = 0; i < (seed?.length || 0); i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  return `linear-gradient(180deg, hsl(${hue} 60% 58%), hsl(${hue} 60% 52%))`
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function extractDominantColorFromImg(img: HTMLImageElement): string | null {
  try {
    const size = 48
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d', { willReadFrequently: true })!
    c.width = size
    c.height = size
    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)
    const buckets: Record<string, number> = {}
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 24) continue
      const r4 = data[i] >> 4
      const g4 = data[i + 1] >> 4
      const b4 = data[i + 2] >> 4
      const key = `${r4},${g4},${b4}`
      buckets[key] = (buckets[key] || 0) + 1
    }
    let best = ''
    let count = -1
    for (const k in buckets) if (buckets[k] > count) (count = buckets[k], best = k)
    if (!best) return null
    const [r4, g4, b4] = best.split(',').map(Number)
    const r = (r4 << 4) | r4
    const g = (g4 << 4) | g4
    const b = (b4 << 4) | b4
    return rgbToHex(r, g, b)
  } catch {
    return null
  }
}

function markColor(p: Project, color: string) {
  if (!p?.logo) return
  colorMap.value = { ...colorMap.value, [p.logo]: color }
}

// build banner CSS from cached or hashed
function bannerBackground(p: Project) {
  const key = p.logo
  const raw = key ? colorMap.value[key] : undefined
  if (raw && raw.startsWith('#')) return `linear-gradient(180deg, ${raw}, ${raw})`
  if (raw) return raw
  return hashedColor(displayTitle(p))
}

// queue extraction on first load of the specific image element
function queueColorExtraction(p: Project) {
  if (!p?.logo || colorMap.value[p.logo]) return
  const img = event?.target as HTMLImageElement | undefined
  if (!img) return
  requestIdleCallback?.(() => {
    const hex = extractDominantColorFromImg(img)
    markColor(p, hex || hashedColor(displayTitle(p)))
  }, { timeout: 600 })
}

/* ---------- Navigation ---------- */
function onClick(p: Project) {
  const job = p?.LatestTask?.job_id
  if (job) localStorage.setItem('jobId', job)
  else localStorage.removeItem('jobId')
  router.push(`/workspace/peak/${p._id}/${job ?? ''}`)
}

/* cleanup (nothing persistent here, but keep pattern ready) */
onMounted(() => { })
onBeforeUnmount(() => { })
</script>
