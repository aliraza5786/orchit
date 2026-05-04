<template>
  <div class="w-full bg-bg-body text-text-primary">
    <div class="mx-auto w-full max-w-360 px-5 py-10 md:px-15 md:py-20">
      <div class="flex flex-wrap items-center justify-between gap-5">
        <div class="flex flex-col gap-1.5 max-md:gap-1">
          <h1 class="text-2xl font-medium">Welcome to Orchit AI!</h1>
          <p class="text-sm text-text-secondary">Create, organize, and collaborate seamlessly.</p>
        </div>
        <div class="flex items-center gap-3">
          <div @click="handleCreateWorkspace">
            <Button variant="primary">Create a workspace</Button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <div class="mt-15 sm:mt-21 mb-8 flex items-center justify-between min-w-max">
          <h2 class="text-xl font-medium me-3">All Workspaces</h2>
          <div class="flex items-center gap-3">
            <div class="w-48">
              <BaseSelectField
                v-model="filter"
                :options="filterOptions"
                size="sm"
                placeholder="Filter Workspaces"
              />
            </div>

            <button
              class="aspect-square w-8 cursor-pointer rounded-md p-1"
              :class="currentView === 'list' ? 'text-accent bg-accent-text' : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
              @click="setView('list')"
              title="List view"
            >
              <i class="fa-solid fa-align-left"></i>
            </button>

            <button
              class="aspect-square w-8 cursor-pointer rounded-md p-1"
              :class="currentView === 'gallery' ? 'text-accent bg-accent-text' : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
              @click="setView('gallery')"
              title="Gallery view"
            >
              <i class="fa-solid fa-grid-2"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- ✅ Use v-show instead of v-if so both mount once and stay cached -->
      <div v-show="currentView === 'list'">
  <WorkspaceListTable :filter="filter" />
</div>

<div v-show="currentView === 'gallery'">
  <ProjectGallery
    :projects="galleryWorkspaces?.workspaces"
    :loading="isGalleryLoading"
  />
</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from 'vue'
import Button from '../../components/ui/Button.vue'
import ProjectGallery from '../../components/ui/ProjectGallery.vue'
import WorkspaceListTable from './components/WorkspaceListTable.vue'
import { useWorkspaces } from '../../queries/useWorkspace'
import { useWorkspaceStore } from '../../stores/workspace'
import { useRouter, useRoute } from 'vue-router'
import BaseSelectField from '../../components/ui/BaseSelectField.vue'
// @ts-ignore
import confetti from 'canvas-confetti'

const router = useRouter()
const route = useRoute()
const workspaceStore = useWorkspaceStore()

type View = 'list' | 'gallery'
const currentView = ref<View>('list')
const setView = (v: View) => { currentView.value = v }
const filter = ref('all')

const filterOptions = [
  { title: 'All Workspaces', _id: 'all' },
  { title: 'Private', _id: 'private' },
  { title: 'Shared', _id: 'shared' },
  { title: 'Archived', _id: 'archived' },
  { title: 'Deleted', _id: 'deleted' },
]

// ✅ Gallery query — large page size, runs once and stays cached
const galleryPageSize = ref(1000)
const { data: galleryWorkspaces, isPending: galleryPending, isFetching: galleryFetching } = useWorkspaces(
  ref(1),
  galleryPageSize,
  filter
)

// ✅ List query — handled internally by WorkspaceListTable itself (already does its own useWorkspaces)
// We only need isLoading for the gallery view here
const isGalleryLoading = computed(() => galleryPending.value || galleryFetching.value)

function launchConfetti() {
  const duration = 2000
  const end = Date.now() + duration
  const colors = ['#7c5cfc', '#22c55e', '#f59e0b', '#ef4444']

  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors })
    confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  }

  frame()
}

function handleCreateWorkspace() {
  const wsFeature = workspaceStore.getFeature('no-of-workspaces')
  if (wsFeature && wsFeature.usage.current >= wsFeature.limits.limit) {
    workspaceStore.setLimitExccedModal(true)
  } else {
    router.push('/create-workspace')
  }
}

onMounted(async () => {
  await nextTick()
  const paramsToRemove = ['welcome', '_auth', '_cid']
  const query = { ...route.query }
  let dirty = false

  paramsToRemove.forEach((param) => {
    if (param in query) {
      delete query[param]
      dirty = true
    }
  })

  if (dirty) router.replace({ path: route.path, query })
  if (route.query.welcome === '1') launchConfetti()
})
</script>