<template>
  <div
    class="flex-auto flex-grow h-full min-h-0 bg-bg-card rounded-[6px] border border-border overflow-x-auto flex-col flex"
  >
    <!-- sprintDetailData?.status === 'active' -->
    <template v-if="showActiveSprint">
      <ActiveSprint
        :sptint_id="selectedSprintId"
        :searchQuery="searchQuery"
        @go-back="showActiveSprint = false"
      />
    </template>
    <div v-if="!showActiveSprint">
      <template v-if="isStartingSprint">
        <KanbanSkeleton />
      </template>
      <div
        v-if="!isStartingSprint"
        class="p-4 w-full min-w-0 box-border h-full min-h-0"
      >
        <div
          class="flex gap-2 h-full max-h-screen min-h-0 box-border overflow-x-auto group"
          ref="containerRef"
        >
          <section
            class="space-y-4 p-4 rounded-md relative group box-border h-full min-h-0 min-w-[400px]"
            :class="isDark ? 'bg-bg-surface' : 'bg-bg-surface/30'"
            :style="{ width: leftWidth + 'px' }"
          >
            <div class="flex items-center justify-between">
              <h2 class="text-sm font-semibold flex gap-2 items-center">
                <input
                  type="checkbox"
                  class="custom-checkbox bg-bg-body border border-border-input flex-shrink-0"
                  v-model="checkedAll"
                />
                Tickets ({{ backlogResp?.cards?.length }}
                {{ backlogResp?.cards?.length > 1 ? "Tasks" : "Task" }})
              </h2>
              <div
                class="flex items-center gap-2 relative"
                ref="filterDropdownRef"
              >
                <!-- Add Card Button -->
                <button
                  v-if="canCreateCard"
                  class="w-8 h-8 rounded cursor-pointer text-sm hover:bg-bg-body flex items-center justify-center"
                  @click="openCreateBacklogTicket"
                >
                  <i class="text-text-primary fa-regular fa-plus"></i>
                </button>
              </div>
            </div>
            <!-- filters -->
            <div>
              <!-- Milestone: Horizontal Tabs -->
              <div
                v-if="sprintType === 'milestone'"
                class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
              >
                <!-- Default "All" Tab -->
                <button
                  @click="selectMilestoneTab('')"
                  class="flex-shrink-0 px-4 py-1 rounded-2xl text-sm font-medium transition-colors whitespace-nowrap"
                  :class="
                    selectedFilter === ''
                      ? 'bg-accent text-white border-none'
                      : 'bg-transparent text-accent border border-accent'
                  "
                >
                  All Modules
                </button>

                <!-- Dynamic Module Tabs -->
                <button
                  v-for="option in visibleModules"
                  :key="option._id"
                  @click="selectMilestoneTab(option._id)"
                  class="flex-shrink-0 px-4 py-1 rounded-2xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer"
                  :class="
                    selectedFilter === option._id
                      ? 'bg-accent text-white border-none'
                      : 'bg-transparent text-accent border border-accent'
                  "
                >
                  {{ option.variables["module-title"] }}
                </button>
              </div>

              <!-- Huddle: Dropdown -->
              <div
                v-else-if="sprintType === 'huddle' || sprintType === 'sprint'"
                class="relative flex items-center gap-3"
              >
                <!-- FILTER DROPDOWN (NO OVERFLOW PARENT) -->
                <div class="relative flex-shrink-0">
                  <button
                    class="h-8 min-w-[160px] flex items-center justify-between px-2 rounded-md border text-sm border-border hover:bg-bg-body"
                    @click="isHuddleDropdownOpen = !isHuddleDropdownOpen"
                  >
                    <span class="flex items-center gap-2 truncate">
                      <img :src="filter" alt="filter" class="w-4 h-4" />
                      <span class="truncate">
                        {{ selectedHuddleModuleLabel || "All Milestones" }}
                      </span>
                    </span>
                    <i class="fas fa-chevron-down text-xs ml-2"></i>
                  </button>

                  <!-- DROPDOWN -->
                  <div
                    v-if="isHuddleDropdownOpen"
                    class="absolute left-0 top-full mt-1 w-44 bg-bg-card border border-gray-200 rounded-lg shadow-lg z-[9999]"
                  >
                    <ul class="flex flex-col">
                      <li
                        class="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        @click="selectMilestoneTab('')"
                      >
                        All Milestones
                      </li>

                      <li
                        v-for="option in visibleModules"
                        :key="option._id"
                        class="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        @click="selectHuddleModule(option._id)"
                      >
                        {{ option.variables["module-title"] }}
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- SPRINT TABS (SCROLL ONLY HERE) -->
                <div class="flex gap-2 overflow-x-auto no-scrollbar flex-1">
                  <button
                    v-for="option in sprintsList?.sprints"
                    :key="option._id"
                    @click="selectSprintTab(option._id)"
                    class="flex-shrink-0 px-4 py-1 rounded-2xl text-sm font-medium whitespace-nowrap transition-colors"
                    :class="
                      selectedFilter === option._id
                        ? 'bg-accent text-white border-none'
                        : 'bg-transparent text-accent border border-accent'
                    "
                  >
                    {{ option.title }}
                  </button>
                </div>
              </div>
            </div>
            <div
              v-if="isBacklogPenidng"
              class="w-full h-full min-h-[250px] flex justify-center items-center"
            >
              <div
                role="status"
                aria-label="Loading"
                class="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-transparent animate-spin"
              ></div>
            </div>
            <BacklogTable
              v-else
              :checkedAll="checkedAll"
              :sprint-type="sprintType"
              :searchQuery="searchQuery"
              :module-id="selectedFilter"
              @move-selected-to-sprint="moveSelectedToSprint"
              @delete-selected-backlog="deleteSelected('backlog')"
              @open-ticket="openTicket"
              @ticket-moved-to-backlog="handleTicketMovedToBacklog"
              @open-create-ticket="openCreateBacklogTicket"
            />
          </section>
          <div
            class="h-full w-[3px] relative z-10 opacity-0 group-hover:opacity-100 bg-red hover:bg-accent cursor-col-resize transition"
            @mousedown="startResize"
          ></div>
          <section
            class="rounded-md relative group pt-2 flex flex-col flex-1 h-full min-h-0 box-border min-w-[400px] border border-border-input overflow-x-hidden"
            :class="isDark ? 'bg-bg-card' : 'bg-bg-card'"
          >
            <div
              class="flex justify-between gap-4 px-3 pb-2 border-b border-border-input"
            >
              <!-- Left Section: Sprint Tabs -->
              <div class="flex items-center gap-2 bg-bg-card min-w-0">
                <!-- Sprint Dropdown -->
                <div ref="elipseWrapperSprint" class="relative inline-block">
                  <!-- Trigger Button -->
                  <button
                    @click.stop="openElipseDropDown = !openElipseDropDown"
                    class="flex items-center gap-2 lg:px-3 px-2 py-1.5 text-sm font-medium bg-transparent rounded-lg"
                    :style="{ border: '1px solid ' + selectedType.dot }"
                  >
                    <span
                      class="w-2 h-2 rounded-full hidden lg:flex"
                      :style="{ backgroundColor: selectedType.dot }"
                    ></span>
                    {{ selectedType.label }}
                    <i class="fas fa-chevron-down text-xs"></i>
                  </button>

                  <!-- Dropdown -->
                  <transition name="fade">
                    <ul
                      v-if="openElipseDropDown"
                      @click.stop
                      class="absolute left-0 mt-2 w-44 bg-bg-dropdown border border-border rounded-xl shadow-lg z-50"
                    >
                      <li
                        v-for="item in sprintTypes"
                        :key="item.value"
                        @click="
                          selectType(item),
                            (openElipseDropDown = !openElipseDropDown)
                        "
                        class="flex items-center gap-3 px-4 py-2 text-sm cursor-pointer"
                      >
                        <span
                          class="w-2 h-2 rounded-full"
                          :style="{ backgroundColor: item.dot }"
                        ></span>
                        {{ item.label }}
                      </li>
                    </ul>
                  </transition>
                </div>

                <div class="flex items-center lg:gap-2 max-w-full">
                  <!-- Sprint Dropdown -->
                  <div class="flex items-center lg:gap-2 max-w-full">
                    <!-- Sprint Dropdown -->
                    <div
                      ref="sprintDropdownWrapperRef"
                      class="relative min-w-0"
                    >
                      <!-- Trigger -->
                      <button
                        @click="isSprintDropdownOpen = !isSprintDropdownOpen"
                        v-if="sprintsList?.sprints.length"
                        class="flex items-center gap-3 lg:px-6 px-1 py-1.5 rounded-lg text-sm font-medium transition-all"
                        :class="
                          selectedSprintId
                            ? 'text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        "
                        :style="
                          selectedSprintId
                            ? { backgroundColor: selectedType.dot }
                            : {}
                        "
                      >
                        <span class="truncate max-w-[160px]">
                          {{
                            sprintsList?.sprints?.find(
                              (sprint: any) => sprint._id === selectedSprintId
                            )?.title
                          }}
                        </span>
                        <i class="fas fa-chevron-down text-xs"></i>
                      </button>

                      <!-- Dropdown -->
                      <div
                        v-if="isSprintDropdownOpen"
                        class="absolute left-0 mt-2 w-60 bg-bg-card border-accent-hover rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto overflow-x-hidden"
                      >
                        <div
                          v-for="sprint in sprintsList?.sprints"
                          :key="sprint._id"
                          class="relative px-4 py-2 flex items-center justify-between text-sm cursor-pointer transition-color"
                        >
                          <!-- Title / Edit -->
                          <div class="relative flex-1">
                            <template v-if="editingSprintId !== sprint._id">
                              <button
                                class="text-left truncate w-full"
                                @click="selectSprint(sprint)"
                              >
                                {{ sprint.title }}
                              </button>
                            </template>

                            <template v-else>
                              <input
                                ref="editingInputRef"
                                v-model="editingSprintTitle"
                                class="w-full px-1 py-1 text-sm rounded outline-none bg-bg-card border border-[#7d68c8]"
                                placeholder="Enter new name"
                                @click.stop
                                @blur="saveInlineSprintTitle(sprint)"
                                @keyup.enter="saveInlineSprintTitle(sprint)"
                                @keyup.esc="cancelEdit"
                              />
                            </template>
                          </div>

                          <!-- Delete Button -->
                          <div class="relative ml-2 flex gap-2">
                            <button
                              class="ml-2 text-xs text-gray-400 hover:text-accent"
                              @click.stop="enableEdit(sprint)"
                            >
                              <i class="fas fa-pen"></i>
                            </button>
                            <button
                              v-if="
                                sprintsList?.sprints.length &&
                                editingSprintId !== sprint._id
                              "
                              @click.stop="handleDeleteSprint(sprint)"
                              class="w-4 h-4 rounded-full flex items-center justify-center text-red-500"
                            >
                              <i class="fas fa-times text-xs"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Add Sprint Button (Outside Dropdown) -->
                <button
                  @click="openSprintModal()"
                  :class="[
                    'w-8 h-8 lg:flex sm:hidden items-center justify-center rounded-full border text-white transition-colors shrink-0',
                  ]"
                  :style="{
                    backgroundColor: selectedSprintId
                      ? selectedType.dot
                      : '#7d68c8',
                  }"
                >
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
              <!-- Right Section: Actions -->
              <div class="ms-2 flex gap-2 items-center">
                <div class="flex">
                  <button
                    class="flex items-center justify-center w-8 h-8 rounded-full bg-accent"
                    v-if="sprintDetailData?.cards?.length"
                    @click="openSearchModal"
                    :style="
                      selectedSprintId
                        ? { backgroundColor: selectedType.dot }
                        : {}
                    "
                  >
                    <i class="fa-solid fa-magnifying-glass text-white"></i>
                  </button>
                  <button
                    class="flex lg:hidden cursor-pointer text-white items-center justify-center rounded-full ms-2 w-7 h-7 text-sm font-medium"
                    @click="handlePreviewClick"
                    v-if="sprintDetailData?.status === 'active'"
                    :style="
                      selectedSprintId
                        ? { backgroundColor: selectedType.dot }
                        : {}
                    "
                  >
                    <i class="fa-regular fa-eye text-sm"></i>
                  </button>
                </div>
                <!-- End / Start Sprint Buttons -->
                <!-- End Sprint Button -->

                <div class="gap-2 hidden lg:flex">
                  <!-- End Sprint Button -->
                  <div
                    v-if="sprintDetailData?.status === 'active'"
                    class="flex gap-2"
                  >
                    <Button
                      size="sm"
                      @click="handleCompleteSprint"
                      :variant="isDark ? 'primary' : 'primary'"
                      class="border-border-input border"
                      :style="
                        selectedSprintId
                          ? { backgroundColor: selectedType.dot }
                          : {}
                      "
                    >
                      {{ isCompletingSprint ? "Ending..." : "End" }}
                    </Button>
                    <button
                      class="cursor-pointer text-white flex items-center justify-center gap-1 px-2 py-1 rounded-md text-sm font-medium"
                      @click="handlePreviewClick"
                      :style="
                        selectedSprintId
                          ? { backgroundColor: selectedType.dot }
                          : {}
                      "
                    >
                      <i class="fa-regular fa-eye text-sm"></i> Preview
                    </button>
                  </div>
                  <!-- Start Sprint Button -->
                  <Button
                    v-else
                    size="sm"
                    :variant="isDark ? 'primary' : 'primary'"
                    class="border-border-input border"
                    @click="openStartSprintModal"
                    :disabled="
                      !firstSprint ||
                      firstSprint.tickets.length === 0 ||
                      sprintDetailData.status === 'completed'
                    "
                    :style="
                      selectedSprintId
                        ? { backgroundColor: selectedType.dot }
                        : {}
                    "
                  >
                    Start {{ selectedType.label }}
                  </Button>
                </div>
                <!-- Small Screen Icon Buttons -->

                <div
                  class="gap-2"
                  v-if="firstSprint && firstSprint.tickets.length"
                >
                  <!-- End Sprint Icon -->
                  <span
                    class="hidden lg:fxex bg-[#E6E1F5] text-accent px-3 py-1 rounded-2xl justify-center items-center"
                    >{{ sprintDetailData?.status }}</span
                  >

                  <div
                    v-if="sprintDetailData?.status === 'active'"
                    class="flex lg:hidden"
                  >
                    <button
                      @click="handleCompleteSprint"
                      class="w-7 h-7 flex items-center justify-center rounded-full bg-accent"
                      :title="isCompletingSprint ? 'Ending...' : 'End Sprint'"
                      :style="
                        selectedSprintId
                          ? { backgroundColor: selectedType.dot }
                          : {}
                      "
                    >
                      <i class="fa-solid fa-flag-checkered text-white"></i>
                    </button>
                  </div>
                  <!-- Start Sprint Icon -->
                  <button
                    v-else
                    @click="openStartSprintModal"
                    :disabled="
                      !firstSprint ||
                      firstSprint.tickets.length === 0 ||
                      sprintDetailData.status === 'completed'
                    "
                    class="w-7 h-7 flex items-center justify-center rounded-full text-white bg-accent disabled:opacity-50 disabled:cursor-not-allowed lg:hidden"
                    title="Start Sprint"
                    :style="
                      selectedSprintId
                        ? { backgroundColor: selectedType.dot }
                        : {}
                    "
                  >
                    <i class="fa-solid fa-play text-sm"></i>
                  </button>
                </div>
                <div
                  v-if="sprintDetailData?.status === 'active'"
                  class="relative inline-flex"
                  @mouseenter="showTooltip = true"
                  @mouseleave="showTooltip = false"
                  @click="toggleTooltip"
                >
                  <span
                    class="flex lg:hidden bg-emerald-500 text-white w-7 h-7 rounded-full justify-center items-center cursor-pointer"
                  >
                    <i class="fa-solid fa-check"></i>
                  </span>

                  <!-- Tooltip -->
                  <div
                    v-show="showTooltip"
                    class="absolute z-50 top-10 mb-2 -translate-x-2/3 bg-card border border-accent text-accent text-xs px-2 py-1 rounded whitespace-nowrap"
                  >
                    Sprint is active
                  </div>
                </div>
              </div>

              <!-- Search Modal -->
              <transition name="fade">
                <div
                  v-if="showSearchModal"
                  class="fixed inset-0 z-50 flex items-center justify-center w-full"
                >
                  <!-- Backdrop -->
                  <div
                    class="absolute inset-0 bg-black/10 backdrop-blur-sm"
                    @click="closeSearchModal"
                  ></div>

                  <!-- Modal -->
                  <div
                    class="relative bg-bg-card rounded-lg p-4 mx-3 w-full max-w-md lg:max-w-2xl xl:max-w-3xl"
                  >
                    <!-- Instruction Text -->
                    <div class="flex justify-end">
                      <button
                        @click="closeSearchModal"
                        class="px-2 py-1 rounded bg-bg-input border border-border-input text-accent"
                      >
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    <!-- Search Bar + Close -->
                    <div class="flex flex-col gap-2 mt-4">
                      <p class="text-sm text-muted mb-2">
                        Search for {{ sprintType }} by name, status, or
                        priority. Start typing to filter results.
                      </p>

                      <div class="flex gap-2 w-full">
                        <SearchBar
                          :placeholder="`Search in ${sprintType}`"
                          @onChange="handleSearchChange"
                          @keyup.enter="handleSearchEnter"
                          class="flex-1"
                        />
                      </div>

                      <!-- Dropdown Results -->
                      <div
                        v-if="filteredSprints.length && searchTerm"
                        class="mt-1 w-full bg-bg-card rounded-md max-h-64 overflow-y-auto"
                      >
                        <ul>
                          <li
                            v-for="sprint in filteredSprints"
                            :key="sprint._id"
                            @click="handleSearchSelect(sprint)"
                            class="px-4 py-2 cursor-pointer hover:bg-bg-hover text-text-primary border-b border-border-input"
                          >
                            <div class="flex items-center justify-between">
                              <div>
                                <span class="font-medium">{{
                                  sprint.card?.variables?.["card-title"]
                                }}</span>
                                <span class="text-muted text-xs ml-2">
                                  ({{ sprint.card?.variables?.["card-code"] }})
                                </span>
                              </div>
                              <div class="flex gap-2 text-xs">
                                <span
                                  class="px-3 py-1 rounded text-md"
                                  :class="getPriorityClass(sprint.priority)"
                                >
                                  {{ sprint.priority }}
                                </span>
                                <span
                                  class="text-muted border border-border-input rounded-md px-3 py-1"
                                >
                                  {{ sprint.card?.variables?.["card-status"] }}
                                </span>
                              </div>
                            </div>
                          </li>
                        </ul>
                      </div>

                      <!-- No Results Message -->
                      <div
                        v-else-if="searchTerm && !filteredSprints.length"
                        class="absolute top-full left-0 mt-1 w-full bg-bg-card border border-border-input rounded-md shadow-md p-4 z-50 text-center text-muted"
                      >
                        No {{ sprintType }} found matching "{{ searchTerm }}"
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
            <div
              v-if="isLoadingSprint"
              class="w-full h-full min-h-[250px] flex justify-center items-center"
            >
              <div
                role="status"
                aria-label="Loading"
                class="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-transparent animate-spin"
              ></div>
            </div>
            <div class="flex-1 min-h-0">
              <SprintCard
                :searchQuery="searchQuery"
                :sprintId="selectedSprintId"
                :searchedData="selectedSearchCard ? [selectedSearchCard] : []"
                :label="sprintType"
                v-if="
                  (firstSprint &&
                    sprintDetailData &&
                    sprintDetailData?.status === 'planning') ||
                  sprintDetailData?.status === 'active'
                "
                :checkedSprintAll="checkedSprintAll"
                :sprint="firstSprint"
                @open-ticket="openTicket"
                @edit-sprint="openEditSprint"
                @toggle-start="toggleStartSprint"
                @move-selected-to-backlog="moveSelectedToBacklog"
                @delete-selected-sprint="(id) => deleteSelected('sprint', id)"
                @refresh="handleRefresh"
              />

              <div
                v-if="sprintDetailData?.status === 'completed'"
                class="bg-bg-card w-full p-6 flex flex-col items-center justify-center text-center gap-4 h-[100%] mt-3"
              >
                <div
                  class="w-20 h-20 flex justify-center items-center text-white rounded-full text-3xl"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 117.72 117.72"
                    aria-hidden="true"
                  >
                    <path
                      fill="#42ba96"
                      d="M58.86,0c9.13,0,17.77,2.08,25.49,5.79c-3.16,2.5-6.09,4.9-8.82,7.21c-5.2-1.89-10.81-2.92-16.66-2.92
                  c-13.47,0-25.67,5.46-34.49,14.29c-8.83,8.83-14.29,21.02-14.29,34.49c0,13.47,5.46,25.66,14.29,34.49
                  c8.83,8.83,21.02,14.29,34.49,14.29s25.67-5.46,34.49-14.29c8.83-8.83,14.29-21.02,14.29-34.49
                  c0-3.2-0.31-6.34-0.9-9.37c2.53-3.3,5.12-6.59,7.77-9.85c2.08,6.02,3.21,12.49,3.21,19.22
                  c0,16.25-6.59,30.97-17.24,41.62c-10.65,10.65-25.37,17.24-41.62,17.24c-16.25,0-30.97-6.59-41.62-17.24
                  C6.59,89.83,0,75.11,0,58.86c0-16.25,6.59-30.97,17.24-41.62S42.61,0,58.86,0z
                  M31.44,49.19L45.8,49l1.07,0.28c2.9,1.67,5.63,3.58,8.18,5.74c1.84,1.56,3.6,3.26,5.27,5.1
                  c5.15-8.29,10.64-15.9,16.44-22.9c6.35-7.67,13.09-14.63,20.17-20.98l1.4-0.54H114l-3.16,3.51
                  C101.13,30,92.32,41.15,84.36,52.65C76.4,64.16,69.28,76.04,62.95,88.27l-1.97,3.8l-1.81-3.87
                  c-3.34-7.17-7.34-13.75-12.11-19.63c-4.77-5.88-10.32-11.1-16.79-15.54L31.44,49.19z"
                    />
                  </svg>
                </div>
                <h4 class="text-lg font-semibold text-accent">
                  {{ formattedLabel }} Completed
                </h4>
                <p class="text-sm text-muted max-w-md">
                  This {{ sprintType }} has been successfully completed. To
                  continue planning work, create a new {{ sprintType }} by
                  clicking the <strong>plus (+)</strong> button and start
                  organizing upcoming tasks.
                </p>
              </div>
              <div
                v-if="
                  sprintDetailData?.length < 1 ||
                  sprintsList?.sprints.length < 1
                "
                class="w-full h-full min-h-[250px] flex flex-col items-center justify-center text-center gap-4 p-6"
              >
                <!-- Icon -->
                <div
                  class="w-20 h-20 flex items-center justify-center rounded-full bg-muted/10 text-accent"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-20 h-20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="#ff3333"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <!-- Heading -->
                <h4 class="text-xl font-semibold text-accent">
                  No {{ sprintType }}s available
                </h4>

                <!-- Description -->
                <p class="text-sm text-muted max-w-md">
                  You don’t have any {{ sprintType }}s yet. Create a new
                  {{ sprintType }} to start planning and organizing your work.
                  Click the <strong>plus (+)</strong> button to get started.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
    <!-- Modals -->
    <ConfirmDeleteModal
      @click.stop=""
      v-model="showSprintDelete"
      title="Delete Sprint"
      itemLabel="Sprint"
      :itemName="selectedSprint?.title"
      :requireMatchText="selectedSprint?.title"
      confirmText="Delete Sprint"
      cancelText="Cancel"
      size="md"
      :loading="isDeleting"
      @confirm="handleDeleteTicket"
      @cancel="
        () => {
          selectedSprint = null;
          showSprintDelete = false;
        }
      "
    >
    </ConfirmDeleteModal>
    <!-- <TicketModal v-model="ticketModalOpen" :editing="!!editingTicket" :ticket="editingTicket" @save="handleSaveTicket" /> -->
    <SprintModal
      v-model="sprintModalOpen"
      @save="saveSprintHandler"
      :sprint="selectedSprint"
      :lable="sprintType"
      :creatingSprint="selectedSprint ? isUpdatingSprint : creatingSprint"
    />
    <StartSprintModal
      :sprint="selectedSprint"
      v-model="startsprintModalOpen"
      @save="startSprintHandler"
      :creatingSprint="isStartingSprint || isUpdatingSprint2"
    />

    <TaskDetailsModal
      v-model="showTaskModal"
      :cardId="editingTicket?.id"
      @close="closeModal"
    />

    <CreateBacklogTicketWithModuleSelection v-model="isCreateTicketModalOpen" />
    <!-- <CreateSheetModal v-model="sprintModalOpen" size="md"  /> -->
  </div>
