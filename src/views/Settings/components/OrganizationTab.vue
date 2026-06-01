<template>
  <div class="w-full space-y-5 flex-1">
    <div
  v-if="isPendingDeletion"
  class="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] text-text-secondary"
  style="border: 1px solid var(--danger-border); background: var(--danger-bg);"
>
  <div
    class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
    style="background: var(--danger-bg); border: 1px solid var(--danger-border);"
  >
    <i class="fa-solid fa-lock text-[12px]" style="color: var(--danger);"></i>
  </div>
  <span>
  This organization is scheduled for deletion and is now
  <strong class="font-semibold" style="color: var(--danger);">read-only.</strong>
  All settings have been locked.
</span>
</div>
    <!-- Pending deletion banner -->
<div v-if="currentCompany?.is_pending_deletion"
  class="rounded-xl overflow-hidden"
  style="border: 1.5px solid #ef4444; border-left: 4px solid #ef4444; box-shadow: 0 10px 40px -10px rgba(239,68,68,0.18);"
>
  <!-- Header -->
  <div style="background: rgba(239,68,68,0.07); border-bottom: 1px solid rgba(239,68,68,0.2); padding: 14px 18px;"
    class="flex items-center gap-3">
    <div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style="background:#ef4444">
      <i class="fa-solid fa-trash text-white text-[13px]"></i>
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-[14px] font-medium text-text-primary m-0">Deletion scheduled</p>
      <p class="text-[12px] text-text-secondary m-0 mt-0.5">This organization is pending permanent deletion.</p>
    </div>
    <span class="shrink-0 text-[11px] font-medium text-white px-3 py-1 rounded-full" style="background:#ef4444">
      Pending deletion
    </span>
  </div>

  <!-- Body -->
  <div class="p-[18px] flex flex-col gap-3 bg-bg-card">

    <!-- Dates -->
    <div class="grid grid-cols-2 gap-2.5">
      <div class="rounded-[10px] p-3" style="border:1px solid rgba(239,68,68,0.25); background:rgba(239,68,68,0.05)">
        <p class="text-[10px] uppercase tracking-wider text-text-secondary m-0 mb-1">Requested on</p>
        <p class="dr-date-val text-[13px] font-medium text-text-primary m-0">{{ formatToday(currentCompany.deletion_scheduled_date) }}</p>
      </div>
      <div class="rounded-[10px] p-3" style="border:1px solid rgba(239,68,68,0.25); background:rgba(239,68,68,0.05)">
        <p class="text-[10px] uppercase tracking-wider text-text-secondary m-0 mb-1">Deletes on</p>
        <p class="text-[13px] font-medium text-text-primary m-0">{{ formatDeletionDate(currentCompany.deletion_scheduled_date) }}</p>
        <p class="text-[11px] text-text-secondary m-0 mt-0.5">{{ countdownText(currentCompany.deletion_scheduled_date) }}</p>
      </div>
    </div>

    <!-- Timeline -->
    <div class="rounded-[10px] overflow-hidden" style="border:1px solid rgba(239,68,68,0.2); background:rgba(239,68,68,0.04)">
      <div v-for="(step, i) in deletionSteps" :key="i"
        class="flex items-center gap-3 px-3.5 py-2.5"
        :style="i < deletionSteps.length - 1 ? 'border-bottom:1px solid rgba(239,68,68,0.12)' : ''"
      >
        <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          :style="step.done ? 'background:#22c55e' : 'background:rgba(239,68,68,0.15)'"
        >
          <i :class="step.icon + ' text-[11px]'" :style="step.done ? 'color:#fff' : 'color:#ef4444'"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] text-text-primary m-0">{{ step.label }}</p>
          <p class="text-[11px] text-text-secondary m-0 mt-0.5">{{ step.sub }}</p>
        </div>
        <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0"
          :style="step.done
            ? 'background:rgba(34,197,94,0.12);color:#15803d'
            : 'background:rgba(234,179,8,0.12);color:#a16207'"
        >{{ step.done ? 'Done' : 'Pending' }}</span>
      </div>
    </div>

  </div>
</div>
  <!-- ── Skeleton: initial load OR refetch after create ── -->
<div v-if="isLoading || isRefetchingAfterCreate" class="space-y-5 animate-pulse">

  <!-- Read-only notice placeholder -->
  <div class="h-12 rounded-xl bg-border/20"></div>

  <!-- Org Info card skeleton -->
  <section class="rounded-2xl border border-border/40 bg-bg-card overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 border-b border-border/40 bg-bg-surface/50 flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-border/30"></div>
      <div class="space-y-1.5">
        <div class="h-3.5 w-44 bg-border/40 rounded"></div>
        <div class="h-2.5 w-64 bg-border/20 rounded"></div>
      </div>
    </div>
    <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
      <!-- Logo row -->
      <div class="md:col-span-2 flex items-center gap-4">
        <div class="w-[72px] h-[72px] rounded-2xl bg-border/30 shrink-0"></div>
        <div class="space-y-2 flex-1">
          <div class="h-3 w-32 bg-border/30 rounded"></div>
          <div class="h-2.5 w-24 bg-border/20 rounded"></div>
          <div class="h-8 w-28 bg-border/30 rounded-lg"></div>
        </div>
      </div>
      <!-- Org name -->
      <div class="space-y-2">
        <div class="h-2.5 w-28 bg-border/30 rounded"></div>
        <div class="h-10 bg-border/20 rounded-xl"></div>
      </div>
      <!-- Domain/Slug -->
      <div class="space-y-2">
        <div class="h-2.5 w-24 bg-border/30 rounded"></div>
        <div class="h-10 bg-border/20 rounded-xl"></div>
      </div>
      <!-- Team Size -->
      <div class="space-y-2">
        <div class="h-2.5 w-20 bg-border/30 rounded"></div>
        <div class="h-10 bg-border/20 rounded-xl"></div>
      </div>
      <!-- Industry -->
      <div class="space-y-2">
        <div class="h-2.5 w-20 bg-border/30 rounded"></div>
        <div class="h-10 bg-border/20 rounded-xl"></div>
      </div>
      <!-- Description -->
      <div class="md:col-span-2 space-y-2">
        <div class="h-2.5 w-24 bg-border/30 rounded"></div>
        <div class="h-24 bg-border/20 rounded-xl"></div>
        <div class="h-2 w-16 bg-border/10 rounded"></div>
      </div>
    </div>
  </section>

  <!-- Owner card skeleton -->
  <section class="rounded-2xl border border-border/40 bg-bg-card overflow-hidden">
    <div class="px-6 py-4 border-b border-border/40 bg-bg-surface/50 flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-border/30"></div>
      <div class="space-y-1.5">
        <div class="h-3.5 w-40 bg-border/40 rounded"></div>
        <div class="h-2.5 w-56 bg-border/20 rounded"></div>
      </div>
    </div>
    <div class="p-6">
      <div class="flex items-center gap-4 p-4 rounded-xl border border-border/40">
        <div class="w-12 h-12 rounded-full bg-border/30 shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3 w-36 bg-border/40 rounded"></div>
          <div class="h-2.5 w-48 bg-border/20 rounded"></div>
          <div class="h-2 w-28 bg-border/15 rounded"></div>
        </div>
        <div class="hidden sm:block h-7 w-28 bg-border/20 rounded-lg shrink-0"></div>
      </div>
    </div>
  </section>

  <!-- Actions skeleton -->
  <div class="flex gap-3">
    <div class="h-10 w-32 bg-border/30 rounded-xl"></div>
    <div class="h-10 w-40 bg-border/20 rounded-xl"></div>
  </div>

  <!-- Info box skeleton -->
  <div class="h-12 rounded-xl bg-border/15"></div>

