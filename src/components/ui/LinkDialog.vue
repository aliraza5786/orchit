<template>
  <div v-if="modelValue" class="fixed inset-0 z-[2000] flex items-center justify-center">
    <!-- backdrop -->
    <div class="absolute inset-0 bg-black/30" @click="close"></div>

    <!-- modal -->
    <div class="relative w-[520px] max-w-[92vw] rounded-xl bg-bg-surface shadow-2xl p-5 space-y-4" role="dialog"
      aria-modal="true" aria-labelledby="link-modal-title">
      <h3 id="link-modal-title" class="text-lg font-semibold">Insert link</h3>

      <!-- URL row -->
      <div class="space-y-1">

        <div class="flex gap-2 items-end">

          <BaseSelectField v-model="protocol" label="Url" :options="[
            {
              _id: 'https://',
              title: 'https://'
            },
            {
              _id: 'http://',
              title: 'http://'
            },
            {
              _id: 'mailto:',
              title: 'mailto:'
            },
            {
              _id: 'tel:',
              title: 'tel:'
            },
            {
              _id: '/',
              title: '/ (relative)'
            }

          ]" />

          <BaseTextField ref="urlRef" v-model.trim="urlWithoutProto" placeholder="example.com/page" />
        </div>
        <p v-if="error" class="text-xs text-red-600">{{ error }}</p>
      </div>


      <BaseTextField v-model="text" label="Text" placeholder="Visible text (optional)" />


      <!-- New tab -->
      <!-- <label class="inline-flex items-center gap-2">
        <input type="checkbox" v-model="newTab" class="h-4 w-4">
        <span class="text-sm text-gray-800">Open in new tab</span>
      </label> -->

      <!-- Actions -->
      <div class="mt-4 flex justify-end gap-3">
        <Button variant="secondary" size="sm" @click="close">Cancel</Button>
        <Button size="sm" @click="submit">
          Insert
        </Button>
      </div>

      <!-- close button -->
      <button @click="close" class="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        aria-label="Close">✕</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue';
import BaseSelectField from './BaseSelectField.vue';
import BaseTextField from './BaseTextField.vue';
import Button from './Button.vue';

const props = defineProps<{
  modelValue: boolean,
  initialHref?: string,
  initialText?: string,
  initialNewTab?: boolean
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'insert', payload: { href: string; text?: string; newTab: boolean }): void
}>();

const urlRef = ref<HTMLInputElement | null>(null);
const protocol = ref<'https://' | 'http://' | 'mailto:' | 'tel:' | '/'>('https://');
const urlWithoutProto = ref('');
const text = ref('');
const newTab = ref(true);
const error = ref('');

function hydrateFromProps() {
  const href = props.initialHref || '';
  // detect protocol
  const protoMatch = href.match(/^(https?:\/\/|mailto:|tel:|\/)/i)?.[0] as any;
  protocol.value = (protoMatch as any) || 'https://';
  urlWithoutProto.value = href.replace(/^(https?:\/\/|mailto:|tel:|\/)/i, '');
  text.value = props.initialText || '';
  newTab.value = props.initialNewTab ?? true;
  error.value = '';
}

watch(() => props.modelValue, async (open) => {
  if (open) {
    hydrateFromProps();
    await nextTick();
    urlRef.value?.focus();
  }
}, { immediate: true });

function close() { emit('update:modelValue', false); }

function buildHref() {
  if (protocol.value === '/') {
    // treat as relative path; ensure leading slash
    const clean = urlWithoutProto.value.startsWith('/') ? urlWithoutProto.value : `/${urlWithoutProto.value}`;
    return clean;
  }
  return `${protocol.value}${urlWithoutProto.value}`;
}

function validate(href: string) {
  if (!href || href === protocol.value) return 'Please enter a URL.';
  if (protocol.value === 'mailto:' || protocol.value === 'tel:' || protocol.value === '/') return '';
  try {
    // URL must have a hostname
    const u = new URL(href);
    if (!u.host) return 'URL is missing a host.';
    return '';
  } catch { return 'Invalid URL format.' }
}

function submit() {
  const href = buildHref();
  error.value = validate(href);
  if (error.value) return;
  emit('insert', { href, text: text.value?.trim() || undefined, newTab: newTab.value });
  close();
}
</script>