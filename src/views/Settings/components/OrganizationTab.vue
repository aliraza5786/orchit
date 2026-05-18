<template>
  <div class="w-full space-y-6 flex-1">

    <!-- Skeleton while refetching after create -->
    <div v-if="isRefetchingAfterCreate" class="space-y-6 animate-pulse">
      <section class="rounded-2xl border border-border/40 bg-bg-body/50 p-6">
        <div class="mb-6 space-y-2">
          <div class="h-5 w-48 bg-border/40 rounded-lg"></div>
          <div class="h-3 w-72 bg-border/20 rounded-lg"></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="md:col-span-2 flex items-center gap-4">
            <div class="w-20 h-20 rounded-xl bg-border/30 shrink-0"></div>
            <div class="space-y-2 flex-1">
              <div class="h-3 w-32 bg-border/30 rounded"></div>
              <div class="h-3 w-24 bg-border/20 rounded"></div>
              <div class="h-8 w-28 bg-border/30 rounded-lg"></div>
            </div>
          </div>
          <div class="space-y-2">
            <div class="h-3 w-24 bg-border/30 rounded"></div>
            <div class="h-10 bg-border/20 rounded-lg"></div>
          </div>
          <div class="space-y-2">
            <div class="h-3 w-24 bg-border/30 rounded"></div>
            <div class="h-10 bg-border/20 rounded-lg"></div>
          </div>
        </div>
      </section>
      <div class="h-10 w-32 bg-border/30 rounded-lg"></div>
    </div>

    <!-- No org yet -->
    <div v-else-if="!hasOrg">
      <div class="space-y-6" v-if="isCreatingOrg">
        <CreateOrganizationInline @done="onOrgCreated" />
      </div>
      <div v-if="!hasOrg && !isCreatingOrg" class="flex flex-col items-center justify-center py-8 px-4">
        <div class="flex flex-col items-center max-w-2xl w-full text-center bg-bg-card border border-border/60 rounded-[32px] p-8 md:p-12 shadow-sm relative overflow-hidden">
          <!-- Background decoration -->
          <div class="absolute -top-24 -left-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>
          <div class="absolute -bottom-24 -right-24 w-64 h-64 bg-accent/5 rounded-full blur-3xl"></div>

          <div class="relative z-10 w-full">
            <div class="w-24 h-24 rounded-[28px] bg-bg-body shadow-xl flex items-center justify-center mx-auto mb-8 border border-accent/10 transition-transform hover:scale-105 duration-500">
               <i class="fa-solid fa-building-flag text-accent text-4xl"></i>
            </div>
            
            <h2 class="text-3xl md:text-4xl font-black text-text-primary mb-4 tracking-tight">Level Up Your Collaboration</h2>
            <p class="text-[15px] text-text-secondary mb-10 leading-relaxed max-w-lg mx-auto">
              Ready to manage a team? Create an organization to invite members, secure your domain, and centralize your operations in a shared workspace.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-10 text-left">
              <div class="flex flex-col gap-3 p-5 rounded-2xl bg-bg-body/50 border border-border/40 transition-colors hover:border-accent/30">
                <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <i class="fa-solid fa-users text-accent text-base"></i>
                </div>
                <div>
                  <p class="text-sm font-bold text-text-primary">Team</p>
                  <p class="text-[11px] text-text-secondary mt-0.5">Invite members & collaborate</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 p-5 rounded-2xl bg-bg-body/50 border border-border/40 transition-colors hover:border-accent/30">
                <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <i class="fa-solid fa-globe text-accent text-base"></i>
                </div>
                <div>
                  <p class="text-sm font-bold text-text-primary">Domain</p>
                  <p class="text-[11px] text-text-secondary mt-0.5">Custom white-label domains</p>
                </div>
              </div>
              <div class="flex flex-col gap-3 p-5 rounded-2xl bg-bg-body/50 border border-border/40 transition-colors hover:border-accent/30">
                <div class="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <i class="fa-solid fa-shield-halved text-accent text-base"></i>
                </div>
                <div>
                  <p class="text-sm font-bold text-text-primary">Roles</p>
                  <p class="text-[11px] text-text-secondary mt-0.5">Advanced permission control</p>
                </div>
              </div>
            </div>

            <button
              @click="isCreatingOrg = true"
              class="group relative px-8 py-4 bg-accent text-white cursor-pointer text-base font-bold rounded-2xl hover:bg-accent/90 active:scale-[0.98] transition-all shadow-xl shadow-accent/25 overflow-hidden"
            >
              <span class="relative flex items-center justify-center gap-2">
                <i class="fa-solid fa-plus-circle text-lg"></i>
                Create Your Organization
              </span>
            </button>

            <p class="text-[11px] text-text-secondary mt-8 flex items-center justify-center gap-2 opacity-70">
              <i class="fa-solid fa-lightbulb text-amber-500 text-xs"></i>
              Your personal account will become the primary owner automatically
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Has org — settings form -->
    <div v-else class="space-y-6">
      <section class="rounded-2xl p-6">
        <div class="mb-6">
          <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
            <i class="fa-solid fa-building text-accent"></i>
            Organization Information
          </h3>
          <p class="text-sm text-text-secondary mt-1">Manage your organization's basic details and branding.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Logo -->
          <div class="md:col-span-2">
            <div class="flex items-center gap-4">
              <div class="w-20 h-20 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden group relative">
                <img v-if="orgLogoPreview || orgData.logo" :src="orgLogoPreview || orgData.logo" class="w-full h-full object-cover" alt="Organization logo" />
                <i v-else class="fa-solid fa-image text-accent text-2xl"></i>
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <i class="fa-solid fa-upload text-white text-xs"></i>
                </div>
              </div>
              <div class="flex-1">
                <h4 class="text-sm font-semibold text-text-primary mb-2">{{ orgName }}</h4>
                <p class="text-xs text-text-secondary mb-3">PNG, JPG up to 2MB</p>
                <button @click="triggerLogoPicker" :disabled="isUploadingLogo" class="px-4 py-2 text-sm cursor-pointer font-medium rounded-lg border border-border hover:bg-bg-card transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <i class="fa-solid fa-cloud-arrow-up mr-2"></i>
                  {{ isUploadingLogo ? 'Uploading...' : 'Upload logo' }}
                </button>
                <input ref="logoInputRef" type="file" accept="image/*" class="hidden" @change="onLogoPicked" />
              </div>
            </div>
          </div>

          <!-- Org Name -->
          <div>
            <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">Organization Name</label>
            <input v-model="orgName" class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary" placeholder="Acme Corp" @blur="validateOrgName" />
            <p v-if="errors.orgName" class="text-xs text-red-500 mt-1">{{ errors.orgName }}</p>
          </div>

          <!-- Domain / Slug -->
          <div>
            <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">Domain</label>
            <div
              class="flex items-center border rounded-lg overflow-hidden transition-all"
              :class="[
                'border-border/60',
                'bg-bg-body/80 focus-within:ring-2',
                isSlugAvailable === false ? 'focus-within:ring-red-500/10' :
                isSlugAvailable === true ? 'focus-within:ring-green-500/10' :
                'focus-within:ring-accent/10 focus-within:border-accent/50'
              ]"
            >
              <input v-model="orgSlug" readonly class="flex-1 px-4 py-2.5 text-sm bg-transparent outline-none placeholder:text-text-tertiary" placeholder="acme" @blur="validateOrgSlug" />
              <div class="px-3 flex items-center shrink-0">
                <i v-if="isCheckingSlug" class="fa-solid fa-spinner fa-spin text-text-secondary text-xs"></i>
                <i v-else-if="isSlugAvailable === true && orgSlug !== currentCompany?.slug" class="fa-solid fa-circle-check text-green-500 text-xs"></i>
                <i v-else-if="isSlugAvailable === false" class="fa-solid fa-circle-xmark text-red-500 text-xs"></i>
              </div>
             
            </div>
          </div>

          <!-- Team Size -->
          <div>
            <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">Team Size</label>
            <div class="relative">
              <select v-model="orgSize" class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 pr-10 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all appearance-none cursor-pointer">
                <option value="1–10">1–10 people</option>
                <option value="11–50">11–50 people</option>
                <option value="51–200">51–200 people</option>
                <option value="201–500">201–500 people</option>
                <option value="500+">500+ people</option>
              </select>
              <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs pointer-events-none"></i>
            </div>
          </div>

          <!-- Industry -->
          <div>
            <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">Industry</label>
            <div class="relative">
              <select v-model="industry" class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 pr-10 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all appearance-none cursor-pointer">
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
              <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-xs pointer-events-none"></i>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="mt-6">
          <label class="text-[11px] font-semibold text-text-primary uppercase tracking-wider block mb-2">Organization Description</label>
          <textarea v-model="orgDescription" placeholder="Tell us about your organization..." class="w-full border border-border/60 bg-bg-body/80 rounded-lg px-4 py-2.5 text-sm focus:border-accent/50 focus:ring-2 focus:ring-accent/10 outline-none transition-all placeholder:text-text-tertiary resize-none h-24" />
          <p class="text-xs text-text-secondary mt-1">{{ orgDescription.length }}/500 characters</p>
        </div>
      </section>

      <!-- Owner Details Section -->
      <section v-if="owner" class="rounded-2xl p-6 border border-border/40 bg-bg-card/20">
        <div class="mb-6">
          <h3 class="text-lg font-bold text-text-primary flex items-center gap-2">
            <i class="fa-solid fa-crown text-amber-500"></i>
            Workspace Owner
          </h3>
          <p class="text-sm text-text-secondary mt-1">The primary administrator responsible for this organization.</p>
        </div>

        <div class="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-bg-body/50">
          <div class="relative">
            <img v-if="owner.u_profile_image" :src="owner.u_profile_image" class="w-14 h-14 rounded-full object-cover border-2 border-accent/20" alt="Owner avatar" />
            <div v-else class="w-14 h-14 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-lg">
              {{ getInitials(owner.u_full_name) }}
            </div>
            <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-bg-body rounded-full flex items-center justify-center" v-if="owner.u_is_verfied">
              <i class="fa-solid fa-check text-[10px] text-white"></i>
            </div>
          </div>
          
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="text-sm font-bold text-text-primary truncate">{{ owner.u_full_name }}</h4>
              <span class="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">Owner</span>
            </div>
            <p class="text-xs text-text-secondary mt-0.5 truncate">{{ owner.u_email }}</p>
            <p v-if="owner.u_job_title || owner.u_department" class="text-[10px] text-text-tertiary mt-1">
              {{ owner.u_job_title }} {{ owner.u_job_title && owner.u_department ? '•' : '' }} {{ owner.u_department }}
            </p>
          </div>

          <div class="hidden sm:block">
             <div class="px-3 py-1.5 rounded-lg bg-bg-card border border-border/60 text-[11px] text-text-secondary">
                Joined {{ new Date(owner.created_at).toLocaleDateString() }}
             </div>
          </div>
        </div>
      </section>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-3 justify-start">
        <button 
          @click="saveOrg" 
          :disabled="isSaving || !hasChanges" 
          class="px-6 py-2.5 bg-accent text-white cursor-pointer text-sm font-semibold rounded-lg hover:bg-accent/90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
        >
          <span v-if="isSaving" class="flex items-center gap-2">
            <i class="fa-solid fa-spinner fa-spin text-xs"></i> Saving...
          </span>
          <span v-else><i class="fa-solid fa-check mr-2"></i> Save changes</span>
        </button>
        <button @click="openDeleteModal" class="px-6 py-2.5 text-sm font-semibold cursor-pointer rounded-lg border border-red-500/30 text-red-600 hover:bg-red-500/10 transition-all active:scale-95">
  <i class="fa-solid fa-trash mr-2"></i>
  Delete organization
