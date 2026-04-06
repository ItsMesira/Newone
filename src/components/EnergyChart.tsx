"use client"

import { useMemo } from 'react'
import { Card } from './ui/Card'
import { generateEnergyBlocks } from '@/lib/calculations'
import { motion } from 'framer-motion'

interface EnergyChartProps {
  wakeTime: Date;
  sleepDebt: number;
}

export function EnergyChart({ wakeTime, sleepDebt }: EnergyChartProps) {
  const blocks = useMemo(() => generateEnergyBlocks(wakeTime, sleepDebt), [wakeTime, sleepDebt])

  return (
    <Card className="h-full flex flex-col p-6 min-h-[300px]">
      <div className="flex justify-between items-start mb-auto">
        <h3 className="font-display font-bold text-zinc-200 tracking-widest text-lg uppercase">ENERGY SYSTEM</h3>
        <span className="text-zinc-500 tracking-widest leading-none font-bold text-xl cursor-pointer">...</span>
      </div>
      
      {/* Container for vertical pills */}
      <div className="flex justify-between items-end h-48 w-full mt-6 px-2">
        {blocks.map((block, i) => {
          // Calculate height % based on score (min 20px so it's always visible)
          const heightPercent = Math.max(20, block.score)
          
          let bgColor = "bg-white" // neutral
          let dotColor = "bg-zinc-500"
          
          if (block.type === 'peak') {
            bgColor = "bg-primary" // Lime
            dotColor = "bg-primary"
          } else if (block.type === 'slump') {
            bgColor = "bg-warning" // Orange
            dotColor = "bg-warning"
          }

          return (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="font-display font-bold text-[10px] text-zinc-500 tracking-widest uppercase">
                {block.time}
              </div>
              
              <div className="h-32 w-10 relative flex items-end justify-center">
                {/* Background Track optional, leaving clean per image */}
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: `${heightPercent}%`, opacity: 1 }}
                  transition={{ duration: 0.8, delay: i * 0.1, type: "spring" }}
                  className={`w-full rounded-full flex items-center justify-center ${bgColor}`}
                >
                  {/* Inside pill label just like image */}
                  <span className={`font-display text-base font-bold ${block.type === 'peak' ? 'text-black' : 'text-black'}`}>
                    {block.score}
                  </span>
                </motion.div>
              </div>

              {/* Matrix dot below */}
              <div className="flex gap-1 mt-1">
                <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 flex gap-6 text-xs font-semibold text-zinc-400 uppercase tracking-widest items-center justify-center">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-primary border-[3px] border-[#1e1e1e] ring-1 ring-white/10"></span> Peak</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-white border-[3px] border-[#1e1e1e] ring-1 ring-white/10"></span> Regulating</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-warning border-[3px] border-[#1e1e1e] ring-1 ring-white/10"></span> Slump</div>
      </div>
    </Card>
  )
}
