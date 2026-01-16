<template>
  <div class="py-6" v-if="profileData">
    <div class="space-y-8">
      <!-- Profile Header Section -->
      <div class="bg-bg-body/50 p-6 rounded-2xl border border-border/50 shadow-sm transition-all hover:shadow-md">
        <div class="flex flex-col sm:flex-row items-center gap-8">
          <!-- Avatar Section -->
          <div class="relative group">
            <div
              class="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-bg-card shadow-xl overflow-hidden relative"
            >
              <img
                v-if="avatarPreview || profileData.u_profile_image"
                :src="avatarPreview || profileData.u_profile_image"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                alt="Profile"
              />
              <span v-else class="drop-shadow-md">{{ initials }}</span>
              
              <!-- Hover Overlay -->
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                 <i class="fa-solid fa-camera text-2xl text-white"></i>
              </div>
            </div>
            
            <button
              type="button"
              class="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-accent text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-10"
              :disabled="isUploadingAvatar || isUploading"
              @click="triggerAvatarPicker"
              title="Change profile picture"
            >
              <span v-if="isUploadingAvatar || isUploading" class="h-5 w-5 border-2 border-white border-t-transparent animate-spin rounded-full"></span>
              <i v-else class="fa-solid fa-pen-to-square text-sm"></i>
            </button>
            <input
              ref="avatarInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onAvatarPicked"
            />
          </div>

          <!-- Basic Info -->
          <div class="flex-1 text-center sm:text-left">
            <h3 class="text-2xl font-bold text-text-primary tracking-tight">
              {{ form.fullName || 'New User' }}
            </h3>
            <p class="text-text-secondary font-medium flex items-center justify-center sm:justify-start gap-2 mt-1">
              <i class="fa-regular fa-envelope text-accent/70"></i>
              {{ form.email }}
            </p>
            <div class="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
               <span class="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full border border-accent/20">
                 {{ profileData.companies?.role?.title || 'Member' }}
               </span>
               <span v-if="profileData.companies?.title" class="px-3 py-1 bg-text-secondary/10 text-text-secondary text-xs font-bold rounded-full border border-border">
                 {{ profileData.companies.title }}
               </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Section -->
      <div class="grid grid-cols-1 gap-8">
        <section class="bg-bg-body/30 p-8 rounded-2xl border border-border/40">
          <h4 class="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <i class="fa-solid fa-user-gear text-accent"></i>
            Personal Information
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BaseTextField
              label="Full Name"
              placeholder="Enter your full name"
              v-model="form.fullName"
              class="focus-within:ring-2 focus-within:ring-accent/20"
            />
            <BaseTextField
              label="Email Address"
              v-model="form.email"
              disabled
              class="opacity-70 cursor-not-allowed bg-bg-card/50"
            />
          </div>
        </section>

        <!-- Organization Section -->
        <section v-if="profileData.companies" class="bg-bg-body/30 p-8 rounded-2xl border border-border/40">
          <h4 class="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <i class="fa-solid fa-building text-accent"></i>
            Organization Details
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div class="p-4 bg-bg-card/40 rounded-xl border border-border/50 transition-colors hover:border-accent/30">
              <p class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Organization</p>
              <p class="text-sm font-semibold text-text-primary">{{ profileData.companies.title }}</p>
            </div>
            <div class="p-4 bg-bg-card/40 rounded-xl border border-border/50 transition-colors hover:border-accent/30">
              <p class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Company Size</p>
              <p class="text-sm font-semibold text-text-primary">{{ profileData.companies.company_size }}</p>
            </div>
            <div class="p-4 bg-bg-card/40 rounded-xl border border-border/50 transition-colors hover:border-accent/30">
              <p class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-1">Job Role</p>
              <p class="text-sm font-semibold text-text-primary">{{ profileData.companies.role?.title }}</p>
            </div>
          </div>
        </section>
      </div>

      <!-- Action Footer -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="transform translate-y-4 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform translate-y-4 opacity-0"
      >
        <div v-if="hasChanges" class="fixed bottom-8 right-8 z-50">
          <Button
            variant="primary"
            class="!py-3 !px-8 shadow-2xl backdrop-blur-md bg-accent/90 hover:bg-accent ring-4 ring-bg-body/50"
            @click="saveChanges"
            :disabled="isSaving"
          >
            <div class="flex items-center gap-2">
              <i v-if="isSaving" class="fa-solid fa-spinner fa-spin"></i>
              <i v-else class="fa-solid fa-floppy-disk"></i>
              <span class="font-bold tracking-wide">{{ isSaving ? "Saving changes..." : "Save Changes" }}</span>
            </div>
          </Button>
        </div>
      </Transition>
    </div>
  </div>

  <!-- States -->
  <div v-else-if="isLoading" class="flex flex-col items-center justify-center py-20">
    <div class="h-12 w-12 border-4 border-accent border-t-transparent animate-spin rounded-full"></div>
    <p class="mt-4 text-text-secondary font-medium animate-pulse">Loading profile settings...</p>
  </div>
  <div v-else class="py-12 text-center bg-red-500/10 rounded-2xl border border-red-500/20">
    <i class="fa-solid fa-triangle-exclamation text-3xl text-red-500 mb-4"></i>
    <p class="text-red-500 font-bold">Failed to load profile data.</p>
    <Button variant="secondary" class="mt-4" @click="refetch">Try Again</Button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import BaseTextField from "../../../components/ui/BaseTextField.vue";
