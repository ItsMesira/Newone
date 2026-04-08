"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { calculateEnergyData, getEnergyZones } from "@/lib/calculations"
import { addMinutes, addHours, startOfDay, format } from "date-fns"

interface InteractiveEnergyChartProps {
  wakeTime: Date
  sleepDebt: number
  napsTotalHours: number
}

export function InteractiveEnergyChart({ wakeTime, sleepDebt, napsTotalHours }: InteractiveEnergyChartProps) {
  // Generate 24 hours of data points at 15 minute intervals, starting from exactly 1 hour before wakeTime
  const data = useMemo(() => {
    const pts = []
    const startTime = addHours(wakeTime, -1)
    
    for (let i = 0; i <= 24 * 4; i++) { // 96 data points
      const time = addMinutes(startTime, i * 15)
      const calcs = calculateEnergyData(time, wakeTime, sleepDebt, napsTotalHours)
      pts.push({
        time,
        ...calcs
      })
    }
    return pts
  }, [wakeTime, sleepDebt, napsTotalHours])

  const zones = useMemo(() => getEnergyZones(wakeTime), [wakeTime])

  // Canvas bounds
  const width = 1200
  const height = 400
  const padX = 60
  const padY = 60
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const mapX = (idx: number) => padX + (idx / (data.length - 1)) * innerW
  const mapY = (val: number, max: number = 100) => padY + innerH - (val / max) * innerH

  // Paths
  const alertnessPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapY(d.score)}`).join(" ")
  const processCPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapY(d.processC, 1)}`).join(" ")
  const processSPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${mapX(i)} ${mapY(d.processS, 1)}`).join(" ")

  // Area under alertness
  const alertnessArea = `${alertnessPath} L ${mapX(data.length - 1)} ${mapY(0)} L ${mapX(0)} ${mapY(0)} Z`

  // Calculate zone pixel boundaries based on time relative to start Time
  const startTimeMs = addHours(wakeTime, -1).getTime()
  const totalMs = 24 * 60 * 60 * 1000

  const getZoneRect = (start: Date, end: Date) => {
    const rx = padX + Math.max(0, (start.getTime() - startTimeMs) / totalMs) * innerW
    const rw = ((end.getTime() - start.getTime()) / totalMs) * innerW
    return { x: rx, w: rw }
  }

  const mph = getZoneRect(zones.morningPeak.start, zones.morningPeak.end)
  const adh = getZoneRect(zones.afternoonDip.start, zones.afternoonDip.end)
  const mh = getZoneRect(zones.melatoninWindow.start, zones.melatoninWindow.end)

  return (
    <div className="w-full relative overflow-x-auto border border-zinc-800 bg-black text-white font-mono uppercase">
      {/* brutalist texture / grid */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="min-w-[800px] w-full p-4 relative z-10">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-2xl">
          <defs>
            <linearGradient id="alertFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
            </linearGradient>
            <pattern id="diagHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            </pattern>
          </defs>

          {/* Zones */}
          <rect x={mph.x} y={padY} width={mph.w} height={innerH} fill="rgba(255,255,255,0.03)" />
          <text x={mph.x + 10} y={padY + 20} className="text-[10px] fill-zinc-500 tracking-widest">Morning Peak</text>

          <rect x={adh.x} y={padY} width={adh.w} height={innerH} fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" />
          <text x={adh.x + 10} y={padY + 20} className="text-[10px] fill-zinc-600 tracking-widest text-[#52525b]">Circadian Dip</text>

          <rect x={mh.x} y={padY} width={mh.w} height={innerH} fill="url(#diagHatch)" />
          <text x={mh.x + 10} y={padY + 20} className="text-[10px] fill-zinc-400 tracking-widest text-[#a1a1aa]">DLMO / Melatonin</text>

          {/* Sub Grid Lines Y */}
          {[0, 25, 50, 75, 100].map(pct => (
            <g key={pct}>
              <line x1={padX} y1={mapY(pct)} x2={width - padX} y2={mapY(pct)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray={pct === 50 ? "none" : "2 4"} />
              <text x={padX - 10} y={mapY(pct) + 3} className="text-[10px] fill-zinc-500 text-right" textAnchor="end">{pct}</text>
            </g>
          ))}

          {/* Sub Grid Lines X (Time labels) */}
          {[0, 4, 8, 12, 16, 20, 24].map(idxH => {
            const px = mapX(idxH * 4) // 4 data points per hour
            const d = data[idxH * 4]
            return d ? (
              <g key={idxH}>
                <line x1={px} y1={padY} x2={px} y2={padY + innerH} stroke="rgba(255,255,255,0.05)" />
                <text x={px} y={padY + innerH + 20} className="text-[10px] fill-zinc-500" textAnchor="middle">{format(d.time, 'HH:mm')}</text>
              </g>
            ) : null
          })}

          {/* Area */}
          <motion.path
            d={alertnessArea}
            fill="url(#alertFade)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />

          {/* Lines */}
          <motion.path
            d={processSPath}
            fill="none"
            stroke="#ef4444" // red for pressure
            strokeWidth="2"
            strokeDasharray="4 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <text x={mapX(data.length - 2)} y={mapY(data[data.length-2].processS, 1) - 10} className="text-[10px] fill-red-500" textAnchor="end">Process S (Pressure)</text>

          <motion.path
            d={processCPath}
            fill="none"
            stroke="#3b82f6" // blue for circadian
            strokeWidth="2"
            strokeDasharray="8 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          <text x={mapX(data.length - 2)} y={mapY(data[data.length-2].processC, 1) + 15} className="text-[10px] fill-blue-500" textAnchor="end">Process C (Circadian)</text>

          <motion.path
            d={alertnessPath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="4"
            className="drop-shadow-md"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
          {/* Wake line indicator */}
          <line x1={mapX(4)} y1={padY} x2={mapX(4)} y2={padY + innerH} stroke="white" strokeWidth="2" />
          <text x={mapX(4) - 5} y={padY - 10} className="text-[10px] fill-white tracking-widest" textAnchor="end">WAKE</text>
        </svg>
      </div>
    </div>
  )
}
