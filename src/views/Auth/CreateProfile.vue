<template>
  <AuthLayout
  :steps="stepLabels"
  :activeStep="displayStep"
  :showSteps="activeStep !== 6"
>
    <template #form>
      <div class="max-w-125 mx-auto w-full min-h-full py-5 flex flex-col justify-center">
        <!-- Step 1 -->
        <div class="mb-6 md:mb-12 space-y-2" v-show="activeStep === 1">
          <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-once>
            How will you use Orchit AI?</h2>
          <p class="text-[14px] md:text-base sm:text-nowrap font-medium text-text-secondary" v-once>
            This will help us personalize your experience in Orchit AI.
          </p>
        </div>

        <div class="how_help_steps grid sm:grid-cols-3 gap-4" v-show="activeStep === 1">
          <label v-for="option in options" :key="option._id"
            class="border rounded-xl py-4 px-2.5 cursor-pointer transition-all sm:aspect-square"
            :class="optionClass(option._id)" v-memo="[selected, option._id]">
            <input type="radio" class="hidden" v-model="selected" :value="option._id" />
            <div class="flex flex-col items-center">
              <img :src="option.icon" class="w-12 h-12" />
              <h3 class="font-medium text-sm text-text-primary mt-4">{{ option.title }}</h3>
              <p class="text-[11px] text-text-secondary mt-2 text-center">{{ option.description }}</p>
            </div>
          </label>
        </div>
        <!-- Step 2 -->
        <div class="space-y-2 mb-6 md:mb-12" v-show="activeStep === 2">
          <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-if="selected ==='team'">
           Tell us about your company
          </h2>
         <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-if="selected ==='personal'">
           Tell us about yourself
          </h2>
          <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary" v-if="selected ==='school'">
           Tell us about your School
          </h2>
          <p class="text-[14px] md:text-base sm:text-nowrap font-medium text-text-secondary" v-once>
            This will help us personalize your experience in Orchit AI.
          </p>
        </div>

        <div class="space-y-6" v-show="activeStep === 2 && selected === 'team'">
          <div class="space-y-1.5">
  <BaseTextField
    v-model="team"
    label="Company Name"
    placeholder="Company name"
    size="lg"
    :error="!!errors.team"
    :message="errors.team"
  />
</div>

          <BaseSelectField v-model="role" label="What role do you perform in your company?" :options="rolesList || []"
            placeholder="Select Role" size="lg" :error="!!errors.role" :message="errors.role" />

          <BaseSelectField v-model="companySize" label="What's your company size?" :options="companySizeOptions"
            placeholder="Select Company size" size="lg" :error="!!errors.companySize" :message="errors.companySize" />
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
<BaseSelectField v-model="role" label="What is your role in school?" :options="rolesList || []"
            placeholder="Select Role" size="lg" :error="!!errors.role" :message="errors.role" />

</div>
<div v-show="activeStep === 3" class="space-y-6">

  <!-- Heading -->
  <div class="space-y-2">
    <h2 class="text-[24px] lg:text-[32px] leading-8 lg:leading-11 font-medium text-text-primary">
      What would you like to manage?
    </h2>

    <p class="text-[14px] md:text-base font-medium text-text-secondary">
      You can select multiple options. This helps us personalize your workspace.
    </p>
  </div>

  <!-- Tabs -->
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
<!-- Step 4 Modal -->
<div v-if="activeStep === 4">

  <div class="space-y-2 mb-6">
    <h2 class="text-[24px] lg:text-[32px] font-medium text-text-primary">
      What kind of work do you do?
    </h2>

    <p class="text-text-secondary text-sm md:text-base">
      This helps us tailor your workspace experience.
    </p>
  </div>

  <!-- Grid (2 per row) -->
  <div class="grid grid-cols-2 gap-4">

    <button
      v-for="item in workTypeOptions"
      :key="item.id"
      @click="workType = item.id"
      type="button"
      class="flex items-center gap-3 p-4 rounded-xl border transition-all text-left"
      :class="workType === item.id
        ? 'bg-accent/30 border-accent'
        : 'border-border'"
    >

      <!-- Icon -->
      <FontAwesomeIcon
        :icon="['fas', item.icon]"
        class="text-lg text-text-primary"
      />

      <!-- Label -->
      <span class="text-sm font-medium text-text-primary">
        {{ item.label }}
      </span>

    </button>

  </div>
   <p v-if="errors.workType" class="text-xs text-red-500 mt-2">
    {{ errors.workType }}
  </p>
