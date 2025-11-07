<template>
  <div class="relative" ref="wrapperRef" @click.stop @keydown.esc="close">
    <!-- Trigger -->
    <template v-if="assignedUser?.user?.avatar || assignedUser?._id || seat?._id">
      <img v-if="assignedUser?.user?.avatar || assignedUser?.u_profile_image" :src="assignedUser?.user?.avatar ??assignedUser?.u_profile_image" class="w-6 h-6 rounded-full" alt=""
        @click="toggle" />
      <div v-else @click="toggle"
        class="w-6 aspect-square rounded-full text-[10px]  bg-bg-surface font-semibold text-text-primary flex items-center justify-center"
        :style="{ backgroundColor:  assignedUser?.u_full_name ?? assignedUser?.title ? avatarColor({ name: assignedUser?.u_full_name ?? assignedUser?.title, _id: assignedUser?._id }) : '' }">
        {{ getInitials(assignedUser?.u_full_name ??assignedUser?.name ?? assignedUser?.title ?? seat?.title) }}
      </div>
    </template>

    <button v-else type="button"
      class="inline-flex items-center gap-2 rounded-full border border-border px-1 py-1 text-xs bg-bg-dropdown cursor-pointer hover:bg-bg-dropdown-menu-hover transition"
      @click="toggle" :disabled="disabled">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-70" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
      </svg>
    </button>

    <!-- Popover teleported to body to avoid clipping -->
    <teleport to="body">
      <div v-if="open" ref="menuRef" class="z-[9999] w-60 rounded-md border border-border bg-bg-dropdown shadow-xl"
        :style="{
          position: 'fixed',
          top: coords.top + 'px',
          left: coords.left + 'px'
        }" @click.stop>
        <div class="p-3">
          <input ref="searchRef" v-model="query" type="text" placeholder="Add people by name or email"
            class="w-full rounded-md border border-border h-[30px] bg-bg-input px-3 outline-none text-xs" />
        </div>

        <ul class="max-h-80 overflow-auto py-1">
          <li v-for="u in filteredUsers" :key="u._id" @click.stop="assign(u._id)"
            class="flex items-center justify-between px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer">
            <div class="flex items-center gap-3 min-w-0">
              <img v-if="u?.user?.avatar" :src="u?.user?.avatar" class="w-6 h-6 rounded-full" alt="" />
              <div v-else
                class="w-6 min-w-6 aspect-square border-border border rounded-full text-xs font-semibold text-text-primary flex items-center justify-center"
                :style="{ backgroundColor: u?.email ? avatarColor({ name: u.name ?? u.title, email: u.email, _id: u?._id }) : '' }">
                {{ getInitials(u.name || u.title) }}
              </div>

              <div class="min-w-0">
                <div class="text-xs font-medium truncate">{{ u.name || u.title }}</div>
                <div class="text-[10px] text-text-secondary truncate">{{ u?.role_title }}</div>
              </div>
            </div>
          </li>

          <li v-if="!filteredUsers.length" class="px-4 pb-2 text-sm text-text-secondary">No matches</li>
        </ul>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useWorkspacesRoles } from '../../../queries/useWorkspace'
import { useRouteIds } from '../../../composables/useQueryParams'
import { avatarColor } from '../../../utilities/avatarColor';
import { getInitials } from '../../../utilities';

/** Inputs / outputs **/
const props = defineProps<{
  assigneeId?: any
  disabled?: boolean
  seat: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'assign', user: any): void
  (e: 'unassign'): void
}>()

/** Data **/
const { workspaceId } = useRouteIds()
const { data: roles } = useWorkspacesRoles(workspaceId.value)

const assignedUser = ref<any>(props.assigneeId ?? props.seat)
const open = ref(false)
const query = ref('')
const searchRef = ref<HTMLInputElement | null>(null)

/** Teleport + positioning **/
const wrapperRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const coords = ref({ top: 0, left: 0 })

/** Sizing + padding defaults (used before menu is measured) **/
const GAP = 8
const ASSUMED_W = 240 // Tailwind w-60 ≈ 15rem
const ASSUMED_H = 320 // reasonable default for max list

/** Derived members list (includes "Unassign") **/
const membersData = computed(() => {
  return [
    { _id: null, name: 'Unassign', email: '' },
    ...(roles.value || [])
  ]
})

/** Filtering **/
const filteredUsers = computed(() => {
  const q = query.value.trim().toLowerCase()
  const arr = membersData.value
  if (!q) return arr
  return arr.filter((u: any) =>
    (u.title || u.name || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  )
})

/** Open/close **/
function toggle() { open.value = !open.value }
function close() { open.value = false }
function onDocClick() { if (open.value) close() }

/** Smart placement (escapes scroll containers and avoids clipping) **/
function positionMenu() {
  const trigger = wrapperRef.value
  if (!trigger) return

  const rect = trigger.getBoundingClientRect()
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight

  const mw = menuRef.value?.offsetWidth || ASSUMED_W
  const mh = menuRef.value?.offsetHeight || ASSUMED_H

  // Horizontal flip (prefer side with more space)
  const spaceRight = vw - rect.right
  const spaceLeft = rect.left
  const preferLeft = spaceRight < mw && spaceLeft > spaceRight

  // Align menu's right edge to trigger's right (end-aligned)
  let left = preferLeft
    ? rect.left - mw                 // open to the left
    : rect.right - mw                // open to the right but end-aligned

  // Clamp into viewport with a gap
  left = Math.min(Math.max(left, GAP), vw - mw - GAP)

  // Vertical placement (flip above if not enough space below)
  const spaceBelow = vh - rect.bottom
  const spaceAbove = rect.top
  const placeAbove = spaceBelow < mh + GAP && spaceAbove > spaceBelow

  let top = placeAbove
    ? rect.top - mh - GAP
    : rect.bottom + GAP

  top = Math.min(Math.max(top, GAP), vh - mh - GAP)

  coords.value = { top, left }
}

/** Keep position in sync with layout changes **/
function onWindowChange() {
  if (open.value) positionMenu()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('resize', onWindowChange, { passive: true })
  window.addEventListener('scroll', onWindowChange, { passive: true })
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange)
})

watch(open, async (v) => {
  if (v) {
    await nextTick()          // ensure menu is in DOM for measurement
    positionMenu()
    requestAnimationFrame(() => searchRef.value?.focus())
  } else {
    query.value = ''
  }
})

/** Actions **/
function assign(userId: string) {
  const user = membersData.value.find((u: any) => u._id === userId)
  if (user) {
    assignedUser.value = user
    emit('assign', user)
    emit('update:modelValue', userId)
  } else if (userId == null) {
    // Unassign path if you emit null
    assignedUser.value = null
    emit('unassign')
    emit('update:modelValue', null)
  }
  close()
}


</script>
