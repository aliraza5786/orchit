<script setup lang="ts">
import { computed, ref, onUnmounted, nextTick, watch } from "vue";
import { useReleaseNotes } from "../queries/useReleaseNotes"; 

// Fetch release notes
const { data: releaseNotes, isLoading } = useReleaseNotes();

const activeNoteId = ref<string | null>(null);

// Validate data
const validNotes = computed(() => {
  if (!releaseNotes.value) return [];
  return Array.isArray(releaseNotes.value)
    ? releaseNotes.value.filter((n: any) => n && n._id)
    : [];
});

// Group notes by major version
const groupedNotes = computed(() => {
  const groups: Record<string, any[]> = {};
  
  validNotes.value.forEach((note: any) => {
    const version = note.major_version || 'undefined';
    if (!groups[version]) {
      groups[version] = [];
    }
    groups[version].push(note);
  });
  
  // Sort keys if needed (e.g. desc version)
  // return Object.keys(groups).sort().reverse().reduce... 
  // For now returning generic object, vue v-for iterates keys
  return groups;
});

// Intersection Observer for Scrollspy
let observer: IntersectionObserver | null = null;
const isManualScrolling = ref(false);

const setupObserver = () => {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      if (isManualScrolling.value) return;

      const visibleEntry = entries.find((entry) => entry.isIntersecting);
      if (visibleEntry) {
        activeNoteId.value = visibleEntry.target.id;
      }
    },
    {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    }
  );

  validNotes.value.forEach((note) => {
    const el = document.getElementById(note._id);
    if (el) observer?.observe(el);
  });
};

watch(
  validNotes,
  () => {
    nextTick(() => {
      setupObserver();
      if (validNotes.value.length > 0 && !activeNoteId.value) {
        activeNoteId.value = validNotes.value[0]._id;
      }
    });
  },
  { immediate: true, deep: true }
);

onUnmounted(() => {
  if (observer) observer.disconnect();
});

const scrollToNote = (id: string) => {
  activeNoteId.value = id;
  const element = document.getElementById(id);
  if (element) {
    isManualScrolling.value = true;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      isManualScrolling.value = false;
    }, 1000);
  }
};
</script>

<template>
  <div class="py-[40px] lg:py-[80px] px-[15px] w-full float-end release_note_content">
    <div class="custom_container">
      <div class="release-notes-container flex flex-col md:flex-row gap-8">
        <!-- Sidebar (Left) -->
        <aside class="sm:w-[180px] shrink-0">
          <div class="sticky top-5">
            <h2
              class="text-3xl block mb-5 sm:hidden font-bold text-text-primary"
            >
              Release notes for Current Channel
            </h2>
            <p class="block sm:hidden mb-4">
              These release notes outline new features, improvements, and
              non-security updates delivered as part of recent platform updates.
              Features may be introduced progressively to ensure system
              stability and optimal performance.
            </p>
            <span class="text-xl font-bold mb-6 text-text-primary block">
              In this article
            </span>
            <nav class="flex flex-col gap-6 pl-2">
              <!-- Group by Major Version -->
              <div v-for="(notes, version) in groupedNotes" :key="version">
                <!-- Version Header -->
                <h5 
                  class="font-bold text-base mb-2 transition-colors"
                  :class="notes.some((n: any) => n._id === activeNoteId) ? 'text-accent' : 'text-text-primary'"
                >
                  {{ version !== 'undefined' ? `Version${version}` : 'Other' }}
                </h5>
                
                <!-- Notes in this version -->
                <div class="flex flex-col gap-1 border-l-2 border-border-input pl-4 ml-1">
                  <button
                    v-for="note in notes"
                    :key="note._id"
                    @click="scrollToNote(note._id)"
                    class="text-left cursor-pointer py-1 text-sm font-medium transition-colors border-l-2 -ml-[18px] pl-4"
                    :class="[
                      activeNoteId === note._id
                        ? 'border-accent text-accent'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-text-secondary',
                    ]"
                  >
                   {{ note.release_note_version || note.title }}
                  </button>
                </div>
              </div>

              <div
                v-if="isLoading"
                class="text-text-secondary text-sm"
              >
                Loading...
              </div>
              <div
                v-if="!isLoading && validNotes.length === 0"
                class="text-text-secondary text-sm"
              >
                No release notes found.
              </div>
            </nav>
          </div>
        </aside>

        <!-- Main Content (Right) -->
        <main class="min-w-0 flex-1">
          <div v-if="isLoading" class="space-y-8">
            <div v-for="i in 3" :key="i" class="animate-pulse">
              <div
                class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"
              ></div>
              <div
                class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"
              ></div>
            </div>
          </div>

          <div
            v-else-if="!isLoading && validNotes.length === 0"
            class="flex flex-col items-center justify-center py-20"
          >
            <p class="text-lg text-text-secondary">
              No release notes available at the moment.
            </p>
          </div>

          <div v-else class="space-y-16">
            <h2
              class="text-3xl hidden sm:block mb-5 font-bold text-text-primary"
            >
              Release notes for Current Channel
            </h2>
            <p class="hidden sm:block mb-4">
              These release notes outline new features, improvements, and
              non-security updates delivered as part of recent platform updates.
              Features may be introduced progressively to ensure system
              stability and optimal performance.
            </p>
            <article
              v-for="note in validNotes"
              :key="note._id"
              :id="note._id"
              class="scroll-mt-24 border-b border-border-input pb-12 last:border-0"
            >
              <header class="mb-6">
                <div
                  class="flex items-center gap-3 text-sm text-text-secondary mb-3"
                >
                  <span v-if="note.created_at">
                    {{
                      new Date(note.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    }}
                  </span>
                  <!-- <span
                    v-if="note.major_version"
                    class="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-semibold"
                  >
                    v{{ note.major_version }}
                  </span> -->
                </div>
                <h3 >
                  {{ note.title }}
                </h3>
              </header>

              <div
                class="release_note_content prose dark:prose-invert max-w-none text-text-secondary"
                v-html="note.description"
              ></div>
            </article>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles for the blog content if needed, but using shared prose classes is better */
.release_note_content :deep(h1) {
  font-size: 36px !important;
  margin: 15px 0px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 40px !important;
}
.release_note_content :deep(h2) {
  font-size: 36px;
  margin: 15px 0px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 40px !important;
}
.release_note_content :deep(h3) {
  font-size: 32px;
  margin: 15px 0px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 40px !important;
}
.release_note_content :deep(h4) {
  font-size: 20px;
  margin: 10px 0px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 28px !important;
}
.release_note_content :deep(p) {
 font-size: 16px;
  line-height: 24px;
  margin-bottom: 10px;
  font-weight: 400;
  font-family: manrope;
  color: var(--color-text-secondary);
}
 
.release_note_content :deep(ul),
.release_note_content :deep(ol) {
   font-size: 16px;
  line-height: 24px; 
  font-weight: 400;
  font-family: manrope;
  color: var(--color-text-secondary);
}

@media(max-width:1024px) {
  .release_note_content :deep(h1),  .release_note_content :deep(h2) {
    font-size: 24px;
    line-height: 32px;
  }

 .release_note_content :deep(h3){
    font-size: 22px;
    line-height: 28px;
    margin: 10px 0px;
  }

 .release_note_content :deep(h4) {
    font-size: 18px;
    line-height: 26px;
  }
}

@media(max-width:768px) {
 .release_note_content :deep(p) {
    font-size: 14px;
    line-height: 20px;
    margin-bottom: 10px;
    color: var(--color-text-secondary);
  }

}
</style>
