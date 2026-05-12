<!-- components/CreateOrganizationInline.vue -->
<template>
  <div class="w-full space-y-6">

    <!-- Step 2: Company Info -->
    <div v-if="activeStep === 2" class="space-y-6">
      <div class="space-y-2 mb-6">
        <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">Tell us about your company</h2>
        <p class="text-sm font-medium text-text-secondary">This will help us personalize your experience.</p>
      </div>
      <BaseTextField v-model="team" label="Company Name" placeholder="Company name" size="lg"
        :error="!!errors.team" :message="errors.team" />
      <BaseSelectField v-model="role" label="What role do you perform in your company?" :options="rolesList || []"
        placeholder="Select Role" size="lg" :error="!!errors.role" :message="errors.role" />
      <BaseSelectField v-model="companySize" label="What's your company size?" :options="companySizeOptions"
        placeholder="Select Company size" size="lg" :error="!!errors.companySize" :message="errors.companySize" />
    </div>

    <!-- Step 3: Modules -->
    <div v-if="activeStep === 3" class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">What would you like to manage?</h2>
        <p class="text-sm font-medium text-text-secondary">You can select multiple options.</p>
      </div>
      <div class="flex flex-wrap gap-3">
        <button v-for="module in teamModules" :key="module.id" type="button" @click="toggleModule(module.id)"
          class="px-4 py-2 rounded-full border text-sm transition-all"
          :class="selectedModules.includes(module.id) ? 'bg-accent/30 border-accent text-text-primary' : 'border-border text-text-secondary'">
          {{ module.label }}
        </button>
      </div>
      <p v-if="errors.selectedModules" class="text-xs text-red-500">{{ errors.selectedModules }}</p>
    </div>

    <!-- Step 4: Work Type -->
    <div v-if="activeStep === 4" class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">What kind of work do you do?</h2>
        <p class="text-sm text-text-secondary">This helps us tailor your workspace experience.</p>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <button v-for="item in teamWorkTypeOptions" :key="item.id" @click="workType = item.id" type="button"
          class="flex items-center gap-3 p-4 rounded-xl border transition-all text-left"
          :class="workType === item.id ? 'bg-accent/30 border-accent' : 'border-border'">
          <FontAwesomeIcon :icon="['fas', item.icon]" class="text-lg text-text-primary" />
          <span class="text-sm font-medium text-text-primary">{{ item.label }}</span>
        </button>
      </div>
      <p v-if="errors.workType" class="text-xs text-red-500 mt-2">{{ errors.workType }}</p>
    </div>

    <!-- Step 5: Create Site -->
    <div v-if="activeStep === 5">
      <div class="rounded-2xl border p-8 space-y-6" style="background: var(--bg-card); border-color: var(--border);">
        <div class="text-center space-y-3">
          <div class="w-14 h-14 rounded-[14px] border flex items-center justify-center mx-auto"
            style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.2);">
            <img src="/src/assets/global/favicon.png" alt="logo" />
          </div>
          <h2 class="text-[22px] font-bold tracking-tight" style="color: var(--text-primary);">Create your site</h2>
          <p class="text-sm leading-relaxed max-w-75 mx-auto" style="color: var(--text-secondary);">
            Sites are the shared space where your team organizes work, projects, and goals.
          </p>
        </div>

        <!-- Site name input (hidden when custom domain active) -->
        <div v-if="!hasCustomDomain" class="space-y-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
            Site name
          </label>
          <div class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
            :class="{
              'ring-[3px] ring-(--accent)/[0.14]': isFocused && isSlugAvailable !== false,
              'ring-[3px] ring-red-500/10': isFocused && isSlugAvailable === false,
            }"
            :style="{
              borderColor: isFocused && isSlugAvailable === true ? 'var(--accent)'
                : isFocused && isSlugAvailable === false ? '#e55050'
                : 'var(--border-input)',
              background: 'var(--bg-input)',
            }">
            <input v-model="siteName" type="text" placeholder="e.g. acme, my-team"
              class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
              style="color: var(--text-primary);"
              @focus="isFocused = true" @blur="isFocused = false" />
            <div class="flex items-center gap-2 px-3.5 border-l"
              style="background: var(--bg-surface); border-color: var(--border);">
              <span class="text-[13px] font-semibold whitespace-nowrap" style="color: var(--text-secondary);">.orchit.ai</span>
              <span v-if="isCheckingSlug"
                class="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                style="border-color: var(--border); border-top-color: var(--accent);" />
              <Transition
                enter-active-class="transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                enter-from-class="opacity-0 scale-50" enter-to-class="opacity-100 scale-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-50">
                <span v-if="isSlugAvailable === true && !isCheckingSlug"
                  class="flex items-center justify-center w-5 h-5 rounded-full shrink-0" style="background: #1d9e75;">
                  <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </span>
                <span v-else-if="isSlugAvailable === false && !isCheckingSlug"
                  class="flex items-center justify-center w-5 h-5 rounded-full shrink-0" style="background: #e55050;">
                  <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                    <path d="M3 3l4 4M7 3l-4 4" stroke="white" stroke-width="1.6" stroke-linecap="round" />
                  </svg>
                </span>
              </Transition>
            </div>
          </div>
          <p v-if="isSlugAvailable === false && !isCheckingSlug" class="text-xs" style="color: #e55050;">
            This site name is already taken. Please choose another.
          </p>
          <p v-else-if="isSlugAvailable === true && !isCheckingSlug" class="text-xs" style="color: #1d9e75;">
            <span class="font-medium">{{ siteSlug }}</span>.orchit.ai is available
          </p>
          <p v-else class="text-xs" style="color: var(--text-secondary);">
            This is just a suggestion — feel free to change it.
          </p>
        </div>

        <!-- URL preview -->
        <div v-if="siteSlug && isSlugAvailable === true && !hasCustomDomain"
          class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 border"
          style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.18);">
          <div class="w-2 h-2 rounded-full shrink-0" style="background: var(--accent); opacity: 0.7;" />
          <span class="text-[13px] font-semibold break-all" style="color: var(--accent);">
            https://{{ siteSlug }}.orchit.ai
          </span>
        </div>

        <!-- Suggestions when taken -->
        <Transition enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2" enter-to-class="opacity-100 translate-y-0">
          <div v-if="isSlugAvailable === false && siteSlug && !isCheckingSlug && !hasCustomDomain" class="space-y-2">
            <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Try one of these</p>
            <div class="flex flex-wrap gap-2">
              <button v-for="s in [`${siteSlug}-app`, `${siteSlug}-hq`, `${siteSlug}-team`]" :key="s"
                type="button"
                class="px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 hover:-translate-y-px"
                style="border-color: var(--border); color: var(--text-secondary); background: var(--bg-card);"
                @click="siteName = s">
                {{ s }}
              </button>
            </div>
          </div>
        </Transition>

        <!-- Divider -->
        <div class="flex items-center gap-3">
          <div class="flex-1 h-px" style="background: var(--border);" />
          <span class="text-xs font-medium" style="color: var(--text-secondary);">Optional</span>
          <div class="flex-1 h-px" style="background: var(--border);" />
        </div>

        <!-- Custom domain toggle -->
        <button
          type="button"
          class="w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all duration-200 text-left"
          :style="{
            borderColor: hasCustomDomain ? 'var(--accent)' : 'var(--border)',
            background:  hasCustomDomain ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'var(--bg-surface)',
          }"
          @click="toggleCustomDomain"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200"
            :style="{
              background: hasCustomDomain ? 'color-mix(in srgb, var(--accent) 18%, transparent)' : 'var(--bg-card)',
              border: '1.5px solid',
              borderColor: hasCustomDomain ? 'color-mix(in srgb, var(--accent) 35%, transparent)' : 'var(--border)',
            }"
          >
            <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" :style="{ color: hasCustomDomain ? 'var(--accent)' : 'var(--text-secondary)' }">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 2.5c0 0-3 3.5-3 7.5s3 7.5 3 7.5M10 2.5c0 0 3 3.5 3 7.5s-3 7.5-3 7.5M2.5 10h15"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-semibold leading-tight"
                :style="{ color: hasCustomDomain ? 'var(--accent)' : 'var(--text-primary)' }">
                Use a custom domain
              </p>
              <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0"
                style="background: color-mix(in srgb, #1d9e75 12%, transparent); color: #1d9e75;">
                Teams
              </span>
            </div>
            <p class="text-xs mt-0.5" style="color: var(--text-secondary);">e.g. mycompany.com, brand.pk, startup.ai</p>
          </div>
          <div
            class="w-10 h-6 rounded-full border-2 flex items-center transition-all duration-300 shrink-0 px-0.5"
            :style="{
              borderColor: hasCustomDomain ? 'var(--accent)' : 'var(--border)',
              background:  hasCustomDomain ? 'var(--accent)' : 'transparent',
              justifyContent: hasCustomDomain ? 'flex-end' : 'flex-start',
            }"
          >
            <div class="w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300" />
          </div>
        </button>

        <!-- Custom domain input + DNS check -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2 max-h-0"
          enter-to-class="opacity-100 translate-y-0 max-h-[500px]"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 max-h-[500px]"
          leave-to-class="opacity-0 -translate-y-2 max-h-0"
        >
          <div v-if="hasCustomDomain" class="space-y-4 overflow-hidden">
            <div class="flex items-start gap-3 rounded-lg px-4 py-3 border"
              style="background: color-mix(in srgb, var(--accent) 6%, transparent); border-color: color-mix(in srgb, var(--accent) 20%, transparent);">
              <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: var(--accent);">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                <path d="M8 7v5M8 5.5v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
              <p class="text-xs leading-relaxed" style="color: var(--accent);">
                Custom domains are best for larger teams. Your workspace URL will be your own brand
                (e.g.&nbsp;<strong>app.mycompany.com</strong>).
              </p>
            </div>

            <div class="space-y-2">
              <p class="text-xs" style="color: var(--text-secondary);">
                Must include a TLD like
                <span class="font-semibold" style="color: var(--text-primary);">.com</span>,
                <span class="font-semibold" style="color: var(--text-primary);">.pk</span>,
                <span class="font-semibold" style="color: var(--text-primary);">.ai</span>,
                <span class="font-semibold" style="color: var(--text-primary);">.io</span>, etc.
              </p>

              <div
                class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
                :style="{
                  borderColor: (dnsError || dnsValidationError) && !isCheckingDns ? '#e55050'
                             : isDnsAvailable === false && !isCheckingDns ? '#e55050'
                             : isDnsAvailable === true  && !isCheckingDns ? '#1d9e75'
                             : 'var(--border-input)',
                  background: 'var(--bg-input)',
                }"
              >
                <input
                  v-model="dnsInput"
                  type="text"
                  placeholder="e.g. mycompany.com"
                  class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                  style="color: var(--text-primary);"
                  autocomplete="off"
                />
                <div class="flex items-center gap-2 px-3 border-l shrink-0"
                  style="background: var(--bg-surface); border-color: var(--border);">
                  <span v-if="isCheckingDns"
                    class="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                    style="border-color: var(--border); border-top-color: var(--accent);" />
                  <Transition
                    enter-active-class="transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                    enter-from-class="opacity-0 scale-50" enter-to-class="opacity-100 scale-100"
                    leave-active-class="transition duration-150 ease-in"
                    leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-50">
                    <span v-if="isDnsAvailable === true && !isCheckingDns && !dnsError && !dnsValidationError"
                      class="flex items-center justify-center w-5 h-5 rounded-full shrink-0" style="background: #1d9e75;">
                      <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                    <span v-else-if="(isDnsAvailable === false || dnsError || dnsValidationError) && !isCheckingDns"
                      class="flex items-center justify-center w-5 h-5 rounded-full shrink-0" style="background: #e55050;">
                      <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                        <path d="M3 3l4 4M7 3l-4 4" stroke="white" stroke-width="1.6" stroke-linecap="round" />
                      </svg>
                    </span>
                  </Transition>
                </div>
              </div>

              <p v-if="dnsValidationError" class="text-xs flex items-center gap-1" style="color: #e55050;">
                <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                  <path d="M3 3l4 4M7 3l-4 4" stroke="#e55050" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                {{ dnsValidationError }}
              </p>
              <p v-else-if="isCheckingDns" class="text-xs" style="color: var(--text-secondary);">Checking DNS availability…</p>
              <p v-else-if="dnsError" class="text-xs flex items-center gap-1" style="color: #e55050;">
                <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                  <path d="M3 3l4 4M7 3l-4 4" stroke="#e55050" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
                {{ dnsError }}
              </p>
              <p
                  v-else-if="isDnsAvailable === true && dnsInput.trim()"
                  class="text-xs flex items-center gap-1"
                  style="color: #1d9e75;"
                >
                <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span class="font-medium">{{ dnsInput.trim() }}</span>
                  &nbsp;is active and connected — great choice!
              </p>

              <!-- Domain taken: registrar links -->
              <div v-if="isDnsAvailable === false && dnsInput.trim() && !isCheckingDns" class="space-y-3">
                <div class="flex items-start gap-3 rounded-lg px-4 py-3 border"
                  style="background: color-mix(in srgb, #e55050 6%, transparent); border-color: color-mix(in srgb, #e55050 25%, transparent);">
                  <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #e55050;">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                    <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                  <div>
                    <p class="text-xs font-semibold mb-0.5" style="color: #e55050;">Domain already registered</p>
                    <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">
                      <span class="font-medium" style="color: var(--text-primary);">{{ dnsInput.trim() }}</span>
                      is already taken. Try a different domain or purchase one from a registrar below.
                    </p>
                  </div>
                </div>
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wider mb-2" style="color: var(--text-secondary);">
                    Purchase a domain from
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <a v-for="registrar in domainRegistrars" :key="registrar.name"
                      :href="`${registrar.url}${encodeURIComponent(dnsInput.trim())}`"
                      target="_blank" rel="noopener noreferrer"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 hover:-translate-y-px hover:shadow-sm"
                      style="border-color: var(--border); background: var(--bg-card); color: var(--text-primary);">
                      <span>{{ registrar.name }}</span>
                      <svg class="w-3 h-3 opacity-50" viewBox="0 0 12 12" fill="none">
                        <path d="M2 10L10 2M10 2H5M10 2v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </a>
                  </div>
                  <p class="text-[11px] mt-2" style="color: var(--text-secondary);">
                    After purchasing, come back and enter your domain here.
                  </p>
                </div>
              </div>

              <p v-else-if="!dnsInput.trim()" class="text-xs" style="color: var(--text-secondary);">
                We'll verify DNS availability before proceeding.
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Step 6: Loading -->
    <div v-if="activeStep === 6" class="flex items-center justify-center py-12">
      <LoadingCreateProfile :active="true" :abort="!!companySlugError" @complete="activeStep = 7" />
    </div>

    <!-- Step 7: Referral -->
    <div v-if="activeStep === 7" class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">Where did you hear about us?</h2>
        <p class="text-sm text-text-secondary">This helps us improve our onboarding experience.</p>
      </div>
      <div class="grid grid-cols-2 gap-3">
        <button v-for="item in referralOptions" :key="item.id" @click="toggleReferral(item.id)" type="button"
          class="px-4 py-3 rounded-xl border text-sm font-medium transition"
          :class="referralSources.includes(item.id) ? 'bg-accent/30 border-accent' : 'border-border'">
          {{ item.label }}
        </button>
      </div>
    </div>

    <!-- Step 8: Super Admin (only when custom domain verified) -->
    <div v-if="activeStep === 8" class="space-y-6">
      <div class="space-y-2">
        <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">Create Super Admin</h2>
        <p class="text-sm text-text-secondary leading-relaxed">
          This account will manage your workspace on your custom domain.
        </p>
      </div>

      <div class="rounded-xl border border-border p-5 space-y-4" style="background: var(--bg-card);">
        <div class="flex items-center gap-2">
          <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style="background: var(--accent);">
            <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
              <path d="M5 1a2 2 0 1 1 0 4A2 2 0 0 1 5 1zM2 8.5C2 6.567 3.343 5 5 5s3 1.567 3 3.5"
                stroke="white" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-text-primary">Super Admin Account</p>
            <p class="text-xs text-text-secondary">Required — manages your workspace</p>
          </div>
          <span class="ml-auto text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style="background-color: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent);">
            Required
          </span>
        </div>

        <!-- Full Name -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
            Full Name
          </label>
          <div class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
            :style="{ borderColor: errors.adminFullName ? '#e55050' : 'var(--border-input)', background: 'var(--bg-input)' }">
            <input v-model="adminFullName" type="text" placeholder="e.g. Jane Doe"
              class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
              style="color: var(--text-primary);"
              @input="errors.adminFullName = undefined" />
          </div>
          <p v-if="errors.adminFullName" class="text-xs" style="color: #e55050;">{{ errors.adminFullName }}</p>
        </div>

        <!-- Email — custom domain -->
        <div v-if="hasCustomDomain && isDnsAvailable === true" class="space-y-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
            Admin Email
          </label>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium mb-1"
            style="background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);">
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 2c0 0-3 3.5-3 8s3 8 3 8M10 2c0 0 3 3.5 3 8s-3 8-3 8M2 10h16"
                stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Using your custom domain: <strong>{{ dnsInput.trim() }}</strong>
          </div>
          <div class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px]"
            :style="{ borderColor: errors.adminUsername ? '#e55050' : 'var(--border-input)', background: 'var(--bg-input)' }">
            <input v-model="adminUsername" type="text" placeholder="username"
              class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
              style="color: var(--text-primary);"
              @input="adminUsername = adminUsername.toLowerCase().replace(/[^a-z0-9._-]/g, ''); errors.adminUsername = undefined" />
            <div class="flex items-center px-3.5 border-l shrink-0"
              style="background: var(--bg-surface); border-color: var(--border);">
              <span class="text-[13px] font-semibold whitespace-nowrap" style="color: var(--text-secondary);">
                @{{ dnsInput.trim() }}
              </span>
            </div>
          </div>
          <p v-if="errors.adminUsername" class="text-xs" style="color: #e55050;">{{ errors.adminUsername }}</p>
          <p v-else class="text-xs" style="color: var(--text-secondary);">
            Full email: <span class="font-medium" style="color: var(--text-primary);">{{ adminEmailCustom }}</span>
          </p>
        </div>

        <!-- Email — plain -->
        <div v-else class="space-y-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
            Admin Email
          </label>
          <div class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
            :style="{ borderColor: errors.adminEmail ? '#e55050' : 'var(--border-input)', background: 'var(--bg-input)' }">
            <div class="flex items-center px-3.5 border-r shrink-0"
              style="background: var(--bg-surface); border-color: var(--border);">
              <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: var(--text-secondary);">
                <path d="M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" stroke-width="1.3"/>
                <path d="M2 4l6 5 6-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
            </div>
            <input v-model="adminEmailPlain" type="email" placeholder="e.g. admin@company.com"
              class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
              style="color: var(--text-primary);"
              @input="errors.adminEmail = undefined" />
          </div>
          <p v-if="errors.adminEmail" class="text-xs" style="color: #e55050;">{{ errors.adminEmail }}</p>
        </div>

        <!-- Password -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
            Password
          </label>
          <div class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
            :style="{ borderColor: errors.adminPassword ? '#e55050' : 'var(--border-input)', background: 'var(--bg-input)' }">
            <input v-model="adminPassword" :type="showAdminPassword ? 'text' : 'password'"
              placeholder="Min. 6 characters"
              class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
              style="color: var(--text-primary);"
              @input="errors.adminPassword = undefined" />
            <button type="button"
              class="px-3.5 border-l flex items-center justify-center min-w-[44px] cursor-pointer"
              style="background: var(--bg-surface); border-color: var(--border); color: var(--text-secondary);"
              @click="showAdminPassword = !showAdminPassword">
              <i :class="showAdminPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" class="text-sm" />
            </button>
          </div>
          <p v-if="errors.adminPassword" class="text-xs" style="color: #e55050;">{{ errors.adminPassword }}</p>
        </div>

        <!-- Confirm Password -->
        <div class="space-y-1.5">
          <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
            Confirm Password
          </label>
          <div class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
            :style="{ borderColor: errors.adminConfirmPassword ? '#e55050' : 'var(--border-input)', background: 'var(--bg-input)' }">
            <input v-model="adminConfirmPassword" :type="showAdminConfirmPassword ? 'text' : 'password'"
              placeholder="Re-enter password"
              class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
              style="color: var(--text-primary);"
              @input="errors.adminConfirmPassword = undefined" />
            <button type="button"
              class="px-3.5 border-l flex items-center justify-center min-w-[44px] cursor-pointer"
              style="background: var(--bg-surface); border-color: var(--border); color: var(--text-secondary);"
              @click="showAdminConfirmPassword = !showAdminConfirmPassword">
              <i :class="showAdminConfirmPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" class="text-sm" />
            </button>
          </div>
          <p v-if="errors.adminConfirmPassword" class="text-xs" style="color: #e55050;">{{ errors.adminConfirmPassword }}</p>
        </div>
      </div>

      <!-- Share link -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium text-text-primary">Share via link</label>
        <p class="text-xs text-text-secondary mb-1">Invite teammates to join your company workspace.</p>
        <div class="flex items-center gap-2">
          <div class="flex-1 border border-border rounded-lg px-3 py-2 bg-surface overflow-hidden">
            <span class="text-sm text-text-secondary truncate block">{{ joinLink }}</span>
          </div>
          <Button variant="secondary" size="md" @click="copySiteUrl">
            <div class="flex items-center gap-1.5">
              <FontAwesomeIcon :icon="['fas', isCopied ? 'check' : 'link']" :class="isCopied ? 'text-green-500' : ''" />
              <span :class="isCopied ? 'text-green-500' : ''">{{ isCopied ? 'Copied!' : 'Copy link' }}</span>
            </div>
          </Button>
        </div>
      </div>
    </div>

    <!-- Company slug conflict modal -->
    <Transition enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100" leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 scale-100" leave-to-class="opacity-0 scale-95">
      <div v-if="companySlugError"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
        @click.self="companySlugError = null">
        <div class="w-full max-w-md rounded-2xl bg-bg-dropdown p-6 shadow-xl ring-1 ring-black/5">
          <div class="mb-4 flex h-13 w-13 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <i class="fa-solid fa-triangle-exclamation text-red-500 text-lg"></i>
          </div>
          <h3 class="text-md font-semibold text-text-primary mb-1">Company name already taken</h3>
          <p class="text-sm text-text-secondary leading-relaxed mb-5">{{ companySlugError }}</p>
          <div class="flex gap-2">
            <button type="button"
              class="flex-1 rounded-lg border border-black/10 bg-bg-dropdown px-3 py-2.5 text-sm font-medium text-text-secondary hover:border-black/20 hover:text-text-primary transition cursor-pointer"
              @click="companySlugError = null">
              Dismiss
            </button>
            <button type="button"
              class="flex-[1.5] rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition cursor-pointer"
              @click="() => { companySlugError = null; activeStep = 2 }">
              Change company name
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Navigation -->
    <div v-if="activeStep !== 6" class="flex justify-between items-center pt-4">
      <Button v-if="activeStep > 2 && activeStep !== 8 && activeStep !== 7" variant="secondary" size="md" type="button" @click="goBack">
        <div class="flex items-center gap-1">
          <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
        </div>
      </Button>

      <!-- Step 8: two-button layout -->
      <template v-if="activeStep === 8">
        <Button variant="secondary" size="md" :disabled="isSkipping || isInviting" @click="sendInvites(true)">
          <div class="flex items-center gap-2">
            <span v-if="isSkipping" class="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
            <span>{{ isSkipping ? 'Creating admin...' : 'Do this later' }}</span>
          </div>
        </Button>
        <Button size="md" :disabled="isSkipping || isInviting" @click="sendInvites(false)">
          <div class="flex items-center gap-2">
            <span v-if="isInviting" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>{{ isInviting ? 'Creating admin...' : 'Finish' }}</span>
          </div>
        </Button>
      </template>

      <!-- All other steps -->
      <div v-else class="ml-auto flex gap-3">
        <Button size="md"
          :disabled="isSiteStepBlocked || creatingProfile || updatingProfile" @click="handleContinue">
          <div class="flex items-center gap-2">
            <span v-if="creatingProfile && activeStep === 5"
              class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span>{{ activeStep === 5 ? 'Create site' : 'Continue' }}</span>
          </div>
        </Button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Button from '../../../components/ui/Button.vue'
