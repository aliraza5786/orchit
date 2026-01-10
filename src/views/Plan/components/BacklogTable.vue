<template>
  <section class="h-full min-h-0">
    <!-- Search Input -->
    <!-- <div class="mb-2">
      <SearchBar type="text"  @onChange="(e) => searchQuery = e" placeholder="Search tickets..."
        class="w-[250px]" />
    </div> -->

    <!-- Table -->
    <div
      class="rounded-lg flex flex-col h-full"
      :class="dropOverBacklog ? 'ring-2 ring-blue-400' : ''"
      @dragover.prevent
      @dragenter="dropOverBacklog = true"
      @dragleave="dropOverBacklog = false"
      @drop="onDropBacklog($event)"
    >
      <!-- Empty State -->
      <div
        v-if="!isBacklogListPending && filteredBacklog.length === 0"
        class="empty-state flex flex-col justify-center items-center h-full"
      >
        <img
          src="../../../assets/emptyStates/plan-backlog.svg"
          class="mb-4"
          alt="backlog-plan"
        />
        <h6 class="text-sm text-text-primary font-semibold mb-1">
          Get started in the backlog
        </h6>
        <p class="text-sm text-text-primary/90 mb-4">
          Plan and start a sprint to see issues here.
        </p>
        <button
          :disabled="!canCreateCard"
          @click="$emit('open-create-ticket')"
          class="relative inline-flex items-center justify-center font-medium py-1.5 px-3 text-sm rounded-md focus:outline-none transition h-[34px] bg-accent text-white hover:bg-accent-hover border-border-input border"
          :class="canCreateCard ? 'cursor-pointer' : 'cursor-not-allowed'"
        >
          Create Ticket
        </button>
      </div>

      <!-- Tickets List -->
      <div v-else class="overflow-y-auto h-[calc(100%-50px)] tickets-scroll">
        <div class="flex flex-col flex-1 gap-[4px] min-w-0 me-1">
          <!-- Loader -->
          <div
            v-if="isBacklogListPending"
            class="flex items-center justify-center py-10"
          >
            <Loader />
          </div>

          <!-- Backlog List -->
          <template v-else>
            <div
              v-for="ticket in filteredBacklog"
              :key="ticket.id"
              draggable="true"
              :class="[
                'flex items-center gap-3 p-[8px] cursor-pointer transition-colors rounded-[8px]',
                selectedBacklogIds.includes(ticket.id)
                  ? 'border-2 border-[#5a2d7f]'
                  : 'border border-border-input',
                isDark
                  ? 'bg-bg-body hover:bg-bg-surface'
                  : 'bg-bg-charcoal hover:bg-bg-body',
              ]"
              @dragstart="onDragStart($event, ticket, 'backlog')"
              @dragend="onDragEnd($event)"
              @click="$emit('open-ticket', ticket)"
            >
              <!-- Checkbox -->
              <input
                type="checkbox"
                class="custom-checkbox bg-bg-body border border-border-input flex-shrink-0"
                :checked="selectedBacklogIds.includes(ticket.id)"
                @click.stop
                @change="handleCheckboxChange(ticket.id, $event)"
              />

              <!-- Summary -->
              <div
                class="flex items-center text-[14px] font-sans font-medium capitalize text-text-secondary flex-1 min-w-0"
              >
                <span class="truncate">{{ ticket.summary }}</span>
              </div>

              <!-- Assignee -->
              <div class="flex-shrink-0">
                <span
                  v-if="ticket?.assignee === 'Unassigned'"
                  class="flex justify-center text-gray-500 items-center text-[11px] aspect-square w-[24px] h-[24px] bg-bg-body rounded-full border-border-input border-2"
                >
                  UA
                </span>

                <div
                  v-else-if="ticket?.assignee?.u_profile_image"
                  class="w-6 h-6 rounded-full"
                >
                  <img :src="ticket.assignee.u_profile_image" alt="" />
                </div>

                <span
                  v-else
                  class="text-[11px] aspect-square w-[24px] h-[24px] flex justify-center items-center bg-accent/30 text-accent border-accent border rounded-full"
                >
                  {{ getInitials(ticket?.assignee?.u_full_name) }}
                </span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { type Ticket } from "../composables/useBacklogStore";
