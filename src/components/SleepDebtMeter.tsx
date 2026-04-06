"use client"

import { motion } from "framer-motion"
import { Card, CardTitle } from "./ui/Card"
import { Activity } from "lucide-react"

interface SleepDebtMeterProps {
  debt: number; // in hours
}

export function SleepDebtMeter({ debt }: SleepDebtMeterProps) {
  // Cap visual debt at 10 hours for the meter
  const percentage = Math.min((debt / 10) * 100, 100)
  
  const getColor = (d: number) => {
    if (d <= 1) return { text: "text-success", bg: "bg-success" }
    if (d <= 3) return { text: "text-warning", bg: "bg-warning" }
    return { text: "text-danger", bg: "bg-danger" }
  }

  const colors = getColor(debt)

  return (
    <Card className="flex flex-col justify-center h-full">
      <div className="flex items-center gap-2 mb-4">
        <Activity className={`w-5 h-5 ${colors.text}`} />
        <CardTitle className="text-lg">Sleep Debt</CardTitle>
      </div>
      
      <div className="mt-2 mb-6">
        <span className={`text-3xl font-bold ${colors.text}`}>
          {debt.toFixed(1)} <span className="text-lg text-zinc-500 font-normal">hrs</span>
        </span>
        <p className="text-sm text-zinc-400 mt-1">
          {debt <= 1 ? "You are fully rested." : `You owe your body ${debt.toFixed(1)} hours.`}
        </p>
      </div>

      <div className="relative h-4 w-full bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className={`absolute top-0 left-0 h-full rounded-full ${colors.bg}`}
          onAnimationComplete={() => {
            // Shake if debt is critical
            if (debt >= 3) {
              const el = document.getElementById("debt-meter-bar")
              if (el) {
                el.animate([
                  { transform: 'translateX(0)' },
                  { transform: 'translateX(-5px)' },
                  { transform: 'translateX(5px)' },
                  { transform: 'translateX(-5px)' },
                  { transform: 'translateX(5px)' },
                  { transform: 'translateX(0)' }
                ], { duration: 400 })
              }
            }
          }}
        />
        <div id="debt-meter-bar" className="absolute top-0 left-0 w-full h-full pointer-events-none" />
      </div>
    </Card>
  )
}
