<template>

    <div :class="theme === 'dark' ? 'text-white' : 'text-text-primary'">
        <!-- Label + Tooltip -->
        <label v-if="label" :class="[
            'text-base font-medium mb-1 flex items-center',
            theme === 'dark' ? 'text-white' : 'text-text-primary'
        ]">
            {{ label }}
            <span v-if="tooltip" class="inline-block text-text-secondary -400 ml-1 cursor-help" :title="tooltip">
                <img src="../../assets/icons/info.svg" alt="info" />
            </span>
        </label>

        <!-- Input wrapper -->
        <div class="relative">
            <div :class="[
                'flex items-center border h-32 rounded-xl border-dashed border-border  px-3 py-3 w-full text-sm focus-within:ring-2',

                error ? 'border-red-500 focus-within:ring-red-500' : 'focus-within:ring-black',
                theme === 'dark' ? 'bg-bg-input border-border ' : 'bg-bg-input border-border '
            ]">

                <!-- Prefix slot -->
                <span v-if="$slots.prefix" class="mr-2 text-text-secondary -500">
                    <slot name="prefix" />
                </span>

                <!-- File upload area -->
                <label v-if="!file && !modelValue" for="file"
                    class="w-full flex flex-col items-center justify-center  cursor-pointer text-center"
                    ref="wrapperRef">
                    <input type="file" id="file" name="file" :accept="accept" class="hidden" ref="fileInput"
                        @change="handleFileChange" />
                    <div class="  w-full flex flex-col justify-center items-center p-4">
                        <img src="../../assets/icons/upload.svg" class="w-6" alt="">
                        <span class="text-text-primary mt-4 text-sm text-semibold">Upload logo</span>
                        <span class="text-text-secondary mt-1 text-[11px]">Upload you existing logo file</span>

                    </div>
                </label>
                <div v-else-if="imageUrl" class="w-full h-32 flex justify-between items-start py-2">
                    <!-- Image preview -->
                    <img v-if="imageUrl" :src="imageUrl" alt="Preview"
                        class=" h-28  object-contain rounded border border-border" />
                    <img src="../../assets/icons/cross.svg" class="cursor-pointer" @click="removeFile" alt="Remove" />

                </div>

                <!-- Suffix slot -->
                <span v-if="$slots.suffix" class="ml-2 text-text-secondary -500">
                    <slot name="suffix" />
                </span>
            </div>
        </div>

        <!-- Help/Error Text -->
        <p v-if="message" class="mt-2 text-xs flex items-center gap-1"
            :class="error ? 'text-red-500' : theme === 'dark' ? 'text-text-secondary ' : 'text-text-secondary '">
            <slot v-if="$slots.msgIcon" name="msgIcon" /> {{ message }}
        </p>
    </div>
</template>

<script setup lang="ts">
import { onBeforeMount, watch } from 'vue';
import { ref } from 'vue';
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        modelValue: File | null;
        label?: string;
        tooltip?: string;
        message?: string;
        error?: boolean;
        placeholder?: string;
        accept?: string; // File type(s) allowed
        size?: 'md' | 'lg';
        theme?: 'dark' | 'light';

    }>(),
    {
        size: 'md',
        accept: '*/*',
        theme: 'light',
        error: false,
        modelValue: null
    }
);

const emit = defineEmits(['update:modelValue']);

const file = ref<File | null>(props.modelValue);
const wrapperRef = ref<HTMLElement | null>(null);

// Handle file selection
const handleFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
        const selectedFile = input.files[0];
        file.value = selectedFile;

        emit('update:modelValue', selectedFile);
    }
};

const imageUrl = computed(() => {
  const f = file.value
  const mv = props.modelValue

  // 1) Local file chosen
  if (f instanceof File && f.type?.startsWith('image/')) {
    return URL.createObjectURL(f)
  }

  // 2) v-model passed in as a File
  if (mv instanceof File && mv.type?.startsWith('image/')) {
    return URL.createObjectURL(mv)
  }

  // 3) v-model (or file) already a URL string
  if (typeof mv === 'string' && mv) return mv
  if (typeof f === 'string' && f) return f

  return null
})

const objectUrl = ref<string | null>(null)

watch(imageUrl, (val, oldVal) => {
  if (oldVal && oldVal.startsWith('blob:')) URL.revokeObjectURL(oldVal)
  objectUrl.value = val ?? null
}, { flush: 'post' })

onBeforeMount(() => {
  if (objectUrl.value?.startsWith('blob:')) URL.revokeObjectURL(objectUrl.value)
})

// Optional: log when prop changes
watch(
    () => props.modelValue,
    (newVal) => {
        console.log('[watch] modelValue changed:', newVal)
    },
    { immediate: true }
)

const removeFile = () => {
    file.value = null;
    emit('update:modelValue', null);
};


</script>

<style scoped>
/* You can adjust the size of the file input container */
</style>