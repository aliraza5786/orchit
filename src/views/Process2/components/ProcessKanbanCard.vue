<template>
  <div @click="$emit('click')" @dblclick="$emit('dblclick')" class="bg-bg-card rounded-lg p-4 shadow-sm cursor-pointer
           hover:shadow-md transition-all duration-200 group ">
    <div class="flex justify-between gap-2 items-start">
      <div class="flex items-start gap-3" style="width: 90%;">
        <!-- <div class="w-10 h-10 bg-accent/20 flex justify-center items-center rounded-lg">
          <i class="fa-solid fa-diagram-project text-accent"></i>
        </div> -->
        <div class="flex-1 min-w-0">
            <span v-if="ticket['type_value']"
                    class="text-[10px] px-2 py-1 h-6 rounded bg-bg-surface/60 text-text-secondary font-medium captalize mb-3 inline-flex">
                    {{ ticket['type_value'] }}
            </span>
          <h3 class="text-sm font-medium text-card-foreground mb-2 capitalize">
            {{ ticket?.title ?? `Process ${index + 1}` }}
          </h3>
          <p v-if="ticket?.description" class="text-xs text-muted-foreground mb-3 text-text-secondary line-clamp-2 max-h-20">
            {{ ticket.description }}
          </p>
        </div>
      </div>
      <template class="hidden group-hover:block ">
            <DropMenu @click.stop="" :items="getMenuItems()">
           <template #trigger>
                 <div class="w-6 py-1 px-2 h-6 flex justify-center items-center duration-100 ease-in-out bg-bg-surface/40 rounded-md">
                   <i class="cursor-pointer text-sm fa-solid fa-ellipsis"></i>
                 </div>
              </template>
            </DropMenu>
      </template>
     
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

const emit = defineEmits(['click', 'open-builder', 'dblclick'])

const showDelete = ref(false)
const queryClient = useQueryClient()
const { workspaceId } = useRouteIds();
import { usePermissions } from '../../../composables/usePermissions';
const { canDeleteCard, canEditCard } = usePermissions();

function getMenuItems() {
  const items:any = [
    {
      label: 'Open Workflow Builder',
      action: () => {
        emit('open-builder')
      },
      icon: {
        prefix: 'fa-regular',
        iconName: 'fa-diagram-project'
      }
    }
  ]

  if(canDeleteCard.value){
     items.push({
      label: 'Delete Process', danger: true, action: () => {
        showDelete.value = true
      },
       icon: {
        prefix: 'fa-regular',
        iconName: 'fa-trash'
      }
    })
  }
  return items
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
