"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card } from "./ui/Card"

interface EnergyScoreProps {
  score: number;
  label: string;
}

export function EnergyScore({ score, label }: EnergyScoreProps) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    let startVal = 0
    const end = Math.round(score)
    const duration = 1200
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      setDisplayScore(Math.round(startVal + (end - startVal) * easeOut))

      if (progress < 1) requestAnimationFrame(animate)
    }
    
    requestAnimationFrame(animate)
  }, [score])

  const isGood = score >= 50

  return (
    <Card className="flex flex-col p-6 min-h-[260px] justify-between relative overflow-hidden">
      <div className="flex justify-between items-start mb-6 z-10">
        <h3 className="font-display font-bold text-zinc-200 tracking-widest text-lg">ENERGY SCORE</h3>
        <span className="text-zinc-500 tracking-widest leading-none font-bold text-xl cursor-pointer">...</span>
      </div>
      
      <div className="flex gap-8 z-10">
        <div>
          <div className={`mb-1 text-sm ${isGood ? 'text-primary' : 'text-warning'}`}>
            {isGood ? '▲' : '▼'}
          </div>
          <div className="text-5xl font-display font-bold tracking-wide text-white">
            {displayScore}<span className="text-3xl">%</span>
          </div>
          <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-semibold">Current Level</div>
        </div>
        <div>
          <div className={`mb-1 text-sm ${isGood ? 'text-warning' : 'text-primary'}`}>
            {isGood ? '▼' : '▲'} {/* inverse arrow purely for visual layout balance matching the image */}
          </div>
          <div className="text-5xl font-display font-bold tracking-wide text-white capitalize">
            {label}
          </div>
          <div className="text-xs text-zinc-400 mt-1 uppercase tracking-wider font-semibold">Status</div>
        </div>
      </div>

      {/* Decorative decorative SVG lines mimicking the visual style of the Dribbble image line charts */}
      <div className="absolute bottom-4 left-0 right-0 h-16 pointer-events-none px-6 flex items-end">
        <svg viewBox="0 0 200 40" preserveAspectRatio="none" className="w-full h-full vector-non-scaling-stroke">
            <path 
              d="M0,20 L30,35 L60,10 L90,25 L120,5 L150,20 L180,30 L200,15" 
              fill="none" 
              stroke="var(--primary)" 
              strokeWidth="2" 
              vectorEffect="non-scaling-stroke"
            />
            <path 
              d="M0,30 L40,15 L80,35 L110,15 L140,25 L170,10 L200,20" 
              fill="none" 
              stroke="var(--warning)" 
              strokeWidth="2" 
              vectorEffect="non-scaling-stroke"
            />
        </svg>
      </div>
    </Card>
  )
}
