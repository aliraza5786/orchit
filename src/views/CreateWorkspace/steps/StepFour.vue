<template>
  <Loader v-if="(createWorkspacePending || isPending || isLoader)"></Loader>
  <div v-else class="w-full flex flex-col mb-[60px] max-w-[800px] mx-auto">
    <!-- Header -->
    <div class="step-enter step-enter-1 w-full text-center space-y-3 mb-8">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[11px] font-semibold text-accent uppercase tracking-widest mb-1">
        <span class="w-1.5 h-1.5 rounded-full bg-accent inline-block animate-pulse"></span>
        Ready to Launch
      </div>
      <h2 class="text-[24px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-text-primary to-text-secondary tracking-tight m-0">
        Workspace Summary
      </h2>
      <p class="text-sm text-text-secondary mb-0 max-w-[520px] mx-auto leading-relaxed">
        Review your workspace details before creation
      </p>
    </div>
    <!-- Summary Cards -->
    <div class="flex-wrap flex md:flex-nowrap gap-5 mb-8">
      <!-- Project Overview -->
      <div class="step-enter step-enter-2 bg-bg-surface w-full text-text-primary rounded-2xl p-6 border border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:border-border/80 flex-auto">
        <h3 class="text-lg font-semibold mb-6 flex items-center gap-2">
          <i class="fa-regular fa-folder-open text-text-secondary text-base"></i> Workspace Overview
        </h3>
        <div class="space-y-5">
           <div>
              <strong class="text-text-secondary text-[11px] uppercase tracking-wider font-semibold block mb-1">Workspace Name</strong>
              <p class="text-text-primary text-base font-semibold">{{ project?.variables?.title }}</p>
           </div>
           
           <div>
              <strong class="text-text-secondary text-[11px] uppercase tracking-wider font-semibold block mb-1">Workspace Type</strong>
              <p class="text-text-primary capitalize">
                <span class="inline-flex items-center px-3 py-1 rounded-full bg-bg-card border border-border text-sm font-medium mt-0.5">
                  {{ project?.variables ? project?.variables["workspace-type"] : '' }}
                </span>
              </p>
           </div>

           <div v-if="project?.variables?.['workspace-color']">
              <strong class="text-text-secondary text-[11px] uppercase tracking-wider font-semibold block mb-2">Workspace Color</strong>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full border-2 border-border/50 shadow-md shrink-0" :style="`background: ${project.variables['workspace-color']}; box-shadow: 0 0 14px ${project.variables['workspace-color']}55`"></div>
                <span class="text-sm font-mono text-text-secondary">{{ project.variables['workspace-color'] }}</span>
              </div>
           </div>
           
           <div v-if="project?.variables?.idea">
              <strong class="text-text-secondary text-[11px] uppercase tracking-wider font-semibold block mb-1">Description</strong>
              <div class="bg-bg-card/40 rounded-xl p-3.5 border border-border/40 mt-2 transition-colors hover:bg-bg-card/60">
                <p class="text-text-primary text-sm font-medium leading-relaxed m-0">{{ project?.variables?.idea }}</p>
              </div>
           </div>
        </div>
      </div>

      <!-- Team Resources -->
      <div v-if="total_resorces_recommened" class="step-enter step-enter-3 bg-bg-surface w-full text-text-primary rounded-2xl p-6 border border-border shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-black/5 hover:border-border/80">
        <div class="flex items-center justify-between mb-4">
           <h3 class="text-lg font-semibold m-0 flex items-center gap-2">
             <i class="fa-regular fa-user-group text-text-secondary text-base"></i> Team Assignment
           </h3>
           <div class="flex items-baseline gap-1.5 bg-accent/10 px-3 py-1 rounded-full border border-accent/20" title="Total team assigned">
             <span class="text-[15px] font-bold text-accent">{{ total_resorces }}</span>
             <span class="text-[11px] font-medium text-accent/70">/ {{ total_resorces_recommened }}</span>
           </div>
        </div>

        <!-- Progress Bar -->
        <div class="mb-5">
          <div class="h-1.5 w-full bg-bg-card rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-700 ease-out"
              :style="`width: ${total_resorces_recommened > 0 ? Math.round((total_resorces / total_resorces_recommened) * 100) : 0}%`"
            ></div>
          </div>
          <p class="text-[11px] text-text-secondary mt-1.5">
            {{ total_resorces_recommened > 0 ? Math.round((total_resorces / total_resorces_recommened) * 100) : 0 }}% capacity filled
          </p>
        </div>
        
        <ul class="space-y-3">
          <li v-for="role in project.variables?.roles" :key="role.id" class="flex justify-between items-center bg-bg-card/40 rounded-xl px-4 py-3 border border-border transition-colors hover:border-border/70 hover:bg-bg-card/60">
            <span class="flex gap-3 items-center text-text-primary text-sm font-medium">
              <div class="w-8 h-8 rounded-lg bg-bg-surface border border-border/50 flex items-center justify-center shrink-0 shadow-sm">
                <span v-if="role.role_emoji" class="text-[15px]">{{ role.role_emoji }}</span>
                <span v-else-if="role.role_icon" class="text-[15px] text-text-secondary"><i :class="[role.role_icon.prefix, role.role_icon.iconName]" /></span>
                <i v-else class="fa-regular fa-user text-text-secondary text-[13px]"></i>
              </div>
              {{ role.title }}
            </span>
            <div class="flex flex-col items-end gap-1">
              <span class="text-xs font-semibold bg-bg-surface border border-border px-2.5 py-0.5 rounded-md text-text-secondary shadow-sm">
                {{ assignedPeopleCount(role) }} / {{ role.max_num_people }}
              </span>
              <div class="w-14 h-1 bg-bg-card rounded-full overflow-hidden">
                <div 
                  class="h-full bg-accent/60 rounded-full"
                  :style="`width: ${role.max_num_people > 0 ? Math.round((assignedPeopleCount(role) / role.max_num_people) * 100) : 0}%`"
                ></div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Selected Lanes -->
    <div v-if="project?.lanes?.length > 0" class="step-enter step-enter-4 h-full flex-grow flex flex-col mt-2">
      <h3 class="text-lg font-semibold text-text-primary mb-5 px-1 flex items-center gap-2">
        <i class="fa-regular fa-table-columns text-text-secondary text-base"></i> Selected Workspace Tabs
      </h3>
      <div class="grid grid-cols-2 md:grid-cols-3 flex-wrap gap-4">
        <div v-for="lane in project.lanes" :key="lane.variables.id" class="group bg-bg-surface border border-border/50 text-text-primary px-5 py-4 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg hover:border-accent/40 hover:-translate-y-1 relative overflow-hidden cursor-default">
          <div class="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" :style="`background: linear-gradient(135deg, ${lane.variables['lane-color']} 0%, transparent 100%)`"></div>
          <div class="flex gap-4 items-center relative z-10">
            <div class="w-10 h-10 rounded-xl shrink-0 shadow-sm border border-border flex items-center justify-center transition-transform duration-300 group-hover:scale-110" :style="`background-color: color-mix(in srgb, ${lane.variables['lane-color']} 15%, transparent)`">
              <div class="w-3 h-3 rounded-full" :style="`background:${lane.variables['lane-color']}; box-shadow: 0 0 10px ${lane.variables['lane-color']}80`"></div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-text-primary truncate transition-colors duration-300 group-hover:text-accent">
                {{ lane.variables["lane-title"] }}
              </p>
              <p class="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                {{ lane.variables["lane-description"] }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modules & Sheets -->
    <div v-if="project?.modules?.length > 0" class="step-enter step-enter-5 h-full flex-grow flex flex-col mt-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 px-1">
        <h3 class="text-lg font-semibold text-text-primary m-0 flex items-center gap-2">
          <i class="fa-solid fa-cubes text-text-secondary text-base"></i> Modules & Sheets
        </h3>
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent">
            <i class="fa-solid fa-cube text-[10px]"></i>
            {{ modulesSummary.count }} {{ modulesSummary.count === 1 ? "module" : "modules" }}
          </span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bg-card border border-border text-xs font-semibold text-text-secondary">
            <i class="fa-solid fa-table text-[10px]"></i>
            {{ modulesSummary.totalSheets }} {{ modulesSummary.totalSheets === 1 ? "sheet" : "sheets" }}
          </span>
        </div>
      </div>

      <div class="space-y-4">
        <div
          v-for="(mod, modIdx) in project.modules"
          :key="mod.variables?.id || modIdx"
          class="group bg-bg-surface border border-border/50 rounded-2xl shadow-sm overflow-hidden "
        >
          <!-- Module header -->
          <div class="flex gap-4 items-start p-5 bg-bg-card/30 border-b border-border relative">
            <div
              class="absolute left-0 top-0 bottom-0 w-1 bg-accent/60 rounded-r-full opacity-80 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            ></div>
            <div class="w-11 h-11 rounded-xl shrink-0 bg-bg-surface border border-border flex items-center justify-center text-accent shadow-sm ml-1">
              <i
                v-if="mod.variables?.['module-icon']"
                :class="[
                  mod.variables['module-icon'].prefix,
                  mod.variables['module-icon'].iconName,
                ]"
                class="text-lg"
              />
              <i v-else class="fa-solid fa-cube text-text-secondary" />
            </div>
            <div class="flex-1 min-w-0 pt-0.5">
              <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-bg-surface border border-border text-[10px] font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Module {{ Number(modIdx) + 1 }}
              </span>
              <p class="text-base font-semibold text-text-primary m-0 leading-tight">
                {{ mod.variables?.["module-title"] }}
              </p>
              <p class="text-[12px] text-text-secondary line-clamp-2 mt-1.5 m-0 leading-relaxed">
                {{ mod.variables?.["module-description"] }}
              </p>
            </div>
          </div>

          <!-- Sheets list -->
          <div class="p-5 pt-4">
            <div class="flex items-center justify-between gap-2 mb-4">
              <h4 class="text-sm font-semibold text-text-primary m-0 flex items-center gap-2">
                <span class="w-7 h-7 rounded-lg bg-bg-card border border-border flex items-center justify-center">
                  <i class="fa-solid fa-table text-text-secondary text-[11px]"></i>
                </span>
                Sheets in this module
              </h4>
              <span class="text-xs font-semibold text-text-secondary bg-bg-card border border-border px-2.5 py-1 rounded-full shrink-0">
                {{ mod.sheets?.length || 0 }}
              </span>
            </div>

            <ul
              v-if="mod.sheets?.length"
              class="space-y-2 m-0 p-0 list-none relative ml-3 pl-5 border-l-2 border-accent/25"
            >
              <li
                v-for="(sheet, sheetIdx) in mod.sheets"
                :key="sheet.variables?.id || sheetIdx"
                class="relative"
              >
                <span
                  class="absolute -left-[23px] top-[18px] w-2.5 h-2.5 rounded-full bg-accent border-2 border-bg-surface shadow-sm"
                  aria-hidden="true"
                ></span>
                <div class="flex gap-3 items-start rounded-xl px-4 py-3 bg-bg-card/50 border border-border/50 transition-colors hover:bg-bg-card hover:border-border">
                  <div class="w-9 h-9 shrink-0 rounded-lg bg-bg-surface border border-border flex items-center justify-center text-accent">
                    <i
                      v-if="sheet.variables?.['sheet-icon']"
                      :class="[
                        sheet.variables['sheet-icon'].prefix,
                        sheet.variables['sheet-icon'].iconName,
                      ]"
                    />
                    <i v-else class="fa-solid fa-table text-text-secondary text-sm" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <span class="text-[10px] font-semibold uppercase tracking-wider text-accent/90 block mb-0.5">
                      Sheet {{ Number(sheetIdx) + 1 }}
                    </span>
                    <p class="text-sm font-semibold text-text-primary m-0">
                      {{ sheet.variables?.["sheet-title"] }}
                    </p>
                    <p class="text-[11px] text-text-secondary line-clamp-2 mt-1 m-0">
                      {{ sheet.variables?.["sheet-description"] }}
                    </p>
                    <p
                      v-if="sheet.variables?.['to-do']"
                      class="text-[11px] text-text-secondary mt-2 m-0 flex items-start gap-1.5"
                    >
                      <i class="fa-regular fa-circle-check text-accent/80 text-[10px] mt-0.5 shrink-0"></i>
                      <span>{{ sheet.variables["to-do"] }}</span>
                    </p>
                  </div>
                </div>
              </li>
            </ul>
            <div
              v-else
              class="rounded-xl border border-dashed border-border px-4 py-6 text-center bg-bg-card/20"
            >
              <i class="fa-solid fa-table text-text-secondary/40 text-xl mb-2"></i>
              <p class="text-xs text-text-secondary m-0">No sheets added to this module</p>
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
import { useWorkspaceStore } from '../../../stores/workspace';
import { useAuthStore } from "../../../stores/auth";
const isLoader = ref(false);
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore();
const router = useRouter()
const { mutate: createStep2, isPending } = useCreateLanes({
  onSuccess: (data: any) => {
    router.push(`/workspace/peak/${data.workspace_id}/${data.job_id}`)
    workspaceStore.clearWorkspaceDraft()
    // emits('back')
  },
});
// Create workspace API
const { mutate: createWorkspace, isPending: createWorkspacePending } =
  useCreateWorkspace({
    onError: (error: any) => console.error("Error creating workspace:", error),
    onSuccess: async (data: any) => {
      await authStore.bootstrap()
      if (props.ai)
        createStep2({
          workspace_id: data._id,
        }); else router.push(`/workspace/peak/${data._id}`)
      workspaceStore.clearWorkspaceDraft()
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
function getPersonEmail(person: unknown): string {
  if (typeof person === "string") {
    return person.includes("@") ? person.trim() : "";
  }
  if (person && typeof person === "object" && "email" in person) {
    return String((person as { email?: string }).email || "").trim();
  }
  return "";
}

function assignedPeopleCount(role: { people?: unknown[] }): number {
  return (role.people || []).filter((p) => !!getPersonEmail(p)).length;
}

const total_resorces_recommened = computed(() => {
  return project.value.variables?.roles
    ? project.value.variables.roles.reduce(
        (sum: number, role: { max_num_people?: number }) =>
          sum + (role.max_num_people || 0),
        0,
      )
    : 0;
});

const total_resorces = computed(() =>
  project.value.variables?.roles
    ? project.value.variables.roles.reduce(
        (sum: number, role: { people?: unknown[] }) =>
          sum + assignedPeopleCount(role),
        0,
      )
    : 0,
);

const modulesSummary = computed(() => {
  const modules = project.value?.modules || [];
  const count = modules.length;
  const totalSheets = modules.reduce(
    (sum: number, mod: { sheets?: unknown[] }) => sum + (mod.sheets?.length || 0),
    0,
  );
  return { count, totalSheets };
});
function createProjectHandler() {
  createWorkspace({
    ...(authStore.company_id ? { company_id: authStore.company_id } : {}),
    ...project.value,
  });
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

<style scoped>
.step-enter {
  opacity: 0;
  animation: slideUpFade 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.step-enter-1 { animation-delay: 0.05s; }
.step-enter-2 { animation-delay: 0.15s; }
.step-enter-3 { animation-delay: 0.25s; }
.step-enter-4 { animation-delay: 0.35s; }
.step-enter-5 { animation-delay: 0.45s; }

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
