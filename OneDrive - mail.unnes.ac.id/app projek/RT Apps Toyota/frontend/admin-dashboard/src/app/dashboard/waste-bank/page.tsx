'use client';
import Topbar from '@/components/Topbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const deposits = [
  { warga: 'Ibu Sari', rt: 'RT 04', kategori: 'Plastik', berat: '2.3 kg', poin: 46, tgl: '15 Mei' },
  { warga: 'Bpk Hendra', rt: 'RT 07', kategori: 'Kertas', berat: '4.1 kg', poin: 61, tgl: '15 Mei' },
  { warga: 'Ibu Rina', rt: 'RT 02', kategori: 'Logam', berat: '1.5 kg', poin: 45, tgl: '14 Mei' },
  { warga: 'Bpk Dito', rt: 'RT 11', kategori: 'Organik', berat: '3.8 kg', poin: 19, tgl: '14 Mei' },
  { warga: 'Ibu Nurul', rt: 'RT 03', kategori: 'Plastik', berat: '5.2 kg', poin: 104, tgl: '13 Mei' },
];

const chartData = [
  { rt: 'RT 01', kg: 45 }, { rt: 'RT 02', kg: 62 }, { rt: 'RT 03', kg: 38 },
  { rt: 'RT 04', kg: 89 }, { rt: 'RT 05', kg: 55 }, { rt: 'RT 06', kg: 71 },
  { rt: 'RT 07', kg: 94 }, { rt: 'RT 08', kg: 48 }, { rt: 'RT 09', kg: 33 },
  { rt: 'RT 10', kg: 76 }, { rt: 'RT 11', kg: 58 }, { rt: 'RT 12', kg: 41 },
];

const katColor: Record<string, string> = {
  'Plastik': '#3b82f6', 'Kertas': '#10b981', 'Logam': '#f59e0b', 'Organik': '#a855f7',
};

export default function WasteBankPage() {
  return (
    <>
      <Topbar title="Bank Sampah" subtitle="Kelola setoran sampah, poin reward, dan jadwal pickup" />
      <div className="page-content animate-fade-in">

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Bulan Ini', value: '1.2 Ton', color: '#10b981', icon: '♻️' },
            { label: 'Plastik', value: '420 kg', color: '#3b82f6', icon: '🧴' },
            { label: 'Poin Terdistribusi', value: '48,200', color: '#a855f7', icon: '⭐' },
            { label: 'Warga Aktif', value: '312', color: '#f59e0b', icon: '👥' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ padding: 16 }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, marginTop: 8 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Chart */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Volume per RT (kg) — Mei 2026
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="rt" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid var(--border-color)', borderRadius: 8, color: '#f9fafb' }} />
                <Bar dataKey="kg" fill="url(#barGrad)" radius={[4, 4, 0, 0]} name="Volume (kg)" />
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Deposits */}
          <div className="glass-card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
                Setoran Terbaru
              </h3>
              <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }}>+ Catat Setoran</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead><tr><th>Warga</th><th>Kategori</th><th>Berat</th><th>Poin</th><th>Tgl</th></tr></thead>
                <tbody>
                  {deposits.map((d, i) => (
                    <tr key={i}>
                      <td>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{d.warga}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.rt}</div>
                        </div>
                      </td>
                      <td><span style={{ fontSize: 12, color: katColor[d.kategori], background: `${katColor[d.kategori]}15`, padding: '3px 8px', borderRadius: 20, fontWeight: 500 }}>{d.kategori}</span></td>
                      <td style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{d.berat}</td>
                      <td><span className="badge badge-success">+{d.poin} ⭐</span></td>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.tgl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
