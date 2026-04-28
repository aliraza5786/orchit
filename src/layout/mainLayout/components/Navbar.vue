<template>
  <Loader v-if="isPending" />
  <nav
    class="sticky top-0 z-10 w-full border-b border-border bg-bg-body/80 backdrop-blur supports-[backdrop-filter]:bg-bg-body/60"
    role="navigation"
    aria-label="Primary"
  >
    <div
      class="mx-auto flex max-w-[1400px] items-center justify-between px-6 max-md:p-4"
    >
      <div class="flex items-center gap-2">
        <!-- Mobile Toggle -->
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="md:hidden grid h-9 w-9 place-items-center rounded-lg text-text-primary hover:bg-bg-dropdown-menu-hover transition-colors"
          aria-label="Toggle Menu"
        >
          <i
            class="fa-solid"
            :class="isSidebarOpen ? 'fa-xmark' : 'fa-bars'"
          ></i>
        </button>
<div class="flex items-center gap-2 cursor-pointer" @click="handleLogoClick">
  <img
    v-if="!isDark"
    src="../../../assets/global/light-logo.png"
    alt="Orchit AI logo"
    class="w-24 sm:w-30"
    loading="eager"
    decoding="async"
  />
  <img
    v-else
    src="../../../assets/global/dark-logo.png"
    alt="Orchit AI logo"
    class="w-24 sm:w-30"
    loading="eager"
    decoding="async"
  />
