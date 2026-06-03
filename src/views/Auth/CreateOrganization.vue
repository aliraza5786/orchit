<template>
  <AuthLayout
    :steps="[...ORG_STEP_LABELS]"
    :activeStep="displayStep"
    :showSteps="activeStep <= 6"
  >
    <template #form>
      <div :class="['mx-auto w-full min-h-full', activeStep === 6 ? 'max-w-120' : 'max-w-[400px]']">
       
        <!-- Step 1: Organization -->
        <div v-show="activeStep === 1" class="mt-6">
        <router-link to="/">
          <img
            :src="isDark ? darkLogo : lightLogo"
            class="w-[130px] d-block mx-auto mb-3"
            alt="Orchit"
          />
        </router-link>
          <div class="space-y-2 mb-8 text-center">
            <h2 class="text-[24px] font-medium text-text-primary">
              Create your Organization on Orchit
            </h2>
            <p class="text-sm font-normal text-text-secondary">
              Tell us about your organization — this helps us personalize your experience in Orchit AI.
            </p>
            <p
              v-if="isSlugRetryMode"
              class="text-xs text-left rounded-[6px] px-3 py-2 mt-3 border"
              style="color: #b45309; background: color-mix(in srgb, #f59e0b 10%, transparent); border-color: color-mix(in srgb, #f59e0b 30%, transparent);"
            >
              This organization name is already taken. Please choose a different name, then continue — we'll create your space and return you to where you left off.
            </p>
          </div>
          <div class="space-y-3">
            <BaseTextField
              ref="teamRef"
              v-model="team"
              placeholder="Organization name"
              size="md"
              :error="!!errors.team"
              :message="errors.team"
            />
            <BaseMultiSelect
              v-model="industries"
              :options="industryOptions" 
              size="md"
              :allowCustom="true"
              placeholder="Select Industries: e.g. Ecommerce, SaaS, Health"
              :error="!!errors.industries"
              :message="errors.industries"
            />
            <BaseSelectField
              :noSearchAble="true"
              ref="companySizeRef"
              v-model="companySize"
              :options="ORG_COMPANY_SIZE_OPTIONS"
              placeholder="Select organization size"
              size="md"
              :error="!!errors.companySize"
              :message="errors.companySize"
            />
          </div>
        </div>

        <!-- Step 2: Contact -->
        <div v-show="activeStep === 2" class="mt-6">
          <div class="space-y-2 mb-8 text-center">
            <h2 class="text-[24px] font-medium text-text-primary">What's your contact info?</h2>
            <p class="text-sm font-normal text-text-secondary">
              Who should we reach for onboarding and account setup?
            </p>
          </div>
          <div class="space-y-3">
            <BaseTextField
              v-model="contactName"
              placeholder="Contact full name"
              size="md"
              :error="!!errors.contactName"
              :message="errors.contactName"
            />
            <BaseTextField
              v-model="contactEmail"
              placeholder="contact@yourcompany.com"
              size="md"
              autocomplete="email"
              :error="!!errors.contactEmail"
              :message="errors.contactEmail"
            />
            <BaseSelectField
              :noSearchAble="true"
              v-model="contactRole"
              :options="ORG_CONTACT_ROLE_OPTIONS"
              placeholder="Select contact role"
              size="md"
              :error="!!errors.contactRole"
              :message="errors.contactRole"
            />
          </div>
        </div>

        <!-- Step 3: Custom domain (before account) -->
        <div v-show="activeStep === 3" class="mt-6">
          <div class="space-y-2 mb-8 text-center">
            <h2 class="text-[24px] font-medium text-text-primary">Add your domain</h2>
            <p class="text-sm font-normal text-text-secondary">
              Enter your company domain. We will verify it is registered and active before you create your admin account.
            </p>
          </div>
          <div class="space-y-4 text-left">
            <div class="space-y-1.5">
              <label class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">
                Company domain <span class="text-red-500">*</span>
              </label>
              <div
                class="flex items-stretch rounded-[6px] overflow-hidden border transition-all duration-200 bg-bg-card"
                :class="[
                  isDnsAvailable === true ? 'border-green-500 ring-1 ring-green-500/20' :
                  isDnsNotRegistered ? 'border-amber-500 ring-1 ring-amber-500/20' :
                  isDnsAvailable === false ? 'border-red-500 ring-1 ring-red-500/20' :
                  isDnsFocused ? 'border-accent ring-1 ring-accent' : 'border-border',
                ]"
              >
                <input
                  v-model="dnsInput"
                  type="text"
                  placeholder="e.g. mycompany.com"
                  class="flex-1 min-w-0 px-3.5 py-2.5 text-xs outline-none bg-transparent text-text-primary"
                  @focus="isDnsFocused = true"
                  @blur="isDnsFocused = false"
                />
              </div>
              <p v-if="dnsValidationError" class="text-xs text-red-500 font-medium">{{ dnsValidationError }}</p>
              <p v-else-if="isCheckingDns" class="text-xs text-text-secondary">Checking DNS availability…</p>
              <p v-else-if="isDnsAvailable === true" class="text-xs text-green-600 flex items-center gap-1 font-medium">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {{ dnsInput.trim() }} is active and ready
              </p>
              <div
                v-else-if="isDnsNotRegistered"
                class="flex flex-col gap-2 rounded-[6px] p-4 border bg-amber-500/[0.04] border-amber-500/20 mt-1.5"
              >
                <div class="flex items-start gap-2">
                  <svg class="w-4 h-4 shrink-0 text-amber-500 mt-0.5" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4" />
                    <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                  </svg>
                  <p class="text-xs text-text-secondary leading-relaxed">
                    <strong class="text-text-primary">{{ dnsInput.trim() }}</strong>
                    is not registered yet. You can enter another domain or can purchase it from:
                  </p>
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <a
                    v-for="r in ORG_DOMAIN_REGISTRARS"
                    :key="r.name"
                    :href="r.getUrl(dnsInput.trim())"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all duration-200 hover:scale-[1.02] bg-surface border-border text-text-primary hover:border-accent/40"
                  >
                    {{ r.name }}
                    <svg class="w-2.5 h-2.5 text-text-tertiary" viewBox="0 0 12 12" fill="none">
                      <path d="M3.5 8.5l5-5M8.5 3.5H5M8.5 3.5V7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
              <p v-else-if="isDnsAvailable === false" class="text-xs text-red-500 font-medium">
                {{ dnsError || 'Domain not available or inactive' }}
              </p>
            </div>

            <div
              v-if="isDnsAvailable === true"
              class="flex items-start gap-2.5 rounded-[6px] px-4 py-3 border bg-accent/[0.04] border-accent/20"
            >
              <svg class="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4" />
                <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
              <p class="text-xs text-text-secondary leading-relaxed">
                After you create your admin account, you can verify ownership of
                <strong class="text-text-primary">{{ dnsInput.trim() }}</strong>
                via DNS.
              </p>
            </div>

            <p v-if="errors.dns" class="text-xs text-red-500 text-center">{{ errors.dns }}</p>
          </div>
        </div>

        <!-- Step 4: Super admin account (same UI as CreateProfile step 51) -->
        <div v-show="activeStep === 4" class="flex items-center justify-center w-full min-h-full py-3 mt-6">
          <div class="w-full max-w-[460px]">
            <div class="text-center space-y-3">
              <div
                class="w-14 h-14 rounded-[14px] border flex items-center justify-center mx-auto"
                style="background: color-mix(in srgb, var(--accent) 12%, transparent); border-color: color-mix(in srgb, var(--accent) 25%, transparent);"
              >
                <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" style="color: var(--accent);">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.5" />
                  <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  <path d="M17 11l1.5 1.5L21 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <h2 class="text-[24px] font-medium text-text-primary mb-3">Create Super Admin</h2>
            </div>

            <div class="space-y-3">
              <p class="text-text-secondary text-sm text-normal max-w-[360px] mx-auto text-center mb-8">
                Enter details for the super admin at your custom domain
                <strong class="text-text-primary">@{{ requiredAdminEmailDomain }}</strong>.
                We'll send a verification code after signup.
              </p>

              <div class="flex items-start gap-3 rounded-[6px] px-4 py-3 border text-left bg-accent/[0.04] border-accent/20 mb-6">
                <svg class="w-4 h-4 mt-0.5 shrink-0 text-accent" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4" />
                  <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
                <p class="text-xs text-text-secondary leading-relaxed">
                  This person will be the super admin of your organization. The full email will be
                  <strong class="text-text-primary">{{ adminEmailPrefix.trim() || 'name' }}@{{ requiredAdminEmailDomain }}</strong>.
                </p>
              </div>

              <div class="space-y-1.5">
                <div
                  class="flex items-stretch rounded-[6px] overflow-hidden border transition-all duration-200 bg-bg-card"
                  :class="errors.adminName ? 'border-red-500 ring-1 ring-red-500/20' : adminNameFocused ? 'border-border ring-1 ring-bg-body' : 'border-border'"
                >
                  <input
                    v-model="adminName"
                    type="text"
                    placeholder="Enter super admin name"
                    autocomplete="name"
                    class="flex-1 min-w-0 px-3.5 py-2.5 text-xs outline-none bg-transparent text-text-primary"
                    :disabled="isSubmitPending"
                    @focus="adminNameFocused = true"
                    @blur="adminNameFocused = false"
                  />
                </div>
                <p v-if="errors.adminName" class="text-xs text-red-500 font-medium">{{ errors.adminName }}</p>
              </div>

              <div class="space-y-1.5">
                <div
                  class="flex items-stretch rounded-[6px] overflow-hidden border transition-all duration-200 bg-bg-card"
                  :class="errors.adminEmail ? 'border-red-500 ring-1 ring-red-500/20' : adminEmailFocused ? 'border-border ring-1 ring-bg-body' : 'border-border'"
                >
                  <input
                    v-model="adminEmailPrefix"
                    type="text"
                    placeholder="admin"
                    autocomplete="username"
                    class="flex-1 min-w-0 px-3.5 py-2.5 text-xs outline-none bg-transparent text-text-primary"
                    :disabled="isSubmitPending"
                    @focus="adminEmailFocused = true"
                    @blur="adminEmailFocused = false"
                    @keyup.enter="handleSignup"
                  />
                  <div class="flex items-center px-3.5 border-l bg-surface border-border shrink-0">
                    <span class="text-[11px] font-semibold text-text-secondary select-none">
                      @{{ requiredAdminEmailDomain }}
                    </span>
                  </div>
                </div>
                <p v-if="errors.adminEmail" class="text-xs text-red-500 font-medium">{{ errors.adminEmail }}</p>
              </div>

              <div class="space-y-1.5">
                <div
                  class="flex items-stretch rounded-[6px] overflow-hidden border transition-all duration-200 bg-bg-card"
                  :class="errors.adminPassword ? 'border-red-500 ring-1 ring-red-500/20' : adminPasswordFocused ? 'border-border ring-1 ring-bg-body' : 'border-border'"
                >
                  <input
                    v-model="adminPassword"
                    :type="isAdminPasswordVisible ? 'text' : 'password'"
                    placeholder="Set password"
                    autocomplete="new-password"
                    class="flex-1 min-w-0 px-3.5 py-2.5 text-xs outline-none bg-transparent text-text-primary"
                    :disabled="isSubmitPending"
                    @focus="adminPasswordFocused = true"
                    @blur="adminPasswordFocused = false"
                    @keyup.enter="handleSignup"
                  />
                  <button
                    type="button"
                    class="px-3 inline-flex items-center justify-center text-text-secondary hover:opacity-80 focus:outline-none"
                    :disabled="isSubmitPending"
                    @click="isAdminPasswordVisible = !isAdminPasswordVisible"
                    :aria-label="isAdminPasswordVisible ? 'Hide password' : 'Show password'"
                  >
                    <svg
                      v-if="!isAdminPasswordVisible"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      aria-hidden="true"
                    >
                      <path d="M2.25 12s3.75-6.75 9.75-6.75 9.75 6.75 9.75 6.75-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z"/>
                      <path d="M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
                    </svg>
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
                <p v-if="errors.adminPassword" class="text-xs text-red-500 font-medium">{{ errors.adminPassword }}</p>
              </div>

              <p v-if="signupError" class="text-red-500 text-sm text-center">{{ signupError }}</p>

              <Button
                type="button"
                size="md"
                :block="true"
                :disabled="!adminEmailPrefix.trim() || !adminName.trim() || !adminPassword.trim() || isSubmitPending"
                :loading="isSubmitPending"
                @click="handleSignup"
              >
                {{ isSubmitPending ? 'Creating account…' : 'Create Account' }}
              </Button>
            </div>
          </div>
        </div>

        <!-- Step 5: OTP -->
        <div v-show="activeStep === 5" class="mt-6">
          <div class="mb-8 space-y-3 text-center">
            <h2 class="text-[24px] font-medium text-text-primary">Enter verification code</h2>
            <p class="text-sm font-normal text-text-secondary">
              We sent a five-digit code to
              <span class="block sm:inline font-medium text-text-primary break-all">
                {{ otpEmailDisplay }}
              </span>
            </p>
          </div>
          <div class="flex justify-center gap-2 sm:gap-4 pb-4">
            <input
              v-for="(_, index) in OTP_DIGITS"
              :key="index"
              :ref="(el) => setOtpDigitRef(el, index)"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="1"
              autocomplete="one-time-code"
              enterkeyhint="done"
              class="w-full aspect-square text-3xl p-1 md:p-2 font-bold text-center border rounded-lg focus:outline-none border-accent"
              :class="[
                otpError ? 'border-red-500' : '',
                isVerifyingOtp ? 'opacity-60 pointer-events-none' : '',
              ]"
              :value="otpCode[index]"
              :disabled="isVerifyingOtp || isCreatingCompany"
              @keydown="handleOtpKey(index, $event)"
              @paste.prevent="handleOtpPaste(index, $event)"
              @input="handleOtpInput(index, $event)"
              @focus="selectOtpOnFocus"
            />
          </div>
          <p v-if="otpError" class="text-red-500 text-sm text-center mt-2">{{ otpError }}</p>
          <p v-if="otpResendSuccess" class="text-green-600 text-sm text-center mt-2">{{ otpResendSuccess }}</p>
          <p class="text-sm font-normal text-text-secondary text-center mt-4">
            Didn't receive an email? Check your junk folder.
            <span
              class="text-text-primary font-medium underline ml-1"
              :class="otpResendCooldown > 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'"
              role="button"
              :aria-disabled="otpResendCooldown > 0 || isResendingOtp"
              @click="otpResendCooldown === 0 && !isResendingOtp && handleResendOtp()"
            >
              {{
                otpResendCooldown > 0
                  ? `Resend in ${otpResendCooldown}s`
                  : isResendingOtp
                    ? 'Resending…'
                    : 'Resend code'
              }}
            </span>
          </p>
        </div>

        <!-- Step 6: Domain verification (same UI as CreateProfile step 8) -->
        <div v-if="activeStep === 6" class="flex items-center justify-center min-h-full">
          <div class="w-full max-w-120 space-y-6">
            <div class="space-y-1.5 mb-8">
              <div class="flex flex-col items-center gap-3">
                <div
                  class="w-14 h-14 rounded-[14px] border flex items-center justify-center mx-auto"
                  style="background: color-mix(in srgb, var(--accent) 12%, transparent); border-color: color-mix(in srgb, var(--accent) 25%, transparent);"
                >
                  <svg class="w-7 h-7" viewBox="0 0 20 20" fill="none" style="color: var(--accent);">
                    <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M10 2.5c0 0-3 3.5-3 7.5s3 7.5 3 7.5M10 2.5c0 0 3 3.5 3 7.5s-3 7.5-3 7.5M2.5 10h15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </div>
                <div>
                  <h2 class="text-[24px] font-medium text-text-primary leading-tight mb-3">Verify your domain</h2>
                  <p class="text-sm text-text-secondary" style="color: var(--text-secondary);">Prove ownership of <strong style="color: var(--text-primary);">{{ dnsInput.trim() }}</strong></p>
                </div>
              </div>
            </div>

            <div v-if="domainPhase === 'idle'" class="rounded-[6px] border p-6 space-y-5" style="background: var(--bg-card); border-color: var(--border);">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center" style="background: color-mix(in srgb, #1d9e75 10%, transparent); border: 1.5px solid color-mix(in srgb, #1d9e75 20%, transparent);">
                  <svg class="w-5 h-5" viewBox="0 0 20 20" fill="none" style="color: #1d9e75;"><path d="M10 2l2.24 5.14L18 8.27l-4 3.86.94 5.87L10 15.4l-4.94 2.6.94-5.87-4-3.86 5.76-1.13L10 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>
                </div>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-text-primary mb-0.5">Your organization is ready!</p>
                  <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">
                    Verify your custom domain <strong style="color: var(--text-primary);">{{ dnsInput.trim() }}</strong> to use it as your organization URL. This step is optional but recommended.
                  </p>
                </div>
              </div>
              <div class="flex gap-3">
                <Button
                  type="button"
                  size="md"
                  class="flex-1 font-bold"
                  :loading="isRegisteringDomain"
                  @click="startDomainVerificationPhase"
                >
                  Verify my domain
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  class="flex-1 font-semibold"
                  @click="skipDomainVerification"
                >
                  Do this later
                </Button>
              </div>
            </div>

            <div v-else-if="domainPhase === 'verify'" class="space-y-2.5">
              <div class="flex items-center gap-2 px-3 py-2 rounded-[6px] border" style="background: var(--bg-surface); border-color: var(--border);">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" style="color: var(--accent);">
                  <circle cx="10" cy="10" r="7.5" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M10 2.5c0 0-3 3.5-3 7.5s3 7.5 3 7.5M10 2.5c0 0 3 3.5 3 7.5s-3 7.5-3 7.5M2.5 10h15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <span class="text-sm font-semibold" style="color: var(--text-primary);">{{ dnsInput.trim() }}</span>
                <span class="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" :style="domainStatusStyle">{{ domainStatusLabel }}</span>
                <button v-if="currentDomain?.status !== 'verified'" type="button" class="text-xs font-medium ml-1 transition-opacity hover:opacity-70" style="color: var(--text-secondary);" @click="domainPhase = 'idle'">Cancel</button>
              </div>

              <div v-if="methodSwitched" class="flex items-start gap-2 rounded-[6px] px-3 py-2 border" style="background: color-mix(in srgb, #f59e0b 8%, transparent); border-color: color-mix(in srgb, #f59e0b 30%, transparent);">
                <svg class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #f59e0b;"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                <p class="text-xs leading-relaxed" style="color: #f59e0b;">Apex domain detected — CNAME is not supported on root domains. We've automatically switched to <strong>TXT verification</strong>.</p>
              </div>

              <div v-if="currentDomain?.status === 'verified'" class="flex items-center gap-2.5 px-3 py-2 rounded-[6px] border" style="background: color-mix(in srgb, #1d9e75 8%, transparent); border-color: color-mix(in srgb, #1d9e75 25%, transparent);">
                <span class="flex items-center justify-center w-6 h-6 rounded-full shrink-0" style="background: #1d9e75;">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
                <div>
                  <p class="text-sm font-semibold" style="color: #1d9e75;">Domain verified successfully!</p>
                  <p class="text-xs" style="color: var(--text-secondary);">Your domain ownership has been confirmed.</p>
                </div>
              </div>

              <div v-if="currentDomain?.status !== 'verified'" class="space-y-1.5">
                <p class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--text-secondary);">Verification method</p>
                <div
                  class="inline-flex w-full p-0.5 rounded-[6px] gap-0.5"
                  style="background: var(--bg-surface); border: 1px solid var(--border);"
                  :class="isSwitchingMethod ? 'opacity-50 pointer-events-none' : ''"
                >
                  <button
                    v-for="m in verificationMethods"
                    :key="m.value"
                    type="button"
                    @click="switchVerificationMethod(m.value)"
                    :disabled="isSwitchingMethod"
                    class="flex-1 py-1.5 px-2 rounded-md text-xs font-semibold text-center transition-all duration-200 cursor-pointer"
                    :style="selectedVerificationMethod === m.value
                      ? 'background: var(--accent); color: var(--accent-text, #fff); box-shadow: 0 1px 4px rgba(0,0,0,0.15);'
                      : 'background: transparent; color: var(--text-secondary);'"
                  >
                    {{ m.label }}
                  </button>
                </div>
              </div>

              <div v-if="currentInstructions && currentDomain?.status !== 'verified'" class="space-y-2">
                <template v-if="currentInstructions.method === 'cname' || currentInstructions.method === 'txt'">
                  <p class="text-[11px] leading-snug" style="color: var(--text-secondary);">Add the following DNS record at your DNS host (GoDaddy, Cloudflare, Namecheap, etc.)</p>

                  <div class="p-2.5 rounded-[6px] border flex flex-col gap-2 bg-bg-card text-left" style="border-color: var(--border);">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Record Type</span>
                        <span class="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-accent/10 text-accent border border-accent/20">
                          {{ currentInstructions.record_type }}
                        </span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">TTL</span>
                        <span class="text-xs font-semibold text-text-primary bg-surface px-2 py-0.5 rounded border border-border">
                          {{ currentInstructions.ttl_recommended }}s
                        </span>
                      </div>
                    </div>

                    <hr class="border-border opacity-40 my-0" style="border-color: var(--border);" />

                    <div class="space-y-1 text-left">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Host / Name</span>
                      <div class="flex items-center justify-between gap-2 p-2 rounded-[6px] bg-surface border border-border transition-colors hover:border-accent/30" style="border-color: var(--border);">
                        <span class="text-xs font-mono select-all truncate text-text-primary" :title="currentInstructions.record_host">{{ currentInstructions.record_host }}</span>
                        <button
                          type="button"
                          @click="copyToClipboard(currentInstructions.record_host, 'host')"
                          class="shrink-0 p-1.5 rounded-[6px] transition-all duration-200 text-text-secondary hover:text-accent hover:bg-accent/10"
                          title="Copy Host"
                        >
                          <svg v-if="copiedField !== 'host'" class="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                          <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                      </div>
                    </div>

                    <div class="space-y-1 text-left">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Value / Points to</span>
                      <div class="flex items-center justify-between gap-2 p-2 rounded-[6px] bg-surface border border-border transition-colors hover:border-accent/30" style="border-color: var(--border);">
                        <span class="text-xs font-mono select-all truncate text-text-primary" :title="currentInstructions.record_value">{{ currentInstructions.record_value }}</span>
                        <button
                          type="button"
                          @click="copyToClipboard(currentInstructions.record_value, 'value')"
                          class="shrink-0 p-1.5 rounded-[6px] transition-all duration-200 text-text-secondary hover:text-accent hover:bg-accent/10"
                          title="Copy Value"
                        >
                          <svg v-if="copiedField !== 'value'" class="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                          <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <p class="text-[11px] leading-snug px-0.5 opacity-75" style="color: var(--text-secondary);">{{ currentInstructions.note }}</p>
                </template>

                <template v-else-if="currentInstructions.method === 'http'">
                  <p class="text-[11px] leading-snug" style="color: var(--text-secondary);">Upload a verification file to your web server so it's reachable at the URL below.</p>

                  <div class="p-2.5 rounded-[6px] border flex flex-col gap-2 bg-bg-card text-left" style="border-color: var(--border);">
                    <div class="space-y-1 text-left">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">File URL</span>
                      <div class="flex items-center justify-between gap-2 p-2 rounded-[6px] bg-surface border border-border transition-colors hover:border-accent/30" style="border-color: var(--border);">
                        <span class="text-xs font-mono select-all truncate text-text-primary" :title="currentInstructions.file_url">{{ currentInstructions.file_url }}</span>
                        <button
                          type="button"
                          @click="copyToClipboard(currentInstructions.file_url, 'file_url')"
                          class="shrink-0 p-1.5 rounded-[6px] transition-all duration-200 text-text-secondary hover:text-accent hover:bg-accent/10"
                          title="Copy File URL"
                        >
                          <svg v-if="copiedField !== 'file_url'" class="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                          <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                      </div>
                    </div>

                    <div class="space-y-1 text-left">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-text-secondary">File Content</span>
                      <div class="flex items-center justify-between gap-2 p-2 rounded-[6px] bg-surface border border-border transition-colors hover:border-accent/30" style="border-color: var(--border);">
                        <span class="text-xs font-mono select-all truncate text-text-primary" :title="currentInstructions.file_content">{{ currentInstructions.file_content }}</span>
                        <button
                          type="button"
                          @click="copyToClipboard(currentInstructions.file_content, 'file_content')"
                          class="shrink-0 p-1.5 rounded-[6px] transition-all duration-200 text-text-secondary hover:text-accent hover:bg-accent/10"
                          title="Copy File Content"
                        >
                          <svg v-if="copiedField !== 'file_content'" class="w-4 h-4" viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M2 11V3a1 1 0 011-1h8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                          <svg v-else class="w-4 h-4" viewBox="0 0 16 16" fill="none" style="color: #1d9e75;"><path d="M3 8l3.5 3.5L13 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    :block="true"
                    :loading="isDownloadingFile"
                    @click="downloadVerificationFile"
                  >
                    <template #icon v-if="!isDownloadingFile">
                      <svg class="w-4 h-4 mr-2" viewBox="0 0 16 16" fill="none" style="color: var(--accent);"><path d="M8 2v8M5 7l3 3 3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </template>
                    Download streamed-verify.txt
                  </Button>
                  <p class="text-xs leading-relaxed px-1" style="color: var(--text-secondary);">{{ currentInstructions.note }}</p>
                </template>
              </div>

              <div v-if="currentDomain?.last_check_result?.error && currentDomain?.status !== 'verified'" class="flex items-start gap-2 rounded-[6px] px-3 py-2.5 border transition-all duration-300 text-left animate-fade-in" style="background: color-mix(in srgb, #e55050 7%, transparent); border-color: color-mix(in srgb, #e55050 25%, transparent);">
                <svg class="w-4.5 h-4.5 mt-0.5 shrink-0" viewBox="0 0 16 16" fill="none" style="color: #e55050;"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
                <div>
                  <p class="text-xs font-semibold mb-0.5" style="color: #e55050;">Verification check failed</p>
                  <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">{{ currentDomain?.last_check_result?.error }}</p>
                </div>
              </div>

              <div v-if="retryCountdown > 0 && currentDomain?.status !== 'verified'" class="flex items-center gap-2 px-3 py-2 rounded-[6px] border text-left" style="background: var(--bg-surface); border-color: var(--border);">
                <svg class="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none" style="color: var(--text-secondary);"><circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 4.5v4l2.5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
                <p class="text-xs" style="color: var(--text-secondary);">Please wait <span class="font-bold tabular-nums" style="color: var(--text-primary);">{{ retryCountdown }}s</span> before checking again.</p>
                <div class="ml-auto flex-1 max-w-20 h-1 rounded-full overflow-hidden" style="background: var(--border);">
                  <div class="h-full rounded-full transition-all duration-1000" style="background: var(--accent);" :style="{ width: `${(retryCountdown / retryTotal) * 100}%` }" />
                </div>
              </div>

              <div v-if="currentDomain?.status !== 'verified'" class="space-y-1.5">
                <Button
                  type="button"
                  size="md"
                  :block="true"
                  :disabled="isRechecking || retryCountdown > 0"
                  :loading="isRechecking"
                  @click="recheckVerification"
                >
                  <template #icon v-if="!isRechecking">
                    <svg class="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 10-3 6.3"/><path d="M20 4v6h-6"/><path d="M9 12l2 2 4-4"/></svg>
                  </template>
                  I've added the record — verify now
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  :block="true"
                  @click="skipDomainVerification"
                >
                  Skip for now
                </Button>
              </div>

              <div v-if="currentDomain?.status === 'verified'" class="space-y-2">
                <button v-if="!currentDomain.is_primary" type="button" :disabled="isSettingPrimary" class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[6px] border-2 transition-all duration-200 text-left animate-fade-in" style="border-color: var(--border); background: var(--bg-surface);" @click="setPrimaryDomain">
                  <svg class="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="none" style="color: #f59e0b;"><path d="M10 2l2.24 5.14L18 8.27l-4 3.86.94 5.87L10 15.4l-4.94 2.6.94-5.87-4-3.86 5.76-1.13L10 2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
                  <div class="flex-1"><p class="text-sm font-semibold" style="color: var(--text-primary);">Set as primary domain</p><p class="text-xs" style="color: var(--text-secondary);">Use {{ dnsInput.trim() }} as your main workspace URL</p></div>
                  <span v-if="isSettingPrimary" class="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                </button>
                <div v-else class="flex items-center gap-2 px-3 py-2 rounded-[6px] text-left" style="background: color-mix(in srgb, #f59e0b 10%, transparent); border: 1px solid color-mix(in srgb, #f59e0b 25%, transparent);">
                  <svg class="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="#f59e0b"><path d="M10 2l2.24 5.14L18 8.27l-4 3.86.94 5.87L10 15.4l-4.94 2.6.94-5.87-4-3.86 5.76-1.13L10 2z"/></svg>
                  <p class="text-xs font-semibold" style="color: #f59e0b;">Primary domain</p>
                </div>
                <Button
                  type="button"
                  size="md"
                  :block="true"
                  @click="goToLoaderStep"
                >
                  Continue
                  <svg class="w-4 h-4 ml-2" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </Button>
              </div>
              <p v-if="recheckError" class="text-xs text-center" style="color: #e55050;">{{ recheckError }}</p>
            </div>
          </div>
        </div>

        <!-- Step 7: Provisioning loader -->
        <div v-if="activeStep === 7" class="flex items-center justify-center mx-auto mt-6">
          <LoadingCreateProfile
            :active="activeStep === 7"
            :abort="!!provisionError"
            :loading="isLoaderRunning"
            profileType="team"
            @complete="onProvisioningComplete"
          />
        </div>

        <!-- Step 8: Referral -->
        <div v-show="activeStep === 8" class="mt-6">
          <div class="space-y-2 mb-8 text-center">
            <h2 class="text-[24px] font-medium text-text-primary">Where did you hear about us?</h2>
            <p class="text-text-secondary text-sm">Select all that apply.</p>
          </div>
          <div class="grid grid-cols-2 gap-3 w-full">
            <button
              v-for="item in ORG_REFERRAL_OPTIONS"
              :key="item.id"
              type="button"
              @click="toggleReferral(item.id)"
              class="flex items-center justify-between p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 hover:shadow-sm"
              :class="referralSources.includes(item.id)
                ? 'bg-accent/[0.04] border-accent text-text-primary'
                : 'border-border bg-bg-card hover:border-accent/40 text-text-secondary hover:text-text-primary'"
            >
              <span class="text-xs font-semibold select-none">{{ item.label }}</span>
              <span
                class="w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 shrink-0"
                :class="referralSources.includes(item.id)
                  ? 'border-accent bg-accent text-white'
                  : 'border-text-tertiary'"
              >
                <svg
                  v-if="referralSources.includes(item.id)"
                  width="8"
                  height="8"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="4"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
            </button>
          </div>
          <p v-if="errors.referral" class="text-xs text-red-500 text-center mt-3">{{ errors.referral }}</p>
        </div>

        <!-- Navigation -->
        <div
          v-if="activeStep !== 4 && activeStep !== 5 && activeStep !== 6 && activeStep !== 7"
          class="flex justify-between items-center mt-10"
        >
          <Button
            v-if="canGoBack"
            variant="secondary"
            size="md"
            type="button"
            :disabled="isAnyMutating || (activeStep === 4 && isSubmitPending)"
            @click="goBack"
          >
            Back
          </Button>
          <div v-else />

          <div class="flex items-center gap-2 ml-auto">
            <Button
              v-if="activeStep < 8 && activeStep !== 6"
              :disabled="isAnyMutating || isDomainStepContinueDisabled"
              :loading="isAnyMutating"
              size="md"
              type="button"
              @click="handleContinue"
            >
              {{
                activeStep === 1 && isSlugRetryMode
                  ? 'Save and continue'
                  : activeStep === 3 && dnsInput.trim()
                    ? `Continue with ${dnsInput.trim()}`
                    : 'Continue'
              }}
            </Button>
            <Button
              v-if="activeStep === 8"
              :disabled="isAnyMutating"
              :loading="isAnyMutating"
              size="md"
              type="button"
              @click="handleFinish"
            >
              Finish
            </Button>
          </div>
        </div>

        <div v-if="activeStep === 5" class="flex justify-between items-center mt-10">
          <div />
          <Button
            class="ml-auto"
            :disabled="!isOtpComplete || isVerifyingOtp || isCreatingCompany"
            :loading="isVerifyingOtp || isCreatingCompany"
            size="md"
            type="button"
            @click="handleVerifyOtp"
          >
            Verify &amp; continue
          </Button>
        </div>
      </div>
    </template>
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useMutation } from '@tanstack/vue-query'
import type { ComponentPublicInstance } from 'vue'
import { toast } from 'vue-sonner'
import AuthLayout from '../../layout/AuthLayout/AuthLayout.vue'
import BaseTextField from '../../components/ui/BaseTextField.vue'
import BaseSelectField from '../../components/ui/BaseSelectField.vue'
import BaseMultiSelect from '../../components/ui/BaseMultiSelect.vue'
import Button from '../../components/ui/Button.vue'
import LoadingCreateProfile from '../../components/LoadingCreateProfile.vue'
import {
  register,
  verifyOtp,
  resendOtp,
  useCreateCompany,
  useUpdateCompany,
} from '../../services/auth'
import { useAuthStore, getToken } from '../../stores/auth'
import {
  useWorkspaceStore,
  type VerificationMethod,
  type DomainObject,
  type DomainInstructions,
} from '../../stores/workspace'
import { useIndustries } from '../../queries/useWorkspace'
import { useTheme } from '../../composables/useTheme'
import { setAuthCookie } from '../../utilities/auth'
import { getEmailDomain } from '../../utilities/onboardingRedirect'
import { getPendingWorkspaceInviteRedirectPath } from '../../utilities/workspaceInvitePending'
import {
  patchOrgDraft,
  getOrgDraft,
  getOrgDraftPartial,
  saveOrgActiveStep,
  getOrgActiveStep,
  saveOrgSignupEmail,
  getOrgSignupEmail,
  saveOrgSignupToken,
  getOrgSignupToken,
  markCreateOrgPendingOnboarding,
  hasCreateOrgPendingOnboarding,
  clearCreateOrgPendingFlag,
  clearOrgDraft,
  saveCompanyCreateRetryReturnStep,
  getCompanyCreateRetryReturnStep,
  clearCompanyCreateRetryReturnStep,
  isCompanyCreateSlugRetryActive,
  type OrgDraft,
} from '../../utilities/createOrganizationDraft'
import {
  ORG_STEP_LABELS,
  ORG_COMPANY_SIZE_OPTIONS,
  ORG_CONTACT_ROLE_OPTIONS,
  ORG_REFERRAL_OPTIONS,
  ORG_DOMAIN_REGISTRARS,
  ORG_VERIFICATION_METHODS,
  OTP_DIGITS,
  OTP_RESEND_COOLDOWN_SEC,
} from './organizationOnboarding/constants'
import darkLogo from '@assets/global/dark-logo.png'
import lightLogo from '@assets/global/light-logo.png'

