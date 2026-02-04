<template>
  <div class=" flex flex-col gap-4 h-full overflow-x-auto w-full flex-auto">
    <!-- Header / Overview -->
    <div class="p-5 rounded-[6px] bg-bg-card space-y-6 border border-border">
      <div class="flex items-center justify-between">
        <div class="flex flex-col w-full">
          <h3 class="text-2xl text-text-primary font-semibold">Project Overview</h3>
          <p class="text-sm text-text-secondary mt-2">Last update on {{ formatDateTime(lastUpdateDate) }}</p>

          <!-- Cards Row -->
          <div class="flex gap-2.5 overflow-x-auto w-full py-8 custom_scroll_bar">
            <!-- Loading skeletons -->
            <template v-if="isLoading">
              <SkeletonCard v-for="n in 3" :key="n" />
            </template>

            <!-- Cards with transitions -->
            <TransitionGroup name="list" tag="div" class="flex gap-2.5" v-else>
              <template v-if="cardProgress">
              <button v-for="lane in lanes" :key="lane?.lane_title"
                class="group focus:outline-none border-border border focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
                type="button" role="button" aria-label="Open lane details" @click="onLaneClick(lane)">
                <ProjectCard :ai="false" :doneCard="lane?.status_distribution?.['Done']"
                  :loading="isLoading || lane?.status === 'in_progress'" :title="lane?.lane_title" subtitle=""
                  :progress="cardProgress ? getCardProgress(lane?.total_cards, lane?.status_distribution) : lane?.progress"
                  :totalCard="lane?.total_cards" :status="cardProgress ? '' : (lane?.status ?? '')" :avatars="avatars"
                  date="May 28"
                  class="transition-transform duration-200 ease-out group-hover:shadow-lg  border border-transparent hover:border-border-subtle rounded-xl cursor-pointer" />
              </button>
              </template>
              <template v-else>
              <button v-for="lane in lanes2" :key="`2-${lane?.lane_title}`"
                class="group focus:outline-none border-border border focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl"
                type="button" role="button" aria-label="Open lane details" @click="onLaneClick(lane)">
                <ProjectCard :ai="true" :loading="isLoading || lane?.status === 'in_progress'" :title="lane?.lane_title"
                  subtitle=""
                  :progress="cardProgress ? getCardProgress(lane?.total_cards, lane?.status_distribution) : lane?.progress"
                  :totalCard="lane?.total_cards" :status="cardProgress ? '' : (lane?.status ?? '')" :avatars="avatars"
                  date="May 28"
                  class="transition-transform duration-200 ease-out group-hover:shadow-lg  border border-transparent hover:border-border-subtle rounded-xl cursor-pointer" />

              </button>
              </template> 
            </TransitionGroup>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Column: Team Workload & Recent Activity -->
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 items-start">     
<ProjectPortfolio />
      <!-- Recent Activity -->
   <div class="bg-bg-card w-full p-5 max-h-full rounded-lg overflow-y-auto flex flex-col border border-border">
  <!-- Header -->
  <div class="mb-2 flex items-start justify-between">
  <div>
    <h3 class="text-lg font-semibold text-text-primary">Recent activity</h3>
    <p class="text-sm text-text-secondary mt-1">
      Stay up to date with what's happening across the project.
    </p>
  </div>

  <!-- Expand button -->
  <button
    @click="showAllActivities = true"
    class="text-text-secondary hover:text-text-primary transition-colors"
    title="View all activities"
  >
    <i class="fa-chisel fa-regular fa-expand"></i>
  </button>
