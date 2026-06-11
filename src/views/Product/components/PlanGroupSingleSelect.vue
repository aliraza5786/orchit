<template>
  <div class="space-y-2">
    <div class="text-xs uppercase tracking-wider text-text-secondary">
      Plan Group
    </div>

    <div v-if="isLoading" class="h-28 animate-pulse rounded-lg bg-orchit-white/10" />

    <div
      v-else
      class="rounded-lg border border-border overflow-hidden"
      :class="disabled ? 'opacity-60 pointer-events-none' : ''"
    >
      <!-- Selected summary -->
      <div
        class="px-3 py-2.5 text-sm border-b border-border bg-orchit-white/[0.03] flex items-center gap-2 min-h-[40px]"
      >
        <i
          class="fa-solid fa-layer-group text-primary-color/70 text-xs flex-shrink-0"
        />
        <span
          class="truncate flex-1 font-medium"
          :class="selectedLabel ? 'text-text-primary' : 'text-text-secondary'"
        >
          {{ selectedLabel || "No plan group selected" }}
        </span>
        <button
          v-if="modelValue"
          type="button"
          class="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-orchit-white/10 transition-colors"
          title="Clear selection"
          @click="selectItem(null)"
        >
          <i class="fa-solid fa-xmark text-xs" />
        </button>
      </div>

      <!-- None -->
      <button
        type="button"
        class="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm border-b border-border/60 transition-colors"
        :class="
          !modelValue
            ? 'bg-primary-color/10 text-primary-color'
            : 'hover:bg-orchit-white/5'
        "
        @click="selectItem(null)"
      >
        <span
          class="w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center"
          :class="!modelValue ? 'border-primary-color' : 'border-border'"
        >
          <span
            v-if="!modelValue"
            class="w-1.5 h-1.5 rounded-full bg-primary-color"
          />
        </span>
        <span>None</span>
      </button>

      <!-- Accordion groups -->
      <div class="max-h-64 sm:max-h-72 overflow-y-auto custom-scrollbar">
        <div
          v-for="group in planGroups"
          :key="group.id"
          class="border-b border-border/60 last:border-b-0"
        >
          <button
            type="button"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-orchit-white/5"
            @click="toggleSection(group.id)"
          >
            <i
              :class="[group.icon, 'text-xs opacity-70 w-4 text-center flex-shrink-0']"
            />
            <span class="flex-1 truncate">{{ group.title }}</span>
            <span
              v-if="group.items.length"
              class="text-[10px] text-text-secondary tabular-nums"
            >
              {{ group.items.length }}
            </span>
            <i
              class="fas fa-chevron-right text-[10px] text-text-secondary transition-transform duration-200 flex-shrink-0"
              :class="{ 'rotate-90': expandedSections.has(group.id) }"
            />
          </button>

          <div
            v-show="expandedSections.has(group.id)"
            class="pb-1 bg-orchit-white/[0.02]"
          >
            <p
              v-if="!group.items.length"
              class="px-3 py-3 text-xs text-text-secondary text-center"
            >
              No {{ group.title.toLowerCase() }} yet
            </p>

            <template v-for="item in group.items" :key="item._id">
              <!-- Parent / standalone row -->
              <div
                class="flex items-center gap-1 min-h-[36px] pr-2 transition-colors"
                :class="
                  modelValue === item._id
                    ? 'bg-primary-color/10 text-primary-color'
                    : 'hover:bg-orchit-white/5'
                "
              >
                <button
                  type="button"
                  class="flex flex-1 items-center gap-2.5 py-2 pl-3 text-left text-sm min-w-0"
                  @click="selectItem(item._id)"
                >
                  <span
                    class="w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center"
                    :class="
                      modelValue === item._id
                        ? 'border-primary-color'
                        : 'border-border'
                    "
                  >
                    <span
                      v-if="modelValue === item._id"
                      class="w-1.5 h-1.5 rounded-full bg-primary-color"
                    />
                  </span>
                  <span class="truncate font-medium">{{ item.title }}</span>
                </button>
                <button
                  v-if="hasChildren(item, group.id)"
                  type="button"
                  class="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-orchit-white/10 transition-colors"
                  :aria-label="`Expand ${item.title}`"
                  @click.stop="toggleItemExpand(item._id)"
                >
                  <i
                    class="fas fa-chevron-right text-[10px] transition-transform duration-200"
                    :class="{ 'rotate-90': expandedItems.has(item._id) }"
                  />
                </button>
                <span v-else class="w-8 flex-shrink-0" />
              </div>

              <!-- Children (level 1) -->
              <template v-if="expandedItems.has(item._id)">
                <template
                  v-for="child in getChildren(item, group.id)"
                  :key="child._id"
                >
                  <div
                    class="flex items-center gap-1 min-h-[34px] pr-2 transition-colors"
                    :class="
                      modelValue === child._id
                        ? 'bg-primary-color/10 text-primary-color'
                        : 'hover:bg-orchit-white/5'
                    "
                  >
                    <button
                      type="button"
                      class="flex flex-1 items-center gap-2.5 py-2 pl-5 text-left text-sm min-w-0"
                      @click="selectItem(child._id)"
                    >
                      <span
                        class="w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center"
                        :class="
                          modelValue === child._id
                            ? 'border-primary-color'
                            : 'border-border'
                        "
                      >
                        <span
                          v-if="modelValue === child._id"
                          class="w-1.5 h-1.5 rounded-full bg-primary-color"
                        />
                      </span>
                      <span class="truncate">{{ child.title }}</span>
                    </button>
                    <button
                      v-if="getHuddlesForSprint(child._id).length"
                      type="button"
                      class="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-orchit-white/10 transition-colors"
                      :aria-label="`Expand ${child.title}`"
                      @click.stop="toggleItemExpand(child._id)"
                    >
                      <i
                        class="fas fa-chevron-right text-[10px] transition-transform duration-200"
                        :class="{
                          'rotate-90': expandedItems.has(child._id),
                        }"
                      />
                    </button>
                    <span v-else class="w-8 flex-shrink-0" />
                  </div>

                  <!-- Grandchildren: huddles under sprint (level 2) -->
                  <template v-if="expandedItems.has(child._id)">
                    <div
                      v-for="huddle in getHuddlesForSprint(child._id)"
                      :key="huddle._id"
                      class="flex items-center gap-1 min-h-[34px] pr-2 transition-colors"
                      :class="
                        modelValue === huddle._id
                          ? 'bg-primary-color/10 text-primary-color'
                          : 'hover:bg-orchit-white/5'
                      "
                    >
                      <button
                        type="button"
                        class="flex flex-1 items-center gap-2.5 py-2 pl-8 text-left text-sm min-w-0"
                        @click="selectItem(huddle._id)"
                      >
                        <span
                          class="w-3.5 h-3.5 rounded-full border flex-shrink-0 flex items-center justify-center"
                          :class="
                            modelValue === huddle._id
                              ? 'border-primary-color'
                              : 'border-border'
                          "
                        >
                          <span
                            v-if="modelValue === huddle._id"
                            class="w-1.5 h-1.5 rounded-full bg-primary-color"
                          />
                        </span>
                        <span class="truncate">{{ huddle.title }}</span>
                      </button>
                      <span class="w-8 flex-shrink-0" />
                    </div>
                  </template>
                </template>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useGroupedSprints } from "../../../queries/usePlan";
