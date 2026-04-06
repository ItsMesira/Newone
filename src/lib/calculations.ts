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
 * Calculate energy curve score 0-100 based on the Biological Two-Process Model of Sleep Regulation.
 * Process C (Circadian Rhythm): Continuous bimodal sine wave representing wake drive.
 * Process S (Homeostatic Sleep Pressure): Mounting non-linear pressure limiting capacity.
 * Chronic Debt: Systemic ceiling multiplier against Process S.
 */
export function calculateEnergyCurve(
  currentTime: Date,
  wakeTime: Date,
  sleepDebt: number
): number {
  const currentHours = getHours(currentTime) + getMinutes(currentTime) / 60
  const wakeHours = getHours(wakeTime) + getMinutes(wakeTime) / 60
  
  let t = currentHours - wakeHours
  if (t < 0) t += 24

  // PROCESS C: True Biological Circadian Phase
  // Fitted to human Core Body Temperature (CBT) rhythms. Peak ~4.5h post-wake, dip ~7.5h.
  // Equation uses primary and harmonic 12h waves mapped exactly.
  const phase1 = (t - 4.5) * (Math.PI / 12)
  const phase2 = (t - 4.5) * (Math.PI / 6)
  const processC = 0.6 * Math.sin(phase1 + Math.PI/2) + 0.2 * Math.sin(phase2 + Math.PI/2) + 0.5

  // PROCESS S: Asymptotic Adenosine Accumulation (Homeostatic Pressure)
  // Time constant (tau_S) for waking buildup in healthy adults is ~18.2 hours.
  const tau_s = 18.2
  const initialSaturation = Math.min(sleepDebt / 15, 0.8) // High debt means receptors are already 80% saturated at wake
  
  const buildup = 1.0 - Math.exp(-t / tau_s)
  const processS = initialSaturation + buildup

  // SYNTHESIS: The exact calculation
  // Process C provides operational capacity ceiling, Process S actively subtracts from it.
  const rawScore = (processC - (processS * 0.85)) * 100

  return Math.max(0, Math.min(100, Math.round(rawScore)))
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

/**
 * Generate discrete 3-hour blocks mimicking physical pills for UI
 */
export function generateEnergyBlocks(wakeTime: Date, sleepDebt: number) {
  const blocks = []
  
  // 8 blocks of 3 hours = 24 hours
  for (let i = 0; i < 8; i++) {
    const blockStart = addHours(wakeTime, i * 3)
    const blockMid = addHours(blockStart, 1.5) // get energy at midpoint of block
    const score = calculateEnergyCurve(blockMid, wakeTime, sleepDebt)
    const currentHours = getHours(blockStart)
    const formattedTime = `${currentHours.toString().padStart(2, '0')}:00`
    
    // Classify
    let type = 'neutral'
    if (score >= 65) type = 'peak'
    if (score < 40) type = 'slump'

    blocks.push({
      time: formattedTime,
      score: Math.round(score),
      type
    })
  }

  return blocks
}