</div>
      </div>

      <!-- Primary nav -->
      <ul
        class="relative hidden items-stretch py-4 gap-9 text-sm font-medium text-text-primary md:flex"
        ref="linksContainerRef"
      >
        <!-- Sliding underline indicator -->
        <div
          class="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-text-primary transition-all duration-300 ease-out"
          :style="{ left: indicatorLeft + 'px', width: indicatorWidth + 'px' }"
        />

        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          custom
          v-slot="{ navigate, isActive, isExactActive }"
        >
          <li
            :ref="(el) => setLinkRef(link.to, el as HTMLElement)"
            @click="navigate"
            class="relative cursor-pointer py-3 transition-colors"
            :class="[
              isActive || (link.exact && isExactActive)
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary',
            ]"
            @mouseenter="() => previewIndicator(link.to)"
            @mouseleave="syncIndicatorToRoute()"
          >
            {{ link.label }}
          </li>
        </RouterLink>
      </ul>

      <!-- Right controls -->
      <div class="flex items-center gap-4">
        <!-- notification icon -->
        <NotificationBell />
        <!-- Avatar + Menu -->
        <div class="relative" ref="menuRef">
          <button
            v-if="profileData?.u_profile_image"
            aria-haspopup="menu"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-controls="menuOpen ? 'user-menu' : undefined"
            @click="toggleMenu"
            @keydown.enter.prevent="toggleMenu"
            @keydown.space.prevent="toggleMenu"
            @keydown.esc.prevent="closeMenu"
          >
            <img
              class="object-cover cursor-pointer w-10 h-10 rounded-full"
              :src="profileData?.u_profile_image"
              alt="profile_img"
            />
          </button>

          <button
            v-else
            class="h-7 sm:h-9 w-7 sm:w-9 overflow-hidden cursor-pointer rounded-full bg-orange-500 text-sm font-bold text-text-primary ring-offset-2 transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            aria-haspopup="menu"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-controls="menuOpen ? 'user-menu' : undefined"
            @click="toggleMenu"
            @keydown.enter.prevent="toggleMenu"
            @keydown.space.prevent="toggleMenu"
            @keydown.esc.prevent="closeMenu"
            type="button"
          >
            {{ initials }}
          </button>

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
              class="absolute right-0 mt-2 origin-top-right rounded-2xl bg-bg-dropdown p-1.5 text-sm shadow-xl ring-1 ring-black/5 w-[min(300px,calc(100vw-24px))] max-md:fixed max-md:left-1/2 max-md:-translate-x-1/2 max-md:right-auto max-md:top-[60px] max-md:w-[calc(100vw-32px)] flex flex-col max-h-[calc(100vh-80px)]"
              role="menu"
              @keydown.esc.stop.prevent="menuOpen = false"
            >
              <!-- Header — fixed -->
              <div
                class="flex items-center gap-2.5 rounded-xl p-2.5 shrink-0"
              >
                <div
                  class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-orange-500 text-sm font-bold text-white"
                >
                  {{ getInitials(currentAccount.name) }}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold leading-5">
                    {{ currentAccount.name }}
                  </p>
                  <p class="truncate text-[11px] text-text-secondary">
                    {{ currentAccount.email }}
                  </p>
                  <span
                    class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    :class="
                      currentAccount.type === 'company'
                        ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                    "
                  >
                    <i
                      :class="
                        currentAccount.type === 'company'
                          ? 'fa-solid fa-building'
                          : 'fa-solid fa-user'
                      "
                      class="text-[9px]"
                    ></i>
                    {{
                      currentAccount.type === "company" ? "Company" : "Personal"
                    }}
                  </span>
                </div>
              </div>

              <div
                class="h-px w-full bg-bg-dropdown-menu-hover/50 shrink-0"
              ></div>

              <!-- Scrollable middle section (account switcher only) -->
              <div class="flex-1 overflow-y-auto overscroll-contain min-h-0">
                <!-- ── ACCOUNT SWITCHER ── -->
                <div class="px-1 pt-2 pb-1">
                  <p
                    class="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-text-primary"
                  >
                    Switch Account
                  </p>

                  <Transition
                    enter-active-class="transition duration-150 ease-out"
                    enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-100 ease-in"
                    leave-from-class="opacity-100 scale-100"
                    leave-to-class="opacity-0 scale-95"
                    mode="out-in"
                  >
                    <!-- Confirm panel -->
                    <div
                      v-if="pendingAccount"
                      key="confirm"
                      class="rounded-xl ring-1 ring-black/5 bg-bg-dropdown overflow-hidden mb-1"
                    >
                      <div
                        class="flex items-center gap-2 bg-bg-dropdown-menu-hover/40 px-3 py-2.5"
                      >
                        <!-- From chip -->
                        <div
                          class="flex-1 min-w-0 rounded-lg border border-black/5 bg-bg-dropdown px-2 py-1.5 text-center overflow-hidden"
                        >
                          <p
                            class="text-[9px] uppercase tracking-wider text-text-secondary/60 font-semibold"
                          >
                            From
                          </p>
                          <p
                            class="mt-0.5 truncate text-xs font-semibold text-text-primary"
                          >
                            {{ currentAccount.name }}
                          </p>
                          <p class="truncate text-[10px] text-accent">
                            {{ currentAccount.domain }}
                          </p>
                        </div>

                        <!-- Arrow -->
                        <i
                          class="fa-solid fa-arrow-right text-text-secondary/40 text-xs shrink-0"
                        ></i>

                        <!-- To chip -->
                        <div
                          class="flex-1 min-w-0 rounded-lg border border-black/5 bg-bg-dropdown px-2 py-1.5 text-center overflow-hidden"
                        >
                          <p
                            class="text-[9px] uppercase tracking-wider text-text-secondary/60 font-semibold"
                          >
                            To
                          </p>
                          <p
                            class="mt-0.5 truncate text-xs font-semibold text-text-primary"
                          >
                            {{ pendingAccount.name }}
                          </p>
                          <p class="truncate text-[10px] text-accent">
                            {{ pendingAccount.domain }}
                          </p>
                        </div>
                      </div>

                      <div
                        class="flex gap-2 px-3 py-2 text-[11px] leading-relaxed"
                        :class="
                          pendingAccount.type === 'company'
                            ? 'bg-amber-50/80 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                            : 'bg-green-50/80 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                        "
                      >
                        <i
                          :class="
                            pendingAccount.type === 'company'
                              ? 'fa-solid fa-triangle-exclamation'
                              : 'fa-solid fa-circle-info'
                          "
                          class="mt-0.5 shrink-0 text-xs"
                        ></i>
                        <span v-if="pendingAccount.type === 'company'">
                          You'll be redirected to
                          <strong>{{ pendingAccount.domain }}</strong
                          >. Unsaved changes may be lost.
                        </span>
                        <span v-else>
                          Returning to your personal account at
                          <strong>{{ pendingAccount.domain }}</strong
                          >.
                        </span>
                      </div>

                      <div class="flex gap-2 px-3 py-2.5">
                        <button
                          type="button"
                          class="flex-1 cursor-pointer rounded-lg border border-black/10 bg-bg-dropdown px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-black/20 hover:text-text-primary transition"
                          @click="pendingAccount = null"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          class="flex-[1.5] cursor-pointer flex items-center justify-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
                          :disabled="isSwitching"
                          @click="confirmSwitch"
                        >
                          <i
                            v-if="isSwitching"
                            class="fa-solid fa-circle-notch animate-spin text-[11px]"
                          ></i>
                          <span>{{
                            isSwitching ? "Switching…" : "Confirm Switch"
                          }}</span>
                        </button>
                      </div>
                    </div>

                    <!-- Account list -->
                    <div v-else key="list" class="flex flex-col gap-1">
                      <!-- Search -->
                      <div v-if="companyAccounts.length > 4" class="px-1 pb-1">
                        <div
                          class="flex items-center gap-2 rounded-lg bg-bg-dropdown-menu-hover/50 px-2.5 py-1.5"
                        >
                          <i
                            class="fa-regular fa-magnifying-glass text-text-secondary/50 text-xs shrink-0"
                          ></i>
                          <input
                            v-model="accountSearch"
                            type="text"
                            placeholder="Search companies…"
                            class="flex-1 bg-transparent text-xs text-text-primary placeholder:text-text-secondary/40 outline-none"
                          />
                          <button
                            v-if="accountSearch"
                            type="button"
                            @click="accountSearch = ''"
                            class="text-text-secondary/40 hover:text-text-secondary transition"
                          >
                            <i class="fa-solid fa-xmark text-[10px]"></i>
                          </button>
                        </div>
                      </div>

                      <!-- Personal -->
                      <div class="px-1">
                        <p
                          class="px-2 pb-0.5 text-[9px] font-semibold uppercase tracking-widest text-text-secondary"
                        >
                          Personal
                        </p>
                        <button
                          type="button"
                          class="group flex w-full cursor-pointer items-center gap-2.5 mt-1 rounded-lg px-3 py-2 transition hover:bg-bg-dropdown-menu-hover"
                          :class="
                            currentAccount.id === personalAccount.id
                              ? 'bg-bg-dropdown-menu-hover/60'
                              : ''
                          "
                          @click="
                            currentAccount.id !== personalAccount.id &&
                            (pendingAccount = personalAccount)
                          "
                        >
                          <div
                            class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange-500 text-xs font-bold text-white"
                          >
                            {{ getInitials(personalAccount.name) }}
                          </div>
                          <div class="min-w-0 flex-1 text-left">
                            <p
                              class="truncate text-xs font-medium leading-tight"
                            >
                              {{ personalAccount.name }}
                            </p>
                            <p
                              class="truncate text-[11px] text-text-secondary leading-tight mt-0.5"
                            >
                              {{ personalAccount.domain }}
                            </p>
                          </div>
                          <span
                            v-if="currentAccount.id === personalAccount.id"
                            class="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-orange-500 text-[10px] text-white"
                          >
                            <i class="fa-solid fa-check"></i>
                          </span>
                          <span
                            v-else
                            class="hidden shrink-0 rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-600 group-hover:block dark:bg-orange-900/30 dark:text-orange-400"
                          >
                            Switch
                          </span>
                        </button>
                      </div>

                      <div
                        class="h-px w-full bg-bg-dropdown-menu-hover/40 my-0.5"
                      ></div>

                      <!-- Companies — capped height so footer stays visible -->
                      <div class="px-1">
                        <p
                          class="px-2 pb-0.5 text-[9px] font-semibold uppercase tracking-widest text-text-secondary"
                        >
                          Company
                          <span
                            class="ml-1 font-normal normal-case tracking-normal text-text-secondary/70"
                            >({{ filteredCompanyAccounts.length }})</span
                          >
                        </p>
                        <ul
                          class="max-h-[180px] overflow-y-auto overscroll-contain space-y-0.5 pr-0.5 scrollbar-thin scrollbar-thumb-bg-dropdown-menu-hover scrollbar-track-transparent"
                        >
                          <li
                            v-if="filteredCompanyAccounts.length === 0"
                            class="py-4 text-center text-xs text-text-secondary/50"
                          >
                            No companies match "<span class="font-medium">{{
                              accountSearch
                            }}</span
                            >"
                          </li>
                          <li
                            v-for="acc in filteredCompanyAccounts"
                            :key="acc.id"
                          >
                            <button
                              type="button"
                              class="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition hover:bg-bg-dropdown-menu-hover"
                              :class="
                                acc.id === currentAccount.id
                                  ? 'bg-bg-dropdown-menu-hover/60'
                                  : ''
                              "
                              @click="
                                acc.id !== currentAccount.id &&
                                (pendingAccount = acc)
                              "
                            >
                              <div
                                class="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-purple-100 text-xs font-bold text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"
                              >
                                {{ getInitials(acc.name) }}
                              </div>
                              <div class="min-w-0 flex-1 text-left">
                                <p
                                  class="truncate text-xs font-medium leading-tight"
                                >
                                  {{ acc.name }}
                                </p>
                                <p
                                  class="truncate text-[11px] text-text-secondary leading-tight mt-0.5"
                                >
                                  {{ acc.domain }}
                                </p>
                              </div>
                              <span
                                v-if="acc.id === currentAccount.id"
                                class="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-orange-500 text-[10px] text-white"
                              >
                                <i class="fa-solid fa-check"></i>
                              </span>
                              <span
                                v-else
                                class="hidden flex-shrink-0 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-600 group-hover:block dark:bg-purple-900/30 dark:text-purple-400"
                              >
                                Switch
                              </span>
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </Transition>
                </div>
              </div>

              <!-- Footer — always visible, never scrolls away -->
              <div class="flex-shrink-0">
                <div class="h-px w-full bg-bg-dropdown-menu-hover/50"></div>
                <ul class="p-1">
                  <li>
                    <button
                      class="cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-bg-dropdown-menu-hover"
                      role="menuitem"
                      type="button"
                      @click="openAccountSettings"
                    >
                      <i class="fa-regular fa-gear"></i>
                      <span>Account settings</span>
                    </button>
                  </li>

                  <!-- Theme submenu -->
                  <li
                    class="relative cursor-pointer"
                    @mouseenter="openTheme()"
                    @mouseleave="closeTheme()"
                  >
                    <button
                      ref="themeTriggerRef"
                      class="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-bg-dropdown-menu-hover"
                      role="menuitem"
                      aria-haspopup="menu"
                      :aria-expanded="themeOpen ? 'true' : 'false'"
                      @keydown.right.prevent="openTheme()"
                      @keydown.left.prevent="closeTheme()"
                      type="button"
                    >
                      <span class="flex items-center gap-3">
                        <i class="fa-regular fa-circle"></i>
                        Theme
                      </span>
                      <i class="fa-solid fa-chevron-right"></i>
                    </button>

                    <Transition
                      enter-active-class="transition duration-150 ease-out"
                      enter-from-class="opacity-0 translate-x-1 scale-95"
                      enter-to-class="opacity-100 translate-x-0 scale-100"
                      leave-active-class="transition duration-120 ease-in"
                      leave-from-class="opacity-100 translate-x-0 scale-100"
                      leave-to-class="opacity-0 translate-x-1 scale-95"
                    >
                      <div
                        v-if="themeOpen"
                        ref="themeMenuRef"
                        class="absolute z-10 w-48 origin-top-left rounded-xl bg-bg-dropdown p-1 shadow-lg ring-1 ring-black/5"
                        role="menu"
                        :class="[
                          themeFlipLeft
                            ? 'right-[-17px] sm:right-full sm:mr-2'
                            : 'left-full ml-2',
                          'bottom-0 sm:bottom-auto sm:top-0',
                        ]"
                      >
                        <button
                          class="block w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover"
                          @click="
                            setTheme('system');
                            closeMenu();
                          "
                          type="button"
                        >
                          <i class="fa-solid fa-desktop"></i> System
                        </button>
                        <button
                          class="block w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover"
                          @click="
                            setTheme('light');
                            closeMenu();
                          "
                          type="button"
                        >
                          <i class="fa-regular fa-sun-cloud"></i> Light
                        </button>
                        <button
                          class="block w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover"
                          @click="
                            setTheme('dark');
                            closeMenu();
                          "
                          type="button"
                        >
                          <i class="fa-regular fa-clouds-moon"></i> Dark
                        </button>
                      </div>
                    </Transition>
                  </li>

                  <li>
                    <button
                      class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-bg-dropdown-menu-hover"
                      role="menuitem"
                      type="button"
                      @click="handleLogout"
                    >
                      <i
                        class="fa-solid fa-arrow-right-from-bracket rotate-180"
                      ></i>
                      <span>Log out</span>
                    </button>
                  </li>
                </ul>
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
      enter-active-class="transition duration-400 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition duration-300 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <div
        v-if="isSidebarOpen"
        class="fixed top-[70px] left-0 right-0 bottom-0 z-[100] bg-bg-body md:hidden overflow-y-auto"
      >
        <nav class="py-8 px-4">
          <ul class="flex flex-col space-y-6">
            <RouterLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              custom
              v-slot="{ navigate, isActive, isExactActive }"
            >
              <li
                @click="
                  () => {
                    navigate();
                    isSidebarOpen = false;
                  }
                "
                class="flex items-center gap-4 text-text-primary font-manrope font-semibold leading-[30px] text-[18px] hover:text-primary transition-colors cursor-pointer"
                :class="{
                  'text-accent font-bold':
                    isActive || (link.exact && isExactActive),
                }"
              >
                <i
                  v-if="link.label === 'Workspaces'"
                  class="fa-solid fa-border-all w-6 text-xl"
                ></i>
                <i
                  v-else-if="link.label === 'My Tasks'"
                  class="fa-solid fa-list-check w-6 text-xl"
                ></i>
                <i
                  v-else-if="link.label === 'Users'"
                  class="fa-solid fa-users w-6 text-xl"
                ></i>
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
  computed,
  onMounted,
  onBeforeUnmount,
  ref,
  nextTick,
  watch,
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
}

