<template>
  <div class="w-full pt-4">
    <h2 class="text-xl md:text-4xl font-semibold text-text-primary mb-1">Team Resources</h2>
    <p class="text-sm md:text-lg text-text-secondary">
      {{ ai ? ' AI-recommended team composition for your project' : 'Team composition for your project' }}
    </p>
  </div>

  <!-- Roles Grid -->
  <div class="space-y-3 w-full pb-4">
    <div v-for="role in workspace.roles" :key="role.id" class="bg-bg-surface rounded-xl p-6">
      <div class="flex items-center justify-between mb-2">
        <div class="flex gap-4 items-center text-2xl justify-between w-full">
          <div class="flex flex-col text-text-primary text-lg font-semibold">
            <span>
              <span v-if="role?.role_emoji" class="text-xl mr-2">{{ role.role_emoji }}</span> {{ role.title }}
            </span>
            <p class="text-sm text-text-secondary">{{ role.description }}</p>
          </div>
          <!-- Update max number of people -->
         <!-- Update max number of people -->
<div class="flex items-center gap-3 text-text-primary">
  <!-- minus OR delete -->
  <button
    @click="role.max_num_people === 1 ? deleteRole(role.id) : decreaseMaxPeople(role)"
    class="w-8 cursor-pointer h-8 aspect-square rounded-full bg-bg-card flex items-center justify-center text-xl"
    :title="role.max_num_people === 1 ? 'Remove team' : 'Decrease capacity'"
    :aria-label="role.max_num_people === 1 ? 'Remove team' : 'Decrease capacity'"
  >
    <!-- icon changes with state -->
    <span v-if="role.max_num_people > 1">−</span>
    <!-- simple trash icon (emoji or swap with your icon set) -->
    <span v-else class="text-base cursor-pointer"><i class="fa-regular fa-trash"></i></span>
  </button>

  <span class="text-lg">{{ role.max_num_people }}</span>

  <button
    @click="increaseMaxPeople(role)"
    class="w-8 h-8 aspect-square cursor-pointer rounded-full bg-bg-card flex items-center justify-center text-xl"
    title="Increase capacity"
    aria-label="Increase capacity"
  >+</button>
</div>

        </div>
      </div>
      <!-- Display Team Members -->
      <div class="text-text-primary">
        <p class="text-sm font-medium text-text-secondary mb-2 flex justify-between items-center gap-2.5">
          Team Members
          <span class="flex items-center gap-2">
            <span class="text-xs text-text-secondary">
              {{ role.people.length }}/{{ role.max_num_people }}
            </span>
            <Button size="sm" variant="secondary" @click="openPeopleInput(role)"
              :disabled="role.people.length >= role.max_num_people" title="Add people by email">
              Add people
            </Button>
          </span>
        </p>

        <div v-if="role.people.length === 0" class="text-sm text-text-secondary mb-3">
          No team members assigned yet
        </div>

        <div v-for="(member, idx) in role.people" :key="idx" class="flex justify-between items-center mb-3">
          <div>
            <p class="text-sm font-medium capitalize">{{ member.name }}</p>
            <p class="text-xs text-text-secondary">{{ member.email }}</p>
          </div>
          <button @click="removeMember(role, idx)"
            class="text-text-primary w-8 h-8 bg-bg-card rounded-md cursor-pointer">✕</button>
        </div>

        <!-- Email chip input -->
        <div v-if="role.showInput" class="mt-2 space-y-2">
          <BaseEmailChip v-model="role.emailList" :error="!!role.emailError || role.capacityWarning" :message="role.capacityWarning
            ? `Reached role capacity (${role.max_num_people}).`
            : (role.emailError || 'Press Enter, comma, semicolon, or space to add. Invalid entries won’t be added.')"
            showName @invalid="onEmailsInvalid(role, $event)" @add="onEmailsAdd(role, $event)"
            @remove="onEmailsRemove(role, $event)" />

          <div class="flex items-center justify-end gap-2">
            <Button @click="finalizeChips(role)" variant="primary">Done</Button>
            <Button @click="cancelChips(role)" variant="secondary">Cancel</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add New Role Section -->
    <div v-if="!addTeam"
      class="bg-bg-surface mt-2 cursor-pointer rounded-xl p-6 flex flex-col justify-center items-center"
      @click="addTeam = true">
      <div class="p-2.5 bg-accent w-8 h-8 rounded-full">
        <img class="w-3" src="../../../assets/icons/whitePlus.svg" alt="" />
      </div>
      <h3 class="font-medium text-text-primary capitalize text-sm mt-4">Add New Team</h3>
      <p class="text-[11px] text-text-secondary mt-1 text-start line-clamp-1">Create a custom resource type</p>
    </div>

    <div v-else class="bg-bg-surface mt-2 cursor-pointer rounded-xl p-6">
      <h1 class="text-lg text-text-primary font-semibold">Add New Team</h1>
      <br>
      <BaseTextField label="Team Name" v-model="form.name" placeholder="Enter Team Name" size="lg" />
      <BaseTextAreaField label="Description" class="mt-4" v-model="form.description" placeholder="Enter Description"
        size="lg" />
      <div class="flex gap-2 mt-6 justify-end">
        <Button size="md" variant="primary" @click="addNewRole">
          Add Team
        </Button>
        <Button size="md" variant="secondary" @click="addTeam = false">Cancel</Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import Button from '../../../components/ui/Button.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseTextAreaField from '../../../components/ui/BaseTextAreaField.vue'
