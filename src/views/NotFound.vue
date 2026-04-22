<template>
  <div class="not-found">
    <!-- Animated background grid -->
    <div class="bg-grid" aria-hidden="true">
      <div class="grid-lines"></div>
    </div>

    <!-- Floating orbs -->
    <div class="orb orb-1" aria-hidden="true"></div>
    <div class="orb orb-2" aria-hidden="true"></div>
    <div class="orb orb-3" aria-hidden="true"></div>

    <div class="content-wrapper">
      <!-- Left panel: the big 404 -->
      <div class="error-panel">
        <div class="error-number-wrap">
          <span class="digit digit-4 digit-left">4</span>
          <div class="zero-container">
            <span class="digit digit-0">0</span>
            <!-- Rotating ring inside the zero -->
            <svg class="ring" viewBox="0 0 120 120" aria-hidden="true">
              <circle cx="60" cy="60" r="50" class="ring-track" />
              <circle cx="60" cy="60" r="50" class="ring-progress" />
            </svg>
          </div>
          <span class="digit digit-4 digit-right">4</span>
        </div>

        <div class="error-badge">
          <span class="badge-dot"></span>
          <span>Page Not Found</span>
        </div>
      </div>

      <!-- Right panel: message & actions -->
      <div class="message-panel">
        <div class="icon-wrap">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="4" y="8" width="32" height="24" rx="4" stroke="var(--accent)" stroke-width="2"/>
            <path d="M4 14h32" stroke="var(--accent)" stroke-width="2"/>
            <circle cx="9" cy="11" r="1.5" fill="var(--accent)"/>
            <circle cx="14" cy="11" r="1.5" fill="var(--accent)" opacity="0.6"/>
            <circle cx="19" cy="11" r="1.5" fill="var(--accent)" opacity="0.3"/>
            <path d="M13 22l4 4 8-8" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="check-path"/>
          </svg>
        </div>

        <h1 class="heading">Looks like this task got lost in the backlog.</h1>
        <p class="subtext">
          The page you're looking for doesn't exist, was moved, or might have been deleted.
          Let's get you back on track.
        </p>

        <!-- Breadcrumb trail decoration -->
        <div class="trail" aria-hidden="true">
          <span class="trail-item trail-active">Dashboard</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="var(--text-secondary)" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span class="trail-item">Projects</span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="var(--text-secondary)" stroke-width="1.5" stroke-linecap="round"/></svg>
          <span class="trail-item trail-missing">???</span>
        </div>

        <!-- Action buttons -->
        <div class="actions">
          <button class="btn-primary" @click="goHome">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M2 6.5L8 2l6 4.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M6 14v-4h4v4" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            Go to Dashboard
          </button>
          <button class="btn-secondary" @click="goBack">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Go Back
          </button>
        </div>

        <!-- Quick links -->
        <div class="quick-links">
          <span class="quick-label">Quick links:</span>
          <a href="/dashboard" class="quick-link">Dashboard</a>
          <a href="/peak" class="quick-link">Peak</a>
        </div>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="bottom-bar" aria-hidden="true">
      <div class="bar-item" v-for="i in 6" :key="i" :style="{ animationDelay: `${i * 0.15}s` }"></div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  router.back()
}
</script>

