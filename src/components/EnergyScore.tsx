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
    const duration = 1200
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3) // cubic ease out
      setAnimatedScore(startVal + (end - startVal) * easeOut)

      if (progress < 1) requestAnimationFrame(animate)
    }
    
    if (Math.abs(startVal - end) > 0.5) {
      requestAnimationFrame(animate)
    }
  }, [score])

  const displayScore = Math.round(animatedScore)

  // SVG Gauge Math
  const cx = 100
  const cy = 100
  const r = 70
  const strokeWidth = 24
  const pathLength = Math.PI * r

  const progressRatio = animatedScore / 100
  const dashOffset = pathLength * (1 - progressRatio)

  const angle = Math.PI - progressRatio * Math.PI
  const knobX = cx + r * Math.cos(angle)
  const knobY = cy - r * Math.sin(angle)

  let color = "#4ade80" // green-400
  if (animatedScore < 40) color = "#fb7185" // rose-400
  else if (animatedScore < 70) color = "#fbbf24" // amber-400

  return (
    <div className="flex flex-col h-full w-full bg-[#1c1c1f] rounded-[32px] p-8 pb-6 border border-white/5 shadow-2xl min-h-[350px]">
      <div className="flex justify-between items-start z-10 w-full relative">
        <h3 className="font-sans text-zinc-400 text-[15px] font-medium tracking-wide">Energy Score</h3>
      </div>
      
      <div className="flex items-baseline mt-4 z-10 relative">
        <span className="text-[72px] pb-2 font-medium text-white tracking-tight leading-[0.85]">
          {displayScore}
        </span>
        <span className="text-xl text-zinc-500 font-medium ml-2">/ 100</span>
      </div>
      
      {/* SVG Container - strictly positioned to not clip using natural flex flow */}
      <div className="flex-1 flex flex-col justify-end items-center mt-8 w-full min-h-[160px] relative pointer-events-none">
        <svg viewBox="0 0 200 130" className="w-[120%] max-w-[380px] overflow-visible mx-auto transform translate-y-[10px]">
          <defs>
            <pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#2a2a2f" strokeWidth="1.5" />
            </pattern>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Base track solid dark background */}
          <path 
            d="M 30 100 A 70 70 0 0 1 170 100" 
            fill="none" 
            stroke="#121214" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
          />
          {/* Base track pattern (diagonal slashes) */}
          <path 
            d="M 30 100 A 70 70 0 0 1 170 100" 
            fill="none" 
            stroke="url(#hatch)" 
            strokeWidth={strokeWidth} 
            strokeLinecap="round" 
          />

          {/* Active colored track mapped to energy score */}
          <path 
            d="M 30 100 A 70 70 0 0 1 170 100" 
            fill="none" 
            stroke={color} 
            strokeWidth={strokeWidth} 
            strokeLinecap="round"
            strokeDasharray={pathLength}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke 0.8s ease-in-out' }}
          />

          {/* Left dark starting hole to match the UI image detail */}
          <circle cx="30" cy="100" r="5" fill="#121214" />

          {/* Moving white knob/thumb */}
          <g transform={`translate(${knobX}, ${knobY})`}>
             <circle cx="0" cy="0" r="10" fill="white" filter="url(#shadow)" />
             <circle cx="0" cy="0" r="4" fill={color} style={{ transition: 'fill 0.8s ease-in-out' }} />
          </g>
        </svg>
      </div>

      <div className="z-10 relative mt-2 text-center font-sans text-xs font-medium text-zinc-400">
        {label}
      </div>
    </div>
  )
}
