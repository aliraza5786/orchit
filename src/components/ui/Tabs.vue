<template>
    <div class="w-full relative h-full">
        <!-- Tab Headers -->
        <div ref="tabList"
            class="flex sticky top-[-25px] gap-6 border-b border-border bg-bg-body z-10 text-sm font-medium  ">
            <button v-for="(tab, index) in tabs" :key="tab" @click="selectTab(index)" ref="tabRefs"
                class="py-4 px-6 relative cursor-pointer"
                :class="selected === index ? 'text-text-primary' : 'text-text-secondary -500'">
                {{ tab }}
            </button>

            <!-- Dynamic Active Border -->
            <div class="absolute bottom-0 h-0.5 bg-black transition-all duration-300 ease-in-out"
                :style="indicatorStyle" />
        </div>

        <!-- Tab Content -->
        <div class="mt-4 overflow-hidden relative h-[90%]">
            <div class="flex transition-transform duration-300 ease-in-out" :style="{
                width: tabs.length * 100 + '%',
                transform: `translateX(-${selected * (100 / tabs.length)}%)`
            }">
                <div v-for="(tab) in tabs" :key="tab" class="px-2 w-[50%] shrink-0 flex-grow h-[500px]">
                    <slot :name="tab"></slot>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'

const props = defineProps<{
    tabs: string[]
    defaultTab?: any
}>()

const selected = ref(props?.defaultTab ?? 0)
const tabRefs = ref<HTMLElement[]>([])
const tabList = ref<HTMLElement | null>(null)

const indicatorStyle = ref({
    width: '0px',
    transform: 'translateX(0px)',
})

function selectTab(index: number) {
    selected.value = index
    updateIndicator()
}

function updateIndicator() {
    nextTick(() => {
        const tab = tabRefs.value[selected.value]
        if (tab && tabList.value) {
            const offset = tab.offsetLeft
            const width = tab.offsetWidth
            indicatorStyle.value = {
                width: `${width}px`,
                transform: `translateX(${offset}px)`
            }
        }
    })
}

onMounted(() => {
    updateIndicator()
})

watch(selected, updateIndicator)

const gridColsClass = computed(() => {
    return {
        1: 'grid-cols-1',
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
        5: 'grid-cols-5',
    }[props.tabs.length] || 'grid-cols-1'
})

</script>