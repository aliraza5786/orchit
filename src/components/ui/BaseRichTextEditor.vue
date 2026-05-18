<template>
  <div class="w-full rich-text-editor" :class="theme === 'dark' ? 'dark' : ''">
    <label
      v-if="label"
      :class="[
        'block text-base font-medium mb-2',
        theme === 'dark' ? 'text-white' : 'text-text-primary',
      ]"
    >
      {{ label }}
    </label>

    <div
      :class="[
        'rounded-lg border flex flex-col cursor-text overflow-hidden',
        theme === 'dark'
          ? 'bg-[#131318] border-border text-white'
          : 'bg-bg-input border-border text-text-primary',
      ]"
      @mousedown="focusEditor"
    >
      <!-- ── Toolbar (TOP — Jira style) ─────────────────────────────── -->
      <div
        data-editor-toolbar
        :class="[
          'border-b px-2 py-1.5 flex items-center flex-wrap gap-0.5 text-sm shrink-0',
          theme === 'dark'
            ? 'border-border bg-[#0D0D10] text-text-secondary'
            : 'border-border bg-bg-body text-text-primary',
        ]"
      >
        <!-- Text type -->
        <select
          v-model="textType"
          @change="setTextType"
          :class="[
            'text-xs bg-transparent focus:outline-none rounded px-1.5 py-1 text-text-secondary hover:bg-orchit-white/8 transition mr-1 border-0 cursor-pointer',
          ]"
        >
          <option value="paragraph">Normal</option>
          <option value="heading1">H1</option>
          <option value="heading2">H2</option>
        </select>

        <!-- Divider -->
        <span class="w-px h-4 bg-border mx-1 shrink-0"></span>

        <!-- Formatting -->
        <button
          @click.prevent="editor.chain().focus().toggleBold().run()"
          :class="[btnClass, editor.isActive('bold') ? activeBtnClass : '']"
          title="Bold"
        >
          <strong class="text-[13px]">B</strong>
        </button>
        <button
          @click.prevent="editor.chain().focus().toggleItalic().run()"
          :class="[btnClass, editor.isActive('italic') ? activeBtnClass : '']"
          title="Italic"
        >
          <em class="text-[13px]">I</em>
        </button>
        <button
          @click.prevent="editor.chain().focus().toggleStrike().run()"
          :class="[btnClass, editor.isActive('strike') ? activeBtnClass : '']"
          title="Strikethrough"
        >
          <s class="text-[13px]">S</s>
        </button>
        <button
          @click.prevent="editor.chain().focus().toggleCode().run()"
          :class="[btnClass, editor.isActive('code') ? activeBtnClass : '']"
          title="Inline code"
        >
          <span class="text-[12px] font-mono">`</span>
        </button>

        <!-- Divider -->
        <span class="w-px h-4 bg-border mx-1 shrink-0"></span>

        <!-- Lists -->
        <button
          @click.prevent="editor.chain().focus().toggleBulletList().run()"
          :class="[
            btnClass,
            editor.isActive('bulletList') ? activeBtnClass : '',
          ]"
          title="Bullet list"
        >
          <i class="fa-solid fa-list text-[11px]"></i>
        </button>
        <button
          @click.prevent="editor.chain().focus().toggleOrderedList().run()"
          :class="[
            btnClass,
            editor.isActive('orderedList') ? activeBtnClass : '',
          ]"
          title="Numbered list"
        >
          <i class="fa-solid fa-list-ol text-[11px]"></i>
        </button>
        <button
          @click.prevent="editor.chain().focus().toggleCodeBlock().run()"
          :class="[
            btnClass,
            editor.isActive('codeBlock') ? activeBtnClass : '',
          ]"
          title="Code block"
        >
          <i class="fa-solid fa-code text-[11px]"></i>
        </button>
        <button
          @click.prevent="editor.chain().focus().toggleBlockquote().run()"
          :class="[
            btnClass,
            editor.isActive('blockquote') ? activeBtnClass : '',
          ]"
          title="Quote"
        >
          <i class="fa-solid fa-quote-left text-[11px]"></i>
        </button>

        <!-- Divider -->
        <span class="w-px h-4 bg-border mx-1 shrink-0"></span>

        <!-- Link -->
        <button
          @click.prevent="openLinkPanel"
          :class="[btnClass, editor.isActive('link') ? activeBtnClass : '']"
          title="Add link"
        >
          <i class="fa-solid fa-link text-[11px]"></i>
        </button>

        <!-- Image -->
        <button
          type="button"
          @click="triggerImagePicker"
          :class="btnClass"
          title="Insert image"
          :disabled="uploadingImages.length > 0"
        >
          <i
            v-if="uploadingImages.length > 0"
            class="fa-solid fa-spinner animate-spin text-[11px]"
          ></i>
          <i v-else class="fa-regular fa-image text-[11px]"></i>
        </button>
        <input
          ref="imageInput"
          type="file"
          class="hidden"
          accept="image/*"
          multiple
          @change="handleImageUpload"
        />

        <!-- Attachment -->
        <button
          type="button"
          @click="triggerFilePicker"
          :class="btnClass"
          title="Attach file"
        >
          <i class="fa-solid fa-paperclip text-[11px]"></i>
        </button>
        <input
          ref="fileInput"
          type="file"
          class="hidden"
          multiple
          @change="handleFileUpload"
        />

        <!-- Divider -->
        <span class="w-px h-4 bg-border mx-1 shrink-0"></span>

        <!-- Undo/Redo -->
        <button
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          :class="btnClass"
          title="Undo"
        >
          <i class="fa-solid fa-rotate-left text-[11px]"></i>
        </button>
        <button
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          :class="btnClass"
          title="Redo"
        >
          <i class="fa-solid fa-rotate-right text-[11px]"></i>
        </button>
      </div>

      <!-- ── Content area ────────────────────────────────────────────── -->
      <EditorContent
        :placeholder="placeholder"
        :editor="editor"
        @click="handleEditorClick"
        :class="[
          'min-h-[150px] max-h-[400px] overflow-y-auto px-4 py-3 editor-shell',
          theme === 'dark' ? 'text-white' : 'text-text-primary',
        ]"
      />

      <!-- Upload skeletons -->
      <div
        v-if="uploadingImages.length > 0"
        class="px-4 pb-3 flex flex-wrap gap-2"
      >
        <div
          v-for="item in uploadingImages"
          :key="item.id"
          class="image-skeleton rounded-xl overflow-hidden border border-border relative"
          style="width: 120px; height: 90px"
        >
          <div class="skeleton-shimmer w-full h-full"></div>
          <div
            class="absolute inset-0 flex flex-col items-center justify-center gap-1"
          >
            <i
              class="fa-solid fa-spinner animate-spin text-text-secondary text-base"
            ></i>
            <span class="text-[10px] text-text-secondary">Uploading…</span>
          </div>
        </div>
      </div>

      <!-- ── File/image preview strip ───────────────────────────────── -->
      <div
        v-if="filePreviews.length > 0"
        class="border-t px-3 py-2 flex flex-wrap gap-2 bg-bg-body border-border"
      >
        <div
          v-for="(f, idx) in filePreviews"
          :key="idx"
          class="file-chip group flex items-center gap-2 rounded-lg border border-border px-2 py-1.5 cursor-pointer hover:border-accent/60 transition-all bg-bg-surface hover:bg-bg-card"
          @click="openAttachment(f.url)"
          :title="f.name"
        >
          <div
            v-if="isImageFile(f)"
            class="w-9 h-9 rounded-md overflow-hidden shrink-0 border border-border"
          >
            <img
              :src="f.url"
              :alt="f.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div
            v-else
            class="w-9 h-9 rounded-md flex items-center justify-center shrink-0 border border-border"
            :class="theme === 'dark' ? 'bg-[#131318]' : 'bg-bg-input'"
          >
            <i
              :class="[fileIcon(f.name), fileIconColor(f.name), 'text-[18px]']"
            ></i>
          </div>
          <div class="flex flex-col min-w-0" style="max-width: 120px">
            <span
              class="text-[12px] font-medium text-text-primary truncate leading-tight"
              >{{ f.name }}</span
            >
            <span
              class="text-[10px] text-text-secondary uppercase tracking-wide leading-tight mt-0.5"
              >{{ fileExt(f.name) }}</span
            >
          </div>
          <button
            type="button"
            class="w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-text-secondary hover:text-red-400 shrink-0 ml-1"
            @click.stop="removeFilePreview(idx)"
            title="Remove"
          >
            <i class="fa-solid fa-times text-[10px]"></i>
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Link Dialog -->
  <LinkDialog
    v-model="showLinkDialog"
    :initial-href="linkDraft.href"
    :initial-text="linkDraft.text"
    :initial-new-tab="linkDraft.newTab"
    @insert="insertLink"
  />

  <!-- Cinema Lightbox Slider Modal -->
  <Teleport to="body">
    <transition name="lightbox-fade">
      <div
        v-if="isLightboxOpen"
        class="fixed inset-0 z-[10000] bg-bg-body/95 backdrop-blur-md flex flex-col items-center justify-center select-none cursor-zoom-out transition-colors duration-300"
        @click="closeLightbox"
      >
        <!-- Top Header Bar -->
        <div
          class="absolute top-0 left-0 right-0 h-16 px-6 flex items-center justify-between z-20 cursor-default bg-bg-surface/10 border-b border-border/10 backdrop-blur-xs"
          @click.stop
        >
          <span class="text-sm font-semibold tracking-wide text-text-primary">
            Image Preview ({{ currentLightboxIndex + 1 }} of
            {{ lightboxImages.length }})
          </span>
          <button
            type="button"
            class="w-10 h-10 rounded-full active:scale-95 text-text-primary flex items-center justify-center transition-all cursor-pointer"
            @click="closeLightbox"
            title="Close (Esc)"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        <!-- Main Container (Image & Nav Buttons) -->
        <div
          class="w-full h-full flex items-center justify-center relative px-4 md:px-24"
        >
          <!-- Left Arrow button -->
          <button
            type="button"
            class="absolute left-4 md:left-8 z-10 w-11 h-11 rounded-full active:scale-95 border border-primary-color bg-primary-color text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-lg animate-fade-in hover:brightness-110"
            :disabled="currentLightboxIndex === 0"
            @click.stop="prevLightboxImage"
            title="Previous (Left Arrow)"
          >
            <i class="fa-solid fa-chevron-left text-base"></i>
          </button>

          <!-- Active Image Wrapper -->
          <div
            class="max-w-[92vw] max-h-[80vh] md:max-h-[85vh] flex items-center justify-center overflow-hidden z-0"
            @click.stop
          >
            <img
              :src="lightboxImages[currentLightboxIndex]"
              class="max-w-full max-h-[80vh] md:max-h-[85vh] object-contain rounded-lg transition-all duration-300 transform scale-100 cursor-default border border-border shadow-[0_25px_60px_rgba(0,0,0,0.25)] bg-bg-surface"
              @click.stop
              alt="Lightbox image"
            />
          </div>

          <!-- Right Arrow button -->
          <button
            type="button"
            class="absolute right-4 md:right-8 z-10 w-11 h-11 rounded-full active:scale-95 border border-primary-color bg-primary-color text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-lg animate-fade-in hover:brightness-110"
            :disabled="currentLightboxIndex === lightboxImages.length - 1"
            @click.stop="nextLightboxImage"
            title="Next (Right Arrow)"
          >
            <i class="fa-solid fa-chevron-right text-base"></i>
          </button>
        </div>

        <!-- Keyboard guide / Tip at bottom -->
        <div
          class="absolute bottom-6 border border-border bg-bg-surface text-text-secondary text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-xs z-10 cursor-default"
          @click.stop
        >
          <span
            class="px-1.5 py-0.5 rounded text-[9px] font-mono border border-border bg-bg-body text-text-primary shadow-xs"
            >ESC</span
          >
          Close
          <span class="text-text-secondary/20">|</span>
          <span
            class="px-1.5 py-0.5 rounded text-[9px] font-mono border border-border bg-bg-body text-text-primary shadow-xs"
            >←</span
          >
          Previous
          <span class="text-text-secondary/20">|</span>
          <span
            class="px-1.5 py-0.5 rounded text-[9px] font-mono border border-border bg-bg-body text-text-primary shadow-xs"
            >→</span
          >
          Next
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import { Editor, EditorContent } from "@tiptap/vue-3";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { uploadPrivateFile } from "../../queries/useCommon";
import LinkDialog from "./LinkDialog.vue";

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    theme?: "light" | "dark";
    inSpace?: boolean;
  }>(),
  { theme: "light", inSpace: false },
);

const emit = defineEmits(["update:modelValue", "focusOut"]);

const imageInput = ref<HTMLInputElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const filePreviews = ref<{ name: string; url: string }[]>([]);

// ─── Upload skeleton tracking ─────────────────────────────────────────────────
const uploadingImages = ref<{ id: string }[]>([]);

function addUploadingPlaceholder(): string {
  const id = `upload-${Date.now()}-${Math.random()}`;
  uploadingImages.value = [...uploadingImages.value, { id }];
  return id;
}

function removeUploadingPlaceholder(id: string) {
  uploadingImages.value = uploadingImages.value.filter((u) => u.id !== id);
}

// ─── Editor setup ─────────────────────────────────────────────────────────────
const editor = new Editor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: true,
      autolink: true,
      linkOnPaste: true,
      HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      validate: (href) => validateUrl(href),
    }),
    Image.configure({
      inline: true,
      allowBase64: false,
      HTMLAttributes: {
        class: "editor-image",
      },
    }),
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML();
    emit("update:modelValue", html);
    syncPreviewsFromHtml(html);
  },
  onBlur: () => emit("focusOut", filePreviews.value),
  editorProps: {
    handlePaste(view, event) {
      const files = Array.from(event.clipboardData?.files || []);
      if (files.length > 0) {
        event.preventDefault();
        files.forEach((file) => {
          const pid = addUploadingPlaceholder();
          const fd = new FormData();
          fd.append("file", file);
          runUpload(
            fd,
            (resp: any) => {
              const url = resp?.data?.url;
              const name = resp?.data?.name || file.name;
              removeUploadingPlaceholder(pid);
              if (url) {
                if (file.type.startsWith("image/")) {
                  insertImageIntoEditor(url, name);
                } else {
                  const ext = (name.split(".").pop() || "").toLowerCase();
                  insertFileAttachmentIntoEditor(url, name, ext);
                }
              }
            },
            () => removeUploadingPlaceholder(pid),
          );
        });
        return true;
      }

      const items = Array.from(event.clipboardData?.items || []);
      const imageItems = items.filter((item) => item.type.startsWith("image"));
      if (imageItems.length > 0) {
        event.preventDefault();
        imageItems.forEach((item) => {
          const file = item.getAsFile();
          if (file) {
            const pid = addUploadingPlaceholder();
            const fd = new FormData();
            fd.append("file", file);
            runUpload(
              fd,
              (resp: any) => {
                const url = resp?.data?.url;
                const name = resp?.data?.name || file.name;
                removeUploadingPlaceholder(pid);
                if (url) {
                  insertImageIntoEditor(url, name);
                }
              },
              () => removeUploadingPlaceholder(pid),
            );
          }
        });
        return true;
      }
      return false;
    },
    handleDrop(view, event) {
      const files = Array.from(event.dataTransfer?.files || []);
      const imageFiles = files.filter((file) => file.type.startsWith("image"));
      if (imageFiles.length > 0) {
        event.preventDefault();
        imageFiles.forEach((file) => {
          const pid = addUploadingPlaceholder();
          const fd = new FormData();
          fd.append("file", file);
          runUpload(
            fd,
            (resp: any) => {
              const url = resp?.data?.url;
              const name = resp?.data?.name || file.name;
              removeUploadingPlaceholder(pid);
              if (url) {
                const coords = view.posAtCoords({
                  left: event.clientX,
                  top: event.clientY,
                });
                if (coords) {
                  editor
                    .chain()
                    .setTextSelection(coords.pos)
                    .insertContent(
                      `<p><img src="${url}" alt="${name}" class="editor-image" /></p><p></p>`,
                    )
                    .run();
                } else {
                  insertImageIntoEditor(url, name);
                }
              }
            },
            () => removeUploadingPlaceholder(pid),
          );
        });
        return true;
      }
      return false;
    },
  },
});

// ─── Insert image at end of editor ────────────────────────────────────────────
function insertImageIntoEditor(url: string, name: string) {
  const endPos = editor.state.doc.content.size;
  editor
    .chain()
    .setTextSelection(endPos)
    .insertContent(
      `<p><img src="${url}" alt="${name}" class="editor-image" /></p><p></p>`,
    )
    .run();
}

// ─── Insert non-image file attachment into editor ──────────────────────────────
function insertFileAttachmentIntoEditor(
  url: string,
  name: string,
  ext: string,
) {
  // Pick an emoji icon by extension so it renders in plain HTML (no CSS dependency)
  const iconMap: Record<string, string> = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    xls: "📊",
    xlsx: "📊",
    csv: "📊",
    ppt: "📑",
    pptx: "📑",
    zip: "🗜️",
    rar: "🗜️",
    "7z": "🗜️",
    txt: "📃",
    md: "📃",
    mp4: "🎬",
    mov: "🎬",
    avi: "🎬",
    webm: "🎬",
    mp3: "🎵",
    wav: "🎵",
    ogg: "🎵",
  };
  const icon = iconMap[ext] || "📎";
  const endPos = editor.state.doc.content.size;
  editor
    .chain()
    .setTextSelection(endPos)
    .insertContent(
      `<p><a href="${url}" target="_blank" rel="noopener noreferrer" class="file-attachment-link" data-ext="${ext}">${icon}&nbsp;${name}</a></p>`,
    )
    .run();
}

// ─── Text type ────────────────────────────────────────────────────────────────
const textType = ref<"paragraph" | "heading1" | "heading2">("paragraph");
function setTextType() {
  if (textType.value === "heading1")
    editor.chain().focus().setHeading({ level: 1 }).run();
  else if (textType.value === "heading2")
    editor.chain().focus().setHeading({ level: 2 }).run();
  else editor.chain().focus().setParagraph().run();
}

// Use the raw async function directly so multiple parallel uploads
// all complete independently — useMutation is single-slot and
// cancels previous callbacks when called concurrently.
async function runUpload(
  fd: FormData,
  onSuccess: (resp: any) => void,
  onError?: () => void,
) {
  try {
    const resp = await uploadPrivateFile(fd);
    onSuccess(resp);
  } catch {
    onError?.();
  }
}

// ─── Image upload (toolbar button) ────────────────────────────────────────────
function handleImageUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;

  Array.from(files).forEach((file) => {
    const pid = addUploadingPlaceholder();
    const fd = new FormData();
    fd.append("file", file);
    runUpload(
      fd,
      (resp: any) => {
        const url = resp?.data?.url;
        const name = resp?.data?.name || file.name;
        removeUploadingPlaceholder(pid);
        if (url) {
          insertImageIntoEditor(url, name);
        }
      },
      () => removeUploadingPlaceholder(pid),
    );
  });

  // Allow re-selecting the same file
  if (imageInput.value) imageInput.value.value = "";
}

// ─── File upload (non-image attachments) ──────────────────────────────────────
function handleFileUpload(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (!files) return;
  Array.from(files).forEach((file) => {
    const pid = addUploadingPlaceholder();
    const fd = new FormData();
    fd.append("file", file);
    runUpload(
      fd,
      (resp: any) => {
        const url = resp?.data?.url;
        const name = resp?.data?.name || file.name;
        const ext = (name.split(".").pop() || "").toLowerCase();
        removeUploadingPlaceholder(pid);
        if (url) {
          // Insert into editor so it's saved with the description
          insertFileAttachmentIntoEditor(url, name, ext);
        }
      },
      () => removeUploadingPlaceholder(pid),
    );
  });
  if (fileInput.value) fileInput.value.value = "";
}

function triggerImagePicker() {
  imageInput?.value?.click();
}
function triggerFilePicker() {
  fileInput?.value?.click();
}

// ─── Sync content ─────────────────────────────────────────────────────────────
watch(
  () => props.modelValue,
  (val) => {
    if (val !== editor.getHTML()) {
      editor.commands.setContent(val || "", false);
      syncPreviewsFromHtml(val || "");
    }
  },
  { immediate: true },
);

// ─── Cinema Lightbox Slider Logic ─────────────────────────────────────────────
const isLightboxOpen = ref(false);
const lightboxImages = ref<string[]>([]);
const currentLightboxIndex = ref(0);

function handleEditorClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (target && target.tagName === "IMG") {
    const src = target.getAttribute("src");
    if (!src) return;

    // Extract all images in the editor content
    const html = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const imgs = Array.from(doc.querySelectorAll("img"));
    const urls = imgs
      .map((img) => img.getAttribute("src"))
      .filter(Boolean) as string[];

    if (urls.length > 0) {
      lightboxImages.value = urls;
      const idx = urls.indexOf(src);
      currentLightboxIndex.value = idx !== -1 ? idx : 0;
      isLightboxOpen.value = true;

      // Add escape/arrow key listener
      window.addEventListener("keydown", handleLightboxKeydown);
    }
  }
}

function closeLightbox() {
  isLightboxOpen.value = false;
  window.removeEventListener("keydown", handleLightboxKeydown);
}

function prevLightboxImage() {
  if (currentLightboxIndex.value > 0) {
    currentLightboxIndex.value--;
  }
}

function nextLightboxImage() {
  if (currentLightboxIndex.value < lightboxImages.value.length - 1) {
    currentLightboxIndex.value++;
  }
}

function handleLightboxKeydown(e: KeyboardEvent) {
  if (!isLightboxOpen.value) return;
  if (e.key === "Escape") {
    closeLightbox();
  } else if (e.key === "ArrowLeft") {
    prevLightboxImage();
  } else if (e.key === "ArrowRight") {
    nextLightboxImage();
  }
}

onBeforeUnmount(() => {
  editor.destroy();
  window.removeEventListener("keydown", handleLightboxKeydown);
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const btnClass = computed(() =>
  [
    "px-2 py-1 rounded-md border text-sm transition",
    "disabled:opacity-40 disabled:cursor-not-allowed",
    props.theme === "dark"
      ? "border-border text-text-secondary hover:bg-[#1a1a1f]"
      : "border-border text-text-primary hover:bg-accent-hover",
  ].join(" "),
);
const activeBtnClass = computed(() =>
  props.theme === "dark" ? "bg-[#2B2C30] text-white" : "bg-accent text-white",
);

// ─── URL validation ───────────────────────────────────────────────────────────
function validateUrl(href: string) {
  try {
    if (!href) return false;
    if (/^(mailto:|tel:|#|\/)/i.test(href)) return true;
    const u = new URL(/^[a-z]+:\/\//i.test(href) ? href : `https://${href}`);
    return !!u.host;
  } catch {
    return false;
  }
}