// ── Stores & composables ───────────────────────────────────────
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const { setTheme, isDark } = useTheme();
const router = useRouter();
const route = useRoute();
const queryClient = useQueryClient();

// ── Upgrade handler ────────────────────────────────────────────
function handleUgrade() {
  router.push(`/settings?tab=billing&stripePayment=${true}`);
  workspaceStore.setLimitExccedModal(false);
}
function handleLogoClick() {
  const token = localStorage.getItem('token')
  if (!token) {
    router.push('/')
  }
}
// ── Profile query ──────────────────────────────────────────────
const { data: profile, isPending } = useQuery({
  queryKey: ["profile"],
  queryFn: getProfile,
  staleTime: 1000 * 60 * 5,
});

const profileData = computed(() => profile.value?.data ?? null);

// ── Package limits sync ────────────────────────────────────────
const { data: currentPackage } = useCurrentPackage();
watch(
  () => currentPackage.value,
  (pkg) => {
    if (pkg) workspaceStore.setLimit(pkg);
  },
  { immediate: true },
);

// ── Navbar initials (top-right avatar) ────────────────────────
const initials = computed(() => {
  const name = profileData.value?.u_full_name?.trim() || "";
  if (!name) return "U";
  const parts = name.split(/\s+/).slice(0, 3);
  return parts
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();
});

