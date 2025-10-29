<template>
    <div class="w-full rich-text-editor" :class="theme === 'dark' ? 'dark' : ''">
        <label v-if="label"
            :class="['block text-base font-medium mb-2', theme === 'dark' ? 'text-white' : 'text-text-primary']">
            {{ label }}
        </label>

        <div :class="[
            'rounded-lg border flex flex-col h-full cursor-text',
            theme === 'dark' ? 'bg-[#131318] border-border text-white' : 'bg-bg-input border-border text-text-primary'
        ]" @mousedown="focusEditor">
            <!-- Content -->
            <EditorContent :placeholder="placeholder" :editor="editor"
                :class="['min-h-[150px] px-4 py-3 editor-shell grow', theme === 'dark' ? 'text-white' : 'text-text-primary']" />

            <!-- Toolbar (always visible) -->
            <div data-editor-toolbar :class="[
                'border-t sticky bottom-0 px-2 py-2 flex items-center flex-wrap gap-2 text-sm',
                theme === 'dark' ? 'border-border bg-[#0D0D10] text-text-secondary' : 'border-border bg-bg-body text-text-primary'
            ]">
                <!-- Undo/Redo -->
                <button @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" :class="btnClass"
                    title="Undo">↩</button>
                <button @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" :class="btnClass"
                    title="Redo">↪</button>

                <!-- Text type -->
                <select v-model="textType" @change="setTextType"
                    :class="['text-sm bg-transparent focus:outline-none rounded-md px-1 py-1 text-text-primary']">
                    <option value="paragraph">Normal text</option>
                    <option value="heading1">Heading 1</option>
                    <option value="heading2">Heading 2</option>
                </select>

                <!-- Inline formatting -->
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

                <!-- Lists -->
                <button @click.prevent="editor.chain().focus().toggleBulletList().run()"
                    :class="[btnClass, editor.isActive('bulletList') ? activeBtnClass : '']" title="Bulleted list"><i
                        class="fa-solid fa-list"></i></button>
                <button @click.prevent="editor.chain().focus().toggleOrderedList().run()"
                    :class="[btnClass, editor.isActive('orderedList') ? activeBtnClass : '']" title="Numbered list"><i
                        class="fa-solid fa-list-ol"></i></button>

                <!-- Link -->
                <button @click.prevent="openLinkPanel"
                    :class="[btnClass, editor.isActive('link') ? activeBtnClass : '']" title="Add/Edit link">
                    <i class="fa-regular fa-link"></i>
                </button>

                <!-- Uploads -->
                <button type="button" @click="triggerImagePicker" :class="btnClass" title="Upload image">
                    <i class="fa-regular fa-image"></i>
                </button>
                <input ref="imageInput" type="file" class="hidden" accept="image/*" multiple
                    @change="handleImageUpload" />

                <!-- Attachments fan-out -->
                <div class="relative" @mouseenter="showFan = true" @mouseleave="showFan = false">
                    <!-- trigger -->
                    <button type="button" @click="triggerFilePicker" :class="btnClass + ' relative'"
                        title="Upload file">
                        <i class="fa-regular fa-file"></i>

                        <!-- count badge -->
                        <span v-if="filePreviews.length" class="absolute -top-1.5 -right-1.5 min-w-[1.2rem] h-[1.2rem] px-1 rounded-full text-[10px] leading-[1.2rem] text-white text-center
             bg-purple-600 shadow ring-1 ring-black/10">
                            {{ filePreviews.length }}
                        </span>
                    </button>

                    <!-- fan-out icons -->
                 <!-- fan-out icons -->
<div class="relative">
  <button
    v-for="(f, i) in filePreviewIcons"
    :key="f.key"
    class="fan-pill absolute z-10 w-8 h-8 rounded-full shadow ring-1 ring-black/10
           bg-white dark:bg-neutral-800 flex items-center justify-center overflow-hidden"
    :style="fanStyle(i, filePreviewIcons.length)"
    @click.stop="openAttachment(f.url)"
    :title="f.name"
  >
    <img v-if="f.thumb" :src="f.thumb" class="w-5 h-5 object-cover rounded-sm" alt="" />
    <i v-else :class="f.icon" class="text-[14px]"></i>
  </button>