</div>


  <!-- Activity List -->
  <div class="space-y-4 overflow-y-auto flex-1">
    <!-- Loading State -->
    <template v-if="isLoadingActivities">
      <div
        v-for="n in 5"
        :key="`skeleton-${n}`"
        class="flex gap-3 pb-2 border-b border-border last:border-0 animate-pulse"
      >
        <!-- Avatar Skeleton -->
        <div class="w-8 h-8 rounded-full bg-bg-body flex-shrink-0"></div>

        <!-- Content Skeleton -->
        <div class="flex-1 min-w-0 space-y-2">
          <div class="space-y-1.5">
            <div class="h-4 bg-bg-body rounded w-32"></div>
            <div class="h-3 bg-bg-body rounded w-full"></div>
            <div class="h-3 bg-bg-body rounded w-3/4"></div>
          </div>
          <div class="h-3 bg-bg-body rounded w-20"></div>
        </div>
      </div>
    </template>

    <!-- Activities Content with Dynamic Grouping -->
    <template v-else-if="dashboardActiviesData?.activities?.length">
      <!-- Today's Activities -->
      <template v-if="groupedActivities.today.length > 0">
        <div class="text-xs font-semibold text-text-secondary mb-3">Today</div>

        <div
          v-for="activity in previewActivities.today"
          :key="activity._id"
          class="flex gap-3 pb-2 border-b border-border last:border-0"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
            :style="{ backgroundColor: avatarColor({ email: activity?.user?.email }) }"
          >
            {{ getInitials(activity?.user?.name) }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-sm text-text-primary flex justify-between">
              <span class="font-semibold text-md text-accent/90 pe-1">
                {{ activity?.user?.name }}
              </span>
               <div class="text-xs text-text-secondary mt-1">
              {{ formatTime(activity?.created_at) }}
            </div>
            </div>
            <span class="text-text-secondary text-sm">
                {{ stripHtml(activity?.message || '') }}
              </span>
           
          </div>
        </div>
      </template>

      <!-- Yesterday's Activities -->
      <template v-if="groupedActivities.yesterday.length > 0">
        <div class="text-xs font-semibold text-text-secondary mb-3">Yesterday</div>

        <div
          v-for="activity in previewActivities.yesterday"
          :key="activity._id"
          class="flex gap-3 pb-2 border-b border-border last:border-0"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
            :style="{ backgroundColor: avatarColor({ email: activity?.user?.email }) }"
          >
            {{ getInitials(activity?.user?.name) }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-sm text-text-primary flex justify-between">
              <span class="font-semibold text-md text-accent/90 pe-1">
                {{ activity?.user?.name }}
              </span>
               <div class="text-xs text-text-secondary font-medium mt-1">
              {{ formatTime(activity?.created_at) }}
            </div>
            </div>
            <span class="text-text-secondary text-sm">
                {{ stripHtml(activity?.message || '') }}
              </span>
          </div>
        </div>
      </template>

      <!-- Older Activities -->
      <template v-if="groupedActivities.older.length > 0">
        <div class="text-xs font-semibold text-text-secondary mb-3">Older</div>

        <div
          v-for="activity in previewActivities.older"
          :key="activity._id"
          class="flex gap-3 pb-2 border-b border-border last:border-0"
        >
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
            :style="{ backgroundColor: avatarColor({ email: activity?.user?.email }) }"
          >
            {{ getInitials(activity?.user?.name) }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-sm text-text-primary flex justify-between">
              <span class="font-semibold text-md text-accent/90 pe-1">
                {{ activity?.user?.name }}
              </span>
               <div class="text-xs text-text-secondary mt-1">
              {{ formatTime(activity?.created_at) }}
            </div>
            </div>
            <span class="text-text-secondary text-sm">
                {{ stripHtml(activity?.message || '') }}
              </span>
          </div>
        </div>
      </template>
    </template>

    <!-- Empty State -->
    <template v-else>
      <div class="flex flex-col items-center justify-center py-10 text-center text-text-secondary h-full">
        <i class="fas fa-clock text-4xl mb-3"></i>
        <h4 class="text-lg font-semibold mb-1">No recent activity</h4>
        <p class="text-sm text-text-secondary/80">
          Activities will appear here once your team starts making updates.
        </p>
      </div>
    </template>
  </div>

  <!-- Responsive Pagination -->
  <div
    v-if="pagination && pagination?.totalPages > 1"
    class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-border"
  >
    <!-- Page Info -->
    <p class="text-xs text-text-secondary order-2 sm:order-1">
      Page {{ currentPage }} of {{ pagination.totalPages }}
    </p>

    <!-- Pagination Controls -->
    <div class="flex items-center gap-1 sm:gap-2 flex-wrap justify-center order-1 sm:order-2">
      <!-- Previous Button -->
      <button
        class="px-2 sm:px-3 py-1.5 cursor-pointer sm:py-1 text-xs sm:text-sm rounded border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        <span class="hidden sm:inline">Prev</span>
        <span class="sm:hidden"><i class="fa-regular fa-chevron-left"></i></span>
      </button>

      <!-- First Page (always visible) -->
      <button
        v-if="pagination?.totalPages > 0"
        class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border transition-colors touch-manipulation min-w-[32px] sm:min-w-[36px]"
        :class="
          1 === currentPage
            ? 'bg-accent text-white border-accent'
            : 'border-border text-text-secondary hover:bg-bg-hover'
        "
        @click="changePage(1)"
      >
        1
      </button>

      <!-- Left Ellipsis -->
      <span 
        v-if="currentPage > 3"
        class="px-1 sm:px-2 text-text-secondary text-xs sm:text-sm"
      >
        ...
      </span>

      <!-- Middle Pages (dynamic based on current page) -->
      <template v-for="page in getPaginationRange()" :key="page">
        <button
          v-if="page !== 1 && page !== pagination?.totalPages"
          class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border transition-colors touch-manipulation min-w-[32px] sm:min-w-[36px]"
          :class="
            page === currentPage
              ? 'bg-accent text-white border-accent'
              : 'border-border text-text-secondary hover:bg-bg-hover'
          "
          @click="changePage(page)"
        >
          {{ page }}
        </button>
      </template>

      <!-- Right Ellipsis -->
      <span 
        v-if="currentPage < pagination?.totalPages - 2"
        class="px-1 sm:px-2 text-text-secondary text-xs sm:text-sm"
      >
        ...
      </span>

      <!-- Last Page (always visible if more than 1 page) -->
      <button
        v-if="pagination?.totalPages > 1"
        class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border transition-colors touch-manipulation min-w-[32px] sm:min-w-[36px]"
        :class="
          pagination.totalPages === currentPage
            ? 'bg-accent text-white border-accent'
            : 'border-border text-text-secondary hover:bg-bg-hover'
        "
        @click="changePage(pagination.totalPages)"
      >
        {{ pagination.totalPages }}
      </button>

      <!-- Next Button -->
      <button
        class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        :disabled="currentPage === pagination?.totalPages"
        @click="changePage(currentPage + 1)"
      >
        <span class="hidden sm:inline">Next</span>
        <span class="sm:hidden"><i class="fa-regular fa-chevron-right"></i></span>
      </button>
    </div>
  </div>
</div>

    </div>
   <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 items-start">
     <!-- Team Workload -->
      <div class="bg-bg-card w-full  max-h-full flex-auto p-5 rounded-lg border border-border">
        <div class="mb-4">
          <h3 class="text-lg font-semibold text-text-primary">Team workload</h3>
          <p class="text-sm text-text-secondary mt-1">
            Monitor the capacity of your team.
            <span v-if="teamSize > 0" class="ml-1">({{ teamSize }} member{{ teamSize !== 1 ? 's' : '' }})</span>
          </p>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between text-sm font-medium text-text-secondary mb-2">
            <span>Assignee</span>
            <span>Work distribution</span>
          </div>

          <!-- Loading State -->
          <template v-if="isLoadingTeams">
            <div v-for="n in 3" :key="n" class="flex items-center gap-3 animate-pulse">
              <div class="flex items-center gap-2 w-32 flex-shrink-0">
                <div class="w-8 h-8 rounded-full bg-bg-body"></div>
                <div class="h-4 w-20 bg-bg-body rounded"></div>
              </div>
              <div class="flex-1 h-6 bg-bg-body rounded"></div>
            </div>
          </template>

          <!-- Error State -->
          <div v-else-if="teamsError" class="text-center py-8">
            <p class="text-sm text-red-500 mb-2">Failed to load team workload</p>
            <button @click="() => refetchTeams()" class="text-xs text-accent hover:underline">
              Try again
            </button>
          </div>

          <!-- Empty State -->
          <div v-else-if="teamWorkload.length === 0" class="text-center py-8">
            <i class="pi pi-users text-3xl text-text-secondary mb-2"></i>
            <p class="text-sm text-text-secondary">No team members assigned yet</p>
          </div>

          <!-- Workload items -->
          <div v-else v-for="member in teamWorkload" :key="member.id" class="flex items-center gap-3">
            <div class="flex items-center gap-2 w-32 flex-shrink-0">
              <div v-if="member.avatarUrl" class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img :src="member?.avatarUrl" :alt="member.name" class="w-full h-full object-cover" />
              </div>
              <div v-else-if="member.avatar"
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                :style="{ backgroundColor: avatarColor({ name: member?.name }) }">
                {{ getInitials(member?.name) }}
              </div>
              <div v-else class="w-8 h-8 rounded-full bg-bg-body flex items-center justify-center flex-shrink-0">
                <i class="pi pi-user text-text-secondary"></i>
              </div>
              <span class="text-sm text-text-primary truncate" :title="member?.name">{{ member?.name }}</span>
            </div>

            <div class="flex-1">
              <div class="h-6 bg-bg-body rounded overflow-hidden relative group cursor-help"
                :title="`${member.totalTasks} task${member.totalTasks !== 1 ? 's' : ''} • ${member.totalHours}h`">
                <div class="h-full  transition-all duration-300"
                :class="isDark ? 'bg-accent':'!bg-accent-hover/40'"
                  :style="{ width: member.workload + '%' }">
                </div>
                <span v-if="member.workload > 0"
                  class="absolute inset-0 flex items-center justify-start px-2 text-[11px] font-medium" :class="isDark ? 'text-white':'text-black'">
                  {{ member.workload }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    <ProjectUpcomingDeadlines />
   </div>
   <Teleport to="body" v-if="groupedActivities">
  <div
    v-if="showAllActivities"
    class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
  >
    <div class="bg-bg-card w-full max-w-4xl max-h-[85vh] rounded-lg flex flex-col border border-border">

      <!-- Modal Header -->
      <div class="p-4 flex items-center justify-between border-b border-border">
        <h3 class="text-lg font-semibold text-text-primary">
          All Activities
        </h3>
        <button
          @click="showAllActivities = false"
          class="text-text-secondary hover:text-text-primary"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto p-5 space-y-4">

        <!-- Loading State -->
        <template v-if="isLoadingActivities">
          <div
            v-for="n in 5"
            :key="`skeleton-${n}`"
            class="flex gap-3 pb-2 border-b border-border last:border-0 animate-pulse"
          >
            <div class="w-8 h-8 rounded-full bg-bg-body flex-shrink-0"></div>
            <div class="flex-1 min-w-0 space-y-2">
              <div class="space-y-1.5">
                <div class="h-4 bg-bg-body rounded w-32"></div>
                <div class="h-3 bg-bg-body rounded w-full"></div>
                <div class="h-3 bg-bg-body rounded w-3/4"></div>
              </div>
              <div class="h-3 bg-bg-body rounded w-20"></div>
            </div>
          </div>
        </template>

        <!-- Activities grouped by today/yesterday/older -->
        <template v-else-if="groupedActivities.today.length || groupedActivities.yesterday.length || groupedActivities.older.length">
          
          <!-- Today's Activities -->
          <template v-if="groupedActivities.today.length > 0">
            <div class="text-xs font-semibold text-text-secondary mb-3 flex justify-between items-center">
              <span>Today</span>
              <span class="text-xs text-text-secondary">
                {{ groupedActivities.today.length }} activities
              </span>
            </div>

            <div
              v-for="activity in groupedActivities.today"
              :key="activity._id"
              class="flex gap-3 pb-2 border-b border-border last:border-0"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                :style="{ backgroundColor: avatarColor({ email: activity?.user?.email }) }"
              >
                {{ getInitials(activity?.user?.name) }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="text-sm text-text-primary flex justify-between">
                  <span class="font-semibold text-md text-accent/90 pe-1">
                    {{ activity?.user?.name }}
                  </span>
                  <div class="text-xs text-text-secondary mt-1">
                    {{ formatTime(activity?.created_at) }}
                  </div>
                </div>
                <span class="text-text-secondary text-sm">
                  {{ stripHtmlModal(activity?.message || '') }}
                </span>
              </div>
            </div>
          </template>

          <!-- Yesterday's Activities -->
          <template v-if="groupedActivities.yesterday.length > 0">
            <div class="text-xs font-semibold text-text-secondary mb-3 flex justify-between items-center">
              <span>Yesterday</span>
              <span class="text-xs text-text-secondary">
                {{ groupedActivities.yesterday.length }} activities
              </span>
            </div>

            <div
              v-for="activity in groupedActivities.yesterday"
              :key="activity._id"
              class="flex gap-3 pb-2 border-b border-border last:border-0"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                :style="{ backgroundColor: avatarColor({ email: activity?.user?.email }) }"
              >
                {{ getInitials(activity?.user?.name) }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="text-sm text-text-primary flex justify-between">
                  <span class="font-semibold text-md text-accent/90 pe-1">
                    {{ activity?.user?.name }}
                  </span>
                  <div class="text-xs text-text-secondary mt-1">
                    {{ formatTime(activity?.created_at) }}
                  </div>
                </div>
                <span class="text-text-secondary text-sm">
                  {{ stripHtmlModal(activity?.message || '') }}
                </span>
              </div>
            </div>
          </template>

          <!-- Older Activities -->
          <template v-if="groupedActivities.older.length > 0">
            <div class="text-xs font-semibold text-text-secondary mb-3 flex justify-between items-center">
              <span>Older</span>
              <span class="text-xs text-text-secondary">
                {{ groupedActivities.older.length }} activities
              </span>
            </div>

            <div
              v-for="activity in groupedActivities.older"
              :key="activity._id"
              class="flex gap-3 pb-2 border-b border-border last:border-0"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                :style="{ backgroundColor: avatarColor({ email: activity?.user?.email }) }"
              >
                {{ getInitials(activity?.user?.name) }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="text-sm text-text-primary flex justify-between">
                  <span class="font-semibold text-md text-accent/90 pe-1">
                    {{ activity?.user?.name }}
                  </span>
                  <div class="text-xs text-text-secondary mt-1">
                    {{ formatTime(activity?.created_at) }}
                  </div>
                </div>
                <span class="text-text-secondary text-sm">
                  {{ stripHtmlModal(activity?.message || '') }}
                </span>
              </div>
            </div>
          </template>

        </template>

        <!-- Empty State -->
        <template v-else>
          <div class="flex flex-col items-center justify-center py-10 text-center text-text-secondary h-full">
            <i class="fas fa-clock text-4xl mb-3"></i>
            <h4 class="text-lg font-semibold mb-1">No recent activity</h4>
            <p class="text-sm text-text-secondary/80">
              Activities will appear here once your team starts making updates.
            </p>
          </div>
        </template>

      </div>
       <div
    v-if="pagination && pagination?.totalPages > 1"
    class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-4 border-t border-border p-5"
  >
    <!-- Page Info -->
    <p class="text-xs text-text-secondary order-2 sm:order-1">
      Page {{ currentPage }} of {{ pagination.totalPages }}
    </p>

    <!-- Pagination Controls -->
    <div class="flex items-center gap-1 sm:gap-2 flex-wrap justify-center order-1 sm:order-2">
      <!-- Previous Button -->
      <button
        class="px-2 sm:px-3 py-1.5 cursor-pointer sm:py-1 text-xs sm:text-sm rounded border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        <span class="hidden sm:inline">Prev</span>
        <span class="sm:hidden"><i class="fa-regular fa-chevron-left"></i></span>
      </button>

      <!-- First Page (always visible) -->
      <button
        v-if="pagination?.totalPages > 0"
        class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border transition-colors touch-manipulation min-w-[32px] sm:min-w-[36px]"
        :class="
          1 === currentPage
            ? 'bg-accent text-white border-accent'
            : 'border-border text-text-secondary hover:bg-bg-hover'
        "
        @click="changePage(1)"
      >
        1
      </button>

      <!-- Left Ellipsis -->
      <span 
        v-if="currentPage > 3"
        class="px-1 sm:px-2 text-text-secondary text-xs sm:text-sm"
      >
        ...
      </span>

      <!-- Middle Pages (dynamic based on current page) -->
      <template v-for="page in getPaginationRange()" :key="page">
        <button
          v-if="page !== 1 && page !== pagination?.totalPages"
          class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border transition-colors touch-manipulation min-w-[32px] sm:min-w-[36px]"
          :class="
            page === currentPage
              ? 'bg-accent text-white border-accent'
              : 'border-border text-text-secondary hover:bg-bg-hover'
          "
          @click="changePage(page)"
        >
          {{ page }}
        </button>
      </template>

      <!-- Right Ellipsis -->
      <span 
        v-if="currentPage < pagination?.totalPages - 2"
        class="px-1 sm:px-2 text-text-secondary text-xs sm:text-sm"
      >
        ...
      </span>

      <!-- Last Page (always visible if more than 1 page) -->
      <button
        v-if="pagination?.totalPages > 1"
        class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border transition-colors touch-manipulation min-w-[32px] sm:min-w-[36px]"
        :class="
          pagination.totalPages === currentPage
            ? 'bg-accent text-white border-accent'
            : 'border-border text-text-secondary hover:bg-bg-hover'
        "
        @click="changePage(pagination.totalPages)"
      >
        {{ pagination.totalPages }}
      </button>

      <!-- Next Button -->
      <button
        class="px-2 sm:px-3 py-1.5 sm:py-1 cursor-pointer text-xs sm:text-sm rounded border border-border text-text-secondary hover:bg-bg-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
        :disabled="currentPage === pagination?.totalPages"
        @click="changePage(currentPage + 1)"
      >
        <span class="hidden sm:inline">Next</span>
        <span class="sm:hidden"><i class="fa-regular fa-chevron-right"></i></span>
      </button>
    </div>
  </div>
    </div>
  </div>
</Teleport>


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, defineComponent, h, watch } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import ProjectCard from '../components/feature/ProjectCard.vue'
import { toParamString } from '../composables/useQueryParams'
import { useDashboardActivities, useDashboardTeams } from '../queries/usePeople' 
import { getInitials, generateAvatarColor } from '../utilities'
import { avatarColor } from '../utilities/avatarColor'
import type { TeamWorkloadMember } from '../types'
import { useTheme } from "../composables/useTheme"; 
import { formatDateTime } from "../utilities/FormatDate";
import { useWorkspaceStore } from "../stores/workspace"; 
import ProjectPortfolio from '../components/peak/ProjectPortfolio.vue'
import ProjectUpcomingDeadlines from '../components/peak/UpcomingDeadlines.vue'
const { isDark } = useTheme();
const workspaceStore = useWorkspaceStore();

const route = useRoute()
const workspaceId = computed<string>(() => toParamString(route?.params?.id))
const jobId = computed<string>(() => toParamString(route?.params?.job_id))
const showAllActivities = ref(false)
/** Types */
interface LaneProgressRow {
  lane_title: string
  progress?: number
  status?: string
  total_cards?: number
  status_distribution?: Record<string, number>
  [key: string]: any
}

interface TaskProgress {
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled' | string
  percent: number
  message: string
  progress_details?: { lanes_progress?: LaneProgressRow[] }
  result?: { sheet_lists?: number; cards?: number; lanes_summary: any }
  error?: string
  updated_at: string
}

interface Activity {
  _id: string
  message: string
  created_at: string
  user: {
    _id: string
    name: string
    email: string
  }
  card?: {
    _id: string
    title: string
  }
}

interface GroupedActivities {
  today: Activity[]
  yesterday: Activity[]
  older: Activity[]
}

/** Current page for activities pagination */
const currentPage = ref(1)

/** Pagination helper */
const getPaginationRange = (): number[] => {
  if (!pagination.value) return []
  
  const total = pagination.value.totalPages
  const current = currentPage.value
  const range: number[] = []

  // Show pages around current page
  // On mobile: show current and ±1 page
  // On desktop: show current and ±2 pages
  const delta = window.innerWidth < 640 ? 1 : 2

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }

  return range
}

/** Group activities by date */
const groupedActivities = computed<GroupedActivities>(() => {
  if (!dashboardActiviesData.value?.activities?.length) {
    return { today: [], yesterday: [], older: [] }
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  const groups: GroupedActivities = {
    today: [],
    yesterday: [],
    older: []
  }

  dashboardActiviesData.value.activities.forEach((activity: Activity) => {
    const activityDate = new Date(activity.created_at)
    const activityStart = new Date(
      activityDate.getFullYear(),
      activityDate.getMonth(),
      activityDate.getDate()
    )

    if (activityStart.getTime() === todayStart.getTime()) {
      groups.today.push(activity)
    } else if (activityStart.getTime() === yesterdayStart.getTime()) {
      groups.yesterday.push(activity)
    } else {
      groups.older.push(activity)
    }
  })

  return groups
})
const PREVIEW_LIMIT = 3
const PREVIEW_LIMIT_OLDER_ONLY = 6

const previewActivities = computed(() => {
  const today = groupedActivities.value?.today ?? []
  const yesterday = groupedActivities.value?.yesterday ?? []
  const older = groupedActivities.value?.older ?? []

  // If today or yesterday exist, limit each to PREVIEW_LIMIT
  if (today.length > 0 || yesterday.length > 0) {
    return {
      today: today.slice(0, PREVIEW_LIMIT),
      yesterday: yesterday.slice(0, PREVIEW_LIMIT),
      older: older.slice(0, PREVIEW_LIMIT),
    }
  }

  // If both today & yesterday empty, show more older activities
  return {
    today: [],
    yesterday: [],
    older: older.slice(0, PREVIEW_LIMIT_OLDER_ONLY),
  }
})


/** Helper function to format time */
const formatTime = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
  } else if (diffInDays === 1) {
    return 'Yesterday at ' + date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    })
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    })
  }
}