</template>

<script setup lang="ts">
import BacklogTable from "./components/BacklogTable.vue";
import SprintCard from "./components/SprintCard.vue";
// import TicketModal from './modals/TicketModal.vue'
import SprintModal from "./modals/SprintModal.vue";
import { computed, ref, watch, onMounted } from "vue";
import { useBacklogStore, type Ticket } from "./composables/useBacklogStore";
import Button from "../../components/ui/Button.vue";
import SearchBar from "../../components/ui/SearchBar.vue";
import filter from "@assets/icons/filter.svg";
import {
  useBacklogList,
  useCompleteSprint,
  useCreateSprint,
  useDeleteSprint,
  useRemoveCardFromSprint,
  useSprintCard,
  useSprintDetail,
  useSprintList,
  useStartSprint,
  useUpdateSprint,
} from "../../queries/usePlan";

import { toast } from "vue-sonner";
import { useWorkspaceId } from "../../composables/useQueryParams";
import { useQueryClient } from "@tanstack/vue-query";
import ConfirmDeleteModal from "../Product/modals/ConfirmDeleteModal.vue";
import StartSprintModal from "./modals/StartSprintModal.vue";
import CreateBacklogTicketWithModuleSelection from "./modals/CreateBacklogTicketWithModuleSelection.vue";
import ActiveSprint from "./components/ActiveSprint.vue";
import TaskDetailsModal from "../Workspaces/Modals/TaskDetailsModal.vue";
import { useTheme } from "../../composables/useTheme";
import KanbanSkeleton from "../../components/skeletons/KanbanSkeleton.vue";
import { useSingleWorkspaceCompany } from "../../queries/useWorkspace";
const { theme, isDark } = useTheme();
const showTaskModal = ref(false);
const searchQuery = ref("");
const checkedAll = ref(false);
const checkedSprintAll = ref(false);
import { usePermissions } from "../../composables/usePermissions";
const { canCreateCard } = usePermissions();
const showActiveSprint = ref(false);
const elipseWrapperSprint = ref<HTMLElement | null>(null);
const open = ref(false);
const openElipseDropDown = ref(false);
const sprintType = computed(() => selectedType.value.value);
const selectedFilter = ref<string | "">("");
const sprintTypes = [
  { label: "Milestone", value: "milestone", dot: "#2e9bda" },
  { label: "Sprint", value: "sprint", dot: "#7d68c8" },
  { label: "Huddle", value: "huddle", dot: "#eea832" },
];
const formattedLabel = computed(() => {
  if (!sprintType.value) return "";
  return sprintType.value.charAt(0).toUpperCase() + sprintType.value.slice(1);
});
const selectedType = ref(sprintTypes[0]);
import { onClickOutside } from "@vueuse/core";
const elipseWrapper = ref<HTMLElement | null>(null);
const openElipseDrop = ref(false);
onClickOutside(elipseWrapper, () => {
  openElipseDrop.value = false;
});

