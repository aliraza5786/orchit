import { defineStore } from "pinia";
import { nextTick } from "vue";
const baseUrl = import.meta.env.VITE_API_BASE_URL;
export const useSidePanelStore = defineStore("sidePanel", {
  state: () => ({
    selectedCard: null as any | null,
    lists: [] as any[],
    isFetching: false as boolean,
    selectedCardPeople: null as any | null,
    cards: {} as Record<string, any>,
    selectedCardTitle:"",
    selectedCardId: "",
    cardDetails:[] as any[],
  }),

  getters: {
    hasSelectedCard: (state) => Boolean(state.selectedCard?._id),
  },

  actions: {
    async fetchSelectedCardDetails(id: string) {
  this.isFetching = true;

  try {
    // Read token from localStorage
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No auth token found");

    const res = await fetch(`${baseUrl}workspace/card/${id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    this.selectedCard = data;
  } catch (err) {
    console.error("Failed to fetch card details:", err);
  } finally {
    this.isFetching = false;
  }
},
    selectTaskCard(card:any){
      this.selectedCard= card;
      nextTick(() => {
    this.selectedCard = card
  })
    },
   selectCard(card:any) {
      this.selectedCardPeople = card;
    },
    clearCard() {
      this.selectedCardPeople= null;
    },
     // sidePanelStore.ts
updateCardTitleOptimistic(newTitle: string) {
  if (this.selectedCard) {
    this.selectedCard['card-title'] = newTitle; // For the list views
    this.selectedCardTitle = newTitle;          // For the SidePanel header
  }
},

  rollbackCardTitle(previousTitle: string) {
    if (!this.selectedCard) return

    this.selectedCard['card-title'] = previousTitle
    this.selectedCardTitle = previousTitle
  },
     clearTaskCard() {
      this.selectedCardPeople= null;
    },
    saveTitle(title: string){
      this.selectedCardTitle = title;
    },
    saveLocalId(id:string){
      this.selectedCardId = id;
    },
    saveCardDetails(card:any){
      
      this.cardDetails=card;
    }
}});
