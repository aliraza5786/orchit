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
import { useDeleteTransition } from '../../../queries/useProcess2'
import ConfirmDeleteModal from '../../Product/modals/ConfirmDeleteModal.vue'
import { useRouteIds } from '../../../composables/useQueryParams'

const props = defineProps<{
  ticket: any
  index: any
}>()

const emit = defineEmits(['click', 'open-builder'])

const showDelete = ref(false)
const queryClient = useQueryClient()
const { workspaceId } = useRouteIds();

function getMenuItems() {
  return [
    {
      label: 'Open Workflow Builder',
      action: () => {
        emit('open-builder')
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

const { mutate: deleteProcess, isPending: deletingProcess } = useDeleteTransition({
  onSuccess: () => {
    showDelete.value = false;
    queryClient.invalidateQueries({ queryKey: ['process-groups-with-transitions'] })
  }
})

const handleDeleteProcess = () => {
  deleteProcess({ workspace_id: workspaceId.value, transition_id: props.ticket._id })
}
</script>
