<template>
  <div class="w-[100vw] h-[100vh]  bg-[#a0a0a06b] fixed top-0 right-0" v-if="workspaceStore.showFilter">
  </div>
  <div
    :class="` fixed top-0  w-[320px] h-full bg-white shadow-xl z-50 flex flex-col transition-all duration-100  ${workspaceStore.showFilter ? 'right-[2px]' : ' right-[-340px]'}`">

    <!-- header -->
    <div class="flex justify-between items-center px-4 py-3  bg-[#F8F9FB] h-[52px]">
      <h3 class="text-base font-medium text-text-primary">Filters</h3>

      <Button @click="clearFilters" size="sm"> Reset</Button>

    </div>
    <div class="px-4 py-3 ">
      <SearchBar placeholder="Filter Search" class="min-h-[44px] !rounded-[2px]" />
    </div>
    <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      <FilterDropdown v-model="filters.postedBy" label="Posted by" placeholder="Search & Select" isMulti avatar
        :options="[
          { label: 'Sehrish Mehmood', value: 'sehrish', color: '#e58e8e' },
          { label: 'Muhammad Amir', value: 'amir', color: '#8ed58e' }
        ]" />
      <PostedOnDropdown v-model="filters.postedOn" />
      <FilterDropdown v-model="filters.lastModifiedBy" label="Last Modified by" placeholder="Search & Select" :options="[
        { label: 'Today', value: 'today', color: '#e58e8e' },
        { label: 'Yesterday', value: 'yester' },
        { label: 'This Week', value: 't-week', },
        { label: 'This Month', value: 't-month', },
        { label: 'Last Week', value: 'l-week', },
        { label: 'Last Month', value: 'l-month', },
      ]" />
      <FilterDropdown v-model="filters.tags" label="Tags" placeholder="Search & Select" :options="[
        { label: 'Idea', value: 'Idea', },
        { label: 'Feature', value: 'Feature', },
        { label: 'Module', value: 'Module', },
        { label: 'Task', value: 'Task', },
        { label: 'Bug', value: 'Bug', },
      ]" />


    </div>

    <div class=" p-4 flex justify-between  bg-[#F8F9FB]">
      <Button @click="clearFilters" size="sm" variant="secondary">Cancel</Button>
      <Button @click="applyFilters" size="sm">Find</Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue'
import Button from "../../../components/ui/Button.vue"
import FilterDropdown from './FilterDropdown.vue';
import { useWorkspaceStore } from '../../../stores/workspace';
import PostedOnDropdown from './PostedOnDropdown.vue';
import SearchBar from '../../../components/ui/SearchBar.vue';
const workspaceStore = useWorkspaceStore();

const props = defineProps<{
  open: boolean
  modelValue: any
}>()


const emit = defineEmits(['update:modelValue', 'close'])

const filters = ref({
  postedOn: '',
  postedBy: '',
  tags: '',
  lastModifiedBy: '',

})

function applyFilters() {
  emit('update:modelValue', filters.value)
  emit('close')
}

function clearFilters() {
  filters.value = {
    postedOn: '',
    postedBy: '',
    tags: '',
    lastModifiedBy: '',
  }
  workspaceStore.toggleFilter()
}


watch(() => props.modelValue, (val) => {
  filters.value = { ...val }
})
</script>