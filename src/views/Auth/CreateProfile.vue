<template>
  <AuthLayout
    :steps="stepLabels"
    :activeStep="displayStep"
    :showSteps="activeStep !== 6"
  >
    <template #form>
      <div class="max-w-125 mx-auto w-full min-h-full py-5 flex flex-col justify-center">

        <!-- ═══════════════════════════════════════════════════════
             STEP 1 — How will you use Orchit AI?
        ════════════════════════════════════════════════════════════ -->
        <div class="mb-6 md:mb-12 space-y-2" v-show="activeStep === 1">
          <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-once>
            How will you use Orchit AI?
          </h2>
          <p class="text-[14px] md:text-base sm:text-nowrap font-medium text-text-secondary" v-once>
            This will help us personalize your experience in Orchit AI.
          </p>
        </div>

        <div class="how_help_steps grid sm:grid-cols-3 gap-4" v-show="activeStep === 1">
          <label
            v-for="option in options"
            :key="option._id"
            class="border rounded-xl py-4 px-2.5 cursor-pointer transition-all sm:aspect-square"
            :class="optionClass(option._id)"
            v-memo="[selected, option._id]"
          >
            <input type="radio" class="hidden" v-model="selected" :value="option._id" />
            <div class="flex flex-col items-center">
              <img :src="option.icon" class="w-12 h-12" />
              <h3 class="font-medium text-sm text-text-primary mt-4">{{ option.title }}</h3>
              <p class="text-[11px] text-text-secondary mt-2 text-center">{{ option.description }}</p>
            </div>
          </label>
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
          <p class="text-[14px] md:text-base sm:text-nowrap font-medium text-text-secondary" v-once>
            This will help us personalize your experience in Orchit AI.
          </p>
        </div>

        <div class="space-y-6" v-show="activeStep === 2 && selected === 'team'">
          <BaseTextField
            v-model="team"
            label="Company Name"
            placeholder="Company name"
            size="lg"
            :error="!!errors.team"
            :message="errors.team"
          />
          <BaseSelectField
            v-model="role"
            label="What role do you perform in your company?"
            :options="rolesList || []"
            placeholder="Select Role"
            size="lg"
            :error="!!errors.role"
            :message="errors.role"
          />
          <BaseSelectField
            v-model="companySize"
            label="What's your company size?"
            :options="companySizeOptions"
            placeholder="Select Company size"
            size="lg"
            :error="!!errors.companySize"
            :message="errors.companySize"
          />
        </div>

        <div class="space-y-6" v-show="activeStep === 2 && selected === 'personal'">
          <BaseTextField
            v-model="personalRole"
            label="What do you do?"
            placeholder="e.g. Frontend Developer, Student, Designer"
            size="lg"
            :error="!!errors.personalRole"
            :message="errors.personalRole"
          />
        </div>

        <div class="space-y-6" v-show="activeStep === 2 && selected === 'school'">
          <BaseTextField
            v-model="schoolName"
            label="School / University Name"
            placeholder="e.g. University of Punjab"
            size="lg"
            :error="!!errors.schoolName"
            :message="errors.schoolName"
          />
          <BaseSelectField
            v-model="educationLevel"
            label="Education Level"
            :options="educationOptions"
            placeholder="Select level"
            size="lg"
            :error="!!errors.educationLevel"
            :message="errors.educationLevel"
          />
          <BaseSelectField
            v-model="role"
            label="What is your role in school?"
            :options="rolesList || []"
            placeholder="Select Role"
            size="lg"
            :error="!!errors.role"
            :message="errors.role"
          />
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
              class="px-4 py-2 rounded-full border text-sm transition-all"
              :class="selectedModules.includes(module.id)
                ? 'bg-accent/30 border-accent text-text-primary'
                : 'border-border text-text-secondary'"
            >
              {{ module.label }}
            </button>
          </div>
          <p v-if="errors.selectedModules" class="text-xs text-red-500">
            {{ errors.selectedModules }}
          </p>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 4 — What kind of work do you do?
        ════════════════════════════════════════════════════════════ -->
        <div v-if="activeStep === 4">
          <div class="space-y-2 mb-6">
            <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">
              What kind of work do you do?
            </h2>
            <p class="text-text-secondary text-sm md:text-base">
              This helps us tailor your workspace experience.
            </p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <button
              v-for="item in workTypeOptions"
              :key="item.id"
              @click="workType = item.id"
              type="button"
              class="flex items-center gap-3 p-4 rounded-xl border transition-all text-left"
              :class="workType === item.id ? 'bg-accent/30 border-accent' : 'border-border'"
            >
              <FontAwesomeIcon :icon="['fas', item.icon]" class="text-lg text-text-primary" />
              <span class="text-sm font-medium text-text-primary">{{ item.label }}</span>
            </button>
          </div>
          <p v-if="errors.workType" class="text-xs text-red-500 mt-2">{{ errors.workType }}</p>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 5 — Create your site
             • Custom domain ON  → card button hidden; bottom-nav Continue triggers creation
             • Custom domain OFF → card "Create site" button handles it; bottom nav hidden
        ════════════════════════════════════════════════════════════ -->
        <div v-if="activeStep === 5" class="flex items-center justify-center w-full min-h-full py-3">
          <div class="w-full max-w-115">
            <div
              class="rounded-2xl border p-8 md:p-10 space-y-7"
              style="background: var(--bg-card); border-color: var(--border);"
            >

              <!-- HEADER -->
              <div class="text-center space-y-3">
                <div
                  class="w-14 h-14 rounded-[14px] border flex items-center justify-center mx-auto"
                  style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.2);"
                >
                  <img src="/src/assets/global/favicon.png" alt="logo" />
                </div>
                <h2 class="text-[22px] font-bold tracking-tight" style="color: var(--text-primary);">
                  Create your workspace
                </h2>
                <p class="text-sm leading-relaxed max-w-80 mx-auto" style="color: var(--text-secondary);">
                  Set up your team's home. You can always change these settings later.
                </p>
              </div>

              <!-- ── Site Name Input — hidden when using a custom domain ── -->
              <div v-if="!hasCustomDomain" class="space-y-1.5">
                <label
                  class="text-[11px] font-semibold uppercase tracking-wider block"
                  style="color: var(--text-secondary);"
                >
                  Site name
                </label>

                <div
                  class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
                  :class="{
                    'ring-[3px] ring-(--accent)/[0.14]': isFocused && !isAnyUnavailable,
                    'ring-[3px] ring-red-500/10':        isFocused && isAnyUnavailable,
                  }"
                  :style="{
                    borderColor: isFocused && isFullyAvailable ? 'var(--accent)'
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
                    style="color: var(--text-primary); font-family: 'Lato', sans-serif;"
                    @focus="isFocused = true"
                    @blur="isFocused = false"
                  />

                  <div
                    class="flex items-center gap-2 px-3.5 border-l"
                    style="background: var(--bg-surface); border-color: var(--border);"
                  >
                    <span
                      class="text-[13px] font-semibold whitespace-nowrap"
                      style="color: var(--text-secondary);"
                    >
                      .streamed.space
                    </span>

                    <span
                      v-if="isCheckingSlug"
                      class="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                      style="border-color: var(--border); border-top-color: var(--accent);"
                    />

                    <Transition
                      enter-active-class="transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      enter-from-class="opacity-0 scale-50"
                      enter-to-class="opacity-100 scale-100"
                      leave-active-class="transition duration-150 ease-in"
                      leave-from-class="opacity-100 scale-100"
                      leave-to-class="opacity-0 scale-50"
                    >
                      <span
                        v-if="isSlugAvailable === true && !isCheckingSlug"
                        class="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                        style="background: #1d9e75;"
                      >
                        <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      </span>
                      <span
                        v-else-if="isSlugAvailable === false && !isCheckingSlug"
                        class="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                        style="background: #e55050;"
                      >
                        <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                          <path d="M3 3l4 4M7 3l-4 4" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
                        </svg>
                      </span>
                    </Transition>
                  </div>
                </div>

                <!-- Slug status -->
                <div class="mt-1">
                  <p v-if="isCheckingSlug" class="text-xs" style="color: var(--text-secondary);">
                    Checking availability…
                  </p>
                  <p v-else-if="isSlugAvailable === true" class="text-xs flex items-center gap-1" style="color: #1d9e75;">
                    <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="font-medium">{{ siteSlug }}</span>.streamed.space is available
                  </p>
                  <p v-else-if="isSlugAvailable === false" class="text-xs flex items-center gap-1" style="color: #e55050;">
                    <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                      <path d="M3 3l4 4M7 3l-4 4" stroke="#e55050" stroke-width="1.6" stroke-linecap="round"/>
                    </svg>
                    This site name is already taken. Please choose another.
                  </p>
                  <p v-else class="text-xs" style="color: var(--text-secondary);">
                    This is pre-filled from your company name — feel free to change it.
                  </p>
                </div>

                <!-- Slug suggestions when taken -->
                <Transition
                  enter-active-class="transition duration-200 ease-out"
                  enter-from-class="opacity-0 -translate-y-2"
                  enter-to-class="opacity-100 translate-y-0"
                >
                  <div v-if="isSlugAvailable === false && siteSlug && !isCheckingSlug" class="space-y-2 mt-1">
                    <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">
                      Try one of these
                    </p>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="s in [`${siteSlug}-app`, `${siteSlug}-hq`, `${siteSlug}-team`]"
                        :key="s"
                        type="button"
                        class="px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-150 hover:-translate-y-px"
                        style="border-color: var(--border); color: var(--text-secondary); background: var(--bg-card);"
                        @click="siteName = s"
                      >
                        {{ s }}
                      </button>
                    </div>
                  </div>
                </Transition>
              </div>

              <!-- Live URL preview — hidden when using a custom domain -->
              <div
                v-if="siteSlug && isSlugAvailable === true && !hasCustomDomain"
                class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 border"
                style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.18);"
              >
                <div class="w-2 h-2 rounded-full shrink-0" style="background: var(--accent); opacity: 0.7;" />
                <span class="text-[13px] font-semibold break-all" style="color: var(--accent);">
                  https://{{ siteSlug }}.streamed.space
                </span>
              </div>

              <!-- ── Divider — hidden when custom domain is active ── -->
              <div v-if="!hasCustomDomain" class="flex items-center gap-3">
                <div class="flex-1 h-px" style="background: var(--border);" />
                <span class="text-xs font-medium" style="color: var(--text-secondary);">Optional</span>
                <div class="flex-1 h-px" style="background: var(--border);" />
              </div>

              <!-- ── Custom Domain Toggle ── -->
              <button
                type="button"
                class="w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all duration-200 text-left"
                :style="{
                  borderColor: hasCustomDomain ? 'var(--accent)' : 'var(--border)',
                  background:  hasCustomDomain
                    ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                    : 'var(--bg-surface)',
                }"
                @click="toggleCustomDomain"
              >
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-200"
                  :style="{
                    background: hasCustomDomain
                      ? 'color-mix(in srgb, var(--accent) 18%, transparent)'
                      : 'var(--bg-card)',
                    border: '1.5px solid',
                    borderColor: hasCustomDomain
                      ? 'color-mix(in srgb, var(--accent) 35%, transparent)'
                      : 'var(--border)',
                  }"
                >
                  <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none"
                    :style="{ color: hasCustomDomain ? 'var(--accent)' : 'var(--text-secondary)' }">
                    <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M10 2.5c0 0-3 3.5-3 7.5s3 7.5 3 7.5M10 2.5c0 0 3 3.5 3 7.5s-3 7.5-3 7.5M2.5 10h15"
                      stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <p
                      class="text-sm font-semibold leading-tight"
                      :style="{ color: hasCustomDomain ? 'var(--accent)' : 'var(--text-primary)' }"
                    >
                      Use a custom domain
                    </p>
                    <span
                      class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0"
                      style="background: color-mix(in srgb, #1d9e75 12%, transparent); color: #1d9e75;"
                    >
                      Teams
                    </span>
                  </div>
                  <p class="text-xs mt-0.5" style="color: var(--text-secondary);">
                    e.g. mycompany.com, brand.pk, startup.ai
                  </p>
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

              <!-- ── Custom Domain Expandable Section ── -->
              <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-2 max-h-0"
                enter-to-class="opacity-100 translate-y-0 max-h-[500px]"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0 max-h-[500px]"
                leave-to-class="opacity-0 -translate-y-2 max-h-0"
              >
                <div v-if="hasCustomDomain" class="space-y-4 overflow-hidden">
                  <div
                    class="flex items-start gap-3 rounded-lg px-4 py-3 border"
                    style="background: color-mix(in srgb, var(--accent) 6%, transparent); border-color: color-mix(in srgb, var(--accent) 20%, transparent);"
                  >
                    <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: var(--accent);">
                      <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                      <path d="M8 7v5M8 5.5v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                    </svg>
                    <p class="text-xs leading-relaxed" style="color: var(--accent);">
                      Custom domains are best for larger teams. Your workspace URL will be your own brand (e.g.&nbsp;<strong>app.mycompany.com</strong>).
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
                                   : isDnsAvailable === false && !isCheckingDns         ? '#e55050'
                                   : isDnsAvailable === true  && !isCheckingDns         ? '#1d9e75'
                                   : 'var(--border-input)',
                        background: 'var(--bg-input)',
                      }"
                    >
                      <input
                        v-model="dnsInput"
                        type="text"
                        placeholder="e.g. mycompany.com"
                        class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                        style="color: var(--text-primary); font-family: 'Lato', sans-serif;"
                        autocomplete="off"
                      />
                      <div
                        class="flex items-center gap-2 px-3 border-l shrink-0"
                        style="background: var(--bg-surface); border-color: var(--border);"
                      >
                        <span
                          v-if="isCheckingDns"
                          class="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                          style="border-color: var(--border); border-top-color: var(--accent);"
                        />
                        <Transition
                          enter-active-class="transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                          enter-from-class="opacity-0 scale-50"
                          enter-to-class="opacity-100 scale-100"
                          leave-active-class="transition duration-150 ease-in"
                          leave-from-class="opacity-100 scale-100"
                          leave-to-class="opacity-0 scale-50"
                        >
                          <span
                            v-if="isDnsAvailable === true && !isCheckingDns && !dnsError && !dnsValidationError"
                            class="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                            style="background: #1d9e75;"
                          >
                            <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                              <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                          </span>
                          <span
                            v-else-if="(isDnsAvailable === false || dnsError || dnsValidationError) && !isCheckingDns"
                            class="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                            style="background: #e55050;"
                          >
                            <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                              <path d="M3 3l4 4M7 3l-4 4" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
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
                    <p v-else-if="isCheckingDns" class="text-xs" style="color: var(--text-secondary);">
                      Checking DNS availability…
                    </p>
                    <p v-else-if="dnsError" class="text-xs flex items-center gap-1" style="color: #e55050;">
                      <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                        <path d="M3 3l4 4M7 3l-4 4" stroke="#e55050" stroke-width="1.6" stroke-linecap="round"/>
                      </svg>
                      {{ dnsError }}
                    </p>
                    <p v-else-if="isDnsAvailable === true && dnsInput.trim()" class="text-xs flex items-center gap-1" style="color: #1d9e75;">
                      <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      <span class="font-medium">{{ dnsInput.trim() }}</span>&nbsp;is available — great choice!
                    </p>

                    <div v-else-if="isDnsAvailable === false && dnsInput.trim() && !isCheckingDns" class="space-y-3">
                      <div
                        class="flex items-start gap-3 rounded-lg px-4 py-3 border"
                        style="background: color-mix(in srgb, #e55050 6%, transparent); border-color: color-mix(in srgb, #e55050 25%, transparent);"
                      >
                        <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #e55050;">
                          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
                          <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                        </svg>
                        <div>
                          <p class="text-xs font-semibold mb-0.5" style="color: #e55050;">Domain already registered</p>
                          <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">
                            <span class="font-medium" style="color: var(--text-primary);">{{ dnsInput.trim() }}</span> is already taken. Try a different domain name, or purchase one from a registrar below.
                          </p>
                        </div>
                      </div>
                      <div>
                        <p class="text-[11px] font-semibold uppercase tracking-wider mb-2" style="color: var(--text-secondary);">
                          Purchase a domain from
                        </p>
                        <div class="flex flex-wrap gap-2">
                          <a
                            v-for="registrar in domainRegistrars"
                            :key="registrar.name"
                            :href="`${registrar.url}${encodeURIComponent(dnsInput.trim())}`"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 hover:-translate-y-px hover:shadow-sm"
                            style="border-color: var(--border); background: var(--bg-card); color: var(--text-primary);"
                          >
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

              <!-- ── Create Site CTA — hidden when custom domain is ON ── -->
              <button
                v-if="!hasCustomDomain"
                type="button"
                :disabled="isCreateSiteDisabled"
                class="w-full flex items-center justify-center gap-2 py-3 rounded-[9px] text-[15px] font-bold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style="background: var(--accent); color: var(--accent-text); box-shadow: 0 2px 0 rgba(0,0,0,0.12);"
                @click="continueSiteHandler"
              >
                <span v-if="creatingProfile" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span v-else>Create site</span>
              </button>

              <p v-if="!hasCustomDomain" class="text-center text-xs" style="color: var(--text-secondary);">
                <svg class="w-3 h-3 inline-block mr-1 -mt-0.5" viewBox="0 0 12 12" fill="none" style="color: var(--text-secondary);">
                  <circle cx="6" cy="6" r="5.5" stroke="currentColor" stroke-width="1"/>
                  <path d="M6 5.5v3M6 4v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                A free <strong style="color: var(--text-primary);">.streamed.space</strong> subdomain is perfect for individuals &amp; small teams.
              </p>

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
            @complete="activeStep = 7"
          />
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 7 — Where did you hear about us?
        ════════════════════════════════════════════════════════════ -->
        <div v-show="activeStep === 7" class="flex items-center justify-center min-h-full">
          <div class="w-full max-w-130 space-y-8">
            <div class="space-y-2 text-center">
              <h2 class="text-[28px] font-semibold text-text-primary">
                Where did you hear about us?
              </h2>
              <p class="text-text-secondary text-sm">
                This helps us improve onboarding experience.
              </p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <button
                v-for="item in referralOptions"
                :key="item.id"
                @click="toggleReferral(item.id)"
                type="button"
                class="px-4 py-3 rounded-xl border text-sm font-medium transition"
                :class="referralSources.includes(item.id) ? 'bg-accent/30 border-accent' : 'border-border'"
              >
                {{ item.label }}
              </button>
            </div>

            <!-- Back hidden: site already created -->
            <div class="flex justify-end items-center">
              <Button
                :disabled="isSiteStepBlocked || isAnyMutating"
                size="md"
                type="submit"
                @click="continueHandler"
              >
                <div class="flex items-center gap-2">
                  <span
                    v-if="isAnyMutating"
                    class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  />
                  <span>Continue</span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 8 — Create Super Admin + Invite
        ════════════════════════════════════════════════════════════ -->
        <div
          v-show="activeStep === 8"
          v-if="selected === 'team' || selected === 'school'"
          class="flex items-center justify-center min-h-full"
        >
          <div class="w-full max-w-150 space-y-7">

            <div class="space-y-2">
              <h2 class="text-[26px] font-semibold text-text-primary">
                {{ selected === 'school' ? 'Better when studied together' : 'Better when used together' }}
              </h2>
              <p class="text-text-secondary text-sm leading-relaxed">
                {{ selected === 'school'
                  ? 'Orchit AI works better with your classmates onboard. Invite someone to try it with you.'
                  : 'Orchit AI works better with your team onboard. Invite a teammate to try it out with you.'
                }}
              </p>
            </div>

            <!-- SUPER ADMIN CARD -->
            <div
              class="rounded-xl border border-border p-5 space-y-4"
              style="background: var(--bg-card);"
            >
              <div class="flex items-center gap-2">
                <div
                  class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style="background: var(--accent);"
                >
                  <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M5 1a2 2 0 1 1 0 4A2 2 0 0 1 5 1zM2 8.5C2 6.567 3.343 5 5 5s3 1.567 3 3.5"
                      stroke="white" stroke-width="1.4" stroke-linecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-semibold text-text-primary">Create Super Admin</p>
                  <p class="text-xs text-text-secondary">Required — this account will manage your workspace</p>
                </div>
                <span
                  class="ml-auto text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style="background-color: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent);"
                >
                  Required
                </span>
              </div>

              <!-- Full Name -->
              <div class="space-y-1.5">
                <label
                  class="text-[11px] font-semibold uppercase tracking-wider block"
                  style="color: var(--text-secondary);"
                >
                  Full Name
                </label>
                <div
                  class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
                  :style="{
                    borderColor: errors.adminFullName ? '#e55050' : 'var(--border-input)',
                    background: 'var(--bg-input)',
                  }"
                >
                  <input
                    v-model="adminFullName"
                    type="text"
                    placeholder="e.g. Jane Doe"
                    class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                    style="color: var(--text-primary); font-family: 'Lato', sans-serif;"
                    @input="errors.adminFullName = undefined"
                  />
                </div>
                <p v-if="errors.adminFullName" class="text-xs" style="color: #e55050;">
                  {{ errors.adminFullName }}
                </p>
              </div>

              <!-- CUSTOM DOMAIN path → username@customdomain -->
              <div v-if="hasCustomDomain && isDnsAvailable === true" class="space-y-1.5">
                <label
                  class="text-[11px] font-semibold uppercase tracking-wider block"
                  style="color: var(--text-secondary);"
                >
                  Admin Email
                </label>
                <div
                  class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium mb-1"
                  style="background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);"
                >
                  <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M10 2c0 0-3 3.5-3 8s3 8 3 8M10 2c0 0 3 3.5 3 8s-3 8-3 8M2 10h16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                  Using your custom domain: <strong>{{ dnsInput.trim() }}</strong>
                </div>
                <div
                  class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px]"
                  :style="{
                    borderColor: errors.adminUsername ? '#e55050' : 'var(--border-input)',
                    background: 'var(--bg-input)',
                  }"
                >
                  <input
                    v-model="adminUsername"
                    type="text"
                    placeholder="username"
                    class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                    style="color: var(--text-primary); font-family: 'Lato', sans-serif;"
                    @input="adminUsername = adminUsername.toLowerCase().replace(/[^a-z0-9._-]/g, ''); errors.adminUsername = undefined"
                  />
                  <div
                    class="flex items-center px-3.5 border-l shrink-0"
                    style="background: var(--bg-surface); border-color: var(--border);"
                  >
                    <span
                      class="text-[13px] font-semibold whitespace-nowrap"
                      style="color: var(--text-secondary);"
                    >
                      @{{ dnsInput.trim() }}
                    </span>
                  </div>
                </div>
                <p v-if="errors.adminUsername" class="text-xs" style="color: #e55050;">
                  {{ errors.adminUsername }}
                </p>
                <p v-else class="text-xs" style="color: var(--text-secondary);">
                  Full email: <span class="font-medium" style="color: var(--text-primary);">{{ adminEmailCustom }}</span>
                </p>
              </div>

              <!-- NO CUSTOM DOMAIN path → plain email -->
              <div v-else class="space-y-1.5">
                <label
                  class="text-[11px] font-semibold uppercase tracking-wider block"
                  style="color: var(--text-secondary);"
                >
                  Admin Email
                </label>
                <div
                  class="flex items-start gap-2 px-3 py-2.5 rounded-lg border text-xs mb-1"
                  style="background: color-mix(in srgb, var(--accent) 6%, transparent); border-color: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--text-secondary);"
                >
                  <svg class="w-3.5 h-3.5 mt-0.5 shrink-0" viewBox="0 0 14 14" fill="none" style="color: var(--accent);">
                    <path d="M7 1.5L9 5.5H13L10 8L11.5 12L7 9.5L2.5 12L4 8L1 5.5H5L7 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                  </svg>
                  <p>
                    Enter the email address for your super admin. They'll receive an invitation to join and manage the workspace.
                  </p>
                </div>
                <div
                  class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
                  :style="{
                    borderColor: errors.adminEmail ? '#e55050' : 'var(--border-input)',
                    background: 'var(--bg-input)',
                  }"
                >
                  <div class="flex items-center px-3.5 border-r shrink-0" style="background: var(--bg-surface); border-color: var(--border);">
                    <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: var(--text-secondary);">
                      <path d="M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="currentColor" stroke-width="1.3"/>
                      <path d="M2 4l6 5 6-5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <input
                    v-model="adminEmailPlain"
                    type="email"
                    placeholder="e.g. admin@company.com"
                    class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                    style="color: var(--text-primary); font-family: 'Lato', sans-serif;"
                    @input="errors.adminEmail = undefined"
                  />
                </div>
                <p v-if="errors.adminEmail" class="text-xs" style="color: #e55050;">
                  {{ errors.adminEmail }}
                </p>
              </div>

              <!-- Password — only for custom domain path -->
              <template v-if="hasCustomDomain && isDnsAvailable === true">
                <div class="space-y-1.5">
                  <label
                    class="text-[11px] font-semibold uppercase tracking-wider block"
                    style="color: var(--text-secondary);"
                  >
                    Password
                  </label>
                  <div
                    class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
                    :style="{
                      borderColor: errors.adminPassword ? '#e55050' : 'var(--border-input)',
                      background: 'var(--bg-input)',
                    }"
                  >
                    <input
                      v-model="adminPassword"
                      :type="showAdminPassword ? 'text' : 'password'"
                      placeholder="Min. 8 characters"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                      style="color: var(--text-primary); font-family: 'Lato', sans-serif;"
                      @input="errors.adminPassword = undefined"
                    />
                    <button
                      type="button"
                      class="px-3.5 border-l flex items-center justify-center min-w-[44px] cursor-pointer"
                      style="background: var(--bg-surface); border-color: var(--border); color: var(--text-secondary);"
                      @click="showAdminPassword = !showAdminPassword"
                    >
                      <i :class="showAdminPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" class="text-sm" />
                    </button>
                  </div>
                  <p v-if="errors.adminPassword" class="text-xs" style="color: #e55050;">
                    {{ errors.adminPassword }}
                  </p>
                </div>

                <div class="space-y-1.5">
                  <label
                    class="text-[11px] font-semibold uppercase tracking-wider block"
                    style="color: var(--text-secondary);"
                  >
                    Confirm Password
                  </label>
                  <div
                    class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
                    :style="{
                      borderColor: errors.adminConfirmPassword ? '#e55050' : 'var(--border-input)',
                      background: 'var(--bg-input)',
                    }"
                  >
                    <input
                      v-model="adminConfirmPassword"
                      :type="showAdminConfirmPassword ? 'text' : 'password'"
                      placeholder="Re-enter password"
                      class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
                      style="color: var(--text-primary); font-family: 'Lato', sans-serif;"
                      @input="errors.adminConfirmPassword = undefined"
                    />
                    <button
                      type="button"
                      class="px-3.5 border-l flex items-center justify-center min-w-[44px] cursor-pointer"
                      style="background: var(--bg-surface); border-color: var(--border); color: var(--text-secondary);"
                      @click="showAdminConfirmPassword = !showAdminConfirmPassword"
                    >
                      <i :class="showAdminConfirmPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'" class="text-sm" />
                    </button>
                  </div>
                  <p v-if="errors.adminConfirmPassword" class="text-xs" style="color: #e55050;">
                    {{ errors.adminConfirmPassword }}
                  </p>
                </div>
              </template>
            </div>

            <!-- Share via link -->
            <div class="space-y-1.5">
              <label class="text-sm font-medium text-text-primary">Share via link</label>
              <p class="text-xs text-text-secondary mb-1">
                {{ selected === 'school'
                  ? 'Invite classmates or teachers to join your school workspace.'
                  : 'Invite teammates to join your company workspace.'
                }}
              </p>
              <div class="flex items-center gap-2">
                <div class="flex-1 border border-border rounded-lg px-3 py-2 bg-surface overflow-hidden">
                  <span class="text-sm text-text-secondary truncate block">
                    {{ joinLink }}
                  </span>
                </div>
                <Button variant="secondary" size="md" :disabled="isAnyInviteLoading" @click="copySiteUrl">
                  <div class="flex items-center gap-1.5 transition-all duration-200">
                    <FontAwesomeIcon
                      :icon="['fas', isCopied ? 'check' : 'link']"
                      :class="isCopied ? 'text-green-500' : ''"
                      class="transition-all duration-200"
                    />
                    <span :class="isCopied ? 'text-green-500' : ''" class="transition-colors duration-200">
                      {{ isCopied ? 'Copied!' : 'Copy link' }}
                    </span>
                  </div>
                </Button>
              </div>
            </div>

            <!-- Actions — no Back button after site creation -->
            <div class="flex items-center justify-between pt-2">
              <Button
                variant="secondary"
                size="md"
                :disabled="isAnyInviteLoading"
                @click="sendInvites(true)"
              >
                <div class="flex items-center gap-2">
                  <span
                    v-if="isSkipping || isCreatingAdmin"
                    class="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin"
                  />
                  <span>Do this later</span>
                </div>
              </Button>

              <Button
                size="md"
                :disabled="isAnyInviteLoading"
                @click="sendInvites(false)"
              >
                <div class="flex items-center gap-2">
                  <span
                    v-if="isInviting || isCreatingAdmin"
                    class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  />
                  <span>Finish Profile</span>
                </div>
              </Button>
            </div>

          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             STEP 9 — OTP Verification for newly created Super Admin
        ════════════════════════════════════════════════════════════ -->
        <div
          v-if="activeStep === 9 && (selected === 'team' || selected === 'school')"
          class="flex items-center justify-center min-h-full"
        >
          <div class="w-full max-w-md space-y-8">

            <!-- Icon header -->
            <div class="text-center space-y-4">
              <div
                class="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
                style="background: color-mix(in srgb, var(--accent) 12%, transparent); border: 1.5px solid color-mix(in srgb, var(--accent) 25%, transparent);"
              >
                <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none" style="color: var(--accent);">
                  <rect x="4" y="8" width="24" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>
                  <path d="M4 13l12 8 12-8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="23" cy="9" r="5" fill="currentColor" opacity="0.15"/>
                  <path d="M21 9l1.5 1.5L25 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h2 class="text-[24px] font-semibold text-text-primary">Verify admin email</h2>
                <p class="text-text-secondary text-sm mt-1.5 leading-relaxed">
                  We sent a 6-digit code to
                  <span class="font-semibold" style="color: var(--text-primary);">{{ resolvedAdminEmail }}</span>.
                  Enter it below to confirm the super admin account.
                </p>
              </div>
            </div>

            <!-- OTP input grid -->
            <div class="space-y-3">
              <div class="flex gap-3 justify-center">
                <input
                  v-for="(_, idx) in otpDigits"
                  :key="idx"
                  :ref="(el) => setOtpRef(el as HTMLInputElement | null, idx)"
                  v-model="otpDigits[idx]"
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  class="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-all duration-200 bg-transparent"
                  :style="{
                    borderColor: otpError
                      ? '#e55050'
                      : otpDigits[idx]
                        ? 'var(--accent)'
                        : 'var(--border-input)',
                    color: 'var(--text-primary)',
                    background: otpDigits[idx]
                      ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
                      : 'var(--bg-input)',
                  }"
                  @input="onOtpInput(idx, $event)"
                  @keydown="onOtpKeydown(idx, $event)"
                  @paste="onOtpPaste($event)"
                  @focus="otpError = ''"
                />
              </div>

              <!-- OTP error -->
              <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
              >
                <p v-if="otpError" class="text-xs text-center flex items-center justify-center gap-1" style="color: #e55050;">
                  <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                    <path d="M3 3l4 4M7 3l-4 4" stroke="#e55050" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                  {{ otpError }}
                </p>
              </Transition>

              <!-- OTP success -->
              <Transition
                enter-active-class="transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                enter-from-class="opacity-0 scale-95"
                enter-to-class="opacity-100 scale-100"
              >
                <p v-if="otpVerified" class="text-xs text-center flex items-center justify-center gap-1" style="color: #1d9e75;">
                  <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Email verified successfully!
                </p>
              </Transition>
            </div>

            <!-- Resend & timer -->
            <div class="text-center space-y-1">
              <p class="text-xs" style="color: var(--text-secondary);">
                Didn't receive the code?
              </p>
              <button
                v-if="otpResendCooldown === 0"
                type="button"
                class="text-xs font-semibold transition-opacity hover:opacity-75"
                style="color: var(--accent);"
                :disabled="isResendingOtp"
                @click="resendOtp"
              >
                <span v-if="isResendingOtp" class="inline-flex items-center gap-1">
                  <span class="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style="border-color: var(--accent); border-top-color: transparent;" />
                  Sending…
                </span>
                <span v-else>Resend code</span>
              </button>
              <p v-else class="text-xs" style="color: var(--text-secondary);">
                Resend in <span class="font-semibold" style="color: var(--text-primary);">{{ otpResendCooldown }}s</span>
              </p>
            </div>

            <!-- Verify button -->
            <button
              type="button"
              :disabled="otpValue.length < 6 || isVerifyingOtp || otpVerified"
              class="w-full flex items-center justify-center gap-2 py-3 rounded-[9px] text-[15px] font-bold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style="background: var(--accent); color: var(--accent-text); box-shadow: 0 2px 0 rgba(0,0,0,0.12);"
              @click="verifyOtp"
            >
              <span
                v-if="isVerifyingOtp"
                class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
              />
              <span v-else-if="otpVerified">✓ Verified</span>
              <span v-else>Verify & Continue</span>
            </button>

            <!-- Info note -->
            <p class="text-center text-xs" style="color: var(--text-secondary);">
              <svg class="w-3 h-3 inline-block mr-1 -mt-0.5" viewBox="0 0 12 12" fill="none" style="color: var(--text-secondary);">
                <circle cx="6" cy="6" r="5.5" stroke="currentColor" stroke-width="1"/>
                <path d="M6 5.5v3M6 4v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
              The code expires in 10 minutes. Check your spam folder if you don't see it.
            </p>

          </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════
             BOTTOM NAV
             Hidden on steps 5 (no custom domain), 6, 7, 8, 9.
             Step 5 custom domain: shown, Continue triggers creation.
             Back hidden once site is created.
        ════════════════════════════════════════════════════════════ -->
        <div
          class="flex justify-between items-center mt-10 md:mt-5"
          v-if="showBottomNav"
        >
          <!-- Back: only show if site NOT yet created AND not step 1 -->
          <Button
            v-if="activeStep !== 1 && !siteCreated"
            variant="secondary"
            size="md"
            type="button"
            :disabled="isAnyMutating"
            @click="goBack"
          >
            <div class="flex items-center gap-1">
              <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
            </div>
          </Button>

          <!-- Spacer so Continue stays right when Back is hidden -->
          <div v-else-if="activeStep !== 1" />

          <div class="flex gap-4 items-center ml-auto">
            <Button
              :disabled="isSiteStepBlocked || isAnyMutating"
              size="md"
              type="submit"
              @click="activeStep === 5 ? continueSiteHandler() : continueHandler()"
            >
              <div class="flex items-center gap-2">
                <span
                  v-if="isAnyMutating || (activeStep === 5 && creatingProfile)"
                  class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                />
                <span>{{ activeStep === 5 && hasCustomDomain ? 'Create site' : 'Continue' }}</span>
              </div>
            </Button>
          </div>
        </div>

      </div>

      <div class="max-w-125 md:mx-auto w-full space-y-6"></div>

      <!-- ═══════════════════════════════════════════════════════
           Workspace creation error modal
           Dismiss → /dashboard (user can fix from there)
      ════════════════════════════════════════════════════════════ -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="companySlugError"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4"
          @click.self="dismissErrorModal"
        >
          <div class="w-full max-w-md rounded-2xl bg-bg-dropdown p-6 shadow-xl ring-1 ring-black/5">
            <div class="mb-4 flex h-13 w-13 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <i class="fa-solid fa-triangle-exclamation text-red-500 text-lg"></i>
            </div>
            <h3 class="text-md font-semibold text-text-primary mb-1">
              {{ isNameConflictError ? 'Site name already taken' : 'Something went wrong' }}
            </h3>
            <p class="text-sm text-text-secondary leading-relaxed mb-5">
              {{ companySlugError }}
            </p>
            <div class="flex gap-2">
              <!-- Name conflict: let user fix the slug on this page -->
              <button
                v-if="isNameConflictError"
                type="button"
                class="flex-1 rounded-lg border border-black/10 bg-bg-dropdown px-3 py-2.5 text-sm font-medium text-text-secondary hover:border-black/20 hover:text-text-primary transition cursor-pointer"
                @click="companySlugError = null"
              >
                Change name here
              </button>
              <!-- Generic error: dismiss and redirect to dashboard -->
              <button
                v-else
                type="button"
                class="flex-1 rounded-lg border border-black/10 bg-bg-dropdown px-3 py-2.5 text-sm font-medium text-text-secondary hover:border-black/20 hover:text-text-primary transition cursor-pointer"
                @click="dismissErrorModal"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Transition>

    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import teamIcon from '../../assets/platform/team.svg'
