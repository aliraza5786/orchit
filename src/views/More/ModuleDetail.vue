<template>
    <div class="flex flex-col w-full h-full overflow-y-auto bg-bg-card rounded-lg border border-border overflow-hidden">
  
      <!-- Header -->
      <header class="sticky top-0 w-full z-10 bg-bg-card/80 backdrop-blur border-b border-border">
        <div class="mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="flex flex-col gap-2">
            <router-link :to="`/workspace/more/${workspaceId}`"> 
              <button class="text-sm text-text-secondary cursor-pointer hover:underline flex gap-2 items-center">
                <i class="fa-solid fa-arrow-left"></i> Back to Apps
              </button>
            </router-link>
  
            <!-- Skeleton for header -->
            <div v-if="isModulePending" class="space-y-2">
              <div class="h-6 w-48 bg-bg-body rounded"></div>
              <div class="h-4 w-96 bg-bg-body/80 rounded"></div>
              <div class="h-3 w-32 bg-bg-body/80 rounded"></div>
            </div>
  
            <!-- Actual header -->
            <div v-else>
              <h1 class="text-3xl font-semibold tracking-tight mt-2 capitalize">{{ moduleDetail?.title }}</h1>
              <p class="text-sm text-text-secondary max-w-4xl mt-2">{{ moduleDetail?.description }}</p>
              <p class="text-xs text-text-secondary mt-2">12.5k views · 348 using</p>
            </div>
          </div>
  
          <div class="flex items-center gap-2">
            <Button size="sm" :disabled="isModulePending">Use this Module</Button>
            <button class="border border-border rounded-lg w-9 h-9 text-text-secondary hover:text-accent flex items-center justify-center">
              <span>♡</span>
            </button>
          </div>
        </div>
      </header>
  
      <main class="mx-auto w-full p-6 pb-16">
  
        <div class="flex flex-col lg:flex-row gap-4 justify-between">
  
          <!-- White Board Area -->
          <div class="flex-auto border overflow-x-auto border-border bg-bg-card rounded-lg min-h-[420px]">
            <div class="flex px-4 py-2 justify-between items-center border-b border-border">
              <Dropdown v-if="!isModulePending" v-model="selected_sheet_id" :options="moduleDetail?.sheets" variant="secondary" />
              <div v-else class="h-8 w-32 bg-bg-body rounded"></div>
            </div>
  
            <div class="rounded-lg space-y-3 w-full">
              <KanbanSkeleton v-show="isPending" />
              <div v-show="!isPending" class="flex w-full overflow-x-auto gap-3 p-4 scrollbar-visible">
                <KanbanView :columns="Lists?.groups"></KanbanView>
              </div>
            </div>
          </div>
  
          <!-- Tags Right Sidebar -->
          <aside class="w-full lg:w-64 min-w-[375px] border border-border bg-bg-card rounded-lg p-4 h-fit">
            <h3 class="font-medium text-sm">Tags</h3>
  
            <!-- Skeleton tags -->
            <div v-if="isModulePending" class="mt-3 flex flex-wrap gap-2">
              <div class="h-6 w-16 bg-bg-body rounded"></div>
              <div class="h-6 w-12 bg-bg-body rounded"></div>
              <div class="h-6 w-20 bg-bg-body rounded"></div>
            </div>
  
            <!-- Actual tags -->
            <div v-else class="mt-3 flex flex-wrap gap-2">
              <span v-for="t in moduleDetail?.tags" :key="t"
                    class="border border-border bg-bg-surface cursor-pointer rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-accent/50 hover:text-white">
                {{ t }}
              </span>
            </div>
  
            <h3 class="font-medium text-sm mt-6">Share</h3>
            <div class="mt-3 flex gap-2">
              <button class="border border-border rounded-lg w-9 h-9 text-text-secondary hover:text-accent flex items-center justify-center">⇪</button>
              <button class="border border-border rounded-lg w-9 h-9 text-text-secondary hover:text-accent flex items-center justify-center">⤫</button>
              <button class="border border-border rounded-lg w-9 h-9 text-text-secondary hover:text-accent flex items-center justify-center">Ｆ</button>
            </div>
  
            <p class="text-xs text-text-secondary mt-6">Published 3 weeks ago</p>
            <button class="text-xs text-text-secondary underline mt-1">Report resource</button>
          </aside>
        </div>
  
        <!-- Comments -->
        <section class="mt-12 w-full">
          <h2 class="font-semibold text-base mb-3">Comments</h2>
  
          <!-- Skeleton comment box -->
          <div v-if="isModulePending" class="space-y-2">
            <div class="h-20 w-full bg-bg-body rounded"></div>
            <div class="h-6 w-24 bg-bg-body rounded"></div>
          </div>
  
          <!-- Actual comment box -->
          <div v-else>
            <textarea class="w-full border border-border rounded-lg bg-bg-card text-sm text-text-secondary p-3 focus:outline-none"
                      placeholder="Add a comment..." v-model="comment"></textarea>
            <div class="flex justify-end mt-2">
              <Button @click="postCommentHandler" size="sm">{{ isCommenting ? 'Posting...' : 'Post' }}</Button>
            </div>
          </div>
  
          <div v-if="!isModulePending" class="mt-6 text-sm">
            <span>{{ commentLists.length }} comments</span>
            <div v-for="c in commentLists" :key="c._id" class="flex gap-3 mt-4 border-b border-border pb-2">
              <img v-if="c.user_id?.u_profile_image" class="w-8 h-8 bg-bg-surface rounded-full" :src="c.user_id.u_profile_image" />
              <div v-else class="w-8 h-8 rounded-full bg-accent/40 flex justify-center items-center">{{ getInitials(c?.user_id?.u_full_name) }}</div>
              <div>
                <p class="font-medium capitalize">{{ c?.user_id?.u_full_name }}</p>
                <p class="text-text-secondary text-xs">{{ c?.time }}</p>
                <p class="mt-1 font-light text-sm">{{ c?.comment }}</p>
              </div>
            </div>
          </div>
  
        </section>
      </main>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, computed } from 'vue';
  import KanbanSkeleton from '../../components/skeletons/KanbanSkeleton.vue';
  import Button from '../../components/ui/Button.vue';
  import Dropdown from '../../components/ui/Dropdown.vue';
  import { useRouteIds } from '../../composables/useQueryParams';
  import { useCreateComment, useModuleDetail, useModuleLists } from '../../queries/useMore';
  import KanbanView from './components/KanbanView.vue';
  import { getInitials } from '../../utilities';
  
  interface Comment {
    _id: string;
    comment: string;
    time: string;
    user_id?: {
      u_full_name?: string;
      u_profile_image?: string;
    };
  }
  
  const commentLists = ref<Comment[]>([]);
  const selected_sheet_id = ref<string | undefined>();
  const comment = ref('');
  const { moduleId, workspaceId } = useRouteIds();
  
  const { data: moduleDetail, isPending: isModulePending } = useModuleDetail(moduleId);
  const { data: Lists, isPending } = useModuleLists(moduleId.value, selected_sheet_id);
  
  const { mutate: postComment, isPending: isCommenting } = useCreateComment({
    onSuccess: (data: Comment) => {
      comment.value = '';
      commentLists.value = [...commentLists.value, { ...data }];
    }
  });
  
  const postCommentHandler = () => {
    if (!comment.value.trim()) return;
    postComment({
      payload: {
        workspace_module_id: moduleDetail.value?._id,
        comment: comment.value,
      }
    });
  };
  
  watch(moduleDetail, (newVal) => {
    if (newVal?.comments) commentLists.value = [...newVal.comments];
    if (newVal?.sheets?.length) selected_sheet_id.value = newVal.sheets[0]._id;
  }, { immediate: true });
  </script>
  
  <style scoped></style>
  