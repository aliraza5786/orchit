<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

// Types
interface Module {
  id: string;
  name: string;
  progress: number;
  total: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  workload: number;
  avatar: string;
  color: string;
}

interface Insight {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  actionLabel: string;
  actionLink: string;
  completed: boolean;
  illustration: string;
}

interface Lane {
  id: string;
  name: string;
  taskCount: number;
  color: string;
}

interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
}

interface Plan {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
}

interface Process {
  id: string;
  name: string;
  stage: string;
  efficiency: number;
}

// State
const userName = ref('Omar');
const lastUpdate = ref('Jan 27, 2026 - 06:13 PM');
const isVisible = ref(false);
const activeFilter = ref('All');

// Data based on the project overview
const modules = ref<Module[]>([
  { id: '1', name: 'User Task Management', progress: 0, total: 88, status: 'not-started' },
  { id: '2', name: 'Admin Dashboard', progress: 0, total: 89, status: 'not-started' },
  { id: '3', name: 'Reporting & Analytics', progress: 0, total: 83, status: 'not-started' }
]);

const teamMembers = ref<TeamMember[]>([
  { id: '1', name: 'Designer 1', role: 'UI/UX Designer', workload: 7, avatar: 'D1', color: 'bg-red-500' },
  { id: '2', name: 'Designer 2', role: 'UI/UX Designer', workload: 7, avatar: 'D2', color: 'bg-blue-500' },
  { id: '3', name: 'Designer 3', role: 'UI/UX Designer', workload: 7, avatar: 'D3', color: 'bg-pink-500' },
  { id: '4', name: 'QA Tester 1', role: 'Quality Assurance', workload: 7, avatar: 'Q1', color: 'bg-orange-500' },
  { id: '5', name: 'QA Tester 2', role: 'Quality Assurance', workload: 7, avatar: 'Q2', color: 'bg-teal-500' }
]);

const insights = ref<Insight[]>([
  {
    id: '1',
    title: 'Kickstart your modules',
    description: 'Get your User Task Management module up and running. Start with the core features and build momentum for the entire project.',
    category: 'To do',
    icon: '🚀',
    actionLabel: 'Get started',
    actionLink: '#',
    completed: false,
    illustration: '📋'
  },
  {
    id: '2',
    title: 'Balance team workload',
    description: 'Your team has even workload distribution at 7% each. Consider prioritizing tasks to maximize productivity across all 14 members.',
    category: 'Team Management',
    icon: '⚖️',
    actionLabel: 'View details',
    actionLink: '#',
    completed: false,
    illustration: '👥'
  },
  {
    id: '3',
    title: 'Set up reporting workflows',
    description: 'Establish your analytics and reporting structure early. This will help track progress across all 260 tasks effectively.',
    category: 'Analytics',
    icon: '📊',
    actionLabel: 'Configure now',
    actionLink: '#',
    completed: false,
    illustration: '📈'
  },
  {
    id: '4',
    title: 'Track recent changes',
    description: 'Stay updated with timeline adjustments. Tanveer Hassan Khan recently modified end dates - ensure alignment across the team.',
    category: 'Communication',
    icon: '🔔',
    actionLabel: 'See activity',
    actionLink: '#',
    completed: false,
    illustration: '📅'
  },
  {
    id: '5',
    title: 'Optimize admin dashboard',
    description: 'With 89 tasks in the Admin Dashboard module, break them into manageable sprints for better tracking and delivery.',
    category: 'Planning',
    icon: '🎯',
    actionLabel: 'Create sprints',
    actionLink: '#',
    completed: false,
    illustration: '📱'
  },
  {
    id: '6',
    title: 'Enable collaboration tools',
    description: 'Set up real-time collaboration features to keep your 14-member team synchronized and productive.',
    category: 'Collaboration',
    icon: '🤝',
    actionLabel: 'Enable now',
    actionLink: '#',
    completed: false,
    illustration: '💬'
  },
  {
    id: '7',
    title: 'Monitor progress metrics',
    description: 'Create custom dashboards to visualize progress across all three modules and identify potential bottlenecks early.',
    category: 'Insights',
    icon: '📉',
    actionLabel: 'Build dashboard',
    actionLink: '#',
    completed: false,
    illustration: '🎨'
  },
  {
    id: '8',
    title: 'Document your processes',
    description: 'Establish documentation standards now to maintain consistency as your project grows from 0 to 260 completed tasks.',
    category: 'Documentation',
    icon: '📝',
    actionLabel: 'Start docs',
    actionLink: '#',
    completed: false,
    illustration: '📚'
  }
]);