defineOptions({ name: 'CreateOrganization' })

type FocusableTextField = { focus: () => void }

const DOMAIN_RE = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,10}$/

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const workspaceStore = useWorkspaceStore()
const { isDark, theme } = useTheme()

const { data: industryData } = useIndustries()

const activeStep = ref(1)
const errors = ref<Record<string, string>>({})
const signupError = ref('')
const signupAccessToken = ref('')

const teamRef = ref<FocusableTextField | null>(null)
const team = ref('')
const industries = ref<string[]>([])
const companySize = ref('')

const contactName = ref('')
const contactEmail = ref('')
const contactRole = ref('')

const adminName = ref('')
const adminEmailPrefix = ref('')
const adminPassword = ref('')
const adminNameFocused = ref(false)
const adminEmailFocused = ref(false)
const adminPasswordFocused = ref(false)
const isAdminPasswordVisible = ref(false)

const otpCode = ref<string[]>(Array.from({ length: OTP_DIGITS }, () => ''))
const otpError = ref('')
const otpResendSuccess = ref('')
const otpResendCooldown = ref(0)
let otpResendTimer: ReturnType<typeof setInterval> | null = null
const otpDigitRefs = ref<(HTMLInputElement | null)[]>(
  Array.from({ length: OTP_DIGITS }, () => null),
)

