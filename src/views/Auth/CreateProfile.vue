<template>
  <AuthLayout
    :steps="stepLabels"
    :activeStep="displayStep"
    :showSteps="activeStep !== 6 && !associatedCompany"
  >
    <template #form>
      <div class="max-w-125 mx-auto w-full min-h-full py-5 flex flex-col justify-center">

        <!-- ═══════════════════════════════════════════════════════
             LOCKED STATE — Email associated with an existing company
        ════════════════════════════════════════════════════════════ -->
        <div v-if="associatedCompany" class="flex items-center justify-center min-h-full">
          <div class="w-full max-w-md">

            <!-- Card -->
            <div
              class="relative rounded-2xl border overflow-hidden"
              style="background: var(--bg-card); border-color: var(--border);"
            >
              <!-- Gradient accent stripe at the top -->
              <div class="h-1.5 w-full" style="background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 50%, #7c3aed));"></div>

              <div class="p-8 space-y-6">

                <!-- Icon + heading -->
                <div class="flex flex-col items-center text-center space-y-4">
                  <!-- Animated shield / lock icon -->
                  <div
                    class="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style="background: color-mix(in srgb, var(--accent) 12%, transparent); border: 1.5px solid color-mix(in srgb, var(--accent) 25%, transparent);"
                  >
                    <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" style="color: var(--accent);">
                      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
                      <rect x="9" y="11" width="6" height="5" rx="1" stroke="currentColor" stroke-width="1.4"/>
                      <path d="M12 11V9a1.5 1.5 0 013 0v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                    </svg>
                  </div>

                  <div class="space-y-1.5">
                    <h2 class="text-[22px] font-bold tracking-tight" style="color: var(--text-primary);">Your email is already associated with an organization</h2>
                    <p class="text-sm leading-relaxed max-w-xs mx-auto" style="color: var(--text-secondary);">
                      This email address is associated with an existing organisation on Orchit AI. You cannot create a new company while this association is active.
                    </p>
                  </div>
                </div>

                <!-- Company card -->
                <div
                  class="flex items-center gap-4 rounded-xl px-4 py-4 border"
                  style="background: var(--bg-surface); border-color: var(--border);"
                >
                  <!-- Company logo or initials -->
                  <div
                    class="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center overflow-hidden text-white font-bold text-base"
                    style="background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #7c3aed));"
                  >
                    <img
                      v-if="associatedCompany.logo"
                      :src="associatedCompany.logo"
                      :alt="associatedCompany.title"
                      class="w-full h-full object-cover"
                    />
                    <span v-else>{{ associatedCompany.title?.charAt(0)?.toUpperCase() || '?' }}</span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-text-primary truncate">{{ associatedCompany.title }}</p>
                    <p class="text-xs mt-0.5 truncate" style="color: var(--text-secondary);">
                      <span class="font-mono">{{ associatedCompany.slug }}</span>.streamed.space
                    </p>
                  </div>

                  <!-- Locked badge -->
                  <span
                    class="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                    style="background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);"
                  >Associated</span>
                </div>

                <!-- Info banner -->
                <div
                  class="flex items-start gap-3 rounded-xl px-4 py-3.5 border"
                  style="background: color-mix(in srgb, #f59e0b 6%, transparent); border-color: color-mix(in srgb, #f59e0b 25%, transparent);"
                >
                  <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #f59e0b;">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                    <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                  <p class="text-xs leading-relaxed" style="color: #f59e0b;">
                    We've notified the admin of <strong>{{ associatedCompany.title }}</strong>. If they approve, you'll be added to their organisation. Check back after receiving a confirmation email.
                  </p>
                </div>

                <!-- What happens next -->
                <div class="space-y-3">
                  <p class="text-[11px] font-bold uppercase tracking-wider" style="color: var(--text-secondary);">What happens next?</p>
                  <div class="space-y-2">
                    <div v-for="(step, idx) in [
                      { icon: 'M3 8l2 2 4-4', label: 'A notification has been sent to the admin of ' + associatedCompany.title },
                      { icon: 'M8 4v8M4 8h8', label: 'The admin reviews your request and can add you to their workspace' },
                      { icon: 'M5 8l2 2 4-4', label: 'Once accepted, you will receive an email with access instructions' },
                    ]" :key="idx" class="flex items-start gap-3">
                      <div
                        class="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
                        style="background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent);"
                      >{{ idx + 1 }}</div>
                      <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">{{ step.label }}</p>
                    </div>
                  </div>
                </div>

                <!-- Sign out action -->
                <button
                  type="button"
                  class="w-full flex cursor-pointer items-center justify-center gap-2 py-3 rounded-[9px] text-sm font-semibold border transition-all duration-200 hover:opacity-80"
                  style="border-color: var(--border); background: transparent; color: var(--text-secondary);"
                  @click="authStore.logout(); router.push('/login')"
                >
                  <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 5l3 3-3 3M13 8H6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Sign out and use a different account
                </button>

              </div>
            </div>

          </div>
        </div>

        <!-- Normal onboarding steps (hidden when locked) -->
        <template v-if="!associatedCompany">

        <!-- ═══════════════════════════════════════════════════════
             STEP 1 — How will you use Orchit AI?
        ════════════════════════════════════════════════════════════ -->
        <div v-show="activeStep === 1">
          <div class="mb-6 md:mb-12 space-y-2">
            <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary">
              How will you use Orchit AI?
            </h2>
            <p class="text-[14px] md:text-base sm:text-nowrap font-medium text-text-secondary">
              This will help us personalize your experience in Orchit AI.
            </p>
          </div>



          <!-- Scenario 4: education email mandatory banner -->
          <div
            v-if="isEducationEmail"
            class="mb-6 p-5 rounded-2xl border flex items-start gap-4 shadow-sm"
            style="background: color-mix(in srgb, #6366f1 10%, transparent); border-color: color-mix(in srgb, #6366f1 25%, transparent);"
          >
            <div class="w-10 h-10 rounded-xl bg-bg-card flex items-center justify-center shrink-0 border" style="border-color: #6366f1;">
               <i class="fa-solid fa-graduation-cap text-[#6366f1] text-lg"></i>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-bold text-[#6366f1]">Academic Domain Detected</h3>
              <p class="text-xs text-text-secondary mt-1 leading-relaxed">
                Your email (<strong>{{ userEmailDomain }}</strong>) is recognized as an educational domain. You must create a <strong>School</strong> profile to continue.
              </p>
              <button 
                type="button" 
                @click="authStore.logout(); router.push('/login')"
                class="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6366f1] hover:opacity-70 transition-opacity"
              >
                <i class="fa-solid fa-right-from-bracket"></i>
                Use a different email
              </button>
            </div>
          </div>

          <div class="how_help_steps grid sm:grid-cols-3 gap-4">
            <label
              v-for="option in options"
              :key="option._id"
              @click.prevent="handleOptionClick(option._id)"
              class="group border rounded-xl py-4 px-2.5 transition-all duration-200 ease-out sm:aspect-square cursor-pointer hover:shadow-md hover:-translate-y-1 hover:border-accent/50 hover:bg-accent/5 active:scale-[0.98]"
              :class="optionClass(option._id)"
            >
              <input type="radio" class="hidden" :checked="selected === option._id" />
              <div class="flex flex-col items-center">
                <img :src="option.icon" class="w-12 h-12 transition-transform duration-200 group-hover:scale-110" />
                <h3 class="font-medium text-sm text-text-primary mt-4">{{ option.title }}</h3>
                <p class="text-[11px] text-text-secondary mt-2 text-center">{{ option.description }}</p>
                <span
                  v-if="mandatoryOptionId === option._id && !isGenericEmail"
                  class="mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  :style="{
                    background: isEducationEmail ? 'color-mix(in srgb, #6366f1 15%, transparent)' : 'color-mix(in srgb, var(--accent) 15%, transparent)',
                    color: isEducationEmail ? '#6366f1' : 'var(--accent)'
                  }"
                >
                  Mandatory
                </span>
              </div>
            </label>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 2 — About Company / You / School
        ════════════════════════════════════════════════════════════ -->
        <div class="space-y-2 mb-6 md:mb-12" v-show="activeStep === 2">
          <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-if="selected === 'team'">
            Tell us about your company
          </h2>
          <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-if="selected === 'personal'">
            Tell us about yourself
          </h2>
          <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-if="selected === 'school'">
            Tell us about your School
          </h2>
          <p class="text-[14px] md:text-base sm:text-nowrap font-medium text-text-secondary">
            This will help us personalize your experience in Orchit AI.
          </p>
        </div>

        <div class="space-y-6" v-show="activeStep === 2 && selected === 'team'">
          <BaseTextField ref="teamRef" v-model="team" label="Company Name" placeholder="Company name" size="lg" :error="!!errors.team" :message="errors.team" />
          <BaseSelectField ref="roleRef" v-model="role" label="What role do you perform in your company?" :options="staticRolesList" placeholder="Select Role" size="lg" :error="!!errors.role" :message="errors.role" />
          <BaseSelectField ref="companySizeRef" v-model="companySize" label="What's your company size?" :options="companySizeOptions" placeholder="Select Company size" size="lg" :error="!!errors.companySize" :message="errors.companySize" />
        </div>

        <div class="space-y-6" v-show="activeStep === 2 && selected === 'personal'">
          <BaseTextField v-model="personalRole" label="What do you do?" placeholder="e.g. Frontend Developer, Student, Designer" size="lg" :error="!!errors.personalRole" :message="errors.personalRole" />
        </div>

        <div class="space-y-6" v-show="activeStep === 2 && selected === 'school'">
          <BaseTextField v-model="schoolName" label="School / University Name" placeholder="e.g. University of Punjab" size="lg" :error="!!errors.schoolName" :message="errors.schoolName" />
          <BaseSelectField v-model="educationLevel" label="Education Level" :options="educationOptions" placeholder="Select level" size="lg" :error="!!errors.educationLevel" :message="errors.educationLevel" />
          <BaseSelectField v-model="role" label="What is your role in school?" :options="staticRolesList" placeholder="Select Role" size="lg" :error="!!errors.role" :message="errors.role" />
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 3 — What would you like to manage?
        ════════════════════════════════════════════════════════════ -->
        <div v-show="activeStep === 3" class="space-y-6">
          <div class="space-y-2">
            <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary">
              What would you like to manage?
            </h2>
            <p class="text-[14px] md:text-base font-medium text-text-secondary">
              You can select multiple options. This helps us personalize your workspace.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button
              v-for="module in activeModules"
              :key="module.id"
              type="button"
              @click="toggleModule(module.id)"
              class="px-4 py-2 rounded-full border text-sm cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-sm"
              :class="selectedModules.includes(module.id)
                ? 'bg-accent/30 border-accent text-text-primary hover:bg-accent/40'
                : 'border-border text-text-secondary hover:border-accent hover:text-text-primary hover:bg-accent/10'"
            >
              {{ module.label }}
            </button>
          </div>
          <p v-if="errors.selectedModules" class="text-xs text-red-500">{{ errors.selectedModules }}</p>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 4 — What kind of work do you do?
        ════════════════════════════════════════════════════════════ -->
        <div v-if="activeStep === 4">
          <div class="space-y-2 mb-6">
            <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">What kind of work do you do?</h2>
            <p class="text-text-secondary text-sm md:text-base">This helps us tailor your workspace experience.</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <button
              v-for="item in workTypeOptions"
              :key="item.id"
              @click="workType = item.id"
              type="button"
              class="flex items-center gap-3 p-4 rounded-xl cursor-pointer border text-left transition-all duration-200 hover:shadow-sm hover:scale-[1.02]"
              :class="workType === item.id ? 'bg-accent/30 border-accent' : 'border-border hover:border-accent hover:bg-accent/10'"
            >
              <FontAwesomeIcon :icon="['fas', item.icon]" class="text-lg text-text-primary transition-colors duration-200" />
              <span class="text-sm font-medium text-text-primary">{{ item.label }}</span>
            </button>
          </div>
          <p v-if="errors.workType" class="text-xs text-red-500 mt-2">{{ errors.workType }}</p>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 5 — Create your site
             ─────────────────────────────────────────────────────
             Scenario 1 (personal): never reaches here
             Scenario 2 (gmail team/school): subdomain OR custom domain toggle
             Scenario 3 (company email any type): subdomain only + auto-verified banner
        ════════════════════════════════════════════════════════════ -->
        <div v-if="activeStep === 5" class="flex items-center justify-center w-full min-h-full py-3">
          <div class="w-full max-w-115">
            <div class="rounded-2xl border p-8 md:p-10 space-y-7" style="background: var(--bg-card); border-color: var(--border);">

              <div class="text-center space-y-3">
                <div class="w-14 h-14 rounded-[14px] border flex items-center justify-center mx-auto" style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.2);">
                  <img src="/src/assets/global/favicon.png" alt="logo" />
                </div>
                <h2 class="text-[22px] font-bold tracking-tight" style="color: var(--text-primary);">Create your workspace</h2>
                <p class="text-sm leading-relaxed max-w-80 mx-auto" style="color: var(--text-secondary);">
                  Set up your team's home. You can always change these settings later.
                </p>
              </div>

              <!-- Scenario 3: domain auto-detected banner -->
              <div
                v-if="isCompanyEmail"
                class="flex items-start gap-3 rounded-xl px-4 py-3.5 border"
                style="background: color-mix(in srgb, #1d9e75 8%, transparent); border-color: color-mix(in srgb, #1d9e75 25%, transparent);"
              >
                <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <p class="text-sm leading-relaxed" style="color: #1d9e75;">
                  Your company domain <strong>{{ userEmailDomain }}</strong> is auto-detected. No custom domain setup or super-admin verification needed.
                </p>
              </div>

              <!-- Scenario 2: MODE SWITCH toggle (generic email only) -->
             <button
  v-if="!isCompanyEmail"
  type="button"
  class="group w-full flex items-center justify-between cursor-pointer gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-300 text-left hover:scale-[1.01] hover:shadow-lg active:scale-[0.99]"
  :style="{
    borderColor: hasCustomDomain ? 'var(--accent)' : 'var(--border)',
    background: hasCustomDomain
      ? 'color-mix(in srgb, var(--accent) 10%, var(--bg-surface))'
      : 'var(--bg-surface)',
    boxShadow: hasCustomDomain
      ? '0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent)'
      : 'none',
  }"
  @click="toggleCustomDomain"