</div>

<div v-else class="space-y-5">

      <!-- Read-only notice for members -->
      <div
        v-if="isMember"
        class="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-bg-card text-[13px] text-text-secondary"
      >
        <div class="w-7 h-7 rounded-lg bg-bg-body border border-border/60 flex items-center justify-center shrink-0">
          <i class="fa-regular fa-eye text-[12px] text-text-secondary"></i>
        </div>
        <span>You have <strong class="text-text-primary font-semibold">view-only</strong> access to this organization. Contact an admin to make changes.</span>
      </div>

      <!-- Organization Info -->
      <section class="rounded-2xl border border-border/50 bg-bg-card overflow-hidden">
        <div class="px-6 py-4 border-b border-border/40 bg-bg-surface/50 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-accent/10 border border-accent/15 flex items-center justify-center">
            <i class="fa-solid fa-building text-accent text-[13px]"></i>
          </div>
          <div>
            <h3 class="text-[14px] font-bold text-text-primary leading-tight">Organization Information</h3>
            <p class="text-[11px] text-text-secondary mt-0.5">Manage your organization's basic details and branding.</p>
          </div>
        </div>

        <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

          <!-- Logo -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-4">
              <div
                class="w-[72px] h-[72px] rounded-2xl border-2 flex items-center justify-center shrink-0 overflow-hidden relative group transition-all duration-200"
                :class="isMember ? 'border-border/40 bg-bg-body' : 'border-accent/20 bg-gradient-to-br from-accent/20 to-accent/5 cursor-pointer hover:border-accent/40'"
               @click="!(isMember || isPendingDeletion) && triggerLogoPicker()"
              >
                <img v-if="orgLogoPreview || orgData.logo" :src="orgLogoPreview || orgData.logo" class="w-full h-full object-cover" alt="Organization logo" />
                <i v-else class="fa-solid fa-image text-accent text-xl"></i>
                <div v-if="!(isMember || isPendingDeletion)" class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-2xl">
                  <i class="fa-solid fa-upload text-white text-sm"></i>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="text-[13px] font-semibold text-text-primary mb-1 truncate">{{ orgName || 'Organization' }}</h4>
                <p class="text-[11px] text-text-secondary mb-3">PNG, JPG up to 2MB</p>
                <button
                  v-if="!isMember && !isPendingDeletion"
                  @click="triggerLogoPicker"
                  :disabled="isUploadingLogo"
                  class="px-3.5 py-1.5 text-[12px] cursor-pointer font-medium rounded-lg border border-border/60 hover:border-accent/40 hover:bg-accent/[0.05] hover:text-accent transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <i v-if="isUploadingLogo" class="fa-solid fa-spinner fa-spin text-[11px]"></i>
                  <i v-else class="fa-solid fa-cloud-arrow-up text-[11px]"></i>
                  {{ isUploadingLogo ? 'Uploading…' : 'Upload logo' }}
                </button>
                <input ref="logoInputRef" type="file" accept="image/*" class="hidden" @change="onLogoPicked" />
              </div>
            </div>
          </div>

          <!-- Org Name -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Organization Name</label>
            <input
              v-model="orgName"
              :readonly="isMember || isPendingDeletion"
              class="w-full border rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all placeholder:text-text-secondary/40"
              :class="isMember
                ? 'border-border/40 bg-bg-body/60 text-text-secondary cursor-default'
                : 'border-border/60 bg-bg-body focus:border-accent/50 focus:ring-2 focus:ring-accent/10 hover:border-border text-text-primary'"
              placeholder="Acme Corp"
              @blur="!isMember && validateOrgName()"
            />
            <p v-if="errors.orgName" class="text-[11px] text-red-500 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i> {{ errors.orgName }}
            </p>
          </div>

          <!-- Domain -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Domain / Slug</label>
            <div
              class="flex items-center border rounded-xl overflow-hidden transition-all"
              :class="isMember
                ? 'border-border/40 bg-bg-body/60'
                : errors.orgSlug ? 'border-red-400/60 bg-bg-body focus-within:ring-2 focus-within:ring-red-400/10'
                : isSlugAvailable === true ? 'border-green-500/50 bg-bg-body focus-within:ring-2 focus-within:ring-green-500/10'
                : 'border-border/60 bg-bg-body focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10'"
            >
              <input
                v-model="orgSlug"
                readonly
                class="flex-1 px-4 py-2.5 text-[13px] bg-transparent outline-none"
                :class="isMember ? 'text-text-secondary cursor-default' : 'text-text-primary'"
                placeholder="acme"
              />
              <div class="px-3 flex items-center shrink-0">
                <i v-if="isCheckingSlug" class="fa-solid fa-spinner fa-spin text-text-secondary text-xs"></i>
                <i v-else-if="isSlugAvailable === true && orgSlug !== currentCompany?.slug" class="fa-solid fa-circle-check text-green-500 text-xs"></i>
              </div>
            </div>
            <p v-if="errors.orgSlug" class="text-[11px] text-red-500 flex items-center gap-1">
              <i class="fa-solid fa-circle-exclamation text-[10px]"></i> {{ errors.orgSlug }}
            </p>
          </div>

          <!-- Team Size -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Team Size</label>
            <div class="relative">
              <select
                v-model="orgSize"
                :disabled="isMember || isPendingDeletion"
                class="w-full border rounded-xl px-4 py-2.5 pr-9 text-[13px] outline-none transition-all appearance-none"
                :class="isMember
                  ? 'border-border/40 bg-bg-body/60 text-text-secondary cursor-default opacity-75'
                  : 'border-border/60 bg-bg-body focus:border-accent/50 focus:ring-2 focus:ring-accent/10 hover:border-border text-text-primary cursor-pointer'"
              >
                <option value="1–10">1–10 people</option>
                <option value="11–50">11–50 people</option>
                <option value="51–200">51–200 people</option>
                <option value="201–500">201–500 people</option>
                <option value="500+">500+ people</option>
              </select>
              <i v-if="!isMember && !isPendingDeletion" class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-[10px] pointer-events-none"></i>
            </div>
          </div>

          <!-- Industry -->
          <div class="space-y-1.5">
            <label class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Industry</label>
            <div class="relative">
              <select
                v-model="industry"
                :disabled="isMember || isPendingDeletion"
                class="w-full border rounded-xl px-4 py-2.5 pr-9 text-[13px] outline-none transition-all appearance-none"
                :class="isMember
                  ? 'border-border/40 bg-bg-body/60 text-text-secondary cursor-default opacity-75'
                  : 'border-border/60 bg-bg-body focus:border-accent/50 focus:ring-2 focus:ring-accent/10 hover:border-border text-text-primary cursor-pointer'"
              >
                <option value="">Select an industry</option>
                <option value="software_development">Software Development</option>
                <option value="product_management">Product Management</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
                <option value="finance">Finance</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="class_management">Class Management</option>
                <option value="operations">Operations</option>
                <option value="other">Other</option>
              </select>
              <i v-if="!isMember && !isPendingDeletion" class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-[10px] pointer-events-none"></i>
            </div>
          </div>

          <!-- Description -->
          <div class="md:col-span-2 space-y-1.5">
            <label class="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">Description</label>
            <textarea
              v-model="orgDescription"
              :disabled="isMember || isPendingDeletion"
              placeholder="Tell us about your organization…"
              class="w-full border rounded-xl px-4 py-2.5 text-[13px] outline-none transition-all resize-none h-24"
              :class="isMember
                ? 'border-border/40 bg-bg-body/60 text-text-secondary cursor-default'
                : 'border-border/60 bg-bg-body focus:border-accent/50 focus:ring-2 focus:ring-accent/10 hover:border-border text-text-primary'"
            />
            <p class="text-[11px] text-text-secondary/60">{{ orgDescription.length }}/500 characters</p>
          </div>

        </div>
      </section>
     <!-- {{ organizationOwner }} -->
      <!-- Owner Card -->
      <section v-if="organizationOwner" class="rounded-2xl border border-border/50 bg-bg-card overflow-hidden">
        <div class="px-6 py-4 border-b border-border/40 bg-bg-surface/50 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
            <i class="fa-solid fa-crown text-amber-500 text-[13px]"></i>
          </div>
          <div>
            <h3 class="text-[14px] font-bold text-text-primary leading-tight">Organization Owner</h3>
            <p class="text-[11px] text-text-secondary mt-0.5">Primary administrator of this organization.</p>
          </div>
        </div>
          
        <div class="p-6">
          <div class="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-bg-body/50 transition-colors hover:border-border">
            <div class="relative shrink-0">
              <img
                v-if="organizationOwner.u_profile_image"
                :src="organizationOwner.u_profile_image"
                class="w-12 h-12 rounded-full object-cover ring-2 ring-accent/15"
                alt="Owner"
              />
              <div
                v-else
                class="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-base"
              >
                {{ getInitials(organizationOwner.u_full_name) }}
              </div>
              <div
                v-if="organizationOwner.u_is_verfied"
                class="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-bg-card rounded-full flex items-center justify-center"
              >
                <i class="fa-solid fa-check text-[8px] text-white"></i>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="text-[13px] font-bold text-text-primary truncate">{{ organizationOwner?.u_full_name }}</h4>
                <span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">Owner</span>
              </div>
              <p class="text-[12px] text-text-secondary mt-0.5 truncate">{{ organizationOwner?.u_email }}</p>
              <p v-if="organizationOwner?.u_job_title || organizationOwner?.u_department" class="text-[11px] text-text-secondary/60 mt-1">
                {{ organizationOwner?.u_job_title }}{{ organizationOwner?.u_job_title && organizationOwner?.u_department ? ' · ' : '' }}{{ organizationOwner?.u_department }}
              </p>
            </div>
            <div class="hidden sm:block shrink-0">
              <div class="px-3 py-1.5 rounded-lg bg-bg-body border border-border/60 text-[11px] text-text-secondary">
                Created {{ new Date(profile?.active_company?.created_at).toLocaleDateString() }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Actions — hidden for members -->
      <div v-if="!isMember && !isPendingDeletion" class="flex flex-col sm:flex-row gap-3">
        <button
          @click="saveOrg"
          :disabled="isSaving || !hasChanges"
          class="group px-5 py-2.5 bg-accent text-white cursor-pointer text-[13px] font-semibold rounded-xl hover:bg-accent-hover active:scale-[0.97] transition-all shadow-md shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
        >
          <span v-if="isSaving" class="flex items-center gap-2">
            <i class="fa-solid fa-spinner fa-spin text-[11px]"></i> Saving…
          </span>
          <span v-else class="flex items-center gap-2">
            <i class="fa-solid fa-check text-[11px] transition-transform group-hover:scale-110"></i>
            Save changes
          </span>
        </button>
        <button
          @click="openDeleteModal"
          class="px-5 py-2.5 text-[13px] font-semibold cursor-pointer rounded-xl border border-red-500/25 text-red-500 hover:bg-red-500/[0.07] hover:border-red-500/40 transition-all active:scale-[0.97] flex items-center gap-2"
        >
          <i class="fa-regular fa-trash-can text-[12px]"></i>
          Delete organization
        </button>
      </div>

      <p v-if="saveError && !isMember" class="text-[12px] text-red-500 flex items-center gap-1.5">
        <i class="fa-solid fa-circle-exclamation text-[11px]"></i> {{ saveError }}
      </p>

      <!-- Info box — hidden for members -->
      <div v-if="!isMember" class="rounded-xl border border-accent/15 bg-accent/[0.04] px-5 py-3.5 flex items-start gap-3">
        <i class="fa-solid fa-circle-info text-accent text-[13px] mt-0.5 shrink-0"></i>
        <p class="text-[13px] text-text-secondary leading-relaxed">
          You can invite team members from the <strong class="text-text-primary font-semibold">User Management</strong> section once you save your organization details.
        </p>
      </div>

    </div>

    <!-- ─────────────────────────────────────────────
         DELETE ORGANIZATION — MULTI-STEP MODAL
    ───────────────────────────────────────────── -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="deleteModal.open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
        @click.self="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 scale-95 translate-y-2"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
          appear
        >
          <div class="w-full max-w-[440px] rounded-2xl bg-bg-dropdown shadow-2xl ring-1 ring-black/8 overflow-hidden">

            <!-- Modal header -->
            <div class="px-6 pt-6 pb-0">
              <div
                class="w-11 h-11 rounded-full flex items-center justify-center mb-4 transition-colors duration-500"
                :class="deleteModal.step === 3 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'"
              >
                <i
                  class="text-base transition-all duration-300"
                  :class="deleteModal.step === 3 ? 'fa-solid fa-clock text-amber-500' : 'fa-solid fa-triangle-exclamation text-red-500'"
                ></i>
              </div>

              <!-- Step dots -->
              <div class="flex items-center gap-1.5 mb-4">
                <div
                  v-for="i in 4" :key="i"
                  class="h-1 rounded-full transition-all duration-300"
                  :class="[
                    deleteModal.step >= i - 1
                      ? deleteModal.step === 3 ? 'bg-amber-400' : 'bg-red-500'
                      : 'bg-border',
                    deleteModal.step === i - 1 ? 'w-6' : 'w-4'
                  ]"
                />
              </div>

              <div>
                <template v-if="deleteModal.step === 0">
                  <h3 class="text-[15px] font-bold text-text-primary mb-1">Delete organization</h3>
                  <p class="text-[13px] text-text-secondary leading-relaxed mb-5">This is permanent. Confirm your identity to continue.</p>
                </template>
                <template v-else-if="deleteModal.step === 1">
                  <h3 class="text-[15px] font-bold text-text-primary mb-1">Verify with OTP</h3>
                  <p class="text-[13px] text-text-secondary leading-relaxed mb-5">
                    We sent a 5-digit code to <strong class="text-text-primary">{{ maskedEmail }}</strong>. Enter it below.
                  </p>
                </template>
                <template v-else-if="deleteModal.step === 2">
                  <h3 class="text-[15px] font-bold text-text-primary mb-1">Confirm deletion</h3>
                  <p class="text-[13px] text-text-secondary leading-relaxed mb-5">
                    Type <strong class="text-text-primary">{{ orgName }}</strong> exactly to confirm.
                  </p>
                </template>
                <template v-else>
                  <h3 class="text-[15px] font-bold text-text-primary mb-1">Request received</h3>
                  <p class="text-[13px] text-text-secondary leading-relaxed mb-5">Your deletion request has been queued and will be processed shortly.</p>
                </template>
              </div>
            </div>

            <!-- Modal body -->
            <div class="px-6 pb-6">

              <!-- Step 0: Password -->
              <template v-if="deleteModal.step === 0">
                <div class="flex items-start gap-3 rounded-xl px-4 py-3 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 mb-5">
                  <i class="fa-solid fa-triangle-exclamation text-red-500 text-sm mt-0.5 shrink-0"></i>
                  <p class="text-[12px] text-red-700 dark:text-red-400 leading-relaxed">
                    All data, members and files in <strong>{{ orgName }}</strong> will be permanently deleted.
                  </p>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Your password</label>
                  <div
                    class="flex items-stretch rounded-xl overflow-hidden border transition-all duration-200"
                    :style="{ borderColor: deleteModal.errors.password ? '#e55050' : 'var(--border-input)', background: 'var(--bg-input)' }"
                  >
                    <input
                      v-model="deleteModal.password"
                      :type="deleteModal.showPassword ? 'text' : 'password'"
                      placeholder="Enter your current password"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-[13px] outline-none bg-transparent text-text-primary"
                      @keyup.enter="doPasswordStep"
                      @input="deleteModal.errors.password = ''"
                    />
                    <button
                      type="button"
                      class="px-3.5 border-l flex items-center justify-center cursor-pointer hover:bg-bg-surface transition-colors"
                      style="border-color: var(--border);"
                      @click="deleteModal.showPassword = !deleteModal.showPassword"
                    >
                      <i :class="deleteModal.showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" class="text-[13px] text-text-secondary" />
                    </button>
                  </div>
                  <p v-if="deleteModal.errors.password" class="text-[12px] text-red-500 flex items-center gap-1">
                    <i class="fa-solid fa-circle-exclamation text-[10px]"></i> {{ deleteModal.errors.password }}
                  </p>
                </div>
                <div class="flex gap-2 mt-5">
                  <button type="button" class="flex-1 rounded-xl border border-border/60 bg-transparent px-3 py-2.5 text-[13px] font-medium text-text-secondary hover:text-text-primary hover:border-border transition cursor-pointer" @click="closeDeleteModal">Cancel</button>
                  <button type="button" class="flex-[1.5] rounded-xl bg-red-600 px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="deleteModal.loading" @click="doPasswordStep">
                    <span v-if="deleteModal.loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>{{ deleteModal.loading ? 'Verifying…' : 'Continue' }}</span>
                    <i v-if="!deleteModal.loading" class="fa-solid fa-arrow-right text-[11px]"></i>
                  </button>
                </div>
              </template>

              <!-- Step 1: OTP -->
              <template v-else-if="deleteModal.step === 1">
                <div class="space-y-1.5 mb-4">
                  <label class="text-[10px] font-bold uppercase tracking-wider text-text-secondary block text-center">5-digit code</label>
                  <div class="flex justify-center gap-2">
                    <input
                      v-for="(_, i) in 5" :key="i"
                      :ref="el => { if (el) otpRefs[i] = el }"
                      v-model="deleteModal.otpDigits[i]"
                      type="text"
                      inputmode="numeric"
                      maxlength="1"
                      class="w-11 h-12 rounded-xl border text-center text-lg font-semibold outline-none transition-all duration-200 bg-transparent text-text-primary"
                      :style="{ borderColor: deleteModal.errors.otp ? '#e55050' : (deleteModal.otpDigits[i] ? 'var(--accent)' : 'var(--border-input)') }"
                      @input="onOtpInput(i, $event)"
                      @keydown="onOtpKeydown(i, $event)"
                      @paste="onOtpPaste($event)"
                    />
                  </div>
                  <p v-if="deleteModal.errors.otp" class="text-[12px] text-red-500 text-center flex items-center justify-center gap-1 mt-1">
                    <i class="fa-solid fa-circle-exclamation text-[10px]"></i> {{ deleteModal.errors.otp }}
                  </p>
                </div>
                <p class="text-[12px] text-text-secondary text-center">
                  Code expires in <strong :class="deleteModal.timerSeconds < 60 ? 'text-red-500' : 'text-text-primary'">{{ formattedTimer }}</strong>
                </p>
                <p class="text-[12px] text-text-secondary text-center mt-1">
                  Didn't receive it?
                  <button type="button" class="text-accent underline cursor-pointer ml-1 disabled:opacity-40 disabled:cursor-not-allowed" :disabled="deleteModal.timerSeconds > 570" @click="resendOtp">Resend code</button>
                </p>
                <div class="flex gap-2 mt-5">
                  <button type="button" class="flex-1 rounded-xl border border-border/60 bg-transparent px-3 py-2.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition cursor-pointer" @click="goDeleteStep(0)">Back</button>
                  <button type="button" class="flex-[1.5] rounded-xl bg-red-600 px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="deleteModal.loading || deleteModal.otpDigits.join('').length < 5" @click="doOtpStep">
                    <span v-if="deleteModal.loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>{{ deleteModal.loading ? 'Verifying…' : 'Verify code' }}</span>
                  </button>
                </div>
              </template>

              <!-- Step 2: Confirm name -->
              <template v-else-if="deleteModal.step === 2">
                <div class="flex items-start gap-3 rounded-xl px-4 py-3 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 mb-5">
                  <i class="fa-solid fa-triangle-exclamation text-red-500 text-sm mt-0.5 shrink-0"></i>
                  <p class="text-[12px] text-red-700 dark:text-red-400 leading-relaxed">
                    Type <strong>{{ orgName }}</strong> exactly to confirm this is irreversible.
                  </p>
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-bold uppercase tracking-wider text-text-secondary block">Organization name</label>
                  <input
                    v-model="deleteModal.confirmName"
                    type="text"
                    :placeholder="orgName"
                    autocomplete="off"
                    class="w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none transition-all bg-transparent text-text-primary"
                    :style="{ borderColor: deleteModal.errors.confirmName ? '#e55050' : 'var(--border-input)', background: 'var(--bg-input)' }"
                    @keyup.enter="doConfirmStep"
                    @input="deleteModal.errors.confirmName = ''"
                  />
                  <p v-if="deleteModal.errors.confirmName" class="text-[12px] text-red-500 flex items-center gap-1">
                    <i class="fa-solid fa-circle-exclamation text-[10px]"></i> {{ deleteModal.errors.confirmName }}
                  </p>
                </div>
                <div class="flex gap-2 mt-5">
                  <button type="button" class="flex-1 rounded-xl border border-border/60 bg-transparent px-3 py-2.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition cursor-pointer" @click="goDeleteStep(1)">Back</button>
                  <button type="button" class="flex-[1.5] rounded-xl bg-red-600 px-3 py-2.5 text-[13px] font-semibold text-white hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="deleteModal.loading || deleteModal.confirmName !== orgName" @click="doConfirmStep">
                    <span v-if="deleteModal.loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <i v-if="!deleteModal.loading" class="fa-solid fa-trash text-[11px]"></i>
                    <span>{{ deleteModal.loading ? 'Deleting…' : 'Delete permanently' }}</span>
                  </button>
                </div>
              </template>

              <!-- Step 3: Done -->
              <template v-else>
                <div class="text-center mb-5">
                  <p class="text-[13px] font-semibold text-text-primary mb-1">Deletion scheduled</p>
                  <p class="text-[12px] text-text-secondary leading-relaxed">
                    A confirmation email has been sent to <strong class="text-text-primary">{{ maskedEmail }}</strong>. Your organization will be fully removed within 48 hours.
                  </p>
                </div>
                <div class="rounded-xl border border-border overflow-hidden mb-5 bg-bg-card">
                  <div
                    v-for="(item, i) in deletionTimeline" :key="i"
                    class="flex items-center gap-3 px-4 py-3 text-[13px]"
                    :class="i < deletionTimeline.length - 1 ? 'border-b border-border' : ''"
                  >
                    <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0" :class="item.done ? 'bg-green-100 dark:bg-green-900/30' : 'bg-border/40'">
                      <i :class="[item.icon, item.done ? 'text-green-600 dark:text-green-400' : 'text-text-secondary']" class="text-[11px]"></i>
                    </div>
                    <span class="flex-1 text-text-primary text-[12px] font-medium">{{ item.label }}</span>
                    <span class="text-[11px] text-text-secondary shrink-0">{{ item.time }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 rounded-xl px-3.5 py-2.5 border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 mb-5">
                  <i class="fa-solid fa-circle-info text-amber-500 text-[11px] shrink-0"></i>
                  <p class="text-[12px] text-amber-700 dark:text-amber-400">You can cancel within <strong>2 hours</strong> by contacting support.</p>
                </div>
                <button type="button" class="w-full rounded-xl border border-border/60 px-3 py-2.5 text-[13px] font-medium text-text-primary hover:bg-bg-surface transition cursor-pointer" @click="closeDeleteModal">Done</button>
              </template>

            </div>
          </div>
        </Transition>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive, nextTick, onBeforeUnmount, onMounted } from 'vue'
