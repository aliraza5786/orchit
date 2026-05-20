<template>
  <AuthLayout>
    <template #form>
      <div
        class="max-w-[400px] mx-auto w-full text-text-primary min-h-full py-10 flex flex-col justify-center px-4"
      >
        <!-- Logo -->
        <router-link to="/">
          <img
            :src="isDark ? darkLogo : lightLogo"
            class="w-[130px] mb-6 d-block mx-auto"
            alt="logo"
          />
        </router-link>

        <div v-if="verifying" class="text-center py-12 space-y-4">
          <div
            class="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent mx-auto"
          ></div>
          <p class="text-sm text-text-secondary">
            Verifying your reset link...
          </p>
        </div>

        <div v-else-if="tokenExpired" class="text-center space-y-6">
          <div
            class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto relative icon-container shadow-inner"
            style="
              background: color-mix(in srgb, #ef4444 12%, transparent);
              border: 1.5px solid color-mix(in srgb, #ef4444 25%, transparent);
            "
          >
            <svg
              class="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div class="space-y-3">
            <h3 class="text-[24px] leading-7 font-medium text-text-primary">
              Reset link expired
            </h3>
            <p class="text-sm text-text-secondary mt-1">
              This password reset link has expired or is invalid.<br />
              Please request a new one.
            </p>
          </div>
          <div class="space-y-3 pt-2">
            <Button
              size="md"
              variant="primary"
              :block="true"
              @click="router.push('/forgot-password')"
            >
              Request new reset link
            </Button>
            <Button
              size="md"
              appearance="outlined"
              variant="ghost"
              :block="true"
              @click="router.push('/login')"
            >
              Back to login
            </Button>
          </div>
        </div>

        <div v-else-if="resetSuccess" class="text-center space-y-6">
          <div class="space-y-3">
            <h3 class="text-[24px] leading-7 font-medium text-text-primary">
              Password reset successful
            </h3>
            <p class="text-sm text-text-secondary mt-1">
              Your password has been successfully reset.<br />
              You can now sign in with your new password.
            </p>
          </div>
          <div class="space-y-3 pt-2">
            <Button
              size="md"
              variant="primary"
              :block="true"
              @click="router.push('/login')"
            >
              Go to login
            </Button>
          </div>
        </div>

        <div v-else class="space-y-6">
          <div class="mb-6 text-center animate-slide-up-step-1">
            <h3 class="text-[24px] leading-7 font-medium text-text-primary">
              Reset your password
            </h3>
            <p class="text-sm text-text-secondary mt-3">
              Enter your new password below
            </p>
          </div>

          <form @submit.prevent="handleResetPassword" class="space-y-3 w-full">
            <BaseTextField
              v-model="newPassword"
              type="password"
              placeholder="Enter new password"
              size="md"
              :error="newPasswordHasError"
              :message="newPasswordError"
              @blur="touched.newPassword = true"
            />
            <BaseTextField
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              size="md"
              :error="confirmPasswordHasError"
              :message="confirmPasswordError"
              @blur="touched.confirmPassword = true"
            />

            <!-- Premium Requirement Cards -->
            <div
              class="bg-bg-card border border-border rounded-[6px] p-4.5 space-y-3"
            >
              <p class="text-xs font-medium text-text-secondary">
                Password must satisfy:
              </p>
              <ul class="space-y-2.5">
                <li
                  class="flex items-center gap-2.5 text-xs transition-colors duration-200"
                  :class="
                    hasMinLength
                      ? 'text-accent font-medium'
                      : 'text-text-secondary'
                  "
                >
                  <span
                    class="w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all duration-300"
                    :class="
                      hasMinLength
                        ? 'bg-accent/10 border-accent/30 text-accent shadow-sm'
                        : 'bg-surface/50 border-border text-text-secondary/30'
                    "
                  >
                    <svg
                      v-if="hasMinLength"
                      class="w-2.5 h-2.5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span
                      v-else
                      class="w-1.5 h-1.5 rounded-full bg-text-secondary/30"
                    ></span>
                  </span>
                  At least 8 characters
                </li>
                <li
                  class="flex items-center gap-2.5 text-xs transition-colors duration-200"
                  :class="
                    hasNumber
                      ? 'text-accent font-medium'
                      : 'text-text-secondary'
                  "
                >
                  <span
                    class="w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all duration-300"
                    :class="
                      hasNumber
                        ? 'bg-accent/10 border-accent/30 text-accent shadow-sm'
                        : 'bg-surface/50 border-border text-text-secondary/30'
                    "
                  >
                    <svg
                      v-if="hasNumber"
                      class="w-2.5 h-2.5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span
                      v-else
                      class="w-1.5 h-1.5 rounded-full bg-text-secondary/30"
                    ></span>
                  </span>
                  Contains a number
                </li>
                <li
                  class="flex items-center gap-2.5 text-xs transition-colors duration-200"
                  :class="
                    hasSpecialChar
                      ? 'text-accent font-medium'
                      : 'text-text-secondary'
                  "
                >
                  <span
                    class="w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all duration-300"
                    :class="
                      hasSpecialChar
                        ? 'bg-accent/10 border-accent/30 text-accent shadow-sm'
                        : 'bg-surface/50 border-border text-text-secondary/30'
                    "
                  >
                    <svg
                      v-if="hasSpecialChar"
                      class="w-2.5 h-2.5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span
                      v-else
                      class="w-1.5 h-1.5 rounded-full bg-text-secondary/30"
                    ></span>
                  </span>
                  Contains a special character
                </li>
                <li
                  class="flex items-center gap-2.5 text-xs transition-colors duration-200"
                  :class="
                    hasUpperCase
                      ? 'text-accent font-medium'
                      : 'text-text-secondary'
                  "
                >
                  <span
                    class="w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all duration-300"
                    :class="
                      hasUpperCase
                        ? 'bg-accent/10 border-accent/30 text-accent shadow-sm'
                        : 'bg-surface/50 border-border text-text-secondary/30'
                    "
                  >
                    <svg
                      v-if="hasUpperCase"
                      class="w-2.5 h-2.5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span
                      v-else
                      class="w-1.5 h-1.5 rounded-full bg-text-secondary/30"
                    ></span>
                  </span>
                  Contains an uppercase letter
                </li>
                <li
                  class="flex items-center gap-2.5 text-xs transition-colors duration-200"
                  :class="
                    hasLowerCase
                      ? 'text-accent font-medium'
                      : 'text-text-secondary'
                  "
                >
                  <span
                    class="w-[18px] h-[18px] rounded-full flex items-center justify-center border transition-all duration-300"
                    :class="
                      hasLowerCase
                        ? 'bg-accent/10 border-accent/30 text-accent shadow-sm'
                        : 'bg-surface/50 border-border text-text-secondary/30'
                    "
                  >
                    <svg
                      v-if="hasLowerCase"
                      class="w-2.5 h-2.5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="3.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span
                      v-else
                      class="w-1.5 h-1.5 rounded-full bg-text-secondary/30"
                    ></span>
                  </span>
                  Contains a lowercase letter
                </li>
              </ul>
            </div>

            <Button
              :loading="isPending"
              :disabled="submitDisabled"
              size="md"
              :block="true"
              type="submit"
            >
              Reset password
            </Button>

            <p
              v-if="errorMessage"
              class="text-red-500 text-sm text-center mt-2"
            >
              {{ errorMessage }}
            </p>
          </form>
        </div>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMutation } from "@tanstack/vue-query";
import AuthLayout from "../../layout/AuthLayout/AuthLayout.vue";
import BaseTextField from "../../components/ui/BaseTextField.vue";
import Button from "../../components/ui/Button.vue";
import { verifyResetToken, resetPassword } from "../../services/auth";
import darkLogo from "@assets/global/dark-logo.png";
import lightLogo from "@assets/global/light-logo.png";
import { useTheme } from "../../composables/useTheme";

defineOptions({ name: "ResetPasswordPage" });

const route = useRoute();
const router = useRouter();
const { isDark } = useTheme();

const token = computed(() => route.query.token as string);
const newPassword = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const verifying = ref(true);
const tokenExpired = ref(false);
const resetSuccess = ref(false);

const touched = ref({
  newPassword: false,
  confirmPassword: false,
});

const hasMinLength = computed(() => newPassword.value.length >= 8);
const hasNumber = computed(() => /\d/.test(newPassword.value));
const hasSpecialChar = computed(() =>
  /[!@#$%^&*(),.?":{}|<>]/.test(newPassword.value),
);
const hasUpperCase = computed(() => /[A-Z]/.test(newPassword.value));
const hasLowerCase = computed(() => /[a-z]/.test(newPassword.value));

const newPasswordError = computed(() => {
  if (!touched.value.newPassword) return "";
  const pwd = newPassword.value.trim();
  if (!pwd) return "Password is required";
  if (!hasMinLength.value) return "Password must be at least 8 characters long";
  if (!hasNumber.value) return "Password must contain at least one number";
  if (!hasSpecialChar.value)
    return "Password must contain at least one special character";
  if (!hasUpperCase.value)
    return "Password must contain at least one uppercase letter";
  if (!hasLowerCase.value)
    return "Password must contain at least one lowercase letter";
  return "";
});

const confirmPasswordError = computed(() => {
  if (!touched.value.confirmPassword) return "";
  if (!confirmPassword.value.trim()) return "Please confirm your password";
  if (confirmPassword.value.trim() !== newPassword.value.trim())
    return "Passwords do not match";
  return "";
});

const newPasswordHasError = computed(() => !!newPasswordError.value);
const confirmPasswordHasError = computed(() => !!confirmPasswordError.value);

const isFormValid = computed(
  () =>
    !newPasswordError.value &&
    !confirmPasswordError.value &&
    hasMinLength.value &&
    hasNumber.value &&
    hasSpecialChar.value &&
    hasUpperCase.value &&
    hasLowerCase.value,
);

const { mutateAsync: verifyToken } = useMutation({
  mutationFn: verifyResetToken,
});
const { mutateAsync: resetPass, isPending } = useMutation({
  mutationFn: resetPassword,
});
 

onMounted(async () => {
  if (!token.value) {
    tokenExpired.value = true;
    verifying.value = false;
    return;
  }

  try {
    await verifyToken({ token: token.value });
    verifying.value = false;
  } catch (err: any) {
    verifying.value = false;
    tokenExpired.value = true;
  }
});

function validateForm() {
  touched.value.newPassword = true;
  touched.value.confirmPassword = true;

  if (!newPassword.value.trim() || !confirmPassword.value.trim()) return false;
  if (newPasswordError.value || confirmPasswordError.value) return false;
  return true;
}

async function handleResetPassword() {
  errorMessage.value = "";

  touched.value.newPassword = true;
  touched.value.confirmPassword = true;

  if (!validateForm()) {
    return;
  }

  try {
    await resetPass({
      token: token.value,
      new_password: newPassword.value.trim(),
      confirm_password: confirmPassword.value.trim(),
    });
    resetSuccess.value = true;
  } catch (err: any) {
    errorMessage.value =
      err?.message || "Failed to reset password. Please try again.";
  }
}

const submitDisabled = computed(() => isPending.value || !isFormValid.value);

watch(newPassword, () => {
  touched.value.newPassword = true;
});

watch(confirmPassword, () => {
  touched.value.confirmPassword = true;
});
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

.animate-slide-up-step-1 {
  animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
