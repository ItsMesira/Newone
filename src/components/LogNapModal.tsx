"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Clock } from 'lucide-react'
import { Button } from './ui/Button'
import { useSleepLogs } from '@/hooks/useSleepLogs'
import { toast } from 'sonner'
import { addMinutes, format } from 'date-fns'

interface LogNapModalProps {
  onClose: () => void;
}

export function LogNapModal({ onClose }: LogNapModalProps) {
  // defaulting to 30 mins ago for sleep, now for wake
  const [sleepTime, setSleepTime] = useState(() => format(addMinutes(new Date(), -30), 'HH:mm'))
  const [wakeTime, setWakeTime] = useState(() => format(new Date(), 'HH:mm'))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { mutate } = useSleepLogs()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate actual sleep in hours
      const bed = new Date(`${today}T${sleepTime}:00`);
      const wake = new Date(`${today}T${wakeTime}:00`);
      let diff = (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);
      if (diff < 0) diff += 24;
      
      const res = await fetch('/api/sleep-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: today,
          bedtime: bed.toISOString(),
          wake_time: wake.toISOString(),
          actual_sleep: diff,
          sleep_debt_contribution: 0, 
          is_nap: true
        }),
      })

      if (!res.ok) throw new Error('Failed to log nap')
      
      toast.success('Nap logged successfully, physiological metrics updated.')
      mutate()
      onClose()
    } catch (err) {
      toast.error('Error logging nap. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-black border border-zinc-800 flex flex-col p-8 relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-8 border-b border-zinc-900 pb-4 mt-2">
          <Clock className="text-zinc-500 w-5 h-5" />
          <h2 className="text-sm font-mono mt-0 uppercase tracking-[0.2em] text-white pt-1">LOG AD-HOC NAP</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Fell Asleep At</label>
            <input 
              type="time" 
              required
              value={sleepTime}
              onChange={(e) => setSleepTime(e.target.value)}
              className="bg-transparent border border-zinc-800 p-3 text-white font-mono focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Woke Up At</label>
            <input 
              type="time" 
              required
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="bg-transparent border border-zinc-800 p-3 text-white font-mono focus:outline-none focus:border-zinc-500 transition-colors"
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="mt-4 rounded-none bg-white text-black hover:bg-zinc-200 font-mono text-xs uppercase tracking-[0.2em] py-4"
          >
            {isSubmitting ? 'PROCESSING...' : 'COMMIT NAP'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
