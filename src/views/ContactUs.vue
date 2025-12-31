<template>
    <section class="w-full float-left px-[15px] py-[40px] md:py-[60px] lg:py-[80px]">
        <div class="max-w-[1050px] mx-auto">
            <div class="w-full grid md:grid-cols-[1fr_1.5fr] gap-[30px] lg:gap-[48px]">
                <!-- Left Info Section -->
                <aside class="">
                    <div class="mb-[24px]">
                        <h2
                            class="font-manrope text-text-primary font-bold  text-[24px] lg:text-[36px] leading-[34px] lg:leading-[40px] tracking-[-1px] mb-[15px] lg:mb-[24px]">
                            Contact Us</h2>
                        <ul class="space-y-[16px] font-manrope text-[14px] md:text-[16px] leading-[100%] md:leading-[24px] font-normal"
                            :class="theme === 'light' ? 'text-black' : 'text-text-secondary'">
                            <li class="flex items-center gap-[12px]">
                                <span class="text-text-primary text-md md:text-lg"> <i
                                        class="fa-regular fa-circle-check"></i></span> Request a demo
                            </li>
                            <li class="flex items-center gap-[12px]">
                                <span class="text-text-primary text-md md:text-lg"><i
                                        class="fa-regular fa-circle-check"></i></span> Learn which plan fits your team
                            </li>
                            <li class="flex items-center gap-[12px]">
                                <span class="text-text-primary text-md md:text-lg"><i
                                        class="fa-regular fa-circle-check"></i></span> Get onboarding help
                            </li>
                        </ul>
                    </div>

                    <div class="border-y border-border py-[25px] md:py-[33px]">
                        <p class="font-manrope text-[14px] leading-[20px] font-normal mb-[10px]"
                            :class="theme === 'light' ? 'text-black' : 'text-text-secondary'">
                            Technical issues or product questions?</p>
                        <RouterLink to="#"
                            class="font-manrope  text-[14px] leading-[20px] font-normal text-text-primary hover:text-accent flex items-center gap-[12px]">
                            Contact support <i class="fa-solid fa-arrow-right-long pt-1"></i></RouterLink>
                    </div>

                    <div class="py-[25px] md:py-[33px]">
                        <h3 class="font-manrope  text-[14px] leading-[20px] font-semibold text-text-primary mb-[12px]">
                            What to expect</h3>
                        <ul class="list-disc ml-5 space-y-[8px] font-manrope text-[14px] leading-[20px] font-normal "
                            :class="theme === 'light' ? 'text-black' : 'text-text-secondary'">
                            <li>Response within 24 hours</li>
                            <li>Personalized demo based on your needs</li>
                            <li>Custom pricing for enterprise teams</li>
                        </ul>
                    </div>

                    <div class="border-t border-border pt-[25px]">
                        <h3 class="font-manrope  text-[14px] leading-[20px] font-semibold text-text-primary mb-[12px]">
                            Trusted by teams at</h3>
                        <div class="flex gap-2">
                            <span
                                class="bg-bg-charcoal px-3 py-1 rounded-md text-text-secondary  font-manrope text-[12px] leading-[16px] font-normal"
                                :class="{ 'bg-gradinet text-white': theme === 'light' }">Microsoft</span>
                            <span
                                class="bg-bg-charcoal px-3 py-1 rounded-md text-text-secondary font-manrope  text-[12px] leading-[16px] font-normal"
                                :class="{ 'bg-gradinet text-white': theme === 'light' }">Stripe</span>
                            <span
                                class="bg-bg-charcoal px-3 py-1 rounded-md  text-text-secondary font-manrope  text-[12px] leading-[16px] font-normal"
                                :class="{ 'bg-gradinet text-white': theme === 'light' }">Adobe</span>
                        </div>
                    </div>
                </aside>

                <!-- Right Form Section -->
                <div class="bg-bg-lavender rounded-[12px] shadow-xl px-[15px] py-[25px] sm:p-[25px] lg:p-[33px] relative"
                    :class="theme === 'dark' ? 'border border-border-input' : 'border border-[#a495e9b5]'">
                    <h3
                        class="font-manrope text-[18px] sm:text-[20px]  leading-[28px] font-normal mb-3 sm:mb-[24px] text-text-primary">
                        Tell us how we can help</h3>

                    <form @submit.prevent="handleSubmit" class="space-y-[15px] sm:space-y-[24px]">
                        <!-- Full Name -->
                        <div>
                            <label for="name"
                                class="block text-[14px] font-manrope leading-[20px] font-medium text-text-secondary mb-1">Full
                                name</label>
                            <input id="name" @input="errors.fullName = ''" v-model.trim="form.fullName" type="text"
                                class="w-full px-4 py-2.5 rounded-md bg-bg-body border transition font-manrope  text-[14px] leading-[20px] font-normal text-text-primary focus:outline-none focus:ring-0 focus:border-none"
                                :class="[errors.fullName ? 'border-red-500' : 'border-border-input', theme === 'dark' ? '' : 'border-0']" />
                            <p v-if="errors.fullName" class="text-red-400 font-manrope text-[12px] mt-1">{{
                                errors.fullName }}</p>
                        </div>

                        <!-- Email -->
                        <div>
                            <label for="email"
                                class="block text-[14px] font-manrope leading-[20px] font-medium text-text-secondary mb-1">Work
                                email</label>
                            <input id="email" @input="errors.email = ''" v-model.trim="form.email" type="email"
                                class="w-full px-4 py-2.5 rounded-md bg-bg-body border transition font-manrope  text-[14px] leading-[20px] font-normal text-text-primary focus:outline-none focus:ring-0 focus:border-none"
                                :class="[errors.email ? 'border-red-500' : 'border-border-input', theme === 'dark' ? '' : 'border-0']" />
                            <p v-if="errors.email" class="text-red-400 font-manrope text-[12px] mt-1">{{ errors.email }}
                            </p>
                        </div>

                        <!-- Company Size -->
                        <div>
                            <label for="companySize"
                                class="block text-[14px] font-manrope leading-[20px] font-medium text-text-secondary mb-1">Company
                                size</label>
                            <div class="relative">
                                <select id="companySize" v-model="form.companySize"
                                     @change="errors.companySize = ''"
                                    class="w-full appearance-none px-4 py-2.5 rounded-md bg-bg-body border transition font-manrope  text-[14px] leading-[20px] font-normal text-text-primary focus:outline-none focus:ring-0 focus:border-none"
                                    :class="[errors.companySize ? 'border-red-500' : 'border-border-input', theme === 'dark' ? '' : 'border-0']">
                                    <option disabled value="">Select company size</option>
                                    <option>1–10 employees</option>
                                    <option>11–50 employees</option>
                                    <option>51–200 employees</option>
                                    <option>201–500 employees</option>
                                    <option>500+ employees</option>
                                </select>
                                <i
                                    class="fa-solid fa-chevron-down absolute text-[10px] right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"></i>
                            </div>
                            <p v-if="errors.companySize" class="text-red-400 font-manrope text-[12px] mt-1">{{
                                errors.companySize }}</p>
                        </div>

                        <!-- Message -->
                        <div>
                            <label for="message"
                                class="block text-[14px] font-manrope leading-[20px] font-medium text-text-secondary mb-1">Tell
                                us about your
                                requirements</label>
                            <textarea id="message" v-model.trim="form.message" rows="4"
                                @input="errors.message = ''"
                                placeholder="I'm interested in learning more about..."
                                class="w-full px-4 py-2.5 rounded-md bg-bg-body border transition font-manrope  text-[14px] leading-[20px] font-normal text-text-primary focus:outline-none focus:ring-0 focus:border-none"
                                :class="[errors.message ? 'border-red-500' : 'border-border-input', theme === 'dark' ? '' : 'border-0']"></textarea>
                            <p v-if="errors.message" class="text-red-400 font-manrope text-[12px] mt-1">{{
                                errors.message }}</p>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" :disabled="loading"
                            class="w-full my-3 bg-white text-black cursor-pointer text-[14px] font-manrope leading-[20px] font-semibold py-3 rounded-[10px] hover:white transition disabled:opacity-50"
                            :class="{ 'bg-gradinet text-white': theme === 'light' }">
                            <span v-if="!loading">Send message</span>
                            <span v-else class="animate-pulse">Sending...</span>
                        </button>
                    </form>

                    <!-- Toast Notification -->
                    <transition name="fade">
                        <div v-if="toastMessage" :class="toastType === 'success' ? 'bg-green-600' : 'bg-red-600'"
                            class="absolute bottom-4 right-4 px-4 py-2 rounded-md text-white text-sm shadow-lg">
                            {{ toastMessage }}
                        </div>
                    </transition>
                    <p class="text-[12px] font-manrope leading-[16px] font-normal text-text-primary text-center">You can
                        also email us at  <a class="font-semibold" href="mailto:sales@company.com">sales@orchit.ai</a>
                    </p>
                </div>
            </div>
        </div>

    </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useTheme } from "../composables/useTheme";