import personalIcon from '../../assets/platform/personal-use.svg'
import schoolIcon from '../../assets/platform/school.svg'
import Button from '../../components/ui/Button.vue'
import BaseSelectField from '../../components/ui/BaseSelectField.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import { useRouter, useRoute } from 'vue-router'
import { useCreateCompany, useUpdateCompany, useInviteCompany } from '../../services/auth'
import { updateProfile as updateUserProfile } from '../../services/user'
import { useRolesList } from '../../queries/useCommon'
import { useWorkspaceStore } from '../../stores/workspace'
import { useAuthStore } from '../../stores/auth'
import LoadingCreateProfile from '../../components/LoadingCreateProfile.vue'
import gsap from 'gsap'
import { useCreateCompanyUser } from '../../queries/useCompanyUsers'

defineOptions({ name: 'OnboardingFlow' })

// ─── Stores & Router ──────────────────────────────────────────────────────────
const workspaceStore = useWorkspaceStore()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

// ─── Error map ────────────────────────────────────────────────────────────────
const errors = ref<{
  team?: string
  role?: string
  companySize?: string
  emailList?: string
  personalRole?: string
  schoolName?: string
  educationLevel?: string
  siteName?: string
  selectedModules?: string
  workType?: string
  adminFullName?: string
  adminUsername?: string
  adminEmail?: string
  adminPassword?: string
  adminConfirmPassword?: string
}>({})

