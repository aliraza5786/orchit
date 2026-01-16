<template>
  <div
    class="w-full flex justify-center items-center py-10"
    v-if="isPending || isConfirming"
  >
    <div
      role="status"
      aria-label="Loading"
      class="h-10 w-10 rounded-full border-4 border-neutral-700 border-t-transparent animate-spin"
    ></div>
  </div>
  <div v-else class="py-4">
    <div class="space-y-8">
      <!-- Current Plan Section -->
      <div class="bg-bg-body rounded-2xl p-6 border border-border shadow-sm">
        <h3 class="text-lg font-semibold text-text-primary mb-4">
          Current Plan
        </h3>
        <div class="flex items-center justify-between mb-4">
          <div>
            <p class="text-2xl font-bold text-text-primary">
              {{ currentPackage?.package?.name }}
            </p>
            <p class="text-sm text-text-secondary">
              {{ currentPackage?.package?.name === 'Free' ? 'Forever Free' : (selectedInterval === 'month' ? 'Monthly' : 'Yearly') }}
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
                selectedInterval === "month"
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
          </div>
        </div>
      </div>

      <!-- Interval Toggle -->
      <div class="flex flex-col items-center gap-4">
        <div class="inline-flex p-1 bg-bg-body border border-border rounded-xl">
          <button
            v-for="option in intervalOptions"
            :key="option.value"
            @click="selectedInterval = option.value"
            class="px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            :class="selectedInterval === option.value
              ? 'bg-accent text-white shadow-md'
              : 'text-text-secondary hover:text-text-primary'"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

      <!-- Available Plans Section -->
      <div v-if="currentPackage?.nextPackages?.length" class="space-y-6">
        <h3 class="text-xl font-bold text-text-primary text-center">Available Upgrades</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="nextPackage in currentPackage?.nextPackages"
            :key="nextPackage.id"
            class="bg-bg-body rounded-2xl border border-border overflow-hidden flex flex-col transition-all duration-300 hover:border-accent hover:shadow-xl group"
          >
            <!-- Header -->
            <div class="p-6 border-b border-border bg-gradient-to-br from-bg-body to-bg-card">
              <div class="flex items-center justify-between mb-2">
                <span class="px-3 py-1 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider rounded-full">
                  {{ nextPackage.name }}
                </span>
              </div>
              <div class="flex items-baseline gap-1 mt-4">
                <span class="text-4xl font-bold text-text-primary">
                  {{ getPriceInfo(nextPackage, selectedInterval).currencySymbol }}{{ getPriceInfo(nextPackage, selectedInterval).amount }}
                </span>
                <span class="text-text-secondary">/ {{ selectedInterval === 'month' ? 'mo' : 'yr' }}</span>
              </div>
              <p v-if="selectedInterval === 'year'" class="text-xs text-green-500 font-medium mt-1">
                Save {{ getPriceInfo(nextPackage, 'year').currencySymbol }}{{ getPriceInfo(nextPackage, 'year').originalAmount - getPriceInfo(nextPackage, 'year').amount }} per year
              </p>
              <p class="text-sm text-text-secondary mt-4 line-clamp-2">
                {{ nextPackage.description }}
              </p>
            </div>

            <!-- Features -->
            <div class="p-6 flex-1 bg-bg-body/50">
              <p class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">What's included</p>
              <ul class="space-y-3">
                <li
                  v-for="(feature, index) in nextPackage?.features"
                  :key="index"
                  class="flex items-start gap-3 text-sm text-text-primary"
                >
                  <i class="fa-solid fa-circle-check text-accent mt-0.5 text-base"></i>
                  <span class="font-medium">{{ formatFeature(feature) }}</span>
                </li>
              </ul>
            </div>

            <!-- Footer / Action -->
            <div class="p-6 bg-bg-body border-t border-border">
              <Button
                variant="primary"
                class="w-full !py-3 font-bold text-base"
                @click="pay(nextPackage)"
                :disabled="isUpgrading && upgradingPackageId === nextPackage.id"
              >
                <i v-if="isUpgrading && upgradingPackageId === nextPackage.id" class="fa-solid fa-spinner fa-spin mr-2"></i>
                {{ isUpgrading && upgradingPackageId === nextPackage.id ? "Upgrading..." : `Upgrade to ${nextPackage.name}` }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import Button from "../../../components/ui/Button.vue";
import { toast } from "vue-sonner";
import {
  confirmPayment,
  useCurrentPackage,
  useUpgradePackage,
} from "../../../queries/usePackages";
import { extractYear, formatDate } from "../../../utilities/FormatDate";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "../../../stores/workspace";

const workspaceStore = useWorkspaceStore();
const route = useRoute();
const router = useRouter();

const {
  data: currentPackage,
  refetch: reftechCurrentPackage,
  isPending,
} = useCurrentPackage();

const selectedInterval = ref('month');
const intervalOptions = [
  { label: 'Monthly', value: 'month' },
  { label: 'Yearly (20% Off)', value: 'year' }
];

const formatFeature = (feature) => {
  const limits = feature.limits;
  if (!limits) return feature.description || feature.name;

  if (feature.key === 'no-of-workspaces' && limits.maxWorkspaces) {
    return `${limits.maxWorkspaces} Workspaces`;
  }
  if (feature.key === 'storage' && limits.storageGB) {
    return `${limits.storageGB} GB Storage`;
  }
  if (feature.key === 'team_members' && limits.maxTeamMembers) {
    return `${limits.maxTeamMembers} Team Members`;
  }
  if (feature.key === 'api_requests' && limits.requestsPerMonth) {
    return `${limits.requestsPerMonth.toLocaleString()} Tokens`;
  }

  return feature.description || feature.name;
};

const getPriceInfo = (pkg, interval) => {
  const monthPrice = pkg?.pricing?.month?.amount || 0;
  const currency = pkg?.pricing?.month?.currencySymbol || "$";
  
  if (interval === 'year') {
    const totalYear = monthPrice * 12;
    const discountedYear = Math.round(totalYear * 0.8); // 20% discount
    return {
      amount: discountedYear,
      currencySymbol: currency,
      interval: 'year',
      originalAmount: totalYear
    };
  }
  
  return {
    amount: monthPrice,
    currencySymbol: currency,
    interval: 'month'
  };
};

const sessionId = route.query.session_id as string;
const packageId = route.query.packageId as string;
const interval = (route.query.interval as string) || "month";

const { mutate: confirm, isPending: isConfirming } = confirmPayment(
  {
    sessionId: sessionId,
    interval: interval,
    packageId: packageId
  },
  {
    onSuccess: () => {
      reftechCurrentPackage();
      toast.success("Subscription upgraded successfully!");
      router.push("/settings?tab=billing");
    },
  }
);
const hasConfirmed = ref(false)

onMounted(() => {
  if (route.query.stripePayment && sessionId && !hasConfirmed.value) {
    hasConfirmed.value = true;
    confirm({});
  }
});

const { mutate: upgradePackage, isPending: isUpgrading } = useUpgradePackage({
  onSuccess: async (data: any) => {
    window.open(data?.checkoutUrl);
  },
});
const upgradingPackageId = ref<string | null>(null);
function pay(p: any) { 
  const id = p?._id || p?.id
  if (!id) return
  upgradingPackageId.value = id;
  upgradePackage({
    packageId: id,
    interval: selectedInterval.value,
  });
}
</script>
