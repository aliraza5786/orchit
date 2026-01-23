<script setup lang="ts">
import { ref } from 'vue'

const moduleChips = ['Sales', 'Marketing', 'CRM', 'Product', 'Ops', 'Finance', 'HR', 'Support', 'Legal', 'Design']
const customModuleName = ref('')
const showGeneratedModule = ref(false)

const createModule = () => {
  if (customModuleName.value.trim()) {
    showGeneratedModule.value = true
    setTimeout(() => {
      customModuleName.value = ''
      showGeneratedModule.value = false
    }, 3000)
  }
}
</script>

<template>
  <section class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">
          Unlimited possibilities, shaped to your business
        </h2>
        <p class="text-xl text-[var(--muted)] max-w-2xl mx-auto">
          Customize your module (department) structure with AI.
        </p>
      </div>

      <!-- Module Chips -->
      <div class="flex flex-wrap justify-center gap-3 mb-12">
        <div
          v-for="chip in moduleChips"
          :key="chip"
          class="px-6 py-3 bg-[var(--card)] border border-[var(--border)] rounded-full text-sm font-medium hover:border-accent-hover transition-all cursor-pointer"
        >
          {{ chip }}
        </div>
        <div
          class="px-6 py-3 bg-accent border border-accent rounded-full text-sm font-medium text-white"
        >
          + More
        </div>
      </div>

      <!-- Micro Demo -->
      <div class="bg-[var(--card)] border border-[var(--border)] rounded-2xl lg:p-8 p-4 max-w-2xl mx-auto">
        <label class="block text-sm font-medium mb-3">Create a custom module...</label>
        <div class="flex gap-3">
          <input
            v-model="customModuleName"
            type="text"
            placeholder="e.g., Customer Success, R&D, Partnerships"
            class="flex-1 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-hover focus:border-transparent"
            @keyup.enter="createModule"
          />
          <button
            @click="createModule"
            class="lg:px-6 px-2 lg:py-3 py-1 bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors font-medium"
          >
            Generate
          </button>
        </div>

        <!-- Generated Module Card -->
        <transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <div
            v-if="showGeneratedModule"
            class="mt-6 p-6 bg-accent rounded-xl"
          >
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-accent rounded-lg flex items-center justify-center text-white text-xl">
                ✨
              </div>
              <div>
                <h4 class="font-semibold text-lg">{{ customModuleName }} Module</h4>
                <p class="text-sm text-[var(--muted)]">Generated with AI-powered structure</p>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </section>
</template>