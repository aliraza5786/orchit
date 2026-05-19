<template>
  <Loader v-if="isPending" />
  <nav
    class="sticky top-0 z-110 w-full border-b border-border bg-bg-body"
    role="navigation"
    aria-label="Primary"
  >
    <div class="mx-auto flex max-w-[1400px] items-center justify-between px-10 max-md:p-4">
      <div class="flex items-center gap-2">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="md:hidden grid h-9 w-9 place-items-center rounded-lg text-text-primary hover:bg-bg-dropdown-menu-hover transition-colors"
          aria-label="Toggle Menu"
        >
          <i class="fa-solid" :class="isSidebarOpen ? 'fa-xmark' : 'fa-bars'"></i>
        </button>
        <div class="flex items-center gap-2 cursor-pointer" @click="handleLogoClick">
          <img v-if="!isDark" src="../../../assets/global/light-logo.png" alt="Orchit AI logo" class="w-24 sm:w-30" loading="eager" decoding="async" />
          <img v-else src="../../../assets/global/dark-logo.png" alt="Orchit AI logo" class="w-24 sm:w-30" loading="eager" decoding="async" />
        </div>
      </div>

      <!-- Primary nav -->
      <ul class="relative hidden items-stretch py-2 gap-9 text-sm font-medium text-text-primary md:flex" ref="linksContainerRef">
        <div
          class="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-text-primary transition-all duration-300 ease-out"
          :style="{ left: indicatorLeft + 'px', width: indicatorWidth + 'px' }"
        />
        <RouterLink v-for="link in visibleLinks" :key="link.to" :to="link.to" custom v-slot="{ navigate, isActive, isExactActive }">
          <li
            :ref="(el) => setLinkRef(link.to, el as HTMLElement)"
            @click="navigate"
            class="relative cursor-pointer py-3 transition-colors"
            :class="isActive || (link.exact && isExactActive) ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'"
            @mouseenter="() => previewIndicator(link.to)"
            @mouseleave="syncIndicatorToRoute()"
          >
            {{ link.label }}
          </li>
        </RouterLink>
      </ul>

      <!-- Right controls -->
      <div class="flex items-center gap-4">
        <NotificationBell />
        <div class="relative" ref="menuRef">

          <!-- Avatar trigger -->
          <button
            v-if="profileData?.u_profile_image"
            aria-haspopup="menu"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-controls="menuOpen ? 'user-menu' : undefined"
            @click="toggleMenu" @keydown.enter.prevent="toggleMenu"
            @keydown.space.prevent="toggleMenu" @keydown.esc.prevent="closeMenu"
          >
            <img class="object-cover cursor-pointer w-9 h-9 rounded-full ring-2 ring-border/30 hover:ring-border transition-all" :src="profileData?.u_profile_image" alt="profile_img" />
          </button>
          <button
            v-else type="button"
            class="h-9 w-9 cursor-pointer rounded-full bg-orange-500 text-sm font-bold text-white ring-2 ring-border/20 ring-offset-1 ring-offset-bg-body hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 transition-all"
            aria-haspopup="menu" :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-controls="menuOpen ? 'user-menu' : undefined"
            @click="toggleMenu" @keydown.enter.prevent="toggleMenu"
            @keydown.space.prevent="toggleMenu" @keydown.esc.prevent="closeMenu"
          >{{ initials }}</button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1 scale-95"
            enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-120 ease-in"
            leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-1 scale-95"
          >
            <div
              v-if="menuOpen"
              id="user-menu"
              role="menu"
              class="absolute right-0 mt-2 origin-top-right rounded-2xl bg-bg-dropdown z-[110] border border-border/50 shadow-xl shadow-black/10 w-[min(310px,calc(100vw-24px))] max-md:fixed max-md:left-1/2 max-md:-translate-x-1/2 max-md:right-auto max-md:top-[60px] max-md:w-[calc(100vw-32px)] flex flex-col overflow-hidden"
              @keydown.esc.stop.prevent="menuOpen = false"
            >

              <!-- ══ USER IDENTITY HEADER — always visible ══ -->
              <div class="flex flex-col items-center pt-5 pb-4 px-4 text-center border-b border-border/40">
                <div class="relative mb-3">
                  <img
                    v-if="profileData?.u_profile_image"
                    class="w-14 h-14 rounded-full object-cover ring-[3px] ring-border/20"
                    :src="profileData?.u_profile_image" alt="profile"
                  />
                  <div
                    v-else
                    class="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center text-xl font-bold text-white"
                  >{{ initials }}</div>
                  <!-- live status dot -->
                  <span class="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-bg-dropdown block">
                    <span class="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-60"></span>
                  </span>
                </div>
                <p class="text-[15px] font-bold text-text-primary leading-tight">{{ profileData?.u_full_name }}</p>
                <p class="text-[12px] text-text-secondary mt-1">{{ profileData?.u_email }}</p>
                <!-- managed-by badge — only in professional mode with active company -->
                <div
                  v-if="accountMode === 'professional' && activeCompanyData"
                  class="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/[0.08] border border-accent/20 text-[10px] font-bold text-accent uppercase tracking-wider"
                >
                  <i class="fa-solid fa-shield-halved text-[9px]"></i>
                  Managed by {{ activeCompanyData.title }}
                </div>
              </div>

              <!-- ══ TAB SWITCHER ══ -->
              <div v-if="isApprovedCompanyMember" class="px-3 pt-3 pb-1">
                <div class="relative flex bg-bg-surface border border-border/40 rounded-xl p-[3px] gap-[3px]">
                  <!-- sliding pill -->
                  <div
                    class="absolute inset-[3px] rounded-lg bg-bg-dropdown border border-border/50 shadow-sm transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] pointer-events-none"
                    :style="accountMode === 'personal'
                      ? 'left:3px;right:calc(50% + 1.5px);top:3px;bottom:3px'
                      : 'left:calc(50% + 1.5px);right:3px;top:3px;bottom:3px'"
                  />
                  <button
                    type="button" @click="handlePersonalTabClick"
                    class="relative z-10 flex-1 flex items-center justify-center gap-2 py-[7px] rounded-lg text-[11px] font-semibold transition-colors duration-150 cursor-pointer"
                    :class="accountMode === 'personal' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'"
                  >
                    <i class="fa-regular fa-user text-[10px]"></i>
                    Personal
                    <span v-if="!authStore.company_id || authStore.company_id === 'personal'" class="w-[5px] h-[5px] rounded-full bg-green-500"></span>
                  </button>
                  <button
                    type="button" @click="handleProfessionalTabClick"
                    class="relative z-10 flex-1 flex items-center justify-center gap-2 py-[7px] rounded-lg text-[11px] font-semibold transition-colors duration-150 cursor-pointer"
                    :class="accountMode === 'professional' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'"
                  >
                    <i class="fa-regular fa-building text-[10px]"></i>
                    Professional
                    <span v-if="authStore.company_id && authStore.company_id !== 'personal'" class="w-[5px] h-[5px] rounded-full bg-green-500"></span>
                  </button>
                </div>
              </div>

              <!-- ══════════════════════════════
                   PERSONAL PANEL
              ══════════════════════════════ -->
              <div v-if="accountMode === 'personal'" class="flex flex-col pb-1">

                <!-- Personal workspace card -->
                <div class="mx-3 mt-3 rounded-xl border border-border/50 bg-bg-surface overflow-hidden">
                  <div class="flex items-center gap-3 px-3 py-3">
                    <div class="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-[13px] font-bold shrink-0">
                      {{ initials.charAt(0) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-[12px] font-bold text-text-primary truncate leading-tight">Personal workspace</p>
                      <p class="text-[10px] text-text-secondary mt-0.5">Managed by you</p>
                    </div>
                    <span class="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">Active</span>
                  </div>
                  <!-- nav items -->
                  <button
                    type="button"
                    @click="openAccountSettings(); closeMenu()"
                    class="w-full flex items-center gap-2.5 px-3 py-2.5 border-t border-border/40 hover:bg-bg-dropdown-menu-hover transition-colors text-left group"
                  >
                    <i class="fa-regular fa-gear text-[11px] text-text-secondary w-3.5 text-center"></i>
                    <span class="text-[11px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors flex-1">Manage account</span>
                    <i class="fa-solid fa-chevron-right text-[9px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </button>
                </div>

                <div class="h-px bg-border/30 mx-3 mt-3 mb-1"></div>

                <!-- Appearance + Logout -->
                <div class="px-2">
                  <div class="relative" @mouseenter="openTheme" @mouseleave="closeTheme">
                    <button
                      ref="themeTriggerRef" type="button"
                      class="flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <span class="flex items-center gap-2.5">
                        <i class="fa-regular fa-circle-half-stroke text-xs w-3.5 text-center"></i>
                        <span class="text-[13px] font-medium">Appearance</span>
                      </span>
                      <span class="flex items-center gap-1.5 text-[11px]">
                        {{ isDark ? 'Dark' : 'Light' }}
                        <i class="fa-solid fa-chevron-right text-[9px]"></i>
                      </span>
                    </button>
                    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 translate-x-1 scale-95" enter-to-class="opacity-100 translate-x-0 scale-100" leave-active-class="transition duration-120 ease-in" leave-from-class="opacity-100 translate-x-0 scale-100" leave-to-class="opacity-0 translate-x-1 scale-95">
                      <div v-if="themeOpen" class="absolute z-10 w-44 rounded-xl bg-bg-dropdown p-1.5 shadow-lg border border-border/60" :class="[themeFlipLeft ? 'right-0 sm:right-full sm:mr-2' : 'left-full ml-2', 'bottom-0 sm:bottom-auto sm:top-0']">
                        <button class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary text-[13px]" @click="setTheme('system'); closeMenu()" type="button"><i class="fa-solid fa-desktop w-4 text-center text-xs"></i>System</button>
                        <button class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary text-[13px]" @click="setTheme('light'); closeMenu()" type="button"><i class="fa-regular fa-sun w-4 text-center text-xs"></i>Light</button>
                        <button class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary text-[13px]" @click="setTheme('dark'); closeMenu()" type="button"><i class="fa-regular fa-moon w-4 text-center text-xs"></i>Dark</button>
                      </div>
                    </Transition>
                  </div>
                  <button type="button" class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-red-500/[0.07] text-red-500 transition-colors" @click="handleLogout">
                    <i class="fa-solid fa-arrow-right-from-bracket text-xs w-3.5 text-center"></i>
                    <span class="text-[13px] font-medium">Log out</span>
                  </button>
                </div>
              </div>

              <!-- ══════════════════════════════
                   PROFESSIONAL PANEL
              ══════════════════════════════ -->
              <div v-else-if="accountMode === 'professional'" class="flex flex-col pb-1">

                <!-- Active org card -->
                <div v-if="activeCompanyData" class="mx-3 mt-3 rounded-xl border border-accent/25 bg-accent/[0.03] overflow-hidden">
                  <div class="flex items-center gap-3 px-3 py-3">
                    <div class="relative shrink-0">
                      <img v-if="activeCompanyData.logo" :src="activeCompanyData.logo" class="w-9 h-9 rounded-xl object-cover border border-border/40" />
                      <div v-else class="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-[13px] font-bold">
                        {{ activeCompanyData.title?.charAt(0)?.toUpperCase() || '?' }}
                      </div>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-[12px] font-bold text-text-primary truncate leading-tight">{{ activeCompanyData.title }}</p>
                      <p class="text-[10px] text-text-secondary mt-0.5 capitalize truncate">
                        {{ activeCompanyData.user_role?.title || activeCompanyData.membership_role || 'Member' }}
                        <span v-if="activeCompanyData.domain_link" class="text-text-secondary/60"> · {{ activeCompanyData.domain_link.replace(/https?:\/\//, '') }}</span>
                      </p>
                    </div>
                    <span class="shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">Active</span>
                  </div>

                  <!-- Org nav items -->
                  <div class="border-t border-accent/15 divide-y divide-border/30">
                    <button
                      type="button"
                      @click="router.push('/settings?tab=org-setup'); closeMenu()"
                      class="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent/[0.06] transition-colors text-left group"
                    >
                      <i class="fa-regular fa-building text-[11px] text-accent/70 w-3.5 text-center"></i>
                      <span class="text-[11px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors flex-1">Manage organization</span>
                      <i class="fa-solid fa-chevron-right text-[9px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </button>
                    <button
                      type="button"
                      @click="router.push('/settings?tab=org-members'); closeMenu()"
                      class="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-accent/[0.06] transition-colors text-left group"
                    >
                      <i class="fa-regular fa-users text-[11px] text-accent/70 w-3.5 text-center"></i>
                      <span class="text-[11px] font-semibold text-text-secondary group-hover:text-text-primary transition-colors flex-1">Members</span>
                      <i class="fa-solid fa-chevron-right text-[9px] text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </button>
                  </div>
                </div>

                <!-- Switch organization section -->
                <template v-if="otherCompanies.length">
                  <p class="text-[10px] font-bold text-text-secondary uppercase tracking-widest px-4 pt-4 pb-2">Switch organization</p>
                  <div class="px-2 space-y-0.5">
                    <div
                      v-for="comp in otherCompanies" :key="comp._id"
                      @click="switchToCompany(comp)"
                      class="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-bg-dropdown-menu-hover transition-colors cursor-pointer group"
                    >
                      <img v-if="comp.logo" :src="comp.logo" class="w-7 h-7 rounded-lg object-cover border border-border/40 shrink-0" />
                      <div v-else class="w-7 h-7 rounded-lg bg-bg-surface border border-border/50 flex items-center justify-center text-text-secondary text-[11px] font-bold shrink-0">
                        {{ comp.title?.charAt(0)?.toUpperCase() || '?' }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-[12px] font-semibold text-text-primary truncate">{{ comp.title }}</p>
                        <p class="text-[10px] text-text-secondary capitalize truncate">{{ comp.membership_role || 'Member' }}</p>
                      </div>
                      <span class="text-[10px] font-semibold text-text-secondary group-hover:text-accent transition-colors shrink-0 flex items-center gap-1">
                        Switch <i class="fa-solid fa-arrow-right text-[8px]"></i>
                      </span>
                    </div>
                  </div>
                </template>

                <!-- No org fallback -->
                <div v-if="!activeCompanyData" class="px-4 py-8 text-center">
                  <div class="w-11 h-11 rounded-2xl bg-bg-surface border border-border/50 flex items-center justify-center mx-auto mb-3">
                    <i class="fa-regular fa-building text-lg text-text-secondary opacity-40"></i>
                  </div>
                  <p class="text-[12px] font-bold text-text-primary mb-1">No organization yet</p>
                  <p class="text-[11px] text-text-secondary leading-relaxed mb-3">Create or join an organization to access professional features.</p>
                  <button type="button" @click="router.push('/settings?tab=org-create'); closeMenu()" class="text-[11px] font-bold text-accent hover:opacity-75 transition-opacity">Create organization →</button>
                </div>

                <div class="h-px bg-border/30 mx-3 mt-3 mb-1"></div>

                <!-- Appearance + Logout -->
                <div class="px-2">
                  <div class="relative" @mouseenter="openTheme" @mouseleave="closeTheme">
                    <button
                      ref="themeTriggerRef" type="button"
                      class="flex w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <span class="flex items-center gap-2.5">
                        <i class="fa-regular fa-circle-half-stroke text-xs w-3.5 text-center"></i>
                        <span class="text-[13px] font-medium">Appearance</span>
                      </span>
                      <span class="flex items-center gap-1.5 text-[11px]">
                        {{ isDark ? 'Dark' : 'Light' }}
                        <i class="fa-solid fa-chevron-right text-[9px]"></i>
                      </span>
                    </button>
                    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 translate-x-1 scale-95" enter-to-class="opacity-100 translate-x-0 scale-100" leave-active-class="transition duration-120 ease-in" leave-from-class="opacity-100 translate-x-0 scale-100" leave-to-class="opacity-0 translate-x-1 scale-95">
                      <div v-if="themeOpen" class="absolute z-10 w-44 rounded-xl bg-bg-dropdown p-1.5 shadow-lg border border-border/60" :class="[themeFlipLeft ? 'right-0 sm:right-full sm:mr-2' : 'left-full ml-2', 'bottom-0 sm:bottom-auto sm:top-0']">
                        <button class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary text-[13px]" @click="setTheme('system'); closeMenu()" type="button"><i class="fa-solid fa-desktop w-4 text-center text-xs"></i>System</button>
                        <button class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary text-[13px]" @click="setTheme('light'); closeMenu()" type="button"><i class="fa-regular fa-sun w-4 text-center text-xs"></i>Light</button>
                        <button class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary text-[13px]" @click="setTheme('dark'); closeMenu()" type="button"><i class="fa-regular fa-moon w-4 text-center text-xs"></i>Dark</button>
                      </div>
                    </Transition>
                  </div>
                  <button type="button" class="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-red-500/[0.07] text-red-500 transition-colors" @click="handleLogout">
                    <i class="fa-solid fa-arrow-right-from-bracket text-xs w-3.5 text-center"></i>
                    <span class="text-[13px] font-medium">Log out</span>
                  </button>
                </div>
              </div>

            </div>
          </Transition>
        </div>
      </div>
    </div>
  </nav>

  <LimitExceededModal @upgrade="handleUgrade" />

  <!-- Mobile Sidebar -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-400 ease-out" enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0" leave-active-class="transition duration-300 ease-in"
      leave-from-class="translate-x-0" leave-to-class="-translate-x-full"
    >
      <div v-if="isSidebarOpen" class="fixed top-[70px] left-0 right-0 bottom-0 z-[100] bg-bg-body md:hidden overflow-y-auto">
        <nav class="py-8 px-4">
          <ul class="flex flex-col space-y-6">
            <RouterLink v-for="link in links" :key="link.to" :to="link.to" custom v-slot="{ navigate, isActive, isExactActive }">
              <li
                @click="() => { navigate(); isSidebarOpen = false; }"
                class="flex items-center gap-4 text-text-primary font-manrope font-semibold leading-[30px] text-[18px] hover:text-primary transition-colors cursor-pointer"
                :class="{ 'text-accent font-bold': isActive || (link.exact && isExactActive) }"
              >
                <i v-if="link.label === 'Workspaces'" class="fa-solid fa-border-all w-6 text-xl"></i>
                <i v-else-if="link.label === 'My Tasks'" class="fa-solid fa-list-check w-6 text-xl"></i>
                <i v-else-if="link.label === 'Users'" class="fa-solid fa-users w-6 text-xl"></i>
                {{ link.label }}
              </li>
            </RouterLink>
          </ul>
        </nav>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed, onMounted, onBeforeUnmount, ref, nextTick, watch,
} from "vue";
import { useRouter, RouterLink, useRoute } from "vue-router";
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { getProfile } from "../../../services/user";
import { useTheme } from "../../../composables/useTheme";
import Loader from "../../../components/ui/Loader.vue";
import { useWorkspaceStore } from "../../../stores/workspace";
import NotificationBell from "./NotificationBell.vue";
import LimitExceededModal from "../modals/LimitExceededModal.vue";
import { useAuthStore } from "../../../stores/auth";
import { useCurrentPackage } from "../../../queries/usePackages";
import { redirectToLogin } from '../../../utilities/authRedirect';
import { setAuthCookie } from '../../../utilities/auth';

// ── Types ──────────────────────────────────────────────────────
interface Account {
  id: string;
  name: string;
  email: string;
  domain: string;
  type: "individual" | "company";
}

interface Company {
  _id: string;
  title: string;
  domain_link: string;
  membership_role: string;
  logo?: string | null;
  user_role?: { title?: string };
}

// ── Stores & composables ───────────────────────────────────────
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const { setTheme, isDark } = useTheme();
const router = useRouter();
const route = useRoute();
const queryClient = useQueryClient();

function handleUgrade() {
  router.push(`/settings?tab=billing&stripePayment=${true}`);
  workspaceStore.setLimitExccedModal(false);
}

function handleLogoClick() {
  const token = localStorage.getItem('token');
  if (!token) router.push('/');
}

const { data: profile, isPending } = useQuery({
  queryKey: ['profile'],
  queryFn: getProfile,
  placeholderData: (prev) => prev,
});

const profileData = computed(() => profile.value?.data ?? null);

const { data: currentPackage } = useCurrentPackage();
watch(() => currentPackage.value, (pkg) => {
  if (pkg) workspaceStore.setLimit(pkg);
}, { immediate: true });

const initials = computed(() => {
  const name = profileData.value?.u_full_name?.trim() || "";
  if (!name) return "U";
  return name.split(/\s+/).slice(0, 3).map((n: string) => n[0]).join("").toUpperCase();
});

// ── Active company — single source of truth ────────────────────
// Reads from active_company field on the profile, falls back to
// finding the matching entry in companies_list using authStore.company_id
const activeCompanyData = computed<Company | null>(() => {
  const ac = profileData.value?.active_company as Company | null | undefined;
  if (ac && ac._id) return ac;
  // fallback: match against companies_list
  const list: Company[] = profileData.value?.companies_list ?? [];
  if (authStore.company_id && authStore.company_id !== 'personal') {
    return list.find((c) => c._id === authStore.company_id) ?? null;
  }
  return null;
});

// All companies except the currently active one (for the switch list)
const otherCompanies = computed<Company[]>(() => {
  const list: Company[] = profileData.value?.companies_list ?? [];
  return list.filter((c) => c._id !== activeCompanyData.value?._id);
});

const isApprovedCompanyMember = computed(() => {
  return !!(activeCompanyData.value)
})

// ── Account mode ───────────────────────────────────────────────
const accountMode = ref<'personal' | 'professional'>('personal');

watch(
  [() => authStore.company_id, () => isApprovedCompanyMember.value],
  ([id, approved]) => {
    accountMode.value = id && id !== 'personal' && approved ? 'professional' : 'personal';
  },
  { immediate: true }
);

// ── Tab handlers ───────────────────────────────────────────────
function handlePersonalTabClick() {
  if (authStore.company_id && authStore.company_id !== 'personal') {
    // Currently on a company domain — redirect back to personal
    switchToPersonal();
  } else {
    accountMode.value = 'personal';
  }
}

function handleProfessionalTabClick() {
  if (!isApprovedCompanyMember.value) return;

  if (!authStore.company_id || authStore.company_id === 'personal') {
    // On personal domain — redirect to the active/associated company immediately
    const target = activeCompanyData.value
      ?? (profileData.value?.associated_company as Company | null)
      ?? (profileData.value?.companies_list?.[0] as Company | null ?? null);
    if (target) {
      switchToCompany(target);
    } else {
      accountMode.value = 'professional';
    }
  } else {
    // Already on company domain — just show professional panel
    accountMode.value = 'professional';
  }
}

// ── Domain switching ───────────────────────────────────────────
function switchToCompany(company: { _id: string; domain_link: string }) {
  closeMenu();
  const token = localStorage.getItem('token');
  const themeVal = isDark.value ? 'dark' : 'light';
  if (token) setAuthCookie(token);
  const encode = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.');
  const params = new URLSearchParams();
  if (token) params.set('_auth', encode(token));
  params.set('_cid', encode(company._id));
  params.set('theme', themeVal);
  window.location.href = `${company.domain_link}/dashboard?${params.toString()}`;
}

function switchToPersonal() {
  closeMenu();
  const token = localStorage.getItem('token');
  const themeVal = isDark.value ? 'dark' : 'light';
  if (token) setAuthCookie(token);
  const encode = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.');
  const params = new URLSearchParams();
  if (token) params.set('_auth', encode(token));
  params.set('_cid', encode('personal'));
  params.set('theme', themeVal);
  let base = import.meta.env.VITE_PRIMARY_DOMAIN || window.location.origin;
  if (!base.startsWith('http')) base = window.location.protocol + '//' + base;
  base = base.replace(/\/$/, '');
  window.location.href = `${base}/dashboard?${params.toString()}`;
}

// ── Other computed (kept from original) ───────────────────────
const personalAccount = computed<Account>(() => ({
  id: profileData.value?._id ?? 'personal',
  name: profileData.value?.u_full_name ?? 'My Account',
  email: profileData.value?.u_email ?? '',
  domain: import.meta.env.VITE_PRIMARY_DOMAIN || window.location.hostname,
  type: 'individual',
}));

const companyAccounts = computed<Account[]>(() =>
  (profileData.value?.companies_list ?? []).map((c: Company) => ({
    id: c._id, name: c.title, email: profileData.value?.u_email ?? '',
    domain: c.domain_link.replace("https://", ""), type: "company",
  }))
);

const currentAccount = computed<Account>(() => {
  const activeId = authStore.company_id;
  if (!activeId) return personalAccount.value;
  const found = companyAccounts.value.find((c) => c.id === activeId);
  if (found) return found;
  return {
    id: activeId, name: profileData.value?.u_full_name,
    email: profileData.value?.u_email ?? '', domain: window.location.hostname, type: 'company',
  };
});

const pendingAccount = ref<Account | null>(null);

// ── Menu state ─────────────────────────────────────────────────
const menuOpen = ref(false);
const themeOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const themeTriggerRef = ref<HTMLElement | null>(null);
const themeFlipLeft = ref(false);
const isSidebarOpen = ref(false);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
  if (!menuOpen.value) {
    themeOpen.value = false;
  } else {
    accountMode.value = (authStore.company_id && authStore.company_id !== 'personal' && isApprovedCompanyMember.value)
      ? 'professional' : 'personal';
  }
}

function closeMenu() {
  menuOpen.value = false;
  themeOpen.value = false;
  pendingAccount.value = null;
}

function computeThemePlacement() {
  const trigger = themeTriggerRef.value;
  if (!trigger) return;
  themeFlipLeft.value = window.innerWidth - trigger.getBoundingClientRect().right < 200;
}

function openTheme() {
  if (!themeOpen.value) {
    themeOpen.value = true;
    nextTick(() => computeThemePlacement());
  }
}

function closeTheme() { themeOpen.value = false; }

let rAF: number | null = null;

function onResize() {
  if (!menuOpen.value || !themeOpen.value) return;
  if (rAF) cancelAnimationFrame(rAF);
  rAF = requestAnimationFrame(() => { computeThemePlacement(); rAF = null; });
}

function onClickOutside(e: MouseEvent) {
  const root = menuRef.value;
  if (!root) return;
  if (!root.contains(e.target as Node)) closeMenu();
}

async function handleLogout() {
  try {
    closeMenu();
    workspaceStore.setWorkspace(null);
    authStore.logout();
    await queryClient.cancelQueries();
    queryClient.clear();
    await new Promise((res) => setTimeout(res, 200));
    redirectToLogin(router);
  } catch (e) {
    console.error('Logout failed', e);
    redirectToLogin(undefined);
  }
}

function openAccountSettings() {
  closeMenu();
  const tab = currentAccount.value.type === 'company' ? 'org-setup' : 'profile';
  router.push({ path: "/settings", query: { tab } });
}

// ── Nav links ──────────────────────────────────────────────────
const links = [
  { label: "Workspaces", to: "/dashboard", exact: true },
  { label: "My Tasks", to: "/dashboard/task" },
  { label: "Users", to: "/dashboard/users", personalOnly: true },
];

const visibleLinks = computed(() =>
  links.filter((l) => !l.personalOnly || currentAccount.value.type === "individual")
);

// ── Sliding underline indicator ────────────────────────────────
const linksContainerRef = ref<HTMLElement | null>(null);
const linkRefs = new Map<string, HTMLElement>();
const indicatorLeft = ref(0);
const indicatorWidth = ref(0);

function setLinkRef(path: string, el: HTMLElement | null) {
  if (!el) return linkRefs.delete(path);
  linkRefs.set(path, el);
}

function positionIndicatorForEl(el: HTMLElement | null) {
  const container = linksContainerRef.value;
  if (!container || !el) return;
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  indicatorLeft.value = elRect.left - containerRect.left;
  indicatorWidth.value = elRect.width;
}

function syncIndicatorToRoute() {
  const path = router.currentRoute.value.path;
  let target: HTMLElement | undefined;
  if (linkRefs.has(path)) {
    target = linkRefs.get(path)!;
  } else {
    for (const [key, el] of linkRefs.entries()) {
      if (path.startsWith(key) && key !== "/") { target = el; break; }
    }
    if (!target) target = linkRefs.get("/");
  }
  positionIndicatorForEl(target || null);
}

function previewIndicator(path: string) {
  positionIndicatorForEl(linkRefs.get(path) || null);
}

watch(() => router.currentRoute.value.path, async () => {
  await nextTick();
  syncIndicatorToRoute();
});

let rAF2: number | null = null;
function onResizeIndicator() {
  if (rAF2) cancelAnimationFrame(rAF2);
  rAF2 = requestAnimationFrame(() => { syncIndicatorToRoute(); rAF2 = null; });
}

onMounted(() => {
  if (route.query.stripePayment) {
    router.push({ path: '/settings', query: { ...route.query, tab: 'billing' } });
  }
  authStore.seedFromStorage();
  document.addEventListener('click', onClickOutside);
  window.addEventListener('resize', onResize);
  window.addEventListener('resize', onResizeIndicator);
  nextTick(syncIndicatorToRoute);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside);
  window.removeEventListener("resize", onResize);
  window.removeEventListener("resize", onResizeIndicator);
  if (rAF) cancelAnimationFrame(rAF);
  if (rAF2) cancelAnimationFrame(rAF2);
});

watch(menuOpen, (open) => { if (!open) pendingAccount.value = null; });
</script>

<style scoped>
#user-menu { will-change: transform, opacity; }
</style>
