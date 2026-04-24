<template>
  <div class="w-full bg-bg-body text-text-primary">
    <div class="mx-auto w-full max-w-[1440px] px-5 py-10 md:px-15 md:py-20">
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
            <!-- Filter Dropdown -->
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

      <!-- Loading state -->
      <div v-if="isLoading && !workspaces?.workspaces?.length" class="text-center py-10">
        <p class="text-text-secondary">Loading workspaces...</p>
      </div>

      <!-- Table/list view -->
      <WorkspaceListTable v-else-if="currentView === 'list'" :filter="filter" />

      <!-- Gallery view -->
      <ProjectGallery 
        v-else-if="currentView === 'gallery'" 
        :projects="workspaces?.workspaces" 
        :loading="isLoading" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import Button from '../../components/ui/Button.vue'
import ProjectGallery from '../../components/ui/ProjectGallery.vue'
import WorkspaceListTable from './components/WorkspaceListTable.vue'
import { useWorkspaces } from '../../queries/useWorkspace'
import { useWorkspaceStore } from '../../stores/workspace'
import { useAuthStore } from '../../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import BaseSelectField from '../../components/ui/BaseSelectField.vue'
// @ts-ignore
import confetti from 'canvas-confetti'

const router = useRouter()
const route = useRoute()
const workspaceStore = useWorkspaceStore()
const authStore = useAuthStore()

// Pagination + sort + filter state
const page = ref(1)
type View = 'list' | 'gallery'
const currentView = ref<View>('list')
const setView = (v: View) => { currentView.value = v }

const pageSize = computed(() => currentView.value === 'gallery' ? 1000 : 10)
const filter = ref('all')

const filterOptions = [
  { title: 'All Workspaces', _id: 'all' },
  { title: 'Private', _id: 'private' },
  { title: 'Shared', _id: 'shared' },
  { title: 'Archived', _id: 'archived' },
  { title: 'Deleted', _id: 'deleted' },
]

// Query now accepts reactive params
const { data: workspaces, isPending, isFetching } = useWorkspaces(page, pageSize, filter)

const isLoading = computed(() => isPending.value || isFetching.value)

function launchConfetti() {
  const duration = 2000
  const end = Date.now() + duration
  const colors = ['#7c5cfc', '#22c55e', '#f59e0b', '#ef4444']

  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors
    })

    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors
    })

    if (Date.now() < end) {
      requestAnimationFrame(frame)
    }
  }

  frame()
}

// ✅ NEW: Handle workspace creation with limit check
function handleCreateWorkspace() {
  const wsFeature = workspaceStore.getFeature('no-of-workspaces')
  if (wsFeature && wsFeature.usage.current >= wsFeature.limits.limit) {
    workspaceStore.setLimitExccedModal(true)
  } else {
    router.push('/create-workspace')
  }
}

// ✅ IMPROVED: Early URL param handling (but still safe)
function ensureCompanyIdFromUrl() {
  const cidParam = route.query._cid as string
  
  if (!cidParam) {
    console.log('ℹ️ No _cid in URL, using existing company_id from store')
    return
  }

  let companyId = cidParam
  try {
    companyId = atob(cidParam.replace(/-/g, '+').replace(/_/g, '/').replace(/\./g, '='))
    console.log('✅ Home.vue: Decoded _cid:', companyId)
  } catch (e) {
    console.warn('⚠️ Home.vue: _cid decode failed, using raw value:', cidParam)
  }

  // ✅ Update auth store directly (will sync to localStorage)
  authStore.company_id = companyId
  localStorage.setItem('company_id', companyId)

  // ✅ Update cookies
  const hostname = window.location.hostname
  const maxAge = 60 * 60 * 24 * 30
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    document.cookie = `company_id=${companyId}; path=/; max-age=${maxAge}; SameSite=Lax`
  } else if (hostname.endsWith('.streamed.space')) {
    document.cookie = `company_id=${companyId}; domain=.streamed.space; path=/; max-age=${maxAge}; Secure; SameSite=Lax`
  }

  console.log('✅ Home.vue: company_id ensured:', companyId)
}

// ✅ IMPROVED: Clean URL properly (remove _cid AND welcome)
function cleanUrlParams() {
  const params = new URLSearchParams(window.location.search)
  let shouldClean = false

  if (params.has('welcome')) {
    params.delete('welcome')
    shouldClean = true
  }

  if (params.has('_cid')) {
    params.delete('_cid')
    shouldClean = true
  }

  if (shouldClean) {
    const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '')
    window.history.replaceState({}, '', newUrl)
    console.log('🧹 URL cleaned')
  }
}

onMounted(async () => {
  console.log('🏠 Home.vue mounted')

  // ✅ STEP 1: Ensure auth store is initialized
  if (!authStore.initialized) {
    console.log('⏳ Waiting for auth store to initialize...')
    await authStore.bootstrap()
  }

  // ✅ STEP 2: Ensure company_id from URL if present
  ensureCompanyIdFromUrl()

  // ✅ STEP 3: Launch confetti if welcome
  await nextTick()
  if (route.query.welcome === '1') {
    console.log('🎉 Launching confetti welcome!')
    launchConfetti()
  }

  // ✅ STEP 4: Clean URL
  cleanUrlParams()

  // ✅ STEP 5: Log final state
  console.log('✅ Home.vue ready:', {
    companyId: authStore.company_id,
    userId: authStore.userId,
    authenticated: authStore.isAuthenticated,
  })
})

// ✅ NEW: Watch company_id to ensure consistency
watch(
  () => authStore.company_id,
  (newValue) => {
    if (newValue) {
      console.log('🔄 Auth store company_id updated:', newValue)
      localStorage.setItem('company_id', newValue)
    }
  }
)
</script>