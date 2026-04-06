import type { Metadata } from 'next'
import { Inter, Oswald } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const oswald = Oswald({ subsets: ['latin'], variable: '--font-display' })

export const metadata: Metadata = {
  title: 'SyncSleep | Smart Sleep Tracker',
  description: 'Track your sleep debt, optimize energy levels, and improve your sleep hygiene.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${oswald.variable} font-sans`}>
        <Navbar />
        {/* Adds top padding for navbar except on auth/onboarding which hide the navbar */}
        <main className="min-h-screen pt-4 pb-4">
          {children}
        </main>
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  )
}
