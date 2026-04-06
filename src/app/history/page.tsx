"use client"

import { useSleepLogs } from "@/hooks/useSleepLogs"
import { useProfile } from "@/hooks/useProfile"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Trash2, Edit2 } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useState } from "react"
import { Input } from "@/components/ui/Input"

export default function HistoryPage() {
  const { logs, isLoading, mutate } = useSleepLogs()
  const { settings, isLoading: settingsLoading } = useProfile()
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [editBedtime, setEditBedtime] = useState("")
  const [editWakeTime, setEditWakeTime] = useState("")

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this log?")) return
    
    try {
      const res = await fetch(`/api/sleep-logs/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Log deleted")
      mutate()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  function startEdit(log: any) {
    setEditingId(log.id)
    setEditBedtime(format(new Date(log.bedtime), "HH:mm"))
    setEditWakeTime(format(new Date(log.wake_time), "HH:mm"))
  }

  async function handleSaveEdit(log: any) {
    // Basic calculation for the edit
    const dateStr = log.date
    const bedDate = new Date(`${dateStr}T${editBedtime}:00`)
    const wakeDate = new Date(`${dateStr}T${editWakeTime}:00`)
    // Correct if next day
    if (wakeDate <= bedDate) {
      wakeDate.setDate(wakeDate.getDate() + 1)
    }

    const actual_sleep = (wakeDate.getTime() - bedDate.getTime()) / (1000 * 60 * 60)
    const sleep_debt_contribution = (settings?.sleep_need || 8) - actual_sleep

    try {
      const res = await fetch(`/api/sleep-logs/${log.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bedtime: bedDate.toISOString(),
          wake_time: wakeDate.toISOString(),
          actual_sleep,
          sleep_debt_contribution,
        })
      })
      if (!res.ok) throw new Error("Update failed")
      
      toast.success("Log updated")
      setEditingId(null)
      mutate()
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  if (isLoading || settingsLoading) return <div className="text-center py-20 text-white">Loading history...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-300">History</h1>
        <p className="text-zinc-400 mt-1">Your last 14 days of sleep logs.</p>
      </div>

      {logs.length === 0 ? (
        <Card className="text-center py-12">
          <CardTitle className="text-xl">No logs yet</CardTitle>
          <CardDescription className="mt-2">Start tracking your sleep tonight to see your history.</CardDescription>
        </Card>
      ) : (
        <div className="space-y-4 flex flex-col">
          <AnimatePresence>
            {[...logs].reverse().map((log: any, i: number) => {
              const dateObj = new Date(log.date)
              const sleepNeed = settings?.sleep_need || 8
              const diff = log.actual_sleep - sleepNeed
              
              const isEditing = editingId === log.id

              let variant: any = "success"
              if (diff < -1) variant = "warning"
              if (diff < -2.5) variant = "danger"

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  layout
                >
                  <Card className="p-4 sm:p-6 transition-all hover:-translate-y-0.5 hover:shadow-2xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-white">
                          {format(dateObj, "MMM d, yyyy")}
                        </span>
                        
                        {isEditing ? (
                          <div className="flex gap-2 mt-2 items-center text-sm text-zinc-400">
                            <Input type="time" value={editBedtime} onChange={(e) => setEditBedtime(e.target.value)} className="h-8 text-xs py-1" />
                            <span>-</span>
                            <Input type="time" value={editWakeTime} onChange={(e) => setEditWakeTime(e.target.value)} className="h-8 text-xs py-1" />
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400">
                            {format(new Date(log.bedtime), "h:mm a")} - {format(new Date(log.wake_time), "h:mm a")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-1/2">
                        <div className="flex flex-col items-start sm:items-end w-24">
                          <span className="text-xl font-bold text-white">{log.actual_sleep.toFixed(1)} <span className="text-xs text-zinc-500 font-normal">hrs</span></span>
                          <Badge variant={variant} className="mt-1">
                            {diff >= 0 ? "+" : ""}{diff.toFixed(1)} hrs
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                              <Button size="sm" onClick={() => handleSaveEdit(log)}>Save</Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => startEdit(log)} className="text-zinc-400 hover:text-white">
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(log.id)} className="text-zinc-400 hover:text-danger">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
