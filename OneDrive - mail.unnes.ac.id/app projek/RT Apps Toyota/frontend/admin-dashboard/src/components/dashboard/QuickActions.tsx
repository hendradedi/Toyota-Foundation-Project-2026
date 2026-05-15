'use client';
import Link from 'next/link';

const actions = [
  { href: '/dashboard/residents/new', icon: '👤', label: 'Tambah Warga', color: '#3b82f6' },
  { href: '/dashboard/announcements/new', icon: '📢', label: 'Buat Pengumuman', color: '#6366f1' },
  { href: '/dashboard/waste-bank/deposit', icon: '♻️', label: 'Catat Setoran', color: '#10b981' },
  { href: '/dashboard/patrol/schedule', icon: '🛡️', label: 'Buat Jadwal Ronda', color: '#06b6d4' },
  { href: '/dashboard/sos', icon: '🚨', label: 'Lihat Alert SOS', color: '#ef4444' },
  { href: '/dashboard/marketplace/businesses', icon: '🛒', label: 'Kelola UMKM', color: '#f59e0b' },
];

export default function QuickActions() {
  return (
    <div className="glass-card" style={{ padding: 24 }}>
      <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
        ⚡ Aksi Cepat
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {actions.map((a) => (
          <Link key={a.href} href={a.href} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
            background: `${a.color}10`, border: `1px solid ${a.color}30`,
            borderRadius: 10, textDecoration: 'none', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${a.color}20`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = `${a.color}10`; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
          >
            <span style={{ fontSize: 18 }}>{a.icon}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.3 }}>{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