</button>
      </div>

      <p v-if="saveError" class="text-xs text-red-500 mt-2 flex items-center gap-1.5">
        <i class="fa-solid fa-circle-exclamation"></i> {{ saveError }}
      </p>

      <!-- Info Box -->
      <div class="rounded-xl border border-blue-500/20 bg-blue-500/5 px-5 py-4">
        <p class="text-sm text-blue-600 font-medium flex items-start gap-2">
          <i class="fa-solid fa-info-circle mt-0.5 text-xs"></i>
          <span>You can invite team members from the <strong>User Management</strong> section once you save your organization details.</span>
        </p>
      </div>
    </div>

    <!-- ─────────────────────────────────────────────────────────────
         DELETE ORGANIZATION — MULTI-STEP MODAL
    ───────────────────────────────────────────────────────────── -->
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

              <!-- Danger icon -->
              <div
                class="w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors duration-500"
                :class="deleteModal.step === 3 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'"
              >
                <i
                  class="text-lg transition-all duration-300"
                  :class="deleteModal.step === 3
                    ? 'fa-solid fa-clock text-amber-500'
                    : 'fa-solid fa-triangle-exclamation text-red-500'"
                ></i>
              </div>

              <!-- Step indicator dots -->
              <div class="flex items-center gap-1.5 mb-4">
                <div
                  v-for="i in 4"
                  :key="i"
                  class="h-1 rounded-full transition-all duration-300"
                  :class="[
                    deleteModal.step >= i - 1
                      ? deleteModal.step === 3 ? 'bg-amber-400' : 'bg-red-500'
                      : 'bg-border',
                    deleteModal.step === i - 1 ? 'w-6' : 'w-4'
                  ]"
                />
              </div>

              <!-- Step titles -->
              <div>
                <template v-if="deleteModal.step === 0">
                  <h3 class="text-base font-semibold text-text-primary mb-1">Delete organization</h3>
                  <p class="text-sm text-text-secondary leading-relaxed mb-5">This is permanent. Confirm your identity to continue.</p>
                </template>
                <template v-else-if="deleteModal.step === 1">
                  <h3 class="text-base font-semibold text-text-primary mb-1">Verify with OTP</h3>
                  <p class="text-sm text-text-secondary leading-relaxed mb-5">
                    We sent a 6-digit code to <strong class="text-text-primary">{{ maskedEmail }}</strong>. Enter it below.
                  </p>
                </template>
                <template v-else-if="deleteModal.step === 2">
                  <h3 class="text-base font-semibold text-text-primary mb-1">Confirm deletion</h3>
                  <p class="text-sm text-text-secondary leading-relaxed mb-5">
                    Type <strong class="text-text-primary">{{ orgName }}</strong> exactly to confirm this action is irreversible.
                  </p>
                </template>
                <template v-else>
                  <h3 class="text-base font-semibold text-text-primary mb-1">Request received</h3>
                  <p class="text-sm text-text-secondary leading-relaxed mb-5">Your deletion request has been queued and will be processed shortly.</p>
                </template>
              </div>
            </div>

            <!-- Modal body -->
            <div class="px-6 pb-6">

              <!-- ── Step 0: Password ── -->
              <template v-if="deleteModal.step === 0">
                <div class="flex items-start gap-3 rounded-lg px-4 py-3 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 mb-5">
                  <i class="fa-solid fa-triangle-exclamation text-red-500 text-sm mt-0.5 shrink-0"></i>
                  <p class="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                    All data, members, projects and files associated with <strong>{{ orgName }}</strong> will be permanently deleted. This cannot be undone.
                  </p>
                </div>

                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">Your password</label>
                  <div
                    class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
                    :style="{ borderColor: deleteModal.errors.password ? '#e55050' : 'var(--border-input)', background: 'var(--bg-input)' }"
                  >
                    <input
                      v-model="deleteModal.password"
                      :type="deleteModal.showPassword ? 'text' : 'password'"
                      placeholder="Enter your current password"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-sm outline-none bg-transparent text-text-primary"
                      @keyup.enter="doPasswordStep"
                      @input="deleteModal.errors.password = ''"
                    />
                    <button
                      type="button"
                      class="px-3.5 border-l flex items-center justify-center cursor-pointer"
                      style="background: var(--bg-surface); border-color: var(--border);"
                      @click="deleteModal.showPassword = !deleteModal.showPassword"
                    >
                      <i :class="deleteModal.showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" class="text-sm text-text-secondary" />
                    </button>
                  </div>
                  <p v-if="deleteModal.errors.password" class="text-xs text-red-500 flex items-center gap-1">
                    <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
                    {{ deleteModal.errors.password }}
                  </p>
                </div>

                <div class="flex gap-2 mt-5">
                  <button type="button" class="flex-1 rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-black/20 transition cursor-pointer" @click="closeDeleteModal">
                    Cancel
                  </button>
                  <button type="button" class="flex-[1.5] rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="deleteModal.loading" @click="doPasswordStep">
                    <span v-if="deleteModal.loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>{{ deleteModal.loading ? 'Verifying...' : 'Continue' }}</span>
                    <i v-if="!deleteModal.loading" class="fa-solid fa-arrow-right text-xs"></i>
                  </button>
                </div>
              </template>

              <!-- ── Step 1: OTP ── -->
              <template v-else-if="deleteModal.step === 1">
                <div class="space-y-1.5 mb-4">
                  <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block text-center">6-digit code</label>
                  <div class="flex justify-center gap-2">
                    <input
                      v-for="(_, i) in 5"
                      :key="i"
                      :ref="el => { if (el) otpRefs[i] = el }"
                      v-model="deleteModal.otpDigits[i]"
                      type="text"
                      inputmode="numeric"
                      maxlength="1"
                      class="w-11 h-12 rounded-lg border-[1.5px] text-center text-lg font-semibold outline-none transition-all duration-200 bg-transparent text-text-primary"
                      :style="{ borderColor: deleteModal.errors.otp ? '#e55050' : (deleteModal.otpDigits[i] ? 'var(--accent)' : 'var(--border-input)') }"
                      @input="onOtpInput(i, $event)"
                      @keydown="onOtpKeydown(i, $event)"
                      @paste="onOtpPaste($event)"
                    />
                  </div>
                  <p v-if="deleteModal.errors.otp" class="text-xs text-red-500 text-center flex items-center justify-center gap-1 mt-1">
                    <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
                    {{ deleteModal.errors.otp }}
                  </p>
                </div>

                <p class="text-xs text-text-secondary text-center">
                  Code expires in
                  <strong :class="deleteModal.timerSeconds < 60 ? 'text-red-500' : 'text-text-primary'">
                    {{ formattedTimer }}
                  </strong>
                </p>
                <p class="text-xs text-text-secondary text-center mt-1">
                  Didn't receive it?
                  <button type="button" class="text-accent underline cursor-pointer ml-1 disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline" :disabled="deleteModal.timerSeconds > 240" @click="resendOtp">
                    Resend code
                  </button>
                </p>

                <div class="flex gap-2 mt-5">
                  <button type="button" class="flex-1 rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:border-black/20 transition cursor-pointer" @click="goDeleteStep(0)">
                    Back
                  </button>
                  <button type="button" class="flex-[1.5] rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="deleteModal.loading || deleteModal.otpDigits.join('').length < 5" @click="doOtpStep">
                    <span v-if="deleteModal.loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>{{ deleteModal.loading ? 'Verifying...' : 'Verify code' }}</span>
                  </button>
                </div>
              </template>

              <!-- ── Step 2: Confirm org name ── -->
              <template v-else-if="deleteModal.step === 2">
                <div class="flex items-start gap-3 rounded-lg px-4 py-3 border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 mb-5">
                  <i class="fa-solid fa-triangle-exclamation text-red-500 text-sm mt-0.5 shrink-0"></i>
                  <p class="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                    Type <strong>{{ orgName }}</strong> exactly to confirm you understand this action is irreversible.
                  </p>
                </div>

                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary block">Organization name</label>
                  <div
                    class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
                    :style="{ borderColor: deleteModal.errors.confirmName ? '#e55050' : 'var(--border-input)', background: 'var(--bg-input)' }"
                  >
                    <input
                      v-model="deleteModal.confirmName"
                      type="text"
                      :placeholder="orgName"
                      autocomplete="off"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-sm outline-none bg-transparent text-text-primary"
                      @keyup.enter="doConfirmStep"
                      @input="deleteModal.errors.confirmName = ''"
                    />
                  </div>
                  <p v-if="deleteModal.errors.confirmName" class="text-xs text-red-500 flex items-center gap-1">
                    <i class="fa-solid fa-circle-exclamation text-[10px]"></i>
                    {{ deleteModal.errors.confirmName }}
                  </p>
                </div>

                <div class="flex gap-2 mt-5">
                  <button type="button" class="flex-1 rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition cursor-pointer" @click="goDeleteStep(1)">
                    Back
                  </button>
                  <button type="button" class="flex-[1.5] rounded-lg bg-red-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="deleteModal.loading || deleteModal.confirmName !== orgName" @click="doConfirmStep">
                    <span v-if="deleteModal.loading" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <i v-if="!deleteModal.loading" class="fa-solid fa-trash text-xs"></i>
                    <span>{{ deleteModal.loading ? 'Deleting...' : 'Delete permanently' }}</span>
                  </button>
                </div>
              </template>

              <!-- ── Step 3: Success / timeline ── -->
              <template v-else>
                <div class="text-center mb-5">
                  <p class="text-sm font-semibold text-text-primary mb-1">Deletion scheduled</p>
                  <p class="text-xs text-text-secondary leading-relaxed">
                    A confirmation email has been sent to <strong class="text-text-primary">{{ maskedEmail }}</strong>.
                    Your organization will be fully removed within 48 hours.
                  </p>
                </div>

                <!-- Timeline -->
                <div class="rounded-xl border border-border overflow-hidden mb-5" style="background: var(--bg-card);">
                  <div
                    v-for="(item, i) in deletionTimeline"
                    :key="i"
                    class="flex items-center gap-3 px-4 py-3 text-sm"
                    :class="i < deletionTimeline.length - 1 ? 'border-b border-border' : ''"
                  >
                    <div
                      class="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      :class="item.done ? 'bg-green-100 dark:bg-green-900/30' : 'bg-border/40'"
                    >
                      <i :class="[item.icon, item.done ? 'text-green-600 dark:text-green-400' : 'text-text-secondary']" class="text-xs"></i>
                    </div>
                    <span class="flex-1 text-text-primary text-xs font-medium">{{ item.label }}</span>
                    <span class="text-[11px] text-text-secondary shrink-0">{{ item.time }}</span>
                  </div>
                </div>

                <!-- Cancel hint -->
                <div class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 mb-5">
                  <i class="fa-solid fa-circle-info text-amber-500 text-xs shrink-0"></i>
                  <p class="text-xs text-amber-700 dark:text-amber-400">You can cancel this request within <strong>2 hours</strong> by contacting support.</p>
                </div>

                <button type="button" class="w-full rounded-lg bg-bg-card border border-border px-3 py-2.5 text-sm font-medium text-text-primary hover:bg-bg-surface transition cursor-pointer" @click="closeDeleteModal">
                  Done
                </button>
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
// import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useDebounceFn } from '@vueuse/core'
import { useWorkspaceStore } from '../../../stores/workspace'
import { useUpdateCompanyProfile } from '../../../services/auth'
import { useQueryClient } from '@tanstack/vue-query'
import { uploadPrivateFile } from '../../../queries/useCommon'
import CreateOrganizationInline from './CreateOrganizationInline.vue'
import { useAuthStore } from '../../../stores/auth'
import { request } from '../../../libs/api'
import { useCompanyUsers } from '../../../queries/useCompanyUsers'
import { useRouter } from 'vue-router'
// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{
  forceCreate?: boolean
  profile?: any
}>()

