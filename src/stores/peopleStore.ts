import { defineStore } from "pinia";
import axios from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;
const token = localStorage.getItem('token');
export const usePeopleStore = defineStore("people", {
  state: () => ({
    peopleData: [],
    isFetchingPeople:false
  }),

  getters: {},

  actions: {
    async fetchPeopleList(workspace_id:any, viewID:any, signal?: AbortSignal) {
        this.isFetchingPeople = true;
      try {
        const res = await axios.get(
          `${baseUrl}workspace/teams/${workspace_id}/people-grouped`,
          {
            params: {
              groupBy: viewID,
            },
            headers: {
          Authorization: `Bearer ${token}`,
        },
            signal,
          }
        );

        if (res.status === 200) {
          this.peopleData = res?.data?.data;
          console.log("people data", this.peopleData);
        this.isFetchingPeople = false;
        } else {
          console.error(res?.data?.message || "Failed to fetch people list");
          this.isFetchingPeople = false;
        }
      } catch (err) {
       this.isFetchingPeople = false;
        if (axios.isCancel(err)) return;

        console.error(err);
      }
    },
  },
});
