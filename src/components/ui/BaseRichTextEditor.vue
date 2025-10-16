<template>
    <div class="w-full rich-text-editor" :class="theme === 'dark' ? 'dark' : ''">
        <label v-if="label" :class="['block text-base font-medium mb-2',
            theme === 'dark' ? 'text-white' : 'text-text-primary']">
            {{ label }}
        </label>

        <div :class="[
            'rounded-lg border',
            theme === 'dark'
                ? 'bg-[#131318] border-border text-white'
                : 'bg-bg-input border-border text-text-primary'
        ]">
            <!-- Content -->
            <EditorContent :placeholder="placeholder" :editor="editor" :class="[
                'min-h-[150px] px-4 py-3 !outline-none editor-shell',
                theme === 'dark' ? 'text-white' : 'text-text-primary'
            ]" />

            <!-- Toolbar -->
            <div v-show="isFocused || toolbarHover || showLinkPanel" @mouseenter="toolbarHover = true"
                @mouseleave="toolbarHover = false" :class="[
                    'border-t px-2 py-2 flex items-center flex-wrap gap-2 text-sm relative transition-opacity duration-150',
                    theme === 'dark'
                        ? 'border-border text-text-secondary bg-[#0D0D10]'
                        : 'border-white bg-accent text-white'
                ]">
                <!-- Undo/Redo buttons -->
                <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" :class="btnClass"
                    title="Undo">↩</button>
                <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" :class="btnClass"
                    title="Redo">↪</button>

                <!-- Text type selector -->
                <select v-model="textType" @change="setTextType"
                    :class="['text-sm bg-transparent focus:outline-none rounded-md px-1 py-1', theme === 'dark' ? 'text-white' : 'text-white ']">
                    <option value="paragraph">Normal text</option>
                    <option value="heading1">Heading 1</option>
                    <option value="heading2">Heading 2</option>
                </select>

                <!-- Formatting buttons -->
                <button @click.prevent="editor.chain().focus().toggleBold().run()"
                    :class="[btnClass, editor.isActive('bold') ? activeBtnClass : '']"
                    title="Bold"><strong>B</strong></button>
                <button @click.prevent="editor.chain().focus().toggleItalic().run()"
                    :class="[btnClass, editor.isActive('italic') ? activeBtnClass : '']"
                    title="Italic"><em>I</em></button>
                <button @click.prevent="editor.chain().focus().toggleStrike().run()"
                    :class="[btnClass, editor.isActive('strike') ? activeBtnClass : '']"
                    title="Strikethrough">S</button>
                <button @click.prevent="editor.chain().focus().toggleCodeBlock().run()"
                    :class="[btnClass, editor.isActive('codeBlock') ? activeBtnClass : '']"
                    title="Code">&lt;/&gt;</button>

                <!-- List buttons -->
                <button @click.prevent="editor.chain().focus().toggleBulletList().run()"
                    :class="[btnClass, editor.isActive('bulletList') ? activeBtnClass : '']" title="Bulleted list">
                    <i class="fa-sold fa-list"></i>
                </button>
                <button @click.prevent="editor.chain().focus().toggleOrderedList().run()"
                    :class="[btnClass, editor.isActive('orderedList') ? activeBtnClass : '']" title="Numbered list">
                    <i class="fa-sold fa-list-ol"></i>
                </button>

                <!-- Link buttons -->
                <button @click.prevent="openLinkPanel"
                    :class="[btnClass, editor.isActive('link') ? activeBtnClass : '']" title="Add/Edit link">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 inline" viewBox="0 0 24 24"
                        fill="currentColor">
                        <path
                            d="M10.59 13.41a1.996 1.996 0 0 0 2.82 0l3.59-3.59a2 2 0 1 0-2.83-2.83l-1.06 1.06-1.41-1.41 1.06-1.06a4 4 0 1 1 5.66 5.66l-3.59 3.59a4 4 0 0 1-5.66 0l-1.06-1.06 1.41-1.41 1.06 1.06z" />
                        <path
                            d="M7.05 17.66a4 4 0 0 1 0-5.66l3.59-3.59a4 4 0 0 1 5.66 0l1.06 1.06-1.41 1.41-1.06-1.06a2 2 0 0 0-2.83 0l-3.59 3.59a2 2 0 0 0 0 2.83l1.06 1.06-1.41 1.41-1.06-1.06z" />
                    </svg>
                    <span class="ml-1">Link</span>
                </button>
                <button @click.prevent="unsetLink" :disabled="!editor.isActive('link')" :class="btnClass"
                    title="Remove link">
                    Remove
                </button>

                <!-- Option 1 - Upload Images button -->
                <label @click.prevent="imageInput.click()" class="cursor-pointer" :class="btnClass">
                    Upload Image
                </label>
                <input ref="imageInput" type="file" class="hidden" accept="image/*" multiple
                    @change="handleImageUpload" />

                <!-- Option 2 - Upload Attachments button -->
                <label @click.prevent="fileInput.click()" class="cursor-pointer" :class="btnClass">
                    Upload Attachment
                </label>
                <input ref="fileInput" type="file" class="hidden" multiple @change="handleFileUpload" />

                <!-- Option 2 - Attachment Previews -->
                <div v-if="filePreviews.length > 0" class="mt-2">
                    <div v-for="(file, index) in filePreviews" :key="index"
                        class="flex items-center mb-2 p-2 border rounded-lg">
                        <div class="flex-1">
                            <span>{{ file.name }}</span>
                        </div>
                        <button @click="removeFile(index)" class="text-red-500 ml-2">✖</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useUploadFile } from '../../queries/useCommon'