// ─── Step & Selection ─────────────────────────────────────────────────────────
const selected = ref<'team' | 'personal' | 'school'>('team')
const activeStep = ref<number>(1)

// siteCreated: site provisioned → browser back guard activated
const siteCreated = ref(false)
// adminCreated: super admin created & OTP verified → guard released, flow complete
const adminCreated = ref(false)

// ─── Step 2 ───────────────────────────────────────────────────────────────────
const role = ref('')
const team = ref('')
const companySize = ref('')
const personalRole = ref('')
const schoolName = ref('')
const educationLevel = ref('')

// ─── Step 3 ───────────────────────────────────────────────────────────────────
const selectedModules = ref<string[]>([])

// ─── Step 4 ───────────────────────────────────────────────────────────────────
const workType = ref('')

// ─── Step 5 — site ────────────────────────────────────────────────────────────
const siteName = ref('')
const siteSlug = ref('')
const isFocused = ref(false)
const isCheckingSlug = ref(false)
const isSlugAvailable = ref<boolean | null>(null)
const companySlugError = ref<string | null>(null)

// Custom domain
const hasCustomDomain = ref(false)
const dnsInput = ref('')
const isCheckingDns = ref(false)
const isDnsAvailable = ref<boolean | null>(null)
const dnsError = ref<string | null>(null)
const dnsValidationError = ref<string | null>(null)

