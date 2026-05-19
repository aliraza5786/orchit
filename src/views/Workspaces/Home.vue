<template>
  <div class="w-full bg-bg-surface/70 text-text-primary">
    <div class="mx-auto w-full max-w-360 px-5 pt-10 pb-10 md:px-15">
      <!-- Sophisticated Workspace Header -->
      <div
        class="relative overflow-hidden rounded-xl bg-bg-card/60 p-8 md:px-10 md:py-8 shadow-sm shadow-accent/30"
      >
        <!-- Animated Background Elements -->
        <div class="absolute inset-0 overflow-hidden pointer-events-none">
          <!-- Main Floating Circles -->
          <svg
            class="absolute -right-20 -top-20 w-80 h-80 opacity-[0.08] text-accent animate-float-slow"
            viewBox="0 0 200 200"
          >
            <circle cx="100" cy="100" r="80" fill="currentColor" />
          </svg>
          <svg
            class="absolute -left-10 -bottom-10 w-64 h-64 opacity-[0.06] text-purple-500 animate-float-delayed"
            viewBox="0 0 200 200"
          >
            <circle cx="100" cy="100" r="70" fill="currentColor" />
          </svg>

          <!-- Floating Icons/Shapes -->
          <svg
            class="absolute left-1/3 top-4 w-12 h-12 opacity-[0.07] text-accent animate-pulse-slow"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M12,2L14.5,8.5L21,10L16,14.5L17.5,21L12,17.5L6.5,21L8,14.5L3,10L9.5,8.5L12,2Z"
            />
          </svg>
          <svg
            class="absolute right-1/4 bottom-10 w-8 h-8 opacity-[0.05] text-purple-400 animate-float-reverse"
            viewBox="0 0 24 24"
          >
            <rect
              x="4"
              y="4"
              width="16"
              height="16"
              rx="4"
              fill="currentColor"
            />
          </svg>

          <!-- Small Floating Dots -->
          <div
            class="absolute top-1/4 left-10 h-1.5 w-1.5 rounded-full bg-accent/20 animate-pulse"
          />
          <div
            class="absolute bottom-1/4 right-20 h-2 w-2 rounded-full bg-purple-400/20 animate-float-slow"
            style="animation-delay: 1s"
          />
          <div
            class="absolute top-1/2 right-1/3 h-1 w-1 rounded-full bg-accent/30 animate-pulse"
            style="animation-delay: 3s"
          />
        </div>

        <div
          class="relative flex flex-col md:flex-row md:items-center justify-between gap-8"
        >
          <div class="flex flex-col gap-3.5 max-w-3xl">
            <div class="flex items-center gap-2">
              <span
                class="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/80"
                >{{ timeGreeting }}</span
              >
              <div class="h-1 w-1 rounded-full bg-border" />
              <!-- <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Dashboard Overview</span> -->
            </div>

            <div class="flex flex-col gap-1.5">
              <h1
                class="text-3xl md:text-[2.5rem] font-bold tracking-tight text-text-primary leading-tight"
              >
                Welcome, <span class="text-accent">{{ userName }}</span>
              </h1>
              <p
                class="text-[15px] text-text-secondary font-medium leading-relaxed max-w-2xl"
              >
                Create, organize, and collaborate seamlessly. Your central hub
                for all project management and team communication.
              </p>
            </div>

            <div class="flex flex-wrap items-center gap-x-8 gap-y-3 mt-1.5">
              <div class="flex items-center gap-2.5 group cursor-default">
                <div
                  class="h-6 w-6 rounded-md bg-accent/5 flex items-center justify-center text-accent"
                >
                  <i class="fa-solid fa-layer-group text-[10px]"></i>
                </div>
                <div class="flex flex-col">
                  <span class="text-[13px] font-bold text-text-primary"
                    >{{
                      galleryWorkspaces?.workspaces?.length || 0
                    }}
                    Workspaces</span
                  >
                </div>
              </div> 
            </div>
          </div>

          <div class="shrink-0">
            <Button
              :disabled="!isCreatingWorkspace"
              :title="isCreatingWorkspace ? '' : 'You are not authorized to create workspace'"
              variant="primary"
              size="lg"
              @click="handleCreateWorkspace"
              class="h-10 px-6 rounded-[6px] shadow-md shadow-accent/10 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 font-bold text-[14px]"
            >
              <i class="fa-solid fa-plus mr-2 text-xs"></i>
              Create Workspace
            </Button>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <div class="mt-10 mb-8 flex items-center justify-between min-w-max">
           <div
              class="w-48 border border-border hover:border-accent rounded-[6px] transition-colors duration-150"
            >
              <BaseSelectField
                v-model="filter"
                :options="filterOptions"
                size="md"
                placeholder="Filter Workspaces"
                class="border-transparent"
              />
            </div>
          
          <div class="flex items-center gap-1 border border-border rounded-[6px] px-1 py-1"> 
            <button
              class="aspect-square w-8 cursor-pointer rounded-[6px] p-1 hover:shadow-0"
              :class="
                currentView === 'list'
                  ? 'text-accent bg-accent/20'
                  : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-0 hover:text-accent'
              "
              @click="setView('list')"
              title="List view"
            >
              <i class="fa-solid fa-align-left"></i>
            </button>

            <button
              class="aspect-square w-8 cursor-pointer rounded-[6px] p-1"
              :class="
                currentView === 'gallery'
                  ? 'text-accent bg-accent/20'
                  : 'hover:bg-border/50 backdrop-blur-2xl transition-all duration-75 hover:outline-border hover:outline hover:text-accent'
              "
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
        <WorkspaceListTable
          :workspaces="galleryWorkspaces?.workspaces || []"
          :loading="isGalleryLoading"
          :filter="filter"
          @share="openShareModal"
          @archive="handleArchive"
          @delete="openDeleteConfirm"
          @invite="openInviteModal"
        />
      </div>

      <div v-show="currentView === 'gallery'">
        <ProjectGallery
          :projects="galleryWorkspaces?.workspaces || []"
          :loading="isGalleryLoading"
          :filter="filter"
          @share="openShareModal"
          @archive="handleArchive"
          @delete="openDeleteConfirm"
        />
      </div>

      <!-- Modals Shared Between Views -->
      <InviteUsersWithPermissions
        v-model="showInviteModal"
        :defaultWorkspaceId="selectedInvitingWorkspaceId"
      />
      <ShareModal
        v-if="selectedShareWorkspace"
        v-model="showShareModal"
        resource-type="workspace"
        :resourceId="selectedShareWorkspace._id"
        :modulesAndUsers="workspaceModulesAndUsers"
        :modulesAndUsersLoading="isModulesAndUsersPending"
        @shared="queryClient.invalidateQueries({ queryKey: ['workspaces'] })"
      />
      <ConfirmDeleteModal
        v-model="showDeleteConfirm"
        title="Delete Workspace"
        :item-label="'workspace'"
        :item-name="workspaceToAction?.variables?.title || 'this workspace'"
        :require-match-text="workspaceToAction?.variables?.title || ''"
        :loading="isDeleting"
        confirm-text="Delete Workspace"
        size="md"
        @confirm="onConfirmDelete"
        @cancel="showDeleteConfirm = false"
      >
        <template #message>
          <p class="text-sm text-text-secondary leading-relaxed">
            This action
            <span
              class="font-bold text-red-500 underline decoration-red-500/30 underline-offset-4"
              >cannot be undone</span
            >. This will permanently delete the workspace
            <span
              class="font-semibold text-text-primary px-1.5 py-0.5 bg-bg-card border border-border rounded-md"
            >
              {{ workspaceToAction?.variables?.title }}
            </span>
            and all associated data, tasks, and files.
          </p>
        </template>
      </ConfirmDeleteModal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick } from "vue";
