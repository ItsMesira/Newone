"use client"

import { Card } from "./ui/Card"
import { Moon } from "lucide-react"
import { formatTimeInTimezone } from "@/lib/helpers"
import { motion } from "framer-motion"
import { useProfile } from "@/hooks/useProfile"

interface MelatoninWindowProps {
  window: { start: Date; end: Date };
  currentTime: Date;
}

export function MelatoninWindow({ window, currentTime }: MelatoninWindowProps) {
  const { settings } = useProfile()
  const timezone = settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone

  const startStr = formatTimeInTimezone(window.start, timezone, 'h:mm a')
  const endStr = formatTimeInTimezone(window.end, timezone, 'h:mm a')

  // Check if current time is near or inside the window
  const isNear = currentTime.getTime() >= window.start.getTime() - (2 * 60 * 60 * 1000)
                 && currentTime.getTime() <= window.end.getTime()

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="flex flex-col justify-center h-full relative overflow-hidden bg-gradient-to-br from-indigo-900/40 to-slate-900/60 border-indigo-500/20">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-20 pointer-events-none">
          <Moon className="w-32 h-32 text-indigo-300" />
        </div>

        <div className="flex items-center gap-3 mb-2">
          <motion.div
            animate={isNear ? { opacity: [0.5, 1, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Moon className="w-5 h-5 text-indigo-400 fill-indigo-400" />
          </motion.div>
          <span className="text-indigo-200 font-medium">Melatonin Window</span>
        </div>

        <div className="mt-2 text-2xl font-semibold text-white tracking-tight">
          {startStr} – {endStr}
        </div>
        
        <p className="text-sm text-indigo-200/70 mt-2 z-10 w-3/4">
          Your brain will naturally start producing melatonin. Ideal window to fall asleep.
        </p>
      </Card>
    </motion.div>
  )
}
