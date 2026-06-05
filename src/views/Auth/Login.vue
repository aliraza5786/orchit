<template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[400px] mx-auto w-full text-text-primary">
        <router-link to="/">
          <img
            :src="isDark ? darkLogo : lightLogo"
            class="w-[130px] mb-6 d-block mx-auto"
            alt="image"
          />
        </router-link>
         <!-- Post-login loading overlay -->
<Teleport to="body">
  <Transition name="auth-fade">
    <div
      v-if="isNavigating"
      class="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style="background: var(--color-bg-body, #0f0f0f)"
    >
      <!-- Ambient glow -->
      <div class="auth-glow" />

      <!-- Logo -->
      <img
        :src="isDark ? darkLogo : lightLogo"
        class="w-[100px] relative z-10 mb-10 opacity-90"
        alt="logo"
      />

      <!-- Ring spinner -->
      <div class="auth-ring-wrap relative z-10">
        <svg class="auth-ring" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="34" stroke="currentColor" stroke-width="2" class="auth-ring-track" />
          <circle cx="40" cy="40" r="34" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="auth-ring-fill" />
        </svg>
        <!-- Inner pulse dot -->
        <div class="auth-ring-dot" />
      </div>

      <!-- Label -->
      <p class="relative z-10 mt-8 text-[12px] font-medium tracking-[0.18em] uppercase auth-label">
        Signing you in
      </p>
    </div>
  </Transition>
</Teleport>

        <!-- STEP 1: EMAIL (Initially shown) -->
        <form v-if="step === 'email'" @submit.prevent="handleEmailSubmit" class="space-y-3 w-full">
          <Button
            size="md"
            :block="true"
            appearance="outlined"
            variant="ghost"
            type="button"
            @click="loginWithGoogle"
            :disabled="isAnyPending"
          >
            <template #icon>
              <img
                src="../../assets/LandingPageImages/header-icons/google.png"
                class="w-5 h-5 mr-4"
              />
            </template>
            Continue with google
          </Button>

          <Button
            size="md"
            :block="true"
            appearance="outlined"
            variant="ghost"
            type="button"
            class="flex flex-row"
            @click="loginWithApple"
            :disabled="isAnyPending"
          >
            <template #icon>
              <img
                :src="isDark ? darkApple : lightApple"
                alt="Apple icon"
                class="w-[24px] mr-4"
              />
            </template>
            Continue with apple
          </Button>

          <div class="flex items-center">
            <div class="flex-grow border-t border-border"></div>
            <span class="mx-3 text-[12px] text-primary">OR</span>
            <div class="flex-grow border-t border-border"></div>
          </div>

          <BaseTextField
            v-model="email"
            placeholder="Enter your email"
            size="md"
            :error="emailHasError"
            :message="emailError"
            @blur="touched.email = true"
            @update:modelValue="onFieldInput"
            :disabled="isAnyPending"
          />

          <Button
            :loading="isPreLoginPending"
            size="md"
            :block="true"
            type="submit"
          >
            Continue with email
          </Button>

          <p class="text-sm font-medium text-text-secondary text-center" v-once>
            By continuing, you acknowledge Orchit
            <router-link
              to="/privacy-policy"
              class="text-text-primary font-bold underline"
            >Privacy Policy</router-link>
          </p>

          <p v-if="errorMessage" class="text-red-500 text-sm text-center mt-2">
            {{ errorMessage }}
          </p>
        </form>

        <!-- STEP 2: LOGIN PASSWORD (If verified is true) -->
        <form v-else-if="step === 'login-password'" @submit.prevent="handleLogin" class="w-full space-y-3">
          <div class="mb-8 text-center">
            <h3 class="text-[24px] leading-7 font-medium text-text-primary">Welcome back</h3>
            <p class="text-sm text-text-secondary mt-3">Enter your password to sign in</p>
          </div>

          <div>
            <BaseTextField
              v-model="password"
              placeholder="Enter your password"
              size="md"
              type="password"
              :error="passwordHasError"
              :message="passwordError"
              @blur="touched.password = true"
              @update:modelValue="onFieldInput"
              :disabled="isAnyPending"
            />

            <div class="text-end mt-1 mb-2">
              <router-link
                to="/forgot-password"
                class="text-sm text-accent hover:underline"
              >
                Forgot password?
              </router-link>
            </div>
          </div>

          <Button
            :loading="isPending"
            size="md"
            :block="true"
            type="submit"
          >
            Sign in
          </Button>

          <Button
            size="md"
            :block="true"
            appearance="outlined"
            variant="ghost"
            type="button"
            @click="step = 'email'"
            :disabled="isAnyPending"
          >
            Back
          </Button>

          <p v-if="errorMessage" class="text-red-500 text-sm text-center mt-2">
            {{ errorMessage }}
          </p>
        </form>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useMutation } from "@tanstack/vue-query";
