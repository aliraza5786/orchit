<template>
  <AuthLayout>
    <template #form>
      <div
        class="max-w-[400px] mx-auto w-full min-h-full py-10 flex flex-col justify-center px-4"
      >
        <div class="space-y-7 relative z-10 w-full">
          <!-- Icon + heading -->
          <div
            class="flex flex-col items-center text-center space-y-5 animate-slide-up-step-1"
          >
            <!-- Animated shield / lock icon -->
            <div
              class="w-20 h-20 rounded-2xl flex items-center justify-center relative icon-container shadow-inner"
              style="
                background: color-mix(in srgb, var(--accent) 12%, transparent);
                border: 1.5px solid
                  color-mix(in srgb, var(--accent) 25%, transparent);
              "
            >
              <!-- Glowing Aura -->
              <div
                class="absolute inset-0 rounded-2xl bg-accent/20 animate-pulse-glow pointer-events-none"
              ></div>

              <svg
                class="w-10 h-10 relative z-10 lock-icon"
                viewBox="0 0 24 24"
                fill="none"
                style="color: var(--accent)"
              >
                <path
                  d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linejoin="round"
                />
                <rect
                  x="9"
                  y="11"
                  width="6"
                  height="5"
                  rx="1"
                  stroke="currentColor"
                  stroke-width="1.4"
                />
                <path
                  d="M12 11V9a1.5 1.5 0 013 0v2"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                />
              </svg>
            </div>

            <div class="space-y-2">
              <h2
                class="text-[24px] font-medium tracking-tight text-text-primary"
              >
                You're already linked!
              </h2>
              <p
                class="text-xs leading-relaxed max-w-[340px] mx-auto text-text-secondary"
              >
                Your email is registered with an existing organization on Orchit
                AI. You can access your workspace dashboard immediately.
              </p>
            </div>
          </div>

          <!-- Company card -->
          <div
            v-if="associatedCompany"
            class="flex items-center gap-4 rounded-xl px-5 py-4 border text-left company-card transition-all duration-300 hover:scale-[1.02] w-full"
            style="background: var(--bg-card); border-color: var(--border)"
          >
            <!-- Company logo or initials -->
            <div
              class="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center overflow-hidden text-white font-bold text-lg shadow-md transition-transform duration-300 hover:rotate-6"
              style="
                background: linear-gradient(
                  135deg,
                  var(--accent),
                  color-mix(in srgb, var(--accent) 60%, #7c3aed)
                );
              "
            >
              <img
                v-if="associatedCompany.logo"
                :src="associatedCompany.logo"
                :alt="associatedCompany.title"
                class="w-full h-full object-cover"
              />
              <span v-else>{{
                associatedCompany.title?.charAt(0)?.toUpperCase() || "?"
              }}</span>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-[15px] font-bold text-text-primary truncate">
                {{ associatedCompany.title }}
              </p>
              <p class="text-xs mt-0.5 truncate text-text-secondary">
                <span
                  class="font-mono bg-surface/50 px-1.5 py-0.5 rounded border border-border/40"
                  >{{ associatedCompany.slug }}</span
                >.streamed.space
              </p>
            </div>

            <!-- Associated badge -->
            <span
              class="shrink-0 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm bg-accent/10 border border-accent/20 text-accent"
            >
              Associated
            </span>
          </div>

          <!-- Info banner -->
          <div
            v-if="associatedCompany"
            class="flex items-start gap-3 rounded-xl px-4 py-3.5 border text-left info-banner animate-slide-up-step-3 w-full"
            style="
              background: color-mix(in srgb, #f59e0b 6%, transparent);
              border-color: color-mix(in srgb, #f59e0b 25%, transparent);
            "
          >
            <svg
              class="w-4 h-4 mt-0.5 shrink-0"
              viewBox="0 0 16 16"
              fill="none"
              style="color: #f59e0b"
            >
              <circle
                cx="8"
                cy="8"
                r="7"
                stroke="currentColor"
                stroke-width="1.4"
              />
              <path
                d="M8 5v4M8 11v.5"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
              />
            </svg>
            <p
              class="text-[11px] leading-relaxed text-amber-600 dark:text-amber-400"
            >
              You are currently linked to
              <strong>{{ associatedCompany.title }}</strong
              >. If you need a new workspace or organization, please contact
              your administrator or register with a different email address.
            </p>
          </div>

          <!-- Actions using Button component -->
          <div class="flex gap-4 w-full animate-slide-up-step-4">
            <Button variant="secondary" size="md" :block="true" @click="logout">
              <div class="flex items-center justify-center gap-1.5">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign out
              </div>
            </Button>
            <Button
              variant="primary"
              size="md"
              :block="true"
              @click="goToDashboard"
            >
              <div class="flex items-center justify-center gap-1.5">
                Go to Dashboard
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import AuthLayout from "../../layout/AuthLayout/AuthLayout.vue";
import Button from "../../components/ui/Button.vue";
import { useAuthStore } from "../../stores/auth";
import darkLogo from "@assets/global/dark-logo.png";
import lightLogo from "@assets/global/light-logo.png";
import { useTheme } from "../../composables/useTheme";

const router = useRouter();
const authStore = useAuthStore();
const { isDark } = useTheme();

const userData = computed(() => authStore.user?.data ?? authStore.user);
const associatedCompany = computed(() => userData.value?.associated_company);

function logout() {
  authStore.logout();
  router.push("/login");
}

function goToDashboard() {
  router.push("/dashboard");
}
</script>

<style scoped>
.icon-container {
  animation: float 4s ease-in-out infinite;
}

.lock-icon {
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.icon-container:hover .lock-icon {
  transform: scale(1.1) rotate(5deg);
}

.company-card {
  box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.company-card:hover {
  border-color: var(--accent) !important;
  box-shadow: 0 8px 24px 0 rgba(0, 0, 0, 0.05);
}

.info-banner {
  box-shadow: 0 2px 8px 0 rgba(245, 158, 11, 0.03);
}

/* Custom CSS Animations */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.35;
  }
}

/* Sequential entry animations */
.animate-slide-up-step-1 {
  animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.company-card {
  animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s backwards;
}

.animate-slide-up-step-3 {
  animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.25s backwards;
}

.animate-slide-up-step-4 {
  animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s backwards;
}

@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
