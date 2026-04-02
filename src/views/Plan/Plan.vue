<template>
  <div
    class="flex-auto min-h-0 rounded-[6px] overflow-x-auto flex-col flex backdrop-blur flex-grow h-full shrink"
  >
    <template v-if="showActiveSprint || isStartingSprintLoading">
      <ActiveSprint
        :sprint_id="selectedSprintId"
        :searchQuery="searchQuery"
        :active-sprint="sprintType"
        :selectedSheetId="selected_sheet_id"
        @go-back="showActiveSprint = false"
      />
    </template>
    <div v-else class="flex flex-row flex-1 min-h-0">
      <div class="flex flex-col flex-1 min-h-0 min-w-0 -mt-3.5">
        <div class="overflow-x-auto w-full flex-1 min-w-0">
          <div class="min-w-[800px] h-full flex flex-col">
            <div
              v-if="!isStartingSprint"
              class="px-0.5 py-4 w-full min-w-0 flex flex-col min-h-0 overflow-x-auto h-full"
            >
              <div
                ref="containerRef"
                class="flex gap-1 min-h-0 overflow-x-auto group h-full"
              >
                <section
                    class="px-4 rounded-md relative flex flex-col min-h-0 bg-bg-card h-full border border-border shrink-0"
                    :style="{ width: leftWidth + 'px', minWidth: '280px', maxWidth: '50%' }"
                  >
                  <div class="flex items-center justify-between mt-2">
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
                      <ExpandableSearch
                        v-if="backlogResp?.cards?.length"
                        v-model="backlogSearchQuery"
                        placeholder="Search ticket by title...." 
                        buttonClass="w-8 h-8 rounded border border-accent text-white hover:opacity-90"
                        :buttonStyle="{ backgroundColor: selectedType.dot }"
                      >
                        <template #icon>
                          <i class="fa-solid fa-magnifying-glass text-[12px] text-white"></i>
                        </template>
                      </ExpandableSearch>
                      <!-- Add Card Button -->
                      <button
                        v-if="canCreateCard"
                        class="w-8 h-8 rounded cursor-pointer text-sm hover:bg-bg-body flex items-center justify-center border border-border"
                        @click="openCreateBacklogTicket"
                      >
                        <i class="text-text-primary fa-regular fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  <!-- filters -->
                  <div class="mt-3">
                    <div class="flex flex-wrap gap-2 mb-3">
                      <ModuleSheetDropdown 
                        :modules="visibleModules" 
                        :selectedIds="selectedFilter" 
                        :selectedSheetIds="selectedSheetFilter"
                        :selectedLabel="selectedFilterLabelWithCount"
                        @select="handleDropdownSelect"
                      />
                      <PlanSelectDropdown 
                        :groups="sprintOptions"
                        :selectedIds="selectedPlanIds"
                        :selectedLabel="selectedPlanLabel"
                        @select="handlePlanSelect"
                      />
                    </div>
                  </div>
                  <div
                    v-if="isBacklogPenidng || isBacklogRefreshing"
                    class="w-full h-full flex justify-center items-center"
                  >
                    <div
                      role="status"
                      aria-label="Loading"
                      class="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin"
                    ></div>
                  </div>
                    <div class="flex-1 min-h-0 overflow-y-hidden pb-2" v-else>
                      <BacklogTable
                        :searchQuery="backlogSearchQuery"
                        :checkedAll="checkedAll"
                        :sprint-type="sprintType"
                        :module-id="selectedFilter"
                        :sheet-id="selectedSheetFilter"
                        :sprint-id="selectedPlanIds"
                        :include-sprint-cards="includeSprintCards"
                        v-model:page="currentPage"
                        @move-selected-to-sprint="moveSelectedToSprint"
                        @delete-selected-backlog="deleteSelected('backlog')"
                        @open-ticket="openTicket"
                        @ticket-moved-to-backlog="handleTicketMovedToBacklog"
                        @open-create-ticket="openCreateBacklogTicket"
                      />
                    </div>
                </section>
                <div class="relative z-10 group">
                  <svg
                    @mousedown="startResize"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    class="w-4 cursor-col-resize opacity-0 group-hover:opacity-100 transition"
                    role="img"
                    aria-label="Resize"
                  >
                    <path
                      fill="currentColor"
                      d="M10 3h4v2h-4V3zm0 4h4v2h-4V7zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2zm0 4h4v2h-4v-2z"
                    />
                    <path
                      fill="currentColor"
                      d="M4 2h2v20H4V2zm14 0h2v20h-2V2z"
                      opacity="0.4"
                    />
                  </svg>
                </div>

                <section
                  class="rounded-md relative pt-2 flex flex-col flex-1 min-w-0 bg-bg-card min-h-0 border border-border"
                >
                  <div
                    class="flex justify-between gap-4 px-3 pb-2 border-b border-border-input"
                  >
                    <!-- Left Section: Sprint Tabs -->
                    <div class="flex items-center gap-2 min-w-0 py-1">

                      <!-- Sprint Type Dropdown -->
                      <div ref="elipseWrapperSprint" class="relative inline-block">
                        <!-- Trigger Button -->
                        <button
                          @click.stop="openElipseDropDown = !openElipseDropDown"
                          type="button"
                          class="text-nowrap inline-flex justify-between items-center gap-1.5 border rounded-[6px] font-medium cursor-pointer transition bg-transparent px-3 py-1.5 text-sm"
                          :class="openElipseDropDown ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:border-accent-hover'"
                        >
                          <div class="flex items-center gap-2">
                            <span
                              class="w-2 h-2 rounded-full"
                              :style="{ backgroundColor: selectedType.dot }"
                            ></span>
                            <span>{{ selectedType.label }}</span>
                          </div>
                          <svg
                            class="w-4 h-4 text-text-secondary transition-transform duration-200"
                            :class="{ 'rotate-180': openElipseDropDown }"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <!-- Dropdown -->
                        <transition name="fade-scale">
                          <ul
                            v-if="openElipseDropDown"
                            @click.stop
                            class="absolute left-0 mt-1.5 min-w-[160px] bg-bg-dropdown border border-border rounded-[6px] shadow-lg z-50 py-1 text-sm"
                          >
                            <li
                              v-for="item in sprintTypes"
                              :key="item.value"
                              @click="selectType(item); openElipseDropDown = false"
                              class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-bg-dropdown-menu-hover transition-colors"
                            >
                              <span
                                class="w-2 h-2 rounded-full flex-shrink-0"
                                :style="{ backgroundColor: item.dot }"
                              ></span>
                              <span :class="item.value === selectedType.value ? 'font-semibold text-accent' : ''">{{ item.label }}</span>
                            </li>
                          </ul>
                        </transition>
                      </div>

                      <!-- Sprint Selector Dropdown -->
                      <div ref="sprintDropdownWrapperRef" class="relative min-w-0">
                        <!-- Trigger -->
                        <button
                          v-if="sprintsList?.sprints.length"
                          @click="isSprintDropdownOpen = !isSprintDropdownOpen"
                          type="button"
                          class="text-nowrap inline-flex justify-between items-center gap-1.5 border rounded-[6px] font-medium cursor-pointer transition bg-transparent px-3 py-1.5 text-sm"
                          :class="isSprintDropdownOpen ? 'border-accent ring-1 ring-accent/20' : 'border-border hover:border-accent-hover'"
                        >
                          <div class="flex items-center gap-2">
                            <span
                              v-if="selectedSprintId"
                              class="w-2 h-2 rounded-full flex-shrink-0"
                              :style="{ backgroundColor: selectedType.dot }"
                            ></span>
                            <span class="truncate max-w-[160px]">{{ selectedSprintTitle || 'Select ' + selectedType.label }}</span>
                          </div>
                          <svg
                            class="w-4 h-4 text-text-secondary transition-transform duration-200"
                            :class="{ 'rotate-180': isSprintDropdownOpen }"
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <!-- Dropdown -->
                        <transition name="fade-scale">
                          <div
                            v-if="isSprintDropdownOpen"
                            class="absolute left-0 mt-1.5 w-64 bg-bg-dropdown border border-border rounded-[6px] shadow-lg z-50 max-h-64 overflow-y-auto py-1"
                          >
                            <div
                              v-for="sprint in sprintsList?.sprints"
                              :key="sprint._id"
                              class="relative px-3 py-2 flex items-center justify-between text-sm cursor-pointer hover:bg-bg-dropdown-menu-hover transition-colors"
                            >
                              <!-- Title / Edit -->
                              <div class="relative flex-1 min-w-0">
                                <button
                                  class="text-left truncate w-full flex items-center gap-2"
                                  @click="selectSprint(sprint)"
                                >
                                  <span
                                    class="w-2 h-2 rounded-full flex-shrink-0"
                                    :style="{ backgroundColor: selectedType.dot }"
                                  ></span>
                                  <span class="truncate" :class="sprint._id === selectedSprintId ? 'font-semibold text-accent' : ''">{{ sprint.title }}</span>
                                </button>
                              </div>

                              <!-- Actions -->
                              <div class="ml-2 flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  class="w-6 h-6 flex items-center justify-center rounded text-text-secondary hover:text-accent hover:bg-bg-body transition-colors"
                                  @click.stop="openModalEditSprint(sprint)"
                                  title="Edit"
                                >
                                  <i class="fas fa-pen text-[10px]"></i>
                                </button>
                                <button
                                  v-if="sprintsList?.sprints.length"
                                  @click.stop="handleDeleteSprint(sprint)"
                                  class="w-6 h-6 flex items-center justify-center rounded text-text-secondary hover:text-red-500 hover:bg-red-50 transition-colors"
                                  title="Delete"
                                >
                                  <i class="fas fa-times text-[10px]"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </transition>
                      </div>

                      <!-- Add Sprint Button -->
                      <button
                        @click="openSprintModal(sprintsList?.sprints)"
                        class="w-8.5 h-8.5 flex items-center justify-center rounded-[6px] border text-white transition-colors shrink-0 hover:opacity-90"
                        :style="{ backgroundColor: selectedType.dot, borderColor: selectedType.dot }"
                        title="Add new"
                      >
                        <i class="fa-solid fa-plus text-xs"></i>
                      </button>
                    </div>
                    <!-- Right Section: Actions -->
                    <div class="flex justify-end items-center">
                      <div class="me-2" >
                        <ExpandableSearch
                          v-if="sprintDetailData?.cards?.length"
                          v-model="searchQuery"
                          placeholder="Search ticket by title...."
                          buttonClass="w-8.5 h-8.5 rounded-[6px] border border-accent text-white hover:opacity-90"
                          :buttonStyle="selectedSprintId ? { backgroundColor: selectedType.dot } : {}"
                        >
                          <template #icon>
                            <i class="fa-solid fa-magnifying-glass text-[13px] text-white"></i>
                          </template>
                        </ExpandableSearch>
                        <div
                        v-if="sprintDetailData?.status === 'completed'"
                        class="relative inline-flex"
                        @mouseenter="showTooltip = true"
                        @mouseleave="showTooltip = false"
                        @click="toggleTooltip"
                      >
                        <span
                          class="flex bg-emerald-500 text-white w-8.5 h-8.5 rounded-[6px] justify-center items-center cursor-pointer"
                        >
                          <i class="fa-solid fa-check"></i>
                        </span>

                        <!-- Tooltip -->
                        <div
                          v-show="showTooltip"
                          class="absolute z-50 top-10 mb-2 -translate-x-2/3 bg-card border border-accent text-accent text-xs px-2 py-1 rounded whitespace-nowrap"
                        >
                          {{ sprintDetailData?.title }} is completed
                        </div>
                        </div>
                      </div> 
                      <div>
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
                            class="cursor-pointer text-white flex items-center justify-end gap-1 px-2 py-1 rounded-md text-sm font-medium"
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
                        <div v-else>
                          <Button
                            v-if="sprintDetailData?.status !== 'completed'"
                            size="sm"
                            :variant="isDark ? 'primary' : 'primary'"
                            class="border-border-input border"
                            @click="openStartSprintModal"
                            :disabled="
                              !firstSprint ||
                              firstSprint.tickets.length === 0 ||
                              sprintDetailData?.status === 'completed'
                            "
                            :style="{ backgroundColor: selectedType.dot }"
                          >
                            Start {{ selectedType.label }}
                          </Button> 
                        </div>
                      </div>
                      
                      <div 
                        v-if="firstSprint && firstSprint.tickets.length"
                      >
                        <button
                          v-if="sprintDetailData?.status === 'planning'"
                          @click="openStartSprintModal"
                          :disabled="
                            !firstSprint ||
                            firstSprint.tickets.length === 0 ||
                            sprintDetailData?.status === 'completed'
                          "
                          class="w-7 h-7 ms-1.5 flex items-center justify-center rounded-full text-white
                           bg-accent disabled:opacity-50 disabled:cursor-not-allowed lg:hidden"
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
                       <!-- Small Screen Icon Buttons -->
                         <div
                            class="relative"
                            v-if="sprintDetailData?.status === 'active' || sprintDetailData?.status === 'planning'"
                          >
                            <!-- Ellipsis Icon -->
                            <i
                              class="fa-solid fa-ellipsis-vertical text-lg mt-2 cursor-pointer"
                              @click.stop="toggleMenu"
                            ></i>

                            <!-- Dropdown -->
                            <div
                              v-if="showMenu"
                              class="absolute right-0 mt-2 w-28 bg-bg-dropdown border border-border rounded-md shadow-lg z-50"
                            >
                              <div
                                class="px-3 py-1.5 text-sm cursor-pointer hover:bg-bg-dropdown-menu-hover"
                                @click="
                                  openStartSprintModalForUpdate(
                                    sprintDetailData,
                                  )
                                "
                              >
                                <div class="flex justify-between">
                                  <span>Update</span>
                                  <i class="fa-light fa-pen mt-0.5"></i>
                                </div>
                              </div>
                              <div
                                class="px-3 py-1.5 text-sm text-red-500 cursor-pointer hover:bg-bg-dropdown-menu-hover"
                                @click="onDelete"
                                v-if="isSprintChecked"
                              >
                                <div
                                  class="flex justify-between"
                                  
                                >
                                  <span>Delete</span>
                                  <i class="fa-light fa-trash mt-0.5"></i>
                                </div>
                              </div>
                            </div>
                          </div>
                    </div>
            
                    
                  </div>
                  <div
                    v-if="isLoadingSprint || isSprintsFetching"
                    class="w-full h-full min-h-[250px] flex justify-center items-center"
                  >
                    <div
                      role="status"
                      aria-label="Loading"
                      class="h-10 w-10 rounded-full border-4 border-accent border-t-transparent animate-spin"
                    ></div>
                  </div>

                  <div class="flex-1 min-h-0 overflow-y-auto" v-else>
                    <SprintCard
                      :searchQuery="searchQuery"
                      :sprintId="selectedSprintId"
                      :searchedData="[]"
                      :label="sprintType"
                      v-if="
                        firstSprint &&
                        ['planning', 'active'].includes(
                          sprintDetailData?.status?.toLowerCase(),
                        )
                      "
                      :checkedSprintAll="checkedSprintAll"
                      :sprint="firstSprint"
                      @open-ticket="openTicket"
                      @edit-sprint="openEditSprint"
                      @toggle-start="toggleStartSprint"
                      @move-selected-to-backlog="moveSelectedToBacklog"
                      @delete-selected-sprint="handleDeleteSelectedSprint"
                      @refresh="handleRefresh"
                      @checked-change="isSprintChecked = $event"
                      @selection-change="selectedSprintTicketIds = $event"
                    />
                    <div
                      v-if="
                        sprintDetailData?.status
                          ?.toString()
                          .trim()
                          .toLowerCase() === 'completed'
                      "
                      class="bg-bg-card w-full p-6 flex flex-col justify-center h-full items-center text-center gap-4"
                    >
                      <div
                        class="w-16 h-16 flex justify-center items-center text-white rounded-full text-3xl"
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
                      <h6
                        class="text-sm text-text-primary font-semibold mb-1 text-center"
                      >
                        {{ formattedLabel }} Completed
                      </h6>
                      <p
                        class="text-sm text-text-primary/90 mb-3 max-w-120 text-center"
                      >
                        This {{ sprintType }} has been successfully completed.
                        To continue planning work, create a new
                        {{ sprintType }} by clicking the
                        <strong>plus (+)</strong> button and start organizing
                        upcoming tasks.
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
                        class="w-16 h-16 flex items-center justify-center rounded-full bg-muted/10 text-accent"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="w-20 h-20"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
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
                      <h6
                        class="text-sm text-text-primary font-semibold mb-1 text-center"
                      >
                        No {{ sprintType }}s available
                      </h6>

                      <!-- Description -->
                      <p
                        class="text-sm text-text-primary/90 mb-3 max-w-120 text-center"
                      >
                        You don’t have any {{ sprintType }}s yet. Create a new
                        {{ sprintType }} to start planning and organizing your
                        work. Click the <strong>plus (+)</strong> button to get
                        started.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
       <SidePanel
        v-if="selectedCard?._id"
        :details="selectedCard"
       @close="closeSidePanel"
       @closeSidePanel="closeSidePanel"
      :showPanel="!!selectedCard?._id"
    />

    </div>
    <!-- Modals -->
    <ConfirmDeleteModal
      @click.stop
      v-model="showSprintDelete"
      :title="`Delete ${sprintType}`"
      :itemLabel="sprintType"
      :itemName="selectedSprint?.title"
      :requireMatchText="selectedSprint?.title"
      :confirmText="`Delete ${sprintType}`"
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
    />
    <ConfirmDeleteSprint
      v-model="showSprintDeleteTicket"
      :title="`Delete ${title}`"
      :itemLabel="sprintType"
      :itemName="selectedSprint?.title"
      :requireMatchText="selectedSprint?.title"
      :confirmText="`Delete Ticket`"
      cancelText="Cancel"
      size="md"
      :loading="isDeletingSprintTicket"
      @confirm="handleConfirmDeleteSprint"
      @cancel="resetDeleteState"
    />
    <SprintModal
      v-model="sprintModalOpen"
      @save="saveSprintHandler"
      :sprint="selectedSprint"
      :lable="sprintType"
      :creatingSprint="selectedSprint ? isUpdatingSprint : creatingSprint"
      :sprints="sprintsDataFromPlus"
    />
    <StartSprintModal
      v-model="startsprintModalOpen"
      :creatingSprint="isStartingSprint"
      :sprintType="sprintType"
      @edit-sprint="handleEditFromStart"
      @start-now="handleStartNow"
    />

    <TaskDetailsModal
      v-if="false"
      v-model="showTaskModal"
      :cardId="editingTicket?.id || editingTicket?._id"
      @close="closeModal"
    />

   

    <CreateBacklogTicketWithModuleSelection v-model="isCreateTicketModalOpen" />
    <!-- <CreateSheetModal v-model="sprintModalOpen" size="md"  /> -->
  </div>
  
