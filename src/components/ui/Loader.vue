<template>
  <div class="loader-root">
   <canvas ref="bgCanvas" class="bg-canvas" />

    <div class="loader-content">
      <!-- Logo + spinning ring -->
      <div class="logo-ring" ref="logoRingRef">
        <svg class="ring-svg" viewBox="0 0 64 64">
          <circle class="ring-track" cx="32" cy="32" r="29" />
          <circle class="ring-fill" cx="32" cy="32" r="29" transform="rotate(-90 32 32)" />
        </svg>
        <img
          src="../../assets/global/favicon.png"
          alt="Logo"
          class="logo-img"
        />
      </div>

      <!-- Title -->
      <p class="workspace-name" ref="titleRef">Setting up your workspace</p>

      <!-- Animated step label -->
      <div class="step-label-wrap">
        <p class="step-label" ref="stepLabelRef">Initializing workspace...</p>
      </div>

      <!-- Progress bar -->
      <div class="progress-bar-track">
        <div class="progress-bar-fill" :style="{ width: progress + '%' }" />
      </div>

      <!-- Step chips grid -->
      <div class="steps-grid">
        <div
          v-for="(step, i) in steps"
          :key="i"
          class="step-chip"
          :class="{
            active: currentStep === i,
            done: currentStep > i,
          }"
        >
          <div class="step-dot" />
          <span class="step-text">{{ step.chip }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'

const logoRingRef = ref<HTMLElement | null>(null)
const titleRef = ref<HTMLElement | null>(null)
const stepLabelRef = ref<HTMLElement | null>(null)
const bgCanvas = ref<HTMLCanvasElement | null>(null)
let raf: number
const currentStep = ref(-1)
const progress = ref(0)

const steps = [
  { label: 'Creating your dashboard view...',     chip: 'Dashboard',   progress: 10  },
  { label: 'Building your team structure...',     chip: 'Team setup',  progress: 25  },
  { label: 'Configuring workflows & boards...',   chip: 'Workflows',   progress: 42  },
  { label: 'Laying out your product roadmap...',  chip: 'Roadmap',     progress: 60  },
  { label: 'Applying roles & permissions...',     chip: 'Permissions', progress: 78  },
  { label: 'Everything is ready to launch!',      chip: 'Launch ready',progress: 100 },
]

const stepDelays = [300, 1800, 3200, 4600, 5900, 7200]
const timers: ReturnType<typeof setTimeout>[] = []
onMounted(() => {
  const canvas = bgCanvas.value!
  const root = canvas.parentElement!
  const ctx = canvas.getContext('2d')!

  const COLORS = [[124,92,252],[167,139,250],[99,102,241],[192,132,252]]

  let W: number, H: number
  let particles: any[]

  function resize() {
    W = canvas.width  = root.offsetWidth
    H = canvas.height = root.offsetHeight
  }
  function makeParticle() {
    const c = COLORS[Math.floor(Math.random() * COLORS.length)]
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: 1.2 + Math.random() * 2.4,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.15 - Math.random() * 0.25,
      alpha: 0.08 + Math.random() * 0.18,
      color: c,
      drift: Math.random() * Math.PI * 2,
      driftSpeed: 0.003 + Math.random() * 0.005,
    }
  }
  function draw() {
    ctx.clearRect(0, 0, W, H)
    for (const p of particles) {
      p.drift += p.driftSpeed
      p.x += p.vx + Math.sin(p.drift) * 0.2
      p.y += p.vy
      if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W }
      if (p.x < -6) p.x = W + 6
      if (p.x > W + 6) p.x = -6
      const [r,g,b] = p.color
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3)
      grd.addColorStop(0, `rgba(${r},${g},${b},${p.alpha})`)
      grd.addColorStop(1, `rgba(${r},${g},${b},0)`)
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2)
      ctx.fillStyle = grd; ctx.fill()
    }
    // connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j]
        const d = Math.hypot(a.x - b.x, a.y - b.y)
        if (d < 80) {
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(124,92,252,${(1 - d/80) * 0.06})`
          ctx.lineWidth = 0.5; ctx.stroke()
        }
      }
    }
    raf = requestAnimationFrame(draw)
  }

  resize()
  particles = Array.from({ length: 55 }, makeParticle)
  draw()
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
})
function advanceStep(i: number) {
  currentStep.value = i
  progress.value = steps[i].progress

  if (!stepLabelRef.value) return

  gsap.to(stepLabelRef.value, {
    opacity: 0,
    y: -8,
    duration: 0.2,
    ease: 'power2.in',
    onComplete: () => {
      if (!stepLabelRef.value) return
      stepLabelRef.value.textContent = steps[i].label
      gsap.fromTo(
        stepLabelRef.value,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      )
    },
  })
}

onMounted(() => {
  // Entrance animations
  if (logoRingRef.value) {
    gsap.fromTo(
      logoRingRef.value,
      { opacity: 0, scale: 0.5 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)', delay: 0.1 }
    )
  }
  if (titleRef.value) {
    gsap.fromTo(
      titleRef.value,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.4 }
    )
  }
  if (stepLabelRef.value) {
    gsap.fromTo(
      stepLabelRef.value,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.6 }
    )
  }

  // Step progression
  stepDelays.forEach((delay, i) => {
    const t = setTimeout(() => advanceStep(i), delay)
    timers.push(t)
  })
})

onUnmounted(() => {
  timers.forEach(clearTimeout)
})
</script>

<style scoped>
.loader-root {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--bg-body);
  overflow: hidden;
}


@keyframes gridFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* Center column */
.loader-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 320px;
}

/* Logo + spinner ring */
.logo-ring {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 28px;
  opacity: 0; /* GSAP takes over */
}

.logo-img {
  width: 36px;
  height: 36px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 8px;
  object-fit: contain;
}

.ring-svg {
  width: 64px;
  height: 64px;
  position: absolute;
  inset: 0;
  animation: rotateSpin 2s linear infinite;
}

@keyframes rotateSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.ring-track {
  fill: none;
  stroke: var(--border-color, rgba(128,128,128,0.2));
  stroke-width: 2;
}

.ring-fill {
  fill: none;
  stroke: #7c5cfc;
  stroke-width: 2;
  stroke-linecap: round;
  animation: ringDash 2s ease-in-out infinite;
}

@keyframes ringDash {
  0%   { stroke-dasharray: 5 200;  stroke-dashoffset: 0; }
  50%  { stroke-dasharray: 80 200; stroke-dashoffset: -30; }
  100% { stroke-dasharray: 5 200;  stroke-dashoffset: -200; }
}

/* Title */
.workspace-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
  opacity: 0; /* GSAP takes over */
}

/* Step label ticker */
.step-label-wrap {
  height: 22px;
  overflow: hidden;
  margin-bottom: 24px;
}

.step-label {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
  line-height: 22px;
  opacity: 0; /* GSAP takes over */
}

/* Progress bar */
.progress-bar-track {
  width: 200px;
  height: 3px;
  background: var(--border-color, rgba(128,128,128,0.2));
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 28px;
}

.progress-bar-fill {
  height: 100%;
  background: #7c5cfc;
  border-radius: 99px;
  width: 0%;
  transition: width 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Step chips */
.steps-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
}

.step-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--bg-secondary, rgba(128,128,128,0.05));
  border: 0.5px solid var(--border-color, rgba(128,128,128,0.15));
  transition: background 0.4s ease, border-color 0.4s ease, opacity 0.4s ease;
  opacity: 0.45;
}

.step-chip.active {
  opacity: 1;
  border-color: rgba(124, 92, 252, 0.35);
  background: rgba(124, 92, 252, 0.07);
}

.step-chip.done {
  opacity: 1;
  border-color: rgba(29, 158, 117, 0.3);
  background: rgba(29, 158, 117, 0.05);
}

/* Step indicator dot */
.step-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--border-color, rgba(128,128,128,0.2));
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s ease;
  position: relative;
}

.step-chip.active .step-dot {
  background: rgba(124, 92, 252, 0.15);
  border: 1.5px solid #7c5cfc;
}

/* Pulsing dot for active state */
.step-chip.active .step-dot::after {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #7c5cfc;
  animation: dotPulse 1s ease infinite;
}
/* replace .loader-bg-grid styles with: */
.bg-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  animation: canvasFadeIn 1.5s ease 0.3s forwards;
}

@keyframes canvasFadeIn {
  to { opacity: 1; }
}
@keyframes dotPulse {
  0%, 100% { transform: scale(1);   opacity: 1; }
  50%       { transform: scale(1.4); opacity: 0.6; }
}

/* Checkmark for done state */
.step-chip.done .step-dot {
  background: rgba(29, 158, 117, 0.12);
  border: 1.5px solid #1d9e75;
}

.step-chip.done .step-dot::after {
  content: '';
  display: block;
  width: 8px;
  height: 5px;
  border-left: 1.5px solid #1d9e75;
  border-bottom: 1.5px solid #1d9e75;
  transform: rotate(-45deg) translateY(-1px);
}

.step-text {
  font-size: 12px;
  color: var(--text-secondary);
  transition: color 0.3s ease;
}

.step-chip.active .step-text,
.step-chip.done .step-text {
  color: var(--text-primary);
}
</style>