'use client';

const activities = [
  { time: '09:14', type: 'waste', icon: '♻️', color: '#10b981', text: 'Ibu Sari setor 2.3 kg plastik', sub: 'RT 04 · +46 poin' },
  { time: '09:02', type: 'sos', icon: '🚨', color: '#ef4444', text: 'SOS dikirim oleh Bapak Hendra', sub: 'RT 07 · Dalam penanganan' },
  { time: '08:45', type: 'market', icon: '🛒', color: '#f59e0b', text: 'Pesanan #1048 dibuat', sub: 'Warung Bu Tini · Rp 45.000' },
  { time: '08:30', type: 'patrol', icon: '🛡️', color: '#06b6d4', text: 'Shift ronda malam selesai', sub: 'RT 02 · 6 jam, 0 insiden' },
  { time: '08:12', type: 'resident', icon: '👤', color: '#6366f1', text: 'Warga baru terdaftar', sub: 'RT 11 · Ahmad Rizky' },
  { time: '07:55', type: 'announce', icon: '📢', color: '#a855f7', text: 'Pengumuman diterbitkan', sub: 'Gotong royong Minggu 07:00' },
  { time: '07:30', type: 'waste', icon: '♻️', color: '#10b981', text: 'Jadwal pickup diperbarui', sub: 'RT 01, 03, 05 · Senin 07:00' },
];

export default function ActivityFeed() {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
          🕐 Aktivitas Terkini
        </h3>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }}>Lihat Semua</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {activities.map((a, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px',
            borderRadius: 8, transition: 'background 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{ fontSize: 11, color: 'var(--text-muted)', width: 36, flexShrink: 0 }}>{a.time}</div>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `${a.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>{a.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{a.text}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{a.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
