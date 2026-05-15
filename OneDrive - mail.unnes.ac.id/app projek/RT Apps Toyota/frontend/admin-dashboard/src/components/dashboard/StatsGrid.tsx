'use client';

const stats = [
  { label: 'Total Warga', value: '2,847', change: '+12%', trend: 'up', icon: '👥', gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)', sub: '184 KK terdaftar' },
  { label: 'Bank Sampah', value: '1.2 Ton', change: '+8%', trend: 'up', icon: '♻️', gradient: 'linear-gradient(135deg,#10b981,#059669)', sub: 'bulan ini' },
  { label: 'Transaksi Pasar', value: 'Rp 18.4jt', change: '+23%', trend: 'up', icon: '🛒', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', sub: '142 pesanan aktif' },
  { label: 'SOS Aktif', value: '3', change: '-2', trend: 'down', icon: '🚨', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', sub: '1 dalam proses' },
  { label: 'Ronda Hari Ini', value: '8', change: '+1', trend: 'up', icon: '🛡️', gradient: 'linear-gradient(135deg,#06b6d4,#0284c7)', sub: '2 shift tersisa' },
  { label: 'Poin Reward', value: '48,200', change: '+5%', trend: 'up', icon: '⭐', gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', sub: 'total ditukarkan' },
  { label: 'RT Aktif', value: '12 / 15', change: '', trend: 'neutral', icon: '🏘️', gradient: 'linear-gradient(135deg,#ec4899,#db2777)', sub: '3 belum onboard' },
  { label: 'Uptime Sistem', value: '99.8%', change: '', trend: 'up', icon: '🖥️', gradient: 'linear-gradient(135deg,#14b8a6,#0f766e)', sub: 'SLA terpenuhi' },
];

export default function StatsGrid() {
  return (
    <div className="grid-4">
      {stats.map((s) => (
        <div key={s.label} className="stat-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="icon-wrap" style={{ background: s.gradient }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            {s.change && (
              <span className={`badge ${s.trend === 'up' ? 'badge-success' : s.trend === 'down' ? 'badge-danger' : 'badge-info'}`}>
                {s.trend === 'up' ? '▲' : s.trend === 'down' ? '▼' : ''} {s.change}
              </span>
            )}
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)', marginBottom: 4 }}>
            {s.value}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
