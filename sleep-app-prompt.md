# Sleep Tracker App — Full Build Prompt
> Inspired by RISE app. Paste your style reference where marked.

---

## STYLE REFERENCE

**[INSERT YOUR STYLE REFERENCE / LINK HERE]**

---

## TECH STACK

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Chart.js
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security)
- **Deployment:** Vercel
- **Auth:** Supabase Auth — email/password + Google OAuth
- **Animation:** Framer Motion

---

## DATABASE SCHEMA (Supabase)

### Table: `profiles`
```sql
id           uuid      PK, references auth.users
name         text
sleep_need   float     default 8.0 (range 5.0–11.5)
default_wake_time time  e.g. "07:00"
created_at   timestamp
updated_at   timestamp
```

### Table: `sleep_logs`
```sql
id                    uuid  PK
user_id               uuid  FK → profiles.id
date                  date  -- the date of the night (e.g. 2024-04-05)
bedtime               timestamp with timezone
wake_time             timestamp with timezone
actual_sleep          float -- auto calculated in hours
sleep_debt_contribution float -- sleep_need - actual_sleep for that night
notes                 text  nullable
created_at            timestamp
updated_at            timestamp
UNIQUE(user_id, date)
```

### Table: `settings`
```sql
id                  uuid    PK
user_id             uuid    FK → profiles.id, UNIQUE
sleep_need          float   default 8.0
default_bedtime     time
default_wake_time   time
timezone            text    e.g. "Asia/Bangkok"
onboarding_complete boolean default false
created_at          timestamp
updated_at          timestamp
```

### Row Level Security
Enable RLS on all tables. Each user can only read/write their own rows.
```sql
CREATE POLICY "Users can only access own data"
ON sleep_logs FOR ALL
USING (auth.uid() = user_id);
```
Apply the same policy pattern to `profiles` and `settings`.

---

## ENV VARIABLES

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=https://yourapp.vercel.app
```

---

## PROJECT STRUCTURE

```
/app
  /auth
    /login/page.tsx
    /signup/page.tsx
    /callback/route.ts
  /dashboard/page.tsx
  /log/page.tsx
  /history/page.tsx
  /settings/page.tsx
  /onboarding/page.tsx
  layout.tsx
  page.tsx              ← redirects to /dashboard if logged in
/components
  /ui                   ← reusable: Button, Input, Card, Modal, Badge, Toast
  EnergyChart.tsx
  SleepDebtMeter.tsx
  EnergyScore.tsx
  MelatoninWindow.tsx
  HygieneReminders.tsx
  SleepLogForm.tsx
  HistoryTable.tsx
  Navbar.tsx
  OnboardingFlow.tsx
/lib
  supabase.ts           ← client + server Supabase clients
  calculations.ts       ← all sleep math as pure functions
  helpers.ts            ← time formatting, timezone utils
/types
  index.ts              ← all TypeScript interfaces
/hooks
  useSleepLogs.ts
  useProfile.ts
  useCalculations.ts
```

---

## AUTHENTICATION FLOW

- Sign up with email/password or Google OAuth via Supabase Auth
- On first login → redirect to `/onboarding`
- Onboarding collects: name, sleep need, default wake time, timezone
- Saves to `profiles` and `settings`, sets `onboarding_complete = true`
- After onboarding → redirect to `/dashboard`
- All non-auth routes are protected — redirect to `/auth/login` if no session
- Session managed via Supabase SSR cookies using `@supabase/ssr` package

---

## CALCULATIONS (`/lib/calculations.ts`)

All logic as pure TypeScript functions. Fully typed.

### actual_sleep
```ts
actualSleep = (wake_time - bedtime) in hours
// handle crossing midnight correctly (e.g. 11PM → 7AM = 8hrs, not -16hrs)
```

### sleep_debt — 14-day weighted rolling sum
```ts
// weight formula: weight = 1 - (daysAgo / 14)
// yesterday     = 1.0x
// 7 days ago    = 0.5x
// 14 days ago   = ~0.07x

