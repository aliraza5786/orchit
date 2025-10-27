<template>
    <BaseModal v-model="model" size="lg">
        <!-- Header -->
        <div class="flex justify-between items-start  px-6 border-b border-border pb-4">
            <h2 class="text-xl font-semibold">Add a new board</h2>

        </div>

        <!-- Tabs -->
        <!-- <div class="px-6">
            <SwitchTab :options="tabs" v-model="currentTab" />
        </div> -->

        <!-- Body -->
        <div class="px-6 py-4 space-y-6">
            <!-- 1) MANUAL TAB -->
            <section v-if="currentTab === 'manual'" class="space-y-4">
                <!-- Icon picker placeholder -->
                <IconPicker v-model="form.icon" />
                <BaseTextField v-model="form.title" label="Board name" size="lg" placeholder="Design Ideas" />
                <BaseTextField v-model="form.description" label="Description" size="lg"
                    placeholder="a small description" textarea />

                <div class="flex justify-end gap-2 pt-2">
                    <button class="px-4 py-2 rounded-md text-sm text-text-secondary  border"
                        @click="close">Cancel</button>
                    <!-- replace the commented button -->
                    <Button class="px-4" @click="submitManual">{{ creatingSheet ? 'Adding...' : 'Add board'
                        }}</Button>
                </div>
            </section>

            <!-- 2) GENERATE WITH AI TAB -->
            <section v-else-if="currentTab === 'ai'" class="space-y-4">
                <textarea v-model="aiPrompt" rows="6"
                    class="w-full rounded-lg p-3 text-sm min-h-[186px] outline-none border-border border bg-bg-input"
                    placeholder="Generate a project management board for a software development team with tasks categorized as 'Backlog', 'In Progress', 'Review', and 'Done'."></textarea>
                <div class="text-center text-xs text-text-secondary -500">Or try these examples:</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button v-for="ex in examples" :key="ex"
                        class="text-left border border-border hover:border-accent bg-bg-body text-text-primary rounded-xl p-3 text-sm hover:bg-gray-50 "
                        @click="aiPrompt = ex">“{{ ex
                        }}”</button>
                </div>
                <div class="flex justify-end gap-2 pt-2">
                    <button class="px-4 py-2 rounded-md text-sm text-text-secondary  border"
                        @click="close">Cancel</button>
                    <Button class="px-4" @click="generateBoard">Add board</Button>
                </div>
            </section>

            <!-- 3) TEMPLATES TAB -->
            <section v-else class="space-y-4">
                <div class="flex items-center gap-3">
                    <input v-model="search" class="flex-1 border rounded-lg p-2 text-sm border-border D6D7DA]"
                        placeholder="Search" />
                </div>

                <div class="flex flex-wrap items-center gap-2 text-xs">
                    <button v-for="tag in tags" :key="tag.name" class="px-3.5 py-1.5 rounded-md flex  "
                        :class="activeTags.has(tag.name) ? 'bg-black text-white ' : ' bg-bg-body cursor-pointer text-text-secondary -700'"
                        @click="toggleTag(tag.name)">
                        {{ tag.name }}<div v-if="tag.count"
                            class="ml-1 opacity-70 bg-bg-surface rounded-full  text-text-primary p-0.5 aspect-square  w-4 h-4 text-[10px]">
                            {{ tag.count }}</div>
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <button v-for="tpl in filteredTemplates" :key="tpl.id"
                        class="border border-border 2B2C3026] rounded-xl overflow-hidden text-left hover:shadow-sm"
                        @click="chooseTemplate(tpl)">
                        <img src="../../../assets/temp/a40c90e37b9e8e45317b9cba411ad897833a9d01.jpg"
                            class="w-full h-36 object-cover" />
                        <div class="p-3 py-4">
                            <div class="text-base font-medium text-text-primary">{{ tpl.title }}</div>
                            <div class="text-sm text-[#2B2C30B2] mt-1 line-clamp-1">{{ tpl.subtitle }}</div>
                        </div>
                    </button>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" @click="close">Cancel</Button>
                    <Button varaint="primary" class="px-4" :disabled="!chosenTemplate" @click="submitTemplate">{{
                        creatingSheet ? 'Adding...' : 'Add board' }}</Button>
                </div>
            </section>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import Button from '../../../components/ui/Button.vue'
import SwitchTab from '../../../components/ui/SwitchTab.vue';
// import IconPicker from '../components/IconPicker.vue';
import { useCreateWorkspaceSheet } from '../../../queries/useSheets';
import { useRoute } from 'vue-router';
import { useQueryClient } from '@tanstack/vue-query';
import { useOpenAIGeneration } from '../../../queries/useOpenAIGeneration';
import { extractJSONFromResponse } from '../../../utilities/extractJson';
import { useRouteIds } from '../../../composables/useQueryParams';
import IconPicker from '../components/IconPicker.vue';
const route = useRoute();
const queryClient = useQueryClient()
const { workspaceId, moduleId } = useRouteIds()
type IconPrefix = 'fa';
type IconRef = { prefix: IconPrefix; iconName: string }