// ─── Step 7 & 8 ───────────────────────────────────────────────────────────────
const referralSources = ref<string[]>([])
const joinLink = ref('')
const domainLink = ref('')
const emailList = ref<string[]>([])
const isInviting = ref(false)
const isSkipping = ref(false)
const isCopied = ref(false)
const companyID = ref<string>()
const isProvisioning = ref(false)
const isUpdatingProfile = ref(false)

// ─── Step 8 — Super Admin ─────────────────────────────────────────────────────
const adminFullName = ref('')
const adminUsername = ref('')
const adminEmailPlain = ref('')
const adminPassword = ref('')
const adminConfirmPassword = ref('')
const showAdminPassword = ref(false)
const showAdminConfirmPassword = ref(false)

// ─── Step 9 — OTP verification ────────────────────────────────────────────────
// Six individual digit slots so we can style each box separately and handle
// focus-forwarding, backspace, and paste properly.
const otpDigits = ref<string[]>(['', '', '', '', '', ''])
const otpRefs: (HTMLInputElement | null)[] = Array(6).fill(null)
const otpError = ref('')
const otpVerified = ref(false)
const isVerifyingOtp = ref(false)
const isResendingOtp = ref(false)
const otpResendCooldown = ref(0)
let cooldownTimer: ReturnType<typeof setInterval> | null = null

