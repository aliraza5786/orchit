<template>
  <Loader v-if="(createWorkspacePending || isPending || isLoader)"></Loader>
  <div v-else class="w-full flex flex-col mb-[60px]">
    <!-- Header -->
    <div class="text-left w-full mb-6 ">
      <h2 class="text-2xl md:text-4xl font-semibold text-text-primary text-left m-0">
        Project Summary
      </h2>
      <p class="text-sm md:text-base text-text-secondary text-left mt-3 sm:mt-5 mb-0 md:mb-4">
        Review your project details before creation
      </p>
    </div>

    <!-- Summary Cards -->
    <div class=" flex-wrap flex md:flex-nowrap gap-4 mb-6 ">
      <!-- Project Overview -->
      <div class="bg-bg-surface w-full text-text-primary rounded-xl p-6 flex-auto">
        <h3 class="text-xl font-semibold mb-5.5">Project Overview</h3>
        <p class="text-text-primary text-base font-semibold">
          <strong class="text-text-secondary text-sm font-medium">Project Name</strong><br />{{
            project?.variables?.title }}
        </p>
        <p class="mt-5 text-text-primary text-base font-semibold capitalize">
          <strong class="text-text-secondary text-sm font-medium">Project Type</strong><br />{{
            project?.variables ? project?.variables["workspace-type"] : '' }} Project
        </p>
        <p v-if="project?.variables?.idea" class="mt-5 ttext-text-primary text-base font-semibold">
          <strong class="text-text-secondary text-sm font-medium">Description</strong><br />
          {{
            project?.variables?.idea }}
        </p>
      </div>

      <!-- Team Resources -->
      <div v-if="total_resorces_recommened" class="bg-bg-surface w-full text-text-primary rounded-xl p-6">
        <h3 class="text-lg font-semibold mb-4">Team Assignment</h3>
        <p class="text-4xl font-bold">
          {{ total_resorces }} / {{ total_resorces_recommened }}
        </p>
        <p class="text-sm text-text-secondary mb-4">Total team Assigned</p>
        <ul class="space-y-3">
          <li v-for="role in project.variables?.roles" class="flex justify-between">
            <span class="flex gap-2 items-center text-text-primary text-base font-semibold">
              <span v-if="role.role_emoji" class="mr-2 text-lg"> {{ role.role_emoji }}</span>
              {{ role.title }}
            </span>
            <span> {{ role.people.length }} / {{ role.max_num_people }} </span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Selected Lanes -->
    <div v-if="project?.lanes?.length > 0" class=" h-full flex-grow flec flex-col">
      <h3 class="text-lg font-semibold text-text-primary mb-4">
        Selected Project Lanes
      </h3>
      <div class="grid  grid-cols-2 md:grid-cols-3 flex-wrap gap-3 md:gap-4">
        <div v-for="lane in project.lanes" class="bg-bg-surface text-text-primary px-4 py-3 rounded-lg">
          <div class="flex gap-4 items-center">
            <div class="w-4 h-4 rounded-full aspect-square" :style="`background:${lane.variables['lane-color']}`"></div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium">
                {{ lane.variables["lane-title"] }}
              </p>
              <p class="text-xs text-text-secondary line-clamp-2 ">
                {{ lane.variables["lane-description"] }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from "vue";
import Loader from "../../../components/ui/Loader.vue";
import {
  useCreateLanes,
  useCreateWorkspace,
} from "../../../queries/useWorkspace";
import { useRouter } from "vue-router";
import { useCompanyId } from "../../../services/user";
import { useWorkspaceStore } from '../../../stores/workspace';
const isLoader = ref(false);

const workspaceStore = useWorkspaceStore();
const router = useRouter()
const { mutate: createStep2, isPending } = useCreateLanes({
  onSuccess: (data: any) => {
    router.push(`/workspace/peak/${data.workspace_id}/${data.job_id}`)
    workspaceStore.setWorkspace(null)
    // emits('back')
  },
});
// Create workspace API
const { mutate: createWorkspace, isPending: createWorkspacePending } =
  useCreateWorkspace({
    onError: (error: any) => console.error("Error creating workspace:", error),
    onSuccess: (data: any) => {
      if (props.ai)
        createStep2({
          workspace_id: data._id,
        }); else router.push(`/workspace/peak/${data._id}`)
      workspaceStore.setWorkspace(null)
    },
  });
watch(()=>createWorkspacePending.value, (newVal) => {
  if (newVal == true)
    isLoader.value = true
})
const project = ref<any>({
  title: "",
  description: "",
  workspace_type: "",
  roles: [],
  lanes: [],
});

onBeforeMount(() => {
  // Load workspace data from localStorage
  try {
    const workspace = workspaceStore.workspace ?? {};
    if (workspace) {
      project.value = workspace;
    }
  } catch (error) {
    console.error("Error parsing workspace from localStorage", error);
  }
});
const total_resorces_recommened = computed(() => {
  return project.value.variables?.roles ? project.value.variables?.roles.reduce((el: any, e: any) => {
    return e.max_num_people + el;
  }, 0) : 0;
});
const total_resorces = computed(() => project.value.variables?.roles ? project.value.variables?.roles.reduce((el: any, e: any) => {
  return e.people.length + el;
}, 0) : 0
);
const { data: companyId } = useCompanyId()
function createProjectHandler() {
  createWorkspace({
    company_id: companyId?.value?._id,
    ...project.value,
  }); // This triggers the workspace creation process
}
defineExpose({
  createProjectHandler,
  createWorkspacePending,
  isPending
});
const props = defineProps<{
  ai: boolean
}>()
const emits = defineEmits(['back'])
</script>

<style scoped></style>
