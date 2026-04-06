"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface EnergyScoreProps {
  score: number;
  label: string;
}

export function EnergyScore({ score, label }: EnergyScoreProps) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let startVal = 0
    const end = Math.round(score)
    const duration = 800 // snappier
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Faster ease-out
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplayScore(Math.round(startVal + (end - startVal) * easeOut))

      if (progress < 1) requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
  }, [score])

  const isGood = score >= 50

  return (
    <div className="flex flex-col h-full justify-between w-full relative group">
      {/* Structural alignment grid lines */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-zinc-800"></div>
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-zinc-800"></div>
      
      <div className="flex justify-between items-start pt-4 mb-auto">
        <h3 className="font-mono text-zinc-500 tracking-[0.2em] text-xs uppercase">SYS.ENERGY_SCORE [0-100]</h3>
        <span className="font-mono text-xs text-zinc-500 tracking-widest">{isGood ? 'OPTIMUM' : 'DEGRADED'}</span>
      </div>
      
      <div className="flex flex-col gap-0 mt-8 mb-4">
        {/* Massive Data Figure */}
        <div className="flex items-baseline overflow-hidden leading-none">
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className={`text-[120px] sm:text-[180px] font-display font-medium tracking-tighter ${isGood ? 'text-white' : 'text-zinc-300'}`}
          >
            {displayScore}
          </motion.div>
          <span className="text-2xl sm:text-4xl text-zinc-600 font-mono ml-2">%</span>
        </div>
        
        {/* Raw text label */}
        <div className="flex items-center gap-4 mt-2">
          <div className="w-4 h-4 bg-white/10" />
          <div className="text-xl sm:text-2xl font-mono text-zinc-400 uppercase tracking-widest">
            {label}
          </div>
        </div>
      </div>
    </div>
  )
}
