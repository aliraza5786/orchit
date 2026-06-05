<template>
  <AuthLayout>
    <template #form>
      <div
        class="max-w-[400px] mx-auto w-full text-text-primary"
      > 
      <router-link to="/">
          <img
            :src="isDark ? darkLogo : lightLogo"
            class="w-[130px] mb-6 d-block mx-auto"
            alt="image"
          />
        </router-link>
         
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
          <p  class="text-sm font-medium text-text-secondary text-center" v-once>
           By continuing, you acknowledge Orchit
          <router-link
            to="/privacy-policy"
            class="text-text-primary font-bold underline"
            >Privacy Policy</router-link
           >
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
type Step = 'email' | 'login-password';
const step = ref<Step>('email');

const errorMessage = ref("");
// const cookieToken =
//   document.cookie
//     .split("; ")
//     .find((row) => row.startsWith("auth_token="))
//     ?.split("=")[1] ?? null;
const touched = {
  email: false,
  password: false,
};

// --- Validation (cheap computed) ---
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
  if (password.value.length < 6)
    return "Password must be at least 6 characters";
  return "";
});
const passwordHasError = computed(() => !!passwordError.value);

const isFormValid = computed(() => !emailError.value && !passwordError.value);
const router = useRouter();
const { mutateAsync, isPending } = useMutation({ mutationFn: login });
const { mutateAsync: socialLoginMutate } = useMutation({
  mutationFn: socialLogin,
});
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
    if (err?.error !== "popup_closed_by_user") {
      errorMessage.value =
        err?.message || "Apple Login failed. Please try again.";
    }
  }
}
/** New account via Google/Apple on login page — same routing as manual signup (Register/OTP). */
async function handleSocialSignupSuccess(data: any, email: string) {
  const token = data?.data?.token;

  localStorage.setItem("token", token);
  primeOnboardingTypeForEmail(email);

  authStore.initialized = false;
  await authStore.bootstrap(true);
  localStorage.setItem("token", token);

  const redirectPath = router.currentRoute.value.query.redirect as string;
  if (redirectPath) {
    router.push(redirectPath);
    return;
  }

  const intentStr = localStorage.getItem("post_auth_intent");
  if (intentStr) {
    try {
      const intent = JSON.parse(intentStr);
      localStorage.removeItem("post_auth_intent");
      if (intent.aiResponse) workspaceStore.setWorkspace(intent.aiResponse);
      router.push(intent.path || "/dashboard");
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
    router.push(destination);
    return;
  }

  if (workspaceStore.pricing) {
    router.push(`/dashboard?stripePayment=true`);
  } else {
    router.push("/dashboard");
  }
}

async function handleLoginSuccess(data: any) {
  const token = data?.data?.token;

  localStorage.setItem("token", token);
  const maxAge = 60 * 60 * 24 * 30;
  const payload = encodeURIComponent(JSON.stringify({ token }));
  document.cookie = `auth_session=${payload}; domain=.orchit.ai; path=/; max-age=${maxAge}; Secure; SameSite=Lax`;
  authStore.initialized = false;
  await authStore.bootstrap(true);
  localStorage.setItem("token", token);
  // authStore.writeAuthCookie({ token, company_id: null, personal_mode: null })
  const redirectPath = router.currentRoute.value.query.redirect as string;
  if (redirectPath) {
    router.push(redirectPath);
    return;
  }

  const intentStr = localStorage.getItem("post_auth_intent");
  if (intentStr) {
    try {
      const intent = JSON.parse(intentStr);
      localStorage.removeItem("post_auth_intent");
      if (intent.aiResponse) workspaceStore.setWorkspace(intent.aiResponse);
      router.push(intent.path || "/dashboard");
      return;
    } catch (e) {
      console.error("Failed to parse post_auth_intent", e);
      localStorage.removeItem("post_auth_intent");
    }
  }

  const pendingInvitePath = getPendingWorkspaceInviteRedirectPath();
  if (pendingInvitePath) {
    router.push(pendingInvitePath);
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
    router.push(destination);
    return;
  }

  const extraQuery = workspaceStore.pricing
    ? { stripePayment: "true" }
    : undefined;

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
    router.push(`/dashboard?stripePayment=true`);
  } else {
    router.push("/dashboard");
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
    handleLoginSuccess(data);
  } catch (err: any) {
    const errorMsg = err?.response?.data?.message || "Login failed. Please try again.";
    
    // 🚀 AUTO-REDIRECT: Detect social login requirement and auto-redirect
    const lowerMsg = errorMsg.toLowerCase();
    
    // Check if error indicates Google login is required
    if (lowerMsg.includes('google') || lowerMsg.includes('gmail') || 
        errorMsg.includes('social') && errorMsg.includes('google')) {
      console.log('🔄 Detected Google login requirement - Auto-redirecting...');
      toast.info('Redirecting to Google Sign-In...');
      // Small delay for toast visibility, then trigger Google login
      await new Promise(resolve => setTimeout(resolve, 500));
      await loginWithGoogle();
      return;
    }
    
    // Check if error indicates Apple login is required
    if (lowerMsg.includes('apple')) {
      console.log('🔄 Detected Apple login requirement - Auto-redirecting...');
      toast.info('Redirecting to Apple Sign-In...');
      // Small delay for toast visibility, then trigger Apple login
      await new Promise(resolve => setTimeout(resolve, 500));
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
      step.value = 'login-password';
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