</div>
<div v-if="activeStep === 5" class="flex items-center justify-center w-full min-h-full py-3">

  <div class="w-full max-w-115">

    <!-- CARD -->
    <div class="rounded-2xl border p-10 space-y-6" style="background: var(--bg-card); border-color: var(--border);">

      <!-- HEADER -->
      <div class="text-center space-y-3">
        <div class="w-14 h-14 rounded-[14px] border flex items-center justify-center mx-auto"
          style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.2);">
          <img src="/src/assets/global/favicon.png" alt="logo">
        </div>
        <h2 class="text-[22px] font-bold tracking-tight" style="color: var(--text-primary);">
          Create your site
        </h2>
        <p class="text-sm leading-relaxed max-w-75 mx-auto" style="color: var(--text-secondary);">
          Sites are the shared space where your team organizes work, projects, and goals.
        </p>
      </div>

      <!-- ─── SITE NAME (slug — checks our DB) ─── -->
      <div class="space-y-1.5">

        <label class="text-[11px] font-semibold uppercase tracking-wider block"
          style="color: var(--text-secondary);">
          Site name
        </label>

        <div
          class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
          :class="{
            'ring-[3px] ring-(--accent)/[0.14]': isFocused && !isAnyUnavailable,
            'ring-[3px] ring-red-500/10':         isFocused && isAnyUnavailable,
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

          <div class="flex items-center gap-2 px-3.5 border-l"
            style="background: var(--bg-surface); border-color: var(--border);">
            <span class="text-[13px] font-semibold whitespace-nowrap" style="color: var(--text-secondary);">
              .streamed.space
            </span>

            <!-- Slug checking spinner -->
            <span v-if="isCheckingSlug"
              class="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
              style="border-color: var(--border); border-top-color: var(--accent);" />

            <!-- Slug available / unavailable icon -->
            <Transition
              enter-active-class="transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              enter-from-class="opacity-0 scale-50"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-50"
            >
              <span v-if="isSlugAvailable === true && !isCheckingSlug"
                class="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                style="background: #1d9e75;">
                <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span v-else-if="isSlugAvailable === false && !isCheckingSlug"
                class="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                style="background: #e55050;">
                <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M3 3l4 4M7 3l-4 4" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </span>
            </Transition>
          </div>
        </div>

        <!-- Slug status message -->
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
            This is just a suggestion — feel free to change it to something your team will recognize.
          </p>
        </div>

      </div>

      <!-- ─── LIVE URL PREVIEW ─── -->
      <div v-if="siteSlug"
        class="flex items-center gap-2 rounded-lg px-3.5 py-2.5 border"
        style="background: var(--bg-lavender); border-color: rgba(125,104,200,0.18);">
        <div class="w-2 h-2 rounded-full shrink-0" style="background: var(--accent); opacity: 0.7;" />
        <span class="text-[13px] font-semibold break-all" style="color: var(--accent);">
          https://{{ siteSlug }}.streamed.space
        </span>
      </div>

      <!-- ─── SUGGESTIONS when slug is taken ─── -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div v-if="isSlugAvailable === false && siteSlug && !isCheckingSlug" class="space-y-2">
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

      <!-- ─── CUSTOM DOMAIN DNS CHECK (now required) ─── -->
      <div class="space-y-1.5">

        <!-- CHANGED: removed "(optional)" from label -->
        <label class="text-[11px] font-semibold uppercase tracking-wider block"
          style="color: var(--text-secondary);">
          Custom Domain
        </label>
        <!-- CHANGED: updated helper text to reflect required -->
        <p class="text-xs" style="color: var(--text-secondary);">
          Enter your purchased domain to verify DNS availability before creating your site.
        </p>

        <div
          class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px] transition-all duration-200"
          :style="{
            borderColor: dnsError && !isCheckingDns                      ? '#e55050'
                       : isDnsAvailable === false && !isCheckingDns      ? '#e55050'
                       : isDnsAvailable === true  && !isCheckingDns      ? '#1d9e75'
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
          />

          <div class="flex items-center gap-2 px-3.5 border-l shrink-0"
            style="background: var(--bg-surface); border-color: var(--border);">

            <!-- DNS checking spinner -->
            <span v-if="isCheckingDns"
              class="w-3.5 h-3.5 rounded-full border-2 border-t-transparent animate-spin shrink-0"
              style="border-color: var(--border); border-top-color: var(--accent);" />

            <!-- DNS icon -->
            <Transition
              enter-active-class="transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              enter-from-class="opacity-0 scale-50"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-50"
            >
              <!-- CHANGED: also hide check/cross icon when there is a dnsError -->
              <span v-if="isDnsAvailable === true && !isCheckingDns && !dnsError"
                class="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                style="background: #1d9e75;">
                <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <span v-else-if="(isDnsAvailable === false || dnsError) && !isCheckingDns"
                class="flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                style="background: #e55050;">
                <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                  <path d="M3 3l4 4M7 3l-4 4" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
                </svg>
              </span>
            </Transition>

          </div>
        </div>

        <!-- DNS status messages -->
        <div class="mt-1">
          <!-- Checking spinner text -->
          <p v-if="isCheckingDns" class="text-xs" style="color: var(--text-secondary);">
            Checking DNS…
          </p>

          <!-- API error: status:false (e.g. "Invalid domain format") -->
          <p v-else-if="dnsError" class="text-xs flex items-center gap-1" style="color: #e55050;">
            <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
              <path d="M3 3l4 4M7 3l-4 4" stroke="#e55050" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            {{ dnsError }}
          </p>

          <!-- is_registered: false → domain is free ✅ -->
          <p v-else-if="isDnsAvailable === true && dnsInput.trim()" class="text-xs flex items-center gap-1" style="color: #1d9e75;">
            <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 3" stroke="#1d9e75" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span class="font-medium">{{ dnsInput.trim() }}</span> is available
          </p>

          <!-- is_registered: true → domain is already taken ❌ -->
          <p v-else-if="isDnsAvailable === false && dnsInput.trim()" class="text-xs flex items-center gap-1" style="color: #e55050;">
            <svg class="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
              <path d="M3 3l4 4M7 3l-4 4" stroke="#e55050" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            <span class="font-medium">{{ dnsInput.trim() }}</span> is already registered. Try a different domain.
          </p>

          <!-- Empty state -->
          <p v-else class="text-xs" style="color: var(--text-secondary);">
            Required — enter the domain you've purchased to verify DNS availability.
          </p>
        </div>

      </div>

      <!-- ─── CTA — CHANGED: also disabled until DNS is confirmed available ─── -->
      <button
        type="button"
        :disabled="!siteName || isCheckingSlug || isSlugAvailable === false || isSlugAvailable === null || !dnsInput.trim() || isCheckingDns || isDnsAvailable !== true || !!dnsError || isCreating || creatingProfile"
        class="w-full flex items-center justify-center gap-2 py-3.25 rounded-[9px] text-[15px] font-bold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
        style="background: var(--accent); color: var(--accent-text);"
        :style="(!isCreating && !creatingProfile) ? 'box-shadow: 0 2px 0 rgba(0,0,0,0.15)' : ''"
        @mouseenter="(e) => (!isCreating && !creatingProfile) && ((e.target as HTMLButtonElement).style.background = 'var(--accent-hover)')"
        @mouseleave="(e) => ((e.target as HTMLButtonElement).style.background = 'var(--accent)')"
        @click="continueSiteHandler"
      >
        <span
          v-if="isCreating || creatingProfile"
          class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
        />
        <span v-else>Create site</span>
      </button>

    </div>
  </div>
