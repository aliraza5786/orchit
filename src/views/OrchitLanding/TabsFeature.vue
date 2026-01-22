<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref(0)
const tabs = ['Strategy', 'Execution', 'Assets', 'Follow-ups']
</script>

<template>
  <section class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <!-- Left Content -->
        <div>
          <h2 class="text-4xl font-bold text-text-primary mb-6 font-manrope">
            Tabs that keep every angle of your idea together.
          </h2>
          <p class="text-text-secondary text-lg mb-8 leading-relaxed">
            Add tabs to create and organize multiple tracks — strategy, execution, assets, follow-ups. Keep related work together without losing flexibility.
          </p>
          <ul class="space-y-4">
            <li v-for="benefit in ['Organized by context', 'Switch views instantly', 'Share tabs with collaborators']" :key="benefit" class="flex items-center gap-3">
              <div class="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-accent"></div>
              </div>
              <span class="text-text-secondary">{{ benefit }}</span>
            </li>
          </ul>
        </div>

        <!-- Right - Mock UI -->
        <div class="bg-bg-surface border border-border rounded-2xl p-6 backdrop-blur-sm">
          <!-- Tab Bar -->
          <div class="flex gap-2 mb-6 border-b border-border pb-4 overflow-x-auto">
            <button 
              v-for="(tab, idx) in tabs" 
              :key="tab"
              @click="activeTab = idx"
              :class="[
                'px-4 py-2 rounded-lg font-medium transition whitespace-nowrap',
                activeTab === idx 
                  ? 'bg-accent/20 text-accent border border-accent/50' 
                  : 'text-text-secondary hover:text-text-primary'
              ]"
            >
              {{ tab }}
            </button>
          </div>

          <!-- Content Area -->
          <div class="space-y-4">
            <div v-for="i in 3" :key="i" class="p-4 bg-bg-input rounded-lg border border-border/50">
              <div class="flex justify-between items-start">
                <div>
                  <p class="text-text-primary font-medium text-sm">Item {{ i }}</p>
                  <p class="text-text-secondary text-xs mt-1">Description of content in {{ tabs[activeTab] }}</p>
                </div>
                <div class="text-xs text-text-secondary">●●●</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