// ─── Stores / composables ─────────────────────────────────────────────────────
const queryClient = useQueryClient()
const authStore   = useAuthStore()
const workspaceStore = useWorkspaceStore()
const router = useRouter()

// ─── Company context ──────────────────────────────────────────────────────────
const isCreatingOrg = ref(false)
const isRefetchingAfterCreate = ref(false)

const selectedCompanyId = ref(
  localStorage.getItem('company_id') || props.profile?.active_company_id
)

watch(() => props.profile?.active_company_id, (id) => {
  if (id && !selectedCompanyId.value) {
    selectedCompanyId.value = id
  }
}, { immediate: true })

const ownerParams = reactive({
  company_id: selectedCompanyId,
  membership_role: 'owner',
})
const { data: usersData } = useCompanyUsers(ownerParams as any)
const owner = computed(() => {
  const raw = usersData.value?.data?.users ?? usersData.value?.users ?? []
  return Array.isArray(raw) ? raw[0] : null
})

function handleCompanyChange(e: any) {
  selectedCompanyId.value = e.detail
}
onMounted(() => window.addEventListener('company-changed', handleCompanyChange))
onBeforeUnmount(() => window.removeEventListener('company-changed', handleCompanyChange))

const currentCompany  = computed(() => props.profile?.active_company ?? null)
const membershipRole  = computed(() => currentCompany.value?.membership_role || null)
const permissions     = computed<string[]>(() => currentCompany.value?.permissions || [])
const isOwner         = computed(() => membershipRole.value === 'owner')

