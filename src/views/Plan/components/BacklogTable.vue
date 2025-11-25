<template>
  <section class="h-full min-h-0 ">
    <!-- Search Input -->
    <!-- <div class="mb-2">
      <SearchBar type="text"  @onChange="(e) => searchQuery = e" placeholder="Search tickets..."
        class="w-[250px]" />
    </div> -->

    <!-- Table -->
    <div
      class="rounded-lg flex flex-col  h-full"
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
        <p class="text-sm text-text-primary/90 mb-3">
          Plan and start a sprint to see issues here.
        </p>
      </div>

      <!-- Tickets List -->
      <div v-else class=" overflow-y-auto h-[calc(100%-50px)]">
        <div class="flex flex-col flex-1 gap-3 min-w-0">
          <div
            v-for="ticket in filteredBacklog"
            :key="ticket.id"
            draggable="true"
            :class="[
              'flex items-center bg-bg-charcoal  gap-3 px-4 py-[14px] hover:bg-bg-body cursor-pointer transition-colors rounded-[8px]',
              selectedBacklogIds.includes(ticket.id)
                ? 'border-2 border-[#5a2d7f]'
                : 'border border-border-input',
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
                class="flex justify-center text-gray-500 items-center text-xs aspect-square w-7 h-7 bg-bg-body rounded-full border-border-input border-2"
                >UA</span
              >
              <div
                v-else-if="ticket?.assignee?.u_profile_image"
                class="w-6 h-6 rounded-full"
              >
                <img :src="ticket.assignee.u_profile_image" alt="" />
              </div>
              <span
                v-else
                class="text-xs aspect-square w-7 flex justify-center items-center h-7 bg-accent/30 text-accent border-accent border rounded-full"
              >
                {{ getInitials(ticket?.assignee?.u_full_name) }}
              </span>
            </div>
          </div>
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

const emit = defineEmits([
  "ticket-dragged-to-sprint",
  "open-ticket",
  "ticket-moved-to-backlog",
]);

const { workspaceId } = useWorkspaceId();
const { data: backlogResp, isPending: isBacklogListPending } =
  useBacklogList(workspaceId);

const normalizedBacklog = ref<Ticket[]>([]);
const dropOverBacklog = ref(false);
const draggedTicketIds = ref<string[]>([]);
const searchQuery = ref("");
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

// Filter tickets based on search query
const filteredBacklog = computed(() => {
  if (!searchQuery.value) return normalizedBacklog.value;
  const q = searchQuery.value.toLowerCase();
  return normalizedBacklog.value.filter(
    (ticket) =>
      ticket.key.toLowerCase().includes(q) ||
      ticket.summary.toLowerCase().includes(q) ||
      (typeof ticket.assignee === "string"
        ? ticket.assignee.toLowerCase().includes(q)
        : ticket.assignee?.u_full_name?.toLowerCase().includes(q))
  );
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
</style>
