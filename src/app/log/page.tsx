"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { toast } from "sonner"
import { useSleepLogs } from "@/hooks/useSleepLogs"
import { useProfile } from "@/hooks/useProfile"
import { calculateActualSleep } from "@/lib/calculations"
import { subDays, format } from "date-fns"
import { CheckCircle2 } from "lucide-react"

import { PageLayout } from "@/components/PageLayout"

export default function LogPage() {
  const router = useRouter()
  const { mutate } = useSleepLogs()
  const { settings, isLoading: settingsLoading } = useProfile()
  
  const [date, setDate] = useState(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'))
  const [bedtime, setBedtime] = useState("23:30")
  const [wakeTime, setWakeTime] = useState(() => settings?.default_wake_time?.slice(0, 5) || "07:00")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Parse dates relative to the selected core date
      const coreDate = new Date(date)
      
      const bedParts = bedtime.split(':').map(Number)
      const wakeParts = wakeTime.split(':').map(Number)
      
      const bedDate = new Date(coreDate)
      bedDate.setHours(bedParts[0], bedParts[1], 0)
      
      const wakeDate = new Date(coreDate)
      wakeDate.setHours(wakeParts[0], wakeParts[1], 0)
      
      // If wake time is earlier in the day than bedtime, it must be the next day (e.g. bed at 23:00, wake at 07:00)
      if (wakeParts[0] < bedParts[0] || (wakeParts[0] === bedParts[0] && wakeParts[1] < bedParts[1])) {
        wakeDate.setDate(wakeDate.getDate() + 1)
      }

      const actualSleep = calculateActualSleep(bedDate, wakeDate)
      const sleepNeed = settings?.sleep_need || 8.0
      
      if (actualSleep < 1 || actualSleep > 16) {
        toast.error("Please enter a valid sleep duration (1-16 hours) - check your times.")
        setLoading(false)
        return
      }

      const sleep_debt_contribution = sleepNeed - actualSleep

      const response = await fetch('/api/sleep-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: coreDate.toISOString().split('T')[0],
          bedtime: bedDate.toISOString(),
          wake_time: wakeDate.toISOString(),
          actual_sleep: actualSleep,
          sleep_debt_contribution,
          notes
        })
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || "Failed to log sleep")
      }

      // Handle Success Animation
      setSuccess(true)
      
      // Update cache
      mutate()
      
      // Wait for success animation
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  if (settingsLoading) return null

  return (
    <PageLayout>
      <div className="max-w-xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="border border-zinc-800 bg-zinc-900/10 p-8 sm:p-12">
                <header className="mb-10 text-center border-b border-zinc-900 pb-10">
                   <h1 className="text-3xl font-mono uppercase tracking-[0.2em] font-light text-white mb-3">Initialize_Log</h1>
                   <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest leading-relaxed">
                     [Biometric Archive] / Syncing local sleep sequence to cloud
                   </p>
                </header>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div>
                  <label className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2 block">Night of</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="rounded-none bg-black border-zinc-800 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2 block">Bedtime</label>
                    <Input
                      type="time"
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                      required
                      className="rounded-none bg-black border-zinc-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2 block">Wake Time</label>
                    <Input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      required
                      className="rounded-none bg-black border-zinc-800 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2 block">System Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-none border border-zinc-800 bg-black px-4 py-2 text-sm text-white font-mono transition-colors focus-visible:outline-none focus-visible:border-white resize-none placeholder:text-zinc-700"
                    placeholder="ENTER_OBSERVATIONS..."
                  />
                </div>

                <Button type="submit" className="w-full py-6 rounded-none bg-white text-black hover:bg-zinc-200 font-mono uppercase tracking-[0.2em] text-xs" disabled={loading}>
                  {loading ? "PROCESSING..." : "COMMIT_LOG"}
                </Button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px] border border-zinc-800 bg-zinc-900/10 p-12 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <CheckCircle2 className="w-20 h-20 text-primary mb-8" />
            </motion.div>
            <h2 className="text-2xl font-mono uppercase tracking-[0.2em] text-white mb-3">Sync_Completed</h2>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Biometric entry archived successfully. Redirecting...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </PageLayout>
  )
}