import BaseTextField from '../../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../../components/ui/BaseSelectField.vue'
import LoadingCreateProfile from '../../../components/LoadingCreateProfile.vue'
import { useCreateCompany, useUpdateCompanyProfile } from '../../../services/auth'
import { useRolesList } from '../../../queries/useCommon'
import { useWorkspaceStore } from '../../../stores/workspace'
import { useAuthStore } from '../../../stores/auth'
import { useCreateCompanyUser } from '../../../queries/useCompanyUsers'

const emit = defineEmits<{ done: [] }>()
const workspaceStore = useWorkspaceStore()
const authStore = useAuthStore()
const { data: rolesList } = useRolesList()

// ── Step ──────────────────────────────────────────────────────────────────────
const activeStep = ref(2)

// ── Step 2 ────────────────────────────────────────────────────────────────────
const team = ref('')
const role = ref('')
const companySize = ref('')

// ── Step 3 ────────────────────────────────────────────────────────────────────
const selectedModules = ref<string[]>([])

// ── Step 4 ────────────────────────────────────────────────────────────────────
const workType = ref('')

// ── Step 5 — site slug ────────────────────────────────────────────────────────
const siteName = ref('')
const siteSlug = ref('')
const isFocused = ref(false)
const isCheckingSlug = ref(false)
const isSlugAvailable = ref<boolean | null>(null)