</div>

                </div>

                <input ref="fileInput" type="file" class="hidden" multiple @change="handleFileUpload" />

            </div>
        </div>
    </div>

    <!-- Link Dialog -->
    <LinkDialog v-model="showLinkDialog" :initial-href="linkDraft.href" :initial-text="linkDraft.text"
        :initial-new-tab="linkDraft.newTab" @insert="insertLink" />
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { useUploadFile } from '../../queries/useCommon'
import LinkDialog from './LinkDialog.vue'

const props = withDefaults(defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    theme?: 'light' | 'dark'
}>(), { theme: 'light' })

const emit = defineEmits(['update:modelValue', 'focusOut'])

const imageInput = ref<HTMLInputElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const filePreviews = ref<{ name: string; url: string }[]>([])

const editor = new Editor({
    content: props.modelValue,
    extensions: [
        StarterKit,
        Link.configure({
            openOnClick: true,
            autolink: true,
            linkOnPaste: true,
            HTMLAttributes: { rel: 'noopener noreferrer nofollow' }, // target set per-link in insertLink
            validate: href => validateUrl(href),
        }),
        Image,
    ],
    onUpdate: ({ editor }) => emit('update:modelValue', editor.getHTML()),
    onBlur: () => emit('focusOut', filePreviews.value),
})

const textType = ref<'paragraph' | 'heading1' | 'heading2'>('paragraph')
function setTextType() {
    if (textType.value === 'heading1') editor.chain().focus().setHeading({ level: 1 }).run()
    else if (textType.value === 'heading2') editor.chain().focus().setHeading({ level: 2 }).run()
    else editor.chain().focus().setParagraph().run()
}

const { mutate: uploadFile } = useUploadFile({
    onSuccess: (resp: any) => {
        const uploadedFileUrl = resp.data.url as string
        const fileName = resp.data.name as string

        if (/\.(png|jpe?g|gif|webp|svg)$/i.test(uploadedFileUrl)) {
            editor.chain().focus().insertContent(`<img src="${uploadedFileUrl}" alt="${fileName}" />`).run()
        } else {
            filePreviews.value = [...filePreviews.value, { name: fileName, url: uploadedFileUrl }]
        }
    },
})

function handleImageUpload(e: Event) {
    const files = (e.target as HTMLInputElement).files
    if (!files) return
    Array.from(files).forEach(file => {
        const fd = new FormData()
        fd.append('file', file)
        uploadFile(fd)
    })
}
function handleFileUpload(e: Event) {
    const files = (e.target as HTMLInputElement).files
    if (!files) return
    Array.from(files).forEach(file => {
        const fd = new FormData()
        fd.append('file', file)
        uploadFile(fd)
    })
}

function triggerImagePicker() { imageInput?.value?.click() }
function triggerFilePicker() { fileInput?.value?.click() }

watch(() => props.modelValue, (val) => {
    if (val !== editor.getHTML()) editor.commands.setContent(val || '', false)
})
onBeforeUnmount(() => editor.destroy())

const btnClass = computed(() =>
    [
        'px-2 py-1 rounded-md border text-sm transition',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        props.theme === 'dark'
            ? 'border-border text-text-secondary hover:bg-[#1a1a1f]'
            : 'border-border text-text-primary hover:bg-accent-hover'
    ].join(' ')
)
const activeBtnClass = computed(() => props.theme === 'dark' ? 'bg-[#2B2C30] text-white' : 'bg-accent text-white')

function validateUrl(href: string) {
    try {
        if (!href) return false
        if (/^(mailto:|tel:|#|\/)/i.test(href)) return true
        const u = new URL(/^[a-z]+:\/\//i.test(href) ? href : `https://${href}`)
        return !!u.host
    } catch { return false }
}

/* Link dialog wiring */
const showLinkDialog = ref(false)
const linkDraft = ref<{ href?: string; text?: string; newTab?: boolean }>({})
function openLinkPanel() {
  const attrs = editor.getAttributes('link') || {}
  const { from, to } = editor.state.selection
  const selectedText = editor.state.doc.textBetween(from, to) || ''

  const newTab = attrs.target == null ? true : attrs.target === '_blank'

  linkDraft.value = {
    href: attrs.href || '',
    text: selectedText || '',
    newTab,
  }
  showLinkDialog.value = true
}

function insertLink({ href, text, newTab }: { href: string; text?: string; newTab: boolean }) {
    const target = newTab ? '_blank' : null
    const rel = newTab ? 'noopener noreferrer nofollow' : null
    const { from, to } = editor.state.selection
    const hasSelection = from !== to
    const label = text && text.length ? text : (hasSelection ? undefined : href)

    if (!hasSelection && label) {
        editor.chain().focus().insertContent({
            type: 'text',
            text: label,
            marks: [{ type: 'link', attrs: { href, target, rel } }]
        }).run()
    } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href, target, rel }).run()
    }
}

