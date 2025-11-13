<template>
    <BaseModal v-model="model" size="lg">
        <!-- Header -->
        <div class="flex justify-between items-start px-6 border-b border-border pb-4">
            <h2 class="text-xl font-semibold">
                <!-- {{ sheet?._id ? -->
                Add New Module
                <!-- //   : 'Add a new Sheet' }} -->
            </h2>
        </div>

        <!-- Tabs -->
        <div class="px-6 pt-4 border-b border-border flex gap-6 text-sm font-medium">
            <button v-for="t in tabs" :key="t.value" @click="currentTab = t.value" class="pb-3 relative"
                :class="currentTab === t.value ? 'text-text-primary' : 'text-text-secondary'">
                {{ t.label }}

                <div v-if="currentTab === t.value" class="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></div>
            </button>
        </div>

        <!-- Body -->
        <div class="px-6 py-6 space-y-6">

            <!-- MANUAL TAB -->
            <section v-if="currentTab === 'manual'" class="space-y-4">
                <IconPicker v-model="form.icon" />

                <BaseTextField v-model="form.title" label="Module name" size="lg" placeholder="Module name"
                    :error="!!errors.title" :message="errors.title" />

                <BaseTextField v-model="form.description" label="Description" size="lg" textarea
                    placeholder="A short description" :error="!!errors.description" :message="errors.description" />

                <div class="flex justify-end gap-2 pt-2">
                    <button class="px-4 py-2 rounded-md text-sm text-text-secondary border"
                        @click="close">Cancel</button>
                    <Button class="px-4" @click="submitManual">
                        {{ creatingModule ? 'Saving...' : 'Save' }}
                    </Button>
                </div>
            </section>

            <!-- AI TAB -->
            <section v-else-if="currentTab === 'ai'" class="space-y-6">

                <!-- AI Input -->
                <div class="relative w-full">
                    <div
                        :class="`${isAiPending || isPending ? 'neon-flow-border' : ''} bg-bg-input flex h-[200px] p-4 rounded-2xl relative`">
                        <textarea v-if="!isRecording && !audioURL" v-model="description"
                            placeholder="Ask Orchit AI to create a sheet..."
                            class="w-full h-full resize-none outline-none bg-transparent text-sm" />

                        <!-- Record Button -->
                        <transition v-if="!description" name="fade-slide" appear>
                            <div class="absolute bottom-4 right-4">
                                <AudioRecorder v-model="description" v-model:isRecording="isRecording"
                                    v-model:hasAudio="audioURL" />
                            </div>
                        </transition>

                        <!-- Generate Button -->
                        <transition v-else name="rotate-fade" appear>
                            <div @click="handleGenerateSheet()"
                                class="absolute bottom-4 right-4 w-9 h-9 bg-accent rounded-md flex items-center justify-center cursor-pointer shadow">
                                <i class="text-white fa-solid fa-arrow-right"></i>
                            </div>
                        </transition>
                    </div>
                </div>

                <!-- Suggestions -->
                <!-- <p class="text-xs text-text-secondary text-center">Or try these examples:</p>
  
          <div class="flex gap-3 overflow-x-auto">
            <div v-if="isSuggestionPending" class="animate-pulse flex gap-3 w-full">
              <div v-for="n in 3" :key="n" class="h-20 w-48 bg-border/30 rounded-lg"></div>
            </div>
  
            <div v-else class="flex gap-3">
              <div
                v-for="s in suggestionData"
                :key="s.description"
                @click="() => typeEffect(s.description)"
                class="cursor-pointer border border-border/30 px-3 py-2 rounded-lg text-xs hover:border-accent transition"
              >
                {{ s.description }}
              </div>
            </div>
          </div> -->
            </section>

            <!-- TEMPLATES TAB -->
            <section v-else class="space-y-4">
                <input v-model="search" class="w-full border rounded-lg p-2 text-sm border-border"
                    placeholder="Search" />

                <div class="flex flex-wrap gap-2 text-xs">
                    <button v-for="tag in tags" :key="tag.name" class="px-3.5 py-1.5 rounded-md"
                        :class="activeTags.has(tag.name) ? 'bg-black text-white' : 'bg-bg-body text-text-secondary'"
                        @click="toggleTag(tag.name)">
                        {{ tag.name }}
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <button v-for="tpl in filteredTemplates" :key="tpl.id"
                        class="border border-border rounded-xl overflow-hidden text-left hover:shadow-sm"
                        @click="chooseTemplate(tpl)">
                        <img :src="tpl.cover" class="w-full h-36 object-cover" />
                        <div class="p-3 py-4">
                            <div class="text-base font-medium">{{ tpl.title }}</div>
                            <div class="text-sm opacity-75 mt-1 line-clamp-1">{{ tpl.subtitle }}</div>
                        </div>
                    </button>
                </div>

                <div class="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" @click="close">Cancel</Button>
                    <Button :disabled="!chosenTemplate" @click="submitTemplate">
                        {{ creatingModule ? 'Adding...' : 'Add board' }}
                    </Button>
                </div>
            </section>
        </div>
    </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import BaseModal from '../../../components/ui/BaseModal.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import Button from '../../../components/ui/Button.vue'
import AudioRecorder from '../../../views/CreateWorkspace/components/AudioRecorder.vue'

// import { useRoute } from 'vue-router'
import { useQueryClient } from '@tanstack/vue-query'
import { useRouteIds } from '../../../composables/useQueryParams'
// import { useOpenAIGeneration } from '../../../queries/useOpenAIGeneration'
// import { extractJSONFromResponse } from '../../../utilities/extractJson'
// import { useCreateWorkspaceSheet, useCreateWorkspaceSheetAI, useUpdateWorkspaceSheet } from '../../../queries/useSheets'
import IconPicker from '../../Product/components/IconPicker.vue'
import { useCreateModule, useCreateModuleAI } from '../../../queries/useMore'
// import { useSuggestions } from '../../../queries/useWorkspace'

const props = defineProps<{ modelValue: boolean }>()

const emit = defineEmits(['update:modelValue'])

const queryClient = useQueryClient()
const { workspaceId, moduleId } = useRouteIds()

const form = ref({ title: '', description: '', icon: null })
const errors = ref<{ title?: string; description?: string }>({})

function validateManual() {
    const next: any = {}
    if (!form.value.title.trim()) next.title = 'Please enter a sheet name.'
    if (!form.value.description.trim()) next.description = 'Please enter a description.'
    errors.value = next
    return Object.keys(next).length === 0
}

const { mutate: createModule, isPending: creatingModule } = useCreateModule({
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['workspaces'] })
        close()
    }
})

