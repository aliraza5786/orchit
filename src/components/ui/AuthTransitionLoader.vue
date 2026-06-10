<!-- src/components/AuthTransitionLoader.vue -->
<template>
  <div class="auth-loader-overlay">
    <!-- Ambient background glow -->
    <div class="glow glow-top" />
    <div class="glow glow-bottom" />

    <!-- Card -->
    <div class="auth-loader-card">
      <!-- Animated lock icon -->
      <div class="icon-wrap">
        <svg
          width="28" height="28" viewBox="0 0 24 24"
          fill="none" stroke="currentColor"
          stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
          class="lock-icon"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path class="lock-shackle" d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <!-- Rotating ring -->
        <div class="spin-ring" />
      </div>

      <!-- Text -->
      <div class="auth-loader-text">{{ message }}</div>

      <!-- Progress bar -->
      <div class="progress-track">
        <div class="progress-fill" />
      </div>

      <!-- Dots -->
      <div class="dots">
        <span class="dot" style="animation-delay: 0s" />
        <span class="dot" style="animation-delay: 0.18s" />
        <span class="dot" style="animation-delay: 0.36s" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const message = ref('Securing session...')

const messages = [
  'Securing session...',
  'Loading workspace...',
  'Almost there...',
]

let i = 0
onMounted(() => {
  setInterval(() => {
    i = (i + 1) % messages.length
    message.value = messages[i]
  }, 900)
})
</script>

<style scoped>
.auth-loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 10, 15, 0.97);
  backdrop-filter: blur(12px);
}

/* Ambient glows */
.glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(80px);
  opacity: 0.25;
}
.glow-top {
  width: 500px; height: 500px;
  top: -120px; right: -80px;
  background: radial-gradient(circle, #7C6EF5, transparent 70%);
  animation: drift 6s ease-in-out infinite alternate;
}
.glow-bottom {
  width: 380px; height: 380px;
  bottom: -100px; left: -60px;
  background: radial-gradient(circle, #a78bfa, transparent 70%);
  animation: drift 8s ease-in-out infinite alternate-reverse;
}

@keyframes drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(20px, 20px) scale(1.08); }
}

/* Card */
.auth-loader-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 48px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 0.5px solid rgba(124, 110, 245, 0.2);
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255,255,255,0.04) inset;
}

/* Icon area */
.icon-wrap {
  position: relative;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lock-icon {
  color: #7C6EF5;
  position: relative;
  z-index: 2;
  animation: lock-pulse 1.8s ease-in-out infinite;
}

.lock-shackle {
  stroke-dasharray: 30;
  stroke-dashoffset: 30;
  animation: draw-shackle 1.2s ease forwards;
}

@keyframes draw-shackle {
  to { stroke-dashoffset: 0; }
}

@keyframes lock-pulse {
  0%, 100% { transform: scale(1);    opacity: 1; }
  50%       { transform: scale(1.1); opacity: 0.7; }
}

.spin-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid transparent;
  border-top-color: #7C6EF5;
  border-right-color: rgba(124, 110, 245, 0.3);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Text */
.auth-loader-text {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.55);
  letter-spacing: 0.3px;
  font-family: 'DM Sans', sans-serif;
  min-width: 160px;
  text-align: center;
  transition: opacity 0.3s ease;
}

/* Progress bar */
.progress-track {
  width: 160px;
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 99px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: 40%;
  border-radius: 99px;
  background: linear-gradient(90deg, #7C6EF5, #a78bfa);
  animation: progress-slide 1.4s ease-in-out infinite;
}

@keyframes progress-slide {
  0%   { transform: translateX(-100%); width: 40%; }
  50%  { width: 60%; }
  100% { transform: translateX(280%);  width: 40%; }
}

/* Dots */
.dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgba(124, 110, 245, 0.5);
  animation: dot-bounce 0.9s ease-in-out infinite;
}

@keyframes dot-bounce {
  0%, 100% { transform: translateY(0);    opacity: 0.4; }
  50%       { transform: translateY(-5px); opacity: 1; }
}
</style>