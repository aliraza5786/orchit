<template>

  <div class="relative inline-block text-left" ref="dropdownRef">
    <!-- Trigger -->
    <a href="#" :class="[
      'hover:text-text-primary text-nowrap  overflow-hidden relative hover:bg-bg-card  group rounded-lg transition-all duration-75 text-primary flex gap-2 items-center px-3 py-2',
      isOpen || selected ? 'bg-bg-card text-text-primary  ' : ''
    ]">
      <div :style="`background:${selectedColor.color}`" class="w-2 h-2 rounded-2xl "></div>
      {{
        currentName
      }}
      <div @click.stop="toggleDropdown"
        class="transition-all duration-400 flex items-center  bg-bg-card  w-8 p-1  -right-8 top-0 h-8  group-hover:right-0  absolute"
        :class="{ 'block ': isOpen || selected }">
        <i class="fa-solid fa-ellipsis"></i>
      </div>
    </a>

    <!-- Dropdown -->
    <Transition name="fade-scale" enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in" enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100" leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95">
      <div v-if="isOpen" class="fixed z-50 mt-2 w-[250px] bg-bg-dropdown   rounded-md shadow " @click.stop="">
        <!-- Name Input -->
        <div v-if="canEditLane" class="px-3 py-3.5 ">
          <input v-model="currentName"
            @change.stop="() => handleUpdateLane({ variables: { 'lane-title': currentName } })" placeholder="Enter name"
            class="w-full text-text-primary bg-bg-input px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 "
            maxlength="20" />
        </div>

        <!-- Color Trigger Row -->
        <div class="relative ">
          <!-- Trigger -->
          <div @mouseenter="showColors = true" @mouseleave="showColors = false"
            class="flex items-center justify-between px-4 py-2 hover:bg-bg-dropdown-menu-hover  cursor-pointer">
            <div class="flex items-center gap-2">
              <div :class="['w-5 h-5 rounded-full flex justify-center items-center']"
                :style="`background:${selectedColor.color}`">
                <div :class="['w-4 h-4 border-2 border-border rounded-full']"
                  :style="`background:${selectedColor.color}`"></div>
              </div>
              <span class="text-sm text-text-primary  font-medium">{{ selectedColor.label }}</span>
            </div>
            <svg v-if="canEditLane" class="w-4 h-4 text-text-secondary " fill="none" stroke="currentColor" stroke-width="2"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          

          <!-- Submenu (moved outside for correct hover detection) -->
          <Transition name="fade-scale" enter-active-class="transition duration-200 ease-out"
            leave-active-class="transition duration-150 ease-in" enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100" leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95">
            <div v-if="showColors && canEditLane"
              class="absolute top-0 left-full ml-0 min-w-[246px] bg-bg-dropdown p-3 shadow-lg rounded-lg z-50"
              @mouseenter="showColors = true" @mouseleave="showColors = false">

              <div v-for="color in colors" :key="color.label" @click="selectColor(color)"
                class="flex items-center px-3 py-2 text-sm hover:bg-bg-dropdown-menu-hover cursor-pointer gap-2 rounded-lg ">
                <span :class="['w-4 h-4 mr-2 rounded-full']" :style="`background:${color.color}`"></span>
                <span class="flex-1 text-text-primary ">{{ color.label }}</span>
                <span v-if="color.label === selectedColor.label"><img src="../../../assets/icons/tick.svg"
                    alt=""></span>
              </div>
            </div>
          </Transition>
        </div>


        <!-- Action List -->
        <div class=" border-t  border-border text-sm text-text-primary  font-medium">
          <div v-if="canEditLane" class=" flex items-center gap-2 px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer"
            @click="handleEdit">
            <i class="fa-regular fa-pen-to-square"></i>

            Edit
          </div>
          <div v-if="canCreateLane" class="flex items-center gap-2 px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer"
            @click="handleDuplicateLane">
            <i class="fa-regular fa-copy"></i>
            {{ isDuplicating ? 'Duplicating...' : 'Duplicate' }}
          </div>
          <div v-if="canEditLane"
            class="flex items-center gap-2 px-4 py-2 hover:bg-bg-dropdown-menu-hover cursor-pointer border-b border-border"
            @click="handleUpdateLane({ is_archive: true })">
            <i class="fa-regular fa-folder-closed"></i> Archive
          </div>
          <div v-if="canDeleteLane" @click="() => {
            showDelete = true
          }" class="flex items-center gap-2 px-4 py-2 hover:bg-bg-dropdown-menu-hover text-[#DC043B] cursor-pointer">
            <i class="fa-regular fa-trash-can"></i> Delete
          </div>
        </div>

        <!-- Footer (Progress, Date, Members) -->
        <div class=" px-3.5 py-3 text-sm text-text-secondary  bg-bg-card space-y-2.5">
          <div class="flex justify-between items-center text-sm font-medium text-text-primary ">
            <span>Mobile Application</span>
            <span>70%</span>
          </div>
          <div class="w-full h-1 bg-bg-body rounded">
            <div class="h-1 bg-accent rounded" style="width: 70%"></div>
          </div>
          <div class="flex items-center justify-between text-xs mt-2 text-text-secondary ">
            <div class="flex items-center gap-1">
              <img src="../../../assets/icons/clock.svg" alt="" /> Feb 16 2024
            </div>
            <div class="flex items-center gap-1">
              <img src="../../../assets/icons/user-group.svg" alt="" /> 8
            </div>
          </div>
        </div>
      </div>

    </Transition>

  </div>
  <ConfirmDeleteModal v-model="showDelete" title="Delete Lane" itemLabel="lane" :itemName="label"
    :requireMatchText="label" confirmText="Delete Lane" cancelText="Cancel" size="md" :loading="isDeleting"
    @confirm="handleDelete" @cancel="">
    <!-- Optional extra content -->
    <template #extra>
      <label class="flex items-center gap-2 text-sm text-muted">
        Also delete all archived lanes
      </label>
    </template>
  </ConfirmDeleteModal>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useDeleteWorkspaceLane, useDuplicateWorkspaceLane, useUpdateWorkspaceLane } from '../../../queries/useLane'
