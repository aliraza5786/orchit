<template>
    <div
        :class="`max-w-[358px]   bg-bg-card rounded-lg overflow-y-auto overflow-x-hidden relative ${workspaceStore.showProfilePanel ? '!translate-x-0 w-full h-full overflow-y-auto' : 'translate-x-100 w-0 h-0'} transition-all`">
        <div class="py-4 flex justify-between items-center border-b border-border px-5 sticky top-0 bg-bg-card  z-1">
            <h5 class="text-[16px] font-medium">Profile</h5>
            <img src="../../../assets/icons/cross.svg" alt="" class=" cursor-pointer "
                @click="workspaceStore.toggleProfilePanel">
        </div>
        <div class="py-4 px-5">
            <div class="space-y-4 border-b border-border pb-5.5">
                <div class="gap-3 flex  ">
                    <img src="../../../assets/temp/Avatar.svg" class="w-16 h-16 rounded-full" alt="">
                    <div class="flex flex-col gap-0.5 flex-auto">
                        <div class="flex justify-between w-full items-center">
                            <h5 class="text-base font-medium text-text-primary ">Olivia Rhye</h5>
                        </div>
                        <p class=" text-text-secondary text-sm">olivia@untitledui.com</p>
                        <h6 class="text-sm text-text-primary ">Product Designer</h6>
                    </div>
                </div>
                <Button variant="secondary" :block="true">
                    <div class="flex gap-2 items-center">
                       <i class="fa-regular fa-comment-dots"></i>  Message
                    </div>
                </Button>

            </div>
            <SwitchTab v-model="switchState"
                :options="[{ label: 'Activity', value: 'activity' }, { label: 'About', value: 'about' }]" />


            <div class=" pt-4 " v-if="switchState == 'activity'">
                <h5 class="text-sm font-medium text-text-primary  ">Task Progress</h5>
                <div class="flex text-sm gap-3 items-center py-2">
                    <ProgressBar fill-color="bg-bg-body" :progress="34" />
                    34%
                </div>
            </div>
            <div v-if="switchState == 'activity'"
                class="space-y-2 mt-2 bg-bg-card  py-3 px-2 border border-border rounded-lg overflow-y-auto ">
                <div v-for="ticket in tickets" :key="ticket.id" class="flex gap-2 items-start p-2.5  hover:bg-bg-surface rounded-md transition-all duration-75 ">
                    <!-- <img src="../../../assets/icons/tags.svg" alt=""> -->
                    <div class="space-y-2">
                        <h4 class="text-xs  text-text-primary ">{{ ticket.title }}</h4>
                        <p class="text-[10px]  text-text-secondary">{{ ticket.subtitle }}</p>
                    </div>
                </div>
            </div>

            <div v-if="switchState === 'about'">
                <h3 class="text-lg font-semibold mb-4 mt-4">Basic Info</h3>
                <div class="grid grid-cols-1 gap-y-2 text-sm">
                    <InfoRow label="Full Name" value="Olivia Rhye" />
                    <InfoRow label="Title" value="Product Designer" />
                    <InfoRow label="Email" value="olivia@untitledui.com" />
                    <InfoRow label="Phone" value="+1 (415) 555-0198" />
                    <InfoRow label="Location" value="San Francisco, CA" />
                    <InfoRow label="Timezone" value="PST (UTC -8)" />
                </div>

                <h3 class="text-lg font-semibold mt-8 mb-2">Role & Responsibilities</h3>
                <p class="text-sm text-text-secondary leading-relaxed">
                    Olivia is responsible for crafting user-centered product designs for the web and mobile platforms.
                    She collaborates with product managers and engineers to deliver intuitive and elegant user
                    interfaces.
                </p>

                <h3 class="text-lg font-semibold mt-8 mb-2">Skills & Tools</h3>
                <div class="grid grid-cols-1 gap-y-2 text-sm">
                    <InfoRow label="Design Tools" value="Figma, Sketch, Adobe XD" />
                    <InfoRow label="Prototyping" value="Framer, Protopie" />
                    <InfoRow label="Collaboration" value="Notion, Slack, Zeplin" />
                </div>
            </div>

        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue';

import ProgressBar from '../../../components/ui/ProgressBar.vue';
import SwitchTab from '../../../components/ui/SwitchTab.vue';
import Button from '../../../components/ui/Button.vue';
import InfoRow from '../../../components/ui/InfoRow.vue';
import { useWorkspaceStore } from '../../../stores/workspace';
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
const tickets = [
    {
        id: 1,
        title: 'Login/Sign up page',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    },
    {
        id: 2,
        title: 'Home & Navigation',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    },
    {
        id: 3,
        title: 'Authentication',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    },
    {
        id: 4,
        title: 'Authentication',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    }, {
        id: 5,
        title: 'Authentication',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    }, {
        id: 6,
        title: 'Authentication',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    }, {
        id: 7,
        title: 'Authentication',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    },
    {
        id: 8,
        title: 'Authentication',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    }, {
        id: 9,
        title: 'Authentication',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    },
    {
        id: 10,
        title: 'Authentication',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    }, {
        id: 11,
        title: 'Authentication',
        subtitle: 'Design Project • Olivia Updated on April 9, 2025',
    },
]
const workspaceStore = useWorkspaceStore()
const switchState = ref('activity')


</script>