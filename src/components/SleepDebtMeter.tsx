"use client"

import { motion } from "framer-motion"

interface SleepDebtMeterProps {
  debt: number; // in hours
}

export function SleepDebtMeter({ debt }: SleepDebtMeterProps) {
  // Cap visual modules at 10 hours max
  const maxBlocks = 10;
  const blocksFill = Math.min(Math.ceil(debt), maxBlocks);

  const isWarning = debt > 3;

  return (
    <div className="flex flex-col h-full justify-between w-full relative">
      {/* Structural alignment grid lines */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-zinc-800"></div>
      
      <div className="flex justify-between items-start pt-4 mb-4">
        <h3 className="font-mono text-zinc-500 tracking-[0.2em] text-xs uppercase">SYS.CHRONIC_DEBT [HR]</h3>
        <span className="font-mono text-xs text-zinc-500 tracking-widest">{isWarning ? 'CRITICAL' : 'NOMINAL'}</span>
      </div>
      
      <div className="flex flex-col md:flex-row items-end justify-between gap-8 mt-2 mb-10 w-full">
        {/* Raw Delta Figure */}
        <div className="flex items-baseline leading-none">
          <span className={`text-[80px] sm:text-[100px] font-display font-medium tracking-tighter ${isWarning ? 'text-zinc-300' : 'text-white'}`}>
            {debt.toFixed(1)}
          </span>
          <span className="text-2xl sm:text-4xl text-zinc-600 font-mono ml-2 uppercase">Δ</span>
        </div>
        
        {/* Metadata stats */}
        <div className="flex flex-col pb-2 w-full md:w-auto md:min-w-[150px]">
          <div className="flex flex-col gap-4 border-l border-zinc-800 pl-4 py-2">
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Metabolic State</span>
              <span className="font-mono text-white text-sm uppercase tracking-wider">{isWarning ? 'COMPROMISED' : 'STABLE'}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Recovery Delta</span>
              <span className="font-mono text-white text-sm uppercase tracking-wider">{Math.ceil(debt)} CYCLES</span>
            </div>
          </div>
        </div>
      </div>

      {/* Brutalist Block Meter */}
      <div className="flex gap-[2px] w-full h-8 mt-auto">
        {Array.from({ length: maxBlocks }).map((_, i) => (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.1, delay: i * 0.05 }}
            key={i}
            className={`flex-1 ${i < blocksFill ? (isWarning ? 'bg-zinc-300' : 'bg-white') : 'bg-white/5'}`}
            style={{ originY: 1 }}
          />
        ))}
      </div>
    </div>
  )
}
