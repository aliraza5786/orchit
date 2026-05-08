import { defineStore } from "pinia";
import axios from "axios";

const baseUrl = import.meta.env.VITE_API_BASE_URL;

function getToken(): string {
  // 1. localStorage token
  const lsToken = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (lsToken) return lsToken;

  // 2. space_auth cookie (plain token)
  const spaceAuth = document.cookie
    .split("; ")
    .find((row) => row.startsWith("space_auth="));
  if (spaceAuth) {
    const val = decodeURIComponent(spaceAuth.split("=").slice(1).join("="));
    if (val) return val;
  }

  // 3. auth_session cookie (JSON with token field)
  try {
    const authSession = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_session="));
    if (authSession) {
      const raw = decodeURIComponent(authSession.split("=").slice(1).join("="));
      const parsed = JSON.parse(raw);
      if (parsed?.token) return parsed.token;
    }
  } catch {
    // invalid JSON — ignore
  }

  return "";
}

export const usePeopleStore = defineStore("people", {
  state: () => ({
    peopleData: [] as any[],
    isFetchingPeople: false,
  }),

  getters: {},

  actions: {
    async fetchPeopleList(
      workspace_id: any,
      viewID: any,
      signal?: AbortSignal,
      silent = false
    ) {
      if (!silent) this.isFetchingPeople = true;
      try {
        const token = getToken();

        const res = await axios.get(
          `${baseUrl}workspace/teams/${workspace_id}/people-grouped`,
          {
            params: { groupBy: viewID },
            headers: { Authorization: `Bearer ${token}` },
            signal,
          }
        );

        if (res.status === 200) {
          this.peopleData = res?.data?.data;
        } else {
          console.error(res?.data?.message || "Failed to fetch people list");
        }
      } catch (err) {
        if (axios.isCancel(err)) return;
        console.error(err);
      } finally {
        this.isFetchingPeople = false;
      }
    },
  },
});