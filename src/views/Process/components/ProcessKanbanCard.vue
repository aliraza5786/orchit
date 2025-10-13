<template>
  <div @click="$emit('click')" class="bg-bg-card rounded-lg p-4 shadow-sm cursor-pointer
           hover:shadow-md transition-all duration-200 border border-border hover:border-accent">
    <div class="flex justify-between gap-2 items-start">
      <div class="flex items-start gap-3 flex-1">
        <div class="w-10 h-10 bg-accent/20 flex justify-center items-center rounded-lg">
          <i class="fa-solid fa-diagram-project text-accent"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="text-sm font-semibold text-text-primary leading-tight mb-1">
            {{ ticket?.title ?? `Process ${index + 1}` }}
          </h3>
          <p v-if="ticket?.description" class="text-xs text-text-secondary line-clamp-2">
            {{ ticket.description }}
          </p>
        </div>
      </div>
      <DropMenu @click.stop="" :items="getMenuItems()">
        <template #trigger>
          <i class="cursor-pointer fa-solid fa-ellipsis text-text-secondary hover:text-text-primary"></i>
        </template>
      </DropMenu>
    </div>

    <div class="mt-3 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="text-xs text-text-secondary flex items-center gap-1">
          <i class="fa-solid fa-circle-nodes text-xs"></i>
          {{ ticket?.status_count || 0 }} statuses
        </span>
        <span class="text-xs text-text-secondary flex items-center gap-1">
          <i class="fa-solid fa-arrow-right-arrow-left text-xs"></i>
          {{ ticket?.transition_count || 0 }} transitions
        </span>
      </div>
    </div>
  </div>

  <ConfirmDeleteModal @click.stop="" v-model="showDelete" title="Delete Process" itemLabel="process"
    :itemName="ticket.title" :requireMatchText="ticket.title" confirmText="Delete Process" cancelText="Cancel"
    size="md" :loading="deletingProcess" @confirm="handleDeleteProcess" @cancel="() => {
      showDelete = false
    }">
  </ConfirmDeleteModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import DropMenu from '../../../components/ui/DropMenu.vue'
import { useDeleteProcess } from '../../../queries/useProcess'
import ConfirmDeleteModal from '../../Product/modals/ConfirmDeleteModal.vue'

export interface ProcessTicket {
  _id: string | number
  title: string
  description?: string
  status_count?: number
  transition_count?: number
}

const props = defineProps<{
  ticket: any
  index: any
}>()

const emit = defineEmits(['click'])

const showDelete = ref(false)
const queryClient = useQueryClient()

function getMenuItems() {
  return [
    {
      label: 'Open Workflow Builder',
      action: () => {
        emit('click')
      },
      icon: {
        prefix: 'fa-regular',
        iconName: 'fa-diagram-project'
      }
    },
    {
      label: 'Delete Process', danger: true, action: () => {
        showDelete.value = true
      },
      icon: {
        prefix: 'fa-regular',
        iconName: 'fa-trash'
      }
    },
  ]
}

const { mutate: deleteProcess, isPending: deletingProcess } = useDeleteProcess({
  onSuccess: () => {
    showDelete.value = false;
    queryClient.invalidateQueries({ queryKey: ['process-columns'] })
  }
})

const handleDeleteProcess = () => {
  deleteProcess({ id: props.ticket._id })
}
</script>
