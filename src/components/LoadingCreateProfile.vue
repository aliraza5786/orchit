<template>
  <div class="flex items-center justify-center mx-auto">
    <div class="flex flex-col items-center px-8 py-8 max-w-[460px] w-full">

      <!-- Launch Stage -->
      <div class="relative w-full h-[190px] mb-4 overflow-hidden">

        <!-- Star Field -->
        <div class="absolute inset-0" ref="starField"></div>

        <!-- Rocket -->
        <div
          ref="rocketWrap"
          class="absolute left-1/2 top-6 flex flex-col items-center"
          :style="rocketStyle"
        >
          <svg width="64" height="100" viewBox="0 0 64 100" fill="none">
            <path d="M32 4 C20 4 12 22 12 42 L12 66 L32 74 L52 66 L52 42 C52 22 44 4 32 4Z" fill="#5F5E5A"/>
            <path d="M32 10 C23 10 17 24 17 42 L17 62 L32 68 L47 62 L47 42 C47 24 41 10 32 10Z" fill="#B4B2A9"/>
            <circle cx="32" cy="30" r="8" fill="#85B7EB" opacity=".9"/>
            <circle cx="32" cy="30" r="5" fill="#E6F1FB" opacity=".8"/>
            <path d="M12 50 L4 66 L12 62Z" fill="#888780"/>
            <path d="M52 50 L60 66 L52 62Z" fill="#888780"/>
            <path d="M22 66 L18 78 L32 74 L46 78 L42 66Z" fill="#5F5E5A"/>
            <rect x="28" y="42" width="8" height="3" rx="1" fill="#D3D1C7"/>
            <rect x="28" y="48" width="8" height="3" rx="1" fill="#D3D1C7"/>
          </svg>

          <!-- Flames -->
          <div class="flex gap-[3px] mt-[-4px]" style="transform-origin: top center;">
            <div class="flame flame-left"></div>
            <div class="flame flame-center"></div>
            <div class="flame flame-right"></div>
          </div>
        </div>

        <!-- Particles -->
        <div
          ref="particlePool"
          class="absolute bottom-2 w-[60px] h-0"
          style="left: 50%; transform: translateX(-50%);"
        ></div>

        <!-- Stars (rendered via JS) -->
      </div>

      <!-- Title -->
      <p class="text-[15px] font-medium text-text-primary mb-1 text-center">
        {{ titleText }}
      </p>
      <p class="text-[13px] text-text-secondary mb-5 text-center">
        {{ subtitleText }}
      </p>

      <!-- Progress Bar -->
      <div class="w-full bg-surface rounded-full h-[5px] mb-7 overflow-hidden">
        <div
          class="h-full bg-accent rounded-full transition-all duration-700 ease-in-out"
          :style="{ width: progressWidth }"
        ></div>
      </div>

      <!-- Steps -->
      <div class="w-full flex flex-col">
        <div
          v-for="(step, i) in provisionSteps"
          :key="step.label"
          class="flex flex-col"
        >
          <div
            class="flex items-center gap-3 py-[7px] step-slide-in"
            :style="{ animationDelay: `${i * 40}ms` }"
          >
            <!-- Icon -->
            <div class="flex-shrink-0 w-[18px] h-[18px] flex items-center justify-center relative">

              <!-- Done -->
              <template v-if="i < provisionStep">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="9" fill="#1D9E75"/>
                  <path
                    d="M5 9.2l2.8 2.8 5-5.5"
                    stroke="white"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    fill="none"
                    class="check-draw"
                  />
                </svg>
              </template>

              <!-- Active -->
              <template v-else-if="i === provisionStep">
                <span class="absolute inset-0 rounded-full bg-[#5DCAA5] pulse-ring"></span>
                <svg
                  width="18" height="18" viewBox="0 0 18 18" fill="none"
                  class="spin-anim"
                >
                  <circle cx="9" cy="9" r="7" stroke="#e5e7eb" stroke-width="2"/>
                  <path d="M9 2a7 7 0 0 1 7 7" stroke="#1D9E75" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </template>

              <!-- Waiting -->
              <template v-else>
                <span class="block w-[18px] h-[18px] rounded-full border border-border bg-surface"></span>
              </template>

            </div>

            <!-- Label -->
            <span
              class="text-[13px] transition-all duration-300"
              :class="{
                'text-text-primary font-medium': i === provisionStep,
                'text-text-secondary font-normal': i < provisionStep,
                'text-text-tertiary font-normal': i > provisionStep,
              }"
            >
              {{ step.label }}
            </span>
          </div>

          <!-- Connector -->
          <div
            v-if="i < provisionSteps.length - 1"
            class="w-[2px] h-[18px] ml-2 rounded-full transition-colors duration-500"
            :class="i < provisionStep ? 'bg-accent' : 'bg-border'"
          ></div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  active: { type: Boolean, required: true },
  loading: { type: Boolean, required: true },
  abort: { type: Boolean, default: false },
  profileType: { type: String, default: 'team' }
})

