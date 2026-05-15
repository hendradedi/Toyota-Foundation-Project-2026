'use client';
import Topbar from '@/components/Topbar';

const residents = [
  { id: 1, name: 'Ahmad Rizky Pratama', rt: 'RT 01', household: 'KK-0041', status: 'Aktif', role: 'Ketua RT', phone: '0812-xxxx-1234', joined: '2024-01' },
  { id: 2, name: 'Sari Dewi Maharani', rt: 'RT 02', household: 'KK-0087', status: 'Aktif', role: 'Warga', phone: '0856-xxxx-5678', joined: '2024-03' },
  { id: 3, name: 'Budi Santoso', rt: 'RT 04', household: 'KK-0103', status: 'Aktif', role: 'Petugas Kebersihan', phone: '0878-xxxx-9012', joined: '2024-02' },
  { id: 4, name: 'Rina Fitriani', rt: 'RT 07', household: 'KK-0215', status: 'Tidak Aktif', role: 'Warga', phone: '0821-xxxx-3456', joined: '2025-01' },
  { id: 5, name: 'Dito Kurniawan', rt: 'RT 11', household: 'KK-0312', status: 'Aktif', role: 'Petugas Ronda', phone: '0895-xxxx-7890', joined: '2025-06' },
  { id: 6, name: 'Nurul Hidayah', rt: 'RT 03', household: 'KK-0078', status: 'Aktif', role: 'Pemilik UMKM', phone: '0831-xxxx-2345', joined: '2024-05' },
];

const roleColor: Record<string, string> = {
  'Ketua RT': '#6366f1', 'Warga': '#9ca3af', 'Petugas Kebersihan': '#10b981',
  'Petugas Ronda': '#06b6d4', 'Pemilik UMKM': '#f59e0b',
};

export default function ResidentsPage() {
  return (
    <>
      <Topbar title="Manajemen Warga" subtitle="Daftar seluruh warga yang terdaftar di platform Digital RT-Muban" />
      <div className="page-content animate-fade-in">

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Warga', value: '2,847', color: '#3b82f6' },
            { label: 'Aktif Bulan Ini', value: '2,614', color: '#10b981' },
            { label: 'KK Terdaftar', value: '184', color: '#f59e0b' },
            { label: 'Baru (30 hari)', value: '+47', color: '#a855f7' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Daftar Warga
            </h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <input placeholder="🔍 Cari warga..." style={{
                background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                borderRadius: 8, padding: '8px 14px', color: 'var(--text-primary)', fontSize: 13, outline: 'none', width: 220,
              }} />
              <button className="btn btn-primary">+ Tambah Warga</button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama</th><th>RT</th><th>No. KK</th><th>Role</th>
                  <th>Telepon</th><th>Status</th><th>Terdaftar</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {residents.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar" style={{ background: 'var(--gradient-primary)', color: 'white', fontSize: 11 }}>
                          {r.name.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{r.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-info">{r.rt}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 12 }}>{r.household}</td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 500, color: roleColor[r.role] || '#9ca3af',
                        background: `${roleColor[r.role]}15`, padding: '3px 8px', borderRadius: 20 }}>
                        {r.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{r.phone}</td>
                    <td>
                      <span className={`badge ${r.status === 'Aktif' ? 'badge-success' : 'badge-warning'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.joined}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Edit</button>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: '#ef4444', borderColor: '#ef444430' }}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Menampilkan 1-6 dari 2,847 warga</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['‹', '1', '2', '3', '...', '475', '›'].map((p) => (
                <button key={p} style={{
                  width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border-color)',
                  background: p === '1' ? 'var(--gradient-primary)' : 'transparent',
                  color: p === '1' ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                }}>{p}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
