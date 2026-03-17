<template>
  <BaseModal v-model="isOpen" size="md" modalClass="!py-0" title="Share Module">
    <p class="text-sm text-text-secondary p-6"> Share this module with other users.</p>

    <!-- Body -->
    <div class="px-6 flex flex-col gap-4">
      <!-- Emails -->
      <BaseEmailChip class="w-full" label="User emails" v-model="form.emails" :error="!!emailError"
        :message="emailError || 'Press Enter after each email'" showName @invalid="onEmailsInvalid"
        @add="onEmailsAdd" />

      <!-- Access Role -->
      <BaseSelectField size="md" label="Access Role" :options="[
        {
          title: 'Viewer',
          _id: 'viewer'
        },
        {
          title: 'Editor',
          _id: 'editor'
        }
      ]" placeholder="Choose role" :model-value="form.access_level" @update:modelValue="v => (form.access_level = v)"
        :message="roleError" :error="!!roleError" />

      <!-- Note -->
      <BaseTextAreaField
        label="Note"
        placeholder="Add a note (optional)..."
        :model-value="form.note"
        @update:modelValue="v => form.note = v"
      />
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-2 p-6 mt-6 sticky bottom-0 bg-bg-body border-t border-border">
      <Button variant="secondary" @click="cancel">Cancel</Button>
      <Button variant="primary" :disabled="!canSubmit || isSharing" @click="submit">
        <i v-if="isSharing" class="fa-solid fa-spinner animate-spin mr-2"></i>
        {{ isSharing ? 'Sharing…' : 'Share' }}
      </Button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import BaseEmailChip from '../../../components/ui/BaseEmailChip.vue'
import Button from '../../../components/ui/Button.vue'
import { useShareResource } from '../../../queries/useWorkspace'
import { useRouteIds } from '../../../composables/useQueryParams'

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'shared'): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    resourceId?: string
  }>(),
  { modelValue: false }
)

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const { workspaceId } = useRouteIds()

const form = reactive({
  access_level: 'viewer' as string | number | null,
  emails: [] as string[],
  note: ''
})

const roleError = computed(() => (!form.access_level ? 'Role is required' : ''))
const invalidEmails = computed<string[]>(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return form.emails.filter(e => !re.test(e))
})
const emailError = computed(() =>
  invalidEmails.value.length ? `Invalid: ${invalidEmails.value.join(', ')}` : ''
)
const canSubmit = computed(
  () => !!form.access_level && form.emails.length > 0 && invalidEmails.value.length === 0
)

function onEmailsInvalid(_bad: string[]) { }
function onEmailsAdd() { }

const { mutate: shareResource, isPending: isSharing } = useShareResource()

function submit() {
  if (!canSubmit.value || isSharing.value) return
  
  shareResource(
    {
      payload: {
        workspace_id: workspaceId.value,
        resource_type: 'module',
        resource_id: props.resourceId,
        email: form.emails,
        access_level: form.access_level,
        note: form.note
      }
    },
    {
      onSuccess: () => {
        toast.success('Module shared successfully')
        emit('shared')
        reset()
        isOpen.value = false
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to share module.'
        toast.error(msg)
      },
    }
  )
}

function cancel() {
  reset()
  isOpen.value = false
}

function reset() {
  form.access_level = 'viewer'
  form.emails = []
  form.note = ''
}
</script>
