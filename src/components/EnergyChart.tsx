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

        {/* SVG Container mapping 0-100 coordinate space to scale 100% width/height */}
        <svg 
          ref={svgRef}
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className="absolute inset-0 w-full h-full overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPct(null)}
        >
          <defs>
            {/* Wavy Pattern Texture for Low Energy States */}
            <pattern id="wavy" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0,5 Q 2.5,0 5,5 T 10,5" fill="none" stroke="#27272a" strokeWidth="0.5" />
              <path d="M 0,10 Q 2.5,5 5,10 T 10,10" fill="none" stroke="#27272a" strokeWidth="0.5" />
            </pattern>

            {/* Vertical Gradient mapping to energy height */}
            <linearGradient id="energyGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.0"/>
              <stop offset="40%" stopColor="#c026d3" stopOpacity="0.05"/>
              <stop offset="80%" stopColor="#e11d48" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#ea580c" stopOpacity="0.2"/>
            </linearGradient>
            
            {/* The Vibrant Rise-style Stroke */}
            <linearGradient id="lineGradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="10%" stopColor="#4338ca"/> {/* Indigo */}
              <stop offset="35%" stopColor="#7e22ce"/> {/* Purple */}
              <stop offset="65%" stopColor="#db2777"/> {/* Pink */}
              <stop offset="85%" stopColor="#f43f5e"/> {/* Rose */}
              <stop offset="100%" stopColor="#f97316"/> {/* Orange Peak */}
            </linearGradient>
          </defs>

          {/* Background Texture for low energy bottom half (score under 50%) */}
          <rect x="0" y="50" width="100" height="50" fill="url(#wavy)" className="opacity-30" />

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
            strokeWidth={isFullscreen ? "0.6" : "1.2"} 
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none drop-shadow-md"
          />
        </svg>

        {/* Interactive Hover Tooltip */}
        <AnimatePresence>
          {hoverPct !== null && activePoint && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute top-0 bottom-0 z-30 w-[1px] bg-zinc-400 pointer-events-none"
              style={{ left: `${activePoint.x}%` }}
            >
              <div 
                className="absolute w-4 h-4 rounded-full border-[3px] border-black bg-rose-400 pointer-events-none -ml-2 transition-all duration-75"
                style={{ top: `${activePoint.y}%`, marginTop: '-8px' }}
              ></div>
              <div 
                className={`absolute top-4 ${activePoint.x > 80 ? 'right-4' : 'left-4'} bg-white text-black p-4 pointer-events-none min-w-[140px] shadow-2xl rounded-sm`}
              >
                <div className="font-mono text-[10px] uppercase text-zinc-500 mb-1 tracking-widest">{format(activePoint.time, 'HH:mm')}</div>
                <div className="font-sans text-4xl font-light tracking-tighter leading-none">{Math.round(activePoint.score)}<span className="text-xl text-zinc-400">%</span></div>
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

        {/* Real-time Indicator Line (Now) - ALWAYS RENDERED to prevent flashing layout shift */}
        {points.map((p, i) => {
          if (p.isNow) {
             return (
               <div 
                 key="now"
                 className={`absolute top-0 bottom-0 z-20 w-[1px] bg-indigo-500/80 pointer-events-none transition-opacity duration-300 ${hoverPct !== null ? 'opacity-20' : 'opacity-100'}`}
                 style={{ left: `${p.x}%` }}
               >
                 <div className="absolute top-0 -ml-1 w-2 h-2 rounded-full border border-indigo-500 bg-black"></div>
                 <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-indigo-500/10 text-indigo-400 font-mono text-[9px] px-2 py-0.5 rounded-sm border border-indigo-500/30 tracking-widest">
                    NOW
                 </div>
               </div>
             )
          }
          return null;
        })}
      </div>
    </Wrapper>
  )
}
