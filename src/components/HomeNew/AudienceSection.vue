<script setup lang="ts">
import startup from "@/assets/LandingPageImages/audience/startup.png";
import agency from "@/assets/LandingPageImages/audience/agency.png";
import academic from "@/assets/LandingPageImages/audience/academic.png";
import creator from "@/assets/LandingPageImages/audience/creator.png";
import consulting from "@/assets/LandingPageImages/audience/consulting.png";
import ops from "@/assets/LandingPageImages/audience/ops.png";

const emit = defineEmits<{ (e: "try-prompt", text: string): void }>();

const audiences = [
  {
    image: startup,
    title: "Entrepreneurs & Startups",
    description:
      "Turn a spark into an operating system. Get modules, workflows, and a roadmap for your business idea in minutes.",
    prompt: "Create a complete startup operating system for my business idea",
  },
  {
    image: agency,
    title: "Agencies & Freelancers",
    description:
      "Create client proposals in minutes. Turn vague briefs into structured scopes, deliverables, and timelines.",
    prompt: "Build a client delivery system for my agency",
  },
  {
    image: academic,
    title: "Personal/Professional/Academic",
    description:
      "Get a step-by-step plan in seconds. From thesis projects to career transitions, structure any complex goal.",
    prompt: "Help me plan and structure my personal project",
  },
  {
    image: creator,
    title: "Creators & Solopreneurs",
    description:
      "Turn ideas into consistent output. Build content systems, product launches, and revenue streams.",
    prompt: "Create a content creation and monetization system",
  },
  {
    image: consulting,
    title: "Consultants & Coaches",
    description:
      "Make delivery repeatable. Package your expertise into frameworks clients can follow and implement.",
    prompt: "Build a repeatable delivery framework for my consulting practice",
  },
  {
    image: ops,
    title: "Operators & Small Teams",
    description:
      "Run projects without the overhead. Get structure, visibility, and momentum without complex tools.",
    prompt: "Create a lightweight operations system for my small team",
  },
];
// const tryPrompt = (prompt: string) => {
//   emit("try-prompt", prompt);
// };
</script>
<template>
  <section class="py-20 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-4">Orchit for everyone</h2>
        <p class="text-xl text-[var(--muted)] max-w-2xl mx-auto">
          Think, plan, and play — a structured playground for ideas, projects,
          and execution.
        </p>
      </div>
      <!-- Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div
          v-for="audience in audiences"
          :key="audience.title"
          class="group bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-accent-hover transition-all duration-300 hover:shadow-lg flex flex-col h-full cursor-pointer"
        >
          <!-- Image -->
          <div class="h-48 w-full overflow-hidden shrink-0 relative">
            <img 
              :src="audience.image" 
              :alt="audience.title"
              class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <!-- Color Tint Overlay -->
            <div class="absolute inset-0 bg-indigo-900/30 mix-blend-color-burn pointer-events-none"></div>
            <div class="absolute inset-0 bg-purple-500/10 mix-blend-overlay pointer-events-none"></div>
          </div>
          
          <!-- Content -->
          <div class="p-6 flex flex-col grow">
            <h3 class="text-xl font-semibold mb-3">{{ audience.title }}</h3>
            <p class="text-[var(--muted)] leading-relaxed text-sm">
              {{ audience.description }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