/** Queries for team + activities */
const {
  data: dashboardTeamsData,
  isPending: isLoadingTeams,
  error: teamsError,
  refetch: refetchTeams
} = useDashboardTeams(workspaceId)

const { 
  data: dashboardActiviesData, 
  isLoading: isLoadingActivities 
} = useDashboardActivities(workspaceId, currentPage)

const workspace = computed(() => workspaceStore.singleWorkspace)

const lastUpdateDate = computed(() => {
  const activities = dashboardActiviesData.value?.activities
  const workspaceCreatedAt = workspaceStore.singleWorkspace?.created_at || workspace.value?.created_at
  
  if (activities?.length) {
    return activities[0].created_at || workspaceCreatedAt
  }
  return workspaceCreatedAt
})

const pagination = computed(() => dashboardActiviesData.value?.pagination)

const changePage = (page: number) => {
  if (page < 1 || (pagination.value && page > pagination.value.totalPages)) {
    return
  }
  // Just update the currentPage - the query will automatically refetch due to reactive queryKey
  currentPage.value = page
}

function stripHtml(html: string): string {
  const div = document.createElement("div")
  div.innerHTML = html
  const text = div.textContent || div.innerText || ""

  // Truncate if longer than 100 chars
  if (text.length > 100) {
    return text.slice(0, 100) + " ... "
  }
  return text
}

