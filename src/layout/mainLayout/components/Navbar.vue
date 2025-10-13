<template>
    <nav class="flex items-center sticky top-0 justify-between bg-bg-body border-border border-b z-10    w-full">
        <!-- Logo -->
        <div class="text-2xl font-bold text-text-primary flex items-center gap-2 px-8 py-4.5">
            <router-link to="/">
                <img v-if="theme == 'light'" src="../../../assets/global/light-logo.png" alt="Orchit AI Logo"
                    class="w-30" />
                <img v-if="theme == 'dark'" src="../../../assets/global/dark-logo.png" alt="Orchit AI Logo"
                    class="w-30" />
            </router-link>
        </div>
        <ul class="flex gap-9 items-center text-text-primary font-medium">
            <!-- Workspaces -->
            <router-link to="/" custom v-slot="{ navigate, isExactActive }">
                <li @click="navigate" class="cursor-pointer py-7 border-b"
                    :class="isExactActive ? 'border-text-primary' : 'border-transparent'">
                    Workspaces
                </li>
            </router-link>

            <!-- My Task -->
            <router-link to="/task" custom v-slot="{ navigate, isActive }">
                <li @click="navigate" class="cursor-pointer py-7 border-b"
                    :class="isActive ? 'border-text-primary' : 'border-transparent'">
                    My Task
                </li>
            </router-link>

            <!-- Users -->
            <router-link to="/users" custom v-slot="{ navigate, isActive }">
                <li @click="navigate" class="cursor-pointer py-7 border-b"
                    :class="isActive ? 'border-text-primary' : 'border-transparent'">
                    Users
                </li>
            </router-link>
        </ul>

        <div class="flex items-center gap-4 px-8 py-4.5">
            <!-- Search -->
            <!-- <div class="relative">
                <input type="text" placeholder="Search"
                    class="pl-8 pr-4 py-1 rounded-md bg-bg-input border-border text-sm border placeholder:text-text-secondary focus:outline-none" />
                <svg class="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" fill="none"
                    stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round"
                        d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div> -->

            <!-- Icons -->

            <i class="fa-regular fa-bell"></i>
            <i class="fa-regular fa-circle-question"></i>

            <!-- Avatar + Dropdown -->
            <div class="relative" ref="menuRef">
                <button
                    class="w-8 h-8 cursor-pointer rounded-full bg-orange-500 flex items-center justify-center text-text-primary font-bold overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-300"
                    aria-haspopup="menu" :aria-expanded="menuOpen ? 'true' : 'false'" @click="toggleMenu"
                    @keydown.enter.prevent="toggleMenu" @keydown.space.prevent="toggleMenu"
                    @keydown.esc.prevent="closeMenu">
                    {{ initials }}
                </button>

                <!-- Dropdown -->
                <transition enter-active-class="transition ease-out duration-100" enter-from-class="opacity-0 scale-95"
                    enter-to-class="opacity-100 scale-100" leave-active-class="transition ease-in duration-75"
                    leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
                    <div v-if="menuOpen"
                        class="absolute right-0 mt-2 w-80 rounded-xl bg-bg-dropdown shadow-xl ring-1 ring-black/5 py-1 z-50"
                        role="menu" aria-label="User menu">
                        <!-- Header block -->
                        <div class="flex items-center gap-3 p-4">
                            <div
                                class="w-11 h-11 rounded-full bg-orange-500 grid place-items-center text-text-primary font-bold">
                                {{ initials }}
                            </div>
                            <div class="min-w-0">
                                <p class="font-semibold leading-5 truncate">{{ profileData?.u_full_name || '—' }}</p>
                                <p class="text-sm text-text-secondary -500 truncate">{{ profileData?.u_email || '—' }}
                                </p>
                            </div>
                        </div>

                        <div class="h-px bg-bg-dropdown "></div>

                        <!-- Items -->
                        <div class="py-1">
                            <router-link to="/profile"
                                class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-bg-dropdown-menu-hover transition-all duration-200 rounded-md"
                                role="menuitem" @click="closeMenu">
                                <i class="fa-regular fa-user"></i>

                                <span>Profile</span>
                            </router-link>

                            <router-link to="/settings"
                                class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-bg-dropdown-menu-hover transition-all duration-200  rounded-md"
                                role="menuitem" @click="closeMenu">
                                <i class="fa-regular fa-gear"></i>
                                <span>Account settings</span>
                            </router-link>

                            <!-- Theme with submenu -->
                            <div class="relative" @mouseenter="openTheme()" @mouseleave="closeTheme()">
                                <button ref="themeTriggerRef"
                                    class="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-bg-dropdown-menu-hover transition-all duration-200 rounded-md"
                                    role="menuitem" aria-haspopup="menu" :aria-expanded="themeOpen ? 'true' : 'false'"
                                    @keydown.right.prevent="openTheme(true)" @keydown.left.prevent="closeTheme(true)">
                                    <span class="flex items-center gap-3">
                                        <i class="fa-regular fa-circle"></i>

                                        Theme
                                    </span>
                                    <i class="fa-solid fa-chevron-right"></i>

                                </button>


                                <!-- Submenu -->
                                <div v-if="themeOpen" ref="themeMenuRef"
                                    class="absolute top-0 w-48 rounded-xl bg-bg-dropdown dark:bg-dark-black shadow-lg ring-1 ring-black/5 py-1"
                                    role="menu" aria-label="Theme submenu" :class="themeFlipLeft
                                        ? 'right-full '   /* open to the LEFT */
                                        : 'left-full '">
                                    <button
                                        class="w-full text-left px-4 py-2 text-sm hover:bg-bg-dropdown-menu-hover transition-all duration-200 rounded-md"
                                        @click="setTheme('system')">
                                        System
                                    </button>
                                    <button
                                        class="w-full text-left px-4 py-2 text-sm hover:bg-bg-dropdown-menu-hover transition-all duration-200 rounded-md"
                                        @click="setTheme('light')">
                                        Light
                                    </button>
                                    <button
                                        class="w-full text-left px-4 py-2 text-sm hover:bg-bg-dropdown-menu-hover transition-all duration-200 rounded-md"
                                        @click="setTheme('dark')">
                                        Dark
                                    </button>
                                </div>

                            </div>

                            <button
                                class="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-bg-dropdown-menu-hover transition-all duration-200 rounded-md"
                                role="menuitem" @click="switchAccount">
                                <i class="fa-solid fa-repeat"></i>
                                <span>Switch account</span>
                            </button>

                            <button
                                class="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-bg-dropdown-menu-hover transition-all duration-200 rounded-md"
                                role="menuitem" @click="handleLogout">
                                <i class="fa-solid rotate-180 fa-arrow-right-from-bracket"></i>

                                <span>Log out</span>
                            </button>
                        </div>
                    </div>
                </transition>
            </div>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { getProfile } from '../../../services/user'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useTheme } from '../../../composables/useTheme'
