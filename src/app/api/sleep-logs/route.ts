import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subDays, startOfDay } from 'date-fns'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch last 14 days
  const fourteenDaysAgo = startOfDay(subDays(new Date(), 14)).toISOString()

  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', fourteenDaysAgo)
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 200 })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { date, bedtime, wake_time, actual_sleep, sleep_debt_contribution, notes, is_nap } = body

  // upsert basically allows duplicate dates to be overwritten if they exist
  // We use ON CONFLICT (user_id, date, is_nap) by supplying it via an RPC or since table has UNIQUE it will fail standard insertion
  // so we should use upsert
  const { data, error } = await supabase
    .from('sleep_logs')
    .upsert({
      user_id: user.id,
      date,
      bedtime,
      wake_time,
      actual_sleep,
      sleep_debt_contribution,
      notes,
      is_nap: is_nap || false
    }, { onConflict: 'user_id,date,is_nap' })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
