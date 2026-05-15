# 🚀 Project Dashboard Deployment Guide

## Overview

This guide walks you through deploying the RT Apps Toyota Project Dashboard to GitHub Pages with automatic updates.

## Prerequisites

- GitHub account
- Git installed locally
- Node.js 18+ installed
- Dashboard project built successfully

## Step 1: Initialize Git Repository

If not already initialized:

```bash
cd frontend/project-dashboard
git init
git config user.name "Your Name"
git config user.email "your.email@github.com"
```

## Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `rt-apps-toyota-dashboard`
3. Choose public or private (public recommended for team access)
4. Do NOT initialize with README, .gitignore, or license
5. Click "Create repository"

## Step 3: Add Remote and Push

```bash
# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/rt-apps-toyota-dashboard.git

# Add all files
git add .

# Create initial commit
git commit -m "feat: initial project dashboard setup"

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under "Build and deployment":
   - Source: Select "GitHub Actions"
   - This will automatically use the workflow we created
4. Save settings

## Step 5: Configure GitHub Actions

The workflows are already configured in `.github/workflows/`:

- **`deploy.yml`**: Builds and deploys to GitHub Pages on every push
- **`update-data.yml`**: Automatically updates project data every 6 hours

### Verify Workflows

1. Go to **Actions** tab in your repository
2. You should see two workflows:
   - "Deploy Project Dashboard"
   - "Auto-Update Dashboard Data"
3. Click on a workflow to see its status

## Step 6: Access Your Dashboard

After the first deployment completes:

```
https://YOUR_USERNAME.github.io/rt-apps-toyota-dashboard/
```

Example: `https://johndoe.github.io/rt-apps-toyota-dashboard/`

## Step 7: Set Up Auto-Updates (Optional)

### Option A: Automatic Updates via GitHub Actions

The dashboard automatically updates every 6 hours via the scheduled workflow. No additional setup needed!

### Option B: Manual Updates

To manually update project data:

```bash
# Update statistics from project files
npm run update-data

# Commit and push
git add src/data/projectData.ts
git commit -m "chore: update dashboard data"
git push origin main
```

## Step 8: Configure Environment Variables (Optional)

Create `.env.local` in the project root:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_DASHBOARD_REFRESH_INTERVAL=30000

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=YOUR_USERNAME/rt-apps-toyota-dashboard
```

## Troubleshooting

### Dashboard not deploying

**Problem**: GitHub Actions workflow fails

**Solution**:
1. Check Actions tab for error logs
2. Verify `.github/workflows/deploy.yml` exists
3. Ensure branch is set to `main` in Pages settings
4. Try manual push: `git push origin main`

### Data not updating

**Problem**: Project statistics are outdated

**Solution**:
1. Run `npm run update-data` locally
2. Commit and push changes
3. Or wait for scheduled update (every 6 hours)

### Dashboard shows 404

**Problem**: Page not found after deployment

**Solution**:
1. Verify repository name in URL
2. Check GitHub Pages is enabled in Settings
3. Wait 1-2 minutes for deployment to complete
4. Clear browser cache (Ctrl+Shift+Delete)

### Custom domain (Optional)

To use a custom domain:

1. Go to **Settings** → **Pages**
2. Under "Custom domain", enter your domain
3. Add DNS records as instructed by GitHub
4. Verify domain ownership

## Monitoring Deployments

### View Deployment Status

1. Go to **Actions** tab
2. Click on the latest workflow run
3. View build logs and deployment status

### View Live Dashboard

- Visit: `https://YOUR_USERNAME.github.io/rt-apps-toyota-dashboard/`
- Dashboard auto-refreshes every 30 seconds
- Check browser console for any errors (F12)

## Updating Dashboard Content

### Update Project Data

Edit [`src/data/projectData.ts`](../src/data/projectData.ts):

```typescript
export const projectData = {
  overallProgress: 45,  // Update percentage
  totalEndpoints: 65,   // Update count
  totalFiles: 40,       // Update count
  totalTables: 32,      // Update count
  phases: [
    // Update phase information
  ],
  issues: [
    // Add/update issues
  ],
  services: [
    // Update service status
  ],
};
```

Then commit and push:

```bash
git add src/data/projectData.ts
git commit -m "chore: update project statistics"
git push origin main
```

### Update Dashboard Styling

Edit Tailwind CSS in component files or [`src/app/globals.css`](../src/app/globals.css)

### Add New Components

1. Create component in `src/components/`
2. Import in [`src/app/page.tsx`](../src/app/page.tsx)
3. Add to dashboard layout
4. Commit and push

## Performance Optimization

### Build Size

Current build size: ~197 KB (First Load JS)

To optimize further:
- Remove unused dependencies
- Enable image optimization
- Use dynamic imports for heavy components

### Caching

GitHub Pages automatically caches assets. To force refresh:
- Add query parameter: `?v=1.0.1`
- Or clear browser cache

## Security Considerations

1. **Never commit secrets**: Use environment variables
2. **Keep dependencies updated**: Run `npm audit` regularly
3. **Review GitHub Actions**: Ensure workflows are secure
4. **Restrict branch protection**: Require reviews before merge

## Continuous Integration

### Pre-commit Checks

```bash
# Lint code
npm run lint

# Format code
npm run format

# Build project
npm run build
```

### Automated Checks

GitHub Actions automatically:
- Runs linting
- Builds project
- Deploys to GitHub Pages
- Updates project data

## Rollback Deployment

If something goes wrong:

```bash
# View commit history
git log --oneline

# Revert to previous commit
git revert <commit-hash>
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push -f origin main
```

## Team Collaboration

### Invite Team Members

1. Go to **Settings** → **Collaborators**
2. Click "Add people"
3. Search for GitHub username
4. Select permission level

### Branch Protection

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Require pull request reviews
4. Require status checks to pass

## Monitoring & Analytics

### GitHub Insights

- **Traffic**: See page views and referrers
- **Deployments**: Track deployment history
- **Actions**: Monitor workflow runs

### Custom Analytics (Optional)

Add Google Analytics or similar to track dashboard usage.

## Support & Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Checklist

- [ ] GitHub repository created
- [ ] Remote added locally
- [ ] Initial commit pushed
- [ ] GitHub Pages enabled
- [ ] First deployment successful
- [ ] Dashboard accessible at GitHub Pages URL
- [ ] Auto-update workflow running
- [ ] Team members invited (if applicable)
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring set up

## Next Steps

1. Share dashboard URL with team
2. Set up regular data updates
3. Monitor dashboard performance
4. Gather team feedback
5. Iterate and improve

---

**Last Updated**: 2026-05-15  
**Dashboard Version**: 1.0.0  
**Status**: Ready for Deployment
