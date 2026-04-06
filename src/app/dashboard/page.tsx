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
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 overflow-x-hidden min-h-screen">
      {/* Top Banner mapping to the "CHECK BOX" Dribbble section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 mt-4"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-wider text-white">Sleep Sync</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Faux Dribbble Style Pill Dropdowns */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="px-4 py-2 rounded-full bg-surface border border-white/5 text-sm text-zinc-300 font-medium flex items-center gap-2 cursor-pointer hover:bg-white/5 transition">
              Date: Now <ChevronDown className="w-3 h-3 text-zinc-500" />
            </div>
            <div className="px-4 py-2 rounded-full bg-surface border border-white/5 text-sm text-zinc-300 font-medium flex items-center gap-2 cursor-pointer hover:bg-white/5 transition">
              View: Daily <ChevronDown className="w-3 h-3 text-zinc-500" />
            </div>
          </div>
          
          <Link href="/log">
            <Button className="flex items-center gap-2 rounded-full px-6 bg-surface text-white border border-white/5 hover:bg-white/10 shadow-none">
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Log Sleep</span>
            </Button>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Main Left Column (Matches "CUSTOMER" / "PRODUCT") */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex-1 min-h-[300px]"
          >
            <EnergyScore score={energyScore} label={energyLabel} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex-[1.5] min-h-[400px]"
          >
            <EnergyChart wakeTime={wakeTimeToday!} sleepDebt={sleepDebt} />
          </motion.div>
        </div>

        {/* Right Column (Matches "PROJECTS TIMELINE") */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex-1"
          >
            <SleepDebtMeter debt={sleepDebt} />
          </motion.div>
          
          {/* Faux Spacer block mimicking the structure of Dribbble layout bottom right */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="min-h-[200px] flex-1 border border-white/5 bg-[#0e0e0e] rounded-3xl p-8 flex flex-col justify-between"
          >
             <div className="flex justify-between items-start mb-6 z-10 w-full">
                <h3 className="font-display font-bold text-zinc-500 tracking-widest text-lg uppercase">SYSTEM RELIABILITY</h3>
              </div>
              <div className="flex flex-col gap-4 w-full">
                 <div className="h-4 w-full bg-zinc-800 rounded-sm"></div>
                 <div className="h-4 w-5/6 bg-zinc-800/50 rounded-sm"></div>
                 <div className="h-4 w-2/3 bg-zinc-800/20 rounded-sm"></div>
              </div>
          </motion.div>
        </div>

      </div>
    </div>
  )
}