// ── Step 5 — custom domain ────────────────────────────────────────────────────
const hasCustomDomain = ref(false)
const dnsInput = ref('')
const isCheckingDns = ref(false)
const isDnsAvailable = ref<boolean | null>(null)
const dnsError = ref<string | null>(null)
const dnsValidationError = ref<string | null>(null)

const domainRegistrars = [
  { name: 'GoDaddy',   url: 'https://www.godaddy.com/domainsearch/find?checkAvail=1&tmskey=&domainToCheck=' },
  { name: 'Namecheap', url: 'https://www.namecheap.com/domains/registration/results/?domain=' },
  { name: 'Google',    url: 'https://domains.google.com/registrar/search?searchTerm=' },
  { name: 'Porkbun',   url: 'https://porkbun.com/checkout/search?q=' },
]

// ── Step 7 ────────────────────────────────────────────────────────────────────
const referralSources = ref<string[]>([])

// ── Step 8 — super admin ──────────────────────────────────────────────────────
const adminFullName = ref('')
const adminUsername = ref('')
const adminEmailPlain = ref('')
const adminPassword = ref('')
const adminConfirmPassword = ref('')
const showAdminPassword = ref(false)
const showAdminConfirmPassword = ref(false)
const joinLink = ref('')
const domainLink = ref('')
const companyID = ref('')
const isInviting = ref(false)
const isSkipping = ref(false)
const isCopied = ref(false)
const companySlugError = ref<string | null>(null)
const errors = ref<Record<string, string | undefined>>({})

