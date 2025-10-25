import { ref, reactive, watch, computed } from "vue";
import { useMoveCard } from "../../../queries/usePlan";
import { toast } from "vue-sonner";

export interface Ticket {
  id: string;
  key: string;
  summary: string;
  type: "Story" | "Bug" | "Task";
  status: "Todo" | "In Progress" | "Done";
  assignee?: string;
  storyPoints?: number;
  priority: "Highest" | "High" | "Medium" | "Low";
  createdAt: string;
  description?: string;
}
export interface Sprint {
  id: string;
  title?: string;
  name: string;
  goal?: string;
  start?: string;
  end?: string;
  started: boolean;
  tickets: Ticket[];
}

const LS_PREFIX = "jira-like:";

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}
function saveToLS(key: string, val: unknown) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
  } catch {}
}
function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function priorityClass(p: Ticket["priority"]) {
  switch (p) {
    case "Highest":
      return "rounded-md bg-red-50 px-2 py-0.5 text-xs text-red-700";
    case "High":
      return "rounded-md bg-orange-50 px-2 py-0.5 text-xs text-orange-700";
    case "Medium":
      return "rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700";
    case "Low":
      return "rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600";
  }
}

export function useBacklogStore() {
  const backlog = ref<Ticket[]>(loadFromLS("backlog", []));
  const sprints = ref<Sprint[]>(loadFromLS("sprints", []));

  // Single sprint only: ensure exactly one exists
  if (sprints.value.length === 0) {
    sprints.value.push({
      id: uid("sprint"),
      name: "Sprint 1",
      goal: "",
      start: "",
      end: "",
      started: false,
      tickets: [],
    });
  } else if (sprints.value.length > 1) {
    // merge extra sprint tickets back to backlog and keep the first sprint
    for (let i = 1; i < sprints.value.length; i++)
      backlog.value.push(...sprints.value[i].tickets);
    sprints.value = [sprints.value[0]];
  }

  const activeSprintId = ref<string>(sprints.value[0].id);

  watch(
    [backlog, sprints],
    () => {
      saveToLS("backlog", backlog.value);
      saveToLS("sprints", sprints.value);
    },
    { deep: true }
  );

  const selectedBacklogIds = ref<string[]>([]);
  const selectedSprintIds = reactive<Record<string, string[]>>({});

  const allBacklogChecked = computed(
    () =>
      backlog.value.length > 0 &&
      selectedBacklogIds.value.length === backlog.value.length
  );
  const allSprintChecked = (sprintId: string) => {
    const s = sprints.value.find((x) => x.id === sprintId);
    return (
      !!s &&
      s.tickets.length > 0 &&
      (selectedSprintIds[sprintId]?.length || 0) === s.tickets.length
    );
  };

  function toggleAll(area: "backlog" | "sprint", e: Event, sprintId?: string) {
    const checked = (e.target as HTMLInputElement).checked;
    if (area === "backlog") {
      selectedBacklogIds.value = checked ? backlog.value.map((t) => t.id) : [];
    } else if (sprintId) {
      const s = sprints.value.find((x) => x.id === sprintId);
      selectedSprintIds[sprintId] =
        checked && s ? s.tickets.map((t) => t.id) : [];
    }
  }
  function toggleOne(
    area: "backlog" | "sprint",
    id: string,
    e: Event,
    sprintId?: string
  ) {
    const checked = (e.target as HTMLInputElement).checked;
    const arr =
      area === "backlog"
        ? selectedBacklogIds.value
        : (selectedSprintIds[sprintId!] ||= []);
    if (checked && !arr.includes(id)) arr.push(id);
    if (!checked) {
      const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1);
    }
  }

  function getActiveSprint() {
    return (
      sprints.value.find((s) => s.id === activeSprintId.value) ||
      sprints.value[0]
    );
  }

  function nextKey() {
    const all = [...backlog.value, ...sprints.value.flatMap((s) => s.tickets)];
    const keys = all
      .map((t) => Number(String(t.key).replace(/[^0-9]/g, "")))
      .filter((n) => !Number.isNaN(n));
    const next = keys.length ? Math.max(...keys) + 1 : 1;
    return `PRJ-${next}`;
  }

  const { mutate: moveCard } = useMoveCard({
    onSuccess: () => {
      toast.success("Cards moved to sprint successfully");
    },
    onError: (error: any) => {
      toast.error(
        "Failed to move cards: " + (error.message || "Unknown error")
      );
    },
  });

  // Bulk actions
  function moveSelectedToSprint() {
    const s = getActiveSprint();
    if (!s || !selectedBacklogIds.value.length) return;
    const keep: Ticket[] = [];
    const moved: Ticket[] = [];
    for (const t of backlog.value)
      (selectedBacklogIds.value.includes(t.id) ? moved : keep).push(t);
    backlog.value = keep;
    s.tickets.push(...moved);
    selectedBacklogIds.value = [];

    if (moved.length > 0) {
      moveCard({
        id: s.id,
        payload: {
          card_ids: moved.map((t) => t.id),
          priority: moved[0]?.priority?.toLowerCase() || "medium",
          story_points: moved.reduce((sum, t) => sum + (t.storyPoints || 0), 0),
        },
      });
    }
  }
  function moveSelectedToBacklog(sprintId: string) {
    const s = sprints.value.find((x) => x.id === sprintId);
    if (!s) return;
    const ids = selectedSprintIds[sprintId] || [];
    const keep: Ticket[] = [];
    const moved: Ticket[] = [];
    for (const t of s.tickets) (ids.includes(t.id) ? moved : keep).push(t);
    s.tickets = keep;
    backlog.value.push(...moved);
    selectedSprintIds[sprintId] = [];
  }
  function deleteSelected(area: "backlog" | "sprint", sprintId?: string) {
    if (area === "backlog") {
      backlog.value = backlog.value.filter(
        (t) => !selectedBacklogIds.value.includes(t.id)
      );
      selectedBacklogIds.value = [];
    } else if (sprintId) {
      const ids = selectedSprintIds[sprintId] || [];
      const s = sprints.value.find((x) => x.id === sprintId);
      if (!s) return;
      s.tickets = s.tickets.filter((t) => !ids.includes(t.id));
      selectedSprintIds[sprintId] = [];
    }
  }

  // Ticket CRUD (create only into active area decided by caller)
  function createTicket(
    target: "backlog" | "sprint",
    payload: Omit<Ticket, "id" | "key" | "createdAt">
  ) {
    const t: Ticket = {
      id: uid("T"),
      key: nextKey(),
      createdAt: new Date().toISOString(),
      ...payload,
    };
    if (target === "backlog") backlog.value.push(t);
    else {
      const s = getActiveSprint();
      s?.tickets.push(t);
    }
  }

  // Sprint editing only (no create/duplicate/delete)
  function saveSprintMeta(partial: Partial<Sprint>) {
    const s = getActiveSprint();
    if (!s) return;
    s.name = partial.name ?? s.name;
    s.goal = partial.goal ?? s.goal;
    s.start = partial.start ?? s.start;
    s.end = partial.end ?? s.end;
  }
  function toggleStartSprint() {
    const s = getActiveSprint();
    if (s) s.started = !s.started;
  }
  function sprintPoints(s: Sprint) {
    return s.tickets.reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  }

  return {
    backlog,
    sprints,
    activeSprintId,
    selectedBacklogIds,
    selectedSprintIds,
    allBacklogChecked,
    allSprintChecked,
    toggleAll,
    toggleOne,
    getActiveSprint,
    createTicket,
    saveSprintMeta,
    toggleStartSprint,
    sprintPoints,
    moveSelectedToSprint,
    moveSelectedToBacklog,
    deleteSelected,
    priorityClass,
  };
}