import Button from "../../components/ui/Button.vue";
import ProjectGallery from "../../components/ui/ProjectGallery.vue";
import WorkspaceListTable from "./components/WorkspaceListTable.vue";
import {
  useWorkspaces,
  useDeleteWorkspace,
  useArchiveWorkspace,
  useWorkspaceModulesAndUsers,
} from "../../queries/useWorkspace";
import { useWorkspaceStore } from "../../stores/workspace";
import { useAuthStore } from "../../stores/auth";
import { useRouter, useRoute } from "vue-router";
import BaseSelectField from "../../components/ui/BaseSelectField.vue";
import { useQueryClient } from "@tanstack/vue-query";
import { toast } from "vue-sonner";
import { useProfile } from "../../services/user";
import { useCompanyUsers } from "../../queries/useCompanyUsers";

// Modals
import InviteUsersWithPermissions from "./Modals/InviteUsersWithPermissions.vue";
import ConfirmDeleteModal from "../Product/modals/ConfirmDeleteModal.vue";
import ShareModal from "../../layout/WorkspaceLayout/components/ShareModal.vue";

// @ts-ignore
import confetti from "canvas-confetti";

const router = useRouter();
const route = useRoute();
const queryClient = useQueryClient();
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();

const userName = computed(() => {
  const name = authStore.user?.data?.u_full_name || authStore.user?.name;
  return name ? name.split(" ")[0] + '!' : "there!";
});