import { toast } from 'vue-sonner'
import { useDebounceFn } from '@vueuse/core'
import { useWorkspaceStore } from '../../../stores/workspace'
import { useUpdateCompanyProfile } from '../../../services/auth'
import { useQueryClient } from '@tanstack/vue-query'
import { uploadPrivateFile } from '../../../queries/useCommon'
import { useAuthStore } from '../../../stores/auth'
import { request } from '../../../libs/api'
// import { useCompanyUsers } from '../../../queries/useCompanyUsers'
import { useRouter } from 'vue-router'

// ─── Props ────────────────────────────────────────────────────
const props = defineProps<{
  forceCreate?: boolean
  profile?: any
}>()
const isLoading = computed(() => !props.profile || !currentCompany.value)
// ─── Stores ───────────────────────────────────────────────────
const queryClient    = useQueryClient()
const authStore      = useAuthStore()
const workspaceStore = useWorkspaceStore()
const router         = useRouter()
const activeCompany = computed(() =>{
  return props.profile?.active_Company
})
// ─── Company context ──────────────────────────────────────────
const isRefetchingAfterCreate = ref(false)

const selectedCompanyId = ref(
  localStorage.getItem('company_id') || props.profile?.active_company_id
)

watch(() => props.profile?.active_company_id, (id) => {
  if (id && !selectedCompanyId.value) selectedCompanyId.value = id
}, { immediate: true })