// ─── Link dialog ──────────────────────────────────────────────────────────────
const showLinkDialog = ref(false);
const linkDraft = ref<{ href?: string; text?: string; newTab?: boolean }>({});

function openLinkPanel() {
  const attrs = editor.getAttributes("link") || {};
  const { from, to } = editor.state.selection;
  const selectedText = editor.state.doc.textBetween(from, to) || "";
  const newTab = attrs.target == null ? true : attrs.target === "_blank";
  linkDraft.value = {
    href: attrs.href || "",
    text: selectedText || "",
    newTab,
  };
  showLinkDialog.value = true;
}

function insertLink({
  href,
  text,
  newTab,
}: {
  href: string;
  text?: string;
  newTab: boolean;
}) {
  const target = newTab ? "_blank" : null;
  const rel = newTab ? "noopener noreferrer nofollow" : null;
  const { from, to } = editor.state.selection;
  const hasSelection = from !== to;
  const label = text && text.length ? text : hasSelection ? undefined : href;

  if (!hasSelection && label) {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "text",
        text: label,
        marks: [{ type: "link", attrs: { href, target, rel } }],
      })
      .run();
  } else {
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href, target, rel })
      .run();
  }
}

// ─── Focus helper ─────────────────────────────────────────────────────────────
function focusEditor(e?: MouseEvent) {
  const target = e?.target as HTMLElement | undefined;
  if (target && target.closest("[data-editor-toolbar]")) return;
  editor?.commands.focus();
}

