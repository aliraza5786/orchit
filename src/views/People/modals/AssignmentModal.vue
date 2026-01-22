<template>
    <BaseModal v-model="isOpen" size="md">
        <!-- Header -->
        <div class="sticky top-0 z-10 flex items-start gap-2  px-6 pb-4 mb-4 border-b border-border bg-bg-body">
            <h2 class="text-xl font-semibold">Add team member</h2>
        </div>
        <!-- Body -->
        <div class="px-6 pb-2">
            <!-- Custom input field for search and adding email -->
            <div class="relative mb-4">
                <input v-model="query" type="text" placeholder="Search or add email"
                    class="w-full h-11 rounded-[6px] border border-border bg-bg-input px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                    @keydown.enter.prevent="addEmailFromSearch" />
            </div>

            <!-- Searchable list of members based on query -->
            <div v-if="filteredMembers.length" class="mt-3">
                <ul class="divide-y divide-border rounded-xl border border-border bg-bg-card ">
                    <li v-for="(m) in filteredMembers" :key="m.id || m.email"
                        class="flex items-center justify-between gap-3  px-3 py-3 cursor-pointer hover:bg-bg-muted"
                        @click="pickPerson(m)" :class="{ 'bg-bg-muted': selectedEmail === m.email }">
                        <div class="flex items-center gap-3 min-w-0">
                            <img v-if="m?.profile_image" class="h-9 w-9 rounded-full aspect-square"
                                :src="m?.profile_image" alt="avatar">
                            <div v-else
                                class="h-9 w-9 bg-white capitalize rounded-full flex items-center justify-center text-xs font-semibold"
                                :style="{ backgroundColor: avatarColor({ email: m.email }) }">
                                {{ getInitials(m.name || m.email) }}
                            </div>
                            <div class="min-w-0">
                                <div class="truncate font-medium leading-tight capitalize">{{ m.name || m.email }}</div>
                                <div class="truncate text-xs text-text-secondary leading-tight">{{ m.email }}</div>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>

            <!-- Display selected email as chip -->
            <div v-if="selectedEmail" class="mt-3 flex items-center gap-2">
                <span class="inline-flex items-center gap-2 rounded-full px-3 py-2 bg-bg-muted text-text-secondary">
                    {{ selectedEmail }}
                    <button @click="clearSelectedEmail" class="ml-2 text-sm text-red-500">✕</button>
                </span>
            </div>
        </div>
        <!-- Footer -->
        <div class="flex items-center justify-between gap-3 p-6 mt-3 pb-2 border-t border-border bg-bg-body">
            <div class="flex gap-2 justify-between w-full">
                <Button variant="secondary" @click="close">Cancel</Button>
                <Button variant="primary" :disabled="((!selectedEmail || isSubmitting) ? true : false)" @click="submit">
                    {{ isSubmitting ? 'Assigning…' : 'Assign' }}
                </Button>
            </div>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import Button from '../../../components/ui/Button.vue'
import { getInitials } from '../../../utilities';
import { avatarColor } from '../../../utilities/avatarColor';

type Person = { id?: string | number; name?: string; email: string }
type Invite = { name?: string; email: string }

const props = withDefaults(defineProps<{
    modelValue: boolean
    members?: Person[]
    directory?: Person[]
    placeholder?: string
    isSubmitting?: Boolean

}>(), {
    modelValue: false,
    members: () => [],
    directory: () => [],
    placeholder: 'Search people by name or email'
})

const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit', payload: { invite: Invite }): void
    (e: 'copy-link'): void
}>()

const isOpen = computed({
    get: () => props.modelValue,
    set: v => emit('update:modelValue', v)
})

const query = ref('') // Search query bound to custom input field
const selectedEmail = ref<string>('') // Selected email
const emailError = ref('') // Email error for validation

// Filter directory based on search query
const filteredMembers: any = computed(() => {
    const q = query.value.trim().toLowerCase()
    return props.directory.filter(p => (p.name?.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)))
})

// Handle picking a person from the filtered list
const pickPerson = (person: Person) => {
    selectedEmail.value = person.email
    query.value = '' // Clear the search input
}

// Handle email chip clear action
const clearSelectedEmail = () => {
    selectedEmail.value = ''
}

// Handle adding email from the search
const addEmailFromSearch = () => {
    if (!query.value) return
    selectedEmail.value = query.value.trim() // Select the email from input query
    query.value = '' // Clear the search input
}

// Email validation
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

// Submit action
const submit = () => {
    if (!selectedEmail.value || !isValidEmail(selectedEmail.value)) {
        emailError.value = 'Please select a valid email.'
        return
    }
    emit('submit', { invite: { email: selectedEmail.value } })
    // clearSelectedEmail()
    // isOpen.value = false
}

const close = () => {
    clearSelectedEmail()
    query.value = ''
    isOpen.value = false
}

onMounted(() => {
    if (isOpen.value) query.value = ''
})


</script>