"use client"

import { Navbar } from "./Navbar"

interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 pb-10">
        {children}
      </main>
    </>
  )
}
