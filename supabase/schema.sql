-- Supabase Schema for Sleep Tracker App

-- 1. Profiles Table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  sleep_need float DEFAULT 8.0 CHECK (sleep_need >= 5.0 AND sleep_need <= 11.5),
  default_wake_time time DEFAULT '07:00:00',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 2. Settings Table
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  sleep_need float DEFAULT 8.0,
  default_bedtime time DEFAULT '23:00:00',
  default_wake_time time DEFAULT '07:00:00',
  timezone text DEFAULT 'UTC',
  onboarding_complete boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. Sleep Logs Table
CREATE TABLE sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  bedtime timestamp with time zone NOT NULL,
  wake_time timestamp with time zone NOT NULL,
  actual_sleep float NOT NULL,
  sleep_debt_contribution float NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_nap boolean DEFAULT false,
  UNIQUE(user_id, date, is_nap)
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Profiles
CREATE POLICY "Users can only access own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Settings
CREATE POLICY "Users can only access own settings" ON settings
  FOR ALL USING (auth.uid() = user_id);

-- Sleep Logs
CREATE POLICY "Users can only access own sleep logs" ON sleep_logs
  FOR ALL USING (auth.uid() = user_id);

-- 6. Trigger to create settings row automatically (Optional but recommended)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name');
  
  INSERT INTO public.settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users for handling new signups
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
