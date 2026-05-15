'use client';
import Topbar from '@/components/Topbar';

const businesses = [
  { id: 1, name: 'Warung Bu Tini', owner: 'Siti Hartini', rt: 'RT 03', category: 'Makanan', products: 12, sales: 'Rp 2.4jt', status: 'Aktif', rating: 4.8 },
  { id: 2, name: 'Bengkel Pak Budi', owner: 'Budi Santoso', rt: 'RT 07', category: 'Jasa', products: 5, sales: 'Rp 1.8jt', status: 'Aktif', rating: 4.6 },
  { id: 3, name: 'Toko Serba Ada Rina', owner: 'Rina Fitriani', rt: 'RT 02', category: 'Retail', products: 34, sales: 'Rp 3.1jt', status: 'Aktif', rating: 4.5 },
  { id: 4, name: 'Laundry Kilat', owner: 'Ahmad Rizky', rt: 'RT 01', category: 'Jasa', products: 4, sales: 'Rp 0.9jt', status: 'Review', rating: 4.2 },
];

export default function MarketplacePage() {
  return (
    <>
      <Topbar title="Marketplace UMKM" subtitle="Kelola usaha warga, produk, dan transaksi di marketplace komunitas" />
      <div className="page-content animate-fade-in">

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total UMKM', value: '47', color: '#f59e0b', icon: '🏪' },
            { label: 'Total Produk', value: '324', color: '#3b82f6', icon: '📦' },
            { label: 'Pesanan Bulan Ini', value: '142', color: '#10b981', icon: '🛒' },
            { label: 'Omzet Komunitas', value: 'Rp 18.4jt', color: '#a855f7', icon: '💰' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginTop: 8 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Daftar UMKM
            </h3>
            <button className="btn btn-primary">+ Daftarkan UMKM</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Nama Usaha</th><th>Pemilik</th><th>RT</th><th>Kategori</th><th>Produk</th><th>Omzet</th><th>Rating</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {businesses.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{b.name}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{b.owner}</td>
                    <td><span className="badge badge-info">{b.rt}</span></td>
                    <td><span className="badge badge-primary">{b.category}</span></td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{b.products}</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>{b.sales}</td>
                    <td>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>⭐ {b.rating}</span>
                    </td>
                    <td>
                      <span className={`badge ${b.status === 'Aktif' ? 'badge-success' : 'badge-warning'}`}>{b.status}</span>
                    </td>
                    <td>
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Kelola</button>
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
