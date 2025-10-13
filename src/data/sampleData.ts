export const sampleBoard = {
    _id: 'board-1',
    title: 'Project Alpha',
    columns: [
      {
        _id: 'backlog',
        title: 'Backlog',
        cards: [
          {
            _id: 'ticket-1',
            title: 'Implement user authentication',
            description: 'Add login and signup functionality with JWT tokens and password reset capability.',
            priority: 'high',
            assignee: 'John Doe',
            estimate: '8h',
            labels: ['backend', 'security']
          },
          {
            _id: 'ticket-2',
            title: 'Design mobile responsive layout',
            description: 'Create responsive design for mobile devices and tablets.',
            priority: 'medium',
            assignee: 'Sarah Chen',
            estimate: '5h',
            labels: ['frontend', 'design']
          },
          {
            _id: 'ticket-3',
            title: 'Set up CI/CD pipeline',
            description: 'Configure automated testing and deployment pipeline.',
            priority: 'low',
            assignee: 'Mike Johnson',
            estimate: '3h',
            labels: ['devops']
          }
        ]
      },
      {
        _id: 'todo',
        title: 'To Do',
        cards: [
          {
            _id: 'ticket-4',
            title: 'Fix database connection timeout',
            description: 'Investigate and resolve intermittent database connection issues.',
            priority: 'critical',
            assignee: 'Alex Rodriguez',
            estimate: '4h',
            labels: ['bug', 'database']
          },
          {
            _id: 'ticket-5',
            title: 'Add user profile page',
            description: 'Create a comprehensive user profile page with edit functionality.',
            priority: 'medium',
            assignee: 'Emily Davis',
            estimate: '6h',
            labels: ['frontend', 'feature']
          }
        ]
      },
      {
        _id: 'progress',
        title: 'In Progress',
        cards: [
          {
            _id: 'ticket-6',
            title: 'Implement search functionality',
            description: 'Add advanced search with filters and sorting options.',
            priority: 'high',
            assignee: 'Dav_id Wilson',
            estimate: '10h',
            labels: ['frontend', 'backend']
          }
        ]
      },
      {
        _id: 'done',
        title: 'Done',
        cards: [
          {
            _id: 'ticket-7',
            title: 'Setup project structure',
            description: 'Initialize project with proper folder structure and dependencies.',
            priority: 'medium',
            assignee: 'Lisa Anderson',
            estimate: '2h',
            labels: ['setup']
          },
          {
            _id: 'ticket-8',
            title: 'Create landing page',
            description: 'Design and implement the main landing page with hero section.',
            priority: 'low',
            assignee: 'Tom Brown',
            estimate: '4h',
            labels: ['frontend', 'design']
          }
        ]
      }
    ]
  };

export const sampleProcessSheets = [
  {
    _id: 'sheet-1',
    title: 'General Process',
    description: 'Standard workflow processes for the team',
    icon: {
      prefix: 'fa-solid',
      iconName: 'fa-diagram-project'
    },
    workspace_id: 'workspace-1',
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    _id: 'sheet-2',
    title: 'Development Workflow',
    description: 'Software development lifecycle processes',
    icon: {
      prefix: 'fa-solid',
      iconName: 'fa-code'
    },
    workspace_id: 'workspace-1',
    created_at: '2024-01-20T14:30:00Z'
  },
  {
    _id: 'sheet-3',
    title: 'Design Process',
    description: 'Design review and approval workflow',
    icon: {
      prefix: 'fa-solid',
      iconName: 'fa-palette'
    },
    workspace_id: 'workspace-1',
    created_at: '2024-02-01T09:15:00Z'
  }
];

export const sampleProcessColumns = [
  {
    id: 'col-1',
    _id: 'col-1',
    sheet_id: 'sheet-1',
    workspace_id: 'workspace-1',
    title: 'Active Processes',
    order: 0,
    created_at: '2024-01-15T10:00:00Z',
    processes: []
  },
  {
    id: 'col-2',
    _id: 'col-2',
    sheet_id: 'sheet-1',
    workspace_id: 'workspace-1',
    title: 'Under Review',
    order: 1,
    created_at: '2024-01-15T10:00:00Z',
    processes: []
  },
  {
    id: 'col-3',
    _id: 'col-3',
    sheet_id: 'sheet-2',
    workspace_id: 'workspace-1',
    title: 'Development',
    order: 0,
    created_at: '2024-01-20T14:30:00Z',
    processes: []
  },
  {
    id: 'col-4',
    _id: 'col-4',
    sheet_id: 'sheet-3',
    workspace_id: 'workspace-1',
    title: 'Design Queue',
    order: 0,
    created_at: '2024-02-01T09:15:00Z',
    processes: []
  }
];