>
  <!-- Left Content -->
  <div class="flex-1 min-w-0">
    <div class="flex items-center gap-2 mb-1">
      <div
        class="w-2.5 h-2.5 rounded-full transition-all duration-300"
        :style="{
          background: hasCustomDomain
            ? 'var(--accent)'
            : 'var(--text-secondary)',
          boxShadow: hasCustomDomain
            ? '0 0 10px color-mix(in srgb, var(--accent) 60%, transparent)'
            : 'none',
        }"
      />

      <p
        class="text-sm font-semibold transition-colors duration-300"
        :style="{
          color: hasCustomDomain
            ? 'var(--accent)'
            : 'var(--text-primary)',
        }"
      >
        {{
          hasCustomDomain
            ? 'I have a custom domain'
            : "I don't have a custom domain"
        }}
      </p>
    </div>

    <p
      class="text-xs transition-opacity duration-300 group-hover:opacity-100 opacity-80"
      style="color: var(--text-secondary);"
    >
      {{
        hasCustomDomain
          ? 'Use your own branded domain for streaming'
          : 'Use a free .streamed.space subdomain'
      }}
    </p>
  </div>

  <!-- Toggle -->
  <div
    class="relative w-12 h-7 rounded-full border-2 flex items-center px-0.5 transition-all duration-300 shrink-0"
    :style="{
      borderColor: hasCustomDomain ? 'var(--accent)' : 'var(--border)',
      background: hasCustomDomain
        ? 'var(--accent)'
        : 'transparent',
    }"
  >
    <div
      class="w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300"
      :style="{
        transform: hasCustomDomain
          ? 'translateX(20px)'
          : 'translateX(0px)',
      }"
    />
  </div>