import Button from "../../../components/ui/Button.vue";
import { useQuery, useMutation } from "@tanstack/vue-query";
import { getProfile, updateProfile } from "../../../services/user";
import { usePrivateUploadFile } from "../../../queries/useCommon";
import { toast } from "vue-sonner";

const {
  data: profile,
  isLoading,
  refetch,
} = useQuery({
  queryKey: ["profile"],
  queryFn: getProfile,
});

const profileData = computed(() => profile.value?.data || null);

const form = ref({
  fullName: "",
  email: "",
  jobTitle: "",
  department: "",
  location: "",
});

const originalForm = ref({ ...form.value });
const avatarInputRef = ref<HTMLInputElement | null>(null);
const avatarPreview = ref<string>("");
const isUploadingAvatar = ref(false);
const uploadedAvatarUrl = ref<string>("");

// Change detection
const hasChanges = computed(() => {
  const nameChanged = form.value.fullName !== originalForm.value.fullName;
  const avatarChanged = !!uploadedAvatarUrl.value;
  return nameChanged || avatarChanged;
});

watch(
  profileData,
  (data) => {
    if (!data) return;
    const initialForm = {
      fullName: data.u_full_name || "",
      email: data.u_email || "",
      jobTitle: data.u_job_title || "",
      department: data.u_department || "",
      location: data.u_location || "",
    };
    form.value = { ...initialForm };
    originalForm.value = { ...initialForm };
  },
  { immediate: true }
);

const initials = computed(() =>
  (form.value.fullName || "User")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
);

function triggerAvatarPicker() {
  avatarInputRef.value?.click();
}

const { mutate: uploadFileMutation, isPending: isUploading } =
  usePrivateUploadFile({
    onSuccess: (data: any) => {
      const url = data?.data?.url;
      if (!url) {
        toast.error("Upload succeeded but no URL was returned.");
        isUploadingAvatar.value = false;
        return;
      }
      uploadedAvatarUrl.value = url;
      isUploadingAvatar.value = false;
      toast.success("Profile picture uploaded successfully");
    },
    onError: (err: any) => {
      console.error("File upload failed", err);
      toast.error("File upload failed. Please try again.");
      isUploadingAvatar.value = false;
      avatarPreview.value = "";
    },
  });

async function onAvatarPicked(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input?.files?.length) return;

  const file = input.files[0];
  avatarPreview.value = URL.createObjectURL(file);
  isUploadingAvatar.value = true;

  const formData = new FormData();
  formData.append("file", file);
  uploadFileMutation(formData);
}

const { mutate: updateUser, isPending: isSaving } = useMutation({
  mutationFn: (payload: any) => updateProfile(payload),
  onSuccess: () => {
    toast.success("Profile updated successfully");
    refetch();
    uploadedAvatarUrl.value = "";
    avatarPreview.value = "";
  },
  onError: () => {
    toast.error("Failed to update profile.");
  },
});

function saveChanges() {
  const payload = {
    u_full_name: form.value.fullName,
    ...(uploadedAvatarUrl.value && {
      u_profile_image: uploadedAvatarUrl.value,
    }),
  };
  updateUser(payload);
}
</script>