// const { mutate: updateSheet, isPending: isUpdating } = useUpdateWorkspaceSheet({
//     onSuccess: () => close()
// })

function submitManual() {
    if (!validateManual()) return

    // if (props.sheet?._id) {
    //     updateSheet({
    //         sheet_id: props.sheet._id,
    //         icon: form.value.icon,
    //         variables: {
    //             'sheet-title': form.value.title,
    //             'sheet-description': form.value.description
    //         },
    //         is_ai_generated: false,
    //         workspace_id: workspaceId.value,
    //         workspace_module_id: moduleId.value,
    //     })
    // } else {
    createModule({
        payload: {
            module: {
                icon: form.value.icon,
                variables: {
                    'module-title': form.value.title,
                    'module-description': form.value.description,
                    'module-icon': form.value.icon,

                },
                is_ai_generated: false,
            },
            workspace_id: workspaceId.value,
        }
    })
    // }
}

function close() {
    form.value = { title: '', description: '', icon: null }
    errors.value = {}
    model.value = false
}

const model = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
})

/* ----------------------------------
   AI CREATION
----------------------------------*/

const isRecording = ref(false)
const audioURL = ref<string | null>(null)
const description = ref('')
const isPending = ref(false)

// const { data: suggestionData, isPending: isSuggestionPending } = useSuggestions('sheet')

// function typeEffect(text: string) {
//     description.value = ''
//     text.split('').forEach((char, i) =>
//         setTimeout(() => (description.value += char), i * 18)
//     )
// }

const { mutate: generateAI, isPending: isAiPending } = useCreateModuleAI({
    onSuccess: () => {
        description.value = ''
        close();
        queryClient.invalidateQueries({ queryKey: ['workspaces'] })
        // const result: any = extractJSONFromResponse(data) ?? {}
        // createModule({
        //     payload: {
        //         ...data,
        //         workspace_id: workspaceId.value,
        //     }

        // })
        isPending.value = false
    },
    onError: () => { isPending.value = false }
})

function handleGenerateSheet() {
    if (!description.value.trim()) return
    isPending.value = true
    generateAI({
        payload: {

            idea: description.value,
            workspace_id: workspaceId.value
        }
    })
}

/* ----------------------------------
   TEMPLATES TAB
----------------------------------*/
const tabs = [
    { label: 'Manual', value: 'manual' },
    { label: 'Generate with AI', value: 'ai' },
    // { label: 'Templates', value: 'templates' }
]

const currentTab = ref('manual')

type Template = { id: string; title: string; subtitle: string; cover: string; tags: string[] }

const templates = ref<Template[]>([
    {
        id: 'concept',
        title: 'Product Concept',
        subtitle: 'Early stage ideation board.',
        cover: 'https://placehold.co/600x300',
        tags: ['Experience Design', 'Development']
    },
    {
        id: 'launch',
        title: 'Launch Prep',
        subtitle: 'Prepare assets for product launch.',
        cover: 'https://placehold.co/600x300',
        tags: ['Marketing', 'Project Management']
    }
])

const search = ref('')
const tags = ref([
    { name: 'Experience Design' },
    { name: 'Development' },
    { name: 'Marketing' },
    { name: 'Project Management' }
])
const activeTags = ref(new Set<string>())

function toggleTag(t: string) {
    activeTags.value.has(t) ? activeTags.value.delete(t) : activeTags.value.add(t)
}

const filteredTemplates = computed(() =>
    templates.value.filter(t =>
        (!search.value || t.title.toLowerCase().includes(search.value.toLowerCase())) &&
        (activeTags.value.size === 0 || t.tags.some(tag => activeTags.value.has(tag)))
    )
)

const chosenTemplate = ref<Template | null>(null)
function chooseTemplate(tpl: Template) { chosenTemplate.value = tpl }
function submitTemplate() {
    if (!chosenTemplate.value) return
    createModule({
        icon: null,
        variables: {
            'sheet-title': chosenTemplate.value.title,
            'sheet-description': chosenTemplate.value.subtitle
        },
        is_ai_generated: false,
        workspace_id: workspaceId.value,
        workspace_module_id: moduleId.value,
    })
}
</script>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition: opacity .4s, transform .4s;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.rotate-fade-enter-active,
.rotate-fade-leave-active {
    transition: opacity .4s, transform .4s;
}

.rotate-fade-enter-from,
.rotate-fade-leave-to {
    opacity: 0;
    transform: rotate(180deg);
}
</style>