// ─── Professional file preview helpers ───────────────────────────────────────
function isImageFile(f: { name: string; url: string }): boolean {
  return (
    /\.(png|jpe?g|gif|webp|svg)$/i.test(f.url) ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(f.name)
  );
}

function fileExt(name: string): string {
  return (name.split(".").pop() || "file").toLowerCase();
}

function fileIcon(name: string): string {
  const ext = fileExt(name);
  if (["pdf"].includes(ext)) return "fa-regular fa-file-pdf";
  if (["doc", "docx"].includes(ext)) return "fa-regular fa-file-word";
  if (["xls", "xlsx", "csv"].includes(ext)) return "fa-regular fa-file-excel";
  if (["ppt", "pptx"].includes(ext)) return "fa-regular fa-file-powerpoint";
  if (["zip", "rar", "7z"].includes(ext)) return "fa-regular fa-file-zipper";
  if (["txt", "md"].includes(ext)) return "fa-regular fa-file-lines";
  if (["mp4", "mov", "avi", "webm"].includes(ext))
    return "fa-regular fa-file-video";
  if (["mp3", "wav", "ogg"].includes(ext)) return "fa-regular fa-file-audio";
  return "fa-regular fa-file";
}

function fileIconColor(name: string): string {
  const ext = fileExt(name);
  if (["pdf"].includes(ext)) return "text-red-500";
  if (["doc", "docx"].includes(ext)) return "text-blue-500";
  if (["xls", "xlsx", "csv"].includes(ext)) return "text-green-500";
  if (["ppt", "pptx"].includes(ext)) return "text-orange-500";
  if (["zip", "rar", "7z"].includes(ext)) return "text-amber-500";
  if (["mp4", "mov", "avi", "webm"].includes(ext)) return "text-purple-500";
  if (["mp3", "wav", "ogg"].includes(ext)) return "text-pink-500";
  return "text-text-secondary";
}