const organizationOwner = computed(() => {
  return props.profile?.active_company?.owner;
});
function handleCompanyChange(e: any) { selectedCompanyId.value = e.detail }
onMounted(() => window.addEventListener('company-changed', handleCompanyChange))
onBeforeUnmount(() => window.removeEventListener('company-changed', handleCompanyChange))

const currentCompany = computed(() => props.profile?.active_company ?? null)
const membershipRole = computed(() => currentCompany.value?.membership_role || null)
const permissions    = computed<string[]>(() => currentCompany.value?.permissions || [])
const isOwner        = computed(() => membershipRole.value === 'owner' || membershipRole.value === 'super_admin' || membershipRole.value === 'admin' || membershipRole.value === 'editor')
const READONLY_ROLES = ['member', 'viewer']

const isMember = computed(() =>
  READONLY_ROLES.includes(membershipRole.value ?? '') ||
  (
    membershipRole.value !== 'owner' &&
    membershipRole.value !== 'editor' &&
    membershipRole.value !== 'admin' &&
    !activeCompany.value?.role?.slug?.toLowerCase().includes('super') &&
    !can('company.update') &&
    !can('company_user.update')
  )
)

function can(permission: string) { return permissions.value.includes(permission) }
function getInitials(name: string) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const canUpdateOrg = computed(() =>
  isOwner.value || can('company.update') || can('company_user.update')
)

