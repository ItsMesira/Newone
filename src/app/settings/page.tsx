"use client"

import { useProfile } from "@/hooks/useProfile"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

import { PageLayout } from "@/components/PageLayout"

export default function SettingsPage() {
  const { settings, isLoading, mutate } = useProfile()
  const supabase = createClient()
  const router = useRouter()
  
  const [sleepNeed, setSleepNeed] = useState(8.0)
  const [wakeTime, setWakeTime] = useState("07:00")
  const [timezone, setTimezone] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setSleepNeed(settings.sleep_need)
      setWakeTime(settings.default_wake_time.slice(0, 5))
      setTimezone(settings.timezone)
    }
  }, [settings])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sleep_need: sleepNeed,
          default_wake_time: wakeTime,
          timezone
        })
      })

      if (!res.ok) throw new Error("Failed to save settings")
      
      toast.success("Settings updated successfully")
      mutate()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  async function handleDeleteAccount() {
    if (confirm("Are you entirely sure you want to delete your account? This action is irreversible.")) {
      try {
        const { error } = await supabase.rpc('delete_user')
        if (error) {
           toast.error("Account deletion protocol requires admin authorization.")
           handleSignOut()
        } else {
           toast.success("Account deleted.")
           handleSignOut()
        }
      } catch (e) {
        toast.error("Process termination error.")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-10 h-10 border border-zinc-800 flex items-center justify-center animate-pulse">
          <div className="w-2 h-2 bg-white"></div>
        </div>
      </div>
    )
  }

  return (
    <PageLayout>
      <div className="max-w-xl mx-auto px-4 py-8">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
        >
          <header className="mb-12 border-b border-zinc-800 pb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div>
              <h1 className="text-4xl font-mono uppercase tracking-[0.2em] font-light text-white mb-3">System_Config</h1>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest leading-relaxed">
                [Kernel Settings] / Core biometric anchors
              </p>
            </div>
            <button 
              onClick={handleSignOut}
              className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500 hover:text-white border border-zinc-800 px-4 py-2 transition-colors"
            >
              TERMINATE_SESSION
            </button>
          </header>

          <div className="border border-zinc-800 bg-zinc-900/10 p-8 sm:p-12 mb-8">
            <form onSubmit={handleSave} className="space-y-8">
              
              <div>
                <label className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4 block">Variable: Sleep Need</label>
                <div className="flex items-center gap-6">
                  <input
                    type="range"
                    min="5"
                    max="11.5"
                    step="0.5"
                    value={sleepNeed}
                    onChange={(e) => setSleepNeed(parseFloat(e.target.value))}
                    className="w-full accent-white h-1 bg-zinc-800 appearance-none outline-none cursor-pointer"
                  />
                  <span className="w-16 text-right font-mono text-2xl text-white tracking-tighter">
                    {sleepNeed.toFixed(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2 block">Anchor: Default Wake</label>
                <Input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="rounded-none bg-black border-zinc-800 text-white font-mono h-12"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2 block">Locale: Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-none border border-zinc-800 bg-black px-4 py-3 text-white font-mono text-sm uppercase tracking-widest focus:outline-none focus:border-white appearance-none"
                >
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Asia/Bangkok">Asia/Bangkok</option>
                  <option value={timezone}>{timezone}</option>
                </select>
              </div>

              <Button type="submit" className="w-full py-6 rounded-none bg-white text-black hover:bg-zinc-200 font-mono uppercase tracking-[0.2em] text-xs" disabled={saving}>
                {saving ? "SAVING..." : "PATCH_CONFIG"}
              </Button>
            </form>
          </div>

          <div className="border border-danger/30 p-8 flex flex-col gap-4 bg-red-950/5">
             <div className="flex flex-col gap-1">
                <h3 className="text-danger font-mono uppercase tracking-[0.2em] text-xs">Danger_Zone</h3>
                <p className="text-zinc-600 font-mono text-[9px] uppercase tracking-widest">Permanent account deletion protocol</p>
             </div>
             <button 
                onClick={handleDeleteAccount}
                className="w-full py-4 font-mono text-xs uppercase tracking-[0.2em] text-danger border border-danger/20 hover:bg-danger/10 transition-colors"
             >
                WIPE_ALL_DATA
             </button>
          </div>

        </motion.div>
      </div>
    </PageLayout>
  )
}
