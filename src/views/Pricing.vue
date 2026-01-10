<script setup lang="ts">
import { ref, computed } from "vue";
import { useTheme } from "../composables/useTheme";
import { useWorkspaceStore } from "../stores/workspace";
import { usePackages } from "../queries/usePricing";

const { theme, isDark } = useTheme(); // light / dark / system
const isYearly = ref(false);
const workspaceStore = useWorkspaceStore();

function handleClick() {
  workspaceStore.setPricing(true);
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
  return packages.map((pkg) => ({
    name: pkg.name,
    description: pkg.description || "",
    priceMonthly:
      pkg.activePrice?.interval === "month" ? pkg.activePrice.amount : 0,
    priceYearly:
      pkg.activePrice?.interval === "year"
        ? pkg.activePrice.amount
        : pkg.activePrice?.amount * 12 || 0,
    button: pkg.activePrice ? "Subscribe" : "Try for Free",
    highlighted:
      pkg.packageType === "starter" || pkg.packageType === "professional", // example logic
    features: pkg.features.map((f: any) => ({
      text:
        f.name +
        (formatLimits(f.limits) !== "Included"
          ? ` (${formatLimits(f.limits)})`
          : ""),
      available: f.enabled,
    })),
  }));
};

// ----------------- Vue Query -----------------
const { data, isLoading } = usePackages();
const pricingPlans = computed(() => {
  console.log("API data:", data.value); // Check what's coming from the API
  if (!data.value) return [];
  return formatPackages(data.value);
});
</script>

<template>
  <section
    class="float-left w-full py-[40px] md:py-[70px] xl:py-[105px] px-[15px]"
  >
    <div class="custom_container">
      <!-- Heading -->
      <div class="mb-[32px] text-center">
        <small
          class="text-sky text-center block leading-[24px] md:leading-[32px] text-[16px] md:text-[20px] lg:text-[24px] font-manrope font-bold lg:tracking-[-1px] mb-[10px] md:mb-[15px] xl:mb-[20px]"
        >
          Pricing
        </small>
        <h2
          class="font-manrope text-center text-primary font-bold text-[24px] md:text-[36px] lg:text-[40px] leading-[34px] md:leading-[44px] lg:leading-[56px] tracking-[-1px]"
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
            class="font-manrope text-[16px] lg:text-[18px] font-medium"
            :class="{ 'text-text-secondary': isYearly }"
            >Pay Monthly</span
          >

          <button
            @click="isYearly = !isYearly"
            class="relative inline-flex h-7 w-12 items-center rounded-full bg-gray-700 p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <span
              class="h-5 w-5 rounded-full bg-white transform transition-transform duration-250 ease-in-out"
              :class="{ 'translate-x-5': isYearly, 'translate-x-0': !isYearly }"
            />
          </button>

          <span
            class="font-manrope text-[16px] lg:text-[18px] font-medium"
            :class="{ 'text-text-secondary': !isYearly }"
            >Pay Yearly</span
          >
        </div>
      </div>

      <!-- Cards -->
      <div v-if="isLoading">Loading plans...</div>
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
            class="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-opacity duration-300"
            :class="{
              'opacity-100': plan.highlighted,
              'opacity-0 group-hover:opacity-100 ': !plan.highlighted,
            }"
          >
            <div class="w-full h-full rounded-2xl bg-bg-body"></div>
          </div>

          <!-- Content -->
          <div class="relative z-10">
            <h3
              class="text-[14px] font-manrope text-text-primary text-center leading-[21px] font-normal mb-[7px]"
            >
              {{ plan.name }}
            </h3>
            <p
              class="text-[14px] font-manrope text-text-secondary text-center leading-[21px] font-normal mb-[21px]"
            >
              {{ plan.description }}
            </p>
            <!-- Price -->
            <div class="mb-[21px]">
              <div class="relative flex items-center justify-center">
                <div
                  class="price-container tracking-normal inline-block text-[22px] leading-[21px] font-bold"
                >
                  <transition name="price-fade" mode="out-in">
                    <span
                      :key="(isYearly ? 'y' : 'm') + plan.name"
                      class="block"
                      style="font-variant-numeric: tabular-nums"
                    >
                      <span v-if="plan.priceMonthly === 0 && !isYearly"
                        >$0</span
                      >
                      <span v-else-if="plan.priceMonthly === 0 && isYearly"
                        >$0</span
                      >
                      <span v-else>
                        ${{
                          (isYearly
                            ? plan.priceYearly
                            : plan.priceMonthly
                          ).toFixed(2)
                        }}
                      </span>
                    </span>
                  </transition>
                </div>
                <span
                  class="text-[14px] leading-[21px] text-text-secondary font-normal ml-2"
                  >/ {{ isYearly ? "year" : "month" }}</span
                >
              </div>
            </div>

            <!-- Button -->
            <router-link to="/register">
              <button
                @click="handleClick"
                class="w-full py-[14px] cursor-pointer rounded-[12px] font-manrope font-normal text-[14px] transition relative z-10 shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1)]"
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
                {{ plan.button }}
              </button>
            </router-link>
          </div>

          <!-- Features -->
          <div class="mt-8 text-left relative z-10">
            <p
              class="text-[14px] font-manrope text-text-primary text-left leading-[21px] font-normal pb-[8px] border-b border-border mb-[14px]"
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
                  class="text-[14px] font-manrope text-left leading-[21px] font-normal"
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
