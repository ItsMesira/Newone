import { useState, useEffect } from "react"
import { useSleepLogs } from "./useSleepLogs"
import { useProfile } from "./useProfile"
import { calculateSleepDebt, calculateEnergyCurve, getEnergyLabel, getMelatoninWindow } from "@/lib/calculations"
import { parseTimeString } from "@/lib/helpers"

export function useCalculations() {
  const { logs, isLoading: logsLoading } = useSleepLogs()
  const { settings, isLoading: settingsLoading } = useProfile()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every 60 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  if (logsLoading || settingsLoading || !settings) {
    return { isLoading: true }
  }

  const sleepNeed = settings.sleep_need ?? 8.0
  
  // Transform logs strings back to Date objects
  const parsedLogs = logs.map((l: any) => ({
    ...l,
    date: new Date(l.date),
    bedtime: new Date(l.bedtime),
    wake_time: new Date(l.wake_time),
  }))

  const sleepDebt = calculateSleepDebt(parsedLogs, sleepNeed)
  
  // Create a Date object for today's default wake time
  const wakeTimeToday = parseTimeString(settings.default_wake_time || '07:00')
  
  // Identify naps today to ease homeostasis pressure. Treat any sleep < 3 hours logged today as a nap.
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const napsTodayLogs = parsedLogs.filter((l: any) => 
    l.date.getTime() === todayStart.getTime() && l.actual_sleep <= 3.0 && l.actual_sleep > 0
  )
  const napsTotalHours = napsTodayLogs.reduce((sum: number, log: any) => sum + log.actual_sleep, 0)
  
  const energyScore = calculateEnergyCurve(currentTime, wakeTimeToday, sleepDebt, napsTotalHours)
  const energyLabel = getEnergyLabel(energyScore)
  
  const melatoninWindow = getMelatoninWindow(wakeTimeToday)

  return {
    sleepNeed,
    sleepDebt,
    energyScore,
    energyLabel,
    melatoninWindow,
    currentTime,
    wakeTimeToday,
    isLoading: false
  }
}
