"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, Moon, Clock, Settings } from "lucide-react"

const navItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/log", icon: Moon, label: "Log Sleep" },
  { href: "/history", icon: Clock, label: "History" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-zinc-800 px-6 sm:px-10 py-5">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-mono uppercase tracking-[0.2em] font-light text-primary flex items-center gap-3">
          <div className="w-2 h-2 bg-primary"></div>
          SYNC.SLEEP
        </Link>
        <div className="flex items-center gap-1 sm:gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 group px-2 py-1 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 hover:text-white'}`}
              >
                <item.icon className="h-3 w-3" />
                <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-[0.2em]">
                  {item.label}
                </span>
                {isActive && (
                   <div className="w-1 h-1 bg-white ml-1"></div>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
