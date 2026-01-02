<template>
  <AuthLayout>
    <template #form>
      <div class="max-w-[500px] md:mx-auto w-full">
        <div class="mb-12 space-y-2 text-center">
          <h2 class="text-[32px] font-medium text-text-primary">Welcome to Orchit AI</h2>
          <p class="text-base font-medium text-text-secondary">Create your free account</p>
        </div>
        <form @submit.prevent="handleRegister" class="space-y-4 w-full">
          <BaseTextField v-model="fName" label="Full Name" placeholder="Full Name" size="lg" :error="!!nameError"
            :message="nameError" @blur="touched.fName.value = true" />
          <BaseTextField v-model="email" label="Email" placeholder="john@example.com" size="lg" :error="!!emailError"
            :message="emailError" @blur="touched.email.value = true" />
          <BaseTextField v-model="password" label="Password" placeholder="Password" size="lg" type="password"
            :error="!!passwordError" :message="passwordError" @blur="touched.password.value = true" />
          <Button :disabled="isPending" size="lg" :block="true" type="submit">
            {{ isPending ? 'Creating Account...' : 'Sign up' }}
          </Button>
          <p v-if="errorMessage" class="text-red-500 text-sm text-center mt-2">
            {{ errorMessage }}
          </p>
          <p class="text-sm font-medium text-text-secondary text-center mt-6">
            By signing up, I agree to the
            <span class="text-text-primary font-bold">Privacy Policy</span> and
            <span class="text-text-primary font-bold">Terms of Service</span>.
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
import { register } from '../../services/auth';

const router = useRouter();

const fName = ref('');
const email = ref('');
const password = ref('');
const errorMessage = ref('');

// Field "touched" states
const touched = {
  fName: ref(false),
  email: ref(false),
  password: ref(false),
};

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
  !nameError.value && !emailError.value && !passwordError.value
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

function handleRegister() {
  errorMessage.value = '';
  // Force mark all fields as touched to trigger validation messages
  touched.fName.value = true;
  touched.email.value = true;
  touched.password.value = true;

  if (!isFormValid.value) {
    errorMessage.value = 'Please fill all fields correctly.';
    return;
  }

  mutate({
    u_full_name: fName.value,
    u_email: email.value,
    u_password: password.value,
  });
}

// Clear global error on input change
watch([fName, email, password], () => {
  if (errorMessage.value) errorMessage.value = '';
});

</script>