function can(permission: string) {
  return permissions.value.includes(permission)
}

function getInitials(name: string) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

const canUpdateOrg = computed(() =>
  isOwner.value || can('company.update') || can('company_user.update')
)


const hasOrg = computed(() => {
  if (props.forceCreate) return false
  if (isRefetchingAfterCreate.value) return true
  return !!props.profile?.active_company_id
})

function onOrgCreated() {
  isCreatingOrg.value = false
  isRefetchingAfterCreate.value = true
  queryClient.invalidateQueries({ queryKey: ['profile'] }).then(() => {
    isRefetchingAfterCreate.value = false
  })
}

// ─── Org form state ───────────────────────────────────────────────────────────
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

const errors = ref({ orgName: '', orgSlug: '' })

const originalValues = ref({
  title: '', slug: '', company_size: '', work_to_do: '', logo: '', description: '',
})

// hasChanges is now a computed property

const isFormValid = computed(() => {
  const nameValid = orgName.value.trim().length > 0
  const slugValid = orgSlug.value.trim().length > 0
  
  // Only check validation errors if they exist. 
  // If slug hasn't changed, we don't care about its format errors.
  const nameError = errors.value.orgName !== ''
  const slugError = orgSlug.value !== originalValues.value.slug && errors.value.orgSlug !== ''
  
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
    title: company.title ?? '',
    slug: company.custom_domain ?? company.slug ?? '',
    company_size: company.company_size ?? '1–10',
    work_to_do: company.work_to_do ?? '',
    logo: company.logo ?? '',
    description: company.description ?? '',
  }
}, { immediate: true })

