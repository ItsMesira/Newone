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
    <div className="max-w-xl mx-auto px-4 py-12">
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <Card className="p-8">
              <CardHeader className="px-0 pt-0 text-center">
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-300">Log Last Night</CardTitle>
                <CardDescription>Enter your sleep details to track your debt.</CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Night of</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-2 block">Bedtime</label>
                    <Input
                      type="time"
                      value={bedtime}
                      onChange={(e) => setBedtime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-300 mb-2 block">Wake Time</label>
                    <Input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2 block">Optional Notes (e.g., caffeine late, noise)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-2xl border border-[rgba(255,255,255,0.1)] bg-zinc-900/50 px-4 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary resize-none placeholder:text-zinc-500"
                    placeholder="How did you sleep?"
                  />
                </div>

                <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
                  {loading ? "Saving..." : "Save Sleep Log"}
                </Button>
              </form>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[400px] bg-glass rounded-3xl p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
            >
              <CheckCircle2 className="w-24 h-24 text-success mb-6" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-2">Sleep Log Saved!</h2>
            <p className="text-zinc-400">Taking you back to the dashboard...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