// ── Computed ──────────────────────────────────────────────────────────────────
const adminEmailCustom = computed(() =>
  adminUsername.value.trim()
    ? `${adminUsername.value.trim()}@${dnsInput.value.trim()}`
    : `@${dnsInput.value.trim()}`
)

const resolvedAdminEmail = computed(() =>
  hasCustomDomain.value && isDnsAvailable.value === true
    ? adminEmailCustom.value
    : adminEmailPlain.value.trim()
)

const isSiteStepBlocked = computed(() => {
  if (activeStep.value !== 5) return false
  if (hasCustomDomain.value) {
    if (!dnsInput.value.trim()) return true
    if (dnsValidationError.value) return true
    if (isCheckingDns.value) return true
    if (dnsError.value) return true
    if (isDnsAvailable.value !== true) return true
    return false
  }
  return !isSlugAvailable.value || isCheckingSlug.value
})

// ── Static data ───────────────────────────────────────────────────────────────
const companySizeOptions = [
  { title: '1 – 10',         _id: '1–10' },
  { title: '11 – 50',        _id: '11–50' },
  { title: '51 – 200',       _id: '51–200' },
  { title: '201 – 500',      _id: '201–500' },
  { title: '501 – 1,000',    _id: '501–1000' },
  { title: '1,001 – 5,000',  _id: '1001–5000' },
  { title: '5,001 – 10,000', _id: '5001–10000' },
  { title: '10,001+',        _id: '10001+' },
]