// Computed full OTP string
const otpValue = computed(() => otpDigits.value.join(''))

function setOtpRef(el: HTMLInputElement | null, idx: number) {
  otpRefs[idx] = el
}

function focusOtpBox(idx: number) {
  nextTick(() => otpRefs[idx]?.focus())
}

function onOtpInput(idx: number, event: Event) {
  const val = (event.target as HTMLInputElement).value.replace(/\D/g, '')
  otpDigits.value[idx] = val.slice(-1) // keep only last digit
  otpError.value = ''
  if (val && idx < 5) focusOtpBox(idx + 1)
}

function onOtpKeydown(idx: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !otpDigits.value[idx] && idx > 0) {
    otpDigits.value[idx - 1] = ''
    focusOtpBox(idx - 1)
  }
  if (event.key === 'ArrowLeft' && idx > 0) focusOtpBox(idx - 1)
  if (event.key === 'ArrowRight' && idx < 5) focusOtpBox(idx + 1)
}

function onOtpPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6)
  pasted.split('').forEach((ch, i) => { otpDigits.value[i] = ch })
  focusOtpBox(Math.min(pasted.length, 5))
}

function startResendCooldown(seconds = 60) {
  otpResendCooldown.value = seconds
  if (cooldownTimer) clearInterval(cooldownTimer)
  cooldownTimer = setInterval(() => {
    otpResendCooldown.value--
    if (otpResendCooldown.value <= 0 && cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }, 1000)
}

async function resendOtp() {
  if (isResendingOtp.value || otpResendCooldown.value > 0) return
  isResendingOtp.value = true
  try {
    // Call your OTP resend service here, e.g.:
    // await workspaceStore.resendAdminOtp({ email: resolvedAdminEmail.value })
    otpDigits.value = ['', '', '', '', '', '']
    otpError.value = ''
    otpVerified.value = false
    startResendCooldown(60)
    focusOtpBox(0)
  } catch (err: any) {
    otpError.value = err?.response?.data?.message ?? 'Failed to resend code. Please try again.'
  } finally {
    isResendingOtp.value = false
  }
}

async function verifyOtp() {
  if (otpValue.value.length < 6 || isVerifyingOtp.value) return
  isVerifyingOtp.value = true
  otpError.value = ''
  try {
    // Call your OTP verification service here, e.g.:
    // await workspaceStore.verifyAdminOtp({ email: resolvedAdminEmail.value, otp: otpValue.value })

    // On success:
    otpVerified.value = true
    adminCreated.value = true // release the browser-back guard

    await nextTick()

    // Small delay so the user sees the "✓ Verified" state before navigation
    setTimeout(() => {
      finishOnboarding()
    }, 800)
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? ''
    otpError.value = msg || 'Invalid code. Please try again.'
    // Shake the inputs to indicate failure
    otpDigits.value = ['', '', '', '', '', '']
    focusOtpBox(0)
  } finally {
    isVerifyingOtp.value = false
  }
}

// ─── Domain Registrars ────────────────────────────────────────────────────────
const domainRegistrars = [
  { name: 'GoDaddy',   url: 'https://www.godaddy.com/domainsearch/find?checkAvail=1&tmskey=&domainToCheck=' },
  { name: 'Namecheap', url: 'https://www.namecheap.com/domains/registration/results/?domain=' },
  { name: 'Google',    url: 'https://domains.google.com/registrar/search?searchTerm=' },
  { name: 'Porkbun',   url: 'https://porkbun.com/checkout/search?q=' },
]

// ─── Computed: admin email variants ───────────────────────────────────────────
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

// ─── Computed: slug helpers ───────────────────────────────────────────────────
const isFullyAvailable = computed(() => isSlugAvailable.value === true)
const isAnyUnavailable = computed(() => isSlugAvailable.value === false)

// ─── Computed: any mutation in flight ─────────────────────────────────────────
const isAnyMutating = computed(
  () => creatingProfile.value || updatingProfile.value || invitingPeople.value || isUpdatingProfile.value
)

const isAnyInviteLoading = computed(
  () => isInviting.value || isSkipping.value || isCreatingAdmin.value
)

// ─── Computed: "Create site" button / Continue disabled on step 5 ─────────────
const isCreateSiteDisabled = computed(() => {
  if (creatingProfile.value) return true
  if (hasCustomDomain.value) {
    if (!dnsInput.value.trim()) return true
    if (dnsValidationError.value) return true
    if (isCheckingDns.value) return true
    if (dnsError.value) return true
    if (isDnsAvailable.value !== true) return true
    return false
  }
  if (!siteName.value) return true
  if (isCheckingSlug.value) return true
  if (isSlugAvailable.value !== true) return true
  return false
})

const isSiteStepBlocked = computed(() => {
  if (activeStep.value !== 5) return false
  if (selected.value !== 'team' && selected.value !== 'school') return false
  return isCreateSiteDisabled.value
})

// ─── Computed: bottom nav visibility ─────────────────────────────────────────
// Step 5 no custom domain → card button handles it, bottom nav hidden
// Steps 6, 7, 8, 9 → those steps have their own action rows
const showBottomNav = computed(() => {
  if (activeStep.value === 6) return false
  if (activeStep.value === 7) return false
  if (activeStep.value === 8) return false
  if (activeStep.value === 9) return false
  if (activeStep.value === 5 && !hasCustomDomain.value) return false
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
} as const

const activeModules = computed(
  () => moduleOptionsMap[selected.value as keyof typeof moduleOptionsMap] || []
)

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

// ─── Static data ──────────────────────────────────────────────────────────────
const options = Object.freeze([
  { _id: 'team',     title: 'For my team',      description: 'Collaborate on your docs and projects.',             icon: teamIcon },
  { _id: 'personal', title: 'For personal use', description: 'Write better. Think more clearly. Stay organised.', icon: personalIcon },
  { _id: 'school',   title: 'For school',       description: 'Keep notes, research and tasks in one place.',       icon: schoolIcon },
] as const)

const companySizeOptions = Object.freeze([
  { title: '1 – 10',         _id: '1–10' },
  { title: '11 – 50',        _id: '11–50' },
  { title: '51 – 200',       _id: '51–200' },
  { title: '201 – 500',      _id: '201–500' },
  { title: '501 – 1,000',    _id: '501–1000' },
  { title: '1,001 – 5,000',  _id: '1001–5000' },
  { title: '5,001 – 10,000', _id: '5001–10000' },
  { title: '10,001+',        _id: '10001+' },
] as const)

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

// ─── Queries ──────────────────────────────────────────────────────────────────
const { data: rolesList } = useRolesList()

// ─── Step labels ──────────────────────────────────────────────────────────────
const stepLabels = computed(() => {
  if (selected.value === 'personal') {
    return ['Purpose', 'About You', 'Modules', 'Work Type', 'Hearing About Us', 'Invite Team']
  }
  if (selected.value === 'school') {
    return ['Purpose', 'About School', 'Modules', 'Work Type', 'Hearing About Us', 'Invite Team']
  }
  return ['Purpose', 'About Company', 'Modules', 'Work Type', 'Create Site', 'Hearing About Us', 'Invite Team']
})

const displayStep = computed(() => {
  if (selected.value === 'personal' || selected.value === 'school') {
    if (activeStep.value <= 4) return activeStep.value
    if (activeStep.value === 7) return 5
    if (activeStep.value === 8) return 6
    if (activeStep.value === 9) return 6
  }
  if (activeStep.value <= 5) return activeStep.value
  if (activeStep.value === 7) return 6
  if (activeStep.value === 8) return 7
  if (activeStep.value === 9) return 7
  return activeStep.value
})

// ─── Browser Back Button Lock ─────────────────────────────────────────────────
// Guard is active from site creation (step 6) through OTP verification (step 9).
// Once adminCreated = true, the guard is released; the router handles the rest.
const SENTINEL = { onboarding: true }

function armHistoryGuard() {
  // Push TWO sentinel states so even a rapid double-tap is caught.
  history.pushState(SENTINEL, '')
  history.pushState(SENTINEL, '')
}

function handlePopState(event: PopStateEvent) {
  // Active only while site is created but admin is not yet verified
  if (!siteCreated.value || adminCreated.value) return
  event.preventDefault?.()
  // Replenish sentinel so the buffer never empties
  history.pushState(SENTINEL, '')
}

// Arm the guard the moment the site is created
watch(siteCreated, (val) => {
  if (val) armHistoryGuard()
})

// ─── Watchers ─────────────────────────────────────────────────────────────────
watch(team,        (v) => { if ((v as string)?.trim() && errors.value.team)        errors.value.team        = undefined })
watch(role,        (v) => { if (v          && errors.value.role)                   errors.value.role        = undefined })
watch(companySize, (v) => { if (v          && errors.value.companySize)            errors.value.companySize = undefined })
watch(workType,    (v) => { if (v          && errors.value.workType)               errors.value.workType    = undefined })

// Pre-fill site name when entering step 5
watch(activeStep, (step) => {
  if (step === 5 && !siteName.value) {
    if (selected.value === 'team'   && team.value.trim())       siteName.value = generateSlug(team.value)
    if (selected.value === 'school' && schoolName.value.trim()) siteName.value = generateSlug(schoolName.value)
  }
  // Auto-focus first OTP box when landing on step 9
  if (step === 9) {
    startResendCooldown(60)
    nextTick(() => focusOtpBox(0))
  }
})

// ─── Debounced slug check ─────────────────────────────────────────────────────
let slugDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(siteName, (val) => {
  siteSlug.value = generateSlug(val)
  isSlugAvailable.value = null
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
  }, 600)
})