const form = ref<{ title: string, description: string, icon: IconRef | null }>({ title: '', description: '', icon: null })
const { mutate: createSheet, isPending: creatingSheet } = useCreateWorkspaceSheet({
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['sheets'] })
        close()
    }
})
const props = defineProps<{ modelValue: boolean }>()
// change your emit typing
const emit = defineEmits<{
    (e: 'update:modelValue', v: boolean): void
    (e: 'submit:manual', payload: {
        title: string
        description: string
        icon?: string // keep as string
    }): void
    (e: 'submit:ai', payload: { prompt: string }): void
    (e: 'submit:template', payload: { id: string }): void
}>()

// function serializeIcon(i: IconRef | null | undefined) {
//     return i ? `${i.prefix}:${i.iconName}` : undefined
// }

function submitManual() {
    createSheet(
        {
            icon: form.value.icon,
            variables: { 'sheet-title': form.value.title, 'sheet-description': form.value.description },
            is_ai_generated: false,
            workspace_id: workspaceId.value,
            workspace_module_id: moduleId.value,
        }
    )
    // emit('submit:manual', {
    //     title,
    //     description,
    //     icon: serializeIcon(icon)
    // })
}

const model = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit('update:modelValue', v)
})

function close() {
    form.value = { title: "", description: "", icon: null };
    model.value = false
}

const tabs = [
    { label: 'Manual', value: 'manual' },
    { label: 'Generate with AI', value: 'ai' },
    { label: 'Templates', value: 'templates' }
]

type Tab = typeof tabs[number]['value']
const currentTab = ref<Tab>('manual')

// Manual

// function openIconLibrary() { /* open your icon picker */ }
// function submitManual() { emit('submit:manual', { ...form.value }) }

// AI
const aiPrompt = ref('')
const examples = [
    "Generate a task board for an Uber-like app with columns for development, testing, and deployment.",
    "Create a product board for an e-commerce platform with vendor, inventory, and customer sections.",
    "Design a project board for a Notion-like tool with team collaboration features."
]
// AI generation API
const { mutate: generate } = useOpenAIGeneration({
    onSuccess: (data: any) => {

        const payload = extractJSONFromResponse(data)
        createSheet(
            {
                sheets: [{
                    ...payload,
                    is_ai_generated: false,
                }],
                workspace_id: route.params.id,
                workspace_module: "product",
            }
        )

    },
    onError: (_: any) => {
        console.error("Error generating AI data:", _);
    },
});
function generateBoard() {
    const prompt = 'i need response in below json format { title:string , description:string , icon:{prefix : string from fas || far || fab , iconName:string from fontawsome free regular icons}} '
    generate(prompt)
}

// Templates
type Template = { id: string; title: string; subtitle: string; cover: string; tags: string[] }
const templates = ref<Template[]>([
    { id: 'concept', title: 'Product Concept', subtitle: 'Early‑stage product or feature ideas.', cover: '/covers/concept.jpg', tags: ['Experience Design', 'Development'] },
    { id: 'inspo', title: 'Design Inspiration', subtitle: 'UI/UX samples and creative references.', cover: '/covers/inspo.jpg', tags: ['Experience Design'] },
    { id: 'launch', title: 'Launch Prep', subtitle: 'Tasks and assets for go‑live.', cover: '/covers/launch.jpg', tags: ['Project Management', 'Marketing'] }
])

const search = ref('')
const tags = ref<{ name: string; count?: number }[]>([
    { name: 'Experience Design', count: 24 },
    { name: 'Development', count: 6 },
    { name: 'Marketing', count: 5 },
    { name: 'Project Management', count: 6 }
])
const activeTags = ref(new Set<string>())
function toggleTag(t: string) { activeTags.value.has(t) ? activeTags.value.delete(t) : activeTags.value.add(t) }

const filteredTemplates = computed(() =>
    templates.value.filter(t =>
        (!search.value || t.title.toLowerCase().includes(search.value.toLowerCase())) &&
        (activeTags.value.size === 0 || t.tags.some(tag => activeTags.value.has(tag)))
    )
)

const chosenTemplate = ref<Template | null>(null)
function chooseTemplate(tpl: Template) { chosenTemplate.value = tpl }
function submitTemplate() { if (chosenTemplate.value) emit('submit:template', { id: chosenTemplate.value.id }) }
</script>

<style scoped>
/* optional: focus states etc. */
</style>