const hasChanges = computed(() => {
  const nameChanged = orgName.value.trim() !== originalValues.value.title.trim()
  const slugChanged = orgSlug.value.trim() !== originalValues.value.slug.trim()
  const sizeChanged = orgSize.value !== originalValues.value.company_size
  const industryChanged = industry.value !== originalValues.value.work_to_do
  const descChanged = orgDescription.value.trim() !== (originalValues.value.description || '').trim()
  const logoChanged = orgLogoPreview.value !== null && orgLogoPreview.value !== originalValues.value.logo

  return nameChanged || slugChanged || sizeChanged || industryChanged || descChanged || logoChanged
})
// ─── Slug availability ────────────────────────────────────────────────────────
const checkSlugAvailability = useDebounceFn(async (slug: string) => {
  if (!slug || slug === currentCompany.value?.slug) {
    isSlugAvailable.value = null
    isCheckingSlug.value  = false
    return
  }
  isCheckingSlug.value = true
  try {
    const result = await workspaceStore.fetchTitleSlug(slug)
    isSlugAvailable.value = result?.available ?? null
  } catch { isSlugAvailable.value = null }
  finally { isCheckingSlug.value = false }
}, 500)

watch(orgSlug, (val) => {
  isSlugAvailable.value = null
  if (val) checkSlugAvailability(val)
})

