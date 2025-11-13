<template>
  <div class=" flex-auto flex-grow h-full bg-bg-card rounded-lg border border-border  overflow-x-auto flex-col flex  ">
    <header class="sticky top-0 w-full z-10        backdrop-blur">
      <div class="mx-auto  px-4 py-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 class="text-2xl font-semibold tracking-tight">Apps</h1>
          <div class="flex gap-2 items-center">
            <div class="relative w-full md:w-80">

              <input v-model="query" type="search" placeholder="Search"
                class="w-full rounded-2xl border border-border bg-bg-input px-4 py-2.5 pr-9 text-sm outline-none placeholder:text-text-secondary focus:border-border focus:ring-1 focus:ring-border" />
              <svg class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 opacity-50"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <Button size="sm" @click="openNewModuleModalHandler()"> Add New </Button>
          </div>
        </div>
        <div class="mt-5 flex flex-wrap gap-2">
          <button v-for="cat in categoriesWithAll" :key="cat" @click="activeCategory = cat"
            class="rounded-full cursor-pointer border px-4 py-1.5 text-sm transition-all"
            :class="activeCategory === cat ? 'border-border bg-accent text-white shadow-sm' : 'border-border bg-bg-card text-text-secondary hover:bg-accent/50'">
            {{ cat }}
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full px-4 pb-16">
      <section class="pt-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Currently Using</h2>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AppCard v-for="app in filteredCurrent" :key="app.id" :app="app" action-label="Open" />
        </div>
      </section>

      <section class="mt-10">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold">Coming Soon</h2>
        </div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AppCard v-for="app in filteredSoon" :key="app.id" :app="app" action-label="Add" />
        </div>
      </section>
    </main>
  </div>
  <CreateNewModule size="md" v-model="isCreateModuleModal" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppCard, { type AppItem } from './components/AppCard.vue'
