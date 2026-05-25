<template>
  <div class="min-h-[100dvh] flex items-center justify-center  bg-bg-body px-4">
    <div class="w-full max-w-xl">
      <!-- Card -->
      <div class="rounded-2xl border border-border bg-bg-card  1F2430] shadow-sm overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-border  ">
          <h1 class="text-2xl font-semibold text-text-primary ">Workspace invitation</h1>
          <p class="text-sm text-text-secondary  text-secondary-300 mt-1">
            Accept the invite to join this workspace, or decline to ignore it.
          </p>
        </div>
        <!-- Loading -->
        <div v-if="isPending" class="p-6">
          <div class="animate-pulse space-y-4">
            <div class="h-5 w-56 bg-bg-surface"></div>
            <div class="h-4 w-40 bg-bg-surface"></div>
            <div class="h-24 w-full bg-bg-surface rounded-lg "></div>
            <div class="flex gap-2">
              <div class="h-10 w-28 bg-bg-surface"></div>
              <div class="h-10 w-28 bg-bg-surface"></div>
            </div>
          </div>
        </div>
        <!-- Error / Invalid -->
        <div v-else-if="error" class="p-6">
          <div
            class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 red-200">
            <div class="font-medium mb-1">We couldn’t open this invite.</div>
            <p class="text-sm leading-relaxed">{{ error || "Please log in to your account to accept this invitation." }}</p>
          </div>
          <div class="mt-4 flex gap-2">
            <button class="px-4 py-2 rounded-md border text-sm border-border " @click="() => handleRetry()">Try
              again</button>
            <Button  @click="goToLogin">Log In</Button>
          </div>
        </div>

        <!-- Accepted -->
        <div v-else-if="accepted" class="p-6">
          <div v-if="isEmailMatch">
            <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-800  emerald-200">
              <div class="font-medium mb-1">You’re in! 🎉</div>
              <p class="text-sm leading-relaxed">
                You’ve joined <strong>{{ data?.workspace_title }}</strong>.
              </p>
            </div>
            <div class="mt-4 flex gap-2">
              <Button @click="goToWorkspace">Open
                workspace</Button>
            </div>
          </div>
          <div v-else>
             <div class="rounded-lg bg-green-600/10 text-green-600   p-4 ">
               <div class="font-bold mb-1">Invite Accepted</div>
               <p class="text-sm leading-relaxed" v-if="isLoggedIn">
                 This invite has been accepted for <strong>{{ inviteEmail }}</strong>.<br>
                 You are currently logged in as <strong>{{ currentUserEmail }}</strong>.
               </p>
               <p class="text-sm leading-relaxed" v-else>
                 This invite has been accepted. Please log in to access the workspace.
               </p>
             </div>
             <div class="mt-4 flex gap-2">
                <Button v-if="!isLoggedIn" @click="goToLogin">Log In</Button>
                <Button v-else @click="logoutAndSwitch">Log Out & Switch Account</Button>
             </div>
          </div>
        </div>
        <!-- Declined -->
        <div v-else-if="declined" class="p-6">
          <div
            class="rounded-lg border border-border bg-transparent p-4 text-text-secondary -800 dark:border-border 1F2430] text-secondary-200">
            <div class="font-bold text-text-primary mb-1">Invite declined</div>
            <p class="text-sm leading-relaxed">We’ve let the workspace know you won’t be joining.</p>
          </div>
          <div class="mt-4 flex gap-2">
            <Button 
              @click="goHome">Go to home</Button>
          </div>
        </div>
        <!-- Invite details -->
        <div v-else class="p-6">
          <!-- Workspace + Inviter -->
          <div class="flex items-start gap-4">
          <div
             v-if="
               !data.workspace_logo ||
               data.workspace_logo === 'Unknown Workspace logo'
             "
             class="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
             :style="{
               backgroundColor:
                 data.workspace?.variables?.['workspace-color'] ||
                 'var(--primary-color)',
             }"
           >
             {{
               data?.workspace_title
                 ?.substring(0, 2)
                 .toUpperCase() || 'WS'
             }}
           </div>
            <img
              v-else
              :src="data.workspace_logo"
              alt=""
              class="h-12 w-12 rounded-xl object-contain"
            />
            <div>
              <h2 class="text-lg font-medium text-text-primary ">
                {{ data?.workspace_title }}
              </h2>
              <p class="text-sm text-text-secondary  text-secondary-300">
                Invited by <span class="font-medium">{{ data.invited_by || data.email }}</span>
                <span v-if="data.role_title"> for the {{ toTitle(data.role_title) }} Role</span>
                <br>
                <span class="font-medium text-xs">{{ data.email }}</span>
              </p>
              <p v-if="data?.is_expire" class="text-xs text-red-500 mt-1">This invite has expired.</p>
              <p v-else-if="data?.is_expire" class="text-xs text-text-secondary -500 text-secondary-400 mt-1">
                This Invitation Link has been Expire
              </p>
            </div>
          </div>

          <!-- Message (optional) -->
          <div v-if="invite?.message"
            class="mt-4 rounded-lg border p-3 text-sm text-text-secondary -700 text-secondary-200 dark:border-border 1F2430]">
            “{{ invite.message }}”
          </div>

          <!-- Actions -->
          <div class="mt-6 flex flex-wrap gap-2">
            <Button :disabled="data.is_expire || acting" @click="accept">
              {{ acting && actionType === 'accepted' ? 'Joining…' : 'Accept invitation' }}
            </Button>
            <Button type="button" variant="secondary" :disabled="acting || data.is_expire"
              @click="decline">
              <span v-if="acting && actionType === 'decline'">Declining…</span>
              <span v-else>Decline</span>
            </Button>
          </div>
          <p v-if="error" class="mt-2 text-xs text-red-500">{{ error }}</p>


          <!-- Already accepted / state note -->
          <p v-if="invite?.status === 'accepted' && !accepted" class="mt-3 text-xs text-emerald-600 emerald-400">
            You’ve already accepted this invite.
          </p>
        </div>
      </div>

      <!-- Footer help -->
      <p class="text-center text-xs text-text-secondary -500 text-secondary-400 mt-4">
        If this wasn’t you, you can safely ignore this page.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInvitedWorkspace } from '../../queries/useWorkspace'
