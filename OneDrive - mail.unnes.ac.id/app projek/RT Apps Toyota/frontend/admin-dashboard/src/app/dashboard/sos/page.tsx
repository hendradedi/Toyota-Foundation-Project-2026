'use client';
import Topbar from '@/components/Topbar';

const alerts = [
  { id: 'SOS-001', type: 'Kecelakaan', reporter: 'Bpk Hendra', rt: 'RT 07', time: '09:02', status: 'Dalam Penanganan', responder: 'Budi (Keamanan)', coords: '-7.0051, 110.4381' },
  { id: 'SOS-002', type: 'Kebakaran', reporter: 'Ibu Rina', rt: 'RT 03', time: '07:45', status: 'Terselesaikan', responder: 'Pemadam + Warga', coords: '-7.0062, 110.4392' },
  { id: 'SOS-003', type: 'Tindak Kriminal', reporter: 'Bpk Dito', rt: 'RT 11', time: '06:20', status: 'Dilaporkan', responder: 'Menunggu', coords: '-7.0078, 110.4410' },
  { id: 'SOS-004', type: 'Medis Darurat', reporter: 'Ibu Sari', rt: 'RT 02', time: '04:15', status: 'Terselesaikan', responder: 'BPBD + Ambulans', coords: '-7.0040, 110.4370' },
];

const statusColor: Record<string, string> = {
  'Dalam Penanganan': '#f59e0b', 'Terselesaikan': '#10b981', 'Dilaporkan': '#ef4444',
};

const typeColor: Record<string, string> = {
  'Kecelakaan': '#f59e0b', 'Kebakaran': '#ef4444', 'Tindak Kriminal': '#a855f7', 'Medis Darurat': '#06b6d4',
};

export default function SOSPage() {
  return (
    <>
      <Topbar title="SOS & Kedaruratan" subtitle="Monitor dan tangani alert SOS dari seluruh warga secara real-time" />
      <div className="page-content animate-fade-in">

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Alert Aktif', value: '3', color: '#ef4444', icon: '🚨' },
            { label: 'Dalam Penanganan', value: '1', color: '#f59e0b', icon: '⚡' },
            { label: 'Terselesaikan (30hr)', value: '28', color: '#10b981', icon: '✅' },
            { label: 'Rata-rata Respons', value: '8 mnt', color: '#06b6d4', icon: '⏱️' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 28 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Alert Banner */}
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <span style={{ fontSize: 24 }}>🚨</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>ALERT AKTIF: SOS-001 — Kecelakaan di RT 07</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Dilaporkan oleh Bpk Hendra · 9 menit lalu · Dalam penanganan oleh Budi (Keamanan)</div>
          </div>
          <button className="btn" style={{ background: '#ef4444', color: 'white', fontSize: 13, padding: '8px 16px' }}>Tangani Sekarang</button>
        </div>

        {/* Alert Table */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Log SOS Darurat
            </h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <select style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>
                <option>Semua Status</option>
                <option>Aktif</option>
                <option>Dalam Penanganan</option>
                <option>Terselesaikan</option>
              </select>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Jenis</th><th>Pelapor</th><th>RT</th><th>Waktu</th><th>Petugas</th><th>Status</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{a.id}</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, color: typeColor[a.type], background: `${typeColor[a.type]}15`, padding: '3px 8px', borderRadius: 20 }}>
                        {a.type}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{a.reporter}</td>
                    <td><span className="badge badge-info">{a.rt}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.time} WIB</td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{a.responder}</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 500, color: statusColor[a.status], background: `${statusColor[a.status]}15`, padding: '3px 10px', borderRadius: 20 }}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