</template>

<script setup lang="ts">
import BacklogTable from "./components/BacklogTable.vue";
import SprintCard from "./components/SprintCard.vue";
import SprintModal from "./modals/SprintModal.vue";
import ModuleSheetDropdown from "./components/ModuleSheetDropdown.vue";
import PlanSelectDropdown from "./components/PlanSelectDropdown.vue"; 
import ExpandableSearch from "../../components/ui/ExpandableSearch.vue";
import { computed, ref, watch, onMounted, defineAsyncComponent } from "vue";
import { useBacklogStore, type Ticket } from "./composables/useBacklogStore";
import Button from "../../components/ui/Button.vue";
import { useSidePanelStore } from "../../stores/sidePanelStore";
import {
  useBacklogList,
  useCompleteSprint,
  useCreateSprint,
  useDeleteSprint,
  useRemoveCardFromSprint,
  useSprintCard,
  useSprintDetail,
  useSprintList,
  useGroupedSprints,
  useStartSprint,
  useUpdateSprint,
  useDeleteSprintCard,
} from "../../queries/usePlan";
import ConfirmDeleteSprint from "./components/confirmDeleteTicket.vue";
import { toast } from "vue-sonner";
import { useWorkspaceId } from "../../composables/useQueryParams";
import { useQueryClient } from "@tanstack/vue-query";
import ConfirmDeleteModal from "../Product/modals/ConfirmDeleteModal.vue";
import StartSprintModal from "./modals/StartSprintModal.vue";
import CreateBacklogTicketWithModuleSelection from "./modals/CreateBacklogTicketWithModuleSelection.vue";
import ActiveSprint from "./components/ActiveSprint.vue";
import TaskDetailsModal from "../Workspaces/Modals/TaskDetailsModal.vue";
import { useTheme } from "../../composables/useTheme";
import { useSingleWorkspaceCompany } from "../../queries/useWorkspace";
import { usePermissions } from "../../composables/usePermissions";
import { useSheets } from "../../queries/useSheets";
const SidePanel = defineAsyncComponent(
  () => import("../Product/components/SidePanel.vue"),
);
const { isDark } = useTheme();
const selectedCard = ref<any>(null);
const showTaskModal = ref(false);
const showSprintDeleteTicket = ref(false);
const searchQuery = ref("");
const backlogSearchQuery = ref("");
const checkedAll = ref(false);
const checkedSprintAll = ref(false);
const { canCreateCard } = usePermissions();
const showActiveSprint = ref(localStorage.getItem('showActiveSprint') === 'true');
const { workspaceId } = useWorkspaceId();
// Watch and persist changes
watch(showActiveSprint, (val) => {
  localStorage.setItem('showActiveSprint', String(val));
});
const module_id= ref(localStorage.getItem("selectedModuleId") ||"");
const {
  data
} = useSheets({
  workspace_id: workspaceId,
  workspace_module_id: module_id,
});
const sheetId = computed(() => (data.value ? data.value[0]?._id : ""));
const selected_sheet_id = ref<any>(sheetId.value);
const selectedSprintIdForDelete = ref<string | null>(null);
const selectedCardIdsForDelete = ref<string[]>([]);
const elipseWrapperSprint = ref<HTMLElement | null>(null);
const open = ref(false);
const openElipseDropDown = ref(false);
const sprintType = computed(() => selectedType.value.value);
const parseInitialArray = (key: string) => {
  const val = localStorage.getItem(key);
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [val];
  } catch {
    return [val];
  }
};