const teamModules = [
  { id: 'tasks',      label: 'Tasks' },
  { id: 'projects',   label: 'Projects' },
  { id: 'docs',       label: 'Docs' },
  { id: 'goals',      label: 'Goals' },
  { id: 'support',    label: 'Support Desk' },
  { id: 'operations', label: 'Operations' },
  { id: 'knowledge',  label: 'Knowledge Base' },
  { id: 'reporting',  label: 'Reports' },
]

const teamWorkTypeOptions = [
  { id: 'software_development', label: 'Software Development', icon: 'code' },
  { id: 'product_management',   label: 'Product Management',   icon: 'layer-group' },
  { id: 'marketing',            label: 'Marketing',            icon: 'bullhorn' },
  { id: 'design',               label: 'Design',               icon: 'palette' },
  { id: 'sales',                label: 'Sales',                icon: 'chart-line' },
  { id: 'operations',           label: 'Operations',           icon: 'cog' },
  { id: 'hr',                   label: 'Human Resources',      icon: 'users' },
  { id: 'support',              label: 'Customer Support',     icon: 'headset' },
]

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

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSlug(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function toggleModule(id: string) {
  if (selectedModules.value.includes(id)) {
    selectedModules.value = selectedModules.value.filter(m => m !== id)
  } else {
    selectedModules.value.push(id)
    if (errors.value.selectedModules) errors.value.selectedModules = undefined
  }
}

function toggleReferral(id: string) {
  if (referralSources.value.includes(id)) {
    referralSources.value = referralSources.value.filter(i => i !== id)
  } else {
    referralSources.value.push(id)
  }
}

function toggleCustomDomain() {
  hasCustomDomain.value = !hasCustomDomain.value
  if (!hasCustomDomain.value) {
    dnsInput.value           = ''
    isDnsAvailable.value     = null
    dnsError.value           = null
    dnsValidationError.value = null
    isCheckingDns.value      = false
  }
}

function copySiteUrl() {
  navigator.clipboard.writeText(joinLink.value).then(() => {
    isCopied.value = true
    setTimeout(() => (isCopied.value = false), 2000)
  })
}

function goBack() {
  if (activeStep.value === 7) { activeStep.value = 5; return }
  if (activeStep.value === 8) { activeStep.value = 7; return }
  activeStep.value = Math.max(2, activeStep.value - 1)
}

// ── Validation ────────────────────────────────────────────────────────────────
function validateCompanyStep() {
  const next: Record<string, string> = {}
  if (!team.value.trim())    next.team        = 'Please enter your company name.'
  if (!role.value)           next.role        = 'Please select your role.'
  if (!companySize.value)    next.companySize = 'Please select your company size.'
  errors.value = next
  return Object.keys(next).length === 0
}

function validateAdminUser(): boolean {
  const next: Record<string, string> = {}
  const usingCustomDomain = hasCustomDomain.value && isDnsAvailable.value === true

  if (!adminFullName.value.trim()) {
    next.adminFullName = 'Please enter the full name for the super admin.'
  }

  if (usingCustomDomain) {
    if (!adminUsername.value.trim()) {
      next.adminUsername = 'Please enter a username for the super admin.'
    } else if (!/^[a-z0-9._-]+$/.test(adminUsername.value.trim())) {
      next.adminUsername = 'Username can only contain letters, numbers, dots, hyphens, and underscores.'
    }
  } else {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!adminEmailPlain.value.trim()) {
      next.adminEmail = 'Please enter an email address for the super admin.'
    } else if (!emailRe.test(adminEmailPlain.value.trim())) {
      next.adminEmail = 'Please enter a valid email address.'
    }
  }

  if (!adminPassword.value) {
    next.adminPassword = 'Please enter a password.'
  } else if (adminPassword.value.length < 6) {
    next.adminPassword = 'Password must be at least 6 characters.'
  }

  if (!adminConfirmPassword.value) {
    next.adminConfirmPassword = 'Please confirm your password.'
  } else if (adminPassword.value !== adminConfirmPassword.value) {
    next.adminConfirmPassword = 'Passwords do not match.'
  }

  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}

