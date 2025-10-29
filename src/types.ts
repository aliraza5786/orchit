export interface SelectOption {
    label: string
    value: string
    icon?: string
  }

export interface TeamWorkloadMember {
  assignee_id: string | null
  assignee_name: string
  avatar_url: string | null
  initials?: string
  work_distribution_percentage: number
  total_tasks: number
  total_hours: number
}

export interface DashboardTeamsData {
  team_workload: TeamWorkloadMember[]
  total_capacity: number
  team_size: number
}

export interface DashboardTeamsResponse {
  status: boolean
  message: string
  data: DashboardTeamsData
}

  // e.g., in `src/types/google.d.ts`
export {};

declare global {
  interface Window {
    google: any; // or better typing if needed
  }
}

declare global {
  interface Window {
    AppleID: any; // or better typing if needed
  }
}
