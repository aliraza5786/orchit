<script setup lang="ts">
import { ref, computed } from "vue";
import { useTheme } from "../composables/useTheme";
import { useWorkspaceStore } from "../stores/workspace";
import { usePackages } from "../queries/usePricing";
import PricingSkeleton from "../components/skeletons/PricingSkeleton.vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import { useUpgradePackage } from "../queries/usePackages";

const { isDark } = useTheme(); // light / dark / system
const isYearly = ref(false);
const workspaceStore = useWorkspaceStore();

const authStore = useAuthStore();
const router = useRouter();

const { mutate: upgradePackage, isPending: isUpgrading } = useUpgradePackage({
  onSuccess: async (data: any) => {
   window.location.href = data?.checkoutUrl;
  },
});

const upgradingPackageId = ref<string | null>(null);

function handleClick(plan: any) {
  if (authStore.isAuthenticated) {
    upgradingPackageId.value = plan.packageId;
    upgradePackage({
      packageId: plan.packageId,
      interval: isYearly.value ? "year" : "month",
    });
  } else {
    workspaceStore.setPricing(true);
    localStorage.setItem(
      "post_auth_upgrade",
      JSON.stringify({
        packageId: plan.packageId,
        interval: isYearly.value ? "year" : "month",
      })
    );
    router.push("/register");
  }
}

// ----------------- Format Feature Limits -----------------
const formatLimits = (limits: any) => {
  if (!limits || Object.keys(limits).length === 0) return "Included";
  if (limits.storageGB) return `Storage: ${limits.storageGB} GB`;
  if (limits.maxWorkspaces) return `Workspaces: ${limits.maxWorkspaces}`;
  if (limits.maxTeamMembers) return `Team Members: ${limits.maxTeamMembers}`;
  if (limits.maxProjects) return `Projects: ${limits.maxProjects}`;
  if (limits.requestsPerMonth)
    return `Requests: ${limits.requestsPerMonth.toLocaleString()}/month`;
  return "Included";
};

// ----------------- Format API Response -----------------
const formatPackages = (packages: any[]) => {
  const staticFeatures = [
    { text: "unlimited shared spaces (owned by others)", available: true },
    { text: "Sheet creation with AI", available: true },
    { text: "Ticket creation with AI", available: true },
    { text: "Module Creation with AI", available: true },
    { text: "Unlimited AI agents", available: true },
    { text: "Mind map view", available: true },
    { text: "Calendar view", available: true },
    { text: "List view", available: true },
    { text: "timeline view", available: true },
    { text: "Kanban View", available: true },
    { text: "Gantt Chart View", available: true },
  ];

  return packages.map((pkg) => {
    // Helper for psychological pricing (30 → 29.99)
      const formatPrice = (price: number): number => {
          if (Number.isInteger(price) && price > 0) {
           return parseFloat((price - 0.01).toFixed(2));
          }
        return parseFloat(price.toFixed(2));
      };
    const baseMonthlyPrice = (pkg.activePrice?.amount || 0);
    const discountPercent = pkg.activePrice?.discountPercentage || 0;
     
     // Apply discount only if applicable
    const rawMonthlyPrice =
    discountPercent > 0
    ? (baseMonthlyPrice * (100 - discountPercent)) / 100
    : baseMonthlyPrice;
    const monthlyPriceValue = formatPrice(rawMonthlyPrice);
    const orginalMonthlyPrice = formatPrice(baseMonthlyPrice)
    
    const trialDays = pkg.activePrice?.trialDays || 0;
    const trialInfo = trialDays > 0 ? `${trialDays} days free trial` : "";
    
    // const monthsBilled = Math.max(0, 12 - 2); 
    const priceYearly = formatPrice(baseMonthlyPrice * 12 * 0.8);
    const originalYearlyPrice = formatPrice(baseMonthlyPrice * 12); 

    return {
      name: pkg.name,
      packageId: pkg._id || pkg.id,
      description: pkg.description || "",
      priceMonthly: monthlyPriceValue,
      priceYearly: priceYearly,
      orginalMonthlyPrice:orginalMonthlyPrice,
      originalYearlyPrice:originalYearlyPrice,
      trialInfo,
      button: pkg.packageType === "free" ? "Try for Free" : "Subscribe",
      highlighted: pkg.packageType === "professional",
      features: [
        ...pkg.features.map((f: any) => ({
          text:
            f.name +
            (formatLimits(f.limits) !== "Included"
              ? ` (${formatLimits(f.limits)})`
              : ""),
          available: f.enabled,
        })),
        ...staticFeatures,
      ],
    };
  });
};

