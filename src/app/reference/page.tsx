"use client"

import { useState, useEffect } from "react"
import { InteractiveEnergyChart } from "@/components/InteractiveEnergyChart"
import Link from "next/link"
import { parseTimeString } from "@/lib/helpers"

export default function ReferencePage() {
  const [mounted, setMounted] = useState(false)
  const [wakeTimeStr, setWakeTimeStr] = useState("07:00")
  const [sleepDebt, setSleepDebt] = useState(0)
  const [napsTotalHours, setNapsTotalHours] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const wakeTime = parseTimeString(wakeTimeStr)

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="border-b border-zinc-900 p-6 sm:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-display uppercase tracking-tighter">SIM.PLATFORM</h1>
          <div className="text-zinc-500 font-mono text-xs uppercase tracking-[0.3em] mt-2 border-l border-zinc-500 pl-4 py-1">
            Engine Simulation // Bio-metric Sandboxing
          </div>
        </div>
        <Link 
          href="/dashboard"
          className="text-xs font-mono text-zinc-400 uppercase tracking-widest hover:text-white hover:bg-zinc-900 border border-zinc-800 px-6 py-4 transition-colors"
        >
          [RETURN TO DASHBOARD]
        </Link>
      </header>

      <main className="p-6 sm:p-10 max-w-7xl mx-auto space-y-12">
        
        {/* Controls */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Wake Time Control */}
          <div className="border border-zinc-800 p-6 flex flex-col gap-4 bg-zinc-900/20">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Anchor: Wake Time
            </label>
            <div className="text-4xl font-display">{wakeTimeStr}</div>
            <input 
              type="time" 
              className="bg-black border border-zinc-700 text-white font-mono p-3 w-full outline-none focus:border-white transition-colors"
              value={wakeTimeStr}
              onChange={(e) => setWakeTimeStr(e.target.value)}
            />
          </div>

          {/* Sleep Debt Control */}
          <div className="border border-zinc-800 p-6 flex flex-col gap-4 bg-zinc-900/20">
            <div className="flex justify-between items-center text-xs font-mono text-zinc-500 uppercase tracking-widest">
              <label>Variable: Sleep Debt</label>
              <span className="text-white">{sleepDebt.toFixed(1)} hrs</span>
            </div>
            <div className="text-4xl font-display tracking-tighter">
              {sleepDebt > 5 ? "DANGER" : "NOMINAL"}
            </div>
            <input 
              type="range" 
              min="0" max="14" step="0.5"
              className="w-full accent-white h-1 bg-zinc-800 appearance-none outline-none cursor-pointer"
              value={sleepDebt}
              onChange={(e) => setSleepDebt(parseFloat(e.target.value))}
            />
          </div>

          {/* Nap Control */}
          <div className="border border-zinc-800 p-6 flex flex-col gap-4 bg-zinc-900/20 border-l-4 border-l-white">
            <div className="flex justify-between items-center text-xs font-mono text-zinc-500 uppercase tracking-widest">
              <label>Modifier: Nap Total</label>
              <span className="text-white">{napsTotalHours.toFixed(1)} hrs</span>
            </div>
            <div className="text-4xl font-display tracking-tighter text-zinc-300">
              CLEARANCE
            </div>
            <input 
              type="range" 
              min="0" max="3" step="0.5"
              className="w-full accent-white h-1 bg-zinc-800 appearance-none outline-none cursor-pointer"
              value={napsTotalHours}
              onChange={(e) => setNapsTotalHours(parseFloat(e.target.value))}
            />
          </div>

        </section>

        {/* Visualizer output */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
            <h2 className="text-sm font-mono text-zinc-400 tracking-[0.2em] uppercase">
              TWO-PROCESS MODEL OUTPUT
            </h2>
            <div className="flex gap-4 font-mono text-[10px] tracking-widest text-zinc-500">
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> C-SYNC</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> S-SYNC</span>
            </div>
          </div>
          
          <div className="border border-zinc-800 shadow-2xl">
            <InteractiveEnergyChart 
              wakeTime={wakeTime}
              sleepDebt={sleepDebt}
              napsTotalHours={napsTotalHours}
            />
          </div>
        </section>

      </main>
    </div>
  )
}
