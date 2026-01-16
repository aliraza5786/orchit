import { defineStore } from "pinia";
const baseUrl = import.meta.env.VITE_API_BASE_URL;
export const useSidePanelStore = defineStore("sidePanel", {
  state: () => ({
    selectedCard: null as any | null,
    isFetching: false as boolean,
     selectedCardPeople: null as any | null,
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
   selectCard(card:any) {
      this.selectedCardPeople = card;;
    },
    clearCard() {
      this.selectedCardPeople= null;
    },
}});