// ─── Org form state ───────────────────────────────────────────
const orgName        = ref('')
const orgSlug        = ref('')
const orgSize        = ref('1–10')
const industry       = ref('')
const orgDescription = ref('')
const orgLogoPreview = ref<string | null>(null)
const orgData        = ref({ logo: '' })

const isCheckingSlug  = ref(false)
const isSlugAvailable = ref<boolean | null>(null)
const isUploadingLogo = ref(false)
const logoInputRef    = ref<HTMLInputElement>()
const saveError       = ref('')
const errors          = ref({ orgName: '', orgSlug: '' })

const originalValues = ref({
  title: '', slug: '', company_size: '', work_to_do: '', logo: '', description: '',
})

const hasChanges = computed(() => {
  return (
    orgName.value.trim()        !== originalValues.value.title.trim()        ||
    orgSlug.value.trim()        !== originalValues.value.slug.trim()         ||
    orgSize.value               !== originalValues.value.company_size        ||
    industry.value              !== originalValues.value.work_to_do          ||
    orgDescription.value.trim() !== (originalValues.value.description || '').trim() ||
    (orgLogoPreview.value !== null && orgLogoPreview.value !== originalValues.value.logo)
  )
})

const isFormValid = computed(() => {
  const nameValid  = orgName.value.trim().length > 0
  const slugValid  = orgSlug.value.trim().length > 0
  const nameError  = errors.value.orgName !== ''
  const slugError  = orgSlug.value !== originalValues.value.slug && errors.value.orgSlug !== ''
  return nameValid && slugValid && !nameError && !slugError && hasChanges.value
})

