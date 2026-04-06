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
      <Card className="flex flex-col p-6 h-full relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
          <Moon className="w-24 h-24 text-white" />
        </div>

        <div className="flex justify-between items-start mb-6 z-10">
          <h3 className="font-display font-bold text-zinc-200 tracking-widest text-lg uppercase">MELATONIN</h3>
          <span className="text-zinc-500 tracking-widest leading-none font-bold text-xl cursor-pointer">...</span>
        </div>

        <div className="mt-auto z-10">
          <div className="text-3xl font-display font-bold text-primary tracking-wide">
            {startStr}
          </div>
          <p className="text-xs text-zinc-400 mt-2 uppercase tracking-wider font-semibold">
            Onset Window Begins
          </p>
        </div>
      </Card>
    </motion.div>
  )
}
