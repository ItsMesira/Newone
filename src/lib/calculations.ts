import { differenceInMinutes, addHours, addDays, getHours, getMinutes, setHours, setMinutes, startOfDay, subHours, subDays } from 'date-fns'

/**
 * Calculates actual sleep in hours between bedtime and wake time
 * Handles crossing midnight automatically via date-fns difference
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
  // Assume a sleep entry must be between 1 and 20 hours and bedtime is before wakeTime
  return differenceInMinutes(wakeTime, bedtime) > 0 && diff >= 1 && diff <= 20
}

/**
 * Calculate Sleep Debt based on 14-day weighted rolling sum
 * sleepLogs: Array of { actual_sleep, date }
 * sleepNeed: target hours (e.g. 8.0)
 */
export function calculateSleepDebt(
  sleepLogs: { actual_sleep: number; date: Date }[],
  sleepNeed: number
): number {
  const today = startOfDay(new Date())
  let totalDebt = 0

  for (let i = 1; i <= 14; i++) {
    const targetDate = subDays(today, i)
    // Find log for this specific day using startOfDay matching
    const log = sleepLogs.find((l) => startOfDay(l.date).getTime() === targetDate.getTime())

    // Weight formula: weight = 1 - (daysAgo / 14)
    // Yesterday = 1.0x (actually i=1 -> 1 - 1/14 = 13/14 = 0.92, let's adjust formula)
    // Formula in prompt: weight = 1 - (daysAgo / 14).
    const weight = 1 - i / 14
    
    // If no log exists for the day, assume missing sleep (actualSleep = 0) or average?
    // Let's assume actualSleep = 0 to encourage regular logging. Or we can just use 0 sleep.
    const actualSleep = log ? log.actual_sleep : 0
    
    // Sleep debt per night contribution
    const debtContribution = sleepNeed - actualSleep
    
    totalDebt += debtContribution * weight
  }

  // Can't have negative debt (you can't "bank" sleep essentially)
  return Math.max(0, totalDebt)
}

/**
 * Calculate energy curve score 0-100 for a given time
 */
export function calculateEnergyCurve(
  currentTime: Date,
  wakeTime: Date,
  sleepDebt: number
): number {
  // We represent times as fractional hours since wake time (0-24)
  const currentHours = getHours(currentTime) + getMinutes(currentTime) / 60
  const wakeHours = getHours(wakeTime) + getMinutes(wakeTime) / 60
  
  let hoursSinceWake = currentHours - wakeHours
  if (hoursSinceWake < 0) {
    hoursSinceWake += 24 // Handle yesterday
  }

  // Anchors based on prompt
  // peak1 = wakeTime + 2hrs (90)
  // dip1 = wakeTime + 7hrs (55)
  // peak2 = wakeTime + 9hrs (80)
  // windDown = wakeTime + 15hrs (40)
  // dip2 = wakeTime + 22hrs (15)

  const anchors = [
    { t: 0, v: 70 },      // Wake up
    { t: 2, v: 90 },      // Peak 1
    { t: 7, v: 55 },      // Afternoon slump
    { t: 9, v: 80 },      // Peak 2
    { t: 15, v: 40 },     // Melatonin window start
    { t: 22, v: 15 },     // Deep sleep trough
    { t: 24, v: 70 },     // Next wake up
  ]

  let lowerAnchor = anchors[0]
  let upperAnchor = anchors[anchors.length - 1]

  for (let i = 0; i < anchors.length - 1; i++) {
    if (hoursSinceWake >= anchors[i].t && hoursSinceWake <= anchors[i + 1].t) {
      lowerAnchor = anchors[i]
      upperAnchor = anchors[i + 1]
      break
    }
  }

  // Cosine interpolation between the two anchors
  const range = upperAnchor.t - lowerAnchor.t
  const progress = (hoursSinceWake - lowerAnchor.t) / (range === 0 ? 1 : range)
  const angle = progress * Math.PI
  const factor = (1 - Math.cos(angle)) * 0.5 // 0 to 1 smooth
  
  const rawScore = lowerAnchor.v + factor * (upperAnchor.v - lowerAnchor.v)
  
  // Apply sleep debt penalty
  const penalty = Math.min(sleepDebt * 5, 30)
  
  // Final curve
  return Math.max(0, Math.min(100, rawScore - penalty))
}

/**
 * Energy score labels
 */
export function getEnergyLabel(score: number): string {
  if (score >= 80) return "Peak Focus"
  if (score >= 65) return "In the Zone"
  if (score >= 50) return "Moderate Energy"
  if (score >= 35) return "Afternoon Dip"
  if (score >= 20) return "Wind Down"
  return "Recharge Time"
}

/**
 * Melatonin window
 */
export function getMelatoninWindow(wakeTime: Date): { start: Date; end: Date } {
  const start = addHours(wakeTime, 15)
  const end = addHours(start, 2)
  return { start, end }
}
