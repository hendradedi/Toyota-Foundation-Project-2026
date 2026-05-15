'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { bulan: 'Nov', plastik: 180, kertas: 120, logam: 80, organik: 200 },
  { bulan: 'Des', plastik: 220, kertas: 145, logam: 95, organik: 230 },
  { bulan: 'Jan', plastik: 190, kertas: 160, logam: 110, organik: 210 },
  { bulan: 'Feb', plastik: 280, kertas: 180, logam: 130, organik: 270 },
  { bulan: 'Mar', plastik: 310, kertas: 210, logam: 145, organik: 300 },
  { bulan: 'Apr', plastik: 350, kertas: 230, logam: 160, organik: 320 },
  { bulan: 'Mei', plastik: 420, kertas: 260, logam: 180, organik: 380 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#1f2937', border: '1px solid var(--border-color)', borderRadius: 8, padding: '12px 16px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>{label} 2026</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, fontSize: 13, fontWeight: 500 }}>
            {p.name}: <strong>{p.value} kg</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function WasteBankChart() {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            📊 Tren Bank Sampah
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Volume sampah per kategori (kg) — Nov 2025 – Mei 2026</p>
        </div>
        <span className="badge badge-success">▲ +20% bulan ini</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {[
              ['plastik', '#3b82f6'],
              ['kertas', '#10b981'],
              ['logam', '#f59e0b'],
              ['organik', '#a855f7'],
            ].map(([id, color]) => (
              <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="bulan" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, color: '#9ca3af' }} />
          <Area type="monotone" dataKey="plastik" stroke="#3b82f6" fill="url(#grad-plastik)" strokeWidth={2} name="Plastik" />
          <Area type="monotone" dataKey="kertas" stroke="#10b981" fill="url(#grad-kertas)" strokeWidth={2} name="Kertas" />
          <Area type="monotone" dataKey="logam" stroke="#f59e0b" fill="url(#grad-logam)" strokeWidth={2} name="Logam" />
          <Area type="monotone" dataKey="organik" stroke="#a855f7" fill="url(#grad-organik)" strokeWidth={2} name="Organik" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
