<script setup lang="ts">
const testimonials = [
  {
    quote: 'Orchit turned my scattered ideas into a structured operating system in minutes. What used to take weeks of planning now happens in a single session.',
    author: 'Sarah Chen',
    role: 'Founder, TechFlow',
    avatar: '👩‍💼'
  },
  {
    quote: 'As an agency owner, client proposals used to take days. Now I generate complete scopes and workflows in minutes, and clients love the clarity.',
    author: 'Marcus Johnson',
    role: 'Creative Director, Pixel Studio',
    avatar: '👨‍💻'
  },
  {
    quote: 'I went from idea to execution plan faster than I thought possible. Orchit helped me see the gaps before I spent money, not after.',
    author: 'Emily Rodriguez',
    role: 'Startup Founder',
    avatar: '👩‍🚀'
  }
]
</script>

<template>
  <section class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Trusted by builders everywhere</h2>
        <p class="text-xl text-[var(--muted)]">See what people are saying about Orchit</p>
      </div>

      <!-- Testimonials Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div
          v-for="testimonial in testimonials"
          :key="testimonial.author"
          class="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 hover:border-purple-500 transition-all duration-300 hover:shadow-lg"
        >
          <!-- Quote Icon -->
          <div class="text-4xl text-purple-600 mb-4">"</div>

          <!-- Quote -->
          <p class="text-[var(--text)] mb-6 leading-relaxed">{{ testimonial.quote }}</p>

          <!-- Author -->
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-2xl">
              {{ testimonial.avatar }}
            </div>
            <div>
              <div class="font-semibold">{{ testimonial.author }}</div>
              <div class="text-sm text-[var(--muted)]">{{ testimonial.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>