function syncPreviewsFromHtml(html: string) {
  if (!html) {
    filePreviews.value = [];
    return;
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const newPreviews: { name: string; url: string }[] = [];

  // Parse images
  doc.querySelectorAll("img").forEach((img) => {
    const url = img.getAttribute("src");
    if (url) {
      const name =
        img.getAttribute("alt") || url.split("/").pop() || "image.png";
      newPreviews.push({ name, url });
    }
  });

  // Parse file attachment links
  doc.querySelectorAll("a.file-attachment-link").forEach((a) => {
    const url = a.getAttribute("href");
    if (url) {
      let name = a.textContent?.trim() || "file";
      // Strip leading emoji if any
      name = name.replace(/^[\p{Emoji}\s&nbsp;]+/u, "").trim();
      newPreviews.push({ name, url });
    }
  });

  filePreviews.value = newPreviews;
}

function removeFilePreview(idx: number) {
  const fileToRemove = filePreviews.value[idx];
  filePreviews.value = filePreviews.value.filter((_, i) => i !== idx);

  if (fileToRemove) {
    const html = editor.getHTML();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    let changed = false;

    // Remove img tags with this src
    doc.querySelectorAll(`img[src="${fileToRemove.url}"]`).forEach((img) => {
      img.remove();
      changed = true;
    });

    // Remove a tags with this href
    doc.querySelectorAll(`a[href="${fileToRemove.url}"]`).forEach((a) => {
      const parent = a.parentElement;
      if (
        parent &&
        parent.tagName === "P" &&
        parent.children.length === 1 &&
        parent.firstChild === a
      ) {
        parent.remove();
      } else {
        a.remove();
      }
      changed = true;
    });

    if (changed) {
      const newHtml = doc.body.innerHTML;
      editor.commands.setContent(newHtml, true);
      emit("update:modelValue", newHtml);
    }
  }
}

function openAttachment(url: string) {
  window.open(url, "_blank");
}
</script>

<style scoped>
/* ─── Base editor ────────────────────────────────────────────────────────────── */
:deep(.ProseMirror),
:deep(.ProseMirror:focus) {
  outline: none !important;
  min-height: 150px;
  padding-bottom: 50px;
}

/* ─── Image block styling ────────────────────────────────────────────────────── */
:deep(.ProseMirror img.editor-image),
:deep(.ProseMirror img) {
  display: inline-block;
  vertical-align: bottom;
  max-width: min(100%, 480px);
  width: auto;
  height: auto;
  margin: 12px 10px;
  border-radius: 10px;
  box-shadow:
    0 2px 12px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.07);
  background: #f5f5f5;
  transition:
    box-shadow 0.2s ease,
    transform 0.15s ease;
  cursor: default;
  object-fit: contain;
}