</button>

              <!-- SUBDOMAIN MODE: shown for Scenario 3 always, Scenario 2 when hasCustomDomain===false -->
              <div class="space-y-5" v-if="!hasCustomDomain && !isCompanyEmail">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Site name</label>
                  <div
                    class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px]"
                    :style="{
                      borderColor: isFocused && isSlugAvailable ? 'var(--accent)'
                                 : isFocused && isAnyUnavailable ? '#e55050'
                                 : 'var(--border-input)',
                      background: 'var(--bg-input)',
                    }"
                  >
                    <input
                      v-model="siteName"
                      type="text"
                      placeholder="e.g. acme, my-team"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                      @focus="isFocused = true"
                      @blur="isFocused = false"
                      style="color: var(--text-primary);"
                    />
                    <div class="flex items-center px-3.5 border-l" style="background: var(--bg-surface); border-color: var(--border);">
                      <span class="text-[13px] font-semibold" style="color: var(--text-secondary);">.streamed.space</span>
                    </div>
                  </div>
                  <p v-if="isCheckingSlug" class="text-xs" style="color: var(--text-secondary);">Checking availability…</p>
                  <p v-else-if="isSlugAvailable === true && isDnsAvailable === true" class="text-xs" style="color: #1d9e75;">{{ siteSlug }}.streamed.space is available</p>
                  <p v-else-if="isSlugAvailable === true && isCheckingDns" class="text-xs" style="color: var(--text-secondary);">Verifying domain…</p>
                  <p v-else-if="isSlugAvailable === true && isDnsAvailable === false" class="text-xs" style="color: #e55050;">Domain check failed — please try a different name.</p>
                  <p v-else-if="isSlugAvailable === false" class="text-xs" style="color: #e55050;">This site name is already taken.</p>
                </div>
                <div
                  v-if="siteSlug && isSlugAvailable === true && isDnsAvailable === true"
                  class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 border"
                  style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.18);"
                >
                  <span class="text-[13px] font-semibold" style="color: var(--accent);">https://{{ siteSlug }}.streamed.space</span>
                </div>
              </div>

              <!-- CUSTOM DOMAIN MODE (Scenario 2 only) -->
              <div v-else-if="hasCustomDomain" class="space-y-5">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Custom domain</label>
                  <div
                    class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px]"
                    :style="{
                      borderColor: isDnsAvailable === true ? '#1d9e75' : isDnsNotRegistered ? '#f59e0b' : isDnsAvailable === false ? '#e55050' : 'var(--border-input)',
                      background: 'var(--bg-input)',
                    }"
                  >
                    <input
                      v-model="dnsInput"
                      type="text"
                      placeholder="e.g. mycompany.com"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                      style="color: var(--text-primary);"
                    />
                  </div>
                  <p v-if="dnsValidationError" class="text-xs" style="color: #e55050;">{{ dnsValidationError }}</p>
                  <p v-else-if="isCheckingDns" class="text-xs" style="color: var(--text-secondary);">Checking DNS availability…</p>
                  <p v-else-if="isDnsAvailable === true" class="text-xs" style="color: #1d9e75;">{{ dnsInput }} is active and ready</p>
                  <!-- NOT_REGISTERED: domain available for purchase -->
                  <div
                    v-else-if="isDnsNotRegistered"
                    class="flex items-start gap-3 rounded-xl px-4 py-3.5 border mt-1.5"
                    style="background: color-mix(in srgb, #f59e0b 6%, transparent); border-color: color-mix(in srgb, #f59e0b 25%, transparent);"
                  >
                    <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #f59e0b;">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                      <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                    </svg>
                    <div class="flex-1 space-y-2.5">
                      <p class="text-xs leading-relaxed" style="color: #f59e0b;">
                        <strong>{{ dnsInput.trim() }}</strong> is not registered yet. You can purchase it from one of these registrars:
                      </p>
                      <div class="flex flex-wrap gap-2">
                        <a
                          v-for="r in domainRegistrars"
                          :key="r.name"
                          :href="r.getUrl(dnsInput.trim())"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all duration-200 hover:scale-[1.03] hover:shadow-sm cursor-pointer"
                          style="background: var(--bg-surface); border-color: var(--border); color: var(--text-primary);"
                        >
                          {{ r.name }}
                          <svg class="w-3 h-3" viewBox="0 0 12 12" fill="none" style="color: var(--text-secondary);"><path d="M3.5 8.5l5-5M8.5 3.5H5M8.5 3.5V7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </a>
                      </div>
                    </div>
                  </div>
                  <!-- Generic DNS error (registered but inactive, or other errors) -->
                  <p v-else-if="isDnsAvailable === false" class="text-xs" style="color: #e55050;">{{ dnsError || 'Domain not available or inactive' }}</p>
                </div>

                <div
                  v-if="isDnsAvailable === true"
                  class="flex items-start gap-3 rounded-xl px-4 py-3.5 border"
                  style="background: color-mix(in srgb, var(--accent) 6%, transparent); border-color: color-mix(in srgb, var(--accent) 20%, transparent);"
                >
                  <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: var(--accent);">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                    <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                  <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">
                    Next you'll verify a super admin email at <strong style="color: var(--text-primary);">@{{ dnsInput }}</strong>, then verify domain ownership via DNS.
                  </p>
                </div>
              </div>

              <!-- Scenario 3 (company email): show subdomain input using company name as slug -->
              <div v-else-if="isCompanyEmail" class="space-y-5">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Site name</label>
                  <div
                    class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px]"
                    :style="{
                      borderColor: isFocused ? 'var(--accent)' : 'var(--border-input)',
                      background: 'var(--bg-input)',
                    }"
                  >
                    <input
                      v-model="siteName"
                      type="text"
                      placeholder="e.g. acme, my-team"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                      @focus="isFocused = true"
                      @blur="isFocused = false"
                      style="color: var(--text-primary);"
                    />
                    <div class="flex items-center px-3.5 border-l" style="background: var(--bg-surface); border-color: var(--border);">
                      <span class="text-[13px] font-semibold" style="color: var(--text-secondary);">.streamed.space</span>
                    </div>
                  </div>
                  <p v-if="isCheckingSlug" class="text-xs" style="color: var(--text-secondary);">Checking availability…</p>
                  <p v-else-if="isSlugAvailable === true" class="text-xs" style="color: #1d9e75;">{{ siteSlug }}.streamed.space is available</p>
                  <p v-else-if="isSlugAvailable === false" class="text-xs" style="color: #e55050;">This site name is already taken.</p>
                </div>
                <div
                  v-if="siteSlug && isSlugAvailable === true"
                  class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 border"
                  style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.18);"
                >
                  <span class="text-[13px] font-semibold" style="color: var(--accent);">https://{{ siteSlug }}.streamed.space</span>
                </div>
              </div>

              <button
                type="button"
                :disabled="isCreateSiteDisabled"
                class="w-full flex items-center justify-center gap-2 cursor-pointer py-3 rounded-[9px] font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style="background: var(--accent); color: var(--accent-text);"
                @click="continueSiteHandler"
              >
                <span v-if="creatingProfile" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>{{ hasCustomDomain ? `Continue with ${dnsInput}` : 'Create site' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 51 — Super Admin Verification
             ONLY for Scenario 2 (gmail + team/school + custom domain)
        ════════════════════════════════════════════════════════════ -->
        <div v-if="activeStep === 51" class="flex items-center justify-center w-full min-h-full py-3">
          <div class="w-full max-w-115">
            <div class="rounded-2xl border p-8 md:p-10 space-y-7" style="background: var(--bg-card); border-color: var(--border);">

              <div class="text-center space-y-3">
                <div
                  class="w-14 h-14 rounded-[14px] border flex items-center justify-center mx-auto"
                  style="background: color-mix(in srgb, var(--accent) 12%, transparent); border-color: color-mix(in srgb, var(--accent) 25%, transparent);"
                >
                  <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" style="color: var(--accent);">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <path d="M17 11l1.5 1.5L21 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h2 class="text-[22px] font-bold tracking-tight" style="color: var(--text-primary);">Verify Super Admin</h2>
                <p class="text-sm leading-relaxed max-w-80 mx-auto" style="color: var(--text-secondary);">
                  Enter a name for the super admin at your custom domain <strong style="color: var(--text-primary);">@{{ dnsInput.trim() }}</strong>. We'll send a 5-digit OTP to verify ownership.
                </p>
              </div>

              <div
                class="flex items-start gap-3 rounded-xl px-4 py-3.5 border"
                style="background: color-mix(in srgb, var(--accent) 6%, transparent); border-color: color-mix(in srgb, var(--accent) 20%, transparent);"
              >
                <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: var(--accent);">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">
                  This person will be the super admin of your organization. The full email will be <strong style="color: var(--text-primary);">{{ superAdminEmailPrefix.trim() || 'name' }}@{{ dnsInput.trim() }}</strong>.
                </p>
              </div>

              <div v-if="!superAdminOtpSent" class="space-y-4">
                <!-- Super Admin Name -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Super Admin Name</label>
                  <div
                    class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-colors"
                    :style="{
                      borderColor: superAdminNameError ? '#e55050' : superAdminNameFocused ? 'var(--accent)' : 'var(--border-input)',
                      background: 'var(--bg-input)',
                    }"
                  >
                    <input
                      v-model="superAdminName"
                      type="text"
                      placeholder="Enter Super admin name"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                      style="color: var(--text-primary);"
                      @focus="superAdminNameFocused = true"
                      @blur="superAdminNameFocused = false"
                    />
                  </div>
                  <p v-if="superAdminNameError" class="text-xs" style="color: #e55050;">{{ superAdminNameError }}</p>
                </div>

                <!-- FIX 5: Email prefix input — user types only the part before @domain -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Super Admin Email</label>
                  <div
                    class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-colors"
                    :style="{
                      borderColor: superAdminEmailError ? '#e55050' : superAdminEmailFocused ? 'var(--accent)' : 'var(--border-input)',
                      background: 'var(--bg-input)',
                    }"
                  >
                    <input
                      v-model="superAdminEmailPrefix"
                      type="text"
                      placeholder="admin"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                      style="color: var(--text-primary);"
                      @focus="superAdminEmailFocused = true"
                      @blur="superAdminEmailFocused = false"
                      @keyup.enter="sendSuperAdminOtp"
                    />
                    <!-- Fixed @domain suffix -->
                    <div class="flex items-center px-3.5 border-l shrink-0" style="background: var(--bg-surface); border-color: var(--border);">
                      <span class="text-[13px] font-semibold select-none" style="color: var(--text-secondary);">@{{ dnsInput.trim() }}</span>
                    </div>
                  </div>
                  <p v-if="superAdminEmailError" class="text-xs" style="color: #e55050;">{{ superAdminEmailError }}</p>
                </div>

                <!-- Super Admin Password -->
                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Super Admin Password</label>
                  <div
                    class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-colors"
                    :style="{
                      borderColor: superAdminPasswordError ? '#e55050' : superAdminPasswordFocused ? 'var(--accent)' : 'var(--border-input)',
                      background: 'var(--bg-input)',
                    }"
                  >
                    <input
                      v-model="superAdminPassword"
                      type="password"
                      placeholder="*****"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                      style="color: var(--text-primary);"
                      @focus="superAdminPasswordFocused = true"
                      @blur="superAdminPasswordFocused = false"
                      @keyup.enter="sendSuperAdminOtp"
                    />
                  </div>
                  <p v-if="superAdminPasswordError" class="text-xs" style="color: #e55050;">{{ superAdminPasswordError }}</p>
                </div>

                <button
                  type="button"
                  :disabled="isSendingOtp || !superAdminEmailPrefix.trim()"
                  class="w-full flex items-center justify-center gap-2 cursor-pointer py-3 rounded-[9px] font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style="background: var(--accent); color: var(--accent-text);"
                  @click="sendSuperAdminOtp"
                >
                  <span v-if="isSendingOtp" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>{{ isSendingOtp ? 'Sending OTP…' : 'Send Verification Code' }}</span>
                </button>
              </div>

              <div v-else class="space-y-5">
                <div class="text-center space-y-1">
                  <p class="text-sm font-semibold" style="color: var(--text-primary);">
                    Code sent to <span style="color: var(--accent);">{{ superAdminEmail }}</span>
                  </p>
                  <p class="text-xs" style="color: var(--text-secondary);">Enter the 5-digit code below</p>
                </div>

                <div class="flex items-center justify-center gap-3">
                  <input
                    v-for="(_, idx) in 5"
                    :key="idx"
                    :ref="el => { if (el) otpInputRefs[idx] = el }"
                    v-model="otpDigits[idx]"
                    type="text"
                    inputmode="numeric"
                    maxlength="1"
                    class="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200 bg-transparent"
                    :style="{
                      borderColor: otpError ? '#e55050' : otpDigits[idx] ? 'var(--accent)' : 'var(--border-input)',
                      color: 'var(--text-primary)',
                      background: otpDigits[idx] ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--bg-input)',
                    }"
                    @input="onOtpInput(idx, $event)"
                    @keydown="onOtpKeydown(idx, $event)"
                    @paste="onOtpPaste($event)"
                  />
                </div>

                <p v-if="otpError" class="text-xs text-center" style="color: #e55050;">{{ otpError }}</p>

                <button
                  type="button"
                  :disabled="isVerifyingOtp || otpDigits.join('').length !== 5"
                  class="w-full flex items-center justify-center gap-2 cursor-pointer py-3 rounded-[9px] font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style="background: var(--accent); color: var(--accent-text);"
                  @click="verifySuperAdminOtp"
                >
                  <span v-if="isVerifyingOtp" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>{{ isVerifyingOtp ? 'Verifying…' : 'Verify & Continue' }}</span>
                </button>

                <div class="text-center">
                  <p class="text-xs" style="color: var(--text-secondary);">
                    Didn't receive the code?
                    <button
                      v-if="otpResendCountdown === 0"
                      type="button"
                      class="font-semibold ml-1 transition-opacity hover:opacity-70"
                      style="color: var(--accent);"
                      @click="resendSuperAdminOtp"
                      :disabled="isSendingOtp"
                    >
                      Resend
                    </button>
                    <span v-else class="ml-1 font-semibold" style="color: var(--text-secondary);">
                      Resend in {{ otpResendCountdown }}s
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 6 — Loading / provisioning
        ════════════════════════════════════════════════════════════ -->
        <div v-if="activeStep === 6" class="flex items-center justify-center mx-auto">
          <LoadingCreateProfile
            :active="activeStep === 6"
            :abort="!!companySlugError"
            :loading="isLoaderRunning"
            :profileType="selected"
            @complete="onProvisioningComplete"
          />
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 7 — Where did you hear about us?
        ════════════════════════════════════════════════════════════ -->
        <div v-show="activeStep === 7" class="flex items-center justify-center min-h-full">
          <div class="w-full max-w-130 space-y-8">
            <div class="space-y-2 text-center">
              <h2 class="text-[28px] font-semibold text-text-primary">Where did you hear about us?</h2>
              <p class="text-text-secondary text-sm">This helps us improve onboarding experience.</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="item in referralOptions"
                :key="item.id"
                @click="toggleReferral(item.id)"
                type="button"
                class="px-4 py-3 rounded-xl border text-sm cursor-pointer font-medium transition-all duration-200 hover:scale-[1.02] hover:shadow-sm"
                :class="referralSources.includes(item.id)
                  ? 'bg-accent/30 border-accent hover:bg-accent/40'
                  : 'border-border hover:border-accent hover:bg-accent/10 text-text-secondary hover:text-text-primary'"
              >
                {{ item.label }}
              </button>
            </div>
            <div class="flex justify-end items-center">
              <Button :disabled="isAnyMutating" size="md" type="submit" @click="continueHandler">
                <div class="flex items-center gap-2">
                  <span v-if="isAnyMutating" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Continue</span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 8 — Domain Verification
             ONLY for Scenario 2 (gmail + team/school + custom domain)
             Scenario 3 skips this entirely (domain auto-verified)
        ════════════════════════════════════════════════════════════ -->
        <div v-if="activeStep === 8" class="flex items-center justify-center min-h-full">
          <div class="w-full max-w-120 space-y-6">
            <div class="space-y-1.5">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background: color-mix(in srgb, var(--accent) 14%, transparent); border: 1.5px solid color-mix(in srgb, var(--accent) 25%, transparent);">
                  <svg class="w-4.5 h-4.5" viewBox="0 0 20 20" fill="none" style="color: var(--accent);">
                    <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M10 2.5c0 0-3 3.5-3 7.5s3 7.5 3 7.5M10 2.5c0 0 3 3.5 3 7.5s-3 7.5-3 7.5M2.5 10h15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-[22px] font-bold text-text-primary leading-tight">Verify your domain</h2>
                  <p class="text-xs" style="color: var(--text-secondary);">Prove ownership of <strong style="color: var(--text-primary);">{{ dnsInput.trim() }}</strong></p>
                </div>
              </div>
            </div>

            <div v-if="domainPhase === 'idle'" class="rounded-2xl border p-6 space-y-5" style="background: var(--bg-card); border-color: var(--border);">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style="background: color-mix(in srgb, #1d9e75 10%, transparent); border: 1.5px solid color-mix(in srgb, #1d9e75 20%, transparent);">
                  <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" style="color: #1d9e75;"><path d="M10 2l2.24 5.14L18 8.27l-4 3.86.94 5.87L10 15.4l-4.94 2.6.94-5.87-4-3.86 5.76-1.13L10 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-text-primary mb-0.5">Your workspace is ready!</p>
                  <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">
                    Verify your custom domain <strong style="color: var(--text-primary);">{{ dnsInput.trim() }}</strong> to use it as your workspace URL. This step is optional but recommended.
                  </p>
                </div>
              </div>
              <div class="flex gap-3">
                <button
                  type="button"
                  class="flex-1 flex items-center cursor-pointer justify-center gap-2 py-3 rounded-[9px] text-sm font-bold transition-all duration-200"
                  style="background: var(--accent); color: var(--accent-text); box-shadow: 0 2px 0 rgba(0,0,0,0.12);"
                  @click="startDomainVerificationPhase"
                >
                  <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 8l2 2 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Verify my domain
                </button>
                <button
                  type="button"
                  class="flex-1 flex items-center cursor-pointer justify-center gap-2 py-3 rounded-[9px] text-sm font-semibold border transition-all duration-200"
                  style="border-color: var(--border); background: var(--bg-surface); color: var(--text-secondary);"
                  @click="skipDomainVerification"
                >
                  Do this later
                </button>
              </div>
            </div>

            <div v-else-if="domainPhase === 'verify'" class="space-y-4">
              <div class="flex items-center gap-2.5 px-4 py-3 rounded-xl border" style="background: var(--bg-surface); border-color: var(--border);">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" style="color: var(--accent);">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M10 2.5c0 0-3 3.5-3 7.5s3 7.5 3 7.5M10 2.5c0 0 3 3.5 3 7.5s-3 7.5-3 7.5M2.5 10h15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span class="text-sm font-semibold" style="color: var(--text-primary);">{{ dnsInput.trim() }}</span>
                <span class="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" :style="domainStatusStyle">{{ domainStatusLabel }}</span>
                <button v-if="currentDomain?.status !== 'verified'" type="button" class="text-xs font-medium ml-1 transition-opacity hover:opacity-70" style="color: var(--text-secondary);" @click="domainPhase = 'idle'">Cancel</button>
              </div>

              <div v-if="methodSwitched" class="flex items-start gap-3 rounded-lg px-4 py-3 border" style="background: color-mix(in srgb, #f59e0b 8%, transparent); border-color: color-mix(in srgb, #f59e0b 30%, transparent);">
                <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #f59e0b;"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                <p class="text-xs leading-relaxed" style="color: #f59e0b;">Apex domain detected — CNAME is not supported on root domains. We've automatically switched to <strong>TXT verification</strong>.</p>
              </div>

              <div v-if="currentDomain?.status === 'verified'" class="flex items-center gap-3 px-4 py-3 rounded-xl border" style="background: color-mix(in srgb, #1d9e75 8%, transparent); border-color: color-mix(in srgb, #1d9e75 25%, transparent);">
                <span class="flex items-center justify-center w-6 h-6 rounded-full shrink-0" style="background: #1d9e75;">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
                <div>
                  <p class="text-sm font-semibold" style="color: #1d9e75;">Domain verified successfully!</p>
                  <p class="text-xs" style="color: var(--text-secondary);">Your domain ownership has been confirmed.</p>
                </div>
              </div>

              <div v-if="currentDomain?.status !== 'verified'" class="space-y-3">
                <p class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Verification method</p>
                <div class="grid grid-cols-3 gap-2 p-1 rounded-xl" style="background: var(--bg-surface); border: 1px solid var(--border);">
                  <button
                    v-for="m in verificationMethods"
                    :key="m.value"
                    type="button"
                    class="py-2 px-3 rounded-lg text-xs cursor-pointer font-semibold transition-all duration-200 text-center"
                    :style="{
                      background: selectedVerificationMethod === m.value ? 'var(--bg-card)' : 'transparent',
                      color: selectedVerificationMethod === m.value ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: selectedVerificationMethod === m.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }"
                    @click="switchVerificationMethod(m.value)"
                    :disabled="isSwitchingMethod"
                  >
                    {{ m.label }}
                  </button>
                </div>
              </div>

              <div v-if="currentInstructions && currentDomain?.status !== 'verified'" class="space-y-3">
                <template v-if="currentInstructions.method === 'cname' || currentInstructions.method === 'txt'">
                  <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">Add the following DNS record at your DNS host (GoDaddy, Cloudflare, Namecheap, etc.)</p>
                  <div class="rounded-xl overflow-hidden border" style="border-color: var(--border);">
                    <div class="grid grid-cols-2 divide-x" style="background: var(--bg-surface); border-bottom: 1px solid var(--border); divide-color: var(--border);">
                      <div class="px-4 py-2.5"><p class="text-[10px] font-bold uppercase tracking-wider mb-0.5" style="color: var(--text-secondary);">Type</p><p class="text-sm font-bold" style="color: var(--text-primary);">{{ currentInstructions.record_type }}</p></div>
                      <div class="px-4 py-2.5"><p class="text-[10px] font-bold uppercase tracking-wider mb-0.5" style="color: var(--text-secondary);">TTL</p><p class="text-sm font-bold" style="color: var(--text-primary);">{{ currentInstructions.ttl_recommended }}s</p></div>
                    </div>
                    <div class="divide-y" style="divide-color: var(--border);">
                      <div class="px-4 py-3 flex items-center justify-between gap-3">
                        <div class="min-w-0 flex-1"><p class="text-[10px] font-bold uppercase tracking-wider mb-0.5" style="color: var(--text-secondary);">Host / Name</p><p class="text-sm font-mono break-all" style="color: var(--text-primary);">{{ currentInstructions.record_host }}</p></div>
                        <button type="button" @click="copyToClipboard(currentInstructions.record_host, 'host')" class="shrink-0 p-1.5 rounded-lg cursor-pointer transition-all hover:scale-110" style="color: var(--text-secondary);">
                          <svg v-if="copiedField !== 'host'" class="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                          <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                      </div>
                      <div class="px-4 py-3 flex items-center justify-between gap-3">
                        <div class="min-w-0 flex-1"><p class="text-[10px] font-bold uppercase tracking-wider mb-0.5" style="color: var(--text-secondary);">Value / Points to</p><p class="text-sm font-mono break-all" style="color: var(--text-primary);">{{ currentInstructions.record_value }}</p></div>
                        <button type="button" @click="copyToClipboard(currentInstructions.record_value, 'value')" class="shrink-0 p-1.5 rounded-lg cursor-pointer transition-all hover:scale-110" style="color: var(--text-secondary);">
                          <svg v-if="copiedField !== 'value'" class="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                          <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  <p class="text-xs leading-relaxed px-1" style="color: var(--text-secondary);">{{ currentInstructions.note }}</p>
                </template>

                <template v-else-if="currentInstructions.method === 'http'">
                  <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">Upload a verification file to your web server so it's reachable at the URL below.</p>
                  <div class="rounded-xl overflow-hidden border divide-y" style="border-color: var(--border); divide-color: var(--border);">
                    <div class="px-4 py-3 flex items-center justify-between gap-3">
                      <div class="min-w-0 flex-1"><p class="text-[10px] font-bold uppercase tracking-wider mb-0.5" style="color: var(--text-secondary);">File URL</p><p class="text-sm font-mono break-all" style="color: var(--text-primary);">{{ currentInstructions.file_url }}</p></div>
                      <button type="button" @click="copyToClipboard(currentInstructions.file_url, 'file_url')" class="shrink-0 p-1.5 rounded-lg transition-all hover:scale-110" style="color: var(--text-secondary);">
                        <svg v-if="copiedField !== 'file_url'" class="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                        <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                    </div>
                    <div class="px-4 py-3 flex items-center justify-between gap-3">
                      <div class="min-w-0 flex-1"><p class="text-[10px] font-bold uppercase tracking-wider mb-0.5" style="color: var(--text-secondary);">File content</p><p class="text-sm font-mono break-all" style="color: var(--text-primary);">{{ currentInstructions.file_content }}</p></div>
                      <button type="button" @click="copyToClipboard(currentInstructions.file_content, 'file_content')" class="shrink-0 p-1.5 rounded-lg transition-all hover:scale-110" style="color: var(--text-secondary);">
                        <svg v-if="copiedField !== 'file_content'" class="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                        <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                    </div>
                  </div>
                  <button type="button" :disabled="isDownloadingFile" class="w-full flex items-center justify-center gap-2 py-2.5 rounded-[9px] text-sm font-semibold border transition-all duration-200 hover:shadow-sm" style="border-color: var(--border); background: var(--bg-surface); color: var(--text-primary);" @click="downloadVerificationFile">
                    <span v-if="isDownloadingFile" class="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                    <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: var(--accent);"><path d="M8 2v8M5 7l3 3 3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span>Download streamed-verify.txt</span>
                  </button>
                  <p class="text-xs leading-relaxed px-1" style="color: var(--text-secondary);">{{ currentInstructions.note }}</p>
                </template>
              </div>

              <div v-if="currentDomain?.last_check_result?.error && currentDomain?.status !== 'verified'" class="flex items-start gap-3 rounded-lg px-4 py-3 border" style="background: color-mix(in srgb, #e55050 6%, transparent); border-color: color-mix(in srgb, #e55050 25%, transparent);">
                <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #e55050;"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                <div>
                  <p class="text-xs font-semibold mb-0.5" style="color: #e55050;">Verification check failed</p>
                  <p class="text-xs" style="color: var(--text-secondary);">{{ currentDomain?.last_check_result?.error }}</p>
                </div>
              </div>

              <div v-if="retryCountdown > 0 && currentDomain?.status !== 'verified'" class="flex items-center gap-3 px-4 py-3 rounded-xl border" style="background: var(--bg-surface); border-color: var(--border);">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" style="color: var(--text-secondary);"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 4.5v4l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                <p class="text-xs" style="color: var(--text-secondary);">Please wait <span class="font-bold tabular-nums" style="color: var(--text-primary);">{{ retryCountdown }}s</span> before checking again.</p>
                <div class="ml-auto flex-1 max-w-20 h-1 rounded-full overflow-hidden" style="background: var(--border);">
                  <div class="h-full rounded-full transition-all duration-1000" style="background: var(--accent);" :style="{ width: `${(retryCountdown / retryTotal) * 100}%` }" />
                </div>
              </div>

              <div v-if="currentDomain?.status !== 'verified'" class="space-y-2">
                <button type="button" :disabled="isRechecking || retryCountdown > 0" class="w-full flex items-center justify-center cursor-pointer gap-2 py-3 rounded-[9px] text-[15px] font-bold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 hover:shadow-md hover:-translate-y-[1px]" style="background: var(--accent); color: var(--accent-text); box-shadow: 0 2px 0 rgba(0,0,0,0.12);" @click="recheckVerification">
                  <span v-if="isRechecking" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="none"><path d="M20 12a8 8 0 10-3 6.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M20 4v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  <span>{{ isRechecking ? 'Checking…' : "I've added the record — verify now" }}</span>
                </button>
                <button type="button" class="w-full py-2.5 rounded-[9px] cursor-pointer text-sm font-medium border transition-all duration-200 hover:bg-surface hover:text-text-primary hover:border-accent hover:-translate-y-[1px] hover:shadow-sm" style="border-color: var(--border); background: transparent; color: var(--text-secondary);" @click="skipDomainVerification">Skip for now</button>
              </div>

              <div v-if="currentDomain?.status === 'verified'" class="space-y-3">
                <button v-if="!currentDomain.is_primary" type="button" :disabled="isSettingPrimary" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-left" style="border-color: var(--border); background: var(--bg-surface);" @click="setPrimaryDomain">
                  <svg class="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="none" style="color: #f59e0b;"><path d="M10 2l2.24 5.14L18 8.27l-4 3.86.94 5.87L10 15.4l-4.94 2.6.94-5.87-4-3.86 5.76-1.13L10 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                  <div class="flex-1"><p class="text-sm font-semibold" style="color: var(--text-primary);">Set as primary domain</p><p class="text-xs" style="color: var(--text-secondary);">Use {{ dnsInput.trim() }} as your main workspace URL</p></div>
                  <span v-if="isSettingPrimary" class="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                </button>
                <div v-else class="flex items-center gap-2 px-4 py-2.5 rounded-xl" style="background: color-mix(in srgb, #f59e0b 10%, transparent); border: 1px solid color-mix(in srgb, #f59e0b 25%, transparent);">
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="#f59e0b"><path d="M10 2l2.24 5.14L18 8.27l-4 3.86.94 5.87L10 15.4l-4.94 2.6.94-5.87-4-3.86 5.76-1.13L10 2z"/></svg>
                  <p class="text-xs font-semibold" style="color: #f59e0b;">Primary domain</p>
                </div>
                <button type="button" class="w-full flex items-center justify-center gap-2 py-3 rounded-[9px] text-[15px] font-bold tracking-wide transition-all duration-200" style="background: var(--accent); color: var(--accent-text); box-shadow: 0 2px 0 rgba(0,0,0,0.12);" @click="proceedToEnrolUsers">
                  Continue — Enrol users
                  <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
              <p v-if="recheckError" class="text-xs text-center" style="color: #e55050;">{{ recheckError }}</p>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 9 — Enrol Domain Users
        ════════════════════════════════════════════════════════════ -->
        <div v-if="activeStep === 9 && !isCompanyEmail" class="flex items-center justify-center min-h-full">
          <div class="w-full max-w-130 space-y-6">
            <div class="space-y-1.5">
              <h2 class="text-[24px] lg:text-[28px] font-bold text-text-primary">
                {{ selected === 'school' ? 'Add classmates to your workspace' : 'Add team members to your workspace' }}
              </h2>
              <p class="text-sm leading-relaxed" style="color: var(--text-secondary);">
                These users were found under <strong style="color: var(--text-primary);">{{ claimDomain }}</strong>. Select who you'd like to enrol.
              </p>
            </div>

            <div v-if="isLoadingDomainUsers" class="space-y-3">
              <div v-for="i in 4" :key="i" class="flex items-center gap-3 px-4 py-3.5 rounded-xl border animate-pulse" style="border-color: var(--border); background: var(--bg-card);">
                <div class="w-4 h-4 rounded shrink-0" style="background: var(--bg-surface);" />
                <div class="w-9 h-9 rounded-full shrink-0" style="background: var(--bg-surface);" />
                <div class="flex-1 space-y-1.5"><div class="h-3 rounded w-32" style="background: var(--bg-surface);" /><div class="h-2.5 rounded w-48" style="background: var(--bg-surface);" /></div>
              </div>
            </div>

            <div v-else-if="domainUsersError" class="flex items-start gap-3 px-4 py-4 rounded-xl border" style="background: color-mix(in srgb, #e55050 6%, transparent); border-color: color-mix(in srgb, #e55050 25%, transparent);">
              <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #e55050;"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
              <div class="flex-1">
                <p class="text-xs font-semibold mb-0.5" style="color: #e55050;">Failed to load users</p>
                <p class="text-xs" style="color: var(--text-secondary);">{{ domainUsersError }}</p>
                <button type="button" class="text-xs font-semibold mt-2 underline" style="color: var(--accent);" @click="loadDomainUsers">Retry</button>
              </div>
            </div>

            <div v-else-if="!isLoadingDomainUsers && domainUsers.length === 0" class="flex flex-col items-center gap-3 py-10 px-6 rounded-2xl border text-center" style="border-color: var(--border); background: var(--bg-card);">
              <svg class="w-10 h-10" viewBox="0 0 40 40" fill="none" style="color: var(--text-secondary);"><circle cx="20" cy="14" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M8 34c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              <div><p class="text-sm font-semibold text-text-primary mb-0.5">No users found</p><p class="text-xs" style="color: var(--text-secondary);">No accounts were found under {{ claimDomain }} yet.</p></div>
              <button type="button" class="mt-2 px-5 py-2.5 rounded-[9px] text-sm font-bold transition-all" style="background: var(--accent); color: var(--accent-text);" @click="finishOnboarding">Finish setup</button>
            </div>

            <template v-else>
              <div class="flex items-center justify-between px-1">
                <p class="text-xs font-medium" style="color: var(--text-secondary);">
                  <span class="font-bold" style="color: var(--text-primary);">{{ selectedDomainUserIds.length }}</span> of {{ domainUsers.length }} selected
                </p>
                <div class="flex gap-3">
                  <button type="button" class="text-xs font-semibold transition-opacity hover:opacity-70" style="color: var(--accent);" @click="selectAllDomainUsers">Select all</button>
                  <span style="color: var(--border);">|</span>
                  <button type="button" class="text-xs font-semibold transition-opacity hover:opacity-70" style="color: var(--text-secondary);" @click="selectedDomainUserIds = []">Clear</button>
                </div>
              </div>

              <div class="space-y-2 max-h-[380px] overflow-y-auto pr-1 custom-scroll">
                <button
                  v-for="user in domainUsers"
                  :key="user._id"
                  type="button"
                  class="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-150 text-left"
                  :style="{
                    borderColor: selectedDomainUserIds.includes(user._id) ? 'var(--accent)' : 'var(--border)',
                    background: selectedDomainUserIds.includes(user._id) ? 'color-mix(in srgb, var(--accent) 6%, transparent)' : 'var(--bg-card)',
                  }"
                  @click="toggleDomainUser(user._id)"
                >
                  <div class="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all duration-150 border-2" :style="{ background: selectedDomainUserIds.includes(user._id) ? 'var(--accent)' : 'transparent', borderColor: selectedDomainUserIds.includes(user._id) ? 'var(--accent)' : 'var(--border)' }">
                    <svg v-if="selectedDomainUserIds.includes(user._id)" class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </div>
                  <div class="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold text-white overflow-hidden" :style="{ background: getUserAvatarColor(user._id) }">
                    <img v-if="user.u_profile_picture" :src="user.u_profile_picture" class="w-full h-full object-cover" :alt="user.u_full_name" />
                    <span v-else>{{ getUserInitials(user.u_full_name) }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-text-primary truncate">{{ user.u_full_name }}</p>
                    <p class="text-xs truncate" style="color: var(--text-secondary);">{{ user.u_email }}</p>
                  </div>
                  <span v-if="user.u_role" class="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0" style="background: var(--bg-surface); color: var(--text-secondary); border: 1px solid var(--border);">{{ user.u_role }}</span>
                </button>
              </div>

              <p v-if="enrolError" class="text-xs text-center" style="color: #e55050;">{{ enrolError }}</p>
              <div v-if="enrolSuccess" class="flex items-center gap-2.5 px-4 py-3 rounded-xl" style="background: color-mix(in srgb, #1d9e75 8%, transparent); border: 1px solid color-mix(in srgb, #1d9e75 20%, transparent);">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M5 8l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <p class="text-xs font-medium" style="color: #1d9e75;">{{ enrolSuccess }}</p>
              </div>

              <div class="flex items-center justify-between pt-2">
                <Button variant="secondary" size="md" :disabled="isEnrolling" @click="skipEnrol"><span>Skip for now</span></Button>
                <Button size="md" :disabled="isEnrolling || selectedDomainUserIds.length === 0" @click="enrolSelectedUsers">
                  <div class="flex items-center gap-2">
                    <span v-if="isEnrolling" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    <span>{{ isEnrolling ? 'Enrolling…' : `Enrol ${selectedDomainUserIds.length} user${selectedDomainUserIds.length !== 1 ? 's' : ''}` }}</span>
                  </div>
                </Button>
              </div>
            </template>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             BOTTOM NAV (steps 1–4 only)
        ════════════════════════════════════════════════════════════ -->
        <div class="flex justify-between items-center mt-10 md:mt-5" v-if="showBottomNav">
          <Button v-if="activeStep !== 1 && !siteCreated" variant="secondary" size="md" type="button" :disabled="isAnyMutating" @click="goBack">
            <div class="flex items-center gap-1"><FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back</div>
          </Button>
          <div v-else-if="activeStep !== 1" />
          <div class="flex gap-4 items-center ml-auto">
            <Button :disabled="isAnyMutating || (activeStep === 1 && !selected)" size="md" type="submit" @click="continueHandler">
              <div class="flex items-center gap-2">
                <span v-if="isAnyMutating" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>Continue</span>
              </div>
            </Button>
          </div>
        </div>
        </template><!-- end v-if="!associatedCompany" -->
      </div>

      <div class="max-w-125 md:mx-auto w-full space-y-6"></div>

      <!-- Workspace creation error modal -->
      <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95" enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
        <div v-if="companySlugError" class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4" @click.self="dismissErrorModal">
          <div class="w-full max-w-md rounded-2xl bg-bg-dropdown p-6 shadow-xl ring-1 ring-black/5">
            <div class="mb-4 flex h-13 w-13 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <i class="fa-solid fa-triangle-exclamation text-red-500 text-lg"></i>
            </div>
            <h3 class="text-md font-semibold text-text-primary mb-1">{{ isNameConflictError ? 'Site name already taken' : 'Something went wrong' }}</h3>
            <p class="text-sm text-text-secondary leading-relaxed mb-5">{{ companySlugError }}</p>
            <div class="flex gap-2">
              <button v-if="isNameConflictError" type="button" class="flex-1 rounded-lg border border-black/10 bg-bg-dropdown px-3 py-2.5 text-sm font-medium text-text-secondary hover:border-black/20 hover:text-text-primary transition cursor-pointer" @click="handleConflictRedirect">Change name here</button>
              <button v-else type="button" class="flex-1 rounded-lg border border-black/10 bg-bg-dropdown px-3 py-2.5 text-sm font-medium text-text-secondary hover:border-black/20 hover:text-text-primary transition cursor-pointer" @click="dismissErrorModal">Go to Dashboard</button>
            </div>
          </div>
        </div>
      </Transition>
    </template>
  </AuthLayout>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted, nextTick, watchEffect} from 'vue'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import teamIcon from '../../assets/platform/team.svg'