const lanes = ref<Lane[]>([
  { id: '1', name: 'Backlog', taskCount: 180, color: 'bg-gray-400' },
  { id: '2', name: 'To Do', taskCount: 80, color: 'bg-blue-400' },
  { id: '3', name: 'In Progress', taskCount: 0, color: 'bg-yellow-400' },
  { id: '4', name: 'Review', taskCount: 0, color: 'bg-purple-400' },
  { id: '5', name: 'Done', taskCount: 0, color: 'bg-green-400' }
]);

const recentTasks = ref<Task[]>([
  { id: '1', title: 'Set up project structure', assignee: 'Designer 1', dueDate: '2026-01-29', priority: 'high', status: 'To Do' },
  { id: '2', title: 'Design user dashboard', assignee: 'Designer 2', dueDate: '2026-02-05', priority: 'high', status: 'To Do' },
  { id: '3', title: 'Create component library', assignee: 'Designer 3', dueDate: '2026-02-10', priority: 'medium', status: 'To Do' }
]);

const plans = ref<Plan[]>([
  { id: '1', name: 'Phase 1: Foundation', startDate: '2026-01-28', endDate: '2026-02-28', progress: 0 },
  { id: '2', name: 'Phase 2: Development', startDate: '2026-03-01', endDate: '2026-04-30', progress: 0 },
  { id: '3', name: 'Phase 3: Testing & Launch', startDate: '2026-05-01', endDate: '2026-05-31', progress: 0 }
]);

const processes = ref<Process[]>([
  { id: '1', name: 'Design Review', stage: 'Not Started', efficiency: 0 },
  { id: '2', name: 'Development Workflow', stage: 'Not Started', efficiency: 0 },
  { id: '3', name: 'QA Testing', stage: 'Not Started', efficiency: 0 }
]);

// Computed
const totalTasks = computed(() => modules.value.reduce((sum, m) => sum + m.total, 0));
const totalProgress = computed(() => modules.value.reduce((sum, m) => sum + m.progress, 0));
const teamSize = computed(() => teamMembers.value.length);
const averageWorkload = computed(() => {
  if (teamMembers.value.length === 0) return 0;
  return Math.round(teamMembers.value.reduce((sum, m) => sum + m.workload, 0) / teamMembers.value.length);
});

const categories = computed(() => ['All', ...new Set(insights.value.map(i => i.category))]);

const filteredInsights = computed(() => {
  if (activeFilter.value === 'All') return insights.value;
  return insights.value.filter(i => i.category === activeFilter.value);
});

// Methods
const toggleInsightComplete = (insightId: string) => {
  const insight = insights.value.find(i => i.id === insightId);
  if (insight) {
    insight.completed = !insight.completed;
  }
};

