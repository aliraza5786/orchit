import { defineStore } from "pinia";
import api from "../libs/api";
// Define types for state
interface WorkspaceState {
  workspace: any;
  singleWorkspace: any,
  lanes: any[]; 
  showSettingPanel: boolean;
  showCreateLaneModal: boolean;
  showUpdateLaneModal: boolean;
  background: string;
  showProfilePanel: boolean;
  showCreateLaneModalWithAI: boolean;
  menuStyle: "classic" | "modern";
  showFilter: boolean;
  selectedLaneIds: string[]; // Updated to use string[] since ids are strings
  transitions: any;
  showLimitExccedModal: boolean;
  limits:any
  pricing:boolean
  showChatBotPanel: boolean
  selectedAgent:string
  isExpanded:boolean
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
    limits:{},
    pricing:false,
    showChatBotPanel: false,
    selectedAgent: localStorage.getItem("selectedAgentModule") || "",
    isExpanded:false
  }),
  actions: {
    setPricing(p:boolean){
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
          ...(updates.variables || {})
        };
        return {
          ...current,
          ...updates,
          variables: mergedVariables
        };
      };

      this.singleWorkspace = mergeData(this.singleWorkspace, updatedData);
    },
    setLanes(i:any){
       this.lanes= i;
    },
      // ---- Local lane update ----
    updateLaneLocal(laneId: string, updatedData: Partial<any>) {
      // Helper to merge variables safely
      const mergeLaneData = (currentLane: any, updates: any) => {
        const mergedVariables = {
          ...(currentLane.variables || {}),
          ...(updates.variables || {})
        };
        return {
          ...currentLane,
          ...updates,
          variables: mergedVariables
        };
      };

      // 1. Update standalone lanes array
      const index = this.lanes.findIndex(
        (l: any) => l.id === laneId || l._id === laneId
      );
      if (index !== -1) {
        const updatedLane = mergeLaneData(this.lanes[index], updatedData);
        // Create new array to ensure reactivity
        const newLanes = [...this.lanes];
        newLanes[index] = updatedLane;
        this.lanes = newLanes;
      }

      // 2. Update workspace.lanes array (for WorkSpaceNav)
      if (this.workspace && Array.isArray(this.workspace.lanes)) {
        const wsIndex = this.workspace.lanes.findIndex(
           (l: any) => l.id === laneId || l._id === laneId
        );
        if (wsIndex !== -1) {
           const updatedWsLane = mergeLaneData(this.workspace.lanes[wsIndex], updatedData);
           // Create new array to ensure reactivity
           const newWsLanes = [...this.workspace.lanes];
           newWsLanes[wsIndex] = updatedWsLane;
           this.workspace.lanes = newWsLanes;
        }
      }

      // 3. Update singleWorkspace.lanes array
      if (this.singleWorkspace && Array.isArray(this.singleWorkspace.lanes)) {
        const swsIndex = this.singleWorkspace.lanes.findIndex(
          (l: any) => l.id === laneId || l._id === laneId
        );
        if (swsIndex !== -1) {
          const updatedSwLane = mergeLaneData(this.singleWorkspace.lanes[swsIndex], updatedData);
          const newSwLanes = [...this.singleWorkspace.lanes];
          newSwLanes[swsIndex] = updatedSwLane;
          this.singleWorkspace.lanes = newSwLanes;
        }
      }
    },

    // ---- Local lane delete ----
    deleteLaneLocal(laneId: string) {
      // 1. Update standalone lanes array
      this.lanes = this.lanes.filter(
        (l: any) => l.id !== laneId && l._id !== laneId
      );

      // 2. Update workspace.lanes if applicable
      if (this.workspace && Array.isArray(this.workspace.lanes)) {
        this.workspace.lanes = this.workspace.lanes.filter(
          (l: any) => l.id !== laneId && l._id !== laneId
        );
      }

      // 3. Update singleWorkspace.lanes if applicable
      if (this.singleWorkspace && Array.isArray(this.singleWorkspace.lanes)) {
        this.singleWorkspace.lanes = this.singleWorkspace.lanes.filter(
          (l: any) => l.id !== laneId && l._id !== laneId
        );
      }

      // Also remove from selectedLaneIds if selected
      const selectedIndex = this.selectedLaneIds.indexOf(laneId);
      if (selectedIndex !== -1) {
        this.selectedLaneIds.splice(selectedIndex, 1);
      }
    },
   addLaneLocal(lane: any) {
     // Create a new array reference so Vue detects the change
     this.lanes = [...this.lanes, lane];
     // Also update workspace.lanes if your components rely on it
     if (this.workspace && Array.isArray(this.workspace.lanes)) {
      this.workspace.lanes = [...this.workspace.lanes, lane];
     }
     // 3. Update singleWorkspace.lanes
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
      // Changed to string
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
    saveAgentModule(key:string){
      localStorage.setItem("selectedAgentModule",key)
      this.selectedAgent=key;
    },
    initSelectedAgent() {
  const saved = localStorage.getItem("selectedAgentModule");
  if (saved) {
    this.selectedAgent = saved;
  }
},
async fetchTitleSlug(slug: string) {
      try {
        const res = await api.get(`tenant/available/${slug}`);
        const data = res.data?.data;
        return data;
      } catch (err: any) {
        console.error("fetchWidgetData:", err);
        return null;
      } finally {
       console.log("completed");
       
      }
    },
    // async fetchWorkspaceBySlug(slug: string) {
    //   try {
    //     const res = await api.get(`tenant/workspace/${slug}`);
    //     const data = res.data?.data;
    //     return data;
    //   } catch (err: any) {
    //     console.error("fetchWorkspaceBySlug:", err);
    //     return null;
    //   }
    // },
  },
});