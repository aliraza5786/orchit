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
            if (workspaceStore.limits.features[1]?.usage.current >= workspaceStore.limits.features[1]?.limits.limit) {
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
      <div v-if="!isPending && isEmpty" class="flex items-center justify-center py-10 text-sm text-text-secondary">
        No Workspace
      </div>

      <WorkspaceListTable v-else-if="currentView === 'list'" />

      <ProjectGallery v-else-if="currentView === 'gallery'" :projects="workspaces" :loading="isPending" />
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
const router = useRouter()
const workspaceStore = useWorkspaceStore()
// 🔑 pagination + sort state
const page = ref(1)
const pageSize = ref(10)
// 🔑 query now accepts reactive params
const { data: workspaces, isPending } = useWorkspaces(page, pageSize)
type View = 'list' | 'gallery'
const currentView = ref<View>('list')
const setView = (v: View) => { currentView.value = v }
// const workspaces = computed(() => (Array.isArray(items?.value) ? items!.value : []))
const isEmpty = computed(() => workspaces.value.length === 0)

</script>