import { useQueryClient } from '@tanstack/vue-query'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import ConfirmDeleteModal from '../../../views/Product/modals/ConfirmDeleteModal.vue'
import { usePermissions } from '../../../composables/usePermissions'
const { canEditLane, canCreateLane, canDeleteLane } = usePermissions()
const showDelete = ref(false)
const queryClient = useQueryClient()
const colors = [
  { label: 'Ruby Red', color: '#E82368' },
  { label: 'Royal Blue', color: '#266FD4' },
  { label: 'Forest Green', color: '#228B22' },
  { label: 'Amethyst Purple', color: '#9966CC' },
  { label: 'Tangerine Orange', color: '#FFA500' },
  { label: 'Turquoise', color: '#40E0D0' },
  { label: 'Coral Pink', color: '#FF6F61' },
  { label: 'Sunflower Yellow', color: '#FFDA03' },
  { label: 'Lavender', color: '#B57EDC' },
  { label: 'Mint Green', color: '#98FB98' },
]
const props = defineProps<{
  id: string | number
  link: string,
  label: string
  color: string
  selected: boolean
  lanes: any
}>()
const { mutate: deleteLane, isPending: isDeleting } = useDeleteWorkspaceLane({
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    queryClient.invalidateQueries({ queryKey: ['sheet-list'] });
    showDelete.value = false
  }
});
const { mutate: updateLane } = useUpdateWorkspaceLane({
  onSuccess: () => {
    console.log('>>> i am updating lane color ');

    queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    queryClient.invalidateQueries({ queryKey: ['sheet-list'] });
    isOpen.value = false
  }
});
const { mutate: duplicateLane, isPending: isDuplicating } = useDuplicateWorkspaceLane({
  onSuccess: (data: any) => {

    emit('duplicate', data)
    // queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    isOpen.value = false
  }
});
const dropdownRef = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const showColors = ref(false)
const name = ref('')
const currentName = ref('')
const selectedColor = ref({ label: "", color: props.color })

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
onMounted(() => {
  currentName.value = props.label || ''
  name.value = props.label || ''

  const match = colors.find(c => c.color === props.color)
  selectedColor.value = match || { label: "Color", color: props.color }
})

const handleClickOutside = (event: any) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false
    showColors.value = false
  }
}
function selectColor(color: any) {
  if (!canEditLane.value) return
  handleUpdateLane({ variables: { 'lane-color': color.color }, lane_id: props.id })
  selectedColor.value = color
  showColors.value = false
}
const handleUpdateLane = (payload: any) => {
  if (!canEditLane.value) return
  updateLane({ payload: { ...payload, lane_id: props.id } })
}

const handleDuplicateLane = () => {
  if (!canCreateLane.value) return
  duplicateLane({ id: props.id });

}
const handleDelete = () => {
  if (!canEditLane.value) return
  isOpen.value = false;
  deleteLane({ id: props.id });
}
const emit = defineEmits(['update', 'duplicate'])

const handleEdit = () => {
  isOpen.value = false;
  emit('update', props.id)
}

function toggleDropdown(e: MouseEvent) {
  e.stopPropagation()
  window.dispatchEvent(new CustomEvent('close-all-dropdowns'))
  isOpen.value = !isOpen.value
}

window.addEventListener('close-all-dropdowns', () => {
  isOpen.value = false
})

</script>