const closeModal = () => {
  showTaskModal.value = false;
};
const handlePreviewClick = () => {
  showActiveSprint.value = true;
};
const showTooltip = ref(false);

const toggleTooltip = (): void => {
  showTooltip.value = !showTooltip.value;
};
const { workspaceId } = useWorkspaceId();
const isCreateTicketModalOpen = ref(false);
const {
  // backlog, sprints,
  // selectedBacklogIds, selectedSprintIds,
  moveSelectedToSprint,
  moveSelectedToBacklog,
  deleteSelected,
  saveSprintMeta,
  toggleStartSprint,
} = useBacklogStore();
function selectMilestoneTab(tabId: string) {
  selectedFilter.value = tabId;
  isHuddleDropdownOpen.value = false;
}
function selectHuddleModule(moduleId: string) {
  selectedFilter.value = moduleId;
  isHuddleDropdownOpen.value = false;
}
function selectSprintTab(sprintId: string) {
  selectedFilter.value = sprintId;
  isHuddleDropdownOpen.value = false;
}

const { data: backlogResp, refetch: refetchBackLogList } = useBacklogList(
  workspaceId,
  sprintType,
  selectedFilter
);
watch(selectedFilter, () => {
  refetchBackLogList();
});
const { data: workspaceData } = useSingleWorkspaceCompany(workspaceId);
const visibleModules = computed(
  () =>
    workspaceData.value?.modules.filter(
      (m: any) => m?.variables?.["module-title"] !== "Pin"
    ) || []
);
watch(
  () => sprintType.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      refetchBackLogList();
    }
  }
);