import AuthLayout from "../../layout/AuthLayout/AuthLayout.vue";
import BaseTextField from "../../components/ui/BaseTextField.vue";
import Button from "../../components/ui/Button.vue";
import { login, socialLogin, verifyEmailPreLogin } from "../../services/auth";
import { googleTokenLogin } from "vue3-google-login";
import axios from "axios";
import { useAuthStore } from "../../stores/auth";
import { useWorkspaceStore } from "../../stores/workspace";
import { toast } from "vue-sonner";

const workspaceStore = useWorkspaceStore();
defineOptions({ name: "LoginPage" });

import lightApple from "@assets/LandingPageImages/header-icons/lightapple.png";
import darkApple from "@assets/LandingPageImages/header-icons/apple.png";
import darkLogo from "@assets/global/dark-logo.png";
import lightLogo from "@assets/global/light-logo.png";

import { useTheme } from "../../composables/useTheme";
import {
  getPostAuthRedirectPath,
  isExistingAccountFromPreLogin,
  primeOnboardingTypeForEmail,
} from "../../utilities/onboardingRedirect";
import {
  tryRedirectToCompanyDomainDashboard,
  normalizeProfileUserData,
} from "../../utilities/authRedirect";
import { getPendingWorkspaceInviteRedirectPath } from "../../utilities/workspaceInvitePending";
import { getProfile } from "../../services/user";

const { isDark, theme } = useTheme();
declare const AppleID: any;

defineProps<{
  isDark: boolean;
}>();

// --- Constants (non-reactive) ---
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const authStore = useAuthStore();

// --- State ---
const email = ref("");
const password = ref("");
type Step = "email" | "login-password";
const step = ref<Step>("email");
const errorMessage = ref("");
const isNavigating = ref(false);

const touched = {
  email: false,
  password: false,
};

// --- Validation ---
const emailError = computed(() => {
  if (!touched.email) return "";
  if (!email.value.trim()) return "Email is required";
  if (!EMAIL_RE.test(email.value)) return "Invalid email";
  return "";
});
const emailHasError = computed(() => !!emailError.value);

const passwordError = computed(() => {
  if (!touched.password) return "";
  if (!password.value) return "Password is required";
  if (password.value.length < 6) return "Password must be at least 6 characters";
  return "";
});
const passwordHasError = computed(() => !!passwordError.value);

const isFormValid = computed(() => !emailError.value && !passwordError.value);

const router = useRouter();
const { mutateAsync, isPending } = useMutation({ mutationFn: login });
const { mutateAsync: socialLoginMutate } = useMutation({ mutationFn: socialLogin });
const { mutateAsync: preLoginMutate, isPending: isPreLoginPending } = useMutation({
  mutationFn: verifyEmailPreLogin,
});

const isSocialPending = ref(false);
const isAnyPending = computed(
  () => isPreLoginPending.value || isPending.value || isSocialPending.value,
);

function onFieldInput() {
  if (errorMessage.value) errorMessage.value = "";
}

async function completeSocialAuth(payload: {
  u_email: string;
  u_social_id: string;
  u_social_type: "google" | "apple";
  u_full_name: string;
}) {
  if (!payload.u_email?.trim()) {
    errorMessage.value = "Could not read your email from the provider. Please use email sign-in.";
    return;
  }

  isSocialPending.value = true;
  errorMessage.value = "";

  try {
    const preCheck = await preLoginMutate({ email: payload.u_email });
    const isExisting = isExistingAccountFromPreLogin(preCheck);
    const data = await socialLoginMutate(payload);

    if (isExisting) {
      await handleLoginSuccess(data);
    } else {
      await handleSocialSignupSuccess(data, payload.u_email);
    }
  } catch (err: any) {
    isNavigating.value = false;
    errorMessage.value =
      err?.response?.data?.message ||
      err?.message ||
      "Social sign-in failed. Please try again.";
  } finally {
    isSocialPending.value = false;
  }
}

