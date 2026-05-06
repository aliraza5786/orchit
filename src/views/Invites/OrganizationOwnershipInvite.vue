<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useAcceptTransfer, useRejectTransfer } from '../../queries/useCommon'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()

const token = route.params.token as string

// ── State ──────────────────────────────────────────────────────────────────────
const isLoading    = ref(true)
const isProcessing = ref(false)
const isSuccess    = ref(false)
const isRejected   = ref(false)
const error        = ref<string | null>(null)
const errorDetail  = ref<string | null>(null)

// ── Mutations ──────────────────────────────────────────────────────────────────
const { mutateAsync: acceptTransfer, isPending: isAccepting } = useAcceptTransfer()
const { mutateAsync: rejectTransfer, isPending: isRejecting  } = useRejectTransfer()

onMounted(() => {
  if (!token) {
    error.value       = 'Invalid invite link.'
    errorDetail.value = 'No token was found in the URL.'
    isLoading.value   = false
    return
  }

  // Persist token so it survives a login redirect
  localStorage.setItem('pending_ownership_token', token)

  if (authStore.user) {
    // Already logged in — show the accept/reject prompt immediately
    isLoading.value = false
  } else {
    // Not logged in — show login/register prompt
    isLoading.value = false
  }
})

// ── Accept ─────────────────────────────────────────────────────────────────────
async function handleAccept() {
  isProcessing.value = true
  try {
    await acceptTransfer(token)
    isSuccess.value = true
    localStorage.removeItem('pending_ownership_token')
    await authStore.bootstrap()
  } catch (err: unknown) {
    handleError(err)
  } finally {
    isProcessing.value = false
  }
}

// ── Reject ─────────────────────────────────────────────────────────────────────
async function handleReject() {
  isProcessing.value = true
  try {
    await rejectTransfer(token)
    isRejected.value = true
    localStorage.removeItem('pending_ownership_token')
  } catch (err: unknown) {
    handleError(err)
  } finally {
    isProcessing.value = false
  }
}

// ── Error handler ──────────────────────────────────────────────────────────────
function handleError(err: unknown) {
  const status = (err as { response?: { status?: number } })?.response?.status
  const msg    = (err as { response?: { data?: { message?: string } } })?.response?.data?.message

  if (status === 410) {
    error.value       = 'Invite expired'
    errorDetail.value = 'This ownership transfer invitation has expired. Ask the workspace owner to send a new one.'
  } else if (status === 403) {
    error.value       = 'Not authorized'
    errorDetail.value = 'This transfer invitation was not sent to your account.'
  } else if (status === 404) {
    error.value       = 'Invite not found'
    errorDetail.value = 'This transfer has already been resolved or does not exist.'
  } else {
    error.value       = 'Something went wrong'
    errorDetail.value = msg ?? 'Please try again or contact your workspace admin.'
  }
}