</div>
<div v-if="activeStep === 6" class="flex items-center justify-center mx-auto">
  <LoadingCreateProfile :active="activeStep === 6" :abort="!!companySlugError" @complete="activeStep = 7" />
</div>
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

    <!-- chips -->
    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="item in referralOptions"
        :key="item.id"
        @click="toggleReferral(item.id)"
        type="button"
        class="px-4 py-3 rounded-xl border text-sm font-medium transition"
        :class="referralSources.includes(item.id)
          ? 'bg-accent/30 border-accent'
          : 'border-border'"
      >
        {{ item.label }}
      </button>
    </div>

    <!-- ✅ Step 7 own nav -->
    <div class="flex justify-between items-center">
      <Button variant="secondary" size="md" type="button" @click="goBack">
        <div class="flex items-center gap-1">
          <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
        </div>
      </Button>
      <Button 
  :disabled="isSiteStepBlocked || creatingProfile || updatingProfile || invitingPeople"
  :class="{ 'pointer-events-none': isSiteStepBlocked }"
  size="md" 
  type="submit" 
  @click="activeStep === 5 ? continueSiteHandler() : continueHandler()"
>
  <div class="flex items-center gap-2">
    <span 
      v-if="creatingProfile && activeStep === 5" 
      class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" 
    />
    <span>Continue</span>
  </div>
</Button>
    </div>

  </div>
</div>
<div v-show="activeStep === 8" v-if="selected === 'team' || selected === 'school'" class="flex items-center justify-center min-h-full">

  <div class="w-full max-w-150 space-y-7">

    <!-- header -->
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

    <!-- ✅ SUPER ADMIN USER CREATION (required) -->
    <div class="rounded-xl border border-border p-5 space-y-4" style="background: var(--bg-card);">

      <!-- Section label -->
      <div class="flex items-center gap-2">
        <div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style="background: var(--accent);">
          <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
            <path d="M5 1a2 2 0 1 1 0 4A2 2 0 0 1 5 1zM2 8.5C2 6.567 3.343 5 5 5s3 1.567 3 3.5"
              stroke="white" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </div>
        <div>
          <p class="text-sm font-semibold text-text-primary">Create Super Admin</p>
          <p class="text-xs text-text-secondary">Required — this account will manage your workspace</p>
        </div>
        <span class="ml-auto text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style="background: var(--accent)/10; color: var(--accent); background-color: color-mix(in srgb, var(--accent) 12%, transparent);">
          Required
        </span>
      </div>

      <!-- Full Name -->
<div class="space-y-1.5">
  <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
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
      <div class="space-y-1.5">
        <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
          Admin Email
        </label>
        <div
          class="flex items-stretch rounded-[10px] overflow-hidden border-[1.5px]"
          style="border-color: var(--border-input); background: var(--bg-surface);"
        >
          <input
          v-model="adminUsername"
          type="text"
          placeholder="username"
          class="flex-1 min-w-0 px-3.5 py-2.5 text-[15px] outline-none bg-transparent"
          style="color: var(--text-primary); font-family: 'Lato', sans-serif;"
          @input="adminUsername = adminUsername.toLowerCase().replace(/[^a-z0-9._-]/g, ''); errors.adminUsername = undefined"
        />
          <div class="flex items-center px-3.5 border-l shrink-0"
            style="background: var(--bg-input); border-color: var(--border);">
            <span class="text-[13px] font-semibold whitespace-nowrap" style="color: var(--text-secondary);">
              @{{ siteSlug }}.streamed.space
            </span>
          </div>
        </div>
        <p v-if="errors.adminUsername" class="text-xs" style="color: #e55050;">
          {{ errors.adminUsername }}
        </p>
        <p v-else class="text-xs" style="color: var(--text-secondary);">
          Full email: <span class="font-medium" style="color: var(--text-primary);">{{ adminEmail }}</span>
        </p>
      </div>

      <!-- Password -->
      <div class="space-y-1.5">
        <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
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
          <i
            :class="showAdminPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"
            class="text-sm"
          ></i>
        </button>
        </div>
        <p v-if="errors.adminPassword" class="text-xs" style="color: #e55050;">
          {{ errors.adminPassword }}
        </p>
      </div>

      <!-- Confirm Password -->
      <div class="space-y-1.5">
        <label class="text-[11px] font-semibold uppercase tracking-wider block" style="color: var(--text-secondary);">
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
            <i
            :class="showAdminConfirmPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'"
            class="text-sm"
          ></i>
              
          </button>
        </div>
        <p v-if="errors.adminConfirmPassword" class="text-xs" style="color: #e55050;">
          {{ errors.adminConfirmPassword }}
        </p>
      </div>

    </div>

    <!-- share via link -->
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
        <Button variant="secondary" size="md" @click="copySiteUrl">
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

    <!-- actions -->
    <div class="flex items-center justify-between pt-2">
      <Button
  variant="secondary"
  size="md"
  :disabled="isSkipping || isInviting || isCreatingAdmin"
  @click="sendInvites(true)"
