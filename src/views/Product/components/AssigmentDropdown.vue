<template>
  <div class="relative" @click.stop @keydown.esc="close">
    <!-- Trigger -->
    <template v-if="assignedUser?.avatar_url || assignedUser?._id || seat?._id">
      <img @click="toggle" v-if="assignedUser?.avatar_url" :src="assignedUser?.avatar_url" class="w-6 h-6 rounded-full"
        alt="" />
      <div v-else @click="toggle"
        class="w-6 aspect-square rounded-full text-[10px] font-semibold text-text-primary flex items-center justify-center"
        :style="{ backgroundColor: colorFor(assignedUser ?? seat) }">
        {{ initials(assignedUser?.u_full_name ?? assignedUser?.title ?? seat?.title) }}
      </div>
    </template>
    <button v-else type="button" class="inline-flex items-center gap-2 rounded-full border border-border  px-1 py-1 text-xs
               bg-bg-dropdown cursor-pointer hover:bg-bg-dropdown-menu-hover  transition" @click="toggle"
      :disabled="disabled">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 opacity-70" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
      </svg>
      <!-- <span class="opacity-80">Assign</span> -->
    </button>

    <!-- Popover -->
    <div v-if="open" class="absolute right-0 z-50 mt-2 w-60 rounded-md border border-border bg-bg-dropdown shadow-xl"
      @click.stop>
      <div class="p-3">
        <input ref="searchRef" v-model="query" type="text" placeholder="Add people by name or email"
          class="w-full rounded-md border border-border h-[30px]  bg-bg-input  px-3  outline-none text-xs" />
      </div>

      <ul class="max-h-80 overflow-auto py-1">
        <li v-for="u in filteredUsers" :key="u._id" @click.stop="assign(u._id)"
          class="flex items-center justify-between px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer">
          <div class="flex items-center gap-3 min-w-0">
            <img v-if="u.avatar_url" :src="u.avatar_url" class="w-8 h-8 rounded-full" alt="" />
            <div v-else
              class="w-6 min-w-6 aspect-square rounded-full text-xs font-semibold text-text-primary flex items-center justify-center"
              :style="{ backgroundColor: colorFor(u) }">
              {{ initials(u.name || u.title) }}
            </div>

            <div class="min-w-0">
              <div class="text-xs font-medium truncate ">{{ u.name || u.title }}</div>
              <div class="text-[10px] text-text-secondary text-secondary-400 truncate">{{ u.email }}</div>
            </div>
          </div>

        </li>

        <li v-if="!filteredUsers.length" class="px-4 pb-2 text-sm text-text-secondary -500 text-secondary-400">No
          matches
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useWorkspacesRoles } from '../../../queries/useWorkspace';
import { useRouteIds } from '../../../composables/useQueryParams';
import { useProfile } from '../../../services/user';
const { workspaceId } = useRouteIds()
const { data: roles } = useWorkspacesRoles(workspaceId.value);
const assignedUser = ref<any>(null)

const membersData = computed(() => {
  return [{
    _id: null,
    name: 'Unassign',
    email: ''
  }, ...roles.value]
})
defineProps<{
  assigneeId?: any
  disabled?: boolean
  seat: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | null): void
  (e: 'assign', user: any): void
  (e: 'unassign'): void
}>()

const open = ref(false)
const query = ref('')
const searchRef = ref<HTMLInputElement | null>(null)


const filteredUsers = computed(() => {
  const q = query.value.trim().toLowerCase()
  const arrat = membersData.value;
  if (!q) return arrat
  return arrat.filter((u: any) =>
    (u.title || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  )
})

function toggle() { open.value = !open.value }
function close() { open.value = false }
function onDocClick() { if (open.value) close() }

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

watch(open, (v) => {
  if (v) requestAnimationFrame(() => searchRef.value?.focus())
  else query.value = ''
})

function assign(userId: string) {
  const user = membersData.value.find((u: any) => u._id === userId)
  console.log(user)

  // Store the assigned user locally
  if (user) {
    assignedUser.value = user // Update assigned user state
    emit('assign', user)
    emit('update:modelValue', userId)
  }

  close()
}

function unassign() {
  emit('update:modelValue', null)
  emit('assign', { _id: null })
  close()
}

/* UI helpers */
function initials(s?: string) {
  const t = (s || '').trim()
  if (!t) return '?'
  const parts = t.split(/\s+/)
  return (parts[0][0] + (parts[1]?.[0] || parts[0][1] || '')).toUpperCase()
}
function colorFor(u: any) {
  const seed = (u._id || u.email || u.name || '').split('')
    .reduce((a: any, c: any) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  const palette = ['#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#EC4899', '#22D3EE', '#84CC16', '#FB7185', '#F97316']
  return palette[seed % palette.length]
}
</script>