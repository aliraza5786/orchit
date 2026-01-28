 <template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[500px] mx-auto w-full min-h-full py-5 flex flex-col justify-center">
        <router-link to="/">
        <img :src="isDark? darkLogo : lightLogo" class="w-[130px] d-block mx-auto" alt="image">
        </router-link>
        <div class="mb-8 sm:mb-12 space-y-2 text-center">
          <h2 class="text-[24px] md:text-[32px] font-medium text-text-primary">Welcome to Orchit AI</h2>
          <p class="text-base font-medium text-text-secondary">Create your free account</p>
        </div>
        <form @submit.prevent="handleRegister" class="space-y-4 w-full">
          <BaseTextField v-model="fName" label="Full Name" placeholder="Full Name" size="lg" :error="!!nameError"
            :message="nameError" @blur="touched.fName.value = true" />
          <BaseTextField v-model="email" label="Email" placeholder="john@example.com" size="lg" :error="!!emailError"
            :message="emailError" @blur="touched.email.value = true" />
          <BaseTextField v-model="password" label="Password" placeholder="Password" size="lg" type="password"
            :error="!!passwordError" :message="passwordError" @blur="touched.password.value = true" />
          <div class="flex items-start gap-2"> 
            <input
                v-model="agreeToTerms"
                @blur="touched.terms.value = true"
                type="checkbox" 
                class=" h-4 w-4 mt-0.5 rounded border-border accent-accent cursor-pointer flex-shrink-0"
            />
           <p class="text-left font-medium text-text-secondary text-sm " > 
            
               By signing up, I agree to the
            <span class="text-text-primary font-medium text-sm" >Privacy Policy</span> and
            <span class="text-text-primary font-medium text-sm">Terms of Service</span>.
          </p> 
          </div> 
          <p v-if="termsError" class="text-red-500 text-[12px]">
           {{ termsError }}
            </p>
          <Button :disabled="isPending" size="lg" :block="true" type="submit">
            {{ isPending ? 'Creating Account...' : 'Sign up' }}
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

          <Button
            size="lg"
            :block="true"
            appearance="outlined"
            variant="ghost"
            type="button" 
            @click="loginWithApple"
          >
            <template #icon>
              <img :src="isDark ? darkApple : lightApple" alt="Apple icon" class="w-[24px] mr-4" />
            </template>
            Continue with apple
          </Button>
          <p v-if="errorMessage" class="text-red-500 text-sm text-center mt-2">
            {{ errorMessage }}
          </p>
         
          <p class="text-sm font-medium text-text-secondary text-center mt-8">
            Already have an account?
            <router-link to="/login" class="text-text-primary font-bold underline">Sign in</router-link>
          </p>
        </form>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMutation } from '@tanstack/vue-query';
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue';
import BaseTextField from '../../components/ui/BaseTextField.vue';
import Button from '../../components/ui/Button.vue';
import { register, socialLogin } from '../../services/auth';
import { googleTokenLogin } from "vue3-google-login";
import axios from "axios";
import { useAuthStore } from "../../stores/auth";
import { useWorkspaceStore } from "../../stores/workspace";
import darkLogo  from '@assets/global/dark-logo.png';
import lightLogo  from '@assets/global/light-logo.png';
import { useTheme } from "../../composables/useTheme"; 
import lightApple from '@assets/LandingPageImages/header-icons/lightapple.png';
import darkApple from '@assets/LandingPageImages/header-icons/apple.png';
const {isDark } = useTheme();
const router = useRouter();
const fName = ref('');
const email = ref('');
const password = ref('');
const errorMessage = ref('');

const agreeToTerms = ref(false);
// Field "touched" states
const touched = {
  fName: ref(false),
  email: ref(false),
  password: ref(false),
  terms: ref(false),
};
const termsError = computed(() => {
  if (!touched.terms.value) return '';
  if (!agreeToTerms.value) return 'You must agree to the Terms & Privacy Policy';
  return '';
});

const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

declare const AppleID: any;

// Validation
const nameError = computed(() => {
  if (!touched.fName.value) return '';
  if (!fName.value.trim()) return 'Full name is required';
  if (fName.value.trim().length < 2) return 'Full name must be at least 2 characters';
  return '';
});

const emailError = computed(() => {
  if (!touched.email.value) return '';
  if (!email.value.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return 'Invalid email format';
  return '';
});

const passwordError = computed(() => {
  if (!touched.password.value) return '';
  if (!password.value) return 'Password is required';

  // Regex for strong password
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/;
  if (!strongPasswordRegex.test(password.value)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, and a special character';
  }

  return '';
});


const isFormValid = computed(() =>
  !nameError.value && !emailError.value && !passwordError.value && agreeToTerms.value
);

// Mutation
const { mutate, isPending } = useMutation({
  mutationFn: register,
  onSuccess: () => {
    router.push(`/otp-verification/${email.value}`);
  },
  onError: (error: any) => {
    errorMessage.value = error?.response?.data?.message || 'Something went wrong';
  },
});

const { mutateAsync: socialLoginMutate } = useMutation({ mutationFn: socialLogin });

async function loginWithGoogle() {
  try {
    const response = await googleTokenLogin();
    const userInfo = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${response.access_token}` },
    });

    const data = await socialLoginMutate({
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

async function loginWithApple() {
  try {
    AppleID.auth.init({
      clientId: 'com.orchit.ai',
      scope: 'name email',
      redirectURI: 'https://www.orchit.ai/dashboard',
      usePopup: true
    });
    
    const response = await AppleID.auth.signIn();
    const idToken = response.authorization.id_token;
    const base64Url = idToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decodedToken = JSON.parse(jsonPayload);

    const data = await socialLoginMutate({
      u_email: decodedToken.email,
      u_social_id: decodedToken.sub,
      u_social_type: "apple",
      u_full_name: response.user?.name ? `${response.user.name.firstName} ${response.user.name.lastName}` : (decodedToken.email?.split('@')[0] || ""),
    });
    
    handleLoginSuccess(data);
  } catch (err: any) {
    if (err?.error !== "popup_closed_by_user") {
      errorMessage.value = err?.message || "Apple Login failed. Please try again.";
    }
  }
}

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
    
    if (data?.data?.is_new_user) {
      router.push("/create-profile");
      return;
    }

    if (workspaceStore.pricing) {
      router.push(`/dashboard?stripePayment=true`);
    } else {
      router.push("/dashboard");
    }
}

function handleRegister() {
  errorMessage.value = '';
  // Force mark all fields as touched to trigger validation messages
  touched.fName.value = true;
  touched.email.value = true;
  touched.password.value = true;
   touched.terms.value = true;

  if (!isFormValid.value) {
    errorMessage.value = 'Please fill all required fields and accept the terms.';
    return;
  }

  mutate({
    u_full_name: fName.value,
    u_email: email.value,
    u_password: password.value,
    agree_to_terms: agreeToTerms.value,
  });
}

// Clear global error on input change
watch([fName, email, password], () => {
  if (errorMessage.value) errorMessage.value = '';
});

</script>

 