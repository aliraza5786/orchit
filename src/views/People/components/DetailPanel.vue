<template>
    <div
        :class="`max-w-[358px] bg-bg-card  rounded-lg overflow-y-auto overflow-x-hidden relative ${showPanel ? '!translate-x-0 w-full h-full min-w-[350px] overflow-y-auto' : '!translate-x-100 w-0 h-0'} transition-all`">
        <!-- Header -->
        <div class="py-4 flex justify-between items-center border-b border-border px-5 sticky top-0  bg-bg-card z-1">
            <h5 class="text-[16px] font-medium">Profile</h5>
            <i class=" cursor-pointer text-text-primary fa-solid fa-close" @click="() => { $emit('close') }"></i>

        </div>

        <!-- Body -->
        <div class="py-4 px-5">

            <div class="bg-bg-surface/50 p-2 rounded-lg flex gap-2">
                <img src="../../../assets/global/Avatar.svg" alt="" class=" w-12 h-12 rounded-full">
                <div>
                    <h1 class="text-base font-medium text-text-primary cursor-pointer">{{ props.details.name ??
                        props.details.title }}</h1>
                </div>
            </div>

            <div class="flex flex-col mt-2">
                <h1 class="text-base font-medium text-text-primary cursor-pointer">
                    Task Progress
                </h1>
                <ProgressBar class='mt-2' :progress="props?.details?.assigned_cards_count" fillColor="bg-accent "
                    :indeterminate="true" />
                <span class="text-sm text-text-secondary mt-2">Completed 10 tasks out of {{
                    props?.details?.assigned_cards_count }}</span>
            </div>
            <!-- Title -->
            <div class="mb-2 capitalize">
                <template v-if="editingTitle">
                    <input ref="titleInput" v-model="localTitle" @blur="saveTitle" @keydown.enter.prevent="saveTitle"
                        @keydown.esc.prevent="cancelEdit"
                        class="border border-border rounded px-2 py-1 w-full text-xl font-medium" type="text" />
                </template>
                <template v-else>
                    <h1 class="text-xl font-medium text-text-primary cursor-pointer" @click="editTitle">
                        {{ localTitle }}
                    </h1>
                </template>
            </div>

            <div class="grid grid-cols-2 capitalize items-center gap-2 text-sm mt-4">
              <div v-for="(item, index) in peopleVar" :key="index">
                {{ item.title }}
                <TypeChanger :key="index" @click.stop :default="item?.value" :data="item?.data" :cardId="details?._id"
            @onselect="(val: any) => 0" />

              </div>
            </div>
            <span class="text-base text-text-primary">Worked On</span>
            <ul v-if="details?.assigned_cards?.length > 0" class="border border-border space-y-1 p-2.5 mt-1 rounded-lg">
                <li class="p-2 " v-for="(item, index) in details?.assigned_cards" :key="index">
                    <h1 class="text-sm text-text-primary">{{ item?.title }}</h1>
                    <p class="text-xs text-text-secondary">Design Project . Olivia Updated on April 9, 2025</p>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMoveCard } from '../../../queries/useSheets'
import { nextTick } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import ProgressBar from '../../../components/ui/ProgressBar.vue'
import { usePeopleVar } from '../../../queries/usePeople'
import TypeChanger from '../../Product/components/TypeChanger.vue'
const { data: peopleVar } = usePeopleVar()

const props = defineProps({
    showPanel: { type: Boolean, default: true },
    details: { type: Object as () => any, default: () => ({}) }
})
const editingTitle = ref(false)
const localTitle = ref(props.details['card-title'] ?? '')
const lane = ref(props.details['workspace_lane_id'] ?? '')

// Watch for prop updates if details change
watch(() => props.details['card-title'], (val) => {
    localTitle.value = val
    lane.value = props.details['workspace_lane_id']
})


const description = ref(props.details['card-description'])
watch(() => props.details, () => {
    description.value = props.details['card-description'];
})
const emit = defineEmits(['close', 'update:details', 'comment:post', 'priority:change'])


const titleInput = ref<HTMLInputElement | null>(null)

function editTitle() {
    editingTitle.value = true
    nextTick(() => {
        titleInput.value?.focus()
        titleInput.value?.select()
    })
}

function saveTitle() {
    if (!localTitle.value.trim()) {
        localTitle.value = props.details['card-title'] ?? ''
    }

    // Update the backend
    moveCard.mutate({
        card_id: props.details._id,
        variables: {
            'card-title': localTitle.value.trim(),

        }
    })

    editingTitle.value = false
}

function cancelEdit() {
    localTitle.value = props.details['card-title'] ?? ''
    editingTitle.value = false
}


const form = ref<any>({ startDate: props.details['start-date'], endDate: props.details['end-date'] })

const startDate = computed(() => props.details['start-date'])
watch(startDate, (newVal) => {
    form.value = {
        ...form.value, startDate: newVal
    }
})

const queryClient = useQueryClient()
const moveCard = useMoveCard({
    onSuccess: () => {
        queryClient.invalidateQueries({
            queryKey: ['get-sheets']
        })
        queryClient.invalidateQueries({
            queryKey: ['sheet-list']
        })
        queryClient.invalidateQueries({
            queryKey: ['roles']
        })

    }
})

</script>

<style scoped>
/* simple fade for the dropdowns already defined elsewhere */
</style>