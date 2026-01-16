<template>
  <Loader v-if="isPending" />
  <nav
    class="sticky top-0 z-10 w-full border-b border-border bg-bg-body/80 backdrop-blur supports-[backdrop-filter]:bg-bg-body/60"
    role="navigation" aria-label="Primary">
    <div class="mx-auto flex max-w-[1400px] items-center justify-between px-6 max-md:p-4 ">
      <div class="flex items-center gap-2">
        <!-- Mobile Toggle -->
        <button 
          @click="isSidebarOpen = !isSidebarOpen"
          class="md:hidden grid h-9 w-9 place-items-center rounded-lg text-text-primary hover:bg-bg-dropdown-menu-hover transition-colors"
          aria-label="Toggle Menu"
        >
          <i class="fa-solid" :class="isSidebarOpen ? 'fa-xmark' : 'fa-bars'"></i>
        </button>

        <!-- Brand -->
        <RouterLink to="/" class="flex items-center gap-2">
          <img v-if="!isDark" src="../../../assets/global/light-logo.png" alt="Orchit AI logo" class="w-24 sm:w-30"
            loading="eager" decoding="async" />
          <img v-else src="../../../assets/global/dark-logo.png" alt="Orchit AI logo" class="w-24 sm:w-30" loading="eager"
            decoding="async" />
        </RouterLink> 
      </div>

      <!-- Primary nav -->
      <ul class="relative hidden items-stretch py-4 gap-9 text-sm font-medium text-text-primary md:flex"
        ref="linksContainerRef">
        <!-- Sliding underline indicator -->
        <div
          class="pointer-events-none absolute bottom-0 h-[2px] rounded-full bg-text-primary transition-all duration-300 ease-out"
          :style="{ left: indicatorLeft + 'px', width: indicatorWidth + 'px' }" />

        <RouterLink v-for="link in links" :key="link.to" :to="link.to" custom
          v-slot="{ navigate, isActive, isExactActive }">
          <li :ref="el => setLinkRef(link.to, el as HTMLElement)" @click="navigate"
            class="relative cursor-pointer py-3 transition-colors"
            :class="[(isActive || (link.exact && isExactActive)) ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary']"
            @mouseenter="() => previewIndicator(link.to)" @mouseleave="syncIndicatorToRoute()">
            {{ link.label }}
          </li>
        </RouterLink>
      </ul>

      <!-- Right controls -->
      <div class="flex items-center gap-4">
        <!-- Icons -->
        <!-- <button
          class="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-text-secondary transition-[transform,background,box-shadow]
                   hover:scale-105 hover:bg-bg-dropdown-menu-hover hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          aria-label="Notifications" type="button">
          <i class="fa-regular fa-bell"></i>
        </button>
        <button
          class="grid h-9 w-9 place-items-center rounded-xl border border-transparent text-text-secondary transition-[transform,background,box-shadow]
                   hover:scale-105 hover:bg-bg-dropdown-menu-hover hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
          aria-label="Help" type="button">
          <i class="fa-regular fa-circle-question"></i>
        </button> -->

          <!-- notificaion icon -->
           <NotificationBell/>

        <!-- Avatar + Menu -->
        <div class="relative" ref="menuRef">
          <button v-if="profileData?.u_profile_image" aria-haspopup="menu" :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-controls="menuOpen ? 'user-menu' : undefined" @click="toggleMenu" @keydown.enter.prevent="toggleMenu"
            @keydown.space.prevent="toggleMenu" @keydown.esc.prevent="closeMenu">

            <img class=" object-cover cursor-pointer w-10 h-10 rounded-full" :src="profileData?.u_profile_image"
              alt="profile_img">
          </button>

          <button v-else class="h-7 sm:h-9 w-7 sm:w-9 overflow-hidden cursor-pointer rounded-full bg-orange-500 text-sm font-bold text-text-primary ring-offset-2 transition
                     hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            aria-haspopup="menu" :aria-expanded="menuOpen ? 'true' : 'false'"
            :aria-controls="menuOpen ? 'user-menu' : undefined" @click="toggleMenu" @keydown.enter.prevent="toggleMenu"
            @keydown.space.prevent="toggleMenu" @keydown.esc.prevent="closeMenu" type="button">
            {{ initials }}
          </button>

        

          <!-- Dropdown -->
          <Transition enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 -translate-y-1 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-120 ease-in" leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 -translate-y-1 scale-95">
            <div v-if="menuOpen" id="user-menu"
              class="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl bg-bg-dropdown p-1.5 text-sm shadow-xl ring-1 ring-black/5"
              role="menu" @keydown.esc.stop.prevent="closeMenu">
              <!-- Header -->
              <div class="flex items-center gap-3 rounded-xl p-3">
                <img v-if="profileData?.u_profile_image" class=" w-10 h-10 object-cover rounded-full"
                  :src="profileData?.u_profile_image" alt="profile_img">
                <div v-else
                  class="grid h-11 w-11 place-items-center rounded-full bg-orange-500 text-base font-bold text-text-primary">
                  {{ initials }}
                </div>
                <div class="min-w-0">
                  <p class="truncate font-semibold leading-5">{{ profileData?.u_full_name || '—' }}</p>
                  <p class="truncate text-xs text-text-secondary">{{ profileData?.u_email || '—' }}</p>
                </div>
              </div>
              <div class="h-px w-full bg-bg-dropdown-menu-hover/50"></div>

              <!-- Items -->
              <ul class="p-1">

                <li>
                  <button
                    class=" cursor-pointer flex w-full items-center gap-3 rounded-lg px-3 py-2 hover:bg-bg-dropdown-menu-hover"
                    role="menuitem" type="button"  @click="openAccountSettings">
                    <i class="fa-regular fa-gear"></i>
                    <span>Account settings</span>
                  </button>
                </li>

                <!-- Theme submenu -->
                <li class="relative cursor-pointer" @mouseenter="openTheme()" @mouseleave="closeTheme()">
                  <button ref="themeTriggerRef"
                    class="flex w-full items-center justify-between rounded-lg px-3 py-2 hover:bg-bg-dropdown-menu-hover"
                    role="menuitem" aria-haspopup="menu" :aria-expanded="themeOpen ? 'true' : 'false'"
                    @keydown.right.prevent="openTheme()" @keydown.left.prevent="closeTheme()" type="button">
                    <span class="flex items-center gap-3">
                      <i class="fa-regular fa-circle"></i>
                      Theme
                    </span>
                    <i class="fa-solid fa-chevron-right"></i>
                  </button>

                  <Transition enter-active-class="transition duration-150 ease-out cursor-pointer"
                    enter-from-class="opacity-0 translate-x-1 scale-95"
                    enter-to-class="opacity-100 translate-x-0 scale-100"
                    leave-active-class="transition duration-120 ease-in"
                    leave-from-class="opacity-100 translate-x-0 scale-100"
                    leave-to-class="opacity-0 translate-x-1 scale-95">
                    <div v-if="themeOpen" ref="themeMenuRef"
                      class="absolute top-[37px] sm:top-0 z-10 w-48 origin-top-left rounded-xl bg-bg-dropdown p-1 shadow-lg ring-1 ring-black/5"
                      role="menu" :class="themeFlipLeft ? 'right-[-17px] sm:right-full mr-2' : 'left-full ml-2'">
                      <button class="block w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover"
                        @click="setTheme('system'); closeMenu()" type="button">
                        <i class="fa-solid fa-desktop"></i> System
                      </button>
                      <button class="block w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover"
                        @click="setTheme('light'); closeMenu()" type="button">
                        <i class="fa-regular fa-sun-cloud"></i> Light
                      </button>
                      <button class="block w-full cursor-pointer rounded-lg px-3 py-2 text-left hover:bg-bg-dropdown-menu-hover"
                        @click="setTheme('dark'); closeMenu()" type="button">
                        <i class="fa-regular fa-clouds-moon"></i> Dark
                      </button>
                    </div>
                  </Transition>
                </li>


                <li>
                  <button class="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-bg-dropdown-menu-hover"
                    role="menuitem" type="button" @click="handleLogout">
                    <i class="fa-solid fa-arrow-right-from-bracket rotate-180"></i>
                    <span>Log out</span>
                  </button>
                </li>
              </ul>
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
      <div v-if="isSidebarOpen" class="fixed top-[70px] left-0 right-0 bottom-0 z-[100] bg-bg-body md:hidden overflow-y-auto">
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
                @click="() => { navigate(); isSidebarOpen = false }"
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
import { computed, onMounted, onBeforeUnmount, ref, nextTick, watch } from 'vue'
import { useRouter, RouterLink, useRoute } from 'vue-router'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { getProfile } from '../../../services/user'
import { useTheme } from '../../../composables/useTheme'
import Loader from '../../../components/ui/Loader.vue'
import { useWorkspaceStore } from '../../../stores/workspace'
import NotificationBell from './NotificationBell.vue'
import LimitExceededModal from '../modals/LimitExceededModal.vue'
import { useAuthStore } from '../../../stores/auth'
import { useCurrentPackage } from '../../../queries/usePackages'
const workspaceStore = useWorkspaceStore();
/* Theme */
const { setTheme, isDark } = useTheme()
const authStore = useAuthStore()
/* Account Settings Modal */
function handleUgrade() {
  router.push(`/settings?tab=billing&stripePayment=${true}`)
  workspaceStore.setLimitExccedModal(false)
}
/* Router */
const router = useRouter()

