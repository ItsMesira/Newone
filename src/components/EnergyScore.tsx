"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface EnergyScoreProps {
  score: number;
  label: string;
}

export function EnergyScore({ score, label }: EnergyScoreProps) {
  const [animatedScore, setAnimatedScore] = useState(0)

  useEffect(() => {
    let startVal = animatedScore
    const end = Math.max(0, Math.min(100, score))
    const duration = 800
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(startVal + (end - startVal) * easeOut)

      if (progress < 1) requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
  }, [score])

  const displayScore = Math.round(animatedScore)

  // SVG Gauge Math - Centered and scaled for no clipping
  const cx = 100
  const cy = 100
  const r = 75
  const strokeWidth = 14
  
  // Semicircle arc length
  const pathLength = Math.PI * r
  const progressRatio = animatedScore / 100
  const dashOffset = pathLength * (1 - progressRatio)

  // Calculate knob position - 180 deg reversal for arc
  const angle = Math.PI - progressRatio * Math.PI
  const knobX = cx + r * Math.cos(angle)
  const knobY = cy - r * Math.sin(angle)

  return (
    <div className="flex flex-col h-full w-full bg-black border border-zinc-800 p-8 min-h-[350px]">
      <div className="flex justify-between items-start">
        <h3 className="font-mono text-zinc-500 text-[10px] uppercase tracking-[0.2em]">STAT.ENERGY_SCORE</h3>
      </div>
      
      <div className="flex items-baseline mt-4 border-b border-zinc-900 pb-8">
        <span className="text-[84px] font-mono font-light text-white tracking-tighter leading-none">
          {displayScore}
        </span>
        <span className="text-xl text-zinc-700 font-mono ml-3 uppercase tracking-widest">/ 100</span>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center mt-12 w-full relative pointer-events-none">
        <svg 
          viewBox="0 0 200 120" 
          className="w-full max-w-[320px] overflow-visible"
        >
          {/* Base track */}
          <path 
            d="M 25 100 A 75 75 0 0 1 175 100" 
            fill="none" 
            stroke="#18181b" 
            strokeWidth={strokeWidth} 
            strokeLinecap="butt" 
          />

          {/* Active track */}
          <path 
            d="M 25 100 A 75 75 0 0 1 175 100" 
            fill="none" 
            stroke="white" 
            strokeWidth={strokeWidth} 
            strokeLinecap="butt"
            strokeDasharray={pathLength}
            strokeDashoffset={dashOffset}
          />

          {/* High-visibility cursor line instead of rounded knob */}
          <line 
            x1={cx + (r - 12) * Math.cos(angle)} 
            y1={cy - (r - 12) * Math.sin(angle)}
            x2={cx + (r + 12) * Math.cos(angle)} 
            y2={cy - (r + 12) * Math.sin(angle)}
            stroke="white"
            strokeWidth="2"
          />
          
          <circle cx={knobX} cy={knobY} r="3" fill="black" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      <div className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-white">
        {label}
      </div>
    </div>
  )
}