// ─── Regex: valid domain with TLD ─────────────────────────────────────────────
const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,10}$/

// ─── Debounced DNS check ──────────────────────────────────────────────────────
let dnsDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(dnsInput, (val) => {
  const trimmed = val.trim()

  isDnsAvailable.value     = null
  dnsError.value           = null
  dnsValidationError.value = null

  if (dnsDebounceTimer) clearTimeout(dnsDebounceTimer)

  if (!trimmed) { isCheckingDns.value = false; return }

  if (!DOMAIN_RE.test(trimmed)) {
    dnsValidationError.value =
      'Please enter a valid domain with a TLD (e.g. mycompany.com, brand.pk, startup.ai).'
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
      } else if (result.is_registered === false) {
        isDnsAvailable.value = true
        dnsError.value       = null
      } else if (result.is_registered === true) {
        isDnsAvailable.value = false
        dnsError.value       = null
      } else {
        isDnsAvailable.value = null
      }
    } catch (err: any) {
      if (dnsInput.value.trim() !== captured) return
      const serverMsg  = err?.response?.data?.message ?? err?.message ?? null
      dnsError.value   = serverMsg ?? 'Could not verify domain. Please try again.'
      isDnsAvailable.value = null
    } finally {
      if (dnsInput.value.trim() === captured) isCheckingDns.value = false
    }
  }, 600)
})

