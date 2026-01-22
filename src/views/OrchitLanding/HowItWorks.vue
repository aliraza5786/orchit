<template>
  <section class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-16 text-center font-manrope">How it works</h2>
      
      <div class="grid md:grid-cols-3 gap-8">
        <!-- Step 1 -->
        <div class="relative">
          <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mb-6">
              <span class="text-accent-text text-2xl">💭</span>
            </div>
            <h3 class="text-xl font-bold text-text-primary mb-4 font-manrope">Prompt your idea</h3>
            <p class="text-text-secondary leading-relaxed">
              Write what you want to build, launch, or plan. Be as specific or as vague as you like.
            </p>
          </div>
          <!-- Arrow -->
          <div class="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-border to-transparent"></div>
        </div>

        <!-- Step 2 -->
        <div class="relative">
          <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 rounded-2xl bg-accent/80 flex items-center justify-center mb-6">
              <span class="text-accent-text text-2xl">⚡</span>
            </div>
            <h3 class="text-xl font-bold text-text-primary mb-4 font-manrope">Orchit generates modules, tabs, and a plan</h3>
            <p class="text-text-secondary leading-relaxed">
              Instantly get a structured workspace with departments, tasks, timelines, and next steps.
            </p>
          </div>
          <!-- Arrow -->
          <div class="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-gradient-to-r from-border to-transparent"></div>
        </div>

        <!-- Step 3 -->
        <div>
          <div class="flex flex-col items-center text-center">
            <div class="w-16 h-16 rounded-2xl bg-accent/60 flex items-center justify-center mb-6">
              <span class="text-accent-text text-2xl">🎯</span>
            </div>
            <h3 class="text-xl font-bold text-text-primary mb-4 font-manrope">Run it in your preferred views — iterate as you go</h3>
            <p class="text-text-secondary leading-relaxed">
              Switch between Kanban, Calendar, and Mind map. Refine tasks, update timelines, and execute.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
