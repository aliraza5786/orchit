<template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[500px] md:mx-auto w-full text-text-primary bg-bg-body">
        <router-link to="/">
        <img :src="isDark? darkLogo : lightLogo" class="w-[150px] d-block mx-auto" alt="image">
        </router-link>
        <h2
          class="text-[24px] md:text-[32px] font-medium mb-8 sm:mb-12 text-center text-text-primary"
          v-once
        >
          Sign in to Orchit AI
        </h2>

        <form @submit.prevent="handleLogin" class="space-y-4 w-full">
          <BaseTextField
            v-model="email"
            label="Email"
            placeholder="Email address"
            size="lg"
            :error="emailHasError"
            :message="emailError"
            @blur="touched.email = true"
            @update:modelValue="onFieldInput"
          />
             <div>
               <BaseTextField
            v-model="password"
            label="Password"
            placeholder="Enter your password"
            size="lg"
            type="password"
            :error="passwordHasError"
            :message="passwordError"
            @blur="touched.password = true"
            @update:modelValue="onFieldInput"
           />
            <div class="text-end mt-1">
            <router-link
              to="/forgot-password"
              class="text-sm text-accent hover:underline"
            >
              Forgot password?
            </router-link>
          </div>
          </div>
         

          <Button
            :disabled="submitDisabled"
            size="lg"
            :block="true"
            type="submit"
          >
            {{ submitLabel }}
          </Button>
          <div class="flex items-center">
            <div class="flex-grow border-t border-border"></div>
            <span class="mx-3 text-[12px] text-primary">OR</span>
            <div class="flex-grow border-t border-border"></div>
          </div>
        
          <Button
            size="lg"
            :block="true"
            appearance="outlined"
            variant="ghost"
            type="button"
            @click="loginWithGoogle"
          >
            <template #icon>
              <img src="../../assets/LandingPageImages/header-icons/google.png" class="w-5 h-5 mr-4" />
            </template>
            Continue with google
          </Button>

          <!-- <Button
            size="lg"
            :block="true"
            appearance="outlined"
            variant="ghost"
            type="button" 
            class="felx flex-row"
            @click="loginWithApple"
          >
          <template #icon>
                <img :src="isDark ? darkApple : lightApple" alt="Apple icon" class="w-[24px] mr-4" />
          </template>
            Continue with apple
          </Button> -->

          <p v-if="errorMessage" class="text-red-500 text-sm text-center mt-2">
            {{ errorMessage }}
          </p>

          
        </form>

       

        <p
          class="text-sm font-medium text-text-secondary text-center mt-8"
          v-once
        >
          Don’t have an account?
          <router-link
            to="/register"
            class="text-text-primary font-bold underline"
            >Sign up</router-link
          >
        </p>
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
import { login, socialLogin } from "../../services/auth";
import { googleTokenLogin } from "vue3-google-login";
import axios from "axios";
import { useAuthStore } from "../../stores/auth";
import { useWorkspaceStore } from "../../stores/workspace";
const workspaceStore = useWorkspaceStore();
defineOptions({ name: "LoginPage" });
// import lightApple from '@assets/LandingPageImages/header-icons/lightapple.png';
// import darkApple from '@assets/LandingPageImages/header-icons/apple.png';
import darkLogo  from '@assets/global/dark-logo.png';
import lightLogo  from '@assets/global/light-logo.png';

import { useTheme } from "../../composables/useTheme";
const {isDark } = useTheme();
declare const AppleID: any;
defineProps<{
  isDark: boolean
}>()
// --- Constants (non-reactive) ---
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const authStore = useAuthStore()
// --- State ---
const email = ref("");
const password = ref("");
const errorMessage = ref("");

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
const { mutateAsync: googleLoginMutate,  } = useMutation({ mutationFn: socialLogin });

// --- Derived UI state ---
const submitDisabled = computed(() => isPending.value);
const submitLabel = computed(() =>
  isPending.value ? "Signing In..." : "Sign in"
);

function onFieldInput() {
  if (errorMessage.value) errorMessage.value = "";
}

async function loginWithGoogle() {
  try {
    const response = await googleTokenLogin();
    const userInfo = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${response.access_token}` },
    });
    
    const data = await googleLoginMutate({
      u_email: userInfo.data.email,
      u_social_id: userInfo.data.sub,
      u_social_type: "google",
      u_full_name: userInfo.data.name,
    });
    
    handleLoginSuccess(data);
  } catch (err: any) {
    if (err?.message !== "Popup closed") {
      errorMessage.value =
        err?.response?.data?.message || "Google Login failed. Please try again.";
    }
  }
}

// async function loginWithApple() {
//   try {
//     AppleID.auth.init({
//       clientId: '100465282340299456069',
//       scope: 'name email',
//       redirectURI: window.location.origin + '/login',
//       usePopup: true
//     });
    
//     const response = await AppleID.auth.signIn();
//     const idToken = response.authorization.id_token;
//     const base64Url = idToken.split('.')[1];
//     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//     const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
//         return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
//     }).join(''));
//     const decodedToken = JSON.parse(jsonPayload);

//     const data = await googleLoginMutate({
//       u_email: decodedToken.email,
//       u_social_id: decodedToken.sub,
//       u_social_type: "apple",
//       u_full_name: response.user?.name ? `${response.user.name.firstName} ${response.user.name.lastName}` : (decodedToken.email?.split('@')[0] || ""),
//     });
    
//     handleLoginSuccess(data);
//   } catch (err: any) {
//     if (err?.error !== "popup_closed_by_user") {
//       errorMessage.value = err?.message || "Apple Login failed. Please try again.";
//     }
//   }
// }

// async function handleGoogleLogin(response: any) {
//   try {
//     const userData: any = decodeCredential(response.credential);
//     const data = await googleLoginMutate({
//       u_email: userData.email,
//       u_social_id: userData.sub,
//       u_social_type: "google",
//       u_full_name: userData.name,
//     });
    
//     handleLoginSuccess(data);
//   } catch (err: any) {
//     errorMessage.value =
//       err?.response?.data?.message || "Google Login failed. Please try again.";
//   }
// }

async function handleLoginSuccess(data: any) {
    localStorage.setItem("token", data?.data?.token);
    await authStore.bootstrap();

    const intentStr = localStorage.getItem('post_auth_intent');
    if (intentStr) {
      try {
        const intent = JSON.parse(intentStr);
        localStorage.removeItem('post_auth_intent');
        
        if (intent.aiResponse) {
          workspaceStore.setWorkspace(intent.aiResponse);
        }
        
        router.push(intent.path || "/dashboard");
        return;
      } catch (e) {
        console.error("Failed to parse post_auth_intent", e);
        localStorage.removeItem('post_auth_intent');
      }
    }

    console.log(data?.data?.isNewUser, "new user")
    
    if (data?.data?.isNewUser) {
      router.push("/create-profile");
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
    errorMessage.value =
      err?.response?.data?.message || "Login failed. Please try again.";
  }
}

</script>


