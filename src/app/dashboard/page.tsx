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
import { Plus } from "lucide-react"

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
    <div className="max-w-screen-xl mx-auto px-4 py-8 overflow-x-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-300">Dashboard</h1>
          <p className="text-zinc-400 mt-1">Today's energy and routines</p>
        </div>
        <Link href="/log">
          <Button className="flex items-center gap-2 rounded-full">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Log Last Night</span>
          </Button>
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Main Left Column (Score + Chart) */}
        <div className="md:col-span-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <EnergyScore score={energyScore} label={energyLabel} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="h-[300px]"
          >
            <EnergyChart wakeTime={wakeTimeToday!} sleepDebt={sleepDebt} currentTime={currentTime!} />
          </motion.div>
        </div>

        {/* Right Column (Debt, Window, Reminders) */}
        <div className="md:col-span-4 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="h-[180px]"
          >
            <SleepDebtMeter debt={sleepDebt} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="h-[180px]"
          >
            <MelatoninWindow window={melatoninWindow!} currentTime={currentTime!} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <HygieneReminders wakeTime={wakeTimeToday!} melatoninOnset={melatoninWindow!.start} currentTime={currentTime!} />
          </motion.div>
        </div>

      </div>
    </div>
  )
}
