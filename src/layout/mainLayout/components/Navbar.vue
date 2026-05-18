<template>
  <Loader v-if="isPending" />
  <nav
    class="sticky top-0 z-110 w-full border-b border-border bg-bg-body"
    role="navigation"
    aria-label="Primary"
  >
    <div
      class="mx-auto flex max-w-[1400px] items-center justify-between px-10 max-md:p-4"
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
        class="relative hidden items-stretch py-2 gap-9 text-sm font-medium text-text-primary md:flex"
        ref="linksContainerRef"
      >
        <!-- Sliding underline indicator -->
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
              class="absolute right-0 mt-2 origin-top-right rounded-2xl bg-bg-dropdown z-[110] text-sm border border-border/60 shadow-xl shadow-black/10 w-[min(300px,calc(100vw-24px))] max-md:fixed max-md:left-1/2 max-md:-translate-x-1/2 max-md:right-auto max-md:top-[60px] max-md:w-[calc(100vw-32px)] flex flex-col max-h-[calc(100vh-80px)]"
              role="menu"
              @keydown.esc.stop.prevent="menuOpen = false"
            >
              <!-- Header: always user profile -->
              <div class="flex flex-col items-center pt-6 pb-4 px-5 shrink-0 text-center">
                <div class="relative mb-2.5">
                  <img
                    v-if="profileData?.u_profile_image"
                    class="object-cover w-[44px] h-[44px] rounded-full ring-2 ring-border/20"
                    :src="profileData?.u_profile_image"
                    alt="profile_img"
                  />
                  <div v-else
                    class="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-sm font-bold text-white shadow"
                  >{{ initials }}</div>
                  
                  <!-- Glowing active dot indicating session status -->
                  <span class="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-bg-dropdown" aria-hidden="true">
                    <span class="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></span>
                  </span>
                </div>
                <p class="truncate text-base font-bold text-text-primary leading-tight">{{ profileData?.u_full_name }}</p>
                <p class="truncate text-xs text-text-secondary mt-0.5">{{ profileData?.u_email }}</p>
                <div v-if="authStore.company_id && authStore.company_id !== 'personal' && isApprovedCompanyMember" class="mt-2.5">
                  <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/25 text-[10px] font-bold text-accent uppercase tracking-wider">
                    <i class="fa-solid fa-shield-halved text-[9px]"></i> Managed by {{ associatedCompany?.title }}
                  </span>
                </div>
              </div>

              <!-- Switcher Tabs Wrapper -->
              <div v-if="isApprovedCompanyMember" class="px-4 pb-2 shrink-0">
                <div class="relative flex rounded-xl bg-bg-surface border border-border/50 p-[3px]">
                  <!-- Sliding indicator -->
                  <div
                    class="absolute inset-[3px] rounded-lg bg-bg-dropdown shadow border border-border/60 transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)]"
                    :style="accountMode === 'personal'
                      ? 'left:3px; right:calc(50% + 1.5px); top:3px; bottom:3px'
                      : 'left:calc(50% + 1.5px); right:3px; top:3px; bottom:3px'"
                  ></div>
                  <button
                    type="button"
                    @click="handlePersonalTabClick()"
                    class="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-[7px] rounded-lg text-[11px] font-semibold transition-colors duration-150 cursor-pointer"
                    :class="accountMode === 'personal' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'"
                  >
                    <i class="fa-regular fa-user text-[10px]"></i> Personal
                    <i v-if="!authStore.company_id || authStore.company_id === 'personal'" class="fa-solid fa-check text-[10px] text-green-500 ml-1"></i>
                  </button>
                  <button
                    type="button"
                    @click="handleProfessionalTabClick()"
                    class="relative z-10 flex-1 flex items-center justify-center gap-1.5 py-[7px] rounded-lg text-[11px] font-semibold transition-colors duration-150 cursor-pointer"
                    :class="accountMode === 'professional' ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'"
                  >
                    <i class="fa-regular fa-building text-[10px]"></i> Professional
                    <i v-if="authStore.company_id && authStore.company_id !== 'personal'" class="fa-solid fa-check text-[10px] text-green-500 ml-1"></i>
                  </button>
                </div>
              </div>

              <!-- ── PROFESSIONAL: associated company card ── -->
              <div v-if="accountMode === 'professional' && isApprovedCompanyMember" class="px-3 py-3 shrink-0">
                <!-- No associated company fallback -->
                <div v-if="!isApprovedCompanyMember" class="text-center py-6 text-text-secondary">
                  <i class="fa-regular fa-building text-2xl mb-2 block opacity-40"></i>
                  <p class="text-xs">No organization associated<br>with your account</p>
                  <button
                    type="button"
                    @click="router.push('/settings?tab=org-create'); closeMenu()"
                    class="mt-3 text-xs font-semibold text-accent hover:opacity-80 transition-opacity"
                  >Create one →</button>
                </div>

                <!-- Associated company card -->
                <div
                  v-else
                  class="rounded-2xl border border-border/60 bg-bg-surface overflow-hidden"
                >
                  <!-- Card header -->
                  <div class="px-4 pt-4 pb-3 flex items-center gap-3">
                    <img v-if="associatedCompany?.logo" :src="associatedCompany?.logo" class="w-11 h-11 rounded-xl object-cover border border-border shrink-0" />
                    <div v-else class="w-11 h-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-base font-bold shrink-0">
                      {{ associatedCompany?.title?.charAt(0)?.toUpperCase() || '' }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-[13px] font-bold text-text-primary truncate flex items-center gap-1.5">
                        {{ associatedCompany?.title || '' }}
                        <i v-if="associatedCompany?._id === authStore.company_id" class="fa-solid fa-circle-check text-green-500 text-xs"></i>
                      </p>
                      <p class="text-[11px] text-text-secondary truncate">Managed by {{ associatedCompany?.title || '' }}</p>
                    </div>
                  </div>

                  <!-- Card actions -->
                  <div class="border-t border-border/50 divide-y divide-border/40">
                    <button
                      v-if="associatedCompany?._id === authStore.company_id"
                      type="button"
                      @click="router.push('/settings?tab=org-setup'); closeMenu()"
                      class="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-dropdown-menu-hover transition-colors text-left cursor-pointer"
                    >
                      <i class="fa-regular fa-gear text-[10px] text-text-secondary w-4 text-center"></i>
                      <span class="text-[12px] font-medium text-text-secondary">Manage Organization</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- ── PERSONAL: personal workspace card ── -->
              <div v-else class="px-3 py-3 shrink-0">
                <div class="rounded-2xl border border-border/60 bg-bg-surface overflow-hidden">
                  <!-- Card header -->
                  <div class="px-4 pt-4 pb-3 flex items-center gap-3">
                    <div class="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-base font-bold shrink-0">
                      {{ initials.charAt(0) }}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-[13px] font-bold text-text-primary truncate flex items-center gap-1.5">
                        Personal Workspace
                        <i v-if="!authStore.company_id || authStore.company_id === 'personal'" class="fa-solid fa-circle-check text-green-500 text-xs"></i>
                      </p>
                      <p class="text-[11px] text-text-secondary truncate">Managed by you</p>
                    </div>
                  </div>

                  <!-- Card actions -->
                  <div class="border-t border-border/50 divide-y divide-border/40">
                    <button
                      v-if="!authStore.company_id || authStore.company_id === 'personal'"
                      type="button"
                      @click="openAccountSettings(); closeMenu()"
                      class="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-bg-dropdown-menu-hover transition-colors text-left cursor-pointer"
                    >
                      <i class="fa-regular fa-gear text-[10px] text-text-secondary w-4 text-center"></i>
                      <span class="text-[12px] font-medium text-text-secondary">Manage Account</span>
                    </button>
                  </div>
                </div>
              </div>

              <div class="h-px bg-border/40 shrink-0 mx-4"></div>

              <!-- Bottom: theme + logout (always visible) -->
              <div class="shrink-0 px-2 py-2">
                <div class="relative" @mouseenter="openTheme()" @mouseleave="closeTheme()">
                  <button
                    ref="themeTriggerRef"
                    class="flex w-full items-center justify-between rounded-xl px-2.5 py-2 hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary transition-colors"
                    role="menuitem" aria-haspopup="menu"
                    :aria-expanded="themeOpen ? 'true' : 'false'"
                    @keydown.right.prevent="openTheme()" @keydown.left.prevent="closeTheme()"
                    type="button"
                  >
                    <span class="flex items-center gap-3">
                      <i class="fa-regular fa-circle-half-stroke w-4 text-center text-xs"></i>
                      <span class="text-[13px] font-medium">Appearance</span>
                    </span>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px]">{{ isDark ? 'Dark' : 'Light' }}</span>
                      <i class="fa-solid fa-chevron-right text-[9px]"></i>
                    </div>
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
                      v-if="themeOpen" ref="themeMenuRef"
                      class="absolute z-10 w-44 origin-top-left rounded-xl bg-bg-dropdown p-1.5 shadow-lg border border-border/60"
                      role="menu"
                      :class="[themeFlipLeft ? 'right-0 sm:right-full sm:mr-2' : 'left-full ml-2', 'bottom-0 sm:bottom-auto sm:top-0']"
                    >
                      <button class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary text-[13px]" @click="setTheme('system'); closeMenu()" type="button"><i class="fa-solid fa-desktop w-4 text-center text-xs"></i> System</button>
                      <button class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary text-[13px]" @click="setTheme('light'); closeMenu()" type="button"><i class="fa-regular fa-sun w-4 text-center text-xs"></i> Light</button>
                      <button class="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover text-text-secondary hover:text-text-primary text-[13px]" @click="setTheme('dark'); closeMenu()" type="button"><i class="fa-regular fa-moon w-4 text-center text-xs"></i> Dark</button>
                    </div>
                  </Transition>
                </div>
                <button
                  class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-red-500/[0.08] text-red-500 transition-colors"
                  role="menuitem" type="button" @click="handleLogout"
                >
                  <i class="fa-solid fa-arrow-right-from-bracket w-4 text-center text-xs"></i>
                  <span class="text-[13px] font-medium">Log out</span>
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
import { redirectToLogin } from '../../../utilities/authRedirect'
import { setAuthCookie } from '../../../utilities/auth'

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
const { setTheme, isDark} = useTheme();
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
// Replace the profile query:
const { data: profile, isPending } = useQuery({
  queryKey: ['profile'],
  queryFn: getProfile,
  placeholderData: (prev) => prev,
})

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
const personalAccount = computed<Account>(() => ({
  id: profileData.value?._id ?? 'personal',
  name: profileData.value?.u_full_name ?? 'My Account',
  email: profileData.value?.u_email ?? '',
  domain: import.meta.env.VITE_PRIMARY_DOMAIN || window.location.hostname,
  type: 'individual',
}))

