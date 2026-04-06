"use client"

import { useMemo, useEffect, useState, useRef } from 'react'
import { calculateEnergyCurve } from '@/lib/calculations'
import { motion, AnimatePresence } from 'framer-motion'
import { addMinutes, format, isAfter, isBefore } from 'date-fns'
import { Expand, Shrink } from 'lucide-react'

interface EnergyChartProps {
  wakeTime: Date;
  sleepDebt: number;
}

export function EnergyChart({ wakeTime, sleepDebt }: EnergyChartProps) {
  const [mounted, setMounted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  // Interactive Hover State
  const [hoverPct, setHoverPct] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close full screen on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { points } = useMemo(() => {
    const pts = []
    // 96 points for much higher resolution during interactive hover (every 15 mins)
    for (let i = 0; i <= 96; i++) {
      const time = addMinutes(wakeTime, i * 15)
      const score = calculateEnergyCurve(time, wakeTime, sleepDebt)
      const isNow = i > 0 && isBefore(addMinutes(wakeTime, (i-1) * 15), new Date()) && isAfter(addMinutes(wakeTime, i * 15), new Date())
      
      pts.push({
        x: (i / 96) * 100, // percentage width
        y: 100 - score,    // percentage height
        time,
        score,
        isNow
      })
    }
    return { points: pts };
  }, [wakeTime, sleepDebt])

  if (!mounted) return <div className="min-h-[400px] w-full bg-black border border-zinc-800"></div>

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L 100 100 L 0 100 Z`

  // Hover Interaction Math
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setHoverPct(percentage)
  }

  // Find the exact data point closest to the mouse hover
  let activePoint = null
  if (hoverPct !== null) {
    activePoint = points.reduce((prev, curr) => 
      Math.abs(curr.x - hoverPct) < Math.abs(prev.x - hoverPct) ? curr : prev
    )
  }

  // Render Component Wrapper
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    if (isFullscreen) {
      return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col p-8 md:p-16">
           <div className="absolute top-0 left-0 w-full h-[1px] bg-zinc-800"></div>
           <button 
             onClick={() => setIsFullscreen(false)}
             className="absolute top-8 right-8 z-50 text-zinc-500 hover:text-white transition-colors"
           >
             <Shrink className="w-6 h-6" />
           </button>
           {children}
        </div>
      )
    }
    return (
      <div className="flex flex-col h-full w-full min-h-[400px] relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-zinc-800"></div>
        <button 
          onClick={() => setIsFullscreen(true)}
          className="absolute top-4 right-0 z-50 text-zinc-500 hover:text-white transition-colors"
        >
          <Expand className="w-4 h-4" />
        </button>
        {children}
      </div>
    )
  }

  return (
    <Wrapper>
      <div className="flex justify-between items-start pt-4 mb-8">
        <h3 className="font-mono text-zinc-500 tracking-[0.2em] text-xs uppercase z-10 relative">SYS.ENERGY_CURVE [24H]</h3>
        <span className="font-mono text-xs text-zinc-500 tracking-widest leading-none z-10 relative mr-12">CIRCADIAN RHYTHM</span>
      </div>
      
      {/* Rise-Style Smooth Energy Curve Graphic */}
      <div className="flex-1 w-full relative mt-4 group">
        
        {/* Timeline Axis Background Lines */}
        <div className="absolute top-1/4 left-0 w-full h-[1px] border-t border-dashed border-zinc-900 pointer-events-none"></div>
        <div className="absolute top-2/4 left-0 w-full h-[1px] border-t border-dashed border-zinc-900 pointer-events-none"></div>
        <div className="absolute top-3/4 left-0 w-full h-[1px] border-t border-dashed border-zinc-900 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] border-b border-zinc-700 pointer-events-none"></div>

        {/* SVG Container */}
        <svg 
          ref={svgRef}
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className="absolute inset-0 w-full h-full overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPct(null)}
        >
          <defs>
            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4"/>
              <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.05"/>
              <stop offset="100%" stopColor="#000000" stopOpacity="0.0"/>
            </linearGradient>
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
            className="pointer-events-none"
          />
          
          {/* Main smooth bright line on top */}
          <motion.path 
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={pathD} 
            fill="none" 
            stroke="url(#lineGradient)" 
            strokeWidth={isFullscreen ? "0.4" : "0.8"} 
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none"
          />
        </svg>

        {/* Interactive Hover Tooltip */}
        <AnimatePresence>
          {activePoint && hoverPct !== null && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 bottom-0 z-30 w-[1px] bg-zinc-400 pointer-events-none"
              style={{ left: `${activePoint.x}%` }}
            >
              <div 
                className="absolute w-3 h-3 rounded-full border-2 border-white bg-sky-400 pointer-events-none -ml-1.5"
                style={{ top: `${activePoint.y}%`, marginTop: '-6px' }}
              ></div>
              <div 
                className={`absolute top-4 ${activePoint.x > 80 ? 'right-4' : 'left-4'} bg-white text-black p-3 pointer-events-none whitespace-nowrap min-w-[120px]`}
              >
                <div className="font-mono text-xs uppercase text-zinc-500 mb-1">{format(activePoint.time, 'HH:mm')}</div>
                <div className="font-display text-3xl font-medium tracking-tighter leading-none">{Math.round(activePoint.score)}%</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* X-Axis Time Markers */}
        <div className="absolute -bottom-6 w-full flex justify-between px-1 pointer-events-none">
          {[0, 24, 48, 72, 96].map((i) => (
             <span key={i} className="font-mono text-[10px] text-zinc-500 uppercase">
               {format(points[i].time, 'HH:mm')}
             </span>
          ))}
        </div>

        {/* Real-time Indicator Line (Now) */}
        {!activePoint && points.map((p, i) => {
          if (p.isNow) {
             return (
               <motion.div 
                 key="now"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="absolute top-0 bottom-0 z-20 w-[1px] bg-sky-500/80 pointer-events-none"
                 style={{ left: `${p.x}%` }}
               >
                 <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-sky-500/10 text-sky-400 font-mono text-[9px] px-1 py-0.5 rounded border border-sky-500/50">
                    NOW
                 </div>
               </motion.div>
             )
          }
          return null;
        })}
      </div>
    </Wrapper>
  )
}
