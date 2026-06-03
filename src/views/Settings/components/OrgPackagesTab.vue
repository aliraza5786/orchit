<script setup lang="ts">
import { ref, computed } from "vue";
import { useTheme } from "../../../composables/useTheme";
import { useWorkspaceStore } from "../../../stores/workspace";
import { usePackages } from "../../../queries/usePricing";
import PricingSkeleton from "../../../components/skeletons/PricingSkeleton.vue";
import { useAuthStore } from "../../../stores/auth";
import { useRouter } from "vue-router";
import { useUpgradePackage } from "../../../queries/usePackages";
import { toast } from "vue-sonner";

const props = defineProps<{
  profile?: any
}>()

const activeCompany = computed(() => props.profile?.active_company)

const membershipRole = computed(() =>
  activeCompany.value?.membership_role || null
)

const permissions = computed<string[]>(() =>
  activeCompany.value?.permissions || []
)

function can(permission: string) {
  return permissions.value.includes(permission)
}

const isOwner = computed(() => membershipRole.value === 'owner' || membershipRole.value === 'super_admin' || membershipRole.value === 'editor' || membershipRole.value === 'admin')

const canUpgradePackage = computed(() =>
  isOwner.value || can('package.change')
)

// ── Verification checks ───────────────────────────────────────────────────────
// const companyId = computed<string>(() => localStorage.getItem('company_id') || '')

// const { data: domainsData } = useListDomains()
// const domains = computed(() => domainsData.value?.domains ?? [])
// const hasVerifiedDomain = computed(() => domains.value.some((d: any) => d.status === 'verified'))

// const { data: rolesData } = useCompanyRolesWithoutPermission()
// const allRoles = computed(() => rolesData.value?.data ?? rolesData.value ?? [])
// const superAdminRoles = computed(() => allRoles.value.filter((r: any) => r.is_super_admin).map((r: any) => r._id))

// const { data: usersData } = useCompanyUsers(computed(() => ({ company_id: companyId.value })).value)
// const members = computed(() => usersData.value?.data?.users ?? usersData.value?.users ?? [])
// const hasVerifiedSuperAdmin = computed(() => members.value.some((m: any) => m.company_role_id && superAdminRoles.value.includes(m.company_role_id)))


// ── Current active plan detection ─────────────────────────────────────────────
// Covers the most common field names the API might return
const currentPackageId = computed(() =>
  activeCompany.value?.package_id       ||
  activeCompany.value?.packageId        ||
  activeCompany.value?.package?._id     ||
  activeCompany.value?.package?.id      ||
  activeCompany.value?.subscription?.package_id ||
  activeCompany.value?.subscription?.packageId  ||
  null
)

const currentPackageSlug = computed(() =>
  activeCompany.value?.package?.slug    ||
  activeCompany.value?.package_slug     ||
  activeCompany.value?.subscription?.slug ||
  null
)

const currentInterval = computed(() =>
  activeCompany.value?.subscription?.interval ||
  activeCompany.value?.billing_interval        ||
  null
)

function isCurrentPlan(plan: any): boolean {
  if (!currentPackageId.value && !currentPackageSlug.value) {
    return plan.packageType === 'free'  // ← was: return false
  }
  if (currentPackageId.value && plan.packageId === currentPackageId.value) return true
  if (currentPackageSlug.value && plan.slug === currentPackageSlug.value) return true
  return false
}

