'use client';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const now = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <header className="topbar">
      <div style={{ flex: 1 }}>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h1>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</p>}
      </div>

      {/* Date */}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>📅</span> {now}
      </div>

      {/* Notification Bell */}
      <button style={{
        position: 'relative', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)', width: 38, height: 38, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)',
      }}>
        🔔
        <span style={{
          position: 'absolute', top: 6, right: 6, width: 8, height: 8,
          background: 'var(--accent-danger)', borderRadius: '50%', border: '2px solid var(--bg-secondary)',
        }} />
      </button>

      {/* Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)', padding: '6px 12px',
      }}>
        <div className="avatar" style={{ background: 'var(--gradient-primary)', color: 'white', width: 28, height: 28, fontSize: 12 }}>A</div>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Admin</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>▾</span>
      </div>
    </header>
  );
}