// ─── Logo upload ──────────────────────────────────────────────────────────────
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

// ─── Validation ───────────────────────────────────────────────────────────────
function validateOrgName() {
  if (!orgName.value.trim())          errors.value.orgName = 'Organization name is required'
  else if (orgName.value.length < 2)  errors.value.orgName = 'Must be at least 2 characters'
  else if (orgName.value.length > 100) errors.value.orgName = 'Must be less than 100 characters'
  else                                errors.value.orgName = ''
}

function validateOrgSlug() {
  if (!orgSlug.value.trim()) {
    errors.value.orgSlug = 'Domain is required'
  } else if (orgSlug.value !== originalValues.value.slug) {
    // Only enforce strict slug rules if the user is trying to change it
    if (!/^[a-z0-9-]+$/.test(orgSlug.value)) {
      errors.value.orgSlug = 'Lowercase letters, numbers, and hyphens only'
    } else if (orgSlug.value.length < 3) {
      errors.value.orgSlug = 'Must be at least 3 characters'
    } else if (orgSlug.value.length > 50) {
      errors.value.orgSlug = 'Must be less than 50 characters'
    } else {
      errors.value.orgSlug = ''
    }
  } else {
    errors.value.orgSlug = ''
  }
}

// ─── Save org ─────────────────────────────────────────────────────────────────
const { mutateAsync: updateCompany, isPending: isSaving } = useUpdateCompanyProfile({
  onSuccess: (data: any) => {
    const payload = data?.data ?? data
    if (!payload || payload?.status === false) {
      saveError.value = payload?.message || 'Something went wrong while saving.'
      return
    }
    saveError.value   = ''
    orgLogoPreview.value = null
    // Reset original values to current state to clear hasChanges
    originalValues.value = {
      title: orgName.value,
      slug: orgSlug.value,
      company_size: orgSize.value,
      work_to_do: industry.value,
      logo: orgData.value.logo,
      description: orgDescription.value,
    }
    toast.success(payload?.message || 'Organization updated successfully')
    queryClient.invalidateQueries({ queryKey: ['profile'] })
  },
  onError: (error: any) => {
    const serverMessage = error?.response?.data?.message || error?.message || 'Something went wrong'
    saveError.value = serverMessage
    toast.error(serverMessage)
  },
})

