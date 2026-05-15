import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Digital RT-Muban | Admin Dashboard',
  description: 'Smart Neighborhood Management Platform - Toyota Foundation IGP 2026 | UNNES & Chulalongkorn University',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
