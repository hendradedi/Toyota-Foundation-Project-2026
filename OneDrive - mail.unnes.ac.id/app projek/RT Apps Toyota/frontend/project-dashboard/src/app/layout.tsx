import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RT Apps Toyota - Project Dashboard',
  description: 'Interactive project monitoring dashboard for Digital RT-Muban platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