// delete sprint
const { mutate: deleteSprint, isPending: isDeleting } = useDeleteSprint({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["sprint-list"] });
    showSprintDelete.value = false;
  },
});
const selectedSprint = ref<any>(null);
const showSprintDelete = ref(false);
const handleDeleteTicket = () => {
  deleteSprint(selectedSprint.value?._id);
};
const { mutate: updateSprint2, isPending: isUpdatingSprint2 } = useUpdateSprint(
  {
    onSuccess: (data: any) => {
      saveSprintMeta({ name: data.title });
      startSprint({
        id: selectedSprintId.value,
        payload: {
          title: data.title,
          start_date: data.start_date,
          end_date: data.end_date,
          goal: data.goal,
          duration: Number(data.duration_days),
        },
      });
      // queryClient.invalidateQueries({ queryKey: ['sprint-list'] })
      startsprintModalOpen.value = false;
    },
  }
);
const { mutate: startSprint, isPending: isStartingSprint } = useStartSprint({
  onSuccess: () => {
    refetchSprintDetail();
  },
});
const startSprintHandler = (e: any) => {
  updateSprint2({
    id: selectedSprintId.value,
    payload: {
      title: e.title,
      duration: e.duration,
      start_date: e.start,
      end_date: e.end,
      goal: e.goal,
    },
  });
};