>
  <div class="flex items-center gap-2">
    <span v-if="isSkipping || isCreatingAdmin" class="w-4 h-4 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
    <span>Do this later</span>
  </div>
</Button>

<Button
  size="md"
  :disabled="isInviting || isSkipping || isCreatingAdmin"
  @click="sendInvites(false)"
>
  <div class="flex items-center gap-2">
    <span v-if="isInviting || isCreatingAdmin" class="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
    <span>Finish Profile</span>
  </div>
</Button>
    </div>

  </div>

</div>
<!-- ✅ KEEP THIS ONE — the original at the bottom -->
<div class="flex justify-between items-center mt-10 md:mt-5" 
  v-if="activeStep !== 6 && activeStep !== 7 && activeStep !== 8 && activeStep !== 9">
  
  <Button v-if="activeStep != 1" variant="secondary" size="md" type="button" @click="goBack"
    :disabled="activeStep === 1">
    <div class="flex items-center gap-1">
      <FontAwesomeIcon :icon="['fas', 'arrow-left']" /> Back
    </div>
  </Button>

  <div class="flex gap-4 items-center ml-auto">
    <router-link
      v-if="activeStep == 3"
      :to="`${workspaceStore.pricing ? `/dashboard?stripePayment=${true}` : workspaceStore.workspace ? '/create-workspace' : '/finish-profile'}`">
    </router-link>
    <!--
      CHANGED: Continue button at the bottom is also gated by isSiteStepBlocked,
      which now includes DNS confirmation requirement for step 5.
    -->
    <Button 
      :disabled="isSiteStepBlocked || creatingProfile || updatingProfile || invitingPeople" 
      size="md" 
      type="submit" 
      @click="activeStep === 5 ? continueSiteHandler() : continueHandler()"
    >
      Continue 
    </Button>
  </div>

</div>
      </div>

      <div class="max-w-125 md:mx-auto w-full space-y-6"></div>
       <!-- Company slug conflict error modal -->
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
    @click.self="companySlugError = null"
  >
    <div class="w-full max-w-md rounded-2xl bg-bg-dropdown p-6 shadow-xl ring-1 ring-black/5">
      <!-- Icon -->
      <div class="mb-4 flex h-13 w-13 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <i class="fa-solid fa-triangle-exclamation text-red-500 text-lg"></i>
      </div>

      <!-- Title -->
      <h3 class="text-md font-semibold text-text-primary mb-1">
        Company name already taken
      </h3>

      <!-- Message -->
      <p class="text-sm text-text-secondary leading-relaxed mb-5">
        {{ companySlugError }}
      </p>

      <!-- Actions -->
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-lg border border-black/10 bg-bg-dropdown px-3 py-2.5 text-sm font-medium text-text-secondary hover:border-black/20 hover:text-text-primary transition cursor-pointer"
          @click="companySlugError = null"
        >
          Dismiss
        </button>
        <button
          type="button"
          class="flex-[1.5] rounded-lg bg-accent px-3 py-2.5 text-sm font-semibold text-white hover:bg-accent-hover transition cursor-pointer"
          @click="() => { companySlugError = null; activeStep = 2 }"
        >
          Change company name
        </button>
      </div>
    </div>
  </div>
</Transition>
    </template>
   
  </AuthLayout>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
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

// ─── Errors ───────────────────────────────────────────────────────────────────
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
  adminPassword?: string
  adminConfirmPassword?: string
}>({})

// ─── Step & Selection ─────────────────────────────────────────────────────────
const selected = ref<'team' | 'personal' | 'school'>('team')
const activeStep = ref<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | any>(1)

// ─── Step 2 fields ────────────────────────────────────────────────────────────
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

// ─── Step 5 — Site creation ───────────────────────────────────────────────────
const siteName = ref('')
const siteSlug = ref('')
const isFocused = ref(false)
const isCreating = ref(false)
const isCheckingSlug = ref(false)
const isSlugAvailable = ref<boolean | null>(null)
const companySlugError = ref<string | null>(null)

// ─── DNS input (now required, independent from slug) ──────────────────────────
const dnsInput = ref('')
const isCheckingDns = ref(false)
const isDnsAvailable = ref<boolean | null>(null)
// ADDED: dedicated ref to surface API-level error messages (e.g. "Invalid domain format")
const dnsError = ref<string | null>(null)

// ─── Step 7 & 8 ───────────────────────────────────────────────────────────────
const referralSources = ref<string[]>([])
const joinLink = ref('')
const domainLink = ref('')
const emailList = ref<string[]>([])
const isInviting = ref(false)
const isSkipping = ref(false)
const isCopied = ref(false)
const companyID = ref()
const isProvisioning = ref(false)
const isUpdatingProfile = ref(false)

// ─── Super admin (step 8) ─────────────────────────────────────────────────────
const adminFullName = ref('')
const adminUsername = ref('')
const adminPassword = ref('')
const adminConfirmPassword = ref('')
const showAdminPassword = ref(false)
const showAdminConfirmPassword = ref(false)