async function loginWithGoogle() {
  try {
    const response = await googleTokenLogin();
    const userInfo = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${response.access_token}` },
      },
    );

    await completeSocialAuth({
      u_email: userInfo.data.email,
      u_social_id: userInfo.data.sub,
      u_social_type: "google",
      u_full_name: userInfo.data.name,
    });
  } catch (err: any) {
    isNavigating.value = false;
    if (err?.message !== "Popup closed") {
      errorMessage.value =
        err?.response?.data?.message ||
        "Google Login failed. Please try again.";
    }
  }
}

async function loginWithApple() {
  try {
    AppleID.auth.init({
      clientId: "com.orchit.ai",
      scope: "name email",
      redirectURI: "https://www.orchit.ai/dashboard",
      usePopup: true,
    });

    const response = await AppleID.auth.signIn();
    const idToken = response.authorization.id_token;
    const base64Url = idToken.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(""),
    );
    const decodedToken = JSON.parse(jsonPayload);

    await completeSocialAuth({
      u_email: decodedToken.email,
      u_social_id: decodedToken.sub,
      u_social_type: "apple",
      u_full_name: response.user?.name
        ? `${response.user.name.firstName} ${response.user.name.lastName}`
        : decodedToken.email?.split("@")[0] || "",
    });
  } catch (err: any) {
    isNavigating.value = false;
    if (err?.error !== "popup_closed_by_user") {
      errorMessage.value =
        err?.message || "Apple Login failed. Please try again.";
    }
  }
}

async function handleSocialSignupSuccess(data: any, email: string) {
  isNavigating.value = true;
  const token = data?.data?.token;

  localStorage.setItem("token", token);
  primeOnboardingTypeForEmail(email);

  authStore.initialized = false;
  await authStore.bootstrap(true);
  localStorage.setItem("token", token);

  const redirectPath = router.currentRoute.value.query.redirect as string;
  if (redirectPath) {
    await router.push(redirectPath);
    return;
  }

  const intentStr = localStorage.getItem("post_auth_intent");
  if (intentStr) {
    try {
      const intent = JSON.parse(intentStr);
      localStorage.removeItem("post_auth_intent");
      if (intent.aiResponse) workspaceStore.setWorkspace(intent.aiResponse);
      await router.push(intent.path || "/dashboard");
      return;
    } catch (e) {
      console.error("Failed to parse post_auth_intent", e);
      localStorage.removeItem("post_auth_intent");
    }
  }

  let userData = normalizeProfileUserData(
    (authStore.user?.data ?? authStore.user) as Record<string, unknown> | undefined,
  );
  if (!userData) {
    try {
      const profileRes = await getProfile();
      userData = normalizeProfileUserData(
        (profileRes?.data ?? profileRes) as Record<string, unknown> | undefined,
      );
    } catch (e) {
      console.warn("Profile fetch after social signup failed:", e);
    }
  }

  const destination = getPostAuthRedirectPath(userData);

  if (destination !== "/dashboard") {
    await router.push(destination);
    return;
  }

  if (workspaceStore.pricing) {
    await router.push(`/dashboard?stripePayment=true`);
  } else {
    await router.push("/dashboard");
  }
}

async function handleLoginSuccess(data: any) {
  isNavigating.value = true;
  const token = data?.data?.token;

  localStorage.setItem("token", token);
  const maxAge = 60 * 60 * 24 * 30;
  const payload = encodeURIComponent(JSON.stringify({ token }));
  document.cookie = `auth_session=${payload}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;

  authStore.initialized = false;
  await authStore.bootstrap(true);
  localStorage.setItem("token", token);

  const redirectPath = router.currentRoute.value.query.redirect as string;
  if (redirectPath) {
    await router.push(redirectPath);
    return;
  }

  const intentStr = localStorage.getItem("post_auth_intent");
  if (intentStr) {
    try {
      const intent = JSON.parse(intentStr);
      localStorage.removeItem("post_auth_intent");
      if (intent.aiResponse) workspaceStore.setWorkspace(intent.aiResponse);
      await router.push(intent.path || "/dashboard");
      return;
    } catch (e) {
      console.error("Failed to parse post_auth_intent", e);
      localStorage.removeItem("post_auth_intent");
    }
  }

  const pendingInvitePath = getPendingWorkspaceInviteRedirectPath();
  if (pendingInvitePath) {
    await router.push(pendingInvitePath);
    return;
  }

  let userData = normalizeProfileUserData(
    (authStore.user?.data ?? authStore.user) as Record<string, unknown> | undefined,
  );
  if (!userData) {
    try {
      const profileRes = await getProfile();
      userData = normalizeProfileUserData(
        (profileRes?.data ?? profileRes) as Record<string, unknown> | undefined,
      );
    } catch (e) {
      console.warn("Profile fetch after login failed:", e);
    }
  }

  const activeCompanyId = userData?.active_company_id as string | undefined;
  if (activeCompanyId) {
    authStore.setCompany(activeCompanyId);
  }

  const destination = getPostAuthRedirectPath(userData, { isLogin: true });

  if (destination !== "/dashboard") {
    await router.push(destination);
    return;
  }

  const extraQuery = workspaceStore.pricing ? { stripePayment: "true" } : undefined;

  if (
    tryRedirectToCompanyDomainDashboard(userData, {
      token,
      theme: theme.value,
      extraQuery,
    })
  ) {
    return;
  }

  if (workspaceStore.pricing) {
    await router.push(`/dashboard?stripePayment=true`);
  } else {
    await router.push("/dashboard");
  }
}

async function handleLogin() {
  errorMessage.value = "";
  touched.email = true;
  touched.password = true;

  if (!isFormValid.value) {
    errorMessage.value = "Please fill all fields correctly.";
    return;
  }

  try {
    const data = await mutateAsync({
      u_email: email.value,
      u_password: password.value,
    });
    await handleLoginSuccess(data);
  } catch (err: any) {
    isNavigating.value = false;
    const errorMsg = err?.response?.data?.message || "Login failed. Please try again.";

    // 🚀 AUTO-REDIRECT: Detect social login requirement and auto-redirect
    const lowerMsg = errorMsg.toLowerCase();

    // Check if error indicates Google login is required
    if (
      lowerMsg.includes("google") ||
      lowerMsg.includes("gmail") ||
      (errorMsg.includes("social") && errorMsg.includes("google"))
    ) {
      console.log("🔄 Detected Google login requirement - Auto-redirecting...");
      toast.info("Redirecting to Google Sign-In...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loginWithGoogle();
      return;
    }

    // Check if error indicates Apple login is required
    if (lowerMsg.includes("apple")) {
      console.log("🔄 Detected Apple login requirement - Auto-redirecting...");
      toast.info("Redirecting to Apple Sign-In...");
      await new Promise((resolve) => setTimeout(resolve, 500));
      await loginWithApple();
      return;
    }

    // If no social redirect detected, show error normally
    errorMessage.value = errorMsg;
  }
}

async function handleEmailSubmit() {
  errorMessage.value = "";
  touched.email = true;

  if (!email.value.trim() || !EMAIL_RE.test(email.value)) {
    errorMessage.value = "Please enter a valid email address.";
    return;
  }

  try {
    const response = await preLoginMutate({
      email: email.value,
    });
    console.log("Pre-login email verification successful:", response);

    const verified = response?.data?.verified ?? response?.verified;
    if (verified === true) {
      step.value = "login-password";
    } else {
      router.push(`/otp-verification/${email.value}?preLogin=true`);
    }
  } catch (err: any) {
    errorMessage.value =
      err?.response?.data?.message ||
      err?.message ||
      "Failed to verify email. Please try again.";
  }
}
</script>

<style scoped>
/* ── Ambient glow ── */
.auth-glow {
  position: absolute;
  width: 480px;
  height: 480px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-accent, #6366f1) 0%, transparent 70%);
  opacity: 0.07;
  filter: blur(40px);
  pointer-events: none;
}

/* ── Ring spinner ── */
.auth-ring-wrap {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-ring {
  width: 72px;
  height: 72px;
  animation: auth-rotate 1.6s linear infinite;
  color: var(--color-accent, #6366f1);
}

.auth-ring-track {
  opacity: 0.1;
}

.auth-ring-fill {
  stroke-dasharray: 100 214;
  stroke-dashoffset: 0;
  animation: auth-dash 1.6s ease-in-out infinite;
  filter: drop-shadow(0 0 6px var(--color-accent, #6366f1));
}

.auth-ring-dot {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-accent, #6366f1);
  box-shadow: 0 0 10px 3px var(--color-accent, #6366f1);
  animation: auth-dot-pulse 1.6s ease-in-out infinite;
}

/* ── Label ── */
.auth-label {
  color: var(--color-text-secondary, #888);
  animation: auth-label-fade 2s ease-in-out infinite;
}

/* ── Keyframes ── */
@keyframes auth-rotate {
  to { transform: rotate(360deg); }
}

@keyframes auth-dash {
  0%   { stroke-dasharray: 20 214;  stroke-dashoffset: 0; }
  50%  { stroke-dasharray: 120 214; stroke-dashoffset: -60; }
  100% { stroke-dasharray: 20 214;  stroke-dashoffset: -214; }
}

@keyframes auth-dot-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.8); }
  50%       { opacity: 1;   transform: scale(1.2); }
}

@keyframes auth-label-fade {
  0%, 100% { opacity: 0.4; }
  50%       { opacity: 0.9; }
}

/* ── Vue Transition ── */
.auth-fade-enter-active { transition: opacity 0.25s ease; }
.auth-fade-leave-active { transition: opacity 0.2s ease; }
.auth-fade-enter-from,
.auth-fade-leave-to     { opacity: 0; }
</style>