watch(currentCompany, (company) => {
  if (!company) return
  orgName.value        = company.title ?? ''
  orgSlug.value        = company.custom_domain ?? company.slug ?? ''
  orgSize.value        = company.company_size ?? '1–10'
  orgData.value.logo   = company.logo ?? ''
  industry.value       = company.work_to_do ?? ''
  orgDescription.value = company.description ?? ''
  originalValues.value = {
    title:        company.title ?? '',
    slug:         company.custom_domain ?? company.slug ?? '',
    company_size: company.company_size ?? '1–10',
    work_to_do:   company.work_to_do ?? '',
    logo:         company.logo ?? '',
    description:  company.description ?? '',
  }
}, { immediate: true })

// ─── Slug check ───────────────────────────────────────────────
const checkSlugAvailability = useDebounceFn(async (slug: string) => {
  if (!slug || slug === currentCompany.value?.slug) {
    isSlugAvailable.value = null; isCheckingSlug.value = false; return
  }
  isCheckingSlug.value = true
  try {
    const result = await workspaceStore.fetchTitleSlug(slug)
    isSlugAvailable.value = result?.available ?? null
  } catch { isSlugAvailable.value = null }
  finally { isCheckingSlug.value = false }
}, 500)

watch(orgSlug, (val) => { isSlugAvailable.value = null; if (val) checkSlugAvailability(val) })

