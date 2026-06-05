<template>
  <div
    :class="isDarkTheme ? 'text-white' : 'text-text-primary'"
    @click.stop
    @mousedown.stop
  >
    <!-- Label + Tooltip -->
    <label
      v-if="label"
      :class="[
        'text-base font-medium mb-1 flex items-center',
        isDarkTheme ? 'text-white' : 'text-text-primary',
      ]"
    >
      {{ label }}
      <span
        v-if="tooltip"
        class="inline-block text-text-secondary -400 ml-1 cursor-help"
        v-tooltip="tooltip"
      >
        <img src="../../assets/icons/info.svg" alt="info" />
      </span>
    </label>

    <!-- Input wrapper (same shell as BaseTextField) -->
    <div class="relative">
      <div
        :class="[
          'flex items-center gap-2 border rounded-[6px] px-3 py-2 w-full text-sm focus-within:ring-2',
          size === 'md' ? 'min-h-10' : 'min-h-12',
          error
            ? 'border-red-500 focus-within:ring-red-500'
            : 'focus-within:ring-border',
          isDarkTheme
            ? 'bg-bg-input border-border '
            : ' border-border bg-bg-input',
          disabled
            ? 'opacity-60 cursor-not-allowed'
            : atLimit
              ? 'cursor-default'
              : '',
        ]"
        @click.stop="onWrapperClick"
      >
        <!-- Prefix slot -->
        <span v-if="$slots.prefix" class="mr-1 text-text-secondary -500">
          <slot name="prefix" />
        </span>

        <!-- Chips -->
        <div class="flex flex-wrap gap-2 w-full items-center flex-1">
          <template v-for="(e, i) in internal" :key="e + i">
            <!-- Inline edit: chip becomes an input -->
            <span
              v-if="editingIndex === i"
              class="inline-flex items-center max-w-full min-w-0 gap-1 rounded-full px-2 py-0.5 text-xs bg-bg-body text-text-primary border ring-2 ring-accent border-accent/60"
            >
              <input
                ref="editInputRef"
                v-model="editValue"
                type="text"
                class="min-w-[100px] max-w-[220px] bg-transparent outline-none text-xs text-text-primary"
                :disabled="disabled"
                @keydown="onEditKeydown"
                @blur="commitEditing"
                @click.stop
                @mousedown.stop
              />
              <button
                type="button"
                class="rounded hover:bg-bg-surface px-1 shrink-0"
                title="Remove"
                @mousedown.prevent
                @click.stop="removeAt(i)"
                :disabled="disabled"
              >
                ✕
              </button>
            </span>

            <!-- Display chip -->
            <span
              v-else
              class="inline-flex items-center max-w-full min-w-0 gap-1.5 rounded-full px-2.5 py-1 text-xs bg-bg-body text-text-secondary border border-border/40"
              :class="disabled ? '' : 'cursor-pointer hover:bg-bg-surface'"
              :title="disabled ? e : `${e} — click to edit`"
              @click.stop="editAt(i)"
            >
              <span v-if="showName" class="font-medium truncate">{{
                extractNameFromEmail(e)
              }}</span>
              <span v-if="showName" class="opacity-70 truncate"
                >&lt;{{ e }}&gt;</span
              >
              <span v-else class="truncate">{{ e }}</span>

              <button
                type="button"
                class="ml-1 rounded hover:bg-bg-surface px-1 shrink-0"
                title="Remove"
                @mousedown.prevent
                @click.stop="removeAt(i)"
                :disabled="disabled"
              >
                ✕
              </button>
            </span>
          </template>

          <!-- Input for adding new emails only -->
          <input
            v-if="!atLimit"
            ref="inputRef"
            v-model="inputValue"
            :placeholder="internal.length === 0 ? placeholder : ''"
            class="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-text-secondary text-text-primary"
            :disabled="disabled"
            @keydown="onKeydown"
            @blur="commit"
            @paste="onPaste"
          />
        </div>

        <!-- Suffix slot -->
        <span v-if="$slots.suffix" class="ml-1 text-text-secondary">
          <slot name="suffix" />
        </span>
      </div>
    </div>

    <!-- Help/Error Text -->
    <p
      v-if="message"
      class="mt-2 text-xs flex items-center gap-1"
      :class="
        error
          ? 'text-red-500'
          : isDarkTheme
            ? 'text-text-secondary '
            : 'text-text-secondary '
      "
    >
      <slot v-if="$slots.msgIcon" name="msgIcon" /> {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import { useTheme } from "../../composables/useTheme";

const { isDark } = useTheme();

const props = withDefaults(
  defineProps<{
    modelValue: string[];
    label?: string;
    tooltip?: string;
    message?: string;
    error?: boolean;
    placeholder?: string;
    size?: "sm" | "md" | "lg";
    theme?: string;
    disabled?: boolean;
    allowDuplicates?: boolean;
    showName?: boolean;
    /** Optional custom validator; return true if valid */
    validator?: (email: string) => boolean;
    /** NEW: maximum number of emails allowed (unset/0/negative = unlimited) */
    maxEmails?: number;
  }>(),
  {
    modelValue: () => [],
    size: "md",
    theme: "system",
    placeholder: "Add people by email… (Enter, comma, space)",
    error: false,
    disabled: false,
    allowDuplicates: false,
    showName: false,
    maxEmails: undefined,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", v: string[]): void;
  (e: "invalid", invalids: string[]): void;
  (e: "add", added: string[]): void;
  (e: "remove", removed: string): void;
  /** Optional: fired when user hits the max */
  (e: "limit", max: number): void;
}>();

const inputRef = ref<HTMLInputElement | null>(null);
const editInputRef = ref<HTMLInputElement | null>(null);
const inputValue = ref("");
const editValue = ref("");
const editingIndex = ref<number | null>(null);

/** internal mirror so we can mutate comfortably, synced with v-model */
const internal = ref<string[]>([...props.modelValue]);

watch(
  () => props.modelValue,
  (v) => {
    // sync if parent overwrote
    if (JSON.stringify(v) !== JSON.stringify(internal.value)) {
      internal.value = [...v];
      cancelEditing();
      inputValue.value = "";
    }
  },
);

const isDarkTheme = computed(() => {
  return props.theme === "dark" || (props.theme === "system" && isDark.value);
});

/** Max / limit helpers */
const cap = computed(() =>
  props.maxEmails && props.maxEmails > 0 ? props.maxEmails : Infinity,
);
const remaining = computed(() =>
  Math.max(0, cap.value - internal.value.length),
);
const atLimit = computed(
  () => remaining.value === 0 && editingIndex.value === null,
);

function onWrapperClick() {
  if (!props.disabled && !atLimit.value) inputRef.value?.focus();
}

function clearEditing() {
  editingIndex.value = null;
  editValue.value = "";
}

function cancelEditing() {
  clearEditing();
}

const defaultEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
function isValid(email: string) {
  return (props.validator ?? ((e: string) => defaultEmailRegex.test(e)))(email);
}

function normalizeEmails(text: string) {
  return text
    .split(/[\s,;]+/) // split by space/comma/semicolon/newlines
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function addEmails(list: string[]) {
  if (remaining.value === 0) {
    emit("limit", isFinite(cap.value) ? Number(cap.value) : Infinity);
    return;
  }

  const added: string[] = [];
  const invalids: string[] = [];
  const set = props.allowDuplicates ? null : new Set(internal.value);

  for (const raw of list) {
    if (remaining.value - added.length <= 0) break;

    if (!isValid(raw)) {
      invalids.push(raw);
      continue;
    }
    if (set && set.has(raw)) continue;

    if (set) set.add(raw);
    internal.value.push(raw);
    added.push(raw);
  }

  if (added.length) emit("add", added);
  if (invalids.length) emit("invalid", invalids);

  // clear error if user entered at least one valid email and no new invalids
  if (added.length && invalids.length === 0) emit("invalid", []);

  if (added.length || invalids.length)
    emit("update:modelValue", [...internal.value]);

  // Notify if user attempted to add more than allowed
  if (remaining.value === 0)
    emit("limit", isFinite(cap.value) ? Number(cap.value) : Infinity);
}

function commitEditing() {
  const idx = editingIndex.value;
  if (idx === null) return;

  if (!editValue.value.trim()) {
    cancelEditing();
    return;
  }

  const emails = normalizeEmails(editValue.value);
  if (!emails.length) {
    cancelEditing();
    return;
  }

  const email = emails[0];
  const rest = emails.slice(1);

  if (!isValid(email)) {
    emit("invalid", [email]);
    return;
  }

  if (
    !props.allowDuplicates &&
    internal.value.some((e, i) => i !== idx && e === email)
  ) {
    return;
  }

  internal.value[idx] = email;
  cancelEditing();
  emit("update:modelValue", [...internal.value]);
  if (rest.length) addEmails(rest);
}

function commit() {
  if (!inputValue.value || atLimit.value) return;
  addEmails(normalizeEmails(inputValue.value));
  inputValue.value = "";
}

function onPaste(e: ClipboardEvent) {
  if (atLimit.value) {
    e.preventDefault();
    emit("limit", Number(cap.value));
    return;
  }
  const text = e.clipboardData?.getData("text") || "";
  if (!text) return;
  e.preventDefault();
  addEmails(normalizeEmails(text));
}

function onEditKeydown(e: KeyboardEvent) {
  if (props.disabled) return;

  if (e.key === "Escape") {
    e.preventDefault();
    cancelEditing();
    return;
  }

  if (e.key === "Enter" || e.key === "Tab" || e.key === "," || e.key === " ") {
    e.preventDefault();
    commitEditing();
  }
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return;

  // commit on separators
  if (e.key === "Enter" || e.key === "Tab" || e.key === "," || e.key === " ") {
    e.preventDefault();
    commit();
    return;
  }

  // backspace to remove last when empty
  if (e.key === "Backspace" && !inputValue.value && internal.value.length) {
    const removed = internal.value.pop()!;
    emit("remove", removed);
    emit("update:modelValue", [...internal.value]);
  }
}

function removeAt(i: number) {
  if (props.disabled) return;
  if (editingIndex.value === i) {
    cancelEditing();
  } else if (editingIndex.value !== null && editingIndex.value > i) {
    editingIndex.value--;
  }
  const [removed] = internal.value.splice(i, 1);
  emit("remove", removed);
  emit("update:modelValue", [...internal.value]);
}

function editAt(i: number) {
  if (props.disabled) return;
  const email = internal.value[i];
  if (!email) return;
  if (editingIndex.value !== null && editingIndex.value !== i) {
    commitEditing();
  }
  editingIndex.value = i;
  editValue.value = email;
  nextTick(() => {
    const raw = editInputRef.value;
    const el = Array.isArray(raw) ? raw[0] : raw;
    if (el) {
      el.focus();
      el.select();
    }
  });
}

/** Optional: Name extraction for chip display */
function extractNameFromEmail(email: string) {
  const local = (email?.split("@")[0] || "").split("+")[0];
  const parts = local?.split(/[^a-zA-Z]+/).filter(Boolean);
  if (!parts?.length) return email;
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}
</script>
