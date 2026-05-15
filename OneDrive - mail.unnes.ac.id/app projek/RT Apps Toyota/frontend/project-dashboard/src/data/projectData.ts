export interface ProjectPhase {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  progress: number;
  startDate: string;
  endDate?: string;
  subPhases: SubPhase[];
  description: string;
}

export interface SubPhase {
  id: string;
  name: string;
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  progress: number;
  filesCreated: number;
  linesOfCode: number;
  endpoints: number;
  description: string;
  issues: Issue[];
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface ProjectStats {
  totalEndpoints: number;
  totalFiles: number;
  totalLinesOfCode: number;
  totalServices: number;
  totalTables: number;
  completedPhases: number;
  totalPhases: number;
  overallProgress: number;
  lastUpdated: string;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  uptime: number;
  responseTime: number;
  lastCheck: string;
}

export const projectData: ProjectPhase[] = [
  {
    id: 'phase-1',
    name: 'Phase 1: Foundation',
    status: 'completed',
    progress: 100,
    startDate: '2026-05-01',
    endDate: '2026-05-10',
    description: 'Project setup, authentication, and core infrastructure',
    subPhases: [
      {
        id: 'phase-1-1',
        name: 'Project Setup',
        status: 'completed',
        progress: 100,
        filesCreated: 15,
        linesOfCode: 500,
        endpoints: 0,
        description: 'Initialize backend structure and dependencies',
        issues: [],
      },
      {
        id: 'phase-1-2',
        name: 'Database Configuration',
        status: 'completed',
        progress: 100,
        filesCreated: 3,
        linesOfCode: 800,
        endpoints: 0,
        description: 'Configure database connection and migrations',
        issues: [],
      },
      {
        id: 'phase-1-3',
        name: 'Authentication System',
        status: 'completed',
        progress: 100,
        filesCreated: 4,
        linesOfCode: 600,
        endpoints: 4,
        description: 'Implement JWT authentication with bcrypt',
        issues: [],
      },
      {
        id: 'phase-1-4',
        name: 'API Gateway',
        status: 'completed',
        progress: 100,
        filesCreated: 8,
        linesOfCode: 450,
        endpoints: 0,
        description: 'Set up API Gateway with middleware',
        issues: [],
      },
      {
        id: 'phase-1-5',
        name: 'Shared Utilities',
        status: 'completed',
        progress: 100,
        filesCreated: 6,
        linesOfCode: 400,
        endpoints: 0,
        description: 'Create shared utilities and types',
        issues: [],
      },
      {
        id: 'phase-1-6',
        name: 'RBAC System',
        status: 'completed',
        progress: 100,
        filesCreated: 2,
        linesOfCode: 350,
        endpoints: 0,
        description: 'Implement Role-Based Access Control',
        issues: [],
      },
      {
        id: 'phase-1-7',
        name: 'User Management',
        status: 'completed',
        progress: 100,
        filesCreated: 4,
        linesOfCode: 550,
        endpoints: 4,
        description: 'Build user management endpoints',
        issues: [],
      },
      {
        id: 'phase-1-8',
        name: 'Admin Dashboard',
        status: 'completed',
        progress: 100,
        filesCreated: 12,
        linesOfCode: 1200,
        endpoints: 0,
        description: 'Create admin dashboard foundation',
        issues: [],
      },
    ],
  },
  {
    id: 'phase-2',
    name: 'Phase 2: Core Features',
    status: 'completed',
    progress: 100,
    startDate: '2026-05-11',
    endDate: '2026-05-15',
    description: 'Waste banking, marketplace, SOS, and patrol systems',
    subPhases: [
      {
        id: 'phase-2-1',
        name: 'Waste Banking - Deposits',
        status: 'completed',
        progress: 100,
        filesCreated: 6,
        linesOfCode: 800,
        endpoints: 7,
        description: 'Deposit recording system with categories',
        issues: [],
      },
      {
        id: 'phase-2-2',
        name: 'Waste Banking - Points',
        status: 'completed',
        progress: 100,
        filesCreated: 2,
        linesOfCode: 650,
        endpoints: 6,
        description: 'Points calculation engine with leaderboard',
        issues: [],
      },
      {
        id: 'phase-2-3',
        name: 'Marketplace - Business',
        status: 'completed',
        progress: 100,
        filesCreated: 5,
        linesOfCode: 1200,
        endpoints: 12,
        description: 'Business and product management',
        issues: [],
      },
      {
        id: 'phase-2-4',
        name: 'Marketplace - Orders',
        status: 'completed',
        progress: 100,
        filesCreated: 3,
        linesOfCode: 950,
        endpoints: 8,
        description: 'Order processing system',
        issues: [],
      },
      {
        id: 'phase-2-5',
        name: 'SOS Alert System',
        status: 'completed',
        progress: 100,
        filesCreated: 4,
        linesOfCode: 1100,
        endpoints: 10,
        description: 'Real-time alert broadcasting',
        issues: [],
      },
      {
        id: 'phase-2-6',
        name: 'Patrol Scheduling',
        status: 'completed',
        progress: 100,
        filesCreated: 4,
        linesOfCode: 1050,
        endpoints: 10,
        description: 'Shift scheduling system',
        issues: [],
      },
    ],
  },
  {
    id: 'phase-3',
    name: 'Phase 3: Real-time & Mobile',
    status: 'pending',
    progress: 0,
    startDate: '2026-05-16',
    description: 'WebSocket implementation and mobile app development',
    subPhases: [
      {
        id: 'phase-3-1',
        name: 'WebSocket Server',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'Real-time communication infrastructure',
        issues: [],
      },
      {
        id: 'phase-3-2',
        name: 'Push Notifications',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'Firebase Cloud Messaging integration',
        issues: [],
      },
      {
        id: 'phase-3-3',
        name: 'Mobile App - React Native',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'Cross-platform mobile application',
        issues: [],
      },
      {
        id: 'phase-3-4',
        name: 'Offline Support',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'Local storage and sync mechanism',
        issues: [],
      },
    ],
  },
  {
    id: 'phase-4',
    name: 'Phase 4: Advanced Features',
    status: 'pending',
    progress: 0,
    startDate: '2026-06-01',
    description: 'Analytics, reporting, and advanced functionality',
    subPhases: [
      {
        id: 'phase-4-1',
        name: 'Analytics Dashboard',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'Comprehensive analytics and insights',
        issues: [],
      },
      {
        id: 'phase-4-2',
        name: 'Reporting System',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'PDF and Excel report generation',
        issues: [],
      },
      {
        id: 'phase-4-3',
        name: 'Advanced Search',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'Elasticsearch integration',
        issues: [],
      },
      {
        id: 'phase-4-4',
        name: 'AI Features',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'ML-based recommendations and predictions',
        issues: [],
      },
    ],
  },
  {
    id: 'phase-5',
    name: 'Phase 5: Testing & Deployment',
    status: 'pending',
    progress: 0,
    startDate: '2026-07-01',
    description: 'Comprehensive testing and production deployment',
    subPhases: [
      {
        id: 'phase-5-1',
        name: 'Unit Testing',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'Jest unit tests for all services',
        issues: [],
      },
      {
        id: 'phase-5-2',
        name: 'Integration Testing',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'API integration tests',
        issues: [],
      },
      {
        id: 'phase-5-3',
        name: 'E2E Testing',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'End-to-end user flow testing',
        issues: [],
      },
      {
        id: 'phase-5-4',
        name: 'Production Deployment',
        status: 'pending',
        progress: 0,
        filesCreated: 0,
        linesOfCode: 0,
        endpoints: 0,
        description: 'AWS/GCP deployment with CI/CD',
        issues: [],
      },
    ],
  },
];

export const knownIssues: Issue[] = [
  {
    id: 'issue-1',
    title: 'TypeScript Module Resolution',
    description: '@rt-muban/shared module not found errors - will resolve after build',
    severity: 'medium',
    status: 'open',
    createdAt: '2026-05-15T14:00:00Z',
  },
  {
    id: 'issue-2',
    title: 'Deprecated moduleResolution',
    description: 'TypeScript moduleResolution: node is deprecated',
    severity: 'low',
    status: 'open',
    createdAt: '2026-05-15T14:00:00Z',
  },
];

export const calculateProjectStats = (): ProjectStats => {
  let totalEndpoints = 0;
  let totalFiles = 0;
  let totalLinesOfCode = 0;
  let completedPhases = 0;

  projectData.forEach((phase) => {
    if (phase.status === 'completed') {
      completedPhases++;
    }
    phase.subPhases.forEach((subPhase) => {
      totalEndpoints += subPhase.endpoints;
      totalFiles += subPhase.filesCreated;
      totalLinesOfCode += subPhase.linesOfCode;
    });
  });

  const overallProgress = (completedPhases / projectData.length) * 100;

  return {
    totalEndpoints,
    totalFiles,
    totalLinesOfCode,
    totalServices: 6,
    totalTables: 30,
    completedPhases,
    totalPhases: projectData.length,
    overallProgress,
    lastUpdated: new Date().toISOString(),
  };
};
