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
    
    // Default to the user's base sleep need if they forgot to log to avoid inflating debt artificially
    const actualSleep = log ? log.actual_sleep : sleepNeed
    
    // Sleep debt per night contribution
    const debtContribution = sleepNeed - actualSleep
    
    totalDebt += debtContribution * weight
  }

  // Can't have negative debt (you can't "bank" sleep essentially)
  return Math.max(0, totalDebt)
}

/**
 * Calculate energy curve score 0-100 based on the Biological Two-Process Model of Sleep Regulation.
 * Process C (Circadian Rhythm): Continuous bimodal sine wave approximation of Human Core Body Temperature.
 * Process S (Homeostatic Sleep Pressure): Mounting non-linear pressure (Adenosine accumulation).
 */
export function calculateEnergyCurve(
  currentTime: Date,
  wakeTime: Date,
  sleepDebt: number,
  napsTotalHours: number = 0
): number {
  const currentHours = getHours(currentTime) + getMinutes(currentTime) / 60
  const wakeHours = getHours(wakeTime) + getMinutes(wakeTime) / 60
  
  let t = currentHours - wakeHours
  if (t < 0) t += 24 // hours since waking

  // PROCESS C: Biological Circadian Phase (Core Body Temperature 5-Harmonic Fourier Model)
  // Base phase offset assuming wake is ~7AM and minimum temperature is ~4:30AM.
  // We model C(t) standardized between 0 and 1.
  const phase = (t - 4.5) * (Math.PI / 12);
  const processC = 
    0.97 * Math.sin(phase + Math.PI/2) + 
    0.22 * Math.sin(2 * phase + Math.PI/2) +
    0.11 * Math.sin(3 * phase + Math.PI/2) +
    0.05 * Math.sin(4 * phase + Math.PI/2) +
    0.02 * Math.sin(5 * phase + Math.PI/2);
  
  // Normalize C to [0, 1] bounds approximately
  const normalizedC = Math.max(0, Math.min(1, (processC + 1.2) / 2.4));

  // PROCESS S: Asymptotic Adenosine Accumulation (Homeostatic Pressure)
  // S(t) = 1 - (1 - S_0) * exp(-t / tau_i)
  // tau_i = 18.2h for wake accumulation.
  const tau_i = 18.2;
  
  // Baseline initial saturation due to un-recovered sleep debt (Chronic limit)
  // A debt of 8 hours loosely equals a 30% baseline saturation.
  const S_0 = Math.min(0.8, (sleepDebt / 8) * 0.3);
  
  // Exponential accumulation during wakefulness
  let processS = 1 - (1 - S_0) * Math.exp(-t / tau_i);
  
  // Nap relief: Adenosine clears during sleep. Every hour of nap clears roughly 10% pressure
  if (napsTotalHours > 0) {
     const napClearance = Math.min(0.5, napsTotalHours * 0.15)
     processS = Math.max(0, processS - napClearance)
  }

  // SYNTHESIS: The precise integration
  // Alertness A = C - S. We scale this to a 0-100 representation.
  // Peak theoretical is when C is max (1) and S is min (~0) -> A = 1
  const alertness = normalizedC - (processS * 0.85); // 0.85 multiplier gives S the proper weight vs C
  
  // Scale to 0-100% UI score (Baseline neutral is 50%)
  const rawScore = (alertness * 100) + 20; // +20 shift to fit realistic score feeling (nobody starts at 0% unless dead)

  return Math.max(0, Math.min(100, Math.round(rawScore)));
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
