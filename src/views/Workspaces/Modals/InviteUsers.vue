<template>
  <BaseModal v-model="isOpen" size="md" modalClass="!py-0">
    <!-- Header -->
    <div class="sticky top-0 z-10 flex flex-col items-start pt-6 px-6 border-b border-border bg-bg-body pb-4 mb-4">
      <h2 class="text-xl font-semibold">Invite Users</h2>
      <p class="text-sm text-text-secondary mt-1"> Add emails, and pick a permission.</p>
    </div>

    <!-- Body -->
    <div class="px-6 flex flex-col gap-4">
      <!-- Emails -->
      <BaseEmailChip class="w-full" label="User emails" v-model="form.emails" :error="!!emailError"
        :message="emailError || 'Press Enter after each email'" showName @invalid="onEmailsInvalid"
        @add="onEmailsAdd" />

      <!-- Role (depends on workspace) -->
      <BaseSelectField size="md" label="Permission" :options="[
        {
          title: 'Viewer',
          _id: 'viewer'
        },
        {
          title: 'Editor',
          _id: 'editor'
        },
        {
          title: 'Admin',
          _id: 'admin'
        }

      ]" placeholder="Choose role" :model-value="form.role_id" @update:modelValue="v => (form.role_id = v)"
        :disabled="!form.workspace_id" :message="roleError" :error="!!roleError" />


    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-2 p-6 mt-6 sticky bottom-0 bg-bg-body border-t border-border">
      <Button variant="secondary" @click="cancel">Cancel</Button>
      <Button variant="primary" :disabled="!canSubmit || inviting" @click="submit">
        {{ inviting ? 'Inviting…' : 'Send Invites' }}
      </Button>
    </div>
  </BaseModal>
</template>

<!-- File: src/components/modals/InviteUsersModal.vue -->
<script setup lang="ts">
import { computed, reactive, watch, ref } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { useWorkspaces } from '../../../queries/useWorkspace'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import BaseEmailChip from '../../../components/ui/BaseEmailChip.vue'
import Button from '../../../components/ui/Button.vue'
import { useInviteCompany } from '../../../services/auth'
import { useCompanyId } from '../../../services/user'

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'invited', payload: any): void
}>()

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    defaultWorkspaceId?: string | number
  }>(),
  { modelValue: false }
)

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const queryClient = useQueryClient()
const page = ref(1);
const limit = ref(100);

const { data: workspaces } = useWorkspaces(page, limit);

type SelectValue = string | number | null
const form = reactive({
  workspace_id: null as SelectValue,
  role_id: 'viewer' as SelectValue,
  emails: [] as string[],
})

watch(
  () => props.defaultWorkspaceId,
  id => {
    if (id && !form.workspace_id) form.workspace_id = id as SelectValue
    else form.workspace_id = workspaceOptions.value[0]._id
  },
  { immediate: true }
)

type Option = { _id: string | number; title: string }
const workspaceOptions = computed<Option[]>(() =>
  (workspaces?.value?.workspaces ?? []).map((w: any) => ({
    _id: w._id ?? w.id,
    title: w?.variables?.title ?? w.title ?? String(w._id ?? w.id),
  }))
)



const roleError = computed(() => (!form.role_id ? 'Role is required' : ''))
const invalidEmails = computed<string[]>(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return form.emails.filter(e => !re.test(e))
})
const emailError = computed(() =>
  invalidEmails.value.length ? `Invalid: ${invalidEmails.value.join(', ')}` : ''
)
const canSubmit = computed(
  () => !!form.workspace_id && !!form.role_id && form.emails.length > 0 && invalidEmails.value.length === 0
)


function onEmailsInvalid(_bad: string[]) { }
function onEmailsAdd() { }

const { mutate: invitePeople, isPending: inviting } = useInviteCompany()
const { data: company_id } = useCompanyId()
function submit() {
  if (!canSubmit.value || inviting.value) return
  invitePeople(
    {
      payload: {
        company_id: company_id.value._id,
        role: form.role_id,
        emails: form.emails.map(email => ({
          email,
          name: inferName(email),
        })),
      }
    },
    {
      onSuccess: (res: any) => {
        if (res?.failedInvites?.length) {
          toast.error(res.failedInvites[0]?.error ?? 'Some invites failed')
        } else {
          toast.success('Invitations sent')
        }
        queryClient.invalidateQueries({ queryKey: ['all-users'] })
        emit('invited', res)
        reset()
        isOpen.value = false
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || err?.message || 'Failed to send invitations.'
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
  form.role_id = null
  form.emails = []
  // keep workspace_id for convenience
}

function inferName(email: string) {
  const local = (email.split('@')[0] || '').split('+')[0]
  const parts = local.split(/[^a-zA-Z]+/).filter(Boolean)
  return parts.length
    ? parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
    : email
}
</script>