import personalIcon from '../../assets/platform/personal-use.svg'
import schoolIcon from '../../assets/platform/school.svg'
import Button from '../../components/ui/Button.vue'
import BaseSelectField from '../../components/ui/BaseSelectField.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import { useRouter, useRoute } from 'vue-router'
import { useCreateCompany, useUpdateCompany, useInviteCompany } from '../../services/auth'
import { updateProfile as updateUserProfile, getProfile } from '../../services/user'
import { useWorkspaceStore } from '../../stores/workspace'
import { useAuthStore } from '../../stores/auth'
import LoadingCreateProfile from '../../components/LoadingCreateProfile.vue'
import { useCreateCompanyUser, useSendSuperAdminOtp, useVerifySuperAdminOtp } from '../../queries/useCompanyUsers'
import gsap from 'gsap'
import { toast } from 'vue-sonner'
import { useCompanyRolesWithoutPermission } from '../../queries/useCommon'
import { useTheme } from '../../composables/useTheme';

const { theme } = useTheme();
defineOptions({ name: 'OnboardingFlow' })
const { data: rolesData, isLoading: isRolesLoading, refetch: refetchRoles } = useCompanyRolesWithoutPermission()
const { mutateAsync: sendOtp } = useSendSuperAdminOtp()
const { mutateAsync: verifyOtp } = useVerifySuperAdminOtp()