import { useBacklogList } from "../../../queries/usePlan";
import { useWorkspaceId } from "../../../composables/useQueryParams";
import { getInitials } from "../../../utilities";
import { useTheme } from "../../../composables/useTheme";
import Loader from "../../../components/ui/Loader.vue";
const { isDark } = useTheme();

import { usePermissions } from "../../../composables/usePermissions";
const { canCreateCard } = usePermissions();

const emit = defineEmits([
  "ticket-dragged-to-sprint",
  "open-ticket",
  "ticket-moved-to-backlog",
  "open-create-ticket",
]);
const props = defineProps({
  searchQuery: {
    type: String,
    default: "",
  },
  sprintType: {
    type: String,
    default: "",
  },
  checkedAll: {
    type: Boolean,
    default: false,
  },
  moduleId: {
    type: String,
    default: "",
  },
});

const { workspaceId } = useWorkspaceId();
const module_id = ref<string | number | null>(props.moduleId ?? null);

const { data: backlogResp, isPending: isBacklogListPending } = useBacklogList(
  workspaceId,
  props.sprintType,
  module_id
);

const normalizedBacklog = ref<Ticket[]>([]);
const dropOverBacklog = ref(false);
const draggedTicketIds = ref<string[]>([]);
// const searchQuery = ref("");
const selectedBacklogIds = ref<string[]>([]);

// Normalize incoming backlog data
watch(
  backlogResp,
  (resp) => {
    if (!resp?.cards) return;
    normalizedBacklog.value = resp.cards.map((c: any): Ticket => {
      const v = c.card?.variables ?? {};
      const id = c.card?._id ?? c.card_id;
      const rawStatus = String(v["card-status"] ?? "").trim();
      const rawPriority = String(v["priority"] ?? "").trim();

      return {
        id,
        key: (v["card-code"] as string) || id?.slice(-6) || "PRJ-?",
        summary: (v["card-title"] as string) || "(untitled)",
        type: "Story",
        status: rawStatus,
        assignee: c.card?.assigned_to ?? "Unassigned",
        storyPoints: Number(c.story_points ?? 0) || 0,
        priority: mapPriority(rawPriority),
        createdAt: c.card?.created_at ?? new Date().toISOString(),
        description: (v["card-description"] as string) || "",
      };
    });
  },
  { immediate: true }
);

watch(normalizedBacklog, (tickets) => {
  const validIds = new Set(tickets.map((t) => t.id));
  selectedBacklogIds.value = selectedBacklogIds.value.filter((id) =>
    validIds.has(id)
  );
});
const filteredBacklog = computed(() => {
  console.log(props.searchQuery, "this is query");
  if (!props.searchQuery) return normalizedBacklog.value;

  const q = props.searchQuery.toLowerCase();

  return normalizedBacklog.value.filter((ticket) => {
    const assigneeName =
      typeof ticket.assignee === "string"
        ? ticket.assignee
        : ticket.assignee?.u_full_name || "";

    return (
      ticket.key.toLowerCase().includes(q) ||
      ticket.summary.toLowerCase().includes(q) ||
      assigneeName.toLowerCase().includes(q)
    );
  });
});

// Map priority to standard values
function mapPriority(p: string | null | undefined): Ticket["priority"] {
  const s = String(p ?? "").toLowerCase();
  if (["highest", "blocker", "critical"].includes(s)) return "Highest";
  if (["high", "major"].includes(s)) return "High";
  if (["medium", "normal"].includes(s)) return "Medium";
  return "Low";
}

