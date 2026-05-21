<template>
  <div class="py-4">

    <!-- ── SKELETON ─────────────────────────────────────────────────── -->
    <div v-if="isConfirming || !currentPackage" class="space-y-8 animate-pulse">

      <!-- Current plan card skeleton -->
      <div class="bg-bg-body rounded-2xl p-6 border border-border">

        <!-- Plan name + price row -->
        <div class="flex items-start justify-between mb-6">
          <div class="space-y-2">
            <div class="h-3 w-24 bg-border/60 rounded-md"></div>
            <div class="h-7 w-36 bg-border/60 rounded-md"></div>
            <div class="h-3 w-20 bg-border/60 rounded-md"></div>
          </div>
          <div class="space-y-2 text-right">
            <div class="h-7 w-24 bg-border/60 rounded-md ml-auto"></div>
            <div class="h-3 w-14 bg-border/60 rounded-md ml-auto"></div>
          </div>
        </div>

        <!-- Next billing -->
        <div class="h-3 w-52 bg-border/60 rounded-md mb-6"></div>

        <div class="h-px w-full bg-border/40 mb-5"></div>

        <!-- Usage & Limits heading -->
        <div class="h-4 w-28 bg-border/60 rounded-md mb-5"></div>

        <!-- 3 usage bars -->
        <div class="space-y-5">
          <div v-for="(w, i) in ['w-28','w-36','w-32']" :key="i">
            <div class="flex items-center justify-between mb-2">
              <div class="space-y-1.5">
                <div :class="`h-3 ${w} bg-border/60 rounded-md`"></div>
                <div class="h-2.5 w-44 bg-border/40 rounded-md"></div>
              </div>
              <div class="h-3 w-20 bg-border/60 rounded-md"></div>
            </div>
            <div class="h-2 w-full bg-border/50 rounded-full overflow-hidden">
              <div
                class="h-full bg-border rounded-full"
                :style="{ width: ['40%','68%','22%'][i] }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Plan cards skeleton -->
      <div class="pt-6 border-t border-border space-y-6">
        <!-- Interval toggle pill skeleton -->
        <div class="flex justify-center">
          <div class="h-10 w-64 bg-border/60 rounded-xl"></div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            v-for="n in 2" :key="n"
            class="bg-bg-body rounded-2xl border border-border overflow-hidden flex flex-col"
          >
            <!-- Card header -->
            <div class="p-6 border-b border-border space-y-3">
              <div class="h-5 w-16 bg-border/60 rounded-full"></div>
              <div class="h-7 w-28 bg-border/60 rounded-md"></div>
              <div class="h-3 w-14 bg-border/60 rounded-md"></div>
              <div class="space-y-1.5 pt-1">
                <div class="h-3 w-full bg-border/40 rounded-md"></div>
                <div class="h-3 w-4/5 bg-border/40 rounded-md"></div>
              </div>
            </div>
            <!-- Feature list -->
            <div class="p-6 flex-1 space-y-3">
              <div class="h-2.5 w-24 bg-border/40 rounded-md mb-4"></div>
              <div
                v-for="f in 4" :key="f"
                class="flex items-center gap-3"
              >
                <div class="h-4 w-4 rounded-full bg-border/60 flex-shrink-0"></div>
                <div :class="`h-3 bg-border/40 rounded-md flex-1`"
                     :style="{ width: ['130px','110px','90px','120px'][f-1] }">
                </div>
              </div>
            </div>
            <!-- CTA -->
            <div class="p-6 border-t border-border">
              <div class="h-11 w-full bg-border/60 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