const selectedFilter = ref<string[]>(parseInitialArray("activeMilestoneId"));
const selectedSheetFilter = ref<string[]>(parseInitialArray("activeSheetId"));
const selectedFilterLabel = ref(localStorage.getItem("activeMilestoneLabel") || "All Modules");

const selectedPlanIds = ref<string[]>(parseInitialArray("activePlanIds"));
const selectedPlanLabel = ref(localStorage.getItem("activePlanLabel") || "Select Plans");
const includeSprintCards = computed(() => selectedPlanIds.value.length > 0);
const currentPage = ref(1);

const selectedFilterLabelWithCount = computed(() => {
  const label = selectedFilterLabel.value || "All Modules";
  if (isBacklogRefreshing.value) return label;
  const count = backlogResp.value?.cards?.length;
  return count ? `${label} (${count})` : label;
});
const isStartingSprintLoading = ref(false);
const sidePanelStore = useSidePanelStore();
const isSprintChecked = ref(false);
const selectedSprintTicketIds = ref<string[]>([]);
const sprintTypes = [
  { label: "Milestone", value: "milestone", dot: "#7D68C8" },
  { label: "Sprint", value: "sprint", dot: "#7D68C8" },
  { label: "Huddle", value: "huddle", dot: "#7D68C8" },
];
const formattedLabel = computed(() => {
  if (!sprintType.value) return "";
  return sprintType.value.charAt(0).toUpperCase() + sprintType.value.slice(1);
});
const savedSprintType = localStorage.getItem("sprintType");
const initialType = sprintTypes.find(t => t.value === savedSprintType) || sprintTypes[0];
const selectedType = ref(initialType);
import { onClickOutside } from "@vueuse/core";
// import ConfirmDeleteTicket from "./components/confirmDeleteTicket.vue";
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
  localStorage.setItem("activeSprintKey", selectedSprintId.value || "");
};
const showTooltip = ref(false);