// ─── Computed: admin email ────────────────────────────────────────────────────
const adminEmail = computed(() =>
  adminUsername.value.trim()
    ? `${adminUsername.value.trim()}@${siteSlug.value}.streamed.space`
    : `@${siteSlug.value}.streamed.space`
)

// ─── Computed: slug/dns availability ─────────────────────────────────────────
const isAnyChecking = computed(() => isCheckingSlug.value || isCheckingDns.value)
const isFullyAvailable = computed(() => isSlugAvailable.value === true)
const isAnyUnavailable = computed(() => isSlugAvailable.value === false)

// ─── Computed: site step blocked ──────────────────────────────────────────────
// CHANGED: DNS is now required — block until both slug AND dns are confirmed available,
// and block if there is any dnsError present.
const isSiteStepBlocked = computed(() => {
  if (activeStep.value !== 5) return false
  if (selected.value !== 'team' && selected.value !== 'school') return false
  // Slug must be confirmed available
  if (!siteName.value) return true
  if (isCheckingSlug.value) return true
  if (isSlugAvailable.value !== true) return true
  // DNS must be entered, confirmed available, and have no error
  if (!dnsInput.value.trim()) return true
  if (isCheckingDns.value) return true
  if (dnsError.value) return true
  if (isDnsAvailable.value !== true) return true
  return false
})

// ─── Computed: modules list by selected type ──────────────────────────────────
const moduleOptionsMap = {
  team: [
    { id: 'tasks', label: 'Tasks' },
    { id: 'projects', label: 'Projects' },
    { id: 'docs', label: 'Docs' },
    { id: 'goals', label: 'Goals' },
    { id: 'support', label: 'Support Desk' },
    { id: 'operations', label: 'Operations' },
    { id: 'knowledge', label: 'Knowledge Base' },
    { id: 'reporting', label: 'Reports' }
  ],
  personal: [
    { id: 'tasks', label: 'Personal Tasks' },
    { id: 'notes', label: 'Notes' },
    { id: 'planning', label: 'Daily Planning' },
    { id: 'journaling', label: 'Journaling' }
  ],
  school: [
    { id: 'notes', label: 'Notes' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'group_projects', label: 'Group Projects' },
    { id: 'research', label: 'Research' },
    { id: 'exam_prep', label: 'Exam Prep' },
    { id: 'class_management', label: 'Class Management' },
    { id: 'lecture_planning', label: 'Lecture Planning' },
    { id: 'homework_tracking', label: 'Homework Tracking' },
    { id: 'project_tracking', label: 'Project Tracking' },
    { id: 'study_planning', label: 'Study Planning' },
    { id: 'revision_schedule', label: 'Revision Schedule' },
    { id: 'collaboration', label: 'Student Collaboration' },
    { id: 'task_management', label: 'Task Management' }
  ]
} as const

const activeModules = computed(() =>
  moduleOptionsMap[selected.value as keyof typeof moduleOptionsMap] || []
)

// ─── Computed: work type options by selected type ─────────────────────────────
const workTypeOptionsMap = {
  team: [
    { id: 'software_development', label: 'Software Development', icon: 'code' },
    { id: 'product_management',   label: 'Product Management',   icon: 'layer-group' },
    { id: 'marketing',            label: 'Marketing',            icon: 'bullhorn' },
    { id: 'design',               label: 'Design',               icon: 'palette' },
    { id: 'sales',                label: 'Sales',                icon: 'chart-line' },
    { id: 'operations',           label: 'Operations',           icon: 'cog' },
    { id: 'hr',                   label: 'Human Resources',      icon: 'users' },
    { id: 'support',              label: 'Customer Support',     icon: 'headset' }
  ],
  school: [
    { id: 'study',            label: 'Study & Learning',  icon: 'book' },
    { id: 'assignments',      label: 'Assignments',        icon: 'file-lines' },
    { id: 'group_projects',   label: 'Group Projects',     icon: 'users' },
    { id: 'research',         label: 'Research',           icon: 'magnifying-glass' },
    { id: 'exam_prep',        label: 'Exam Prep',          icon: 'pen' },
    { id: 'class_management', label: 'Class Management',   icon: 'chalkboard' },
    { id: 'teaching',         label: 'Teaching',           icon: 'person-chalkboard' },
    { id: 'notes',            label: 'Notes',              icon: 'clipboard' }
  ],
  personal: [
    { id: 'task_management', label: 'Task Management', icon: 'check-square' },
    { id: 'learning',        label: 'Learning',         icon: 'book' },
    { id: 'goal_tracking',   label: 'Goal Tracking',    icon: 'bullseye' },
    { id: 'daily_planning',  label: 'Daily Planning',   icon: 'calendar' }
  ]
}

const workTypeOptions = computed(() => workTypeOptionsMap[selected.value] || [])

// ─── Static data ──────────────────────────────────────────────────────────────
const options = Object.freeze([
  { _id: 'team',     title: 'For my team',      description: 'Collaborate on your docs and projects.',              icon: teamIcon },
  { _id: 'personal', title: 'For personal use', description: 'Write better. Think more clearly. Stay organised.',   icon: personalIcon },
  { _id: 'school',   title: 'For school',       description: 'Keep notes, research and tasks in one place.',        icon: schoolIcon }
] as const)