// ─── Logo ─────────────────────────────────────────────────────
function triggerLogoPicker() { logoInputRef.value?.click() }

async function onLogoPicked(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  isUploadingLogo.value = true
  try {
    const res = await uploadPrivateFile(formData)
    orgLogoPreview.value = res?.data?.url
    toast.success('Logo uploaded successfully')
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Upload failed')
  } finally { isUploadingLogo.value = false }
}

// ─── Validation ───────────────────────────────────────────────
function validateOrgName() {
  if (!orgName.value.trim())           errors.value.orgName = 'Organization name is required'
  else if (orgName.value.length < 2)   errors.value.orgName = 'Must be at least 2 characters'
  else if (orgName.value.length > 100) errors.value.orgName = 'Must be less than 100 characters'
  else                                 errors.value.orgName = ''
}

function validateOrgSlug() {
  if (!orgSlug.value.trim()) {
    errors.value.orgSlug = 'Domain is required'
  } else if (orgSlug.value !== originalValues.value.slug) {
    if (!/^[a-z0-9-]+$/.test(orgSlug.value))  errors.value.orgSlug = 'Lowercase letters, numbers, and hyphens only'
    else if (orgSlug.value.length < 3)          errors.value.orgSlug = 'Must be at least 3 characters'
    else if (orgSlug.value.length > 50)         errors.value.orgSlug = 'Must be less than 50 characters'
    else                                         errors.value.orgSlug = ''
  } else { errors.value.orgSlug = '' }
}

// ─── Save ─────────────────────────────────────────────────────
const { mutateAsync: updateCompany, isPending: isSaving } = useUpdateCompanyProfile({
  onSuccess: (data: any) => {
    const payload = data?.data ?? data
    if (!payload || payload?.status === false) {
      saveError.value = payload?.message || 'Something went wrong while saving.'; return
    }
    saveError.value      = ''
    orgLogoPreview.value = null
    originalValues.value = {
      title: orgName.value, slug: orgSlug.value, company_size: orgSize.value,
      work_to_do: industry.value, logo: orgData.value.logo, description: orgDescription.value,
    }
    toast.success(payload?.message || 'Organization updated successfully')
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  },
  onError: (error: any) => {
    const msg = error?.response?.data?.message || error?.message || 'Something went wrong'
    saveError.value = msg; toast.error(msg)
  },
})

async function saveOrg() {
  if (!canUpdateOrg.value) { toast.error('You do not have permission to update this organization.'); return }
  validateOrgName(); validateOrgSlug()
  if (!isFormValid.value) {
    if (!orgName.value.trim())    toast.error('Organization name is required')
    else if (!orgSlug.value.trim()) toast.error('Domain is required')
    else if (!hasChanges.value)   toast.error('No changes to save.')
    else if (errors.value.orgName) toast.error(errors.value.orgName)
    else if (errors.value.orgSlug) toast.error(errors.value.orgSlug)
    else toast.error('Form validation failed. Please check your entries.')
    return
  }
  if (!selectedCompanyId.value) { toast.error('Organization context missing. Please refresh.'); return }
  if (orgSlug.value !== originalValues.value.slug && isSlugAvailable.value === false) {
    toast.error('This domain is already taken.'); return
  }
  try {
    await updateCompany({
      payload: {
        company_id:   selectedCompanyId.value,
        title:        orgName.value,
        description:  orgDescription.value,
        slug:         orgSlug.value,
        company_size: orgSize.value,
        work_to_do:   industry.value,
        logo:         orgLogoPreview.value ?? orgData.value.logo ?? null,
      }
    })
  } catch (e: any) {
    toast.error(e?.message || 'Failed to update organization')
  }
}
const isPendingDeletion = computed(() => !!currentCompany.value?.is_pending_deletion)
// ─── Delete modal ─────────────────────────────────────────────
const otpRefs = ref<any[]>([])

const deleteModal = reactive({
  open: false, step: 0, loading: false,
  password: '', showPassword: false,
  otpDigits: ['', '', '', '', ''],
  timerSeconds: 600,
  expiresAt: 0,
  confirmName: '',
  errors: { password: '', otp: '', confirmName: '' },
})

let timerInterval: ReturnType<typeof setInterval> | null = null

