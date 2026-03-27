<template>
  <div class="w-full bg-bg-body text-text-primary">
    <div class="mx-auto w-full max-w-[1440px] px-5 py-10 md:px-15 md:py-20">
      <div class="flex flex-wrap items-center justify-between gap-5">
        <div class="flex flex-col gap-1.5 max-md:gap-1">
          <h1 class="text-2xl font-medium">Welcome to Orchit AI!</h1>
          <p class="text-sm text-text-secondary">Create, organize, and collaborate seamlessly.</p>
        </div>

        <div class="flex items-center gap-3">
          <div to="/create-workspace" @click="() => {
            const wsFeature = workspaceStore.getFeature('no-of-workspaces')
            if (wsFeature && wsFeature.usage.current >= wsFeature.limits.limit) {
              workspaceStore.setLimitExccedModal(true)
            }else{
              router.push('/create-workspace')
            }
          }">
            <Button variant="primary">Create a workspace</Button>
          </div>
        </div>
      </div>

      <div class="mt-21 mb-8 flex items-center justify-between">
        <h2 class="text-xl font-medium">All Workspaces</h2>
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

          <button class="aspect-square w-8 cursor-pointer rounded-md p-1"
            :class="currentView === 'list' ? 'text-accent bg-accent-text' : ' hover:bg-border/50 backdrop-blur-2xl  transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
            @click="setView('list')" title="List view">
            <i class="fa-solid fa-align-left"></i>
          </button>

          <button class="aspect-square w-8 cursor-pointer rounded-md p-1"
            :class="currentView === 'gallery' ? 'text-accent bg-accent-text' : 'hover:bg-border/50 backdrop-blur-2xl  transition-all duration-75 hover:outline-border hover:outline hover:text-accent'"
            @click="setView('gallery')" title="Gallery view">
            <i class="fa-solid fa-grid-2"></i>
          </button>
        </div>
      </div>

      <!-- table/list view -->
      <WorkspaceListTable v-if="currentView === 'list'" :filter="filter" />

      <!-- gallery view -->
      <ProjectGallery v-else-if="currentView === 'gallery'" :projects="workspaces?.workspaces" :loading="isLoading" />

     
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from '../../components/ui/Button.vue'
import ProjectGallery from '../../components/ui/ProjectGallery.vue'
import WorkspaceListTable from './components/WorkspaceListTable.vue'
import { useWorkspaces } from '../../queries/useWorkspace'
import { useWorkspaceStore } from '../../stores/workspace'
import { useRouter } from 'vue-router'
import BaseSelectField from '../../components/ui/BaseSelectField.vue'

const router = useRouter()
const workspaceStore = useWorkspaceStore()

// pagination + sort + filter state
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

//  query now accepts reactive params
const { data: workspaces, isPending, isFetching } = useWorkspaces(page, pageSize, filter)

const isLoading = computed(() => isPending.value || isFetching.value)

// const isEmpty = computed(() => !workspaces.value?.workspaces?.length)
</script>