import BaseEmailChip from '../../../components/ui/BaseEmailChip.vue'
import { useWorkspaceStore } from '../../../stores/workspace';
const workspaceStore = useWorkspaceStore();

defineProps<{ ai: boolean }>()
interface TeamMember { name: string; email: string }
interface Role {
  id: string
  title: string
  description: string
  people: TeamMember[]
  showInput: boolean
  max_num_people: number
  role_emoji: string
  emailList: string[]
  emailError: string
  capacityWarning: boolean
}

const addTeam = ref(false)
const form = ref({ name: '', description: '' })
const workspace = reactive<any>({ roles: [] })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i
const isValidEmail = (e: string) => EMAIL_RE.test(e)

function openPeopleInput(role: Role) {
  role.showInput = true
  role.capacityWarning = role.people.length >= role.max_num_people
}

function enforceCapacity(role: Role) {
  while (role.people.length > role.max_num_people) {
    role.people.pop()
  }
  role.capacityWarning = role.people.length >= role.max_num_people

}

function addMemberEmail(role: Role, email: string) {
  if (role.people.some(p => p.email.toLowerCase() === email.toLowerCase())) return
  role.people.push({ name: email.split('@')[0], email })
}

function removeMember(role: Role, index: number) {
  const [removed] = role.people.splice(index, 1)
  const idx = role.emailList.findIndex(e => e.toLowerCase() === removed.email.toLowerCase())
  if (idx !== -1) role.emailList.splice(idx, 1)
  role.capacityWarning = role.people.length >= role.max_num_people

}

function onEmailsInvalid(role: Role, invalids: string[]) {
  role.emailError = invalids.length ? `Invalid: ${invalids.join(', ')}` : ''
}

function onEmailsAdd(role: Role, added: string[]) {
  added.forEach(email => {
    if (!isValidEmail(email)) return
    if (role.people.length < role.max_num_people) {
      addMemberEmail(role, email)
    } else {
      role.capacityWarning = true
    }
  })
}

function onEmailsRemove(role: Role, removedEmail: string) {
  const idx = role.people.findIndex(p => p.email.toLowerCase() === removedEmail.toLowerCase())
  if (idx !== -1) role.people.splice(idx, 1)
  role.capacityWarning = role.people.length >= role.max_num_people

}

function finalizeChips(role: Role) {
  role.showInput = false
  role.capacityWarning = role.people.length >= role.max_num_people

}

function cancelChips(role: Role) {
  role.showInput = false
  role.emailError = ''
  role.capacityWarning = role.people.length >= role.max_num_people
}

function addNewRole() {
  const newRole = {
    id: `role-${Date.now()}`,
    title: form.value.name,
    description: form.value.description,
    people: [],
    showInput: false,
    max_num_people: 1,
    role_emoji: '',
    emailList: [],
    emailError: '',
    capacityWarning: false
  }
  workspace.roles.push(newRole)

  form.value.name = ''
  form.value.description = ''
  addTeam.value = false
}

function saveToLocalStorage() {
  const data = workspaceStore.workspace
  const localWorkspace = data ? data : { variables: { roles: [] } }
  localWorkspace.variables.roles = workspace.roles
  workspaceStore.setWorkspace(localWorkspace)
}

onMounted(() => {
  try {
    const savedWorkspace = workspaceStore.workspace
    if (savedWorkspace) {
      const data = savedWorkspace
      workspace.roles = (data.variables.roles || []).map((r: Role) => ({
        ...r,
        showInput: r.showInput ?? false,
        emailList: r.emailList ?? r.people?.map(p => p.email) ?? [],
        emailError: '',
        capacityWarning: false,
        max_num_people: typeof r.max_num_people === 'number' ? r.max_num_people : 1,
        role_emoji: r.role_emoji ?? ''
      }))
    }
  } catch (error) {
    console.error('Error parsing workspace from localStorage', error)
  }
})
function decreaseMaxPeople(role: Role) {
  if (role.max_num_people > 1) {
    role.max_num_people--; // Decrease the max number of people
    enforceCapacity(role);  // Ensure the capacity is updated based on the new max value
  }
}

// Method to increase the max number of people
function increaseMaxPeople(role: Role) {
  role.max_num_people++; // Increase the max number of people
  enforceCapacity(role);  // Ensure the capacity is updated based on the new max value
}
function continueHandler() {
  saveToLocalStorage()
}

function deleteRole(roleId: string) {
  const idx = workspace.roles.findIndex((r: Role) => r.id === roleId)
  if (idx !== -1) {
    workspace.roles.splice(idx, 1)
    // optional: persist if you want immediate save-on-delete
    // saveToLocalStorage()
  }
}

defineExpose({ continueHandler })
</script>
