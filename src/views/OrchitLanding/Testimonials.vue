<template>
  <section class="py-20 px-6 bg-bg-body">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-4xl font-bold text-text-primary mb-12 text-center font-manrope">What people are saying</h2>

      <div class="grid md:grid-cols-3 gap-8">
        <div v-for="i in 3" :key="i" class="bg-bg-surface border border-border rounded-2xl p-8">
          <!-- Stars -->
          <div class="flex gap-1 mb-4">
            <span v-for="j in 5" :key="j" class="text-accent">★</span>
          </div>
          
          <p class="text-text-primary/90 mb-6 leading-relaxed italic">
            "{{ ['This tool completely changed how I plan projects. From chaos to clarity in minutes.', 'Finally, a tool that understands what founders actually need. Game-changer.', 'Impressed by how quickly Orchit turned my vague idea into a structured roadmap.'][i-1] }}"
          </p>

          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent/50"></div>
            <div>
              <p class="text-text-primary font-semibold">{{ ['Sarah Chen', 'Marcus Williams', 'Alex Rodriguez'][i-1] }}</p>
              <p class="text-text-secondary text-sm">{{ ['Founder, Tech Startup', 'Marketing Director', 'Independent Creator'][i-1] }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
</style>