const dnsInput = ref('')
const isDnsFocused = ref(false)
const isCheckingDns = ref(false)
const isDnsAvailable = ref<boolean | null>(null)
const isDnsNotRegistered = ref(false)
const dnsError = ref<string | null>(null)
const dnsValidationError = ref<string | null>(null)
let dnsDebounceTimer: ReturnType<typeof setTimeout> | null = null

const domainPhase = ref<'idle' | 'verify'>('idle')
const isRegisteringDomain = ref(false)
const currentDomain = ref<DomainObject | null>(null)
const currentInstructions = ref<DomainInstructions | null>(null)
const selectedVerificationMethod = ref<VerificationMethod>('cname')
const methodSwitched = ref(false)
const isRechecking = ref(false)
const recheckError = ref<string | null>(null)
const isSwitchingMethod = ref(false)
const isDownloadingFile = ref(false)
const isSettingPrimary = ref(false)
const copiedField = ref<string | null>(null)
const retryCountdown = ref(0)
const retryTotal = ref(30)
let domainCountdownTimer: ReturnType<typeof setInterval> | null = null

const verificationMethods = ORG_VERIFICATION_METHODS

const isLoaderRunning = ref(true)
const provisionError = ref<string | null>(null)

const referralSources = ref<string[]>([])

const companyID = ref<string | null>(null)
const domainLink = ref('')
const siteSlug = ref('')