const {
  data: sprintsList,
  refetch: refetchSprints,
  isLoading: isLoadingSprint,
} = useSprintList(workspaceId.value, sprintType);
watch(
  () => sprintType.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      refetchSprints();
    }
  }
);
const { refetch: refetchBacklog, isPending: isBacklogPenidng } = useBacklogList(
  workspaceId,
  sprintType
);
const firstSprintId = computed(() => sprintsList?.value?.sprints[0]?._id);
const selectedSprintId = ref(firstSprintId.value);
watch(
  () => firstSprintId.value,
  (newVal) => {
    selectedSprintId.value = newVal;
  }
);
watch(
  () => selectedSprintId.value,
  (id) => {
    selectedSprint.value =
      sprintsList.value?.sprints.find((s: any) => s._id === id) || null;
  }
);

const { data: sprintDetailData, refetch: refetchSprintDetail } =
  useSprintDetail(selectedSprintId, {
    enabled: computed(() => !!selectedSprintId.value),
  });

const startsprintModalOpen = ref(false);
const openStartSprintModal = () => {
  localStorage.setItem("asFirstTime", JSON.stringify(true));
  startsprintModalOpen.value = true;
};
const isFirstTime = () => {
  return JSON.parse(localStorage.getItem("asFirstTime") || "false");
};
const checkAutoOpenActiveSprint = () => {
  if (sprintDetailData.value?.status === "active" && isFirstTime()) {
    showActiveSprint.value = true;
    localStorage.setItem("asFirstTime", JSON.stringify(false));
  }
};
onMounted(() => {
  checkAutoOpenActiveSprint();
});