const { theme } = useTheme(); // light / dark / system

interface ContactForm {
    fullName: string
    email: string
    companySize: string
    message: string
}
interface FormErrors {
    fullName?: string
    email?: string
    companySize?: string
    message?: string
}

const form = ref<ContactForm>({
    fullName: '',
    email: '',
    companySize: '',
    message: '',
})
const errors = ref<FormErrors>({})
const loading = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error'>('success')

// Validation
function validateForm(): boolean {
    errors.value = {}
    if (!form.value.fullName) errors.value.fullName = 'Full name is required.'
    if (!form.value.email) {
        errors.value.email = 'Email is required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
        errors.value.email = 'Enter a valid email.'
    }
    if (!form.value.companySize) errors.value.companySize = 'Select company size.'
    if (!form.value.message || form.value.message.length < 10)
        errors.value.message = 'Message must be at least 10 characters.'
    return Object.keys(errors.value).length === 0
}

// Submit Handler 
async function handleSubmit() {
    if (!validateForm()) return

    loading.value = true
    toastMessage.value = ''
    try {
        // Example API 
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form.value),
        })

        if (!response.ok) throw new Error('Failed to send message')

        // Simulate a short delay
        await new Promise((r) => setTimeout(r, 1000))

        toastType.value = 'success'
        toastMessage.value = '✅ Your message was sent successfully!'
        form.value = { fullName: '', email: '', companySize: '', message: '' }
    } catch (error) {
        toastType.value = 'error'
        toastMessage.value = '❌ Failed to send message. Try again later.'
    } finally {
        loading.value = false
        setTimeout(() => (toastMessage.value = ''), 4000)
    }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.bg-gradinet {
    background: linear-gradient(142.27deg, #4E3C9E 11.4%, #B5A1F7 84.44%);
}
</style>
