<template>
  <BaseModal :inSpace="true" v-model="isOpen" modalClass="!py-0" title="Edit Knowledge Item" size="lg">

    <h3 class="text-md text-text-secondary p-6">
      Update the details below and click <span class="font-medium">Save Changes</span>.
    </h3>

    <!-- Body -->
    <div class="px-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

      <div class="sm:col-span-2">
        <BaseTextField
          v-model="form.title"
          label="Title"
          placeholder="Knowledge item title"
          :error="touched.title && !form.title.trim()"
          message="Title is required"
          @blur="touched.title = true"
        />
      </div>

      <BaseSelectField
        size="md"
        label="Scope Type"
        :options="scopeOptions"
        :model-value="form.scope_type"
        @update:modelValue="form.scope_type = ($event as ScopeType)"
        :allowCustom="false"
        placeholder="Select scope"
      />

      <BaseSelectField
        size="md"
        label="Visibility"
        :options="visibilityOptions"
        :model-value="form.visibility"
        @update:modelValue="form.visibility = ($event as Visibility)"
        :allowCustom="false"
        placeholder="Select visibility"
      />

      <div class="sm:col-span-2">
        <BaseSelectField
          size="md"
          label="Trust Level"
          :options="trustLevelOptions"
          :model-value="form.trust_level"
          @update:modelValue="form.trust_level = ($event as TrustLevel)"
          :allowCustom="false"
          placeholder="Select trust level"
        />
      </div>

    </div>

    <div class="px-6 mt-4">
      <BaseRichTextEditor
        label="Description"
        placeholder="Short description or notes…"
        v-model="form.description"
      />
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-2 p-6 mt-8 sticky bottom-0 bg-bg-body border-t border-border">
      <Button :inSpace="true" variant="secondary" @click="isOpen = false">Cancel</Button>
      <Button
        :inSpace="true"
        variant="primary"
        :disabled="isSaving"
        @click="submit"
      >
        {{ isSaving ? 'Saving…' : 'Save Changes' }}
      </Button>
    </div>

  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import BaseRichTextEditor from '../../../components/ui/BaseRichTextEditor.vue'
import Button from '../../../components/ui/Button.vue'
import { toast } from 'vue-sonner'
import {
  useUpdateKnowledgeItem,
  type KnowledgeItem,
  type ScopeType,
  type Visibility,
  type TrustLevel,
} from '../../../queries/useKnowledgeHub'

const props = defineProps<{
  modelValue: boolean
  item: KnowledgeItem
  workspaceId: string
  filterOptions: any
}>()

const emit = defineEmits<{
  'update:modelValue': [val: boolean]
  success: []
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

// ─── Form ──────────────────────────────────────────────────────────────────────
const form = reactive({
  title:       props.item.name,
  description: props.item.description ?? '',
  visibility:  props.item.visibility as Visibility,
  trust_level: props.item.trust_level as TrustLevel,
  scope_type:  props.item.scope_type as ScopeType,
})

const touched = reactive({ title: false })

// ─── Select options ────────────────────────────────────────────────────────────
const scopeOptions = [
  { _id: 'workspace', title: 'Workspace' },
  { _id: 'module',    title: 'Module' },
  { _id: 'sheet',     title: 'Sheet' },
  { _id: 'card',      title: 'Card' },
  { _id: 'agent',     title: 'Agent' },
  { _id: 'user',      title: 'User' },
]

const visibilityOptions = [
  { _id: 'private',    title: 'Private' },
  { _id: 'team',       title: 'Team' },
  { _id: 'workspace',  title: 'Workspace' },
  { _id: 'agent_only', title: 'Agent Only' },
]

const trustLevelOptions = [
  { _id: 'source_of_truth',   title: 'Source of Truth' },
  { _id: 'approved_learning', title: 'Approved Learning' },
  { _id: 'supporting',        title: 'Supporting' },
  { _id: 'suggested',         title: 'Suggested' },
  { _id: 'unverified',        title: 'Unverified' },
]

// ─── Save ──────────────────────────────────────────────────────────────────────
const isSaving = ref(false)
const { mutateAsync: updateItem } = useUpdateKnowledgeItem()

async function submit() {
  touched.title = true
  if (!form.title.trim()) return
  isSaving.value = true
  try {
    await updateItem({
      id: props.item._id,
      payload: {
        workspace_id: props.workspaceId,
        title:        form.title,
        description:  form.description || undefined,
        visibility:   form.visibility,
        trust_level:  form.trust_level,
        scope_type:   form.scope_type,
      },
    })
    toast.success('Knowledge item updated')
    emit('success')
    isOpen.value = false
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to update item')
  } finally {
    isSaving.value = false
  }
}
</script>