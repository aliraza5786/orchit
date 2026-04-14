<template>
  <div
    class="h-full min-h-0"
  >
    <!-- Sprint Table -->
    <div
      :class="dropOverSprint ? 'ring-2 ring-blue-400 rounded-lg' : ''"
      @dragover.prevent
      @dragenter="onDragEnterSprint"
      @dragleave="onDragLeaveSprint"
      @drop="onDropSprint"
      class="h-full box-border relative"
    >
      <!-- Loading Overlay -->
      <div
        v-if="isMoving"
        class="absolute inset-0 bg-bg-card/50 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-lg"
      >
        <div
          role="status"
          aria-label="Loading"
          class="h-8 w-8 rounded-full border-4 border-accent border-t-transparent animate-spin"
        ></div>
      </div>
      <!-- Tickets List -->
      <div
        v-if="filteredTickets.length > 0 && sprint"
        class="overflow-y-auto h-[calc(100%-15px)] tickets-scroll"
      >
        <div class="flex flex-col flex-1 gap-[4px] min-w-0 me-1">
          <div
            v-for="ticket in filteredTickets"
            :key="ticket.id"
            draggable="true"
            :class="[
              'flex items-center  gap-3 p-[8px] cursor-pointer transition-colors rounded-[8px]',
              selectedIds.includes(ticket.id)
                ? 'border-2 border-[#5a2d7f]'
                : 'border border-border-input',
              isDark
                ? 'bg-bg-body hover:bg-bg-surface'
                : 'bg-bg-charcoal hover:bg-bg-body',
            ]"
            @dragstart="onDragStart($event, ticket, 'sprint', sprint.id)"
            @dragend="onDragEnd($event)"
            @click="$emit('open-ticket', ticket)"
          >
            <!-- Checkbox -->
            <input
              type="checkbox"
              class="custom-checkbox border border-border-input flex-shrink-0"
              :checked="selectedIds.includes(ticket.id)"
              @click.stop
              @change="handleCheckboxChange(ticket.id, $event)"
              :class="isDark ? 'bg-bg-charcoal' : 'bg-bg-body '"
            />

            <!-- Summary -->
            <div
              class="flex items-center text-[14px] font-sans font-medium capitalize text-text-secondary flex-1 min-w-0"
            >
              <span class="truncate">{{ ticket.summary }}</span>
            </div> 

            <!-- Assignee -->
            <div class="flex-shrink-0">
              <div class="flex items-center -space-x-2">
            
                <!-- Seats (initials only) -->
                <template v-for="(seat) in (ticket.seats ?? []).slice(0, 2)" :key="seat._id">
                  <abbr
                    :title="seat.name || seat.created_by?.u_full_name || seat.title"
                    class="w-6 h-6 rounded-full text-[10px] bg-bg-surface font-semibold
                           text-text-primary flex items-center justify-center
                           border-2 border-bg-card"
                    :style="{
                      backgroundColor: avatarColor({
                        name: seat.name || seat.created_by?.u_full_name || seat.title,
                        _id: seat?._id,
                        email: seat?.email
                      })
                    }"
                  >
                    {{ getInitials(seat.name || seat.created_by?.u_full_name || seat.title) }}
                  </abbr>
                </template>
            
                <!-- +N -->
                <div
                  v-if="(ticket.seats ?? []).length > 2"
                  class="w-6 h-6 rounded-full bg-bg-surface flex items-center
                         justify-center text-[10px] font-bold text-text-primary
                         border-2 border-bg-card"
                >
                  +{{ (ticket.seats ?? []).length - 2 }}
                </div>
            
                <!-- UA (Unassigned) -->
                <div
                  v-if="(ticket.seats ?? []).length === 0"
                  title="Unassigned"
                  class="w-6 h-6 rounded-full bg-bg-surface flex items-center
                         justify-center text-[10px] font-semibold text-text-secondary
                         border-2 border-bg-card"
                >
                  UA
                </div>
            
              </div>
            </div>


          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="empty-state flex flex-col justify-center items-center border-dashed border-3 p-2 border-border h-[calc(100%-15px)] min-h-0"
      >
        <img
          src="../../../assets/emptyStates/sprint-plan.svg"
          class="mb-4"
          alt="backlog-plan"
        />
        <h6 class="text-sm text-text-primary font-semibold mb-1 text-center">
          Plan your {{ label }}
        </h6>
        <p class="text-sm text-text-primary/90 mb-3 max-w-120 text-center">
          Drag work items from the
          <span class="font-bold">Backlog</span> section or create new ones to
          plan the work for this {{ label }}. Select
          <span class="font-bold">Start {{ label }}</span> when you're ready.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { type Sprint, type Ticket } from "../composables/useBacklogStore";
import { useMoveCard } from "../../../queries/usePlan";
import { toast } from "vue-sonner";
import { getInitials } from "../../../utilities";
import { avatarColor } from '../../../utilities/avatarColor';
import { useTheme } from "../../../composables/useTheme";
import { useQueryClient } from "@tanstack/vue-query";

const { isDark } = useTheme(); 
const props = defineProps<{
  sprint: Sprint | null;
  sprintId: any;
  searchQuery?: string;
  checkedSprintAll: boolean;
  searchedData?: SearchCard[];
  label?: string;
}>();

