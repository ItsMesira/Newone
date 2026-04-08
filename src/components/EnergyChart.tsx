"use client"

import { useMemo, useEffect, useState, useRef } from 'react'
import { calculateEnergyData } from '@/lib/calculations'
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
  const [hoverPct, setHoverPct] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const { points } = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 96; i++) {
      const time = addMinutes(wakeTime, i * 15)
      const data = calculateEnergyData(time, wakeTime, sleepDebt, 0)
      
      const prevTime = i > 0 ? addMinutes(wakeTime, (i-1) * 15) : addMinutes(time, -15)
      const isNow = isBefore(prevTime, new Date()) && isAfter(time, new Date()) || (i === 0 && isAfter(time, new Date()))
      
      pts.push({
        x: (i / 96) * 100,
        y: 100 - data.score, // Convert [0, 100] mapping to [100, 0] SVG Y-axis
        score: data.score,
        processC: data.processC,
        processS: data.processS,
        time,
        isNow
      })
    }
    return { points: pts };
  }, [wakeTime, sleepDebt])

  if (!mounted) return <div className="min-h-[400px] w-full bg-black border border-zinc-900"></div>

  // Create smooth Bezier strings for the main data lines
  // A simple cubic interpolation utility for visually pleasing curves
  const computeBezierPath = (dataPoints: typeof points, valueMapper: (p: typeof points[0]) => number) => {
    return dataPoints.reduce((path, p, i, a) => {
      if (i === 0) return `M ${p.x} ${valueMapper(p)}`;
      const prev = a[i - 1];
      const cx1 = prev.x + (p.x - prev.x) / 2;
      const cy1 = valueMapper(prev);
      const cx2 = p.x - (p.x - prev.x) / 2;
      const cy2 = valueMapper(p);
      return `${path} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${valueMapper(p)}`;
    }, "");
  };

  const pathD = computeBezierPath(points, p => p.y);
  
  // Fill areas
  const areaD = `${pathD} L 100 100 L 0 100 Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    setHoverPct(percentage)
  }

  let activePoint = null
  if (hoverPct !== null) {
    activePoint = points.reduce((prev, curr) => 
      Math.abs(curr.x - hoverPct) < Math.abs(prev.x - hoverPct) ? curr : prev
    )
  }

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-[100] bg-black flex flex-col p-8 md:p-16 border-2 border-zinc-800"
    : "flex flex-col h-full w-full min-h-[450px] relative";

  return (
    <div className={containerClasses}>
      
      <button 
        onClick={() => setIsFullscreen(!isFullscreen)}
        className={`absolute z-50 text-zinc-500 hover:text-white transition-colors bg-black/50 p-2 rounded-sm ${isFullscreen ? 'top-8 right-8' : 'top-4 right-4'}`}
      >
        {isFullscreen ? <Shrink className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
      </button>

      <div className="flex justify-between items-start pt-2 mb-8 border-b border-zinc-900 pb-4">
        <div className="flex flex-col">
           <h3 className="font-mono text-white tracking-[0.2em] text-sm uppercase">SYS.ENERGY_CURVE [24H]</h3>
           <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Dual-Process Analysis [C/S]</span>
        </div>
        <div className="flex gap-4 font-mono text-[10px] text-zinc-500 tracking-widest">
           <span className="flex items-center gap-2"><span className="w-2 h-2 bg-indigo-500 block rounded-full"></span> ALERTNESS</span>
        </div>
      </div>
      
      <div className="flex-1 w-full relative mt-4">
        
        {/* Graph Grid system */}
        <div className="absolute inset-0 z-0 flex flex-col justify-between pointer-events-none opacity-20 py-2">
            {[100, 75, 50, 25, 0].map(val => (
              <div key={val} className="w-full flex items-center gap-4">
                <span className="text-[10px] font-mono text-zinc-500 w-6 text-right opacity-50">{val}</span>
                <div className={`h-[1px] w-full ${val === 50 ? 'bg-zinc-400' : 'bg-zinc-800'}`}></div>
              </div>
            ))}
        </div>

        <svg 
          ref={svgRef}
          viewBox="0 0 100 100" 
          preserveAspectRatio="none" 
          className="absolute inset-0 w-full h-full overflow-visible cursor-crosshair ml-10"
          style={{ width: 'calc(100% - 40px)' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverPct(null)}
        >
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8"/>
              <stop offset="50%" stopColor="#c084fc"/>
              <stop offset="100%" stopColor="#e879f9"/>
            </linearGradient>

            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)"/>
              <stop offset="50%" stopColor="rgba(192, 132, 252, 0.1)"/>
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0)"/>
            </linearGradient>
            
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Area Fill */}
          <motion.path 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            d={areaD} 
            fill="url(#areaGradient)" 
            className="pointer-events-none"
          />
          
          {/* Main Stroke */}
          <motion.path 
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            d={pathD} 
            fill="none" 
            stroke="url(#scoreGradient)" 
            strokeWidth={isFullscreen ? "0.6" : "1.2"} 
            strokeLinecap="round"
            filter="url(#neonGlow)"
            vectorEffect="non-scaling-stroke"
            className="pointer-events-none drop-shadow-xl"
          />

          {/* Now Vertical Beam */}
          {points.map((p, i) => {
            if (p.isNow) {
               return (
                  <g key="now" className="pointer-events-none transition-opacity">
                    <line 
                       x1={p.x} y1="0" x2={p.x} y2="100" 
                       stroke="white" strokeWidth="0.2" 
                       strokeDasharray="1 1"
                       opacity={hoverPct ? 0.3 : 1}
                    />
                    <circle cx={p.x} cy={p.y} r="1.5" fill="white" filter="url(#neonGlow)" opacity={hoverPct ? 0.3 : 1} />
                    {!hoverPct && (
                       <text x={p.x + 1} y="15" className="text-[3px] font-mono fill-white tracking-widest bg-black/50">NOW</text>
                    )}
                  </g>
               )
            }
            return null
          })}
        </svg>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoverPct !== null && activePoint && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.1 }}
              className="absolute top-0 bottom-0 z-30 w-[1px] bg-white pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              style={{ left: `calc(40px + ${activePoint.x * ((svgRef.current?.getBoundingClientRect().width || 100) / 100)}px)` }}
            >
              <div 
                className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)] pointer-events-none -ml-[5px] transition-all duration-75"
                style={{ top: `${activePoint.y}%`, marginTop: '-6px' }}
              ></div>
              <div 
                className={`absolute top-4 ${activePoint.x > 70 ? '-left-[150px]' : 'left-4'} bg-black/90 border border-zinc-700 text-white p-4 min-w-[140px] rounded-lg shadow-2xl backdrop-blur-sm pointer-events-none`}
              >
                <div className="font-mono text-xs text-zinc-400 border-b border-zinc-800 pb-2 mb-2 flex justify-between">
                  <span>TIME</span><span className="text-white">{format(activePoint.time, 'HH:mm')}</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="font-mono text-[10px] text-indigo-400">SCORE</span>
                    <div className="font-display text-3xl font-light leading-none">{Math.round(activePoint.score)}<span className="text-lg text-zinc-500">%</span></div>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-zinc-800/50">
                   <div>
                      <div className="text-zinc-500">PROC.C</div>
                      <div className="text-zinc-300">{activePoint.processC.toFixed(2)}</div>
                   </div>
                   <div className="text-right">
                      <div className="text-zinc-500">PROC.S</div>
                      <div className="text-zinc-300">{activePoint.processS.toFixed(2)}</div>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Time scale under the chart */}
      <div className="w-full flex justify-between ml-10 pointer-events-none box-border pr-[40px] pt-4 border-t border-zinc-900 mt-2">
          {[0, 24, 48, 72, 96].map(i => (
             <span key={i} className="font-mono text-[10px] text-zinc-600 uppercase">
               {format(points[i]?.time || wakeTime, 'HH:mm')}
             </span>
          ))}
      </div>
    </div>
  )
}
