<template>
    <div class="relative inline-block text-left" ref="wrapperRef">
        <button @click="toggle" ref="triggerRef" class="focus:outline-none">
            <slot name="trigger">
                <span class="w-5 h-5 inline-block bg-bg-surface"></span>
            </slot>
        </button>

        <!-- ── Main dropdown ─ teleported so it escapes overflow:hidden ── -->
        <Teleport to="body">
            <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
            >
                <div
                    v-if="open"
                    ref="menuRef"
                    class="fixed min-w-[160px] rounded-[6px] bg-bg-dropdown shadow-xl border border-border py-1 z-[9998]"
                    :style="menuStyle"
                    @click.stop
                >
                    <ul class="py-1 text-sm text-text-secondary">
                        <li
                            v-for="(item, index) in items"
                            :key="index"
                            class="relative"
                            :ref="(el) => setItemRef(el as HTMLElement, index)"
                            @mouseenter="openSubmenu(index)"
                            @mouseleave="closeSubmenuDelayed"
                        >
                            <!-- Item with children (submenu trigger) -->
                            <div
                                v-if="item.children && item.children.length"
                                class="flex items-center justify-between gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer transition-all duration-100"
                                :class="[
                                    item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-text-primary hover:bg-bg-dropdown-menu-hover',
                                    activeSubmenu === index ? 'bg-bg-dropdown-menu-hover' : ''
                                ]"
                            >
                                <div class="flex items-center gap-2">
                                    <i v-if="item.icon" :class="`${item?.icon?.prefix} ${item?.icon?.iconName} text-xs`"></i>
                                    <span>{{ item.label }}</span>
                                </div>
                                <i class="fa-solid fa-chevron-right text-[9px] text-text-secondary/70"></i>
                            </div>

                            <!-- Regular item (no children) -->
                            <div
                                v-else
                                @click="select(item)"
                                class="flex items-center gap-2 px-2.5 py-2 text-xs font-medium transition-all duration-100"
                                :class="[
                                    disabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'cursor-pointer',
                                    item.danger
                                        ? 'text-red-400 hover:bg-red-500/10'
                                        : 'text-text-primary hover:bg-bg-dropdown-menu-hover'
                                ]"
                            >
                                <i v-if="item.icon" :class="`${item?.icon?.prefix} ${item?.icon?.iconName} text-xs`"></i>
                                <span>{{ item.label }}</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </transition>
        </Teleport>

        <!-- ── Submenu ─ teleported so it escapes overflow:hidden ── -->
        <Teleport to="body">
            <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="opacity-100 scale-100"
                leave-to-class="opacity-0 scale-95"
            >
                <div
                    v-if="activeSubmenu !== null && items[activeSubmenu]?.children?.length"
                    ref="submenuRef"
                    class="fixed min-w-[140px] rounded-[6px] bg-bg-dropdown border border-border shadow-2xl py-1 z-[9999]"
                    :style="submenuStyle"
                    @mouseenter="cancelCloseSubmenu"
                    @mouseleave="closeSubmenuDelayed"
                    @click.stop
                >
                    <ul class="py-1">
                        <li
                            v-for="(child, ci) in items[activeSubmenu!].children"
                            :key="ci"
                            @click.stop="selectChild(child)"
                            class="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer transition-all duration-100"
                            :class="child.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-text-primary hover:bg-bg-dropdown-menu-hover'"
                        >
                            <i v-if="child.icon" :class="`${child?.icon?.prefix || 'fa-solid'} ${child?.icon?.iconName || child.icon} text-xs`"></i>
                            <span>{{ child.label }}</span>
                        </li>
                    </ul>
                </div>
            </transition>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onUnmounted, type CSSProperties } from 'vue'
import { onClickOutside } from '@vueuse/core'

const { items, disabled } = defineProps<{
    items: {
        label: string
        icon?: any
        danger?: boolean
        action?: () => void
        children?: {
            label: string
            icon?: any
            danger?: boolean
            action?: () => void
        }[]
    }[]
    disabled?: boolean
}>()

const emit = defineEmits<{
    (e: 'openChange', value: boolean): void
}>()