// ----------------- Vue Query -----------------
const { data, isLoading } = usePackages();
const pricingPlans = computed(() => {
  if (!data.value) return [];
  return formatPackages(data.value);
});
</script>

<template>
  <section
    class="w-full py-[40px] md:py-[70px] xl:py-[105px] px-[15px]"
  >
    <div class="custom_container">
      <!-- Heading -->
      <div class="mb-[32px] text-center">
        <small
          class="text-sky text-center block leading-[24px] md:leading-[32px] text-[16px] md:text-[20px] lg:text-[24px] font-bold lg:tracking-[-1px] mb-[10px] md:mb-[15px] xl:mb-[20px]"
        >
          Pricing
        </small>
        <h2
          class="text-center text-primary font-bold text-[24px] md:text-[36px] lg:text-[40px] leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px]"
        >
          Simple, Transparent Pricing For Every Team.
        </h2>
      </div>

      <!-- Toggle -->
      <div class="mb-[30px] lg:mb-[50px] flex justify-center">
        <div
          class="toggle_btn flex items-center justify-center gap-[10px] lg:gap-[24px] w-[290px] lg:w-[349px] h-[55px] lg:h-[59px] rounded-[30px] border border-border-input"
        >
          <span
            class="text-[16px] lg:text-[18px] font-medium"
            :class="{ 'text-text-secondary': isYearly }"
            >Pay Monthly</span
          >

          <button
            @click="isYearly = !isYearly"
            class="relative inline-flex h-7 w-12 items-center rounded-full  p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 px-1"
            :class="isYearly? 'bg-accent':'bg-gray-700'"
          >
            <span
              class="h-5 w-5 rounded-full bg-white transform transition-transform duration-250 ease-in-out"
              :class="{ 'translate-x-5': isYearly, 'translate-x-0': !isYearly }"
            />
          </button>

          <span
            class="text-[16px] lg:text-[18px] font-medium"
            :class="{ 'text-text-secondary': !isYearly }"
            >Pay Yearly</span
          >
        </div>
      </div>

      <!-- Cards -->
      <div v-if="isLoading">
        <PricingSkeleton />
      </div>
      <div v-else-if="pricingPlans.length === 0">No plans available</div>
      <div v-else class="grid md:grid-cols-3 gap-[25px] md:gap-[15px] xl:gap-[44px]">
        <div
          v-for="plan in pricingPlans"
          :key="plan.name"
          class="relative group rounded-2xl border p-[28px] flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]"
          :class="
            !isDark ? 'border-[#a495e9b5]' : 'border-border-input'
          "
        >
          <!-- Gradient border -->
          <div
            class="absolute inset-0 rounded-2xl p-[1px] bg-accent/20 transition-opacity duration-300  border  border-accent"
            :class="{
              'opacity-100': plan.highlighted,
              'opacity-0 group-hover:opacity-100': !plan.highlighted,
            }"
          >
            <div
              class="w-full h-full rounded-2xl"
              :class="[
                plan.name === 'Pro'
                  ? isDark
                    ? 'bg-white/5'
                    : ''
                  : 'bg-bg-body',
              ]"
            ></div>
          </div>

          <!-- Content -->
          <div class="relative z-10">
            <h3
              class="text-[24px] font-bold text-text-primary text-center leading-[30px] mb-[7px]"
            >
              {{ plan.name }}
            </h3>
            <p
              class="text-[14px] text-text-secondary text-center leading-[21px] font-normal mb-[21px]"
            >
              {{ plan.description }}
            </p>
            <!-- Price -->
            <div class="mb-[21px]">
              <div class="relative flex flex-col items-center justify-center">
                <div class="flex items-center">
                  <div
                    class="price-container tracking-normal inline-block text-[22px] leading-[21px] font-bold"
                  >
                    <transition name="price-fade" mode="out-in">
                      <span
                        :key="(isYearly ? 'y' : 'm') + plan.name"
                        class="flex gap-1"
                        style="font-variant-numeric: tabular-nums"
                      >
                         <div class="flex items-center gap-2">
                           <!-- Final price -->
                           <span class="text-text-primary text-xl font-bold">
                             ${{ isYearly ? plan.priceYearly : plan.priceMonthly }}
                           </span>
                         
                           <!-- Original price (strikethrough) -->
                           <span
                             v-if="
                               (isYearly && plan.originalYearlyPrice > plan.priceYearly) ||
                               (!isYearly && plan.orginalMonthlyPrice > plan.priceMonthly)
                             "
                             class="text-text-primary/50 line-through text-sm"
                           >
                             ${{ isYearly ? plan.originalYearlyPrice : plan.orginalMonthlyPrice }}
                           </span>
                         </div>                                 
                      </span>
                    </transition>
                  </div>
                  <span
                    class="text-[14px] leading-[21px] text-text-secondary font-normal ml-2"
                    >/ {{ isYearly ? "year" : "month" }}</span
                  >
                </div>
                <!-- Trial Info -->
                <div v-if="plan.trialInfo && !isYearly" class="mt-1">
                  <span class="text-[12px] text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                    {{ plan.trialInfo }}
                  </span> 
                </div>
                <!-- 20% off per year -->
                <div v-if="isYearly && plan.originalYearlyPrice - plan.priceYearly > 0"  class="mt-1">
                  <span class="text-[12px] text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                    Save {{ plan.originalYearlyPrice - plan.priceYearly }}$ per year
                  </span> 
                </div>
                <div v-if="plan.name.toLowerCase() === 'free' "  class="mt-1">
                  <span class="text-[12px] text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                    Enjoy free plan
                  </span> 
                </div>
              </div>
            </div>

            <!-- Button -->
            <button
              @click="handleClick(plan)"
              :disabled="isUpgrading && upgradingPackageId === plan.packageId"
              class="w-full py-[14px] cursor-pointer rounded-[12px] font-normal text-[14px] transition relative z-10 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1)]"
              :class="[
                isDark
                  ? plan.highlighted
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-bg-charcoal text-white hover:bg-white hover:text-black'
                  : plan.highlighted
                  ? 'bg-gradinet  text-white hover:bg-gradinet  hover:text-white'
                  : 'bg-gradinet  text-white hover:bg-gradinet  hover:text-white',
              ]"
            >
              {{ isUpgrading && upgradingPackageId === plan.packageId ? "Upgrading..." : plan.button }}
            </button>
          </div>

          <!-- Features -->
          <div class="mt-8 text-left relative z-10">
            <p
              class="text-[14px] text-text-primary text-left leading-[21px] font-normal pb-[8px] border-b border-border mb-[14px]"
            >
              Features included:
            </p>
            <ul class="space-y-[14px]">
              <li
                v-for="feature in plan.features"
                :key="feature.text"
                class="flex items-start gap-2 text-sm"
              >
                <span
                  v-if="feature.available"
                  class="text-green-400 font-bold text-lg leading-none"
                  >✓</span
                >
                <span
                  v-else
                  class="text-text-secondary font-bold text-lg leading-none"
                  >✕</span
                >
                <span
                  class="text-[14px] text-left leading-[21px] font-normal capitalize"
                  :class="[
                    feature.available
                      ? 'text-text-primary'
                      : 'text-text-secondary',
                    isDark ? 'text-black' : '',
                  ]"
                >
                  {{ feature.text }}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.price-fade-enter-active,
.price-fade-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.price-fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.price-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.price-container {
  font-variant-numeric: tabular-nums;
}

.bg-gradinet {
  background: linear-gradient(142.27deg, #4e3c9e 11.4%, #b5a1f7 84.44%);
}
</style>
