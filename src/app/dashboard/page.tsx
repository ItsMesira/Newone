"use client"

import { useCalculations } from "@/hooks/useCalculations"
import { EnergyScore } from "@/components/EnergyScore"
import { EnergyChart } from "@/components/EnergyChart"
import { SleepDebtMeter } from "@/components/SleepDebtMeter"
import { Button } from "@/components/ui/Button"
import { motion } from "framer-motion"
import Link from "next/link"
import { Plus, ChevronDown } from "lucide-react"

export default function DashboardPage() {
  const { 
    sleepDebt, 
    energyScore, 
    energyLabel, 
    melatoninWindow, 
    currentTime, 
    wakeTimeToday, 
    isLoading 
  } = useCalculations()

  if (isLoading || !wakeTimeToday || !melatoninWindow) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-black">
        <div className="w-12 h-12 border border-zinc-800 flex items-center justify-center">
          <div className="w-2 h-2 bg-white animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-black min-h-screen text-white font-sans antialiased pb-20">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 border-x border-zinc-900 min-h-screen">
        
        {/* Top Header Row / Navigation Area */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
          className="flex flex-col md:flex-row md:items-end justify-between py-6 border-b border-zinc-800 mb-12 gap-6"
        >
          <div>
            <h1 className="text-3xl font-mono uppercase tracking-[0.2em] font-light text-white">SYNC.SLEEP_SYSTEM</h1>
            <div className="text-zinc-500 font-mono text-xs mt-2 uppercase tracking-widest">
              [Authorized Access] • Ver. 2.1.4
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4 text-xs font-mono text-zinc-500 tracking-widest uppercase">
              <span className="hover:text-white cursor-pointer transition-colors">DATE: {new Date().toISOString().split('T')[0]}</span>
              <span className="text-zinc-800">|</span>
              <span className="hover:text-white cursor-pointer transition-colors">V: DAILY GRAPH</span>
            </div>
            
            <Link href="/log">
              <Button className="rounded-none px-6 py-4 bg-white text-black hover:bg-zinc-200 font-mono text-xs uppercase tracking-widest border-none transition-colors h-auto">
                <Plus className="w-3 h-3 mr-2" />
                INITIATE LOG
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Global Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-zinc-800 mb-12 relative">
          
          <div className="lg:col-span-12 absolute top-1/2 left-0 w-full h-[1px] bg-zinc-900 -z-10 hidden lg:block"></div>
          
          {/* Main Left Column: Energy Score & Chart */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-zinc-800">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="p-8 lg:p-12 min-h-[350px] flex border-b border-zinc-800"
            >
              <EnergyScore score={energyScore} label={energyLabel} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="p-8 lg:p-12 min-h-[450px] flex"
            >
              <EnergyChart wakeTime={wakeTimeToday!} sleepDebt={sleepDebt} />
            </motion.div>
          </div>

          {/* Right Column: Sleep Debt & System Diagnostics */}
          <div className="lg:col-span-5 flex flex-col">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.2 }}
              className="p-8 lg:p-12 flex-1 border-b border-zinc-800 min-h-[400px] flex"
            >
              <SleepDebtMeter debt={sleepDebt} />
            </motion.div>
            
            {/* System Diagnostic Block */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3 }}
              className="p-8 lg:p-12 flex flex-col justify-between min-h-[300px]"
            >
               <div className="flex justify-between items-start mb-6 w-full relative">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-zinc-800"></div>
                  <h3 className="font-mono text-zinc-500 tracking-[0.2em] text-xs uppercase pt-4">SYS.DIAGNOSTICS</h3>
                </div>
                
                <div className="flex flex-col gap-6 w-full mt-auto mb-4">
                   <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                     <span className="font-mono text-xs uppercase text-zinc-500">Biological Drift</span>
                     <span className="font-mono text-xs text-white">0.45%</span>
                   </div>
                   <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                     <span className="font-mono text-xs uppercase text-zinc-500">Sync Offset</span>
                     <span className="font-mono text-xs text-zinc-300">-12 MS</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="font-mono text-xs uppercase text-zinc-500">Process State</span>
                     <span className="font-mono text-xs text-sky-400">ACTIVE</span>
                   </div>
                </div>
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  )
}