const toggleTooltip = (): void => {
  showTooltip.value = !showTooltip.value;
};

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
function handleConfirmDeleteSprint() {
  if (
    !selectedSprintIdForDelete.value ||
    !selectedCardIdsForDelete.value.length
  )
    return;

  selectedCardIdsForDelete.value.forEach((cardId) => {
    deleteSprintCard({
      sprintId: selectedSprintIdForDelete.value!,
      cardId,
    });
  });

  // close modal & reset state immediately
  resetDeleteState();
}
function resetDeleteState() {
  showSprintDelete.value = false;
  selectedSprintIdForDelete.value = null;
  selectedCardIdsForDelete.value = [];
}
const { mutate: deleteSprintCard, isPending: isDeletingSprintTicket } =
  useDeleteSprintCard({
    onSuccess: () => {
      // Update local store
      deleteSelected("sprint", selectedSprintIdForDelete.value!);
      showSprintDeleteTicket.value = false;
      refetchSprintData();
      // Reset modal state
      resetDeleteState();
    },
  });

const title = ref("");
function handleDeleteSelectedSprint(cardIds: string[], summary: string) {
  if (!selectedSprintId.value || !cardIds.length) return;
  selectedSprintIdForDelete.value = selectedSprintId.value;
  selectedCardIdsForDelete.value = cardIds;
  title.value = summary;
  showSprintDeleteTicket.value = true;
}

 