const companyAccounts = computed<Account[]>(() =>
  (profileData.value?.companies_list ?? []).map((c: Company) => ({
    id: c._id,
    name: c.title,
    email: profileData.value?.u_email ?? "",
    domain: c.domain_link.replace("https://", ""),
    type: "company",
  })),
);


// The single company associated with the user's email domain
const associatedCompany = computed(() => {
  const company = profileData.value?.associated_company as ({
    _id: string;
    title: string;
    slug: string;
    logo?: string | null;
    domain_link: string;
    custom_domain?: string | null;
    membership_role?: string;
    user_role?: { title?: string };
  } | null)
  if (company && typeof company === 'object' && Object.keys(company).length > 0 && (company._id || company.title)) {
    return company
  }
  return null
})

function switchToCompany(company: { _id: string; domain_link: string }) {
  closeMenu()
  const token = localStorage.getItem('token')
  const themeVal = isDark.value ? 'dark' : 'light'

  // Set auth cookie on the shared root domain so the target subdomain reads it
  if (token) setAuthCookie(token)

  // Encode helper (URL-safe base64)
  const encode = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.')

  // Build destination URL with auth params so the target can bootstrap the session
  const params = new URLSearchParams()
  if (token)       params.set('_auth', encode(token))
  params.set('_cid',  encode(company._id))
  params.set('theme', themeVal)

  window.location.href = `${company.domain_link}/dashboard?${params.toString()}`
}

