import { createClient } from '@supabase/supabase-js'

// Publishable keys are intended for browser clients. Never use a service-role key here.
const URL = import.meta.env.VITE_SUPABASE_URL
const API_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!URL || !API_KEY) {
  throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment before starting the app.')
}

export const supabase = createClient(URL, API_KEY)