export const sampleProcesses = [
  {
    id: 'process-1',
    _id: 'process-1',
    workspace_id: 'workspace-1',
    title: 'General Process',
    description: 'Standard workflow for handling general tasks and approvals',
    column_id: 'col-1',
    order: 0,
    status_count: 4,
    transition_count: 5,
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'process-2',
    _id: 'process-2',
    workspace_id: 'workspace-1',
    title: 'Onboarding Process',
    description: 'New employee onboarding workflow with multiple checkpoints',
    column_id: 'col-1',
    order: 1,
    status_count: 5,
    transition_count: 6,
    created_at: '2024-01-16T11:20:00Z'
  },
  {
    id: 'process-3',
    _id: 'process-3',
    workspace_id: 'workspace-1',
    title: 'Approval Workflow',
    description: 'Multi-level approval process for important decisions',
    column_id: 'col-2',
    order: 0,
    status_count: 3,
    transition_count: 4,
    created_at: '2024-01-17T09:45:00Z'
  },
  {
    id: 'process-4',
    _id: 'process-4',
    workspace_id: 'workspace-1',
    title: 'Feature Development',
    description: 'End-to-end feature development workflow',
    column_id: 'col-3',
    order: 0,
    status_count: 6,
    transition_count: 8,
    created_at: '2024-01-20T14:30:00Z'
  },
  {
    id: 'process-5',
    _id: 'process-5',
    workspace_id: 'workspace-1',
    title: 'Bug Triage',
    description: 'Process for triaging and prioritizing bugs',
    column_id: 'col-3',
    order: 1,
    status_count: 4,
    transition_count: 5,
    created_at: '2024-01-21T16:00:00Z'
  },
  {
    id: 'process-6',
    _id: 'process-6',
    workspace_id: 'workspace-1',
    title: 'Design Review',
    description: 'Comprehensive design review and feedback process',
    column_id: 'col-4',
    order: 0,
    status_count: 4,
    transition_count: 6,
    created_at: '2024-02-01T09:15:00Z'
  }
];

export const sampleWorkflowStatuses = [
  {
    id: 'status-1',
    process_id: 'process-1',
    status_name: 'Create',
    category: 'todo',
    status_color: '#6b7280',
    position_x: 300,
    position_y: 150,
    order: 0,
    is_initial: true,
    is_final: false
  },
  {
    id: 'status-2',
    process_id: 'process-1',
    status_name: 'To Do',
    category: 'todo',
    status_color: '#6b7280',
    position_x: 600,
    position_y: 350,
    order: 1,
    is_initial: false,
    is_final: false
  },
  {
    id: 'status-3',
    process_id: 'process-1',
    status_name: 'In Progress',
    category: 'inprogress',
    status_color: '#3b82f6',
    position_x: 900,
    position_y: 220,
    order: 2,
    is_initial: false,
    is_final: false
  },
  {
    id: 'status-4',
    process_id: 'process-1',
    status_name: 'Done',
    category: 'done',
    status_color: '#10b981',
    position_x: 1200,
    position_y: 400,
    order: 3,
    is_initial: false,
    is_final: true
  }
];

export const sampleWorkflowTransitions = [
  {
    id: 'transition-1',
    process_id: 'process-1',
    from_status_id: 'status-1',
    to_status_id: 'status-2',
    transition_label: 'Start Task',
    rules: []
  },
  {
    id: 'transition-2',
    process_id: 'process-1',
    from_status_id: 'status-2',
    to_status_id: 'status-3',
    transition_label: 'Begin Work',
    rules: []
  },
  {
    id: 'transition-3',
    process_id: 'process-1',
    from_status_id: 'status-3',
    to_status_id: 'status-4',
    transition_label: 'Complete',
    rules: []
  },
  {
    id: 'transition-4',
    process_id: 'process-1',
    from_status_id: 'status-3',
    to_status_id: 'status-2',
    transition_label: 'Need Revision',
    rules: []
  },
  {
    id: 'transition-5',
    process_id: 'process-1',
    from_status_id: 'status-2',
    to_status_id: 'status-4',
    transition_label: 'Skip to Done',
    rules: []
  }
];