/* Data */
const { data: profile, isPending } = useQuery({
  queryKey: ['profile'],
  queryFn: getProfile,
  staleTime: 1000 * 60 * 5, // cache for 5 minutes
})

const profileData = computed(() => profile.value?.data ?? null)

/* Limits Sync */
const { data: currentPackage } = useCurrentPackage()
watch(() => currentPackage.value, (pkg) => {
  if (pkg) {
    workspaceStore.setLimit(pkg)
  }
}, { immediate: true })

const initials = computed(() => {
  const name = profileData.value?.u_full_name?.trim() || ''
  if (!name) return 'U'
  const parts = name.split(/\s+/).slice(0, 3)
  return parts.map((n: string) => n[0]).join('').toUpperCase()
})

/* Menu state */
const menuOpen = ref(false)
const themeOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
const themeTriggerRef = ref<HTMLElement | null>(null)
const themeFlipLeft = ref(false)
const isSidebarOpen = ref(false)

function toggleMenu() {
  menuOpen.value = !menuOpen.value
  if (!menuOpen.value) themeOpen.value = false
}
function closeMenu() {
  menuOpen.value = false
  themeOpen.value = false
}

/* Submenu placement */
function computeThemePlacement() {
  const trigger = themeTriggerRef.value
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const needed = 200 // ~w-48 + margin
  const spaceRight = window.innerWidth - rect.right
  themeFlipLeft.value = spaceRight < needed
}