type View = "list" | "gallery";
const currentView = ref<View>("list");
const setView = (v: View) => {
  currentView.value = v;
};
const filter = ref("all");

const filterOptions = [
  { title: "All Workspaces", _id: "all" },
  { title: "Organization", _id: "organization" },
  { title: "Private", _id: "private" },
  { title: "Shared", _id: "shared" },
  { title: "Archived", _id: "archived" },
  { title: "Deleted", _id: "deleted" },
];

// --- Workspace Actions State ---
const showInviteModal = ref(false);
const selectedInvitingWorkspaceId = ref<string | number | undefined>(undefined);
const showDeleteConfirm = ref(false);
const workspaceToAction = ref<any>(null);
const isDeleting = ref(false);

const showShareModal = ref(false);
const selectedShareWorkspace = ref<any>(null);

const selectedShareWorkspaceId = computed(
  () => selectedShareWorkspace.value?._id ?? "",
);
const { data: workspaceModulesAndUsers, isPending: isModulesAndUsersPending } =
  useWorkspaceModulesAndUsers(selectedShareWorkspaceId);

// --- Mutation Hooks ---
const { mutate: deleteWorkspace } = useDeleteWorkspace({
  onSuccess: () => {
    toast.success("Workspace deleted successfully");
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    showDeleteConfirm.value = false;
    isDeleting.value = false;
  },
  onError: (err: any) => {
    isDeleting.value = false;
    toast.error(err?.response?.data?.message || "Failed to delete workspace");
  },
});

const { mutate: archiveWorkspace } = useArchiveWorkspace({
  onSuccess: () => {
    const msg =
      filter.value === "archived"
        ? "Workspace unarchived successfully"
        : "Workspace archived successfully";
    toast.success(msg);
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  },
  onError: (err: any) => {
    toast.error(err?.response?.data?.message || "Failed to archive workspace");
  },
});

// --- Action Handlers ---
const handleArchive = (ws: any) => {
  archiveWorkspace({ id: ws._id });
};

const openDeleteConfirm = (ws: any) => {
  workspaceToAction.value = ws;
  showDeleteConfirm.value = true;
};

const onConfirmDelete = () => {
  if (!workspaceToAction.value) return;
  isDeleting.value = true;
  deleteWorkspace({ id: workspaceToAction.value._id });
};

const openShareModal = (ws: any) => {
  selectedShareWorkspace.value = ws;
  showShareModal.value = true;
};

const openInviteModal = (ws: any) => {
  selectedInvitingWorkspaceId.value = ws._id;
  showInviteModal.value = true;
};

