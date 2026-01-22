<script setup lang="ts">
import { ref } from 'vue'

const faqs = [
  {
    question: 'What is Orchit.ai?',
    answer: 'Orchit.ai is an AI-powered platform that helps you turn ideas into structured, actionable plans. It generates modules, workflows, tasks, and roadmaps for any project or business idea in minutes.'
  },
  {
    question: 'How does Orchit help me organize my idea?',
    answer: 'Simply describe your idea in plain English, and Orchit uses AI to break it down into logical modules, workflows, and tasks. It creates a complete operational structure that you can immediately start working with and customizing.'
  },
  {
    question: 'What types of projects can I build with Orchit?',
    answer: 'Orchit works for any type of project: startups, product launches, agency deliverables, content systems, personal projects, course creation, marketing campaigns, and more. If you can describe it, Orchit can structure it.'
  },
  {
    question: 'How does Orchit differ from ChatGPT?',
    answer: 'While ChatGPT generates text, Orchit generates actionable workspace structures with modules, tasks, workflows, and multiple views (kanban, timeline, table). It\'s built specifically for planning and execution, not just conversation.'
  },
  {
    question: 'Can I customize modules?',
    answer: 'Absolutely! Everything Orchit generates is fully customizable. You can edit modules, rename tasks, reorganize workflows, add custom fields, and structure your workspace exactly how you need it.'
  },
  {
    question: 'Can I export my work or share it with others?',
    answer: 'Yes! You can invite team members to collaborate on your workspace, share specific views, and export your plans. Pro and Team plans include advanced sharing and export options.'
  },
  {
    question: 'Is Orchit free to start?',
    answer: 'Yes! We offer early access with free plans to get you started. You can create workspaces, generate plans, and start organizing your ideas immediately. Premium features and team collaboration are available on paid plans.'
  }
]

const openIndex = ref(0) // First question open by default

const toggle = (index: number) => {
  openIndex.value = openIndex.value === index ? -1 : index
}
</script>

<template>
  <section id="faq" class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
        <p class="text-xl text-[var(--muted)]">Everything you need to know about Orchit</p>
      </div>

      <!-- FAQ Accordion -->
      <div class="space-y-4">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden hover:border-purple-500 transition-colors"
        >
          <!-- Question -->
          <button
            @click="toggle(index)"
            class="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none group"
          >
            <span class="font-semibold text-lg pr-8">{{ faq.question }}</span>
            <svg
              :class="[
                'w-5 h-5 flex-shrink-0 transition-transform duration-300',
                openIndex === index ? 'transform rotate-180' : ''
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Answer -->
          <transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="max-h-0 opacity-0"
            enter-to-class="max-h-96 opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="max-h-96 opacity-100"
            leave-to-class="max-h-0 opacity-0"
          >
            <div
              v-show="openIndex === index"
              class="overflow-hidden"
            >
              <div class="px-6 pb-5 text-[var(--muted)] leading-relaxed">
                {{ faq.answer }}
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Additional Help -->
      <div class="mt-12 text-center">
        <p class="text-[var(--muted)] mb-4">Still have questions?</p>
        <a
          href="/contact-us"
          class="text-purple-600 hover:text-purple-700 font-medium inline-flex items-center gap-2"
        >
          Contact our team
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  </section>
</template>