function handleDropdownSelect(payload: { ids: string[], sheetIds: string[], label: string }) {
  selectedFilter.value = payload.ids;
  selectedSheetFilter.value = payload.sheetIds;
  selectedFilterLabel.value = payload.label;
  
  // Update side panel if single selection, or clear if multiple?
  // Keeping first one for backward compatibility where possible
  sidePanelStore.setActiveMilestoneId(payload.ids[0] || "");
  
  localStorage.setItem("activeMilestoneId", JSON.stringify(payload.ids));
  localStorage.setItem("activeSheetId", JSON.stringify(payload.sheetIds));
  localStorage.setItem("activeMilestoneLabel", payload.label);
}

function handlePlanSelect(payload: { ids: string[], label: string }) {
  selectedPlanIds.value = payload.ids;
  selectedPlanLabel.value = payload.label;
  localStorage.setItem("activePlanIds", JSON.stringify(payload.ids));
  localStorage.setItem("activePlanLabel", payload.label);
}

 

 

const { 
  data: backlogResp,   
  isPending: isBacklogRefreshing 
} = useBacklogList(
  workspaceId,
  ref(""),
  selectedFilter,
  selectedSheetFilter,
  selectedPlanIds,
  includeSprintCards,
  currentPage,
);
// Reset to page 1 whenever filters change (TanStack Query re-fetches via reactive queryKey)
watch([selectedFilter, selectedSheetFilter, selectedPlanIds], () => {
  currentPage.value = 1;
});
const { data: workspaceData } = useSingleWorkspaceCompany(workspaceId);
const visibleModules = computed(
  () =>
    workspaceData.value?.modules.filter(
      (m: any) => m?.variables?.["module-title"] !== "Pin",
    ) || [],
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
 
const { mutate: startSprint, isPending: isStartingSprint } = useStartSprint({
  onSuccess: () => {
    refetchSprintDetail();
  },
});
const handleEditFromStart = () => {
  startsprintModalOpen.value = false;
  // Hydrate selectedSprint with data from store for editing
  selectedSprint.value = {
    ...sidePanelStore.startedSprint,
    _id: sidePanelStore.startedSprint?.id,
    title: sidePanelStore.startedSprint?.sprint_name
  };
  sprintModalOpen.value = true;
};

const handleStartNow = async () => {
  const data = sidePanelStore.startedSprint;
  if (!data) return;
  
  isStartingSprintLoading.value = true;
  try {
    await startSprint({
      id: selectedSprintId.value,
      payload: {
        title: data.sprint_name,
        start_date: data.start,
        end_date: data.end,
        goal: data.goal,
        duration: Number(data.duration),
        ...(data.num_sprints ? { num_sprints: data.num_sprints } : {}),
        ...(data.parent_sprint_id ? { parent_sprint_id: data.parent_sprint_id } : {})
      },
    });
    startsprintModalOpen.value = false;
  } finally {
    isStartingSprintLoading.value = false;
  }
};

const {
  data: sprintsList,
  refetch: refetchSprints,
  isLoading: isLoadingSprint,
} = useSprintList(workspaceId.value, sprintType);

const {
  data: groupedSprints 
} = useGroupedSprints(workspaceId);
const sprintOptions = computed(() => {
  const grouped = groupedSprints.value?.grouped;
  if (!grouped) return [];

  return [
    { id: "milestone", title: "Milestones", sprints: grouped.milestone || [] },
    { id: "sprint", title: "Sprints", sprints: grouped.sprint || [] },
    { id: "huddle", title: "Huddles", sprints: grouped.huddle || [] },
  ];
});
 
watch(
  () => sprintType.value,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      refetchSprints();
    }
  },
);
const { refetch: refetchBacklog, isPending: isBacklogPenidng } = useBacklogList(
  workspaceId,
  ref(""),
  ref(""),
);
const firstSprintId = computed(() => sprintsList?.value?.sprints[0]?._id);
const selectedSprintId = ref(localStorage.getItem("activeSprintKey") || "");
watch(
  () => firstSprintId.value,
  (newVal) => {
    if (!selectedSprintId.value && newVal) {
      selectedSprintId.value = newVal;
    }
  },
);
watch(
  () => selectedSprintId.value,
  (id) => {
    selectedSprint.value =
      sprintsList.value?.sprints.find((s: any) => s._id === id) || null;
  },
);