watch(
  () => sprintDetailData.value?.status,
  () => {
    checkAutoOpenActiveSprint();
  }
);
const { data: sprintData, refetch: refetchSprintData } =
  useSprintCard(selectedSprintId);

watch(
  () => selectedSprintId.value,
  () => {
    if (selectedSprintId.value) {
      refetchSprintDetail();
    }
  }
);

const searchTerm = ref("");
const selectedSearchCard = ref<any | null>(null);
const filteredSprints = computed(() => {
  const data = sprintData.value as { backlog_items?: any[] } | undefined;
  if (!searchTerm.value || !data?.backlog_items) return [];
  const query = searchTerm.value.toLowerCase().trim();
  return data.backlog_items.filter((item: any) => {
    const title = item.card?.variables?.["card-title"]?.toLowerCase() || "";
    const code = item.card?.variables?.["card-code"]?.toLowerCase() || "";
    const status = item.card?.variables?.["card-status"]?.toLowerCase() || "";
    const priority = item.priority?.toLowerCase() || "";
    const itemId = String(item._id || "").toLowerCase();
    const cardId = String(item.card_id || "").toLowerCase();

    return (
      title.includes(query) ||
      code.includes(query) ||
      status.includes(query) ||
      priority.includes(query) ||
      itemId.includes(query) ||
      cardId.includes(query)
    );
  });
});

