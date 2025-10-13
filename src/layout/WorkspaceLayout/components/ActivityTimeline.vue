<template>
    <div class="space-y-6 mt-6 rounded-lg  max-w-md w-full">
        <div v-for="(group, index) in activityGroups" :key="index"
            class="bg-bg-body rounded-lg py-3 px-4 border border-border ">
            <h3 class="text-[16px] font-semibold text-text-primary mb-4">{{ group.label }}</h3>
            <div class="space-y-6 relative">
                <div v-for="(item, i) in group.items" :key="i" class="flex items-start gap-3 relative">
                    <!-- Line and dot -->
                    <img src="../../../assets/icons/activeLog.svg" alt="">

                    <!-- Time + Activity -->
                    <div class="flex-1">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-sm font-semibold text-text-primary">{{ item.time }}</p>
                                <div class="flex items-center gap-2 mt-1">
                                    <div
                                        class="w-[15px] h-[15px] rounded-full bg-pink-500 text-text-primary text-[9px] font-semibold flex items-center justify-center">
                                        {{ item.initial }}
                                    </div>
                                    <span class="text-xs text-text-secondary ">{{ item.message }}</span>
                                </div>
                            </div>
                            <div class="text-text-secondary hover:text-text-secondary  cursor-pointer">⋯</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface ActivityItem {
    time: string
    message: string
    initial: string
}

interface ActivityGroup {
    label: string
    items: ActivityItem[]
}

const activityGroups: ActivityGroup[] = [
    {
        label: 'Today',
        items: [
            { time: 'May 22, 12:10 PM', message: 'Waleed Orchit AI', initial: 'W' },
            { time: 'May 22, 1:15 PM', message: 'Sara Uploaded', initial: 'W' },
            { time: 'May 22, 2:30 PM', message: 'Alex Joined', initial: 'W' },
        ],
    },
    {
        label: 'Yesterday',
        items: [
            { time: 'May 22, 12:10 PM', message: 'Waleed Orchit AI', initial: 'W' },
            { time: 'May 22, 1:30 PM', message: 'Aisha Uploaded', initial: 'W' },
            { time: 'May 22, 2:45 PM', message: 'Jordan Liked', initial: 'W' },
            { time: 'May 22, 3:15 PM', message: 'Sarah Commented', initial: 'W' },
        ],
    },
    {
        label: 'Wednesday',
        items: [
            { time: 'May 22, 12:10 PM', message: 'Waleed Orchit AI', initial: 'W' },
            { time: 'May 22, 1:15 PM', message: 'Sara Uploaded', initial: 'W' },
            { time: 'May 22, 2:30 PM', message: 'Alex Joined', initial: 'W' },
            { time: 'May 22, 2:30 PM', message: 'Alex Joined', initial: 'W' },
        ],
    },
]
</script>