// ─── Core State ──────────────────────────────────────────────────────────────
const companyID = ref()
const activeStep = ref(1)
const selected = ref('team')
const siteCreated = ref(false)
const dnsInput = ref('')
const siteName = ref('')
const siteSlug = ref('')
const isProvisioning = ref(false)
const isUpdatingProfile = ref(false)

// ─── Super Admin State ───────────────────────────────────────────────────────
const superAdminRole = ref("")
const superAdminName = ref("")
const superAdminPassword = ref("")
const superAdminEmailPrefix = ref('')
const superAdminEmail = computed(() => {
  const prefix = superAdminEmailPrefix.value.trim()
  const domain = dnsInput.value.trim()
  if (!prefix || !domain) return ''
  return `${prefix}@${domain}`
})

const allRoles = computed(() => {
  const raw = rolesData.value?.data ?? rolesData.value ?? []
  return Array.isArray(raw) ? raw : []
})


// ─── Stores & Router ──────────────────────────────────────────────────────────
const workspaceStore = useWorkspaceStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const isLoaderRunning = ref(false)
const profileData = ref(null)

// ─── Associated company (email already claimed) ───────────────────────────────
const associatedCompany = ref(null)

// ─── Error map ────────────────────────────────────────────────────────────────
const errors = ref({})

// ─── Generic email providers ──────────────────────────────────────────────────
const GENERIC_EMAIL_PROVIDERS = new Set([
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com',
  'live.com', 'msn.com', 'aol.com', 'protonmail.com', 'mail.com',
  'zoho.com', 'yandex.com', 'inbox.com', 'gmx.com', 'fastmail.com',
  'tutanota.com', 'hey.com', 'pm.me', 'googlemail.com',
])

// ─── Computed: user email & domain ────────────────────────────────────────────
const userEmail = computed(() =>
  profileData.value?.u_email ||
  authStore.user?.u_email ||
  authStore.user?.email ||
  ''
)

const userEmailDomain = computed(() => {
  const email = userEmail.value
  if (!email || !email.includes('@')) return ''
  return email.split('@')[1].toLowerCase().trim()
})

/**
 * isCompanyEmail
 * true  → Scenario 3: company domain, skip DNS/super-admin/domain-verify
 * false → Scenario 1/2: generic email
 */
const isCompanyEmail = computed(() => {
  const domain = userEmailDomain.value
  if (!domain) return false
  return !GENERIC_EMAIL_PROVIDERS.has(domain)
})

const isEducationEmail = computed(() => {
  const domain = userEmailDomain.value
  if (!domain) return false
  // Check for .edu anywhere in the domain (e.g. university.edu or university.edu.pk)
  return domain.endsWith('.edu') || domain.includes('.edu.')
})

const isGenericEmail = computed(() => {
  const domain = userEmailDomain.value
  return domain && GENERIC_EMAIL_PROVIDERS.has(domain)
})

// Enforce options based on domain
const mandatoryOptionId = computed(() => {
  if (isEducationEmail.value) return 'school'
  return null
})

const filteredOptions = computed(() => {
  if (isEducationEmail.value) return options.filter(o => o._id === 'school')
  if (isCompanyEmail.value) return options.filter(o => o._id === 'team')
  return options.filter(o => o._id === 'personal')
})


onMounted(async () => {
  try {
    const res = await getProfile()

    if (res?.status) {
      profileData.value = res.data

      // ── Check for associated company (email already claimed by an org) ──
      const ac = res.data?.associated_company
      if (ac && ac._id) {
        associatedCompany.value = ac
        // Page is locked — nothing else to do
        return
      }

      // (Legacy dead code referencing hasCustomDomainEmail/customEmailDomain removed)
    }
  } catch (error) {
    console.error('Failed to fetch profile', error)
  }
})

const teamRef = ref(null)
const roleRef = ref(null)
const companySizeRef = ref(null)

// ─── Step 2 ───────────────────────────────────────────────────────────────────
const role = ref('')
const team = ref('')
const companySize = ref('')
const personalRole = ref('')
const schoolName = ref('')
const educationLevel = ref('')

// ─── Step 3 ───────────────────────────────────────────────────────────────────
const selectedModules = ref([])

// ─── Step 4 ───────────────────────────────────────────────────────────────────
const workType = ref('')

// ─── Step 5 ───────────────────────────────────────────────────────────────────
const isFocused = ref(false)
const isCheckingSlug = ref(false)
const isSlugAvailable = ref(null)
const companySlugError = ref(null)

// ─── Step 5 — custom domain (Scenario 2 only) ────────────────────────────────
const hasCustomDomain = ref(false)
const isCheckingDns = ref(false)
const isDnsAvailable = ref(null)
const isDnsNotRegistered = ref(false)
const dnsError = ref(null)
const dnsValidationError = ref(null)
const isDnsLocked = ref(false)

// ─── Domain registrar links (shown when domain is not registered) ─────────────
const domainRegistrars = [
  { name: 'GoDaddy',    getUrl: (d) => `https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(d)}` },
  { name: 'Namecheap',  getUrl: (d) => `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(d)}` },
  { name: 'Cloudflare', getUrl: () => `https://www.cloudflare.com/products/registrar/` },
  { name: 'Hostinger',  getUrl: (d) => `https://www.hostinger.com/domain-name-search?query=${encodeURIComponent(d)}` },
  { name: 'Porkbun',    getUrl: (d) => `https://porkbun.com/checkout/search?q=${encodeURIComponent(d)}` },
]

// ─── Step 51 — Super Admin OTP (Scenario 2 custom domain only) ───────────────
const superAdminEmailError = ref('')
const superAdminEmailFocused = ref(false)
const superAdminNameFocused = ref(false)
const superAdminNameError = ref('')
const superAdminPasswordError = ref('')
const superAdminPasswordFocused = ref(false)
const superAdminOtpSent = ref(false)
const isSendingOtp = ref(false)
const isVerifyingOtp = ref(false)
const otpDigits = ref(['', '', '', '', ''])
const otpInputRefs = ref([])
const otpError = ref('')
const otpResendCountdown = ref(0)
let otpResendTimer = null

function startOtpResendCountdown(seconds = 60) {
  otpResendCountdown.value = seconds
  if (otpResendTimer) clearInterval(otpResendTimer)
  otpResendTimer = setInterval(() => {
    otpResendCountdown.value--
    if (otpResendCountdown.value <= 0) {
      clearInterval(otpResendTimer)
      otpResendTimer = null
    }
  }, 1000)
}

function stopCountdown() {
  if (otpResendTimer) {
    clearInterval(otpResendTimer)
    otpResendTimer = null
  }
  otpResendCountdown.value = 0
}

// ─── Step 8 — domain verification (Scenario 2 custom domain only) ─────────────
const domainPhase = ref('idle')
const isRegisteringDomain = ref(false)
const currentDomain = ref(null)
const currentInstructions = ref(null)
const selectedVerificationMethod = ref('cname')
const methodSwitched = ref(false)
const isRechecking = ref(false)
const recheckError = ref(null)
const isSwitchingMethod = ref(false)
const isDownloadingFile = ref(false)
const isSettingPrimary = ref(false)
const copiedField = ref(null)

// Rate-limit countdown
const retryCountdown = ref(0)
const retryTotal = ref(30)
let countdownTimer = null

// ─── Step 9 — domain user enrolment ──────────────────────────────────────────
const domainUsers = ref([])
const selectedDomainUserIds = ref([])
const isLoadingDomainUsers = ref(false)
const domainUsersError = ref(null)
const isEnrolling = ref(false)
const enrolError = ref(null)
const enrolSuccess = ref(null)

// ─── Misc step state ──────────────────────────────────────────────────────────
const referralSources = ref([])
const joinLink = ref('')
const domainLink = ref('')

// FIX 4: Auto-resolve superAdminRole from roles list — never shown to user
// Match the super admin role that belongs to the CURRENT company (after createProfile)
watchEffect(() => {
  if (!allRoles.value?.length) return
  const currentCompanyId = companyID.value ?? localStorage.getItem('company_id') ?? ''
  // Prefer the super admin role matching the current company
  const matchedRole = allRoles.value.find(r => r.is_super_admin && r.company_id === currentCompanyId)
    || allRoles.value.find(r => r.is_super_admin && r.company_id)
  if (matchedRole) {
    superAdminRole.value = matchedRole._id
  }
})

// Auto-select and ENFORCE based on email domain
watch([isEducationEmail, isCompanyEmail], ([isEdu, isCompany]) => {
  if (activeStep.value !== 1) return
  if (isEdu) {
    selected.value = 'school'
  } else if (isCompany) {
    selected.value = 'team'
  } else {
    selected.value = 'personal'
  }
}, { immediate: true })

function handleOptionClick(id) {
  if (mandatoryOptionId.value && mandatoryOptionId.value !== id) {
    let msg = ''
    if (isEducationEmail.value) {
      msg = `Academic accounts are restricted to School profiles.`
    }
    toast.error(msg, {
      description: `Please use the ${mandatoryOptionId.value} option for ${userEmailDomain.value}`,
      duration: 4000
    })
    return
  }
  selected.value = id
}

// ─── Verification methods ─────────────────────────────────────────────────────
const verificationMethods = [
  { value: 'cname', label: 'CNAME' },
  { value: 'txt',   label: 'TXT' },
  { value: 'http',  label: 'HTTP File' },
]

// ─── Static data ──────────────────────────────────────────────────────────────
const staticRolesList = Object.freeze([
  { title: 'CEO / Founder',        _id: 'ceo_founder' },
  { title: 'CTO / Technical Lead', _id: 'cto_tech_lead' },
  { title: 'Product Manager',      _id: 'product_manager' },
  { title: 'Software Engineer',    _id: 'software_engineer' },
  { title: 'Designer',             _id: 'designer' },
  { title: 'Marketing',            _id: 'marketing' },
  { title: 'Sales',                _id: 'sales' },
  { title: 'Operations',           _id: 'operations' },
  { title: 'HR / People',          _id: 'hr_people' },
  { title: 'Finance',              _id: 'finance' },
  { title: 'Student',              _id: 'student' },
  { title: 'Teacher / Lecturer',   _id: 'teacher_lecturer' },
  { title: 'Other',                _id: 'other' },
])

const companySizeOptions = Object.freeze([
  { title: '1 – 10',         _id: '1–10' },
  { title: '11 – 50',        _id: '11–50' },
  { title: '51 – 200',       _id: '51–200' },
  { title: '201 – 500',      _id: '201–500' },
  { title: '501 – 1,000',    _id: '501–1000' },
  { title: '1,001 – 5,000',  _id: '1001–5000' },
  { title: '5,001 – 10,000', _id: '5001–10000' },
  { title: '10,001+',        _id: '10001+' },
])

