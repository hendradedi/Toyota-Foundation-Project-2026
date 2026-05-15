# 📊 RT Apps Toyota - Project Dashboard

Interactive real-time dashboard for monitoring the development progress of the RT Apps Toyota application. Track project phases, issues, service health, and development activities in one comprehensive view.

## 🎯 Features

- **Real-time Progress Tracking**: Monitor project completion percentage and phase progress
- **Interactive Visualizations**: Charts and timelines showing project development
- **Issue Tracking**: Record and track development issues with severity levels
- **Service Health Monitoring**: Monitor all microservices status
- **Recent Activity Feed**: View latest development activities
- **Auto-refresh**: Dashboard updates every 30 seconds
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode Support**: Easy on the eyes with built-in dark mode

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The dashboard will be available at `http://localhost:3006`

## 📁 Project Structure

```
frontend/project-dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with auto-refresh
│   │   ├── page.tsx            # Main dashboard page
│   │   └── globals.css         # Global styles
│   ├── components/
│   │   ├── StatsOverview.tsx   # Statistics cards
│   │   ├── PhaseTimeline.tsx   # Project timeline
│   │   ├── ProgressChart.tsx   # Progress visualizations
│   │   ├── IssueTracker.tsx    # Issue tracking
│   │   ├── ServiceHealth.tsx   # Service monitoring
│   │   └── RecentActivity.tsx  # Activity feed
│   └── data/
│       └── projectData.ts      # Project data and statistics
├── scripts/
│   ├── deploy.js               # Deployment script
│   └── update-data.js          # Auto-update data script
├── .github/
│   └── workflows/
│       ├── deploy.yml          # GitHub Pages deployment
│       └── update-data.yml     # Auto-update workflow
└── package.json
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DASHBOARD_REFRESH_INTERVAL=30000

# GitHub Configuration (for auto-updates)
GITHUB_TOKEN=your_github_token
GITHUB_REPO=your-username/your-repo
```

### Customizing Dashboard Data

Edit [`src/data/projectData.ts`](src/data/projectData.ts) to update:
- Project phases and milestones
- Service configurations
- Issue tracking data
- Team members

## 📊 Dashboard Components

### Stats Overview
Displays key metrics:
- Overall project progress percentage
- Total API endpoints
- Total source files
- Database tables count

### Phase Timeline
Visual representation of project phases:
- Phase 1: Foundation (Completed)
- Phase 2: Core Features (Completed)
- Phase 3: Advanced Features (In Progress)
- Phase 4: Testing & QA (Pending)
- Phase 5: Deployment (Pending)

### Progress Charts
- **Bar Chart**: Phase-by-phase progress comparison
- **Pie Chart**: Overall project completion breakdown

### Issue Tracker
Track development issues with:
- Issue ID and title
- Severity levels (Critical, High, Medium, Low)
- Status (Open, In Progress, Resolved)
- Assignment and due dates

### Service Health
Monitor microservices:
- User Service
- Marketplace Service
- Waste Bank Service
- Patrol Service
- SOS Service
- Neighborhood Service

### Recent Activity
Latest development activities with timestamps and descriptions.

## 🚀 Deployment

### Deploy to GitHub Pages

1. **Push to GitHub**:
```bash
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select `main` branch and `/out` folder as source
   - Save

3. **Automatic Deployment**:
   - GitHub Actions will automatically build and deploy on push
   - Dashboard will be available at: `https://your-username.github.io/your-repo/`

### Manual Deployment

```bash
# Build and deploy
npm run deploy

# Or manually
npm run build
git add .
git commit -m "chore: update dashboard"
git push origin main
```

## 🔄 Auto-Update Mechanism

The dashboard automatically updates project data through:

1. **Scheduled Updates**: Every 6 hours via GitHub Actions
2. **Push Triggers**: On any push to main branch
3. **Manual Updates**: Run `npm run update-data` locally

### Update Data Script

```bash
# Update project statistics automatically
node scripts/update-data.js
```

This script:
- Counts source files by type
- Analyzes API endpoints
- Counts database tables
- Calculates project progress
- Updates `projectData.ts`

## 📈 Monitoring

### Real-time Updates
- Dashboard refreshes every 30 seconds
- Automatic data synchronization
- Live service health status

### Metrics Tracked
- Project completion percentage
- Phase progress
- Issue count and severity
- Service uptime
- Development velocity

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server on port 3006

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier

# Deployment
npm run deploy       # Deploy to GitHub Pages
npm run update-data  # Update project statistics
```

### Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: Zustand
- **HTTP Client**: Axios

## 📝 Updating Dashboard Data

### Manual Update

Edit [`src/data/projectData.ts`](src/data/projectData.ts):

```typescript
export const projectData = {
  overallProgress: 40,
  totalEndpoints: 60,
  totalFiles: 35,
  totalTables: 30,
  phases: [
    {
      id: 1,
      name: 'Foundation',
      description: 'Project setup and core infrastructure',
      progress: 100,
      completed: true,
      // ... more data
    },
    // ... more phases
  ],
  // ... more data
};
```

### Automatic Update

The GitHub Actions workflow automatically updates data:
- On every push to main branch
- Every 6 hours (scheduled)
- When project files change

## 🐛 Troubleshooting

### Dashboard not loading
- Check if port 3006 is available
- Verify Node.js version (18+)
- Clear `.next` folder and rebuild

### GitHub Pages not updating
- Verify GitHub Actions is enabled
- Check workflow status in Actions tab
- Ensure branch protection rules allow deployments

### Data not updating
- Run `npm run update-data` manually
- Check GitHub Actions logs
- Verify `projectData.ts` is writable

## 📚 Documentation

- [Technical Architecture](../../plans/digital-rt-muban-technical-architecture.md)
- [API Documentation](../../plans/api-documentation.md)
- [Database Schema](../../plans/database-schema.md)
- [Implementation Plan](../../plans/implementation-plan.md)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test locally with `npm run dev`
4. Commit with clear messages
5. Push and create a pull request

## 📄 License

This project is part of the RT Apps Toyota initiative.

## 📞 Support

For issues or questions:
1. Check existing GitHub issues
2. Review documentation
3. Contact the development team

---

**Last Updated**: 2026-05-15  
**Dashboard Version**: 1.0.0  
**Status**: Active Development