:deep(.ProseMirror img.editor-image:hover),
:deep(.ProseMirror img:hover) {
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.13),
    0 2px 6px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

:deep(.ProseMirror img.ProseMirror-selectednode) {
  outline: 2px solid #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
  transform: none;
}

/* Dark theme */
.dark :deep(.ProseMirror img.editor-image),
.dark :deep(.ProseMirror img) {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 2px 16px rgba(0, 0, 0, 0.45),
    0 1px 4px rgba(0, 0, 0, 0.3);
  background: #1a1a1f;
}

/* ─── File attachment link (rendered in editor + v-html view mode) ───────────── */
:deep(.ProseMirror a.file-attachment-link),
:deep(a.file-attachment-link) {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.75rem;
  margin: 0.25rem 0;
  border-radius: 6px;
  font-size: 0.82rem;
  font-weight: 500;
  text-decoration: none !important;
  border: 1px solid rgba(124, 58, 237, 0.25);
  background: rgba(124, 58, 237, 0.07);
  color: #7c3aed;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  cursor: pointer;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.ProseMirror a.file-attachment-link:hover),
:deep(a.file-attachment-link:hover) {
  background: rgba(124, 58, 237, 0.14);
  border-color: rgba(124, 58, 237, 0.45);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.15);
}

/* Dark theme */
.dark :deep(.ProseMirror a.file-attachment-link),
.dark :deep(a.file-attachment-link) {
  background: rgba(124, 58, 237, 0.12);
  border-color: rgba(124, 58, 237, 0.3);
  color: #a78bfa;
}