// Methods
function handleSearchChange(value: any) {
  searchTerm.value = value;
}

function handleSearchEnter() {
  if (filteredSprints.value.length === 1) {
    selectSprint(filteredSprints.value[0]);
  }
}
type Priority = "high" | "medium" | "low";
const priorityClasses: Record<Priority, string> = {
  high: "bg-red-500/20 text-red-500",
  medium: "bg-yellow-500/20 text-yellow-500",
  low: "bg-green-500/20 text-green-500",
};

function getPriorityClass(priority?: string): string {
  const key = priority?.toLowerCase() as Priority;

  return priorityClasses[key] ?? "bg-gray-500/20 text-gray-500";
}
function handleSearchSelect(card: any) {
  selectedSearchCard.value = card;
  showSearchModal.value = false;
}

// Convert API sprint to store Sprint format with cards
const firstSprint = computed(() => {
  const apiSprint = (sprintData.value as { backlog_items?: any[] } | undefined)
    ?.backlog_items;
  if (!apiSprint) return null;

  // Map sprint cards from API
  const sprintCards = (apiSprint || []).map((c: any) => {
    const v = c?.card?.variables || {};
    const id = c?.card?._id || c.card_id;

    return {
      id,
      key: (v["card-code"] as string) || id?.slice(-6) || "PRJ-?",
      summary: (v["card-title"] as string) || "(untitled)",
      type: "Story" as const,
      status: mapStatus(String(v["card-status"] || "").trim()),
      assignee: c?.card?.assigned_to?.name || "Unassigned",
      storyPoints: Number(c.story_points || 0),
      priority: mapPriority(String(v["priority"] || "").trim()),
      createdAt: c?.card?.created_at || new Date().toISOString(),
      description: (v["card-description"] as string) || "",
    };
  });

  return {
    id: (sprintData.value as any)?._id, // fallback for TS
    name: (sprintData.value as any)?.title || "Sprint 1",
    title: (sprintData.value as any)?.title,
    goal: "",
    start: "",
    end: "",
    started: false,
    tickets: sprintCards,
  };
});

function selectSprint(sprint: any) {
  console.log("selected sprint id", sprint);

  selectedSprintId.value = sprint._id;
  isSprintDropdownOpen.value = false;
}

function mapStatus(s: string): "Todo" | "In Progress" | "Done" {
  const normalized = s.toLowerCase();
  if (normalized.includes("progress")) return "In Progress";
  if (normalized.includes("done") || normalized.includes("complete"))
    return "Done";
  return "Todo";
}

function mapPriority(p: string): "Highest" | "High" | "Medium" | "Low" {
  const s = p.toLowerCase();
  if (s === "highest" || s === "blocker" || s === "critical") return "Highest";
  if (s === "high" || s === "major") return "High";
  if (s === "medium" || s === "normal") return "Medium";
  return "Low";
}

const { mutate: removeCardFromSprint } = useRemoveCardFromSprint({
  onSuccess: () => {
    toast.success("Card removed from sprint successfully");
    handleRefresh();
  },
  onError: (error: any) => {
    toast.error("Failed to remove card from sprint", error);
  },
});

function handleRefresh() {
  refetchSprintData();
  refetchSprints();
  refetchBacklog();
  refetchSprintDetail();
}

function handleTicketMovedToBacklog(
  ticketIds: string[] | string,
  sprintId?: string
) {
  const ids = Array.isArray(ticketIds) ? ticketIds : [ticketIds];
  const sourceSprintId = sprintId || selectedSprintId.value;
  if (!sourceSprintId || !ids.length) return;
  ids.forEach((id) => {
    removeCardFromSprint({
      sprintId: sourceSprintId,
      cardId: id,
    });
  });
}

// Ticket modal state
const ticketModalOpen = ref(false);
const editingTicket = ref<Ticket | null>(null);
// const createTarget = ref<'backlog' | 'sprint'>('backlog')