const educationOptions = Object.freeze([
  { title: 'School',       _id: 'school' },
  { title: 'College',      _id: 'college' },
  { title: 'University',   _id: 'university' },
  { title: 'Postgraduate', _id: 'postgraduate' },
])

const referralOptions = [
  { id: 'google',      label: 'Google Search' },
  { id: 'social',      label: 'Social Media' },
  { id: 'friend',      label: 'Friend / Colleague' },
  { id: 'youtube',     label: 'YouTube' },
  { id: 'twitter',     label: 'X (Twitter)' },
  { id: 'producthunt', label: 'Product Hunt' },
  { id: 'ads',         label: 'Ads' },
  { id: 'blog',        label: 'Blog / Article' },
  { id: 'other',       label: 'Other' },
]

const options = Object.freeze([
  { _id: 'team',     title: 'For my team',      description: 'Collaborate on your docs and projects.',             icon: teamIcon },
  { _id: 'personal', title: 'For personal use', description: 'Write better. Think more clearly. Stay organised.', icon: personalIcon },
  { _id: 'school',   title: 'For school',       description: 'Keep notes, research and tasks in one place.',       icon: schoolIcon },
])

// ─── Computed: claim domain for Step 9 ────────────────────────────────────────
const claimDomain = computed(() => {
  if (isCompanyEmail.value) return userEmailDomain.value
  return dnsInput.value.trim()
})

// ─── Computed: slug helpers ───────────────────────────────────────────────────
const isFullyAvailable = computed(() => isSlugAvailable.value === true)
const isAnyUnavailable = computed(() => isSlugAvailable.value === false)

// ─── Computed: loading guards ─────────────────────────────────────────────────
const isAnyMutating = computed(
  () => creatingProfile.value || updatingProfile.value || invitingPeople.value || isUpdatingProfile.value
)

// ─── Computed: domain status badge ───────────────────────────────────────────
const domainStatusLabel = computed(() => {
  const s = currentDomain.value?.status
  if (s === 'verified')  return 'Verified'
  if (s === 'verifying') return 'Verifying'
  if (s === 'pending')   return 'Pending'
  if (s === 'failed')    return 'Failed'
  if (s === 'disabled')  return 'Disabled'
  return 'Pending'
})

const domainStatusStyle = computed(() => {
  const s = currentDomain.value?.status
  if (s === 'verified')  return { background: 'color-mix(in srgb, #1d9e75 12%, transparent)', color: '#1d9e75' }
  if (s === 'failed')    return { background: 'color-mix(in srgb, #e55050 12%, transparent)', color: '#e55050' }
  if (s === 'disabled')  return { background: 'color-mix(in srgb, #6b7280 12%, transparent)', color: '#6b7280' }
  return { background: 'color-mix(in srgb, #f59e0b 12%, transparent)', color: '#f59e0b' }
})

// ─── Computed: Step 5 disabled state ──────────────────────────────────────────
const isCreateSiteDisabled = computed(() => {
  if (creatingProfile.value) return true

  // Scenario 3 (company email): subdomain only — slug check only, no DNS checks
  if (isCompanyEmail.value) {
    if (!siteName.value) return true
    if (isCheckingSlug.value) return true
    if (isSlugAvailable.value !== true) return true
    return false
  }

  // Scenario 2: generic email + custom domain
  if (hasCustomDomain.value) {
    if (!dnsInput.value.trim()) return true
    if (dnsValidationError.value) return true
    if (isCheckingDns.value) return true
    if (dnsError.value) return true
    if (isDnsAvailable.value !== true) return true
    return false
  }

  // Scenario 2b: generic email + subdomain (slug + DNS both must pass)
  if (!siteName.value) return true
  if (isCheckingSlug.value) return true
  if (isSlugAvailable.value !== true) return true
  if (isCheckingDns.value) return true
  if (isDnsAvailable.value !== true) return true
  return false
})

// ─── Computed: bottom nav visibility ──────────────────────────────────────────
const showBottomNav = computed(() => {
  if ([5, 6, 7, 8, 9, 51].includes(activeStep.value)) return false
  return true
})

// ─── Computed: modules ────────────────────────────────────────────────────────
const moduleOptionsMap = {
  team: [
    { id: 'tasks',      label: 'Tasks' },
    { id: 'projects',   label: 'Projects' },
    { id: 'docs',       label: 'Docs' },
    { id: 'goals',      label: 'Goals' },
    { id: 'support',    label: 'Support Desk' },
    { id: 'operations', label: 'Operations' },
    { id: 'knowledge',  label: 'Knowledge Base' },
    { id: 'reporting',  label: 'Reports' },
  ],
  personal: [
    { id: 'tasks',      label: 'Personal Tasks' },
    { id: 'notes',      label: 'Notes' },
    { id: 'planning',   label: 'Daily Planning' },
    { id: 'journaling', label: 'Journaling' },
  ],
  school: [
    { id: 'notes',             label: 'Notes' },
    { id: 'assignments',       label: 'Assignments' },
    { id: 'group_projects',    label: 'Group Projects' },
    { id: 'research',          label: 'Research' },
    { id: 'exam_prep',         label: 'Exam Prep' },
    { id: 'class_management',  label: 'Class Management' },
    { id: 'lecture_planning',  label: 'Lecture Planning' },
    { id: 'homework_tracking', label: 'Homework Tracking' },
    { id: 'project_tracking',  label: 'Project Tracking' },
    { id: 'study_planning',    label: 'Study Planning' },
    { id: 'revision_schedule', label: 'Revision Schedule' },
    { id: 'collaboration',     label: 'Student Collaboration' },
    { id: 'task_management',   label: 'Task Management' },
  ],
}
const activeModules = computed(() => moduleOptionsMap[selected.value] || [])

// ─── Computed: work type ──────────────────────────────────────────────────────
const workTypeOptionsMap = {
  team: [
    { id: 'software_development', label: 'Software Development', icon: 'code' },
    { id: 'product_management',   label: 'Product Management',   icon: 'layer-group' },
    { id: 'marketing',            label: 'Marketing',            icon: 'bullhorn' },
    { id: 'design',               label: 'Design',               icon: 'palette' },
    { id: 'sales',                label: 'Sales',                icon: 'chart-line' },
    { id: 'operations',           label: 'Operations',           icon: 'cog' },
    { id: 'hr',                   label: 'Human Resources',      icon: 'users' },
    { id: 'support',              label: 'Customer Support',     icon: 'headset' },
  ],
  school: [
    { id: 'study',            label: 'Study & Learning',  icon: 'book' },
    { id: 'assignments',      label: 'Assignments',        icon: 'file-lines' },
    { id: 'group_projects',   label: 'Group Projects',     icon: 'users' },
    { id: 'research',         label: 'Research',           icon: 'magnifying-glass' },
    { id: 'exam_prep',        label: 'Exam Prep',          icon: 'pen' },
    { id: 'class_management', label: 'Class Management',   icon: 'chalkboard' },
    { id: 'teaching',         label: 'Teaching',           icon: 'person-chalkboard' },
    { id: 'notes',            label: 'Notes',              icon: 'clipboard' },
  ],
  personal: [
    { id: 'task_management', label: 'Task Management', icon: 'check-square' },
    { id: 'learning',        label: 'Learning',         icon: 'book' },
    { id: 'goal_tracking',   label: 'Goal Tracking',    icon: 'bullseye' },
    { id: 'daily_planning',  label: 'Daily Planning',   icon: 'calendar' },
  ],
}
const workTypeOptions = computed(() => workTypeOptionsMap[selected.value] || [])

// ─── Computed: step labels ────────────────────────────────────────────────────
const stepLabels = computed(() => {
  if (selected.value === 'personal') {
    return ['Purpose', 'About You', 'Modules', 'Work Type', 'Done']
  }
  if (selected.value === 'school') {
    return ['Purpose', 'About School', 'Modules', 'Work Type', 'Create Site', 'Done']
  }
  return ['Purpose', 'About Company', 'Modules', 'Work Type', 'Create Site', 'Done']
})

const displayStep = computed(() => {
  if (activeStep.value <= 4) return activeStep.value
  if (activeStep.value === 5) return 5
  if (activeStep.value === 51) return 5  // super admin sub-step shows as step 5
  if (activeStep.value >= 6) return stepLabels.value.length
  return activeStep.value
})

// ─── Browser Back Button Lock ─────────────────────────────────────────────────
const SENTINEL = { onboarding: true }

function armHistoryGuard() {
  history.pushState(SENTINEL, '')
  history.pushState(SENTINEL, '')
}

function handlePopState(event) {
  // Only lock history from step 6 onwards
  if (activeStep.value < 6) return
  event.preventDefault?.()
  history.pushState(SENTINEL, '')
}

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(team,        (v) => { if (v?.trim() && errors.value.team)        errors.value.team        = undefined })
watch(role,        (v) => { if (v && errors.value.role)                errors.value.role        = undefined })
watch(companySize, (v) => { if (v && errors.value.companySize)         errors.value.companySize = undefined })
watch(workType,    (v) => { if (v && errors.value.workType)            errors.value.workType    = undefined })

// ─── FIX 2: Pre-fill site name / dnsInput with company name when entering step 5 ──
// For non-company emails: siteName uses company/school name (slug format)
// For company emails: siteName uses company/school name too (slug format)
// dnsInput is NEVER auto-filled from company name — it's either typed (custom domain)
// or set from the user's email domain (company email scenario, handled separately)
watch(activeStep, (step) => {
  // ── Sync with URL for back-button support ──
  if (Number(route.query.step) !== step) {
    router.push({ query: { ...route.query, step } })
  }

  if (step === 5) {
    // Auto-fill siteName from the entered company/school name (FIX 2)
    if (!siteName.value) {
      if (selected.value === 'team' && team.value.trim()) {
        siteName.value = generateSlug(team.value)
      } else if (selected.value === 'school' && schoolName.value.trim()) {
        siteName.value = generateSlug(schoolName.value)
      }
    }

    // For company emails: auto-fill dnsInput with the email domain (not company name)
    if (isCompanyEmail.value && !dnsInput.value && userEmailDomain.value) {
      dnsInput.value = userEmailDomain.value.toLowerCase().trim()
    }
  }

  if (step === 6) armHistoryGuard()
})

// Sync URL → Step (Back/Forward button support)
watch(() => route.query.step, (step) => {
  if (step) {
    const s = Number(step)
    if (activeStep.value !== s) {
      activeStep.value = s
    }
  } else if (activeStep.value !== 1) {
    activeStep.value = 1
  }
})

onMounted(() => {
  // Restore step from URL on refresh
  if (route.query.step) {
    activeStep.value = Number(route.query.step)
  }
})

watch(
  () => activeStep.value,
  (step) => {
    if (step === 2 && selected.value === 'team') {
      nextTick(() => { teamRef.value?.focus?.() })
    }
  }
)

// ─── Slug is generated only when entering Step 5 (see watch(activeStep) above) ──
// Removed: watchers on team/schoolName that prematurely generated slugs during Step 2

// ─── Debounced slug check ─────────────────────────────────────────────────────
let slugDebounceTimer = null

watch(siteName, (val) => {
  siteSlug.value = generateSlug(val)
  isSlugAvailable.value = null
  // Also reset DNS state for subdomain mode (non-company-email scenario)
  if (!isCompanyEmail.value && !hasCustomDomain.value) {
    isDnsAvailable.value = null
    dnsError.value = null
  }
  if (slugDebounceTimer) clearTimeout(slugDebounceTimer)
  if (!siteSlug.value) { isCheckingSlug.value = false; return }
  isCheckingSlug.value = true
  slugDebounceTimer = setTimeout(async () => {
    const captured = siteSlug.value
    try {
      const result = await workspaceStore.fetchTitleSlug(captured)
      if (siteSlug.value === captured) isSlugAvailable.value = result?.available ?? null
    } catch {
      if (siteSlug.value === captured) isSlugAvailable.value = null
    } finally {
      if (siteSlug.value === captured) isCheckingSlug.value = false
    }
    // FIX 3: After slug is available, also run DNS check on the slug domain
    // Only for generic email subdomain mode (not company email, not custom domain)
    if (!isCompanyEmail.value && !hasCustomDomain.value && isSlugAvailable.value === true && captured) {
      runSubdomainDnsCheck(captured)
    }
  }, 600)
})

// ─── FIX 3: DNS check triggered after slug availability confirmed (subdomain mode) ──
const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,10}$/

async function runSubdomainDnsCheck(slug) {
  // For subdomain mode we check {slug}.streamed.space as the domain
  const subdomain = `${slug}.streamed.space`
  isCheckingDns.value = true
  isDnsAvailable.value = null
  dnsError.value = null
  try {
    const result = await workspaceStore.fetchDnsCheck(subdomain)
    if (!result) {
      isDnsAvailable.value = null
      dnsError.value = 'Could not verify subdomain. Please try again.'
    } else {
      const isRegistered = result?.is_registered === true
      const isActive     = result?.is_active     === true
      if (isActive) {
        isDnsAvailable.value = true
        dnsError.value = null
      } else if (isRegistered && !isActive) {
        isDnsAvailable.value = false
        dnsError.value = 'Subdomain DNS is not yet active.'
      } else {
        // Not registered yet is fine for a new subdomain
        isDnsAvailable.value = true
        dnsError.value = null
      }
    }
  } catch {
    // DNS check failure is non-blocking for subdomain mode — allow proceed
    isDnsAvailable.value = true
    dnsError.value = null
  } finally {
    isCheckingDns.value = false
  }
}