type PlanItem = {
  _id: string;
  title: string;
  sprintType?: string;
  parent_sprint_id?: string | null;
  sprints?: PlanItem[];
};

const props = withDefaults(
  defineProps<{
    modelValue: string | null;
    workspaceId: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
}>();

const { data: groupedSprints, isLoading } = useGroupedSprints(
  computed(() => props.workspaceId),
);

const expandedSections = ref(new Set<string>(["milestone"]));
const expandedItems = ref(new Set<string>());

const titleById = computed(() => {
  const map = new Map<string, string>();
  const grouped = groupedSprints.value?.grouped;
  if (!grouped) return map;
  (["milestone", "sprint", "huddle"] as const).forEach((type) => {
    (grouped[type] || []).forEach((item: PlanItem) => {
      map.set(item._id, item.title);
    });
  });
  return map;
});

const huddlesByParent = computed(() => {
  const map = new Map<string, PlanItem[]>();
  (groupedSprints.value?.grouped?.huddle || []).forEach((h: PlanItem) => {
    if (!h.parent_sprint_id) return;
    const list = map.get(h.parent_sprint_id) || [];
    list.push(h);
    map.set(h.parent_sprint_id, list);
  });
  return map;
});

const planGroups = computed(() => {
  const grouped = groupedSprints.value?.grouped;
  const empty = { milestone: [], sprint: [], huddle: [] };
  const g = grouped || empty;
  return [
    {
      id: "milestone",
      title: "Milestones",
      icon: "fas fa-flag",
      items: g.milestone || [],
    },
    {
      id: "sprint",
      title: "Sprints",
      icon: "fas fa-sync",
      items: g.sprint || [],
    },
    {
      id: "huddle",
      title: "Huddles",
      icon: "fas fa-users",
      items: g.huddle || [],
    },
  ];
});

const selectedLabel = computed(() => {
  if (!props.modelValue) return "";
  return titleById.value.get(props.modelValue) || "";
});

function getChildren(item: PlanItem, groupId: string): PlanItem[] {
  if (groupId === "milestone") return item.sprints || [];
  if (groupId === "sprint") return huddlesByParent.value.get(item._id) || [];
  return [];
}

function getHuddlesForSprint(sprintId: string): PlanItem[] {
  return huddlesByParent.value.get(sprintId) || [];
}

function hasChildren(item: PlanItem, groupId: string): boolean {
  if (groupId === "milestone") {
    const sprints = item.sprints || [];
    if (sprints.length) return true;
    return sprints.some((s) => getHuddlesForSprint(s._id).length > 0);
  }
  if (groupId === "sprint") {
    return getHuddlesForSprint(item._id).length > 0;
  }
  return false;
}

function toggleSection(id: string) {
  const next = new Set(expandedSections.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedSections.value = next;
}

function toggleItemExpand(id: string) {
  const next = new Set(expandedItems.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  expandedItems.value = next;
}

function selectItem(id: string | null) {
  if (props.disabled) return;
  if (props.modelValue === id) return;
  emit("update:modelValue", id);
}

function expandToSelection(id: string) {
  const grouped = groupedSprints.value?.grouped;
  if (!grouped) return;

  const sections = new Set(expandedSections.value);
  const items = new Set(expandedItems.value);

  for (const m of grouped.milestone || []) {
    if (m._id === id) {
      sections.add("milestone");
      expandedSections.value = sections;
      return;
    }
    for (const s of m.sprints || []) {
      if (s._id === id) {
        sections.add("milestone");
        items.add(m._id);
        expandedSections.value = sections;
        expandedItems.value = items;
        return;
      }
      for (const h of getHuddlesForSprint(s._id)) {
        if (h._id === id) {
          sections.add("milestone");
          items.add(m._id);
          items.add(s._id);
          expandedSections.value = sections;
          expandedItems.value = items;
          return;
        }
      }
    }
  }

  for (const s of grouped.sprint || []) {
    if (s._id === id) {
      sections.add("sprint");
      expandedSections.value = sections;
      return;
    }
    for (const h of getHuddlesForSprint(s._id)) {
      if (h._id === id) {
        sections.add("sprint");
        items.add(s._id);
        expandedSections.value = sections;
        expandedItems.value = items;
        return;
      }
    }
  }

  if ((grouped.huddle || []).some((h: PlanItem) => h._id === id)) {
    sections.add("huddle");
    expandedSections.value = sections;
  }
}

watch(
  () => [props.modelValue, groupedSprints.value] as const,
  ([id]) => {
    if (id) expandToSelection(id);
  },
  { immediate: true },
);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
}
</style>
