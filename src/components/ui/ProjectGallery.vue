<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 "
    :aria-busy="loading ? 'true' : 'false'">
    <!-- Data cards -->
    <div v-if="!loading && projects?.length" v-for="(project, index) in projects" :key="project._id ?? index"
      class="rounded-lg overflow-hidden  hover:shadow-md transition cursor-pointer" @click="onClick(project)">
      <!-- Top block uses derived color -->
      <div class="h-39 flex items-center justify-center"
        :style="{ backgroundColor: colorMap[project.logo] || hashedColor(project.title || project.logo) }">
        <img :src="project.logo" class="w-10 h-10 object-cover rounded-md aspect-square" />
      </div>

      <!-- Bottom block with name + time -->
      <div class="bg-bg-card p-3.5 text-sm flex justify-start gap-2.5 border-t border-border">
        <img :src="project.logo" class="w-6 h-6 aspect-square rounded-md" alt="" />
        <div class="flex flex-col items-start">
          <div class="font-medium text-text-primary  text-sm">{{ project?.variables.title }}</div>
          <div class="text-xs text-text-secondary ">{{ project.lastUpdated }}</div>
        </div>
      </div>
    </div>

    <!-- Skeleton cards -->
    <div v-else-if="loading" v-for="n in resolvedSkeletonCount" :key="'sk-' + n"
      class="rounded-lg overflow-hidden shadow-sm transition animate-pulse" role="status" aria-label="Loading project">
      <!-- Top block placeholder -->
      <div class="h-39 bg-surface"></div>

      <!-- Bottom block placeholder -->
      <div class="bg-bg-card p-3.5 text-sm flex justify-start gap-2.5 ">
        <div class="w-6 h-6 rounded-md bg-surface "></div>
        <div class="flex flex-col items-start gap-2 w-full">
          <div class="h-3 w-32 rounded bg-surface "></div>
          <div class="h-2.5 w-20 rounded bg-surface "></div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="col-span-full flex items-center justify-center py-10 text-sm text-text-secondary">
      No projects yet
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, nextTick, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

interface Project {
  _id: string
  variables: { title: string }
  title: string
  logo: string
  lastUpdated: string
}

const props = withDefaults(defineProps<{
  projects: Project[]
  loading?: boolean
  skeletonCount?: number
}>(), {
  loading: false,
  skeletonCount: 8,
})

/** Cache of computed colors by logo src */
const colorMap = ref<Record<string, string>>({})

/** Deterministic HSL fallback */
function hashedColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  const sat = 60
  const light = 55
  return `hsl(${hue} ${sat}% ${light}%)`
}

/** Extract dominant color with an offscreen canvas (returns hex) */
function extractDominantColor(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = src
    img.onload = () => {
      try {
        const size = 64
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!
        canvas.width = size
        canvas.height = size
        ctx.drawImage(img, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)

        const buckets: Record<string, number> = {}
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3]
          if (a < 10) continue
          const r = data[i] >> 4
          const g = data[i + 1] >> 4
          const b = data[i + 2] >> 4
          const key = `${r},${g},${b}`
          buckets[key] = (buckets[key] || 0) + 1
        }

        let bestKey = ''
        let bestCount = -1
        for (const k in buckets) if (buckets[k] > bestCount) (bestCount = buckets[k], bestKey = k)
        if (!bestKey) return resolve(hashedColor(src))

        const [r4, g4, b4] = bestKey.split(',').map(Number)
        const r = (r4 << 4) | r4
        const g = (g4 << 4) | g4
        const b = (b4 << 4) | b4
        resolve(rgbToHex(r, g, b))
      } catch {
        resolve(hashedColor(src)) // tainted canvas or other error
      }
    }
    img.onerror = () => resolve(hashedColor(src))
  })
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/** Compute colors for current projects (cached). Skips while loading. */
async function computeColors() {
  if (props.loading || !props.projects?.length) return
  for (const p of props.projects) {
    const key = p.logo
    if (colorMap.value[key]) continue
    const color = await extractDominantColor(key)
    colorMap.value = { ...colorMap.value, [key]: color }
    await nextTick()
  }
}

onMounted(computeColors)

watch(() => [props.loading, props.projects.map(p => p.logo).join('|')], computeColors, { deep: false })

/** Skeleton count */
const resolvedSkeletonCount = computed(() => props.skeletonCount ?? 8)
const router = useRouter();
/* Row click */
const onClick = (row: any) => {
  if (row.LatestTask?.job_id) { localStorage.setItem('jobId', row.LatestTask?.job_id) }
  else {
    localStorage.removeItem('jobId')
  }
  router.push(`/workspace/peak/${row._id}/${row.LatestTask?.job_id ? row.LatestTask?.job_id : ''}`)
}
</script>