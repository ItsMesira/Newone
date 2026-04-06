"use client"

import { useMemo } from 'react'
import { addMinutes, addHours, isAfter, subHours, subMinutes, format } from 'date-fns'

interface HygieneRemindersProps {
  wakeTime: Date;
  melatoninOnset: Date;
}

export function HygieneReminders({ wakeTime, melatoninOnset }: HygieneRemindersProps) {
  
  const reminders = useMemo(() => {
    const rawEvents = [
      { time: addMinutes(wakeTime, 0), msg: "Get sunlight within 30 mins", icon: "☀️" },
      { time: addMinutes(wakeTime, 90), msg: "Great time for deep focus", icon: "🧠" },
      { time: addHours(wakeTime, 6), msg: "Caffeine cutoff in 1 hour", icon: "☕" },
      { time: addHours(wakeTime, 7), msg: "Last caffeine now", icon: "🚫" },
      { time: subHours(melatoninOnset, 2), msg: "Start dimming your lights", icon: "💡" },
      { time: subHours(melatoninOnset, 1), msg: "Put away screens", icon: "📵" },
      { time: subMinutes(melatoninOnset, 30), msg: "Start wind-down routine", icon: "🌙" },
      { time: melatoninOnset, msg: "Melatonin window opens", icon: "😴" },
    ]

    const now = new Date()
    // Find future events
    const futureEvents = rawEvents.filter(e => isAfter(e.time, now)).sort((a, b) => a.time.getTime() - b.time.getTime())
    
    // Fallback if all events today are passed (e.g. late at night)
    if (futureEvents.length === 0) {
      return [{ time: addHours(wakeTime, 24), msg: "Rest and recover for tomorrow", icon: "🌌" }]
    }
    
    return futureEvents.slice(0, 3)
  }, [wakeTime, melatoninOnset])

  return (
    <div className="flex flex-col justify-between min-h-[300px] w-full h-full">
      <div className="flex justify-between items-start mb-6 w-full relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-zinc-800"></div>
        <h3 className="font-mono text-zinc-500 tracking-[0.2em] text-xs uppercase pt-4">SYS.HYGIENE_CUES</h3>
      </div>
      
      <div className="flex flex-col gap-6 w-full mt-auto mb-4 relative pl-4 border-l border-zinc-800">
        {reminders.map((r, i) => (
          <div key={i} className="flex flex-col justify-center relative min-h-[40px] group">
            <span className="font-mono text-xs uppercase text-zinc-500 mb-1">
              {format(r.time, 'HH:mm')} • {r.icon}
            </span>
            <span className={`font-mono text-xs ${i === 0 ? 'text-white' : 'text-zinc-600'}`}>
              {r.msg}
            </span>
            {/* Minimalist marker dot */}
            <div className={`absolute -left-[19px] w-2 h-2 ${i === 0 ? 'bg-sky-400 border border-black' : 'bg-zinc-800 border-none'}`}></div>
          </div>
        ))}
      </div>
    </div>
  )
}
