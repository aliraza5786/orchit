<template>
  <BaseModal
    v-model="isOpen"
    @update:modelValue="() => router.push('/')"
    size="lg"
    :modalClass="'!max-w-[900px]'"
  >
    <div class="px-6">
      <h2 class="text-2xl font-semibold text-text-primary mb-6">
        Account Settings
      </h2>

      <Tabs
        :tabs="['Profile', 'Subscription', 'WorkspaceRoles']"
        :defaultTab="route.query.stripePayment ? 1 : 0"
      >
        <template #Profile>
          <div class="py-4" v-if="profileData">
            <div class="space-y-6">
              <div class="flex items-center gap-6 max-md:gap-2">
                <div class="relative group">
                  <div
                    class="w-24 h-24 max-md:w-12 max-md:h-12 max-md:text-sm rounded-full bg-orange-500 flex items-center justify-center text-text-primary text-2xl font-bold border-4 border-border overflow-hidden"
                  >
                    <img
                      v-if="avatarPreview || profileData.u_profile_image"
                      :src="avatarPreview || profileData.u_profile_image"
                      class="w-full h-full object-cover"
                      alt="Profile"
                    />
                    <span v-else>{{ initials }}</span>
                  </div>
                  <button
                    type="button"
                    class="absolute inset-0 rounded-full bg-black/60 transition grid place-items-center text-white text-xs cursor-pointer"
                    :class="
                      isUploading
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                    "
                    :disabled="isUploadingAvatar"
                    @click="triggerAvatarPicker"
                    aria-label="Change profile picture"
                  >
                    <div
                      class="flex flex-col items-center justify-center gap-1"
                    >
                      <span
                        v-if="isUploadingAvatar || isUploading"
                        class="inline-block h-6 w-6 rounded-full border-2 border-white border-t-transparent animate-spin"
                        aria-hidden="true"
                      ></span>
                      <i v-else class="fa-solid fa-camera text-xl"></i>
                      <span
                        v-if="!isUploadingAvatar && !isUploading"
                        class="text-xs"
                        >Change</span
                      >
                    </div>
                  </button>
                  <input
                    ref="avatarInputRef"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="onAvatarPicked"
                  />
                </div>

                <div class="flex-1">
                  <h3
                    class="text-xl max-md:text-sm font-semibold capitalize text-text-primary"
                  >
                    {{ form.fullName }}
                  </h3>
                  <p class="text-text-secondary max-md:text-xs">
                    {{ form.email }}
                  </p>
                </div>
              </div>

              <hr class="border-border" />

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BaseTextField
                  label="Full Name"
                  placeholder="Enter your full name"
                  v-model="form.fullName"
                />
                <BaseTextField
                  label="Email Address"
                  v-model="form.email"
                  disabled
                  class="cursor-not-allowed"
                />
              </div>

              <hr class="border-border" />

              <div v-if="profileData.companies">
                <h4 class="text-sm font-semibold text-text-secondary mb-3">
                  Organization Details
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <InfoRow
                    label="Organization"
                    :value="profileData.companies.title"
                  />
                  <InfoRow
                    label="Company Size"
                    :value="profileData.companies.company_size"
                  />
                  <InfoRow
                    label="Job Title"
                    :value="profileData.companies.role?.title"
                  />
                </div>
              </div>

              <!-- <div v-if="profileData.companies?.invitations?.length">
                <h4 class="text-sm font-semibold text-text-secondary mb-3">Team Members</h4>
                <div class="space-y-2">
                  <div v-for="(item, index) in profileData.companies.invitations" :key="index"
                    class="flex items-center justify-between p-3 bg-bg-card rounded-lg border border-border">
                    <span class="text-sm text-text-primary">{{ item.email }}</span>
                    <span class="badge py-1 px-3 text-xs rounded-full" :class="getStatusBadge(item.status)">
                      {{ item.status }}
                    </span>
                  </div>
                </div>
              </div> -->

              <div class="flex justify-end gap-3 pt-4">
                <Button variant="secondary" @click="cancelChanges">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  @click="saveChanges"
                  :disabled="isSaving"
                >
                  {{ isSaving ? "Saving..." : "Save Changes" }}
                </Button>
              </div>
            </div>
          </div>
          <div
            v-else-if="isLoading"
            class="py-8 text-center text-text-secondary"
          >
            Loading profile...
          </div>
          <div v-else class="py-8 text-center text-red-500">
            Failed to load profile data.
          </div>
        </template>

        <template #Subscription>
          <div
            class="w-full flex justify-center items-center py-10"
            v-if="isPending || isConfirming"
          >
            <!-- Centered spinner -->

            <div
              role="status"
              aria-label="Loading"
              class="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-transparent animate-spin"
            ></div>
          </div>
          <div v-else class="py-4 overflow-y-auto max-h-full">
            <div class="space-y-6">
              <div class="bg-bg-body rounded-xl p-6 border border-border">
                <h3 class="text-lg font-semibold text-text-primary mb-4">
                  Current Plan
                </h3>
                <div class="flex items-center justify-between mb-4">
                  <div>
                    <p class="text-2xl font-bold text-text-primary">
                      {{ currentPackage?.package?.name }}
                    </p>
                    <p class="text-sm text-text-secondary">
                      {{ currentPlan.billingCycle }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-text-primary">
                      {{
                        currentPackage?.package?.currencySymbol +
                        currentPackage?.package?.amount
                      }}
                    </p>
                    <p class="text-xs text-text-secondary">
                      per
                      {{
                        currentPlan?.billingCycle === "Monthly"
                          ? "month"
                          : "year"
                      }}
                    </p>
                  </div>
                </div>
                <p class="text-sm text-text-secondary mb-4">
                  Next billing date:
                  {{
                    formatDate(currentPackage?.renewsAt) +
                    `, ${extractYear(currentPackage?.renewsAt)}`
                  }}
                </p>
                <h3 class="text-lg font-semibold text-text-primary mb-4">
                  Usage & Limits
                </h3>

                <div class="space-y-4">
                  <div
                    v-for="(item, index) in currentPackage?.features"
                    :key="index"
                  >
                    <div class="flex items-center justify-between mb-2">
                      <div class="flex flex-col">
                        <span class="text-sm font-medium text-text-primary">{{
                          item.name
                        }}</span>
                        <span class="text-xs font-medium text-text-secondary">{{
                          item.description
                        }}</span>
                      </div>
                      <span class="text-sm text-text-secondary"
                        >{{ item?.usage.current }} {{ item?.usage.unit }} /
                        {{ item.limits.limit }} {{ item?.limits?.unit }}</span
                      >
                    </div>
                    <div
                      class="h-2 w-full bg-border/60 rounded-full overflow-hidden"
                    >
                      <div
                        class="h-full bg-accent rounded-full transition-all"
                        :style="{ width: item?.usage.percentage + '%' }"
                      ></div>
                    </div>
                    <!-- <p class="text-xs text-text-secondary mt-1">{{ item?.usage.limits?.storageGB }} {{item?.limits?.unit}} remaining</p> -->
                  </div>
                </div>
              </div>

              <div
                class="bg-bg-body gap-6 items-center flex rounded-xl p-6 border border-border"
                v-if="currentPackage?.nextPackages"
                v-for="nextPackage in currentPackage?.nextPackages"
              >
                <div class="border-r border-border pr-6 min-w-80">
                  <h1 class="mb-2 uppercase">
                    Upgrade to {{ nextPackage?.name }}
                  </h1>
                  <div
                    class="bg-bg-body rounded-xl transition-all hover:shadow-lg"
                  >
                    <div class="text-left mb-4">
                      <h3 class="text-xl font-bold text-text-primary mb-2">
                        {{ nextPackage.name }}
                      </h3>
                      <div class="mb-2">
                        <span class="text-3xl font-bold text-text-primary"
                          >{{
                            nextPackage?.pricing?.month?.amount +
                            nextPackage?.pricing?.month?.currencySymbol
                          }}
                        </span>
                        <span class="text-sm text-text-secondary"
                          >/ {{ nextPackage?.pricing?.month?.interval }}</span
                        >
                      </div>
                      <p class="text-sm text-text-secondary">
                        {{ nextPackage?.description }}
                      </p>
                    </div>
                  </div>
                  <!-- <form action="/create-checkout-session" method="POST"> -->
                  <Button
                    class="mt-3 block w-full uppercase"
                    @click="pay(nextPackage)"
                  >
                    {{ isUpgrading ? "Upgrading..." : "UPGRADE" }}</Button
                  >
                  <!-- </form> -->
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-text-primary mb-3">
                    Plan Features
                  </h3>
                  <ul class="space-y-2">
                    <li
                      v-for="(feature, index) in nextPackage?.features"
                      :key="index"
                      class="flex items-center gap-2 text-sm text-text-secondary"
                    >
                      <i class="fa-solid fa-check text-green-500"></i>
                      <span>{{ feature?.description }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </template>

        <template #WorkspaceRoles>
          <div class="space-y-6 h-full flex overflow-hidden gap-2">
            <!-- SHOW ROLES LIST -->
            <div
              class="min-w-[250px] max-w-[300px] sticky top-0 border-r border-border p-2 overflow-y-auto"
            >
              <h2 class="text-2xl flex font-semibold mb-4">Roles</h2>

              <div class="space-y-3">
                <button
                  v-for="role in roles"
                  :key="role._id"
                  @click="selectedRole = role"
                  :class="`${
                    selectedRole?._id == role?._id
                      ? '  border-accent bg-accent/30'
                      : 'border-border bg-bg-body'
                  } `"
                  class="w-full text-left px-4 py-3 border cursor-pointer rounded-lg hover:bg-bg-surface transition"
                >
                  <h3 class="text-sm font-semibold text-text-primary">
                    {{ role.title }}
                  </h3>
                  <p class="text-xs text-text-secondary">
                    {{ role.description }}
                  </p>
                </button>
              </div>
            </div>

            <hr class="border-border my-4" />

            <!-- SHOW PERMISSIONS OF SELECTED ROLE -->
            <div v-if="selectedRole" class="w-full overflow-y-auto">
              <h2 class="text-lg mb-4">
                Permissions for:
                <span class="font-semibold">
                  {{ selectedRole.title }}
                </span>
              </h2>

              <div
                v-for="category in selectedRole?.permission_categories"
                :key="category?.category"
                class="border border-border mb-3 cursor-pointer rounded-xl overflow-hidden bg-bg-body/30 shadow-sm"
              >
                <!-- Category Header -->
                <button
                  @click="toggle(category?.category)"
                  class="w-full px-5 cursor-pointer py-4 flex justify-between items-center bg-bg-surface/30 hover:bg-bg-surface/80 transition"
                >
                  <span class="text-lg font-medium text-text-primary">
                    {{ category?.category_title }}
                  </span>

                  <svg
                    :class="[
                      'w-5 h-5 text-text-secondary transition-transform',
                      open[category?.category] ? 'rotate-180' : '',
                    ]"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <!-- Permission List -->
                <div
                  v-if="open[category?.category]"
                  class="px-5 py-4 space-y-4"
                >
                  <div
                    v-for="perm in category?.permissions"
                    :key="perm._id"
                    class="flex justify-between items-center border-b border-border pb-3 last:border-b-0"
                  >
                    <div>
                      <p class="font-medium text-text-primary">
                        {{ perm.title }}
                      </p>
                      <p class="text-sm text-text-secondary">
                        {{ perm.description }}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      v-model="selected"
                      @change="
                        () => {
                          updatePermissionHandler();
                        }
                      "
                      :value="perm._id"
                      class="h-5 w-5 rounded border-border accent-accent cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>

       

        <!-- 
        <template #Pricing>
          <div class="py-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div v-for="plan in pricingPlans" :key="plan.name"
                class="bg-bg-body rounded-xl p-6 border-2 transition-all hover:shadow-lg"
                :class="plan.name === currentPlan.name ? 'border-accent shadow-accent/20' : 'border-border'">
                <div class="text-center mb-4">
                  <h3 class="text-xl font-bold text-text-primary mb-2">{{ plan.name }}</h3>
                  <div class="mb-2">
                    <span class="text-3xl font-bold text-text-primary">{{ plan.price }}</span>
                    <span class="text-sm text-text-secondary">/ {{ plan.billingCycle }}</span>
                  </div>
                  <p class="text-sm text-text-secondary">{{ plan.description }}</p>
                </div>

                <hr class="border-border my-4" />

                <ul class="space-y-3 mb-6">
                  <li v-for="(feature, index) in plan.features" :key="index"
                    class="flex items-start gap-2 text-sm text-text-secondary">
                    <i class="fa-solid fa-check text-green-500 mt-1"></i>
                    <span>{{ feature }}</span>
                  </li>
                </ul>

                <Button v-if="plan.name === currentPlan.name" variant="secondary" class="w-full" disabled>
                  Current Plan
                </Button>
                <Button v-else-if="plan.name === 'Free'" variant="secondary" class="w-full"
                  @click="downgradePlan(plan)">
                  Downgrade
                </Button>
                <Button v-else variant="primary" class="w-full" @click="upgradePlan(plan)">
                  Upgrade to {{ plan.name }}
                </Button>
              </div>
            </div>
          </div>
        </template>
         -->
      </Tabs>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import BaseModal from "../../../components/ui/BaseModal.vue";
import Tabs from "../../../components/ui/Tabs.vue";
import BaseTextField from "../../../components/ui/BaseTextField.vue";
import Button from "../../../components/ui/Button.vue";
import InfoRow from "../../../components/ui/InfoRow.vue";
import { useQuery, useMutation } from "@tanstack/vue-query";
import {
  getProfile,
  updateProfile,
  useCompanyId,
} from "../../../services/user";
import { usePrivateUploadFile } from "../../../queries/useCommon";
import { toast } from "vue-sonner";
import {
  confirmPayment,
  useCurrentPackage,
  useRoles,
  useUpdatePermissions,
  useUpgradePackage, 
} from "../../../queries/usePackages";
import { extractYear, formatDate } from "../../../utilities/FormatDate";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "../../../stores/workspace";
const workspaceStore = useWorkspaceStore();
const route = useRoute();
const router = useRouter();

const selectedRole = ref<any>(null);

const {
  data: currentPackage,
  refetch: reftechCurrentPackage,
  isPending,
} = useCurrentPackage();
const sessionId = route.query.session_id;
// const { data: roles } = useRolesPermisions();
const { mutate: confirm, isPending: isConfirming } = confirmPayment(
  {
    sessionId: sessionId,
    interval: "month",
  },
  {
    onSuccess: () => {
      reftechCurrentPackage();
      router.push("/");
    },
  }
);
onMounted(async () => {
  const sessionId = route.query.session_id;
  console.log(route.query.session_id, sessionId);
  if (sessionId) {
    confirm({ packageId: await currentPackage?.value.nextPackage?.id });
  }
});
const { mutate: upgradePackage, isPending: isUpgrading } = useUpgradePackage({
  onSuccess: async (data: any) => {
    window.open(data?.checkoutUrl);
  },
});
function pay(p: any) {
  upgradePackage({
    packageId: p?.id,
    interval: "month",
  });
}
const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const {
  data: profile,
  isLoading,
  refetch,
} = useQuery({
  queryKey: ["profile"],
  queryFn: getProfile,
  enabled: computed(() => props.modelValue),
});
watch(
  () => currentPackage.value,
  () => {
    workspaceStore.setLimit(currentPackage.value);
    if (route.query.stripePayment) {
      confirm({
        sessionId: currentPackage.value?.sessionId,
        packageId: currentPackage?.value.nextPackage?.id,
        interval: "month",
      });
    }
  }
);
const profileData = computed(() => profile.value?.data || null);

const form = ref({
  fullName: "",
  email: "",
  jobTitle: "",
  department: "",
  location: "",
});

const avatarInputRef = ref<HTMLInputElement | null>(null);
const avatarPreview = ref<string>("");
const isUploadingAvatar = ref(false);
const uploadedAvatarUrl = ref<string>("");

// const tickets = ref([
//   { id: 1, title: 'Fix dashboard layout', project: 'Orchit AI Dashboard' },
//   { id: 2, title: 'Update profile endpoint', project: 'API Integration' }
// ])

watch(
  profileData,
  (data) => {
    if (!data) return;
    form.value.fullName = data.u_full_name || "";
    form.value.email = data.u_email || "";
    form.value.jobTitle = data.u_job_title || "";
    form.value.department = data.u_department || "";
    form.value.location = data.u_location || "";
  },
  { immediate: true }
);

const initials = computed(() =>
  form.value.fullName
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

function cancelChanges() {
  if (profileData.value) {
    form.value.fullName = profileData.value.u_full_name || "";
    form.value.jobTitle = profileData.value.u_job_title || "";
    form.value.department = profileData.value.u_department || "";
    form.value.location = profileData.value.u_location || "";
  }
  avatarPreview.value = "";
  uploadedAvatarUrl.value = "";
  isOpen.value = false;
  router.push("/");
}

// function getStatusBadge(status: string) {
//   switch (status) {
//     case 'accepted':
//       return 'bg-green-500/20 text-green-600'
//     case 'pending':
//       return 'bg-orange-500/20 text-orange-600'
//     case 'rejected':
//       return 'bg-red-500/20 text-red-600'
//     default:
//       return 'bg-gray-500/20 text-gray-600'
//   }
// }

const currentPlan = ref({
  name: "Pro",
  price: "$29",
  billingCycle: "Monthly",
  nextBillingDate: "January 15, 2026",
  features: [
    "Unlimited workspaces",
    "100 GB storage",
    "Up to 10 team members",
    "Priority support",
    "Advanced analytics",
    "Custom integrations",
  ],
});

// const usageData = ref({
//   storage: {
//     used: 45,
//     limit: 100,
//     remaining: 55,
//     percentage: 45
//   },
//   users: {
//     used: 7,
//     limit: 10,
//     remaining: 3,
//     percentage: 70
//   }
// })

// const pricingPlans = ref([
//   {
//     name: 'Free',
//     price: '$0',
//     billingCycle: 'month',
//     description: 'Perfect for personal use',
//     features: [
//       '3 workspaces',
//       '5 GB storage',
//       'Up to 3 team members',
//       'Basic support',
//       'Basic analytics'
//     ]
//   },
//   // {
//   //   name: 'Pro',
//   //   price: '$29',
//   //   billingCycle: 'month',
//   //   description: 'Best for growing teams',
//   //   features: [
//   //     'Unlimited workspaces',
//   //     '100 GB storage',
//   //     'Up to 10 team members',
//   //     'Priority support',
//   //     'Advanced analytics',
//   //     'Custom integrations'
//   //   ]
//   // },
//   // {
//   //   name: 'Enterprise',
//   //   price: '$99',
//   //   billingCycle: 'month',
//   //   description: 'For large organizations',
//   //   features: [
//   //     'Unlimited everything',
//   //     'Unlimited storage',
//   //     'Unlimited team members',
//   //     '24/7 dedicated support',
//   //     'Advanced security',
//   //     'Custom integrations',
//   //     'SLA guarantee',
//   //     'Dedicated account manager'
//   //   ]
//   // }
// ])

// function manageBilling() {
//   toast.info('Redirecting to Stripe billing portal...')
//   window.open('https://billing.stripe.com/p/login/test_00000000000000', '_blank')
// }

// function upgradePlan(plan: any) {
//   toast.info(`Redirecting to checkout for ${plan.name} plan...`)
//   window.open('https://checkout.stripe.com/test_00000000000000', '_blank')
// }

// function downgradePlan(plan: any) {
//   toast.warning(`You are about to downgrade to ${plan.name} plan. Please contact support.`)
// }
const open = ref<Record<string, boolean>>({});
// watch(roles, (newVal) => {
//   if (newVal)
//     newVal[0].categories.forEach((cat: any) => (open.value[cat.category] = false));
// })

const toggle = (key: string) => {
  open.value[key] = !open.value[key];
};

// Track selected permissions
const selected = ref<string[]>([]);
const { data: id } = useCompanyId();
const { data: roles } = useRoles(id, {
  enabled: computed(() => !!id?.value),
});
const { mutate: updatePermissions } = useUpdatePermissions();

watch(roles, async (roles) => {
  if (!roles || !roles.length) return;
  
  selectedRole.value = roles[0];

  // Wait for Vue to render and reactive objects to populate
  await nextTick();

  const enabledPermissions: string[] = [];
  selectedRole.value.permission_categories.forEach((category: any) => {
    category.permissions.forEach((perm: any) => {
      if (perm.enabled) enabledPermissions.push(perm._id);
    });
  });
  selected.value = enabledPermissions;
});

watch(selectedRole, (roles) => {
  console.log(selectedRole)
  if (!roles) return;

  const enabledPermissions: string[] = [];

  roles?.permission_categories.forEach((category: any) => {
    category.permissions.forEach((perm: any) => {
      if (perm.enabled) {
        enabledPermissions.push(perm._id);
      }
    });
  });

  selected.value = enabledPermissions;
});

// const updatePermissionHandler = () => {
//   updatePermissions({
//     permission_ids: selected.value,
//   });
// }; 

const updatePermissionHandler = () => {
  if (!selectedRole.value?._id) return;

  updatePermissions({
    roleId: selectedRole.value._id,   // send the ID separately
    payload: {
      title: selectedRole.value.title,
      description: selectedRole.value.description,
      is_admin: selectedRole.value.is_admin,
      is_editor: selectedRole.value.is_editor,
      is_viewer: selectedRole.value.is_viewer,
      permission_ids: selected.value,
    },
  });
};



// use workspace roles 
// import { useWorkspacePermissions } from "../../../queries/usePackages";
// const { data: permissions} = useWorkspacePermissions();
// const workspaceRoles = ref([]);
// const selectedWorkspaceRole = ref<any>(null);
// watchEffect(() => {
//   console.log("Updated permissions:", toRaw(permissions.value));
//   workspaceRoles.value = toRaw(permissions.value); 
// });

// ADD API LATER WHEN PROVIDED: updateWorkspacePermissions()

</script>