// ── Watchers ──────────────────────────────────────────────────────────────────
watch(siteName, async (val) => {
  siteSlug.value = generateSlug(val)
  if (!siteSlug.value) { isSlugAvailable.value = null; return }
  isCheckingSlug.value = true
  try {
    const result = await workspaceStore.fetchTitleSlug(siteSlug.value)
    isSlugAvailable.value = result?.available ?? null
  } catch {
    isSlugAvailable.value = null
  } finally {
    isCheckingSlug.value = false
  }
})

watch(activeStep, (step) => {
  if (step === 5 && !siteName.value && team.value.trim()) {
    siteName.value = generateSlug(team.value)
  }
})

watch(team,        (v) => { if (v?.trim()  && errors.value.team)        errors.value.team        = undefined })
watch(role,        (v) => { if (v          && errors.value.role)         errors.value.role        = undefined })
watch(companySize, (v) => { if (v          && errors.value.companySize)  errors.value.companySize = undefined })
watch(workType,    (v) => { if (v          && errors.value.workType)     errors.value.workType    = undefined })

const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,10}$/
let dnsDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(dnsInput, (val) => {
  const trimmed = val.trim()
  isDnsAvailable.value     = null
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
        dnsError.value = 'Invalid domain format. Please enter a valid domain (e.g. mycompany.com).'
        isDnsAvailable.value = null
      } else {
        const isRegistered = result?.is_registered === true
        const isActive = result?.is_active === true
        const status = result?.status

        /**
         * ACTIVE + REGISTERED
         * Domain already exists and is usable
         * Allow user to continue
         */
        if (isRegistered && isActive && status === 'ACTIVE') {
          isDnsAvailable.value = true
          dnsError.value = null
        }

        /**
         * Not registered OR inactive
         * User needs to purchase/setup domain first
         */
        else {
          isDnsAvailable.value = false
          dnsError.value = null
        }
      }
    } catch (err: any) {
      if (dnsInput.value.trim() !== captured) return
      dnsError.value       = err?.response?.data?.message ?? err?.message ?? 'Could not verify domain. Please try again.'
      isDnsAvailable.value = null
    } finally {
      if (dnsInput.value.trim() === captured) isCheckingDns.value = false
    }
  }, 600)
})