// Drag & Drop
function onDragStart(e: DragEvent, ticket: Ticket, from: "backlog" | "sprint") {
  const selection = selectedBacklogIds.value.includes(ticket.id)
    ? [...selectedBacklogIds.value]
    : [ticket.id];
  const tickets = selection
    .map((id) => normalizedBacklog.value.find((t) => t.id === id))
    .filter(Boolean) as Ticket[];
  draggedTicketIds.value = selection;
  const payload = JSON.stringify({
    id: ticket.id,
    ids: selection,
    from,
    tickets,
  });
  e.dataTransfer?.setData("text/plain", payload);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}

function onDragEnd(e: DragEvent) {
  dropOverBacklog.value = false;
  if (e.dataTransfer?.dropEffect !== "none" && draggedTicketIds.value.length) {
    normalizedBacklog.value = normalizedBacklog.value.filter(
      (t) => !draggedTicketIds.value.includes(t.id)
    );
    selectedBacklogIds.value = selectedBacklogIds.value.filter(
      (id) => !draggedTicketIds.value.includes(id)
    );
  }
  draggedTicketIds.value = [];
}

function onDropBacklog(e: DragEvent) {
  e.preventDefault();
  dropOverBacklog.value = false;
  try {
    const raw = e.dataTransfer?.getData("text/plain");
    if (!raw) return;
    const data = JSON.parse(raw) as {
      id?: string;
      ids?: string[];
      from: "backlog" | "sprint";
      sprintId?: string;
      ticket?: Ticket;
      tickets?: Ticket[];
    };
    if (data.from !== "sprint") return;
    const incomingTickets = (
      data.tickets && data.tickets.length
        ? data.tickets
        : data.ticket
        ? [data.ticket]
        : []
    ).filter(Boolean) as Ticket[];
    const deduped = incomingTickets.filter(
      (ticket) => !normalizedBacklog.value.some((t) => t.id === ticket.id)
    );
    if (deduped.length) normalizedBacklog.value.push(...deduped);
    const ids =
      data.ids && data.ids.length ? data.ids : data.id ? [data.id] : [];
    if (ids.length) emit("ticket-moved-to-backlog", ids, data.sprintId);
    console.log(data.sprintId, "sprintId ....");
  } catch (error) {
    console.error("Drop error:", error);
  }
}

function toggleRowSelection(id: string, checked: boolean) {
  if (checked) {
    if (!selectedBacklogIds.value.includes(id))
      selectedBacklogIds.value.push(id);
  } else {
    selectedBacklogIds.value = selectedBacklogIds.value.filter(
      (existing) => existing !== id
    );
  }
}

function handleCheckboxChange(id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  toggleRowSelection(id, checked);
}

watch(
  () => props.checkedAll,
  (newVal) => {
    if (newVal) {
      selectedBacklogIds.value = normalizedBacklog.value.map((t) => t.id); // select all
      console.log(selectedBacklogIds.value);
    } else {
      selectedBacklogIds.value = []; // deselect all
    }
  }
);
</script>

<style scoped>
.custom-checkbox {
  appearance: none; /* remove native checkbox UI */
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.custom-checkbox:checked {
  background-color: #5a2d7f;
  border-color: #5a2d7f !important;
}

.custom-checkbox:checked::after {
  content: "";
  display: block;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
  margin: 3px auto;
}

.tickets-scroll::-webkit-scrollbar {
  width: 8px; /* width of the vertical scrollbar */
}

.tickets-scroll::-webkit-scrollbar-track {
  background: var(--bg-lavender); /* or a color you like */
  border-radius: 4px;
}

.tickets-scroll::-webkit-scrollbar-thumb {
  background-color: #5a2d7f; /* scrollbar thumb color */
  border-radius: 4px;
  border: 2px solid transparent; /* optional for padding effect */
}

.tickets-scroll::-webkit-scrollbar-thumb:hover {
  background-color: #7f4bbf; /* hover color */
}

/* Firefox */
.tickets-scroll {
  scrollbar-width: thin;
  scrollbar-color: #5a2d7f var(--bg-lavender);
}
</style>
