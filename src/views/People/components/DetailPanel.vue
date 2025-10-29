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
            <div class="bg-bg-surface/50 p-2 rounded-lg flex gap-2 items-center">
                <img v-if="details?.avatar" :src="details?.avatar" class="w-10 h-10 rounded-full" alt="avartar">

                <div v-else class="min-w-10 max-h-10 aspect-square bg-bg-surface flex justify-center items-center rounded-full "
                    :style="{ backgroundColor: details?.name ? avatarColor({  email: details?.email }) : '' }">
                    {{ getInitials(details?.name) }} <i v-if="!details?.name" class="fa-solid fa-user text-white"></i>
                </div>
                <div>
                    <h1 class="text-base font-medium text-text-primary cursor-pointer">{{ details.name ??
                        details.title }}</h1>
                    <p class="text-sm  font-medium text-text-secondary cursor-pointer">{{ details.email }}</p>
                </div>
            </div>
            <SwitchTab v-model="activeTab" class="my-2" :options="tabOptions" />

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
            <section v-if="activeTab == 'details'">

                <div class="mb-2 capitalize">
                    <template v-if="editingTitle">
                        <input ref="titleInput" v-model="localTitle" @blur="saveTitle"
                            @keydown.enter.prevent="saveTitle" @keydown.esc.prevent="cancelEdit"
                            class="border border-border rounded px-2 py-1 w-full text-xl font-medium" type="text" />
                    </template>
                    <template v-else>
                        <h1 class="text-xl font-medium text-text-primary cursor-pointer" @click="editTitle">
                            {{ localTitle }}
                        </h1>
                    </template>
                </div>

                <div>
                    <div v-for="(item, index) in peopleVar" :key="index"
                        class="grid grid-cols-2 capitalize items-center gap-2 text-sm mt-4">
                        {{ item.title }}
                        <BaseSelectField size="sm" :model-value="localVarValues[item.slug]" :key="index"
                            :placeholder="` ${item.title}`" @click.stop :default="item?.value ?? `select ${item.title}`"
                            :options="item?.data.map((e: any) => ({ _id: e, title: e }))" :cardId="details?._id"
                            @update:modelValue="(val: any) => handleSelect(val, item._id)" />

                    </div>
                </div>
            </section>


            <section v-if="activeTab == 'tasks'" class="mt-3">
                <span class="text-base text-text-primary">Worked On</span>
                <ul v-if="details?.assigned_cards?.length > 0"
                    class="border border-border space-y-1 p-2.5 mt-1 rounded-lg">
                    <li class="p-2 " v-for="(item, index) in details?.assigned_cards" :key="index">
                        <h1 class="text-sm text-text-primary">{{ item?.title }}</h1>
                        <p class="text-xs text-text-secondary">Design Project . Olivia Updated on April 9, 2025</p>
                    </li>
                </ul>
            </section>
            <section v-if="activeTab == 'history'" class="mt-3">
                <span class="text-base text-text-primary">history</span>
                <ul v-if="details?.assignment_history?.length > 0"
                    class="border border-border space-y-1 p-2.5 mt-1 rounded-lg">
                    <li class="p-2 " v-for="(item, index) in details?.assignment_history" :key="index">
                        <h1 class="text-sm text-text-primary">{{ item?.title }}</h1>
                        <p class="text-xs text-text-secondary">Design Project . Olivia Updated on April 9, 2025</p>
                    </li>
                </ul>
            </section>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useMoveCard } from '../../../queries/useSheets'
import { nextTick } from 'vue'
import { useQueryClient } from '@tanstack/vue-query'
import ProgressBar from '../../../components/ui/ProgressBar.vue'
import { usePeopleVar, useUpdateVar } from '../../../queries/usePeople'
// import TypeChanger from '../../Product/components/TypeChanger.vue'
import SwitchTab from '../../../components/ui/SwitchTab.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import { getInitials } from '../../../utilities'
import { avatarColor } from '../../../utilities/avatarColor'
const localVarValues = reactive({

})
const activeTab = ref<'details' | 'tasks' | 'history'>('details')
const tabOptions = [
    { label: 'Details', value: 'details' },
    { label: 'Tasks', value: 'tasks' },
    { label: 'History', value: 'history' },
]
const { data: peopleVar } = usePeopleVar()
const { mutate: UpdateVar } = useUpdateVar();
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
const handleSelect = (val: any, slug: any) => {
    // console.log(ticketID.value, '>>>');
    console.log(slug, 'slug', val);

    UpdateVar({
        id: props.details._id,
        payload: {
            "variable_values": [
                {
                    "module_variable_id": slug,
                    "value": val,
                }
            ]

        },
        // ariable_id: id,

    })
}
</script>

<style scoped>
/* simple fade for the dropdowns already defined elsewhere */
</style>