const emit = defineEmits(['complete'])

const titleText = computed(() => {
  if (props.profileType === 'personal') return 'Creating your profile'
  return 'Creating and setting up your organization'
})

const subtitleText = computed(() => {
  if (props.profileType === 'personal') return 'Please wait while we set up your account.'
  return 'Please wait while we configure your workspace.'
})

const provisionSteps = computed(() => {
  if (props.profileType === 'personal') {
    return [
      { label: 'Creating your profile' },
      { label: 'Validating your information' },
      { label: 'Setting up your preferences' },
      { label: 'Initializing your account' },
      { label: 'Securing your data' },
      { label: 'Finalizing setup' },
    ]
  }
  return [
    { label: 'Creating your organization' },
    { label: 'Provisioning workspace' },
    { label: 'Applying modules and preferences' },
    { label: 'Setting up permissions' },
    { label: 'Securing your data' },
    { label: 'Finalizing setup' },
  ]
})

const provisionStep = ref(0)
const isLaunching = ref(false)

const starField = ref(null)
const particlePool = ref(null)

let particleInterval = null

const SPARK_COLORS = ['#EF9F27', '#FAC775', '#BA7517', '#1D9E75', '#5DCAA5']

const progressWidth = computed(() =>
  Math.round((provisionStep.value / provisionSteps.value.length) * 100) + '%'
)

const rocketStyle = computed(() => {
  if (isLaunching.value) {
    return {
      transform: 'translateX(-50%) translateY(-240px)',
      opacity: '0',
      transition: 'transform 0.9s cubic-bezier(0.4,0,0.6,1), opacity 0.5s ease',
    }
  }
  return {
    transform: 'translateX(-50%)',
    animation: 'rocket-shake 0.14s ease-in-out infinite',
  }
})

function spawnParticles() {
  if (!particlePool.value) return

  for (let i = 0; i < 5; i++) {
    const p = document.createElement('div')
    p.classList.add('rocket-particle')

    const dx = (Math.random() * 44 - 22).toFixed(0) + 'px'

    p.style.cssText = `
      background: ${SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]};
      left: ${16 + Math.random() * 24}px;
      bottom: 0;
      --dx: ${dx};
      animation-delay: ${(Math.random() * 0.25).toFixed(2)}s;
    `

    particlePool.value.appendChild(p)
    setTimeout(() => p?.remove(), 1100)
  }
}