const { data: sprintDetailData, refetch: refetchSprintDetail } =
  useSprintDetail(selectedSprintId, {
    enabled: computed(() => !!selectedSprintId.value),
  });

const startsprintModalOpen = ref(false);
const openStartSprintModal = () => {
  if (sprintDetailData.value) {
    const data = sprintDetailData.value;
    const modalSprintData = {
      id: data._id,
      sprint_name: data.title,
      start: data.start_date,
      end: data.end_date,
      sprintType: data.sprintType,
      duration: data.duration,
      goal: data.goal || "",
      num_sprints: data.num_sprints,
      parent_sprint_id: data.parent_sprint_id,
      description: data.description || "",
    };
    sidePanelStore.storeActiveSprint(modalSprintData);
  }
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
  },
);
const {
  data: sprintData,
  refetch: refetchSprintData,
  isFetching: isSprintsFetching,
} = useSprintCard(selectedSprintId);

watch(
  () => selectedSprintId.value,
  () => {
    if (selectedSprintId.value) {
      refetchSprintDetail();
    }
  },
);



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
      _id: c?.card?._id,
      key: (v["card-code"] as string) || id?.slice(-6) || "PRJ-?",
      summary: (v["card-title"] as string) || "(untitled)",
      type: "Story" as const,
      status: mapStatus(String(v["card-status"] || "").trim()),
      assignee: c?.card?.assigned_to?.u_full_name || "Unassigned",
      image: c?.card?.assigned_to?.u_avatar || "",
      storyPoints: Number(c.story_points || 0),
      priority: mapPriority(String(v["priority"] || "").trim()),
      createdAt: c?.card?.created_at || new Date().toISOString(),
      description: (v["card-description"] as string) || "",
      seats:c?.card?.seats
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
  selectedSprintId.value = sprint._id;
  isSprintDropdownOpen.value = false;
  localStorage.setItem("activeSprintKey", sprint?._id);
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
  sprintId?: string,
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
  selectedCard.value = t; 
  sidePanelStore.selectTaskCard(t);
  editingTicket.value = t;
  showTaskModal.value = false;
  ticketModalOpen.value = true;
}