import { useAuthStore } from '../../stores/auth'
import api from '../../libs/api'
import { useRouteIds } from '../../composables/useQueryParams'
import Button from '../../components/ui/Button.vue'

const router = useRouter()
const auth = useAuthStore()
const { token } = useRouteIds()


const { data, refetch, isPending } = useInvitedWorkspace(token.value);
function handleRetry() {
  error.value = null
  refetch()
}

type Invite = {
  id: string
  token: string
  status?: 'pending' | 'accepted' | 'declined' | 'expired'
  role?: string
  message?: string
  expires_at?: string
  workspace?: { id: string | number; name: string }
  inviter?: { name?: string; email?: string }
}

const error = ref<string | null>(null)
const acting = ref(false)
const actionType = ref<'accepted' | 'decline' | null>(null)
const invite = ref<Invite | null>(null)
const accepted = ref(false)
const declined = ref(false) 

function toTitle(s?: string) {
  if (!s) return ''
  return s.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const isLoggedIn = computed(() => auth.isAuthenticated)
const currentUserEmail = computed(() => auth.user?.data?.u_email)
const inviteEmail = computed(() => data.value?.email)
const isEmailMatch = computed(() => {
  if (!isLoggedIn.value || !inviteEmail.value) return false
  return currentUserEmail.value === inviteEmail.value
})

async function accept() {
  if (!data.value || data.value.status == 'expired') return
  
  if (!isLoggedIn.value) {
    goToLogin()
    return
  }

  acting.value = true
  actionType.value = 'accepted'
  error.value = null
  try {
    await api.post(`/common/invitation/accept/${encodeURIComponent(token.value)}`, { status: 'accepted' })
    accepted.value = true
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Could not accept the invitation.'
  } finally {
    acting.value = false
    actionType.value = null
  }
}

async function decline() {
  if (!data.value) return
  acting.value = true
  actionType.value = 'decline'
  error.value = null
  try {
    await api.post(`/common/invitation/accept/${encodeURIComponent(token.value)}`, { status: 'rejected' })
    declined.value = true
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Could not decline the invitation.'
  } finally {
    acting.value = false
    actionType.value = null
  }
}

function goHome() {
  router.push('/')
}

function goToLogin() {
  // Save intent so we can auto-accept after login
  auth.logout()
  localStorage.setItem('pending_invite_token', token.value)
  router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
}

function logoutAndSwitch() {
  auth.logout()
  router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
}

function goToWorkspace() {
  if (data.value?.workspace?._id) {
    if (!data.value?.job_id) {
      localStorage.removeItem('jobId')
      router.push(`/workspace/peak/${data.value?.workspace?._id}`)
    } else {
      router.push(`/workspace/peak/${data.value?.workspace?._id}/${data.value?.job_id}`)
    }
  } else {
    goHome()
  }
}

// Watch for auth + data being ready together
watch(
  [() => data.value, isLoggedIn],
  ([newData, loggedIn]) => {
    if (!newData) return

    // ADD THIS LINE
    invite.value = newData as any

    if (!loggedIn) return

    if (newData.status === 'rejected') { declined.value = true; return }
    if (newData.status === 'accepted') { accepted.value = true; return }

    const pendingToken = localStorage.getItem('pending_invite_token')
    if (pendingToken && pendingToken === token.value) {
      localStorage.removeItem('pending_invite_token')
      accept()
    }
  },
  { immediate: true }
)
</script>