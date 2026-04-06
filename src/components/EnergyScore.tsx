"use client"

import { useEffect, useState } from "react"
import { motion, useAnimation } from "framer-motion"
import { Card, CardHeader, CardTitle } from "./ui/Card"
import { BatteryMedium } from "lucide-react"

interface EnergyScoreProps {
  score: number;
  label: string;
}

export function EnergyScore({ score, label }: EnergyScoreProps) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let start = 0
    const end = Math.round(score)
    const duration = 1200 // 1.2s
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1) // 0 to 1
      
      // easeOutExpo
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      
      setDisplayScore(Math.round(start + (end - start) * easeOut))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [score])

  // Get color based on score
  const getColor = (s: number) => {
    if (s >= 65) return "text-success"
    if (s >= 35) return "text-warning"
    return "text-danger"
  }

  const getGradient = (s: number) => {
    if (s >= 65) return "bg-gradient-to-t from-success/20 to-transparent"
    if (s >= 35) return "bg-gradient-to-t from-warning/20 to-transparent"
    return "bg-gradient-to-t from-danger/20 to-transparent"
  }

  return (
    <Card className="relative overflow-hidden flex flex-col items-center justify-center p-8 min-h-[300px]">
      <div className={`absolute bottom-0 left-0 right-0 h-32 ${getGradient(score)} pointer-events-none transition-colors duration-1000`}></div>
      
      <div className="flex flex-col items-center justify-center z-10">
        <motion.div 
          className="relative flex items-center justify-center w-48 h-48 rounded-full border border-[rgba(255,255,255,0.1)] bg-zinc-900/50 shadow-2xl"
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="text-center">
            <span className={`text-6xl font-bold tracking-tighter ${getColor(score)} transition-colors duration-1000`}>
              {displayScore}
            </span>
            <span className="text-zinc-500 text-2xl block">%</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 flex flex-col items-center"
        >
          <span className="text-xl font-medium text-white">{label}</span>
          <span className="text-sm text-zinc-400 mt-1 flex items-center gap-1">
            <BatteryMedium className="w-4 h-4" /> Current Energy
          </span>
        </motion.div>
      </div>
    </Card>
  )
}