// ── Mutations ─────────────────────────────────────────────────────────────────
const { mutate: createProfile, isPending: creatingProfile } = useCreateCompany({
  onSuccess: (data: any) => {
    const payload = data?.data ?? data
    if (!payload || payload?.status === false) {
      const msg = payload?.message ?? ''
      companySlugError.value = msg.toLowerCase().includes('slug') || msg.toLowerCase().includes('already exists')
        ? 'A company with a similar name already exists. Please try a different name.'
        : 'Something went wrong while creating your company.'
      return
    }
    companyID.value  = payload?.company_id ?? payload?._id ?? ''
    joinLink.value   = payload?.join_link  ?? ''
    domainLink.value = payload?.domain_link ?? ''
    localStorage.setItem('company_id', companyID.value)
    activeStep.value = 6
  },
  onError: (error: any) => {
    const msg = error?.response?.data?.message ?? error?.message ?? ''
    companySlugError.value = msg.toLowerCase().includes('slug') || msg.toLowerCase().includes('already exists')
      ? 'A company with a similar name already exists. Please try a different name.'
      : 'Something went wrong while creating your company.'
  },
})

const { mutate: updateProfile, isPending: updatingProfile } = useUpdateCompanyProfile({
  onSuccess: async () => {
    // Only show super admin step when custom domain is verified
    if (hasCustomDomain.value && isDnsAvailable.value === true) {
      activeStep.value = 8
    } else {
      await authStore.bootstrap()
      emit('done')
    }
  },
  onError: () => {
    activeStep.value = 5
  },
})