sleepDebt = sum of ((sleepNeed - actualSleep[i]) * weight[i]) for last 14 nights
// clamp minimum to 0 — can't have negative debt
```

### energy_curve — cosine-interpolated sine wave
```ts
// Anchor points relative to wake_time:
peak1      = wakeTime + 2hrs    → value: 90
dip1       = wakeTime + 7hrs    → value: 55  // afternoon slump
peak2      = wakeTime + 9hrs    → value: 80
windDown   = melatoninOnset     → value: 40
dip2       = wakeTime - 2hrs    → value: 15  // sleep trough

// Interpolate smoothly between anchors using cosine interpolation
// Apply sleep debt penalty:
penalty = min(sleepDebt * 5, 30)
// Final curve = raw_curve - penalty, clamped 0–100
```

### melatonin_window
```ts
melatoninOnset = wakeTime + 15 hours
sleepWindow = {
  start: melatoninOnset,
  end:   melatoninOnset + 2hrs
}
```

### energy_score (current moment)
```ts
energyScore = energyCurve(currentTime) // 0–100

label =
  score >= 80 → "Peak Focus"
  score >= 65 → "In the Zone"
  score >= 50 → "Moderate Energy"
  score >= 35 → "Afternoon Dip"
  score >= 20 → "Wind Down"
  score <  20 → "Recharge Time"
