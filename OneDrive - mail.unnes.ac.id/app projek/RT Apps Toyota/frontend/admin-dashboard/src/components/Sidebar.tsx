'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navSections = [
  {
    label: 'OVERVIEW',
    items: [
      { href: '/dashboard', icon: '⊞', label: 'Dashboard' },
      { href: '/dashboard/analytics', icon: '📊', label: 'Analytics' },
    ],
  },
  {
    label: 'MANAJEMEN',
    items: [
      { href: '/dashboard/neighborhoods', icon: '🏘️', label: 'Kelurahan / RT' },
      { href: '/dashboard/residents', icon: '👥', label: 'Warga' },
      { href: '/dashboard/users', icon: '🔑', label: 'Pengguna & Role' },
    ],
  },
  {
    label: 'FITUR UTAMA',
    items: [
      { href: '/dashboard/waste-bank', icon: '♻️', label: 'Bank Sampah' },
      { href: '/dashboard/marketplace', icon: '🛒', label: 'Marketplace' },
      { href: '/dashboard/patrol', icon: '🛡️', label: 'Jadwal Ronda' },
      { href: '/dashboard/sos', icon: '🚨', label: 'SOS & Darurat' },
    ],
  },
  {
    label: 'SISTEM',
    items: [
      { href: '/dashboard/announcements', icon: '📢', label: 'Pengumuman' },
      { href: '/dashboard/settings', icon: '⚙️', label: 'Pengaturan' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>🏡</div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
              Digital RT-Muban
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Admin Dashboard</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navSections.map((section) => (
          <div key={section.label} style={{ marginBottom: 8 }}>
            <div style={{ padding: '8px 8px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar" style={{ background: 'var(--gradient-primary)', color: 'white' }}>A</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Admin UNNES</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Super Admin</div>
          </div>
          <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>↩</span>
        </div>
      </div>
    </aside>
  );
}