/* Focus anywhere in wrapper (but not on toolbar buttons) */
function focusEditor(e?: MouseEvent) {
    const target = e?.target as HTMLElement | undefined
    if (target && target.closest('[data-editor-toolbar]')) return
    editor?.commands.focus()
}


// Show/hide fan on hover
const showFan = ref(false);

// Build small set of icon items (limit to 6 around the arc)
const filePreviewIcons = computed(() => {
    const mapIcon = (name: string) => {
        const ext = (name.split('.').pop() || '').toLowerCase();
        if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return null; // thumbnail via <img>
        if (['pdf'].includes(ext)) return 'fa-regular fa-file-pdf';
        if (['doc', 'docx'].includes(ext)) return 'fa-regular fa-file-word';
        if (['xls', 'xlsx', 'csv'].includes(ext)) return 'fa-regular fa-file-excel';
        if (['ppt', 'pptx'].includes(ext)) return 'fa-regular fa-file-powerpoint';
        if (['zip', 'rar', '7z'].includes(ext)) return 'fa-regular fa-file-zipper';
        if (['txt', 'md'].includes(ext)) return 'fa-regular fa-file-lines';
        return 'fa-regular fa-file';
    };

    return filePreviews.value.slice(0, 6).map((f, idx) => ({
        key: `${f.name}-${idx}`,
        name: f.name,
        url: f.url,
        thumb: /\.(png|jpe?g|gif|webp|svg)$/i.test(f.url) ? f.url : null,
        icon: mapIcon(f.name),
    }));
});

// Open the file (you can replace with in-app preview)
function openAttachment(url: string) {
    window.open(url, '_blank');
}
function fanStyle(i: number, n: number) {
  // How wide the arc should be (degrees). More items → a bit wider, but capped.
  const minSpan = 50;   // tighter cluster for 2 items
  const maxSpan = 100;  // don't go too wide
  const span    = Math.min(maxSpan, minSpan + (n - 1) * 12);

  // Keep them centered above the button
  const center  = -90;
  const start   = center - span / 2;
  const end     = center + span / 2;

  // Radius in px (slightly increases with count, but capped)
  const baseR   = 44;
  const maxR    = 60;
  const r       = Math.min(maxR, baseR + (n - 1) * 3);

  // Compute position on arc
  const angle   = n <= 1 ? center : start + ((end - start) * (i / (n - 1)));
  const rad     = (angle * Math.PI) / 180;
  const tx      = Math.round(r * Math.cos(rad));
  const ty      = Math.round(r * Math.sin(rad)); // negative = up

  // Optional: tiny stagger for a nicer feel
  const delay   = `${i * 25}ms`;

  return {
    transform: showFan.value
      ? `translate(${tx}px, ${ty - 18}px) scale(1)`
      : `translate(0px, 0px) scale(0.6)`,
    opacity: showFan.value ? 1 : 0,
    transitionDelay: showFan.value ? delay : '0ms',
  } as const;
}


</script>

<style scoped>
/* Remove focus outlines from the editable area */
:deep(.ProseMirror),
:deep(.ProseMirror:focus) {
    outline: none !important;
}

.ProseMirror-focused {
    border: none !important;
    outline: none !important;
}

.editor-shell:focus,
.editor-shell:focus-visible {
    outline: none !important;
}

/* Fan-out transitions; we animate from the trigger button center */
.fan-enter-from,
.fan-leave-to {
    opacity: 0;
    transform: translate(0, 0) scale(0.6);
}

.fan-enter-active,
.fan-leave-active {
    transition: opacity 180ms ease, transform 220ms cubic-bezier(.2, .7, .2, 1.1);
}

.fan-enter-to,
.fan-leave-from {
    opacity: 1;
    transform: translate(var(--tx), var(--ty)) scale(1);
}

/* When shown (computed style sets --tx/--ty), keep them at final positions */
.fan-move {
    transition: transform 220ms ease;
}
/* Smoothly animate to/from their arc positions */
.fan-pill {
  transition: transform 220ms cubic-bezier(.2,.7,.2,1.05), opacity 160ms ease;
  /* optional: subtle stacking so they don't visually merge */
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
}

/* (Your existing outline resets remain) */
</style>