<!-- ── LOADED ─────────────────────────────────────────────────── -->
<div v-else class="space-y-8">

  <!-- Usage & Limits (unchanged) -->
  <div class="bg-bg-body rounded-2xl p-6 border border-border shadow-sm">
    <h3 class="text-lg font-semibold text-text-primary mb-4">Usage & Limits</h3>

    <div
      v-if="!currentPackage?.features?.length"
      class="flex flex-col items-center text-center gap-2 py-8 rounded-xl border border-dashed border-border bg-bg-card"
    >
      <i class="fa-solid fa-chart-simple text-2xl text-text-secondary opacity-40"></i>
      <p class="text-sm font-medium text-text-primary">No usage data yet</p>
      <p class="text-xs text-text-secondary max-w-xs">
        Start using the workspace to see your usage metrics here.
      </p>
    </div>

    <div v-else class="space-y-4">
      <div v-for="(item, index) in currentPackage?.features" :key="index">
        <div class="flex items-center justify-between mb-2">
          <div class="flex flex-col">
            <span class="text-sm font-medium text-text-primary">{{ item.name }}</span>
            <span class="text-xs font-medium text-text-secondary">{{ item.description }}</span>
          </div>
          <span class="text-sm text-text-secondary">
            {{ item?.usage.current }} {{ item?.usage.unit }} /
            {{ item.limits.limit }} {{ item?.limits?.unit }}
          </span>
        </div>
        <div class="h-2 w-full bg-border/60 rounded-full overflow-hidden">
          <div
            class="h-full bg-accent rounded-full transition-all"
            :style="{ width: item?.usage.percentage + '%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── ALL PLANS IN ONE ROW ── -->
  <div class="space-y-6 pt-6 border-t border-border">
    <div class="text-center space-y-4">
      <h3 class="text-2xl font-bold text-text-primary">Your Plans</h3>
      <p class="text-text-secondary max-w-md mx-auto">
        Choose the plan that best fits your team's needs. Save 20% by switching to yearly billing.
      </p>

      <div class="flex flex-col items-center gap-4 mt-6">
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
    </div>

    <!-- No upgrade plans empty state -->
    <div
      v-if="!currentPackage?.nextPackages?.length"
      class="flex flex-col items-center text-center gap-3 py-16"
    >
      <i class="fa-solid fa-rocket text-3xl text-text-secondary opacity-30"></i>
      <p class="text-base font-semibold text-text-primary">No upgrade plans available</p>
      <p class="text-sm text-text-secondary max-w-xs">
        You're already on our top tier, or plans aren't available in your region yet.
        Check back soon or reach out to support.
      </p>
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-6"
      :class="currentPackage?.nextPackages?.length === 1 ? 'md:grid-cols-2' : 'md:grid-cols-3'"
    >

      <!-- ── CURRENT PLAN CARD ── -->
      <div class="relative bg-bg-body rounded-2xl border-2 border-accent overflow-hidden flex flex-col shadow-lg">
        <!-- Active badge -->
        <div class="absolute top-4 right-4">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-accent text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse"></span>
            Current Plan
          </span>
        </div>

        <div class="p-6 border-b border-border bg-gradient-to-br from-accent/5 to-bg-card">
          <span class="px-3 py-1 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider rounded-full">
            {{ currentPackage?.package?.name }}
          </span>
          <div class="flex items-end gap-2 mt-4">
            <span class="text-2xl font-bold text-text-primary">
              {{ currentPackage?.package?.name === 'Free'
                  ? 'Free'
                  : (currentPackage?.package?.currencySymbol + currentPackage?.package?.amount) }}
            </span>
            <span v-if="currentPackage?.package?.name !== 'Free'" class="text-text-secondary mb-0.5">
              / {{ currentPackage?.interval || 'month' }}
            </span>
          </div>
          <p class="text-sm text-text-secondary mt-1">
            {{ currentPackage?.package?.name === 'Free' ? 'Forever free' : (currentPackage?.interval === 'year' ? 'Yearly billing' : 'Monthly billing') }}
          </p>
          <p class="text-xs text-text-secondary mt-3">
            Next billing: {{ formatDate(currentPackage?.renewsAt) }}, {{ extractYear(currentPackage?.renewsAt) }}
          </p>
        </div>

        <div class="p-6 flex-1 bg-bg-body/50">
          <p class="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4">What's included</p>
          <ul class="space-y-3">
  <li
    v-for="(feature, index) in currentPackage?.features"
    :key="index"
    class="flex items-start gap-3 text-sm text-text-primary"
  >
    <i class="fa-solid fa-circle-check text-accent mt-0.5 text-base"></i>
    <span class="font-medium">{{ formatCurrentFeature(feature) }}</span>
  </li>
