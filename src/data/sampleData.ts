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