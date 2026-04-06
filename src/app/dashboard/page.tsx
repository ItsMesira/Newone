"use client"

import { useCalculations } from "@/hooks/useCalculations"
import { EnergyScore } from "@/components/EnergyScore"
import { EnergyChart } from "@/components/EnergyChart"
import { SleepDebtMeter } from "@/components/SleepDebtMeter"
import { HygieneReminders } from "@/components/HygieneReminders"
import { Button } from "@/components/ui/Button"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Plus, ChevronDown, Clock } from "lucide-react"
import { useState } from "react"
import { LogNapModal } from "@/components/LogNapModal"

export default function DashboardPage() {
  const [isNapModalOpen, setIsNapModalOpen] = useState(false)
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
            <div className="hidden sm:flex items-center gap-6 text-xs font-mono text-zinc-500 tracking-widest uppercase">
              <Link href="/dashboard" className="text-white">HOME</Link>
              <Link href="/history" className="hover:text-white transition-colors">HISTORY</Link>
              <Link href="/settings" className="hover:text-white transition-colors">SETTINGS</Link>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                onClick={() => setIsNapModalOpen(true)}
                className="rounded-none px-4 py-4 bg-transparent border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 font-mono text-xs uppercase tracking-widest transition-colors h-auto flex items-center"
              >
                <Clock className="w-3 h-3 mr-2" />
                NAP
              </Button>
              <Link href="/log">
                <Button className="rounded-none px-6 py-4 bg-white text-black hover:bg-zinc-200 font-mono text-xs uppercase tracking-widest border-none transition-colors h-auto flex items-center">
                  <Plus className="w-3 h-3 mr-2" />
                  INITIATE LOG
                </Button>
              </Link>
            </div>
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
              className="p-8 lg:p-12 min-h-[450px] flex group relative"
            >
              <div className="absolute top-4 right-4 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                 {/* Full-screen expand placeholder handled internally inside EnergyChart if needed */}
              </div>
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
            
            {/* System Diagnostic Block --> Now Hygiene Reminders */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.3 }}
              className="p-8 lg:p-12 flex flex-col justify-between min-h-[300px]"
            >
               <HygieneReminders wakeTime={wakeTimeToday!} melatoninOnset={melatoninWindow!.start} />
            </motion.div>
          </div>

        </div>
      </div>
      
      <AnimatePresence>
        {isNapModalOpen && (
          <LogNapModal onClose={() => setIsNapModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
