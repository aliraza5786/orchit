<template>
    <div class="w-full text-text-primary  bg-bg-body ">
        <div class="max-w-[1440px] w-full mx-auto md:px-15 md:py-20 px-5 py-10  ">
            <div class="flex justify-between items-center flex-wrap gap-5">
                <div class="flex flex-col gap-2 max-md:gap-1 ">
                    <h1 class="text-2xl font-medium text-text-primary ">Welcome to Orchit AI!</h1>
                    <p class="text-sm text-text-secondary">Create, organize, and collaborate seamlessly.
                    </p>
                </div>
                <dv class="flex gap-3 items-center">

                    <RouterLink to="/create-workspace">
                        <Button variant="primary">
                            Create a workspace
                        </Button>
                    </RouterLink>
                </dv>
            </div>
            <!-- <h2 class="text-xl font-medium text-text-primary  mt-10">Create New</h2>
            <div class="flex gap-4 mt-4 overflow-x-auto">
                <RouterLink to="/create-workspace">
                    <div class="flex flex-col gap-2">
                        <div class="bg-bg-card  p-6 rounded-lg w-37.5 h-39.5 flex items-center justify-center">
                            <Plus />

                        </div>
                        <div class="flex flex-col gap-1">
                            <h1 class="text-sm font-medium text-text-primary "> Blank project</h1>
                            <p class="text-xs text-text-secondary  ">Start from scratch</p>
                        </div>
                    </div>
                </RouterLink>

                <div v-for="template in templates" :key="template.id" class="flex flex-col gap-2">
                    <div class="bg-bg-card  p-6 rounded-lg w-37.5 h-39.5 flex items-center justify-center">
                        <img :src="template.icon" alt="">
                    </div>
                    <div class="flex flex-col gap-1">
                        <h1 class="text-sm font-medium text-text-primary "> {{ template.name }}</h1>
                        <p class="text-xs text-text-secondary  text-secondary"> {{ template.name }}</p>
                    </div>
                </div>
            </div> -->
            <div class="flex justify-between items-center mt-21 mb-8">
                <h2 class="text-xl font-medium text-text-primary  ">All Workspaces</h2>
                <div class="flex items-center gap-3">
                    <button class="cursor-pointer aspect-square w-8" @click="currentView = 'list'"
                        :class="{ 'text-accent bg-accent-text p-1 rounded-md': currentView === 'list' }">
                        <i class="fa-solid fa-align-left"></i>
                    </button>
                    <button class=" cursor-pointer aspect-square w-8" @click="() => currentView = 'gallery'"
                        :class="{ 'text-accent bg-accent-text p-1 rounded-md': currentView === 'gallery' }">
                        <i class="fa-solid fa-grid-2"></i>
                    </button>
                    <!-- <button class=" cursor-pointer  aspect-square w-8" @click="() => currentView = 'grid'"
                        :class="{ 'text-accent bg-accent-text p-1 rounded-md': currentView === 'grid' }">
                        <i class="fa-solid fa-list-timeline"></i>

                    </button> -->
                </div>
            </div>

            <!-- table list view  -->
            <div v-if="data && data?.length == 0"
                class="flex py-10 justify-center items-center text-sm text-text-secondary">No Workspace</div>
            <WorkspaceListTable v-else-if="currentView === 'list'" :data="data" :isPending="isPending" />
            <ProjectGallery :projects="data || []" :loading="isPending" v-else-if="currentView === 'gallery'" />
            <!-- <StatusTable :columns="columns2" :rows="data || []" :total="data ? data.length : 0" v-model:page="page"
                v-model:pageSize="pageSize" :loading="isPending"
                @page-change="({ page, pageSize }) => fetchPage(page, pageSize)" v-else-if="currentView === 'grid'" /> -->
        </div>
    </div>
</template>
<script setup lang="ts">
import Button from "../../components/ui/Button.vue";
// import eduIcon from "../../assets/icons/education.svg";
// import businessIcon from "../../assets/icons/business.svg";
// import intertainmentIcon from "../../assets/icons/entertainment.svg";
// import financeIcon from "../../assets/icons/finance.svg";
// import medicalIcon from "../../assets/icons/medical.svg";
// import drinkIcon from "../../assets/icons/drink.svg";
// import gymIcon from "../../assets/icons/gym.svg";
import { ref } from 'vue'
import ProjectGallery from "../../components/ui/ProjectGallery.vue";
import StatusTable from "../../components/ui/StatusTable.vue";
// import Plus from "../../assets/IconTemplates/plus.vue";
import { useWorkspaces } from "../../queries/useWorkspace";
import WorkspaceListTable from "./components/WorkspaceListTable.vue";
const columns2 = ['RND', 'Designing', 'Design Review', 'Spec Doc', 'Development', 'QA', 'Content']
const { data, isPending } = useWorkspaces()
const page = ref(1);
const pageSize = ref();
const fetchPage = (page: any, pageSize: any) => {
    page.value = page;
    pageSize.value = pageSize;
}
const currentView = ref<'list' | 'grid' | 'gallery' | 'timeline'>('list')
// const templates = [
//     {
//         id: 1,
//         name: "Business",
//         icon: businessIcon
//     },
//     {
//         id: 2,
//         name: "Education",
//         icon: eduIcon
//     },
//     {
//         id: 3,
//         name: "Entertainment",
//         icon: intertainmentIcon
//     },
//     {
//         id: 4,
//         name: "Finance",
//         icon: financeIcon
//     }
//     ,
//     {
//         id: 5,
//         name: "Medical",
//         icon: medicalIcon
//     }
//     ,
//     {
//         id: 6,
//         name: "Food & Drink",
//         icon: drinkIcon
//     }
//     ,
//     {
//         id: 7,
//         name: "health & fitness",
//         icon: gymIcon
//     }

// ]

</script>