const emit = defineEmits([
  "edit-sprint",
  "toggle-start",
  "open-ticket",
  "move-selected-to-backlog",
  "delete-selected-sprint",
  "refresh",
  "checked-change",
  "selection-change",
]); 

// Tickets state
const sprintTickets = ref<Ticket[]>([]);
const selectedIds = ref<string[]>([]);
watch(
  () => props.sprint && props.sprint.tickets,
  (tickets) => {
    sprintTickets.value = [...(tickets || [])];
    const validIds = new Set(sprintTickets.value.map((t) => t.id));
    selectedIds.value = selectedIds.value.filter((id) => validIds.has(id));
  },
  { immediate: true, deep: true }
);
watch(
  selectedIds,
  (val) => {
    emit("checked-change", val.length > 0);
    emit("selection-change", val);
  },
  { deep: true }
);

type SearchCard = {
  card_id: string;
  [key: string]: any;
};
const filteredTickets = computed(() => {
  if (props.searchedData?.length) {
    return sprintTickets.value.filter((ticket) =>
      props.searchedData!.some((s: SearchCard) => s.card_id === ticket.id)
    );
  }

  const query = props.searchQuery?.toLowerCase() || "";
  if (!query) return sprintTickets.value;

  return sprintTickets.value.filter((ticket) => {
    const assigneeName = ticket.assignee?.u_full_name ?? "";
    return (
      ticket.key.toLowerCase().includes(query) ||
      ticket.summary.toLowerCase().includes(query) ||
      assigneeName.toLowerCase().includes(query)
    );
  });
});

// Drag & Drop
const dropOverSprint = ref(false);
const draggedTicketIds = ref<string[]>([]);
const queryClient = useQueryClient();
// WITH
type MoveCardVars = {
  id: string;
  payload: {
    card_ids: string[];
    priority: string;
    story_points: number;
  };
};

const { mutate: moveCardApi, isPending: isMoving } = useMoveCard({
  onSuccess: async (_data: unknown, vars: MoveCardVars) => {
    const count = vars.payload?.card_ids?.length || 1;
    queryClient.invalidateQueries({ queryKey: ["backlog-list"] });
    queryClient.invalidateQueries({ queryKey: ["sprint-list"] });
    queryClient.invalidateQueries({ queryKey: ["sprint-detail"] });
    queryClient.invalidateQueries({ queryKey: ["sprint-cards"] });
    queryClient.invalidateQueries({ queryKey: ["sprint-kanban"], refetchType: 'all' });
    const targetLabel = props.label?.toLowerCase() || 'sprint';
    toast.success(`${count} ticket${count > 1 ? "s" : ""} moved to ${targetLabel}`);

    emit("refresh");
  },
  onError: (error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error";
    toast.error("Failed to move card: " + message);
  },
});

function onDragStart(
  e: DragEvent,
  ticket: any,
  from: "backlog" | "sprint",
  sprintId?: string
) {
  const selection = selectedIds.value.includes(ticket.id)
    ? [...selectedIds.value]
    : [ticket.id];
  const tickets = selection
    .map((id) => sprintTickets.value.find((t) => t.id === id))
    .filter(Boolean) as Ticket[];
  draggedTicketIds.value = selection;
  const payload = JSON.stringify({
    id: ticket.id,
    ids: selection,
    from,
    sprintId,
    ticket,
    tickets,
  });
  e.dataTransfer?.setData("text/plain", payload);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
}

function onDragEnd(e: DragEvent) {
  dropOverSprint.value = false;
  if (e.dataTransfer?.dropEffect !== "none" && draggedTicketIds.value.length) {
    sprintTickets.value = sprintTickets.value.filter(
      (t) => !draggedTicketIds.value.includes(t.id)
    );
    selectedIds.value = selectedIds.value.filter(
      (id) => !draggedTicketIds.value.includes(id)
    );
  }
  draggedTicketIds.value = [];
}

function onDragEnterSprint() {
  dropOverSprint.value = true;
}
function onDragLeaveSprint() {
  dropOverSprint.value = false;
}

function onDropSprint(e: DragEvent) {
  e.preventDefault();
  dropOverSprint.value = false;
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
    if (data.from !== "backlog") return;
    const incomingTickets = (
      data.tickets && data.tickets.length
        ? data.tickets
        : data.ticket
        ? [data.ticket]
        : []
    ).filter(Boolean) as Ticket[];

    const deduped = incomingTickets.filter(
      (incoming) => !sprintTickets.value.some((t) => t.id === incoming.id)
    );

    if (!deduped.length) return;
    sprintTickets.value.push(...deduped);

    const cardIds = deduped.map((t) => t.id);
    const totalPoints = deduped.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const topPriority = deduped[0]?.priority?.toLowerCase() || "medium";

    moveCardApi({
      id: props.sprintId,
      payload: {
        card_ids: cardIds,
        priority: topPriority,
        story_points: totalPoints,
      },
    });
  } catch (error) {
    console.error("Drop error:", error);
  }
}

function toggleRowSelection(id: string, checked: boolean) {
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value.push(id);
  } else {
    selectedIds.value = selectedIds.value.filter((existing) => existing !== id);
  }
}

function handleCheckboxChange(id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  toggleRowSelection(id, checked);
}

watch(
  () => props.checkedSprintAll,
  (newVal) => {
    if (newVal) {
      selectedIds.value = filteredTickets.value.map((t) => t.id); // select all
      console.log(filteredTickets.value);
    } else {
      selectedIds.value = [];
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