function buildStars() {
  if (!starField.value) return

  for (let i = 0; i < 14; i++) {
    const s = document.createElement('div')
    s.classList.add('rocket-star')
    s.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 85}%;
      animation-duration: ${(1.4 + Math.random() * 2).toFixed(1)}s;
      animation-delay: ${(Math.random() * 2).toFixed(1)}s;
    `
    starField.value.appendChild(s)
  }
}

/**
 * PROGRESS CONTROL (NO STATIC TIMERS)
 * - driven externally by props.loading
 */
function startLoading() {
  if (provisionStep.value === 0) buildStars()

  if (!particleInterval) {
    particleInterval = setInterval(spawnParticles, 320)
  }

  // simulate step progression ONLY while loading is true
  const interval = setInterval(() => {
    if (!props.loading) return

    if (provisionStep.value < provisionSteps.value.length) {
      provisionStep.value++
    }

    if (provisionStep.value >= provisionSteps.value.length) {
      clearInterval(interval)
      finishLaunch()
    }
  }, 900)
}

function resetLoader() {
  provisionStep.value = 0
  isLaunching.value = false
  clearInterval(particleInterval)
  particleInterval = null
}

function finishLaunch() {
  isLaunching.value = true

  setTimeout(() => spawnParticles(), 100)
  setTimeout(() => spawnParticles(), 300)
  setTimeout(() => spawnParticles(), 500)

  setTimeout(() => {
    emit('complete')
  }, 1200)
}

/**
 * WATCHERS (CORE CHANGE)
 */
watch(
  () => props.loading,
  (val) => {
    if (val) {
      startLoading()
    } else {
      resetLoader()
    }
  },
  { immediate: true }
)

/**
 * ABORT HANDLING
 */
watch(
  () => props.abort,
  (shouldAbort) => {
    if (shouldAbort) resetLoader()
  }
)

onMounted(() => {
  if (props.active && props.loading) startLoading()
})

onBeforeUnmount(() => {
  resetLoader()
})
</script>

<style scoped>
/* Flame animations */
@keyframes flame-flicker {
  0%,100% { transform: scaleY(1)    scaleX(1); }
  25%      { transform: scaleY(1.35) scaleX(0.8); }
  50%      { transform: scaleY(0.85) scaleX(1.15); }
  75%      { transform: scaleY(1.25) scaleX(0.88); }
}

@keyframes rocket-shake {
  0%,100% { transform: translateX(-50%) translateY(0)   rotate(0deg); }
  25%      { transform: translateX(calc(-50% - 2px)) translateY(-1px) rotate(-1deg); }
  75%      { transform: translateX(calc(-50% + 2px)) translateY(1px)  rotate(1deg); }
}

@keyframes particle-rise {
  0%   { transform: translateY(0)     translateX(0)         scale(1); opacity: .8; }
  100% { transform: translateY(-55px) translateX(var(--dx)) scale(0); opacity: 0; }
}

@keyframes smoke-drift {
  0%   { transform: translateY(0)    scale(0.4); opacity: .45; }
  100% { transform: translateY(38px) scale(2.2); opacity: 0; }
}

@keyframes star-twinkle {
  0%,100% { opacity: .15; transform: scale(1); }
  50%      { opacity: .9;  transform: scale(1.5); }
}

@keyframes spin-anim {
  to { transform: rotate(360deg); }
}

@keyframes check-draw {
  from { stroke-dashoffset: 20; }
  to   { stroke-dashoffset: 0; }
}

@keyframes step-slide-in {
  from { opacity: 0; transform: translateX(-10px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes pulse-ring {
  0%,100% { transform: scale(1);   opacity: .5; }
  50%      { transform: scale(1.7); opacity: 0; }
}

/* Flames */
.flame {
  transform-origin: top center;
  border-radius: 50% 50% 40% 40%;
}
.flame-left {
  width: 10px; height: 28px;
  background: #EF9F27;
  animation: flame-flicker 0.15s ease-in-out infinite;
}
.flame-center {
  width: 16px; height: 42px;
  background: #FAC775;
  animation: flame-flicker 0.12s ease-in-out infinite 0.03s;
}
.flame-right {
  width: 10px; height: 28px;
  background: #EF9F27;
  animation: flame-flicker 0.18s ease-in-out infinite 0.06s;
}

/* Particles & smoke (injected via JS) */
:deep(.rocket-particle) {
  position: absolute;
  width: 4px; height: 4px;
  border-radius: 50%;
  animation: particle-rise 0.85s ease-out forwards;
}
:deep(.rocket-smoke) {
  position: absolute;
  width: 13px; height: 13px;
  border-radius: 50%;
  background: rgba(180,178,169,0.5);
  animation: smoke-drift 1.1s ease-out forwards;
}
:deep(.rocket-star) {
  position: absolute;
  width: 3px; height: 3px;
  border-radius: 50%;
  background: #5DCAA5;
  animation: star-twinkle linear infinite;
}

/* Step animations */
.step-slide-in { animation: step-slide-in 0.35s ease both; }
.check-draw    { stroke-dasharray: 20; animation: check-draw 0.3s ease forwards; }
.spin-anim     { animation: spin-anim 0.85s linear infinite; }
.pulse-ring    { animation: pulse-ring 1.4s ease-out infinite; }
</style>