function stripHtmlModal(html: string): string {
  const div = document.createElement("div")
  div.innerHTML = html
  const text = div.textContent || div.innerText || ""
  return text
}
/** Reactive state */
const isLoading = ref(false)

/**
 * IMPORTANT FLAG:
 * Once the component is unmounted, this becomes true
 * and we NEVER create new EventSource or schedule reconnects.
 */
const isConnected = ref(false)
const taskProgress = ref<TaskProgress | null>(null)
const eventSource = ref<EventSource | null>(null)

/** Ensure no reconnect or re-init after unmount */
let isStopped = false
const SERVER_BASE_URL = import.meta.env.VITE_API_BASE_URL

const connect = () => {
  if (isStopped) return
  if (eventSource.value) return // prevent duplicate connections

  const token = localStorage.getItem('token') || ''
  const paramJob = jobId.value
  const storedJob = localStorage.getItem('jobId')
  const effectiveJob = paramJob || storedJob || workspaceId.value
  const isManual = paramJob || storedJob ? 'false' : 'true'

  const url = `${SERVER_BASE_URL}common/step2/tasks/${effectiveJob}/stream?token=${token}&is_manual=${isManual}`

  const es = new EventSource(url)
  eventSource.value = es

  es.onopen = () => {
    if (isStopped) return
    isConnected.value = true
  }

  es.onmessage = (event: MessageEvent) => {
    if (isStopped) return
    try {
      taskProgress.value = JSON.parse(event.data) 

      // Close automatically when completed/final state
      const status = taskProgress.value?.status ?? 'cancels'
      if (['completed', 'failed', 'canceled'].includes(status)) {
        disconnect()
      }
    } catch (_) { }
  }

  es.onerror = () => {
    // DO NOT RECONNECT
    disconnect()
  }

  eventSource.value.addEventListener('progress', (event: MessageEvent) => {
    try { 
      taskProgress.value = JSON.parse(event.data) 
    } catch { }
  })
}