const companySizeOptions = Object.freeze([
  { title: '1 – 10',         _id: '1–10' },
  { title: '11 – 50',        _id: '11–50' },
  { title: '51 – 200',       _id: '51–200' },
  { title: '201 – 500',      _id: '201–500' },
  { title: '501 – 1,000',    _id: '501–1000' },
  { title: '1,001 – 5,000',  _id: '1001–5000' },
  { title: '5,001 – 10,000', _id: '5001–10000' },
  { title: '10,001+',        _id: '10001+' }
] as const)

const educationOptions = Object.freeze([
  { title: 'School',       _id: 'school' },
  { title: 'College',      _id: 'college' },
  { title: 'University',   _id: 'university' },
  { title: 'Postgraduate', _id: 'postgraduate' }
])

const referralOptions = [
  { id: 'google',       label: 'Google Search' },
  { id: 'social',       label: 'Social Media' },
  { id: 'friend',       label: 'Friend / Colleague' },
  { id: 'youtube',      label: 'YouTube' },
  { id: 'twitter',      label: 'X (Twitter)' },
  { id: 'producthunt',  label: 'Product Hunt' },
  { id: 'ads',          label: 'Ads' },
  { id: 'blog',         label: 'Blog / Article' },
  { id: 'other',        label: 'Other' }
]

// ─── Queries ──────────────────────────────────────────────────────────────────
const { data: rolesList } = useRolesList()

// ─── Step labels & display step ───────────────────────────────────────────────
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
  }
  if (activeStep.value <= 5) return activeStep.value
  if (activeStep.value === 7) return 6
  if (activeStep.value === 8) return 7
  return activeStep.value
})

// ─── Watchers ─────────────────────────────────────────────────────────────────

// Clear field errors on change
watch(team,        (v: any) => { if (v?.trim()  && errors.value.team)        errors.value.team        = undefined })
watch(role,        (v)      => { if (v          && errors.value.role)        errors.value.role        = undefined })
watch(companySize, (v)      => { if (v          && errors.value.companySize) errors.value.companySize = undefined })
watch(workType,    (v)      => { if (v          && errors.value.workType)    errors.value.workType    = undefined })
watch(emailList,   (v)      => {
  if (Array.isArray(v) && v.some(e => e?.trim() !== '') && errors.value.emailList) {
    errors.value.emailList = undefined
  }
})

// Auto-fill siteName when entering step 5
watch(activeStep, (step) => {
  if (step === 5 && !siteName.value) {
    if (selected.value === 'team' && team.value.trim()) {
      siteName.value = generateSlug(team.value)
    } else if (selected.value === 'school' && schoolName.value.trim()) {
      siteName.value = generateSlug(schoolName.value)
    }
  }
})

// ─── Debounced slug check ─────────────────────────────────────────────────────
// Debounced 600ms + stale-check so only the LAST typed value fires the API.
// Prevents race conditions where an earlier slow response overwrites a later fast one.
let slugDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(siteName, (val) => {
  siteSlug.value = generateSlug(val)

  // Clear result immediately on every keystroke so stale ✅/❌ never lingers
  isSlugAvailable.value = null

  if (slugDebounceTimer) clearTimeout(slugDebounceTimer)

  if (!siteSlug.value) {
    isCheckingSlug.value = false
    return
  }

  // Show spinner right away so the user knows a check is coming
  isCheckingSlug.value = true

  slugDebounceTimer = setTimeout(async () => {
    const slugAtCallTime = siteSlug.value
    try {
      const result = await workspaceStore.fetchTitleSlug(slugAtCallTime)
      // Only apply if the slug hasn't changed while we were waiting
      if (siteSlug.value === slugAtCallTime) {
        isSlugAvailable.value = result?.available ?? null
      }
    } catch {
      if (siteSlug.value === slugAtCallTime) {
        isSlugAvailable.value = null
      }
    } finally {
      if (siteSlug.value === slugAtCallTime) {
        isCheckingSlug.value = false
      }
    }
  }, 600)
})

// ─── Debounced DNS check ──────────────────────────────────────────────────────
// API success shape: { status: true,  data: { is_registered: bool, status: "NOT_REGISTERED"|"REGISTERED" } }
// API error shape:   { status: false, message: "Invalid domain format", data: "<stack trace>" }
// Debounced 600ms + stale-check — prevents the "fires on every keystroke" race
// condition that was causing isDnsAvailable to be reset mid-flight and buttons
// staying disabled even after a valid response arrived.
let dnsDebounceTimer: ReturnType<typeof setTimeout> | null = null

watch(dnsInput, (val) => {
  const trimmed = val.trim()

  // Reset all DNS state immediately on every keystroke — clears any stale feedback
  isDnsAvailable.value = null
  dnsError.value = null

  if (dnsDebounceTimer) clearTimeout(dnsDebounceTimer)

  if (!trimmed) {
    isCheckingDns.value = false
    return
  }

  // Show spinner immediately so the user sees activity straight away
  isCheckingDns.value = true

  dnsDebounceTimer = setTimeout(async () => {
    const domainAtCallTime = trimmed
    try {
      const result = await workspaceStore.fetchDnsCheck(domainAtCallTime)

      // Stale-check: ignore response if user typed something new while waiting
      if (dnsInput.value.trim() !== domainAtCallTime) return

      // Store returns the inner data object directly:
      // { domain, is_registered: bool, is_active: bool, status: "NOT_REGISTERED"|"REGISTERED", records: {...} }
      // OR null when the API threw (e.g. invalid domain format)
      if (!result) {
        // Store swallowed the error and returned null
        dnsError.value = 'Invalid domain format. Please enter a valid domain (e.g. mycompany.com).'
        isDnsAvailable.value = null
      } else if (result.is_registered === false) {
        // status: "NOT_REGISTERED" — domain is free ✅
        isDnsAvailable.value = true
        dnsError.value = null
      } else if (result.is_registered === true) {
        // status: "REGISTERED" — domain is already taken ❌
        isDnsAvailable.value = false
        dnsError.value = null
      } else {
        // Unexpected shape
        isDnsAvailable.value = null
      }
    } catch (err: any) {
      if (dnsInput.value.trim() !== domainAtCallTime) return
      const serverMsg = err?.response?.data?.message ?? err?.message ?? null
      dnsError.value = serverMsg ?? 'Could not verify domain. Please try again.'
      isDnsAvailable.value = null
    } finally {
      if (dnsInput.value.trim() === domainAtCallTime) {
        isCheckingDns.value = false
      }
    }
  }, 600)
})

