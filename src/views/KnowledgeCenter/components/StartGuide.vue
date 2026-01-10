<template>
  <div class="bg-bg-body text-text-primary font-manrope">
    <!-- Breadcrumb -->
    <div class="text-[14px] font-normal text-text-secondary mb-[10px] lg:mb-[16px]">Home</div>

    <!-- Title -->
    <h2 class="font-manrope text-text-primary font-bold text-[24px] lg:text-[40px] leading-[34px] lg:leading-[40px] tracking-[-1px] mb-[10px] lg:mb-[16px] ">Knowledge Center</h2>
    <p class="text-text-secondary text-[16px] lg:text-[20px] leading-[24px] lg:leading-[28px] mb-5 lg:mb-[32px]">
      Learn how to set up Space, collaborate with your team, and ship work faster.
    </p>

    <!-- Search Input -->
    <div class="relative mb-[30px] lg:mb-[48px] max-w-[672px]">
      <i class="fa-light fa-magnifying-glass absolute top-[13px] left-[14px] text-text-secondary"></i>
      <input
        type="text"
        placeholder="Search guides, shortcuts, and troubleshooting"
        class="w-full pl-11 pr-4 py-3 rounded-[10px] bg-bg-lavender font-manrope text-[14px] leading-[20px] font-normal text-text-primary focus:outline-none focus:ring-1 focus:ring-bg-lavender "
         :class="isDark ? 'border border-border-input' : 'border border-black'"
      />
    </div>

    <!-- Popular Section -->
    <section class="mb-12">
      <h3 class="text-[20px] lg:text-[24px] font-manrope font-semibold mb-[20px] lg:mb-[24px]">Popular</h3>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(item, i) in popular"
          :key="i"
          class="bg-bg-lavender rounded-xl p-4 hover:border-bg-lavender 
                 transition-all cursor-pointer"
                  :class="isDark ? 'border border-border-input' : 'border border-[#a495e9b5]'"  
        >
          <div class="flex flex-col items-start gap-3 mb-2">
            <i class="text-lg"
             :class="[isDark ? 'text-text-secondary' : 'text-black', item.icon ]"
            ></i>
            <h3 class="font-medium text-[16px] lg:text-[18px] leading-[28px] font-manrope text-text-primary">{{ item.title }}</h3>
          </div>
          <p class="text-[14px] text-text-secondary leading-[23px]">
            {{ item.text }}
          </p>
        </div>
      </div>
    </section>

    <!-- Space Basics Section -->
     <section class="mb-12">
      <h3 class="text-[20px] lg:text-[24px] font-manrope font-semibold mb-[20px] lg:mb-[24px]">Space basics</h3>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(item, i) in basics"
          :key="i"
          class="bg-bg-lavender rounded-xl p-4 hover:border-bg-lavender 
                 transition-all cursor-pointer"
           :class="isDark ? 'border border-border-input' : 'border border-[#a495e9b5]'"       
        >
          <div class="flex flex-col items-start gap-3 mb-2">
            <i :class="item.icon" class="text-text-secondary text-lg"></i>
            <h3 class="font-medium text-[16px] lg:text-[18px] leading-[28px] font-manrope text-text-primary">{{ item.title }}</h3>
          </div>
          <p class="text-[14px] text-text-secondary leading-[23px]">
            {{ item.text }}
          </p>
        </div>
      </div>
    </section> 
  </div>
</template>

<script setup lang="ts">
import { useTheme } from "../../../composables/useTheme";
const { isDark } = useTheme(); // light / dark / system
const popular = [
  { title: "Start guide", text: "A 10-minute tour of Space — create your workspace, invite teammates, and publish your first doc.", icon: "fa-light fa-book-open" },
  { title: "Import your work", text: "Bring notes, issues, and docs from other tools into Space in a few clicks.", icon: "fa-light fa-arrow-down-to-bracket" },
  { title: "Projects", text: "Plan work with milestones, owners, and status updates that roll up automatically.", icon: "fa-light fa-diagram-project" },
  { title: "GitHub & Slack", text: "Link pull requests and get lightweight notifications in the channels your team already uses.", icon: "fa-light fa-slack" },
]

const basics = [
  { title: "Workflows", text: "Model how work moves from idea to done using statuses and automations.", icon: "fa-light fa-diagram-lean-canvas" },
  { title: "Selecting and bulk actions", text: "Edit multiple docs or tasks at once with keyboard-first selection.", icon: "fa-light fa-square-check" },
  { title: "Relationships", text: "Create links between docs, tasks, and projects to show dependencies.", icon: "fa-light fa-link" },
  { title: "Display options", text: "Sort, group, and save views — switch between table, board, and timeline.", icon: "fa-light fa-display" },
  { title: "Triage", text: "Collect new tasks and inbound requests in one inbox for quick routing.", icon: "fa-light fa-inbox" },
  { title: "Sub-items", text: "Break large initiatives into smaller pieces you can assign and track.", icon: "fa-light fa-list-tree" },
  { title: "Notifications", text: "Stay on top of mentions, approvals, and due dates without the noise.", icon: "fa-light fa-bell" },
  { title: "Teams", text: "Organize work by team with dedicated defaults, permissions, and views.", icon: "fa-light fa-users" },
]
</script>

<style scoped>
/* Smooth hover effect for cards */
div[class*='rounded-xl']:hover {
  transform: translateY(-2px);
  transition: all 0.2s ease-in-out;
}
</style>