const getProgressColor = (progress: number, total: number) => {
  const percentage = total > 0 ? (progress / total) * 100 : 0;
  if (percentage === 0) return 'bg-gray-300';
  if (percentage < 30) return 'bg-red-400';
  if (percentage < 70) return 'bg-yellow-400';
  return 'bg-green-400';
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-700 border-red-300';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'low': return 'bg-green-100 text-green-700 border-green-300';
    default: return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

// Lifecycle
onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 100);
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
    <!-- Header -->
    <header 
      class="bg-white/80 backdrop-blur-lg border-b border-indigo-100 sticky top-0 z-50 transition-all duration-700"
      :class="{ 'translate-y-0 opacity-100': isVisible, '-translate-y-4 opacity-0': !isVisible }"
    >
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              👋 Hi {{ userName }}, here are some tips for you
            </h1>
            <p class="text-sm text-gray-500 mt-1">Last update on {{ lastUpdate }}</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <p class="text-sm text-gray-600">Total Progress</p>
              <p class="text-2xl font-bold text-indigo-600">{{ totalProgress }} / {{ totalTasks }}</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Filter Tabs -->
    <div 
      class="max-w-7xl mx-auto px-6 py-6 transition-all duration-700 delay-100"
      :class="{ 'translate-y-0 opacity-100': isVisible, 'translate-y-4 opacity-0': !isVisible }"
    >
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          v-for="category in categories"
          :key="category"
          @click="activeFilter = category"
          class="px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 transform hover:scale-105"
          :class="activeFilter === category 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'"
        >
          {{ category }}
        </button>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 pb-12">
      <!-- Summary Cards -->
      <div 
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 transition-all duration-700 delay-200"
        :class="{ 'translate-y-0 opacity-100': isVisible, 'translate-y-4 opacity-0': !isVisible }"
      >
        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-indigo-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-3xl">📦</span>
            <span class="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Modules</span>
          </div>
          <h3 class="text-2xl font-bold text-gray-800">{{ modules.length }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ totalTasks }} total tasks</p>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-purple-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-3xl">👥</span>
            <span class="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Team</span>
          </div>
          <h3 class="text-2xl font-bold text-gray-800">{{ teamSize }}</h3>
          <p class="text-sm text-gray-600 mt-1">{{ averageWorkload }}% avg workload</p>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-pink-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-3xl">🎯</span>
            <span class="text-sm font-medium text-pink-600 bg-pink-50 px-3 py-1 rounded-full">Lanes</span>
          </div>
          <h3 class="text-2xl font-bold text-gray-800">{{ lanes.length }}</h3>
          <p class="text-sm text-gray-600 mt-1">Workflow stages</p>
        </div>

        <div class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-teal-100">
          <div class="flex items-center justify-between mb-2">
            <span class="text-3xl">📋</span>
            <span class="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full">Plans</span>
          </div>
          <h3 class="text-2xl font-bold text-gray-800">{{ plans.length }}</h3>
          <p class="text-sm text-gray-600 mt-1">Active phases</p>
        </div>
      </div>

      <!-- Insights Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
        <div
          v-for="(insight, index) in filteredInsights"
          :key="insight.id"
          class="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 border border-gray-100"
          :class="{ 
            'translate-y-0 opacity-100': isVisible, 
            'translate-y-4 opacity-0': !isVisible,
            'opacity-60': insight.completed
          }"
          :style="{ transitionDelay: `${300 + index * 50}ms` }"
        >
          <div class="flex items-start gap-4">
            <!-- Illustration -->
            <div class="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center text-4xl transform transition-transform duration-300 hover:scale-110">
              {{ insight.illustration }}
            </div>

            <!-- Content -->
            <div class="flex-1">
              <div class="flex items-start justify-between mb-2">
                <h3 class="text-lg font-bold text-gray-800 leading-tight">{{ insight.title }}</h3>
                <span class="text-2xl ml-2">{{ insight.icon }}</span>
              </div>
              
              <p class="text-sm text-gray-600 mb-4 leading-relaxed">{{ insight.description }}</p>

              <div class="flex items-center justify-between">
                <a 
                  :href="insight.actionLink"
                  class="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors duration-200"
                >
                  {{ insight.actionLabel }}
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                <button
                  @click="toggleInsightComplete(insight.id)"
                  class="flex items-center gap-2 text-sm transition-all duration-200 hover:scale-105"
                  :class="insight.completed ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path 
                      v-if="insight.completed"
                      fill-rule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clip-rule="evenodd" 
                    />
                    <circle v-else cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" />
                  </svg>
                  <span class="font-medium">{{ insight.completed ? 'Done' : 'Mark done' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Module & Sheet Summary -->
      <div 
        class="bg-white rounded-2xl p-8 shadow-lg mb-6 transition-all duration-700 delay-500 border border-indigo-100"
        :class="{ 'translate-y-0 opacity-100': isVisible, 'translate-y-4 opacity-0': !isVisible }"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <span class="text-3xl">📊</span>
            Module & Sheet Summary
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="module in modules"
            :key="module.id"
            class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
          >
            <h3 class="font-bold text-gray-800 mb-3">{{ module.name }}</h3>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600">Progress</span>
              <span class="text-sm font-bold text-gray-800">{{ module.progress }} / {{ module.total }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                class="h-full rounded-full transition-all duration-1000 ease-out"
                :class="getProgressColor(module.progress, module.total)"
                :style="{ width: `${module.total > 0 ? (module.progress / module.total) * 100 : 0}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- People Summary -->
      <div 
        class="bg-white rounded-2xl p-8 shadow-lg mb-6 transition-all duration-700 delay-600 border border-purple-100"
        :class="{ 'translate-y-0 opacity-100': isVisible, 'translate-y-4 opacity-0': !isVisible }"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <span class="text-3xl">👥</span>
            People Summary
          </h2>
          <p class="text-sm text-gray-600">Monitor the capacity of your team ({{ teamSize }} members)</p>
        </div>

        <div class="space-y-4">
          <div
            v-for="(member, index) in teamMembers"
            :key="member.id"
            class="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-transparent hover:shadow-md transition-all duration-300 transform hover:translate-x-2"
            :style="{ transitionDelay: `${index * 50}ms` }"
          >
            <div 
              class="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
              :class="member.color"
            >
              {{ member.avatar }}
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-gray-800">{{ member.name }}</h3>
              <p class="text-sm text-gray-600">{{ member.role }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-sm font-medium text-gray-600">Work distribution</span>
              <div class="bg-purple-100 px-4 py-2 rounded-lg">
                <span class="text-purple-700 font-bold">{{ member.workload }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Lanes Summary -->
      <div 
        class="bg-white rounded-2xl p-8 shadow-lg mb-6 transition-all duration-700 delay-700 border border-pink-100"
        :class="{ 'translate-y-0 opacity-100': isVisible, 'translate-y-4 opacity-0': !isVisible }"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <span class="text-3xl">🎯</span>
            Lanes Summary
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div
            v-for="(lane, index) in lanes"
            :key="lane.id"
            class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-3 h-3 rounded-full" :class="lane.color"></div>
              <h3 class="font-bold text-gray-800">{{ lane.name }}</h3>
            </div>
            <p class="text-3xl font-bold text-gray-700">{{ lane.taskCount }}</p>
            <p class="text-sm text-gray-500 mt-1">tasks</p>
          </div>
        </div>
      </div>

      <!-- Task Summary -->
      <div 
        class="bg-white rounded-2xl p-8 shadow-lg mb-6 transition-all duration-700 delay-800 border border-teal-100"
        :class="{ 'translate-y-0 opacity-100': isVisible, 'translate-y-4 opacity-0': !isVisible }"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <span class="text-3xl">✅</span>
            Task Summary
          </h2>
          <button class="text-sm font-medium text-indigo-600 hover:text-indigo-700">View all tasks →</button>
        </div>

        <div class="space-y-3">
          <div
            v-for="(task, index) in recentTasks"
            :key="task.id"
            class="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-transparent hover:shadow-md transition-all duration-300"
            :style="{ transitionDelay: `${index * 50}ms` }"
          >
            <div class="flex-1">
              <h3 class="font-bold text-gray-800">{{ task.title }}</h3>
              <div class="flex items-center gap-3 mt-1">
                <span class="text-sm text-gray-600">{{ task.assignee }}</span>
                <span class="text-gray-300">•</span>
                <span class="text-sm text-gray-600">Due: {{ task.dueDate }}</span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span 
                class="px-3 py-1 rounded-full text-xs font-medium border"
                :class="getPriorityColor(task.priority)"
              >
                {{ task.priority }}
              </span>
              <span class="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {{ task.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Plans Summary -->
      <div 
        class="bg-white rounded-2xl p-8 shadow-lg mb-6 transition-all duration-700 delay-900 border border-orange-100"
        :class="{ 'translate-y-0 opacity-100': isVisible, 'translate-y-4 opacity-0': !isVisible }"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <span class="text-3xl">📅</span>
            Plans Summary
          </h2>
        </div>

        <div class="space-y-4">
          <div
            v-for="(plan, index) in plans"
            :key="plan.id"
            class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-md transition-all duration-300"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <div class="flex items-start justify-between mb-3">
              <div>
                <h3 class="font-bold text-gray-800">{{ plan.name }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ plan.startDate }} → {{ plan.endDate }}</p>
              </div>
              <span class="text-sm font-bold text-gray-700">{{ plan.progress }}%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                class="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-1000 ease-out"
                :style="{ width: `${plan.progress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Process Summary -->
      <div 
        class="bg-white rounded-2xl p-8 shadow-lg transition-all duration-700 delay-1000 border border-green-100"
        :class="{ 'translate-y-0 opacity-100': isVisible, 'translate-y-4 opacity-0': !isVisible }"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <span class="text-3xl">⚙️</span>
            Process Summary
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            v-for="(process, index) in processes"
            :key="process.id"
            class="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
            :style="{ transitionDelay: `${index * 100}ms` }"
          >
            <h3 class="font-bold text-gray-800 mb-2">{{ process.name }}</h3>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-2 h-2 rounded-full bg-gray-400"></div>
              <span class="text-sm text-gray-600">{{ process.stage }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600">Efficiency</span>
              <span class="text-lg font-bold text-gray-700">{{ process.efficiency }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer 
      class="bg-white/80 backdrop-blur-lg border-t border-indigo-100 mt-12 transition-all duration-700 delay-1100"
      :class="{ 'translate-y-0 opacity-100': isVisible, 'translate-y-4 opacity-0': !isVisible }"
    >
      <div class="max-w-7xl mx-auto px-6 py-8 text-center">
        <p class="text-gray-600">
          Keep up the momentum! 🚀 Your project journey has just begun.
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Custom animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInUp {
  animation: fadeInUp 0.6s ease-out forwards;
}
</style>