// ─── Mutations ────────────────────────────────────────────────────────────────
const isNameConflictError = ref(false)

function isSlugConflictMsg(msg: string): boolean {
  const lower = msg.toLowerCase()
  return (
    lower.includes('slug') ||
    lower.includes('already exists') ||
    lower.includes('already taken') ||
    lower.includes('company name') ||
    lower.includes('name is taken')
  )
}

const { mutate: createProfile, isPending: creatingProfile } = useCreateCompany({
  onSuccess: (data: any) => {
    const payload = data?.data ?? data

    if (!payload || payload?.status === false) {
      const msg = payload?.message ?? ''
      isNameConflictError.value = isSlugConflictMsg(msg)
      companySlugError.value = isNameConflictError.value
        ? 'This site name is already taken. Please choose a different one on this page.'
        : (msg || 'Something went wrong while creating your workspace. Please try again.')
      return
    }

    const id     = payload?.company_id ?? payload?._id
    const join   = payload?.join_link  ?? ''
    const domain = payload?.domain_link ?? ''

    companyID.value  = id
    joinLink.value   = join
    domainLink.value = domain

    localStorage.setItem(
      selected.value === 'team' ? 'company_id' : 'user_id',
      selected.value === 'team' ? (id ?? '') : (authStore.user?._id ?? '')
    )

    // Mark site as created — triggers armHistoryGuard via the watcher
    siteCreated.value    = true
    isProvisioning.value = true
    activeStep.value     = 6
  },
  onError: (error: any) => {
    const msg = error?.response?.data?.message ?? error?.message ?? ''
    isNameConflictError.value = isSlugConflictMsg(msg)
    companySlugError.value = isNameConflictError.value
      ? 'This site name is already taken. Please choose a different one on this page.'
      : (msg || 'Something went wrong while creating your workspace. Please try again.')
  },
})

const { mutate: updateProfile, isPending: updatingProfile } = useUpdateCompany({
  onSuccess: async () => {
    if (selected.value === 'team' || selected.value === 'school') {
      activeStep.value = 8
      return
    }
    await authStore.bootstrap()
    if (workspaceStore.pricing)        router.push('/dashboard?stripePayment=true')
    else if (workspaceStore.workspace) router.push('/create-workspace')
    else                               router.push('/finish-profile')
  },
  onError: () => { activeStep.value = 5 },
})

const { mutate: invitePeople, isPending: invitingPeople } = useInviteCompany({
  onSuccess: async () => {
    await authStore.bootstrap()
    if (workspaceStore.pricing)        router.push('/dashboard?stripePayment=true')
    else if (workspaceStore.workspace) router.push('/create-workspace')
    else                               router.push('/finish-profile')
  },
})