const disconnect = () => {
  isConnected.value = false
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }
}

/** Lifecycle */
onMounted(() => {
  isStopped = false
  connect()
})

onUnmounted(() => {
  isStopped = true
  disconnect()
})

/** Derived state */
const cardProgress = computed(() =>
  taskProgress.value?.percent === 100 ? true : false
)

const lanes = computed<LaneProgressRow[]>(
  () => taskProgress.value?.result?.lanes_summary ?? []
)

const lanes2 = computed<LaneProgressRow[]>(
  () => taskProgress.value?.progress_details?.lanes_progress ?? []
)

const avatars = [
  'https://randomuser.me/api/portraits/women/1.jpg',
  'https://randomuser.me/api/portraits/men/2.jpg',
  'https://randomuser.me/api/portraits/men/3.jpg'
]

/** Click handler for lanes */
const onLaneClick = (lane: LaneProgressRow) => {
  console.log('Lane clicked:', lane)
}

const teamWorkload = computed(() => {
  if (!dashboardTeamsData.value?.team_workload) {
    return []
  }

  return dashboardTeamsData.value.team_workload.map((member: TeamWorkloadMember) => ({
    id: member.assignee_id || 'unassigned',
    name: member.assignee_name,
    initials: member.initials || getInitials(member.assignee_name) || '',
    avatar: !!member.avatar_url || !!member.assignee_id,
    avatarUrl: member.avatar_url,
    color: generateAvatarColor(member.assignee_id, member.assignee_name),
    workload: member.work_distribution_percentage,
    totalTasks: member.total_tasks,
    totalHours: member.total_hours
  }))
})

