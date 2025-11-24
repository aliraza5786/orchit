<template>
  <div class=" flex-auto flex-grow h-full bg-bg-card rounded-lg border border-border  overflow-x-auto flex-col flex  ">
    <header class="sticky top-0 w-full z-10        backdrop-blur">
      <div class="mx-auto  px-4 py-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 class="text-2xl font-semibold tracking-tight">Apps</h1>
          <div class="flex gap-2 items-center">

            <SearchBar @onChange="(e) => {
              searchQuery = e
            }" placeholder="Search in Orchit AI space">
            </SearchBar>
            <Button size="sm" @click="openNewModuleModalHandler()"> Add New </Button>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap gap-2">
         
          <button v-if="isCatPending" v-for="i in ['3', '2', '2']" :key="i"
            class="rounded-full border-border w-26 h-8 cursor-pointer border px-4 py-1.5 text-sm transition-all  animate-pulse bg-bg-surface">

          </button>
          <template v-else>
            <button @click="activeCategory = ''"
            class="rounded-full cursor-pointer border px-4 py-1.5 text-sm transition-all"
            :class="activeCategory == '' ? 'border-border bg-accent text-white shadow-sm' : 'border-border bg-bg-card text-text-secondary hover:bg-accent/50'">
            All
          </button>
          <button  v-for="cat in categories" :key="cat?._id" @click="activeCategory = cat?._id"
            class="rounded-full cursor-pointer border px-4 py-1.5 text-sm transition-all"
            :class="activeCategory === cat?._id ? 'border-border bg-accent text-white shadow-sm' : 'border-border bg-bg-card text-text-secondary hover:bg-accent/50'">
            {{ cat?.title
            }}
          </button>
          </template>

        </div>
      </div>
    </header>

    <main class="mx-auto w-full px-4 pb-16">
      <section class="pt-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Currentl Using</h2>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div v-if="isPending" v-for="i in ['3', '2', '2']" :key="i"
            class="h-16 w-full p-3 rounded-lg bg-bg-surface animate-pulse"></div>
          <AppCard v-else v-for="app in filteredModules" :key="app?._id" :app="app" action-label="Open" />
        </div>


      </section>

      <!-- <section class="mt-10">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Coming Soon</h2>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AppCard v-for="app in filteredSoon" :key="app.id" :app="app" action-label="Add" />
        </div>
      </section> -->
    </main>
  </div>
  <CreateNewModule size="md" v-model="isCreateModuleModal" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppCard from './components/AppCard.vue'
import Button from '../../components/ui/Button.vue'
import CreateNewModule from './modal/CreateNewModule.vue'
import { useMPCatlog, useMarketModules } from '../../queries/useMore';
import SearchBar from '../../components/ui/SearchBar.vue';
import Fuse from "fuse.js"

const isCreateModuleModal = ref(false);
const openNewModuleModalHandler = () => {
  isCreateModuleModal.value = true
}
const activeCategory = ref<string>('')
const { data: categories, isPending: isCatPending } = useMPCatlog()
const { data: marketModules, isPending } = useMarketModules(activeCategory)
const searchQuery = ref("")

const filteredModules = computed(() => {
  const list = marketModules.value ?? []

  if (!searchQuery.value.trim()) return list

  const fuse = new Fuse(list, {
    keys: ["title", "description"], // adjust to real keys inside your module object
    threshold: 0.3,
  })

  return fuse.search(searchQuery.value).map(r => r.item)
})
</script>