.dark :deep(.ProseMirror a.file-attachment-link:hover),
.dark :deep(a.file-attachment-link:hover) {
  background: rgba(124, 58, 237, 0.22);
  border-color: rgba(124, 58, 237, 0.55);
}

/* ─── Upload skeleton ────────────────────────────────────────────────────────── */
.image-skeleton {
  background: var(--bg-surface, #f3f4f6);
  flex-shrink: 0;
}

.skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.04) 25%,
    rgba(0, 0, 0, 0.09) 50%,
    rgba(0, 0, 0, 0.04) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
}

.dark .skeleton-shimmer {
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04) 25%,
    rgba(255, 255, 255, 0.09) 50%,
    rgba(255, 255, 255, 0.04) 75%
  );
  background-size: 200% 100%;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ─── Gapcursor ──────────────────────────────────────────────────────────────── */
:deep(.ProseMirror-gapcursor) {
  display: none;
  pointer-events: none;
  position: absolute;
}
:deep(.ProseMirror-gapcursor:after) {
  content: "";
  display: block;
  position: absolute;
  top: 4px;
  left: 0;
  width: 2px;
  height: 20px;
  background-color: currentColor;
  animation: ProseMirror-cursor-blink 1.1s steps(2, start) infinite;
}
@keyframes ProseMirror-cursor-blink {
  to {
    visibility: hidden;
  }
}
:deep(.ProseMirror-focused .ProseMirror-gapcursor) {
  display: block;
}

/* Selected image border styling */
:deep(.ProseMirror img.ProseMirror-selectednode) {
  outline: 2px solid var(--primary-color, #7c3aed) !important;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.15);
}

.ProseMirror-focused {
  border: none !important;
  outline: none !important;
}

.editor-shell:focus,
.editor-shell:focus-visible {
  outline: none !important;
}

/* ─── File chip strip ────────────────────────────────────────────────────────── */
.file-chip {
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}
.file-chip:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* ─── Lightbox slide/fade transition ─────────────────────────────────────────── */
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}

/* ─── Toolbar button custom hover styles ──────────────────────────────────────── */
:deep([data-editor-toolbar] button:hover:not(:disabled)),
[data-editor-toolbar] button:hover:not(:disabled) {
  background-color: var(--primary-color) !important;
  color: #ffffff !important;
  border-color: var(--primary-color) !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15) !important;
}

:deep([data-editor-toolbar] button:hover:not(:disabled) *),
[data-editor-toolbar] button:hover:not(:disabled) * {
  color: #ffffff !important;
}
</style>