const teamSize = computed(() => dashboardTeamsData.value?.team_size || 0)

/** Local skeleton component */
const SkeletonCard = defineComponent({
  name: 'SkeletonCard',
  setup() {
    return () =>
      h(
        'div',
        {
          class:
            'w-[380px] min-w-[280px] h-[180px] rounded-xl border border-border bg-bg-body/60 animate-pulse p-4'
        },
        [
          h('div', { class: 'h-5 w-2/3 rounded bg-bg-card/50 mb-2' }),
          h('div', { class: 'h-3 w-1/2 rounded bg-bg-card/50 mb-4' }),
          h('div', { class: 'h-2 w-full rounded bg-bg-card/50 mb-1' }),
          h('div', { class: 'h-2 w-11/12 rounded bg-bg-card/50 mb-1' }),
          h('div', { class: 'h-2 w-10/12 rounded bg-bg-card/50' })
        ]
      )
  }
})

/** Card progress helper */
const getCardProgress = (total: number | undefined, status_dis: Record<string, number> | undefined): number => {
  if (!total) return 0
  const done = status_dis?.['Done'] ?? 0
  return (done / total) * 100
}

const queryClient = useQueryClient()

watch(cardProgress, (val) => {
  if (val) {
    queryClient.invalidateQueries({ queryKey: ["dashboard-teams", workspaceId.value] })
  }
})