const industryOptions = computed(() => {
  const raw = industryData.value
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { data?: unknown })?.data)
      ? (raw as { data: unknown[] }).data
      : []
  return list.map((item: string | { title?: string; name?: string; _id?: string }) => {
    if (typeof item === 'string') return { title: item, _id: item }
    const title = item.title ?? item.name ?? ''
    return { title, _id: String(item._id ?? title) }
  })
})

const displayStep = computed(() => {
  const s = activeStep.value
  if (s <= 2) return s
  if (s === 3) return 3
  if (s <= 5) return 4
  return 5
})

const hasSignedUp = computed(
  () => !!(getOrgSignupEmail() || getOrgSignupToken() || signupAccessToken.value),
)

const companyCreated = computed(
  () => !!(companyID.value || localStorage.getItem('company_id')),
)

const isSlugRetryMode = computed(
  () => isCompanyCreateSlugRetryActive() && activeStep.value === 1,
)

/** Back only on steps 2–4 before signup and before company exists. */
const canGoBack = computed(() => {
  if (isSlugRetryMode.value) return false
  if (activeStep.value < 2 || activeStep.value > 4) return false
  if (hasSignedUp.value || companyCreated.value) return false
  return true
})

function normalizeOrgDomain(domain: string): string {
  return domain.toLowerCase().trim().replace(/^www\./, '')
}

