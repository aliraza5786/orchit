<template>
    <div class="w-full rich-text-editor" :class="theme === 'dark' ? 'dark' : ''">
        <label v-if="label" :class="['block text-base font-medium mb-2',
            theme === 'dark' ? 'text-white' : 'text-text-primary']">
            {{ label }}
        </label>

        <div :class="[
            'rounded-lg border',
            theme === 'dark'
                ? 'bg-[#131318] border-border  text-white'
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
                        ? 'border-border  text-text-secondary  bg-[#0D0D10]'
                        : 'border-white   bg-accent text-white'
                ]">
                <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" :class="btnClass"
                    title="Undo">↩</button>
                <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" :class="btnClass"
                    title="Redo">↪</button>

                <select v-model="textType" @change="setTextType"
                    :class="['text-sm bg-transparent focus:outline-none rounded-md px-1 py-1', theme === 'dark' ? 'text-white' : 'text-white ']">
                    <option value="paragraph">Normal text</option>
                    <option value="heading1">Heading 1</option>
                    <option value="heading2">Heading 2</option>
                </select>

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

                <!-- Link Panel -->
                <div v-if="showLinkPanel" class="w-full mt-2 p-3 rounded-xl border shadow-sm"
                    :class="theme === 'dark' ? 'bg-[#111114] border-border text-white' : 'bg-white border-border text-white'"
                    @click.stop>
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-2 items-start">
                        <div class="md:col-span-3">
                            <label class="text-xs opacity-70">URL</label>
                            <input ref="hrefInputRef" v-model="linkHref" type="text" placeholder="https://example.com"
                                class="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none" :class="theme === 'dark'
                                    ? 'bg-[#0D0D10] border-border !text-white placeholder-white/40'
                                    : 'bg-white border-gray-300 text-white placeholder-gray-400'"
                                @keydown.enter.prevent="applyLink" />
                            <p v-if="linkError" class="text-xs text-red-500 mt-1">{{ linkError }}</p>
                        </div>

                        <div class="md:col-span-2">
                            <label class="text-xs opacity-70">Text (optional)</label>
                            <input v-model="linkText" type="text" :placeholder="selectionText || 'Link text…'"
                                class="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none" :class="theme === 'dark'
                                    ? 'bg-[#0D0D10] border-border 353D50] !text-white placeholder-white/40'
                                    : 'bg-white border-gray-300 text-white placeholder-gray-400'"
                                @keydown.enter.prevent="applyLink" />
                        </div>

                        <div class="md:col-span-5 flex items-center gap-2 justify-end pt-1">
                            <button type="button" :class="btnClass" @click="closeLinkPanel">Cancel</button>
                            <button type="button" class="px-3 py-1.5 rounded-md text-sm"
                                :class="theme === 'dark' ? 'bg-white text-white' : 'bg-black text-white'"
                                @click="applyLink">
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
                <!-- /Link Panel -->
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { onBeforeUnmount, ref, watch, computed, nextTick } from 'vue'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
// import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = withDefaults(defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    theme?: 'light' | 'dark'
}>(), { theme: 'light' })



const isFocused = ref(false)
const toolbarHover = ref(false)

// in your Editor init, add focus/blur handlers
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
    onFocus: () => {

        isFocused.value = true
    },
    onBlur: () => {
        emit('focusOut');
        console.log(">>> i am visiting");

        // delay so moving the mouse to the toolbar doesn't instantly hide it
        setTimeout(() => {
            if (!toolbarHover.value && !showLinkPanel.value) {
                isFocused.value = false
            }
        }, 0)
    },
})
/* ----- Typography ----- */
const textType = ref<'paragraph' | 'heading1' | 'heading2'>('paragraph')
const setTextType = () => {
    if (textType.value === 'heading1') editor.chain().focus().setHeading({ level: 1 }).run()
    else if (textType.value === 'heading2') editor.chain().focus().setHeading({ level: 2 }).run()
    else editor.chain().focus().setParagraph().run()
}

/* ----- Link Panel State ----- */
const showLinkPanel = ref(false)
const linkHref = ref('')
const linkText = ref('')
const linkError = ref('')
const hrefInputRef = ref<HTMLInputElement | null>(null)

const selectionText = computed(() => {
    try {
        const { from, to } = editor.state.selection
        if (from === to) return ''
        return editor.state.doc.textBetween(from, to, ' ')
    } catch { return '' }
})

function openLinkPanel() {
    // Prefill with existing link (if any) and current selection text
    const prevHref = editor.getAttributes('link')?.href as string | undefined
    linkHref.value = prevHref || ''
    linkText.value = selectionText.value || ''
    linkError.value = ''
    showLinkPanel.value = true
    nextTick(() => hrefInputRef.value?.focus())
}

function closeLinkPanel() {
    showLinkPanel.value = false
    linkError.value = ''
}

function normalizeUrl(input: string) {
    const v = (input || '').trim()
    if (!v) return ''
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(v)) return v
    return `https://${v}`
}
function validateUrl(href: string) {
    try {
        if (!href) return false
        if (/^(mailto:|tel:|#|\/)/i.test(href)) return true
        const u = new URL(/^[a-z]+:\/\//i.test(href) ? href : `https://${href}`)
        return !!u.host
    } catch { return false }
}

function applyLink() {
    const normalized = normalizeUrl(linkHref.value)
    if (!validateUrl(normalized)) {
        linkError.value = 'Please enter a valid URL (https://…, mailto:, tel:, /path, or #anchor).'
        return
    }

    const hasSelection = !!selectionText.value
    const chain = editor.chain().focus().extendMarkRange('link')

    if (hasSelection) {
        chain.setLink({ href: normalized, target: '_blank', rel: 'noopener noreferrer nofollow' }).run()
    } else {
        const text = (linkText.value && linkText.value.trim()) || normalized
        chain.insertContent({
            type: 'text',
            text,
            marks: [{ type: 'link', attrs: { href: normalized, target: '_blank', rel: 'noopener noreferrer nofollow' } }]
        }).run()
    }

    closeLinkPanel()
}

function unsetLink() {
    editor.chain().focus().unsetLink().run()
}

/* ----- Sync & Cleanup ----- */
watch(() => props.modelValue, (val) => {
    if (val !== editor.getHTML()) editor.commands.setContent(val || '', false)
})
onBeforeUnmount(() => editor.destroy())

/* ----- Button classes ----- */
const btnClass = computed(() =>
    [
        'px-2 py-1 rounded-md border text-sm transition',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        props.theme === 'dark'
            ? 'border-border text-text-secondary -200 hover:bg-[#1a1a1f]'
            : 'border-border text-white hover:bg-accent-hover'
    ].join(' ')
)
const activeBtnClass = computed(() =>
    props.theme === 'dark' ? 'bg-[#2B2C30] text-white' : 'bg-accent text-white'
)

const emit = defineEmits(['update:modelValue', 'focusOut'])
</script>

<style scoped>
@reference "../../style.css";

.editor-shell :deep(.ProseMirror) {
    outline: none !important;
    height: 100%;
}

/* Headings */
h1 {
    @apply text-2xl font-bold;
    @apply text-white;
}

h2 {
    @apply text-xl font-semibold;
    @apply text-white;
}

ol {
    @apply !list-decimal !list-inside px-3;
}

ul {
    list-style: disc !important;
}

p {
    @apply text-base;
}

/* Links */
a {
    @apply text-blue-600 underline;
}

code {
    @apply rounded px-1 py-0.5 bg-gray-100 dark:bg-[#1a1a1f];
}

pre {
    @apply rounded p-3 bg-gray-100 dark:bg-[#1a1a1f];
}
</style>