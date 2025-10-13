<template>
    <div class="bg-bg-body  min-h-screen py-10 px-4 text-text-primary">
      <div class="max-w-4xl mx-auto bg-bg-body border-border border  shadow rounded-lg p-6">
        <!-- Heading -->
        <h1 class="text-2xl font-semibold mb-6">Manage Your Account</h1>
  
        <!-- Loading/Error -->
        <div v-if="isLoading">Loading...</div>
        <div v-else-if="isError">Failed to load profile</div>
  
        <div v-else>
          <!-- Cover Image -->
          <div class="relative h-44 w-full rounded-md bg-bg-surface  mb-8 overflow-hidden">
            <img v-if="coverImage || data?.data?.u_cover_image" :src="coverImage || data.data.u_cover_image" class="w-full h-full object-cover" />
  
            <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="updateCover" />
            <Button
            variant="secondary"
            size="sm"
              class="!absolute top-2 right-2  "
              @click="() => coverInput?.click()"
            >
              Change Cover
            </Button>
          </div>
  
          <!-- Profile Info -->
          <div class="flex items-center gap-4 mb-6 relative">
            <!-- Profile Image -->
            <div class="relative w-20 h-20">
              <div
                class="w-20 aspect-square rounded-full bg-orange-500 flex items-center justify-center  text-text-primary text-xl font-bold overflow-hidden"
              >
                <img
                  v-if="avatarImage || data?.data?.u_profile_image"
                  :src="avatarImage || data.data.u_profile_image"
                  alt="Profile"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ initials }}</span>
              </div>
  
              <!-- Upload Button -->
              <input ref="avatarInput" type="file" accept="image/*" class="hidden" @change="updateAvatar" />
              <button
                class="absolute aspect-square w-6 bottom-0 right-0 bg-bg-card border border-gray cursor-pointer rounded-full p-1 text-xs shadow "
                @click="() => avatarInput?.click()"
              >
               <i class="fa-solid fa-pen"></i>
              </button>
            </div>
  
            <div>
              <p class="text-lg font-medium">{{ form.fullName }}</p>
              <p class="text-sm text-text-secondary">{{ form.email }}</p>
            </div>
          </div>
  
          <!-- Editable Fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BaseTextField  label="Job Title" placeholder="Frontend Dev" v-model="form.jobTitle" />
            <BaseTextField label="Department" placeholder="web department" v-model="form.department" />
            <BaseTextField label="Location" placeholder="house #143 , B4" v-model="form.location" />
            <BaseTextField label="Email address" v-model="form.email" disabled />
          </div>
  
          <!-- Teams -->
          <div class="mt-6">
            <label class="block text-sm font-medium text-text-secondary mb-1">Teams</label>
            <ul class="list-disc list-inside text-sm text-text-secondary">
              <li v-for="team in form.teams" :key="team">{{ team }}</li>
            </ul>
          </div>
  
          <!-- Actions -->
          <div class="mt-8 flex justify-end">
            <Button
              @click="saveChanges"
           variant="primary"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, watchEffect } from 'vue';
  import { useQuery, useMutation } from '@tanstack/vue-query';
  import BaseTextField from '../../components/ui/BaseTextField.vue';
  import { getProfile, updateProfile } from '../../services/user';
import router from '../../router';
import { uploadFile } from '../../queries/useCommon';
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Button from '../../components/ui/Button.vue';
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });
  
  // --- State
  const form = ref({
    fullName: '',
    email: '',
    jobTitle: '',
    department: '',
    location: '',
    teams: [],
  });
  
  const profileImageUrl = ref('');
  const coverImageUrl = ref('');
  const avatarImage = ref('');
  const coverImage = ref('');
  
  const avatarInput = ref<HTMLInputElement | null>(null);
  const coverInput = ref<HTMLInputElement | null>(null);
  
  // --- Sync form when profile loads
  watchEffect( () => {
    if (!data.value) return;
  
    const profile = data.value.data;
  
    form.value.fullName = profile.u_full_name;
    form.value.email = profile.u_email;
    form.value.jobTitle = profile.u_job_title;
    form.value.department = profile.u_department;
    form.value.location = profile.u_location;
    form.value.teams = profile.teams || [];
  });
  
  // --- Initials
  const initials = computed(() =>
    form.value.fullName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  );
  
  // --- Upload Avatar
  async function updateAvatar(e: Event) {
    const file = (e.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
  
    avatarImage.value = URL.createObjectURL(file);
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const res = await uploadFile(formData);
      profileImageUrl.value = res?.data?.url;
      if (res?.data?.url) saveChanges();
    } catch (err) {
      alert('Upload failed');
    }
  }
  
  // --- Upload Cover
  async function updateCover(e: Event) {
    const file = (e.target as HTMLInputElement)?.files?.[0];
    if (!file) return;
  
    coverImage.value = URL.createObjectURL(file);
  
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const res = await uploadFile(formData);
      coverImageUrl.value = res?.data?.url;
      if (res?.data?.url) saveChanges();
    } catch (err) {
      alert('Upload failed');
    }
  }
  
  // --- Save Profile
  const { mutate: updateUser } = useMutation({
    mutationFn: (payload: any) => updateProfile(payload),
    onSuccess: () => {
     router.push('/profile')
    },
    onError: () => {
      alert('Failed to update profile.');
    },
  });
  
  function saveChanges() {
    const payload = {
      u_full_name: form.value.fullName,
      u_job_title: form.value.jobTitle,
      u_department: form.value.department,
      u_location: form.value.location,
      ...(profileImageUrl.value && { u_profile_image: profileImageUrl.value }),
      ...(coverImageUrl.value && { u_cover_image: coverImageUrl.value }),
    };
  
    updateUser(payload);
  }
  </script>
  