import { differenceInMinutes, addHours, addDays, getHours, getMinutes, setHours, setMinutes, startOfDay, subHours, subDays, addMinutes } from 'date-fns'

/**
 * Calculates actual sleep in hours between bedtime and wake time
 */
export function calculateActualSleep(bedtime: Date, wakeTime: Date): number {
  const diffMinutes = differenceInMinutes(wakeTime, bedtime)
  return diffMinutes / 60
}

/**
 * Validates if the given times create a valid sleep sequence
 */
export function isValidSleepEntry(bedtime: Date, wakeTime: Date): boolean {
  const diff = calculateActualSleep(bedtime, wakeTime)
  return differenceInMinutes(wakeTime, bedtime) > 0 && diff >= 1 && diff <= 20
}

/**
 * Calculate Sleep Debt based on 14-day weighted rolling sum
 */
export function calculateSleepDebt(
  sleepLogs: { actual_sleep: number; date: Date }[],
  sleepNeed: number
): number {
  const today = startOfDay(new Date())
  let totalDebt = 0

  for (let i = 1; i <= 14; i++) {
    const targetDate = subDays(today, i)
    const log = sleepLogs.find((l) => startOfDay(l.date).getTime() === targetDate.getTime())

    // Precise weighting: 15% (or 1.0 weight equivalent scaled) for last night, decaying.
    // We'll use 1.0 for yesterday, then linearly decay down to 0 over 14 days.
    const weight = i === 1 ? 1.0 : (1.0 - (i / 15.0))
    
    const actualSleep = log ? log.actual_sleep : sleepNeed
    const debtContribution = sleepNeed - actualSleep
    
    totalDebt += (debtContribution * weight)
  }

  return Math.max(0, totalDebt)
}

/**
 * Biological Energy Calculation - returns raw C & S streams along with aesthetic score
 */
export function calculateEnergyData(
  targetTime: Date,
  wakeTime: Date,
  sleepDebt: number,
  napsTotalHours: number = 0
) {
  const targetHours = getHours(targetTime) + getMinutes(targetTime) / 60
  const wakeHours = getHours(wakeTime) + getMinutes(wakeTime) / 60
  
  let t = targetHours - wakeHours
  if (t < 0) t += 24 // hours since waking

  // Calculate circular distances for dual-Gaussian peaks (Morning & Evening)
  const d1 = Math.min(Math.abs(t - 4.5), 24 - Math.abs(t - 4.5))
  const d2 = Math.min(Math.abs(t - 13), 24 - Math.abs(t - 13))
  
  // Clean, infinitely smooth bimodal Process C
  const processC = 0.9 * Math.exp(-(d1 * d1) / 12) + 0.75 * Math.exp(-(d2 * d2) / 14) + 0.1

  // PROCESS S (Homeostatic Sleep Pressure): Asymptotic accumulation & nocturnal clearance
  const tau_i = 18.2
  const tau_d = 4.2
  const S_0 = Math.min(0.8, (sleepDebt / 8) * 0.3)
  
  let processS = 0
  if (t <= 16) {
      // Accumulation during wake period
      processS = 1 - (1 - S_0) * Math.exp(-t / tau_i)
  } else {
      // Dissipation during sleep period
      const S_max = 1 - (1 - S_0) * Math.exp(-16 / tau_i)
      processS = S_max * Math.exp(-(t - 16) / tau_d)
  }
  
  if (napsTotalHours > 0) {
     const napClearance = Math.min(0.5, napsTotalHours * 0.15)
     processS = Math.max(0, processS - napClearance)
  }

  // Synthesis Alertness A = C - S
  const alertness = processC - processS
  
  // Smooth mapping to [0-100] preventing artificial hard clipping
  // Alertness ranges roughly from -0.5 to 1.0
  const rawScore = ((alertness + 0.5) / 1.5) * 100

  return {
    score: Math.max(0, Math.min(100, Math.round(rawScore))),
    processC,
    processS,
    alertness
  }
}

// Keep a backward compatible stub if strictly needed but ideally use calculateEnergyData
export function calculateEnergyCurve(
  currentTime: Date,
  wakeTime: Date,
  sleepDebt: number,
  napsTotalHours: number = 0
): number {
  return calculateEnergyData(currentTime, wakeTime, sleepDebt, napsTotalHours).score
}

export function getEnergyLabel(score: number): string {
  if (score >= 80) return "Peak Focus"
  if (score >= 65) return "In the Zone"
  if (score >= 50) return "Moderate Energy"
  if (score >= 35) return "Afternoon Dip"
  if (score >= 20) return "Wind Down"
  return "Recharge Time"
}

/**
 * Biological estimation of Melatonin Window based on sleep midpoint proxy
 */
export function getMelatoninWindow(wakeTime: Date): { start: Date; end: Date } {
  // If wake time is 7 AM, habitual bedtime is roughly 11PM. Midpoint = 3AM.
  // DLMO is typically 2 hours before midpoint = 1AM... Wait, biological DLMO is usually 14-15 hours AFTER waking.
  // A simple anchor for UI:
  const start = addHours(wakeTime, 14.5) // ~9:30 PM if wake is 7 AM
  const end = addHours(start, 2)
  return { start, end }
}

export function getEnergyZones(wakeTime: Date) {
  // Returns precise biological zones offset from wake
  return {
    morningGrogginess: { start: wakeTime, end: addMinutes(wakeTime, 90) },
    morningPeak: { start: addMinutes(wakeTime, 90), end: addHours(wakeTime, 6) },
    afternoonDip: { start: addHours(wakeTime, 6), end: addHours(wakeTime, 9) },
    eveningPeak: { start: addHours(wakeTime, 9), end: addHours(wakeTime, 13.5) },
    windDown: { start: addHours(wakeTime, 13.5), end: addHours(wakeTime, 14.5) },
    melatoninWindow: getMelatoninWindow(wakeTime)
  }
}

export function generateEnergyBlocks(wakeTime: Date, sleepDebt: number) {
  const blocks = []
  for (let i = 0; i < 8; i++) {
    const blockStart = addHours(wakeTime, i * 3)
    const blockMid = addHours(blockStart, 1.5)
    const score = calculateEnergyCurve(blockMid, wakeTime, sleepDebt)
    const currentHours = getHours(blockStart)
    const formattedTime = `${currentHours.toString().padStart(2, '0')}:00`
    
    let type = 'neutral'
    if (score >= 65) type = 'peak'
    if (score < 40) type = 'slump'

    blocks.push({ time: formattedTime, score: Math.round(score), type })
  }
  return blocks
}
