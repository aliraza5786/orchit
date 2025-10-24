import { nextTick, reactive, ref, type Ref } from "vue";
import type { Ticket, Sprint } from "./useBacklogStore.ts";
import { useMoveCard } from "../../../queries/usePlan";
import { toast } from "vue-sonner";

export function useDragDrop(
  backlog: Ref<Ticket[]>,
  sprints: Ref<Sprint[]>,
  selectedBacklogIds: Ref<string[]>,
  selectedSprintIds: Record<string, string[]>
) {
  const dropOverBacklog = ref(false);
  const dropOverSprintId = ref<string | null>(null);

  const { mutate: moveCard } = useMoveCard({
    onSuccess: () => {
      toast.success('Card moved successfully')
    },
    onError: (error: any) => {
      toast.error('Failed to move card: ' + (error.message || 'Unknown error'))
    }
  });

  const dragData = reactive<{
    ticket: Ticket | null;
    from: "backlog" | "sprint" | null;
    sprintId?: string;
  }>({ ticket: null, from: null, sprintId: undefined });

  function onDragStart(
    e: DragEvent,
    ticket: Ticket,
    from: "backlog" | "sprint",
    sprintId?: string
  ) {
    dragData.ticket = ticket;
    dragData.from = from;
    dragData.sprintId = sprintId;
    const payload = JSON.stringify({ id: ticket.id, from, sprintId });
    e.dataTransfer?.setData("text/plain", payload);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.dropEffect = "move";
    }
  }

  function onDragEnd() {
    dropOverBacklog.value = false;
    dropOverSprintId.value = null;
    dragData.ticket = null;
    dragData.from = null;
    dragData.sprintId = undefined;
  }

  function onDragEnterSprint(sprintId: string) {
    dropOverSprintId.value = sprintId;
  }
  function onDragLeaveSprint(sprintId: string) {
    if (dropOverSprintId.value === sprintId) dropOverSprintId.value = null;
  }

  function readPayload(e: DragEvent) {
    try {
      const raw = e.dataTransfer?.getData("text/plain");
      return raw
        ? (JSON.parse(raw) as {
            id: string;
            from: "backlog" | "sprint";
            sprintId?: string;
          })
        : null;
    } catch {
      return null;
    }
  }

  /** Removes from source and returns the ticket (or null). */
  function takeTicketById(
    id: string,
    from: "backlog" | "sprint",
    sprintId?: string
  ): Ticket | null {
    if (from === "backlog") {
      const i = backlog.value.findIndex((t) => t.id === id);
      return i >= 0 ? backlog.value.splice(i, 1)[0] : null;
    }
    if (from === "sprint" && sprintId) {
      const src = sprints.value.find((s) => s.id === sprintId);
      if (!src) return null;
      const i = src.tickets.findIndex((t) => t.id === id);
      return i >= 0 ? src.tickets.splice(i, 1)[0] : null;
    }
    return null;
  }

  /** Safety: if target already contains the ticket id (due to mis-wiring), drop it first. */
  function dedupePush(target: Ticket[], ticket: Ticket) {
    const idx = target.findIndex((t) => t.id === ticket.id);
    if (idx >= 0) target.splice(idx, 1);
    target.push(ticket);
  }

  /** Clear selection from the list it left */
  function clearSelectionForMoved(
    ticketId: string,
    from: "backlog" | "sprint",
    sprintId?: string
  ) {
    if (from === "backlog") {
      selectedBacklogIds.value = selectedBacklogIds.value.filter(
        (id) => id !== ticketId
      );
    } else if (from === "sprint" && sprintId) {
      selectedSprintIds[sprintId] = (selectedSprintIds[sprintId] || []).filter(
        (id) => id !== ticketId
      );
    }
  }

  function onDropSprint(e: DragEvent, sprint: Sprint) {
    const p = readPayload(e);
    let moved: Ticket | null = null;
    let from: "backlog" | "sprint" | null = null;
    let srcSprintId: string | undefined;

    if (p) {
      moved = takeTicketById(p.id, p.from, p.sprintId);
      from = p.from;
      srcSprintId = p.sprintId;
    } else if (dragData.ticket) {
      moved = takeTicketById(
        dragData.ticket.id,
        dragData.from!,
        dragData.sprintId
      );
      from = dragData.from;
      srcSprintId = dragData.sprintId;
    }
    if (!moved) return;

    dedupePush(sprint.tickets, moved);
    if (from) clearSelectionForMoved(moved.id, from, srcSprintId);

    dropOverSprintId.value = null;
    onDragEnd();

    moveCard({
      id: sprint.id,
      payload: {
        card_ids: [moved.id],
        priority: moved.priority.toLowerCase(),
        story_points: moved.storyPoints || 0
      }
    });
  }

  function onDropBacklog(e: DragEvent) {
    const p = readPayload(e);
    let moved: Ticket | null = null;
    let from: "backlog" | "sprint" | null = null;
    let srcSprintId: string | undefined;

    if (p) {
      moved = takeTicketById(p.id, p.from, p.sprintId); // ← splices from source
      from = p.from;
      srcSprintId = p.sprintId;
    } else if (dragData.ticket) {
      moved = takeTicketById(
        dragData.ticket.id,
        dragData.from!,
        dragData.sprintId
      );
      from = dragData.from;
      srcSprintId = dragData.sprintId;
    }
    if (!moved) return;

    dedupePush(backlog.value, moved); // ← add to target, no dupes
    if (from) clearSelectionForMoved(moved.id, from, srcSprintId);

    dropOverBacklog.value = false;
    onDragEnd();
    nextTick();
  }

  return {
    dropOverBacklog,
    dropOverSprintId,
    onDragStart,
    onDragEnd,
    onDropSprint,
    onDropBacklog,
    onDragEnterSprint,
    onDragLeaveSprint,
  };
}
