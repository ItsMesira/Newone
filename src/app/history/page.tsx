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

import { PageLayout } from "@/components/PageLayout"

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
    const dateStr = log.date
    const bedDate = new Date(`${dateStr}T${editBedtime}:00`)
    const wakeDate = new Date(`${dateStr}T${editWakeTime}:00`)
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

  if (isLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center min-vh-screen bg-black py-40">
        <div className="w-10 h-10 border border-zinc-800 flex items-center justify-center animate-pulse">
          <div className="w-2 h-2 bg-white"></div>
        </div>
      </div>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="mb-12 border-b border-zinc-800 pb-10">
          <h1 className="text-4xl font-mono uppercase tracking-[0.2em] font-light text-white mb-3">Biometric_History</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest leading-relaxed">
            [Archive Access] / Visualizing 14-day sleep efficiency deltas
          </p>
        </header>

        {logs.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-900/10 p-20 text-center">
            <h2 className="text-xl font-mono uppercase tracking-widest text-zinc-500 italic">No biometric logs identified</h2>
          </div>
        ) : (
          <div className="space-y-4 flex flex-col">
            <AnimatePresence>
              {[...logs].reverse().map((log: any, i: number) => {
                const dateObj = new Date(log.date)
                const sleepNeed = settings?.sleep_need || 8
                const diff = log.actual_sleep - sleepNeed
                const isEditing = editingId === log.id

                let statusColor = "text-primary"
                let borderColor = "border-zinc-800"
                if (diff < -1) { statusColor = "text-warning"; borderColor = "border-warning/30"; }
                if (diff < -2.5) { statusColor = "text-danger"; borderColor = "border-danger/30"; }

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, height: 0, overflow: "hidden" }}
                    transition={{ duration: 0.2 }}
                    layout
                  >
                    <div className={`border ${borderColor} bg-black p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative group overflow-hidden`}>
                      {/* Diagnostic label overlay */}
                      <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-900/50 border-l border-b border-zinc-800 font-mono text-[8px] uppercase text-zinc-600 tracking-tighter">
                        REF_ID: {log.id.slice(0, 8)}
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-2xl font-mono font-light text-white uppercase tracking-wider">
                          {format(dateObj, "dd.MMM.yyyy")}
                        </span>
                        
                        {isEditing ? (
                          <div className="flex gap-2 mt-2 items-center text-sm">
                            <Input type="time" value={editBedtime} onChange={(e) => setEditBedtime(e.target.value)} className="h-9 px-3 bg-black border-zinc-700 text-white font-mono text-xs rounded-none w-24" />
                            <span className="text-zinc-600 font-mono">-</span>
                            <Input type="time" value={editWakeTime} onChange={(e) => setEditWakeTime(e.target.value)} className="h-9 px-3 bg-black border-zinc-700 text-white font-mono text-xs rounded-none w-24" />
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                            {format(new Date(log.bedtime), "HH:mm")} - {format(new Date(log.wake_time), "HH:mm")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-10 sm:w-1/2">
                        <div className="flex flex-col items-start sm:items-end min-w-[120px]">
                          <span className="text-3xl font-mono font-light text-white tracking-tighter">
                            {log.actual_sleep.toFixed(1)}
                            <span className="text-xs text-zinc-600 font-mono ml-1 uppercase">hrs</span>
                          </span>
                          <span className={`text-[10px] font-mono uppercase tracking-[0.2em] mt-1 ${statusColor}`}>
                            {diff >= 0 ? "+" : ""}{diff.toFixed(1)} DELTA
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {isEditing ? (
                            <>
                              <button onClick={() => setEditingId(null)} className="font-mono text-[10px] uppercase text-zinc-500 hover:text-white transition-colors">CANCEL</button>
                              <button onClick={() => handleSaveEdit(log)} className="font-mono text-[10px] uppercase text-white border border-zinc-700 px-3 py-1 hover:bg-zinc-800 transition-colors">COMMIT_UPD</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => startEdit(log)} className="text-zinc-600 hover:text-white transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(log.id)} className="text-zinc-700 hover:text-danger transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