const props = withDefaults(defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    theme?: 'light' | 'dark'
}>(), { theme: 'light' })
const showLinkPanel = ref(false)
const isFocused = ref(false)
const toolbarHover = ref(false)
const filePreviews = ref<any[]>([]) // Store file previews for Option 2
const imageInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const editor = new Editor({
    content: props.modelValue,
    extensions: [
        StarterKit,
        Link.configure({
            openOnClick: true,
            autolink: true,
            linkOnPaste: true,
            HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer nofollow' },
            validate: href => validateUrl(href),
        }),
        Image,
    ],
    onUpdate: ({ editor }) => emit('update:modelValue', editor.getHTML()),
    onFocus: () => { isFocused.value = true },
    onBlur: () => {
        emit('focusOut');
        setTimeout(() => {
            if (!toolbarHover.value && !showLinkPanel.value) {
                isFocused.value = false
            }
        }, 0)
    },
})

const textType = ref<'paragraph' | 'heading1' | 'heading2'>('paragraph')
const setTextType = () => {
    if (textType.value === 'heading1') editor.chain().focus().setHeading({ level: 1 }).run()
    else if (textType.value === 'heading2') editor.chain().focus().setHeading({ level: 2 }).run()
    else editor.chain().focus().setParagraph().run()
}

const { mutate: uploadFile } = useUploadFile({
    onSuccess: (uploadUrl: any) => {
        const uploadedFileUrl = uploadUrl.data.url
        const file = uploadUrl.data.file

        if (uploadedFileUrl.endsWith('.png') || uploadedFileUrl.endsWith('.jpg')||uploadedFileUrl.endsWith('.jepg')) {
            // Image file, insert it into the editor
            editor.chain().focus().insertContent(`<img src="${uploadedFileUrl}" alt="${file?.name}" />`).run();
        } 
        else {

            console.log('>>> ', uploadedFileUrl);

            filePreviews.value = [
                ...filePreviews.value,
                {
                    // name: file.name,
                    url: uploadedFileUrl,
                }]

        }
    },
})

const handleImageUpload = (event: any) => {
    const files = event.target.files
    Array.from(files).forEach((file: File) => {
        const fd = new FormData()
        fd.append('file', file)
        uploadFile(fd)  // Trigger the upload API
    })

}

const handleFileUpload = (event: any) => {
    const files = event.target.files
    Array.from(files).forEach((file: File) => {
        const fd = new FormData()
        fd.append('file', file)
        uploadFile(fd)  // Trigger the upload API
    })
}

const removeFile = (index: number) => {
    filePreviews.value.splice(index, 1)
}

watch(() => props.modelValue, (val) => {
    if (val !== editor.getHTML()) editor.commands.setContent(val || '', false)
})

onBeforeUnmount(() => editor.destroy())

const btnClass = computed(() =>
    [
        'px-2 py-1 rounded-md border text-sm transition',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        props.theme === 'dark'
            ? 'border-border text-text-secondary -200 hover:bg-[#1a1a1f]'
            : 'border-border text-white hover:bg-accent-hover'
    ].join(' '))

const activeBtnClass = computed(() =>
    props.theme === 'dark' ? 'bg-[#2B2C30] text-white' : 'bg-accent text-white'
)

function validateUrl(href: string) {
    try {
        if (!href) return false
        if (/^(mailto:|tel:|#|\/)/i.test(href)) return true
        const u = new URL(/^[a-z]+:\/\//i.test(href) ? href : `https://${href}`)
        return !!u.host
    } catch { return false }
}

const emit = defineEmits(['update:modelValue', 'focusOut'])
</script>
