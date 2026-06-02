<template>
  <div
  @click="$emit('click')"
  @dblclick="isEnabled && $emit('dblclick')"
  class="bg-bg-card rounded-lg p-2.5 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 group"
>
    <div class="flex justify-between gap-1.5 items-start">
      <div class="flex items-start gap-2" style="width: 92%;">
        <div class="flex-1 min-w-0">
            <span 
                    class="text-[9px] px-1.5 py-0.5 rounded-lg bg-primary-color/20 text-primary-color font-medium capitalize mb-1.5 inline-flex items-center">
                   {{ ticket?.type_value || 'General' }}
            </span>
          <h3 class="text-xs font-semibold text-card-foreground mb-1 capitalize leading-tight">
            {{ ticket?.title ?? `Process ${index + 1}` }}
          </h3>
          <p v-if="ticket?.description" class="text-[11px] text-muted-foreground mb-1.5 text-text-secondary line-clamp-2 leading-relaxed">
            {{ ticket.description }}
          </p>

          <!-- Extra Details -->
          <div v-if="hasExtraDetails" class="mt-2 pt-2 border-t border-border/40 flex flex-wrap gap-x-3 gap-y-1">
            <div v-if="ticket?.status" class="flex items-center gap-1 text-[10px] text-text-secondary">
              <i class="fa-solid fa-circle-dot text-[8px] text-primary-color/70"></i>
              <span>Status: <span class="font-semibold text-foreground/80 capitalize">{{ ticket.status }}</span></span>
            </div>
            
            <div v-if="getAssigneeName(ticket?.assigned_to || ticket?.assignee)" class="flex items-center gap-1 text-[10px] text-text-secondary">
              <i class="fa-regular fa-user text-[8px]"></i>
              <span>Assignee: <span class="font-medium text-foreground/80">{{ getAssigneeName(ticket?.assigned_to || ticket?.assignee) }}</span></span>
            </div>
            
            <div v-if="usageCount !== null && usageCount !== undefined" class="flex items-center gap-1 text-[10px] text-text-secondary">
              <i class="fa-solid fa-ticket text-[8px]"></i>
              <span>Used by <span class="font-semibold text-foreground/80">{{ usageCount }}</span> {{ usageCount === 1 ? 'ticket' : 'tickets' }}</span>
            </div>
            
            <div v-if="getCreatorName(ticket?.created_by || ticket?.creator)" class="flex items-center gap-1 text-[10px] text-text-secondary">
              <i class="fa-regular fa-circle-user text-[8px]"></i>
              <span>By: <span class="font-medium text-foreground/80">{{ getCreatorName(ticket?.created_by || ticket?.creator) }}</span></span>
            </div>
          </div>
        </div>
      </div>
     <template class="group-hover:block">
  <div>
    <DropMenu
      @click.stop
      :items="getMenuItems()"
      :disabled="!isEnabled"
    >
      <template #trigger>
        <div class="w-5 py-0.5 px-1.5 h-5 flex justify-center items-center duration-100 ease-in-out bg-bg-surface/40 rounded-md">
          <i class="cursor-pointer text-xs fa-solid fa-ellipsis"></i>
        </div>
      </template>
    </DropMenu>
  </div>
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
import { ref, computed } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import DropMenu from '../../../components/ui/DropMenu.vue'
import { useDeleteTransition } from '../../../queries/useProcess2'
import ConfirmDeleteModal from '../../Product/modals/ConfirmDeleteModal.vue'
import { useRouteIds } from '../../../composables/useQueryParams'
import { usePermissions } from '../../../composables/usePermissions';
const { canDeleteCard, canEditCard } = usePermissions();
const isEnabled = computed(() => canEditCard.value || canDeleteCard.value)
const props = defineProps<{
  ticket: any
  index: any
}>()

const usageCount = computed(() => {
  const count = props.ticket?.ticket_count ?? props.ticket?.tickets_count ?? props.ticket?.used_by_tickets ?? props.ticket?.usage_count ?? props.ticket?.used_by;
  return (count !== undefined && count !== null) ? Number(count) : null;
});

const hasExtraDetails = computed(() => {
  return !!(
    props.ticket?.status ||
    getAssigneeName(props.ticket?.assigned_to || props.ticket?.assignee) ||
    usageCount.value !== null ||
    getCreatorName(props.ticket?.created_by || props.ticket?.creator)
  );
});

function getAssigneeName(assignee: any) {
  const name = props.ticket?.assignee_name || props.ticket?.assigned_to_name;
  if (name) return name;

  if (!assignee) return '';
  if (typeof assignee === 'object') {
    return assignee.u_full_name || assignee.full_name || assignee.name || assignee.email || '';
  }
  if (typeof assignee === 'string' && /^[0-9a-fA-F]{24}$/.test(assignee)) {
    return '';
  }
  return assignee;
}

function getCreatorName(creator: any) {
  const name = props.ticket?.creator_name || props.ticket?.created_by_name || props.ticket?.user_name || props.ticket?.u_full_name;
  if (name) return name;

  if (!creator) return '';
  if (typeof creator === 'object') {
    return creator.u_full_name || creator.full_name || creator.name || creator.email || '';
  }
  if (typeof creator === 'string' && /^[0-9a-fA-F]{24}$/.test(creator)) {
    return '';
  }
  return creator;
}

const emit = defineEmits(['click', 'open-builder', 'dblclick'])

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
      label: 'Delete Process',
      danger: true,
      action: () => {
        showDelete.value = true
      },
      icon: {
        prefix: 'fa-regular',
        iconName: 'fa-trash'
      }
    }
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
