"use client"

import { useMemo } from 'react'
import { generateEnergyBlocks } from '@/lib/calculations'
import { motion } from 'framer-motion'

interface EnergyChartProps {
  wakeTime: Date;
  sleepDebt: number;
}

export function EnergyChart({ wakeTime, sleepDebt }: EnergyChartProps) {
  const blocks = useMemo(() => generateEnergyBlocks(wakeTime, sleepDebt), [wakeTime, sleepDebt])

  return (
    <div className="flex flex-col h-full w-full min-h-[400px] relative">
      {/* Structural alignment grid lines */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-zinc-800"></div>
      
      <div className="flex justify-between items-start pt-4 mb-8">
        <h3 className="font-mono text-zinc-500 tracking-[0.2em] text-xs uppercase">SYS.ENERGY_CURVE [24H]</h3>
        <span className="font-mono text-xs text-zinc-500 tracking-widest leading-none">BIOLOGICAL MODEL C-S</span>
      </div>
      
      <div className="flex flex-1 items-end justify-between w-full mt-auto relative pt-12">
        {/* Baseline grid line */}
        <div className="absolute bottom-6 left-0 w-full h-[1px] bg-zinc-800"></div>
        
        {blocks.map((block, i) => {
          let markColor = "bg-white"
          let textColor = "text-white"
          
          if (block.type === 'peak') {
            markColor = "bg-sky-400"
            textColor = "text-sky-400"
          } else if (block.type === 'slump') {
            markColor = "bg-zinc-600"
            textColor = "text-zinc-500"
          }

          // Use the absolute score directly for height, mapped visually
          const heightPercent = block.score

          return (
            <div key={i} className="flex flex-col items-center flex-1 h-full max-w-[40px] relative z-10 justify-end group">
              
              {/* Value explicitly on top of column */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 + 0.3 }}
                className={`font-mono text-xs mb-2 opacity-0 group-hover:opacity-100 transition-opacity ${textColor}`}
              >
                {Math.round(block.score)}
              </motion.div>

              {/* Data Node and Structural Stem */}
              <div className="w-[1px] flex-1 relative flex flex-col justify-end items-center h-full">
                {/* Stem filling down to baseline */}
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercent}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }} // smooth clinical snap
                  className={`w-[1px] ${markColor} relative flex items-start justify-center`}
                >
                  {/* The Data Node - sharp square */}
                  <div className={`absolute top-0 w-2 h-2 -ml-[3.5px] ${markColor}`}></div>
                </motion.div>
                
                {/* Sub-baseline axis marker */}
                <div className="w-[1px] h-2 bg-zinc-800 mt-[1px]"></div>
              </div>

              {/* Time Label on X-Axis */}
              <div className="font-mono text-[9px] text-zinc-600 tracking-widest mt-2">
                {block.time}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
