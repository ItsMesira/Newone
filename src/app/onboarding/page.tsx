"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Card } from "@/components/ui/Card"
import { toast } from "sonner"
import Confetti from "react-confetti"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [sleepNeed, setSleepNeed] = useState<number>(8.0)
  const [wakeTime, setWakeTime] = useState("07:00")
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [loading, setLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // We can assume user is logged in here due to middleware
  async function handleComplete() {
    setLoading(true)
    
    // Save to profiles
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("User not found.")
      setLoading(false)
      return
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ name, sleep_need: sleepNeed, default_wake_time: wakeTime })
      .eq('id', user.id)

    if (profileError) {
      toast.error(profileError.message)
      setLoading(false)
      return
    }

    const { error: settingsError } = await supabase
      .from('settings')
      .upsert({ 
        user_id: user.id, 
        sleep_need: sleepNeed, 
        default_wake_time: wakeTime, 
        timezone, 
        onboarding_complete: true 
      }, { onConflict: 'user_id' })

    if (settingsError) {
      toast.error(settingsError.message)
      setLoading(false)
      return
    }

    setShowConfetti(true)
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  }

  const nextStep = () => {
    if (step === 1 && !name.trim()) {
      toast.error("Please enter your name")
      return
    }
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  }

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      
      <Card className="w-full max-w-lg p-0 overflow-hidden relative min-h-[450px]">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 h-1 bg-zinc-800 w-full">
           <motion.div 
             className="h-full bg-primary"
             initial={{ width: "33%" }}
             animate={{ width: `${(step / 3) * 100}%` }}
             transition={{ duration: 0.3 }}
           />
        </div>

        <div className="p-8 h-full flex flex-col justify-between">
          <AnimatePresence mode="wait" custom={1}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={1}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex-1 flex flex-col justify-center gap-6"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-300">Welcome</h2>
                  <p className="text-zinc-400 mt-2">What should we call you?</p>
                </div>
                <Input
                  autoFocus
                  placeholder="Your first name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg py-6"
                  onKeyDown={(e) => e.key === 'Enter' && nextStep()}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={1}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex-1 flex flex-col justify-center gap-6"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white">Your Sleep Need</h2>
                  <p className="text-zinc-400 mt-2 text-sm max-w-sm mx-auto">
                    Most people need 7–9 hours. Adjust based on how you feel after a truly restful night.
                  </p>
                </div>
                
                <div className="py-8 flex flex-col items-center">
                  <motion.div 
                    key={sleepNeed}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-5xl font-bold text-primary mb-8"
                  >
                    {sleepNeed.toFixed(1)} <span className="text-xl text-zinc-500">hrs</span>
                  </motion.div>
                  
                  <input
                    type="range"
                    min="5"
                    max="11.5"
                    step="0.5"
                    value={sleepNeed}
                    onChange={(e) => setSleepNeed(parseFloat(e.target.value))}
                    className="w-full accent-primary h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={1}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex-1 flex flex-col justify-center gap-6"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white">Routine & Region</h2>
                  <p className="text-zinc-400 mt-2">When do you usually wake up?</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Default Wake Time</label>
                    <Input
                      type="time"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      className="text-lg py-6"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-zinc-400 mb-2 block">Timezone</label>
                    <select
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className="w-full rounded-2xl border border-[rgba(255,255,255,0.1)] bg-zinc-900/50 px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value={timezone}>{timezone} (Detected)</option>
                      {/* Usually we'd map standard timezones here */}
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="Asia/Tokyo">Asia/Tokyo</option>
                      <option value="Asia/Bangkok">Asia/Bangkok</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-[rgba(255,255,255,0.1)]">
            <Button
              variant="ghost"
              onClick={prevStep}
              className={step === 1 ? "invisible" : ""}
            >
              Back
            </Button>
            
            {step < 3 ? (
              <Button onClick={nextStep} className="px-8">
                Next
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading} className="px-8">
                {loading ? "Saving..." : "Let's Go!"}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