const formattedTimer = computed(() => {
  const m = Math.floor(deleteModal.timerSeconds / 60).toString().padStart(2, '0')
  const s = (deleteModal.timerSeconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const maskedEmail = computed(() => {
  const email = props.profile?.email ?? props.profile?.u_email ?? ''
  if (!email) return '***@***'
  const [local, domain] = email.split('@')
  return `${local[0]}***@${domain}`
})

const deletionTimeline = [
  { icon: 'fa-solid fa-check',        label: 'Request submitted',          time: 'Just now',      done: true  },
  { icon: 'fa-solid fa-envelope',     label: 'Confirmation email sent',    time: 'Within 5 min',  done: true  },
  { icon: 'fa-solid fa-database',     label: 'Data purge begins',          time: 'Within 24 hrs', done: false },
  { icon: 'fa-solid fa-circle-check', label: 'Organization fully deleted', time: 'Up to 48 hrs',  done: false },
]

function openDeleteModal() {
  if (!selectedCompanyId.value) { toast.error('Organization ID not found. Please refresh.'); return }
  Object.assign(deleteModal, {
    open: true, step: 0, loading: false, password: '', showPassword: false,
    otpDigits: ['', '', '', '', ''], confirmName: '', timerSeconds: 299,
    errors: { password: '', otp: '', confirmName: '' },
  })
  stopTimer()
}

function closeDeleteModal() { deleteModal.open = false; stopTimer() }

function handleBackdropClick() {
  if (deleteModal.step === 0 || deleteModal.step === 3) {
    deleteModal.open = false; stopTimer()
    if (deleteModal.step === 3) router.push('/dashboard')
  }
}

function goDeleteStep(step: number) { deleteModal.step = step; if (step !== 1) stopTimer() }

function startTimer(expiresAt?: number) {
  stopTimer()

  deleteModal.expiresAt =
    expiresAt || Date.now() + 10 * 60 * 1000 // 10 minutes

  const update = () => {
    const remaining = Math.max(
      0,
      Math.floor((deleteModal.expiresAt - Date.now()) / 1000)
    )

    deleteModal.timerSeconds = remaining

    if (remaining <= 0) {
      stopTimer()
      deleteModal.errors.otp = 'Verification code has expired.'
    }
  }

  update()
  timerInterval = setInterval(update, 1000)
}

function stopTimer() { if (timerInterval) { clearInterval(timerInterval); timerInterval = null } }

onBeforeUnmount(() => stopTimer())

function onOtpInput(index: number, event: Event) {
  const val = (event.target as HTMLInputElement).value.replace(/\D/g, '')
  deleteModal.otpDigits[index] = val.slice(-1)
  deleteModal.errors.otp = ''
  if (val && index < 4) nextTick(() => otpRefs.value[index + 1]?.focus())
}

function onOtpKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !deleteModal.otpDigits[index] && index > 0)
    nextTick(() => otpRefs.value[index - 1]?.focus())
}

function onOtpPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 5) ?? ''
  text.split('').forEach((char, i) => { deleteModal.otpDigits[i] = char })
  nextTick(() => otpRefs.value[Math.min(text.length, 5)]?.focus())
}

async function resendOtp() {
  try {
    await request({
      url: `profile/company/${selectedCompanyId.value}/resend-delete-otp`,
      method: 'POST'
    })

    deleteModal.otpDigits = ['', '', '', '', '']
    deleteModal.errors.otp = ''

    startTimer()

    nextTick(() => otpRefs.value[0]?.focus())

    toast.success('A new code has been sent to your email.')
  } catch (err: any) {
    toast.error(
      err?.response?.data?.message || 'Failed to resend verification code.'
    )
  }
}

async function doPasswordStep() {
  if (!deleteModal.password.trim()) { deleteModal.errors.password = 'Please enter your password.'; return }
  if (!selectedCompanyId.value) { deleteModal.errors.password = 'Organization context missing.'; return }
  deleteModal.loading = true
  try {
    await request({ url: `profile/company/${selectedCompanyId.value}/verify-password`, method: 'POST', data: { password: deleteModal.password } })
    deleteModal.errors.password = ''; deleteModal.loading = false
    goDeleteStep(1); startTimer(); nextTick(() => otpRefs.value[0]?.focus())
    toast.info('A verification code has been sent to your email.')
  } catch (err: any) {
    deleteModal.loading = false
    deleteModal.errors.password = err?.response?.data?.message ?? 'Incorrect password.'
  }
}

async function doOtpStep() {
  const code = deleteModal.otpDigits.join('')

  if (code.length < 5) {
    deleteModal.errors.otp = 'Please enter all 5 digits.'
    return
  }

  if (deleteModal.timerSeconds <= 0) {
    deleteModal.errors.otp = 'Verification code has expired.'
    return
  }

  deleteModal.loading = true
  deleteModal.errors.otp = ''

  try {
    await request({
      url: `profile/company/${selectedCompanyId.value}/verify-delete-otp`,
      method: 'POST',
      data: {
        otp: code
      }
    })

    deleteModal.loading = false
    stopTimer()
    goDeleteStep(2)
  } catch (err: any) {
    deleteModal.loading = false
    deleteModal.errors.otp =
      err?.response?.data?.message || 'Invalid verification code.'
  }
}

async function doConfirmStep() {
  if (deleteModal.confirmName !== orgName.value) {
    deleteModal.errors.confirmName = 'Name does not match. Check capitalization.'; return
  }
  if (!selectedCompanyId.value) { deleteModal.errors.confirmName = 'Organization context missing.'; return }
  deleteModal.loading = true
  try {
    await request({ url: `profile/company/${selectedCompanyId.value}/confirm-delete`, method: 'POST', data: { otp: deleteModal.otpDigits.join('') } })
    deleteModal.loading = false; goDeleteStep(3)
    try {
      authStore.clearCompany()
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch { /* non-critical */ }
  } catch (err: any) {
    deleteModal.loading = false
    const msg = err?.response?.data?.message || err?.message || 'Failed to delete organization'
    deleteModal.errors.confirmName = msg; toast.error(msg)
  }
}
// deletion request
const deletionSteps = [
  { icon: 'fa-solid fa-check', label: 'Deletion requested', sub: 'Confirmed by owner', done: true },
  { icon: 'fa-solid fa-envelope', label: 'Confirmation email sent', sub: "Sent to owner's registered email", done: true },
  { icon: 'fa-solid fa-database', label: 'Data purge begins', sub: 'Members, files, and workspaces removed', done: false },
  { icon: 'fa-solid fa-circle-xmark', label: 'Organization fully deleted', sub: 'Account permanently closed', done: false },
]


// deletion_scheduled_date IS the deletion date, no +2 needed
function formatDeletionDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatToday(iso: string) {
  const deletionDate = new Date(iso)
  const today = new Date()
  today.setHours(deletionDate.getHours(), deletionDate.getMinutes(), deletionDate.getSeconds())
  return today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
    + ', ' + today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function countdownText(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now()
  if (diffMs <= 0) return 'Deletion processing...'
  const diffH = Math.floor(diffMs / 3600000)
  const d = Math.floor(diffH / 24), h = diffH % 24
  return d > 0 ? `${d}d ${h}h remaining` : `${diffH}h remaining`
}
</script>