<script setup lang="ts">
import { ref } from 'vue'

const openIndex = ref(0)

const faqs = [
  {
    question: "What is Orchit.ai, in one sentence?",
    answer: "Orchit is an AI workspace that turns your idea into a structured plan—modules, tabs, views, and next steps—so you can execute without chaos."
  },
  {
    question: "How is Orchit different from ChatGPT or a generic AI assistant?",
    answer: "Chat-style tools give answers. Orchit turns your prompt into an organized workspace (modules + tasks + views) you can run, refine, and build on over time."
  },
  {
    question: "What do you mean by 'orchestrate'?",
    answer: "It means Orchit helps you structure the entire idea lifecycle—planning, execution, assets, timelines, workflows, and follow-ups—so nothing important gets missed."
  },
  {
    question: "What can I build with Orchit?",
    answer: "Startup plans, product launches, marketing campaigns, sales pipelines/CRM, client proposals, onboarding systems, content calendars, study plans, and personal goal roadmaps."
  },
  {
    question: "Can I customize the modules and structure?",
    answer: "Yes. Add, remove, rename, or generate modules (like Sales, Marketing, CRM, Product, Ops) to match how you work."
  },
  {
    question: "What views are supported?",
    answer: "Work in views like Kanban, Calendar, and Mind map (with more views as they roll out), depending on how you prefer to plan and execute."
  },
  {
    question: "Is Orchit free to start? Do I need a credit card?",
    answer: "You can start free, and you don't need a credit card to begin. Upgrade only if/when you need advanced features."
  },
  {
    question: "Can agencies use Orchit to generate proposals and client plans?",
    answer: "Yes. Enter client requirements and Orchit drafts scope, deliverables, timeline, risks, and a proposal you can refine."
  },
  {
    question: "Does Orchit work for personal goals or academic plans too?",
    answer: "Absolutely. Prompt your goal and Orchit generates milestones, weekly actions, and a clear path to follow."
  },
  {
    question: "Can I export my work or share it with others?",
    answer: "Sharing and export options are designed to help you keep and reuse your plans. Availability may depend on your plan as features evolve."
  }
]

const toggleItem = (idx: number) => {
  openIndex.value = openIndex.value === idx ? -1 : idx
}
</script>

<template>
  <section id="faq" class="py-20 px-6 bg-bg-body">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-4 text-center font-manrope">Frequently asked questions</h2>
      <p class="text-text-secondary text-center mb-12">Find answers to common questions about Orchit.</p>

      <!-- Accordion -->
      <div class="space-y-3">
        <div 
          v-for="(faq, idx) in faqs" 
          :key="idx"
          class="bg-bg-surface border border-border rounded-xl overflow-hidden hover:border-accent/50 transition"
        >
          <!-- Header -->
          <button 
            @click="toggleItem(idx)"
            class="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-input transition text-left"
          >
            <span class="text-text-primary font-semibold pr-4">{{ faq.question }}</span>
            <div class="w-5 h-5 flex-shrink-0 flex items-center justify-center">
              <svg 
                class="w-4 h-4 text-text-secondary transition" 
                :class="openIndex === idx ? 'rotate-180' : ''"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </button>

          <!-- Content -->
          <div 
            v-show="openIndex === idx"
            class="px-6 pb-4 text-text-primary/80 leading-relaxed animate-in fade-in duration-300"
          >
            {{ faq.answer }}
          </div>
        </div>
      </div>

      <!-- Help Section -->
      <div class="mt-16 text-center">
        <p class="text-text-secondary mb-6">Still have questions?</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <button class="px-8 py-3 rounded-xl bg-accent hover:bg-accent-hover text-accent-text font-semibold transition">
            Request a demo
          </button>
          <button class="px-8 py-3 rounded-xl border border-border text-text-primary font-semibold hover:border-accent transition">
            Contact us
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    height: 0;
  }
  to {
    opacity: 1;
    height: auto;
  }
}

.animate-in {
  animation: fadeIn 0.3s ease-out;
}
</style>
