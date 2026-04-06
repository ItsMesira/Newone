import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={inter.className}>
        <Navbar />
        {/* Adds top padding for navbar except on auth/onboarding which hide the navbar */}
        <main className="min-h-screen pt-16">
          {children}
        </main>
        <Toaster theme="dark" position="top-center" />
      </body>
    </html>
  )
}
