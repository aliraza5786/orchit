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
    
    return updated;
}
