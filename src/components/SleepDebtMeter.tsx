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
    <Card className="flex flex-col p-8 h-full justify-between">
      <div className="flex justify-between items-start mb-10 border-b border-white/5 pb-4">
        <h3 className="font-display font-bold text-zinc-200 tracking-widest text-2xl uppercase">CHRONIC LOG (DEBT)</h3>
        <span className="text-zinc-500 tracking-widest leading-none font-bold text-xl cursor-pointer">...</span>
      </div>
      
      <div className="flex items-center gap-12 mt-2 mb-10 w-full flex-wrap">
        <div>
          <span className={`text-[80px] leading-none font-display tracking-tight font-bold ${colors.text}`}>
            {debt.toFixed(1)}<span className="text-4xl text-zinc-500 font-normal ml-2 tracking-wide uppercase">h</span>
          </span>
          <p className="text-sm text-zinc-400 mt-4 uppercase tracking-widest font-semibold">
            {debt <= 1 ? "Fully Rested · Core Normalized" : "Accumulated Debt · Critical Threshold"}
          </p>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="border-l-2 border-white/10 pl-6 flex justify-center flex-col">
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Metabolic Rate</span>
              <span className="font-display text-white text-2xl font-bold tracking-wider">{debt <= 3 ? "STABLE" : "COMPROMISED"}</span>
            </div>
            <div className="border-l-2 border-white/10 pl-6 flex justify-center flex-col">
              <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Recovery Delta</span>
              <span className="font-display text-white text-2xl font-bold tracking-wider">{Math.ceil(debt)} CYCLES</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden mt-auto">
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