// ─── Debounced DNS check (Scenario 2 custom domain mode only) ────────────────
let dnsDebounceTimer = null

watch(dnsInput, (val) => {
  // Only run this watcher for custom domain mode (not company email, not subdomain)
  if (isCompanyEmail.value) return
  if (!hasCustomDomain.value) return
  if (isDnsLocked.value) return

  const trimmed = val.trim()
  isDnsAvailable.value     = null
  isDnsNotRegistered.value = false
  dnsError.value           = null
  dnsValidationError.value = null
  if (dnsDebounceTimer) clearTimeout(dnsDebounceTimer)
  if (!trimmed) { isCheckingDns.value = false; return }
  if (!DOMAIN_RE.test(trimmed)) {
    dnsValidationError.value = 'Please enter a valid domain with a TLD (e.g. mycompany.com, brand.pk, startup.ai).'
    isCheckingDns.value = false
    return
  }
  isCheckingDns.value = true
  dnsDebounceTimer = setTimeout(async () => {
    const captured = trimmed
    try {
      const result = await workspaceStore.fetchDnsCheck(captured)
      if (dnsInput.value.trim() !== captured) return
      if (!result) {
        dnsError.value       = 'Invalid domain format. Please enter a valid domain (e.g. mycompany.com).'
        isDnsAvailable.value = null
      } else {
        const isRegistered = result?.is_registered === true
        const isActive     = result?.is_active     === true
        if (isRegistered && isActive) {
          // FIX 1: Removed createProfile call here — only check availability, do NOT call createProfile
          isDnsAvailable.value = true
          dnsError.value       = null
        } else if (isRegistered && !isActive) {
          isDnsAvailable.value = false
          dnsError.value       = 'This domain is registered but DNS is not active yet.'
        } else {
          // NOT_REGISTERED: domain not found — show purchase suggestion instead of error
          isDnsAvailable.value     = false
          isDnsNotRegistered.value = true
          dnsError.value           = null
        }
      }
    } catch (err) {
      if (dnsInput.value.trim() !== captured) return
      dnsError.value       = err?.response?.data?.message ?? err?.message ?? 'Could not verify domain. Please try again.'
      isDnsAvailable.value = null
    } finally {
      if (dnsInput.value.trim() === captured) isCheckingDns.value = false
    }
  }, 600)
})

// ─── Mutations ────────────────────────────────────────────────────────────────
const isNameConflictError = ref(false)

function isSlugConflictMsg(msg) {
  const lower = msg.toLowerCase()
  return (
    lower.includes('slug') ||
    lower.includes('already exists') ||
    lower.includes('already taken') ||
    lower.includes('company name') ||
    lower.includes('name is taken')
  )
}

// Track whether we need to go to Step 51 (super admin) after company creation
const pendingSuperAdminStep = ref(false)

const { mutate: createProfile, isPending: creatingProfile } = useCreateCompany({
  onSuccess: async (data) => {
    const payload = data?.data ?? data
    if (!payload || payload?.status === false) {
      const msg = payload?.message ?? ''
      isNameConflictError.value = isSlugConflictMsg(msg)
      companySlugError.value = isNameConflictError.value
        ? 'This site name is already taken. Please choose a different one on this page.'
        : (msg || 'Something went wrong while creating your workspace. Please try again.')
      activeStep.value      = 5
      isProvisioning.value  = false
      isLoaderRunning.value = false
      pendingSuperAdminStep.value = false
      return
    }
    const id     = payload?.company_id ?? payload?._id
    const join   = payload?.join_link  ?? ''
    const domain = payload?.domain_link ?? ''
    companyID.value   = id
    joinLink.value    = join
    domainLink.value  = domain
    localStorage.setItem('company_id', id ?? '')
    siteCreated.value = true

    // Scenario 2a: company created, now go to super admin verification
    if (pendingSuperAdminStep.value) {
      pendingSuperAdminStep.value = false
      isProvisioning.value  = false
      isLoaderRunning.value = false
      // Refetch roles so we get the super admin role for the new company
      await refetchRoles()
      // Re-resolve superAdminRole for the newly created company
      const currentCompanyId = id
      const matchedRole = allRoles.value.find(r => r.is_super_admin && r.company_id === currentCompanyId)
        || allRoles.value.find(r => r.is_super_admin && r.company_id)
      if (matchedRole) {
        superAdminRole.value = matchedRole._id
      }
      activeStep.value = 51
      return
    }
    // isLoaderRunning stays true; LoadingCreateProfile animation drives timing
  },
  onError: (error) => {
    const msg = error?.response?.data?.message ?? error?.message ?? ''
    isNameConflictError.value = isSlugConflictMsg(msg)
    companySlugError.value = isNameConflictError.value
      ? 'This site name is already taken. Please choose a different one on this page.'
      : (msg || 'Something went wrong while creating your workspace. Please try again.')
    activeStep.value      = 5
    isProvisioning.value  = false
    isLoaderRunning.value = false
    pendingSuperAdminStep.value = false
  },
})

const { mutate: updateProfile, isPending: updatingProfile } = useUpdateCompany({
  onSuccess: async () => {
    // Scenario 2a: generic email + custom domain → domain verification step
    if (!isCompanyEmail.value && hasCustomDomain.value && isDnsAvailable.value === true) {
      activeStep.value = 8
      return
    }

   // Scenario 3: company email → skip domain enrolment
if (isCompanyEmail.value) {
  await authStore.bootstrap()

  if (workspaceStore.pricing) {
    router.push('/dashboard?stripePayment=true')
    return
  }

  if (workspaceStore.workspace) {
    router.push('/create-workspace')
    return
  }

  await finishOnboarding()
  return
}

    // Scenario 2b: generic email + subdomain → go straight to finish
    await authStore.bootstrap()
    if (workspaceStore.pricing) {
      router.push('/dashboard?stripePayment=true')
      return
    }
    if (workspaceStore.workspace) {
      router.push('/create-workspace')
      return
    }
    routeToFinishProfile()
  },
  onError: () => { activeStep.value = 5 },
})

