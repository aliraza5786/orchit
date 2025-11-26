<template>
    <div v-for="(item, index) in columns" :key="index"
        class="flex bg-bg-body flex-col min-w-[300px] h-[600px] overflow-y-auto w-80 rounded-lg transition-all duration-200">

        <!-- Column header -->
        <div class="flex sticky top-0 z-[1] bg-bg-body  items-center justify-between w-full p-4 border-b border-border cursor-grab">
            <div class="flex items-center gap-2 flex-auto max-w-[80%]">

                <!-- Title -->
                <button
                    class="font-semibold overflow-ellipsis line-clamp-1 text-nowrap text-foreground px-1 py-0.5 rounded hover:bg-bg-card focus:outline-none focus:ring-1 focus:ring-border cursor-text"
                    title="Click to rename">
                    {{ item.title || 'Untitled' }}
                </button>

                <!-- Cards count -->
                <span
                    class="text-xs bg-bg-card aspect-square flex justify-center items-center text-muted-foreground p-1 min-w-6 rounded-full">
                    {{ item.cards ? item.cards.length : 0 }}
                </span>

            </div>
        </div>
        <div class=" p-4 space-y-2">

            <KanbanTicket :footer="true" v-for="(c, index) in item?.cards" :key="`card-${index}`" @select="() => {
                // selectCardHandler(ticket)
            }" :ticket="c"></KanbanTicket>

           
        </div>

    </div>
   
</template>

<script setup lang="ts">
import KanbanTicket from '../../../components/feature/kanban/KanbanTicket.vue';
defineProps<{
    columns: Array<{
        title: string,
        cards?: Array<any>
    }>
}>()
</script>