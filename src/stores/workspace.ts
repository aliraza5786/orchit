import { defineStore } from "pinia";
import api from "../libs/api";
import {
  saveCreateWorkspaceDraft,
  clearCreateWorkspaceDraft,
  loadCreateWorkspaceDraft,
} from "../views/CreateWorkspace/workspaceDraft";

// ─── Domain Verification Types ───────────────────────────────────────────────

export type VerificationMethod = "cname" | "txt" | "http";

export type DomainStatus = "pending" | "verifying" | "verified" | "failed" | "disabled";

export type SslStatus = "none" | "provisioning" | "active" | "error";

export interface DomainLastCheckResult {
  ok: boolean;
  observed: string[] | null;
  error: string | null;
  checked_at: string;
}

export interface DomainObject {
  _id: string;
  company_id: string;
  domain: string;
  status: DomainStatus;
  verification_method: VerificationMethod;
  verification_token: string;
  expected_target: string;
  last_checked_at: string | null;
  last_check_result: DomainLastCheckResult | null;
  verified_at: string | null;
  is_primary: boolean;
  ssl_status: SslStatus;
  ssl_provisioned_at: string | null;
  created_at: string;
  updated_at: string;
  is_trash: boolean
}

export interface CnameInstructions {
  method: "cname";
  record_type: "CNAME";
  record_host: string;
  record_value: string;
  ttl_recommended: number;
  note: string;
}

export interface TxtInstructions {
  method: "txt";
  record_type: "TXT";
  record_host: string;
  record_value: string;
  ttl_recommended: number;
  note: string;
}

export interface HttpInstructions {
  method: "http";
  record_type: null;
  file_url: string;
  file_content: string;
  ttl_recommended: null;
  note: string;
}

export type DomainInstructions = CnameInstructions | TxtInstructions | HttpInstructions;

export interface VerifyDomainResult {
  verified: boolean;
  domain: DomainObject;
  result: {
    ok: boolean;
    observed: string[] | null;
    error: string | null;
  };
  instructions: DomainInstructions;
  methodSwitched?: boolean;
}

export interface DomainUser {
  _id: string;
  u_full_name: string;
  u_email: string;
  u_profile_picture?: string;
  u_role?: string;
  created_at?: string;
}

export interface EnrolUsersResult {
  enrolled: number;
  skipped: number;
  users: DomainUser[];
}

// ─── Workspace Store State ────────────────────────────────────────────────────

interface WorkspaceState {
  workspace: any;
  singleWorkspace: any;
  lanes: any[];
  showSettingPanel: boolean;
  showCreateLaneModal: boolean;
  showUpdateLaneModal: boolean;
  background: string;
  showProfilePanel: boolean;
  showCreateLaneModalWithAI: boolean;
  menuStyle: "classic" | "modern";
  showFilter: boolean;
  selectedLaneIds: string[];
  transitions: any;
  showLimitExccedModal: boolean;
  limits: any;
  pricing: boolean;
  showChatBotPanel: boolean;
  selectedAgent: string;
  isExpanded: boolean;
  themeColors: any;
  domainVerification: VerifyDomainResult | null;
  companyDomains: DomainObject[];
  domainUsers: DomainUser[];
}

