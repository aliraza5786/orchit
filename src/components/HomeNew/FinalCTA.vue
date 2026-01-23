<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
const currentYear = new Date().getFullYear()
defineProps<{
  isDark: boolean
  toggleTheme: () => void
}>()
function goToContactUs(){
    router.push('/contact-us')
}
function goToRegister(){
    router.push('/contact-us')
}
</script>

<template>
  <div>
    <!-- Final CTA Band -->
    <section class="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 to-pink-600">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-4xl md:text-5xl font-bold text-white mb-6">
          Ready to orchestrate your next idea?
        </h2>
        <p class="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Join thousands of builders turning ideas into structured, actionable plans with AI.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button @click="goToRegister" class="px-8 py-4 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-medium text-lg shadow-lg">
            Get started free
          </button>
          <button @click="goToContactUs()" class="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors font-medium text-lg">
            Contact Us
          </button>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-[var(--surface)] border-t border-[var(--border)] py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <!-- Logo & Tagline -->
          <div class="col-span-1 md:col-span-1">
            <RouterLink to="/" class="flex items-center gap-2">
              <img v-if="!isDark" src="../../assets/global/light-logo.png" alt="Orchit AI logo" class="w-24 sm:w-30"
                loading="eager" decoding="async" />
              <img v-else src="../../assets/global/dark-logo.png" alt="Orchit AI logo" class="w-24 sm:w-30" loading="eager"
                decoding="async" />
            </RouterLink>
            <p class="text-sm text-[var(--muted)]">
              Orchestrate your ideas into action with AI-powered planning.
            </p>
          </div>

          <!-- Product -->
          <div>
            <h4 class="font-semibold mb-3">Product</h4>
            <ul class="space-y-2">
              <li><a href="#product" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Features</a></li>
              <li><a href="#templates" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Templates</a></li>
              <li><a href="#marketplace" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Marketplace</a></li>
              <li><a href="#pricing" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Pricing</a></li>
            </ul>
          </div>

          <!-- Resources -->
          <div>
            <h4 class="font-semibold mb-3">Resources</h4>
            <ul class="space-y-2">
              <li><a href="/blogs" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Blog</a></li>
              <li><a href="#" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Release notes</a></li>
              <li><a href="/knowledge-center" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Help Center</a></li>
              <li><a href="#faq" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">FAQ</a></li>
            </ul>
          </div>

          <!-- Company -->
          <div>
            <h4 class="font-semibold mb-3">Company</h4>
            <ul class="space-y-2">
              <li><a href="/contact-us" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Contact</a></li>
              <li><a href="/privacy-policy" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Privacy</a></li>
              <li><a href="/terms-of-services" class="text-sm text-[var(--muted)] hover:text-[var(--text)] transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm text-[var(--muted)]">
            © {{ currentYear }} Orchit.ai. All rights reserved.
          </p>

          <!-- Social Links -->
          <div class="flex items-center gap-4">
            <a href="#" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors" aria-label="Twitter">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>
            <a href="#" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors" aria-label="LinkedIn">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a href="#" class="text-[var(--muted)] hover:text-[var(--text)] transition-colors" aria-label="GitHub">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>