// ── Dynamic account switcher ───────────────────────────────────
const personalAccount = computed<Account>(() => ({
  id: profileData.value?._id ?? "personal",
  name: profileData.value?.u_full_name ?? "My Account",
  email: profileData.value?.u_email ?? "",
  domain: "orchit.ai",
  type: "individual",
}));

const companyAccounts = computed<Account[]>(() =>
  (profileData.value?.companies_list ?? []).map((c: Company) => ({
    id: c._id,
    name: c.title,
    email: profileData.value?.u_email ?? "",
    domain: c.domain_link.replace("https://", ""),
    type: "company",
  })),
);

const currentAccount = computed<Account>(() => {
  const activeId = authStore.company_id; // ✅ driven by localStorage via authStore
  if (!activeId) return personalAccount.value;
  return (
    companyAccounts.value.find((c) => c.id === activeId) ??
    personalAccount.value
  );
});
// ── Account switch state ───────────────────────────────────────
const pendingAccount = ref<Account | null>(null);
const isSwitching = ref(false);
async function confirmSwitch() {
  if (!pendingAccount.value) return
  isSwitching.value = true

  try {
    await new Promise((res) => setTimeout(res, 1200))

    if (pendingAccount.value.type === 'company') {
      authStore.setCompany(pendingAccount.value.id)
      await new Promise((res) => setTimeout(res, 100))
      window.location.href = `${window.location.protocol}//${pendingAccount.value.domain}/dashboard`
    } else {
      authStore.clearCompany()
      await new Promise((res) => setTimeout(res, 100))
      window.location.href = `${window.location.protocol}//orchit.ai/dashboard`
    }
  } catch (e) {
    isSwitching.value = false
  }
}
function getInitials(name: string) {
  return name
    .trim()
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Menu state ─────────────────────────────────────────────────
const menuOpen = ref(false);
const themeOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);
const themeTriggerRef = ref<HTMLElement | null>(null);
const themeFlipLeft = ref(false);
const isSidebarOpen = ref(false);

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
  if (!menuOpen.value) themeOpen.value = false;
}