const closeSidePanel = () => {
  selectedCard.value = null;
  sidePanelStore.clearSelectedCard();
};
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
    if (data && data._id) {
      const modalSprintData = {
        id: data._id,
        sprint_name: data.title,
        start: data.start_date,
        end: data.end_date,
        sprintType: data.sprintType,
        duration: data.duration,
        goal: data.goal || "",
        num_sprints: data.num_sprints,
        parent_sprint_id: data.parent_sprint_id,
        description: data.description || "",
      };
      sidePanelStore.storeActiveSprint(modalSprintData);
      selectSprint(data);
    }
  },
});
const { mutate: updateSprint, isPending: isUpdatingSprint } = useUpdateSprint({
  onSuccess: (data: any) => {
    saveSprintMeta({ name: data.title });
    queryClient.invalidateQueries({ queryKey: ["sprint-list"] });
    queryClient.invalidateQueries({
      queryKey: ["sprint-detail", selectedSprintId.value],
    });

    // Update store with fresh data so StartSprintModal is reactive
    const modalSprintData = {
      id: data._id,
      sprint_name: data.title,
      start: data.start_date,
      end: data.end_date,
      sprintType: data.sprintType,
      duration: data.duration,
      goal: data.goal || "",
      num_sprints: data.num_sprints,
      parent_sprint_id: data.parent_sprint_id,
      description: data.description || "",
    };
    sidePanelStore.storeActiveSprint(modalSprintData);

    sprintModalOpen.value = false;
  },
});
// Removed inline edit state as we now use SprintModal for all edits