```

### sleep hygiene reminders
```ts
// Array of { triggerTime, message, icon }
[
  { trigger: wakeTime + 0min,        msg: "Get sunlight within 30 mins of waking",           icon: "☀️" },
  { trigger: wakeTime + 90min,       msg: "Great time for deep focus work",                   icon: "🧠" },
  { trigger: wakeTime + 6hrs,        msg: "Caffeine cutoff in 1 hour",                        icon: "☕" },
  { trigger: wakeTime + 7hrs,        msg: "Last caffeine now — none after this",               icon: "🚫" },
  { trigger: melatoninOnset - 2hrs,  msg: "Start dimming your lights",                        icon: "💡" },
  { trigger: melatoninOnset - 1hr,   msg: "Put away screens soon",                            icon: "📵" },
  { trigger: melatoninOnset - 30min, msg: "Start your wind-down routine",                     icon: "🌙" },
  { trigger: melatoninOnset,         msg: "Your melatonin window opens — ideal bedtime now",  icon: "😴" },
]
// Show the next 3 upcoming reminders on the dashboard
```

---

## PAGES & COMPONENTS

### `/dashboard`
Main view. Shows all key metrics at a glance:
- Large **energy score** (0–100) with label and color
- **Energy curve chart** — full 24hr line chart, current time as vertical marker, peaks/dips labeled
- **Sleep debt meter** — bar or radial gauge
  - Green: 0–1hr | Yellow: 1–3hr | Red: 3hr+
  - Text: "You owe your body X.X hours"
- **Tonight's melatonin window** card (e.g. "Sleep between 10:30 PM – 12:30 AM")
- **Next 3 hygiene reminders** with countdown timers
- Quick **"Log Last Night"** button → opens modal or navigates to `/log`

### `/log`
Form to manually log a sleep entry:
- Date picker (defaults to last night)
- Bedtime picker (defaults to last night's melatonin window start)
- Wake time picker (defaults to `settings.default_wake_time`)
- Optional notes textarea
- On submit: calculate `actual_sleep` and `debt_contribution`, upsert to Supabase
- Validation:
  - wake_time must be after bedtime
  - actual_sleep must be between 2–14 hours
  - Duplicate date → prompt to overwrite

### `/history`
Last 14 days of sleep entries:
- Table or card list: date, bedtime, wake time, hours slept, vs sleep need (±), debt contribution
- Color coded: green (met need), yellow (slightly under), red (significantly under)
- Small bar chart of nightly sleep vs sleep need line
- Inline edit and delete per entry

### `/settings`
- Update name
- Update sleep need (slider, 5–11.5hrs, 0.5 step)
- Update default wake time
- Update timezone (searchable dropdown)
- Danger zone: delete account + all data (confirm dialog)

### `/onboarding`
Multi-step flow (3 steps):
1. Welcome screen + name input
2. Sleep need slider with helper text: _"Most people need 7–9 hours. Adjust based on how you feel after a truly restful night."_
3. Default wake time picker + timezone selector
- Save all to Supabase on finish → redirect to `/dashboard`

---

## API ROUTES (`/app/api/`)

```
POST   /api/sleep-logs        ← create new log
PUT    /api/sleep-logs/[id]   ← update existing log
DELETE /api/sleep-logs/[id]   ← delete log
GET    /api/sleep-logs        ← fetch last 14 days for current user
PUT    /api/settings          ← update user settings
GET    /api/settings          ← get user settings
```

- All routes use Supabase **server client**
- Validate session on every request — return 401 if unauthenticated
- Return proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Return JSON with consistent shape: `{ data, error }`

---

## DATA FETCHING STRATEGY

- **React Server Components** for initial page load (SSR from Supabase)
- **SWR or React Query** for client-side revalidation after mutations
- Energy score and reminders update every **60 seconds** via `setInterval` on the client
- Energy curve chart re-renders smoothly when new sleep log is added
- Show **loading skeletons** for all async states
- Show **empty states** when no logs exist yet — prompt user to log first night

---

## GENERAL REQUIREMENTS

- Fully **mobile responsive** — dashboard must look great on phone screens
- All times displayed in user's saved **timezone** (use `date-fns-tz` or `luxon`)
- **Midnight crossing** handled correctly everywhere
- **Error boundaries** on all pages
- **Toast notifications** for all success/error states (use `sonner` or `react-hot-toast`)
- Charts use **Chart.js** via npm
- Single source of truth: all sleep math lives in `/lib/calculations.ts` only

---

## ANIMATIONS & MOTION

Use **Framer Motion** throughout. Animations should feel smooth and intentional — noticeable but never distracting.

### Page Transitions
- Every route change: **fade + slide up**
```ts
initial:    { opacity: 0, y: 24 }
animate:    { opacity: 1, y: 0 }
exit:       { opacity: 0, y: -16 }
transition: { duration: 0.35, ease: "easeOut" }
```
- Stagger child elements on page load — each card/section appears **80ms** after the previous

### Dashboard — Energy Score
- On load: count up from 0 → final score over **1.2s** with easeOut
- Score color transitions smoothly (green → yellow → red) via CSS interpolation
- Subtle **breathing pulse** on score circle: scale 1.0 → 1.03 → 1.0, loops every 3s

### Dashboard — Energy Curve Chart
- Line **draws itself** left to right on load (`Chart.js animation duration: 1200`)
- Current time vertical line slides in from the left to its position
- On new data, curve **morphs smoothly** — no hard re-render

### Dashboard — Sleep Debt Meter
- Bar fills from 0 → actual value over **1s** with spring easing on load
- Color transition (green → yellow → red) animates as value changes
- If debt ≥ 3hrs: bar does a subtle **shake animation** once on load

### Dashboard — Melatonin Window Card
- Entrance: fade in + scale 0.95 → 1.0
- Moon icon **pulses softly** when within 2 hours of window

### Dashboard — Hygiene Reminders
- Cards stagger in with **100ms gap** each
- When a reminder becomes active: **flash highlight** + slides to top of list
- Countdown numbers flip with a **slot machine roll** effect

### Forms & Inputs
- Log form: **bottom sheet on mobile**, centered modal on desktop
- Fields stagger in on open
- Successful submit: **checkmark SVG draws itself** → modal closes with scale-down + fade
- Validation error: fields do a quick **horizontal shake**

### Sliders
- Thumb has **spring bounce** on drag release
- Value label scales up while dragging, returns on release

### Navigation
- Active nav indicator **slides horizontally** between items (not a hard swap)
- Navbar fades in from top on first load

### Onboarding
- Steps transition with **horizontal slide** (forward = slide left, back = slide right)
- Progress bar fills **smoothly** between steps
- Final step completion: **confetti burst** for 1.5s before redirecting to dashboard

### History Page
- Rows **cascade in** with 50ms stagger on load
- Row hover: lifts slightly (`translateY(-2px)` + box-shadow increase)
- Delete: row **collapses vertically** + fades before DOM removal
- Edit: row **expands inline** with smooth height animation

### Global Animation Rules
- All animations respect `prefers-reduced-motion` — skip or simplify if enabled
- Never block interactivity — animations run parallel to usability
- Prefer **spring physics** for anything physical (sliders, modals, cards)
- Default spring config: `{ stiffness: 300, damping: 28 }`
- No animation exceeds **1.5 seconds**