function closeMenu() {
  menuOpen.value = false;
  themeOpen.value = false;
}

// ── Theme submenu placement ────────────────────────────────────
function computeThemePlacement() {
  const trigger = themeTriggerRef.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  themeFlipLeft.value = window.innerWidth - rect.right < 200;
}

function openTheme() {
  if (!themeOpen.value) {
    themeOpen.value = true;
    nextTick(() => computeThemePlacement());
  }
}

function closeTheme() {
  themeOpen.value = false;
}

// ── Click outside + resize (rAF throttled) ────────────────────
let rAF: number | null = null;

function onResize() {
  if (!menuOpen.value || !themeOpen.value) return;
  if (rAF) cancelAnimationFrame(rAF);
  rAF = requestAnimationFrame(() => {
    computeThemePlacement();
    rAF = null;
  });
}

function onClickOutside(e: MouseEvent) {
  const root = menuRef.value;
  if (!root) return;
  if (!root.contains(e.target as Node)) closeMenu();
}

// ── Auth actions ───────────────────────────────────────────────
async function handleLogout() {
  try {
    closeMenu();
    workspaceStore.setWorkspace(null);
    authStore.logout();
    // ✅ Always wipe company_id on logout so next login starts clean
    localStorage.removeItem("company_id");
    await queryClient.cancelQueries();
    queryClient.clear();
    router.push("/login");
  } catch (e) {
    console.error("Logout failed", e);
  }
}