// ─── Mutations ────────────────────────────────────────────────────────────────
const { mutate: createProfile, isPending: creatingProfile } = useCreateCompany({
  onSuccess: (data: any) => {
    const payload = data?.data ?? data

    if (!payload || payload?.status === false) {
      const serverMessage = payload?.message ?? ''
      const isSlugConflict =
        serverMessage.toLowerCase().includes('slug') ||
        serverMessage.toLowerCase().includes('already exists') ||
        serverMessage.toLowerCase().includes('company name')

      companySlugError.value = isSlugConflict
        ? 'A company with a similar name already exists. Please go back and try a different company name.'
        : 'Something went wrong while creating your company. Please try again.'
      return
    }

    const id   = payload?.company_id ?? payload?._id
    const join = payload?.join_link  ?? ''
    const domain = payload?.domain_link ?? ''

    companyID.value   = id
    joinLink.value    = join
    domainLink.value  = domain

    localStorage.setItem(selected.value === 'team' ? 'company_id' : 'user_id',
      selected.value === 'team' ? id ?? '' : authStore.user?._id ?? '')

    activeStep.value    = 6
    isProvisioning.value = true
  },
  onError: (error: any) => {
    const serverMessage = error?.response?.data?.message ?? error?.message ?? ''
    const isSlugConflict =
      serverMessage.toLowerCase().includes('slug') ||
      serverMessage.toLowerCase().includes('already exists')

    companySlugError.value = isSlugConflict
      ? 'A company with a similar name already exists. Please go back and try a different company name.'
      : 'Something went wrong while creating your company. Please try again.'
  }
})

const { mutate: updateProfile, isPending: updatingProfile } = useUpdateCompany({
  onSuccess: async () => {
    if (selected.value === 'team' || selected.value === 'school') {
      activeStep.value = 8
      return
    }
    await authStore.bootstrap()
    if (workspaceStore.pricing)   router.push(`/dashboard?stripePayment=true`)
    else if (workspaceStore.workspace) router.push('/create-workspace')
    else                               router.push('/finish-profile')
  },
  onError: () => { activeStep.value = 5 }
})

const { mutate: invitePeople, isPending: invitingPeople } = useInviteCompany({
  onSuccess: async () => {
    await authStore.bootstrap()
    if (workspaceStore.pricing)        router.push(`/dashboard?stripePayment=true`)
    else if (workspaceStore.workspace) router.push('/create-workspace')
    else                               router.push('/finish-profile')
  }
})

