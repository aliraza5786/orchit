<template>
  <Loader v-if="isPending" />
  <nav
    class="sticky top-0 z-110 w-full border-b border-border bg-bg-body"
    role="navigation"
    aria-label="Primary"
  >
    <div
      class="mx-auto flex h-14 w-full max-w-[1400px] items-center justify-between gap-2 px-[15px] md:grid md:grid-cols-[1fr_auto_1fr] md:justify-normal md:gap-0"
    >
      <!-- Logo -->
      <div class="flex min-w-0 flex-1 items-center gap-2 md:flex-none md:justify-self-start">
        <button
          @click="isSidebarOpen = !isSidebarOpen"
          class="grid shrink-0 place-items-center text-text-primary md:hidden cursor-pointer"
          aria-label="Toggle Menu"
        >
          <i class="fa-solid text-[20px]" :class="isSidebarOpen ? 'fa-xmark' : 'fa-bars'"></i>
        </button>
        <div class="flex cursor-pointer items-center" @click="handleLogoClick">
          <img
            v-if="!isDark"
            src="../../../assets/global/light-logo.png"
            alt="Orchit AI logo"
            class="w-auto max-w-[120px]"
            loading="eager"
            decoding="async"
          />
          <img
            v-else
            src="../../../assets/global/dark-logo.png"
            alt="Orchit AI logo"
            class="w-auto max-w-[120px]"
            loading="eager"
            decoding="async"
          />
        </div>
      </div>

      <!-- Primary nav (centered) -->
      <ul
        ref="linksContainerRef"
        class="relative hidden h-14 items-center justify-center gap-8 text-sm font-medium text-text-primary md:flex"
      >
        <div
          class="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-text-primary transition-all duration-300 ease-out"
          :style="{ left: indicatorLeft + 'px', width: indicatorWidth + 'px' }"
        />
        <RouterLink
          v-for="link in visibleLinks"
          :key="link.to"
          :to="link.to"
          custom
          v-slot="{ navigate, isActive, isExactActive }"
        >
          <li
            :ref="(el) => setLinkRef(link.to, el as HTMLElement)"
            class="relative flex h-14 cursor-pointer items-center whitespace-nowrap px-0.5 transition-colors"
            :class="isActive || (link.exact && isExactActive) ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'"
            @click="navigate"
            @mouseenter="() => previewIndicator(link.to)"
            @mouseleave="syncIndicatorToRoute()"
          >
            {{ link.label }}
          </li>
        </RouterLink>
      </ul>

      <!-- Right controls -->
      <div class="flex shrink-0 items-center justify-end gap-2 md:justify-self-end">
        <!-- Notification bell -->
        <div class="flex h-8 w-8 shrink-0 items-center justify-center [&_button]:!mt-0">
          <NotificationBell />
        </div>

        <!-- Avatar + dropdown -->
        <div class="relative shrink-0" ref="menuRef">
          <!-- Avatar trigger -->
          <button
            v-if="profileData?.u_profile_image"
            type="button"
            class="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full ring-2 ring-border/30 transition-all hover:ring-border hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            aria-haspopup="menu"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-controls="menuOpen ? 'user-menu' : undefined"
            @click="toggleMenu"
            @keydown.enter.prevent="toggleMenu"
            @keydown.space.prevent="toggleMenu"
            @keydown.esc.prevent="closeMenu"
          >
            <img
              class="h-[30px] w-[30px] rounded-full object-cover"
              :src="profileData?.u_profile_image"
              alt="Profile"
            />
          </button>

          <button
            v-else
            type="button"
            class="inline-flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-accent text-[11px] font-medium tracking-wide text-white ring-2 ring-border/20 ring-offset-1 ring-offset-bg-body transition-all hover:opacity-88 hover:shadow-[0_0_0_3px_rgba(125,104,200,0.2)] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            aria-haspopup="menu"
            :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-controls="menuOpen ? 'user-menu' : undefined"
            @click="toggleMenu"
            @keydown.enter.prevent="toggleMenu"
            @keydown.space.prevent="toggleMenu"
            @keydown.esc.prevent="closeMenu"
          >
            {{ initials }}
          </button>

          <!-- Dropdown menu -->
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
              class="absolute right-0 top-full mt-2 w-[288px] origin-top-right rounded-[14px] border border-border/60 bg-bg-dropdown shadow-xl shadow-black/10 z-[110]
                     max-md:fixed max-md:left-1/2 max-md:-translate-x-1/2 max-md:right-auto max-md:top-14 max-md:w-[calc(100vw-32px)]"
              @keydown.esc.stop.prevent="menuOpen = false"
            >
              <!-- ── Header ── -->
              <div class="flex flex-col items-center gap-1.5 border-b border-border/40 bg-bg-surface px-4 pb-4 pt-5 text-center">
                <div class="relative mb-1 inline-flex">
                  <img
                    v-if="profileData?.u_profile_image"
                    class="h-11 w-11 rounded-full object-cover ring-2 ring-border/20"
                    :src="profileData?.u_profile_image"
                    alt="Profile"
                  />
                  <div
                    v-else
                    class="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-[15px] font-medium text-white ring-2 ring-accent/20"
                  >
                    {{ initials }}
                  </div>
                  <span class="absolute bottom-0.5 right-0.5 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-bg-surface">
                    <span class="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-60"></span>
                  </span>
                </div>

                <p class="text-[14px] font-medium leading-tight text-text-primary">{{ profileData?.u_full_name }}</p>
                <p class="text-[12px] text-text-secondary">{{ profileData?.u_email }}</p>

                <!-- Managed badge — only for company emails -->
                <div
                  v-if="isCompanyEmail"
                  class="mt-1 inline-flex cursor-default items-center gap-1.5 rounded-full border border-accent/22 bg-accent/[0.08] px-2.5 py-1 text-[11px] font-medium text-accent"
                >
                  <i class="fa-solid fa-shield-check text-[10px]"></i>
                  Managed by {{ companyNameFromEmail }}
                </div>
              </div>

              <!-- ── Primary action (settings or org) ── -->
              <div class="border-b border-border/40 p-2">
                <button
  v-if="!isCompanyEmail || profileData?.active_company"
  type="button"
  class="group flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors hover:bg-bg-dropdown-menu-hover"
  @click="handlePrimaryAction"