import Button from '../../components/ui/Button.vue'
import CreateNewModule from './modal/CreateNewModule.vue'
const isCreateModuleModal = ref(false); 
const openNewModuleModalHandler = ()=>{
  isCreateModuleModal.value= true
}
const allApps = ref<AppItem[]>([
  // Currently Using
  { id: 'ping', name: 'Ping', tag: 'Q', description: 'Instantly connect with visitors using live chat.', categories: ['Support', 'Teamwork'], status: 'current', color: 'bg-orange-500' },
  { id: 'parcel', name: 'Parcel', tag: 'P', description: 'Send tasks or tickets as files to external users.', categories: ['Operations', 'Productivity'], status: 'current', color: 'bg-violet-600' },
  { id: 'pitch', name: 'Pitch', tag: 'P', description: 'Making your idea public via presentation.', categories: ['Productivity', 'Design'], status: 'current', color: 'bg-cyan-500' },
  { id: 'proof', name: 'Proof', tag: 'P', description: 'Check your idea is worth it using ai.', categories: ['Analytics', 'Productivity'], status: 'current', color: 'bg-rose-500' },
  { id: 'populate', name: 'Populate', tag: 'P', description: 'Lets create very amazing content using ai.', categories: ['Marketing', 'Productivity'], status: 'current', color: 'bg-amber-500' },
  { id: 'persona', name: 'Persona', tag: 'P', description: 'Create detailed user personas to decisions.', categories: ['Marketing', 'Analytics'], status: 'current', color: 'bg-orange-400' },
  { id: 'profile', name: 'Profile', tag: 'P', description: 'Lorem ipsum dolor sit consectetur adipiscing elit.', categories: ['Productivity'], status: 'current', color: 'bg-fuchsia-500' },
  { id: 'press', name: 'Press', tag: 'P', description: 'Get news on your idea using ai based mechanism.', categories: ['Marketing', 'Analytics'], status: 'current', color: 'bg-emerald-600' },
  // Coming Soon
  { id: 'gravity-forms', name: 'Gravity Forms', tag: 'G', description: 'Lorem ipsum dolor sit consectetur adipiscing elit.', categories: ['Productivity', 'Design'], status: 'soon', color: 'bg-orange-500' },
  { id: 'health-fixes', name: 'Health & Fixes', tag: 'H', description: 'Get all the errors and fixes instantly with ai.', categories: ['Development', 'Operations'], status: 'soon', color: 'bg-sky-600' },
  { id: 'brevo', name: 'Brevo', tag: 'B', description: 'Manage people with ease inside spaces.', categories: ['Support', 'Teamwork'], status: 'soon', color: 'bg-cyan-700' },
  { id: 'funnel-kit', name: 'Funnel kit', tag: 'V', description: 'Create ai based funnels for better results.', categories: ['Marketing', 'Sales'], status: 'soon', color: 'bg-indigo-700' },
  { id: 'brainstorming', name: 'Brainstroming', tag: 'A', description: 'Get new ideas related your projects.', categories: ['Teamwork', 'Productivity'], status: 'soon', color: 'bg-violet-600' },
  { id: 'performance', name: 'Performance', tag: 'M', description: 'Standalone performance booster.', categories: ['Analytics', 'Development'], status: 'soon', color: 'bg-blue-600' },
  { id: 'mail-pocket', name: 'Mail Pocket', tag: 'M', description: 'Create email automations with AI.', categories: ['Marketing', 'Productivity'], status: 'soon', color: 'bg-orange-500' },
  { id: 'page-builder', name: 'Page Builder', tag: 'P', description: 'Lorem ipsum dolor sit amet consectetur.', categories: ['Design', 'Productivity'], status: 'soon', color: 'bg-pink-500' },
  { id: 'events-ai', name: 'Events', tag: 'E', description: 'Create events based on ai prompts.', categories: ['Productivity', 'Operations'], status: 'soon', color: 'bg-emerald-600' },
  { id: 'buddy', name: 'Buddy', tag: 'B', description: "Let's create automations for your projects.", categories: ['Teamwork', 'Operations'], status: 'soon', color: 'bg-orange-400' },
  { id: 'fluent-forms', name: 'Fluent Forms', tag: 'F', description: 'Create forms automations with AI.', categories: ['Productivity'], status: 'soon', color: 'bg-sky-600' },
  { id: 'events-ai-2', name: 'Events', tag: 'E', description: 'Create events based on ai prompts.', categories: ['Productivity', 'Operations'], status: 'soon', color: 'bg-emerald-600' },
  { id: 'jetpack-backup', name: 'Jetpack Backup', tag: 'J', description: 'Create ai powered backups for everything.', categories: ['Operations', 'Development'], status: 'soon', color: 'bg-green-600' },
  { id: 'tidio', name: 'Tidio', tag: 'T', description: 'Tidio is an all-in-one customer experience', categories: ['Support', 'Sales'], status: 'soon', color: 'bg-zinc-800' },
  { id: 'pitch-plus', name: 'Pitch +', tag: 'M', description: 'Get pitch ideas related to your projects.', categories: ['Productivity', 'Design'], status: 'soon', color: 'bg-cyan-600' },
  { id: 'proof-2', name: 'Proof', tag: 'P', description: 'Lorem ipsum dolor sit consectetur adipiscing elit.', categories: ['Analytics'], status: 'soon', color: 'bg-rose-500' }
])

const categories = [
  'Sales', 'Marketing', 'Support', 'Finance', 'Hiring', 'Teamwork',
  'Productivity', 'Design', 'Analytics', 'Development', 'Operations'
]
const categoriesWithAll = ['All apps', ...categories]

const activeCategory = ref<string>('All apps')
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  const byCategory = (app: AppItem) => (
    activeCategory.value === 'All apps' || app.categories.includes(activeCategory.value)
  )
  return allApps.value.filter(a => byCategory(a) && (
    !q || a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
  ))
})

const filteredCurrent = computed(() => filtered.value.filter(a => a.status === 'current'))
const filteredSoon = computed(() => filtered.value.filter(a => a.status === 'soon'))
</script>