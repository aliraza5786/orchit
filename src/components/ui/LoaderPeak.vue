<template>
  <div class="loader-wrap">
    <!-- Orbital ring animation -->
    <div class="logo-ring-wrap">
      <div class="pulse-ring" v-for="n in 3" :key="n" />
      <div class="ring-outer" />
      <div class="ring-inner" />
      <div class="orbit-dot orbit-dot-1" />
      <div class="orbit-dot orbit-dot-2" />
      <div class="orbit-dot orbit-dot-3" />
      <div class="center-dot" />
    </div>

    <p class="workspace-label">Loading workspace</p>
    <p class="workspace-sub">Preparing your environment</p>

    <!-- Progress bar -->
    <div class="progress-wrap">
      <div class="progress-track">
        <div class="progress-fill" />
      </div>
    </div>

    <!-- Module tags -->
    <div class="modules-grid">
      <div
        v-for="(mod, i) in visibleModules"
        :key="mod.name"
        class="mod-tag"
        :class="mod.done ? 'done' : 'loading'"
        :style="{ borderColor: mod.color + (mod.done ? '55' : '44') }"
      >
        <span
          class="dot"
          :style="{ background: mod.color, animationDelay: mod.done ? '0ms' : `${i * 0.15}s` }"
        />
        {{ mod.name }}
      </div>
    </div>

    <p class="step-label">
      <span>{{ currentStep }}</span>
      <span class="step-dots">
        <span /><span /><span />
      </span>
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const MODULES = [
  { name: 'Tasks',     color: '#7F77DD' },
  { name: 'Sprints',   color: '#1D9E75' },
  { name: 'Plans',     color: '#BA7517' },
  { name: 'Peak',      color: '#D4537E' },
  { name: 'Pin',       color: '#185FA5' },
  { name: 'AI agents', color: '#3B6D11' },
]

const STEPS = [
  [0,    'Authenticating session'],
  [600,  'Loading workspace data'],
  [1200, 'Syncing tasks & sprints'],
  [1900, 'Warming up AI agents'],
  [2700, 'Almost there'],
]

const visibleModules = ref([])
const currentStep = ref('Initializing')
const timers = []

onMounted(() => {
  // Reveal modules one by one
  MODULES.forEach((mod, i) => {
    const t1 = setTimeout(() => {
      visibleModules.value.push({ ...mod, done: false })
    }, i * 180)

    const t2 = setTimeout(() => {
      const m = visibleModules.value.find(m => m.name === mod.name)
      if (m) m.done = true
    }, i * 180 + 800 + i * 320)

    timers.push(t1, t2)
  })

  // Cycle step labels
  STEPS.forEach(([delay, label]) => {
    const t = setTimeout(() => { currentStep.value = label }, delay)
    timers.push(t)
  })
})

onUnmounted(() => timers.forEach(clearTimeout))
</script>

<style scoped>
/* ── Keyframes ── */
@keyframes pulse-ring {
  0%   { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(1.6); opacity: 0; }
}
@keyframes spin-cw  { to { transform: rotate(360deg);  } }
@keyframes spin-ccw { to { transform: rotate(-360deg); } }
@keyframes orbit {
  from { transform: rotate(0deg)   translateX(28px) rotate(0deg);    }
  to   { transform: rotate(360deg) translateX(28px) rotate(-360deg); }
}
@keyframes orbit2 {
  from { transform: rotate(120deg) translateX(28px) rotate(-120deg); }
  to   { transform: rotate(480deg) translateX(28px) rotate(-480deg); }
}
@keyframes orbit3 {
  from { transform: rotate(240deg) translateX(28px) rotate(-240deg); }
  to   { transform: rotate(600deg) translateX(28px) rotate(-600deg); }
}
@keyframes bar-fill {
  0%   { width: 0%;  }
  60%  { width: 72%; }
  85%  { width: 88%; }
  100% { width: 92%; }
}
@keyframes shimmer-bar {
  0%   { left: -60%;  }
  100% { left: 120%;  }
}
@keyframes dot-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
  40%           { transform: scale(1);   opacity: 1;   }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0);   }
}
@keyframes tag-appear {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1);    }
}