const { mutate: createAdminUser } = useCreateCompanyUser({
  onSuccess: () => {},
  onError:   () => {},
})

// ── Navigation ────────────────────────────────────────────────────────────────
function handleContinue() {
  const company_id = localStorage.getItem('company_id')

  if (activeStep.value === 2) {
    if (!validateCompanyStep()) return
    activeStep.value = 3
    return
  }

  if (activeStep.value === 3) {
    if (selectedModules.value.length === 0) {
      errors.value.selectedModules = 'Please select at least one option.'
      return
    }
    activeStep.value = 4
    return
  }

  if (activeStep.value === 4) {
    if (!workType.value) {
      errors.value.workType = 'Please select what kind of work you do.'
      return
    }
    activeStep.value = 5
    return
  }

  if (activeStep.value === 5) {
    createProfile({
      payload: {
        company_id,
        title:          team.value,
        type:           'team',
        role_id:        role.value,
        company_size:   companySize.value,
        work_to_do:     workType.value,
        like_to_manage: selectedModules.value,
        ...(hasCustomDomain.value && isDnsAvailable.value === true && dnsInput.value.trim()
          ? { custom_domain: dnsInput.value.trim() }
          : { site_slug: siteSlug.value }),
      },
    })
    return
  }

  if (activeStep.value === 7) {
    updateProfile({
      payload: {
        company_id,
        title:          team.value,
        type:           'team',
        role_id:        role.value,
        company_size:   companySize.value,
        work_to_do:     workType.value,
        like_to_manage: selectedModules.value,
        heard_about_us: referralSources.value,
      },
    })
    return
  }

  activeStep.value += 1
}

async function sendInvites(skip = false) {
  if (!validateAdminUser()) return

  if (skip) isSkipping.value = true
  else      isInviting.value = true

  const adminCreationSuccess = await new Promise<boolean>((resolve) => {
    createAdminUser(
      {
        company_id:  companyID.value,
        u_full_name: adminFullName.value.trim(),
        u_email:     resolvedAdminEmail.value,
        u_password:  adminPassword.value,
      },
      {
        onSuccess: () => resolve(true),
        onError: (error: any) => {
          const serverMsg = error?.response?.data?.message ?? ''
          if (hasCustomDomain.value && isDnsAvailable.value === true) {
            errors.value.adminUsername = serverMsg || 'Failed to create super admin. Please try again.'
          } else {
            errors.value.adminEmail = serverMsg || 'Failed to create super admin. Please try again.'
          }
          isSkipping.value = false
          isInviting.value = false
          resolve(false)
        },
      }
    )
  })

  if (!adminCreationSuccess) return

  isSkipping.value = false
  isInviting.value = false
  await authStore.bootstrap()
  emit('done')
}
</script>