const { mutate: createAdminUser, isPending: isCreatingAdmin } = useCreateCompanyUser({
  onSuccess: () => { /* resolved inline in sendInvites */ },
  onError:   (error: any) => {
    const msg = error?.response?.data?.message ?? 'Failed to create super admin user.'
    errors.value.adminUsername = msg
  },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateSlug(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function optionClass(id: string) {
  return id === selected.value ? 'bg-accent/30 border-accent' : 'border-border'
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
  globalThis.navigator.clipboard.writeText(joinLink.value).then(() => {
    isCopied.value = true
    setTimeout(() => { isCopied.value = false }, 2000)
  })
}

function setAuthCookie(token: string) {
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
  const base: Record<string, any> = {
    work_to_do:     workType.value,
    like_to_manage: selectedModules.value,
    heard_about_us: referralSources.value,
  }
  if (includeSite && siteSlug.value) {
    base.site_slug = siteSlug.value
    if (hasCustomDomain.value && isDnsAvailable.value === true && dnsInput.value.trim()) {
      base.custom_domain = dnsInput.value.trim()
    }
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

// Shared navigation after OTP verification and any post-invite flow
async function finishOnboarding() {
  const companyIdRaw      = companyID.value ?? localStorage.getItem('company_id') ?? ''
  const token             = localStorage.getItem('token')
  if (token) setAuthCookie(token)

  const encode           = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.')
  const encodedToken     = token        ? encode(token)        : ''
  const encodedCompanyId = companyIdRaw ? encode(companyIdRaw) : ''

  const query: Record<string, string> = {
    siteSlug:   siteSlug.value,
    domainLink: domainLink.value ?? '',
    type:       'team',
    adminEmail: resolvedAdminEmail.value,
  }
  if (hasCustomDomain.value && isDnsAvailable.value === true && dnsInput.value.trim()) {
    query.customDomain = dnsInput.value.trim()
  }
  if (encodedToken)     query._auth = encodedToken
  if (encodedCompanyId) query._cid  = encodedCompanyId

  if (emailList.value.length > 0) {
    invitePeople(
      { payload: { company_id: companyIdRaw, emails: [...emailList.value] } },
      {
        onSuccess: () => router.push({ path: '/finish-profile', query }),
        onError:   () => router.push({ path: '/finish-profile', query }),
      }
    )
  } else {
    router.push({ path: '/finish-profile', query })
  }
}

// ─── Error modal dismiss ──────────────────────────────────────────────────────
// Name conflict: user fixes on this page → just close modal
// Generic error: redirect to dashboard
function dismissErrorModal() {
  companySlugError.value = null
  if (!isNameConflictError.value) {
    router.push('/dashboard')
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────
function validateCompanyStep() {
  const next: typeof errors.value = {}
  if (!team.value.trim()) next.team        = 'Please enter your company name.'
  if (!role.value)        next.role        = 'Please select your role.'
  if (!companySize.value) next.companySize = 'Please select your company size.'
  errors.value = next
  return Object.keys(next).length === 0
}

function validatePersonalStep() {
  const next: typeof errors.value = {}
  if (!personalRole.value.trim()) next.personalRole = 'Please tell us what you do.'
  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}

function validateSchoolStep() {
  const next: typeof errors.value = {}
  if (!schoolName.value.trim()) next.schoolName     = 'Please enter your school or university name.'
  if (!educationLevel.value)    next.educationLevel = 'Please select your education level.'
  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}

function validateAdminUser(): boolean {
  const next: typeof errors.value = {}
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
  } else {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!adminEmailPlain.value.trim()) {
      next.adminEmail = 'Please enter an email address for the super admin.'
    } else if (!emailRe.test(adminEmailPlain.value.trim())) {
      next.adminEmail = 'Please enter a valid email address.'
    }
  }

  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function goBack() {
  // Hard block: after site creation, back is disabled until admin is created
  if (siteCreated.value) return
  if (activeStep.value === 8) { activeStep.value = 7; return }
  activeStep.value = Math.max(1, activeStep.value - 1)
}

async function continueHandler() {
  if (activeStep.value === 2) {
    if (selected.value === 'team'     && !validateCompanyStep())  return
    if (selected.value === 'personal' && !validatePersonalStep()) return
    if (selected.value === 'school'   && !validateSchoolStep())   return
    activeStep.value++
    return
  }

  if (activeStep.value === 3) {
    if (selectedModules.value.length === 0) {
      errors.value.selectedModules = 'Please select at least one option.'
      return
    }
    activeStep.value++
    return
  }

  if (activeStep.value === 4) {
    if (!workType.value) {
      errors.value.workType = 'Please select what kind of work you do.'
      return
    }

    if (selected.value === 'school') {
      activeStep.value++
      return
    }

    if (selected.value === 'personal') {
      isUpdatingProfile.value = true
      try {
        await updateUserProfile({
          u_work_to_do:   personalRole.value,
          work_to_do:     workType.value,
          like_to_manage: selectedModules.value,
          heard_about_us: referralSources.value,
        })
        activeStep.value = 6
      } finally {
        isUpdatingProfile.value = false
      }
      return
    }

    activeStep.value = 5
    return
  }

  // Step 5 with custom domain — bottom nav Continue triggers site creation
  if (activeStep.value === 5) {
    await continueSiteHandler()
    return
  }

  if (activeStep.value === 7) {
    if (selected.value === 'personal') {
      await updateUserProfile({
        u_work_to_do:   personalRole.value,
        work_to_do:     workType.value,
        like_to_manage: selectedModules.value,
        heard_about_us: referralSources.value,
      })
      router.push({ path: '/finish-profile', query: { welcome: '1', type: 'personal' } })
      return
    }
    updateProfile({ payload: buildProfilePayload() })
    return
  }

  activeStep.value++
}

// Single entry point for site creation
async function continueSiteHandler() {
  if (isCreateSiteDisabled.value) return
  createProfile({ payload: buildProfilePayload(true) })
}

async function sendInvites(skip = false) {
  if (!validateAdminUser()) return

  if (skip) isSkipping.value = true
  else      isInviting.value = true

  const companyIdRaw      = companyID.value ?? localStorage.getItem('company_id') ?? ''
  const usingCustomDomain = hasCustomDomain.value && isDnsAvailable.value === true

  await new Promise<void>((resolve, reject) => {
    createAdminUser(
      {
        company_id:  companyIdRaw,
        u_full_name: adminFullName.value.trim(),
        u_email:     resolvedAdminEmail.value,
        u_password:  usingCustomDomain ? adminPassword.value : '',
      },
      {
        onSuccess: () => resolve(),
        onError:   (error: any) => {
          const serverMsg       = error?.response?.data?.message ?? ''
          const isEmailConflict =
            serverMsg.toLowerCase().includes('email') ||
            serverMsg.toLowerCase().includes('exists')

          if (usingCustomDomain) {
            errors.value.adminUsername = isEmailConflict
              ? 'This username is already taken. Please choose a different one.'
              : serverMsg || 'Failed to create super admin. Please try again.'
          } else {
            errors.value.adminEmail = isEmailConflict
              ? 'This email is already taken. Please use a different email address.'
              : serverMsg || 'Failed to send invite. Please try again.'
          }

          isSkipping.value = false
          isInviting.value = false
          reject(error)
        },
      }
    )
  }).catch(() => null)

  isSkipping.value = false
  isInviting.value = false

  if (errors.value.adminUsername || errors.value.adminEmail) return

  if (skip) {
    // "Do this later" — skip OTP, release guard, go straight to finish
    adminCreated.value = true
    await finishOnboarding()
    return
  }

  // Proceed to OTP step (step 9) to verify the new super admin's email
  activeStep.value = 9
}

// ─── onMounted / onUnmounted ──────────────────────────────────────────────────
onMounted(() => {
  if (route.query.mode === 'company') {
    selected.value   = 'team'
    activeStep.value = 2
  }

  // Always register the popstate listener; it's a no-op until siteCreated = true
  window.addEventListener('popstate', handlePopState)

  gsap.to('.rocket', { y: -10, rotation: -5, repeat: -1, yoyo: true, duration: 0.6, ease: 'power1.inOut' })
  gsap.to('.trail',  { scaleY: 1.3, opacity: 0.9, repeat: -1, yoyo: true, duration: 0.5 })
})

onUnmounted(() => {
  window.removeEventListener('popstate', handlePopState)
  if (cooldownTimer) clearInterval(cooldownTimer)
})
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

