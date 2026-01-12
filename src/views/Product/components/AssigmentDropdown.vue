<template>
  <div class="relative" ref="wrapperRef" @click.stop @keydown.esc="close">
    <!-- Trigger -->
    <div v-if="displayUser?.user?.avatar || displayUser?._id || seat?._id" class="flex gap-2 items-center" :class="(disabled || !canAssignCard) ? 'cursor-not-allowed' : 'cursor-pointer'">
      <img v-if="displayUser?.avatar?.src || displayUser?.user?.avatar || displayUser?.u_profile_image"
        :src="displayUser?.avatar?.src ?? displayUser?.u_profile_image ?? displayUser?.user?.avatar"
        class="w-6 h-6 object-cover rounded-full" alt="" @click="toggle" />
      <abbr :title="displayUser?.u_full_name" v-else-if="displayUser?.u_full_name || displayUser?.name"
        @click="toggle"
        class="w-6 aspect-square rounded-full text-[10px]  bg-bg-surface font-semibold text-text-primary flex items-center justify-center"
        :style="{ backgroundColor: displayUser?.u_full_name ?? displayUser?.title ? avatarColor({ name: displayUser?.u_full_name ?? displayUser?.title, _id: displayUser?._id }) : '' }">
        {{ getInitials(displayUser?.u_full_name ?? displayUser?.name) }}
      </abbr>
      <abbr :title="displayUser?.title" v-else @click="toggle"
        class=" w-6 min-w-6  h-6 bg-bg-body border border-border rounded-full flex justify-center items-center shadow-sm">
        <i class="fa-regular fa-user text-xs"></i>
      </abbr>
      <span v-if="name" class="text-sm text-text-primary ">
          <span v-if="isRolesLoading && !displayUser?.name && !displayUser?.u_full_name">Loading...</span>
          <span v-else>{{(displayUser?.name || displayUser?.title || displayUser?.u_full_name) ??'unAssigned'}}</span>
      </span>
    </div>

    <button v-else type="button"
      class="inline-flex items-center gap-2 rounded-full border border-border px-1 py-1 text-xs bg-bg-dropdown cursor-pointer hover:bg-bg-dropdown-menu-hover transition"
      @click="toggle" :disabled="disabled || !canAssignCard" :class="canAssignCard?'cursor-pointer':'cursor-not-allowed'" >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-70" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
      </svg>
    </button>

    <!-- Popover teleported to body to avoid clipping -->
    <teleport to="body">
      <div v-if="open" ref="menuRef" class="z-[9999] w-60 rounded-md border border-border bg-bg-dropdown shadow-xl"
        :style="menuStyle" @click.stop>
        <div class="p-3">
          <input ref="searchRef" v-model="query" type="text" placeholder="Add people by name or email"
            class="w-full rounded-md border border-border h-[30px] bg-bg-input px-3 outline-none text-xs" />
        </div>

        <ul class="max-h-60 overflow-auto py-1">
          <li v-for="u in filteredUsers" :key="u._id ?? 'unassign'"  @click.stop="onRowClick(u)"
            class="flex items-center justify-between px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer group">
            <div class="flex items-center gap-3 min-w-0">
              <img v-if="u?.user?.avatar" :src="u?.user?.avatar" class="w-6 h-6 rounded-full object-cover" alt="" />
              <div v-else-if="u.name && u._id"
                class="w-6 min-w-6 aspect-square border-border border rounded-full text-xs font-semibold text-text-primary flex items-center justify-center"
                :style="{ backgroundColor: u?.email ? avatarColor({ name: u.name, email: u.email, _id: u?._id }) : '' }">
                {{ getInitials(u.name) }}
              </div>
              <div v-else
                class=" w-6 min-w-6  h-6 bg-bg-body border border-border rounded-full flex justify-center items-center ">
                <i class="fa-regular fa-user text-xs"></i>
              </div>
              <div class="min-w-0">
                <div class="text-xs font-medium truncate">{{ u.name || u.title }}</div>
                <div class="text-[10px] text-text-secondary truncate">{{ u?.role_title }}</div>
              </div>
            </div>
            
            <!-- Action Text -->
             <div class="text-xs font-medium text-text-secondary whitespace-nowrap ml-2">
                 <!-- Selected user -->
                <span v-if="u._id && displayUser?._id === u._id" class="text-[10px] px-2 py-1 border rounded-full border-red-500 transition group-hover:bg-red-500 group-hover:text-white">
                 Unassign
                </span>
                 <!-- Explicit unassign row -->
                <span v-else-if="u._id == null" class="text-red-500">
                <!-- Unassign -->
               </span>
                <!-- Other users -->
               <span v-else class="text-[10px]  px-2 py-1 border rounded-full border-accent group-hover:bg-accent transition group-hover:text-white">
                Assign to
               </span>
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
  workspaceId?: any
  name?:any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'assign', user: any): void
  (e: 'unassign'): void
}>()