function saveSprintHandler(e: any) {
  if (selectedSprint.value) {
    updateSprint({
      id: selectedSprint.value?._id,
      payload: {
        workspace_id: workspaceId.value,
        title: e.name || e.title,
        sprintType: e.value,
        description: e.description,
        duration: e.duration,
        start_date: e.start,
        end_date: e.end,
        goal: e.goal,
        ...(e.num_sprints ? { num_sprints: e.num_sprints } : {}),
        ...(e.parent_sprint_id ? { parent_sprint_id: e.parent_sprint_id } : {}),
      },
    });
  } else {
    createSprint({
      payload: {
        workspace_id: workspaceId.value,
        title: e.name || e.title,
        sprintType: e.value,
        description: e.description,
        duration: e.duration,
        start_date: e.start,
        end_date: e.end,
        goal: e.goal,
        ...(e.num_sprints ? { num_sprints: e.num_sprints } : {}),
        ...(e.parent_sprint_id ? { parent_sprint_id: e.parent_sprint_id } : {}),
      },
    });
  }
}
const sprintsDataFromPlus = ref([] as any);
function openSprintModal(sprintsData: any) {
  selectedSprint.value = null;
  sprintModalOpen.value = true;
  sprintsDataFromPlus.value = sprintsData;
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


function openModalEditSprint(sprint: any) {
  selectedSprint.value = sprint;
  sprintModalOpen.value = true;
}

onClickOutside(elipseWrapperSprint, () => {
  openElipseDropDown.value = false;
});
 

 

 

const selectType = (item: (typeof sprintTypes)[number]) => {
  selectedType.value = item;
  selectedSprintId.value = "";
  selectedFilter.value = [];
  selectedSheetFilter.value = [];
  selectedPlanIds.value = [];
  selectedPlanLabel.value = "Select Plans";
  localStorage.setItem("activeSheetId", JSON.stringify([]));
  localStorage.setItem("activeMilestoneId", JSON.stringify([]));
  localStorage.setItem("activePlanIds", JSON.stringify([]));
  localStorage.setItem("activePlanLabel", "Select Plans");
  localStorage.setItem("sprintType", item.value);
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

  

// Computed label for huddle button (Removed legacy filters)

// sprint menu button icon
const showMenu = ref(false);

const toggleMenu = () => {
  showMenu.value = !showMenu.value;
};
const openStartSprintModalForUpdate = (sprint: any) => {
  if(sprintDetailData.value?.status !== 'active'){
    toast.error(`please start the ${sprintType.value || 'sprint'} first.`);
    showMenu.value = false;
    return;
  }else{
    const modalSprintData = {
    id: sprint._id,
    sprint_name: sprint.title,
    start: sprint.start_date,
    end: sprint.end_date,
    sprintType: sprint.sprintType,
    duration: sprint.duration,
    goal: sprint.goal || "",
  };
  sidePanelStore.storeActiveSprint(modalSprintData);
  startsprintModalOpen.value = true;
  showMenu.value = false;
  }
  
};

function onDelete() {
  if (!selectedSprintTicketIds.value.length) return;

  handleDeleteSelectedSprint(
    selectedSprintTicketIds.value,
    `${selectedSprintTicketIds.value.length} ticket(s)`,
  );

  showMenu.value = false;
}
//save selected sprint title
const selectedSprintTitle = computed(() => {
  const title = sprintsList.value?.sprints?.find(
    (sprint: any) => sprint._id === selectedSprintId.value
  )?.title;

  if (title) localStorage.setItem('selectedSprintTitle', title);
  
  return title ?? localStorage.getItem('selectedSprintTitle') ?? '';
});
</script>

<style scoped>
.custom-checkbox {
  appearance: none;
  /* remove native checkbox UI */
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