watch([workspaceId, jobId], () => {
  disconnect()
  connect()
})

watch(
  () => workspaceStore.lanes,
  (newVal, oldVal) => {
    if (!newVal || !oldVal) return

    // avoid false triggers
    if (newVal === oldVal) return 
    disconnect()
    connect()
  },
  { deep: true }
)
</script>
<style scoped>
/* TransitionGroup animations */
.list-enter-active,
.list-leave-active {
  transition: all 200ms ease-out;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.list-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.list-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.list-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Progress styles */
.progress-bar {
  flex: 1;
  height: 20px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 240ms ease;
  border-radius: 10px;
}

.progress-default {
  background-color: #6c757d;
}

.progress-running {
  background-color: #007bff;
}

.progress-complete {
  background-color: #28a745;
}

.progress-error {
  background-color: #dc3545;
}

/* Existing utility-backed blocks, refined for UX */
.workspace-progress {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.connection-status {
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-weight: 600;
  border: 1px solid transparent;
}

.connected {
  background-color: #d4edda;
  color: #155724;
  border-color: #c3e6cb;
}

.disconnected {
  background-color: #f8d7da;
  color: #721c24;
  border-color: #f5c6cb;
}

.progress-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #dee2e6;
}

.status-info {
  display: grid;
  gap: 8px;
}

.status-item {
  display: flex;
  gap: 10px;
  align-items: baseline;
}

.status-queued {
  color: #6c757d;
}

.status-running {
  color: #007bff;
}

.status-completed {
  color: #28a745;
}

.status-failed {
  color: #dc3545;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  padding: 10px;
  border-radius: 5px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.btn-default {
  padding: 8px 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
  background: white;
}

.btn-default:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.06);
}

.btn-default:active {
  transform: translateY(0);
  box-shadow: none;
}

/* Hover affordances for clickability */
.rounded-xl,
.rounded-lg {
  transition: box-shadow 150ms ease, border-color 150ms ease;
}

.hoverable:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.07);
}


.custom_scroll_bar::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}

.custom_scroll_bar::-webkit-scrollbar-thumb {
  background-color: #888;
  border-radius: 10px;
}

.custom_scroll_bar::-webkit-scrollbar-thumb:hover {
  background-color: #555;
}

.custom_scroll_bar::-webkit-scrollbar-track {
  background: transparent;
}

/* Firefox support */
.custom_scroll_bar {
  scrollbar-width: thin;
  scrollbar-color: #888 transparent;
}
</style>