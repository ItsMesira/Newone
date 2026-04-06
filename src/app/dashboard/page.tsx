"use client"

import { useCalculations } from "@/hooks/useCalculations"
import { EnergyScore } from "@/components/EnergyScore"
import { EnergyChart } from "@/components/EnergyChart"
import { SleepDebtMeter } from "@/components/SleepDebtMeter"
import { MelatoninWindow } from "@/components/MelatoninWindow"
import { HygieneReminders } from "@/components/HygieneReminders"
import { Button } from "@/components/ui/Button"
import { motion, AnimatePresence } from "framer-motion"
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
            className="flex-1"
          >
            <EnergyScore score={energyScore} label={energyLabel} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex-1"
          >
            <EnergyChart wakeTime={wakeTimeToday!} sleepDebt={sleepDebt} />
          </motion.div>
        </div>

        {/* Right Column (Matches "PROJECTS TIMELINE") */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex-1"
            >
              {/* Replace Sleep Debt wrapper to force minimal structure */}
              <SleepDebtMeter debt={sleepDebt} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex-1"
            >
              <MelatoninWindow window={melatoninWindow!} currentTime={currentTime!} />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="flex-[2]"
          >
            <HygieneReminders wakeTime={wakeTimeToday!} melatoninOnset={melatoninWindow!.start} currentTime={currentTime!} />
          </motion.div>
        </div>

      </div>
    </div>
  )
}
