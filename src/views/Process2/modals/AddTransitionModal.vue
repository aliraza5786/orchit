<template>
  <BaseModal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" size="lg">
    <div class="p-6">
      <h2 class="text-xl font-semibold text-text-primary mb-6">Add Process Card</h2>
      
      <div class="space-y-4">
        <BaseTextField label="Title" v-model="form.title" placeholder="e.g. Start Task" :autofocus="true" />
        <BaseTextAreaField label="Description" v-model="form.description" placeholder="Optional description" />
        
        <div class="grid grid-cols-2 gap-4">
           <BaseTextField label="From Status" v-model="form.from_status" placeholder="e.g. To Do" />
           <BaseTextField label="To Status" v-model="form.to_status" placeholder="e.g. In Progress" />
        </div>

        <div class="space-y-2">
           <label class="block text-sm font-medium text-text-primary">Variable Type</label>
           <Dropdown v-model="form.variable_type" :options="variableTypeOptions" placeholder="Select Type" class="w-full" />
        </div>

        <div class="flex justify-end gap-3 mt-6">
             <Button variant="secondary" @click="$emit('update:modelValue', false)">Cancel</Button>
             <Button variant="primary" @click="create" :loading="isPending">Create Process</Button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseTextField from '../../../components/ui/BaseTextField.vue';
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue';
import Button from '../../../components/ui/Button.vue';
import Dropdown from '../../../components/ui/Dropdown.vue';
import { useCreateTransition } from '../../../queries/useProcess2';
import { useRouteIds } from '../../../composables/useQueryParams';

const props = defineProps<{
  modelValue: boolean;
  group: any;
}>();

const emit = defineEmits(['update:modelValue', 'created']);

const { workspaceId } = useRouteIds();

const form = ref({
    title: '',
    description: '',
    from_status: '',
    to_status: '',
    variable_type: 'email',
    transition_type: 'forward'
});

interface Option {
  title: string;
  _id: string;
}

const variableTypeOptions: Option[] = [
  { title: 'Email', _id: 'email' },
  { title: 'Survey', _id: 'survey' },
  { title: 'Webhook', _id: 'webhook' },
  { title: 'Notification', _id: 'notification' },
  { title: 'Custom', _id: 'custom' },
];

const { mutate, isPending } = useCreateTransition({
    onSuccess: () => {
        emit('created');
        emit('update:modelValue', false);
        // Reset form
        form.value = {
            title: '',
            description: '',
            from_status: '',
            to_status: '',
            variable_type: 'email',
            transition_type: 'forward'
        };
    }
});

const create = () => {
    if (!form.value.title || !form.value.from_status || !form.value.to_status) {
        // Simple validation
        return; 
    }
    
    mutate({
        workspace_id: workspaceId.value,
        group_id: props.group._id,
        ...form.value,
        sort_id: props.group.cards ? props.group.cards.length : 0
    });
};

</script>
