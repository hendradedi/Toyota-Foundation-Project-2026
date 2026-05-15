'use client';
import Topbar from '@/components/Topbar';
import StatsGrid from '@/components/dashboard/StatsGrid';
import ActivityFeed from '@/components/dashboard/ActivityFeed';
import WasteBankChart from '@/components/dashboard/WasteBankChart';
import QuickActions from '@/components/dashboard/QuickActions';
import AlertsPanel from '@/components/dashboard/AlertsPanel';

export default function DashboardPage() {
  return (
    <>
      <Topbar
        title="Dashboard Utama"
        subtitle="Selamat datang di Digital RT-Muban Admin — Toyota Foundation IGP 2026"
      />
      <div className="page-content animate-fade-in">

        {/* Hero Stats */}
        <StatsGrid />

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginTop: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <WasteBankChart />
            <ActivityFeed />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <QuickActions />
            <AlertsPanel />
          </div>
        </div>

      </div>
    </>
  );
}