export const useWorkspaceStore = defineStore("workspace", {
  state: (): WorkspaceState => ({
    showLimitExccedModal: false,
    workspace: null,
    singleWorkspace: null,
    lanes: [],
    showSettingPanel: false,
    showCreateLaneModal: false,
    showCreateLaneModalWithAI: false,
    showUpdateLaneModal: false,
    background: "var(--bg-body)",
    showProfilePanel: false,
    menuStyle: "classic",
    showFilter: false,
    selectedLaneIds: [],
    transitions: {},
    limits: {},
    pricing: false,
    showChatBotPanel: false,
    selectedAgent: localStorage.getItem("selectedAgentModule") || "",
    isExpanded: false,
    themeColors: null,
    domainVerification: null,
    companyDomains: [],
    domainUsers: [],
  }),

  actions: {
    // ─── Existing actions (unchanged) ────────────────────────────────────────
    setPricing(p: boolean) {
      this.pricing = p;
    },
    setLimitExccedModal(i: any) {
      this.showLimitExccedModal = i;
    },
    setLimit(i: any) {
      this.limits = i;
    },
    setTransition(i: any) {
      this.transitions = i;
    },
    setWorkspace(i: any) {
      this.workspace = i;
      if (i && i.lanes) {
        this.lanes = i.lanes;
      }
      if (i) {
        saveCreateWorkspaceDraft(i);
      }
    },
    hydrateWorkspaceDraft() {
      const draft = loadCreateWorkspaceDraft();
      if (!draft?.workspace) return null;
      this.workspace = draft.workspace;
      if (draft.workspace && (draft.workspace as any).lanes) {
        this.lanes = (draft.workspace as any).lanes;
      }
      return draft.meta ?? null;
    },
    clearWorkspaceDraft() {
      clearCreateWorkspaceDraft();
      this.workspace = null;
    },
    setSingleWorkspace(i: any) {
      this.singleWorkspace = i;
      if (i && i.lanes) {
        this.lanes = i.lanes;
      }
    },
    updateSingleWorkspaceLocal(updatedData: Partial<any>) {
      if (!this.singleWorkspace) return;
      const mergeData = (current: any, updates: any) => {
        const mergedVariables = {
          ...(current.variables || {}),
          ...(updates.variables || {}),
        };
        return { ...current, ...updates, variables: mergedVariables };
      };
      this.singleWorkspace = mergeData(this.singleWorkspace, updatedData);
    },
    setLanes(i: any) {
      this.lanes = i;
    },
    updateLaneLocal(laneId: string, updatedData: Partial<any>) {
      const mergeLaneData = (currentLane: any, updates: any) => {
        const mergedVariables = {
          ...(currentLane.variables || {}),
          ...(updates.variables || {}),
        };
        return { ...currentLane, ...updates, variables: mergedVariables };
      };
      const index = this.lanes.findIndex(
        (l: any) => l.id === laneId || l._id === laneId
      );
      if (index !== -1) {
        const updatedLane = mergeLaneData(this.lanes[index], updatedData);
        const newLanes = [...this.lanes];
        newLanes[index] = updatedLane;
        this.lanes = newLanes;
      }
      if (this.workspace && Array.isArray(this.workspace.lanes)) {
        const wsIndex = this.workspace.lanes.findIndex(
          (l: any) => l.id === laneId || l._id === laneId
        );
        if (wsIndex !== -1) {
          const updatedWsLane = mergeLaneData(
            this.workspace.lanes[wsIndex],
            updatedData
          );
          const newWsLanes = [...this.workspace.lanes];
          newWsLanes[wsIndex] = updatedWsLane;
          this.workspace.lanes = newWsLanes;
        }
      }
      if (this.singleWorkspace && Array.isArray(this.singleWorkspace.lanes)) {
        const swsIndex = this.singleWorkspace.lanes.findIndex(
          (l: any) => l.id === laneId || l._id === laneId
        );
        if (swsIndex !== -1) {
          const updatedSwLane = mergeLaneData(
            this.singleWorkspace.lanes[swsIndex],
            updatedData
          );
          const newSwLanes = [...this.singleWorkspace.lanes];
          newSwLanes[swsIndex] = updatedSwLane;
          this.singleWorkspace.lanes = newSwLanes;
        }
      }
    },
    deleteLaneLocal(laneId: string) {
      this.lanes = this.lanes.filter(
        (l: any) => l.id !== laneId && l._id !== laneId
      );
      if (this.workspace && Array.isArray(this.workspace.lanes)) {
        this.workspace.lanes = this.workspace.lanes.filter(
          (l: any) => l.id !== laneId && l._id !== laneId
        );
      }
      if (this.singleWorkspace && Array.isArray(this.singleWorkspace.lanes)) {
        this.singleWorkspace.lanes = this.singleWorkspace.lanes.filter(
          (l: any) => l.id !== laneId && l._id !== laneId
        );
      }
      const selectedIndex = this.selectedLaneIds.indexOf(laneId);
      if (selectedIndex !== -1) {
        this.selectedLaneIds.splice(selectedIndex, 1);
      }
    },
    addLaneLocal(lane: any) {
      this.lanes = [...this.lanes, lane];
      if (this.workspace && Array.isArray(this.workspace.lanes)) {
        this.workspace.lanes = [...this.workspace.lanes, lane];
      }
      if (this.singleWorkspace && Array.isArray(this.singleWorkspace.lanes)) {
        this.singleWorkspace.lanes = [...this.singleWorkspace.lanes, lane];
      }
    },
    toggleSettingPanel() {
      this.showProfilePanel = false;
      this.showChatBotPanel = false;
      setTimeout(() => {
        this.showSettingPanel = !this.showSettingPanel;
      }, 200);
    },
    toggleAllLane() {
      this.selectedLaneIds = [];
    },
    setSettingPanel(val: boolean) {
      this.showProfilePanel = false;
      setTimeout(() => {
        this.showSettingPanel = val;
      }, 200);
    },
    toggleCreateLaneModal() {
      this.showCreateLaneModal = !this.showCreateLaneModal;
    },
    toggleUpdateLaneModal() {
      this.showUpdateLaneModal = !this.showUpdateLaneModal;
    },
    toggleCreateLaneModalWithAI() {
      this.showCreateLaneModalWithAI = !this.showCreateLaneModalWithAI;
    },
    setBackground(val: string) {
      this.background = val;
    },
    setThemeColors(val: any) {
      this.themeColors = val;
    },
    setMenuType(val: "classic" | "modern") {
      this.menuStyle = val;
    },
    toggleProfilePanel() {
      this.showSettingPanel = false;
      this.showChatBotPanel = false;
      setTimeout(() => {
        this.showProfilePanel = !this.showProfilePanel;
      }, 200);
    },
    toggleChatBotPanel() {
      this.showSettingPanel = false;
      this.showProfilePanel = false;
      setTimeout(() => {
        this.showChatBotPanel = !this.showChatBotPanel;
      }, 200);
    },
    closeChatBotPanel() {
      this.showChatBotPanel = false;
    },
    toggleFilter() {
      this.showFilter = !this.showFilter;
    },
    toggleLane(id: string) {
      const index = this.selectedLaneIds.indexOf(id);
      if (index === -1) {
        this.selectedLaneIds.push(id);
      } else {
        this.selectedLaneIds.splice(index, 1);
      }
    },
    isLaneSelected(id: string): boolean {
      return this.selectedLaneIds.includes(id);
    },
    getFeature(key: string) {
      return this.limits?.features?.find((f: any) => f.key === key);
    },
    saveAgentModule(key: string) {
      localStorage.setItem("selectedAgentModule", key);
      this.selectedAgent = key;
    },
    initSelectedAgent() {
      const saved = localStorage.getItem("selectedAgentModule");
      if (saved) {
        this.selectedAgent = saved;
      }
    },

    // ─── Slug & DNS helpers (existing) ───────────────────────────────────────
    async fetchTitleSlug(slug: string) {
      try {
        const res = await api.get(`tenant/available/${slug}`);
        return res.data?.data ?? null;
      } catch (err: any) {
        console.error("fetchTitleSlug:", err);
        return null;
      }
    },

    async fetchDnsCheck(domain: string) {
      try {
        const res = await api.get(`tenant/dns-check/${domain}`);
        return res.data?.data ?? null;
      } catch (err: any) {
        console.error("fetchDnsCheck:", err);
        return {
          __error: true,
          message:
            err?.response?.data?.message ?? "Could not verify domain.",
        };
      }
    },

    // ─── Domain Verification API ──────────────────────────────────────────────

    /**
     * POST /api/v1/company-domains/verify
     * Registers the domain and immediately runs first verification check.
     */
    async verifyDomain(
      domain: string,
      method: VerificationMethod = "cname"
    ): Promise<VerifyDomainResult> {
      const res = await api.post("company-domains/verify", {
        domain,
        verification_method: method,
        company_id: localStorage.getItem("company_id"),
      });
      const data: VerifyDomainResult = res.data?.data;
      this.domainVerification = data;
      return data;
    },

    /**
     * POST /api/v1:id/recheck
     * Re-runs verification check. Handles 429 by returning retryAfter seconds.
     */
    async recheckDomain(
      domainId: string
    ): Promise<{ data: VerifyDomainResult | null; retryAfter: number | null }> {
      try {
        const res = await api.post(`company-domains/${domainId}/recheck`);
        const data: VerifyDomainResult = res.data?.data;
        this.domainVerification = data;
        return { data, retryAfter: null };
      } catch (err: any) {
        if (err?.response?.status === 429) {
          const retryAfter =
            parseInt(err.response.headers?.["retry-after"] ?? "30", 10) || 30;
          return { data: null, retryAfter };
        }
        throw err;
      }
    },

    /**
     * GET /api/v1/company-domains/:id/verification-file
     * Downloads streamed-verify.txt and triggers browser download.
     */
    async downloadVerificationFile(domainId: string): Promise<void> {
      const res = await api.get(
        `company-domains/${domainId}/verification-file`,
        { responseType: "blob" }
      );
      const blob = new Blob([res.data], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "streamed-verify.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    /**
     * GET /api/v1/company-domains
     * Lists all company domains.
     */
    async listDomains(): Promise<DomainObject[]> {
      const res = await api.get("company-domains");
      const domains: DomainObject[] = res.data?.data?.domains ?? [];
      this.companyDomains = domains;
      return domains;
    },

    /**
     * GET /api/v1/company-domains/:id
     * Gets a single domain by ID.
     */
    async getDomain(
      domainId: string
    ): Promise<{ domain: DomainObject; instructions: DomainInstructions }> {
      const res = await api.get(`company-domains/${domainId}`);
      return res.data?.data;
    },

    /**
     * PUT /api/v1/company-domains/:id/primary
     * Sets a verified domain as primary.
     */
    async setPrimaryDomain(domainId: string): Promise<DomainObject> {
      const res = await api.put(`company-domains/${domainId}/primary`);
      const domain: DomainObject = res.data?.data?.domain;
      if (this.domainVerification?.domain?._id === domainId) {
        this.domainVerification.domain.is_primary = true;
      }
      this.companyDomains = this.companyDomains.map((d) => ({
        ...d,
        is_primary: d._id === domainId,
      }));
      return domain;
    },

    /**
     * DELETE /api/v1/company-domains/:id
     * Soft-deletes a domain.
     */
    async deleteDomain(domainId: string): Promise<void> {
      await api.delete(`company-domains/${domainId}`);
      this.companyDomains = this.companyDomains.filter(
        (d) => d._id !== domainId
      );
      if (this.domainVerification?.domain?._id === domainId) {
        this.domainVerification = null;
      }
    },

    /**
     * GET /api/v1/company-domains/:id/users
     * Lists all users associated with the custom domain.
     * :id here is the company_id stored in localStorage after company creation.
     */
    async listDomainUsers(companyId: string): Promise<DomainUser[]> {
      const res = await api.get(`company-domains/${companyId}/users`);
      const users: DomainUser[] = res.data?.data?.users ?? res.data?.data ?? [];
      this.domainUsers = users;
      return users;
    },
   async enrolDomainUsers(
  companyId: string,
  userIds: string[],
  domain: string        // ← add param
): Promise<EnrolUsersResult> {
  const res = await api.post(`company-domains/${companyId}/enrol-users`, {
    user_ids: userIds,
    domain: domain,     // ← forward it
  });
  return res.data?.data;
},

    /**
     * Clears the local domain verification state.
     */
    clearDomainVerification() {
      this.domainVerification = null;
    },

    /**
     * Clears domain users list.
     */
    clearDomainUsers() {
      this.domainUsers = [];
    },
  },
});