const { mutate: invitePeople, isPending: invitingPeople } = useInviteCompany({
  onSuccess: async () => {
    await finishOnboarding()
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateSlug(value) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function optionClass(id) {
  return id === selected.value
    ? 'border-accent bg-accent/10 shadow-sm'
    : 'border-border'
}

function toggleModule(id) {
  if (selectedModules.value.includes(id)) {
    selectedModules.value = selectedModules.value.filter(m => m !== id)
  } else {
    selectedModules.value.push(id)
    if (errors.value.selectedModules) errors.value.selectedModules = undefined
  }
}

function toggleReferral(id) {
  if (referralSources.value.includes(id)) {
    referralSources.value = referralSources.value.filter(i => i !== id)
  } else {
    referralSources.value.push(id)
  }
}

function toggleCustomDomain() {
  // Scenario 3: company email users cannot switch to custom domain mode
  if (isCompanyEmail.value) return

  hasCustomDomain.value = !hasCustomDomain.value
  if (hasCustomDomain.value) {
    // Auto-fill domain input with the current slug when toggling on (generic email only)
    if (!isCompanyEmail.value && siteSlug.value) {
      dnsInput.value = siteSlug.value
    }
  } else {
    dnsInput.value            = ''
    isDnsAvailable.value      = null
    isDnsNotRegistered.value  = false
    dnsError.value            = null
    dnsValidationError.value  = null
    isCheckingDns.value       = false
    isDnsLocked.value         = false
    domainPhase.value         = 'idle'
    currentDomain.value       = null
    currentInstructions.value = null
    methodSwitched.value      = false
    recheckError.value        = null
    stopCountdown()
    workspaceStore.clearDomainVerification?.()
  }
}

function copyToClipboard(text, field) {
  navigator.clipboard.writeText(text).then(() => {
    copiedField.value = field
    setTimeout(() => { copiedField.value = null }, 2000)
  })
}

function setAuthCookie(token) {
  const maxAge   = 60 * 60 * 24 * 30
  const hostname = window.location.hostname
  let cookieString = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    document.cookie = cookieString
  } else if (hostname.endsWith('.streamed.space') || hostname === 'streamed.space') {
    document.cookie = cookieString + '; domain=.streamed.space; Secure'
  }
}

function buildProfilePayload(includeSite = false) {
  const base = {
    work_to_do:     workType.value,
    like_to_manage: selectedModules.value,
    heard_about_us: referralSources.value,
  }
  if (dnsInput.value.trim()) {
    base.custom_domain = dnsInput.value
  }
  if (includeSite && siteSlug.value) {
    base.site_slug = siteSlug.value
  }
  if (selected.value === 'team') {
    return { ...base, title: team.value, type: 'team', role_id: role.value, company_size: companySize.value }
  }
  if (selected.value === 'personal') {
    return { ...base, type: 'personal', u_work_to_do: personalRole.value }
  }
  if (selected.value === 'school') {
    return { ...base, type: 'school', title: schoolName.value, company_size: educationLevel.value, role_id: role.value }
  }
  return base
}

function routeToFinishProfile() {
  const companyIdRaw = companyID.value ?? localStorage.getItem('company_id') ?? ''
  const token        = localStorage.getItem('token')
  if (token) setAuthCookie(token)
  const encode = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.')
  const query = {
    siteSlug:   siteSlug.value,
    domainLink: domainLink.value ?? '',
    type:       selected.value,
  }
  if (token)        query._auth = encode(token)
  if (companyIdRaw) query._cid  = encode(companyIdRaw)
  query.theme = theme.value
  router.push({ path: '/finish-profile', query })
}

async function finishOnboarding() {
  const companyIdRaw = companyID.value ?? localStorage.getItem('company_id') ?? ''
  const token        = localStorage.getItem('token')
  if (token) setAuthCookie(token)
  const encode = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.')
  const query = {
    siteSlug:   siteSlug.value,
    domainLink: domainLink.value ?? '',
    type:       selected.value,
  }
  // Only attach customDomain for Scenario 2a
  if (!isCompanyEmail.value && hasCustomDomain.value && isDnsAvailable.value === true && dnsInput.value.trim()) {
    query.customDomain = dnsInput.value.trim()
  }
  if (token)        query._auth = encode(token)
  if (companyIdRaw) query._cid  = encode(companyIdRaw)
  query.theme = theme.value
  router.push({ path: '/finish-profile', query })
}

function dismissErrorModal() {
  companySlugError.value = null
  if (!isNameConflictError.value) {
    router.push('/dashboard')
  }
}

function handleConflictRedirect() {
  activeStep.value = 2
  companySlugError.value = null
  isNameConflictError.value = false
  siteName.value = ''
}

function onProvisioningComplete() {
  isLoaderRunning.value = false

  if (selected.value === 'personal') {
    router.push({ path: '/finish-profile', query: { welcome: '1', type: 'personal', theme: theme.value } })
    return
  }

  // Team/school: continue to referral step
  activeStep.value = 7
}

// ─── Super Admin OTP Actions (Step 51, Scenario 2a only) ─────────────────────
// FIX 5: Validate only the prefix (before @domain)
function validateSuperAdminEmail() {
  const prefix = superAdminEmailPrefix.value.trim()
  superAdminEmailError.value = ''

  if (!prefix) {
    superAdminEmailError.value = 'Please enter the super admin email name.'
    return false
  }

  // Ensure prefix has no @ or invalid characters
  if (prefix.includes('@')) {
    superAdminEmailError.value = 'Please enter only the part before @. The domain is already set.'
    return false
  }

  const prefixRegex = /^[a-zA-Z0-9._%+\-]+$/
  if (!prefixRegex.test(prefix)) {
    superAdminEmailError.value = 'Please enter a valid email name (letters, numbers, dots, hyphens).'
    return false
  }

  return true
}

const superAdminUserId = ref(null)
const { mutateAsync: createCompanyUser } = useCreateCompanyUser()

async function sendSuperAdminOtp() {
  if (!validateSuperAdminEmail()) return
  isSendingOtp.value = true
  superAdminEmailError.value = ''
  try {
    const companyIdRaw = companyID.value ?? localStorage.getItem('company_id') ?? ''
    // FIX 4: Pass superAdminRole directly (resolved from roles list, not from UI input)
    // FIX 5: Pass the computed full email (prefix + @domain)
    const result = await createCompanyUser({
      u_email: superAdminEmail.value,
      domain: dnsInput.value.trim(),
      company_id: companyIdRaw,
      u_full_name: superAdminName.value.trim(),
      company_role_id: superAdminRole.value,
      u_password: superAdminPassword.value.trim(),
    })
    // Store the created user id for OTP verification
    superAdminUserId.value = result?.data?._id ?? result?._id ?? null
    superAdminOtpSent.value = true
    otpDigits.value = ['', '', '', '', '']
    otpError.value  = ''
    await nextTick()
    otpInputRefs.value[0]?.focus()
  } catch (err) {
    const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to send OTP. Please try again.'
    superAdminEmailError.value = msg
    toast.error(msg)
  } finally {
    isSendingOtp.value = false
  }
}

async function verifySuperAdminOtp() {
  const otp = otpDigits.value.join('').trim()

  if (otp.length !== 5) return

  isVerifyingOtp.value = true
  otpError.value = ''

  try {
    const companyIdRaw =
      companyID.value ?? localStorage.getItem('company_id') ?? ''

    await verifyOtp({
      user_id: superAdminUserId.value,
      otp,
      company_id: companyIdRaw,
    })

    toast.success('Super admin verified successfully')

    // proceed to next step
    activeStep.value++

  } catch (err) {
    const msg =
      err?.response?.data?.message ??
      err?.message ??
      'Invalid or expired OTP'

    otpError.value = msg
  } finally {
    isVerifyingOtp.value = false
  }
}

async function resendSuperAdminOtp() {
  isSendingOtp.value = true
  otpError.value = ''

  try {
    const companyIdRaw =
      companyID.value ?? localStorage.getItem('company_id') ?? ''

    await sendOtp({
      user_id: superAdminUserId.value,
      company_id: companyIdRaw,
    })

    otpDigits.value = ['', '', '', '', '']
    startOtpResendCountdown(60)

    await nextTick()
    otpInputRefs.value[0]?.focus()

    toast.success('OTP resent successfully')

  } catch (err) {
    const msg =
      err?.response?.data?.message ??
      err?.message ??
      'Failed to resend OTP'

    otpError.value = msg
  } finally {
    isSendingOtp.value = false
  }
}

// ─── OTP Input handlers ───────────────────────────────────────────────────────
function onOtpInput(idx, event) {
  const val   = event.target.value
  const digit = val.replace(/\D/g, '').slice(-1)
  otpDigits.value[idx] = digit
  otpError.value = ''
  if (digit && idx < 4) {
    nextTick(() => otpInputRefs.value[idx + 1]?.focus())
  }
  if (otpDigits.value.join('').length === 5) {
    nextTick(() => verifySuperAdminOtp())
  }
}

function onOtpKeydown(idx, event) {
  if (event.key === 'Backspace') {
    if (!otpDigits.value[idx] && idx > 0) {
      otpDigits.value[idx - 1] = ''
      nextTick(() => otpInputRefs.value[idx - 1]?.focus())
    } else {
      otpDigits.value[idx] = ''
    }
    otpError.value = ''
  } else if (event.key === 'ArrowLeft' && idx > 0) {
    otpInputRefs.value[idx - 1]?.focus()
  } else if (event.key === 'ArrowRight' && idx < 4) {
    otpInputRefs.value[idx + 1]?.focus()
  }
}

function onOtpPaste(event) {
  event.preventDefault()
  const pasted = (event.clipboardData || window.clipboardData).getData('text')
  const digits = pasted.replace(/\D/g, '').slice(0, 5).split('')
  digits.forEach((d, i) => { if (i < 5) otpDigits.value[i] = d })
  otpError.value = ''
  const lastIdx = Math.min(digits.length - 1, 4)
  nextTick(() => {
    otpInputRefs.value[lastIdx]?.focus()
    if (otpDigits.value.join('').length === 5) verifySuperAdminOtp()
  })
}

// ─── Domain Verification Actions (Step 8, Scenario 2a only) ──────────────────
async function startDomainVerificationPhase() {
  if (isRegisteringDomain.value) return
  isRegisteringDomain.value = true
  recheckError.value        = null
  methodSwitched.value      = false
  try {
    const result = await workspaceStore.verifyDomain(
      dnsInput.value.trim(),
      selectedVerificationMethod.value
    )
    currentDomain.value              = result.domain
    currentInstructions.value        = result.instructions
    selectedVerificationMethod.value = result.domain.verification_method
    methodSwitched.value             = !!result.methodSwitched || (
      result.domain.verification_method !== selectedVerificationMethod.value
    )
    domainPhase.value = 'verify'
  } catch (err) {
    const status = err?.response?.status
    const msg    = err?.response?.data?.message ?? err?.message ?? 'Failed to register domain. Please try again.'
    toast.error(msg)
    recheckError.value = status === 409
      ? 'This domain is already claimed by another workspace.'
      : msg
  } finally {
    isRegisteringDomain.value = false
  }
}

async function recheckVerification() {
  if (!currentDomain.value || isRechecking.value || retryCountdown.value > 0) return
  isRechecking.value = true
  recheckError.value = null
  try {
    const { data, retryAfter } = await workspaceStore.recheckDomain(currentDomain.value._id)
    if (retryAfter !== null) {
      return
    }
    if (data) {
      currentDomain.value       = data.domain
      currentInstructions.value = data.instructions
    }
  } catch (err) {
    const msg = err?.response?.data?.message ?? err?.message ?? 'Verification check failed. Please try again.'
    recheckError.value = (err?.response?.status === 400 && msg.toLowerCase().includes('disabled'))
      ? 'This domain has been disabled. Please contact support.'
      : msg
  } finally {
    isRechecking.value = false
  }
}

async function switchVerificationMethod(method) {
  if (!currentDomain.value || isSwitchingMethod.value) return
  if (method === selectedVerificationMethod.value) return
  selectedVerificationMethod.value = method
  isSwitchingMethod.value = true
  recheckError.value = null
  try {
    const result = await workspaceStore.verifyDomain(dnsInput.value.trim(), method)
    currentDomain.value              = result.domain
    currentInstructions.value        = result.instructions
    selectedVerificationMethod.value = result.domain.verification_method
    methodSwitched.value             = false
  } catch (err) {
    recheckError.value = err?.response?.data?.message ?? err?.message ?? 'Failed to switch verification method.'
  } finally {
    isSwitchingMethod.value = false
  }
}

async function downloadVerificationFile() {
  if (!currentDomain.value || isDownloadingFile.value) return
  isDownloadingFile.value = true
  try {
    await workspaceStore.downloadVerificationFile(currentDomain.value._id)
  } catch (err) {
    recheckError.value = err?.response?.data?.message ?? 'Failed to download verification file.'
  } finally {
    isDownloadingFile.value = false
  }
}

async function setPrimaryDomain() {
  if (!currentDomain.value || isSettingPrimary.value) return
  isSettingPrimary.value = true
  try {
    const updated = await workspaceStore.setPrimaryDomain(currentDomain.value._id)
    currentDomain.value = updated
  } catch (err) {
    recheckError.value = err?.response?.data?.message ?? 'Failed to set as primary domain.'
  } finally {
    isSettingPrimary.value = false
  }
}

function skipDomainVerification() {
  proceedToEnrolUsers()
}

async function proceedToEnrolUsers() {
  activeStep.value = 9
  await loadDomainUsers()
}

// ─── Domain User Enrolment (Step 9) ──────────────────────────────────────────
async function loadDomainUsers() {
  const companyIdRaw = companyID.value ?? localStorage.getItem('company_id') ?? ''
  if (!companyIdRaw) return
  isLoadingDomainUsers.value  = true
  domainUsersError.value      = null
  domainUsers.value           = []
  selectedDomainUserIds.value = []
  try {
    const users = await workspaceStore.listDomainUsers(companyIdRaw)
    domainUsers.value = users
  } catch (err) {
    domainUsersError.value = err?.response?.data?.message ?? err?.message ?? 'Failed to load domain users.'
  } finally {
    isLoadingDomainUsers.value = false
  }
}

function toggleDomainUser(userId) {
  const idx = selectedDomainUserIds.value.indexOf(userId)
  if (idx === -1) selectedDomainUserIds.value.push(userId)
  else selectedDomainUserIds.value.splice(idx, 1)
}

function selectAllDomainUsers() {
  selectedDomainUserIds.value = domainUsers.value.map(u => u._id)
}

async function enrolSelectedUsers() {
  if (selectedDomainUserIds.value.length === 0) return
  const companyIdRaw = companyID.value ?? localStorage.getItem('company_id') ?? ''
  isEnrolling.value  = true
  enrolError.value   = null
  enrolSuccess.value = null
  try {
    const result   = await workspaceStore.enrolDomainUsers(companyIdRaw, selectedDomainUserIds.value)
    const enrolled = result?.enrolled ?? selectedDomainUserIds.value.length
    const skipped  = result?.skipped ?? 0
    enrolSuccess.value = `${enrolled} user${enrolled !== 1 ? 's' : ''} enrolled successfully${skipped > 0 ? `, ${skipped} skipped` : ''}.`
    setTimeout(() => { finishOnboarding() }, 1500)
  } catch (err) {
    enrolError.value = err?.response?.data?.message ?? err?.message ?? 'Failed to enrol users. Please try again.'
  } finally {
    isEnrolling.value = false
  }
}

function skipEnrol() {
  finishOnboarding()
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────
const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

function getUserAvatarColor(userId) {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getUserInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateCompanyStep() {
  const next = {}
  if (!team.value.trim()) next.team        = 'Please enter your company name.'
  if (!role.value)        next.role        = 'Please select your role.'
  if (!companySize.value) next.companySize = 'Please select your company size.'
  errors.value = next
  return Object.keys(next).length === 0
}

function validatePersonalStep() {
  const next = {}
  if (!personalRole.value.trim()) next.personalRole = 'Please tell us what you do.'
  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}

function validateSchoolStep() {
  const next = {}
  if (!schoolName.value.trim()) next.schoolName     = 'Please enter your school or university name.'
  if (!educationLevel.value)    next.educationLevel = 'Please select your education level.'
  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function goBack() {
  if (siteCreated.value) return
  activeStep.value = Math.max(1, activeStep.value - 1)
}

async function continueHandler() {

  // ── Step 1: select use case ──────────────────────────────────────────────
  if (activeStep.value === 1) {
    activeStep.value++
    return
  }

  // ── Step 2: validate about info ──────────────────────────────────────────
  if (activeStep.value === 2) {
    if (selected.value === 'team'     && !validateCompanyStep())  return
    if (selected.value === 'personal' && !validatePersonalStep()) return
    if (selected.value === 'school'   && !validateSchoolStep())   return
    activeStep.value++
    return
  }

  // ── Step 3: select modules ───────────────────────────────────────────────
  if (activeStep.value === 3) {
    if (selectedModules.value.length === 0) {
      errors.value.selectedModules = 'Please select at least one option.'
      return
    }
    activeStep.value++
    return
  }

  // ── Step 4: work type + branching ────────────────────────────────────────
  if (activeStep.value === 4) {
    if (!workType.value) {
      errors.value.workType = 'Please select what kind of work you do.'
      return
    }
    if (selected.value === 'personal') {
      isUpdatingProfile.value = true
      isLoaderRunning.value = true
      try {
        await updateUserProfile({
          u_work_to_do:   personalRole.value,
          work_to_do:     workType.value,
          like_to_manage: selectedModules.value,
          heard_about_us: referralSources.value,
        })
        activeStep.value      = 6
      } catch {
        // stay on step 4 if the API call fails
        isUpdatingProfile.value = false
        isLoaderRunning.value = false
      }
      return
    }

    // ── TEAM / SCHOOL: go to site creation ───────────────────────────────
    activeStep.value = 5
    return
  }

  // ── Step 7: referral sources → determine next step by scenario ──────────
  if (activeStep.value === 7) {
    // Team/school: updateProfile → onSuccess handles routing per scenario
    updateProfile({ payload: buildProfilePayload() })
    return
  }

  activeStep.value++
}

async function continueSiteHandler() {
  if (isCreateSiteDisabled.value) return

  // Scenario 2a: gmail + custom domain verified → create company first, then super admin OTP
  if (!isCompanyEmail.value && hasCustomDomain.value && isDnsAvailable.value === true) {
    // FIX 1: Must call createProfile BEFORE going to step 51
    // The super admin step needs company_id and company_role_id
    pendingSuperAdminStep.value = true
    isProvisioning.value  = true
    isLoaderRunning.value = true
    activeStep.value      = 6  // show loading while company is being created
    createProfile({ payload: buildProfilePayload(true) })
    return
  }

  // Scenario 2b or 3: provision workspace
  activeStep.value      = 6
  isProvisioning.value  = true
  isLoaderRunning.value = true
  createProfile({ payload: buildProfilePayload(true) })
}

</script>

<style scoped>
.rocket-loader {
  position: relative;
  width: 70px;
  height: 70px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 7px solid #6e3b96;
  border-radius: 50%;
}
.rocket {
  font-size: 28px;
  z-index: 2;
  animation: rocketShake 0.25s infinite linear;
}
.flame {
  position: absolute;
  bottom: 8px;
  width: 10px;
  height: 18px;
  background: linear-gradient(to top, #ff7a18, #ffb347, transparent);
  border-radius: 50%;
  filter: blur(0.6px);
  animation: flameFlicker 0.12s infinite alternate;
}
.smoke {
  position: absolute;
  bottom: 0;
  width: 26px;
  height: 26px;
  background: radial-gradient(circle, rgba(124,92,252,0.25), transparent 70%);
  border-radius: 50%;
  animation: smokePulse 0.9s infinite ease-in-out;
}
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
.custom-scroll::-webkit-scrollbar { width: 4px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 9999px; }
@keyframes rocketShake {
  0%   { transform: translateY(0px) rotate(0deg); }
  25%  { transform: translateY(-1px) rotate(-1deg); }
  50%  { transform: translateY(0px) rotate(1deg); }
  75%  { transform: translateY(1px) rotate(-1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}
@keyframes flameFlicker {
  0%   { height: 14px; opacity: 0.7; transform: scaleX(0.9); }
  100% { height: 26px; opacity: 1;   transform: scaleX(1.2); }
}
@keyframes smokePulse {
  0%   { transform: scale(0.6); opacity: 0.3; }
  50%  { transform: scale(1.2); opacity: 0.6; }
  100% { transform: scale(1.6); opacity: 0; }
}
@media (max-width: 640px) {
  .how_help_steps { grid-template-columns: 1fr 1fr !important; }
}
@media (max-width: 350px) {
  .how_help_steps { grid-template-columns: 1fr !important; }
}
</style>