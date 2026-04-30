<template>
  <div class="max-w-2xl space-y-5">

    <!-- Empty state -->
    <div
      v-if="!hasOrg"
      class="flex flex-col items-center text-center py-14 border border-dashed border-border/60 rounded-2xl justify-center mx-auto"
    >
      <div class="w-14 h-14 mx-auto rounded-xl bg-bg-body border border-dashed border-border/60 flex items-center justify-center mb-4">
        <i class="fa-regular fa-buildings text-text-secondary text-xl"></i>
      </div>
      <h3 class="text-base font-semibold text-text-primary mb-2">No organization yet</h3>
      <p class="text-sm text-text-secondary mb-6 max-w-xs leading-relaxed">
        Create your company workspace to invite team members and manage projects together.
      </p>
      <button
        @click="router.push('/create-profile?mode=company')"
        class="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 active:scale-[0.98] transition-all shadow-sm shadow-accent/20"
      >
        Create organization
      </button>
    </div>

    <!-- Has org — settings form -->
    <div v-else class="space-y-5">
      <div class="p-5 rounded-2xl border border-border/40 bg-bg-body/50 space-y-4">
        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider">
            Organization name
          </label>
          <input
            v-model="orgName"
            class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary"
            placeholder="Acme Corp"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider">
            Domain
          </label>
          <div class="flex items-center border border-border/60 bg-bg-body/80 rounded-lg overflow-hidden focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10 transition-all">
            <input
              v-model="orgSlug"
              class="flex-1 px-4 py-2.5 text-sm bg-transparent outline-none placeholder:text-text-tertiary"
              placeholder="acme"
            />
            <span class="px-3 py-2.5 text-sm text-text-secondary bg-bg-body border-l border-border/40 shrink-0">
              .orchit.ai
            </span>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <button
          @click="saveOrg"
          :disabled="isSaving || !orgName.trim()"
          class="px-5 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-accent/20"
        >
          <span v-if="isSaving" class="flex items-center gap-2">
            <i class="fa-solid fa-spinner fa-spin text-xs"></i> Saving...
          </span>
          <span v-else>Save changes</span>
        </button>
        <button
          @click="showDeleteConfirm = true"
          class="px-5 py-2.5 text-sm font-medium rounded-lg border border-red-500/20 text-red-600 hover:bg-red-500/10 transition-all"
        >
          Delete organization
        </button>
      </div>
    </div>

    <!-- Always shown -->
    <div class="rounded-xl border border-border/40 bg-bg-body/50 px-5 py-4">
      <p class="text-sm font-medium text-text-primary mb-1">Already part of a company?</p>
      <p class="text-sm text-text-secondary leading-relaxed">
        Ask your admin to send you an invite link to join their workspace.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const hasOrg = ref(false) // replace with real API check
const router = useRouter()
const showDeleteConfirm = ref(false)
const isSaving = ref(false)
const orgName = ref('')
const orgSlug = ref('')

async function saveOrg() {
  if (!orgName.value.trim()) return
  isSaving.value = true
  try {
    // await yourOrgApi.update({ name: orgName.value, slug: orgSlug.value })
    await new Promise(r => setTimeout(r, 800)) // mock
  } finally {
    isSaving.value = false
  }
}
</script>