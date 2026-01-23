<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')

const tiers = [
  {
    name: 'Starter',
    price: 'Coming Soon',
    description: 'Perfect for individuals and side projects',
    features: [
      'Unlimited ideas & workspaces',
      'AI-powered planning',
      'Basic templates',
      'Kanban & list views',
      'Up to 3 team members',
      'Community support'
    ],
    cta: 'Join waitlist',
    highlighted: false
  },
  {
    name: 'Pro',
    price: 'Coming Soon',
    description: 'For professionals and growing teams',
    features: [
      'Everything in Starter',
      'Advanced templates & modules',
      'Timeline & calendar views',
      'Custom workflows',
      'Up to 10 team members',
      'Priority support',
      'Export & integrations'
    ],
    cta: 'Join waitlist',
    highlighted: true
  },
  {
    name: 'Team',
    price: 'Coming Soon',
    description: 'For agencies and larger organizations',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Advanced permissions',
      'Custom modules & templates',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'SLA & security'
    ],
    cta: 'Request demo',
    highlighted: false
  }
]

const joinWaitlist = () => {
  if (email.value.trim()) {
    console.log('Joining waitlist with:', email.value)
    email.value = ''
  }
}
</script>

<template>
  <section id="pricing" class="py-20 px-4 sm:px-6 lg:px-8 bg-[var(--surface)]">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-4">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Early Access Pricing</h2>
        <p class="text-xl text-[var(--muted)] max-w-2xl mx-auto mb-8">
          Get in early and lock in special rates. Pricing coming soon.
        </p>
      </div>

      <!-- Pricing Tiers -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div
          v-for="tier in tiers"
          :key="tier.name"
          :class="[
            'bg-[var(--card)] border rounded-2xl p-8 transition-all duration-300',
            tier.highlighted
              ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-50 transform scale-105'
              : 'border-[var(--border)] hover:border-purple-500'
          ]"
        >
          <!-- Tier Name -->
          <div class="text-center mb-6">
            <h3 class="text-2xl font-bold mb-2">{{ tier.name }}</h3>
            <div class="text-3xl font-bold text-purple-600 mb-2">{{ tier.price }}</div>
            <p class="text-sm text-[var(--muted)]">{{ tier.description }}</p>
          </div>

          <!-- Features -->
          <ul class="space-y-3 mb-8">
            <li
              v-for="feature in tier.features"
              :key="feature"
              class="flex items-start gap-3"
            >
              <svg class="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span class="text-sm">{{ feature }}</span>
            </li>
          </ul>

          <!-- CTA -->
          <button
            :class="[
              'w-full py-3 rounded-lg font-medium transition-colors',
              tier.highlighted
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-[var(--surface)] border border-[var(--border)] hover:border-purple-500'
            ]"
          >
            {{ tier.cta }}
          </button>

          <!-- Best Value Badge -->
          <div
            v-if="tier.highlighted"
            class="text-center mt-4"
          >
            <span class="inline-block px-3 py-1 bg-purple-600/10 text-purple-600 text-xs font-medium rounded-full">
              Most Popular
            </span>
          </div>
        </div>
      </div>

      <!-- Email Capture -->
      <div class="max-w-md mx-auto bg-[var(--card)] border border-[var(--border)] rounded-2xl lg:p-8 lg:px-0 px-2 lg:py-0 py-4 text-center">
        <h3 class="text-xl font-semibold mb-3">Get notified when we launch</h3>
        <p class="text-[var(--muted)] mb-6">Be the first to know about early access pricing and special offers.</p>

        <div class="flex gap-3">
          <input
            v-model="email"
            type="email"
            placeholder="Enter your email"
            class="flex-1 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            @keyup.enter="joinWaitlist"
          />
          <button
            @click="joinWaitlist"
            class="lg:px-6 px-2 lg:py-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium whitespace-nowrap"
          >
            Join Waitlist
          </button>
        </div>
      </div>
    </div>
  </section>
</template>