function openTheme() {
  if (!themeOpen.value) {
    themeOpen.value = true
    nextTick(() => computeThemePlacement())
  }
}
function closeTheme() {
  themeOpen.value = false
}

/* Click outside + resize (rAF throttled) */
let rAF: number | null = null
function onResize() {
  if (!menuOpen.value || !themeOpen.value) return
  if (rAF) cancelAnimationFrame(rAF)
  rAF = requestAnimationFrame(() => {
    computeThemePlacement()
    rAF = null
  })
}
function onClickOutside(e: MouseEvent) {
  const root = menuRef.value
  if (!root) return
  if (!root.contains(e.target as Node)) closeMenu()
}
const route = useRoute()
onMounted(() => {
  if (route.query.stripePayment) {
    router.push({ path: "/settings", query: { ...route.query, tab: "billing" } })
  }
  document.addEventListener('click', onClickOutside)
  window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside)
  window.removeEventListener('resize', onResize)
  if (rAF) cancelAnimationFrame(rAF)
})
const queryClient = useQueryClient();
/* Actions */
async function handleLogout() {
  try {
    closeMenu()
    workspaceStore.setWorkspace(null)

    localStorage.clear()
    authStore.logout()
    await queryClient.cancelQueries({ queryKey: ['me'] })
    await queryClient.cancelQueries({ queryKey: ['profile'] })
    await queryClient.cancelQueries({ queryKey: ['workspaces'] })
    // 3) remove the profile query from cache (RAM)
    queryClient.removeQueries({ queryKey: ['profile'] })
    queryClient.removeQueries({ queryKey: ['workspaces'] })
    queryClient.removeQueries({ queryKey: ['me'] })
    router.push('/login')

  } catch (e) {
    console.error('Logout failed', e)
  }
}

function openAccountSettings() {
  closeMenu()
  router.push('/settings')
}

/* --- Sliding underline indicator logic --- */
const links = [
  { label: 'Workspaces', to: '/dashboard', exact: true },
  { label: 'My Tasks', to: '/dashboard/task' },
  { label: 'Users', to: '/dashboard/users' },
]

const linksContainerRef = ref<HTMLElement | null>(null)
const linkRefs = new Map<string, HTMLElement>()
const indicatorLeft = ref(0)
const indicatorWidth = ref(0)

function setLinkRef(path: string, el: HTMLElement | null) {
  if (!el) return linkRefs.delete(path)
  linkRefs.set(path, el)
}

function positionIndicatorForEl(el: HTMLElement | null) {
  const container = linksContainerRef.value
  if (!container || !el) return
  const containerRect = container.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  indicatorLeft.value = elRect.left - containerRect.left
  indicatorWidth.value = elRect.width
}

function syncIndicatorToRoute() {
  const path = router.currentRoute.value.path
  // choose the best match (exact first, else startsWith)
  let target: HTMLElement | undefined
  if (linkRefs.has(path)) target = linkRefs.get(path)!
  else {
    for (const [key, el] of linkRefs.entries()) {
      if (path.startsWith(key) && key !== '/') { target = el; break }
    }
    if (!target) target = linkRefs.get('/')
  }
  positionIndicatorForEl(target || null)
}

function previewIndicator(path: string) {
  const el = linkRefs.get(path) || null
  positionIndicatorForEl(el)
}

watch(() => router.currentRoute.value.path, async () => {
  await nextTick()
  syncIndicatorToRoute()
})

// Resize handling (rAF throttled)
let rAF2: number | null = null
function onResizeIndicator() {
  if (rAF2) cancelAnimationFrame(rAF2)
  rAF2 = requestAnimationFrame(() => {
    syncIndicatorToRoute()
    rAF2 = null
  })
}

onMounted(() => {
  window.addEventListener('resize', onResizeIndicator)
  nextTick(syncIndicatorToRoute)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResizeIndicator)
  if (rAF2) cancelAnimationFrame(rAF2)
})
</script>

<style scoped>
/* Reduce layout shift on show/hide by reserving space subtly */
#user-menu {
  will-change: transform, opacity;
}
</style>