/** Data **/
const { workspaceId } = useRouteIds()
const { data: roles, isPending: isRolesLoading } = useWorkspacesRoles(computed(() => props?.workspaceId ?? workspaceId.value))
 
const assignedUser = ref<any>(props.assigneeId ?? props.seat)
watch(() => [props.assigneeId, props.seat], () => {
  assignedUser.value = props.assigneeId ?? props.seat
}, { deep: true })

const displayUser = computed(() => {
  const current = assignedUser.value
  if (!current) return null
  
  const currentId = current._id || current.id || current

  // Robust search: Check membership ID, direct ID, and nested user ID
  // This handles cases where assignedUser is a User ID but roles are Members memberships
  const found = (roles.value || []).find((u: any) => {
    const uId = u._id || u.id
    const uUserId = u.user?._id || u.user?.id
    return (uId == currentId) || (uUserId == currentId)
  })
  
  return found || current
})

const open = ref(false)
const query = ref('')
const searchRef = ref<HTMLInputElement | null>(null)

/** Teleport + positioning **/
const wrapperRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const coords = ref<{ top?: number; bottom?: number; left: number }>({ top: 0, left: 0 })

const menuStyle = computed(() => {
  const style: any = { position: 'fixed', left: coords.value.left + 'px' }
  if (coords.value.top !== undefined) style.top = coords.value.top + 'px'
  if (coords.value.bottom !== undefined) style.bottom = coords.value.bottom + 'px'
  return style
})

/** Sizing + padding defaults (used before menu is measured) **/
const GAP = 8
const ASSUMED_W = 240 // Tailwind w-60 ≈ 15rem
const ASSUMED_H = 320 // reasonable default for max list

/** Derived members list (includes "Unassign") **/
const membersData = computed(() => {
  const current = displayUser.value // Use displayUser for consistent sorting logic
  const list = roles.value || []

  if (current && (current._id || current.id)) {
    const currentId = current._id || current.id

    // Find current user in list (already done by displayUser but need consistent object reference if possible)
    // We already have displayUser which IS the list object if found.
    const currentUserInList = current
    
    // Filter out: check against found user's IDs
    // The found user (displayUser) might be a membership.
    // We should filter items that are "the same person"
    const others = list.filter((u: any) => {
       const uId = u._id || u.id
       const uUserId = u.user?._id || u.user?.id
       const cUserId = current.user?._id || current.user?.id
       
       // Match if membership ID matches OR nested user ID matches
       return !(
         (uId == currentId) || 
         (uUserId && uUserId == (cUserId || currentId))
       )
    })
    
    return [
      currentUserInList,
      // { _id: null, name: 'Unassign', email: '' },
      ...others
    ]
  }

  // No user assigned
  return [
    { _id: null, name: 'Unassign', email: '' },
    ...list
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
import { usePermissions } from '../../../composables/usePermissions';
const { canAssignCard} = usePermissions();
/** Open/close **/
function toggle() {
  if (props.disabled || !canAssignCard.value) return;
  open.value = !open.value
}function close() { open.value = false }
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

  // Horizontal placement (default to start-aligned)
  let left = rect.left
  if (left + mw > vw - GAP) {
    // Clips right, try aligning right edges
    left = rect.right - mw
  }
  // Clamp into viewport
  left = Math.max(GAP, Math.min(left, vw - mw - GAP))

  // Vertical placement (flip above if not enough space below)
  const spaceBelow = vh - rect.bottom
  const spaceAbove = rect.top
  const placeAbove = spaceBelow < mh + GAP && spaceAbove > spaceBelow

  if (placeAbove) {
    coords.value = { bottom: vh - rect.top + GAP, left }
  } else {
    coords.value = { top: rect.bottom + GAP, left }
  }
}

/** Keep position in sync with layout changes **/
function onWindowChange() {
  if (open.value) positionMenu()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('resize', onWindowChange, { passive: true })
  document.addEventListener('scroll', onWindowChange, { capture: true, passive: true })
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('resize', onWindowChange)
  document.removeEventListener('scroll', onWindowChange, { capture: true })
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
 

function assign(userId: any) {
  const user = membersData.value.find((u: any) => u._id == userId)

  if (user) {
    assignedUser.value = user
    emit('assign', user)
    emit('update:modelValue', userId)
  }
  close()
}

function onRowClick(u: any) {
  // Explicit unassign row
  if (u._id == null) {
    onUnassign()
    return
  }

  // Clicking assigned user → unassign
  if (displayUser.value && u._id === displayUser.value._id) {
    onUnassign()
    return
  }

  // Assign new user
  assign(u._id)
}

function onUnassign() {
  assignedUser.value = null
  emit('unassign')
  // Emit assign with { _id: null } so parents listening only to @assign (like KanbanTicket)
  // receive a payload where user?._id evaluates to null, triggering backend unarchive/unassign.
  emit('assign', { _id: null })
  emit('update:modelValue', null)
  close()
}



</script>
```
