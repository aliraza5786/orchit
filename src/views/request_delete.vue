<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div
      class="w-full max-w-lg bg-white rounded-xl shadow border border-gray-200"
    >
      <!-- Header -->
      <div
        class="bg-accent text-white text-lg font-semibold px-6 py-4 rounded-t-xl"
      >
        Request Account Deletion
      </div>

      <!-- Success Message -->
      <div class="px-6 pt-5" v-if="showSuccess">
        <div
          class="bg-green-100 text-green-700 px-4 py-3 rounded-md text-sm"
        >
          Request submitted successfully.
        </div>
      </div>

      <!-- Form -->
      <form class="px-6 py-6 space-y-5">
        <!-- Full Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Phone <span class="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="Enter your Phone with country code (eg +971)"
            class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
        </div>

        <!-- Reason -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Reason for Account Deletion (Optional)
          </label>
          <select
            class="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          >
            <option value="">Select a reason (optional)</option>
            <option value="privacy">Privacy concerns</option>
            <option value="not_useful">Not useful anymore</option>
            <option value="duplicate">Duplicate account</option>
            <option value="other">Other</option>
          </select>
        </div>

        <!-- Submit -->
        <button
          type="submit"
         @click.prevent="handleSubmit"
          class="w-full bg-accent text-white py-3 rounded-lg font-medium transition-colors hover:bg-hover-accent"
        >
          Submit Account Deletion Request
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const showSuccess = ref(false);

function handleSubmit() {
  // submit logic / API call here

  showSuccess.value = true;
}
</script>
