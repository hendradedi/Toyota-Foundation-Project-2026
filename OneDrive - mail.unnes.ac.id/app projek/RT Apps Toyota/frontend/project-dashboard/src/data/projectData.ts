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
    status: 'completed',
    progress: 100,
    startDate: '2026-05-16',
    endDate: '2026-05-18',
    description: 'WebSocket implementation and mobile app development',
    subPhases: [
      {
        id: 'phase-3-1',
        name: 'WebSocket Server',
        status: 'completed',
        progress: 100,
        filesCreated: 5,
        linesOfCode: 850,
        endpoints: 8,
        description: 'Real-time communication infrastructure with Socket.IO',
        issues: [],
      },
      {
        id: 'phase-3-2',
        name: 'Push Notifications',
        status: 'completed',
        progress: 100,
        filesCreated: 3,
        linesOfCode: 450,
        endpoints: 4,
        description: 'Firebase Cloud Messaging integration',
        issues: [],
      },
      {
        id: 'phase-3-3',
        name: 'Mobile App - React Native',
        status: 'completed',
        progress: 100,
        filesCreated: 35,
        linesOfCode: 4500,
        endpoints: 0,
        description: 'Cross-platform mobile application with complete UI',
        issues: [],
      },
      {
        id: 'phase-3-4',
        name: 'Offline Support',
        status: 'completed',
        progress: 100,
        filesCreated: 4,
        linesOfCode: 600,
        endpoints: 0,
        description: 'Local storage and sync mechanism with Zustand',
        issues: [],
      },
    ],
  },
  {
    id: 'phase-4',
    name: 'Phase 4: Advanced Features',
    status: 'completed',
    progress: 100,
    startDate: '2026-05-16',
    endDate: '2026-05-18',
    description: 'Analytics, i18n, chat, and advanced functionality',
    subPhases: [
      {
        id: 'phase-4-1',
        name: 'Analytics Dashboard',
        status: 'completed',
        progress: 100,
        filesCreated: 4,
        linesOfCode: 750,
        endpoints: 6,
        description: 'Comprehensive analytics and insights with unified dashboard',
        issues: [],
      },
      {
        id: 'phase-4-2',
        name: 'i18n Framework',
        status: 'completed',
        progress: 100,
        filesCreated: 25,
        linesOfCode: 1200,
        endpoints: 3,
        description: 'Multilingual support (ID, EN, TH) with i18next',
        issues: [],
      },
      {
        id: 'phase-4-3',
        name: 'Chat & Messaging',
        status: 'completed',
        progress: 100,
        filesCreated: 6,
        linesOfCode: 1100,
        endpoints: 8,
        description: 'Real-time chat system with WebSocket',
        issues: [],
      },
      {
        id: 'phase-4-4',
        name: 'Registration Code System',
        status: 'completed',
        progress: 100,
        filesCreated: 4,
        linesOfCode: 650,
        endpoints: 4,
        description: 'Secure registration code generation and validation',
        issues: [],
      },
    ],
  },
  {
    id: 'phase-5',
    name: 'Phase 5: Testing & Deployment',
    status: 'completed',
    progress: 100,
    startDate: '2026-05-17',
    endDate: '2026-05-20',
    description: 'Comprehensive testing and production deployment',
    subPhases: [
      {
        id: 'phase-5-1',
        name: 'API Testing',
        status: 'completed',
        progress: 100,
        filesCreated: 8,
        linesOfCode: 1500,
        endpoints: 0,
        description: 'PowerShell test scripts for all API endpoints',
        issues: [],
      },
      {
        id: 'phase-5-2',
        name: 'Integration Testing',
        status: 'completed',
        progress: 100,
        filesCreated: 5,
        linesOfCode: 800,
        endpoints: 0,
        description: 'Cross-module workflow testing',
        issues: [],
      },
      {
        id: 'phase-5-3',
        name: 'Docker Setup',
        status: 'completed',
        progress: 100,
        filesCreated: 6,
        linesOfCode: 450,
        endpoints: 0,
        description: 'Docker Compose for dev and production',
        issues: [],
      },
      {
        id: 'phase-5-4',
        name: 'Production Deployment',
        status: 'completed',
        progress: 100,
        filesCreated: 8,
        linesOfCode: 600,
        endpoints: 0,
        description: 'Deployment guides and GitHub Pages setup',
        issues: [],
      },
    ],
  },
];

export const knownIssues: Issue[] = [
  {
    id: 'issue-1',
    title: 'TypeScript Module Resolution',
    description: '@rt-muban/shared module not found errors - resolved after build',
    severity: 'medium',
    status: 'resolved',
    createdAt: '2026-05-15T14:00:00Z',
    resolvedAt: '2026-05-18T10:00:00Z',
  },
  {
    id: 'issue-2',
    title: 'Deprecated moduleResolution',
    description: 'TypeScript moduleResolution: node is deprecated - updated to bundler',
    severity: 'low',
    status: 'resolved',
    createdAt: '2026-05-15T14:00:00Z',
    resolvedAt: '2026-05-18T10:00:00Z',
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