const open = ref(false)
const activeSubmenu = ref<number | null>(null)

let submenuCloseTimer: ReturnType<typeof setTimeout> | null = null
let outsideTimer: ReturnType<typeof setTimeout> | null = null

// DOM refs
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const submenuRef = ref<HTMLElement | null>(null)
const wrapperRef = ref<HTMLElement | null>(null)
const itemRefs = ref<(HTMLElement | null)[]>([])

const menuStyle = ref<CSSProperties>({})
const submenuStyle = ref<CSSProperties>({})

function setItemRef(el: HTMLElement | null, index: number) {
    itemRefs.value[index] = el
}

function isPointOver(x: number, y: number, el: HTMLElement | null): boolean {
    if (!el) return false

    const r = el.getBoundingClientRect()

    return (
        x >= r.left &&
        x <= r.right &&
        y >= r.top &&
        y <= r.bottom
    )
}

function onDocumentMouseMove(e: MouseEvent) {
    const x = e.clientX
    const y = e.clientY

    const over =
        isPointOver(x, y, wrapperRef.value) ||
        isPointOver(x, y, menuRef.value) ||
        isPointOver(x, y, submenuRef.value)

    if (!over) {
        if (!outsideTimer) {
            outsideTimer = setTimeout(closeAll, 250)
        }
    } else {
        if (outsideTimer) {
            clearTimeout(outsideTimer)
            outsideTimer = null
        }
    }
}

function startOutsideMonitor() {
    document.addEventListener('mousemove', onDocumentMouseMove)
}

function stopOutsideMonitor() {
    document.removeEventListener('mousemove', onDocumentMouseMove)

    if (outsideTimer) {
        clearTimeout(outsideTimer)
        outsideTimer = null
    }
}

watch(open, (isOpen) => {
    if (isOpen) {
        nextTick(startOutsideMonitor)
    } else {
        stopOutsideMonitor()
    }
})

onUnmounted(stopOutsideMonitor)

function computeMenuPosition() {
    if (!triggerRef.value) return

    const rect = triggerRef.value.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
        menuStyle.value = {
            top: `${rect.bottom + 6}px`,
            right: `${window.innerWidth - rect.right}px`,
        }
    } else {
        menuStyle.value = {
            bottom: `${window.innerHeight - rect.top + 6}px`,
            right: `${window.innerWidth - rect.right}px`,
        }
    }
}

function computeSubmenuPosition(index: number) {
    const itemEl = itemRefs.value[index]

    if (!itemEl) return

    const rect = itemEl.getBoundingClientRect()
    const spaceRight = window.innerWidth - rect.right

    if (spaceRight >= 160) {
        submenuStyle.value = {
            top: `${rect.top}px`,
            left: `${rect.right + 2}px`,
        }
    } else {
        submenuStyle.value = {
            top: `${rect.top}px`,
            right: `${window.innerWidth - rect.left + 2}px`,
        }
    }
}

function closeAll() {
    open.value = false
    activeSubmenu.value = null
    emit('openChange', false)
}

async function toggle() {
    open.value = !open.value
    activeSubmenu.value = null

    emit('openChange', open.value)

    if (open.value) {
        await nextTick()
        computeMenuPosition()
    }
}

function select(item: { action?: () => void }) {
    if (disabled) return

    item.action?.()
    closeAll()
}

function selectChild(child: { action?: () => void }) {
    if (disabled) return

    child.action?.()
    closeAll()
}

function openSubmenu(index: number) {
    if (disabled) return

    cancelCloseSubmenu()
    activeSubmenu.value = index

    nextTick(() => computeSubmenuPosition(index))
}

function closeSubmenuDelayed() {
    submenuCloseTimer = setTimeout(() => {
        activeSubmenu.value = null
    }, 150)
}

function cancelCloseSubmenu() {
    if (submenuCloseTimer) {
        clearTimeout(submenuCloseTimer)
        submenuCloseTimer = null
    }
}

onClickOutside(
    wrapperRef,
    () => {
        closeAll()
    },
    {
        ignore: [menuRef, submenuRef],
    }
)
</script>