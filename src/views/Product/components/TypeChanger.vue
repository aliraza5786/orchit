<template>
    <div ref="root" class="relative inline-block text-left ">
        <!-- Trigger pill -->
        <button type="button"
            class="inline-flex !text-text-primary max-w-50 line-clamp-1 text-[10px] items-center gap-2 rounded-full px-3 py-1  focus:outline-none  hover:opacity-90 bg-bg-body cursor-pointer"
            :aria-expanded="open ? 'true' : 'false'" @click="toggle" :disabled="disabled">
            <span class="truncate ">{{ labelFor(type) }}</span>

        </button>

        <!-- Menu -->
        <transition name="fade">
            <div v-if="open" role="menu"
                class="absolute z-50 mt-2 max-w-20  origin-top-left rounded-md border border-border shadow-2xl bg-bg-dropdown p-2  left-0"
                @keydown.esc.prevent.stop="close">
                <ul class="space-y-2 max-h-50 overflow-y-auto" ref="list">
                    <li v-for="(opt, idx) in data" :key="idx">
                        <button role="menuitemradio" :aria-checked="type === opt ? 'true' : 'false'"
                            class="flex !text-text-primary  w-full items-center justify-between cursor-pointer rounded px-1 py-1 text-[10px] gap-1 focus:outline-none focus:ring-2 hover:bg-bg-dropdown-menu-hover"
                            @click="select(opt)" @keydown.down.prevent="focusNext(idx + 1)"
                            @keydown.up.prevent="focusNext(idx - 1)">
                            <span class="rounded-full hover:bg-bg-dropdown-menu-hover  px-1   text-text-primary">{{
                                opt
                            }}</span>

                        </button>
                    </li>
                </ul>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
const props = withDefaults(defineProps<{
    default: string
    disabled?: boolean
    cardId: string | number
    data: any
}>(), {

    disabled: false
})

const type = ref<string>(props.default)
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const list = ref<HTMLElement | null>(null)

function labelFor(p: string) { if (props.data) return props.data.find((o: any) => o === p) }
function toggle() { if (!props.disabled) open.value = !open.value }
function close() { open.value = false }

function select(val: string) {
    type.value = val
    emits('onselect', val)
    close()
}


function focusNext(idx: number) {
    const items = list.value?.querySelectorAll('button[role="menuitemradio"]')
    if (!items?.length) return
    const max = items.length - 1
    const next = Math.max(0, Math.min(idx, max))
        ; (items[next] as HTMLElement).focus()
}

function onDocClick(e: MouseEvent) {
    if (!root.value) return
    if (!root.value.contains(e.target as Node)) close()
}

onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

const emits = defineEmits(['onselect'])
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity .12s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>