const { theme, setTheme } = useTheme()
const router = useRouter()

const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
})

const profileData = computed(() => profile.value?.data || null)

const initials = computed(() =>
    profileData.value?.u_full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() ?? 'U'
)

/* Dropdown state + a11y */
const menuOpen = ref(false)
const themeOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)

function toggleMenu() {
    menuOpen.value = !menuOpen.value
    if (menuOpen.value) {
    } else {
        themeOpen.value = false
    }
}
function closeMenu() {
    menuOpen.value = false
    themeOpen.value = false
}
// function openMenuAndFocus() {
//     if (!menuOpen.value) {
//         menuOpen.value = true
//         // nextTick(() => { if (which === 'first') firstItemRef.value?.focus() })
//     }
// }

/* Theme submenu helpers */


/* click outside to close */
function onClickOutside(e: MouseEvent) {
    if (!menuRef.value) return
    if (!menuRef.value.contains(e.target as Node)) closeMenu()
}
onMounted(() => document.addEventListener('click', onClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))

/* Actions */
async function handleLogout() {
    try {
        closeMenu()
        localStorage.clear();
        // TODO: call your sign-out logic
        router.push('/login')
    } catch (e) {
        console.error('Logout failed', e)
    }
}
function switchAccount() {
    closeMenu()
    // TODO: route to your account switcher
    router.push('/switch-account')
}



// add near other refs
const themeTriggerRef = ref<HTMLElement | null>(null)
const themeMenuRef = ref<HTMLElement | null>(null)
const themeFlipLeft = ref(false)

function computeThemePlacement() {
    // how much space to the right of the trigger?
    const trigger = themeTriggerRef.value
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    // submenu width ≈ 192px (w-48) + 8px gap; keep a small safety margin
    const needed = 200
    const spaceRight = window.innerWidth - rect.right
    themeFlipLeft.value = spaceRight < needed
}


function openTheme(focus = false) {
    if (!themeOpen.value) {
        themeOpen.value = true
        nextTick(() => computeThemePlacement())
    }
    if (focus) { /* optionally focus first item */ }
}
function closeTheme(focusParent = false) {
    themeOpen.value = false
    if (focusParent) { /* optionally refocus trigger */ }
}

// keep placement fresh on resize while the menu is open
function onResize() {
    if (menuOpen.value && themeOpen.value) computeThemePlacement()
}
onMounted(() => {
    document.addEventListener('click', onClickOutside)
    window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
    document.removeEventListener('click', onClickOutside)
    window.removeEventListener('resize', onResize)
})

</script>