function switchToPersonal() {
  closeMenu()
  const token = localStorage.getItem('token')
  const themeVal = isDark.value ? 'dark' : 'light'

  // Set auth cookie on the shared root domain so the target subdomain reads it
  if (token) setAuthCookie(token)

  // Encode helper (URL-safe base64)
  const encode = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.')

  // Build destination URL with auth params so the target can bootstrap the session
  const params = new URLSearchParams()
  if (token)       params.set('_auth', encode(token))
  params.set('_cid',  encode('personal'))
  params.set('theme', themeVal)

  let base = import.meta.env.VITE_PRIMARY_DOMAIN || window.location.origin
  if (!base.startsWith('http')) {
    base = window.location.protocol + '//' + base
  }
  base = base.replace(/\/$/, '')

  window.location.href = `${base}/dashboard?${params.toString()}`
}

// Toggle between personal and professional view in the menu
const isApprovedCompanyMember = computed(() => {
  return !!(associatedCompany.value && profileData.value?.company_role_id)
})

const accountMode = ref<'personal' | 'professional'>('personal')

watch(
  [() => authStore.company_id, () => isApprovedCompanyMember.value],
  ([id, approved]) => {
    accountMode.value = id && id !== 'personal' && approved ? 'professional' : 'personal';
  },
  { immediate: true }
)