function openCreateBacklogTicket() {
  isCreateTicketModalOpen.value = true;
  editingTicket.value = null;
  // createTarget.value = 'backlog'
  // ticketModalOpen.value = true
}

function openTicket(t: Ticket) {
  editingTicket.value = t;
  showTaskModal.value = true;
  ticketModalOpen.value = true;
}
const sprintModalOpen = ref(false);
function openEditSprint() {
  sprintModalOpen.value = true;
}
const queryClient = useQueryClient();
const { mutate: createSprint, isPending: creatingSprint } = useCreateSprint({
  onSuccess: (data: any) => {
    saveSprintMeta({ name: data.title });
    queryClient.invalidateQueries({ queryKey: ["sprint-list"] });
    sprintModalOpen.value = false;
  },
});
const { mutate: updateSprint, isPending: isUpdatingSprint } = useUpdateSprint({
  onSuccess: (data: any) => {
    saveSprintMeta({ name: data.title });
    queryClient.invalidateQueries({ queryKey: ["sprint-list"] });
    sprintModalOpen.value = false;
  },
});
const editingSprintTitle = ref("");
function saveInlineSprintTitle(sprint: any) {
  const newTitle = editingSprintTitle.value.trim();

  if (!newTitle || newTitle === sprint.title) {
    cancelEdit();
    return;
  }

  updateSprint({
    id: sprint._id,
    payload: {
      workspace_id: workspaceId.value,
      title: newTitle,
    },
  });

  editingSprintId.value = null;
}

function saveSprintHandler(e: any) {
  if (selectedSprint.value) {
    updateSprint({
      id: selectedSprint.value?._id,
      payload: {
        workspace_id: workspaceId.value,
        title: e.name,
        sprintType: e.value,
        description: e.description,
      },
    });
  } else {
    createSprint({
      payload: {
        workspace_id: workspaceId.value,
        title: e.name,
        sprintType: e.value,
        description: e.description,
      },
    });
  }
}
function openSprintModal() {
  selectedSprint.value = null;
  sprintModalOpen.value = true;
}

function handleDeleteSprint(e: any) {
  selectedSprint.value = e;
  showSprintDelete.value = true;
}
const { mutate: completeSprint, isPending: isCompletingSprint } =
  useCompleteSprint(selectedSprintId, {
    onSuccess: () => {
      refetchSprintDetail();
    },
  });

const handleCompleteSprint = () => {
  completeSprint({});
};

// resize sections

const containerRef = ref<HTMLElement | null>(null);
const leftWidth = ref(0);

let resizing = false;
const minWidth = 400; //  New minimum width (your requirement)

onMounted(() => {
  if (!containerRef.value) return;
  const full = containerRef.value.offsetWidth;
  leftWidth.value = full / 3; // start at 50%
});

function startResize() {
  resizing = true;
  document.addEventListener("mousemove", handleResize);
  document.addEventListener("mouseup", stopResize);
}

function handleResize(e: MouseEvent) {
  if (!resizing) return;

  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const pos = e.clientX - rect.left;

  // Apply min and max limits
  if (pos < minWidth) leftWidth.value = minWidth;
  else if (pos > rect.width - minWidth) leftWidth.value = rect.width - minWidth;
  else leftWidth.value = pos;
}

function stopResize() {
  resizing = false;
  document.removeEventListener("mousemove", handleResize);
  document.removeEventListener("mouseup", stopResize);
}
/////
const editingSprintId = ref(null);

function enableEdit(sprint: any) {
  editingSprintId.value = sprint._id;
  sprint.tempTitle = sprint.title;
}

function cancelEdit() {
  const sprint = sprintsList.value?.sprints.find(
    (s: any) => s._id === editingSprintId.value
  );

  if (sprint) {
    sprint.tempTitle = sprint.title;
  }

  editingSprintId.value = null;
}

onClickOutside(elipseWrapperSprint, () => {
  openElipseDropDown.value = false;
});
const selectType = (item: (typeof sprintTypes)[number]) => {
  console.log("selected type", item);

  selectedType.value = item;
  open.value = false;
};

onClickOutside(elipseWrapper, () => {
  open.value = false;
});

const sprintDropdownWrapperRef = ref<HTMLElement | null>(null);
const isSprintDropdownOpen = ref(false);

onClickOutside(sprintDropdownWrapperRef, () => {
  isSprintDropdownOpen.value = false;
});

const showSearchModal = ref(false);

const openSearchModal = () => {
  showSearchModal.value = true;
};

const closeSearchModal = () => {
  showSearchModal.value = false;
  searchTerm.value = "";
};

// filters
const selectedHuddleModule = ref("all");
const isHuddleDropdownOpen = ref(false);
// Computed label for huddle button
const selectedHuddleModuleLabel = computed(() => {
  if (selectedHuddleModule.value === "all") return "All Milestones";

  const module = workspaceData.value?.modules?.find(
    (m: { _id: string; variables: Record<string, any> }) =>
      m._id === selectedHuddleModule.value
  );

  return module?.variables?.["module-title"] || "Select Module";
});
</script>

<style scoped>
.custom-checkbox {
  appearance: none; /* remove native checkbox UI */
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.custom-checkbox:checked {
  background-color: #5a2d7f;
  border-color: #5a2d7f !important;
}

.custom-checkbox:checked::after {
  content: "";
  display: block;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin: 3px auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
