"use client"

import { Card, CardTitle, CardHeader } from "./ui/Card"
import { motion, AnimatePresence } from "framer-motion"
import { addHours, addMinutes, subHours, subMinutes, formatDistanceToNowStrict, isPast, isFuture } from 'date-fns'
import { useEffect, useState } from "react"
import { Bell, Flame } from "lucide-react"

interface HygieneRemindersProps {
  wakeTime: Date;
  melatoninOnset: Date;
  currentTime: Date;
}

interface Reminder {
  id: string;
  trigger: Date;
  msg: string;
  icon: string;
}

export function HygieneReminders({ wakeTime, melatoninOnset, currentTime }: HygieneRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [tick, setTick] = useState(0)

  useEffect(() => {
    // Re-eval on tick
    const r: Reminder[] = [
      { id: 'sun', trigger: addMinutes(wakeTime, 0), msg: "Get sunlight within 30 mins of waking", icon: "☀️" },
      { id: 'focus', trigger: addMinutes(wakeTime, 90), msg: "Great time for deep focus work", icon: "🧠" },
      { id: 'caf_warn', trigger: addHours(wakeTime, 6), msg: "Caffeine cutoff in 1 hour", icon: "☕" },
      { id: 'caf_cut', trigger: addHours(wakeTime, 7), msg: "Last caffeine now — none after this", icon: "🚫" },
      { id: 'dim', trigger: subHours(melatoninOnset, 2), msg: "Start dimming your lights", icon: "💡" },
      { id: 'screens', trigger: subHours(melatoninOnset, 1), msg: "Put away screens soon", icon: "📵" },
      { id: 'wind', trigger: subMinutes(melatoninOnset, 30), msg: "Start your wind-down routine", icon: "🌙" },
      { id: 'sleep', trigger: melatoninOnset, msg: "Your melatonin window opens — ideal bedtime now", icon: "😴" },
    ]
    setReminders(r)
  }, [wakeTime, melatoninOnset])

  // Update tick every 30 seconds to force countdown refresh
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  // Find next 3 upcoming or recently active
  const activeReminders = reminders
    .filter(r => isFuture(r.trigger) || currentTime.getTime() - r.trigger.getTime() < 2 * 60 * 60 * 1000) // Keep past ones for 2 hours
    .sort((a, b) => a.trigger.getTime() - b.trigger.getTime())
    .slice(0, 3)

  return (
    <Card className="h-full flex flex-col p-6">
      <div className="flex justify-between items-start mb-6">
        <h3 className="font-display font-bold text-zinc-200 tracking-widest text-lg uppercase">HYGIENE ALERTS</h3>
        <span className="text-zinc-500 tracking-widest leading-none font-bold text-xl cursor-pointer">...</span>
      </div>
      
      <div className="flex flex-col gap-3">
        <AnimatePresence>
          {activeReminders.map((r, index) => {
            const isActive = isPast(r.trigger)
            const timeText = isActive 
              ? "Now"
              : `in ${formatDistanceToNowStrict(r.trigger)}`

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                layout
                className={`flex items-center gap-4 p-3 rounded-2xl border transition-all ${
                  isActive 
                    ? "bg-primary/10 border-primary/30 text-white" 
                    : "bg-zinc-800/50 border-[rgba(255,255,255,0.05)] text-zinc-300"
                }`}
              >
                <div className="text-2xl bg-zinc-800 rounded-xl w-10 h-10 flex items-center justify-center shrink-0">
                  {r.icon}
                </div>
                <div className="flex flex-col flex-1">
                  <span className={`text-sm font-medium ${isActive ? "text-primary" : "text-zinc-500"}`}>
                    {timeText}
                  </span>
                  <span className="text-sm font-medium">
                    {r.msg}
                  </span>
                </div>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="shrink-0 text-primary"
                  >
                    <Flame className="w-5 h-5" />
                  </motion.div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {activeReminders.length === 0 && (
          <div className="text-center text-zinc-500 py-8 text-sm">
            No active reminders right now.
          </div>
        )}
      </div>
    </Card>
  )
}