async function saveOrg() {
  console.log('[OrganizationTab] saveOrg triggerred')
  
  // Diagnostic alert to confirm the button click is working
  // window.alert('Saving organization...')

  if (!canUpdateOrg.value) {
    toast.error('You do not have permission to update this organization.')
    return
  }

  validateOrgName()
  validateOrgSlug()
  
  if (!isFormValid.value) {
    if (!orgName.value.trim()) toast.error('Organization name is required')
    else if (!orgSlug.value.trim()) toast.error('Domain is required')
    else if (!hasChanges.value) toast.error('No changes to save. Please modify a field first.')
    else if (errors.value.orgName) toast.error(errors.value.orgName)
    else if (errors.value.orgSlug) toast.error(errors.value.orgSlug)
    else toast.error('Form validation failed. Please check your entries.')
    return
  }

  if (!selectedCompanyId.value) {
    toast.error('Organization context missing. Please refresh the page.')
    return
  }

  if (
    orgSlug.value !== originalValues.value.slug &&
    isSlugAvailable.value === false
  ) {
    toast.error('This domain is already taken. Please choose another.')
    return
  }

  toast.info('Initiating update request...')

  try {
    const payload = {
      company_id:   selectedCompanyId.value,
      title:        orgName.value,
      description:  orgDescription.value,
      slug:         orgSlug.value,
      company_size: orgSize.value,
      work_to_do:   industry.value,
      logo:         orgLogoPreview.value ?? orgData.value.logo ?? null,
    }
    
    console.log('[OrganizationTab] Calling updateCompany with payload:', payload)
    
    await updateCompany({ payload })
    
    toast.success('Update request completed.')
  } catch (e: any) {
    console.error('[OrganizationTab] Save failed deeply:', e)
    const msg = e?.message || 'Failed to update organization'
    toast.error(msg)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DELETE ORGANIZATION — MULTI-STEP FLOW
// ─────────────────────────────────────────────────────────────────────────────

const otpRefs = ref<any[]>([])

const deleteModal = reactive({
  open:          false,
  step:          0,          // 0 = password | 1 = OTP | 2 = confirm name | 3 = done
  loading:       false,

  // Step 0
  password:      '',
  showPassword:  false,

  // Step 1 — OTP
  otpDigits:     ['', '', '', '', ''],
  timerSeconds:  299,

  // Step 2
  confirmName:   '',

  errors: {
    password:    '',
    otp:         '',
    confirmName: '',
  },
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
  if (!selectedCompanyId.value) {
    toast.error('Organization ID not found. Please refresh the page.')
    return
  }
  // Remove the deletingDomainId check entirely — no longer needed

  deleteModal.open         = true
  deleteModal.step         = 0
  deleteModal.loading      = false
  deleteModal.password     = ''
  deleteModal.showPassword = false
  deleteModal.otpDigits    = ['', '', '', '', '']
  deleteModal.confirmName  = ''
  deleteModal.errors       = { password: '', otp: '', confirmName: '' }
  deleteModal.timerSeconds = 299
  stopTimer()
}

function closeDeleteModal() {
  deleteModal.open = false
  stopTimer()
  router.push('/dashboard')
}

function handleBackdropClick() {
  // Don't close on backdrop click during steps 1-2 to prevent accidental dismissal
  if (deleteModal.step === 0 || deleteModal.step === 3) {
    closeDeleteModal()
  }
}

function goDeleteStep(step: number) {
  deleteModal.step = step
  if (step !== 1) stopTimer()
}

// ── Timer ──────────────────────────────────────────────────────────────────
function startTimer() {
  stopTimer()
  deleteModal.timerSeconds = 299
  timerInterval = setInterval(() => {
    if (deleteModal.timerSeconds <= 0) { stopTimer(); return }
    deleteModal.timerSeconds--
  }, 1000)
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null }
}

onBeforeUnmount(() => stopTimer())

// ── OTP input helpers ──────────────────────────────────────────────────────
function onOtpInput(index: number, event: Event) {
  const val = (event.target as HTMLInputElement).value.replace(/\D/g, '')
  deleteModal.otpDigits[index] = val.slice(-1)
  deleteModal.errors.otp = ''
  if (val && index < 4) {
    nextTick(() => otpRefs.value[index + 1]?.focus())
  }
}

function onOtpKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !deleteModal.otpDigits[index] && index > 0) {
    nextTick(() => otpRefs.value[index - 1]?.focus())
  }
}

function onOtpPaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text').replace(/\D/g, '').slice(0, 5) ?? ''
  text.split('').forEach((char, i) => { deleteModal.otpDigits[i] = char })
  nextTick(() => {
    const focusIdx = Math.min(text.length, 5)
    otpRefs.value[focusIdx]?.focus()
  })
}

async function resendOtp() {
  // TODO: call your resend-OTP API here
  deleteModal.otpDigits = ['', '', '', '', '', '']
  deleteModal.errors.otp = ''
  startTimer()
  nextTick(() => otpRefs.value[0]?.focus())
  toast.success('A new code has been sent to your email.')
}

async function doPasswordStep() {
  if (!deleteModal.password.trim()) {
    deleteModal.errors.password = 'Please enter your password.'
    return
  }
  if (!selectedCompanyId.value) {
    deleteModal.errors.password = 'Organization context missing. Please refresh.'
    return
  }

  deleteModal.loading = true
  try {
    await request({
      url: `profile/company/${selectedCompanyId.value}/verify-password`,
      method: 'POST',
      data: { password: deleteModal.password },
    })
    deleteModal.errors.password = ''
    deleteModal.loading = false
    goDeleteStep(1)
    startTimer()
    nextTick(() => otpRefs.value[0]?.focus())
    toast.info('A verification code has been sent to your email.')
  } catch (err: any) {
    deleteModal.loading = false
    deleteModal.errors.password =
      err?.response?.data?.message ?? 'Incorrect password. Please try again.'
  }
}

async function doConfirmStep() {
  if (deleteModal.confirmName !== orgName.value) {
    deleteModal.errors.confirmName = 'Name does not match. Check capitalization and spacing.'
    return
  }
  if (!selectedCompanyId.value) {
    deleteModal.errors.confirmName = 'Organization context missing. Please refresh.'
    return
  }

  deleteModal.loading = true
  try {
    await request({
      url: `profile/company/${selectedCompanyId.value}/confirm-delete`,
      method: 'POST',
      data: { otp: deleteModal.otpDigits.join('') },
    })
    deleteModal.loading = false
    goDeleteStep(3)
    try {
      authStore.clearCompany()
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      await queryClient.invalidateQueries({ queryKey: ['profile'] })
    } catch { /* non-critical */ }
  } catch (err: any) {
    deleteModal.loading = false
    const msg = err?.response?.data?.message || err?.message || 'Failed to delete organization'
    deleteModal.errors.confirmName = msg
    toast.error(msg)
  }
}
async function doOtpStep() {
  const code = deleteModal.otpDigits.join('')
  if (code.length < 5) {
    deleteModal.errors.otp = 'Please enter all 5 digits.'
    return
  }
  // Just move forward — OTP will be submitted at the final step
  stopTimer()
  goDeleteStep(2)
}

</script>