const { mutate: createAdminUser, isPending: isCreatingAdmin } = useCreateCompanyUser({
  onSuccess: () => { /* resolved inline via Promise wrapper */ },
  onError: (error: any) => {
    const msg = error?.response?.data?.message ?? 'Failed to create super admin user.'
    errors.value.adminUsername = msg
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
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

function copySiteUrl() {
  globalThis.navigator.clipboard.writeText(joinLink.value).then(() => {
    isCopied.value = true
    setTimeout(() => isCopied.value = false, 2000)
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
  if (includeSite && siteSlug.value && dnsInput.value.trim()) {
    base.site_slug     = siteSlug.value              
    base.custom_domain = dnsInput.value.trim() 
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
// ─── Validation ───────────────────────────────────────────────────────────────
function validateCompanyStep() {
  const next: { team?: string; role?: string; companySize?: string } = {}
  if (!team.value.trim())  next.team        = 'Please enter your company name.'
  if (!role.value)         next.role        = 'Please select your role.'
  if (!companySize.value)  next.companySize = 'Please select your company size.'
  errors.value = next
  return Object.keys(next).length === 0
}

function validatePersonalStep() {
  const next: { personalRole?: string } = {}
  if (!personalRole.value.trim()) next.personalRole = 'Please tell us what you do.'
  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}

function validateSchoolStep() {
  const next: typeof errors.value = {}
  if (!schoolName.value.trim())  next.schoolName    = 'Please enter your school or university name.'
  if (!educationLevel.value)     next.educationLevel = 'Please select your education level.'
  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}

function validateAdminUser(): boolean {
  const next: typeof errors.value = {}

  if (!adminFullName.value.trim()) {
    next.adminFullName = 'Please enter the full name for the super admin.'
  }

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

  errors.value = { ...errors.value, ...next }
  return Object.keys(next).length === 0
}

// ─── Navigation handlers ──────────────────────────────────────────────────────
function goBack() {
  if (activeStep.value === 7) { activeStep.value = 5; return }
  if (activeStep.value === 8) { activeStep.value = 7; return }
  activeStep.value = Math.max(1, activeStep.value - 1)
}

async function continueHandler() {
  if (activeStep.value === 2) {
    if (selected.value === 'team'     && !validateCompanyStep())  return
    if (selected.value === 'personal' && !validatePersonalStep()) return
    if (selected.value === 'school'   && !validateSchoolStep())   return
    activeStep.value = activeStep.value + 1
    return
  }

  if (activeStep.value === 3) {
    if (selectedModules.value.length === 0) {
      errors.value.selectedModules = 'Please select at least one option.'
      return
    }
    activeStep.value = activeStep.value + 1
    return
  }

  if (activeStep.value === 4) {
    if (!workType.value) {
      errors.value.workType = 'Please select what kind of work you do.'
      return
    }

    if (selected.value === 'school') {
      activeStep.value = activeStep.value + 1
      return
    }

    if (selected.value === 'personal') {
      isUpdatingProfile.value = true
      try {
        await updateUserProfile({
          u_work_to_do:    personalRole.value,
          work_to_do:      workType.value,
          like_to_manage:  selectedModules.value,
          heard_about_us:  referralSources.value,
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

  if (activeStep.value === 7) {
    const payload = buildProfilePayload()

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

    updateProfile({ payload })
    return
  }

  activeStep.value = activeStep.value + 1
}
async function continueSiteHandler() {
  if (isSiteStepBlocked.value) return

  isCreating.value = true
  try {
    createProfile({ payload: buildProfilePayload(true) })
  } finally {
    isCreating.value = false
  }
}

async function sendInvites(skip = false) {
  if (!validateAdminUser()) return

  if (skip) isSkipping.value = true
  else      isInviting.value = true

  const companyIdRaw = companyID.value ?? localStorage.getItem('company_id') ?? ''

  // Create super admin — must succeed before proceeding
  await new Promise<void>((resolve, reject) => {
    createAdminUser(
      {
        company_id:  companyIdRaw,
        u_full_name: adminFullName.value.trim(),
        u_email:     adminEmail.value,
        u_password:  adminPassword.value,
      },
      {
        onSuccess: () => resolve(),
        onError: (error: any) => {
          const serverMsg = error?.response?.data?.message ?? ''
          errors.value.adminUsername = serverMsg.toLowerCase().includes('email') || serverMsg.toLowerCase().includes('exists')
            ? 'This email is already taken. Please choose a different username.'
            : serverMsg || 'Failed to create super admin. Please try again.'
          isSkipping.value = false
          isInviting.value = false
          reject(error)
        }
      }
    )
  }).catch(() => null)

  if (errors.value.adminUsername) return

  const token = localStorage.getItem('token')
  if (token) setAuthCookie(token)

  const encodedToken     = token          ? btoa(token).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.') : ''
  const encodedCompanyId = companyIdRaw   ? btoa(companyIdRaw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '.') : ''
  const query: Record<string, string> = {
  siteSlug:     siteSlug.value,
  customDomain: dnsInput.value.trim(),   // ← add this
  domainLink:   domainLink.value ?? '',
  type:         'team',
  adminEmail:   adminEmail.value,
}
  if (encodedToken)     query._auth = encodedToken
  if (encodedCompanyId) query._cid  = encodedCompanyId

  if (skip || emailList.value.length === 0) {
    isSkipping.value = false
    isInviting.value = false
    router.push({ path: '/finish-profile', query })
    return
  }

  invitePeople(
    { payload: { company_id: companyIdRaw, emails: [...emailList.value] } },
    {
      onSuccess: () => { isInviting.value = false; router.push({ path: '/finish-profile', query }) },
      onError:   () => { isInviting.value = false }
    }
  )
}

// ─── onMounted ────────────────────────────────────────────────────────────────
onMounted(() => {
  if (route.query.mode === 'company') {
    selected.value   = 'team'
    activeStep.value = 2
  }

  gsap.to('.rocket', { y: -10, rotation: -5, repeat: -1, yoyo: true, duration: 0.6, ease: 'power1.inOut' })
  gsap.to('.trail',  { scaleY: 1.3, opacity: 0.9, repeat: -1, yoyo: true, duration: 0.5 })
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

/* ROCKET BODY */
.rocket {
  font-size: 28px;
  z-index: 2;

  /* IMPORTANT: no simple float */
  animation: rocketShake 0.25s infinite linear;
}

/* ENGINE FLAME */
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

/* SMOKE PULSE */
.smoke {
  position: absolute;
  bottom: 0;
  width: 26px;
  height: 26px;
  background: radial-gradient(circle, rgba(124,92,252,0.25), transparent 70%);
  border-radius: 50%;

  animation: smokePulse 0.9s infinite ease-in-out;
}

/* 🚀 jitter = engine vibration (key Jira feel) */
@keyframes rocketShake {
  0%   { transform: translateY(0px) rotate(0deg); }
  25%  { transform: translateY(-1px) rotate(-1deg); }
  50%  { transform: translateY(0px) rotate(1deg); }
  75%  { transform: translateY(1px) rotate(-1deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}

/* 🔥 flame instability */
@keyframes flameFlicker {
  0% {
    height: 14px;
    opacity: 0.7;
    transform: scaleX(0.9);
  }
  100% {
    height: 26px;
    opacity: 1;
    transform: scaleX(1.2);
  }
}

/* 🌫 smoke expansion */
@keyframes smokePulse {
  0% {
    transform: scale(0.6);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
@media(max-width:640px) {
  .how_help_steps {
    grid-template-columns: 1fr 1fr !important;
  }
}

@media(max-width:350px) {
  .how_help_steps {
    grid-template-columns: 1fr !important;
  }
}
</style>