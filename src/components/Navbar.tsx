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

  // Don't show navbar in auth, onboarding, or dashboard (has own nav)
  if (pathname.startsWith('/auth') || pathname.startsWith('/onboarding') || pathname === '/' || pathname.startsWith('/dashboard')) {
    return null
  }

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-40 glass border-t-0 border-x-0 border-b border-white/10 px-4 py-3"
    >
      <div className="max-w-screen-xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-300">
          SyncSleep
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative px-3 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <div className="flex items-center gap-2">
                  <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`} />
                  <span className={`hidden sm:inline-block ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>
                    {item.label}
                  </span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-white/10 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}