const { isDark } = useTheme();
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
// const hasOrgDomain = computed(() => !!activeCompany.value?.custom_domain)
function handleClick(plan: any) {
  if (isCurrentPlan(plan)) return // no-op on current plan

  if (!canUpgradePackage.value) {
    return toast.error("You don't have permission to upgrade packages")
  }


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

// ── Format helpers ────────────────────────────────────────────────────────────
const formatLimits = (limits: any) => {
  if (!limits || Object.keys(limits).length === 0) return "Included";
  if (limits.storageGB)        return `Storage: ${limits.storageGB} GB`;
  if (limits.maxWorkspaces)    return `Workspaces: ${limits.maxWorkspaces}`;
  if (limits.maxTeamMembers)   return `Team Members: ${limits.maxTeamMembers}`;
  if (limits.maxProjects)      return `Projects: ${limits.maxProjects}`;
  if (limits.tokensPerPeriod)  return `${(limits.tokensPerPeriod / 1_000_000).toFixed(0)}M tokens/month`;
  if (limits.requestsPerMonth) return `Requests: ${limits.requestsPerMonth.toLocaleString()}/month`;
  return "Included";
};

const formatPackages = (packages: any[]) => {
  const staticFeatures = [
    { text: "unlimited shared spaces (owned by others)", available: true },
    { text: "Sheet creation with AI",                    available: true },
    { text: "Ticket creation with AI",                   available: true },
    { text: "Module Creation with AI",                   available: true },
    { text: "Unlimited AI agents",                       available: true },
    { text: "Mind map view",                             available: true },
    { text: "Calendar view",                             available: true },
    { text: "List view",                                 available: true },
    { text: "Timeline view",                             available: true },
    { text: "Kanban View",                               available: true },
    { text: "Gantt Chart View",                          available: true },
  ];

  return packages.map((pkg) => {
    const formatPrice = (price: number): number => {
      if (Number.isInteger(price) && price > 0) {
        return parseFloat((price - 0.01).toFixed(2));
      }
      return parseFloat(price.toFixed(2));
    };

    const baseMonthlyPrice   = pkg.activePrice?.amount / 100 || 0;
    const discountPercent    = pkg.activePrice?.discountPercentage || 0;
    const rawMonthlyPrice    = discountPercent > 0
      ? (baseMonthlyPrice * (100 - discountPercent)) / 100
      : baseMonthlyPrice;

    const monthlyPriceValue    = formatPrice(rawMonthlyPrice);
    const orginalMonthlyPrice  = formatPrice(baseMonthlyPrice);
    const priceYearly          = formatPrice(baseMonthlyPrice * 12 * 0.8);
    const originalYearlyPrice  = formatPrice(baseMonthlyPrice * 12);
    const trialDays            = pkg.activePrice?.trialDays || 0;
    const trialInfo            = trialDays > 0 ? `${trialDays} days free trial` : "";

    return {
      name:                pkg.name,
      slug:                pkg.slug,
      packageId:           pkg._id || pkg.id,
      description:         pkg.description || "",
      packageType:         pkg.packageType,
      priceMonthly:        monthlyPriceValue,
      priceYearly,
      orginalMonthlyPrice,
      originalYearlyPrice,
      trialInfo,
      button:              pkg.packageType === "free" ? "Try for Free" : "Subscribe",
      highlighted:         pkg.packageType === "professional",
      features: [
        ...pkg.features.map((f: any) => ({
          text: f.name + (formatLimits(f.limits) !== "Included" ? ` (${formatLimits(f.limits)})` : ""),
          available: f.enabled,
        })),
        ...staticFeatures,
      ],
    };
  });
};

const { data, isLoading } = usePackages({ scope: "organization" });

const pricingPlans = computed(() => {
  if (!data.value) return [];
  return formatPackages(data.value);
});

// Sync the billing toggle to match the current subscription interval on load
// so the active badge always appears on the correct tab
if (currentInterval.value === 'year') {
  isYearly.value = true;
}
</script>

<template>
  <section class="w-full py-[40px] md:py-[70px] xl:py-[105px]">
    <div class="custom_container">

      <!-- Heading -->
      <div class="mb-[32px] text-center">
        <small class="text-sky text-center block leading-[24px] md:leading-[32px] text-[16px] md:text-[20px] lg:text-[24px] font-bold lg:tracking-[-1px] mb-[10px] md:mb-[15px] xl:mb-[20px]">
          Pricing
        </small>
        <h2 class="text-center text-primary font-bold text-[24px] md:text-[36px] lg:text-[40px] leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px]">
          Simple, Transparent Pricing For Every Team.
        </h2>
      </div>

      <!-- Toggle -->
      <div class="mb-[30px] lg:mb-[50px] flex justify-center">
        <div class="toggle_btn flex items-center justify-center gap-[10px] lg:gap-[24px] w-[290px] lg:w-[349px] h-[55px] lg:h-[59px] rounded-[30px] border border-border-input">
          <span class="text-[16px] lg:text-[18px] font-medium" :class="{ 'text-text-secondary': isYearly }">Pay Monthly</span>
          <button
            @click="isYearly = !isYearly"
            class="relative inline-flex h-7 w-12 items-center rounded-full p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 px-1"
            :class="isYearly ? 'bg-accent' : 'bg-gray-700'"
          >
            <span
              class="h-5 w-5 rounded-full bg-white transform transition-transform duration-250 ease-in-out"
              :class="{ 'translate-x-5': isYearly, 'translate-x-0': !isYearly }"
            />
          </button>
          <span class="text-[16px] lg:text-[18px] font-medium" :class="{ 'text-text-secondary': !isYearly }">Pay Yearly</span>
        </div>
      </div>

      <!-- Cards -->
      <div v-if="isLoading">
        <PricingSkeleton />
      </div>
      <div v-else-if="pricingPlans.length === 0">No plans available</div>
      <div v-else class="grid md:grid-cols-4 gap-6">
        <div
          v-for="plan in pricingPlans"
          :key="plan.name"
          class="relative group rounded-2xl border p-[28px] flex flex-col justify-between transition-all duration-300"
          :class="[
            isCurrentPlan(plan)
              ? 'border-accent ring-2 ring-accent/30'
              : !isDark
                ? 'border-[#a495e9b5] hover:scale-[1.01]'
                : 'border-border-input hover:scale-[1.01]'
          ]"
        >

          <!-- Gradient border overlay (non-current plans) -->
          <div
            v-if="!isCurrentPlan(plan)"
            class="absolute inset-0 rounded-2xl p-[1px] bg-accent/20 transition-opacity duration-300 border border-accent"
            :class="{
              'opacity-100': plan.highlighted,
              'opacity-0 group-hover:opacity-100': !plan.highlighted,
            }"
          >
            <div
              class="w-full h-full rounded-2xl"
              :class="[plan.name === 'Pro' ? (isDark ? 'bg-white/5' : '') : 'bg-bg-body']"
            ></div>
          </div>

          <!-- ── CURRENT PLAN BADGE ── -->
          <div
            v-if="isCurrentPlan(plan)"
            class="absolute -top-3 left-1/2 -translate-x-1/2 z-20"
          >
            <span class="inline-flex items-center gap-1.5 bg-accent text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md shadow-accent/30 whitespace-nowrap">
              <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none">
                <path d="M2 6.5l2.5 2.5L10 3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Current plan
            </span>
          </div>

          <!-- Content -->
          <div class="relative z-10">
            <h3 class="text-[24px] font-bold text-text-primary text-center leading-[30px] mb-[7px]">
              {{ plan.name }}
            </h3>
            <p class="text-[14px] text-text-secondary text-center leading-[21px] font-normal mb-[21px]">
              {{ plan.description }}
            </p>

            <!-- Price -->
            <div class="mb-[21px]">
              <div class="relative flex flex-col items-center justify-center">
                <div class="flex items-center">
                  <div class="price-container tracking-normal inline-block text-[22px] leading-[21px] font-bold">
                    <transition name="price-fade" mode="out-in">
                      <span
                        :key="(isYearly ? 'y' : 'm') + plan.name"
                        class="flex gap-1"
                        style="font-variant-numeric: tabular-nums"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-text-primary text-xl font-bold">
                            ${{ isYearly ? plan.priceYearly : plan.priceMonthly }}
                          </span>
                          <span
                            v-if="(isYearly && plan.originalYearlyPrice > plan.priceYearly) || (!isYearly && plan.orginalMonthlyPrice > plan.priceMonthly)"
                            class="text-text-primary/50 line-through text-sm"
                          >
                            ${{ isYearly ? plan.originalYearlyPrice : plan.orginalMonthlyPrice }}
                          </span>
                        </div>
                      </span>
                    </transition>
                  </div>
                  <span class="text-[14px] leading-[21px] text-text-secondary font-normal ml-2">
                    / {{ isYearly ? "year" : "month" }}
                  </span>
                </div>

                <!-- Trial info -->
                <div v-if="plan.trialInfo && !isYearly" class="mt-1">
                  <span class="text-[12px] text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                    {{ plan.trialInfo }}
                  </span>
                </div>

                <!-- Yearly savings -->
                <div v-if="isYearly && plan.originalYearlyPrice - plan.priceYearly > 0" class="mt-1">
                  <span class="text-[12px] text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                    Save ${{ (plan.originalYearlyPrice - plan.priceYearly).toFixed(2) }} per year
                  </span>
                </div>

                <!-- Free plan label -->
                <div v-if="plan.packageType === 'free'" class="mt-1 flex flex-col items-center gap-1">
                  <span class="text-[12px] text-green-500 mx-auto font-medium bg-green-500/10 px-2 py-0.5 rounded-full">
                    Enjoy free plan
                  </span>
                  <span class="text-[13px] text-text-secondary px-2 py-0.5 text-center mt-2">
                  Org free plan: 15 workspaces, 25GB storage, 500K AI tokens/month
                </span>
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <button
              v-if="isCurrentPlan(plan)"
              disabled
              class="w-full py-[14px] rounded-[12px] font-normal text-[14px] transition relative z-10 cursor-default opacity-80"
              :class="isDark
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'bg-accent/10 text-accent border border-accent/30'"
            >
              <span class="flex items-center justify-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8.5l3 3L13 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Active plan
              </span>
            </button>

            <button
              v-else
              @click="handleClick(plan)"
              :disabled="(isUpgrading && upgradingPackageId === plan.packageId) || !canUpgradePackage"
              class="w-full py-[14px] cursor-pointer rounded-[12px] font-normal text-[14px] transition relative z-10 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
              :class="[
                isDark
                  ? plan.highlighted
                    ? 'bg-white text-black hover:bg-gray-200'
                    : 'bg-bg-charcoal text-white hover:bg-white hover:text-black'
                  : 'bg-gradinet text-white hover:opacity-90',
              ]"
            >
              {{ isUpgrading && upgradingPackageId === plan.packageId ? "Upgrading..." : plan.button }}
            </button>
          </div>

          <!-- Features -->
          <div class="mt-8 text-left relative z-10">
            <p class="text-[14px] text-text-primary text-left leading-[21px] font-normal pb-[8px] border-b border-border mb-[14px]">
              Features included:
            </p>
            <ul class="space-y-[14px]">
              <li
                v-for="feature in plan.features"
                :key="feature.text"
                class="flex items-start gap-2 text-sm"
              >
                <span v-if="feature.available" class="text-green-400 font-bold text-lg leading-none">✓</span>
                <span v-else class="text-text-secondary font-bold text-lg leading-none">✕</span>
                <span
                  class="text-[14px] text-left leading-[21px] font-normal capitalize"
                  :class="[
                    feature.available ? 'text-text-primary' : 'text-text-secondary',
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