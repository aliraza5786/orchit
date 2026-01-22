<script setup lang="ts">
import { ref } from 'vue'

const activeView = ref('kanban')
</script>

<template>
  <section class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <!-- Left - Mock UI -->
        <div class="order-2 lg:order-1">
          <div class="bg-bg-surface border border-border rounded-2xl p-6 backdrop-blur-sm">
            <!-- View Toggle -->
            <div class="flex gap-2 mb-6 justify-center">
              <button 
                v-for="view in ['kanban', 'calendar', 'mindmap']" 
                :key="view"
                @click="activeView = view"
                :class="[
                  'px-4 py-2 rounded-lg font-medium transition text-sm capitalize',
                  activeView === view 
                    ? 'bg-accent/20 text-accent border border-accent/50' 
                    : 'text-text-secondary hover:text-text-primary border border-transparent'
                ]"
              >
                {{ view }}
              </button>
            </div>

            <!-- Mock Views -->
            <div class="h-64 flex items-center justify-center">
              <!-- Kanban View -->
              <div v-if="activeView === 'kanban'" class="w-full space-y-3">
                <div v-for="col in ['To Do', 'In Progress', 'Done']" :key="col" class="inline-block w-1/3 pr-2">
                  <p class="text-text-secondary text-xs font-semibold mb-2">{{ col }}</p>
                  <div v-for="i in 2" :key="i" class="bg-bg-input rounded p-2 text-text-secondary text-xs mb-2 border border-border">
                    Task {{ i }}
                  </div>
                </div>
              </div>

              <!-- Calendar View -->
              <div v-else-if="activeView === 'calendar'" class="w-full">
                <div class="grid grid-cols-7 gap-1">
                  <div v-for="i in 28" :key="i" class="aspect-square bg-bg-input rounded border border-border flex items-center justify-center text-xs text-text-secondary">
                    {{ i }}
                  </div>
                </div>
              </div>

              <!-- Mind Map View -->
              <div v-else class="w-full flex flex-col items-center justify-center">
                <div class="w-16 h-16 rounded-lg bg-accent/20 border border-accent/50 flex items-center justify-center mb-4">
                  <span class="text-text-primary text-xs">Core</span>
                </div>
                <div class="flex gap-8 justify-center mb-4">
                  <div v-for="i in 3" :key="i" class="w-12 h-12 rounded border border-border bg-bg-input flex items-center justify-center text-xs text-text-secondary">
                    {{ i }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Content -->
        <div class="order-1 lg:order-2">
          <h2 class="text-4xl font-bold text-text-primary mb-6 font-manrope">
            See it and work it your way.
          </h2>
          <p class="text-text-secondary text-lg mb-8 leading-relaxed">
            Switch between Kanban boards, calendar timelines, and mind maps. Choose the view that fits your thinking and working style.
          </p>
          <ul class="space-y-4">
            <li v-for="benefit in ['Calendar for timeline planning', 'Kanban for workflow', 'Mind map for brainstorming']" :key="benefit" class="flex items-center gap-3">
              <div class="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-accent"></div>
              </div>
              <span class="text-text-secondary">{{ benefit }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