</ul>
        </div>

        <div class="p-6 bg-bg-body border-t border-border">
          <div class="w-full py-3 rounded-xl border-2 border-accent/30 bg-accent/5 text-accent text-sm font-bold text-center">
            ✓ Active Plan
          </div>
        </div>
      </div>

      <!-- ── UPGRADE PLAN CARDS ── -->
      <div
        v-for="nextPackage in currentPackage?.nextPackages"
        :key="nextPackage.id"
        class="bg-bg-body rounded-2xl border border-border overflow-hidden flex flex-col transition-all duration-300 hover:border-accent hover:shadow-xl group"
      >
        <div class="p-6 border-b border-border bg-gradient-to-br from-bg-body to-bg-card">
          <div class="flex items-center justify-between mb-2">
            <span class="px-3 py-1 bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider rounded-full">
              {{ nextPackage.name }}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-4">
            <span class="text-2xl font-bold text-text-primary">
              {{ getPriceInfo(nextPackage, selectedInterval).currencySymbol }}{{ getPriceInfo(nextPackage, selectedInterval).amount }}
            </span>
            <span
              v-if="(selectedInterval === 'month'
                ? getPriceInfo(nextPackage, 'month').originalAmount
                : getPriceInfo(nextPackage, 'year').originalAmount) >
                getPriceInfo(nextPackage, selectedInterval).amount"
              class="text-text-primary/50 line-through text-lg"
            >
              {{ getPriceInfo(nextPackage, selectedInterval).currencySymbol }}{{
                selectedInterval === 'month'
                  ? getPriceInfo(nextPackage, 'month').originalAmount
                  : getPriceInfo(nextPackage, 'year').originalAmount
              }}
            </span>
            <span class="text-text-secondary">/ {{ selectedInterval === 'month' ? 'mo' : 'yr' }}</span>
          </div>
          <p
            v-if="selectedInterval === 'year'"
            class="text-xs text-green-500 font-medium mt-1"
          >
            Save
            {{ getPriceInfo(nextPackage, 'year').currencySymbol }}
            {{
              (
                Number(getPriceInfo(nextPackage, 'year').originalAmount) -
                Number(getPriceInfo(nextPackage, 'year').amount)
              ).toFixed(2)
            }}
            per year
          </p>
          <p v-if="selectedInterval === 'month'" class="text-xs text-green-500 font-medium mt-1">
            Save {{ getPriceInfo(nextPackage, 'month')?.trialInfo }}
          </p>
          <p class="text-sm text-text-secondary mt-4 line-clamp-2">{{ nextPackage.description }}</p>
        </div>

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

        <div class="p-6 bg-bg-body border-t border-border">
          <Button
            variant="primary"
            class="w-full !py-3 font-bold text-base"
            @click="pay(nextPackage)"
            :disabled="isUpgrading && upgradingPackageId === nextPackage.id"
          >
            <i v-if="isUpgrading && upgradingPackageId === nextPackage.id" class="fa-solid fa-spinner fa-spin mr-2"></i>
            {{ isUpgrading && upgradingPackageId === nextPackage.id ? 'Upgrading…' : `Upgrade to ${nextPackage.name}` }}
          </Button>
        </div>
      </div>

    </div>
  </div>

</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import Button from "../../../components/ui/Button.vue";
import { toast } from "vue-sonner";
import {
  confirmPayment,
  useCurrentPackage,
  useUpgradePackage,
} from "../../../queries/usePackages";
import { useQueryClient } from "@tanstack/vue-query";
import { extractYear, formatDate } from "../../../utilities/FormatDate";
import { useRoute, useRouter } from "vue-router";
import { useWorkspaceStore } from "../../../stores/workspace";

const workspaceStore = useWorkspaceStore();
const route = useRoute();
const router = useRouter();

const {
  data: currentPackage,
  refetch: reftechCurrentPackage,
} = useCurrentPackage('individual')

