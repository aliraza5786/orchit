<template>
  <BaseModal :inSpace="true" v-model="isOpen" modalClass="!py-0" size="md" :title="`Start ${formattedSprintType}`">
    
    <!-- Body: Read-only Preview -->
    <div class="px-6 py-5 bg-bg-input space-y-4">
      <div class="flex flex-col">
        <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Name</label>
        <p class="text-sm font-medium text-text-primary">{{ updateData?.sprint_name || 'Untitled' }}</p>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col">
          <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Duration</label>
          <p class="text-sm font-medium text-text-primary">{{ formattedDuration }}</p>
        </div>
        <div class="flex flex-col" v-if="updateData?.num_sprints">
          <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Number of Sprints</label>
          <p class="text-sm font-medium text-text-primary">{{ updateData.num_sprints }}</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col">
          <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Start Date</label>
          <p class="text-sm font-medium text-text-primary">{{ formatDate(updateData?.start) }}</p>
        </div>
        <div class="flex flex-col">
          <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">End Date</label>
          <p class="text-sm font-medium text-text-primary">{{ formatDate(updateData?.end) }}</p>
          
        </div>
      </div> 

      <div class="flex flex-col" v-if="updateData?.goal">
        <label class="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Goal</label>
        <p class="text-sm font-medium text-text-primary italic">"{{ updateData.goal }}"</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex justify-end items-center gap-3 p-6 sticky bottom-0 bg-bg-input border-t border-border">
      <Button :inSpace="true" variant="secondary" @click="cancel" class="min-w-[80px]">Cancel</Button>
      
      <Button
        :inSpace="true"
        @click="editSprint" 
        variant="primary" 
      >
        <i class="fa-light fa-pen-to-square mr-2 text-base"></i>
        Edit {{ formattedSprintType }}
      </Button>

      <Button :inSpace="true" variant="primary" @click="startNow" :disabled="creatingSprint" class="px-6">
        {{ creatingSprint ? "Starting..." : "Start Now" }}
      </Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from "vue";
import BaseModal from "../../../components/ui/BaseModal.vue";
import Button from "../../../components/ui/Button.vue";
import { useSidePanelStore } from "../../../stores/sidePanelStore";

/** Emits */
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "edit-sprint"): void;
  (e: "start-now"): void;
  (e: "close"): void;
}>();

/** Props */
const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    creatingSprint: boolean;
    sprintType: string;
  }>(),
  { modelValue: false },
);

const sidePanelStore = useSidePanelStore();
const updateData = computed(() => sidePanelStore.startedSprint);

/** v-model proxy for BaseModal */
const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit("update:modelValue", v),
});

const formattedSprintType = computed(() => {
  if (!props.sprintType) return "";
  return props.sprintType.charAt(0).toUpperCase() + props.sprintType.slice(1);
});

const formattedDuration = computed(() => {
  const days = Number(updateData.value?.duration || 0);
  if (!days) return "Not set";
  
  if (props.sprintType === 'huddle') {
    return `${days} Day${days !== 1 ? 's' : ''}`;
  }
  
  const weeks = days / 7;
  if (Number.isInteger(weeks)) {
    return `${weeks} Week${weeks !== 1 ? 's' : ''}`;
  }
  return `${days} Days`;
});

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "Not set";
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function cancel() {
  isOpen.value = false;
  emit("close");
}

function editSprint() {
  isOpen.value = false;
  emit("edit-sprint");
}

function startNow() {
  emit("start-now");
}
</script>