function openAccountSettings() {
  closeMenu();
  router.push("/settings");
}

// ── Nav links ──────────────────────────────────────────────────
const links = [
  { label: "Workspaces", to: "/dashboard", exact: true },
  { label: "My Tasks", to: "/dashboard/task" },
  { label: "Users", to: "/dashboard/users" },
];

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
      if (path.startsWith(key) && key !== "/") {
        target = el;
        break;
      }
    }
    if (!target) target = linkRefs.get("/");
  }
  positionIndicatorForEl(target || null);
}

function previewIndicator(path: string) {
  positionIndicatorForEl(linkRefs.get(path) || null);
}

watch(
  () => router.currentRoute.value.path,
  async () => {
    await nextTick();
    syncIndicatorToRoute();
  },
);

// Resize handling for indicator (rAF throttled)
let rAF2: number | null = null;

function onResizeIndicator() {
  if (rAF2) cancelAnimationFrame(rAF2);
  rAF2 = requestAnimationFrame(() => {
    syncIndicatorToRoute();
    rAF2 = null;
  });
}

// ── Lifecycle ──────────────────────────────────────────────────
onMounted(() => {
  if (route.query.stripePayment) {
    router.push({
      path: "/settings",
      query: { ...route.query, tab: "billing" },
    });
  }

  // ✅ Seed authStore from localStorage on every page load.
  // We do NOT use the server's active_company_id because the server
  // always returns a company ID regardless of the user's chosen mode.
  const storedCompanyId = localStorage.getItem("company_id");
  authStore.company_id = storedCompanyId ?? null;

  document.addEventListener("click", onClickOutside);
  window.addEventListener("resize", onResize);
  window.addEventListener("resize", onResizeIndicator);
  nextTick(syncIndicatorToRoute);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside);
  window.removeEventListener("resize", onResize);
  window.removeEventListener("resize", onResizeIndicator);
  if (rAF) cancelAnimationFrame(rAF);
  if (rAF2) cancelAnimationFrame(rAF2);
});

// ── Account search ─────────────────────────────────────────────
const accountSearch = ref("");

const filteredCompanyAccounts = computed(() => {
  const q = accountSearch.value.trim().toLowerCase();
  if (!q) return companyAccounts.value;
  return companyAccounts.value.filter(
    (c) =>
      c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q),
  );
});

// Clear search when dropdown closes
watch(menuOpen, (open) => {
  if (!open) accountSearch.value = "";
});
</script>

<style scoped>
/* Reduce layout shift on show/hide by reserving space subtly */
#user-menu {
  will-change: transform, opacity;
}
</style>