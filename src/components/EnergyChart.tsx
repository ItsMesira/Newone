"use client"

import { useMemo, useEffect, useState } from 'react'
import { calculateEnergyCurve } from '@/lib/calculations'
import { motion } from 'framer-motion'
import { addMinutes, format, isAfter, isBefore } from 'date-fns'

interface EnergyChartProps {
  wakeTime: Date;
  sleepDebt: number;
}

export function EnergyChart({ wakeTime, sleepDebt }: EnergyChartProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const { points, maxBase, minBase } = useMemo(() => {
    const pts = []
    let max = 0;
    let min = 100;
    // Generate 48 data points (every 30 mins for 24 hours)
    for (let i = 0; i <= 48; i++) {
      const time = addMinutes(wakeTime, i * 30)
      const score = calculateEnergyCurve(time, wakeTime, sleepDebt)
      const isNow = i > 0 && isBefore(addMinutes(wakeTime, (i-1) * 30), new Date()) && isAfter(addMinutes(wakeTime, i * 30), new Date())
      
      pts.push({
        x: (i / 48) * 100, // percentage width
        y: 100 - score,    // percentage height (inverted for SVG coordinates)
        time,
        score,
        isNow
      })
      if (score > max) max = score;
      if (score < min) min = score;
    }
    return { points: pts, maxBase: max, minBase: min };
  }, [wakeTime, sleepDebt])

  if (!mounted) return <div className="min-h-[400px] w-full bg-black border border-zinc-800"></div>

  // Create SVG path strings
  // Smooth curve using cubic bezier from point to point is ideal, 
  // but with 48 points, linear L commands are indistinguishable from true curve
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L 100 100 L 0 100 Z`

  return (
    <div className="flex flex-col h-full w-full min-h-[400px] relative">
      <div className="absolute top-0 left-0 w-full h-[1px] bg-zinc-800"></div>
      
      <div className="flex justify-between items-start pt-4 mb-8">
        <h3 className="font-mono text-zinc-500 tracking-[0.2em] text-xs uppercase z-10 relative">SYS.ENERGY_CURVE [24H]</h3>
        <span className="font-mono text-xs text-zinc-500 tracking-widest leading-none z-10 relative">CIRCADIAN RHYTHM</span>
      </div>
      
      {/* Rise-Style Smooth Energy Curve Graphic */}
      <div className="flex-1 w-full relative mt-4 group">
        
        {/* Timeline Axis Background Lines */}
        <div className="absolute top-1/4 left-0 w-full h-[1px] border-t border-dashed border-zinc-800"></div>
        <div className="absolute top-2/4 left-0 w-full h-[1px] border-t border-dashed border-zinc-800"></div>
        <div className="absolute top-3/4 left-0 w-full h-[1px] border-t border-dashed border-zinc-800"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] border-b border-zinc-600"></div>

        {/* SVG Container mapping 0-100 coordinate space to scale 100% width/height */}
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className="absolute inset-0 w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              {/* Top of the wave matches max score; using Sky-400 equivalent #38bdf8 */}
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4"/>
              <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.05"/>
              <stop offset="100%" stopColor="#000000" stopOpacity="0.0"/>
            </linearGradient>
            
            {/* Glossy stroke gradient */}
            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3"/>
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="1"/>
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.3"/>
            </linearGradient>
          </defs>

          {/* Fill shape underneath */}
          <motion.path 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            d={areaD} 
            fill="url(#energyGradient)" 
          />
          
          {/* Main smooth bright line on top */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={pathD} 
            fill="none" 
            stroke="url(#lineGradient)" 
            strokeWidth="0.8" 
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* X-Axis Time Markers - Just show 4 distinct points to keep it clean */}
        <div className="absolute -bottom-6 w-full flex justify-between px-1">
          {[0, 16, 32, 48].map((i) => (
             <span key={i} className="font-mono text-[10px] text-zinc-500 uppercase">
               {format(points[i].time, 'HH:mm')}
             </span>
          ))}
        </div>

        {/* Real-time Indicator Line (Now) */}
        {points.map((p, i) => {
          if (p.isNow) {
             return (
               <motion.div 
                 key="now"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="absolute top-0 bottom-0 z-20 w-[1px] bg-red-500/80 pointer-events-none"
                 style={{ left: `${p.x}%` }}
               >
                 <div className="absolute top-0 -ml-1 w-2 h-2 rounded-full border border-red-500 bg-black"></div>
                 <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500/10 text-red-400 font-mono text-[9px] px-1 py-0.5 rounded border border-red-500/50">
                    NOW
                 </div>
               </motion.div>
             )
          }
          return null;
        })}
      </div>
    </div>
  )
}