>
  <div
    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-accent/20 bg-accent/[0.09] text-[13px] text-accent transition-colors group-hover:bg-accent/[0.15]"
  >
    <i :class="isCompanyEmail ? 'fa-regular fa-building' : 'fa-regular fa-gear'" class="text-[12px]"></i>
  </div>

  <div class="flex min-w-0 flex-1 flex-col">
    <span class="text-[13px] text-text-primary">
      {{ isCompanyEmail ? 'Manage organization' : 'Account settings' }}
    </span>

    <span class="text-[11px] text-text-secondary">
      {{ isCompanyEmail ? 'Team, roles & org settings' : 'Profile, Ai Tokens, Billings' }}
    </span>
  </div>

  <i class="fa-solid fa-chevron-right text-[10px] text-text-secondary opacity-0 transition-opacity group-hover:opacity-100"></i>
</button>
              </div>
                <!-- ── Appearance ── -->
<div class="border-b border-border/40 p-2">
  <div
    class="relative"
    @mouseenter="openTheme"
    @mouseleave="closeTheme"
  >
    <button
      ref="themeTriggerRef"
      type="button"
      class="flex w-full cursor-pointer items-center justify-between rounded-[10px] px-2.5 py-2 transition-colors hover:bg-bg-dropdown-menu-hover"
    >
      <span class="flex items-center gap-2.5">
        <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-border/50 bg-bg-surface text-text-secondary">
          <i class="fa-regular fa-circle-half-stroke text-[11px]"></i>
        </div>
        <span class="text-[13px] text-text-primary">Appearance</span>
      </span>
      <span class="flex items-center gap-1.5 text-[11px] text-text-secondary">
        {{ currentThemeLabel }}
        <i class="fa-solid fa-chevron-right text-[9px]"></i>
      </span>
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
        class="absolute top-0 z-[200] w-44 rounded-xl border border-border/60 bg-bg-dropdown p-1.5 shadow-lg"
        :class="themeFlipLeft ? 'right-full mr-2' : 'left-full ml-2'"
      >
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          type="button"
          class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-bg-dropdown-menu-hover"
          :class="activeTheme === opt.value
            ? 'text-text-primary font-medium'
            : 'text-text-secondary hover:text-text-primary'"
          @click="setTheme(opt.value); closeMenu()"
        >
          <i :class="opt.icon" class="w-4 shrink-0 text-center text-xs"></i>
          {{ opt.label }}
          <i v-if="activeTheme === opt.value" class="fa-solid fa-check ml-auto text-[10px] text-accent"></i>
        </button>
      </div>
    </Transition>
  </div>
