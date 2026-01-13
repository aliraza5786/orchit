<template>
  <BaseModal :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)" size="md">
    <div class="p-6">
      <h2 class="text-xl font-semibold text-text-primary mb-6">Add Process Card</h2>
      
      <div class="space-y-4">
        <BaseTextField label="Title" v-model="form.title" placeholder="e.g. Start Task" :autofocus="true" />
        <div class="space-y-2">
           <label class="block text-sm font-medium text-text-primary">Card Type</label>
           <BaseSelectField v-model="form.type_value" :options="variableTypeOptions" placeholder="Select Type" class="w-full" />
        </div>
        <BaseTextAreaField label="Description" v-model="form.description" placeholder="Optional description" />
         
        

        <div class="flex justify-end gap-3 mt-6">
             <Button variant="secondary" @click="$emit('update:modelValue', false)">Cancel</Button>
             <Button variant="primary" @click="create" :loading="isPending">Create Process</Button>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import BaseModal from '../../../components/ui/BaseModal.vue';
import BaseTextField from '../../../components/ui/BaseTextField.vue';
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue';
import Button from '../../../components/ui/Button.vue';
import BaseSelectField from '../../../components/ui/BaseSelectField.vue';
import { useCreateTransition, useFilteredCardTypes } from '../../../queries/useProcess2';
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
    type_value: '',
    transition_type: 'forward'
});



watchEffect(()=>{
  console.log(form.value.type_value)
})

interface Option {
  title: string;
  _id: string;
}

// Fetch variable types from API
const { data: cardTypesData } = useFilteredCardTypes(workspaceId);

const variableTypeOptions = computed<Option[]>(() => {
  if (!cardTypesData.value) return [];
  
  // Assuming the API returns an array directly or inside a 'data' property
  const types = Array.isArray(cardTypesData.value) ? cardTypesData.value : (cardTypesData.value?.data || []);
  
  return types.map((t: any) => ({
    title: t.title || t.name, // Adjust based on actual API response
    _id: t._id || t.id
  }));
});

import { toast } from 'vue-sonner';

const { mutate, isPending } = useCreateTransition({
    onSuccess: () => {
        toast.success("Process created successfully");
        emit('created');
        emit('update:modelValue', false);
        // Reset form
        form.value = {
            title: '',
            description: '', 
            type_value: '',
            transition_type: 'forward'
        };
    },
    onError: (error: any) => {
        toast.error(error?.message || "Failed to create process");
    }
});

const create = () => {
    if (!form.value.title || !form.value.type_value) {
        // Simple validation
        return; 
    }

    // Lookup the title from the selected ID to send as payload
    const selectedOption = variableTypeOptions.value.find(o => o._id === form.value.type_value);
    const variableTypePayload = selectedOption ? selectedOption.title : form.value.type_value;
    
    mutate({
        workspace_id: workspaceId.value,
        group_id: props.group._id,
        ...form.value,
        type_value: variableTypePayload, // Override with title
        sort_id: props.group.cards ? props.group.cards.length : 0
    });
};

</script>