const requiredAdminEmailDomain = computed(() => {
  const fromInput = dnsInput.value.trim()
  const fromDraft = getOrgDraftPartial().customDomain?.trim() ?? ''
  const raw = fromInput || fromDraft
  return raw ? normalizeOrgDomain(raw) : ''
})

const adminEmail = computed(() => {
  const prefix = adminEmailPrefix.value.trim()
  const domain = requiredAdminEmailDomain.value
  if (!prefix || !domain) return ''
  return `${prefix}@${domain}`
})

const otpEmailDisplay = computed(
  () => adminEmail.value || getOrgSignupEmail(),
)

const isOtpComplete = computed(() => otpCode.value.every((c) => c.length === 1))

function emailMatchesOrgDomain(email: string, orgDomain: string): boolean {
  const emailDomain = getEmailDomain(email)
  const required = normalizeOrgDomain(orgDomain)
  if (!emailDomain || !required) return false
  return emailDomain === required
}

/** Same rules as CreateProfile custom-domain step; domain is required on step 3. */
const domainStatusLabel = computed(() => {
  const s = currentDomain.value?.status
  if (s === 'verified') return 'Verified'
  if (s === 'verifying') return 'Verifying'
  if (s === 'pending') return 'Pending'
  if (s === 'failed') return 'Failed'
  if (s === 'disabled') return 'Disabled'
  return 'Pending'
})

const domainStatusStyle = computed(() => {
  const s = currentDomain.value?.status
  if (s === 'verified') return { background: 'color-mix(in srgb, #1d9e75 12%, transparent)', color: '#1d9e75' }
  if (s === 'failed') return { background: 'color-mix(in srgb, #e55050 12%, transparent)', color: '#e55050' }
  if (s === 'disabled') return { background: 'color-mix(in srgb, #6b7280 12%, transparent)', color: '#6b7280' }
  return { background: 'color-mix(in srgb, #f59e0b 12%, transparent)', color: '#f59e0b' }
})

const isDomainStepContinueDisabled = computed(() => {
  if (activeStep.value !== 3) return false
  const domain = dnsInput.value.trim()
  if (!domain) return true
  if (dnsValidationError.value) return true
  if (isCheckingDns.value) return true
  if (dnsError.value) return true
  if (isDnsAvailable.value !== true) return true
  return false
})

const { mutateAsync: registerMutate, isPending: isRegisterPending } = useMutation({
  mutationFn: register,
})

const { mutateAsync: verifyOtpMutate, isPending: isVerifyingOtp } = useMutation({
  mutationFn: verifyOtp,
})

const { mutateAsync: resendOtpMutate, isPending: isResendingOtp } = useMutation({
  mutationFn: resendOtp,
})

