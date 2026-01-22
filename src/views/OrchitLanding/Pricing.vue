<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const submitted = ref(false)

const handleJoinWaitlist = () => {
  if (email.value.includes('@')) {
    submitted.value = true
    setTimeout(() => {
      email.value = ''
      submitted.value = false
    }, 3000)
  }
}

const pricingTiers = [
  {
    name: 'Starter',
    description: 'For individuals and small projects',
    price: 'Free',
    cta: 'Get started',
    features: ['1 workspace', '5 GB storage', 'Basic modules', 'Up to 2 views']
  },
  {
    name: 'Pro',
    description: 'For growing teams',
    price: 'Coming soon',
    cta: 'Join waitlist',
    features: ['Unlimited workspaces', '1 TB storage', 'All modules', 'All views', 'Integrations'],
    highlight: true
  },
  {
    name: 'Team',
    description: 'For enterprises',
    price: 'Custom',
    cta: 'Request demo',
    features: ['Unlimited everything', 'Advanced security', 'Priority support', 'Custom integrations', 'SSO']
  }
]
</script>

<template>
  <section id="pricing" class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-4 text-center font-manrope">Early access pricing</h2>
      <p class="text-text-secondary text-center mb-12">Start free. Upgrade when you're ready. Cancel anytime.</p>

      <!-- Pricing Cards -->
      <div class="grid md:grid-cols-3 gap-8 mb-16">
        <div 
          v-for="tier in pricingTiers" 
          :key="tier.name"
          :class="[
            'rounded-2xl p-8 border transition',
            tier.highlight 
              ? 'bg-accent/10 border-accent/50 relative' 
              : 'bg-bg-surface border-border hover:border-accent'
          ]"
        >
          <div v-if="tier.highlight" class="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-accent-text text-xs font-semibold">
            Most Popular
          </div>

          <h3 class="text-xl font-bold text-text-primary mb-2">{{ tier.name }}</h3>
          <p class="text-text-secondary text-sm mb-6">{{ tier.description }}</p>
          <p class="text-3xl font-bold text-text-primary mb-6">{{ tier.price }}</p>

          <button :class="[
            'w-full py-3 rounded-xl font-semibold transition mb-8',
            tier.highlight 
              ? 'bg-accent hover:bg-accent-hover text-accent-text' 
              : 'border border-border text-text-primary hover:border-accent'
          ]">
            {{ tier.cta }}
          </button>

          <ul class="space-y-3">
            <li v-for="feature in tier.features" :key="feature" class="flex items-center gap-3 text-text-primary/80 text-sm">
              <div class="w-4 h-4 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0">
                <div class="w-2 h-2 rounded-full bg-accent"></div>
              </div>
              {{ feature }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Email Capture -->
      <div class="max-w-2xl mx-auto bg-bg-surface border border-border rounded-2xl p-8">
        <h3 class="text-text-primary font-bold mb-4 text-center font-manrope">Join the early access program</h3>
        <p class="text-text-secondary text-center mb-6">Get notified when new features roll out and special early-bird pricing.</p>
        
        <div class="flex flex-col sm:flex-row gap-3 mb-4">
          <input 
            v-model="email"
            type="email"
            placeholder="your@email.com"
            class="flex-1 bg-bg-input border border-border-input rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary/50 focus:outline-none focus:border-accent transition"
            @keyup.enter="handleJoinWaitlist"
          />
          <button 
            @click="handleJoinWaitlist"
            class="px-6 py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-text font-semibold transition whitespace-nowrap"
          >
            {{ submitted ? '✓ Joined!' : 'Join waitlist' }}
          </button>
        </div>

        <p v-if="submitted" class="text-accent text-center text-sm">
          Thanks! Check your email for early access details.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