// ── Auth redirects ─────────────────────────────────────────────────────────────
function goToLogin() {
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

function goToRegister() {
  router.push({ path: '/register', query: { redirect: route.fullPath } })
}

function goToDashboard() {
  router.push('/dashboard')
}
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center px-4 py-10"
    style="background: var(--bg-surface, #f5f5f5);"
  >
    <div
      class="w-full max-w-md rounded-2xl border p-8 md:p-10 text-center space-y-5"
      style="background: var(--bg-card); border-color: var(--border);"
    >

      <!-- Logo -->
      <div
        class="w-13 h-13 rounded-[14px] border flex items-center justify-center mx-auto"
        style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.2);"
      >
        <img src="/src/assets/global/favicon.png" alt="logo" class="w-7 h-7" />
      </div>

      <!-- ── LOADING ── -->
      <template v-if="isLoading">
        <div
          class="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin mx-auto"
          style="border-color: var(--border); border-top-color: var(--accent);"
        />
        <h1 class="text-xl font-medium" style="color: var(--text-primary);">
          Verifying your invite…
        </h1>
        <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
          Please wait while we verify your link.
        </p>
      </template>

      <!-- ── PROCESSING ── -->
      <template v-else-if="isProcessing">
        <div
          class="w-9 h-9 rounded-full border-[3px] border-t-transparent animate-spin mx-auto"
          style="border-color: var(--border); border-top-color: var(--accent);"
        />
        <h1 class="text-xl font-medium" style="color: var(--text-primary);">
          {{ isAccepting ? 'Transferring ownership…' : 'Declining transfer…' }}
        </h1>
        <p class="text-sm" style="color: var(--text-secondary);">
          This only takes a moment.
        </p>
      </template>

      <!-- ── SUCCESS (accepted) ── -->
      <template v-else-if="isSuccess">
        <div
          class="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style="background: rgba(29,158,117,0.12); border: 1px solid rgba(29,158,117,0.25);"
        >
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
            <polyline points="20 6 9 17 4 12" stroke="#1d9e75" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>

        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
          style="background: rgba(29,158,117,0.1); color: #1d9e75; border: 1px solid rgba(29,158,117,0.2);"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-[#1d9e75]" />
          You are now the Owner
        </div>

        <h1 class="text-[22px] font-medium" style="color: var(--text-primary);">
          Ownership accepted!
        </h1>
        <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
          You are now the workspace owner. You have full control over billing, members, and workspace settings.
        </p>

        <!-- What you can do now -->
        <div class="space-y-2.5 text-left">
          <div
            v-for="perk in [
              'Transfer or delete the workspace',
              'Manage billing & subscription',
              'Remove or invite any member',
              'Control all workspace settings',
            ]"
            :key="perk"
            class="flex items-center gap-2.5 text-sm"
            style="color: var(--text-primary);"
          >
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style="background: rgba(29,158,117,0.12);"
            >
              <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            {{ perk }}
          </div>
        </div>

        <button
          @click="goToDashboard"
          class="w-full py-3 rounded-[10px] text-sm font-medium transition-all"
          style="background: var(--accent); color: var(--accent-text);"
        >
          Go to dashboard
        </button>
      </template>

      <!-- ── SUCCESS (rejected) ── -->
      <template v-else-if="isRejected">
        <div
          class="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style="background: rgba(125,104,200,0.1); border: 1px solid rgba(125,104,200,0.2);"
        >
          <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" stroke="#7d68c8" stroke-width="2" stroke-linecap="round"/>
            <line x1="6" y1="6" x2="18" y2="18" stroke="#7d68c8" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>

        <h1 class="text-[22px] font-medium" style="color: var(--text-primary);">
          Transfer declined
        </h1>
        <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
          You have declined the ownership transfer. No changes were made to the workspace. The current owner has been notified.
        </p>

        <button
          @click="goToDashboard"
          class="w-full py-3 rounded-[10px] text-sm font-medium transition-all"
          style="background: var(--accent); color: var(--accent-text);"
        >
          Go to dashboard
        </button>
      </template>

      <!-- ── NOT LOGGED IN — show login/register prompt ── -->
      <template v-else-if="!authStore.user && !error">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
          style="background: var(--bg-lavender); color: var(--accent); border: 1px solid rgba(125,104,200,0.2);"
        >
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--accent);" />
          Ownership transfer invite
        </div>

        <h1 class="text-[22px] font-medium" style="color: var(--text-primary);">
          You've been invited as Owner
        </h1>
        <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
          Log in to your account to review and accept or decline the workspace ownership transfer.
        </p>

        <!-- What ownership means -->
        <div class="space-y-2.5 text-left">
          <div
            v-for="perk in [
              'Full control over billing & subscription',
              'Manage all members and their roles',
              'Transfer or delete the workspace',
            ]"
            :key="perk"
            class="flex items-center gap-2.5 text-sm"
            style="color: var(--text-primary);"
          >
            <div
              class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style="background: rgba(29,158,117,0.12);"
            >
              <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            {{ perk }}
          </div>
        </div>

        <button
          @click="goToLogin"
          class="w-full py-3 rounded-[10px] text-sm font-medium transition-all"
          style="background: var(--accent); color: var(--accent-text);"
        >
          Log in to continue
        </button>

        <div class="flex items-center gap-3">
          <div class="flex-1 h-px" style="background: var(--border);" />
          <span class="text-xs" style="color: var(--text-secondary);">or</span>
          <div class="flex-1 h-px" style="background: var(--border);" />
        </div>

        <button
          @click="goToRegister"
          class="w-full py-3 rounded-[10px] text-sm font-medium border transition-all"
          style="border-color: var(--border); color: var(--text-secondary);"
        >
          Create an account
        </button>
      </template>

      <!-- ── LOGGED IN — show accept / reject prompt ── -->
      <template v-else-if="authStore.user && !error && !isSuccess && !isRejected">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
          style="background: var(--bg-lavender); color: var(--accent); border: 1px solid rgba(125,104,200,0.2);"
        >
          <span class="w-1.5 h-1.5 rounded-full" style="background: var(--accent);" />
          Ownership transfer
        </div>

        <h1 class="text-[22px] font-medium" style="color: var(--text-primary);">
          Accept Organization ownership?
        </h1>
        <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
          You have been invited to become the new owner of this organization. This action is immediate upon acceptance.
        </p>

        <!-- What changes -->
        <div
          class="rounded-xl border text-left divide-y"
          style="border-color: var(--border); divide-color: var(--border);"
        >
          <div class="px-4 py-2.5">
            <p class="text-[10px] font-semibold uppercase tracking-widest mb-2" style="color: var(--text-secondary);">
              What you'll gain
            </p>
            <div class="space-y-1.5">
              <div
                v-for="item in [
                  'Full ownership of the organization',
                  'Billing & subscription control',
                  'Ability to remove any member',
                  'Transfer or delete the workspace',
                ]"
                :key="item"
                class="flex items-center gap-2 text-xs"
                style="color: var(--text-primary);"
              >
                <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ item }}
              </div>
            </div>
          </div>

          <div class="px-4 py-2.5">
            <p class="text-[10px] font-semibold uppercase tracking-widest mb-2" style="color: var(--text-secondary);">
              Important to know
            </p>
            <div class="space-y-1.5">
              <div
                v-for="item in [
                  'This cannot be undone without their consent',
                  'They may remove you after transfer',
                ]"
                :key="item"
                class="flex items-center gap-2 text-xs"
                style="color: var(--text-secondary);"
              >
                <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none">
                  <line x1="12" y1="9" x2="12" y2="13" stroke="#e55050" stroke-width="1.8" stroke-linecap="round"/>
                  <line x1="12" y1="17" x2="12.01" y2="17" stroke="#e55050" stroke-width="1.8" stroke-linecap="round"/>
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#e55050" stroke-width="1.6"/>
                </svg>
                {{ item }}
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-3 pt-1">
          <button
            @click="handleReject"
            :disabled="isProcessing"
            class="flex-1 py-3 rounded-[10px] text-sm font-medium border transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style="border-color: var(--border); color: var(--text-secondary);"
          >
            <span v-if="isRejecting" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Declining…
            </span>
            <span v-else>Decline</span>
          </button>

          <button
            @click="handleAccept"
            :disabled="isProcessing"
            class="flex-1 py-3 rounded-[10px] text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style="background: var(--accent); color: var(--accent-text);"
          >
            <span v-if="isAccepting" class="flex items-center justify-center gap-2">
              <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Accepting…
            </span>
            <span v-else>Accept ownership</span>
          </button>
        </div>

        <p class="text-xs" style="color: var(--text-tertiary, #9ca3af);">
          By accepting, you agree to take full responsibility for this workspace.
        </p>
      </template>

      <!-- ── ERROR ── -->
      <template v-else-if="error">
        <div
          class="w-13 h-13 rounded-full flex items-center justify-center mx-auto"
          style="background: rgba(229,80,80,0.1); border: 1px solid rgba(229,80,80,0.2);"
        >
          <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01" stroke="#e55050" stroke-width="1.8" stroke-linecap="round"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="#e55050" stroke-width="1.6"/>
          </svg>
        </div>

        <h1 class="text-xl font-medium" style="color: var(--text-primary);">{{ error }}</h1>

        <div
          v-if="errorDetail"
          class="rounded-xl border px-4 py-3 text-left"
          style="background: var(--bg-surface); border-color: var(--border);"
        >
          <div class="text-xs mb-1" style="color: var(--text-secondary);">Details</div>
          <div class="text-sm" style="color: var(--text-primary);">{{ errorDetail }}</div>
        </div>

        <button
          @click="goToDashboard"
          class="w-full py-3 rounded-[10px] text-sm font-medium transition-all"
          style="background: var(--accent); color: var(--accent-text);"
        >
          Go to dashboard
        </button>
      </template>

    </div>
  </div>
</template>