const { mutateAsync: createCompanyMutate, isPending: isCreatingCompany } = useCreateCompany()
const { mutateAsync: updateCompanyMutate, isPending: isUpdatingCompany } = useUpdateCompany()

const isSubmitPending = computed(() => isRegisterPending.value)

const isAnyMutating = computed(
  () =>
    isSubmitPending.value ||
    isVerifyingOtp.value ||
    isCreatingCompany.value ||
    isUpdatingCompany.value ||
    isRegisteringDomain.value ||
    isRechecking.value ||
    isSwitchingMethod.value ||
    isDownloadingFile.value ||
    isSettingPrimary.value,
)

function isApiSuccess(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const body = payload as Record<string, unknown>
  return body.status !== false
}

function extractAuthToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const root = data as Record<string, unknown>
  const nested = root.data as Record<string, unknown> | undefined
  const token =
    nested?.token ??
    root.token ??
    nested?.access_token ??
    root.access_token
  return typeof token === 'string' && token.trim() ? token.trim() : null
}

function resolveAccessToken(): string {
  if (signupAccessToken.value.trim()) return signupAccessToken.value.trim()
  const stored = getOrgSignupToken()
  if (stored.trim()) return stored.trim()
  return getToken() ?? ''
}

function saveSessionToken(token: string) {
  signupAccessToken.value = token
  saveOrgSignupToken(token)
  authStore.setSessionToken(token)
}

function showOtpError(message: string) {
  otpError.value = message
}

function isCompanySlugExistsError(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('slug already exists') ||
    (m.includes('company slug') && m.includes('already exist')) ||
    m.includes('different company name')
  )
}

/** Step to land on after company create succeeds (OTP step advances to domain verify). */
function resolveStepAfterCompanyCreate(returnStep: number | null): number {
  if (returnStep == null) return 6
  if (returnStep <= 5) return 6
  return returnStep
}

function redirectToSlugRetryStep(fromStep: number, message: string) {
  if (getCompanyCreateRetryReturnStep() == null) {
    saveCompanyCreateRetryReturnStep(fromStep)
  }
  toast.error(message)
  errors.value = { ...errors.value, team: message }
  activeStep.value = 1
  persistActiveStep(1)
  nextTick(() => teamRef.value?.focus())
}

function buildCompanyPayload(draft: OrgDraft): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    type: 'team',
    title: draft.team,
    company_size: draft.companySize,
    industries: draft.industries,
    role_id: draft.contactRole,
    primary_contact_name: draft.contactName,
    primary_contact_email: draft.contactEmail,
  }
  const domain = (draft.customDomain ?? dnsInput.value).trim()
  payload.custom_domain = domain
  return payload
}

function hydrateFromDraft(partial: Partial<OrgDraft>) {
  if (partial.team != null) team.value = partial.team
  if (Array.isArray(partial.industries)) industries.value = [...partial.industries]
  if (partial.companySize) companySize.value = partial.companySize
  if (partial.contactName != null) contactName.value = partial.contactName
  if (partial.contactEmail) contactEmail.value = partial.contactEmail
  if (partial.contactRole) contactRole.value = partial.contactRole
  if (partial.customDomain) dnsInput.value = partial.customDomain
  if (partial.adminName) adminName.value = partial.adminName
  if (partial.adminEmail) syncAdminEmailPrefixFromFull(partial.adminEmail)
}

function syncAdminEmailPrefixFromFull(fullEmail: string) {
  const email = fullEmail.trim()
  if (!email || !email.includes('@')) {
    adminEmailPrefix.value = email
    return
  }
  const domain = requiredAdminEmailDomain.value || getEmailDomain(email)
  const at = email.lastIndexOf('@')
  if (domain && email.slice(at + 1).toLowerCase() === domain) {
    adminEmailPrefix.value = email.slice(0, at)
  } else {
    adminEmailPrefix.value = email.split('@')[0] ?? ''
  }
}

function persistActiveStep(step: number) {
  saveOrgActiveStep(step)
  if (Number(route.query.step) !== step) {
    router.replace({ query: { ...route.query, step: String(step) } })
  }
}

function toggleReferral(id: string) {
  if (referralSources.value.includes(id)) {
    referralSources.value = referralSources.value.filter((i) => i !== id)
  } else {
    referralSources.value.push(id)
    if (errors.value.referral) errors.value.referral = ''
  }
}

function validateStep1(): boolean {
  const next: Record<string, string> = {}
  if (!team.value.trim()) next.team = 'Please enter your organization name.'
  if (!industries.value.length) next.industries = 'Select at least one industry.'
  if (!companySize.value) next.companySize = 'Please select your organization size.'
  errors.value = next
  return Object.keys(next).length === 0
}

function validateStep2(): boolean {
  const next: Record<string, string> = {}
  const name = contactName.value.trim()
  const email = contactEmail.value.trim()
  if (!name) next.contactName = 'Contact name is required.'
  if (!email) next.contactEmail = 'Contact email is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.contactEmail = 'Invalid email format.'
  if (!contactRole.value) next.contactRole = 'Please select a contact role.'
  errors.value = next
  return Object.keys(next).length === 0
}

function validateStep3(): boolean {
  errors.value = {}
  const domain = dnsInput.value.trim()
  if (!domain) {
    errors.value.dns = 'Please enter your company domain.'
    return false
  }
  if (dnsValidationError.value) {
    errors.value.dns = dnsValidationError.value
    return false
  }
  if (isCheckingDns.value) {
    errors.value.dns = 'Please wait while we check DNS availability.'
    return false
  }
  if (dnsError.value) {
    errors.value.dns = dnsError.value
    return false
  }
  if (isDnsAvailable.value !== true) {
    errors.value.dns = isDnsNotRegistered.value
      ? 'This domain is not registered yet. Please enter another domain.'
      : 'Your domain must be active and available before continuing.'
    return false
  }
  return true
}

function validateStep4(): boolean {
  const next: Record<string, string> = {}
  const name = adminName.value.trim()
  const prefix = adminEmailPrefix.value.trim()
  const email = adminEmail.value
  if (!name) next.adminName = 'Super admin name is required.'
  else if (name.length < 2) next.adminName = 'Name must be at least 2 characters.'
  if (!requiredAdminEmailDomain.value) {
    next.adminEmail = 'Please complete the domain step first.'
  } else if (!prefix) {
    next.adminEmail = 'Email prefix is required.'
  } else if (!/^[a-zA-Z0-9._+-]+$/.test(prefix)) {
    next.adminEmail = 'Enter a valid email prefix (letters, numbers, . _ + -).'
  } else if (!email || !emailMatchesOrgDomain(email, requiredAdminEmailDomain.value)) {
    next.adminEmail = `Email must use @${requiredAdminEmailDomain.value}.`
  }
  if (!adminPassword.value) next.adminPassword = 'Password is required.'
  else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$/.test(adminPassword.value)) {
    next.adminPassword =
      'Password must be at least 8 characters and include uppercase, lowercase, and a special character.'
  }
  errors.value = next
  return Object.keys(next).length === 0
}

function validateStep8(): boolean {
  errors.value = {}
  return true
}

async function handleSignup() {
  signupError.value = ''
  if (!validateStep4()) return

  patchOrgDraft({
    adminName: adminName.value.trim(),
    adminEmail: adminEmail.value.trim(),
  })

  try {
    const signupData = await registerMutate({
      u_full_name: adminName.value.trim(),
      u_email: adminEmail.value.trim(),
      u_password: adminPassword.value,
      agree_to_terms: true,
      sendOtp: true,
    })

    if (!isApiSuccess(signupData)) {
      const body = signupData as Record<string, unknown>
      signupError.value = String(body?.message ?? 'Sign up failed')
      return
    }

    const token = extractAuthToken(signupData)
    if (!token) {
      signupError.value = 'Sign up succeeded but no session token was returned. Please try again.'
      return
    }
    saveSessionToken(token)

    markCreateOrgPendingOnboarding()
    saveOrgSignupEmail(adminEmail.value.trim())
    otpCode.value = Array.from({ length: OTP_DIGITS }, () => '')
    otpError.value = ''
    startOtpResendCooldown()
    activeStep.value = 5
    persistActiveStep(5)
    await nextTick()
    otpDigitRefs.value[0]?.focus()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    signupError.value =
      err?.response?.data?.message || err?.message || 'Something went wrong. Please try again.'
  }
}

function setOtpDigitRef(el: Element | ComponentPublicInstance | null, index: number) {
  otpDigitRefs.value[index] = el instanceof HTMLInputElement ? el : null
}

