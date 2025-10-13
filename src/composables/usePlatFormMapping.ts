// src/composables/usePlatformMapping.ts
import { computed, type Ref } from "vue";

export function usePlatformMapping(
  platforms: Ref<Array<{ _id: string; title: string }>|undefined>
) {
  const normalize = (s: string) => (s ?? "").trim().toLowerCase();

  const titleToId = computed(
    () => new Map((platforms.value || []).map(p => [normalize(p.title), p._id]))
  );
  const idToTitle = computed(
    () => new Map((platforms.value || []).map(p => [p._id, p.title]))
  );
  const officialTitleSet = computed(
    () => new Set((platforms.value || []).map(p => normalize(p.title)))
  );

  const isOfficial = (title: string) => officialTitleSet.value.has(normalize(title));

  return { normalize, titleToId, idToTitle, isOfficial };
}