function handlePersonalTabClick() {
  if (authStore.company_id && authStore.company_id !== 'personal') {
    switchToPersonal()
  } else {
    accountMode.value = 'personal'
  }
}

function handleProfessionalTabClick() {
  if (!isApprovedCompanyMember.value) return

  if (!authStore.company_id || authStore.company_id === 'personal') {
    if (associatedCompany.value) {
      switchToCompany(associatedCompany.value)
    } else {
      accountMode.value = 'professional'
    }
  } else {
    accountMode.value = 'professional'
  }
}

const currentAccount = computed<Account>(() => {
  const activeId = authStore.company_id
  if (!activeId) return personalAccount.value
  const found = companyAccounts.value.find((c) => c.id === activeId)
  if (found) return found
  return {
    id: activeId,
    name: profileData.value?.u_full_name,
    email: profileData.value?.u_email ?? '',
    domain: window.location.hostname,
    type: 'company',
  }
})
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
    accountMode.value = (authStore.company_id && authStore.company_id !== 'personal' && isApprovedCompanyMember.value) ? 'professional' : 'personal';
  }
}

function closeMenu() {
  menuOpen.value = false;
  themeOpen.value = false;
  pendingAccount.value = null;
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

async function handleLogout() {
  try {
    closeMenu()
    workspaceStore.setWorkspace(null)
    authStore.logout()
    await queryClient.cancelQueries()
    queryClient.clear()
    await new Promise((res) => setTimeout(res, 200))
    redirectToLogin(router)  // ← no second argument, defaults to '/'
  } catch (e) {
    console.error('Logout failed', e)
    redirectToLogin(undefined)
  }
}
function openAccountSettings() {
  closeMenu();
  const tab = currentAccount.value.type === 'company' ? 'org-setup' : 'profile'
  router.push({
    path: "/settings",
    query: { tab },
  });
}

// ── Nav links ──────────────────────────────────────────────────
// Remove the static `links` array and replace with:
const links = [
  { label: "Workspaces", to: "/dashboard", exact: true },
  { label: "My Tasks", to: "/dashboard/task" },
  { label: "Users", to: "/dashboard/users", personalOnly: true }, // ← changed flag
];

const visibleLinks = computed(() =>
  links.filter(
    (l) => !l.personalOnly || currentAccount.value.type === "individual"
  )
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
onMounted(() => {
  if (route.query.stripePayment) {
    router.push({
      path: '/settings',
      query: { ...route.query, tab: 'billing' },
    })
  }

  authStore.seedFromStorage()

  document.addEventListener('click', onClickOutside)
  window.addEventListener('resize', onResize)
  window.addEventListener('resize', onResizeIndicator)
  nextTick(syncIndicatorToRoute)
})

onBeforeUnmount(() => {
  document.removeEventListener("click", onClickOutside);
  window.removeEventListener("resize", onResize);
  window.removeEventListener("resize", onResizeIndicator);
  if (rAF) cancelAnimationFrame(rAF);
  if (rAF2) cancelAnimationFrame(rAF2);
});

// Clear search when dropdown closes
watch(menuOpen, (open) => {
  if (!open) pendingAccount.value = null;
});
</script>

<style scoped>
/* Reduce layout shift on show/hide by reserving space subtly */
#user-menu {
  will-change: transform, opacity;
}
</style>
