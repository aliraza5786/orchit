<template>

    <SidebarSkeleton v-if="isLoading" />
        <aside
            class="w-full sm:w-fit  bg-transparent z-1 min-w-[320px] sm:min-w-[36px] px-2 max-h-full h-[70px] sm:h-full flex flex-row  sm:flex-col   gap-1 pt-2.5 sm:pt-0 pb-2.5 bottom-0 fixed sm:static">

            <div class=" text-center ">
                <SideItem label="Peak" :to="`/workspace/peak/${workspaceId}/${workspace?.job_id ? workspace?.job_id : ''}`" key="peak" id="peak"
                    :icon="{
                        prefix: 'fa-regular',
                        iconName: 'fa-home'
                    }" />
            </div>
            <div class=" text-center ">
                <SideItem label="People" :to="`/workspace/people/${workspaceId}`" key="people" id="people" :icon="{
                    prefix: 'fa-regular',
                    iconName: 'fa-users'
                }" />
            </div>
            <div class=" text-center ">
                <SideItem label="Process" :to="`/workspace/process/${workspaceId}`" key="process" id="process" :icon="{
                    prefix: 'fa-regular',
                    iconName: 'fa-diagram-project'
                }" />
            </div>

        <div class="flex  flex-col gap-1 max-md:flex-row pin_task ">
            <SideItem v-for="(item, index) in workspace.modules" :key="index" :id="item._id"
                :label="item.variables['module-title']"
                :to="`/${item?.variables['module-title'].toLowerCase() == 'pin' ? 'workspace/pin' : 'workspace'}/${workspaceId}/${item._id}`"
                :icon="item?.variables['module-icon']" />
        </div>
        <div class="  text-center  flex-col flex gap-1 ">
            <SideItem label="Plan" :to="`/workspace/plan/${workspaceId}`" key="plan" id="plan" :icon="{
                prefix: 'fa-regular',
                iconName: 'fa-brain'
            }" />
        </div>


            <!-- Draggable Navigation Items -->
            <!-- <Draggable v-model="modules" item-key="label"
            class="flex-grow overflow-y-auto w-full space-y-1 transition-all text-center" handle=".drag-handle"
            animation="400" drag-class="drag" ghost-class="ghost">
            <template #item="{ element }">
                <div>
                    <SideItem :id="element._id" :label="element.title" :to="`/workspace/${workspace_id}/${element._id}`"
                        :icon="element?.icon" />

                </div>
            </template>
</Draggable> -->

            <!-- Static More Item -->
            <div class="  hidden sm:block text-center ">
                <SideItem id="more" label="Add" :to="`/workspace/more/${workspaceId}`" :icon="{
                    prefix: 'fa-solid',
                    iconName: 'fa-plus'
                }" />

            </div>
        </aside>
    
</template>


<script setup lang="ts">
import { ref, watch } from 'vue'
import SideItem from './SideItem.vue';
import { useRouteIds } from '../../../composables/useQueryParams';
const { workspaceId, jobId } = useRouteIds()
const props = defineProps<{ workspace: { modules: any }, isLoading: boolean }>()
const modules = ref([]);
watch(() => props.workspace, (newWorkspace) => {
    if (!newWorkspace) {
        return;
    }
    modules.value = newWorkspace.modules;
}, { deep: true });

</script>

<style scoped>
.drag>div {
    transform: rotate(5deg);
}

.ghost {
    background-color: rgba(211, 211, 211, 0.775);
    border-radius: 6px;
}

.ghost>* {
    visibility: hidden;
}

@media(max-width:639px){
    aside{
        justify-content: center;
        gap: 8px;
    }
    .pin_task{
        gap: 8px;
    }
}
</style>