</div>

              <!-- ── Logout ── -->
              <div class="p-2">
                <button
                  type="button"
                  class="group flex w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-red-500 transition-colors hover:bg-red-500/[0.07]"
                  @click="handleLogout"
                >
                  <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] border border-red-500/15 bg-red-500/[0.07] text-[13px] text-red-500 transition-colors group-hover:bg-red-500/[0.13]">
                    <i class="fa-solid fa-arrow-right-from-bracket text-[11px]"></i>
                  </div>
                  <span class="text-[13px]">Log out</span>
                </button>
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
      <div v-if="isSidebarOpen" class="fixed top-14 left-0 right-0 bottom-0 z-[100] bg-bg-body md:hidden overflow-y-auto">
        <nav class="px-5 py-8 ps-[max(1.25rem,env(safe-area-inset-left,0px))] pe-[max(1.25rem,env(safe-area-inset-right,0px))]">
          <ul class="flex flex-col space-y-6">
            <RouterLink v-for="link in links" :key="link.to" :to="link.to" custom v-slot="{ navigate, isActive, isExactActive }">
              <li
                @click="() => { navigate(); isSidebarOpen = false; }"
                class="flex cursor-pointer items-center gap-4 text-[18px] font-semibold leading-[30px] text-text-primary transition-colors hover:text-accent"
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

// ── Constants ──────────────────────────────────────────────────
const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com','yahoo.com','hotmail.com','outlook.com','icloud.com',
  'live.com','msn.com','aol.com','protonmail.com','proton.me',
  'mail.com','zoho.com','yandex.com','gmx.com','me.com',
]);

const themeOptions = [
  { value: 'system', label: 'System', icon: 'fa-solid fa-desktop'  },
  { value: 'light',  label: 'Light',  icon: 'fa-regular fa-sun'    },
  { value: 'dark',   label: 'Dark',   icon: 'fa-regular fa-moon'   },
] as const;

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
  return name.split(/\s+/).slice(0, 2).map((n: string) => n[0]).join("").toUpperCase();
});

// ── Email domain detection ─────────────────────────────────────
const emailDomain = computed(() => {
  const email = profileData.value?.u_email ?? '';
  return email.includes('@') ? email.split('@')[1].toLowerCase() : '';
});

const isCompanyEmail = computed(() => {
  const domain = emailDomain.value;
  return !!domain && !PERSONAL_EMAIL_DOMAINS.has(domain);
});

const companyNameFromEmail = computed(() => {
  const domain = emailDomain.value;
  if (!domain) return '';
  const base = domain.split('.')[0];
  return base.charAt(0).toUpperCase() + base.slice(1);
});

// ── Theme label & active state ─────────────────────────────────
const activeTheme = computed<string>(() => localStorage.getItem('theme') ?? 'system')

const currentThemeLabel = computed(() =>
  themeOptions.find(o => o.value === activeTheme.value)?.label ?? (isDark.value ? 'Dark' : 'Light')
)

// ── Primary action ─────────────────────────────────────────────
function handlePrimaryAction() {
  closeMenu();
  if (isCompanyEmail.value) {
    router.push('/settings?tab=org-setup');
  } else {
    router.push('/settings?tab=profile');
  }
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
  if (!menuRef.value?.contains(e.target as Node)) closeMenu();
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

// ── Nav links ──────────────────────────────────────────────────
const links = [
  { label: "Workspaces", to: "/dashboard", exact: true },
  { label: "My Tasks",   to: "/dashboard/task" },
  { label: "Users",      to: "/dashboard/users" },
];

const visibleLinks = computed(() => {
  const activeCompany = profile.value?.data?.active_company;

  const isOrgContext = isCompanyEmail && !!activeCompany;

  return links.filter(link =>
    !(isOrgContext && link.to === "/dashboard/users")
  );
});

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

</script>

<style scoped>
#user-menu { will-change: transform, opacity; }
</style>