function focusOtpIndex(i: number) {
  otpDigitRefs.value[i]?.focus()
}

function selectOtpOnFocus(e: FocusEvent) {
  const target = e.target as HTMLInputElement
  setTimeout(() => target.select(), 0)
}

function handleOtpInput(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const val = input.value.replace(/\D/g, '').slice(-1)
  otpCode.value[index] = val
  if (otpError.value) otpError.value = ''
  if (val && index < OTP_DIGITS - 1) focusOtpIndex(index + 1)
}

function handleOtpKey(index: number, e: KeyboardEvent) {
  const { key } = e
  if (/^[0-9]$/.test(key)) {
    otpCode.value[index] = key
    if (otpError.value) otpError.value = ''
    e.preventDefault()
    if (index < OTP_DIGITS - 1) focusOtpIndex(index + 1)
    return
  }
  if (key === 'Backspace') {
    if (otpCode.value[index]) {
      otpCode.value[index] = ''
    } else if (index > 0) {
      otpCode.value[index - 1] = ''
      focusOtpIndex(index - 1)
    }
    e.preventDefault()
    return
  }
  if (key === 'ArrowLeft' && index > 0) {
    focusOtpIndex(index - 1)
    e.preventDefault()
  }
  if (key === 'ArrowRight' && index < OTP_DIGITS - 1) {
    focusOtpIndex(index + 1)
    e.preventDefault()
  }
}

function handleOtpPaste(index: number, e: ClipboardEvent) {
  const pasted = e.clipboardData?.getData('text')?.replace(/\D/g, '') ?? ''
  if (!pasted) return
  const digits = pasted.slice(0, OTP_DIGITS).split('')
  digits.forEach((d, i) => {
    if (index + i < OTP_DIGITS) otpCode.value[index + i] = d
  })
  const nextFocus = Math.min(index + digits.length, OTP_DIGITS - 1)
  focusOtpIndex(nextFocus)
}

function startOtpResendCooldown() {
  otpResendCooldown.value = OTP_RESEND_COOLDOWN_SEC
  if (otpResendTimer) clearInterval(otpResendTimer)
  otpResendTimer = setInterval(() => {
    if (otpResendCooldown.value <= 1) {
      otpResendCooldown.value = 0
      if (otpResendTimer) clearInterval(otpResendTimer)
      otpResendTimer = null
    } else {
      otpResendCooldown.value -= 1
    }
  }, 1000)
}

async function handleResendOtp() {
  otpResendSuccess.value = ''
  const email = otpEmailDisplay.value
  if (!email) {
    showOtpError('Missing email for resend.')
    return
  }
  try {
    await resendOtpMutate({ u_email: email })
    otpResendSuccess.value = 'A new code has been sent.'
    startOtpResendCooldown()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    showOtpError(err?.response?.data?.message || 'Failed to resend code. Please try again.')
  }
}

async function handleVerifyOtp() {
  otpError.value = ''
  if (!isOtpComplete.value) {
    showOtpError('Please enter the complete 5-digit code.')
    return
  }

  const email = otpEmailDisplay.value
  if (!email) {
    showOtpError('Missing signup email.')
    return
  }

  try {
    const data = await verifyOtpMutate({
      u_email: email,
      otp: otpCode.value.join(''),
    })

    if (!isApiSuccess(data)) {
      const body = data as Record<string, unknown>
      showOtpError(String(body?.message ?? 'Invalid code, please try again.'))
      return
    }

    // OTP only confirms email; JWT was returned on signup (sendOtp: true)
    const verifyToken = extractAuthToken(data)
    if (verifyToken) saveSessionToken(verifyToken)

    const token = resolveAccessToken()
    if (!token) {
      showOtpError('Session missing. Please go back to sign up and try again.')
      return
    }

    await authStore.bootstrap(true)
    await runCreateCompany()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    showOtpError(err?.response?.data?.message || 'Invalid code, please try again.')
  }
}

async function runCreateCompany() {
  const draft = getOrgDraft()
  const originStep = getCompanyCreateRetryReturnStep() ?? activeStep.value
  if (!draft) {
    toast.error('Please complete all organization steps first.')
    activeStep.value = 1
    persistActiveStep(1)
    return
  }

  const token = resolveAccessToken()
  if (!token) {
    toast.error('Authentication required. Please verify your email again.')
    activeStep.value = 5
    persistActiveStep(5)
    return
  }

  try {
    const data = await createCompanyMutate({
      payload: buildCompanyPayload(draft),
      accessToken: token,
    })
    const payload = (data as { data?: Record<string, unknown> })?.data ?? data
    const record = payload as Record<string, unknown>
    if (record?.status === false) {
      const msg = String(record.message ?? 'Could not create organization.')
      if (isCompanySlugExistsError(msg)) {
        redirectToSlugRetryStep(originStep, msg)
        return
      }
      toast.error(msg)
      activeStep.value = 5
      persistActiveStep(5)
      return
    }

    const id = (record?.company_id ?? record?._id) as string | undefined
    if (id) {
      companyID.value = id
      localStorage.setItem('company_id', id)
      authStore.setCompany(id)
    }
    domainLink.value = String(record?.domain_link ?? '')
    siteSlug.value = String(record?.site_slug ?? record?.slug ?? '')
    clearCreateOrgPendingFlag()

    const targetStep = resolveStepAfterCompanyCreate(originStep)
    clearCompanyCreateRetryReturnStep()
    if (errors.value.team) {
      const next = { ...errors.value }
      delete next.team
      errors.value = next
    }

    resetDomainVerificationState()
    activeStep.value = targetStep
    persistActiveStep(targetStep)
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    const msg =
      err?.response?.data?.message || err?.message || 'Could not create organization.'
    if (isCompanySlugExistsError(msg)) {
      redirectToSlugRetryStep(originStep, msg)
      return
    }
    toast.error(msg)
    activeStep.value = 5
    persistActiveStep(5)
  }
}

/** Same logic as CreateProfile `applyDnsCheckResult` (custom domain mode). */
function applyDnsCheckResult(result: Record<string, unknown> | null): boolean {
  isDnsNotRegistered.value = false

  if (!result || (result as { __error?: boolean }).__error) {
    isDnsAvailable.value = null
    dnsError.value =
      (result as { message?: string })?.message ?? 'Could not verify domain. Please try again.'
    return false
  }

  if (result.already_claimed === true) {
    isDnsAvailable.value = false
    dnsError.value = 'This domain is already claimed by another company. Please use another domain.'
    return false
  }

  const isRegistered = result.is_registered === true
  const isActive = result.is_active === true

  if (isRegistered && isActive) {
    isDnsAvailable.value = true
    dnsError.value = null
    return true
  }
  if (isRegistered && !isActive) {
    isDnsAvailable.value = false
    dnsError.value = 'This domain is registered but DNS is not active yet.'
    return false
  }

  isDnsAvailable.value = false
  isDnsNotRegistered.value = true
  dnsError.value = null
  return false
}

function goToLoaderStep() {
  activeStep.value = 7
  persistActiveStep(7)
  isLoaderRunning.value = true
  provisionError.value = null
}

function resetDomainVerificationState() {
  domainPhase.value = 'idle'
  currentDomain.value = null
  currentInstructions.value = null
  selectedVerificationMethod.value = 'cname'
  methodSwitched.value = false
  recheckError.value = null
  copiedField.value = null
  stopDomainCountdown()
}

function copyToClipboard(text: string, field: string) {
  navigator.clipboard.writeText(text).then(() => {
    copiedField.value = field
    setTimeout(() => {
      copiedField.value = null
    }, 2000)
  })
}

function stopDomainCountdown() {
  if (domainCountdownTimer) {
    clearInterval(domainCountdownTimer)
    domainCountdownTimer = null
  }
  retryCountdown.value = 0
}

function startDomainCountdown(seconds: number) {
  stopDomainCountdown()
  retryTotal.value = seconds
  retryCountdown.value = seconds
  domainCountdownTimer = setInterval(() => {
    retryCountdown.value--
    if (retryCountdown.value <= 0) stopDomainCountdown()
  }, 1000)
}