/* ── Layout ── */
.loader-wrap {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  background: var(--your-workspace-bg, transparent); /* or inherit from parent */
}

/* ── Orbital spinner ── */
.logo-ring-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.75rem;
}
.pulse-ring {
  position: absolute;
  width: 48px; height: 48px;
  border-radius: 50%;
  border: 1.5px solid #7F77DD44;
  animation: pulse-ring 1.8s ease-out infinite;
}
.pulse-ring:nth-child(2) { animation-delay: 0.6s; }
.pulse-ring:nth-child(3) { animation-delay: 1.2s; }

.ring-outer {
  position: absolute;
  width: 66px; height: 66px;
  border-radius: 50%;
  border: 1.5px solid #AFA9EC55;
  border-top-color: #7F77DD;
  animation: spin-cw 2.4s linear infinite;
}
.ring-inner {
  position: absolute;
  width: 52px; height: 52px;
  border-radius: 50%;
  border: 1.5px solid #9FE1CB44;
  border-bottom-color: #1D9E75;
  animation: spin-ccw 1.6s linear infinite;
}
.center-dot {
  width: 16px; height: 16px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7F77DD, #1D9E75);
  position: relative; z-index: 2;
}
.orbit-dot {
  position: absolute;
  top: 50%; left: 50%;
  margin: -3px;
  width: 6px; height: 6px;
  border-radius: 50%;
}
.orbit-dot-1 { background: #7F77DD; animation: orbit  2.4s linear infinite; }
.orbit-dot-2 { background: #1D9E75; animation: orbit2 2.4s linear infinite; }
.orbit-dot-3 { background: #D4537E; animation: orbit3 2.4s linear infinite; }

/* ── Labels ── */
.workspace-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary, #111);
  margin: 0 0 4px;
  animation: fadeSlideUp 0.5s ease both;
}
.workspace-sub {
  font-size: 12px;
  color: var(--text-secondary, #888);
  margin: 0 0 1.75rem;
  animation: fadeSlideUp 0.5s 0.1s ease both;
}

/* ── Progress bar ── */
.progress-wrap {
  width: 240px;
  margin-bottom: 1.5rem;
  animation: fadeSlideUp 0.5s 0.15s ease both;
}
.progress-track {
  height: 3px;
  background: rgba(0,0,0,0.08);
  border-radius: 999px;
  overflow: hidden;
  position: relative;
}
.progress-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #7F77DD, #1D9E75);
  animation: bar-fill 3.5s cubic-bezier(0.4,0,0.2,1) both;
  position: relative; overflow: hidden;
}
.progress-fill::after {
  content: '';
  position: absolute;
  inset-block: 0;
  width: 60%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
  animation: shimmer-bar 1.4s ease-in-out infinite;
}

/* ── Module tags ── */
.modules-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  max-width: 340px;
  animation: fadeSlideUp 0.5s 0.2s ease both;
}
.mod-tag {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 0.5px solid transparent;
  background: rgba(0,0,0,0.04);
  font-size: 11px;
  color: var(--text-secondary, #888);
  animation: tag-appear 0.4s ease both;
  transition: color 0.3s, border-color 0.3s;
  white-space: nowrap;
}
.mod-tag.done {
  color: var(--text-primary, #111);
}
.dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.mod-tag.loading .dot {
  animation: dot-bounce 1.2s ease-in-out infinite;
}

/* ── Step label ── */
.step-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-tertiary, #aaa);
  margin-top: 1.25rem;
  min-height: 16px;
  animation: fadeSlideUp 0.5s 0.3s ease both;
}
.step-dots {
  display: inline-flex;
  gap: 3px;
}
.step-dots span {
  display: inline-block;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: currentColor;
  animation: dot-bounce 1.2s ease-in-out infinite;
}
.step-dots span:nth-child(2) { animation-delay: 0.2s; }
.step-dots span:nth-child(3) { animation-delay: 0.4s; }
</style>