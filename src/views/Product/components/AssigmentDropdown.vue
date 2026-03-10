<template>
  <div class="relative" ref="wrapperRef" @keydown.esc="close">
    <!-- Trigger -->
    <div v-if="displayUsers.length > 0" class="flex gap-2 items-center" :class="(disabled || !canAssignCard) ? 'cursor-not-allowed' : 'cursor-pointer'" @click="toggle">
      <div class="flex items-center -space-x-2">
        <template v-for="(u, index) in displayUsers.slice(0, 2)" :key="u._id || index">
          <img v-if="u?.avatar?.src || u?.u_profile_image || u?.user?.avatar"
            :src="u?.avatar?.src ?? u?.u_profile_image ?? u?.user?.avatar"
            class="w-6 h-6 object-cover rounded-full border-2 border-bg-card" :alt="u?.u_full_name || u?.name" />
          <abbr :title="u?.u_full_name || u?.name || u?.title" v-else
            class="w-6 h-6 rounded-full text-[10px] bg-bg-surface font-semibold text-text-primary flex items-center justify-center border-2 border-bg-card"
            :style="{ backgroundColor: (u?.u_full_name || u?.name || u?.title) ? avatarColor({ name: u?.u_full_name || u?.name || u?.title, _id: u?._id }) : '' }">
            {{ getInitials(u?.u_full_name || u?.name || u?.title) }}
          </abbr>
        </template>
        <div v-if="displayUsers.length > 2" 
          class="w-6 h-6 rounded-full bg-bg-surface flex items-center justify-center text-[10px] font-bold text-text-primary">
          +{{ displayUsers.length - 2 }}
        </div>
      </div>
      <span v-if="name" class="text-sm text-text-primary truncate max-w-[150px]">
          <span v-if="isRolesLoading && displayUsers.length === 0">Loading...</span>
          <span v-else>
            {{ (displayUsers[0]?.u_full_name || displayUsers[0]?.name || displayUsers[0]?.title) }}
            <span v-if="displayUsers.length > 1" class="text-text-secondary"> +{{ displayUsers.length - 1 }}</span>
          </span>
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
        :style="menuStyle">
        <div class="p-3">
          <input ref="searchRef" v-model="query" type="text" placeholder="Search people by name or email"
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
                <span v-if="u._id && displayUsers.some(du => (du._id === u._id) || (du.user?._id === u._id))" class="text-[10px] px-2 py-1 border rounded-full border-red-500 transition group-hover:bg-red-500 group-hover:text-white">
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
  (e: 'update:modelValue', value: string | string[] | null): void
  (e: 'assign', user: any): void
  (e: 'unassign'): void
}>()

/** Data **/
const { workspaceId } = useRouteIds()
const { data: roles, isPending: isRolesLoading } = useWorkspacesRoles(computed(() => props?.workspaceId ?? workspaceId.value))
 
const assignedUsers = ref<any[]>(
  Array.isArray(props.assigneeId) ? props.assigneeId : 
  (Array.isArray(props.seat) ? props.seat : (props.assigneeId || props.seat ? [props.assigneeId || props.seat] : []))
)

watch(() => [props.assigneeId, props.seat], () => {
  assignedUsers.value = Array.isArray(props.assigneeId) ? props.assigneeId : 
    (Array.isArray(props.seat) ? props.seat : (props.assigneeId || props.seat ? [props.assigneeId || props.seat] : []))
}, { deep: true })

const displayUsers = computed(() => {
  const current = (assignedUsers.value || []).filter(Boolean);
  
  // Deduplicate by ID to avoid showing the same user twice
  const uniqueItems = new Map();
  
  current.forEach(item => {
    const id = item?._id || item?.id || (typeof item === 'string' ? item : null);
    if (!id) return;
    
    // Always prefer the object if we have both, or the first one we see
    if (!uniqueItems.has(id) || (typeof item === 'object' && typeof uniqueItems.get(id) === 'string')) {
      uniqueItems.set(id, item);
    }
  });

  return Array.from(uniqueItems.values()).map(item => {
    const currentId = item?._id || item?.id || item
    if (!currentId) return item

    const found = (roles.value || []).find((u: any) => {
      const uId = u._id || u.id
      const uUserId = u.user?._id || u.user?.id
      return (uId == currentId) || (uUserId == currentId)
    })
    return found || item
  })
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

/** Derived members list **/
const membersData = computed(() => {
  const list = roles.value || []
  return list
})

/** Filtering **/
const filteredUsers = computed(() => {
  const q = query.value.trim().toLowerCase()
  const arr = membersData.value
  
  let filtered = arr;
  if (q) {
    filtered = arr.filter((u: any) =>
      (u.title || u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  }

  // Sort: Assigned users first
  const assigned = filtered.filter((u: any) => 
    displayUsers.value.some(du => (du._id === u._id) || (du.user?._id === u._id))
  )
  const unassigned = filtered.filter((u: any) => 
    !displayUsers.value.some(du => (du._id === u._id) || (du.user?._id === u._id))
  )

  return [...assigned, ...unassigned]
})
import { usePermissions } from '../../../composables/usePermissions';
const { canAssignCard} = usePermissions();
/** Open/close **/
function toggle() {
  if (props.disabled || !canAssignCard.value) return;
  open.value = !open.value
}function close() { open.value = false }

function onDocClick(event: MouseEvent) {
  if (!open.value) return
  const target = event.target as HTMLElement
  if (wrapperRef.value?.contains(target) || menuRef.value?.contains(target)) {
    return
  }
  close()
}

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
  document.addEventListener('click', onDocClick, { capture: true })
  window.addEventListener('resize', onWindowChange, { passive: true })
  document.addEventListener('scroll', onWindowChange, { capture: true, passive: true })
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick, { capture: true })
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
 

function assign(user: any) {
  if (!user) return

  const isSelected = displayUsers.value.some(du => (du._id === user._id) || (du.user?._id === user._id))
  
  if (isSelected) {
    unassign(user)
  } else {
    assignedUsers.value = [...assignedUsers.value, user]
    emit('assign', assignedUsers.value)
    emit('update:modelValue', assignedUsers.value.map(u => u._id || u.id))
  }
}

function onRowClick(u: any) {
  // Explicit unassign row
  if (u._id == null) {
    onUnassignAll()
    return
  }

  // Assign/Toggle user
  assign(u)
}

function unassign(user: any) {
  assignedUsers.value = assignedUsers.value.filter(du => !((du._id === user._id) || (du.user?._id === user._id)))
  emit('unassign') // Keep legacy emit if needed
  emit('assign', assignedUsers.value)
  emit('update:modelValue', assignedUsers.value.map(u => u._id || u.id))
}

function onUnassignAll() {
  assignedUsers.value = []
  emit('unassign')
  emit('assign', [])
  emit('update:modelValue', [])
  close()
}



</script>
```