async function startDomainVerificationPhase() {
  if (isRegisteringDomain.value) return
  isRegisteringDomain.value = true
  recheckError.value = null
  methodSwitched.value = false
  try {
    const result = await workspaceStore.verifyDomain(
      dnsInput.value.trim(),
      selectedVerificationMethod.value,
    )
    currentDomain.value = result.domain
    currentInstructions.value = result.instructions
    const requestedMethod = selectedVerificationMethod.value
    selectedVerificationMethod.value = result.domain.verification_method
    methodSwitched.value =
      !!result.methodSwitched ||
      result.domain.verification_method !== requestedMethod
    domainPhase.value = 'verify'
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string }
    const status = e?.response?.status
    const msg =
      e?.response?.data?.message ?? e?.message ?? 'Failed to register domain. Please try again.'
    toast.error(msg)
    recheckError.value =
      status === 409
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
      startDomainCountdown(retryAfter ?? retryTotal.value)
      return
    }
    if (data) {
      currentDomain.value = data.domain
      currentInstructions.value = data.instructions
    }
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string }
    const msg =
      e?.response?.data?.message ?? e?.message ?? 'Verification check failed. Please try again.'
    recheckError.value =
      e?.response?.status === 400 && msg.toLowerCase().includes('disabled')
        ? 'This domain has been disabled. Please contact support.'
        : msg
  } finally {
    isRechecking.value = false
  }
}

async function switchVerificationMethod(method: VerificationMethod) {
  if (!currentDomain.value || isSwitchingMethod.value) return
  if (method === selectedVerificationMethod.value) return
  selectedVerificationMethod.value = method
  isSwitchingMethod.value = true
  recheckError.value = null
  try {
    const result = await workspaceStore.verifyDomain(dnsInput.value.trim(), method)
    currentDomain.value = result.domain
    currentInstructions.value = result.instructions
    selectedVerificationMethod.value = result.domain.verification_method
    methodSwitched.value = false
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } }; message?: string }
    recheckError.value =
      e?.response?.data?.message ?? e?.message ?? 'Failed to switch verification method.'
  } finally {
    isSwitchingMethod.value = false
  }
}

async function downloadVerificationFile() {
  if (!currentDomain.value || isDownloadingFile.value) return
  isDownloadingFile.value = true
  try {
    await workspaceStore.downloadVerificationFile(currentDomain.value._id)
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    recheckError.value = e?.response?.data?.message ?? 'Failed to download verification file.'
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
  } catch (err: unknown) {
    const e = err as { response?: { data?: { message?: string } } }
    recheckError.value = e?.response?.data?.message ?? 'Failed to set as primary domain.'
  } finally {
    isSettingPrimary.value = false
  }
}

function skipDomainVerification() {
  goToLoaderStep()
}

function onProvisioningComplete() {
  isLoaderRunning.value = false
  activeStep.value = 8
  persistActiveStep(8)
}

function routeToFinishProfile() {
  clearOrgDraft()
  const invitePath = getPendingWorkspaceInviteRedirectPath()
  if (invitePath) {
    router.push(invitePath)
    return
  }

  const companyIdRaw = companyID.value ?? localStorage.getItem('company_id') ?? ''
  const token = localStorage.getItem('token')
  if (token) setAuthCookie(token)

  const encode = (s: string) =>
    btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.')

  const query: Record<string, string> = {
    type: 'team',
    theme: theme.value,
  }
  if (siteSlug.value) query.siteSlug = siteSlug.value
  if (domainLink.value) query.domainLink = domainLink.value
  if (token) query._auth = encode(token)
  if (companyIdRaw) query._cid = encode(companyIdRaw)

  router.push({ path: '/finish-profile', query })
}

async function handleFinish() {
  if (!validateStep8()) return

  const token = resolveAccessToken()
  if (!token) {
    toast.error('Session expired. Please sign in again.')
    return
  }

  try {
    await updateCompanyMutate({
      payload: { heard_about_us: referralSources.value },
      accessToken: token,
    })
    routeToFinishProfile()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    toast.error(err?.response?.data?.message || 'Could not save your preferences.')
  }
}

async function handleContinue() {
  switch (activeStep.value) {
    case 1: {
      if (!validateStep1()) return
      patchOrgDraft({
        team: team.value.trim(),
        industries: [...industries.value],
        companySize: companySize.value,
      })
      if (getCompanyCreateRetryReturnStep() != null) {
        await runCreateCompany()
        return
      }
      activeStep.value = 2
      persistActiveStep(2)
      break
    }
    case 2: {
      if (!validateStep2()) return
      patchOrgDraft({
        contactName: contactName.value.trim(),
        contactEmail: contactEmail.value.trim(),
        contactRole: contactRole.value,
      })
      activeStep.value = 3
      persistActiveStep(3)
      break
    }
    case 3: {
      if (!validateStep3()) return
      patchOrgDraft({ customDomain: dnsInput.value.trim() })
      activeStep.value = 4
      persistActiveStep(4)
      break
    }
    default:
      break
  }
}

function goBack() {
  if (!canGoBack.value) return
  activeStep.value -= 1
  persistActiveStep(activeStep.value)
  if (activeStep.value === 1) {
    nextTick(() => teamRef.value?.focus())
  }
}

watch(team, () => {
  if (!isSlugRetryMode.value) return
  if (errors.value.team) {
    const next = { ...errors.value }
    delete next.team
    errors.value = next
  }
})

watch(dnsInput, (val) => {
  if (activeStep.value !== 3) return

  const trimmed = val.trim()
  isDnsAvailable.value = null
  isDnsNotRegistered.value = false
  dnsError.value = null
  dnsValidationError.value = null
  if (errors.value.dns) errors.value.dns = ''

  if (dnsDebounceTimer) clearTimeout(dnsDebounceTimer)
  if (!trimmed) {
    isCheckingDns.value = false
    return
  }
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
        dnsError.value =
          'Invalid domain format. Please enter a valid domain (e.g. mycompany.com).'
        isDnsAvailable.value = null
      } else {
        applyDnsCheckResult(result as Record<string, unknown>)
      }
    } catch (err: unknown) {
      if (dnsInput.value.trim() !== captured) return
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      dnsError.value =
        e?.response?.data?.message ?? e?.message ?? 'Could not verify domain. Please try again.'
      isDnsAvailable.value = null
    } finally {
      if (dnsInput.value.trim() === captured) isCheckingDns.value = false
    }
  }, 600)
})

watch(activeStep, (step) => {
  if (step === 7) {
    isLoaderRunning.value = true
    provisionError.value = null
  }
})

watch(
  [team, industries, companySize, contactName, contactEmail, contactRole, dnsInput],
  () => {
    if (signupError.value) signupError.value = ''
  },
)

watch([adminEmailPrefix, adminName, adminPassword], () => {
  if (signupError.value) signupError.value = ''
  if (activeStep.value !== 4) return
  if (errors.value.adminEmail && adminEmail.value && emailMatchesOrgDomain(adminEmail.value, requiredAdminEmailDomain.value)) {
    delete errors.value.adminEmail
  }
  if (errors.value.adminName && adminName.value.trim().length >= 2) {
    delete errors.value.adminName
  }
  if (errors.value.adminPassword && adminPassword.value) {
    delete errors.value.adminPassword
  }
})

/** Map legacy saved steps (10-step flow) to the current 8-step flow. */
function normalizeRestoredStep(step: number): number {
  if (step <= 2) return step
  if (step === 3 || step === 4) return 3
  if (step === 5) return 4
  if (step === 6) return 5
  if (step === 7) return 3
  if (step === 8) return 6
  if (step === 9) return 7
  if (step === 10) return 8
  return Math.min(Math.max(step, 1), 8)
}

onMounted(async () => {
  hydrateFromDraft(getOrgDraftPartial())

  const queryStep = Number(route.query.step)
  const savedStep = getOrgActiveStep()
  const raw = !Number.isNaN(queryStep) && queryStep >= 1
    ? queryStep
    : savedStep && savedStep >= 1
      ? savedStep
      : 1
  activeStep.value = normalizeRestoredStep(raw)

  if (getCompanyCreateRetryReturnStep() != null) {
    activeStep.value = 1
    persistActiveStep(1)
  }

  const signupEmail = getOrgSignupEmail()
  if (signupEmail && !adminEmailPrefix.value) syncAdminEmailPrefixFromFull(signupEmail)

  const storedToken = getOrgSignupToken() || getToken()
  if (storedToken) signupAccessToken.value = storedToken

  if (
    route.query.otpVerified === '1' &&
    hasCreateOrgPendingOnboarding() &&
    resolveAccessToken()
  ) {
    try {
      await authStore.bootstrap(true)
      await runCreateCompany()
    } catch {
      toast.error('Could not resume organization setup.')
    }
  }
})

onUnmounted(() => {
  if (otpResendTimer) clearInterval(otpResendTimer)
  if (dnsDebounceTimer) clearTimeout(dnsDebounceTimer)
  stopDomainCountdown()
})
</script>
