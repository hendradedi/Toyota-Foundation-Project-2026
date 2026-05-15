'use client';

const alerts = [
  { id: 1, level: 'danger', icon: '🚨', title: 'SOS: Kecelakaan RT 07', time: '9 menit lalu', status: 'Dalam penanganan' },
  { id: 2, level: 'warning', icon: '⚠️', title: 'Jadwal ronda kosong', time: '1 jam lalu', status: 'RT 09 belum ada petugas' },
  { id: 3, level: 'info', icon: '🗑️', title: 'Kapasitas TPS 85%', time: '2 jam lalu', status: 'Perlu jadwal pickup' },
  { id: 4, level: 'success', icon: '✅', title: 'SOS #1041 terselesaikan', time: '3 jam lalu', status: 'Ditangani dalam 12 menit' },
];

const levelColor: Record<string, string> = {
  danger: '#ef4444', warning: '#f59e0b', info: '#06b6d4', success: '#10b981',
};

export default function AlertsPanel() {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
          🔔 Alert & Notifikasi
        </h3>
        <span className="badge badge-danger">3 Aktif</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alerts.map((a) => (
          <div key={a.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
            background: `${levelColor[a.level]}08`, border: `1px solid ${levelColor[a.level]}25`,
            borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{a.status}</div>
              <div style={{ fontSize: 11, color: levelColor[a.level], marginTop: 4 }}>{a.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
