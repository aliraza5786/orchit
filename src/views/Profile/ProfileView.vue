<template>
  <div class="bg-bg-body  flex-grow  text-text-primary " style="min-height: calc(100dvh - 85px);">
    <!-- Cover Image -->
    <div class="relative h-60 bg-cover bg-center bg-bg-surface"
      :style="{ backgroundImage: `url(${coverImage || '/default-cover.jpg'})` }">
      <div class="absolute inset-0 bg-body"></div>

    </div>

    <!-- Profile Card -->
    <div class="max-w-4xl mx-auto px-4 -mt-24" v-if="profileData">
      <div class="bg-bg-body border-border border rounded-2xl shadow-lg p-6 md:p-8 relative">
        <!-- Profile Header -->
        <div class="flex gap-6 items-start">
          <!-- Avatar -->
          <div class="relative">
            <div
              class="w-28 h-28 rounded-full bg-orange-500 flex items-center justify-center text-text-primary  text-4xl font-bold border-4 border-border  overflow-hidden">
              <!-- <img v-if="avatarImage" :src="avatarImage" class="w-full h-full object-cover" /> -->
              <span>{{ initials }}</span>
            </div>
          </div>

          <!-- Info -->
          <div class="flex-1">
            <h2 class="text-2xl font-semibold capitalize">
              {{ profileData.u_full_name }}
            </h2>
            <p class="text-text-secondary  mb-2 ">{{ profileData.u_email }}</p>
            <Button @click="goToManage" variant="secondary" label="Manage your account">
              Manage your account
            </Button>
          </div>
        </div>

        <!-- Divider -->
        <hr class="my-6 border-border" />


        <!-- Info Fields -->
        <div class="grid  mt-6">
          <InfoFIeld :icon="departmentIcon" label="Organization" :value="profileData.companies.title" />
          <InfoFIeld :icon="departmentIcon" label="Company Size" :value="profileData.companies.company_size" />
          <InfoFIeld :icon="departmentIcon" label="Job Title" :value="profileData.companies.role.title" />
          <div v-for="(item, index) in profileData?.companies?.invitations" :key="index" class=" space-x-2">
            <h4 class="text-text-primary text-base font-medium my-2">People</h4>
            <span>
              {{ item.email }}
            </span>
            <span class=" badge py-1 px-2 text-sm rounded-md  " :class="backgroud(item.status)">{{
              item.status }}</span>
          </div>
        </div>
        <hr class="my-6 border-border" />

        <!-- Contact -->
        <div class="mt-5 ">
          <h4 class="text-sm font-semibold text-text-secondary mb-2">Contact</h4>
          <p class="text-sm text-text-secondary flex gap-2  "><img :src="emailIcon" alt=""> {{ profileData.u_email }}
          </p>
        </div>
        <hr class="my-6 border-border" />

        <!-- Tickets -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2">Assigned Tickets</h3>
          <div v-if="tickets.length" class="space-y-3">
            <div v-for="ticket in tickets" :key="ticket.id"
              class="p-3 bg-bg-card  border border-border rounded-lg hover:shadow-sm transition">
              <p class="font-medium text-text-primary">{{ ticket.title }}</p>
              <p class="text-sm text-text-secondary">{{ ticket.project }}</p>
            </div>
          </div>
          <p v-else class="text-sm text-text-secondary">No assigned tickets yet.</p>
        </div>
      </div>
    </div>

    <!-- Loading/Error -->
    <div v-else class="max-w-4xl mx-auto px-4 py-12 text-center">
      <p v-if="isLoading" class="text-text-secondary">Loading profile...</p>
      <p v-else-if="isError" class="text-red-500">Failed to load profile.</p>
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useProfile } from '../../services/user';
import teamLogo from '../../assets/icons/people2.svg';
import InfoFIeld from './components/InfoFIeld.vue';
import departmentIcon from "../../assets/icons/department.svg"
import emailIcon from "../../assets/icons/email.svg"
import Button from '../../components/ui/Button.vue';
const router = useRouter();

const tickets = ref([
  { id: 1, title: 'Fix dashboard layout', project: 'Orchit AI Dashboard' },
  { id: 2, title: 'Update profile endpoint', project: 'API Integration' },
]);

const avatarImage = ref('');
const coverImage = ref('');
const teams = ref([]);

const { data: profile, isLoading, isError } = useProfile();

const profileData = computed(() => profile.value?.data || null);

watch(profileData, (data) => {
  if (!data) return;

  avatarImage.value = data.u_profile_image || '';
  coverImage.value = data.u_cover_image || '';

  if (data.teams) {
    teams.value = data.teams.map((team: any) => ({
      id: team.id,
      name: team.name,
      members: team.members_count,
      logo: team.logo || teamLogo,
    }));
  }
});




const initials =  computed(() =>
  profileData.value?.u_full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
);

function goToManage() {
  router.push('/manage-account');
}
const backgroud = (item: string) => {
  if (item == 'accepted') return 'bg-green-400'
  if (item == 'pending') return 'bg-orange-400'
}

</script>