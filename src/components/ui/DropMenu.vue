<template>
    <div class="relative inline-block text-left" ref="dropdownRef">
        <button @click="toggle" class="focus:outline-none">
            <slot name="trigger">
                <span class="w-5 h-5 inline-block bg-bg-surface"></span>
            </slot>
        </button>

        <transition enter-active-class="transition ease-out duration-100" enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0" leave-active-class="transition ease-in duration-75"
            leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-1">
            <div v-if="open"
                class="absolute right-0 mt-2 w-40 origin-top-right rounded-lg bg-bg-dropdown  shadow-lg border-border border p-1 ring-opacity-5 z-50">
                <ul class="py-1 text-sm text-text-secondary ">
                    <li v-for="(item, index) in items" :key="index" @click="select(item)"
                        class="flex items-center gap-2 p-2 text-xs text-text-primary font-medium hover:bg-bg-dropdown-menu-hover cursor-pointer transition-all duration-100 rounded-lg">
                        <i v-if="item.icon"
                            :class="`${item?.icon?.prefix} ${item?.icon?.iconName} text-xs text-text-primary`"></i>
                        <span>{{ item.label }}</span>
                    </li>


                </ul>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

defineProps<{
    items: { label: string; icon?: any; action?: () => void }[]
}>()

const open = ref(false)
function toggle() {
    open.value = !open.value
}

function select(item: { action?: () => void }) {
    if (item.action) item.action()
    open.value = false
}

const dropdownRef = ref()
onClickOutside(dropdownRef, () => {
    open.value = false
})
</script>