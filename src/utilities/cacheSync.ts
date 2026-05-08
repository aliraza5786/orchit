/**
 * Cache Sync Utilities
 * A agnostic set of helpers to perform optimistic updates across various 
 * TanStack query cache structures (Product Sheets, Sprint Groups, and Flat Cards).
 */

/**
 * Removes a card from any of the three known cache structures.
 */
export function removeFromCacheStructure(data: any, cardId: string): any {
    if (!data) return data;
    const id = String(cardId);

    // Flat cards array
    if (Array.isArray(data.cards)) {
        return { ...data, cards: data.cards.filter((c: any) => String(c._id || c.id) !== id) };
    }

    // Sprint groups
    if (Array.isArray(data.groups)) {
        return {
            ...data,
            groups: data.groups.map((g: any) => ({
                ...g,
                cards: (g.cards || []).filter((c: any) => String(c._id || c.id) !== id)
            }))
        };
    }

    // Product sheets
    if (Array.isArray(data.sheets)) {
        return {
            ...data,
            sheets: data.sheets.map((s: any) => ({
                ...s,
                sheet_lists: (s.sheet_lists || []).map((l: any) => ({
                    ...l,
                    cards: (l.cards || []).filter((c: any) => String(c._id || c.id) !== id)
                }))
            }))
        };
    }

    return data;
}

/**
 * Moves a card between columns/lists within sheets or groups structures.
 */
export function moveBetweenColumns(lists: any[], cardId: string, newStatus: string): any[] {
    let cardToMove: any = null;
    const id = String(cardId);

    // 1. Extract card and remove from source
    const cleanedLists = lists.map((list: any) => {
        const idx = (list.cards ?? []).findIndex((c: any) => String(c._id || c.id) === id);
        if (idx !== -1) {
            cardToMove = { ...(list.cards[idx]), 'card-status': newStatus };
            return { ...list, cards: list.cards.filter((_: any, i: number) => i !== idx) };
        }
        return list;
    });

    if (!cardToMove) return lists;

    // 2. Insert into target column or update in-place if target missing
    const targetIdx = cleanedLists.findIndex(
        (list: any) => list.title?.toLowerCase() === newStatus?.toLowerCase()
    );

    if (targetIdx !== -1) {
        return cleanedLists.map((list: any, i: number) =>
            i === targetIdx ? { ...list, cards: [cardToMove, ...list.cards] } : list
        );
    }

    // If target list not found, just update status inside whichever list it originally was
    return lists.map((list: any) => ({
        ...list,
        cards: (list.cards ?? []).map((c: any) =>
            String(c._id || c.id) === id ? { ...c, 'card-status': newStatus } : c
        ),
    }));
}

/**
 * Updates specific fields on a card across any structure.
 */
export function updateCardInStructure(data: any, cardId: string, updates: Record<string, any>): any {
    if (!data) return data;
    
    const updateFn = (card: any) => updateCardOptimistically(card, cardId, updates);

    // Some responses are just arrays of cards (flat list)
    if (Array.isArray(data)) {
        return data.map(updateFn);
    }

    if (Array.isArray(data.cards)) {
        return { ...data, cards: data.cards.map(updateFn) };
    }

    if (Array.isArray(data.groups)) {
        return {
            ...data,
            groups: data.groups.map((g: any) => ({
                ...g,
                cards: (g.cards || []).map(updateFn)
            }))
        };
    }

    if (Array.isArray(data.sheets)) {
        return {
            ...data,
            sheets: data.sheets.map((s: any) => ({
                ...s,
                sheet_lists: (s.sheet_lists || []).map((l: any) => ({
                    ...l,
                    cards: (l.cards || []).map(updateFn)
                }))
            }))
        };
    }

    return data;
}

/**
 * Core logic to update a single card object with merged fields and variables sync
 */
export function updateCardOptimistically(card: any, cardId: string, updates: Record<string, any>): any {
    if (!card || String(card._id || card.id) !== String(cardId)) return card;
    
    const updated = { ...card, ...updates };
    
    // If the card has a variables array, sync the updates into it as well
    if (Array.isArray(updated.variables)) {
        updated.variables = updated.variables.map((v: any) => {
            if (v && v.slug && updates[v.slug] !== undefined) {
                return { ...v, value: updates[v.slug] };
            }
            return v;
        });
    }
    
    // Special case for descriptions used in detail panels
    if (updates['card-description'] !== undefined) {
        updated.description = updates['card-description'];
    }

    // Special case for seats/assignees
    if (updates.seat_id !== undefined) {
        updated.seat_id = updates.seat_id;
    }
    if (updates.seats !== undefined) {
        updated.seats = updates.seats;
    }
    if (updates.seat !== undefined) {
        updated.seat = updates.seat;
    }
    
    return updated;
}

/**
 * Centralized Orchestrator for Optimistic Updates
 */
export function performOptimisticUpdate({
    queryClient,
    sidePanelStore,
    cardId,
    updates,
    invalidateKeys = []
}: {
    queryClient: any,
    sidePanelStore?: any,
    cardId: string,
    updates: Record<string, any>,
    invalidateKeys?: string[]
}) {
    const snapshots: { queryKey: any[]; data: any }[] = [];
    const id = String(cardId);
    const detailKey = ['cardDetail', id];

    // 1. Snapshot and Update Board/Table Caches
    const allCacheKeys = [...new Set([...invalidateKeys, 'sheet-list', 'sprint-kanban', 'table-cards-flat', 'sprint-table-flat'])];
    
    allCacheKeys.forEach(key => {
        queryClient.setQueriesData({ queryKey: [key], exact: false }, (oldData: any) => {
            if (!oldData) return oldData;
            snapshots.push({ queryKey: [key], data: oldData });
            
            // If it's a move (status change), use moveBetweenColumns if applicable
            if (updates['card-status'] !== undefined) {
                if (Array.isArray(oldData.sheets)) {
                    return { ...oldData, sheets: oldData.sheets.map((sheet: any) => ({
                        ...sheet, sheet_lists: moveBetweenColumns(sheet.sheet_lists ?? [], id, updates['card-status'])
                    }))};
                }
                if (Array.isArray(oldData.groups)) {
                    return { ...oldData, groups: moveBetweenColumns(oldData.groups ?? [], id, updates['card-status']) };
                }
            }

            return updateCardInStructure(oldData, id, updates);
        });
    });

    // 2. Snapshot and Update Detail Cache (SidePanel)
    queryClient.setQueriesData({ queryKey: detailKey, exact: false }, (old: any) => {
        if (!old) return old;
        snapshots.push({ queryKey: detailKey, data: old });
        return updateCardOptimistically(old, id, updates);
    });

    // 3. Update SidePanel Store if it holds this card
    if (sidePanelStore && sidePanelStore.selectedCard && String(sidePanelStore.selectedCard._id || sidePanelStore.selectedCard.id) === id) {
        const currentCard = sidePanelStore.selectedCard;
        const updatedCard = updateCardOptimistically(currentCard, id, updates);
        sidePanelStore.selectTaskCard(updatedCard);
    }

    return snapshots;
}

/**
 * Rollback helper for optimistic updates
 */
export function rollbackOptimisticUpdate(queryClient: any, snapshots: any[]) {
    snapshots.forEach(({ queryKey, data }) => {
        queryClient.setQueryData(queryKey, data);
    });
}