<style scoped>
/* ─── Base ──────────────────────────────────────────────── */
.not-found {
  position: relative;
  min-height: 100vh;
  background: var(--bg-body, #f3f4f6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-family: 'Lato', sans-serif;
  color: var(--text-primary, #2b2c30);
}

/* ─── Background grid ────────────────────────────────────── */
.bg-grid {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.grid-lines {
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(var(--border, #d9d9d9) 1px, transparent 1px),
    linear-gradient(90deg, var(--border, #d9d9d9) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.45;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
}

/* ─── Floating orbs ─────────────────────────────────────── */
.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}
.orb-1 {
  width: 380px; height: 380px;
  background: rgba(125, 104, 200, 0.14);
  top: -80px; left: -100px;
  animation: drift 10s ease-in-out infinite alternate;
}
.orb-2 {
  width: 260px; height: 260px;
  background: rgba(147, 86, 197, 0.10);
  bottom: 40px; right: -60px;
  animation: drift 13s ease-in-out infinite alternate-reverse;
}
.orb-3 {
  width: 180px; height: 180px;
  background: rgba(125, 104, 200, 0.08);
  bottom: 120px; left: 30%;
  animation: drift 8s ease-in-out infinite alternate;
}

@keyframes drift {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, 20px) scale(1.08); }
}

/* ─── Layout ─────────────────────────────────────────────── */
.content-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 72px;
  padding: 48px 32px;
  max-width: 960px;
  width: 100%;
  animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─── Left: 404 number ───────────────────────────────────── */
.error-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}

.error-number-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

.digit {
  font-size: clamp(96px, 12vw, 140px);
  font-weight: 900;
  line-height: 1;
  letter-spacing: -4px;
  background: linear-gradient(145deg, var(--accent, #7D68C8) 0%, var(--orchit-white, #9356c5) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
}

.digit-left {
  animation: slideLeft 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
}
.digit-right {
  animation: slideRight 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both;
}
.digit-0 {
  position: relative;
  z-index: 1;
  animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.25s both;
}

@keyframes slideLeft  { from { opacity:0; transform: translateX(-30px); } to { opacity:1; transform: translateX(0); } }
@keyframes slideRight { from { opacity:0; transform: translateX(30px); }  to { opacity:1; transform: translateX(0); } }
@keyframes popIn      { from { opacity:0; transform: scale(0.6); }         to { opacity:1; transform: scale(1); } }

.zero-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Rotating SVG ring layered behind the zero */
.ring {
  position: absolute;
  width: clamp(96px, 12vw, 140px);
  height: clamp(96px, 12vw, 140px);
  animation: spinRing 3s linear infinite;
  z-index: 0;
}

@keyframes spinRing {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.ring-track {
  fill: none;
  stroke: var(--bg-surface, #dedfe3);
  stroke-width: 4;
}
.ring-progress {
  fill: none;
  stroke: var(--accent, #7D68C8);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 80 236;
  opacity: 0.5;
}

/* Badge */
.error-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: var(--bg-lavender, rgba(241, 238, 255, 1));
  border: 1px solid rgba(125, 104, 200, 0.25);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--accent, #7D68C8);
  letter-spacing: 0.3px;
  animation: fadeUp 0.5s ease 0.5s both;
}
.badge-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  background: var(--accent, #7D68C8);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(0.7); }
}

/* ─── Right: Message panel ───────────────────────────────── */
.message-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
  animation: fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
}

.icon-wrap {
  width: 60px; height: 60px;
  border-radius: 14px;
  background: var(--bg-lavender, rgba(241, 238, 255, 1));
  border: 1px solid rgba(125, 104, 200, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.check-path {
  stroke-dasharray: 20;
  stroke-dashoffset: 20;
  animation: drawCheck 0.6s ease 1s forwards;
}
@keyframes drawCheck {
  to { stroke-dashoffset: 0; }
}

.heading {
  font-size: clamp(20px, 2.5vw, 28px);
  font-weight: 700;
  color: var(--text-primary, #2b2c30);
  line-height: 1.3;
  margin: 0 0 12px;
}

.subtext {
  font-size: 15px;
  color: var(--text-secondary, #6b6b6e);
  line-height: 1.65;
  margin: 0 0 24px;
  max-width: 420px;
}

/* Breadcrumb trail */
.trail {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 28px;
  padding: 10px 14px;
  background: var(--bg-card, #ffffff);
  border: 1px solid var(--border, #d9d9d9);
  border-radius: 10px;
  width: fit-content;
}
.trail-item {
  font-size: 13px;
  color: var(--text-secondary, #6b6b6e);
  font-weight: 500;
}
.trail-active { color: var(--accent, #7D68C8); font-weight: 600; }
.trail-missing {
  color: var(--text-secondary, #6b6b6e);
  opacity: 0.45;
  font-style: italic;
  text-decoration: line-through;
}

/* Buttons */
.actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Lato', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: var(--accent, #7D68C8);
  color: var(--accent-text, #ffffff);
  box-shadow: 0 4px 14px rgba(125, 104, 200, 0.35);
}
.btn-primary:hover {
  background: var(--accent-hover, #6e3b96);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(125, 104, 200, 0.45);
}
.btn-primary:active { transform: translateY(0); }

.btn-secondary {
  background: var(--bg-card, #ffffff);
  color: var(--text-primary, #2b2c30);
  border: 1px solid var(--border, #d9d9d9);
}
.btn-secondary:hover {
  background: var(--bg-surface, #dedfe3);
  transform: translateY(-2px);
}
.btn-secondary:active { transform: translateY(0); }

/* Quick links */
.quick-links {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.quick-label {
  font-size: 13px;
  color: var(--text-secondary, #6b6b6e);
  font-weight: 500;
}
.quick-link {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent, #7D68C8);
  text-decoration: none;
  padding: 3px 10px;
  border-radius: 6px;
  background: var(--bg-lavender, rgba(241, 238, 255, 1));
  border: 1px solid rgba(125, 104, 200, 0.18);
  transition: all 0.18s ease;
}
.quick-link:hover {
  background: rgba(125, 104, 200, 0.15);
  border-color: rgba(125, 104, 200, 0.35);
}

/* ─── Bottom bar ─────────────────────────────────────────── */
.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0; right: 0;
  display: flex;
  gap: 0;
  height: 4px;
  z-index: 1;
}
.bar-item {
  flex: 1;
  background: linear-gradient(90deg, var(--accent, #7D68C8), var(--orchit-white, #9356c5));
  opacity: 0;
  animation: barReveal 0.4s ease forwards;
  transform-origin: left;
}
@keyframes barReveal {
  to { opacity: 0.6; }
}

/* ─── Responsive ─────────────────────────────────────────── */
@media (max-width: 760px) {
  .content-wrapper {
    flex-direction: column;
    gap: 36px;
    padding: 40px 20px;
    text-align: center;
    align-items: center;
  }
  .message-panel {
    align-items: center;
  }
  .subtext {
    max-width: 100%;
  }
  .trail {
    margin: 0 auto 28px;
  }
  .digit {
    font-size: 80px;
  }
}
</style>