// --- Data Fetching ---
const galleryPageSize = ref(1000);
const {
  data: galleryWorkspaces,
  isPending: galleryPending,
  isFetching: galleryFetching,
} = useWorkspaces(ref(1), galleryPageSize, filter, ref(false));

const isGalleryLoading = computed(
  () => galleryPending.value || galleryFetching.value,
);

const timeGreeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
});

// --- Verification Logic ---
const { data: profile } = useProfile();
const { data: usersData } = useCompanyUsers(
  computed(() => ({ company_id: authStore.company_id || '' })).value
);
console.log("suer profile data", profile.value?.data?.active_company);
const isCreatingWorkspace = computed(() => {
  return profile.value?.data?.active_company?.membership_role !== 'member';
});
const members = computed(() => {
  const raw = usersData.value?.data?.users ?? usersData.value?.users ?? [];
  return Array.isArray(raw) ? raw : [];
});
const owner = computed(() => members.value.find((m: any) => m.is_owner));

const isUserVerified = computed(() => {
  if (!authStore.company_id) return true;
  const profileVal = profile.value?.data;
  const activeCompany = profileVal?.active_company;
  
  const isSuperAdminActiveVal = owner.value?.membership_status === 'active';
  const isCurrentUserActive = activeCompany?.membership_status === 'active';
  const isPendingOtp = activeCompany?.membership_status === 'pending_super_admin_otp';

  if ((isSuperAdminActiveVal || isCurrentUserActive) && !isPendingOtp) {
    return true;
  }

  if (profileVal?.isUserVerified === true || profileVal?.isUserVerified === 'true') return true;
  if (profileVal?.is_verified === true || profileVal?.is_verified === 'true') return true;
  if (profileVal?.u_verified === true || profileVal?.u_verified === 'true') return true;
  if (activeCompany?.isUserVerified === true || activeCompany?.isUserVerified === 'true') return true;

  return false;
});

const canCreateWorkspace = computed(() => isUserVerified.value);

const restrictionMessage = computed(() => {
  if (!isUserVerified.value) return "Verify user first";
  return "";
});
 

function launchConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;
  const colors = ["#7c5cfc", "#22c55e", "#f59e0b", "#ef4444"];

  const frame = () => {
    confetti({
      particleCount: 6,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 6,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  };

  frame();
}

function handleCreateWorkspace() {
  if (!canCreateWorkspace.value) {
    toast.error(restrictionMessage.value);
    return;
  }
  
  const wsFeature = workspaceStore.getFeature("no-of-workspaces");
  if (wsFeature && wsFeature.usage.current >= wsFeature.limits.limit) {
    workspaceStore.setLimitExccedModal(true);
  } else {
    router.push("/create-workspace");
  }
}

onMounted(async () => {
  await nextTick();
  const paramsToRemove = ["welcome", "_auth", "_cid"];
  const query = { ...route.query };
  let dirty = false;

  paramsToRemove.forEach((param) => {
    if (param in query) {
      delete query[param];
      dirty = true;
    }
  });

  if (dirty) router.replace({ path: route.path, query });
  if (route.query.welcome === "1") launchConfetti();
});
</script>

<style scoped>
@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(20px, -20px) scale(1.05);
  }
  66% {
    transform: translate(-10px, 15px) scale(0.95);
  }
}

@keyframes float-reverse {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(-15px, 10px) scale(0.98);
  }
  66% {
    transform: translate(15px, -15px) scale(1.02);
  }
}

.animate-float-slow {
  animation: float 12s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float 15s ease-in-out infinite 2s;
}

.animate-float-reverse {
  animation: float-reverse 10s ease-in-out infinite;
}

.animate-pulse-slow {
  animation: pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.1;
    transform: scale(1);
  }
  50% {
    opacity: 0.2;
    transform: scale(1.1);
  }
}

button:hover {
  box-shadow: none;
  outline: none !important;
}
</style>