watch(
  () => currentPackage.value,
  (pkg) => {
    if (pkg) {
      workspaceStore.setLimit(pkg);
    }
  },
  { immediate: true }
);

const selectedInterval = ref('month');
const intervalOptions = [
  { label: 'Monthly', value: 'month' },
  { label: 'Yearly (20% Off)', value: 'year' }
];

const formatFeature = (feature: any) => {
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
const getPriceInfo = (pkg: any, interval: any) => {
  // ✅ normalize to major currency unit
  const rawMonthPrice = pkg?.pricing?.month?.amount || 0;
  const monthPrice = rawMonthPrice / 100;

  const trialInfo =
    pkg?.pricing?.month?.trialDays > 0
      ? `${pkg?.pricing?.month?.trialDays} days free trial`
      : "";

  const discountPercent =
    pkg?.pricing?.month?.discount?.percentage || 0;

  const discountedMonthlyPrice =
    discountPercent > 0
      ? (monthPrice * (100 - discountPercent)) / 100
      : monthPrice;

  const currency = pkg?.pricing?.month?.currencySymbol || "$";

  if (interval === "year") {
    const totalYear = monthPrice * 12;
    const discountedYear = Math.round(totalYear * 0.8);

    return {
      amount: toPsychPrice(discountedYear),
      currencySymbol: currency,
      interval: "year",
      originalAmount: toPsychPrice(totalYear),
    };
  }

  return {
    amount: toPsychPrice(discountedMonthlyPrice),
    currencySymbol: currency,
    interval: "month",
    originalAmount: toPsychPrice(monthPrice),
    trialInfo: trialInfo,
  };
};

const toPsychPrice = (price: number) => { 
  if (Number.isInteger(price) && price > 0) {
    return (price - 0.01).toFixed(2);
  }
  return price.toFixed(2);
};

const sessionId = route.query.session_id as string;
const packageId = route.query.packageId as string;
const interval = (route.query.interval as string) || "month";

const queryClient = useQueryClient();

const { mutate: confirm, isPending: isConfirming } = confirmPayment(
  {
    sessionId: sessionId,
    interval: interval,
    packageId: packageId
  },
  {
    onSuccess: async () => {
      reftechCurrentPackage();
      await queryClient.invalidateQueries({ queryKey: ["current-package"] });
      // Also invalidate profile or workspace if they contain subscription info
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
       
      toast.success("Subscription upgraded successfully!");
      //  router.push("/settings?tab=billing");
      // Clean URL without reloading
      router.replace({ query: { ...route.query, stripePayment: undefined, session_id: undefined, packageId: undefined } });
    },
  }
);
const hasConfirmed = ref(false)

onMounted(() => {
  // Check for stored upgrade intent from Pricing page
  const intentStr = localStorage.getItem("post_auth_upgrade");
  if (intentStr && route.query.stripePayment) {
    try {
      const intent = JSON.parse(intentStr);
      localStorage.removeItem("post_auth_upgrade");
      
      // Trigger upgrade immediately
      upgradingPackageId.value = intent.packageId;
      upgradePackage({
        packageId: intent.packageId,
        interval: intent.interval || "month",
      });
    } catch (e) {
      console.error("Failed to parse post_auth_upgrade", e);
    }
  }

  if (route.query.stripePayment && sessionId && !hasConfirmed.value) {
    hasConfirmed.value = true;
    confirm({});
  }
});

const { mutate: upgradePackage, isPending: isUpgrading } = useUpgradePackage({
  onSuccess: async (data: any) => {
    window.location.href = data?.checkoutUrl;
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
const formatCurrentFeature = (feature: any) => {
  const limits = feature?.limits
  if (!limits) return 'Included feature'

  if (limits.maxWorkspaces)      return `${limits.maxWorkspaces} Workspaces`
  if (limits.storageGB)          return `${limits.storageGB} GB Storage`
  if (limits.requestsPerMonth)   return `${limits.requestsPerMonth.toLocaleString()} Tokens`
  if (limits.maxTeamMembers)     return `${limits.maxTeamMembers} Team Members`

  return feature.description || 'Included feature'
}
</script>
