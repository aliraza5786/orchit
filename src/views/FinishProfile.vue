<template>
    <AuthLayout>
        <template #form>
            <div class="max-w-[500px] md:mx-auto w-full">
                <div class="mb-12 space-y-2">
                    <h2 class="text-[32px] text-primary font-medium">Great! Your Account is All Set</h2>
                    <p class="text-base  font-medium text-text-secondary ">Get started with
                        Orchit AI. Create a project or explore your dashboard.
                    </p>
                </div>
                <Button size="lg" :block="true" @click="register"> Explore Home</Button>
                <Button size="lg" :block="true" @click="createWS" variant="secondary" class="mt-4"> Let’s Start
                    Creating Your First WorkSpace</Button>
            </div>
        </template>
    </AuthLayout>
</template>
<script setup lang="ts">
import AuthLayout from '../layout/AuthLayout/AuthLayout.vue';
import Button from '../components/ui/Button.vue';
import { useRouter } from 'vue-router'
const router = useRouter()
function register() {
    router.push('/')
}
function createWS() {
    router.push('/create-workspace')
}
</script>