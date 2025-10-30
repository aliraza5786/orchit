import { defineStore } from "pinia";

// Define types for state
interface WorkspaceState {
  workspace: any;
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
}

export const useWorkspaceStore = defineStore("workspace", {
  state: (): WorkspaceState => ({
    showLimitExccedModal: false,
    workspace: null,
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
    pricing:true
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
    },
    toggleSettingPanel() {
      this.showProfilePanel = false;
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
      setTimeout(() => {
        this.showProfilePanel = !this.showProfilePanel;
      }, 200);
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
  },
});
